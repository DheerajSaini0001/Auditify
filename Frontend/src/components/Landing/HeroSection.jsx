import React, { useState, useRef, useContext, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Monitor, Smartphone, Search, Loader2, AlertCircle, ChevronDown, Settings, ArrowRight,
    Globe, CheckCircle2, MinusCircle, Sparkles, ExternalLink, Check, ListChecks,
    Home, LayoutGrid, Car, Tag, Repeat, Key, CreditCard, Wrench, Info, Newspaper,
    Building2, MapPin, Megaphone,
} from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { pageTypesFor, DEFAULT_PAGE_SCOPES } from '../../config/pageTypes';
import { COUNTRIES, DEFAULT_COUNTRY } from '../../config/countries';
import { trackEvent } from '../../utils/tracking.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";

// Guests run audits with no verification at all. The email/OTP step and the
// captcha that replaced it are both gone; the per-IP report budget on the
// backend is what limits abuse now.

/* ─────────────────────────────────────────
   Audit report sections (Screen 01 report-scope checklist).
   `value` matches the backend section names; "all selected" → a full audit.
───────────────────────────────────────── */
const SECTIONS = [
    { value: 'Technical Performance', label: 'Technical Performance' },
    { value: 'On Page SEO', label: 'On Page SEO' },
    { value: 'Accessibility', label: 'Accessibility' },
    { value: 'Security/Compliance', label: 'Security/Compliance' },
    { value: 'UX & Content Structure', label: 'UX & Content Structure' },
    { value: 'Conversion & Lead Flow', label: 'Conversion & Lead Flow' },
    { value: 'AIO (AI-Optimization) Readiness', label: 'AIO (AI-Search) Readiness' },
    { value: 'AEO (Answer Engine Optimization)', label: 'AEO (Answer Engine)' },
];

// Collapse a section selection into the `report` value the backend expects:
// all (or none) → "All" full audit; exactly one → that section; a partial subset
// → a comma-joined list the worker/report page splits back apart.
const sectionsToReport = (selected) => {
    if (selected.length === 0 || selected.length === SECTIONS.length) return 'All';
    if (selected.length === 1) return selected[0];
    return selected.join(',');
};

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

// Short, card-sized labels for each backend audit stage (the verbose, emoji-prefixed
// strings the status endpoint returns are too long for a small card). Keyed by the
// raw status the worker streams; falls back to the server message, then a generic line.
const STAGE_LABELS = {
    inprogress: 'Starting audit',
    launching: 'Launching browser',
    navigating: 'Opening your website',
    waiting_for_render: 'Rendering the page',
    screenshot_ready: 'Crawling the page',
    extracting_data: 'Scoring sections',
    completed: 'Report generated',
    success: 'Report generated',
    failed: 'Audit failed',
};
const stageLabel = (rawStatus, fallback) => STAGE_LABELS[rawStatus] || fallback || 'Analyzing…';

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
                    bg-accent border-accent hover:bg-accenthover hover:border-accenthover shadow-sm shadow-accent/20
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
                                            ? (darkMode ? "bg-accent/20 text-accent" : "bg-accent/10 text-accent")
                                            : (darkMode ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-muted hover:bg-cardsoft hover:text-ink")}`}
                                >
                                    <span className="truncate pr-2">{opt.label}</span>
                                    {value === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
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
   Multi-select dropdown — choose which page types are included in the audit.
   Defaults to all selected; the button shows the live count.
───────────────────────────────────────── */
const MultiSelectDropdown = ({ selected, options, onToggle, onSetAll, icon, darkMode, disabled, getLabel }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Count only selected keys that are actually in the visible options. `scopes` can
    // hold cross-catalog keys (its default is the dealer+corporate union so corporate
    // keys survive detect()'s filter) — counting the raw length would show nonsense like
    // "11 Pages" / "11/8" when only 8 page types are listed.
    const selectedInOptions = selected.filter((s) => options.some((o) => o.value === s));
    const allSelected = options.length > 0 && selectedInOptions.length === options.length;
    const label = getLabel
        ? getLabel(selectedInOptions, options)
        : allSelected ? "All pages"
            : selectedInOptions.length === 0 ? "No pages"
                // Just the home page = only the URL the user typed, so say that outright.
                : selectedInOptions.length === 1 && selectedInOptions[0] === 'home' ? "This page only"
                    : `${selectedInOptions.length} page${selectedInOptions.length > 1 ? "s" : ""}`;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                /* Sized and coloured to sit level with the country field beside it —
                   this used to be an accent-filled pill from the old three-dropdown
                   row, which now reads as a call to action next to a plain input. */
                className={`flex items-center gap-3 px-3 h-12 w-full sm:w-64 shrink-0 rounded-xl cursor-pointer transition-all duration-200 border
                    ${darkMode ? "bg-white/5 border-white/10" : "bg-surface-2 border-line"}
                    ${disabled ? "opacity-60 cursor-not-allowed" : "active:scale-[0.99]"}`}
            >
                <span className={`flex-shrink-0 ${darkMode ? "text-slate-400" : "text-muted"}`}>{React.cloneElement(icon, { size: 16 })}</span>
                <span className={`flex-1 text-left text-[15px] font-medium truncate ${darkMode ? "text-white" : "text-ink"}`}>{label}</span>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${darkMode ? "text-slate-400" : "text-muted"} ${isOpen ? "rotate-180" : ""}`} />
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
                        {/* Select-all / clear toggle */}
                        <button
                            type="button"
                            onClick={() => onSetAll(!allSelected)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 mb-1 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all duration-200
                                ${darkMode ? "text-accent hover:bg-white/5" : "text-accent hover:bg-cardsoft"}`}
                        >
                            <span>{allSelected ? "Clear all" : "Select all"}</span>
                            <span className="font-semibold">{selectedInOptions.length}/{options.length}</span>
                        </button>

                        <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-1">
                            {options.map((opt) => {
                                const on = selected.includes(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => onToggle(opt.value)}
                                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold tracking-wide rounded-xl transition-all duration-200
                                            ${on
                                                ? (darkMode ? "bg-accent/20 text-accent" : "bg-accent/10 text-accent")
                                                : (darkMode ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-muted hover:bg-cardsoft hover:text-ink")}`}
                                    >
                                        <span className={`flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 transition-colors
                                            ${on ? "bg-accent border-accent" : darkMode ? "border-white/20" : "border-line"}`}>
                                            {on && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                        </span>
                                        <span className="truncate text-left">{opt.label}</span>
                                    </button>
                                );
                            })}
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
const PageCard = ({ def, phase, cat, darkMode, dimmed, audit, pageAudits, inScope = true }) => {
    const { Icon, label, desc } = def;
    // Deselected in the dropdown → never detected or audited, in any phase.
    const excluded = !inScope;
    const detecting = phase === 'detecting' && !excluded;
    const done = phase === 'done';
    const found = done && cat?.found && !excluded;
    const missing = done && cat && !cat.found && !excluded;

    // A category can resolve to several pages (VDP sample, separate new/used SRPs).
    const pageCount = cat?.pages?.length || (found ? 1 : 0);

    // Per-page audit overlay (set once "Run Full Audit" fires for this page).
    const auditing = audit?.status === 'pending';
    const audited = audit?.status === 'success';
    const auditFailed = audit?.status === 'failed';

    return (
        <div
            className={`relative flex flex-col gap-1.5 p-4 rounded-2xl border transition-all duration-300
                ${darkMode ? 'bg-white/[0.04] border-white/10' : 'bg-card border-line'}
                ${audited ? 'ring-1 ring-emerald-500/60' : auditing ? 'ring-1 ring-accent/50' : found ? 'ring-1 ring-emerald-500/40' : ''}
                ${dimmed ? 'opacity-40' : ''}`}
        >
            {/* status badge top-right — audit state takes priority once it begins */}
            <div className="absolute top-3 right-3">
                {auditing ? <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    : audited ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        : auditFailed ? <AlertCircle className="w-4 h-4 text-rose-500" />
                            : detecting ? <Loader2 className="w-4 h-4 animate-spin text-accent" />
                                : found ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    : (missing || excluded) ? <MinusCircle className="w-4 h-4 text-slate-400" />
                                        : <span className={`block w-4 h-4 rounded-full border-2 ${darkMode ? 'border-white/20' : 'border-line'}`} />}
            </div>

            <div className={`flex items-center justify-center w-9 h-9 rounded-lg mb-0.5
                ${found ? 'bg-emerald-500/10 text-emerald-500'
                    : detecting ? 'bg-accent/10 text-accent'
                        : darkMode ? 'bg-white/5 text-slate-300' : 'bg-cardsoft text-inksoft'}`}>
                <Icon className="w-5 h-5" />
            </div>

            <h4 className={`text-sm font-bold leading-tight pr-5 ${darkMode ? 'text-white' : 'text-ink'}`}>{label}</h4>
            <p className={`text-[11px] leading-snug ${darkMode ? 'text-slate-400' : 'text-muted'}`}>{desc}</p>

            <div className="mt-1 min-h-[16px]">
                {detecting && <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">Detecting…</span>}
                {found && (
                    <div className="space-y-0.5">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                            ✓ Auto-detected{pageCount > 1 ? ` · ${pageCount} pages` : ''}
                        </span>
                        {(cat.pages?.length ? cat.pages : [{ url: cat.url }]).map((pg, i) => {
                            // Once THIS page's report is generated, point its link at the
                            // report and open it in a new tab — the current tab (and the rest
                            // of the running batch) stays put.
                            const pa = pageAudits?.[i];
                            const ready = pa?.status === 'success' && pa.id;
                            return (
                                <a
                                    key={pg.url || i}
                                    href={ready ? `/report/${pa.id}` : pg.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`group flex items-center gap-1 text-[11px] font-medium truncate hover:underline ${darkMode ? 'text-emerald-300' : 'text-emerald-600'}`}
                                    title={ready ? `View report — ${pg.url}` : (pg.label ? `${pg.label} — ${pg.url}` : pg.url)}
                                >
                                    {pg.label && <span className="font-semibold flex-shrink-0">{pg.label}:</span>}
                                    <span className="truncate">{ready ? 'View report' : prettyUrl(pg.url)}</span>
                                    {ready && <ExternalLink className="w-3 h-3 flex-shrink-0" />}
                                </a>
                            );
                        })}
                    </div>
                )}
                {missing && <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Not found</span>}
                {excluded && <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Not included</span>}
                {phase === 'idle' && !excluded && <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">Auto-detect</span>}
            </div>

            {/* Audit progress row — appears below detection once the batch starts.
                Shows live stage text (Launching browser → Rendering → Scoring…) so each
                card mirrors the progress the old single-audit loading screen displayed. */}
            {audit && (
                <div className="mt-1.5 pt-1.5 border-t border-dashed border-current/10 min-h-[16px]">
                    {auditing && (
                        <div className="space-y-0.5">
                            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Auditing{audit.progress ? ` · ${audit.progress}%` : '…'}
                            </span>
                            {audit.stage && (
                                <span className={`block text-[10px] leading-snug truncate ${darkMode ? 'text-accent/80' : 'text-accent/80'}`} title={audit.stage}>
                                    {audit.stage}
                                </span>
                            )}
                        </div>
                    )}
                    {audited && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                            ✓ {audit.total > 1 ? `${audit.total} reports generated` : 'Report generated'}
                        </span>
                    )}
                    {auditFailed && (
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-500">Audit failed</span>
                            {audit.error && (
                                <span className="block text-[10px] leading-snug text-rose-400/90" title={audit.error}>
                                    {audit.error}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}
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
    const [device, setDevice] = useState('Desktop');
    // Which audit sections to run (defaults to all → full audit). The report-scope
    // checklist drives this; `report` is the backend value derived from it.
    const [reportSections, setReportSections] = useState(() => SECTIONS.map((s) => s.value));
    const report = useMemo(() => sectionsToReport(reportSections), [reportSections]);
    const [localError, setLocalError] = useState(null);

    // Page types to audit. The home page now offers one thing — a full website
    // audit — so this is no longer a user choice: send no restriction and let the
    // crawler take every key page it finds. DEFAULT_PAGE_SCOPES (home only) still
    // backs the deep-link path, which can ask for a single page.
    // Audit scope is a straight binary: the page you typed, or the whole site.
    //
    // It used to be a per-page-type multi-select, which stopped working once the
    // app grew past one taxonomy. The picker has to render BEFORE the site type
    // is known (detection happens server-side, on submit), so it always showed
    // the DEALER catalog — a repair garage was offered "Trade-In Tool", "Lease
    // Deals" and "Inventory / SRP". Ticking one of those sent a scope key that
    // the service taxonomy can never produce, so the worker's Stage-2 filter
    // matched nothing and silently audited zero extra pages while the user
    // believed they had asked for two. The service taxonomy's own key pages
    // (booking, pricing, locations) were meanwhile unreachable.
    //
    // "Full site" now sends NO restriction, which lets the worker discover
    // against whichever taxonomy the detected site type actually calls for.
    const [auditScope, setAuditScope] = useState('page');   // 'page' | 'site'

    // Market the visitor says they operate in. Captured with the run; see
    // config/countries.js for what it does and does not affect today.
    const [country, setCountry] = useState(DEFAULT_COUNTRY);

    // Scope is the page-type picker (`scopes`, defaulting to the home page alone).
    // Anything past that single page is a site crawl: minutes of work, so it takes an
    // email address first. Derived rather than a separate toggle, so the picker and
    // the run behaviour cannot disagree about what was asked for.

    // Detected site type ("dealer" | "service" | "corporate" | null before the
    // first scan). Drives which page-type catalog pageTypesFor() returns.
    const [siteType, setSiteType] = useState(null);

    // Where to mail a multi-page report. Prefilled for signed-in users — we already
    // know the address, so asking is a confirmation, not a form to fill in.
    const [emailPromptOpen, setEmailPromptOpen] = useState(false);
    const [notifyEmail, setNotifyEmail] = useState('');
    const [emailError, setEmailError] = useState(null);

    // Discovery state
    const [phase, setPhase] = useState('idle');       // idle | detecting | done
    const [discovery, setDiscovery] = useState(null);
    const [detectError, setDetectError] = useState(null);
    // True when the backend hard-rejected the URL (not a dealer/automotive
    // corporate site) — distinct from a transient network/server error.
    const [rejected, setRejected] = useState(false);
    // True when the per-IP report budget is exhausted (429 REPORT_LIMIT_EXCEEDED)
    // — nothing can run until the window rolls over, so don't imply otherwise.
    const [budgetBlocked, setBudgetBlocked] = useState(false);
    // Guards the auto-start effect below so a completed scan kicks off the full
    // audit exactly once. This was referenced there but never declared, which
    // threw a ReferenceError the moment discovery finished.
    const autoAuditRanFor = useRef(null);

    // Parallel per-page audit state. `auditState[pageKey] = { status, id, progress, url, error }`
    // where status is pending | success | failed. `batchRunning` guards re-entry; once the
    // batch starts we stay on this page and surface progress on each card (no navigation).
    const [auditState, setAuditState] = useState({});
    const [batchRunning, setBatchRunning] = useState(false);
    const cancelledRef = useRef(false);
    // Reset on mount and only cancel on a real unmount. Without the reset, React
    // StrictMode's dev double-mount (mount → cleanup → remount) would leave the ref
    // stuck `true`, freezing every poll loop before it runs a single iteration.
    useEffect(() => {
        cancelledRef.current = false;
        return () => { cancelledRef.current = true; };
    }, []);


    const { fetchData } = useData();
    const location = useLocation();
    const navigate = useNavigate();
    const isAutoStarting = useRef(false);
    const urlInputRef = useRef(null);                 // the audit URL field (for "Check My Website")
    const visibleTypes = pageTypesFor(siteType);
    const fullSiteRun = auditScope === 'site';
    // The dormant per-category discovery UI further down still reasons in
    // page-type keys, so keep a derived list rather than scattering the binary
    // through it: "this page only" is the home page, "full site" is every key
    // page in whichever catalog the detected site type calls for.
    const scopes = fullSiteRun ? visibleTypes.map((p) => p.key) : DEFAULT_PAGE_SCOPES;

    // "Check My Website" (footer) navigates to "/" with state.focusAudit — scroll to the
    // top and focus the URL field so the keyboard opens. Keyed on location.key so it fires
    // every time the link is clicked, even when already on the home page.
    useEffect(() => {
        if (!location.state?.focusAudit) return;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // A short delay lets the smooth scroll begin and the field mount before focusing;
        // focusing opens the on-screen keyboard on touch devices and the caret on desktop.
        // Focus FIRST, then clear the flag — clearing it via navigate() changes
        // location.key and re-runs this effect, whose cleanup would cancel a still-pending
        // focus timeout. Doing it inside the timeout (after focus) avoids that.
        const t = setTimeout(() => {
            urlInputRef.current?.focus();
            // Strip the flag so a refresh / back-nav doesn't re-trigger the jump.
            navigate(location.pathname, { replace: true, state: {} });
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.key]);

    // Step 1 — "Run Audit": validate, then run. No verification gate for anyone.
    const beginFlow = async (rawUrl, notifyEmail = null, { fullSite = false } = {}) => {
        const urlToScan = normalizeUrl(rawUrl ?? url);
        setPhase('detecting');
        setLocalError(null);

        // null = no restriction, i.e. every key page the crawler finds against the
        // site type the backend detects. ["home"] = only the URL that was typed.
        // Deliberately NOT a list of page-type keys: sending keys the detected
        // taxonomy can't produce is what used to silently audit nothing.
        const scopesToSend = (fullSite || fullSiteRun) ? null : DEFAULT_PAGE_SCOPES;

        const result = await fetchData(urlToScan, device, report, false, scopesToSend, notifyEmail, country);
        setPhase('idle');

        if (result?.success && result?.id) {
            // A run we promised to email about is one the visitor is meant to walk
            // away from. Tell the report page so it can say so instead of holding
            // them on a progress bar for minutes.
            navigate(`/report/${result.id}`, notifyEmail ? { state: { notifyEmail } } : undefined);
        } else {
            setLocalError(result?.error || "Could not start audit.");
        }
    };

    const handleRun = (e) => {
        e?.preventDefault?.();
        setLocalError(null);

        // Logged BEFORE the empty-URL guard, so the funnel counts the clicks that
        // went nowhere too. A click that only produces a validation message is
        // invisible to every server-side metric, and it is the most interesting
        // part of the click → start drop-off.
        trackEvent('AUDIT_BUTTON_CLICK', {
            url: url.trim() || null,
            metadata: {
                source: 'hero',
                device,
                report,
                fullSite: !!fullSiteRun,
                country: country || null,
                valid: !!url.trim(),
            },
        });

        if (!url.trim()) { setLocalError("Please enter a URL to get started."); return; }

        // One page finishes while they watch, so it just runs. A crawl outlives their
        // patience, so it has to be able to reach them after they close the tab.
        if (fullSiteRun) {
            setEmailPromptOpen(true);
            return;
        }
        beginFlow();
    };

    const submitNotifyEmail = (e) => {
        e?.preventDefault?.();
        const address = notifyEmail.trim();
        if (!EMAIL_RE.test(address)) {
            setEmailError('Enter an email address we can send the report to.');
            return;
        }
        setEmailError(null);
        setEmailPromptOpen(false);
        beginFlow(undefined, address, { fullSite: true });
    };

    // Collapse the backend's many in-flight stages to the 3 states a card cares about.
    const normStatus = (raw) =>
        raw === 'success' || raw === 'completed' ? 'success'
            : raw === 'failed' ? 'failed'
                : 'pending';

    // Flatten the detected categories into one audit task per page. A category may
    // own several pages now (VDP = a 2-car sample, SRP = separate new/used listings),
    // so each task gets a unique `auditKey` and a display `label` that disambiguates
    // the samples (e.g. "Vehicle Detail / VDP — Used 1"). `catKey` keeps the task tied
    // back to its card for aggregate progress.
    const buildTargets = () =>
        (discovery?.categories || [])
            .filter((c) => c.found && scopes.includes(c.key))
            .flatMap((c) => {
                const pages = (c.pages && c.pages.length ? c.pages : (c.url ? [{ url: c.url }] : []))
                    .filter((pg) => pg.url);
                const multi = pages.length > 1;
                return pages.map((pg, i) => ({
                    auditKey: `${c.key}__${i}`,
                    catKey: c.key,
                    url: pg.url,
                    label: multi && pg.label ? `${c.label} — ${pg.label}` : c.label,
                }));
            });

    // Audit ONE page: start it, then poll its status until terminal. State lives
    // under the task's unique `auditKey` so every page updates independently; the
    // resolved { catKey, auditKey, label, url, id, status } is handed to the summary.
    const auditOnePage = async (target) => {
        const { auditKey, catKey, label, url: targetUrl } = target;
        setAuditState((prev) => ({ ...prev, [auditKey]: { catKey, label, status: 'pending', id: null, progress: 0, url: targetUrl, stage: 'Starting audit' } }));

        const bearer = localStorage.getItem('dealerpulse_token');
        const headers = { 'Content-Type': 'application/json', ...(bearer && { Authorization: `Bearer ${bearer}` }) };
        const endpoint = bearer ? '/api/user/audit' : '/single-audit/audit';

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify({
                    url: targetUrl,
                    device,
                    report,
                    screenResolution: `${window.screen.width}x${window.screen.height}`,
                    pageType: catKey,
                    // Reuse the siteType this same /discover scan already resolved —
                    // the worker needs it to re-classify a redirected page correctly.
                    siteType: siteType || undefined,
                }),
            });
            let data = {};
            try { data = await res.json(); } catch { /* empty */ }

            if (!res.ok || !data._id) {
                setAuditState((prev) => ({ ...prev, [auditKey]: { ...prev[auditKey], status: 'failed', error: data.error || data.message || `Failed (${res.status})` } }));
                return { catKey, auditKey, label, url: targetUrl, id: null, status: 'failed' };
            }

            const id = data._id;
            let status = normStatus(data.status);
            setAuditState((prev) => ({ ...prev, [auditKey]: { ...prev[auditKey], id, status } }));

            // Poll this report until it's generated (or fails). Each page polls
            // independently. We poll quickly the first time (so even a fast/cached
            // audit surfaces at least one progress update before it finishes), then
            // settle into a steady 2.5s cadence.
            let firstPoll = true;
            while (status === 'pending' && !cancelledRef.current) {
                await new Promise((r) => setTimeout(r, firstPoll ? 1000 : 2500));
                firstPoll = false;
                if (cancelledRef.current) return { catKey, auditKey, label, url: targetUrl, id, status };
                try {
                    const sres = await fetch(`${API_URL}/single-audit/${id}/status`, {
                        credentials: 'include',
                        headers: { ...(bearer && { Authorization: `Bearer ${bearer}` }) },
                    });
                    const sdata = await sres.json();
                    status = normStatus(sdata.status);
                    // The backend returns a clean, section-aware message (e.g.
                    // "Analyzing your site — 3/7 sections scored"); prefer it, and fall
                    // back to the raw-status label map only if it's ever missing.
                    const stage = (sdata.message && String(sdata.message).trim()) || stageLabel(sdata.status);
                    setAuditState((prev) => ({
                        ...prev,
                        [auditKey]: {
                            ...prev[auditKey],
                            status,
                            progress: sdata.progress ?? prev[auditKey]?.progress ?? 0,
                            stage,
                        },
                    }));
                } catch { /* transient poll error — keep trying */ }
            }
            return { catKey, auditKey, label, url: targetUrl, id, status };
        } catch {
            setAuditState((prev) => ({ ...prev, [auditKey]: { ...prev[auditKey], status: 'failed', error: 'Could not reach the server.' } }));
            return { catKey, auditKey, label, url: targetUrl, id: null, status: 'failed' };
        }
    };

    // Step 2 — "Run Full Audit on These Pages": kick off an audit for every detected
    // page IN PARALLEL (including the VDP sample + each inventory listing), surfacing
    // per-card progress on this screen. Once every report is generated, hand the set
    // to the intermediate Audit Summary page (overall score + page-type heatmap).
    const handleFullAudit = async () => {
        if (batchRunning) return;
        if (reportSections.length === 0) { setLocalError("Select at least one audit section to run."); return; }
        const targets = buildTargets();
        if (!targets.length) return;

        setBatchRunning(true);
        window.history.replaceState(null, '', window.location.pathname);

        const bearer0 = localStorage.getItem('dealerpulse_token');
        const lookupHeaders = { 'Content-Type': 'application/json', ...(bearer0 && { Authorization: `Bearer ${bearer0}` }) };

        // Multi-sample categories (VDP, SRP) can't reuse via the normal per-URL
        // dedupe: their sample URLs are freshly discovered each run, the sample
        // reports are deleted after merging, and the merged report lives under a
        // synthetic "#merged-" URL. So before auditing the samples, ask the
        // backend for an existing merged report for this site + pageType — a hit
        // means the whole category resolves instantly, exactly like the
        // single-page cache hits.
        const byCatTargets = {};
        for (const t of targets) (byCatTargets[t.catKey] = byCatTargets[t.catKey] || []).push(t);
        const reusedPages = [];
        const reusedCats = new Set();
        await Promise.all(
            Object.entries(byCatTargets)
                .filter(([, list]) => list.length > 1)
                .map(async ([catKey, list]) => {
                    try {
                        const res = await fetch(`${API_URL}/single-audit/find-merged`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: lookupHeaders,
                            body: JSON.stringify({ url: normalizeUrl(url), pageType: catKey, device }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (res.ok && data._id) {
                            reusedCats.add(catKey);
                            const baseLabel = (list[0].label || '').split(' — ')[0] || list[0].label;
                            reusedPages.push({ key: catKey, label: baseLabel, url: list[0].url, id: data._id, status: 'success', mergedFrom: data.mergedFrom });
                            // Surface the instant cache hit on the category's card.
                            setAuditState((prev) => ({
                                ...prev,
                                [`${catKey}__cached`]: { catKey, label: baseLabel, status: 'success', id: data._id, progress: 100, url: list[0].url, stage: 'Loaded from a recent audit' },
                            }));
                        }
                    } catch { /* lookup is best-effort — fall through to a full audit */ }
                })
        );

        const runTargets = targets.filter((t) => !reusedCats.has(t.catKey));
        const results = await Promise.all(runTargets.map(auditOnePage));
        setBatchRunning(false);
        if (cancelledRef.current) return;

        // Group successful results by category. A category sampled across several pages
        // (VDP = 2 cars, SRP = new/used) is merged server-side into ONE averaged report,
        // so the summary shows a single row whose drill-in IS that averaged report.
        const ok = results.filter((r) => r && r.id && r.status !== 'failed');
        const byCat = [];
        const catIndex = new Map();
        for (const r of ok) {
            if (!catIndex.has(r.catKey)) { catIndex.set(r.catKey, byCat.length); byCat.push({ catKey: r.catKey, items: [] }); }
            byCat[catIndex.get(r.catKey)].items.push(r);
        }

        const bearer = localStorage.getItem('dealerpulse_token');
        const mergeHeaders = { 'Content-Type': 'application/json', ...(bearer && { Authorization: `Bearer ${bearer}` }) };

        // Categories resolved from the merged-report cache skip auditing entirely.
        const pages = [...reusedPages];
        for (const { catKey, items } of byCat) {
            if (items.length === 1) {
                const r = items[0];
                pages.push({ key: catKey, label: r.label, url: r.url, id: r.id, status: r.status });
                continue;
            }
            // Multiple samples → merge into one averaged report.
            const baseLabel = (items[0].label || '').split(' — ')[0] || items[0].label;
            try {
                const mres = await fetch(`${API_URL}/single-audit/merge`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: mergeHeaders,
                    body: JSON.stringify({ ids: items.map((it) => it.id), pageType: catKey }),
                });
                const mdata = await mres.json().catch(() => ({}));
                if (mres.ok && mdata._id) {
                    pages.push({ key: catKey, label: baseLabel, url: items[0].url, id: mdata._id, status: 'success', mergedFrom: mdata.mergedFrom || items.length });
                } else {
                    // Merge failed — fall back to listing the samples individually.
                    items.forEach((r) => pages.push({ key: catKey, label: r.label, url: r.url, id: r.id, status: r.status }));
                }
            } catch {
                items.forEach((r) => pages.push({ key: catKey, label: r.label, url: r.url, id: r.id, status: r.status }));
            }
        }
        if (!pages.length) return;

        // Let the freshly-completed ("✓ Report generated") cards land for a beat before
        // handing off, so the run doesn't appear to jump straight to the summary.
        await new Promise((r) => setTimeout(r, 1100));
        if (cancelledRef.current) return;

        const payload = { siteUrl: normalizeUrl(url), device, report, pages, createdAt: Date.now() };
        try { sessionStorage.setItem('auditSummary', JSON.stringify(payload)); } catch { /* quota */ }
        navigate('/audit-summary', { state: payload });
    };

    // Auto-start: once discovery lands successfully, kick off the full audit
    // immediately instead of waiting for a click on "Run Full Audit on These
    // Pages". Runs exactly once per completed scan — invalidateDetection()
    // (scope change / new URL) clears `discovery`, so the next scan re-arms.
    // The button stays rendered as a visible progress state and manual retry.
    useEffect(() => {
        if (phase !== 'done' || !discovery || rejected || budgetBlocked || batchRunning) return;
        if (autoAuditRanFor.current === discovery) return;
        if (reportSections.length === 0) return; // nothing selected to score — leave it manual
        const anyFound = (discovery.categories || []).some((c) => c.found && scopes.includes(c.key));
        if (!anyFound) return;
        autoAuditRanFor.current = discovery;
        handleFullAudit();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, discovery, rejected, budgetBlocked]);

    // Signed-in visitors should not have to type an address we already hold.
    useEffect(() => {
        if (user?.email && !notifyEmail) setNotifyEmail(user.email);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.email]);

    // Changing the URL invalidates a previous scan.
    const onUrlChange = (v) => {
        setUrl(v);
        if (phase !== 'idle') { setPhase('idle'); setDiscovery(null); setDetectError(null); }
    };

    // Deep link: ?url= auto-starts the flow immediately, for guests and users alike.
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
        // ?report= may be "All", a single section, or a comma-joined subset.
        if (queryReport) {
            const next = queryReport === 'All'
                ? SECTIONS.map((s) => s.value)
                : queryReport.split(',').map((s) => s.trim()).filter((v) => SECTIONS.some((s) => s.value === v));
            if (next.length) setReportSections(next);
        }
        isAutoStarting.current = true;

        beginFlow(queryUrl);
        window.history.replaceState(null, '', window.location.pathname);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search, user]);

    const error = externalError || localError;

    // Discovery is scoped, so a finished scan is stale once the selection changes —
    // drop it back to idle (and clear any audit state) so the user re-runs "Run Audit"
    // with the new scope and the backend only works on the pages they kept.
    const invalidateDetection = () => {
        if (phase !== 'idle') setPhase('idle');
        setDiscovery(null);
        setDetectError(null);
        setRejected(false);
        setBudgetBlocked(false);
        setAuditState({});
    };
    // Switching between "this page only" and "full website audit" changes which
    // pages a scan would cover, so any finished scan is stale.
    useEffect(() => { invalidateDetection(); }, [auditScope]);   // eslint-disable-line react-hooks/exhaustive-deps

    // Report-section checklist. Section choice only affects what the audit scores
    // (not which pages are discovered), so it never invalidates an existing scan.
    const toggleSection = (val) =>
        setReportSections((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
    const setAllSections = (all) => setReportSections(all ? SECTIONS.map((s) => s.value) : []);

    const foundCount = discovery?.categories?.filter((c) => c.found).length ?? 0;
    const sourceLabel = { sitemap: 'XML sitemap', robots: 'robots.txt → sitemap', crawl: 'link crawl', none: 'direct check' };

    // Group the individual page-audit tasks by their card (catKey). The card uses
    // this to surface each page's own status + a "view report" link the instant
    // that page finishes — independent of the rest of the batch.
    const tasksByCat = useMemo(() => {
        const m = {};
        for (const t of Object.values(auditState)) {
            if (!t?.catKey) continue;
            (m[t.catKey] = m[t.catKey] || []).push(t);
        }
        return m;
    }, [auditState]);

    // A category can fan out into several page audits (VDP sample, separate SRPs).
    // Roll the individual task states up to one aggregate per card: combined %,
    // a "done/total pages" stage, and a status that stays 'pending' until all land.
    const auditByCat = useMemo(() => {
        const agg = {};
        for (const [catKey, tasks] of Object.entries(tasksByCat)) {
            const total = tasks.length;
            const done = tasks.filter((t) => t.status === 'success').length;
            const failed = tasks.filter((t) => t.status === 'failed').length;
            const pending = total - done - failed;
            const progress = Math.round(tasks.reduce((s, t) => s + (t.progress || 0), 0) / total);
            const status = pending > 0 ? 'pending' : done > 0 ? 'success' : 'failed';
            const stage = total > 1 ? `${done}/${total} pages done` : tasks[0]?.stage;
            // Surface WHY it failed: a start-request rejection stores `error`
            // (e.g. the rate-limit message); a worker failure leaves the backend's
            // error text as the last polled `stage`.
            const failedTask = failed > 0 ? tasks.find((t) => t.status === 'failed') : null;
            const error = failedTask ? (failedTask.error || failedTask.stage) : null;
            agg[catKey] = { status, progress, stage, total, done, failed, error };
        }
        return agg;
    }, [auditState]);

    // Per-page audit state indexed by category + page position, so each card link can
    // flip to its finished report (new tab) the moment that one page completes —
    // independently of the rest of the batch, which keeps running.
    const pageAuditsByCat = useMemo(() => {
        const m = {};
        for (const [auditKey, t] of Object.entries(auditState)) {
            if (!t?.catKey) continue;
            const idx = Number(auditKey.split('__')[1]);
            (m[t.catKey] = m[t.catKey] || [])[idx] = t;
        }
        return m;
    }, [auditState]);

    // Count only page types that are both selected AND in the currently-visible
    // catalog — `scopes` defaults to the dealer+corporate union, so its raw length
    // can exceed what's actually shown. "No page selected" ⇒ nothing to audit.
    const selectedPageCount = scopes.filter((k) => visibleTypes.some((p) => p.key === k)).length;
    // Sections and pages are no longer selectable — the button always means "all of
    // it" — so a URL is the only thing that can be missing.
    const runBtnDisabled = isLoading || phase === 'detecting' || !url.trim();

    return (
        <section
            className={`relative flex flex-col items-center pt-10 pb-16 px-5 sm:px-6 transition-colors duration-500 ${darkMode ? '' : 'bg-surface'}`}
            style={darkMode ? { background: 'linear-gradient(to bottom, #0B1120, #0A0520)' } : undefined}
        >
            <div className="w-full max-w-7xl mx-auto">

                {/* ── Hero copy ── */}
                <div className="text-center max-w-4xl mx-auto space-y-4 flex flex-col items-center justify-center">

                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border
                        ${darkMode ? 'bg-accent/10 border-accent/25 text-accent' : 'bg-accent/10 border-accent/20 text-accent'}`}>
                        <Car size={13} /> For dealership &amp; automotive websites
                    </span>

                    <h1 className={`text-center text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-[-0.03em] ${darkMode ? 'text-white' : 'text-ink'}`}>
                        Your website, checked in{" "}
                        <span className="text-accent">minutes</span>
                    </h1>

                    <p className={`text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto ${darkMode ? 'text-slate-300' : 'text-inksoft'}`}>
                        Enter your web address. We open your site the way a customer does, then give
                        you a clear list of what to fix first.
                    </p>
                </div>

                {/* ── URL input form ── */}
                <form onSubmit={handleRun} className="relative max-w-5xl mx-auto mt-8 z-[60]">
                    <div className={`rounded-[2rem] border p-4 sm:p-5 backdrop-blur-2xl shadow-2xl shadow-black/20 ${darkMode ? 'bg-[#111a33]/80 border-white/10' : 'bg-card border-line'}`}>
                        <div className="flex items-center px-3 h-12 gap-3">
                            <Globe className={`flex-shrink-0 w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-muted'}`} />
                            <input
                                ref={urlInputRef}
                                id="audit-url-input"
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

                        {/* Two inputs and one button. The device / section / page-scope
                            pickers that used to sit here are gone: every run from the home
                            page is now the full-website audit, so they only ever offered
                            ways to ask for less. Their values are still sent — fixed at
                            Desktop, all eight sections, every key page. */}
                        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-3 ${darkMode ? 'text-white' : 'text-ink'}`}>
                            <div className={`flex items-center px-3 h-12 gap-3 rounded-xl border sm:w-64 shrink-0 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-surface-2 border-line'}`}>
                                <MapPin className={`flex-shrink-0 w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-muted'}`} />
                                <select
                                    aria-label="Country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    disabled={isLoading}
                                    className={`flex-1 bg-transparent outline-none text-[15px] font-medium cursor-pointer ${darkMode ? 'text-white' : 'text-ink'}`}
                                >
                                    {COUNTRIES.map((c) => (
                                        <option key={c.code} value={c.code} className={darkMode ? 'bg-slate-900' : 'bg-card'}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Scope — one decision, made up front: the page you typed
                                (finishes while you wait) or the whole site (a crawl that
                                needs an email). Deliberately NOT a per-page-type picker:
                                the site type isn't known until the backend detects it on
                                submit, so any page-type list rendered here would be a
                                guess — see the auditScope comment above. */}
                            <div className={`flex items-center px-3 h-12 gap-3 rounded-xl border sm:w-64 shrink-0 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-surface-2 border-line'}`}>
                                <ListChecks className={`flex-shrink-0 w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-muted'}`} />
                                <select
                                    aria-label="Audit scope"
                                    value={auditScope}
                                    onChange={(e) => setAuditScope(e.target.value)}
                                    disabled={isLoading}
                                    className={`flex-1 bg-transparent outline-none text-[15px] font-medium cursor-pointer ${darkMode ? 'text-white' : 'text-ink'}`}
                                >
                                    <option value="page" className={darkMode ? 'bg-slate-900' : 'bg-card'}>This page only</option>
                                    <option value="site" className={darkMode ? 'bg-slate-900' : 'bg-card'}>Full website audit</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={runBtnDisabled}
                                className={`sm:ml-auto flex items-center justify-center gap-2 px-6 h-12 rounded-xl font-semibold text-[14px] tracking-tight shrink-0 border transition-all duration-300 active:scale-95
                                    ${runBtnDisabled
                                        ? (darkMode ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed" : "bg-cardsoft border-line text-faint cursor-not-allowed")
                                        : "bg-accent border-accent text-white hover:bg-accenthover hover:border-accenthover shadow-lg shadow-accent/25 hover:-translate-y-0.5"}`}
                            >
                                {phase === 'detecting'
                                    ? <><Loader2 className="animate-spin w-5 h-5" /> Starting…</>
                                    /* Label follows the scope — a button that says
                                       "Full Website Audit" while the picker says
                                       "This page only" is a promise it will not keep. */
                                    : <>{fullSiteRun ? 'Full Website Audit' : 'Run Audit'} <ArrowRight size={16} /></>}
                            </button>
                        </div>
                    </div>

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

                    {/* What to expect — answers the three questions people ask before typing a URL */}
                    <div className={`mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm font-medium
                        ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
                        {[
                            'No card needed',
                            'Takes a few minutes',
                            'Nothing on your site is changed',
                        ].map((t) => (
                            <span key={t} className="inline-flex items-center gap-2">
                                <CheckCircle2 size={15} className="text-accent flex-shrink-0" />
                                {t}
                            </span>
                        ))}
                    </div>
                </form>
            </div>

            {/* ── Where should we send it? ──
                A multi-page run outlives the visitor's patience, so we take an
                address before starting rather than stranding them on a progress bar. */}
            <AnimatePresence>
                {emailPromptOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setEmailPromptOpen(false)}
                    >
                        <motion.form
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            onClick={(e) => e.stopPropagation()}
                            onSubmit={submitNotifyEmail}
                            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 text-left
                                ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-card border-line'}`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-2xl shrink-0 ${darkMode ? 'bg-accent/10' : 'bg-accent/10'}`}>
                                    <ListChecks size={22} className="text-accent" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className={`font-black text-lg tracking-tight ${darkMode ? 'text-white' : 'text-ink'}`}>
                                        Where should we send the report?
                                    </h2>
                                    <p className={`text-sm mt-2 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
                                        A full website audit crawls every key page we can find, so it takes a few
                                        minutes. Leave your email and you can close the tab — we will send the
                                        report the moment it is ready.
                                    </p>
                                </div>
                            </div>

                            <input
                                type="email"
                                autoFocus
                                value={notifyEmail}
                                onChange={(e) => { setNotifyEmail(e.target.value); setEmailError(null); }}
                                placeholder="you@dealership.com"
                                className={`w-full mt-5 h-12 px-4 rounded-xl text-sm font-medium border transition-colors focus:outline-none focus:border-accent
                                    ${darkMode ? 'bg-slate-850 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-surface-2 border-line text-ink placeholder:text-faint'}`}
                            />
                            {emailError && (
                                <p className="text-xs font-semibold text-rose-500 mt-2">{emailError}</p>
                            )}

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-5">
                                <button
                                    type="button"
                                    onClick={() => setEmailPromptOpen(false)}
                                    className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98]
                                        ${darkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-line text-muted hover:bg-surface-2'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accenthover text-white text-xs font-semibold shadow-md shadow-accent/20 transition-all active:scale-[0.98]"
                                >
                                    Start audit
                                </button>
                            </div>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default HeroSection;
