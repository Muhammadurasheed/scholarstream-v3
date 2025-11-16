import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { OnboardingData } from '@/pages/Onboarding';
import { X } from 'lucide-react';

interface Step5Props {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
}

const predefinedInterests = [
  // Academic
  'STEM', 'Arts & Music', 'Writing', 'Research', 'Business',
  // Activities
  'Athletics', 'Community Service', 'Leadership', 'Entrepreneurship',
  // Causes
  'Environment', 'Social Justice', 'Healthcare', 'Education',
  // Other
  'Technology', 'Gaming', 'Debate', 'Journalism',
];

const Step5Interests: React.FC<Step5Props> = ({ data, onNext }) => {
  const [financialNeed, setFinancialNeed] = useState(data.financialNeed || 20000);
  const [notSure, setNotSure] = useState(!data.financialNeed);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(data.interests || []);
  const [customInterest, setCustomInterest] = useState('');

  const toggleInterest = (interest: string) => {
    setSelectedInterests(
      selectedInterests.includes(interest)
        ? selectedInterests.filter(i => i !== interest)
        : [...selectedInterests, interest]
    );
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (trimmed && !selectedInterests.includes(trimmed)) {
      setSelectedInterests([...selectedInterests, trimmed]);
      setCustomInterest('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomInterest();
    }
  };

  const removeInterest = (interest: string) => {
    setSelectedInterests(selectedInterests.filter(i => i !== interest));
  };

  const handleContinue = () => {
    onNext({
      financialNeed: notSure ? undefined : financialNeed,
      interests: selectedInterests,
    });
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <p className="text-sm text-primary font-semibold">Question 5 of 6</p>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Let's understand your financial needs and interests
        </h1>
        <p className="text-base text-foreground/70">
          This helps us find the perfect scholarships for you
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Financial Need */}
        <div className="space-y-4">
          <Label className="text-lg font-bold text-foreground">What's your estimated annual financial need?</Label>
          <p className="text-sm text-foreground/70">
            How much do you need for tuition, housing, books, etc.?
          </p>
          
          <div className="space-y-4">
            {!notSure && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70 font-medium">Financial Need</span>
                  <span className="text-2xl font-bold text-primary">
                    ${financialNeed.toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={[financialNeed]}
                  onValueChange={(value) => setFinancialNeed(value[0])}
                  min={0}
                  max={50000}
                  step={5000}
                  className="w-full"
                />
              </>
            )}
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notSure"
                checked={notSure}
                onChange={(e) => setNotSure(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="notSure" className="text-sm text-foreground font-semibold cursor-pointer">
                I'm not sure
              </label>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-4">
          <Label className="text-lg font-bold text-foreground">What are you passionate about?</Label>
          <p className="text-sm text-foreground/70">
            This helps us find niche scholarships that match your unique profile
          </p>

          {/* Predefined tags */}
          <div className="flex flex-wrap gap-2">
            {predefinedInterests.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <Badge
                  key={interest}
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer transition-all hover:scale-105 text-sm font-bold border-2"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              );
            })}
          </div>

          {/* Selected custom interests */}
          {selectedInterests.filter(i => !predefinedInterests.includes(i)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedInterests
                .filter(i => !predefinedInterests.includes(i))
                .map((interest) => (
                  <Badge key={interest} variant="secondary" className="gap-1 text-sm font-bold">
                    {interest}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeInterest(interest)}
                    />
                  </Badge>
                ))}
            </div>
          )}

          {/* Custom input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add your own interests (e.g., Robotics, Poetry, Climate Change)"
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 text-foreground bg-background border-2"
            />
            <Button variant="outline" onClick={addCustomInterest} className="border-2 font-semibold">
              Add
            </Button>
          </div>
          <p className="text-sm text-foreground/60">
            Press Enter or comma to add custom interests
          </p>
        </div>

        <Button size="lg" className="w-full" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default Step5Interests;
