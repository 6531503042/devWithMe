import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, devMode, isInitialized } = useAuth();
  const location = useLocation();

  // Handle edge case where user might exist but needs authentication refresh
  useEffect(() => {
    if (user && !loading && isInitialized) {
      // Ensure the session is valid and refreshed
      const refreshSession = async () => {
        try {
          const { data } = await supabase.auth.getSession();
          
          if (!data.session) {
            console.log("Session not found, attempting to refresh");
            // Try to refresh token if needed
            const { data: refreshData, error } = await supabase.auth.refreshSession();
            
            if (error) {
              console.error("Error refreshing session:", error);
              // If refresh fails, redirect to login
              supabase.auth.signOut();
            } else if (refreshData.session) {
              console.log("Session refreshed successfully");
            }
          }
        } catch (error) {
          console.error("Error checking/refreshing session:", error);
        }
      };
      
      refreshSession();
    }
  }, [user, loading, isInitialized]);

  // Use a more lightweight loading indicator
  if (loading && !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-6 w-6 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mr-2"></div>
        <span className="text-sm text-muted-foreground">Verifying access...</span>
      </div>
    );
  }

  // Allow access in development mode even without authentication
  if (!user && !devMode && isInitialized) {
    // Save the location they were trying to go to for a redirect after login
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
