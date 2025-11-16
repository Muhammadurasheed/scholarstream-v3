"""
Multi-Opportunity Discovery Service
Real-time scraping for scholarships, hackathons, bounties, competitions
Uses APIs and web scraping with AI enrichment
"""
import httpx
from bs4 import BeautifulSoup
from typing import List, Optional, Dict, Any
import structlog
from datetime import datetime, timedelta
import asyncio
import json
import random

from app.models import ScrapedScholarship
from app.config import settings
from app.services.scrapers.devpost_scraper import DevpostScraper
from app.services.scrapers.mlh_scraper import MLHScraper
from app.services.scrapers.gitcoin_scraper import GitcoinScraper
from app.services.scrapers.kaggle_scraper import KaggleScraper
from app.services.scrapers.scholarships_scraper import ScholarshipsScraper

logger = structlog.get_logger()


class OpportunityScraperService:
    """Web scraper for discovering scholarships"""
    
    def __init__(self):
        """Initialize scraper with HTTP client"""
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        )
        self.cache: dict = {}
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
        
        # Initialize all scrapers
        self.devpost_scraper = DevpostScraper()
        self.mlh_scraper = MLHScraper()
        self.gitcoin_scraper = GitcoinScraper()
        self.kaggle_scraper = KaggleScraper()
        self.scholarships_scraper = ScholarshipsScraper()
        
        logger.info("All scrapers initialized successfully")
    
    async def discover_all_opportunities(self, user_profile: dict) -> List[Dict[str, Any]]:
        """
        Main entry point - discovers ALL opportunity types
        Returns unified list of opportunities (scholarships, hackathons, bounties, etc.)
        """
        logger.info("Starting REAL multi-opportunity discovery with all scrapers")
        
        all_opportunities = []
        
        # Run ALL scrapers in parallel for maximum speed
        logger.info("Launching parallel scrapers: Devpost, MLH, Gitcoin, Kaggle, Scholarships")
        
        results = await asyncio.gather(
            self.devpost_scraper.scrape(),
            self.mlh_scraper.scrape(),
            self.gitcoin_scraper.scrape(),
            self.kaggle_scraper.scrape(),
            self.scholarships_scraper.scrape(),
            return_exceptions=True
        )
        
        # Aggregate results
        scraper_names = ['Devpost', 'MLH', 'Gitcoin', 'Kaggle', 'Scholarships']
        for idx, result in enumerate(results):
            if isinstance(result, list):
                all_opportunities.extend(result)
                logger.info(f"{scraper_names[idx]} scraper returned {len(result)} opportunities")
            else:
                logger.error(f"{scraper_names[idx]} scraper failed", error=str(result))
        
        # Deduplicate
        unique_opportunities = self._deduplicate(all_opportunities)
        
        # Count by type
        type_counts = {
            'scholarship': len([o for o in unique_opportunities if o.get('type') == 'scholarship']),
            'hackathon': len([o for o in unique_opportunities if o.get('type') == 'hackathon']),
            'bounty': len([o for o in unique_opportunities if o.get('type') == 'bounty']),
            'competition': len([o for o in unique_opportunities if o.get('type') == 'competition']),
        }
        
        logger.info("REAL discovery complete", 
                   total=len(unique_opportunities),
                   **type_counts)
        
        return unique_opportunities
    
    def _deduplicate(self, opportunities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate opportunities based on name and organization"""
        seen = set()
        unique = []
        
        for opp in opportunities:
            key = f"{opp.get('name', '')}_{opp.get('organization', '')}"
            if key not in seen:
                seen.add(key)
                unique.append(opp)
        
        return unique
    
    def _deduplicate(self, opportunities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicates based on name and organization"""
        seen = set()
        unique = []
        
        for opp in opportunities:
            key = f"{opp.get('name', '').lower()}_{opp.get('organization', '').lower()}"
            if key not in seen:
                seen.add(key)
                unique.append(opp)
        
        return unique
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Global scraper service instance
scraper_service = OpportunityScraperService()
