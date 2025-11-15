// Custom hook for scholarship data management
import { useState, useEffect, useCallback } from 'react';
import { Scholarship, DashboardStats } from '@/types/scholarship';
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

  const loadScholarships = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      
      // Try to fetch from backend first
      try {
        const data = await apiService.getMatchedScholarships(user.uid);
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
      } catch (apiError) {
        // Fallback to mock data for development
        console.log('Backend not available, using mock data');
        const { mockScholarships } = await import('@/data/mockScholarships');
        setScholarships(mockScholarships);
        
        const totalValue = mockScholarships.reduce((sum, s) => sum + s.amount, 0);
        const urgentCount = mockScholarships.filter(s => {
          const daysUntil = Math.floor(
            (new Date(s.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          return daysUntil < 7 && daysUntil >= 0;
        }).length;
        
        setStats({
          opportunities_matched: mockScholarships.length,
          total_value: totalValue,
          urgent_deadlines: urgentCount,
          applications_started: 0,
        });
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
  };
};
