import { useState, useEffect, useCallback, useRef } from 'react';

const MathCaptcha = ({ onAnswerChange, error, autoFocus = false }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const fetchCaptcha = useCallback(async () => {
    setLoading(true);
    setAnswer('');
    onAnswerChange('', '');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:2000'}/api/captcha/generate`, { credentials: 'include' });
      const data = await res.json();
      setQuestion(data.question);
      setCaptchaId(data.captchaId);
    } catch (err) {
      console.error('Failed to load CAPTCHA:', err);
    }
    setLoading(false);
  }, []); // Remove onAnswerChange from here!

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  // Focus the answer field when mounted inside a modal (slight delay so the
  // modal's open animation doesn't steal focus back).
  useEffect(() => {
    if (!autoFocus) return;
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [autoFocus]);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-between items-center bg-cardsoft dark:bg-slate-800 p-3 rounded-lg">
        {loading ? (
          <span className="font-semibold text-lg text-faint">Loading...</span>
        ) : (
          <span className="font-semibold text-lg text-ink">What is {question}?</span>
        )}
        <button
          type="button"
          onClick={fetchCaptcha}
          disabled={loading}
          className="cursor-pointer text-accent hover:text-[#c2410c] hover:bg-accentsoft font-semibold text-sm px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Refresh
        </button>
      </div>
      <input
        ref={inputRef}
        type="number"
        value={answer}
        onChange={(e) => {
          setAnswer(e.target.value);
          onAnswerChange(e.target.value, captchaId);
        }}
        placeholder="Enter your answer"
        className="w-full p-3 border border-line dark:border-slate-600 rounded-lg bg-card dark:bg-slate-800 text-ink outline-none focus:ring-2 focus:ring-[#ea580c] focus:border-[#ea580c] transition-all font-medium"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default MathCaptcha;
