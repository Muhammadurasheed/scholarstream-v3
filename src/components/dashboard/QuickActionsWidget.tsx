import { User, FileText, Mail, Bell, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  variant?: 'default' | 'outline';
}

export const QuickActionsWidget = () => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: 'profile',
      icon: User,
      title: 'Complete Profile',
      description: 'Add GPA to find more scholarships',
      action: 'Update Profile',
      variant: 'default',
    },
    {
      id: 'documents',
      icon: FileText,
      title: 'Upload Documents',
      description: 'Transcript needed for 12 scholarships',
      action: 'Upload',
      variant: 'outline',
    },
    {
      id: 'recommendations',
      icon: Mail,
      title: 'Request Recommendations',
      description: '5 scholarships need letters',
      action: 'Request Now',
      variant: 'outline',
    },
    {
      id: 'reminders',
      icon: Bell,
      title: 'Set Up Reminders',
      description: 'Enable email reminders for deadlines',
      action: 'Enable',
      variant: 'outline',
    },
  ];

  const handleAction = (actionId: string) => {
    switch (actionId) {
      case 'profile':
        navigate('/profile');
        break;
      case 'documents':
      case 'recommendations':
      case 'reminders':
        // These would open specific modals or navigate to relevant pages
        console.log(`Action: ${actionId}`);
        break;
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
            >
              <div className="shrink-0 mt-0.5">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-sm mb-0.5">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
              <Button
                variant={action.variant}
                size="sm"
                className="shrink-0"
                onClick={() => handleAction(action.id)}
              >
                <span className="hidden sm:inline">{action.action}</span>
                <ChevronRight className="h-4 w-4 sm:hidden" />
              </Button>
            </div>
          );
        })}
      </div>
      <Button variant="ghost" className="w-full mt-4" size="sm">
        See All Tasks
      </Button>
    </Card>
  );
};
