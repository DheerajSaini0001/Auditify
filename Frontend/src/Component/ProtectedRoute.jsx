import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Component: ProtectedRoute
 * Guards routes from unauthenticated access. 
 * Shows a premium loading spinner while auth state is resolving.
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617]">
        <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-violet-600/10 border-2 border-violet-500/20 animate-pulse"></div>
            <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-violet-500" size={32} />
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Validating Access</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Multi-role compatibility: super_admin can access admin routes
  if (requiredRole) {
    if (requiredRole === 'admin' && (user?.role !== 'admin' && user?.role !== 'super_admin')) {
      return <Navigate to="/dashboard" replace />;
    }
    if (requiredRole === 'super_admin' && user?.role !== 'super_admin') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
