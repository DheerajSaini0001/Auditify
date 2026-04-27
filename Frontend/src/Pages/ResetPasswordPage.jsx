import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { apiFetch } = useAuth();

    useEffect(() => {
        if (!token || !email) {
            setError('Missing reset token or email. Please request a new link.');
        }
    }, [token, email]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        const passRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passRegex.test(newPassword)) {
            toast.error('Password too weak! Needs 8+ chars, 1 uppercase, 1 number.');
            return;
        }

        setLoading(true);
        const { ok, data } = await apiFetch('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, token, newPassword }),
        });

        if (ok) {
            setSuccess(true);
            toast.success('Password updated successfully!');
        } else {
            setError(data.message || 'Reset failed. Link may be expired.');
            toast.error(data.message || 'Something went wrong');
        }
        setLoading(false);
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100 text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-600 mb-6 font-bold text-2xl">!</div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Invalid Link</h2>
                    <p className="mt-4 text-gray-500 leading-relaxed font-medium">{error}</p>
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <Link to="/forgot-password" name="Request New Link" className="inline-flex items-center text-sm font-bold text-violet-600 hover:text-violet-500 transition-colors uppercase tracking-[0.2em] animate-pulse">Request New Link</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-violet-100 mb-6">
                        <CheckCircle className="h-10 w-10 text-violet-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight text-center">Password Updated!</h2>
                    <p className="mt-4 text-gray-500 leading-relaxed font-medium">You can now sign in to your DealerPulse account with your new credentials.</p>
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <Link to="/login" className="w-full flex items-center justify-center font-bold text-violet-600 hover:text-violet-500 transition-colors uppercase tracking-[0.2em]">
                            Sign In Now <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-violet-50 text-violet-600 mb-6"><Lock className="h-8 w-8" /></div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Set New Password</h2>
                    <p className="mt-2 text-sm text-gray-500 font-medium tracking-wide">Enter a strong password for your security.</p>
                </div>

                <form className="mt-10 space-y-4" onSubmit={handleSubmit}>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Lock className="h-5 w-5" /></div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            className="block w-full pl-12 pr-12 py-3.5 rounded-2xl bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500 focus:ring-violet-500 transition-all font-medium"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                            {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Lock className="h-5 w-5" /></div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            className="block w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500 focus:ring-violet-500 transition-all font-medium"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25 active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
