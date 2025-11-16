"""
Opportunity Converter Utility
Converts raw opportunity data into unified Scholarship model
"""
from typing import Dict, Any, Optional
import uuid
from app.models import Scholarship, UserProfile, ScholarshipEligibility, ScholarshipRequirements


def convert_to_scholarship(opp_data: Dict[str, Any], user_profile: UserProfile) -> Optional[Scholarship]:
    """
    Convert any opportunity type to Scholarship model
    This creates a unified interface for all opportunities
    """
    try:
        # Calculate match score based on opportunity type and user profile
        match_score = calculate_match_score(opp_data, user_profile)
        match_tier = determine_match_tier(match_score)
        priority_level = determine_priority(opp_data, match_score)
        
        # Build eligibility object
        eligibility_raw = opp_data.get('eligibility', {})
        eligibility = ScholarshipEligibility(
            students_only=eligibility_raw.get('students_only', True),
            grade_levels=eligibility_raw.get('grade_levels', []),
            majors=eligibility_raw.get('majors', []),
            gpa_min=eligibility_raw.get('gpa_min'),
            citizenship_requirements=eligibility_raw.get('citizenship', []),
            age_restrictions=eligibility_raw.get('age_restrictions'),
            geographic_restrictions=eligibility_raw.get('geographic', []),
            other_requirements=eligibility_raw.get('requirements', '')
        )
        
        # Build requirements object
        requirements_raw = opp_data.get('requirements', {})
        requirements = ScholarshipRequirements(
            essays=int(requirements_raw.get('essay_required', False)),
            recommendations=0,
            transcript=False,
            portfolio=False,
            interview=False,
            test_scores=False,
            other_documents=[],
            application_link=opp_data.get('url'),
            estimated_time=requirements_raw.get('estimated_time', 'Unknown')
        )
        
        # Create unified scholarship object
        scholarship = Scholarship(
            id=str(uuid.uuid4()),
            name=opp_data['name'],
            organization=opp_data.get('organization', 'Unknown'),
            logo_url=None,
            amount=opp_data.get('amount', 0),
            amount_display=opp_data.get('amount_display', '$0'),
            deadline=opp_data.get('deadline'),
            deadline_type=opp_data.get('deadline_type', 'fixed'),
            eligibility=eligibility,
            requirements=requirements,
            match_score=match_score,
            match_tier=match_tier,
            priority_level=priority_level,
            tags=opp_data.get('tags', []),
            description=opp_data.get('description', ''),
            application_link=opp_data.get('url'),
            notification_enabled=match_score >= 70,
            competition_level=opp_data.get('competition_level', 'Medium'),
            source_type=map_type_to_source(opp_data.get('type', 'scholarship')),
            discovered_date=None
        )
        
        return scholarship
        
    except Exception as e:
        print(f"Failed to convert opportunity: {e}")
        return None


def calculate_match_score(opp_data: Dict[str, Any], user_profile: UserProfile) -> int:
    """
    Calculate match score based on opportunity type and user profile
    """
    score = 60  # Base score
    
    eligibility = opp_data.get('eligibility', {})
    opp_type = opp_data.get('type', 'scholarship')
    
    # Check GPA match
    gpa_min = eligibility.get('gpa_min')
    if gpa_min and user_profile.gpa:
        if user_profile.gpa >= gpa_min:
            score += 15
        elif user_profile.gpa >= (gpa_min - 0.2):
            score += 5
    
    # Check major match
    required_majors = eligibility.get('majors', [])
    if required_majors and user_profile.major:
        if any(major.lower() in user_profile.major.lower() for major in required_majors):
            score += 20
        elif 'STEM' in required_majors and any(stem in user_profile.major for stem in ['Computer', 'Engineering', 'Science', 'Math']):
            score += 15
    elif not required_majors:  # Open to all majors
        score += 10
    
    # For hackathons/bounties, check skills match
    if opp_type in ['hackathon', 'bounty']:
        required_skills = opp_data.get('requirements', {}).get('skills_needed', [])
        user_skills = user_profile.interests  # Assuming interests include technical skills
        if required_skills and user_skills:
            matching_skills = [s for s in required_skills if any(us.lower() in s.lower() for us in user_skills)]
            if matching_skills:
                score += 20
    
    # Urgency bonus for immediate opportunities
    urgency = opp_data.get('urgency', 'future')
    if urgency == 'immediate':
        score += 10
    elif urgency == 'this_week':
        score += 5
    
    # Cap at 99
    return min(score, 99)


def determine_match_tier(score: int) -> str:
    """Determine match tier from score"""
    if score >= 85:
        return "excellent"
    elif score >= 70:
        return "great"
    elif score >= 55:
        return "good"
    else:
        return "potential"


def determine_priority(opp_data: Dict[str, Any], match_score: int) -> str:
    """Determine priority level"""
    urgency = opp_data.get('urgency', 'future')
    amount = opp_data.get('amount', 0)
    
    if urgency == 'immediate' and match_score >= 70:
        return "urgent"
    elif urgency in ['this_week', 'immediate'] or amount >= 10000:
        return "high"
    elif amount >= 5000 or match_score >= 80:
        return "medium"
    else:
        return "low"


def map_type_to_source(opp_type: str) -> str:
    """Map opportunity type to source_type enum"""
    type_map = {
        'scholarship': 'platform',
        'hackathon': 'devpost',
        'bounty': 'gitcoin',
        'competition': 'platform',
        'grant': 'government'
    }
    return type_map.get(opp_type, 'platform')
