import { Scholarship } from '@/types/scholarship';
import { ScholarshipCard } from './ScholarshipCard';
import { useScholarships } from '@/hooks/useScholarships';
import { cn } from '@/lib/utils';

interface OpportunityGridProps {
    opportunities: Scholarship[];
    view?: 'grid' | 'list';
}

export const OpportunityGrid = ({ opportunities, view = 'grid' }: OpportunityGridProps) => {
    const { savedScholarshipIds, toggleSaveScholarship, startApplication } = useScholarships();

    if (opportunities.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed rounded-xl bg-muted/30">
                <p className="text-muted-foreground">No opportunities found in this category.</p>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'gap-6',
                view === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr'
                    : 'flex flex-col'
            )}
        >
            {opportunities.map((scholarship) => (
                <ScholarshipCard
                    key={scholarship.id}
                    scholarship={scholarship}
                    isSaved={savedScholarshipIds.has(scholarship.id)}
                    onToggleSave={toggleSaveScholarship}
                    onStartApplication={startApplication}
                />
            ))}
        </div>
    );
};
