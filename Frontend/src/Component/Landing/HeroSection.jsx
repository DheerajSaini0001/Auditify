import React, { useState, useRef, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Monitor, Smartphone, Search, Zap, Loader2, AlertCircle,
    ChevronDown, Settings, ShieldCheck, ArrowRight, Star,
    BarChart2, Globe, Lock, Eye, TrendingUp, Cpu, Layers
} from 'lucide-react';
import MathCaptcha from "../../Component/MathCaptcha.jsx";
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/* ─────────────────────────────────────────
   Audit type metadata – shown in the badge strip
───────────────────────────────────────── */
const AUDIT_TYPES = [
    { icon: <TrendingUp size={13} />, label: "Speed & Vitals" },
    { icon: <Search size={13} />, label: "Dealer SEO" },
    { icon: <Eye size={13} />, label: "ADA Compliance" },
    { icon: <Lock size={13} />, label: "Security Shield" },
    { icon: <Layers size={13} />, label: "Inventory UX" },
    { icon: <TrendingUp size={13} />, label: "Lead Flow" },
    { icon: <Cpu size={13} />, label: "AI Search" },
];

/* ─────────────────────────────────────────
   Custom Dropdown
───────────────────────────────────────── */
const CustomDropdown = ({ value, onChange, options, icon, darkMode, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find((o) => o.value === value)?.label || value;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 h-10 rounded-xl cursor-pointer transition-all duration-200 group/drop border
                    ${darkMode
                        ? "bg-white/5 border-white/8 hover:bg-white/10 hover:border-[#ea580c]/20"
                        : "bg-slate-50 border-slate-200 hover:bg-white hover:border-[#ea580c]/40"}
                    ${disabled ? "opacity-40 cursor-not-allowed" : "active:scale-[0.97]"}
                `}
            >
                <span className={`flex-shrink-0 transition-colors ${darkMode ? 'text-slate-400 group-hover/drop:text-[#ea580c]' : 'text-slate-400 group-hover/drop:text-[#ea580c]'}`}>
                    {React.cloneElement(icon, { size: 14 })}
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-widest truncate max-w-[72px] ${darkMode ? 'text-slate-400 group-hover/drop:text-slate-100' : 'text-slate-600 group-hover/drop:text-slate-900'}`}>
                    {selectedLabel}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#ea580c]" : darkMode ? "text-slate-600" : "text-slate-400"}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className={`absolute top-full mt-3 right-0 w-64 z-[1000] rounded-[1.5rem] shadow-2xl border overflow-hidden backdrop-blur-2xl p-2 
                            ${darkMode
                                ? "bg-slate-900/90 border-white/10 shadow-black/40"
                                : "bg-white/90 border-slate-200/60 shadow-slate-200/50"
                            }
                        `}
                    >
                        <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-1">
                            {options.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                    className={`
                                        w-full flex items-center justify-between px-4 py-3 text-[11px] font-bold tracking-wide rounded-xl transition-all duration-200
                                        ${value === opt.value
                                            ? (darkMode ? "bg-[#ea580c]/20 text-orange-400" : "bg-[#ea580c]/10 text-[#ea580c]")
                                            : (darkMode ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}
                                    `}
                                >
                                    <span className="truncate pr-2">{opt.label}</span>
                                    {value === opt.value && (
                                        <motion.div
                                            layoutId="active-dot"
                                            className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─────────────────────────────────────────
   Animated Score Circle
───────────────────────────────────────── */
const ScoreRing = ({ score, color, label, delay = 0, darkMode }) => {
    const r = 38;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;

    return (
        <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`relative flex flex-col items-center justify-center p-6 rounded-3xl border overflow-hidden
                ${darkMode ? 'bg-[#0D1525]/80 border-white/5' : 'bg-white border-slate-100 shadow-lg shadow-slate-100'}`}
        >


            <div className="relative">
                <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                    <circle cx="44" cy="44" r={r} strokeWidth="7" fill="none"
                        stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                    <motion.circle
                        cx="44" cy="44" r={r} strokeWidth="7" fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.8, delay, ease: "easeOut" }}
                        stroke={color}
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-black"
                    style={{ color }}>
                    {score}
                </span>
            </div>
            <span className={`mt-3 text-[10px] font-bold uppercase tracking-[0.18em] ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                {label}
            </span>
        </motion.div>
    );
};

/* ─────────────────────────────────────────
   Main Hero
───────────────────────────────────────── */
const HeroSection = ({ onSubmit, isLoading, error: externalError }) => {
    const { theme } = useContext(ThemeContext);
    const { user } = useAuth();
    const darkMode = theme === "dark";

    const [url, setUrl] = useState('');
    const [device, setDevice] = useState('Desktop');
    const [report, setReport] = useState('All');
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [captchaId, setCaptchaId] = useState('');
    const [captchaError, setCaptchaError] = useState('');
    const [localError, setLocalError] = useState(null);
    const [focused, setFocused] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const isAutoStarting = useRef(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const queryUrl = params.get("url");
        const queryDevice = params.get("device");
        const queryReport = params.get("report");

        if (queryUrl && !isAutoStarting.current) {
            // Normalize device to match backend expectation ('Desktop' or 'Mobile')
            let deviceToUse = queryDevice || device;
            if (deviceToUse) {
                deviceToUse = deviceToUse.charAt(0).toUpperCase() + deviceToUse.slice(1).toLowerCase();
            }
            if (deviceToUse !== 'Desktop' && deviceToUse !== 'Mobile') deviceToUse = 'Desktop';

            setUrl(queryUrl);
            setDevice(deviceToUse);
            if (queryReport) setReport(queryReport);

            isAutoStarting.current = true;

            // If logged in, skip captcha and run
            if (user || localStorage.getItem('dealerpulse_token')) {
                let urlToFetch = queryUrl.trim();
                if (!/^https?:\/\//i.test(urlToFetch)) urlToFetch = `https://${urlToFetch}`;
                onSubmit(urlToFetch, deviceToUse, queryReport || report, null);

                // Clear the search query parameters silently from the address bar without disrupting the async React state triggers
                window.history.replaceState(null, '', window.location.pathname);
            } else {
                setShowCaptcha(true);
            }
        }
    }, [location.search, navigate, location.pathname, user]);

    const handleInitialSubmit = (e) => {
        e.preventDefault();
        setLocalError(null);
        if (!url.trim()) {
            setLocalError("Please enter a URL to get started.");
            return;
        }

        if (user) {
            let urlToFetch = url.trim();
            if (!/^https?:\/\//i.test(urlToFetch)) urlToFetch = `https://${urlToFetch}`;
            onSubmit(urlToFetch, device, report, null);
            return;
        }

        setShowCaptcha(true);
        setCaptchaError('');
        setCaptchaAnswer('');
        setCaptchaId('');
    };

    const handleSubmitWithCaptcha = () => {
        if (!captchaAnswer && captchaAnswer !== 0 && captchaAnswer !== '0') {
            setCaptchaError("Please complete the verification.");
            return;
        }
        setCaptchaError('');
        setShowCaptcha(false);
        let urlToFetch = url.trim();
        if (!/^https?:\/\//i.test(urlToFetch)) urlToFetch = `https://${urlToFetch}`;
        onSubmit(urlToFetch, device, report, parseInt(captchaAnswer), captchaId);

        // Clear the search query parameters silently from the address bar
        window.history.replaceState(null, '', window.location.pathname);
    };

    useEffect(() => {
        if (externalError && /captcha/i.test(externalError)) {
            setShowCaptcha(true);
            setCaptchaError(externalError);
            setCaptchaAnswer('');
        }
    }, [externalError]);

    const error = externalError || localError;

    /* ── stagger variants ── */
    const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
    const item = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } };

    return (
        <section className={`relative min-h-[92vh] flex items-center justify-center pt-28 pb-24 transition-colors duration-500 z-[40]`}
            style={{ background: '#1B1464' }}
        >


            <div className="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-20 max-w-7xl">

                {/* ── LEFT: Copy + Form ── */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="flex-[1.15] text-center lg:text-left space-y-9"
                >
                    {/* Badge */}
                    <motion.div variants={item} className="flex justify-center lg:justify-start">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.22em] border bg-[#ea580c]/15 border-[#ea580c]/30 text-orange-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-pulse inline-block" />
                            Dealer Website Audit Platform
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.div variants={item} className="space-y-4">
                        <h1 className="text-5xl lg:text-[4.5rem] font-black leading-[1.05] tracking-[-0.03em] text-white">
                            Your Dealership,{" "}
                            <br className="hidden lg:block" />
                            <span className="relative inline-block">
                                <span className="text-[#ea580c]">
                                    Fully Audited.
                                </span>
                                {/* Underline accent */}
                                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 300 6" fill="none" preserveAspectRatio="none">
                                    <path d="M0 5 Q75 1 150 4 T300 3" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" fill="none" />
                                </svg>
                            </span>
                        </h1>

                        <p className="text-lg lg:text-xl font-medium leading-relaxed max-w-xl mx-auto lg:mx-0 text-blue-200/70">
                            Turn clicks into showroom sales. Scan your website in seconds across seven critical automotive performance dimensions — from Core Web Vitals to AI-Search readiness.
                        </p>
                    </motion.div>

                    {/* Audit type pills */}
                    <motion.div variants={item}
                        className="flex flex-wrap justify-center lg:justify-start gap-2"
                    >
                        {AUDIT_TYPES.map((a, i) => (
                            <motion.span
                                key={a.label}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.06 }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border bg-white/5 border-white/10 text-blue-200/80"
                            >
                                <span className="text-orange-400">{a.icon}</span>
                                {a.label}
                            </motion.span>
                        ))}
                    </motion.div>

                    {/* ── URL Input Form ── */}
                    <motion.form
                        variants={item}
                        onSubmit={handleInitialSubmit}
                        className="relative max-w-2xl mx-auto lg:mx-0 z-[60]"
                    >
                        <motion.div
                            animate={focused
                                ? { boxShadow: '0 0 0 2px rgba(234,88,12,0.35), 0 40px 100px rgba(0,0,0,0.6)' }
                                : { boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }
                            }
                            transition={{ duration: 0.3 }}
                            className="relative z-10 rounded-[2.5rem] border p-7 space-y-5 bg-[#0D1030]/70 border-white/8 backdrop-blur-2xl"
                        >
                            {/* Input row */}
                            <div className="flex items-center px-4 h-14 gap-3">
                                <Globe className={`flex-shrink-0 w-4 h-4 transition-colors duration-300
                                    ${focused ? 'text-[#ea580c]' : 'text-slate-500'}`}
                                />
                                <input
                                    type="text"
                                    autoComplete="off"
                                    spellCheck="false"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    placeholder="Enter your website URL — e.g. yoursite.com"
                                    disabled={isLoading}
                                    className="flex-1 bg-transparent outline-none text-[15px] font-medium text-white placeholder:text-slate-500"
                                />
                            </div>

                            {/* Divider + Options row */}
                            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
                                <CustomDropdown
                                    value={device}
                                    onChange={setDevice}
                                    options={[
                                        { value: "Desktop", label: "Desktop" },
                                        { value: "Mobile", label: "Mobile" },
                                    ]}
                                    icon={device === "Desktop" ? <Monitor /> : <Smartphone />}
                                    darkMode={true}
                                    disabled={isLoading}
                                />
                                <CustomDropdown
                                    value={report}
                                    onChange={setReport}
                                    options={[
                                        { value: "All", label: "Full Dealer Audit (All 7)" },
                                        { value: "Technical Performance", label: "Speed & Core Web Vitals" },
                                        { value: "On Page SEO", label: "Dealership SEO" },
                                        { value: "Accessibility", label: "ADA & WCAG Compliance" },
                                        { value: "Security/Compliance", label: "WAF & Security Shield" },
                                        { value: "UX & Content Structure", label: "Inventory UX & VDP Layout" },
                                        { value: "Conversion & Lead Flow", label: "Lead Flow & Forms Friction" },
                                        { value: "AIO (AI-Optimization) Readiness", label: "AIO (AI-Search) Readiness" },
                                    ]}
                                    icon={<Settings />}
                                    darkMode={true}
                                    disabled={isLoading}
                                />

                                <button
                                    type="submit"
                                    disabled={isLoading || !url.trim()}
                                    className={`ml-auto flex items-center gap-2 px-6 h-12 rounded-xl font-bold text-[14px] tracking-tight shrink-0
                                        transition-all duration-200 active:scale-[0.97]
                                        ${isLoading || !url.trim()
                                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                            : 'bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-lg shadow-orange-600/25'}`}
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin w-5 h-5" />
                                    ) : (
                                        <>
                                            Run Audit
                                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="mt-3 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium"
                                >
                                    <AlertCircle size={16} className="flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.form>

                    {/* Social proof */}
                    <motion.div
                        variants={item}
                        className="flex flex-wrap items-center justify-center lg:justify-start gap-6"
                    >

                        <span className="text-xs font-semibold text-blue-300/30">·</span>

                    </motion.div>
                </motion.div>

                {/* ── RIGHT: Dashboard mockup ── */}
                <motion.div
                    initial={{ opacity: 0, x: 50, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 hidden lg:block relative"
                >


                    <div className={`relative flex flex-col gap-4 p-6 rounded-2xl border
                ${darkMode
                    ? 'bg-white/[0.03] border-white/8 hover:border-white/14'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}
                transition-colors duration-300`}>
                        {/* Browser chrome */}
                        <div className="flex items-center gap-2 mb-1">
                            {['bg-rose-400/50', 'bg-amber-400/50', 'bg-emerald-400/50'].map((c, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full ${c}`} />
                            ))}

                            <div className="ml-3 h-5 w-44 rounded-lg bg-white/6 pl-2 flex items-center" >YourWebsite.com</div>
                            
                        </div>

                        {/* Header row */}
                        <div className="flex items-center justify-between pt-1">
                            <div className="space-y-2">
                                <div className="h-5 w-28 rounded-lg bg-white/10" />
                                <div className="h-3.5 w-52 rounded-lg bg-white/5" />
                            </div>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-350/10">
                                <BarChart2 className="text-[#ea580c]" size={20} />
                            </div>
                        </div>

                        {/* Score rings */}
                        <div className="grid grid-cols-2 gap-4">
                            <ScoreRing score={94} color="#ea580c" label="SEO Score" delay={0.5} darkMode={true} />
                            <ScoreRing score={88} color="#3b82f6" label="Performance" delay={0.7} darkMode={true} />
                        </div>

                        {/* Mini metric bars */}
                        <div className="rounded-2xl border p-5 space-y-4 bg-white/3 border-white/6">
                            {[
                                { label: "Accessibility", pct: 78, color: "#a78bfa" },
                                { label: "Security", pct: 91, color: "#ea580c" },
                                { label: "AIO Readiness", pct: 63, color: "#f59e0b" },
                            ].map((m) => (
                                <div key={m.label} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-semibold">
                                        <span className="text-slate-500">{m.label}</span>
                                        <span style={{ color: m.color }}>{m.pct}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${m.pct}%` }}
                                            transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                                            className="h-full rounded-full"
                                            style={{ background: m.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer badge */}
                        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-orange-350/8 border border-orange-350/15">
                            <Zap size={15} className="text-[#ea580c] flex-shrink-0" />
                            <span className="text-[11px] font-semibold text-orange-350">
                                7 audit dimensions · Real-time analysis · Dealer-focused insights
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── CAPTCHA Modal ── */}
            <AnimatePresence>
                {showCaptcha && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCaptcha(false)}
                            className="absolute inset-0 bg-slate-950/75 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 24 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 24 }}
                            transition={{ type: "spring", damping: 22, stiffness: 280 }}
                            className={`relative p-8 lg:p-12 rounded-[3rem] border shadow-2xl flex flex-col items-center gap-8 max-w-md w-full
                                ${darkMode ? 'bg-slate-900 border-white/8' : 'bg-white border-slate-100'}`}
                        >


                            <div className="w-16 h-16 rounded-2xl bg-[#ea580c] flex items-center justify-center shadow-xl shadow-orange-600/20 rotate-6">
                                <ShieldCheck className="w-8 h-8 text-white" />
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Quick Verification
                                </h3>
                                <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Solve a simple math question to confirm you're not a bot — then your audit begins instantly.
                                </p>
                            </div>

                            <div className={`w-full rounded-2xl border p-5 space-y-4 ${darkMode ? 'bg-white/4 border-white/8' : 'bg-slate-50 border-slate-200'}`}>
                                <MathCaptcha
                                    onAnswerChange={(val, id) => { setCaptchaAnswer(val); setCaptchaId(id); }}
                                    error={captchaError}
                                />
                                <button
                                    onClick={handleSubmitWithCaptcha}
                                    disabled={isLoading || !captchaAnswer}
                                    className="w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold rounded-xl
                                        transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20 active:scale-[0.98]"
                                >
                                    {isLoading ? "Verifying…" : "Verify & Start Audit"}
                                </button>
                            </div>

                            <button
                                onClick={() => setShowCaptcha(false)}
                                className={`text-[11px] font-semibold uppercase tracking-widest transition-colors
                                    ${darkMode ? 'text-slate-600 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'}`}
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default HeroSection;
