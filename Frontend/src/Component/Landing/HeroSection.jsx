import React, { useState, useRef, useContext, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Monitor, Smartphone, Search, Loader2, AlertCircle, ChevronDown, Settings, ArrowRight,
    Globe, CheckCircle2, MinusCircle, Sparkles,
    Home, LayoutGrid, Car, Tag, Repeat, Key, CreditCard, Wrench, Cog, Info, Newspaper,
} from 'lucide-react';
import AuditEmailVerifyModal from "../../Component/AuditEmailVerifyModal.jsx";
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";

/* ─────────────────────────────────────────
   Fixed dealership page-type catalog (Screen 01).
   `key` matches the backend discovery categories[].key.
───────────────────────────────────────── */
const PAGE_TYPES = [
    { key: 'home', label: 'Home Page', desc: 'Hero, brand, primary CTAs', Icon: Home },
    { key: 'srp', label: 'Inventory / SRP', desc: 'Search results page, filters', Icon: LayoutGrid },
    { key: 'vdp', label: 'Vehicle Detail / VDP', desc: 'Per-car detail + lead form', Icon: Car },
    { key: 'specials', label: 'Special Offers', desc: 'Manufacturer + dealer specials', Icon: Tag },
    { key: 'trade', label: 'Trade-In Tool', desc: 'KBB-style valuation, lead capture', Icon: Repeat },
    { key: 'lease', label: 'Lease Specials', desc: 'Lease offers + calculator', Icon: Key },
    { key: 'finance', label: 'Finance / Credit', desc: 'Credit app + payment calculator', Icon: CreditCard },
    { key: 'service', label: 'Service & Repair', desc: 'Appt booking + service menu', Icon: Wrench },
    { key: 'parts', label: 'Parts & Accessories', desc: 'Parts catalog + order form', Icon: Cog },
    { key: 'about', label: 'About / Contact', desc: 'Hours, staff, directions', Icon: Info },
    { key: 'content', label: 'Content / Blog', desc: 'Blog, news, resources', Icon: Newspaper },
];

const prettyPath = (url) => {
    try { const u = new URL(url); return (u.pathname + u.search).replace(/\/$/, "") || "/"; }
    catch { return url; }
};

// Full URL without the protocol (host + path), for printing on a detected card.
const prettyUrl = (url) => {
    try { const u = new URL(url); return (u.host + u.pathname + u.search).replace(/\/$/, ""); }
    catch { return (url || "").replace(/^https?:\/\//, ""); }
};

const normalizeUrl = (raw) => {
    let u = (raw || '').trim();
    if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
    return u;
};

/* ─────────────────────────────────────────
   Custom Dropdown (device / report scope)
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
                className={`flex items-center gap-2 px-4 h-11 rounded-xl cursor-pointer transition-all duration-200 border
                    bg-[#FB8C4B] border-[#FB8C4B] hover:bg-[#F97316] hover:border-[#F97316] shadow-sm shadow-orange-500/20
                    ${disabled ? "opacity-60 cursor-not-allowed" : "active:scale-[0.97]"}`}
            >
                <span className="flex-shrink-0 text-white">{React.cloneElement(icon, { size: 16 })}</span>
                <span className="text-[13px] font-semibold uppercase tracking-wide truncate max-w-[110px] text-white">{selectedLabel}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 text-white ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className={`absolute top-full mt-3 left-0 w-64 z-[1000] rounded-[1.5rem] shadow-2xl border overflow-hidden backdrop-blur-2xl p-2
                            ${darkMode ? "bg-slate-900/90 border-white/10" : "bg-card/90 border-line/60"}`}
                    >
                        <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-1">
                            {options.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-[11px] font-semibold tracking-wide rounded-xl transition-all duration-200
                                        ${value === opt.value
                                            ? (darkMode ? "bg-[#ea580c]/20 text-orange-400" : "bg-[#ea580c]/10 text-[#ea580c]")
                                            : (darkMode ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-muted hover:bg-cardsoft hover:text-ink")}`}
                                >
                                    <span className="truncate pr-2">{opt.label}</span>
                                    {value === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />}
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
   One page-type card
───────────────────────────────────────── */
const PageCard = ({ def, phase, cat, darkMode, dimmed }) => {
    const { Icon, label, desc } = def;
    const detecting = phase === 'detecting';
    const done = phase === 'done';
    const found = done && cat?.found;
    const missing = done && cat && !cat.found;

    return (
        <div
            className={`relative flex flex-col gap-1.5 p-4 rounded-2xl border transition-all duration-300
                ${darkMode ? 'bg-white/[0.04] border-white/10' : 'bg-card border-line'}
                ${found ? 'ring-1 ring-emerald-500/40' : ''}
                ${dimmed ? 'opacity-40' : ''}`}
        >
            {/* status badge top-right */}
            <div className="absolute top-3 right-3">
                {detecting ? <Loader2 className="w-4 h-4 animate-spin text-[#ea580c]" />
                    : found ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        : missing ? <MinusCircle className="w-4 h-4 text-slate-400" />
                            : <span className={`block w-4 h-4 rounded-full border-2 ${darkMode ? 'border-white/20' : 'border-line'}`} />}
            </div>

            <div className={`flex items-center justify-center w-9 h-9 rounded-lg mb-0.5
                ${found ? 'bg-emerald-500/10 text-emerald-500'
                    : detecting ? 'bg-[#ea580c]/10 text-[#ea580c]'
                        : darkMode ? 'bg-white/5 text-slate-300' : 'bg-cardsoft text-inksoft'}`}>
                <Icon className="w-5 h-5" />
            </div>

            <h4 className={`text-sm font-bold leading-tight pr-5 ${darkMode ? 'text-white' : 'text-ink'}`}>{label}</h4>
            <p className={`text-[11px] leading-snug ${darkMode ? 'text-slate-400' : 'text-muted'}`}>{desc}</p>

            <div className="mt-1 min-h-[16px]">
                {detecting && <span className="text-[10px] font-semibold uppercase tracking-wider text-[#ea580c]">Detecting…</span>}
                {found && (
                    <div className="space-y-0.5">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-500">✓ Auto-detected</span>
                        <a
                            href={cat.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block text-[11px] font-medium truncate hover:underline ${darkMode ? 'text-emerald-300' : 'text-emerald-600'}`}
                            title={cat.url}
                        >
                            {prettyUrl(cat.url)}
                        </a>
                    </div>
                )}
                {missing && <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Not found</span>}
                {phase === 'idle' && <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">Auto-detect</span>}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────
   Screen 01 — Audit Input
───────────────────────────────────────── */
const HeroSection = ({ onSubmit, isLoading, error: externalError }) => {
    const { theme } = useContext(ThemeContext);
    const { user } = useAuth();
    const darkMode = theme === "dark";

    const [url, setUrl] = useState('');
    const [device, setDevice] = useState('Mobile');
    const [report, setReport] = useState('All');
    const [showVerify, setShowVerify] = useState(false);
    const [localError, setLocalError] = useState(null);

    // Discovery state
    const [phase, setPhase] = useState('idle');       // idle | detecting | done
    const [discovery, setDiscovery] = useState(null);
    const [detectError, setDetectError] = useState(null);
    const auditTokenRef = useRef(null);               // guest grant, reused for the audit

    // Optional "focus on specific page types" scope (defaults: all selected)
    const [scopes, setScopes] = useState(() => PAGE_TYPES.map((p) => p.key));
    const allSelected = scopes.length === PAGE_TYPES.length;

    const location = useLocation();
    const isAutoStarting = useRef(false);

    const catMap = useMemo(
        () => Object.fromEntries((discovery?.categories || []).map((c) => [c.key, c])),
        [discovery]
    );

    // Run page discovery (sitemap → robots.txt → crawl) against the entered URL.
    const detect = async (urlToScan, token) => {
        setPhase('detecting');
        setDiscovery(null);
        setDetectError(null);
        try {
            const bearer = localStorage.getItem('dealerpulse_token');
            const res = await fetch(`${API_URL}/single-audit/discover`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(bearer && { Authorization: `Bearer ${bearer}` }),
                    ...(token && { 'x-audit-token': token }),
                },
                body: JSON.stringify({ url: urlToScan }),
            });
            let data = {};
            try { data = await res.json(); } catch { /* empty */ }
            if (!res.ok) setDetectError(data?.error || data?.message || `Detection failed (${res.status}).`);
            else setDiscovery(data);
        } catch {
            setDetectError('Could not reach the server to detect pages.');
        } finally {
            setPhase('done');
        }
    };

    // Step 1 — "Run Audit": validate, gate guests behind email verification, then detect.
    const beginFlow = (token, rawUrl) => {
        const urlToScan = normalizeUrl(rawUrl ?? url);
        auditTokenRef.current = token || null;
        detect(urlToScan, token || null);
    };

    const handleRun = (e) => {
        e?.preventDefault?.();
        setLocalError(null);
        if (!url.trim()) { setLocalError("Please enter a URL to get started."); return; }
        if (user) { beginFlow(null); return; }
        setShowVerify(true);
    };

    // Step 2 — "Run Full Audit": hand off to the parent, which starts the audit + routes to the report.
    const handleFullAudit = () => {
        onSubmit(normalizeUrl(url), device, report, auditTokenRef.current);
        window.history.replaceState(null, '', window.location.pathname);
    };

    // Modal success → store grant, then detect.
    const handleVerified = (auditToken) => {
        setShowVerify(false);
        beginFlow(auditToken);
    };

    // Changing the URL invalidates a previous scan.
    const onUrlChange = (v) => {
        setUrl(v);
        if (phase !== 'idle') { setPhase('idle'); setDiscovery(null); setDetectError(null); }
    };

    // Deep link: ?url= auto-starts the flow (logged-in detect immediately; guests verify first).
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const queryUrl = params.get("url");
        if (!queryUrl || isAutoStarting.current) return;

        let deviceToUse = params.get("device") || device;
        deviceToUse = deviceToUse.charAt(0).toUpperCase() + deviceToUse.slice(1).toLowerCase();
        if (deviceToUse !== 'Desktop' && deviceToUse !== 'Mobile') deviceToUse = 'Desktop';
        const queryReport = params.get("report");

        setUrl(queryUrl);
        setDevice(deviceToUse);
        if (queryReport) setReport(queryReport);
        isAutoStarting.current = true;

        if (user || localStorage.getItem('dealerpulse_token')) {
            beginFlow(null, queryUrl);
            window.history.replaceState(null, '', window.location.pathname);
        } else {
            setShowVerify(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search, user]);

    // Audit rejected for a missing/expired grant → re-open the verify modal.
    useEffect(() => {
        if (externalError && /verify your email|email verification/i.test(externalError)) setShowVerify(true);
    }, [externalError]);

    const error = externalError || localError;

    const toggleScope = (key) =>
        setScopes((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

    const visibleTypes = PAGE_TYPES.filter((p) => scopes.includes(p.key));
    const foundCount = discovery?.categories?.filter((c) => c.found).length ?? 0;
    const sourceLabel = { sitemap: 'XML sitemap', robots: 'robots.txt → sitemap', crawl: 'link crawl', none: 'direct check' };

    const runBtnDisabled = isLoading || phase === 'detecting' || !url.trim();

    return (
        <section
            className={`relative flex flex-col items-center pt-10 pb-16 px-5 sm:px-6 transition-colors duration-500 ${darkMode ? '' : 'bg-surface'}`}
            style={darkMode ? { background: 'linear-gradient(to bottom, #0B1120, #0A0520)' } : undefined}
        >
            <div className="w-full max-w-6xl mx-auto">

                {/* ── Hero copy ── */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.22em] border bg-[#ea580c]/15 border-[#ea580c]/30 ${darkMode ? 'text-orange-200' : 'text-accent'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-pulse inline-block" />
                        Dealer Website Audit Platform
                    </span>

                    <h1 className={`text-[clamp(2rem,4.6vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.03em] ${darkMode ? 'text-white' : 'text-ink'}`}>
                        Audit any dealer site in{" "}
                        <span className="text-[#EA580B]">48 hours</span>
                    </h1>

                    <p className={`text-[clamp(0.95rem,1.4vw,1.125rem)] font-medium leading-relaxed max-w-2xl mx-auto ${darkMode ? 'text-slate-300' : 'text-inksoft'}`}>
                        Drop a URL. We crawl the right pages, score them on 7 dealer-specific parameters,
                        and hand back a fix list ranked by impact.
                    </p>
                </div>

                {/* ── URL input form ── */}
                <form onSubmit={handleRun} className="relative max-w-3xl mx-auto mt-8 z-[60]">
                    <div className={`rounded-[2rem] border p-4 sm:p-5 backdrop-blur-2xl shadow-2xl shadow-black/20 ${darkMode ? 'bg-[#111a33]/80 border-white/10' : 'bg-card border-line'}`}>
                        <div className="flex items-center px-3 h-12 gap-3">
                            <Globe className={`flex-shrink-0 w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-muted'}`} />
                            <input
                                type="text"
                                autoComplete="off"
                                spellCheck="false"
                                value={url}
                                onChange={(e) => onUrlChange(e.target.value)}
                                placeholder="https://yourdealership.com"
                                disabled={isLoading}
                                className={`flex-1 bg-transparent outline-none text-[15px] font-medium placeholder:text-faint ${darkMode ? 'text-white' : 'text-ink'}`}
                            />
                        </div>

                        <div className={`flex flex-wrap lg:flex-nowrap items-center gap-3 mt-3 ${darkMode ? 'text-white' : 'text-ink'}`}>
                            <CustomDropdown
                                value={device} onChange={setDevice}
                                options={[{ value: "Desktop", label: "Desktop" }, { value: "Mobile", label: "Mobile" }]}
                                icon={device === "Desktop" ? <Monitor /> : <Smartphone />}
                                darkMode={darkMode} disabled={isLoading}
                            />
                            <CustomDropdown
                                value={report} onChange={setReport}
                                options={[
                                    { value: "All", label: "Full Audit (All 7)" },
                                    { value: "Technical Performance", label: "Technical Performance" },
                                    { value: "On Page SEO", label: "On Page SEO" },
                                    { value: "Accessibility", label: "Accessibility" },
                                    { value: "Security/Compliance", label: "Security/Compliance" },
                                    { value: "UX & Content Structure", label: "UX & Content Structure" },
                                    { value: "Conversion & Lead Flow", label: "Conversion & Lead Flow" },
                                    { value: "AIO (AI-Optimization) Readiness", label: "AIO (AI-Search) Readiness" },
                                ]}
                                icon={<Settings />} darkMode={darkMode} disabled={isLoading}
                            />

                            {/* Primary button: Run Audit (detect) → Run Full Audit (audit) */}
                            {phase !== 'done' ? (
                                <button
                                    type="submit"
                                    disabled={runBtnDisabled}
                                    className={`ml-auto flex items-center gap-2 px-6 h-12 rounded-xl font-semibold text-[14px] tracking-tight shrink-0 border transition-all duration-300 active:scale-95
                                        ${runBtnDisabled
                                            ? (darkMode ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed" : "bg-cardsoft border-line text-faint cursor-not-allowed")
                                            : "bg-[#EA580B] border-[#EA580B] text-white hover:bg-[#C2410C] hover:border-[#C2410C] shadow-lg shadow-orange-600/25 hover:-translate-y-0.5"}`}
                                >
                                    {phase === 'detecting' ? <><Loader2 className="animate-spin w-5 h-5" /> Scanning…</> : <>Run Audit <ArrowRight size={16} /></>}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleFullAudit}
                                    disabled={isLoading}
                                    className="ml-auto flex items-center gap-2 px-6 h-12 rounded-xl font-semibold text-[14px] tracking-tight shrink-0 border transition-all duration-300 active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-500 text-white hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-600/25 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <><Loader2 className="animate-spin w-5 h-5" /> Starting…</> : <>Run Full Audit <ArrowRight size={16} /></>}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Auto-detect callout */}
                    <p className={`mt-3 flex items-center justify-center gap-2 text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
                        <Sparkles className="w-3.5 h-3.5 text-[#ea580c]" />
                        One URL → we auto-detect all {PAGE_TYPES.length} dealer page types below.
                    </p>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                className="mt-3 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium"
                            >
                                <AlertCircle size={16} className="flex-shrink-0" />{error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                {/* ── Auto-detect section ── */}
                <div className="mt-12">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
                        <div>
                            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-ink'}`}>
                                {phase === 'done'
                                    ? `Detected ${foundCount} of ${PAGE_TYPES.length} key pages on your site`
                                    : "We'll auto-detect and audit these pages on your site"}
                            </h3>
                            {phase === 'done' && discovery && (
                                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
                                    via {sourceLabel[discovery.source] || discovery.source}
                                    {discovery.sitemapUrl ? ` · ${prettyPath(discovery.sitemapUrl)}` : ''}
                                </p>
                            )}
                            {phase === 'done' && detectError && (
                                <p className="text-xs mt-1 text-amber-500">{detectError} — you can still run the full audit.</p>
                            )}
                        </div>

                        {/* Focus scope */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[11px] font-semibold uppercase tracking-wider mr-1 ${darkMode ? 'text-slate-500' : 'text-faint'}`}>Focus:</span>
                            <button
                                type="button"
                                onClick={() => setScopes(PAGE_TYPES.map((p) => p.key))}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors
                                    ${allSelected ? 'bg-[#ea580c]/15 border-[#ea580c]/30 text-[#ea580c]' : darkMode ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-line text-muted hover:bg-cardsoft'}`}
                            >
                                All
                            </button>
                            {PAGE_TYPES.map((p) => {
                                const on = scopes.includes(p.key) && !allSelected;
                                return (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => toggleScope(p.key)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors
                                            ${on ? 'bg-[#ea580c]/15 border-[#ea580c]/30 text-[#ea580c]' : darkMode ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-line text-muted hover:bg-cardsoft'}`}
                                    >
                                        {p.label.split(' / ')[0]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <motion.div
                        initial="hidden" animate="show"
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                    >
                        {visibleTypes.map((def) => (
                            <motion.div key={def.key} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
                                <PageCard def={def} phase={phase} cat={catMap[def.key]} darkMode={darkMode} dimmed={false} />
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Bottom CTA once detected */}
                    {phase === 'done' && (
                        <div className="flex justify-center mt-8">
                            <button
                                type="button"
                                onClick={handleFullAudit}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 hover:shadow-emerald-500/25 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Starting audit…</> : <>Run Full Audit on These Pages <ArrowRight className="w-5 h-5" /></>}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <AuditEmailVerifyModal
                isOpen={showVerify}
                onClose={() => setShowVerify(false)}
                onVerified={handleVerified}
                darkMode={darkMode}
                isLoading={phase === 'detecting'}
            />
        </section>
    );
};

export default HeroSection;
