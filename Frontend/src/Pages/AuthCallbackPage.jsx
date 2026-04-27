import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { consumePostAuthIntent } from '../utils/intentStore';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const hasProcessed = React.useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    // 5.4 Read token from hash fragment or query params
    const hash = window.location.hash;
    const query = window.location.search;
    
    let token = new URLSearchParams(hash.replace('#', '')).get('token');
    if (!token) {
      token = new URLSearchParams(query).get('token');
    }

    console.log('[Auth Callback] Processing URL...');
    console.log('[Auth Callback] Hash present:', !!hash);
    console.log('[Auth Callback] Query present:', !!query);
    console.log('[Auth Callback] Token found:', !!token);

    if (token) {
      toast.success('Successfully authenticated with Google!');
      login(token);
      
      const intent = consumePostAuthIntent();
      
      const hasGuestData = !!localStorage.getItem("dealerpulse_guest_data");
      const guestFallback = hasGuestData ? "/report" : "/dashboard";
      
      const destination = intent?.path || guestFallback;
      navigate(destination, { 
          replace: true,
          state: { 
              action: intent?.action 
          }
      });
    } else {
      console.warn('[Auth Callback] No token found in current URL:', window.location.href);
      toast.error('Authentication failed. No token found.');
      navigate('/login');
    }
  }, [navigate, login]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="h-20 w-20 rounded-[32px] bg-violet-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 rotate-12">
            <span className="text-white text-4xl font-black italic">D</span>
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin text-violet-500" size={24} />
          <h2 className="text-2xl font-black tracking-widest uppercase">Authenticating...</h2>
        </div>
        <p className="text-gray-500 font-bold text-sm tracking-widest">CONNECTING TO YOUR SECURE DASHBOARD</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
