import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2, RotateCw } from 'lucide-react';

/**
 * AuditVerifyModal
 *
 * The bot speed bump in front of guest (not-logged-in) audits: one single-digit
 * addition, nothing else.
 *   1. GET  /single-audit/captcha        -> { question: "3 + 4", challenge }
 *   2. POST /single-audit/verify-captcha -> { auditToken }
 * On success it calls onVerified(auditToken); the parent stores that grant (see
 * utils/guestGrant.js) and starts the audit with it.
 *
 * This replaced an email + OTP flow, which meant a guest couldn't run an audit
 * without leaving the page for their inbox. The grant it hands back lasts 2 hours,
 * so this modal is shown once and then stays out of the way.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';

const requestJSON = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    let data = {};
    try { data = await res.json(); } catch { /* empty body */ }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, error: err.message || 'Network error' };
  }
};

export default function AuditVerifyModal({
  isOpen,
  onClose,
  onVerified,
  darkMode = false,
  isLoading = false,
}) {
  const [question, setQuestion] = useState('');
  const [challenge, setChallenge] = useState('');
  const [answer, setAnswer] = useState('');
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const loadChallenge = useCallback(async () => {
    setLoadingChallenge(true);
    setAnswer('');
    const { ok, data, error: fetchErr } = await requestJSON('/single-audit/captcha');
    setLoadingChallenge(false);

    if (ok && data?.question && data?.challenge) {
      setQuestion(data.question);
      setChallenge(data.challenge);
      setError('');
      inputRef.current?.focus();
      return;
    }
    setQuestion('');
    setChallenge('');
    setError(fetchErr || data?.error || 'Could not load the verification. Please try again.');
  }, []);

  // Lock background scroll while open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Fresh question every time the modal opens; wipe state on close so a re-open
  // never shows a stale answer or a spent challenge.
  useEffect(() => {
    if (!isOpen) {
      setAnswer('');
      setError('');
      setVerified(false);
      setVerifying(false);
      return;
    }
    loadChallenge();
  }, [isOpen, loadChallenge]);

  const submit = async () => {
    const given = answer.trim();
    setError('');
    if (!/^-?\d+$/.test(given)) {
      setError('Enter the answer as a number.');
      return;
    }
    if (!challenge) {
      loadChallenge();
      return;
    }

    setVerifying(true);
    const { ok, data, error: fetchErr } = await requestJSON('/single-audit/verify-captcha', {
      method: 'POST',
      body: JSON.stringify({ challenge, answer: given }),
    });
    setVerifying(false);

    if (ok && data?.auditToken) {
      setVerified(true);
      // Brief success flash, then hand the grant back so the parent can run the audit.
      setTimeout(() => onVerified(data.auditToken), 550);
      return;
    }

    setError(fetchErr || data?.error || 'Verification failed. Please try again.');
    // A wrong answer keeps the same question — the user probably just mistyped, and
    // swapping the sum out from under them is the sort of friction this replaced.
    // Anything else (expired / tampered challenge) needs a fresh one.
    if (data?.code === 'WRONG_ANSWER') {
      setAnswer('');
      inputRef.current?.focus();
    } else {
      loadChallenge();
    }
  };

  if (!isOpen) return null;

  const busy = verifying || verified || isLoading;

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
          {verified ? <CheckCircle2 className="w-8 h-8 text-white" /> : <ShieldCheck className="w-8 h-8 text-white" />}
        </div>

        <div className="text-center space-y-2">
          <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-ink'}`}>
            Quick check
          </h3>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
            Solve this one sum so we know you're not a bot. We'll remember it for the
            next 2 hours.
          </p>
        </div>

        <form
          onSubmit={(ev) => { ev.preventDefault(); submit(); }}
          className={`w-full rounded-2xl border p-5 space-y-4 ${darkMode ? 'bg-white/4 border-white/8' : 'bg-cardsoft border-line'}`}
        >
          <div className={`flex items-center justify-between gap-3 p-3 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-card'}`}>
            <span className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-ink'}`}>
              {loadingChallenge ? 'Loading…' : question ? `${question} = ?` : '—'}
            </span>
            <button
              type="button"
              onClick={loadChallenge}
              disabled={busy || loadingChallenge}
              title="New question"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100
                ${darkMode ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-muted hover:text-accent hover:bg-accentsoft'}`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${loadingChallenge ? 'animate-spin' : ''}`} /> New
            </button>
          </div>

          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoFocus
            autoComplete="off"
            value={answer}
            onChange={(ev) => setAnswer(ev.target.value.replace(/[^\d-]/g, '').slice(0, 3))}
            placeholder="Your answer"
            disabled={busy}
            className="w-full p-3 text-center text-2xl font-bold border border-line dark:border-slate-600 rounded-lg bg-card dark:bg-slate-800 text-ink dark:text-white outline-none focus:ring-2 focus:ring-[#ea580c] focus:border-[#ea580c] transition-all disabled:opacity-50"
          />

          {error && <p className="text-red-500 text-sm flex items-center gap-1.5"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</p>}

          <button
            type="submit"
            disabled={busy || !answer.trim() || !challenge}
            className="w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {verified
              ? <><CheckCircle2 className="w-5 h-5" /> Verified</>
              : verifying
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Checking…</>
                : 'Verify & start audit'}
          </button>
        </form>

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
