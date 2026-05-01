import React, { useState } from 'react';
import { X, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import MathCaptcha from './MathCaptcha';

const CaptchaModal = ({ 
  isOpen, 
  onClose, 
  onVerify, 
  darkMode, 
  apiFetch,
  title = "Security Verification",
  description = "To protect your account, please solve this quick challenge to continue.",
  buttonText = "Verify & Continue"
}) => {
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!captchaAnswer) return;
    
    setVerifying(true);
    try {
      const { ok, data } = await apiFetch('/api/captcha/verify', {
        method: 'POST',
        body: JSON.stringify({ captchaAnswer, captchaId }),
      });

      if (ok) {
        setIsVerified(true);
        // Small delay to show success state
        setTimeout(() => {
          onVerify(captchaAnswer, captchaId);
        }, 1000);
      } else {
        alert(data.error || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm captcha-modal-overlay">
      <div 
        className={`relative w-full max-w-md p-8 rounded-3xl shadow-2xl transform transition-all captcha-modal-content ${
          darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-900'
        }`}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={20} className="text-slate-400" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className={`p-4 rounded-full mb-4 ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <ShieldCheck className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {description}
          </p>
        </div>

        <div className="space-y-6">
          <div className={`p-1 rounded-2xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
             <MathCaptcha 
               onAnswerChange={(val, id) => { setCaptchaAnswer(val); setCaptchaId(id); }} 
             />
          </div>

          <button
            onClick={handleVerify}
            disabled={verifying || !captchaAnswer || isVerified}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
              isVerified 
                ? 'bg-emerald-500 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {verifying ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isVerified ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Verified</span>
              </>
            ) : (
              <span>{buttonText}</span>
            )}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 uppercase tracking-widest font-semibold">
          Secure Verification Powered by Dealer Pulse
        </p>
      </div>
    </div>
  );
};

export default CaptchaModal;
