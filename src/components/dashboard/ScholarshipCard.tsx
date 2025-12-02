import { useState } from 'react';
import { Calendar, Clock, Bookmark, Award, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scholarship } from '@/types/scholarship';
import {
  formatCurrency,
  getDeadlineInfo,
  getMatchTierColor,
  getPriorityColor,
  getCompetitionBadgeColor,
  isNewScholarship,
} from '@/utils/scholarshipUtils';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ScholarshipCardProps {
  scholarship: Scholarship;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onStartApplication: (id: string) => void;
}

export const ScholarshipCard = ({
  scholarship,
  isSaved,
  onToggleSave,
  onStartApplication,
}: ScholarshipCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const deadlineInfo = getDeadlineInfo(scholarship.deadline);
  const isNew = isNewScholarship(scholarship.discovered_at);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col',
        getPriorityColor(scholarship.priority_level)
      )}
    >
      {isNew && (
        <div className="absolute right-4 top-4 -rotate-6">
          <Badge className="bg-success text-success-foreground">NEW</Badge>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          {scholarship.logo_url && !imageError ? (
            <img
              src={scholarship.logo_url}
              alt={scholarship.organization}
              className="h-12 w-12 rounded-lg object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="text-sm font-bold">{getInitials(scholarship.organization)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Header with match score */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3
                className="line-clamp-2 cursor-pointer text-lg font-semibold text-foreground transition-colors hover:text-primary"
                onClick={() => navigate(`/opportunity/${scholarship.id}`)}
              >
                {scholarship.name}
              </h3>
              <p className="text-sm text-muted-foreground">{scholarship.organization}</p>
            </div>
            <Badge className={cn('shrink-0', getMatchTierColor(scholarship.match_tier))}>
              {scholarship.match_score}% Match
            </Badge>
          </div>

          {/* Amount */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-success">{formatCurrency(scholarship.amount)}</span>
            <span className="text-sm text-muted-foreground">{scholarship.amount_display}</span>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{deadlineInfo.formattedDate}</span>
            {deadlineInfo.daysUntil >= 0 && (
              <span className={cn('text-sm font-medium', deadlineInfo.color)}>
                ({deadlineInfo.countdown})
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {scholarship.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {scholarship.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{scholarship.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{scholarship.estimated_time}</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              <span
                className={cn(
                  'rounded px-1.5 py-0.5',
                  getCompetitionBadgeColor(scholarship.competition_level)
                )}
              >
                {scholarship.competition_level} competition
              </span>
            </div>
            <div>
              <span className="font-medium text-success">
                {formatCurrency(scholarship.expected_value)}/hour
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/opportunity/${scholarship.id}`)}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Details
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onStartApplication(scholarship.id);
                navigate(`/apply/${scholarship.id}`);
              }}
            >
              Start Application
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleSave(scholarship.id)}
              className="ml-auto"
            >
              <Bookmark
                className={cn('h-4 w-4', isSaved && 'fill-current text-primary')}
              />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
