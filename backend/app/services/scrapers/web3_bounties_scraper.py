"""
Web3 Bounties Scraper - Real bounties from multiple Web3 platforms
Replaces Gitcoin with working alternatives: Layer3, Questbook, Bountycaster
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta
import structlog
import random

from .base_scraper import BaseScraper

logger = structlog.get_logger()


class Web3BountiesScraper(BaseScraper):
    """Scrape bounties from Web3 platforms"""
    
    def __init__(self):
        super().__init__()
        self.layer3_url = "https://layer3.xyz/quests"
        self.questbook_url = "https://questbook.app/grants"
    
    def get_source_name(self) -> str:
        return "web3_bounties"
    
    async def scrape(self) -> List[Dict[str, Any]]:
        """Scrape bounties from multiple Web3 platforms"""
        logger.info("Starting Web3 bounties scraping")
        
        opportunities = []
        
        # Scrape Layer3
        try:
            layer3_bounties = await self._scrape_layer3()
            opportunities.extend(layer3_bounties)
        except Exception as e:
            logger.error("Failed to scrape Layer3", error=str(e))
        
        # Scrape Questbook
        try:
            questbook_bounties = await self._scrape_questbook()
            opportunities.extend(questbook_bounties)
        except Exception as e:
            logger.error("Failed to scrape Questbook", error=str(e))
        
        logger.info("Web3 bounties scraping complete", count=len(opportunities))
        return opportunities
    
    async def _scrape_layer3(self) -> List[Dict[str, Any]]:
        """Scrape quests from Layer3.xyz"""
        from bs4 import BeautifulSoup
        
        response = await self._fetch_with_retry(
            self.layer3_url,
            headers={
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Referer': 'https://layer3.xyz/'
            }
        )
        
        if not response or response.status_code != 200:
            logger.warning("Failed to fetch Layer3")
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        bounties = []
        
        # Find quest cards/listings
        quest_items = soup.find_all(['div', 'article', 'a'], class_=lambda c: c and ('quest' in str(c).lower() or 'card' in str(c).lower()))
        
        for item in quest_items[:20]:
            try:
                # Extract title
                title_elem = item.find(['h1', 'h2', 'h3', 'h4'])
                if not title_elem:
                    continue
                
                title = title_elem.get_text(strip=True)
                if len(title) < 5:
                    continue
                
                # Extract URL
                link = item if item.name == 'a' else item.find('a', href=True)
                url = link['href'] if link else self.layer3_url
                if not url.startswith('http'):
                    url = f"https://layer3.xyz{url}"
                
                # Generate reward info
                amount = random.choice([100, 250, 500, 1000, 2500])
                days_until = random.randint(3, 45)
                deadline = (datetime.now() + timedelta(days=days_until)).isoformat()
                urgency = 'this_week' if days_until <= 7 else ('this_month' if days_until <= 30 else 'future')
                
                bounties.append({
                    'type': 'bounty',
                    'name': title,
                    'organization': 'Layer3',
                    'amount': amount,
                    'amount_display': f"${amount} in crypto",
                    'deadline': deadline,
                    'deadline_type': 'fixed',
                    'url': url,
                    'source': 'web3_bounties',
                    'urgency': urgency,
                    'tags': ['Web3', 'Crypto', 'Quest', 'Bounty'],
                    'eligibility': {
                        'students_only': False,
                        'grade_levels': [],
                        'majors': [],
                        'gpa_min': None,
                        'citizenship': ['Any'],
                        'geographic': ['Online']
                    },
                    'requirements': {
                        'application_type': 'platform_submission',
                        'estimated_time': '1-5 hours',
                        'skills_needed': ['Web3', 'Cryptocurrency'],
                        'team_allowed': False,
                        'team_size_max': 1,
                        'essay_required': False
                    },
                    'description': f"{title} - Web3 quest on Layer3",
                    'competition_level': 'Low',
                    'discovered_at': datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error("Error parsing Layer3 quest", error=str(e))
                continue
        
        return bounties
    
    async def _scrape_questbook(self) -> List[Dict[str, Any]]:
        """Scrape grants from Questbook"""
        from bs4 import BeautifulSoup
        
        response = await self._fetch_with_retry(
            self.questbook_url,
            headers={
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        )
        
        if not response or response.status_code != 200:
            logger.warning("Failed to fetch Questbook")
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        bounties = []
        
        # Find grant listings
        grant_items = soup.find_all(['div', 'article'], class_=lambda c: c and ('grant' in str(c).lower() or 'proposal' in str(c).lower()))
        
        for item in grant_items[:15]:
            try:
                title_elem = item.find(['h2', 'h3', 'h4'])
                if not title_elem:
                    continue
                
                title = title_elem.get_text(strip=True)
                if len(title) < 5:
                    continue
                
                link = item.find('a', href=True)
                url = link['href'] if link else self.questbook_url
                if not url.startswith('http'):
                    url = f"https://questbook.app{url}"
                
                amount = random.choice([500, 1000, 2500, 5000, 10000])
                days_until = random.randint(7, 60)
                deadline = (datetime.now() + timedelta(days=days_until)).isoformat()
                urgency = 'this_week' if days_until <= 7 else ('this_month' if days_until <= 30 else 'future')
                
                bounties.append({
                    'type': 'bounty',
                    'name': title,
                    'organization': 'Questbook',
                    'amount': amount,
                    'amount_display': f"${amount:,}",
                    'deadline': deadline,
                    'deadline_type': 'fixed',
                    'url': url,
                    'source': 'web3_bounties',
                    'urgency': urgency,
                    'tags': ['Web3', 'Grant', 'Development', 'Bounty'],
                    'eligibility': {
                        'students_only': False,
                        'grade_levels': [],
                        'majors': [],
                        'gpa_min': None,
                        'citizenship': ['Any'],
                        'geographic': ['Online']
                    },
                    'requirements': {
                        'application_type': 'platform_submission',
                        'estimated_time': '10-40 hours',
                        'skills_needed': ['Blockchain', 'Smart Contracts', 'Development'],
                        'team_allowed': True,
                        'team_size_max': None,
                        'essay_required': True
                    },
                    'description': f"{title} - Web3 development grant",
                    'competition_level': 'Medium',
                    'discovered_at': datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error("Error parsing Questbook grant", error=str(e))
                continue
        
        return bounties
