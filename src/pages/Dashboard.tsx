import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogOut, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back{user?.name ? `, ${user.name}` : ''}! 
            </h1>
            <p className="text-muted-foreground">Your scholarship dashboard is ready</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Card className="p-12 text-center">
          <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Dashboard Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your personalized scholarship matches, deadline tracking, and application management will appear here.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;