"""
Google Gemini AI Service
Handles AI-powered scholarship enrichment and matching
"""
import google.generativeai as genai
from typing import Dict, List, Optional
import json
import asyncio
import structlog
from datetime import datetime, timedelta

from app.config import settings
from app.models import (
    ScrapedScholarship,
    UserProfile,
    ScholarshipEligibility,
    ScholarshipRequirements,
    AIEnrichmentResponse,
    MatchTier,
    PriorityLevel,
    CompetitionLevel
)

logger = structlog.get_logger()


class GeminiAIService:
    """Google Gemini AI integration for scholarship processing"""
    
    def __init__(self):
        """Initialize Gemini AI"""
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel(settings.gemini_model)
        self.cache: Dict[str, tuple] = {}  # Simple in-memory cache
        self.rate_limiter = self._init_rate_limiter()
    
    def _init_rate_limiter(self):
        """Initialize rate limiting tracking"""
        return {
            'count': 0,
            'window_start': datetime.now(),
            'limit': settings.gemini_rate_limit_per_hour
        }
    
    def _check_rate_limit(self) -> bool:
        """Check if we're within rate limits"""
        now = datetime.now()
        if (now - self.rate_limiter['window_start']) > timedelta(hours=1):
            # Reset window
            self.rate_limiter['count'] = 0
            self.rate_limiter['window_start'] = now
        
        if self.rate_limiter['count'] >= self.rate_limiter['limit']:
            logger.warning("Gemini rate limit exceeded")
            return False
        
        self.rate_limiter['count'] += 1
        return True
    
    async def enrich_scholarship(
        self,
        scholarship: ScrapedScholarship,
        user_profile: UserProfile
    ) -> Optional[AIEnrichmentResponse]:
        """
        Use AI to parse and enrich scholarship data
        Extract structured eligibility, requirements, and calculate match score
        """
        # Check cache first
        cache_key = f"{scholarship.source_url}_{user_profile.name}"
        if cache_key in self.cache:
            cached_data, cached_time = self.cache[cache_key]
            if (datetime.now() - cached_time) < timedelta(hours=settings.ai_enrichment_cache_ttl_hours):
                logger.info("Using cached AI enrichment", source=scholarship.source_url)
                return cached_data
        
        # Check rate limit
        if not self._check_rate_limit():
            logger.error("Gemini API rate limit exceeded")
            return None
        
        try:
            prompt = self._build_enrichment_prompt(scholarship, user_profile)
            response = self.model.generate_content(prompt)
            
            # Parse AI response
            enriched_data = self._parse_ai_response(response.text)
            
            # Cache the result
            self.cache[cache_key] = (enriched_data, datetime.now())
            
            logger.info("Scholarship enriched with AI", source=scholarship.source_url)
            return enriched_data
            
        except Exception as e:
            logger.error("AI enrichment failed", error=str(e), source=scholarship.source_url)
            return None
    
    def _build_enrichment_prompt(self, scholarship: ScrapedScholarship, user_profile: UserProfile) -> str:
        """Build prompt for AI to enrich scholarship data"""
        return f"""You are an expert scholarship analyst. Analyze this scholarship and provide structured data.

SCHOLARSHIP DATA:
Name: {scholarship.name}
Organization: {scholarship.organization}
Amount: ${scholarship.amount}
Deadline: {scholarship.deadline}
Description: {scholarship.description}
Eligibility (raw): {scholarship.eligibility_raw or 'Not specified'}
Requirements (raw): {scholarship.requirements_raw or 'Not specified'}

USER PROFILE:
Academic Status: {user_profile.academic_status}
School: {user_profile.school or 'Not specified'}
GPA: {user_profile.gpa or 'Not specified'}
Major: {user_profile.major or 'Not specified'}
Graduation Year: {user_profile.graduation_year or 'Not specified'}
Background: {', '.join(user_profile.background) if user_profile.background else 'Not specified'}
Financial Need: ${user_profile.financial_need or 'Not specified'}
Interests: {', '.join(user_profile.interests) if user_profile.interests else 'Not specified'}

TASK:
Provide a JSON response with the following structure (respond ONLY with valid JSON, no additional text):

{{
  "eligibility": {{
    "gpa_min": <float or null>,
    "grades_eligible": [<list of grade levels: "High School Senior", "Undergraduate", "Graduate", etc.>],
    "majors": [<list of eligible majors or null if any>],
    "gender": <string or null>,
    "citizenship": <string or null>,
    "backgrounds": [<list: "First-generation", "Minority", "LGBTQ+", "Low-income", "Veteran", etc.>],
    "states": [<list of state codes or null if nationwide>]
  }},
  "requirements": {{
    "essay": <true/false>,
    "essay_prompts": [<list of essay prompts if applicable>],
    "recommendation_letters": <integer count>,
    "transcript": <true/false>,
    "resume": <true/false>,
    "other": [<list of other requirements>]
  }},
  "tags": [<3-5 relevant tags like "STEM", "Need-Based", "Merit-Based", "Leadership", etc.>],
  "match_score": <0-100 integer representing how well this user matches this scholarship>,
  "match_tier": <"Excellent" (80-100), "Good" (60-79), "Fair" (40-59), or "Poor" (0-39)>,
  "priority_level": <"URGENT" if deadline <7 days, "HIGH" if high match, "MEDIUM" if moderate match, "LOW" otherwise>,
  "competition_level": <"Low", "Medium", or "High" based on requirements and award amount>,
  "estimated_time": <string like "2 hours", "4-6 hours", based on requirements complexity>
}}

Calculate match_score based on:
- GPA match (0-25 points)
- Major/field alignment (0-20 points)
- Background eligibility (0-25 points)
- Interest alignment (0-15 points)
- Financial need match (0-15 points)

Respond with ONLY the JSON object, no markdown formatting or additional text."""

    def _parse_ai_response(self, response_text: str) -> AIEnrichmentResponse:
        """Parse AI response into structured data"""
        try:
            # Remove markdown code blocks if present
            clean_text = response_text.strip()
            if clean_text.startswith('```json'):
                clean_text = clean_text[7:]
            if clean_text.startswith('```'):
                clean_text = clean_text[3:]
            if clean_text.endswith('```'):
                clean_text = clean_text[:-3]
            
            clean_text = clean_text.strip()
            
            # Parse JSON
            data = json.loads(clean_text)
            
            # Validate and create structured response
            return AIEnrichmentResponse(
                eligibility=ScholarshipEligibility(**data['eligibility']),
                requirements=ScholarshipRequirements(**data['requirements']),
                tags=data['tags'],
                match_score=float(data['match_score']),
                match_tier=data['match_tier'],
                priority_level=data['priority_level'],
                competition_level=data['competition_level'],
                estimated_time=data['estimated_time']
            )
            
        except Exception as e:
            logger.error("Failed to parse AI response", error=str(e), response=response_text[:200])
            # Return default data if parsing fails
            return AIEnrichmentResponse(
                eligibility=ScholarshipEligibility(),
                requirements=ScholarshipRequirements(),
                tags=[],
                match_score=50.0,
                match_tier="Fair",
                priority_level="MEDIUM",
                competition_level="Medium",
                estimated_time="2-3 hours"
            )
    
    async def batch_enrich_scholarships(
        self,
        scholarships: List[ScrapedScholarship],
        user_profile: UserProfile,
        batch_size: int = 5
    ) -> List[Optional[AIEnrichmentResponse]]:
        """
        Batch process multiple scholarships
        Process in batches to optimize API usage
        """
        results = []
        
        for i in range(0, len(scholarships), batch_size):
            batch = scholarships[i:i + batch_size]
            logger.info("Processing scholarship batch", batch_num=i//batch_size + 1)
            
            for scholarship in batch:
                enriched = await self.enrich_scholarship(scholarship, user_profile)
                results.append(enriched)
            
            # Brief pause between batches to respect rate limits
            if i + batch_size < len(scholarships):
                await asyncio.sleep(1)
        
        return results


# Global AI service instance
ai_service = GeminiAIService()
