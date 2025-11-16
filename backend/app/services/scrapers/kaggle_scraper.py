"""
Kaggle Scraper - Real data science competitions from Kaggle
Uses Kaggle's public API
"""

from typing import List, Dict, Any
from datetime import datetime
import structlog

from .base_scraper import BaseScraper

logger = structlog.get_logger()


class KaggleScraper(BaseScraper):
    """Scrape competitions from Kaggle"""
    
    def __init__(self):
        super().__init__()
        self.api_url = "https://www.kaggle.com/api/v1/competitions/list"
    
    def get_source_name(self) -> str:
        return "kaggle"
    
    async def scrape(self) -> List[Dict[str, Any]]:
        """
        Scrape active competitions from Kaggle's public API
        """
        logger.info("Starting Kaggle scraping")
        
        opportunities = []
        
        try:
            # Fetch active competitions
            response = await self._fetch_with_retry(
                self.api_url,
                params={
                    'sortBy': 'recentlyCreated',
                    'category': 'all'
                }
            )
            
            if not response:
                logger.warning("Failed to fetch Kaggle competitions")
                return []
            
            competitions = response.json()
            
            for comp in competitions[:20]:  # Limit to 20 most recent
                try:
                    opp = self._parse_competition(comp)
                    if opp:
                        opportunities.append(opp)
                except Exception as e:
                    logger.error("Failed to parse Kaggle competition", error=str(e))
                    continue
        
        except Exception as e:
            logger.error("Kaggle scraping failed", error=str(e))
        
        logger.info("Kaggle scraping complete", count=len(opportunities))
        return opportunities
    
    def _parse_competition(self, comp: Dict) -> Dict[str, Any]:
        """Parse a Kaggle competition into our opportunity format"""
        
        # Extract basic info
        title = self._safe_get(comp, 'title', default='Untitled Competition')
        org = self._safe_get(comp, 'organizationName', default='Kaggle')
        url = f"https://www.kaggle.com/c/{self._safe_get(comp, 'ref', default='')}"
        
        # Parse prize
        reward = self._safe_get(comp, 'reward', default='')
        amount = self._parse_reward(reward)
        
        # Parse deadline
        deadline_str = self._safe_get(comp, 'deadline')
        deadline = deadline_str if deadline_str else None
        urgency = self._calculate_urgency(deadline)
        
        # Extract categories/tags
        tags = self._safe_get(comp, 'tags', default=[])
        if isinstance(tags, list):
            tags = [tag.get('name', '') for tag in tags if isinstance(tag, dict)]
        else:
            tags = ['Data Science', 'Machine Learning']
        
        # Determine difficulty
        tier = self._safe_get(comp, 'tierName', default='')
        difficulty = self._map_tier_to_difficulty(tier)
        
        return {
            'type': 'competition',
            'name': title,
            'organization': org,
            'amount': amount,
            'amount_display': reward,
            'deadline': deadline,
            'deadline_type': 'fixed' if deadline else 'ongoing',
            'url': url,
            'source': 'kaggle',
            'urgency': urgency,
            'tags': ['Data Science', 'ML'] + tags,
            'eligibility': {
                'students_only': False,
                'grade_levels': [],
                'majors': ['Computer Science', 'Data Science', 'Statistics', 'Mathematics'],
                'gpa_min': None,
                'citizenship': ['Any'],
                'geographic': ['Online']
            },
            'requirements': {
                'application_type': 'platform_submission',
                'estimated_time': '20-40 hours',
                'skills_needed': ['Python', 'Machine Learning', 'Data Analysis'] + tags,
                'team_allowed': True,
                'team_size_max': 5,
                'essay_required': False
            },
            'description': self._safe_get(comp, 'description', default=f"{title} - Kaggle competition"),
            'competition_level': difficulty,
            'discovered_at': datetime.utcnow().isoformat()
        }
    
    def _parse_reward(self, reward_str: str) -> int:
        """Extract numeric amount from reward string"""
        if not reward_str:
            return 0
        
        # Remove currency symbols and commas
        import re
        numbers = re.findall(r'[\d,]+', reward_str)
        if not numbers:
            return 0
        
        try:
            # Get first number (usually total prize)
            amount_str = numbers[0].replace(',', '')
            return int(amount_str)
        except (ValueError, IndexError):
            return 0
    
    def _calculate_urgency(self, deadline: str) -> str:
        """Calculate urgency based on deadline"""
        if not deadline:
            return 'future'
        
        try:
            deadline_date = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
            days_until = (deadline_date - datetime.now(deadline_date.tzinfo)).days
            
            if days_until < 2:
                return 'immediate'
            elif days_until < 7:
                return 'this_week'
            elif days_until < 30:
                return 'this_month'
            else:
                return 'future'
        except Exception:
            return 'future'
    
    def _map_tier_to_difficulty(self, tier: str) -> str:
        """Map Kaggle tier to our difficulty levels"""
        tier_lower = tier.lower() if tier else ''
        
        if 'playground' in tier_lower or 'getting started' in tier_lower:
            return 'Low'
        elif 'research' in tier_lower or 'featured' in tier_lower:
            return 'High'
        else:
            return 'Medium'
