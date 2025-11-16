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
    
    async def discover_and_match(
        self,
        user_id: str,
        user_profile: UserProfile
    ) -> DiscoveryJobResponse:
        """
        Main discovery workflow for ALL opportunity types
        """
        job_id = str(uuid.uuid4())
        
        try:
            # Step 1: Get cached opportunities
            cached_opportunities = await db.get_all_scholarships()
            
            if cached_opportunities:
                matched = self._filter_and_rank(cached_opportunities, user_profile)
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
            
            # Step 2: Start fresh discovery
            await db.create_discovery_job(user_id, job_id)
            
            # Step 3: Scrape ALL opportunity types
            logger.info("Starting multi-opportunity scraping")
            raw_opportunities = await scraper_service.discover_all_opportunities(
                user_profile.model_dump()
            )
            
            logger.info("Scraping complete", count=len(raw_opportunities))
            
            # Step 4: Convert to Scholarship objects (unified model)
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
            
            logger.info("Discovery complete", total=len(matched_opportunities))
            
            return DiscoveryJobResponse(
                status="completed",
                immediate_results=matched_opportunities[:30],
                job_id=job_id,
                estimated_completion=0,
                total_found=len(matched_opportunities)
            )
            
        except Exception as e:
            logger.error("Discovery failed", error=str(e))
            await db.update_job_status(job_id, "failed", 0)
            raise
    
    def _convert_to_scholarship(self, opp_data: Dict[str, Any], user_profile: UserProfile) -> Optional[Scholarship]:
        """Convert raw opportunity to Scholarship model"""
        from app.services.opportunity_converter import convert_to_scholarship
        return convert_to_scholarship(opp_data, user_profile)
    
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
            # Basic eligibility checks
            if opp.eligibility.gpa_min:
                if not user_profile.gpa or user_profile.gpa < opp.eligibility.gpa_min:
                    continue
            
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
