import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { getRedirectPath } from '../utils/roleRedirect';

/**
 * Component: GuestRoute
 * Prevents authenticated users from accessing guest-only routes like /login or /register.
 * Redirects them to the dashboard or their previous intended destination.
 */
const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border-2 border-blue-500/20 animate-pulse"></div>
            <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-blue-500" size={32} />
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Verifying Session</p>
      </div>
    );
  }

  if (isAuthenticated) {
    // If user is already logged in, redirect them away from guest pages
    // Default to role-based dashboard, or fallback to /dashboard
    const defaultDest = getRedirectPath(user?.role) || '/dashboard';
    const from = location.state?.from || defaultDest;
    
    return <Navigate to={from} replace />;
  }

  return children;
};

export default GuestRoute;
