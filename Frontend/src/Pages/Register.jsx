import React, { useState, useRef, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { Mail, Lock, User, UserPlus, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const captchaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!captchaToken) {
      setError('Please complete the CAPTCHA');
      return;
    }

    setLoading(true);
    const result = await register(name, email, password, captchaToken);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setCaptchaToken(null);
      captchaRef.current?.reset();
    }
    setLoading(false);
  };

  const validatePassword = (pass) => {
    return {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      number: /[0-9]/.test(pass)
    };
  };

  const passwordReqs = validatePassword(password);

  return (
    <div className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0a0a10]' : 'bg-slate-50'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-[100px] ${darkMode ? 'bg-indigo-600/10' : 'bg-indigo-400/20'}`} />
        <div className={`absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full blur-[100px] ${darkMode ? 'bg-purple-600/10' : 'bg-purple-400/20'}`} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-lg p-8 backdrop-blur-xl border rounded-3xl shadow-2xl z-10 transition-colors ${
          darkMode ? 'bg-[#16161e]/80 border-white/5' : 'bg-white/90 border-slate-200 shadow-slate-200/50'
        }`}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/20">
            <UserPlus className="text-white w-8 h-8" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Create Account</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Join Auditify and start auditing smarter</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-3 p-4 rounded-2xl text-sm ${
                darkMode 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={`text-sm font-medium ml-1 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="text"
                  required
                  className={`w-full pl-12 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
                    darkMode 
                      ? 'bg-[#1e1e26] border-white/5 text-white placeholder:text-gray-600' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  }`}
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ml-1 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="email"
                  required
                  className={`w-full pl-12 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
                    darkMode 
                      ? 'bg-[#1e1e26] border-white/5 text-white placeholder:text-gray-600' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  }`}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ml-1 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                className={`w-full pl-12 pr-12 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
                  darkMode 
                    ? 'bg-[#1e1e26] border-white/5 text-white placeholder:text-gray-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-500 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 px-2 text-[11px]">
              <span className={`flex items-center gap-1 ${passwordReqs.length ? 'text-emerald-500' : (darkMode ? 'text-gray-500' : 'text-slate-400')}`}>
                <CheckCircle2 size={12} /> 8+ Characters
              </span>
              <span className={`flex items-center gap-1 ${passwordReqs.upper ? 'text-emerald-500' : (darkMode ? 'text-gray-500' : 'text-slate-400')}`}>
                <CheckCircle2 size={12} /> 1 Uppercase
              </span>
              <span className={`flex items-center gap-1 ${passwordReqs.number ? 'text-emerald-500' : (darkMode ? 'text-gray-500' : 'text-slate-400')}`}>
                <CheckCircle2 size={12} /> 1 Number
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ml-1 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className={`w-full pl-12 pr-12 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
                  darkMode 
                    ? 'bg-[#1e1e26] border-white/5 text-white placeholder:text-gray-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-500 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex justify-center py-2">
            <ReCAPTCHA
              ref={captchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
              theme={darkMode ? "dark" : "light"}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className={`mt-8 text-center ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
          Already have an account? {' '}
          <Link to="/login" className={`font-semibold transition-colors ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
