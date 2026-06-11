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
                    flex items-center gap-2 px-3 h-10 rounded-xl cursor-pointer transition-all duration-200 group/drop border text-white
                    ${darkMode
                        ? "bg-white/5 border-white/8 hover:bg-white/10 hover:border-[#ea580c]/20"
                        : "bg-slate-50 border-slate-200 hover:bg-white hover:border-[#ea580c]/40"}
                    ${disabled ? "opacity-100 cursor-not-allowed" : "active:scale-[0.97]"}
                `}
            >
                <span className={`flex-shrink-0 transition-colors ${darkMode ? 'text-slate-white group-hover/drop:text-white' : 'text-white group-hover/drop:text-white'}`}>
                    {React.cloneElement(icon, { size: 14 })}
                </span>
                <span className={`text-[10px] font- uppercase tracking-widest truncate max-w-[72px] ${darkMode ? 'text-white group-hover/drop:text-white' : 'text-white group-hover/drop:text-white'}`}>
                    {selectedLabel}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? "rotate-180 text-white" : darkMode ? "text-white" : "text-white"}`} />
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
                                        w-full flex items-center justify-between px-4 py-3 text-[11px] fontsemibold tracking-wide rounded-xl transition-all duration-200
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
const ScoreRing = ({ score, color, label, delay = 0 }) => {
    const r = 36;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    const [currentScore, setCurrentScore] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;
        const duration = 1500; // 1.5s
        const delayMs = delay * 1000;

        const updateScore = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            if (elapsed < delayMs) {
                animationFrame = requestAnimationFrame(updateScore);
                return;
            }

            const activeElapsed = elapsed - delayMs;
            const progress = Math.min(activeElapsed / duration, 1);
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);

            setCurrentScore(Math.floor(easeOutProgress * score));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(updateScore);
            }
        };

        animationFrame = requestAnimationFrame(updateScore);
        return () => cancelAnimationFrame(animationFrame);
    }, [score, delay]);

    return (
        <div className="relative flex flex-col items-center justify-center">
            <div className="relative mb-4">
                <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90 drop-shadow-md">
                    <circle cx="44" cy="44" r={r} strokeWidth="8" fill="none" stroke="rgba(255,255,255,0.05)" />
                    <motion.circle
                        cx="44" cy="44" r={r} strokeWidth="8" fill="none"
                        strokeLinecap="round" strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, delay, ease: "easeOut" }}
                        stroke="#20C45F"
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[28px] font-black tracking-tight drop-shadow-sm " >
                    {currentScore}
                </span>
            </div>
            <span className="text-[11px] fontsemibold uppercase tracking-[0.18em] text-white">
                {label}
            </span>
        </div>
    );
};

/* ─────────────────────────────────────────
   Typing URL Component
───────────────────────────────────────── */
const TypingURL = () => {
    const urls = ["YourWebsite.com", "AcmeMotors.com", "AutoDealer.net"];
    const [currentUrl, setCurrentUrl] = useState('');
    const [urlIndex, setUrlIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let timeout;
        const targetUrl = urls[urlIndex];

        if (!isDeleting) {
            if (currentUrl.length < targetUrl.length) {
                timeout = setTimeout(() => setCurrentUrl(targetUrl.slice(0, currentUrl.length + 1)), 80 + Math.random() * 50);
            } else {
                timeout = setTimeout(() => setIsDeleting(true), 2500);
            }
        } else {
            if (currentUrl.length > 0) {
                timeout = setTimeout(() => setCurrentUrl(targetUrl.slice(0, currentUrl.length - 1)), 40);
            } else {
                setIsDeleting(false);
                setUrlIndex((prev) => (prev + 1) % urls.length);
            }
        }
        return () => clearTimeout(timeout);
    }, [currentUrl, isDeleting, urlIndex, urls]);

    return (
        <span className="text-white text-[13px] font-medium tracking-wide">
            {currentUrl}<span className="animate-pulse opacity-70">|</span>
        </span>
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
    const [device, setDevice] = useState('Mobile');
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

    const handleSubmitWithCaptcha = (e) => {
        e?.preventDefault();
        if (isLoading) return;
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
           style={{
  background: 'linear-gradient(to right, #1E3A8A, #1E47C3)',
}}
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
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] fontsemibold uppercase tracking-[0.22em] border bg-[#ea580c]/15 border-[#ea580c]/30 text-orange-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-pulse inline-block" />
                            Dealer Website Audit Platform
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.div variants={item} className="space-y-4">
                        <h2 className="text-xl lg:text-[3.5rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">
                            Your Dealership,{" "}
                            <br className="hidden lg:block" />
                            <span className="relative inline-block">
                                <span className="text-xl lg:text-[3.5rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#EA580B]">
                                    Fully Audited.
                                </span>
                                {/* Underline accent */}
                                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 300 6" fill="none" preserveAspectRatio="none">
                                    <path d="M0 5 Q75 1 150 4 T300 3" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
                                </svg>
                            </span>
                        </h2>

                        <p className="text-lg lg:text-xl font-medium leading-relaxed max-w-xl mx-auto lg:mx-0 text-white">
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
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font- border bg-white/5 border-white/10 text-white"
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
                            className="relative z-10 rounded-[2.5rem] border p-7 space-y-5 bg-[#566ACB]/70 border-white/8 backdrop-blur-2xl"
                        >
                            {/* Input row */}
                            <div className="flex items-center px-4 h-14 gap-3">
                                <Globe className={`flex-shrink-0 w-4 h-4 transition-colors duration-300
                                    ${focused ? 'text-white' : 'text-white'}`}
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
                                    className="flex-1 bg-transparent outline-none text-[15px] font-medium text-white placeholder:text-gray-400"
                                />
                            </div>

                            {/* Divider + Options row */}
                            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 text-white">
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
                                        { value: "All", label: "Full  Audit (All 7)" },
                                        { value: "Technical Performance", label: "Technical Performance" },
                                        { value: "On Page SEO", label: "On Page SEO" },
                                        { value: "Accessibility", label: "Accessibility" },
                                        { value: "Security/Compliance", label: "Security/Compliance" },
                                        { value: "UX & Content Structure", label: "UX & Content Structure" },
                                        { value: "Conversion & Lead Flow", label: "Conversion & Lead Flow" },
                                        { value: "AIO (AI-Optimization) Readiness", label: "AIO (AI-Search) Readiness" },
                                    ]}
                                    icon={<Settings />}
                                    darkMode={true}
                                    disabled={isLoading}
                                />

                                <button
                                    type="submit"
                                    disabled={isLoading || !url.trim()}
             className={`ml-auto flex items-center gap-2 px-6 h-12 rounded-xl font-semibold text-[14px] tracking-tight shrink-0 border
transition-all duration-300 active:scale-95
${
  isLoading || !url.trim()
    ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"
    : "bg-[#EA580B] border-[#EA580B] text-white hover:bg-[#C2410C] hover:border-[#C2410C] shadow-lg shadow-orange-600/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
}`}
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

                        <span className="text-xs font- text-white">·</span>

                    </motion.div>
                </motion.div>

                {/* ── RIGHT: Dashboard mockup ── */}
                <motion.div
                    initial={{ opacity: 0, x: 50, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 hidden lg:block relative w-full max-w-lg mx-auto"
                >
                    <div className="relative z-10 rounded-[1.5rem] border border-white/5 p-6 space-y-6 bg-[#3D58C1] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden">
                        {/* Subtle inner glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                        {/* Browser chrome */}
                        <div className="flex items-center gap-4 pl-1">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#E35460]" />
                                <div className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
                                <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                            </div>
                            <div className="h-7 w-52 rounded-[0.4rem] bg-[#566ACB] flex items-center px-4 shadow-inner shadow-black/20 border border-white/5">
                                <TypingURL />
                            </div>
                        </div>

                        {/* Header row (skeleton lines) */}
                        <div className="flex items-center justify-between pt-1">
                            <div className="space-y-2.5">
                            
                            </div>
                            <div className="flex gap-1 items-end h-5 mr-1 opacity-80">
                                <div className="w-[3px] h-3 bg-[#E1701A] rounded-[1px]" />
                                <div className="w-[3px] h-5 bg-[#E1701A] rounded-[1px]" />
                                <div className="w-[3px] h-4 bg-[#E1701A] rounded-[1px]" />
                            </div>
                        </div>

                        {/* Score rings */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-[1.25rem] bg-[#566ACB] py-7 flex flex-col items-center justify-center shadow-lg shadow-black/20">
                                <ScoreRing score={94} color="#E1701A" label="SEO SCORE" delay={0.5} />
                            </div>
                            <div className="rounded-[1.25rem] bg-[#566ACB] py-7 flex flex-col items-center justify-center shadow-lg shadow-black/20">
                                <ScoreRing score={88} color="#4D77FF" label="AI Optimization" delay={0.7} />
                            </div>
                        </div>

                        {/* Mini metric bars */}
                        <div className="rounded-[1.25rem] border border-white/[0.03] p-5 pb-6 space-y-4 bg-[#566ACB] shadow-lg shadow-black/20">
                            {[
                                { label: "Accessibility", pct: 78, color: "#A855F7" },
                                { label: "Security", pct: 91, color: "#E1701A" },
                                { label: "AIO Readiness", pct: 63, color: "#EAB308" },
                            ].map((m, i) => (
                                <div key={m.label} className="space-y-2">
                                    <div className="flex justify-between text-[11px] fontsemibold tracking-wide">
                                        <span className="text-white">{m.label}</span>
                                        <span style={{ color: m.color }}>{m.pct}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden bg-[#0B0D1B]">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${m.pct}%` }}
                                            transition={{ duration: 1.2, delay: 0.8 + (i * 0.15), ease: "easeOut" }}
                                            className="h-full rounded-full"
                                            style={{ background: m.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer badge */}
                        <div className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-full border border-white/10 bg-transparent">
                            <span className="text-[#E1701A] text-[13px] drop-shadow-[0_0_8px_rgba(225,112,26,0.6)]">⚡</span>
                            <span className="text-[10px] font- text-white tracking-wider flex gap-2">
                                <span>7 audit dimensions</span>
                                <span className="text-white">•</span>
                                <span>Real-time analysis</span>
                                <span className="text-white">•</span>
                                <span>Dealer-focused insights</span>
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

                            <form onSubmit={handleSubmitWithCaptcha} className={`w-full rounded-2xl border p-5 space-y-4 ${darkMode ? 'bg-white/4 border-white/8' : 'bg-slate-50 border-slate-200'}`}>
                                <MathCaptcha
                                    autoFocus
                                    onAnswerChange={(val, id) => { setCaptchaAnswer(val); setCaptchaId(id); }}
                                    error={captchaError}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !captchaAnswer}
                                    className="w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font- rounded-xl
                                        transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20 active:scale-[0.98]"
                                >
                                    {isLoading ? "Verifying…" : "Verify & Start Audit"}
                                </button>
                            </form>

                            <button
                                onClick={() => setShowCaptcha(false)}
                                className={`text-[11px] font- uppercase tracking-widest transition-colors
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
