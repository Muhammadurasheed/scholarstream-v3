// Utility functions for scholarship data processing
import { Scholarship, MatchTier, PriorityLevel } from '@/types/scholarship';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getDeadlineInfo = (deadline: string) => {
  const deadlineDate = new Date(deadline);
  const daysUntil = differenceInDays(deadlineDate, new Date());
  
  let urgency: 'urgent' | 'soon' | 'normal' = 'normal';
  let color: string = 'text-slate-400';
  
  if (daysUntil < 7) {
    urgency = 'urgent';
    color = 'text-danger';
  } else if (daysUntil < 30) {
    urgency = 'soon';
    color = 'text-warning';
  }
  
  const formattedDate = format(deadlineDate, 'MMMM d, yyyy');
  const countdown = daysUntil > 0 
    ? `Due in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`
    : daysUntil === 0 
    ? 'Due today!'
    : 'Deadline passed';
  
  return { urgency, color, formattedDate, countdown, daysUntil };
};

export const getMatchTierColor = (tier: MatchTier): string => {
  const colors: Record<MatchTier, string> = {
    Excellent: 'bg-success text-success-foreground',
    Good: 'bg-warning text-warning-foreground',
    Fair: 'bg-muted text-muted-foreground',
    Poor: 'bg-destructive text-destructive-foreground',
  };
  return colors[tier];
};

export const getPriorityColor = (priority: PriorityLevel): string => {
  const colors: Record<PriorityLevel, string> = {
    URGENT: 'border-l-4 border-danger',
    HIGH: 'border-l-4 border-warning',
    MEDIUM: 'border-l-4 border-info',
    LOW: '',
  };
  return colors[priority];
};

export const calculateDaysUntilDeadline = (deadline: string): number => {
  return differenceInDays(new Date(deadline), new Date());
};

export const isNewScholarship = (discoveredAt: string): boolean => {
  const hoursSinceDiscovery = (Date.now() - new Date(discoveredAt).getTime()) / (1000 * 60 * 60);
  return hoursSinceDiscovery < 24;
};

export const getCompetitionBadgeColor = (level: string): string => {
  const colors: Record<string, string> = {
    Low: 'bg-success/20 text-success',
    Medium: 'bg-warning/20 text-warning',
    High: 'bg-danger/20 text-danger',
  };
  return colors[level] || 'bg-muted text-muted-foreground';
};

export const sortScholarships = (
  scholarships: Scholarship[],
  sortBy: string
): Scholarship[] => {
  const sorted = [...scholarships];
  
  switch (sortBy) {
    case 'best_match':
      return sorted.sort((a, b) => b.match_score - a.match_score);
    case 'deadline':
      return sorted.sort((a, b) => 
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
    case 'amount':
      return sorted.sort((a, b) => b.amount - a.amount);
    case 'time':
      return sorted.sort((a, b) => {
        const timeA = parseInt(a.estimated_time);
        const timeB = parseInt(b.estimated_time);
        return timeA - timeB;
      });
    case 'recent':
      return sorted.sort((a, b) => 
        new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime()
      );
    default:
      return sorted;
  }
};

export const filterScholarshipsByTab = (
  scholarships: Scholarship[],
  tab: string
): Scholarship[] => {
  switch (tab) {
    case 'high_priority':
      return scholarships.filter(s => 
        s.match_score > 70 || calculateDaysUntilDeadline(s.deadline) < 30
      );
    case 'closing_soon':
      return scholarships.filter(s => calculateDaysUntilDeadline(s.deadline) < 30);
    case 'high_value':
      return scholarships.filter(s => s.amount > 10000);
    case 'best_match':
      return scholarships.filter(s => s.match_score > 80);
    default:
      return scholarships;
  }
};

export const getGradeFromGPA = (gpa: number): string => {
  if (gpa >= 3.9) return 'A+';
  if (gpa >= 3.7) return 'A';
  if (gpa >= 3.3) return 'A-';
  if (gpa >= 3.0) return 'B+';
  if (gpa >= 2.7) return 'B';
  if (gpa >= 2.3) return 'B-';
  if (gpa >= 2.0) return 'C+';
  return 'C';
};

export const getTimeAgo = (date: string): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};
