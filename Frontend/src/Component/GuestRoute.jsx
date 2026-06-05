import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { getRedirectPath } from '../utils/roleRedirect';
import { consumePostAuthIntent } from '../utils/intentStore';

/**
 * Component: GuestRoute
 * Prevents authenticated users from accessing guest-only routes like /login or /register.
 *
 * Redirect priority for already-authenticated users:
 *  1. localStorage intent (set by LoginOverlay/GuestReportPage — survives browser refresh & OAuth)
 *  2. location.state?.from  (set via React Router state when navigating to /login)
 *  3. Role-based default (/dashboard for users, /admin for admins)
 *
 * This is the SINGLE place that handles post-auth redirect. LoginPage no longer
 * navigates on its own — it just calls login() and lets GuestRoute take over.
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
    // Consume localStorage intent (set by LoginOverlay / GuestReportPage).
    // This is the authoritative redirect — it takes precedence over everything else.
    const intent = consumePostAuthIntent();

    const defaultDest = getRedirectPath(user?.role) || '/dashboard';
    const stateFrom = location.state?.from;

    // Priority: localStorage intent > router state.from > role-based default
    const destination = intent?.path || (stateFrom && stateFrom !== '/' ? stateFrom : defaultDest);

    return <Navigate to={destination} replace state={{ action: intent?.action }} />;
  }

  return children;
};

export default GuestRoute;
