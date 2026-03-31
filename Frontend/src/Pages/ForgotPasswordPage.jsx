import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { apiFetch } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Always show success to prevent enumeration (SRS 4.4.5 requirement)
    try {
        await apiFetch('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    } catch (err) {
        console.error('Request failed:', err);
    } finally {
        setLoading(false);
        setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Check your inbox</h2>
          <p className="mt-4 text-gray-500 leading-relaxed">
            If an account exists for <span className="font-semibold text-gray-900">{email}</span>, we've sent a password reset link.
          </p>
          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link to="/login" className="inline-flex items-center text-sm font-bold text-emerald-600 hover:text-emerald-500 transition-colors uppercase tracking-[0.2em]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 text-blue-600 mb-6">
                <Send className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Forgot Password?</h2>
            <p className="mt-2 text-sm text-gray-500 font-medium tracking-wide">
                No worries! Just enter your email and we'll send a reset link.
            </p>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              required
              className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-4 px-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="text-center">
            <Link to="/login" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-[0.2em] hover:scale-105 active:scale-95 duration-200">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
