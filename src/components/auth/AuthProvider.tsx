import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// Constants
const AUTH_STORAGE_KEY = 'supabase_auth_state';
const DEVELOPMENT_MODE = false; // Disable development mode to use real data
const AUTH_STATE_VERSION = 'v1'; // Used to invalidate stored auth state when format changes

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
  const location = useLocation();
  const { toast } = useToast();

  // Authentication setup - runs once on mount
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
    // Try to get session from localStorage first for faster initial render
        const storedData = localStorage.getItem(AUTH_STORAGE_KEY);
        let initialStateLoaded = false;
        
        if (storedData) {
      try {
            const { version, data } = JSON.parse(storedData);
            
            // Only use cached data if version matches
            if (version === AUTH_STATE_VERSION && data?.user) {
              setUser(data.user);
              setSession(data);
              initialStateLoaded = true;
            } else {
              // Clear outdated data
              localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to parse stored session:', e);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

        // Setup auth change subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!mounted) return;
            
            console.log(`Auth event: ${event}`);
            
            // Accept any valid session regardless of email verification
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              if (currentSession) {
          setSession(currentSession);
                setUser(currentSession.user ?? null);
                
                // Store with version to allow future format changes
                localStorage.setItem(
                  AUTH_STORAGE_KEY, 
                  JSON.stringify({
                    version: AUTH_STATE_VERSION,
                    data: currentSession
                  })
                );
                
                setLoading(false);
                setIsInitialized(true);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
              // Only redirect to auth if we're not already there
              if (location.pathname !== '/auth') {
                navigate('/auth', { replace: true });
        }
              setLoading(false);
              setIsInitialized(true);
            } else if (event === 'INITIAL_SESSION') {
              // For cases when the provider first loads
              if (currentSession) {
                setSession(currentSession);
                setUser(currentSession.user);
                localStorage.setItem(
                  AUTH_STORAGE_KEY, 
                  JSON.stringify({
                    version: AUTH_STATE_VERSION,
                    data: currentSession
                  })
                );
              }
        setLoading(false);
        setIsInitialized(true);
            }
      }
    );

        // If we didn't load from cache, get session from API
        if (!initialStateLoaded) {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (!mounted) return;
        
        if (error) {
          throw error;
        }
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
            localStorage.setItem(
              AUTH_STORAGE_KEY, 
              JSON.stringify({
                version: AUTH_STATE_VERSION,
                data: currentSession
              })
            );
          } else if (requireAuth && !DEVELOPMENT_MODE && location.pathname !== '/auth') {
            navigate('/auth', { replace: true });
        }
        }
        
        // Set loading to false even if there's no session
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
        
        // Return the cleanup function directly
        return subscription.unsubscribe;
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
        toast({
          title: 'Authentication Error',
          description: 'There was a problem with your authentication session',
          variant: 'destructive'
        });
        setLoading(false);
        setIsInitialized(true);
        }
        // Return empty function for cleanup when there's an error
        return () => {};
      }
    };

    // Execute the init function and store the cleanup
    const unsubscribe = initAuth();

    // Return cleanup function
    return () => {
      mounted = false;
      // No need to check if it's a function since we're ensuring both
      // success and error paths return functions
      unsubscribe.then(cleanupFn => cleanupFn());
    };
  }, [navigate, requireAuth, toast, location.pathname]);

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
      navigate('/auth', { replace: true });
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

  // Using a simpler loading indicator that doesn't take over the whole UI
  // This prevents "stuck" loading states when switching routes
  if (loading && !isInitialized) {
    return (
      <div className="flex items-center justify-center fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  // In development mode, bypass the requireAuth check
  if (requireAuth && !user && !DEVELOPMENT_MODE && isInitialized) {
    if (location.pathname !== '/auth') {
      navigate('/auth', { replace: true });
    }
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
