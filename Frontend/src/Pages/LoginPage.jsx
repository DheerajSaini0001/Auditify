import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { savePostAuthIntent } from '../utils/intentStore';
import Assets from '../assets/Assets.js';
import CaptchaModal from '../Component/CaptchaModal';
import './LoginPage.css';

// Note: post-auth redirect is handled by GuestRoute which wraps this page.

const LoginPage = () => {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0); 
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCaptchaModalOpen, setIsCaptchaModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { apiFetch, login } = useAuth();

  // NOTE: Post-login navigation is handled by GuestRoute (which wraps /login).
  // GuestRoute re-renders when isAuthenticated becomes true and redirects to the
  // correct destination (localStorage intent → state.from → role-based default).
  // Adding a navigate() here would cause a double-navigation race condition.


  const handleSubmit = (e) => {
    e.preventDefault();
    setIsCaptchaModalOpen(true);
  };

  const handleCaptchaVerify = async (verifiedAnswer, verifiedId) => {
    setCaptchaAnswer(verifiedAnswer);
    setCaptchaId(verifiedId);
    setIsCaptchaModalOpen(false);
    
    // Now perform the actual login
    performLogin(verifiedAnswer, verifiedId);
  };

  const performLogin = async (ans, id) => {

    setLoading(true);

    const { ok, data, status } = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, captchaAnswer: ans, captchaId: id }),
    });

    if (ok) {
      toast.success('Logged in successfully!');
      login(data.token, data.user);
    } else {
      if (status === 403) {
        toast.error(data.message);
        navigate('/verify-otp', { 
            state: { 
                email, 
                from: location.state?.from 
            } 
        });
      } else {
        toast.error(data.message || 'Invalid email or password');
        setCaptchaKey(prev => prev + 1);
        setCaptchaAnswer('');
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    // Check for pending intent from router state first (set by LoginOverlay/GuestReportPage)
    const stateFrom = location.state?.from;
    if (stateFrom) {
      // stateFrom is a path like /report/:id — we need to extract the auditId if possible
      // But we don't need the auditId specifically; intentStore just needs a path
      savePostAuthIntent('o_auth', stateFrom);
    }
    // If no state.from but there's already a stored intent (e.g. from a previous navigation
    // where localStorage was set but state was cleared by a refresh), don't overwrite it —
    // the stored intent will be consumed by AuthCallbackPage after OAuth completes.
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <div className={`login-page-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="bg-blob bg-blob-1"></div>
      <div className="bg-blob bg-blob-2"></div>

      <div className={`login-card ${darkMode ? 'dark' : 'light'}`}>
        <div className="login-header">
          <Link to="/">
            <img 
              src={darkMode ? Assets.Logo : Assets.DarkLogo} 
              alt="Dealer Pulse" 
              className="login-logo" 
            />
          </Link>
          <h1 className={`login-title ${darkMode ? 'text-white' : 'text-slate-900'}`}>Welcome Back</h1>
          <p className="login-subtitle">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                required
                className={`login-input ${darkMode ? 'dark' : 'light'}`}
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className={`login-input ${darkMode ? 'dark' : 'light'}`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-footer">
            <label className="remember-me">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
          </div>


          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="divider">
          <span>Or continue with</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="google-button"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
          <span>Google Account</span>
        </button>

        <p className="register-link">
          Don't have an account? 
          <Link to="/register" state={{ from: location.state?.from }}>Register Now</Link>
        </p>
      </div>

      {isCaptchaModalOpen && (
        <CaptchaModal 
          isOpen={isCaptchaModalOpen}
          onClose={() => setIsCaptchaModalOpen(false)}
          onVerify={handleCaptchaVerify}
          darkMode={darkMode}
          apiFetch={apiFetch}
          title="Security Check"
          description="Please solve the challenge to securely sign in to your account."
          buttonText="Verify & Sign In"
        />
      )}
    </div>
  );
};

export default LoginPage;
