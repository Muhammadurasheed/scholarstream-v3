import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { OnboardingData } from '@/pages/Onboarding';
import { Lock } from 'lucide-react';

interface Step4Props {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onSkip: (data: Partial<OnboardingData>) => void;
}

const backgroundOptions = [
  { id: 'first-gen', label: 'First-generation college student', tooltip: 'Parents didn\'t complete 4-year degree' },
  { id: 'international', label: 'International student', tooltip: 'Studying from outside the country' },
  { id: 'daca', label: 'DACA recipient or undocumented', tooltip: 'DACA or undocumented student status' },
  { id: 'lgbtq', label: 'LGBTQ+ identifying', tooltip: 'Part of LGBTQ+ community' },
  { id: 'disability', label: 'Student with disability', tooltip: 'Physical or learning disability' },
  { id: 'minority', label: 'Racial or ethnic minority', tooltip: 'Underrepresented racial/ethnic group' },
  { id: 'low-income', label: 'Low-income / Pell Grant eligible', tooltip: 'Financial need-based eligibility' },
  { id: 'veteran', label: 'Veteran or military family', tooltip: 'Military service or dependent' },
  { id: 'foster', label: 'Foster care experience', tooltip: 'Current or former foster youth' },
  { id: 'prefer-not', label: 'Prefer not to say', tooltip: 'Skip all background questions' },
];

const Step4Background: React.FC<Step4Props> = ({ data, onNext, onSkip }) => {
  const [selected, setSelected] = useState<string[]>(data.background || []);

  const handleToggle = (optionId: string) => {
    if (optionId === 'prefer-not') {
      setSelected(selected.includes('prefer-not') ? [] : ['prefer-not']);
    } else {
      if (selected.includes('prefer-not')) {
        setSelected([optionId]);
      } else {
        setSelected(
          selected.includes(optionId)
            ? selected.filter(id => id !== optionId)
            : [...selected, optionId]
        );
      }
    }
  };

  const handleContinue = () => {
    onNext({ background: selected });
  };

  const handleSkipStep = () => {
    onSkip({ background: [] });
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <p className="text-sm text-primary font-semibold">Question 4 of 6</p>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          These questions help us find opportunities designed for students like you
        </h1>
        <p className="text-base text-foreground/70">
          All questions are completely optional and kept private
        </p>
      </div>

      <Card className="max-w-2xl mx-auto p-6 bg-info/10 border-2 border-info/30">
        <div className="flex gap-3 items-start">
          <Lock className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground">Your information is private and secure</p>
            <p className="text-sm text-foreground/70 mt-1">
              Many scholarships are specifically for underrepresented students, and sharing this helps us find them.
            </p>
          </div>
        </div>
      </Card>

      <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {backgroundOptions.map((option) => {
          const isSelected = selected.includes(option.id);
          const isPreferNot = option.id === 'prefer-not';
          const isDisabled = !isPreferNot && selected.includes('prefer-not');
          
          return (
            <Card
              key={option.id}
              className={`p-4 cursor-pointer transition-all ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
              } ${isSelected ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => !isDisabled && handleToggle(option.id)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  disabled={isDisabled}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{option.label}</p>
                  {option.tooltip && (
                    <p className="text-sm text-foreground/60 mt-1">{option.tooltip}</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="max-w-md mx-auto flex gap-3">
        <Button variant="outline" onClick={handleSkipStep} className="flex-1">
          Skip this step
        </Button>
        <Button onClick={handleContinue} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
};

export default Step4Background;