import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { consumePostAuthIntent } from '../utils/intentStore';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // 5.4 Read token from hash fragment (#token=...)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const token = params.get('token');

    if (token) {
      toast.success('Successfully authenticated with Google!');
      login(token);
      
      const intent = consumePostAuthIntent();
      
      const hasGuestData = !!localStorage.getItem("auditify_guest_data");
      const guestFallback = hasGuestData ? "/report" : "/dashboard";
      
      const destination = intent?.path || guestFallback;
      navigate(destination, { replace: true });
    } else {
      toast.error('Authentication failed. No token found.');
      navigate('/login');
    }
  }, [navigate, login]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-white">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="h-20 w-20 rounded-[32px] bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 rotate-12">
            <span className="text-white text-4xl font-black italic">A</span>
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin text-blue-500" size={24} />
          <h2 className="text-2xl font-black tracking-widest uppercase">Authenticating...</h2>
        </div>
        <p className="text-gray-500 font-bold text-sm tracking-widest">CONNECTING TO YOUR SECURE DASHBOARD</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
