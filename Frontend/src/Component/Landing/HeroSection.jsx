import React, { useState, useRef, useContext, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Monitor, Smartphone, Search, Loader2, AlertCircle, ChevronDown, Settings, ArrowRight,
    Globe, CheckCircle2, MinusCircle, Sparkles, ExternalLink, Check, ListChecks,
    Home, LayoutGrid, Car, Tag, Repeat, Key, CreditCard, Wrench, Info, Newspaper,
} from 'lucide-react';
import AuditEmailVerifyModal from "../../Component/AuditEmailVerifyModal.jsx";
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";

// In dev, guests skip the email-verification modal and run straight from the URL.
// The backend mirrors this (guestAuditGate bypasses when NODE_ENV !== 'production').
// Production builds set import.meta.env.DEV = false, so the gate stays on there.
const SKIP_EMAIL_VERIFY = import.meta.env.DEV;

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
    { key: 'service', label: 'Service & Parts', desc: 'Service, repair, parts & accessories', Icon: Wrench },
    { key: 'about', label: 'About / Contact', desc: 'Hours, staff, directions', Icon: Info },
    { key: 'content', label: 'Content / Blog', desc: 'Blog, news, FAQ, how-to', Icon: Newspaper },
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
   Multi-select dropdown — choose which page types are included in the audit.
   Defaults to all selected; the button shows the live count.
───────────────────────────────────────── */
const MultiSelectDropdown = ({ selected, options, onToggle, onSetAll, icon, darkMode, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const allSelected = selected.length === options.length;
    const label = allSelected ? "All Pages" : selected.length === 0 ? "No Pages" : `${selected.length} Pages`;

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
                <span className="text-[13px] font-semibold uppercase tracking-wide truncate max-w-[110px] text-white">{label}</span>
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
                        {/* Select-all / clear toggle */}
                        <button
                            type="button"
                            onClick={() => onSetAll(!allSelected)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 mb-1 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all duration-200
                                ${darkMode ? "text-orange-400 hover:bg-white/5" : "text-[#ea580c] hover:bg-cardsoft"}`}
                        >
                            <span>{allSelected ? "Clear all" : "Select all"}</span>
                            <span className="font-semibold">{selected.length}/{options.length}</span>
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
                                                ? (darkMode ? "bg-[#ea580c]/20 text-orange-400" : "bg-[#ea580c]/10 text-[#ea580c]")
                                                : (darkMode ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-muted hover:bg-cardsoft hover:text-ink")}`}
                                    >
                                        <span className={`flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 transition-colors
                                            ${on ? "bg-[#ea580c] border-[#ea580c]" : darkMode ? "border-white/20" : "border-line"}`}>
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

    // Per-page audit overlay (set once "Run Full Audit" fires for this page).
    const auditing = audit?.status === 'pending';
    const audited = audit?.status === 'success';
    const auditFailed = audit?.status === 'failed';

    // A category can resolve to several pages (VDP sample, separate new/used SRPs).
    const pageCount = cat?.pages?.length || (found ? 1 : 0);

    return (
        <div
            className={`relative flex flex-col gap-1.5 p-4 rounded-2xl border transition-all duration-300
                ${darkMode ? 'bg-white/[0.04] border-white/10' : 'bg-card border-line'}
                ${audited ? 'ring-1 ring-emerald-500/60' : auditing ? 'ring-1 ring-[#ea580c]/50' : found ? 'ring-1 ring-emerald-500/40' : ''}
                ${dimmed ? 'opacity-40' : ''}`}
        >
            {/* status badge top-right — audit state takes priority once it begins */}
            <div className="absolute top-3 right-3">
                {auditing ? <Loader2 className="w-4 h-4 animate-spin text-[#ea580c]" />
                    : audited ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        : auditFailed ? <AlertCircle className="w-4 h-4 text-rose-500" />
                            : detecting ? <Loader2 className="w-4 h-4 animate-spin text-[#ea580c]" />
                                : found ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    : (missing || excluded) ? <MinusCircle className="w-4 h-4 text-slate-400" />
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
                            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#ea580c]">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Auditing{audit.progress ? ` · ${audit.progress}%` : '…'}
                            </span>
                            {audit.stage && (
                                <span className={`block text-[10px] leading-snug truncate ${darkMode ? 'text-orange-300/80' : 'text-[#ea580c]/80'}`} title={audit.stage}>
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
                    {auditFailed && <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-500">Audit failed</span>}
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
    const [device, setDevice] = useState('Mobile');
    const [report, setReport] = useState('All');
    const [showVerify, setShowVerify] = useState(false);
    const [localError, setLocalError] = useState(null);

    // Which dealer page types to include in the audit (defaults to all). The
    // multi-select dropdown in the form drives this; only selected types are
    // audited on "Run Full Audit", and unselected cards are dimmed.
    const [scopes, setScopes] = useState(() => PAGE_TYPES.map((p) => p.key));

    // Discovery state
    const [phase, setPhase] = useState('idle');       // idle | detecting | done
    const [discovery, setDiscovery] = useState(null);
    const [detectError, setDetectError] = useState(null);
    const auditTokenRef = useRef(null);               // guest grant, reused for the audit

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


    const location = useLocation();
    const navigate = useNavigate();
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
                // Only discover the page types the user kept selected — the backend
                // skips all resolution work (status checks, SRP/VDP sampling) for the rest.
                body: JSON.stringify({ url: urlToScan, scopes }),
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
        if (user || SKIP_EMAIL_VERIFY) { beginFlow(null); return; }
        setShowVerify(true);
    };

    // Collapse the backend's many in-flight stages to the 3 states a card cares about.
    const normStatus = (raw) =>
        raw === 'success' || raw === 'completed' ? 'success'
            : raw === 'failed' ? 'failed'
                : 'pending';

    // Flatten the detected categories into one audit task per page. A category may
    // own several pages now (VDP = a 5-car sample, SRP = separate new/used listings),
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
                    auditToken: auditTokenRef.current,
                    screenResolution: `${window.screen.width}x${window.screen.height}`,
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
        const targets = buildTargets();
        if (!targets.length) return;

        setBatchRunning(true);
        window.history.replaceState(null, '', window.location.pathname);

        const results = await Promise.all(targets.map(auditOnePage));
        setBatchRunning(false);
        if (cancelledRef.current) return;

        // Keep pages that produced a report id (drop hard failures with no report).
        const pages = results
            .filter((r) => r && r.id)
            .map((r) => ({ key: r.catKey, label: r.label, url: r.url, id: r.id, status: r.status }));
        if (!pages.length) return;

        // Let the freshly-completed ("✓ Report generated") cards land for a beat before
        // handing off, so the run doesn't appear to jump straight to the summary.
        await new Promise((r) => setTimeout(r, 1100));
        if (cancelledRef.current) return;

        const payload = { siteUrl: normalizeUrl(url), device, report, pages, createdAt: Date.now() };
        try { sessionStorage.setItem('auditSummary', JSON.stringify(payload)); } catch { /* quota */ }
        navigate('/audit-summary', { state: payload });
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

        if (user || SKIP_EMAIL_VERIFY || localStorage.getItem('dealerpulse_token')) {
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

    // Discovery is scoped, so a finished scan is stale once the selection changes —
    // drop it back to idle (and clear any audit state) so the user re-runs "Run Audit"
    // with the new scope and the backend only works on the pages they kept.
    const invalidateDetection = () => {
        if (phase !== 'idle') setPhase('idle');
        setDiscovery(null);
        setDetectError(null);
        setAuditState({});
    };
    const toggleScope = (key) => {
        setScopes((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
        invalidateDetection();
    };
    const setAllScopes = (all) => {
        setScopes(all ? PAGE_TYPES.map((p) => p.key) : []);
        invalidateDetection();
    };

    const visibleTypes = PAGE_TYPES;
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
            agg[catKey] = { status, progress, stage, total, done, failed };
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
                            <MultiSelectDropdown
                                selected={scopes}
                                options={PAGE_TYPES.map((p) => ({ value: p.key, label: p.label }))}
                                onToggle={toggleScope}
                                onSetAll={setAllScopes}
                                icon={<ListChecks />}
                                darkMode={darkMode}
                                disabled={isLoading || batchRunning}
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
                                    disabled={batchRunning}
                                    className="ml-auto flex items-center gap-2 px-6 h-12 rounded-xl font-semibold text-[14px] tracking-tight shrink-0 border transition-all duration-300 active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-500 text-white hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-600/25 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {batchRunning ? <><Loader2 className="animate-spin w-5 h-5" /> Auditing…</> : <>Run Full Audit <ArrowRight size={16} /></>}
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
                    <div className="mb-5">
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

                    <motion.div
                        initial="hidden" animate="show"
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                    >
                        {visibleTypes.map((def) => (
                            <motion.div key={def.key} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
                                <PageCard def={def} phase={phase} cat={catMap[def.key]} darkMode={darkMode} dimmed={!scopes.includes(def.key)} inScope={scopes.includes(def.key)} audit={auditByCat[def.key]} pageAudits={pageAuditsByCat[def.key]} />
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Bottom CTA once detected */}
                    {phase === 'done' && (
                        <div className="flex justify-center mt-8">
                            <button
                                type="button"
                                onClick={handleFullAudit}
                                disabled={batchRunning}
                                className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 hover:shadow-emerald-500/25 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {batchRunning ? <><Loader2 className="w-5 h-5 animate-spin" /> Auditing pages…</> : <>Run Full Audit on These Pages <ArrowRight className="w-5 h-5" /></>}
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
