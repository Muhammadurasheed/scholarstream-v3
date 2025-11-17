"""
Opportunity Converter Utility
Converts raw opportunity data into unified Scholarship model (aligned with backend models)
"""
from typing import Dict, Any, Optional, List
import uuid
from datetime import datetime

from app.models import (
    Scholarship,
    UserProfile,
    ScholarshipEligibility,
    ScholarshipRequirements,
)


def _to_str(value: Optional[Any], default: str = "") -> str:
    """Safely convert to string with default"""
    if value is None:
        return default
    return str(value)


def _now_iso() -> str:
    """Return current UTC time in ISO format"""
    return datetime.utcnow().isoformat() + "Z"


def convert_to_scholarship(opp_data: Dict[str, Any], user_profile: UserProfile) -> Optional[Scholarship]:
    """
    Convert any opportunity-type dict to the strict Scholarship model.
    - Normalizes enum casing/values to match app.models
    - Fills required fields with safe defaults when missing
    """
    try:
        # 1) Scoring and categorization
        match_score = calculate_match_score(opp_data, user_profile)
        match_tier = determine_match_tier(match_score)  # -> Excellent/Good/Fair/Poor
        priority_level = determine_priority(opp_data, match_score)  # -> URGENT/HIGH/MEDIUM/LOW

        # 2) Eligibility mapping (align to ScholarshipEligibility schema)
        eligibility_raw: Dict[str, Any] = opp_data.get("eligibility", {}) or {}
        grades_eligible: List[str] = eligibility_raw.get("grades_eligible") or eligibility_raw.get("grade_levels") or []
        majors_val = eligibility_raw.get("majors")
        majors: Optional[List[str]] = majors_val if majors_val else None
        citizenship_val = eligibility_raw.get("citizenship")
        if isinstance(citizenship_val, list):
            citizenship = "/".join([str(c) for c in citizenship_val])
        else:
            citizenship = citizenship_val

        eligibility = ScholarshipEligibility(
            gpa_min=eligibility_raw.get("gpa_min"),
            grades_eligible=grades_eligible,
            majors=majors,
            gender=eligibility_raw.get("gender"),
            citizenship=citizenship,
            backgrounds=eligibility_raw.get("backgrounds", []) or [],
            states=eligibility_raw.get("states"),
        )

        # 3) Requirements mapping (align to ScholarshipRequirements schema)
        requirements_raw: Dict[str, Any] = opp_data.get("requirements", {}) or {}
        essay_bool = bool(requirements_raw.get("essay") or requirements_raw.get("essay_required"))
        recommendation_letters = int(requirements_raw.get("recommendation_letters", 0) or 0)
        other_list = requirements_raw.get("other") or requirements_raw.get("other_documents") or []
        if isinstance(other_list, str):
            other_list = [other_list]

        requirements = ScholarshipRequirements(
            essay=essay_bool,
            essay_prompts=requirements_raw.get("essay_prompts", []) or [],
            recommendation_letters=recommendation_letters,
            transcript=bool(requirements_raw.get("transcript", False)),
            resume=bool(requirements_raw.get("resume", False)),
            other=other_list,
        )

        # 4) Core fields and safe fallbacks
        amount = float(opp_data.get("amount") or 0)
        amount_display = _to_str(opp_data.get("amount_display")) or (f"${amount:,.0f}" if amount else "$0")

        raw_deadline = opp_data.get("deadline")
        deadline = _to_str(raw_deadline, "")
        raw_deadline_type = (opp_data.get("deadline_type") or "").lower()
        deadline_type = "rolling" if (not deadline or raw_deadline_type == "rolling") else "fixed"

        description = _to_str(opp_data.get("description"), "")
        tags = opp_data.get("tags") or []
        if isinstance(tags, str):
            tags = [tags]

        competition_level_raw = _to_str(opp_data.get("competition_level"), "Medium").capitalize()
        competition_level = competition_level_raw if competition_level_raw in ["Low", "Medium", "High"] else "Medium"

        # Estimated time: simple heuristic
        estimated_time = "2-4 hours" if (essay_bool or recommendation_letters > 0) else "30-60 minutes"
        expected_value = float(round(amount * (match_score / 100.0), 2))

        source_url = _to_str(opp_data.get("source_url") or opp_data.get("url"), "")
        source_type = map_type_to_source(opp_data.get("type", "scholarship"))
        if _to_str(opp_data.get("discovered_by")).lower() == "ai":
            source_type = "ai_discovered"
        if bool(opp_data.get("curated")):
            source_type = "curated"

        now_iso = _now_iso()

        scholarship = Scholarship(
            id=str(uuid.uuid4()),
            name=_to_str(opp_data.get("name"), "Untitled Opportunity"),
            organization=_to_str(opp_data.get("organization"), "Unknown"),
            logo_url=_to_str(opp_data.get("logo_url")) or None,
            amount=amount,
            amount_display=amount_display,
            deadline=deadline,
            deadline_type=deadline_type,  # "rolling" | "fixed"
            eligibility=eligibility,
            requirements=requirements,
            match_score=float(match_score),
            match_tier=match_tier,  # Proper enum labels
            priority_level=priority_level,  # Proper enum labels
            tags=tags,
            description=description,
            competition_level=competition_level,  # Low | Medium | High
            estimated_time=estimated_time,
            expected_value=expected_value,
            source_url=source_url,
            source_type=source_type,  # scraped | ai_discovered | curated
            discovered_at=now_iso,
            last_verified=now_iso,
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
    """Map score to backend enum: Excellent | Good | Fair | Poor"""
    if score >= 85:
        return "Excellent"
    elif score >= 70:
        return "Good"
    elif score >= 55:
        return "Fair"
    else:
        return "Poor"


def determine_priority(opp_data: Dict[str, Any], match_score: int) -> str:
    """Map to backend enum: URGENT | HIGH | MEDIUM | LOW"""
    urgency = (opp_data.get('urgency') or '').lower()
    amount = float(opp_data.get('amount') or 0)
    
    if urgency == 'immediate' and match_score >= 70:
        return "URGENT"
    elif urgency in ['this_week', 'immediate'] or amount >= 10000:
        return "HIGH"
    elif amount >= 5000 or match_score >= 80:
        return "MEDIUM"
    else:
        return "LOW"


def map_type_to_source(opp_type: str) -> str:
    """Backend SourceType enum allows: scraped | ai_discovered | curated.
    Scraper outputs are considered 'scraped' by default.
    """
    return "scraped"
