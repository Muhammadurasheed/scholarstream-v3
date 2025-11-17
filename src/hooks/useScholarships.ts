// Custom hook for scholarship data management
import { useState, useEffect, useCallback } from 'react';
import { Scholarship, DashboardStats, UserProfile } from '@/types/scholarship';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useScholarships = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    opportunities_matched: 0,
    total_value: 0,
    urgent_deadlines: 0,
    applications_started: 0,
  });
  const [loading, setLoading] = useState(true);
  const [discoveryStatus, setDiscoveryStatus] = useState<'idle' | 'processing' | 'completed'>('idle');
  const [discoveryProgress, setDiscoveryProgress] = useState(0);
  const [savedScholarshipIds, setSavedScholarshipIds] = useState<Set<string>>(new Set());
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Trigger initial discovery after onboarding
  const triggerDiscovery = useCallback(async (profileData: UserProfile) => {
    if (!user?.uid) return;
    
    try {
      setDiscoveryStatus('processing');
      setDiscoveryProgress(10);
      
      toast({
        title: '🔍 Discovering opportunities...',
        description: 'Searching scholarship databases, hackathons, and bounties...',
      });

      // Call backend discovery endpoint
      const response = await apiService.discoverScholarships(user.uid, profileData);
      
      // Show immediate results
      if (response.immediate_results && response.immediate_results.length > 0) {
        setScholarships(response.immediate_results);
        
        const totalValue = response.immediate_results.reduce((sum, s) => sum + s.amount, 0);
        const urgentCount = response.immediate_results.filter(s => {
          const daysUntil = Math.floor(
            (new Date(s.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          return daysUntil < 7 && daysUntil >= 0;
        }).length;
        
        setStats({
          opportunities_matched: response.immediate_results.length,
          total_value: totalValue,
          urgent_deadlines: urgentCount,
          applications_started: 0,
        });

        setDiscoveryProgress(50);
        
        toast({
          title: `✨ Found ${response.immediate_results.length} opportunities!`,
          description: 'Discovering more personalized matches...',
        });
      }

      // Start polling if job_id exists
      if (response.job_id) {
        setCurrentJobId(response.job_id);
        pollDiscoveryProgress(response.job_id);
      } else {
        setDiscoveryStatus('completed');
        setDiscoveryProgress(100);
      }

    } catch (error) {
      console.error('Discovery failed:', error);
      setDiscoveryStatus('idle');
      
      // Fallback to mock data
      try {
        const { mockScholarships } = await import('@/data/mockScholarships');
        setScholarships(mockScholarships);
        
        const totalValue = mockScholarships.reduce((sum, s) => sum + s.amount, 0);
        setStats({
          opportunities_matched: mockScholarships.length,
          total_value: totalValue,
          urgent_deadlines: 0,
          applications_started: 0,
        });

        toast({
          title: 'Showing sample opportunities',
          description: 'Backend is connecting. Your personalized matches will appear shortly.',
        });
      } catch (fallbackError) {
        toast({
          variant: 'destructive',
          title: 'Discovery unavailable',
          description: 'Please refresh the page to try again.',
        });
      }
    }
  }, [user, toast]);

  // Poll for additional discovery results
  const pollDiscoveryProgress = useCallback(async (jobId: string) => {
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 3000; // 3 seconds

    const poll = async () => {
      try {
        const response = await apiService.getDiscoveryProgress(jobId);
        
        setDiscoveryProgress(Math.min(50 + (attempts * 5), 95));

        if (response.new_scholarships && response.new_scholarships.length > 0) {
          const updatedScholarships = [...scholarships, ...response.new_scholarships];
          setScholarships(updatedScholarships);
          
          const totalValue = updatedScholarships.reduce((sum, s) => sum + s.amount, 0);
          const urgentCount = updatedScholarships.filter(s => {
            const daysUntil = Math.floor(
              (new Date(s.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return daysUntil < 7 && daysUntil >= 0;
          }).length;
          
          setStats(prev => ({
            ...prev,
            opportunities_matched: updatedScholarships.length,
            total_value: totalValue,
            urgent_deadlines: urgentCount,
          }));

          toast({
            title: `🎯 Found ${response.new_scholarships.length} more opportunities!`,
            description: `Total: ${updatedScholarships.length} matches`,
          });
        }

        if (response.status === 'completed' || attempts >= maxAttempts) {
          setDiscoveryStatus('completed');
          setDiscoveryProgress(100);
          setCurrentJobId(null);
          
          toast({
            title: '✅ Discovery complete!',
            description: `Matched ${scholarships.length} opportunities to your profile`,
          });
          return;
        }

        attempts++;
        setTimeout(poll, pollInterval);
      } catch (error) {
        console.error('Polling failed:', error);
        setDiscoveryStatus('completed');
        setCurrentJobId(null);
      }
    };

    poll();
  }, [scholarships.length, toast]);

  const loadScholarships = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      
      // Try to fetch from backend first
      try {
        console.log('🔍 Fetching scholarships from backend for user:', user.uid);
        const data = await apiService.getMatchedScholarships(user.uid);
        console.log('✅ Successfully fetched scholarships:', data.scholarships.length);
        
        setScholarships(data.scholarships);
        
        // Calculate stats
        const urgentCount = data.scholarships.filter(s => {
          const daysUntil = Math.floor(
            (new Date(s.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          return daysUntil < 7 && daysUntil >= 0;
        }).length;
        
        setStats({
          opportunities_matched: data.scholarships.length,
          total_value: data.total_value,
          urgent_deadlines: urgentCount,
          applications_started: 0,
        });
        
        if (data.scholarships.length === 0) {
          const hasProfile = localStorage.getItem('scholarstream_profile');
          if (hasProfile) {
            toast({
              title: 'Profile complete!',
              description: 'Your personalized opportunities are being discovered. Check back in a few minutes.',
            });
          } else {
            toast({
              title: 'Welcome to ScholarStream!',
              description: 'Complete your profile to discover personalized opportunities.',
            });
          }
        }
      } catch (apiError: any) {
        // Show specific error for debugging
        console.error('❌ Backend API error:', apiError.message);
        
        // If user hasn't completed onboarding, show empty state
        const hasProfile = localStorage.getItem('scholarstream_profile');
        if (!hasProfile) {
          setScholarships([]);
          setStats({
            opportunities_matched: 0,
            total_value: 0,
            urgent_deadlines: 0,
            applications_started: 0,
          });
          
          toast({
            title: 'Welcome to ScholarStream!',
            description: 'Complete your profile to discover personalized opportunities.',
          });
        } else {
          // Show actual error to user - this is key!
          console.log('🔄 Backend unavailable, attempting API call diagnosis...');
          
          toast({
            title: 'Connecting to backend...',
            description: 'Your scholarships will appear once connection is established. Please wait.',
            variant: 'destructive',
          });
          
          // Don't show mock data - keep trying the real backend
          setTimeout(() => {
            console.log('🔄 Retrying backend connection...');
            loadScholarships();
          }, 5000); // Retry after 5 seconds
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load scholarships:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load scholarships',
        description: 'Please try again later.',
      });
      setLoading(false);
    }
  }, [user, toast]);

  const toggleSaveScholarship = useCallback(async (scholarshipId: string) => {
    if (!user?.uid) return;
    
    const isSaved = savedScholarshipIds.has(scholarshipId);
    
    try {
      if (isSaved) {
        await apiService.unsaveScholarship(user.uid, scholarshipId);
        setSavedScholarshipIds(prev => {
          const next = new Set(prev);
          next.delete(scholarshipId);
          return next;
        });
        toast({
          title: 'Removed from favorites',
          description: 'Scholarship removed from your saved list.',
        });
      } else {
        await apiService.saveScholarship(user.uid, scholarshipId);
        setSavedScholarshipIds(prev => new Set(prev).add(scholarshipId));
        toast({
          title: 'Saved to favorites',
          description: 'You can find this scholarship in your saved list.',
        });
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
      toast({
        variant: 'destructive',
        title: 'Action failed',
        description: 'Please try again.',
      });
    }
  }, [user, savedScholarshipIds, toast]);

  const startApplication = useCallback(async (scholarshipId: string) => {
    if (!user?.uid) return;
    
    try {
      await apiService.startApplication(user.uid, scholarshipId);
      toast({
        title: 'Application started',
        description: 'Your progress has been saved.',
      });
    } catch (error) {
      console.error('Failed to start application:', error);
    }
  }, [user, toast]);

  useEffect(() => {
    loadScholarships();
  }, [loadScholarships]);

  return {
    scholarships,
    stats,
    loading,
    discoveryStatus,
    discoveryProgress,
    savedScholarshipIds,
    toggleSaveScholarship,
    startApplication,
    refreshScholarships: loadScholarships,
    triggerDiscovery,
  };
};
