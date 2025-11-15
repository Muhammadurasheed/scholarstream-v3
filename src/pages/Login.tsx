import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, user, isOnboardingComplete } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  // Redirect if already logged in
  if (user) {
    const destination = isOnboardingComplete() ? '/dashboard' : '/onboarding';
    navigate(destination, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email) {
      setErrors({ ...errors, email: 'Email is required' });
      return;
    }
    if (!formData.password) {
      setErrors({ ...errors, password: 'Password is required' });
      return;
    }

    setLoading(true);
    try {
      await signIn(formData.email, formData.password);
      toast({
        title: 'Welcome back!',
        description: 'Successfully logged in',
      });
      
      // Check if onboarding is complete
      const destination = isOnboardingComplete() ? '/dashboard' : '/onboarding';
      navigate(destination);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Form Side */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          className="absolute top-4 left-4"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mx-auto w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
              ScholarStream
            </h1>
            <h2 className="text-2xl font-semibold mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Log in to continue your scholarship journey</p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrors({ ...errors, email: '' });
                  }}
                  className={errors.email ? 'border-destructive' : ''}
                  autoFocus
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      setErrors({ ...errors, password: '' });
                    }}
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, rememberMe: checked as boolean })
                  }
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground">
                  Remember me
                </label>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Benefits Side */}
      <div className="hidden lg:flex gradient-primary items-center justify-center p-12">
        <div className="max-w-md text-white">
          <Sparkles className="h-12 w-12 mb-6" />
          <h2 className="text-3xl font-bold mb-6">Welcome Back!</h2>
          <p className="text-lg mb-8 text-white/90">
            Continue tracking your scholarships and managing your applications
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <span className="text-lg">Access your personalized dashboard</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <span className="text-lg">Track application deadlines</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <span className="text-lg">Get AI essay assistance</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <span className="text-lg">Monitor your financial progress</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;