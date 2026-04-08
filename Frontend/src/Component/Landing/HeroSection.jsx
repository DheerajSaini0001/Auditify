import React, { useState, useRef, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Search, Zap, Loader2, AlertCircle, ChevronDown, Settings, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";
import { ThemeContext } from '../../context/ThemeContext.jsx';

const CustomDropdown = ({ value, onChange, options, icon, darkMode, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find((opt) => opt.value === value)?.label || value;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 h-10 rounded-xl cursor-pointer transition-all duration-200 group/drop overflow-hidden relative border
                    ${darkMode
                        ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                        : "bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : "active:scale-[0.98] focus:ring-2 focus:ring-emerald-500/20"}
                `}
            >
                <div className={`flex-shrink-0 transition-colors duration-200 ${darkMode ? 'text-slate-400 group-hover/drop:text-emerald-400' : 'text-slate-500 group-hover/drop:text-emerald-600'}`}>
                    {React.cloneElement(icon, { size: 14 })}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-slate-400 group-hover/drop:text-slate-200" : "text-slate-500 group-hover/drop:text-slate-800"} truncate max-w-[80px]`}>
                    {selectedLabel}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? "rotate-180 text-emerald-500" : "text-slate-400"}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        className={`absolute top-full mt-1.5 right-0 w-[200px] z-[110] rounded-xl shadow-xl border overflow-hidden backdrop-blur-xl p-1 ${
                            darkMode ? "bg-slate-900/95 border-white/10 text-slate-300" : "bg-white/95 border-slate-200 text-slate-700"
                        }`}
                    >
                        <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-0.5">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold tracking-wide cursor-pointer rounded-lg transition-all
                                        ${value === option.value 
                                            ? (darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600") 
                                            : (darkMode ? "hover:bg-white/5 hover:text-white" : "hover:bg-slate-50 hover:text-slate-900")}
                                    `}
                                >
                                    {option.label}
                                    {value === option.value && <div className="w-1 h-1 rounded-full bg-emerald-500"></div>}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

};

const HeroSection = ({ onSubmit, isLoading, error: externalError }) => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === "dark";
    
    const [url, setUrl] = useState('');
    const [device, setDevice] = useState('Desktop');
    const [report, setReport] = useState('All');
    
    const recaptchaRef = useRef(null);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaError, setCaptchaError] = useState(false);
    const [localError, setLocalError] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const isAutoStarting = useRef(false);

    // Auto-trigger from Dashboard
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const queryUrl = params.get("url");

        if (queryUrl && !isAutoStarting.current) {
            setUrl(queryUrl);
            isAutoStarting.current = true;
            
            // Remove query param to keep URL clean
            navigate(location.pathname, { replace: true });

            const runDirectly = async () => {
                // If logged in, skip captcha and run
                if (localStorage.getItem('auditify_token')) {
                    let urlToFetch = queryUrl.trim();
                    if (!/^https?:\/\//i.test(urlToFetch)) {
                        urlToFetch = `https://${urlToFetch}`;
                    }
                    onSubmit(urlToFetch, device, report, null);
                }
            };

            runDirectly();
        }
    }, [location.search, onSubmit, navigate, location.pathname]);

    const handleInitialSubmit = (e) => {
        e.preventDefault();
        setLocalError(null);

        if (!url.trim()) {
            setLocalError("Please enter a URL before proceeding!");
            return;
        }

        // Show verification modal
        setShowCaptcha(true);
        setCaptchaError(false);
    };

    const handleCaptchaChange = (token) => {
        if (token) {
            setCaptchaError(false);
            setShowCaptcha(false);
            
            // Final submission with all details
            let urlToFetch = url.trim();
            if (!/^https?:\/\//i.test(urlToFetch)) {
                urlToFetch = `https://${urlToFetch}`;
            }
            
            onSubmit(urlToFetch, device, report, token);
        }
    };

    const handleCaptchaExpired = () => {
        setCaptchaError(true);
    };

    const error = externalError || localError;

    return (
        <section className={`relative min-h-[90vh] flex items-center justify-center pt-28 pb-20 transition-colors duration-500 ${darkMode ? 'bg-[#0A0F1E]' : 'bg-slate-50'}`}>
            
            {/* 🌈 Dynamic Background Effects */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Animated Gradient Blobs */}
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '4s' }}></div>
                
                {/* Grid Pattern */}
                <div className={`absolute inset-0 opacity-[0.03] ${darkMode ? 'bg-grid-white' : 'bg-grid-black'}`}></div>
            </div>

            <div className="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-16 max-w-7xl">
                
                {/* 📝 Left Content: Value Proposition */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex-[1.2] text-center lg:text-left space-y-10"
                >
                    <div className="flex flex-col items-center lg:items-start space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-[11px] uppercase tracking-[0.25em] shadow-sm"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            Professional Website Intelligence v2.0
                        </motion.div>

                        <h1 className="text-6xl lg:text-[5.5rem] font-black tracking-tight leading-[0.95] text-balance">
                            Elevate Your <span className="relative">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500">Digital Pulse</span>
                                <svg className="absolute -bottom-2 left-0 w-full h-3 text-emerald-500/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                </svg>
                            </span>
                        </h1>

                        <p className={`text-xl lg:text-2xl font-medium leading-relaxed max-w-2xl text-pretty ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Uncover deep insights into SEO, performance, and security with our industry-leading audit engine. Actionable data in seconds.
                        </p>
                    </div>

                    {/* 🚀 Main Input Form */}
                    <form 
                        onSubmit={handleInitialSubmit}
                        className="relative max-w-5xl mx-auto lg:mx-0 group w-full"
                    >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`
                            relative w-full max-w-4xl mx-auto mt-12 p-1.5 rounded-2xl border backdrop-blur-3xl
                            transition-all duration-300 group/form
                            ${darkMode
                                ? "bg-slate-900/40 border-white/10 shadow-2xl focus-within:border-emerald-500/30"
                                : "bg-white/80 border-slate-200 shadow-xl focus-within:border-emerald-500/10"}
                        `}
                    >
                        <div className="flex flex-col lg:flex-row items-center gap-1.5">
                            
                            {/* 🔍 Primary Input Field (Dominant) */}
                            <div className="flex-1 flex items-center w-full px-4 h-12 rounded-xl transition-all">
                                <Search className={`w-4 h-4 mr-3 transition-colors duration-300 ${darkMode ? 'text-slate-500 group-focus-within/form:text-emerald-400' : 'text-slate-400 group-focus-within/form:text-emerald-500'}`} />
                                <input
                                    type="text"
                                    autoComplete="off"
                                    spellCheck="false"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="Enter website URL (e.g. apple.com)"
                                    disabled={isLoading}
                                    className={`
                                        w-full bg-transparent outline-none text-[15px] font-medium tracking-tight
                                        ${darkMode
                                            ? "text-white placeholder:text-slate-600"
                                            : "text-slate-900 placeholder:text-slate-400"}
                                    `}
                                />
                            </div>

                            {/* ⚙️ Compact Actions (Secondary) - Removed overflow-x-auto to prevent dropdown clipping */}
                            <div className="flex flex-wrap lg:flex-nowrap items-center gap-1.5 px-1.5 w-full lg:w-auto shrink-0">
                                <CustomDropdown
                                    value={device}
                                    onChange={setDevice}
                                    options={[
                                        { value: "Desktop", label: "Desktop" },
                                        { value: "Mobile", label: "Mobile" },
                                    ]}
                                    icon={
                                        device === "Desktop"
                                            ? <Monitor />
                                            : <Smartphone />
                                    }
                                    darkMode={darkMode}
                                    disabled={isLoading}
                                />

                                <CustomDropdown
                                    value={report}
                                    onChange={setReport}
                                    options={[
                                        { value: "All", label: "Full Audit" },
                                        { value: "Technical Performance", label: "Performance" },
                                        { value: "On Page SEO", label: "SEO Audit" },
                                        { value: "Accessibility", label: "Accessibility" },
                                        { value: "Security/Compliance", label: "Security" },
                                        { value: "UX & Content Structure", label: "UX/Content" },
                                        { value: "Conversion & Lead Flow", label: "Conversion" },
                                        { value: "AIO (AI-Optimization) Readiness", label: "AIO Ready" },
                                    ]}
                                    icon={<Settings />}
                                    darkMode={darkMode}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* ⚡ Action Button (Compact) */}
                            <button
                                type="submit"
                                disabled={isLoading || !url}
                                className={`
                                    relative flex items-center justify-center gap-2 px-5 h-10 rounded-xl font-bold text-[13px] tracking-tight
                                    transition-all duration-200 w-full lg:w-auto overflow-hidden group/btn shrink-0
                                    ${isLoading || !url 
                                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50" 
                                        : "bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 hover:opacity-90 active:scale-[0.98] shadow-sm"}
                                `}
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin w-4 h-4" />
                                ) : (
                                    <>
                                        <span>Run Audit</span>
                                        <ArrowRight size={14} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>



                        <AnimatePresence>
                            {(error) && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute -bottom-20 left-0 right-0 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-3 backdrop-blur-md shadow-2xl z-50 text-center lg:text-left"
                                >
                                    <AlertCircle size={20} className="flex-shrink-0" />
                                    <span className="text-sm font-black tracking-tight">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>

                    {/* 📊 Quick Stats */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-wrap items-center justify-center lg:justify-start gap-8 pt-4"
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className={`w-8 h-8 rounded-full border-2 ${darkMode ? 'border-slate-900 bg-slate-800' : 'border-white bg-slate-100'} flex items-center justify-center`}>
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 opacity-80"></div>
                                    </div>
                                ))}
                            </div>
                            <span className={`text-xs font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>10k+ sites audited</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="flex text-amber-400">
                                {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                            </div>
                            <span className={`text-xs font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>4.9/5 satisfaction rate</span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* 🎨 Right Content: Score Mockup Visual */}
                <motion.div 
                    initial={{ opacity: 0, rotateY: 10, x: 50 }}
                    animate={{ opacity: 1, rotateY: 0, x: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="flex-1 relative hidden lg:block perspective-1000"
                >
                    {/* Glowing Aura behind mockup */}
                    <div className="absolute -inset-10 bg-emerald-500/20 blur-[100px] rounded-full animate-pulse pointer-events-none"></div>

                    <div className={`relative z-10 rounded-[3rem] border p-8 backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] ${darkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white/70 border-slate-200'}`}>
                        {/* Browser Top Bar */}
                        <div className="flex items-center gap-2 mb-10 px-1">
                           <div className="w-3.5 h-3.5 rounded-full bg-rose-500/40"></div>
                           <div className="w-3.5 h-3.5 rounded-full bg-amber-500/40"></div>
                           <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/40"></div>
                           <div className={`ml-4 h-6 w-40 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}></div>
                        </div>

                        {/* Mockup Content */}
                        <div className="space-y-10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-3">
                                    <div className={`h-6 w-32 rounded-lg ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                                    <div className={`h-4 w-56 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}></div>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'} flex items-center justify-center`}>
                                    <Zap className="text-emerald-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Score Circle 1 */}
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className={`relative p-8 rounded-[2.5rem] border flex flex-col items-center justify-center overflow-hidden group transition-all duration-500 ${darkMode ? 'bg-[#10192D] border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-white border-emerald-100 shadow-xl shadow-emerald-500/5'}`}
                                >
                                    {/* Scanning Line Animation */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50 animate-scan"></div>
                                    
                                    <div className="relative">
                                        <svg className="w-24 h-24 rotate-[-90deg]">
                                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className={darkMode ? "text-slate-800" : "text-slate-100"} />
                                            <motion.circle 
                                                cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray="251.2" 
                                                initial={{ strokeDashoffset: 251.2 }}
                                                animate={{ strokeDashoffset: 25.12 }}
                                                transition={{ duration: 2, delay: 0.5 }}
                                                className="text-emerald-500 stroke-cap-round" 
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-3xl font-black text-emerald-500">98</span>
                                    </div>
                                    <span className="text-[11px] font-black uppercase text-emerald-600/80 mt-4 tracking-[0.2em]">SEO Core</span>
                                </motion.div>

                                {/* Score Circle 2 */}
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className={`relative p-8 rounded-[2.5rem] border flex flex-col items-center justify-center overflow-hidden group transition-all duration-500 ${darkMode ? 'bg-[#10192D] border-blue-500/20 shadow-lg shadow-blue-500/5' : 'bg-white border-blue-100 shadow-xl shadow-blue-500/5'}`}
                                >
                                    <div className="relative">
                                        <svg className="w-24 h-24 rotate-[-90deg]">
                                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className={darkMode ? "text-slate-800" : "text-slate-100"} />
                                            <motion.circle 
                                                cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray="251.2" 
                                                initial={{ strokeDashoffset: 251.2 }}
                                                animate={{ strokeDashoffset: 50.24 }}
                                                transition={{ duration: 2, delay: 0.7 }}
                                                className="text-blue-500 stroke-cap-round" 
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-3xl font-black text-blue-500">92</span>
                                    </div>
                                    <span className="text-[11px] font-black uppercase text-blue-600/80 mt-4 tracking-[0.2em]">Insights</span>
                                </motion.div>
                            </div>

                            {/* Chart Replacement / Visual Footer */}
                            <div className={`rounded-3xl border p-6 space-y-4 ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                        <AlertCircle size={20} className="text-orange-500" />
                                    </div>
                                    <div className="space-y-1.5 flex-1">
                                        <div className={`h-2.5 w-full rounded-full ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                                        <div className={`h-2.5 w-2/3 rounded-full ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* 🛡️ Verification Modal (Captcha) */}
            <AnimatePresence>
                {showCaptcha && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCaptcha(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className={`relative p-8 lg:p-12 rounded-[3.5rem] border shadow-2xl flex flex-col items-center gap-10 max-w-md w-full overflow-hidden ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                            
                            <div className="relative w-20 h-20 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 rotate-[15deg]">
                                <ShieldCheck className="w-10 h-10" />
                            </div>
                            
                            <div className="text-center space-y-3 relative">
                                <h3 className={`text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Security Check</h3>
                                <p className={`text-base font-bold leading-relaxed ${darkMode ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}`}>To prevent automated abuse, please confirm your identity to generate the report.</p>
                            </div>
                            
                            <div className={`p-4 rounded-[2rem] border overflow-hidden ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200 shadow-inner'}`}>
                                <ReCAPTCHA
                                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                    onChange={handleCaptchaChange}
                                    onExpired={handleCaptchaExpired}
                                    theme={darkMode ? "dark" : "light"}
                                />
                            </div>

                            {captchaError && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-rose-500 text-sm font-black uppercase tracking-widest flex items-center gap-2"
                                >
                                    <AlertCircle size={16} /> Verification Error
                                </motion.div>
                            )}

                            <button 
                                onClick={() => setShowCaptcha(false)} 
                                className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${darkMode ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}
                            >
                                Back to Main
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default HeroSection;

