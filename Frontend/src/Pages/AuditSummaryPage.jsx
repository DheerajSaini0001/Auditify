import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, ChevronLeft } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";
import CircularProgress from "../Component/CircularProgress";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";

/* ─────────────────────────────────────────
   The 7 dealer-audit dimensions, mapped to the report fields and the standalone
   section routes. Clicking a heatmap cell drills into `/${link}/${reportId}`.
───────────────────────────────────────── */
// `column` is the heatmap column heading — it uses the SAME section names as the report
// sidebar so a cell is unambiguous (the old abbreviations were cryptic and some were
// plain wrong: "AI" was AIO Readiness, "Lead" was Conversion & Lead Flow, "UI / UX" was
// UX & Content Structure). `label` is the longer name used in cell tooltips.
const SECTIONS = [
    { key: "technicalPerformance", column: "Technical Performance", label: "Technical Performance", link: "technical-performance" },
    { key: "onPageSEO", column: "On-Page SEO", label: "On-Page SEO", link: "on-page-seo" },
    { key: "accessibility", column: "Accessibility", label: "Accessibility", link: "accessibility" },
    { key: "UXOrContentStructure", column: "UX & Content", label: "UX & Content Structure", link: "ux-content-structure" },
    { key: "conversionAndLeadFlow", column: "Conversion Flow", label: "Conversion & Lead Flow", link: "conversion-lead-flow" },
    { key: "securityOrCompliance", column: "Security", label: "Security & Compliance", link: "security-compliance" },
    { key: "aioReadiness", column: "AIO Readiness", label: "AIO Readiness", link: "aio" },
    { key: "aeo", column: "AEO", label: "Answer Engine Optimization", link: "aeo" },
];

const PAGE_IMPORTANCE = {
    home: 2.0,
    vdp: 1.75,
    srp: 1.5,
    finance: 1.25,
    trade: 1.25,
    specials: 1.25,
    lease: 1.25,
    service: 1.0,
    about: 0.75,
    content: 0.75,
};

// Fixed heatmap row order (dealer catalog first, then the corporate-only keys).
// Rows always render in this sequence regardless of discovery/completion order;
// any unknown key falls to the end in its arrival order.
const ROW_ORDER = ["home", "srp", "vdp", "trade", "lease", "service", "about", "content", "models", "locator", "press"];
const rowRank = (key) => {
    const i = ROW_ORDER.indexOf(key);
    return i === -1 ? ROW_ORDER.length : i;
};

// Score → tier. Mirrors the heatmap legend: Strong ≥75, Needs work 55–74, Critical <55.
const tierOf = (v) => (v == null ? "na" : v >= 75 ? "strong" : v >= 55 ? "mid" : "low");

const TIER_BG = {
    strong: "bg-emerald-500 text-white",
    mid: "bg-amber-500 text-white",
    low: "bg-red-500 text-white",
};

const prettyHost = (u) => {
    try { return new URL(u).host.replace(/^www\./, ""); }
    catch { return (u || "").replace(/^https?:\/\//, "").replace(/^www\./, ""); }
};

// Compact display form of an audited page URL (shown under each heatmap row
// label): host + path, no protocol/www, no trailing slash. The homepage
// collapses to just the host.
const prettyPageUrl = (u) => {
    try {
        const url = new URL(u);
        const path = (url.pathname + url.search).replace(/\/$/, "");
        return url.host.replace(/^www\./, "") + path;
    } catch { return (u || "").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, ""); }
};

const gradeFor = (score) => {
    const s = Number(score) || 0;
    return s >= 90 ? "A+" : s >= 80 ? "A" : s >= 70 ? "B" : s >= 60 ? "C" : s >= 50 ? "D" : "F";
};

// Skeleton shown while the per-page reports are still auditing (or loading). The
// page polls in the background and swaps this for the real cards/heatmap the
// moment any page score lands — so data appears without a manual refresh.
const Bar = ({ w = "w-24", h = "h-3", darkMode }) => (
    <div className={`${w} ${h} rounded-md animate-pulse ${darkMode ? "bg-slate-800/70" : "bg-slate-200/80"}`} />
);
const SummaryShimmer = ({ darkMode }) => {
    const cardClass = darkMode ? "bg-slate-900 border border-slate-800" : "bg-card border border-line";
    const block = darkMode ? "bg-slate-800/70" : "bg-slate-200/80";
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Loading audit summary">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`rounded-3xl p-7 ${cardClass}`}>
                    <Bar w="w-24" darkMode={darkMode} />
                    <div className="flex items-center gap-6 mt-6">
                        <div className={`w-[130px] h-[130px] rounded-full animate-pulse ${block}`} />
                        <div className="space-y-3">
                            <Bar w="w-16" h="h-10" darkMode={darkMode} />
                            <Bar w="w-40" darkMode={darkMode} />
                        </div>
                    </div>
                </div>
                <div className={`rounded-3xl p-7 lg:col-span-2 ${cardClass}`}>
                    <Bar w="w-32" darkMode={darkMode} />
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className={`rounded-2xl p-5 ${darkMode ? "bg-slate-800/40" : "bg-cardsoft"}`}>
                                <Bar w="w-20" darkMode={darkMode} />
                                <div className="mt-3"><Bar w="w-12" h="h-8" darkMode={darkMode} /></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className={`rounded-3xl p-6 sm:p-8 ${cardClass}`}>
                <Bar w="w-48" h="h-5" darkMode={darkMode} />
                <div className="mt-2"><Bar w="w-72" darkMode={darkMode} /></div>
                <div className="space-y-2 mt-6">
                    {[0, 1, 2, 3, 4].map((r) => (
                        <div key={r} className="flex items-center gap-1.5">
                            <div className="mr-2"><Bar w="w-24" h="h-4" darkMode={darkMode} /></div>
                            {[...Array(9)].map((_, c) => (
                                <div key={c} className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl animate-pulse ${block}`} />
                            ))}
                        </div>
                    ))}
                </div>
                <p className={`mt-5 text-xs text-center font-medium ${darkMode ? "text-slate-500" : "text-muted"}`}>
                    Auditing pages… results appear automatically as each page finishes.
                </p>
            </div>
        </div>
    );
};

const AuditSummaryPage = () => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === "dark";
    const navigate = useNavigate();
    const location = useLocation();

    // The batch hands us { siteUrl, device, report, pages:[{key,label,url,id,status}] }
    // via router state; sessionStorage backs it so a refresh keeps working.
    const payload = useMemo(() => {
        if (location.state?.pages) return location.state;
        try {
            const stored = JSON.parse(sessionStorage.getItem("auditSummary") || "null");
            if (stored?.pages?.length) return stored;
        } catch { /* fall through to the root-audit fallback */ }
        // Fallback: no saved summary yet (audit still in Stage 1 / failed early /
        // storage cleared) — rebuild a minimal payload from the audit this session
        // started. The polling effect then pulls the parent report and streams in
        // the key pages live. Only a session with NO audit at all returns null
        // (and gets redirected to "/").
        try {
            const rootId = sessionStorage.getItem("auditRootId");
            if (rootId) {
                const rootUrl = sessionStorage.getItem("auditRootUrl") || "";
                return {
                    siteUrl: rootUrl,
                    device: sessionStorage.getItem("auditRootDevice") || "Desktop",
                    pages: [{ key: "home", label: "Home Page", url: rootUrl, id: rootId, status: "pending" }],
                };
            }
        } catch { /* nothing usable */ }
        return null;
    }, [location.state]);

    const [reports, setReports] = useState({}); // { [reportId]: fullReportDoc }
    const [loading, setLoading] = useState(true);
    const [settled, setSettled] = useState(false); // polling finished (all pages terminal)

    // No batch context (direct visit / lost state) → back to the audit form.
    useEffect(() => {
        if (!payload?.pages?.length) navigate("/", { replace: true });
    }, [payload, navigate]);

    // Poll each page's report until the whole run settles — so the summary fills in
    // LIVE (new pages + their scores) without the user having to refresh. Each round
    // rebuilds the page list from sessionStorage AND from whatever the parent report
    // already knows (its crawledPagesSummary), so pages discovered after we landed
    // here still get picked up.
    useEffect(() => {
        if (!payload?.pages?.length) return;
        let cancelled = false;
        let timer = null;
        let rounds = 0;
        const MAX_ROUNDS = 80; // ~4 min hard stop so we never poll forever
        const bearer = localStorage.getItem("dealerpulse_token");

        // Union of every page we know about, de-duped by report id.
        const collectPages = (known) => {
            const byId = new Map();
            const add = (pg) => { if (pg?.id && !byId.has(pg.id)) byId.set(pg.id, pg); };
            (payload.pages || []).forEach(add);
            try {
                const fresh = JSON.parse(sessionStorage.getItem("auditSummary") || "null");
                (fresh?.pages || []).forEach(add);
            } catch { /* ignore */ }
            Object.values(known || {}).forEach((r) => {
                (r?.crawledPagesSummary || []).forEach((cp) => {
                    if (cp.reportId) add({ key: cp.pageType || "generic", label: cp.label || "Key Page", url: cp.url, id: cp.reportId });
                });
            });
            return [...byId.values()];
        };

        const poll = async (known) => {
            const pages = collectPages(known);
            const entries = await Promise.all(
                pages.map(async (p) => {
                    // Already finished? Reuse it — don't re-download a terminal report
                    // (screenshot + 8 sections) every 3s. Only in-progress pages refetch.
                    const prev = known?.[p.id];
                    if (prev && (prev.status === "completed" || prev.status === "failed")) return [p.id, prev];
                    try {
                        const res = await fetch(`${API_URL}/single-audit/${p.id}`, {
                            credentials: "include",
                            headers: { ...(bearer && { Authorization: `Bearer ${bearer}` }) },
                        });
                        if (!res.ok) return [p.id, prev || null];
                        return [p.id, await res.json()];
                    } catch { return [p.id, prev || null]; }
                })
            );
            if (cancelled) return;
            const map = Object.fromEntries(entries);
            setReports(map);
            setLoading(false);
            rounds += 1;

            // Done when the fan-out parent finished Stage 2 AND every fetched report is
            // terminal. A single-page audit (no parent) is done once its report is terminal.
            const docs = Object.values(map).filter(Boolean);
            const parent = docs.find((r) => Array.isArray(r?.crawledPagesSummary) && r.crawledPagesSummary.length > 0);
            const parentFanningOut = parent && !(parent.stage2Completed === true || parent.status === "completed" || parent.status === "failed");
            const allTerminal = docs.length > 0 && docs.every((r) => r.status === "completed" || r.status === "failed");
            const done = allTerminal && !parentFanningOut;

            if (done || rounds >= MAX_ROUNDS) {
                if (!cancelled) setSettled(true);
                return;
            }
            timer = setTimeout(() => poll(map), 3000);
        };

        setLoading(true);
        setSettled(false);
        poll({});

        return () => { cancelled = true; if (timer) clearTimeout(timer); };
    }, [payload]);

    const rows = useMemo(() => {
        const pageList = [...(payload?.pages || [])];
        // The PARENT report (whichever fetched report carries the key-page list) is
        // the source of truth for the full set of pages — find it explicitly instead
        // of assuming it's first, so the matrix stays complete even if sessionStorage
        // was partial or the pages arrived in a different order.
        const parentReport = Object.values(reports).find((r) => r?.crawledPagesSummary?.length > 0);
        if (parentReport?.crawledPagesSummary?.length > 0) {
            parentReport.crawledPagesSummary.forEach((cp) => {
                if (cp.url && !pageList.some((p) => p.url === cp.url)) {
                    pageList.push({
                        key: cp.pageType || "generic",
                        label: cp.label || "Key Page",
                        url: cp.url,
                        // Open this key page's OWN child report (real per-section data)
                        // instead of the parent — falls back to the parent only if the
                        // child id hasn't landed yet.
                        id: cp.reportId || parentReport._id,
                        status: "done"
                    });
                }
            });
        }
        return pageList;
    }, [payload, reports]);

    // Mean of the numeric values only (rounded); null when nothing loaded.
    const meanOf = (vals) => {
        const nums = vals.filter((v) => typeof v === "number");
        return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
    };

    // Collapse each page-type into ONE display row. A category that was sampled
    // across several pages (VDP = 2 cars, SRP = new/used) is shown as a single
    // averaged row instead of N separate rows: every section cell is the mean of
    // the samples' Percentages, and the overall is the mean of their scores. We
    // still audit all the samples — they're just merged into one VDP/SRP report here.
    const displayRows = useMemo(() => {
        const order = [];
        const byKey = new Map();
        for (const p of rows) {
            if (!byKey.has(p.key)) { byKey.set(p.key, []); order.push(p.key); }
            byKey.get(p.key).push(p);
        }
        // Canonical row order: Home → SRP → VDP → Trade-In → Lease → Service →
        // About → Content (stable sort keeps unknown keys in arrival order at the end).
        order.sort((a, b) => rowRank(a) - rowRank(b));
        return order.map((key) => {
            const members = byKey.get(key);
            const reps = members.map((m) => {
                const report = reports[m.id];
                if (!report) return null;

                const normReportUrl = (report.url || "").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
                const normMemberUrl = (m.url || "").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

                // Report matches this row if:
                // 1) The report's pageType matches this row key, OR
                // 2) The report's URL directly matches the member page URL, OR
                // 3) This is the Home row and the report is for the home page (or default single audit)
                const isMatchingReport =
                    (report.pageType && report.pageType === key) ||
                    (normReportUrl && normMemberUrl && normReportUrl === normMemberUrl) ||
                    (key === "home" && (!report.pageType || report.pageType === "home") && (!normMemberUrl || normReportUrl === normMemberUrl));

                return isMatchingReport ? report : null;
            }).filter(Boolean);

            const scores = {};
            SECTIONS.forEach((s) => { scores[s.key] = meanOf(reps.map((r) => r?.[s.key]?.Percentage)); });
            const overall = meanOf(reps.map((r) => r?.score));
            // Still auditing? — a member report hasn't been fetched yet, or its status
            // is not terminal. Drives the per-cell loading spinner so an in-progress
            // page reads as "loading" instead of a genuine "—" (N/A).
            const loading = members.some((m) => {
                const r = reports[m.id];
                return !r || (r.status !== "completed" && r.status !== "failed");
            });
            // Strip the "— Used 1 / New" sample suffix so the merged row reads cleanly.
            const baseLabel = (members[0].label || "").split(" — ")[0] || members[0].label;
            // When the backend merged the samples, there's one entry carrying `mergedFrom`;
            // otherwise (fallback) we averaged N member reports client-side here.
            const mergedFrom = members[0]?.mergedFrom || members.length;
            return {
                key,
                label: baseLabel,
                memberCount: members.length,
                mergedFrom,
                id: members[0].id,   // drill-in opens the averaged (merged) report
                // The audited page URL(s) — shown under the row label. A merged
                // row keeps its first sample as the representative link and lists
                // the rest in the tooltip.
                url: members[0].url || null,
                urls: members.map((m) => m.url).filter(Boolean),
                scores,
                overall,
                loading,
            };
        });
    }, [rows, reports]);

    // Aggregate site score = importance-weighted site rollup math (§5.6), over the
    // collapsed rows (so a multi-car VDP counts ONCE, as its average).
    const { siteScore, siteGrade } = useMemo(() => {
        let totalImportance = 0;
        let weightedScoreSum = 0;
        let validPagesCount = 0;

        displayRows.forEach((r) => {
            if (typeof r.overall === "number") {
                const importance = PAGE_IMPORTANCE[r.key] ?? 1.0;
                weightedScoreSum += r.overall * importance;
                totalImportance += importance;
                validPagesCount++;
            }
        });

        if (validPagesCount === 0 || totalImportance === 0) {
            return { siteScore: null, siteGrade: "—" };
        }

        const avg = Math.round(weightedScoreSum / totalImportance);
        return { siteScore: avg, siteGrade: gradeFor(avg) };
    }, [displayRows]);

    // Issue breakdown derived from every cell across the (collapsed) grid.
    const breakdown = useMemo(() => {
        const acc = { strong: 0, mid: 0, low: 0, na: 0 };
        displayRows.forEach((r) => {
            SECTIONS.forEach((s) => acc[tierOf(r.scores[s.key])]++);
        });
        return acc;
    }, [displayRows]);

    const cardClass = darkMode
        ? "bg-slate-900 border border-slate-800 shadow-xl shadow-black/20"
        : "bg-card border border-line shadow-xl shadow-slate-200/50";

    const cellScore = (reportId, key) => {
        const v = reports[reportId]?.[key]?.Percentage;
        return typeof v === "number" ? Math.round(v) : null;
    };

    const openCell = (reportId, link) => navigate(`/${link}/${reportId}`);
    const openAll = (reportId) => navigate(`/report/${reportId}`);

    // Anything worth showing yet? (any page with a real overall or section score)
    const hasData = useMemo(
        () => displayRows.some((r) => typeof r.overall === "number" || SECTIONS.some((s) => typeof r.scores[s.key] === "number")),
        [displayRows]
    );
    // Any page still auditing → drives the "Auditing…" badge in the heatmap header.
    const anyLoading = useMemo(() => displayRows.some((r) => r.loading), [displayRows]);
    // Show the skeleton until the first real data lands (or polling gives up).
    const showShimmer = !hasData && !settled;

    if (!payload?.pages?.length) return null;

    return (
        <div className={`w-full min-h-screen ${darkMode ? "bg-[#0B1120] text-slate-200" : "bg-surface text-ink"}`}>
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* ── Breadcrumb + heading ── */}
                <div className="flex flex-col gap-1">
                    <button
                        onClick={() => navigate("/")}
                        className={`inline-flex items-center gap-1 text-xs font-semibold w-fit mb-1 transition-colors ${darkMode ? "text-slate-400 hover:text-white" : "text-muted hover:text-ink"}`}
                    >
                        <ChevronLeft className="w-3.5 h-3.5" /> New audit
                    </button>
                    <h1 className={`text-3xl font-extrabold tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>Audit Summary</h1>
                    <a
                        href={payload.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#ea580c] hover:underline w-fit"
                    >
                        {prettyHost(payload.siteUrl)}
                    </a>
                </div>

                {showShimmer ? (
                    <SummaryShimmer darkMode={darkMode} />
                ) : (
                <>
                {/* ── Top cards: overall score + issue breakdown ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Overall score */}
                    <div className={`rounded-3xl p-7 ${cardClass}`}>
                        <span className={`block text-[10px] font-semibold uppercase tracking-widest mb-4 ${darkMode ? "text-slate-500" : "text-faint"}`}>Overall score</span>
                        <div className="flex items-center gap-6">
                            <div className="relative flex-shrink-0">
                                <CircularProgress value={siteScore ?? 0} size={130} stroke={12} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-3xl font-black ${darkMode ? "text-white" : "text-ink"}`}>{siteScore ?? "—"}</span>
                                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "text-slate-500" : "text-faint"}`}>out of 100</span>
                                </div>
                            </div>
                            <div>
                                <div className={`text-5xl font-black leading-none ${siteScore >= 75 ? "text-emerald-500" : siteScore >= 55 ? "text-amber-500" : "text-red-500"}`}>{siteGrade}</div>
                                <p className={`mt-2 text-sm ${darkMode ? "text-slate-400" : "text-muted"}`}>
                                    Averaged across {displayRows.length} audited page type{displayRows.length === 1 ? "" : "s"}.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Issue breakdown */}
                    <div className={`rounded-3xl p-7 lg:col-span-2 ${cardClass}`}>
                        <span className={`block text-[10px] font-semibold uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-faint"}`}>Across {displayRows.length * SECTIONS.length} checks</span>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            {[
                                { label: "Critical", n: breakdown.low, dot: "bg-red-500", text: "text-red-500" },
                                { label: "Needs work", n: breakdown.mid, dot: "bg-amber-500", text: "text-amber-500" },
                                { label: "Strong", n: breakdown.strong, dot: "bg-emerald-500", text: "text-emerald-500" },
                            ].map((b) => (
                                <div key={b.label} className={`rounded-2xl p-5 ${darkMode ? "bg-slate-800/40" : "bg-cardsoft"}`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${b.dot}`} />
                                        <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-muted"}`}>{b.label}</span>
                                    </div>
                                    <div className={`mt-2 text-4xl font-black ${b.text}`}>{b.n}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Heatmap ── */}
                <div className={`rounded-3xl p-6 sm:p-8 ${cardClass}`}>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-ink"}`}>Page-Type Heatmap</h2>
                                {anyLoading && (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/20">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Auditing…
                                    </span>
                                )}
                            </div>
                            <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>
                                {displayRows.length} page types × {SECTIONS.length} dimensions — click any cell to drill into that section
                            </p>
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> Strong (75+)</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /> Needs work (55–74)</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" /> Critical (&lt;55)</span>
                            <span className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} /> N/A</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-[#ea580c]" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="border-separate border-spacing-1.5 min-w-full">
                                <thead>
                                    <tr>
                                        {/* top-left empty corner */}
                                        <th className="sticky left-0 z-10" />
                                        {/* "Overall" column first — the page's overall score */}
                                        <th className={`px-1.5 pb-2 align-bottom text-[10px] font-semibold leading-tight text-center ${darkMode ? "text-slate-300" : "text-inksoft"}`}>
                                            Overall Score
                                        </th>
                                        {/* spacer gap between "Overall" and the per-dimension columns */}
                                        <th className="w-4 sm:w-6 p-0" aria-hidden />
                                        {SECTIONS.map((s) => (
                                            <th key={s.key} className={`px-1.5 pb-2 align-bottom text-[10px] font-semibold leading-tight text-center ${darkMode ? "text-slate-400" : "text-muted"}`} title={s.label}>
                                                {s.column}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayRows.map((row) => (
                                        <tr key={row.key}>
                                            {/* page label (the other edge) + the audited page's link */}
                                            <th
                                                className={`sticky left-0 z-10 pr-3 text-right text-sm font-semibold whitespace-nowrap align-middle ${darkMode ? "bg-slate-900 text-slate-200" : "bg-card text-ink"}`}
                                            >
                                                <div>{row.label}</div>
                                                {row.url && (
                                                    <a
                                                        href={row.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title={row.urls.length > 1 ? row.urls.join("\n") : row.url}
                                                        className={`block ml-auto max-w-[240px] whitespace-normal break-all leading-snug text-[10px] font-normal underline-offset-2 hover:underline ${darkMode ? "text-slate-500 hover:text-blue-400" : "text-faint hover:text-accent"}`}
                                                    >
                                                        {prettyPageUrl(row.url)}{row.urls.length > 1 ? ` +${row.urls.length - 1}` : ""}
                                                    </a>
                                                )}
                                            </th>

                                            {/* All-sections cell first → the page's overall score, opens full report */}
                                            {(() => {
                                                const tier = tierOf(row.overall);
                                                return (
                                                    <td className="p-0">
                                                        <button
                                                            onClick={() => openAll(row.id)}
                                                            title={`${row.label} · full report${row.overall != null ? ` — ${row.overall}` : ""}`}
                                                            className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-xl flex items-center justify-center text-sm font-bold transition-all hover:scale-105 hover:ring-2 hover:ring-offset-1 hover:ring-[#ea580c] focus:outline-none
                                                                ${darkMode ? "ring-offset-slate-900" : "ring-offset-card"}
                                                                ${tier === "na"
                                                                    ? (darkMode ? "bg-slate-700/60 text-slate-500" : "bg-slate-200 text-slate-400")
                                                                    : TIER_BG[tier]}`}
                                                        >
                                                            {row.overall != null ? row.overall : (row.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "—")}
                                                        </button>
                                                    </td>
                                                );
                                            })()}

                                            {/* spacer gap between "All" and the per-dimension cells */}
                                            <td className="w-4 sm:w-6 p-0" aria-hidden />

                                            {SECTIONS.map((s) => {
                                                const score = row.scores[s.key];
                                                const tier = tierOf(score);
                                                return (
                                                    <td key={s.key} className="p-0">
                                                        <button
                                                            onClick={() => openCell(row.id, s.link)}
                                                            title={`${row.label} · ${s.label}${score != null ? ` — ${score}` : " — N/A"}`}
                                                            className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-xl flex items-center justify-center text-sm font-bold transition-all hover:scale-105 hover:ring-2 hover:ring-offset-1 hover:ring-[#ea580c] focus:outline-none
                                                                ${darkMode ? "ring-offset-slate-900" : "ring-offset-card"}
                                                                ${tier === "na"
                                                                    ? (darkMode ? "bg-slate-700/60 text-slate-500" : "bg-slate-200 text-slate-400")
                                                                    : TIER_BG[tier]}`}
                                                        >
                                                            {score != null ? score : (row.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "—")}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                </>
                )}


            </div>
        </div>
    );
};

export default AuditSummaryPage;
