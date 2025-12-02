"""
Opportunity Matching Service
Combines scraping, AI enrichment, and matching logic for all opportunity types
"""
import uuid
from typing import List, Optional, Dict, Any
import structlog
from datetime import datetime

from app.models import (
    Scholarship,
    UserProfile,
    DiscoveryJobResponse
)
from app.services.scraper_service import scraper_service
from app.services.ai_service import ai_service
from app.database import db

logger = structlog.get_logger()


class OpportunityMatchingService:
    """Orchestrates multi-opportunity discovery and matching"""
    
    async def start_discovery_job(
        self,
        user_id: str,
        user_profile: UserProfile
    ) -> DiscoveryJobResponse:
        """
        Starts discovery process. Returns immediate results if cached,
        or creates a job and returns 'processing' status.
        """
        job_id = str(uuid.uuid4())
        
        try:
            # Step 1: Check cache (Fast path)
            # In a real scenario, we might want to check if the cache is fresh enough
            cached_opportunities = await db.get_all_scholarships()
            
            if cached_opportunities:
                matched = self._filter_and_rank(cached_opportunities, user_profile)
                if matched:
                    scholarship_ids = [s.id for s in matched]
                    await db.save_user_matches(user_id, scholarship_ids)
                    
                    logger.info("Returning cached opportunities", count=len(matched))
                    
                    return DiscoveryJobResponse(
                        status="completed",
                        immediate_results=matched[:30],
                        job_id=job_id,
                        estimated_completion=0,
                        total_found=len(matched)
                    )
            
            # Step 2: Start fresh discovery (Slow path)
            await db.create_discovery_job(user_id, job_id)
            
            return DiscoveryJobResponse(
                status="processing",
                immediate_results=[],
                job_id=job_id,
                estimated_completion=15,
                total_found=0
            )
            
        except Exception as e:
            logger.error("Failed to start discovery job", error=str(e))
            raise

    async def run_background_discovery(
        self,
        job_id: str,
        user_id: str,
        user_profile: UserProfile
    ):
        """
        Background task for scraping and matching
        """
        try:
            logger.info("Starting background discovery", job_id=job_id)
            
            # Step 3: Scrape ALL opportunity types
            raw_opportunities = await scraper_service.discover_all_opportunities(
                user_profile.model_dump()
            )
            
            logger.info("Scraping complete", count=len(raw_opportunities))
            
            # Step 4: Convert to Scholarship objects
            opportunities = []
            for opp_data in raw_opportunities:
                try:
                    scholarship = self._convert_to_scholarship(opp_data, user_profile)
                    if scholarship:
                        opportunities.append(scholarship)
                except Exception as e:
                    logger.error("Failed to convert opportunity", error=str(e))
            
            # Step 5: Filter and rank
            matched_opportunities = self._filter_and_rank(opportunities, user_profile)
            
            # Step 6: Store in database
            for opp in matched_opportunities:
                await db.save_scholarship(opp)
            
            scholarship_ids = [s.id for s in matched_opportunities]
            await db.save_user_matches(user_id, scholarship_ids)
            
            # Update job status
            await db.update_job_status(
                job_id=job_id,
                status="completed",
                scholarships_found=len(matched_opportunities)
            )
            
            logger.info("Background discovery complete", total=len(matched_opportunities))
            
        except Exception as e:
            logger.error("Background discovery failed", error=str(e), job_id=job_id)
            await db.update_job_status(job_id, "failed", 0)
    
    def _convert_to_scholarship(self, opp_data: Dict[str, Any], user_profile: UserProfile) -> Optional[Scholarship]:
        """Convert raw opportunity to Scholarship model"""
        from app.services.opportunity_converter import convert_to_scholarship
        return convert_to_scholarship(opp_data, user_profile)
    
    def calculate_match_score(self, opportunity: Scholarship, profile: UserProfile) -> float:
        """
        Weighted scoring algorithm (0-100)
        """
        score = 0
        weights = {
            'eligibility': 30,  # Must meet basic requirements
            'interests': 25,    # Alignment with user interests
            'urgency': 20,      # Time-sensitive needs
            'value': 15,        # Financial impact
            'effort': 10        # Time to complete vs availability
        }
        
        # 1. ELIGIBILITY SCORE (30 points) - HARD REQUIREMENTS
        eligibility_score = self._score_eligibility(opportunity, profile)
        if eligibility_score < 0.5:  # Filter out if doesn't meet 50% of requirements
            return 0
        score += eligibility_score * weights['eligibility']
        
        # 2. INTERESTS ALIGNMENT (25 points)
        interest_score = self._score_interests(opportunity, profile)
        score += interest_score * weights['interests']
        
        # 3. URGENCY MATCH (20 points)
        urgency_score = self._score_urgency(opportunity, profile)
        score += urgency_score * weights['urgency']
        
        # 4. VALUE SCORE (15 points)
        value_score = self._score_value(opportunity, profile)
        score += value_score * weights['value']
        
        # 5. EFFORT FEASIBILITY (10 points)
        effort_score = self._score_effort(opportunity, profile)
        score += effort_score * weights['effort']
        
        return round(score, 2)
    
    def _score_eligibility(self, opp: Scholarship, profile: UserProfile) -> float:
        """Check if user meets basic requirements"""
        score = 1.0
        
        # GPA requirement
        if opp.eligibility.gpa_min and profile.gpa:
            if profile.gpa < opp.eligibility.gpa_min:
                score *= 0.3  # Severe penalty but not disqualifying
        
        # Grade level
        if opp.eligibility.grades_eligible:
            if profile.academic_status not in opp.eligibility.grades_eligible:
                return 0  # Hard disqualification
        
        # Major alignment
        if opp.eligibility.majors and profile.major:
            if not any(major.lower() in profile.major.lower() for major in opp.eligibility.majors):
                score *= 0.6
        
        # Location
        # Assuming profile has state/country fields, currently not in UserProfile model but used in logic
        # if opp.eligibility.states and profile.state:
        #     if profile.state not in opp.eligibility.states:
        #         score *= 0.7
        
        # Citizenship
        # if opp.eligibility.citizenship and profile.citizenship:
        #     if profile.citizenship != opp.eligibility.citizenship:
        #         return 0
        
        return score
    
    def _score_interests(self, opp: Scholarship, profile: UserProfile) -> float:
        """Measure alignment between opportunity tags and user interests"""
        if not profile.interests or not opp.tags:
            return 0.5  # Neutral if no data
        
        user_interests = set([i.lower() for i in profile.interests])
        opp_tags = set([t.lower() for t in opp.tags])
        
        # Jaccard similarity
        intersection = len(user_interests & opp_tags)
        union = len(user_interests | opp_tags)
        
        if union == 0:
            return 0.5
        
        similarity = intersection / union
        
        # Bonus for exact major match
        if profile.major and profile.major.lower() in [t.lower() for t in opp.tags]:
            similarity += 0.3
        
        return min(similarity, 1.0)
    
    def _score_urgency(self, opp: Scholarship, profile: UserProfile) -> float:
        """Match opportunity urgency with user's timeline"""
        try:
            deadline_date = datetime.fromisoformat(opp.deadline.replace('Z', '+00:00'))
            days_until_deadline = (deadline_date.replace(tzinfo=None) - datetime.now()).days
        except ValueError:
            return 0.5 # Default if date parsing fails

        # User needs urgent funding (Assuming motivation field exists or inferred)
        # For now, generic logic:
        
        # Default: prefer not-too-urgent, not-too-far
        if 7 <= days_until_deadline <= 60:
            return 1.0
        elif days_until_deadline < 7 and days_until_deadline >= 0:
            return 0.8 # Urgent but doable
        elif days_until_deadline < 0:
            return 0.0 # Expired
        else:
            return 0.5 # Far out
    
    def _score_value(self, opp: Scholarship, profile: UserProfile) -> float:
        """Score based on financial value vs user need"""
        if not profile.financial_need:
            return 0.5
        
        if profile.financial_need == 0:
             return 0.5

        value_ratio = min(opp.amount / profile.financial_need, 1.0)
        
        # Prefer opportunities that cover significant portion of need
        if value_ratio >= 0.8:
            return 1.0
        elif value_ratio >= 0.5:
            return 0.8
        elif value_ratio >= 0.2:
            return 0.6
        else:
            return 0.4
    
    def _score_effort(self, opp: Scholarship, profile: UserProfile) -> float:
        """Match opportunity time requirement with user availability"""
        effort_hours = self._estimate_effort(opp)
        
        # Simplified logic since time_commitment might not be in profile model yet
        if effort_hours <= 5:
            return 1.0
        elif effort_hours <= 10:
            return 0.8
        else:
            return 0.5
    
    def _estimate_effort(self, opp: Scholarship) -> int:
        """Estimate hours needed to complete application"""
        hours = 2  # Base application time
        
        if opp.requirements.essay:
            hours += len(opp.requirements.essay_prompts) * 3  # 3 hours per essay
        
        if opp.requirements.recommendation_letters > 0:
            hours += opp.requirements.recommendation_letters * 1  # 1 hour per request
        
        if opp.requirements.transcript:
            hours += 0.5
        
        if opp.requirements.resume:
            hours += 1
        
        return hours

    def _filter_and_rank(
        self,
        opportunities: List[Scholarship],
        user_profile: UserProfile
    ) -> List[Scholarship]:
        """
        Filter opportunities based on eligibility and rank by match score
        """
        eligible = []
        
        for opp in opportunities:
            # Calculate score
            opp.match_score = self.calculate_match_score(opp, user_profile)
            
            # Determine tier
            if opp.match_score >= 85:
                opp.match_tier = "Excellent"
            elif opp.match_score >= 70:
                opp.match_tier = "Good"
            elif opp.match_score >= 50:
                opp.match_tier = "Fair"
            else:
                opp.match_tier = "Poor"
            
            # Basic eligibility checks (already partly handled in score, but hard filter here)
            if opp.match_score > 0:
                eligible.append(opp)
        
        # Sort by match score
        return sorted(eligible, key=lambda x: x.match_score, reverse=True)
    
    async def get_job_status(self, job_id: str) -> Optional[DiscoveryJobResponse]:
        """Get discovery job progress"""
        job_data = await db.get_discovery_job(job_id)
        
        if not job_data:
            return None
        
        return DiscoveryJobResponse(
            status=job_data['status'],
            progress=job_data.get('progress', 100.0),
            total_found=job_data['scholarships_found']
        )


# Global matching service instance
matching_service = OpportunityMatchingService()
