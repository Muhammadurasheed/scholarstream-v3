"""
Pydantic models for ScholarStream API
Data validation and serialization schemas
"""
from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field, validator


# Enums and Type Literals
DeadlineType = Literal["rolling", "fixed"]
MatchTier = Literal["Excellent", "Good", "Fair", "Poor"]
PriorityLevel = Literal["URGENT", "HIGH", "MEDIUM", "LOW"]
CompetitionLevel = Literal["Low", "Medium", "High"]
SourceType = Literal["scraped", "ai_discovered", "curated"]
DiscoveryStatus = Literal["idle", "processing", "completed", "failed"]


# User Profile Models
class UserProfile(BaseModel):
    """User profile data from onboarding"""
    name: str
    academic_status: str
    school: Optional[str] = None
    year: Optional[str] = None
    gpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    major: Optional[str] = None
    graduation_year: Optional[str] = None
    background: List[str] = Field(default_factory=list)
    financial_need: Optional[float] = Field(None, ge=0)
    interests: List[str] = Field(default_factory=list)
    
    @validator('gpa')
    def validate_gpa(cls, v):
        if v is not None and (v < 0 or v > 4.0):
            raise ValueError('GPA must be between 0.0 and 4.0')
        return v


# Scholarship Models
class ScholarshipEligibility(BaseModel):
    """Eligibility criteria for a scholarship"""
    gpa_min: Optional[float] = None
    grades_eligible: List[str] = Field(default_factory=list)
    majors: Optional[List[str]] = None
    gender: Optional[str] = None
    citizenship: Optional[str] = None
    backgrounds: List[str] = Field(default_factory=list)
    states: Optional[List[str]] = None


class ScholarshipRequirements(BaseModel):
    """Application requirements for a scholarship"""
    essay: bool = False
    essay_prompts: List[str] = Field(default_factory=list)
    recommendation_letters: int = Field(default=0, ge=0)
    transcript: bool = False
    resume: bool = False
    other: List[str] = Field(default_factory=list)


class Scholarship(BaseModel):
    """Complete scholarship data model"""
    id: str
    name: str
    organization: str
    logo_url: Optional[str] = None
    
    amount: float = Field(ge=0)
    amount_display: str
    deadline: str  # ISO format datetime string
    deadline_type: DeadlineType
    
    eligibility: ScholarshipEligibility
    requirements: ScholarshipRequirements
    
    match_score: float = Field(ge=0, le=100)
    match_tier: MatchTier
    priority_level: PriorityLevel
    
    tags: List[str] = Field(default_factory=list)
    description: str
    competition_level: CompetitionLevel
    estimated_time: str
    expected_value: float = Field(ge=0)
    
    source_url: str
    source_type: SourceType
    discovered_at: str  # ISO format datetime string
    last_verified: str  # ISO format datetime string


# API Request/Response Models
class DiscoverRequest(BaseModel):
    """Request body for scholarship discovery"""
    user_id: str = Field(..., min_length=1)
    profile: UserProfile


class DiscoveryJobResponse(BaseModel):
    """Response for discovery job status"""
    status: DiscoveryStatus
    immediate_results: Optional[List[Scholarship]] = None
    job_id: Optional[str] = None
    estimated_completion: Optional[int] = None  # seconds
    progress: Optional[float] = Field(None, ge=0, le=100)
    new_scholarships: Optional[List[Scholarship]] = None
    total_found: Optional[int] = None


class MatchedScholarshipsResponse(BaseModel):
    """Response for matched scholarships list"""
    scholarships: List[Scholarship]
    total_value: float
    last_updated: str  # ISO format datetime string


class SaveScholarshipRequest(BaseModel):
    """Request to save/unsave a scholarship"""
    user_id: str = Field(..., min_length=1)
    scholarship_id: str = Field(..., min_length=1)


class StartApplicationRequest(BaseModel):
    """Request to start an application"""
    user_id: str = Field(..., min_length=1)
    scholarship_id: str = Field(..., min_length=1)


class ErrorResponse(BaseModel):
    """Standard error response format"""
    error: str
    detail: Optional[str] = None
    status_code: int


# Internal Models for Processing
class ScrapedScholarship(BaseModel):
    """Raw scholarship data from scraping"""
    name: str
    organization: str
    amount: float
    deadline: str
    description: str
    source_url: str
    eligibility_raw: Optional[str] = None
    requirements_raw: Optional[str] = None


class AIEnrichmentRequest(BaseModel):
    """Request for AI to enrich scholarship data"""
    scholarship: ScrapedScholarship
    user_profile: UserProfile


class AIEnrichmentResponse(BaseModel):
    """AI-enriched scholarship data"""
    eligibility: ScholarshipEligibility
    requirements: ScholarshipRequirements
    tags: List[str]
    match_score: float
    match_tier: MatchTier
    priority_level: PriorityLevel
    competition_level: CompetitionLevel
    estimated_time: str
