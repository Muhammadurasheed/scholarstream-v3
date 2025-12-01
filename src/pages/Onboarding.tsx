import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirebaseAutoSave } from '@/hooks/useFirebaseAutoSave';
import { ExitOnboardingModal } from '@/components/modals/ExitOnboardingModal';
import Step1Name from '@/components/onboarding/Step1Name';
import Step2Academic from '@/components/onboarding/Step2Academic';
import Step3Profile from '@/components/onboarding/Step3Profile';
import Step4Background from '@/components/onboarding/Step4Background';
import Step5Interests from '@/components/onboarding/Step5Interests';
import Step6Complete from '@/components/onboarding/Step6Complete';
import { sanitizeData } from '@/lib/utils';

export interface OnboardingData {
  firstName: string;
  lastName: string;
  academicStatus: string;
  year?: string;
  school: string;
  gpa?: number;
  major: string;
  graduationYear: string;
  background: string[];
  financialNeed?: number;
  interests: string[];
}

const TOTAL_STEPS = 6;

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showExitModal, setShowExitModal] = useState(false);
  const [data, setData] = useState<OnboardingData>(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem('scholarstream_onboarding_data');
    return saved ? JSON.parse(saved) : {
      firstName: '',
      lastName: '',
      academicStatus: '',
      school: '',
      major: '',
      graduationYear: '',
      background: [],
      interests: [],
    };
  });

  // Fetch saved draft from Firestore on mount
  useEffect(() => {
    const fetchDraft = async () => {
      if (!user?.uid) return;

      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');

        const docRef = doc(db, 'onboarding_drafts', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const remoteData = docSnap.data() as Partial<OnboardingData>;
          console.log('📥 Loaded onboarding draft from Firestore');

          // Merge remote data with local data, preferring remote if it exists
          setData(prev => ({
            ...prev,
            ...remoteData,
            // Ensure arrays are initialized if missing in remote
            background: remoteData.background || prev.background || [],
            interests: remoteData.interests || prev.interests || [],
          }));
        }
      } catch (error) {
        console.error('Failed to load onboarding draft:', error);
      }
    };

    fetchDraft();
  }, [user]);

  // Auto-save to Firebase with debouncing
  useFirebaseAutoSave(data, 'onboarding_drafts', 1500);

  // Handle browser/tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep < TOTAL_STEPS && currentStep > 1) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentStep]);

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const handleNext = (stepData: Partial<OnboardingData>) => {
    const updatedData = { ...data, ...stepData };
    setData(updatedData);

    // Save to localStorage
    localStorage.setItem('scholarstream_onboarding_data', JSON.stringify(updatedData));

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Please sign in again to continue.',
      });
      navigate('/login');
      return;
    }

    // Mark onboarding as complete
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      // Sanitize data before saving to remove undefined values
      const cleanData = sanitizeData(data);

      // Use setDoc with merge to create or update the document
      await setDoc(doc(db, 'users', user.uid), {
        onboarding_completed: true,
        profile: cleanData,
        updated_at: new Date()
      }, { merge: true });

      localStorage.setItem('scholarstream_onboarding_complete', 'true');
      localStorage.setItem('scholarstream_profile', JSON.stringify(cleanData));
      localStorage.removeItem('scholarstream_onboarding_data');

      // Navigate to dashboard with discovery trigger
      navigate('/dashboard', { state: { triggerDiscovery: true, profileData: cleanData } });
    } catch (error) {
      console.error('Failed to save completion status:', error);
      toast({
        title: 'Error saving profile',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSkip = (stepData: Partial<OnboardingData>) => {
    handleNext(stepData);
  };

  const handleExitConfirm = () => {
    setShowExitModal(false);
    navigate('/dashboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Name data={data} onNext={handleNext} />;
      case 2:
        return <Step2Academic data={data} onNext={handleNext} />;
      case 3:
        return <Step3Profile data={data} onNext={handleNext} onSkip={handleSkip} />;
      case 4:
        return <Step4Background data={data} onNext={handleNext} onSkip={handleSkip} />;
      case 5:
        return <Step5Interests data={data} onNext={handleNext} />;
      case 6:
        return <Step6Complete data={data} onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Progress Bar */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={currentStep === 1 || currentStep === TOTAL_STEPS}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl animate-fade-in">
          {renderStep()}
        </div>
      </div>

      {/* Exit Modal */}
      <ExitOnboardingModal
        open={showExitModal}
        onOpenChange={setShowExitModal}
        onConfirm={handleExitConfirm}
      />
    </div>
  );
};

export default Onboarding;