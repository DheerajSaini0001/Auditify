import { useState, useEffect, useCallback } from 'react';

const MathCaptcha = ({ onAnswerChange, error }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [loading, setLoading] = useState(false);

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
  
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
        {loading ? (
          <span className="font-bold text-lg text-slate-400">Loading...</span>
        ) : (
          <span className="font-bold text-lg dark:text-white">What is {question}?</span>
        )}
        <button 
          type="button" 
          onClick={fetchCaptcha} 
          disabled={loading}
          className="text-violet-500 hover:text-violet-600 font-semibold text-sm disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      <input
        type="number"
        value={answer}
        onChange={(e) => {
          setAnswer(e.target.value);
          onAnswerChange(e.target.value, captchaId);
        }}
        placeholder="Enter your answer"
        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 transition-all font-medium"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default MathCaptcha;
