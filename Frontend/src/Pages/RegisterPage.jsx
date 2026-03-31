import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { User, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { apiFetch } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (pass) => {
    return pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!validatePassword(formData.password)) {
      toast.error('Passsword must be at least 8 characters, include one uppercase and one digit.');
      return;
    }

    setLoading(true);
    const { ok, data } = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }),
    });

    if (ok) {
      toast.success(data.message);
      navigate('/verify-otp', { state: { email: formData.email } });
    } else {
      toast.error(data.message || 'Registration failed');
    }
    setLoading(false);
  };

  const passwordStrength = (pass) => {
    if (pass.length === 0) return 0;
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    return strength;
  };

  const strength = passwordStrength(formData.password);

  return (
    <div className={`min-h-screen flex flex-col justify-center transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 ${darkMode ? "bg-[#0a0a0f]" : "bg-gray-50"}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 rounded-3xl bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
            <span className="text-white text-3xl font-black italic">A</span>
          </div>
        </div>
        <h2 className={`text-center text-4xl font-black tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>Join Auditify</h2>
        <p className="mt-3 text-center text-gray-500 font-medium tracking-wide">Start your professional website auditing journey</p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`py-12 px-10 rounded-3xl shadow-xl border transition-colors ${darkMode ? "bg-[#11111a] border-white/5" : "bg-white border-gray-100"}`}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-bold"><User className="h-5 w-5" /></div>
              <input
                name="name"
                type="text"
                required
                className={`block w-full pl-12 pr-4 py-3.5 rounded-2xl transition-all font-medium placeholder:text-gray-500 outline-none border ${
                  darkMode 
                    ? "bg-white/5 border-white/5 focus:bg-white/10 focus:border-emerald-500/50 text-white" 
                    : "bg-gray-50 border-gray-100 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 text-gray-900"
                }`}
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-bold"><Mail className="h-5 w-5" /></div>
              <input
                name="email"
                type="email"
                required
                className={`block w-full pl-12 pr-4 py-3.5 rounded-2xl transition-all font-medium placeholder:text-gray-500 outline-none border ${
                  darkMode 
                    ? "bg-white/5 border-white/5 focus:bg-white/10 focus:border-emerald-500/50 text-white" 
                    : "bg-gray-50 border-gray-100 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 text-gray-900"
                }`}
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-bold"><Lock className="h-5 w-5" /></div>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className={`block w-full pl-12 pr-12 py-3.5 rounded-2xl transition-all font-medium placeholder:text-gray-500 outline-none border ${
                  darkMode 
                    ? "bg-white/5 border-white/5 focus:bg-white/10 focus:border-emerald-500/50 text-white" 
                    : "bg-gray-50 border-gray-100 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 text-gray-900"
                }`}
                placeholder="Password (8+ chars, 1 Uppercase, 1 Digit)"
                value={formData.password}
                onChange={handleChange}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="px-2 py-1">
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 rounded-full transition-all duration-500 ${
                        strength >= level
                          ? strength <= 2
                            ? 'bg-red-500'
                            : strength === 3
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          : darkMode ? "bg-white/10" : 'bg-gray-100'
                      }`}
                    ></div>
                  ))}
                </div>
                <p className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${
                  strength <= 2 ? 'text-red-500' : strength === 3 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {strength <= 1 ? 'Too Weak' : strength === 2 ? 'Weak' : strength === 3 ? 'Fair' : 'Strong'}
                </p>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-bold"><Lock className="h-5 w-5" /></div>
              <input
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                className={`block w-full pl-12 pr-4 py-3.5 rounded-2xl transition-all font-medium placeholder:text-gray-500 outline-none border ${
                  darkMode 
                    ? "bg-white/5 border-white/5 focus:bg-white/10 focus:border-emerald-500/50 text-white" 
                    : "bg-gray-50 border-gray-100 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 text-gray-900"
                }`}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
            </button>
          </form>

          <p className={`mt-8 text-center text-sm font-bold uppercase tracking-tighter ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-500 transition-colors ml-1 tracking-wider">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
