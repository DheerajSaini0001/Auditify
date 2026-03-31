import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { apiFetch, login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { ok, data, status } = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (ok) {
      toast.success('Logged in successfully!');
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      if (status === 403) {
        // Unverified email
        toast.error(data.message);
        navigate('/verify-otp', { state: { email } });
      } else {
        toast.error(data.message || 'Invalid email or password');
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 ${darkMode ? "bg-[#0a0a0f]" : "bg-gray-50"}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
            <span className="text-white text-3xl font-black italic">A</span>
          </div>
        </div>
        <h2 className={`text-center text-4xl font-black tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>Welcome Back</h2>
        <p className="mt-3 text-center text-gray-500 font-medium tracking-wide">Enter your details to access your account</p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`py-12 px-10 rounded-3xl shadow-xl border transition-colors ${darkMode ? "bg-[#11111a] border-white/5" : "bg-white border-gray-100"}`}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-bold"><Mail className="h-5 w-5" /></div>
              <input
                type="email"
                required
                className={`block w-full pl-12 pr-4 py-4 rounded-2xl transition-all font-medium placeholder:text-gray-500 outline-none border ${
                  darkMode 
                    ? "bg-white/5 border-white/5 focus:bg-white/10 focus:border-blue-500/50 text-white" 
                    : "bg-gray-50 border-gray-100 focus:bg-white focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                }`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-bold"><Lock className="h-5 w-5" /></div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className={`block w-full pl-12 pr-12 py-4 rounded-2xl transition-all font-medium placeholder:text-gray-500 outline-none border ${
                  darkMode 
                    ? "bg-white/5 border-white/5 focus:bg-white/10 focus:border-blue-500/50 text-white" 
                    : "bg-gray-50 border-gray-100 focus:bg-white focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                }`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" name="Forgot password?" className={`text-sm font-bold transition-colors ${darkMode ? "text-gray-500 hover:text-blue-500" : "text-gray-400 hover:text-blue-600"}`}>Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${darkMode ? "border-white/5" : "border-gray-100"}`}></div></div>
              <div className={`relative flex justify-center text-xs uppercase tracking-widest font-black px-4 ${darkMode ? "bg-[#11111a] text-gray-600" : "bg-white text-gray-300"}`}>Or continue with</div>
            </div>

            <div className="mt-8">
              <button
                onClick={handleGoogleLogin}
                className={`w-full flex items-center justify-center gap-3 py-4 border rounded-2xl font-bold transition-all active:scale-[0.98] ${
                  darkMode ? "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10" : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200"
                }`}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                Google Account
              </button>
            </div>
          </div>
          
          <p className="mt-10 text-center text-sm font-bold text-gray-500 uppercase tracking-tighter">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-500 transition-colors ml-1 tracking-wider">Register Now</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
