import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { OnboardingData } from '@/pages/Onboarding';
import { X, Plus } from 'lucide-react';

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
        <p className="text-sm text-primary font-semibold tracking-wide uppercase">Step 5 of 6</p>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Your needs & <br />
          <span className="text-primary">passions</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          This helps us find the perfect scholarships for you.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8 bg-card p-8 rounded-2xl shadow-sm border border-border/50">
        {/* Financial Need */}
        <div className="space-y-6">
          <div className="space-y-1">
            <Label className="text-lg font-semibold text-foreground">Estimated Financial Need</Label>
            <p className="text-sm text-muted-foreground">
              Annual amount needed for tuition, housing, books, etc.
            </p>
          </div>

          <div className="space-y-6 p-6 bg-secondary/30 rounded-xl">
            {!notSure && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Amount</span>
                  <span className="text-3xl font-bold text-primary tracking-tight">
                    ${financialNeed.toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={[financialNeed]}
                  onValueChange={(value) => setFinancialNeed(value[0])}
                  min={0}
                  max={50000}
                  step={5000}
                  className="w-full py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>$0</span>
                  <span>$50,000+</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="notSure"
                checked={notSure}
                onChange={(e) => setNotSure(e.target.checked)}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="notSure" className="text-sm text-foreground font-medium cursor-pointer select-none">
                I'm not sure yet
              </label>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/50" />

        {/* Interests */}
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-lg font-semibold text-foreground">Passions & Interests</Label>
            <p className="text-sm text-muted-foreground">
              Select topics to find niche scholarships.
            </p>
          </div>

          {/* Predefined tags */}
          <div className="flex flex-wrap gap-2">
            {predefinedInterests.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <Badge
                  key={interest}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`
                    cursor-pointer transition-all duration-200 px-3 py-1.5 text-sm font-medium
                    ${isSelected
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 scale-105'
                      : 'bg-background hover:bg-secondary hover:border-primary/30'
                    }
                  `}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              );
            })}
          </div>

          {/* Custom input */}
          <div className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Input
                placeholder="Add custom interest..."
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-10 pr-10"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1 h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                onClick={addCustomInterest}
                disabled={!customInterest.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected custom interests */}
          {selectedInterests.filter(i => !predefinedInterests.includes(i)).length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 animate-fade-in">
              {selectedInterests
                .filter(i => !predefinedInterests.includes(i))
                .map((interest) => (
                  <Badge key={interest} variant="secondary" className="gap-1.5 px-3 py-1 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20">
                    {interest}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                      onClick={() => removeInterest(interest)}
                    />
                  </Badge>
                ))}
            </div>
          )}
        </div>

        <Button
          size="lg"
          className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default Step5Interests;
