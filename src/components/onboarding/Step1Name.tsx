import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingData } from '@/pages/Onboarding';

interface Step1Props {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
}

const Step1Name: React.FC<Step1Props> = ({ data, onNext }) => {
  const [firstName, setFirstName] = useState(data.firstName);
  const [lastName, setLastName] = useState(data.lastName);
  const [errors, setErrors] = useState({ firstName: '', lastName: '' });

  const validate = () => {
    const newErrors = { firstName: '', lastName: '' };
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'Must be at least 2 characters';
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'Must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return !newErrors.firstName && !newErrors.lastName;
  };

  const handleContinue = () => {
    if (validate()) {
      onNext({ firstName: firstName.trim(), lastName: lastName.trim() });
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-2">
        <p className="text-sm text-primary font-medium">Question 1 of 6</p>
        <h1 className="text-4xl md:text-5xl font-bold">
          Let's start simple. What's your name?
        </h1>
        <p className="text-lg text-muted-foreground">
          We'll use this to personalize your experience
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setErrors({ ...errors, firstName: '' });
              }}
              className={errors.firstName ? 'border-destructive' : ''}
              autoFocus
            />
            {errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setErrors({ ...errors, lastName: '' });
              }}
              className={errors.lastName ? 'border-destructive' : ''}
            />
            {errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName}</p>
            )}
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={handleContinue}
          disabled={!firstName || !lastName}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default Step1Name;