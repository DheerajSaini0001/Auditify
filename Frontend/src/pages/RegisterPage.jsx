import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { User, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Assets from '../assets/Assets.js';
import brandingBg from '../assets/brand/auth-branding.png';
import './RegisterPage.css';

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
  const location = useLocation();
  const { apiFetch } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (pass) => {
    return pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!validatePassword(formData.password)) {
      toast.error('Password must be at least 8 characters, include one uppercase and one digit.');
      return;
    }

    performRegistration();
  };

  const performRegistration = async () => {
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
      navigate('/verify-otp', {
        state: {
          email: formData.email,
          from: location.state?.from
        }
      });
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
    <div className={`register-page-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="bg-blob bg-blob-1"></div>
      <div className="bg-blob bg-blob-2"></div>

      <div className={`register-wrapper ${darkMode ? 'dark' : 'light'}`}>
        {/* Left Side: Branding */}
        <div className="register-branding">
          {/* Was pointing at an absolute path on a developer's machine, so it 404'd
              in every build. Now a bundled brand asset. */}
          <img
            src={brandingBg}
            alt=""
            aria-hidden="true"
            className="branding-image-bg"
          />
          <div className="branding-overlay"></div>
          <div className="branding-content">
            <Link to="/">
              {/* Assets.Logo is already the white-on-dark lockup, so no invert filter
                  — that would flatten the orange growth mark to white. */}
              <img src={Assets.Logo} alt="Site Audit" className="h-12 w-auto mb-10" />
            </Link>
            <h1 className="branding-title">Start Your Journey with Site Audit</h1>
            <p className="branding-subtitle">
              Join thousands of professionals who use Site Audit to optimize, secure, and scale their web presence with AI-driven insights.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="register-form-container">
          <div className="form-header">
            <h2 className={`form-title ${darkMode ? 'text-white' : 'text-ink'}`}>Create Account</h2>
            <p className="form-subtitle">Fill in the details to get started</p>
          </div>

          <form className="register-form" onSubmit={handleSubmit} autoComplete="off">
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div className="input-field-wrapper">
                <input
                  name="name"
                  type="text"
                  required
                  autoComplete="off"
                  className={`register-input ${darkMode ? 'dark' : 'light'}`}
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <User className="input-field-icon" size={18} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div className="input-field-wrapper">
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="off"
                  className={`register-input ${darkMode ? 'dark' : 'light'}`}
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Mail className="input-field-icon" size={18} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-field-wrapper">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className={`register-input ${darkMode ? 'dark' : 'light'}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <Lock className="input-field-icon" size={18} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-faint hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {formData.password && (
                <div className="mt-2 px-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`flex-1 rounded-full transition-all duration-500 ${strength >= level
                          ? strength <= 2 ? 'bg-rose-500' : strength === 3 ? 'bg-amber-500' : 'bg-emerald-500'
                          : darkMode ? "bg-white/10" : 'bg-cardsoft'
                          }`}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <div className="input-field-wrapper">
                <input
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className={`register-input ${darkMode ? 'dark' : 'light'}`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <Lock className="input-field-icon" size={18} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="register-submit-button"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="login-redirect">
            Already have an account?
            <Link to="/login" state={{ from: location.state?.from }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
