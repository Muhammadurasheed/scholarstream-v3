import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { OnboardingData } from '@/pages/Onboarding';

interface Step3Props {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onSkip: (data: Partial<OnboardingData>) => void;
}

const majors = [
  'Computer Science', 'Engineering', 'Business', 'Biology', 'Psychology',
  'English', 'Mathematics', 'Political Science', 'Economics', 'Chemistry',
  'History', 'Art', 'Music', 'Education', 'Nursing', 'Other'
];

const Step3Profile: React.FC<Step3Props> = ({ data, onNext, onSkip }) => {
  const [gpa, setGpa] = useState(data.gpa || 3.5);
  const [major, setMajor] = useState(data.major || '');
  const [graduationYear, setGraduationYear] = useState(data.graduationYear || '');

  const getLetterGrade = (gpaValue: number) => {
    if (gpaValue >= 3.7) return 'A';
    if (gpaValue >= 3.3) return 'A-';
    if (gpaValue >= 3.0) return 'B+';
    if (gpaValue >= 2.7) return 'B';
    if (gpaValue >= 2.3) return 'B-';
    if (gpaValue >= 2.0) return 'C+';
    return 'C';
  };

  const handleContinue = () => {
    onNext({ gpa, major, graduationYear });
  };

  const handleSkip = () => {
    onSkip({ major: major || 'Undecided', graduationYear: graduationYear || '2028' });
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <p className="text-sm text-primary font-semibold">Question 3 of 6</p>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Tell us about your academic performance
        </h1>
        <p className="text-base text-muted-foreground">
          This helps us match you with merit-based opportunities
        </p>
        <p className="text-sm font-semibold text-warning">
          All fields are optional - you can update these later
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* GPA Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-foreground font-semibold">GPA (4.0 scale)</Label>
            <span className="text-2xl font-bold text-primary">
              {gpa.toFixed(1)} ({getLetterGrade(gpa)})
            </span>
          </div>
          <Slider
            value={[gpa]}
            onValueChange={(value) => setGpa(value[0])}
            min={0}
            max={4}
            step={0.1}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Don't worry if you're not sure - you can update this later
          </p>
        </div>

        {/* Major */}
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Major / Intended Major</Label>
          <Select value={major} onValueChange={setMajor}>
            <SelectTrigger className="bg-background text-foreground border-2 font-medium">
              <SelectValue placeholder="Select your major" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-2">
              {majors.map((m) => (
                <SelectItem key={m} value={m} className="text-popover-foreground font-medium">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Graduation Year */}
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Expected Graduation Year</Label>
          <Select value={graduationYear} onValueChange={setGraduationYear}>
            <SelectTrigger className="bg-background text-foreground border-2 font-medium">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-2">
              {[2025, 2026, 2027, 2028, 2029, 2030, 2031].map((year) => (
                <SelectItem key={year} value={year.toString()} className="text-popover-foreground font-medium">
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {gpa >= 3.5 && (
          <div className="p-4 bg-success/10 border-2 border-success/30 rounded-lg animate-scale-in">
            <p className="text-sm text-foreground font-semibold">
              💡 Students with {gpa.toFixed(1)} GPA typically qualify for merit-based scholarships!
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSkip} className="flex-1">
            Skip this step
          </Button>
          <Button onClick={handleContinue} className="flex-1">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step3Profile;