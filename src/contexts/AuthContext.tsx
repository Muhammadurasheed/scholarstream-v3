import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  uid: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isOnboardingComplete: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('scholarstream_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string) => {
    // Mock sign up - in production, this would call Firebase
    const newUser: User = {
      uid: Math.random().toString(36).substring(7),
      email,
    };
    setUser(newUser);
    localStorage.setItem('scholarstream_user', JSON.stringify(newUser));
    localStorage.removeItem('scholarstream_onboarding'); // Clear any previous onboarding
  };

  const signIn = async (email: string, password: string) => {
    // Mock sign in - in production, this would call Firebase
    // For demo, we'll check if user exists
    if (password.length < 6) {
      throw new Error('Invalid credentials');
    }
    const existingUser: User = {
      uid: Math.random().toString(36).substring(7),
      email,
    };
    setUser(existingUser);
    localStorage.setItem('scholarstream_user', JSON.stringify(existingUser));
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('scholarstream_user');
  };

  const isOnboardingComplete = () => {
    return localStorage.getItem('scholarstream_onboarding_complete') === 'true';
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, isOnboardingComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};