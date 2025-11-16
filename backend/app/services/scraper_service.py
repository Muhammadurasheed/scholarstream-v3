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
        """
        Scrape Devpost for REAL hackathon data
        Devpost has a public-facing structure we can parse
        """
        try:
            logger.info("Fetching Devpost hackathons")
            
            url = "https://devpost.com/hackathons"
            headers = {
                'User-Agent': random.choice(self.user_agents),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
            
            response = await self.client.get(url, headers=headers, timeout=30)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            hackathons = []
            hackathon_cards = soup.find_all('div', class_='challenge-listing')[:20]  # Limit to 20
            
            for card in hackathon_cards:
                try:
                    name_elem = card.find('h2') or card.find('h3') or card.find('a', class_='challenge-link')
                    prize_elem = card.find(string=lambda text: text and '$' in text)
                    deadline_elem = card.find('time') or card.find('span', class_='deadline')
                    link_elem = card.find('a', href=True)
                    
                    if not name_elem:
                        continue
                    
                    name = name_elem.get_text(strip=True)
                    url = f"https://devpost.com{link_elem['href']}" if link_elem else None
                    
                    # Extract prize amount
                    amount = 0
                    if prize_elem:
                        prize_text = prize_elem.get_text()
                        # Parse amounts like "$10,000" or "$10K"
                        import re
                        amounts = re.findall(r'\$[\d,]+', prize_text)
                        if amounts:
                            amount = int(amounts[0].replace('$', '').replace(',', ''))
                    
                    # Parse deadline
                    deadline = None
                    if deadline_elem:
                        deadline_text = deadline_elem.get_text(strip=True)
                        # Try to parse relative dates or absolute
                        if 'day' in deadline_text.lower():
                            days = int(re.findall(r'\d+', deadline_text)[0]) if re.findall(r'\d+', deadline_text) else 30
                            deadline = (datetime.now() + timedelta(days=days)).isoformat()
                        else:
                            deadline = (datetime.now() + timedelta(days=30)).isoformat()
                    
                    hackathons.append({
                        'type': 'hackathon',
                        'name': name,
                        'organization': 'Devpost',
                        'amount': amount,
                        'amount_display': f"${amount:,}" if amount > 0 else "Prizes available",
                        'deadline': deadline,
                        'deadline_type': 'fixed',
                        'url': url,
                        'description': f"Hackathon on Devpost - {name}",
                        'source': 'devpost',
                        'urgency': 'this_month',
                        'requirements': {
                            'team_allowed': True,
                            'estimated_time': '48 hours'
                        },
                        'tags': ['hackathon', 'coding', 'online']
                    })
                    
                except Exception as e:
                    logger.error("Failed to parse hackathon card", error=str(e))
                    continue
            
            logger.info(f"Found {len(hackathons)} Devpost hackathons")
            return hackathons
            
        except Exception as e:
            logger.error("Devpost scraping failed", error=str(e))
            return []
    
    async def _scrape_gitcoin_bounties(self) -> List[Dict[str, Any]]:
        """
        Scrape Gitcoin for REAL bounty data
        """
        try:
            logger.info("Fetching Gitcoin bounties")
            
            # Gitcoin explorer page
            url = "https://gitcoin.co/explorer"
            headers = {'User-Agent': random.choice(self.user_agents)}
            
            response = await self.client.get(url, headers=headers, timeout=30)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            bounties = []
            bounty_cards = soup.find_all('div', class_='bounty-card')[:15]
            
            for card in bounty_cards:
                try:
                    title_elem = card.find('h5') or card.find('a', class_='bounty-title')
                    value_elem = card.find(string=lambda text: text and ('USD' in text or '$' in text))
                    link_elem = card.find('a', href=True)
                    
                    if not title_elem:
                        continue
                    
                    name = title_elem.get_text(strip=True)
                    url = f"https://gitcoin.co{link_elem['href']}" if link_elem else None
                    
                    # Extract amount
                    amount = 0
                    if value_elem:
                        import re
                        amounts = re.findall(r'[\d,]+', value_elem.get_text())
                        if amounts:
                            amount = int(amounts[0].replace(',', ''))
                    
                    bounties.append({
                        'type': 'bounty',
                        'name': name,
                        'organization': 'Gitcoin',
                        'amount': amount,
                        'amount_display': f"${amount:,} USD" if amount > 0 else "Value TBD",
                        'deadline': None,  # Most bounties are ongoing
                        'deadline_type': 'rolling',
                        'url': url,
                        'description': f"Open bounty: {name}",
                        'source': 'gitcoin',
                        'urgency': 'immediate',
                        'requirements': {
                            'skills_needed': ['Web3', 'Solidity', 'JavaScript'],
                            'estimated_time': '4-8 hours'
                        },
                        'tags': ['bounty', 'web3', 'crypto', 'open-source']
                    })
                    
                except Exception as e:
                    logger.error("Failed to parse bounty card", error=str(e))
                    continue
            
            logger.info(f"Found {len(bounties)} Gitcoin bounties")
            return bounties
            
        except Exception as e:
            logger.error("Gitcoin scraping failed", error=str(e))
            return []
    
    async def _scrape_scholarships_mock(self) -> List[Dict[str, Any]]:
        """
        Return enhanced mock scholarship data
        TODO: Replace with real scraping (Scholarships.com, FastWeb, etc.)
        """
        return self._get_mock_scholarships()
    
    def _get_mock_scholarships(self) -> List[Dict[str, Any]]:
        """
        Return mock scholarship data for development
        Replace with real scraping in production
        """
        return [
            {
                'type': 'scholarship',
                'name': "Gates Millennium Scholars Program",
                'organization': "Bill & Melinda Gates Foundation",
                'amount': 40000,
                'amount_display': "$40,000",
                'deadline': (datetime.now() + timedelta(days=45)).isoformat(),
                'deadline_type': 'fixed',
                'description': "Full scholarship for underrepresented minority students with significant financial need.",
                'url': "https://www.gmsp.org",
                'source': 'mock',
                'urgency': 'this_month',
                'eligibility': {
                    'students_only': True,
                    'grade_levels': ['undergraduate'],
                    'gpa_min': 3.3,
                    'citizenship': ['US'],
                    'requirements': "Pell Grant eligible, minimum 3.3 GPA, from minority background"
                },
                'requirements': {
                    'essay_required': True,
                    'estimated_time': '3 hours',
                    'application_type': 'external_form'
                },
                'tags': ['need-based', 'minority', 'undergraduate', 'full-ride']
            },
            {
                'type': 'scholarship',
                'name': "Dell Scholars Program",
                'organization': "Michael & Susan Dell Foundation",
                'amount': 20000,
                'amount_display': "$20,000",
                'deadline': (datetime.now() + timedelta(days=20)).isoformat(),
                'deadline_type': 'fixed',
                'description': "Scholarship for students with demonstrated need and adversity.",
                'url': "https://www.dellscholars.org",
                'source': 'mock',
                'urgency': 'this_week',
                'eligibility': {
                    'students_only': True,
                    'grade_levels': ['high_school'],
                    'gpa_min': 2.4,
                    'citizenship': ['US']
                },
                'requirements': {
                    'essay_required': True,
                    'estimated_time': '2 hours',
                    'application_type': 'external_form'
                },
                'tags': ['need-based', 'high-school', 'underrepresented']
            },
            {
                'type': 'scholarship',
                'name': "Coca-Cola Scholars Program",
                'organization': "The Coca-Cola Foundation",
                'amount': 20000,
                'amount_display': "$20,000",
                'deadline': (datetime.now() + timedelta(days=25)).isoformat(),
                'deadline_type': 'fixed',
                'description': "Merit-based scholarship for high school seniors.",
                'url': "https://www.coca-colascholarsfoundation.org",
                'source': 'mock',
                'urgency': 'this_month',
                'eligibility': {
                    'students_only': True,
                    'grade_levels': ['high_school'],
                    'gpa_min': 3.0,
                    'citizenship': ['US', 'Permanent Resident']
                },
                'requirements': {
                    'essay_required': True,
                    'estimated_time': '2.5 hours',
                    'application_type': 'external_form'
                },
                'tags': ['merit-based', 'high-school', 'leadership']
            },
            {
                'type': 'scholarship',
                'name': "SMART Scholarship",
                'organization': "Department of Defense",
                'amount': 50000,
                'amount_display': "$50,000",
                'deadline': (datetime.now() + timedelta(days=60)).isoformat(),
                'deadline_type': 'fixed',
                'description': "Full scholarship for STEM students with service commitment.",
                'url': "https://www.smartscholarship.org",
                'source': 'mock',
                'urgency': 'future',
                'eligibility': {
                    'students_only': True,
                    'grade_levels': ['undergraduate', 'graduate'],
                    'majors': ['STEM'],
                    'gpa_min': 3.0,
                    'citizenship': ['US']
                },
                'requirements': {
                    'essay_required': True,
                    'estimated_time': '4 hours',
                    'application_type': 'external_form'
                },
                'tags': ['stem', 'full-ride', 'service-commitment', 'government']
            },
            {
                'type': 'scholarship',
                'name': "Jack Kent Cooke Foundation",
                'organization': "Jack Kent Cooke Foundation",
                'amount': 55000,
                'amount_display': "$55,000",
                'deadline': (datetime.now() + timedelta(days=90)).isoformat(),
                'deadline_type': 'fixed',
                'description': "Scholarship for exceptional students with financial need.",
                'url': "https://www.jkcf.org",
                'source': 'mock',
                'urgency': 'future',
                'eligibility': {
                    'students_only': True,
                    'grade_levels': ['high_school'],
                    'requirements': 'Family income <$95k, top 10% of class'
                },
                'requirements': {
                    'essay_required': True,
                    'estimated_time': '5 hours',
                    'application_type': 'external_form'
                },
                'tags': ['need-based', 'merit-based', 'high-achieving']
            },
        ]
    
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
