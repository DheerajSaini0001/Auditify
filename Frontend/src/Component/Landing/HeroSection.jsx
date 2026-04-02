import React, { useState, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Search, Zap, Loader2, AlertCircle, ChevronDown, Settings } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";
import { ThemeContext } from '../../context/ThemeContext.jsx';

const CustomDropdown = ({ value, onChange, options, icon, darkMode, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    React.useEffect(() => {
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
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors border ${darkMode
                    ? "hover:bg-slate-800 border-transparent hover:border-slate-700"
                    : "hover:bg-slate-100 border-transparent hover:border-slate-200"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                {icon}
                <span className={`text-sm font-bold ${darkMode ? "text-slate-300" : "text-slate-700"} truncate max-w-[120px]`}>
                    {selectedLabel}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""} ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
            </div>

            {isOpen && (
                <div className={`absolute top-full mt-2 left-0 w-max min-w-full z-[110] rounded-xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${darkMode ? "bg-slate-900 border-slate-700 text-slate-300" : "bg-white border-slate-100 text-slate-700"
                    }`}>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-bold cursor-pointer transition-colors ${darkMode
                                    ? "hover:bg-slate-800 hover:text-white"
                                    : "hover:bg-slate-50 hover:text-black"
                                    } ${value === option.value ? (darkMode ? "bg-slate-800 text-white" : "bg-slate-50 text-black") : ""}`}
                            >
                                {value === option.value && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                                {option.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
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
        <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
            {/* Background Grid */}
            <div className={`absolute inset-0 z-0 opacity-10 [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] ${darkMode ? 'text-white' : 'text-black'}`}>
                <svg width="100%" height="100%">
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            <div className="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-12 max-w-7xl">
                {/* Left: Value Prop */}
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex-1 text-center lg:text-left space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                        <Zap size={14} className="fill-emerald-500" /> Professional Site Auditing v2.0
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none">
                        Analyze your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Website Health</span> In Seconds.
                    </h1>

                    <p className={`text-xl font-medium leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        The definitive professional engine for Performance, SEO, Accessibility, and Security. Free, fast, and actionable.
                    </p>

                    {/* URL Input Form - Upgraded with features from old InputForm */}
                    <form 
                        onSubmit={handleInitialSubmit}
                        className="relative max-w-3xl mx-auto lg:mx-0 group"
                    >
                        <div className={`
                            flex flex-col lg:flex-row items-center p-2 rounded-[2rem] border transition-all duration-500 backdrop-blur-xl group-focus-within:ring-4 group-focus-within:ring-emerald-500/10
                            ${darkMode ? 'bg-slate-900/90 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}
                        `}>
                            
                            {/* Main Input Area */}
                            <div className="flex-1 w-full relative flex items-center px-4 h-14">
                                <Search className={`w-5 h-5 mr-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="Enter website URL (e.g. example.com)"
                                    disabled={isLoading}
                                    className={`w-full h-full bg-transparent border-none outline-none text-lg font-bold placeholder:font-medium ${darkMode ? 'text-white placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'}`}
                                />
                            </div>

                            {/* Controls Group: Device & Report Dropdowns */}
                            <div className="flex w-full lg:w-auto items-center gap-2 px-2 py-2 lg:py-0">
                                <CustomDropdown
                                    value={device}
                                    onChange={setDevice}
                                    options={[
                                        { value: "Desktop", label: "Desktop" },
                                        { value: "Mobile", label: "Mobile" },
                                    ]}
                                    icon={device === "Desktop" ? <Monitor className="w-4 h-4 text-blue-500" /> : <Smartphone className="w-4 h-4 text-purple-500" />}
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
                                    icon={<Settings className="w-4 h-4 text-emerald-500" />}
                                    darkMode={darkMode}
                                    disabled={isLoading}
                                />

                                <button
                                    type="submit"
                                    disabled={isLoading || !url}
                                    className={`
                                        hidden lg:flex items-center justify-center gap-2 px-8 h-14 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95
                                        bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20
                                        disabled:opacity-50
                                    `}
                                >
                                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Analyze"}
                                </button>
                            </div>
                        </div>

                        {/* Mobile Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="lg:hidden w-full mt-4 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Run Free Audit"}
                        </button>

                        <AnimatePresence>
                            {(error) && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute -bottom-16 left-0 right-0 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2 backdrop-blur-sm shadow-sm"
                                >
                                    <AlertCircle size={18} />
                                    <span className="text-sm font-bold tracking-tight">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </motion.div>

                {/* Right: Score Mockup */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="flex-1 relative hidden lg:block"
                >
                    <div className={`relative z-10 rounded-[2.5rem] border p-6 backdrop-blur-3xl shadow-2xl ${darkMode ? 'bg-slate-900/50 border-white/5' : 'bg-white/80 border-slate-100'}`}>
                        <div className="flex items-center gap-1.5 mb-6 px-1">
                           <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                           <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                           <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <div className={`h-4 w-3/4 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
                                <div className={`h-3 w-1/2 rounded-full ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-6 rounded-3xl border flex flex-col items-center justify-center group transition-colors ${darkMode ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' : 'bg-emerald-50 border-emerald-100'}`}>
                                    <span className="text-5xl font-black text-emerald-500">98</span>
                                    <span className="text-[10px] font-black uppercase text-emerald-600 mt-2 tracking-[0.2em]">SEO Score</span>
                                </div>
                                <div className={`p-6 rounded-3xl border flex flex-col items-center justify-center group transition-colors ${darkMode ? 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10' : 'bg-blue-50 border-blue-100'}`}>
                                    <span className="text-5xl font-black text-blue-500">92</span>
                                    <span className="text-[10px] font-black uppercase text-blue-600 mt-2 tracking-[0.2em]">Performance</span>
                                </div>
                            </div>
                            <div className={`h-32 rounded-3xl border p-4 flex flex-col justify-end ${darkMode ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-50/50 border-slate-100'}`}>
                                <div className="space-y-2">
                                    <div className={`h-2 w-full rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                                    <div className={`h-2 w-2/3 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Verification Modal (Captcha) */}
            <AnimatePresence>
                {showCaptcha && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`p-10 rounded-[3rem] border shadow-2xl flex flex-col items-center gap-8 max-w-sm w-full mx-4 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}
                        >
                            <div className="w-16 h-16 rounded-3xl bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 rotate-12">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Security Check</h3>
                                <p className={`text-sm font-bold italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Confirm you're human to generate report.</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                <ReCAPTCHA
                                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                    onChange={handleCaptchaChange}
                                    onExpired={handleCaptchaExpired}
                                    theme={darkMode ? "dark" : "light"}
                                />
                            </div>
                            {captchaError && (
                                <div className="text-red-500 text-xs font-black uppercase tracking-widest animate-pulse flex items-center gap-2">
                                    <AlertCircle size={14} /> Verification Expired
                                </div>
                            )}
                            <button onClick={() => setShowCaptcha(false)} className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Cancel</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
};

// Simple ShieldCheck icon since it's used in modal
const ShieldCheck = ({ size, className }) => (
    <svg 
        width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} 
    >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

export default HeroSection;
