import React, { useState, useRef, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import MathCaptcha from '../Component/MathCaptcha';
import toast from 'react-hot-toast';

const Login = () => {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();


  const handleSubmit = async (e) => {
    if (!captchaAnswer) {
      toast.error('Please complete the CAPTCHA');
      return;
    }

    setLoading(true);
    const result = await login(email, password, captchaAnswer);

    if (result.success) {
      // Determine origin page, fallback based on role
      const origin = location.state?.from?.pathname || location.state?.from || null;
      
      if (origin && origin !== '/login') {
        navigate(origin);
      } else if (result.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0a0a10]' : 'bg-slate-50'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[100px] ${darkMode ? 'bg-blue-600/10' : 'bg-blue-400/20'}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[100px] ${darkMode ? 'bg-purple-600/10' : 'bg-purple-400/20'}`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md p-8 backdrop-blur-xl border rounded-3xl shadow-2xl z-10 transition-colors ${darkMode ? 'bg-[#16161e]/80 border-white/5' : 'bg-white/90 border-slate-200 shadow-slate-200/50'
          }`}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
            <LogIn className="text-white w-8 h-8" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Welcome Back</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Sign in to your DealerPulse account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-3 p-4 rounded-2xl text-sm ${darkMode
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-red-50 border border-red-200 text-red-600'
                }`}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-2">
            <label className={`text-sm font-medium ml-1 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type="email"
                required
                className={`w-full pl-12 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all ${darkMode
                    ? 'bg-[#1e1e26] border-white/5 text-white placeholder:text-gray-600'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  }`}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Password</label>
              <a href="#" className={`text-xs transition-colors ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}></a>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className={`w-full pl-12 pr-12 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all ${darkMode
                    ? 'bg-[#1e1e26] border-white/5 text-white placeholder:text-gray-600'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  }`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          <MathCaptcha onAnswerChange={setCaptchaAnswer} />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <LogIn size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className={`mt-8 text-center ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
          Don't have an account? {' '}
          <Link 
            to="/register" 
            state={{ from: location.state?.from }}
            className={`font-semibold transition-colors ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            Create Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
