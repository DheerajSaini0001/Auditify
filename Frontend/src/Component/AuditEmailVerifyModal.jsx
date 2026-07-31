import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mail, ShieldCheck, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

/**
 * AuditEmailVerifyModal
 *
 * Replaces the math-CAPTCHA gate for guest (not-logged-in) audits. Two-step flow:
 *   1. Guest enters their email   -> POST /single-audit/request-otp  (emails a code)
 *   2. Guest enters the 6-digit OTP -> POST /single-audit/verify-otp (returns a grant token)
 * On success it calls onVerified(auditToken); the parent then starts the audit,
 * passing that token to /single-audit/audit instead of a CAPTCHA answer.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const postJSON = async (endpoint, body) => {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let data = {};
    try { data = await res.json(); } catch { /* empty body */ }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, error: err.message || 'Network error' };
  }
};

export default function AuditEmailVerifyModal({
  isOpen,
  onClose,
  onVerified,
  darkMode = false,
  isLoading = false,
}) {
  const [step, setStep] = useState('email');      // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);  // requesting a code
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [cooldown, setCooldown] = useState(0);     // seconds until resend allowed
  const cooldownRef = useRef(null);

  // Lock background scroll while open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Reset everything whenever the modal is closed so the next open starts clean.
  useEffect(() => {
    if (!isOpen) {
      setStep('email');
      setOtp('');
      setError('');
      setInfo('');
      setSending(false);
      setVerifying(false);
      setVerified(false);
      setCooldown(0);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    }
  }, [isOpen]);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const startCooldown = (secs) => {
    setCooldown(secs);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  if (!isOpen) return null;

  const requestCode = async () => {
    const e = email.trim().toLowerCase();
    setError('');
    setInfo('');
    if (!EMAIL_REGEX.test(e)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSending(true);
    try {
      const { ok, status, data, error: fetchErr } = await postJSON('/single-audit/request-otp', { email: e });
      setSending(false);

      if (ok) {
        setStep('otp');
        setOtp('');
        setInfo(`We sent a 6-digit code to ${e}.`);
        startCooldown(60);
      } else if (status === 429 && data?.retryAfter) {
        // A code was already sent recently — move them to entry and run the cooldown.
        setStep('otp');
        setInfo(`A code was already sent to ${e}. Check your inbox.`);
        startCooldown(data.retryAfter);
      } else {
        setError(fetchErr || data?.message || data?.error || 'Could not send the code. Please try again.');
      }
    } catch (err) {
      setSending(false);
      setError('Connection failed. Please check if the backend is running.');
    }
  };

  const verifyCode = async () => {
    const e = email.trim().toLowerCase();
    const code = otp.trim();
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setVerifying(true);
    try {
      const { ok, data, error: fetchErr } = await postJSON('/single-audit/verify-otp', { email: e, otp: code });
      setVerifying(false);

      if (ok && data?.auditToken) {
        setVerified(true);
        setInfo('Email verified — starting your audit…');
        // Brief success flash, then hand the grant back to the parent to run the audit.
        setTimeout(() => onVerified(data.auditToken), 650);
        return;
      }

      let msg = fetchErr || data?.message || data?.error || 'Invalid code. Please try again.';
      if (data && typeof data.attemptsLeft === 'number') msg += ` (${data.attemptsLeft} attempts left)`;
      setError(msg);
      // If the code is gone (expired / too many attempts), clear it so they resend.
      if (data && /expired|not found|new code|too many/i.test(data.message || '')) {
        setOtp('');
      }
    } catch (err) {
      setVerifying(false);
      setError('Connection failed. Please check if the backend is running.');
    }
  };

  const busy = sending || verifying || verified || isLoading;

  const panel = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={() => !busy && onClose?.()}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xl"
      />

      {/* Card */}
      <div
        className={`relative my-auto p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border shadow-2xl flex flex-col items-center gap-5 sm:gap-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200
          ${darkMode ? 'bg-slate-900 border-white/8 text-white' : 'bg-card border-line text-ink'}`}
      >
        <div className="w-16 h-16 rounded-2xl bg-[#ea580c] flex items-center justify-center shadow-xl shadow-orange-600/20 rotate-6">
          {verified ? <CheckCircle2 className="w-8 h-8 text-white" /> : step === 'otp' ? <ShieldCheck className="w-8 h-8 text-white" /> : <Mail className="w-8 h-8 text-white" />}
        </div>

        <div className="text-center space-y-2">
          <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-ink'}`}>
            {step === 'email' ? 'Verify your email' : 'Enter your code'}
          </h3>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
            {step === 'email'
              ? "We'll email you a quick 6-digit code, then your audit starts instantly."
              : `Enter the 6-digit code we sent${email ? ` to ${email}` : ''}.`}
          </p>
        </div>

        {/* ── STEP 1: EMAIL ── */}
        {step === 'email' && (
          <form
            onSubmit={(ev) => { ev.preventDefault(); requestCode(); }}
            className={`w-full rounded-2xl border p-5 space-y-4 ${darkMode ? 'bg-white/4 border-white/8' : 'bg-cardsoft border-line'}`}
          >
            <input
              type="email"
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="you@example.com"
              disabled={busy}
              className="w-full p-3 border border-line dark:border-slate-600 rounded-lg bg-card dark:bg-slate-800 text-ink dark:text-white outline-none focus:ring-2 focus:ring-[#ea580c] focus:border-[#ea580c] transition-all font-medium disabled:opacity-50"
            />

            {error && <p className="text-red-500 text-sm flex items-center gap-1.5"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</p>}

            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {sending ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : 'Send verification code'}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 'otp' && (
          <form
            onSubmit={(ev) => { ev.preventDefault(); verifyCode(); }}
            className={`w-full rounded-2xl border p-5 space-y-4 ${darkMode ? 'bg-white/4 border-white/8' : 'bg-cardsoft border-line'}`}
          >
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(ev) => setOtp(ev.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="• • • • • •"
              disabled={busy}
              className="w-full p-3 text-center text-2xl tracking-[0.5em] font-bold border border-line dark:border-slate-600 rounded-lg bg-card dark:bg-slate-800 text-ink dark:text-white outline-none focus:ring-2 focus:ring-[#ea580c] focus:border-[#ea580c] transition-all disabled:opacity-50"
            />

            {info && !error && <p className="text-emerald-500 text-sm flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{info}</p>}
            {error && <p className="text-red-500 text-sm flex items-center gap-1.5"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</p>}

            <button
              type="submit"
              disabled={busy || otp.length !== 6}
              className="w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {verified ? <><CheckCircle2 className="w-5 h-5" /> Verified</> : verifying ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying…</> : 'Verify & start audit'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setStep('email'); setError(''); setInfo(''); }}
                disabled={busy}
                className={`flex items-center gap-1 font-semibold transition-colors disabled:opacity-40 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-muted hover:text-ink'}`}
              >
                <ArrowLeft className="w-4 h-4" /> Change email
              </button>
              <button
                type="button"
                onClick={requestCode}
                disabled={busy || cooldown > 0}
                className="font-semibold text-[#ea580c] hover:text-[#c2410c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        <button
          onClick={() => !busy && onClose?.()}
          disabled={busy}
          className={`cursor-pointer text-[11px] font-semibold uppercase tracking-widest px-4 py-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-40
            ${darkMode ? 'text-slate-500 hover:text-orange-400 hover:bg-white/5' : 'text-faint hover:text-accent hover:bg-accentsoft'}`}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
