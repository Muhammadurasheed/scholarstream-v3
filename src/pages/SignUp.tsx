import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Sparkles } from 'lucide-react';

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    terms: '',
  });

  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasLowercase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
  };

  const passwordStrength = Object.values(passwordRequirements).filter(Boolean).length;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!passwordRequirements.hasUppercase) return 'Password must include an uppercase letter';
    if (!passwordRequirements.hasLowercase) return 'Password must include a lowercase letter';
    if (!passwordRequirements.hasNumber) return 'Password must include a number';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = formData.password !== formData.confirmPassword ? 'Passwords do not match' : '';
    const termsError = !formData.agreeToTerms ? 'You must agree to continue' : '';

    setErrors({
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      terms: termsError,
    });

    if (emailError || passwordError || confirmPasswordError || termsError) {
      return;
    }

    setLoading(true);
    try {
      await signUp(formData.email, formData.password);
      toast({
        title: 'Account created!',
        description: 'Welcome to ScholarStream',
      });
      navigate('/onboarding');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
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
            <h2 className="text-2xl font-semibold mb-2">Start Finding Your Scholarships</h2>
            <p className="text-muted-foreground">Create your free account in 2 minutes</p>
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
                  onBlur={(e) => setErrors({ ...errors, email: validateEmail(e.target.value) })}
                  className={errors.email ? 'border-destructive' : formData.email && !errors.email ? 'border-success' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                {!errors.email && formData.email && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    We recommend using your .edu email for student verification
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Create Password</Label>
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
                
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            passwordStrength >= level
                              ? passwordStrength === 2
                                ? 'bg-warning'
                                : passwordStrength >= 3
                                ? 'bg-success'
                                : 'bg-destructive'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className={passwordRequirements.minLength ? 'text-success' : 'text-muted-foreground'}>
                        {passwordRequirements.minLength ? '✓' : '✗'} At least 8 characters
                      </p>
                      <p className={passwordRequirements.hasUppercase ? 'text-success' : 'text-muted-foreground'}>
                        {passwordRequirements.hasUppercase ? '✓' : '✗'} Uppercase letter
                      </p>
                      <p className={passwordRequirements.hasLowercase ? 'text-success' : 'text-muted-foreground'}>
                        {passwordRequirements.hasLowercase ? '✓' : '✗'} Lowercase letter
                      </p>
                      <p className={passwordRequirements.hasNumber ? 'text-success' : 'text-muted-foreground'}>
                        {passwordRequirements.hasNumber ? '✓' : '✗'} Number
                      </p>
                    </div>
                  </div>
                )}
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      setErrors({ ...errors, confirmPassword: '' });
                    }}
                    className={errors.confirmPassword ? 'border-destructive' : formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-success' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>

              {/* Terms */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, agreeToTerms: checked as boolean });
                      setErrors({ ...errors, terms: '' });
                    }}
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                    I agree to the{' '}
                    <a href="#" className="text-primary hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </label>
                </div>
                {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Benefits Side */}
      <div className="hidden lg:flex gradient-primary items-center justify-center p-12">
        <div className="max-w-md text-white">
          <Sparkles className="h-12 w-12 mb-6" />
          <h2 className="text-3xl font-bold mb-6">Join 2,000+ Students</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <span className="text-lg">Find scholarships worth $100K+</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <span className="text-lg">AI-powered essay assistance</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <span className="text-lg">Never miss a deadline</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <span className="text-lg">Track all applications in one place</span>
            </li>
          </ul>
          <Card className="mt-8 p-6 bg-white/10 backdrop-blur-sm border-white/20">
            <p className="text-white/90 italic mb-4">
              "ScholarStream helped me find $15,000 in scholarships I never knew existed"
            </p>
            <p className="text-white/80 text-sm font-medium">Sarah M., UC Berkeley</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SignUp;