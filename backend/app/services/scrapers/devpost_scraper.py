"""
Devpost Scraper - Real hackathon data from Devpost
Uses their public listings (no API key required)
"""

from typing import List, Dict, Any
from datetime import datetime
from bs4 import BeautifulSoup
import structlog
import re

from .base_scraper import BaseScraper

logger = structlog.get_logger()


class DevpostScraper(BaseScraper):
    """Scrape hackathons from Devpost"""
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://devpost.com"
        self.hackathons_url = f"{self.base_url}/hackathons"
    
    def get_source_name(self) -> str:
        return "devpost"
    
    async def scrape(self) -> List[Dict[str, Any]]:
        """
        Scrape active and upcoming hackathons from Devpost
        """
        logger.info("Starting Devpost scraping")
        
        opportunities = []
        
        # Scrape multiple status pages
        statuses = ['open', 'upcoming']
        
        for status in statuses:
            try:
                page_opps = await self._scrape_status_page(status)
                opportunities.extend(page_opps)
            except Exception as e:
                logger.error(f"Failed to scrape {status} page", error=str(e))
        
        logger.info("Devpost scraping complete", count=len(opportunities))
        return opportunities
    
    async def _scrape_status_page(self, status: str) -> List[Dict[str, Any]]:
        """Scrape a specific status page (open, upcoming, etc.)"""
        
        url = f"{self.hackathons_url}?status[]={status}&order=submission_period"
        
        response = await self._fetch_with_retry(url)
        if not response:
            logger.warning(f"Failed to fetch {status} hackathons page")
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        hackathon_items = soup.find_all('div', class_='challenge-listing')
        
        opportunities = []
        
        for item in hackathon_items[:30]:  # Limit to 30 per status
            try:
                opp = self._parse_hackathon_item(item, status)
                if opp:
                    opportunities.append(opp)
            except Exception as e:
                logger.error("Failed to parse hackathon item", error=str(e))
                continue
        
        return opportunities
    
    def _parse_hackathon_item(self, item, status: str) -> Dict[str, Any]:
        """Parse a single hackathon listing"""
        
        # Extract title and URL
        title_elem = item.find('h3', class_='challenge-listing-title') or item.find('a', class_='challenge-title')
        if not title_elem:
            return None
        
        title = title_elem.get_text(strip=True)
        link_elem = title_elem.find('a') if title_elem.name != 'a' else title_elem
        url = self.base_url + link_elem.get('href') if link_elem else None
        
        # Extract organization
        org_elem = item.find('div', class_='challenge-listing-host') or item.find('span', class_='host-name')
        organization = org_elem.get_text(strip=True) if org_elem else "Unknown"
        
        # Extract prize amount
        prize_elem = item.find('div', class_='challenge-prize') or item.find('span', class_='prize-amount')
        amount, amount_display = self._parse_prize(prize_elem.get_text(strip=True) if prize_elem else "")
        
        # Extract deadline
        deadline_elem = item.find('div', class_='challenge-submission-period') or item.find('time', class_='submission-deadline')
        deadline, deadline_type, urgency = self._parse_deadline(
            deadline_elem.get_text(strip=True) if deadline_elem else "",
            status
        )
        
        # Extract themes/tags
        themes_elem = item.find_all('span', class_='challenge-listing-theme') or item.find_all('span', class_='tag')
        themes = [t.get_text(strip=True) for t in themes_elem] if themes_elem else []
        
        # Check if online/remote
        location_elem = item.find('div', class_='challenge-listing-location')
        is_online = 'online' in location_elem.get_text().lower() if location_elem else True
        
        return {
            'type': 'hackathon',
            'name': title,
            'organization': organization,
            'amount': amount,
            'amount_display': amount_display,
            'deadline': deadline,
            'deadline_type': deadline_type,
            'url': url,
            'source': 'devpost',
            'urgency': urgency,
            'tags': themes + (['Online'] if is_online else []),
            'eligibility': {
                'students_only': False,  # Most Devpost hackathons are open to all
                'grade_levels': [],
                'majors': [],
                'gpa_min': None,
                'citizenship': ['Any'],
                'geographic': ['Online'] if is_online else []
            },
            'requirements': {
                'application_type': 'platform_submission',
                'estimated_time': '48 hours',  # Typical hackathon duration
                'skills_needed': themes,
                'team_allowed': True,
                'team_size_max': 5,
                'essay_required': False
            },
            'description': f"{title} hackathon hosted by {organization}",
            'competition_level': 'Medium',
            'discovered_at': datetime.utcnow().isoformat()
        }
    
    def _parse_prize(self, prize_text: str) -> tuple[int, str]:
        """Extract numeric prize amount from text"""
        if not prize_text:
            return 0, "$0"
        
        # Look for dollar amounts
        amounts = re.findall(r'\$[\d,]+', prize_text)
        if not amounts:
            return 0, prize_text
        
        # Get the highest amount (usually total prize pool)
        max_amount = 0
        for amount_str in amounts:
            try:
                amount = int(amount_str.replace('$', '').replace(',', ''))
                if amount > max_amount:
                    max_amount = amount
            except ValueError:
                continue
        
        return max_amount, prize_text
    
    def _parse_deadline(self, deadline_text: str, status: str) -> tuple[str, str, str]:
        """Parse deadline text into ISO date, type, and urgency"""
        
        if not deadline_text or status == 'upcoming':
            return None, 'fixed', 'future'
        
        deadline_text_lower = deadline_text.lower()
        
        # Check for urgency keywords
        if 'today' in deadline_text_lower or 'hours' in deadline_text_lower:
            urgency = 'immediate'
        elif 'tomorrow' in deadline_text_lower or 'day' in deadline_text_lower:
            urgency = 'this_week'
        elif 'week' in deadline_text_lower:
            urgency = 'this_week'
        elif 'month' in deadline_text_lower:
            urgency = 'this_month'
        else:
            urgency = 'future'
        
        # Try to extract date
        # This is simplified - in production, use dateparser library
        try:
            # Look for common date patterns
            date_match = re.search(r'(\w+\s+\d+,\s+\d{4})', deadline_text)
            if date_match:
                date_str = date_match.group(1)
                # Parse with datetime (simplified)
                return date_str, 'fixed', urgency
        except Exception:
            pass
        
        return None, 'ongoing', urgency
