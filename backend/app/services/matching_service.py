"""
Scholarship Matching Service
Combines scraping, AI enrichment, and matching logic
"""
import uuid
from typing import List, Optional
import structlog
from datetime import datetime

from app.models import (
    Scholarship,
    UserProfile,
    ScrapedScholarship,
    DiscoveryJobResponse
)
from app.services.scraper_service import scraper_service
from app.services.ai_service import ai_service
from app.database import db

logger = structlog.get_logger()


class ScholarshipMatchingService:
    """Orchestrates scholarship discovery and matching"""
    
    async def discover_and_match(
        self,
        user_id: str,
        user_profile: UserProfile
    ) -> DiscoveryJobResponse:
        """
        Main discovery workflow:
        1. Return immediate results from cache
        2. Start background job for new discovery
        3. Scrape from multiple sources
        4. Enrich with AI
        5. Calculate match scores
        6. Store results
        """
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        try:
            # Step 1: Get immediate results from cache
            cached_scholarships = await db.get_all_scholarships()
            
            # If we have cached data, return immediately
            if cached_scholarships:
                # Calculate match scores for cached scholarships
                matched_scholarships = self._filter_and_rank(cached_scholarships, user_profile)
                
                # Save user matches
                scholarship_ids = [s.id for s in matched_scholarships]
                await db.save_user_matches(user_id, scholarship_ids)
                
                logger.info("Returning cached scholarships", count=len(matched_scholarships))
                
                return DiscoveryJobResponse(
                    status="completed",
                    immediate_results=matched_scholarships[:30],  # Return top 30
                    job_id=job_id,
                    estimated_completion=0,
                    total_found=len(matched_scholarships)
                )
            
            # Step 2: No cache, start fresh discovery
            await db.create_discovery_job(user_id, job_id)
            
            # Step 3: Scrape scholarships
            logger.info("Starting scholarship scraping")
            scraped_scholarships = await scraper_service.discover_scholarships(
                user_profile.model_dump()
            )
            
            logger.info("Scraping complete", count=len(scraped_scholarships))
            
            # Step 4: Enrich with AI
            logger.info("Starting AI enrichment")
            enriched_scholarships = []
            
            for i, scraped in enumerate(scraped_scholarships):
                try:
                    # AI enrichment
                    enriched_data = await ai_service.enrich_scholarship(scraped, user_profile)
                    
                    if enriched_data:
                        # Build complete scholarship object
                        scholarship = Scholarship(
                            id=str(uuid.uuid4()),
                            name=scraped.name,
                            organization=scraped.organization,
                            logo_url=None,
                            amount=scraped.amount,
                            amount_display=f"${int(scraped.amount):,}",
                            deadline=scraped.deadline,
                            deadline_type="fixed",
                            eligibility=enriched_data.eligibility,
                            requirements=enriched_data.requirements,
                            match_score=enriched_data.match_score,
                            match_tier=enriched_data.match_tier,
                            priority_level=enriched_data.priority_level,
                            tags=enriched_data.tags,
                            description=scraped.description,
                            competition_level=enriched_data.competition_level,
                            estimated_time=enriched_data.estimated_time,
                            expected_value=scraped.amount / float(enriched_data.estimated_time.split()[0]),
                            source_url=scraped.source_url,
                            source_type="scraped",
                            discovered_at=datetime.now().isoformat(),
                            last_verified=datetime.now().isoformat()
                        )
                        
                        enriched_scholarships.append(scholarship)
                        
                        # Save to database
                        await db.save_scholarship(scholarship)
                    
                    # Update progress
                    progress = (i + 1) / len(scraped_scholarships) * 100
                    await db.update_discovery_job(
                        job_id,
                        "processing",
                        progress,
                        len(enriched_scholarships)
                    )
                    
                except Exception as e:
                    logger.error("Failed to enrich scholarship", error=str(e), scholarship=scraped.name)
                    continue
            
            logger.info("AI enrichment complete", count=len(enriched_scholarships))
            
            # Step 5: Rank by match score
            ranked_scholarships = sorted(
                enriched_scholarships,
                key=lambda x: x.match_score,
                reverse=True
            )
            
            # Step 6: Save user matches
            scholarship_ids = [s.id for s in ranked_scholarships]
            await db.save_user_matches(user_id, scholarship_ids)
            
            # Update job status
            await db.update_discovery_job(
                job_id,
                "completed",
                100.0,
                len(ranked_scholarships)
            )
            
            return DiscoveryJobResponse(
                status="completed",
                immediate_results=ranked_scholarships[:30],
                job_id=job_id,
                total_found=len(ranked_scholarships)
            )
            
        except Exception as e:
            logger.error("Discovery failed", error=str(e), user_id=user_id)
            await db.update_discovery_job(job_id, "failed", 0, 0)
            raise
    
    def _filter_and_rank(
        self,
        scholarships: List[Scholarship],
        user_profile: UserProfile
    ) -> List[Scholarship]:
        """
        Filter scholarships based on eligibility
        Rank by match score
        """
        eligible = []
        
        for scholarship in scholarships:
            # Basic eligibility checks
            if scholarship.eligibility.gpa_min:
                if not user_profile.gpa or user_profile.gpa < scholarship.eligibility.gpa_min:
                    continue
            
            # Add more filtering logic here
            eligible.append(scholarship)
        
        # Sort by match score
        return sorted(eligible, key=lambda x: x.match_score, reverse=True)
    
    async def get_job_status(self, job_id: str) -> Optional[DiscoveryJobResponse]:
        """Get discovery job progress"""
        job_data = await db.get_discovery_job(job_id)
        
        if not job_data:
            return None
        
        return DiscoveryJobResponse(
            status=job_data['status'],
            progress=job_data['progress'],
            total_found=job_data['scholarships_found']
        )


# Global matching service instance
matching_service = ScholarshipMatchingService()
