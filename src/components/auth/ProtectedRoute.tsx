import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, devMode, isInitialized } = useAuth();
  const location = useLocation();

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
