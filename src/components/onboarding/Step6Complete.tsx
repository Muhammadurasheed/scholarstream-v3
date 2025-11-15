import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OnboardingData } from '@/pages/Onboarding';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface Step6Props {
  data: OnboardingData;
  onComplete: () => void;
}

const Step6Complete: React.FC<Step6Props> = ({ data, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing your profile...');

  useEffect(() => {
    // Simulate backend processing with loading messages
    const messages = [
      'Analyzing your profile...',
      'Searching scholarship databases...',
      'Running AI matching algorithm...',
      'Prioritizing your opportunities...',
    ];

    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex++;
      if (messageIndex < messages.length) {
        setLoadingMessage(messages[messageIndex]);
      } else {
        setLoading(false);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-scale-in text-center">
      {/* Confetti effect (CSS-based) */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-32 w-32 rounded-full bg-success/20 animate-ping"></div>
        </div>
        <CheckCircle2 className="h-24 w-24 text-success mx-auto relative z-10" />
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold">
          You're all set, {data.firstName}! 🎉
        </h1>
        {loading ? (
          <p className="text-lg text-muted-foreground animate-pulse">
            {loadingMessage}
          </p>
        ) : (
          <p className="text-lg text-success">
            ✓ Profile complete! Your scholarships are ready.
          </p>
        )}
      </div>

      {!loading && (
        <Card className="max-w-2xl mx-auto p-6 text-left animate-slide-up">
          <h3 className="text-xl font-semibold mb-4">Profile Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{data.firstName} {data.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Academic Status:</span>
              <span className="font-medium capitalize">
                {data.academicStatus.replace('-', ' ')}
                {data.year && ` (${data.year})`}
              </span>
            </div>
            {data.school && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">School:</span>
                <span className="font-medium">{data.school}</span>
              </div>
            )}
            {data.major && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Major:</span>
                <span className="font-medium">{data.major}</span>
              </div>
            )}
            {data.gpa && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">GPA:</span>
                <span className="font-medium">{data.gpa.toFixed(1)}</span>
              </div>
            )}
            {data.interests.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interests:</span>
                <span className="font-medium">{data.interests.slice(0, 3).join(', ')}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {!loading && (
        <Card className="max-w-2xl mx-auto p-6 bg-primary/5 border-primary/20 animate-slide-up">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-3">What Happens Next?</h3>
          <ul className="space-y-2 text-sm text-left">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <span>We've matched you with personalized scholarships</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <span>Your dashboard is ready with deadlines and priorities</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <span>AI assistant is standing by to help with applications</span>
            </li>
          </ul>
        </Card>
      )}

      <Button
        size="lg"
        className="animate-pulse-glow"
        onClick={onComplete}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'See My Opportunities'}
      </Button>
    </div>
  );
};

export default Step6Complete;