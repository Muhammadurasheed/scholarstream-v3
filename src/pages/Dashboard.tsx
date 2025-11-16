import { useState, useMemo } from 'react';
import { Target, DollarSign, Clock, FileText, Sparkles, Search, Grid, List } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ScholarshipCard } from '@/components/dashboard/ScholarshipCard';
import { FinancialImpactWidget } from '@/components/dashboard/FinancialImpactWidget';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import { ActivityFeedWidget } from '@/components/dashboard/ActivityFeedWidget';
import { PriorityAlertsSection } from '@/components/dashboard/PriorityAlertsSection';
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
import { FloatingChatAssistant } from '@/components/dashboard/FloatingChatAssistant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useScholarships } from '@/hooks/useScholarships';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, sortScholarships, filterScholarshipsByTab, calculateDaysUntilDeadline } from '@/utils/scholarshipUtils';
import { SortOption, FilterTab, ViewMode } from '@/types/scholarship';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Dashboard = () => {
  const { user } = useAuth();
  const {
    scholarships,
    stats,
    loading,
    discoveryStatus,
    discoveryProgress,
    savedScholarshipIds,
    toggleSaveScholarship,
    startApplication,
  } = useScholarships();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('best_match');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [displayCount, setDisplayCount] = useState(12);
  const [opportunityType, setOpportunityType] = useState<string>('all');

  const getUserName = () => {
    // Try to get name from localStorage profile first
    const profileData = localStorage.getItem('scholarstream_profile');
    if (profileData) {
      try {
        const profile = JSON.parse(profileData);
        if (profile.firstName) return profile.firstName;
      } catch (e) {
        console.error('Error parsing profile data:', e);
      }
    }
    return user?.name?.split(' ')[0] || 'there';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const filteredAndSortedScholarships = useMemo(() => {
    let filtered = filterScholarshipsByTab(scholarships, selectedTab);

    // Filter by opportunity type
    if (opportunityType !== 'all') {
      filtered = filtered.filter(s => s.source_type === opportunityType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.organization.toLowerCase().includes(query) ||
          s.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return sortScholarships(filtered, sortBy);
  }, [scholarships, selectedTab, searchQuery, sortBy, opportunityType]);

  // Calculate opportunity type counts
  const opportunityCounts = useMemo(() => {
    const counts = {
      all: scholarships.length,
      scholarship: scholarships.filter(s => s.source_type === 'platform' || s.source_type === 'government').length,
      hackathon: scholarships.filter(s => s.source_type === 'devpost').length,
      bounty: scholarships.filter(s => s.source_type === 'gitcoin').length,
      competition: scholarships.filter(s => s.source_type === 'kaggle').length,
      grant: scholarships.filter(s => s.source_type === 'government').length,
    };
    return counts;
  }, [scholarships]);

  const displayedScholarships = filteredAndSortedScholarships.slice(0, displayCount);

  const hasMoreToLoad = displayedScholarships.length < filteredAndSortedScholarships.length;

  const urgentScholarships = useMemo(() => {
    return scholarships.filter(s => {
      const daysUntil = calculateDaysUntilDeadline(s.deadline);
      return daysUntil < 7 && daysUntil >= 0;
    });
  }, [scholarships]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container py-8">
          <div className="space-y-8">
            <Skeleton className="h-24 w-full" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <DashboardHeader />

      <main className="container py-8">
        <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Hero Section */}
          <div className="mb-8 rounded-xl bg-gradient-to-r from-primary/15 via-primary/8 to-background p-8 border border-primary/20">
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            {getGreeting()}, {getUserName()}! 👋
          </h1>
          <p className="text-foreground/70 font-medium">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

          {/* Stats Row */}
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            icon={Target}
            value={stats.opportunities_matched}
            label="Scholarships Found"
            iconColor="text-primary"
          />
          <StatsCard
            icon={DollarSign}
            value={formatCurrency(stats.total_value)}
            label="Total Potential Value"
            iconColor="text-success"
          />
          <StatsCard
            icon={Clock}
            value={stats.urgent_deadlines}
            label="Urgent This Week"
            iconColor={stats.urgent_deadlines > 0 ? 'text-danger' : 'text-muted-foreground'}
          />
          <StatsCard
            icon={FileText}
            value={stats.applications_started}
            label="In Progress"
            iconColor="text-info"
          />
          </div>

          {/* Priority Alerts */}
          <PriorityAlertsSection urgentScholarships={urgentScholarships} />

          {/* Discovery Status */}
          {discoveryStatus === 'processing' && (
          <div className="mb-8 animate-pulse rounded-xl border-2 border-primary/50 bg-gradient-to-r from-primary/10 to-transparent p-6">
            <div className="flex items-center gap-4">
              <Sparkles className="h-8 w-8 animate-spin text-primary" />
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-semibold">🔍 Discovering more opportunities for you...</h3>
                <p className="text-sm text-muted-foreground">
                  Analyzing 200+ sources • {stats.opportunities_matched} scholarships found so far
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${discoveryProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Matched Opportunities Section */}
          <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Opportunities</h2>
              <p className="text-muted-foreground">
                {filteredAndSortedScholarships.length} scholarship{filteredAndSortedScholarships.length !== 1 && 's'} matched to your profile
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter & Sort Bar */}
          <div className="sticky top-16 z-40 space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as FilterTab)}>
              <TabsList className="w-full justify-start">
                <TabsTrigger value="all">All ({scholarships.length})</TabsTrigger>
                <TabsTrigger value="high_priority">High Priority</TabsTrigger>
                <TabsTrigger value="closing_soon">Closing Soon</TabsTrigger>
                <TabsTrigger value="high_value">High Value ($10K+)</TabsTrigger>
                <TabsTrigger value="best_match">Best Match (80%+)</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search scholarships..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best_match">Best Match</SelectItem>
                  <SelectItem value="deadline">Deadline (Soonest)</SelectItem>
                  <SelectItem value="amount">Highest Amount</SelectItem>
                  <SelectItem value="time">Quickest to Apply</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scholarship Cards */}
          {displayedScholarships.length > 0 ? (
            <>
              <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
                {displayedScholarships.map((scholarship) => (
                  <ScholarshipCard
                    key={scholarship.id}
                    scholarship={scholarship}
                    isSaved={savedScholarshipIds.has(scholarship.id)}
                    onToggleSave={toggleSaveScholarship}
                    onStartApplication={startApplication}
                  />
                ))}
              </div>

              {hasMoreToLoad && (
                <div className="flex justify-center pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setDisplayCount(prev => prev + 12)}
                  >
                    Load More Opportunities ({filteredAndSortedScholarships.length - displayCount} remaining)
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
              <Target className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No scholarships match your filters</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTab('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
          </div>
        </div>

        {/* Right Sidebar - Desktop Only */}
        <aside className="hidden xl:block w-80 space-y-6 shrink-0">
          <FinancialImpactWidget stats={stats} />
          <QuickActionsWidget />
          <ActivityFeedWidget />
        </aside>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Floating AI Chat Assistant */}
      <FloatingChatAssistant />
    </div>
  );
};

export default Dashboard;
