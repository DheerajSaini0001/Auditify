import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Component: PublicRoute
 * Prevents authenticated users from accessing login/register pages.
 * Redirects them to the dashboard if they are already logged in.
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border-2 border-blue-500/20 animate-pulse"></div>
            <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-blue-500" size={32} />
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Checking Session</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
