import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scholarship } from '@/types/scholarship';
import { formatCurrency, getDeadlineInfo } from '@/utils/scholarshipUtils';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';

interface PriorityAlertsSectionProps {
  urgentScholarships: Scholarship[];
}

export const PriorityAlertsSection = ({ urgentScholarships }: PriorityAlertsSectionProps) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (urgentScholarships.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 350;
    const newScrollPosition =
      scrollContainerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
    scrollContainerRef.current.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
  };

  return (
    <div className="mb-8 rounded-xl bg-gradient-to-r from-danger/20 via-danger/10 to-background border-2 border-danger/30 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-danger/20 p-2">
            <AlertTriangle className="h-6 w-6 text-danger" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              ⚠️ {urgentScholarships.length} Urgent Deadline{urgentScholarships.length !== 1 && 's'} This Week!
            </h2>
            <p className="text-sm text-muted-foreground">Don't miss out on these opportunities</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="hidden sm:flex">
          View All Urgent
        </Button>
      </div>

      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur hidden lg:flex"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {urgentScholarships.map((scholarship) => {
            const deadlineInfo = getDeadlineInfo(scholarship.deadline);
            return (
              <Card
                key={scholarship.id}
                className="flex-shrink-0 w-[320px] p-4 snap-start cursor-pointer hover:shadow-lg transition-shadow border-danger/30"
                onClick={() => navigate(`/opportunity/${scholarship.id}`)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground line-clamp-2 flex-1">
                      {scholarship.name}
                    </h3>
                    <Badge className="bg-danger/20 text-danger shrink-0">{scholarship.match_score}%</Badge>
                  </div>

                  <div className="text-2xl font-bold text-success">{formatCurrency(scholarship.amount)}</div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-danger">{deadlineInfo.countdown}</div>
                      <div className="text-xs text-muted-foreground">{deadlineInfo.formattedDate}</div>
                    </div>
                    <Button size="sm" variant="default" className="bg-danger hover:bg-danger/90">
                      Apply Now
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur hidden lg:flex"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
