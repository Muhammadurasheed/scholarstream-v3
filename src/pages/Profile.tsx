import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  User, GraduationCap, FileText, Bell, Settings, 
  Upload, Download, Trash2, Eye, Award, Calendar,
  Shield, Mail, Lock, AlertTriangle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
  firstName: string;
  lastName: string;
  academicStatus: string;
  year?: string;
  school: string;
  gpa?: number;
  major: string;
  graduationYear: string;
  background: string[];
  financialNeed?: number;
  interests: string[];
  email?: string;
  phone?: string;
  testScores?: Record<string, number>;
  achievements?: string[];
}

interface NotificationPreferences {
  newMatches: boolean;
  deadlineReminders: boolean;
  statusUpdates: boolean;
  recommendationUpdates: boolean;
  weeklyDigest: boolean;
  tipsAndAdvice: boolean;
  productUpdates: boolean;
  reminderFrequency: 'realtime' | 'daily' | 'weekly';
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  fileSize: number;
  url: string;
  usedIn: string[];
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    newMatches: true,
    deadlineReminders: true,
    statusUpdates: true,
    recommendationUpdates: true,
    weeklyDigest: false,
    tipsAndAdvice: true,
    productUpdates: false,
    reminderFrequency: 'realtime',
  });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [profileStrength, setProfileStrength] = useState(0);

  useEffect(() => {
    loadUserData();
  }, [user]);

  useEffect(() => {
    calculateProfileStrength();
  }, [profile]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load profile
      const savedProfile = localStorage.getItem('scholarstream_profile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }

      // Load preferences from Firestore
      const prefsDoc = await getDoc(doc(db, 'users', user.uid, 'preferences', 'notifications'));
      if (prefsDoc.exists()) {
        setPreferences(prefsDoc.data() as NotificationPreferences);
      }

      // Load documents
      const docsDoc = await getDoc(doc(db, 'users', user.uid, 'documents', 'library'));
      if (docsDoc.exists()) {
        setDocuments(docsDoc.data().documents || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: 'Error Loading Profile',
        description: 'Some data may not be available',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileStrength = () => {
    if (!profile) return;
    
    let strength = 0;
    if (profile.firstName && profile.lastName) strength += 10;
    if (profile.school) strength += 15;
    if (profile.major) strength += 15;
    if (profile.gpa) strength += 10;
    if (profile.graduationYear) strength += 10;
    if (profile.background?.length > 0) strength += 10;
    if (profile.interests?.length > 0) strength += 10;
    if (profile.testScores && Object.keys(profile.testScores).length > 0) strength += 10;
    if (profile.achievements && profile.achievements.length > 0) strength += 10;
    
    setProfileStrength(strength);
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    try {
      localStorage.setItem('scholarstream_profile', JSON.stringify(profile));
      await setDoc(doc(db, 'users', user.uid, 'profile', 'data'), profile);
      
      toast({
        title: 'Profile Saved',
        description: 'Your changes have been saved successfully',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    
    try {
      await setDoc(doc(db, 'users', user.uid, 'preferences', 'notifications'), preferences);
      toast({
        title: 'Preferences Saved',
        description: 'Your notification preferences have been updated',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save preferences. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="flex gap-8">
            <div className="flex-1">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="w-80">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, preferences, and documents
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="w-4 h-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="account">
                  <Settings className="w-4 h-4 mr-2" />
                  Account
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Profile Information */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your basic information and contact details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profile?.firstName || ''}
                          onChange={(e) => setProfile(prev => prev ? {...prev, firstName: e.target.value} : null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profile?.lastName || ''}
                          onChange={(e) => setProfile(prev => prev ? {...prev, lastName: e.target.value} : null)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile?.email || user?.email || ''}
                          onChange={(e) => setProfile(prev => prev ? {...prev, email: e.target.value} : null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profile?.phone || ''}
                          onChange={(e) => setProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>

                    <Button onClick={saveProfile} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Academic Profile</CardTitle>
                    <CardDescription>
                      Keep your academic information up to date for better matches
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="school">School</Label>
                      <Input
                        id="school"
                        value={profile?.school || ''}
                        onChange={(e) => setProfile(prev => prev ? {...prev, school: e.target.value} : null)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="major">Major</Label>
                        <Input
                          id="major"
                          value={profile?.major || ''}
                          onChange={(e) => setProfile(prev => prev ? {...prev, major: e.target.value} : null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Academic Year</Label>
                        <Select
                          value={profile?.year || ''}
                          onValueChange={(value) => setProfile(prev => prev ? {...prev, year: value} : null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="freshman">Freshman</SelectItem>
                            <SelectItem value="sophomore">Sophomore</SelectItem>
                            <SelectItem value="junior">Junior</SelectItem>
                            <SelectItem value="senior">Senior</SelectItem>
                            <SelectItem value="graduate">Graduate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gpa">GPA</Label>
                        <Input
                          id="gpa"
                          type="number"
                          step="0.01"
                          min="0"
                          max="4.0"
                          value={profile?.gpa || ''}
                          onChange={(e) => setProfile(prev => prev ? {...prev, gpa: parseFloat(e.target.value)} : null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="graduation">Expected Graduation</Label>
                        <Input
                          id="graduation"
                          value={profile?.graduationYear || ''}
                          onChange={(e) => setProfile(prev => prev ? {...prev, graduationYear: e.target.value} : null)}
                          placeholder="May 2025"
                        />
                      </div>
                    </div>

                    <Button onClick={saveProfile} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Background & Interests</CardTitle>
                    <CardDescription>
                      This helps us find targeted scholarship opportunities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Background</Label>
                      <div className="flex flex-wrap gap-2">
                        {profile?.background?.map((bg, idx) => (
                          <Badge key={idx} variant="secondary">{bg}</Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Edit these in the onboarding flow
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Interests</Label>
                      <div className="flex flex-wrap gap-2">
                        {profile?.interests?.map((interest, idx) => (
                          <Badge key={idx} variant="outline">{interest}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="financialNeed">Financial Need (Annual)</Label>
                      <Input
                        id="financialNeed"
                        type="number"
                        value={profile?.financialNeed || ''}
                        onChange={(e) => setProfile(prev => prev ? {...prev, financialNeed: parseInt(e.target.value)} : null)}
                        placeholder="$50,000"
                      />
                    </div>

                    <Button onClick={saveProfile} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: Documents Library */}
              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents Library</CardTitle>
                    <CardDescription>
                      Manage your reusable documents for scholarship applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload New Document
                      </Button>

                      {documents.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-lg font-medium mb-2">No documents yet</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload documents to reuse them across applications
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {documents.map((doc) => (
                            <Card key={doc.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <div>
                                      <p className="font-medium">{doc.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {doc.type} • {(doc.fileSize / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                      <Download className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3: Notification Preferences */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>
                      Choose which emails you want to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>New Scholarship Matches</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when new scholarships match your profile
                        </p>
                      </div>
                      <Switch
                        checked={preferences.newMatches}
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({...prev, newMatches: checked}))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Deadline Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Reminders 7 days, 3 days, and 1 day before deadlines
                        </p>
                      </div>
                      <Switch
                        checked={preferences.deadlineReminders}
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({...prev, deadlineReminders: checked}))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Application Status Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Updates on your submitted applications
                        </p>
                      </div>
                      <Switch
                        checked={preferences.statusUpdates}
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({...prev, statusUpdates: checked}))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Recommendation Letters</Label>
                        <p className="text-sm text-muted-foreground">
                          When recommenders submit letters
                        </p>
                      </div>
                      <Switch
                        checked={preferences.recommendationUpdates}
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({...prev, recommendationUpdates: checked}))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Weekly Digest</Label>
                        <p className="text-sm text-muted-foreground">
                          Summary of opportunities and activity
                        </p>
                      </div>
                      <Switch
                        checked={preferences.weeklyDigest}
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({...prev, weeklyDigest: checked}))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Tips & Advice</Label>
                        <p className="text-sm text-muted-foreground">
                          Helpful tips for scholarship applications
                        </p>
                      </div>
                      <Switch
                        checked={preferences.tipsAndAdvice}
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({...prev, tipsAndAdvice: checked}))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>Notification Frequency</Label>
                      <Select
                        value={preferences.reminderFrequency}
                        onValueChange={(value: any) => 
                          setPreferences(prev => ({...prev, reminderFrequency: value}))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realtime">Real-time</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Summary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={savePreferences}>
                      Save Preferences
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 4: Account Settings */}
              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>
                      Manage your account security and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <div className="flex gap-2">
                        <Input value={user?.email || ''} disabled />
                        <Button variant="outline">
                          <Mail className="w-4 h-4 mr-2" />
                          Change
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Button variant="outline" className="w-full justify-start">
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Two-Factor Authentication</Label>
                      <Button variant="outline" className="w-full justify-start">
                        <Shield className="w-4 h-4 mr-2" />
                        Enable 2FA (Coming Soon)
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Privacy & Data</CardTitle>
                    <CardDescription>
                      Control your data and privacy settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Export My Data
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                      Irreversible account actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" className="w-full">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            {/* Profile Strength */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Strength</CardTitle>
                <CardDescription>
                  Complete profiles get 40% more matches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - profileStrength / 100)}`}
                        className="text-primary transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold">{profileStrength}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">To improve your score:</p>
                  {profileStrength < 100 && (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {!profile?.testScores && <p>• Add test scores (+10%)</p>}
                      {!profile?.achievements?.length && <p>• Add achievements (+10%)</p>}
                      {!profile?.phone && <p>• Add phone number (+5%)</p>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="font-medium">Oct 2024</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Applications</span>
                  <span className="font-medium">0</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Won</span>
                  <Badge variant="default" className="bg-success">
                    <Award className="w-3 h-3 mr-1" />
                    $0
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
