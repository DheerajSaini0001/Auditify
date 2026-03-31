import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const OtpVerifyPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [timer, setTimer] = useState(60);
  const inputs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { apiFetch, login } = useAuth();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      toast.error('Session expired. Please register again.');
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval;
    if (resendDisabled && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else {
      setResendDisabled(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendDisabled, timer]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next
    if (element.value !== '' && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const data = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    data.forEach((char, i) => {
      if (!isNaN(char)) newOtp[i] = char;
    });
    setOtp(newOtp);
    if (inputs.current[5]) inputs.current[5].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    const { ok, data } = await apiFetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp: otpValue }),
    });

    if (ok) {
        toast.success(data.message);
        login(data.token, data.user);
        navigate('/dashboard');
    } else {
        toast.error(data.message || 'Invalid OTP');
        setOtp(['', '', '', '', '', '']);
        inputs.current[0].focus();
    }
  };

  const handleResend = async () => {
    const { ok, data } = await apiFetch('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (ok) {
      toast.success('New OTP sent!');
      setResendDisabled(true);
      setTimer(60);
    } else {
      toast.error(data.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Verify your email</h2>
          <p className="mt-2 text-sm text-gray-600">
            We sent a 6-digit code to <span className="font-semibold text-blue-600">{email}</span>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {otp.map((data, index) => (
              <input
                key={index}
                ref={(el) => (inputs.current[index] = el)}
                type="text"
                maxLength="1"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:border-blue-500 focus:ring-blue-500 outline-none transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={otp.join('').length < 6}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
          >
            Verify Account
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendDisabled}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400"
            >
              {resendDisabled ? `Resend OTP in ${timer}s` : 'Resend OTP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OtpVerifyPage;
