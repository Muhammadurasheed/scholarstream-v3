import { Scholarship, UserProfile } from '@/types/scholarship';

/**
 * FAANG-Level Matching Engine
 * Multi-factor scoring system for hyper-personalized opportunity matching
 */

interface MatchScoreBreakdown {
  eligibility: number;
  interests: number;
  urgency: number;
  value: number;
  effort: number;
  total: number;
  explanation: string;
}

export class OpportunityMatchingEngine {
  private readonly weights = {
    eligibility: 30,  // Must meet basic requirements
    interests: 25,    // Alignment with user interests
    urgency: 20,      // Time-sensitive needs
    value: 15,        // Financial impact
    effort: 10        // Time to complete vs availability
  };

  /**
   * Calculate comprehensive match score (0-100)
   */
  calculateMatchScore(opportunity: Scholarship, profile: UserProfile): MatchScoreBreakdown {
    let score = 0;
    const breakdown: Partial<MatchScoreBreakdown> = {};

    // 1. ELIGIBILITY SCORE (30 points) - HARD REQUIREMENTS
    const eligibilityScore = this.scoreEligibility(opportunity, profile);
    if (eligibilityScore < 0.5) {
      // Filter out if doesn't meet 50% of requirements
      return {
        eligibility: 0,
        interests: 0,
        urgency: 0,
        value: 0,
        effort: 0,
        total: 0,
        explanation: 'Does not meet eligibility requirements'
      };
    }
    breakdown.eligibility = Math.round(eligibilityScore * this.weights.eligibility);
    score += breakdown.eligibility;

    // 2. INTERESTS ALIGNMENT (25 points)
    const interestScore = this.scoreInterests(opportunity, profile);
    breakdown.interests = Math.round(interestScore * this.weights.interests);
    score += breakdown.interests;

    // 3. URGENCY MATCH (20 points)
    const urgencyScore = this.scoreUrgency(opportunity, profile);
    breakdown.urgency = Math.round(urgencyScore * this.weights.urgency);
    score += breakdown.urgency;

    // 4. VALUE SCORE (15 points)
    const valueScore = this.scoreValue(opportunity, profile);
    breakdown.value = Math.round(valueScore * this.weights.value);
    score += breakdown.value;

    // 5. EFFORT FEASIBILITY (10 points)
    const effortScore = this.scoreEffort(opportunity, profile);
    breakdown.effort = Math.round(effortScore * this.weights.effort);
    score += breakdown.effort;

    breakdown.total = Math.round(score);
    breakdown.explanation = this.generateExplanation(breakdown as MatchScoreBreakdown, opportunity, profile);

    return breakdown as MatchScoreBreakdown;
  }

  private scoreEligibility(opp: Scholarship, profile: any): number {
    let score = 1.0;

    // Grade level matching
    const academicStatusMatch = {
      'High School': ['high school', 'freshman'],
      'Undergraduate': ['undergraduate', 'college', 'university'],
      'Graduate': ['graduate', 'masters', 'phd', 'doctoral'],
      'Postgraduate': ['postgraduate', 'post-doctoral']
    };

    const userStatus = profile.academicStatus || profile.academic_status || '';
    const oppTags = opp.tags.map(t => t.toLowerCase());
    
    const expectedTags = academicStatusMatch[userStatus as keyof typeof academicStatusMatch] || [];
    const hasMatch = expectedTags.some(tag => oppTags.some(oppTag => oppTag.includes(tag)));
    
    if (!hasMatch && opp.tags.length > 0) {
      score *= 0.7;
    }

    return score;
  }

  private scoreInterests(opp: Scholarship, profile: any): number {
    const interests = profile.interests || [];
    if (!interests.length || !opp.tags.length) {
      return 0.5; // Neutral if no data
    }

    const userInterests = new Set(interests.map((i: string) => i.toLowerCase()));
    const oppTags = new Set(opp.tags.map(t => t.toLowerCase()));

    // Calculate Jaccard similarity
    const intersection = Array.from(userInterests).filter((i: string) => 
      Array.from(oppTags).some((t: string) => t.includes(i) || i.includes(t))
    ).length;
    
    const union = userInterests.size + oppTags.size - intersection;

    if (union === 0) return 0.5;

    let similarity = intersection / union;

    // Bonus for major match
    const major = (profile.major || '').toLowerCase();
    if (major && oppTags.has(major)) {
      similarity += 0.3;
    }

    return Math.min(similarity, 1.0);
  }

  private scoreUrgency(opp: Scholarship, profile: any): number {
    const deadline = new Date(opp.deadline);
    const now = new Date();
    const daysUntil = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const motivation = profile.motivation || [];

    // User needs urgent funding
    if (motivation.includes('Urgent Funding')) {
      if (daysUntil <= 7) return 1.0;
      if (daysUntil <= 30) return 0.7;
      return 0.3;
    }

    // User planning ahead
    if (motivation.includes('Long-term Planning')) {
      if (daysUntil > 60) return 1.0;
      if (daysUntil > 30) return 0.7;
      return 0.4;
    }

    // Default: prefer not-too-urgent, not-too-far
    if (daysUntil >= 7 && daysUntil <= 60) {
      return 0.8;
    }
    return 0.5;
  }

  private scoreValue(opp: Scholarship, profile: any): number {
    const financialNeed = profile.financialNeed || profile.financial_need || 0;
    if (!financialNeed) return 0.5;

    const valueRatio = Math.min(opp.amount / financialNeed, 1.0);

    // Prefer opportunities that cover significant portion of need
    if (valueRatio >= 0.8) return 1.0;
    if (valueRatio >= 0.5) return 0.8;
    if (valueRatio >= 0.2) return 0.6;
    return 0.4;
  }

  private scoreEffort(opp: Scholarship, profile: any): number {
    const estimatedHours = this.estimateEffort(opp);
    const timeCommitment = profile.timeCommitment || profile.time_commitment || 'Flexible';

    // Map time commitments
    if (typeof timeCommitment === 'string' && timeCommitment.includes('few hours')) {
      if (estimatedHours <= 5) return 1.0;
      if (estimatedHours <= 10) return 0.6;
      return 0.3;
    }

    if (typeof timeCommitment === 'string' && timeCommitment.includes('Weekends')) {
      if (estimatedHours >= 10 && estimatedHours <= 48) return 1.0;
      return 0.5;
    }

    // Flexible/ongoing
    return 0.8; // Neutral
  }

  private estimateEffort(opp: Scholarship): number {
    let hours = 2; // Base application time

    // Check tags for complexity indicators
    const tags = opp.tags.map(t => t.toLowerCase());
    
    if (tags.some(t => ['essay', 'statement'].includes(t))) {
      hours += 3; // Essay takes time
    }
    
    if (tags.some(t => ['recommendation', 'letter'].includes(t))) {
      hours += 1;
    }
    
    if (tags.some(t => ['transcript', 'documents'].includes(t))) {
      hours += 0.5;
    }

    return hours;
  }

  private generateExplanation(breakdown: MatchScoreBreakdown, opp: Scholarship, profile: any): string {
    const reasons: string[] = [];

    if (breakdown.interests > 15) {
      reasons.push('Strong alignment with your interests');
    }
    if (breakdown.urgency > 15) {
      reasons.push('Matches your timeline');
    }
    if (breakdown.value > 10) {
      reasons.push('Significant financial value');
    }
    if (breakdown.effort > 7) {
      reasons.push('Fits your available time');
    }

    if (reasons.length === 0) {
      return 'General match based on your profile';
    }

    return reasons.join(' • ');
  }

  /**
   * Rank and filter opportunities by match score
   */
  rankOpportunities(opportunities: Scholarship[], profile: UserProfile): Scholarship[] {
    const scored = opportunities.map(opp => {
      const matchData = this.calculateMatchScore(opp, profile);
      return {
        ...opp,
        match_score: matchData.total,
        match_explanation: matchData.explanation
      };
    });

    // Filter out very poor matches (< 30%)
    const filtered = scored.filter(opp => opp.match_score >= 30);

    // Sort by match score descending
    return filtered.sort((a, b) => b.match_score - a.match_score);
  }
}

export const matchingEngine = new OpportunityMatchingEngine();
