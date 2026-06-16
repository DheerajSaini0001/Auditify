import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { Mail, ArrowLeft, Send, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import CaptchaModal from '../Component/CaptchaModal';

const ForgotPasswordPage = () => {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const [email, setEmail] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCaptchaModalOpen, setIsCaptchaModalOpen] = useState(false);
  const { apiFetch } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setIsCaptchaModalOpen(true);
  };

  const handleCaptchaVerify = async (ans, id) => {
    setCaptchaAnswer(ans);
    setCaptchaId(id);
    setIsCaptchaModalOpen(false);

    // Now perform the actual forgot password initiation
    performForgotPassword(ans, id);
  };

  const performForgotPassword = async (ans, id) => {
    setLoading(true);

    try {
      const { ok, data } = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email, captchaAnswer: ans, captchaId: id }),
      });

      if (!ok) {
        if (data.error && data.error.includes('CAPTCHA')) {
          toast.error(data.error);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error('Request failed:', err);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-card p-10 rounded-2xl shadow-xl border border-line text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-ink tracking-tight">Check your inbox</h2>
          <p className="mt-4 text-muted leading-relaxed">
            If an account exists for <span className="font-semibold text-ink">{email}</span>, we've sent a password reset link.
          </p>
          <div className="mt-8 pt-6 border-t border-line">
            <Link to="/login" className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-500 transition-colors uppercase tracking-[0.2em]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-card p-10 rounded-2xl shadow-xl border border-line">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-accentsoft text-accent mb-6">
            <Send className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-black text-ink tracking-tight">Forgot Password?</h2>
          <p className="mt-2 text-sm text-muted font-medium tracking-wide">
            No worries! Just enter your email and we'll send a reset link.
          </p>
        </div>

        <form className="mt-7 space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-faint" />
            </div>
            <input
              type="email"
              required
              className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-cardsoft border-line focus:bg-card focus:border-accent focus:ring-accent outline-none transition-all placeholder:text-faint font-medium text-ink"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-4 px-4 rounded-2xl font-semibold text-white bg-accent hover:bg-accenthover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 transition-all shadow-lg shadow-accent/20 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Send Reset Link'}
          </button>

          <div className="text-center">
            <Link to="/login" className="inline-flex items-center text-sm font-semibold text-faint hover:text-muted transition-colors uppercase tracking-[0.2em] hover:scale-105 active:scale-95 duration-200">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Login
            </Link>
          </div>
        </form>
      </div>

      {isCaptchaModalOpen && (
        <CaptchaModal
          isOpen={isCaptchaModalOpen}
          onClose={() => setIsCaptchaModalOpen(false)}
          onVerify={handleCaptchaVerify}
          darkMode={darkMode}
          apiFetch={apiFetch}
          title="Security Verification"
          description="Please solve the challenge to securely reset your password."
          buttonText="Verify & Send Link"
        />
      )}
    </div>
  );
};

export default ForgotPasswordPage;
