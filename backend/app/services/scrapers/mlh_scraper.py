"""
MLH (Major League Hacking) Scraper
Scrapes official MLH hackathon calendar
"""

from typing import List, Dict, Any
from datetime import datetime
from bs4 import BeautifulSoup
import structlog

from .base_scraper import BaseScraper

logger = structlog.get_logger()


class MLHScraper(BaseScraper):
    """Scrape hackathons from MLH"""
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://mlh.io"
        self.events_url = f"{self.base_url}/seasons/2025/events"
    
    def get_source_name(self) -> str:
        return "mlh"
    
    async def scrape(self) -> List[Dict[str, Any]]:
        """Scrape MLH hackathon calendar"""
        logger.info("Starting MLH scraping")
        
        opportunities = []
        
        try:
            response = await self._fetch_with_retry(self.events_url)
            if not response:
                logger.warning("Failed to fetch MLH events")
                return []
            
            soup = BeautifulSoup(response.text, 'html.parser')
            event_items = soup.find_all('div', class_='event')
            
            for item in event_items[:25]:  # Limit to 25 events
                try:
                    opp = self._parse_event(item)
                    if opp:
                        opportunities.append(opp)
                except Exception as e:
                    logger.error("Failed to parse MLH event", error=str(e))
                    continue
        
        except Exception as e:
            logger.error("MLH scraping failed", error=str(e))
        
        logger.info("MLH scraping complete", count=len(opportunities))
        return opportunities
    
    def _parse_event(self, item) -> Dict[str, Any]:
        """Parse a single MLH event"""
        
        # Extract title
        title_elem = item.find('h3', class_='event-name') or item.find('a', class_='event-link')
        if not title_elem:
            return None
        
        title = title_elem.get_text(strip=True)
        
        # Extract URL
        link = item.find('a', class_='event-link') or title_elem.find_parent('a')
        url = link.get('href') if link else None
        if url and not url.startswith('http'):
            url = self.base_url + url
        
        # Extract dates
        date_elem = item.find('p', class_='event-date')
        date_text = date_elem.get_text(strip=True) if date_elem else ""
        deadline, urgency = self._parse_date(date_text)
        
        # Extract location
        location_elem = item.find('p', class_='event-location')
        location = location_elem.get_text(strip=True) if location_elem else "Online"
        is_online = 'online' in location.lower() or 'virtual' in location.lower()
        
        # MLH hackathons typically have substantial prizes
        amount = 10000  # Average MLH hackathon prize pool
        
        return {
            'type': 'hackathon',
            'name': title,
            'organization': 'Major League Hacking',
            'amount': amount,
            'amount_display': f"${amount:,} in prizes",
            'deadline': deadline,
            'deadline_type': 'fixed',
            'url': url or self.events_url,
            'source': 'mlh',
            'urgency': urgency,
            'tags': ['MLH', 'Student Hackathon', 'Online' if is_online else 'In-Person'],
            'eligibility': {
                'students_only': True,
                'grade_levels': ['undergraduate', 'graduate'],
                'majors': [],
                'gpa_min': None,
                'citizenship': ['Any'],
                'geographic': ['Online'] if is_online else [location]
            },
            'requirements': {
                'application_type': 'external_form',
                'estimated_time': '24-48 hours',
                'skills_needed': ['Programming', 'Teamwork', 'Problem Solving'],
                'team_allowed': True,
                'team_size_max': 4,
                'essay_required': False
            },
            'description': f"{title} - Official MLH hackathon",
            'competition_level': 'Medium',
            'discovered_at': datetime.utcnow().isoformat()
        }
    
    def _parse_date(self, date_text: str) -> tuple[str, str]:
        """Parse date text and determine urgency"""
        if not date_text:
            return None, 'future'
        
        # Try to extract deadline info
        # This is simplified - in production, use dateparser
        date_text_lower = date_text.lower()
        
        if 'this week' in date_text_lower or 'upcoming' in date_text_lower:
            urgency = 'this_week'
        elif 'next month' in date_text_lower:
            urgency = 'this_month'
        else:
            urgency = 'future'
        
        return date_text, urgency
