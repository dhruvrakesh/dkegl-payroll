import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Admin emails that should always bypass approval checks
const ADMIN_EMAILS = ['info@dkenterprises.co.in', 'info@satguruengravures.com'];

interface Profile {
  id: string;
  email: string;
  employee_id?: string | null;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  is_approved: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Profile fetching function with retry logic and admin bypass
  const fetchProfile = useCallback(async (userId: string, retryCount = 0): Promise<Profile | null> => {
    const maxRetries = 3;
    
    try {
      setError(null);
      console.log(`Fetching profile for user ${userId}, attempt ${retryCount + 1}`);
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        
        // For specific errors, retry with exponential backoff
        if (retryCount < maxRetries && (
          error.code === '42P17' || // infinite recursion
          error.message?.includes('policy') ||
          error.message?.includes('recursion')
        )) {
          console.log(`Retrying profile fetch in ${Math.pow(2, retryCount)} seconds...`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return fetchProfile(userId, retryCount + 1);
        }
        
        setError(`Profile fetch error: ${error.message}`);
        return null;
      }
      
      if (profileData) {
        const typedProfile: Profile = {
          ...profileData,
          role: profileData.role as 'admin' | 'hr' | 'manager' | 'employee'
        };
        console.log('Profile fetched successfully:', typedProfile);
        setProfile(typedProfile);
        return typedProfile;
      }
      
      console.log('No profile data found for user');
      return null;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      
      // Retry on unexpected errors
      if (retryCount < maxRetries) {
        console.log(`Retrying profile fetch due to unexpected error in ${Math.pow(2, retryCount)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return fetchProfile(userId, retryCount + 1);
      }
      
      setError('Unexpected error fetching profile');
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    // Set up auth state listener with enhanced error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        setError(null);
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing all state');
          setProfile(null);
          setLoading(false);
          // Clear any cached data
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
          return;
        }
        
        if (session?.user) {
          // Check if this is an admin user for bypass logic
          const isAdminEmail = ADMIN_EMAILS.includes(session.user.email || '');
          console.log('Is admin email:', isAdminEmail, session.user.email);
          
          // Defer profile fetching to avoid recursion
          setTimeout(async () => {
            try {
              const profile = await fetchProfile(session.user.id);
              
              // Admin bypass: If no profile found but user is admin, create a temporary profile
              if (!profile && isAdminEmail) {
                console.log('Admin user detected, applying bypass logic');
                const adminProfile: Profile = {
                  id: session.user.id,
                  email: session.user.email || '',
                  employee_id: null,
                  role: 'admin',
                  is_approved: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                setProfile(adminProfile);
              }
            } catch (profileError) {
              console.error('Profile fetch failed:', profileError);
              
              // Admin bypass on profile fetch failure
              if (isAdminEmail) {
                console.log('Profile fetch failed for admin, using bypass profile');
                const adminProfile: Profile = {
                  id: session.user.id,
                  email: session.user.email || '',
                  employee_id: null,
                  role: 'admin',
                  is_approved: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                setProfile(adminProfile);
              }
            } finally {
              setLoading(false);
            }
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session with error handling
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        // Clear invalid session data
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    }).catch(async (error) => {
      console.error('Session check failed:', error);
      // Clear all auth state on session check failure
      await supabase.auth.signOut();
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Clear any existing invalid tokens first
      await supabase.auth.signOut();
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return { error };
      }

      // For admin users, show success message
      if (ADMIN_EMAILS.includes(email)) {
        toast({
          title: "Welcome Admin",
          description: "Logged in successfully with admin privileges.",
        });
      }

      return { error: null };
    } catch (unexpectedError) {
      console.error('Unexpected sign in error:', unexpectedError);
      setLoading(false);
      const error = { message: 'An unexpected error occurred during sign in' };
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: string = 'employee') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role,
        }
      }
    });

    if (error) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signup Successful",
        description: "Please check your email to confirm your account.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const hasRole = (role: string): boolean => {
    return profile?.role === role || false;
  };

  const isAdmin = (): boolean => {
    // Admin bypass: Check email first for immediate admin access
    const isAdminEmail = ADMIN_EMAILS.includes(user?.email || '');
    return profile?.role === 'admin' || isAdminEmail || false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      hasRole,
      isAdmin,
      refreshProfile,
    }}>
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
