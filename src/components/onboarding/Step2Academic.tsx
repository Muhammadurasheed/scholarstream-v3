import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { OnboardingData } from '@/pages/Onboarding';
import { GraduationCap, Book, Award, HelpCircle, Check, ChevronsUpDown } from 'lucide-react';
import { searchUniversities } from '@/data/universities';
import { cn } from '@/lib/utils';

interface Step2Props {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
}

const academicStatuses = [
  { id: 'high-school', label: 'High School Senior', icon: GraduationCap, desc: 'Preparing for college' },
  { id: 'undergraduate', label: 'Undergraduate', icon: Book, desc: 'Currently in college', hasYear: true },
  { id: 'graduate', label: 'Graduate Student', icon: Award, desc: "Master's or PhD program" },
  { id: 'other', label: 'Other', icon: HelpCircle, desc: 'Gap year, community college, etc.' },
];

const Step2Academic: React.FC<Step2Props> = ({ data, onNext }) => {
  const [academicStatus, setAcademicStatus] = useState(data.academicStatus);
  const [year, setYear] = useState(data.year || '');
  const [school, setSchool] = useState(data.school);
  const [showSchool, setShowSchool] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedStatus = academicStatuses.find(s => s.id === academicStatus);

  const handleStatusSelect = (statusId: string) => {
    setAcademicStatus(statusId);
    setShowSchool(true);
  };

  const handleContinue = () => {
    if (academicStatus) {
      onNext({ 
        academicStatus, 
        year: selectedStatus?.hasYear ? year : undefined,
        school: school || ''
      });
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <p className="text-sm text-primary font-semibold">Question 2 of 6</p>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Where are you in your academic journey?
        </h1>
        <p className="text-base text-muted-foreground">
          This helps us find the right opportunities for you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {academicStatuses.map((status) => {
          const Icon = status.icon;
          const isSelected = academicStatus === status.id;
          
          return (
            <Card
              key={status.id}
              className={`p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-elegant ${
                isSelected ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => handleStatusSelect(status.id)}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground">{status.label}</h3>
                  <p className="text-sm text-muted-foreground">{status.desc}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedStatus?.hasYear && academicStatus === 'undergraduate' && (
        <div className="max-w-md mx-auto animate-slide-up">
          <Label>Which year?</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select your year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="freshman">Freshman</SelectItem>
              <SelectItem value="sophomore">Sophomore</SelectItem>
              <SelectItem value="junior">Junior</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {showSchool && (
        <div className="max-w-md mx-auto space-y-4 animate-slide-up">
          <div className="space-y-2">
            <Label htmlFor="school" className="text-foreground font-medium">Which school do you attend? (Optional)</Label>
            <Input
              id="school"
              placeholder="e.g., University of California, Berkeley"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="text-foreground bg-background"
            />
            <p className="text-sm text-foreground/60">
              You can skip this if you prefer not to share
            </p>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleContinue}
            disabled={!academicStatus}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
};

export default Step2Academic;