import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// Constants
const AUTH_STORAGE_KEY = 'supabase_auth_state';
const DEVELOPMENT_MODE = false; // Disable development mode to use real data

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  devMode: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  devMode: DEVELOPMENT_MODE,
  isInitialized: false
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children,
  requireAuth = false 
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Try to get session from localStorage first for faster initial render
    const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession?.user) {
          setUser(parsedSession.user);
          setSession(parsedSession);
        }
      } catch (e) {
        console.error('Failed to parse stored session:', e);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          navigate('/auth');
        }
        
        setLoading(false);
        setIsInitialized(true);
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
        } else if (requireAuth && !DEVELOPMENT_MODE && window.location.pathname !== '/auth') {
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error getting session:', error);
        toast({
          title: 'Authentication Error',
          description: 'There was a problem with your authentication session',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, requireAuth, toast]);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setSession(null);
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    signOut,
    devMode: DEVELOPMENT_MODE,
    isInitialized
  };

  if (loading && !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading session...</p>
        </div>
      </div>
    );
  }

  // In development mode, bypass the requireAuth check
  if (requireAuth && !session && !DEVELOPMENT_MODE) {
    return null; // Will redirect in the useEffect hook
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
