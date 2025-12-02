import { useState, useMemo, useEffect } from 'react';
import { Target, DollarSign, Clock, FileText, Sparkles, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { FinancialImpactWidget } from '@/components/dashboard/FinancialImpactWidget';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import { ActivityFeedWidget } from '@/components/dashboard/ActivityFeedWidget';
import { PriorityAlertsSection } from '@/components/dashboard/PriorityAlertsSection';
import { OpportunityGrid } from '@/components/dashboard/OpportunityGrid';
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
import { FloatingChatAssistant } from '@/components/dashboard/FloatingChatAssistant';
import { ViewToggle } from '@/components/dashboard/ViewToggle';
import { Pagination } from '@/components/dashboard/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useScholarships } from '@/hooks/useScholarships';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, calculateDaysUntilDeadline } from '@/utils/scholarshipUtils';
import { UserProfile } from '@/types/scholarship';

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const {
    scholarships,
    paginatedScholarships,
    stats,
    loading,
    discoveryStatus,
    discoveryProgress,
    triggerDiscovery,
    currentPage,
    totalPages,
    goToPage,
  } = useScholarships();

  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Trigger discovery if coming from onboarding
  useEffect(() => {
    const state = location.state as { triggerDiscovery?: boolean; profileData?: any };
    if (state?.triggerDiscovery && state?.profileData && user?.uid) {
      const userProfile: UserProfile = {
        name: `${state.profileData.firstName} ${state.profileData.lastName}`,
        academic_status: state.profileData.academicStatus,
        school: state.profileData.school,
        year: state.profileData.year,
        gpa: state.profileData.gpa,
        major: state.profileData.major,
        graduation_year: state.profileData.graduationYear,
        background: state.profileData.background,
        financial_need: state.profileData.financialNeed,
        interests: state.profileData.interests,
      };

      triggerDiscovery(userProfile);

      // Clear the state to prevent re-triggering on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, user, triggerDiscovery]);

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

  // Smart grouping of opportunities
  const groupedOpportunities = useMemo(() => {
    let filtered = scholarships;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.organization.toLowerCase().includes(query) ||
          s.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return {
      urgent: filtered.filter(o => {
        const daysUntil = calculateDaysUntilDeadline(o.deadline);
        return daysUntil < 7 && daysUntil >= 0;
      }),
      highMatch: filtered.filter(o => o.match_score >= 85),
      byType: {
        scholarships: filtered.filter(o => !['devpost', 'gitcoin', 'kaggle'].includes(o.source_type)),
        hackathons: filtered.filter(o => o.source_type === 'devpost' || o.source_type === 'mlh'),
        bounties: filtered.filter(o => o.source_type === 'gitcoin'),
        competitions: filtered.filter(o => o.source_type === 'kaggle')
      }
    };
  }, [scholarships, searchQuery]);

  if (loading || (discoveryStatus === 'processing' && scholarships.length === 0)) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container py-8">
          {/* Hero Section with Discovery Status */}
          <div className="mb-8 rounded-xl bg-gradient-to-r from-primary/15 via-primary/8 to-background p-8 border border-primary/20">
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              {getGreeting()}, {getUserName()}! 👋
            </h1>
            {discoveryStatus === 'processing' ? (
              <div className="flex items-center gap-3 mt-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <p className="text-primary font-semibold">
                  Discovering opportunities for you... ({discoveryProgress}%)
                </p>
              </div>
            ) : (
              <p className="text-foreground/70 font-medium">Loading your dashboard...</p>
            )}
          </div>

          <div className="space-y-8">
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
                You have <span className="text-primary font-bold">{groupedOpportunities.urgent.length} urgent opportunities</span> and <span className="text-primary font-bold">{groupedOpportunities.highMatch.length} excellent matches</span> waiting.
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
            <PriorityAlertsSection urgentScholarships={groupedOpportunities.urgent} />

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

            {/* Top Matches Section */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Target className="w-6 h-6 text-primary" />
                    Your Best Matches
                  </h2>
                  <p className="text-muted-foreground">
                    Opportunities with 85%+ match score based on your profile
                  </p>
                </div>
              </div>
              <OpportunityGrid opportunities={groupedOpportunities.highMatch.slice(0, 4)} />
            </section>

            {/* Categorized Opportunities */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold">Explore Opportunities</h2>
                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search scholarships..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <ViewToggle view={view} onViewChange={setView} />
                </div>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full justify-start mb-6 overflow-x-auto">
                  <TabsTrigger value="all">All ({scholarships.length})</TabsTrigger>
                  <TabsTrigger value="scholarships">Scholarships ({groupedOpportunities.byType.scholarships.length})</TabsTrigger>
                  <TabsTrigger value="hackathons">Hackathons ({groupedOpportunities.byType.hackathons.length})</TabsTrigger>
                  <TabsTrigger value="bounties">Bounties ({groupedOpportunities.byType.bounties.length})</TabsTrigger>
                  <TabsTrigger value="competitions">Competitions ({groupedOpportunities.byType.competitions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                  <OpportunityGrid opportunities={paginatedScholarships} view={view} />
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
                </TabsContent>
                <TabsContent value="scholarships" className="mt-0">
                  <OpportunityGrid opportunities={groupedOpportunities.byType.scholarships} view={view} />
                </TabsContent>
                <TabsContent value="hackathons" className="mt-0">
                  <OpportunityGrid opportunities={groupedOpportunities.byType.hackathons} view={view} />
                </TabsContent>
                <TabsContent value="bounties" className="mt-0">
                  <OpportunityGrid opportunities={groupedOpportunities.byType.bounties} view={view} />
                </TabsContent>
                <TabsContent value="competitions" className="mt-0">
                  <OpportunityGrid opportunities={groupedOpportunities.byType.competitions} view={view} />
                </TabsContent>
              </Tabs>
            </section>
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
