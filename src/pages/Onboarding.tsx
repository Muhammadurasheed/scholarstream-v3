import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import Step1Name from '@/components/onboarding/Step1Name';
import Step2Academic from '@/components/onboarding/Step2Academic';
import Step3Profile from '@/components/onboarding/Step3Profile';
import Step4Background from '@/components/onboarding/Step4Background';
import Step5Interests from '@/components/onboarding/Step5Interests';
import Step6Complete from '@/components/onboarding/Step6Complete';

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
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    academicStatus: '',
    school: '',
    major: '',
    graduationYear: '',
    background: [],
    interests: [],
  });

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

  const handleComplete = () => {
    // Mark onboarding as complete
    localStorage.setItem('scholarstream_onboarding_complete', 'true');
    localStorage.setItem('scholarstream_profile', JSON.stringify(data));
    
    toast({
      title: 'Profile Complete! 🎉',
      description: 'Finding your perfect scholarship matches...',
    });
    
    navigate('/dashboard');
  };

  const handleSkip = (stepData: Partial<OnboardingData>) => {
    handleNext(stepData);
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
    <div className="min-h-screen flex flex-col">
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
    </div>
  );
};

export default Onboarding;