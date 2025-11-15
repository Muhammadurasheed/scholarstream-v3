// Scholarship Type Definitions for ScholarStream

export type DeadlineType = 'rolling' | 'fixed';
export type MatchTier = 'Excellent' | 'Good' | 'Fair' | 'Poor';
export type PriorityLevel = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type CompetitionLevel = 'Low' | 'Medium' | 'High';
export type SourceType = 'scraped' | 'ai_discovered' | 'curated';

export interface ScholarshipEligibility {
  gpa_min: number | null;
  grades_eligible: string[];
  majors: string[] | null;
  gender: string | null;
  citizenship: string | null;
  backgrounds: string[];
  states: string[] | null;
}

export interface ScholarshipRequirements {
  essay: boolean;
  essay_prompts: string[];
  recommendation_letters: number;
  transcript: boolean;
  resume: boolean;
  other: string[];
}

export interface Scholarship {
  id: string;
  name: string;
  organization: string;
  logo_url: string | null;
  
  amount: number;
  amount_display: string;
  deadline: string;
  deadline_type: DeadlineType;
  
  eligibility: ScholarshipEligibility;
  requirements: ScholarshipRequirements;
  
  match_score: number;
  match_tier: MatchTier;
  priority_level: PriorityLevel;
  
  tags: string[];
  description: string;
  competition_level: CompetitionLevel;
  estimated_time: string;
  expected_value: number;
  
  source_url: string;
  source_type: SourceType;
  discovered_at: string;
  last_verified: string;
}

export interface DiscoveryJobResponse {
  status: 'processing' | 'completed' | 'failed';
  immediate_results?: Scholarship[];
  job_id?: string;
  estimated_completion?: number;
  progress?: number;
  new_scholarships?: Scholarship[];
  total_found?: number;
}

export interface UserProfile {
  name: string;
  academic_status: string;
  school: string;
  year?: string;
  gpa?: number;
  major?: string;
  graduation_year?: string;
  background?: string[];
  financial_need?: number;
  interests?: string[];
}

export interface DashboardStats {
  opportunities_matched: number;
  total_value: number;
  urgent_deadlines: number;
  applications_started: number;
}

export type ViewMode = 'grid' | 'list';
export type SortOption = 'best_match' | 'deadline' | 'amount' | 'time' | 'recent';
export type FilterTab = 'all' | 'high_priority' | 'closing_soon' | 'high_value' | 'best_match';
