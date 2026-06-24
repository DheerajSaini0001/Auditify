import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, ChevronLeft, FileText } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";
import CircularProgress from "../Component/CircularProgress";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";

/* ─────────────────────────────────────────
   The 7 dealer-audit dimensions, mapped to the report fields and the standalone
   section routes. Clicking a heatmap cell drills into `/${link}/${reportId}`.
───────────────────────────────────────── */
const SECTIONS = [
    { key: "UXOrContentStructure", short: "UI / UX", label: "UX & Content", link: "ux-content-structure" },
    { key: "onPageSEO", short: "SEO", label: "On-Page SEO", link: "on-page-seo" },
    { key: "aioReadiness", short: "AI", label: "AI Visibility", link: "aio" },
    { key: "accessibility", short: "A11y", label: "Accessibility", link: "accessibility" },
    { key: "technicalPerformance", short: "Perf", label: "Performance", link: "technical-performance" },
    { key: "conversionAndLeadFlow", short: "Lead", label: "Lead Capture", link: "conversion-lead-flow" },
    { key: "securityOrCompliance", short: "Sec", label: "Security", link: "security-compliance" },
    { key: "aeo", short: "AEO", label: "Answer Engine", link: "aeo" },
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

const gradeFor = (score) => {
    const s = Number(score) || 0;
    return s >= 90 ? "A+" : s >= 80 ? "A" : s >= 70 ? "B" : s >= 60 ? "C" : s >= 50 ? "D" : "F";
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
        try { return JSON.parse(sessionStorage.getItem("auditSummary") || "null"); }
        catch { return null; }
    }, [location.state]);

    const [reports, setReports] = useState({}); // { [reportId]: fullReportDoc }
    const [loading, setLoading] = useState(true);

    // No batch context (direct visit / lost state) → back to the audit form.
    useEffect(() => {
        if (!payload?.pages?.length) navigate("/", { replace: true });
    }, [payload, navigate]);

    // Fetch each page's finished report so we can read per-section Percentages.
    useEffect(() => {
        if (!payload?.pages?.length) return;
        let cancelled = false;
        const bearer = localStorage.getItem("dealerpulse_token");

        (async () => {
            setLoading(true);
            const entries = await Promise.all(
                payload.pages.map(async (p) => {
                    try {
                        const res = await fetch(`${API_URL}/single-audit/${p.id}`, {
                            credentials: "include",
                            headers: { ...(bearer && { Authorization: `Bearer ${bearer}` }) },
                        });
                        if (!res.ok) return [p.id, null];
                        return [p.id, await res.json()];
                    } catch { return [p.id, null]; }
                })
            );
            if (cancelled) return;
            setReports(Object.fromEntries(entries));
            setLoading(false);
        })();

        return () => { cancelled = true; };
    }, [payload]);

    const rows = useMemo(() => payload?.pages || [], [payload]);

    // Mean of the numeric values only (rounded); null when nothing loaded.
    const meanOf = (vals) => {
        const nums = vals.filter((v) => typeof v === "number");
        return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
    };

    // Collapse each page-type into ONE display row. A category that was sampled
    // across several pages (VDP = 5 cars, SRP = new/used) is shown as a single
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
        return order.map((key) => {
            const members = byKey.get(key);
            const reps = members.map((m) => reports[m.id]).filter(Boolean);
            const scores = {};
            SECTIONS.forEach((s) => { scores[s.key] = meanOf(reps.map((r) => r?.[s.key]?.Percentage)); });
            const overall = meanOf(reps.map((r) => r?.score));
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
                scores,
                overall,
            };
        });
    }, [rows, reports]);

    // Aggregate site score = importance-weighted site rollup math (§5.6), over the
    // collapsed rows (so a 5-car VDP counts ONCE, as its average — not 5×).
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
                            <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-ink"}`}>Page-Type Heatmap</h2>
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
                                        {SECTIONS.map((s) => (
                                            <th key={s.key} className={`px-1 pb-2 text-[11px] font-semibold text-center ${darkMode ? "text-slate-400" : "text-muted"}`} title={s.label}>
                                                {s.short}
                                            </th>
                                        ))}
                                        {/* the extra "All sections" column */}
                                        <th className={`px-1 pb-2 text-[11px] font-semibold text-center ${darkMode ? "text-slate-300" : "text-inksoft"}`}>
                                            All
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayRows.map((row) => (
                                        <tr key={row.key}>
                                            {/* page label (the other edge) */}
                                            <th
                                                className={`sticky left-0 z-10 pr-3 text-right text-sm font-semibold whitespace-nowrap ${darkMode ? "bg-slate-900 text-slate-200" : "bg-card text-ink"}`}
                                            >
                                                {row.label}
                                            </th>

                                            {SECTIONS.map((s) => {
                                                const score = row.scores[s.key];
                                                const tier = tierOf(score);
                                                return (
                                                    <td key={s.key} className="p-0">
                                                        <button
                                                            onClick={() => openCell(row.id, s.link)}
                                                            title={`${row.label} · ${s.label}${score != null ? ` — ${score}` : " — N/A"}`}
                                                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-sm font-bold transition-all hover:scale-105 hover:ring-2 hover:ring-offset-1 hover:ring-[#ea580c] focus:outline-none
                                                                ${darkMode ? "ring-offset-slate-900" : "ring-offset-card"}
                                                                ${tier === "na"
                                                                    ? (darkMode ? "bg-slate-700/60 text-slate-500" : "bg-slate-200 text-slate-400")
                                                                    : TIER_BG[tier]}`}
                                                        >
                                                            {score != null ? score : "—"}
                                                        </button>
                                                    </td>
                                                );
                                            })}

                                            {/* All-sections cell → full report */}
                                            <td className="p-0">
                                                <button
                                                    onClick={() => openAll(row.id)}
                                                    title={`${row.label} · full report`}
                                                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center transition-all hover:scale-105 hover:ring-2 hover:ring-offset-1 hover:ring-[#ea580c] focus:outline-none
                                                        ${darkMode ? "bg-slate-800 text-slate-300 ring-offset-slate-900 hover:text-white" : "bg-cardsoft text-inksoft ring-offset-card hover:text-ink"}`}
                                                >
                                                    <FileText className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
};

export default AuditSummaryPage;
