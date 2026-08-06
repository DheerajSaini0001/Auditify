import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, ChevronLeft, CheckCircle2, Circle, ShieldAlert, Globe, ExternalLink } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";
import CircularProgress from "../components/CircularProgress";
import LivePreview from "../components/LivePreview";
import CategoryScoreCards from "../components/CategoryScoreCards";

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

// Audit phases → progress checkpoint + plain-language copy. Same vocabulary the
// single-report view uses (Dashboard2), driven by the report's raw `status`, so
// the two screens narrate the run identically.
const PHASES = {
    launching: { base: 8, title: "Launching browser", desc: "Spinning up a secure headless browser to load your website." },
    navigating: { base: 18, title: "Opening your website", desc: "Navigating to the target URL." },
    waiting_for_render: { base: 30, title: "Rendering the page", desc: "Waiting for the page and its dynamic content to fully load." },
    screenshot_ready: { base: 40, title: "Capturing the page", desc: "Page loaded — capturing a snapshot and crawling the content." },
    extracting_data: { base: 45, title: "Analyzing your site", desc: "Extracting page data and scoring the report sections." },
};

const isTerminalStatus = (s) => s === "completed" || s === "success" || s === "failed";

// Shown while the per-page reports are still auditing, INSTEAD of a full-page
// shimmer. A skeleton of a heatmap that doesn't exist yet tells the user nothing
// (and on a slow site it reads as a broken screen) — the live screenshot of the
// page being rendered, the current step, and the page-by-page checklist are the
// same information the single-report view already streams, so the summary shows
// that until the first real scores land.
const SummaryInProgress = ({ darkMode, leadReport, device, rows, siteUrl }) => {
    const cardClass = darkMode ? "bg-slate-900 border border-slate-800" : "bg-card border border-line";
    const rawStatus = leadReport?.status;

    const done = rows.filter((r) => !r.loading).length;
    const total = rows.length || 1;
    const phase = PHASES[rawStatus];
    const stage = rawStatus === "failed"
        ? { progress: 100, title: "Audit failed", desc: leadReport?.error || "Something went wrong while auditing this site." }
        : done > 0
            // Once pages start finishing, the bar tracks page completion (45% → 99%).
            ? { progress: Math.min(99, 45 + Math.round((done / total) * 55)), title: "Auditing key pages", desc: `${done} of ${total} page types scored — the heatmap fills in as each one lands.` }
            : phase
                ? { progress: phase.base, title: phase.title, desc: phase.desc }
                : { progress: 8, title: "Auditing your site", desc: "Running checks across every report section." };

    // LivePreview reads a normalized status: while the run is live we want its
    // scan animation, not its "preview unavailable" terminal state.
    const previewData = {
        screenshot: leadReport?.screenshot || null,
        screenshotUrl: leadReport?.screenshotUrl || null,
        device: leadReport?.device || device || "Desktop",
        isBotProtected: leadReport?.isBotProtected,
        status: isTerminalStatus(rawStatus) ? rawStatus : "inprogress",
    };

    return (
        <div className="space-y-6" aria-busy="true" aria-label="Audit in progress">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Live screenshot of the page currently being rendered */}
                <div className={`rounded-3xl p-6 sm:p-7 ${cardClass}`}>
                    <LivePreview data={previewData} variant="card" />
                </div>

                {/* Current step + per-page checklist */}
                <div className={`rounded-3xl p-6 sm:p-7 flex flex-col ${cardClass}`}>
                    <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-semibold uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-faint"}`}>
                            Audit in progress
                        </span>
                        <span className={`text-sm font-bold ${darkMode ? "text-white" : "text-ink"}`}>{stage.progress}%</span>
                    </div>
                    <div className={`mt-2 h-2 w-full rounded-full overflow-hidden ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#F26419] transition-all duration-700"
                            style={{ width: `${stage.progress}%` }}
                        />
                    </div>

                    <div className="mt-5">
                        <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-ink"}`}>{stage.title}</h3>
                        <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>{stage.desc}</p>
                    </div>

                    <div className={`mt-5 pt-5 border-t flex-1 ${darkMode ? "border-slate-800" : "border-line"}`}>
                        <span className={`block text-[10px] font-semibold uppercase tracking-widest mb-3 ${darkMode ? "text-slate-500" : "text-faint"}`}>
                            Pages ({done}/{total})
                        </span>
                        <ul className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                            {rows.map((r) => (
                                <li key={r.key} className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-2 min-w-0">
                                        {r.loading
                                            ? <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-amber-500" />
                                            : r.excluded
                                                ? <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                                                : <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />}
                                        <span className={`text-sm truncate ${darkMode ? "text-slate-300" : "text-inksoft"}`}>{r.label}</span>
                                    </span>
                                    {!r.excluded && typeof r.overall === "number" ? (
                                        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-md ${TIER_BG[tierOf(r.overall)]}`}>{r.overall}</span>
                                    ) : (
                                        <span className={`shrink-0 text-[11px] font-medium ${darkMode ? "text-slate-500" : "text-faint"}`}>
                                            {r.loading ? "auditing…" : r.excluded ? (r.blocked ? "blocked" : "failed") : "—"}
                                        </span>
                                    )}
                                </li>
                            ))}
                            {rows.length === 0 && (
                                <li className={`flex items-center gap-2 text-sm ${darkMode ? "text-slate-400" : "text-muted"}`}>
                                    <Circle className="w-3.5 h-3.5" /> Discovering key pages on {prettyHost(siteUrl)}…
                                </li>
                            )}
                        </ul>
                    </div>

                    <p className={`mt-4 text-xs ${darkMode ? "text-slate-500" : "text-muted"}`}>
                        Scores and the page-type heatmap appear here automatically — no need to refresh.
                    </p>
                </div>
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

            // Done when the fan-out parent finished Stage 2 AND every page we know about
            // has a FETCHED, terminal report. Checking only the docs we happen to hold
            // was wrong: when the parent is already terminal on the very first fetch
            // (opening/refreshing the summary after the run finished), its key pages had
            // only just been discovered from crawledPagesSummary and never been fetched —
            // polling stopped on round 1 and those rows stayed "auditing…" forever. So the
            // page list is re-collected from THIS round's results and every entry must
            // have landed.
            const docs = Object.values(map).filter(Boolean);
            const parent = docs.find((r) => Array.isArray(r?.crawledPagesSummary) && r.crawledPagesSummary.length > 0);
            const parentFanningOut = parent && !(parent.stage2Completed === true || parent.status === "completed" || parent.status === "failed");
            const nextPages = collectPages(map);
            const allTerminal =
                nextPages.length > 0 &&
                nextPages.every((p) => {
                    const r = map[p.id];
                    return r && (r.status === "completed" || r.status === "failed");
                });
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
            // The "Overall Score" cell is the AVERAGE OF THE ROW'S OWN DIMENSION CELLS,
            // not the report's stored `score`. In this grid the overall sits directly
            // beside the eight numbers it summarizes, so it has to reconcile with them —
            // the stored score is a WEIGHTED pillar rollup, so it can read higher or
            // lower than the cells next to it and look wrong. Sections that didn't run
            // (null) are averaged out rather than counted as zero.
            // A page whose audit never produced data — bot-protected (WAF blocked the
            // render) or outright failed — is NOT a zero. Zero means "we measured it and
            // it scored nothing"; this means "we couldn't measure it". Counting such a
            // page as 0 dragged the whole site score down (two blocked pages turned a
            // ~66 site into a ~44). These rows are marked `excluded`: no overall, and
            // the site rollup below skips them entirely.
            const terminalReps = reps.filter((r) => r.status === "completed" || r.status === "failed");
            const excluded =
                terminalReps.length > 0 &&
                terminalReps.every((r) => r.status === "failed" || r.isBotProtected === true);
            const blocked = excluded && terminalReps.some((r) => r.isBotProtected === true);

            const sectionVals = SECTIONS.map((s) => scores[s.key]);
            const overall = excluded ? null : meanOf(sectionVals);
            // Still auditing? — a member report hasn't been fetched yet, or its status
            // is not terminal. Drives the per-cell loading spinner so an in-progress
            // page reads as "loading" instead of a genuine "—" (N/A).
            const loading = members.some((m) => {
                const r = reports[m.id];
                return !r || (r.status !== "completed" && r.status !== "failed");
            });
            // [FIX] The overall cell used to be gated on `loading`, i.e. on the report's
            // STATUS. Sections stream in one at a time and the status only flips to
            // "completed" after the run finishes saving, so a row could show all eight
            // dimension numbers next to a still-spinning overall — which is what the user
            // sees as "overall never arrives". Gate it on the DATA instead: the overall is
            // the mean of the eight cells beside it, so the moment all eight have scored
            // it is final and can render. This keeps the original intent (never show a
            // partial overall that would shift under the user) because a missing section
            // still holds it back. Once the report does go terminal, `loading` is false and
            // the overall renders regardless — so a legitimately N/A section (e.g. Technical
            // "Not Run" when PageSpeed fails) can never leave it spinning forever.
            const allSectionsScored = sectionVals.every((v) => typeof v === "number");
            const overallPending = loading && !allSectionsScored;
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
                overallPending,
                excluded,
                blocked,
            };
        });
    }, [rows, reports]);

    // Is the run still producing results? Either a page type is mid-audit, or the
    // fan-out parent hasn't finished discovering + auditing its key pages (so page
    // types we haven't even seen yet are still to come).
    const auditPending = useMemo(() => {
        if (displayRows.some((r) => r.loading)) return true;
        const parent = Object.values(reports).find((r) => r?.crawledPagesSummary?.length > 0);
        if (parent) return !(parent.stage2Completed === true || parent.status === "completed" || parent.status === "failed");
        return false;
    }, [displayRows, reports]);

    // Aggregate site score = importance-weighted site rollup math (§5.6), over the
    // collapsed rows (so a multi-car VDP counts ONCE, as its average).
    //
    // NO SCORE WHILE ANYTHING IS PENDING. A partial rollup is not a smaller version
    // of the real answer — it's a different one: averaging the 1 page type that has
    // landed (or a page whose sections are still scoring) produced a confident
    // "57 / D" that then moved once the rest arrived. The score only appears when
    // every page type in the run is terminal.
    const { siteScore, siteGrade, scoredPages, excludedPages } = useMemo(() => {
        // Pages we couldn't measure at all (bot-protected / failed) never enter the
        // rollup — they carry no `overall`, so the filter below drops them.
        const excludedCount = displayRows.filter((r) => r.excluded).length;
        if (auditPending) return { siteScore: null, siteGrade: "—", scoredPages: 0, excludedPages: excludedCount };

        let totalImportance = 0;
        let weightedScoreSum = 0;
        let validPagesCount = 0;

        displayRows.forEach((r) => {
            if (!r.excluded && typeof r.overall === "number") {
                const importance = PAGE_IMPORTANCE[r.key] ?? 1.0;
                weightedScoreSum += r.overall * importance;
                totalImportance += importance;
                validPagesCount++;
            }
        });

        if (validPagesCount === 0 || totalImportance === 0) {
            return { siteScore: null, siteGrade: "—", scoredPages: 0, excludedPages: excludedCount };
        }

        const avg = Math.round(weightedScoreSum / totalImportance);
        return { siteScore: avg, siteGrade: gradeFor(avg), scoredPages: validPagesCount, excludedPages: excludedCount };
    }, [displayRows, auditPending]);

    // Site-level score per category — the mean of that dimension across every page
    // type that produced a number. This is the same arithmetic as a heatmap column,
    // read downwards instead of across.
    const categoryScores = useMemo(() => {
        const out = {};
        SECTIONS.forEach((s) => {
            const vals = displayRows
                .filter((r) => !r.excluded)
                .map((r) => r.scores[s.key])
                .filter((v) => typeof v === "number");
            out[s.key] = vals.length
                ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
                : null;
        });
        return out;
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
    // Show the live in-progress view until the first real data lands (or polling gives up).
    const showShimmer = !hasData && !settled;

    // The report the in-progress view narrates: the fan-out parent (it carries the
    // key-page list and the homepage screenshot), else the page we started from,
    // else whichever report already has a screenshot to show.
    const leadReport = useMemo(() => {
        const docs = Object.values(reports).filter(Boolean);
        return (
            docs.find((r) => r?.crawledPagesSummary?.length > 0) ||
            reports[payload?.pages?.[0]?.id] ||
            docs.find((r) => r?.screenshot || r?.screenshotUrl) ||
            docs[0] ||
            null
        );
    }, [reports, payload]);

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
                    {/* The domain is the headline, not the page title.
                        It used to be the other way round — "Audit Summary" at 3xl with
                        the site as a small orange link underneath — so on a screen that
                        is otherwise all progress bars there was nothing that told you
                        WHICH site was being audited. Same shape as UrlHeader on the
                        report pages: quiet label, loud domain. */}
                    <p className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] ${darkMode ? "text-slate-400" : "text-muted"}`}>
                        <Globe className="w-3.5 h-3.5" />
                        Audit Summary for
                    </p>
                    <a
                        href={payload.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={payload.siteUrl}
                        className={`group inline-flex items-center gap-2.5 w-fit text-3xl lg:text-4xl font-black tracking-tight transition-colors ${darkMode ? "text-white hover:text-slate-300" : "text-ink hover:text-accent"}`}
                    >
                        {prettyHost(payload.siteUrl)}
                        <ExternalLink className="w-5 h-5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </a>
                </div>

                {showShimmer ? (
                    <SummaryInProgress
                        darkMode={darkMode}
                        leadReport={leadReport}
                        device={payload.device}
                        rows={displayRows}
                        siteUrl={payload.siteUrl}
                    />
                ) : (
                <>
                {/* ── Top cards: overall score + issue breakdown ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Overall score */}
                    <div className={`rounded-3xl p-7 ${cardClass}`}>
                        <span className={`block text-[10px] font-semibold uppercase tracking-widest mb-4 ${darkMode ? "text-slate-500" : "text-faint"}`}>Overall score</span>
                        <div className="flex items-center gap-6">
                            <div className="relative flex-shrink-0">
                                {/* While pages are still auditing the ring stays empty — a partial
                                    rollup shown as a real score reads as the final verdict. */}
                                <CircularProgress value={auditPending ? 0 : (siteScore ?? 0)} size={130} stroke={12} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    {auditPending ? (
                                        <Loader2 className={`w-8 h-8 animate-spin ${darkMode ? "text-slate-600" : "text-slate-300"}`} />
                                    ) : (
                                        <>
                                            <span className={`text-3xl font-black ${darkMode ? "text-white" : "text-ink"}`}>{siteScore ?? "—"}</span>
                                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "text-slate-500" : "text-faint"}`}>out of 100</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div>
                                {auditPending ? (
                                    <>
                                        <div className={`text-2xl font-black leading-tight ${darkMode ? "text-slate-300" : "text-inksoft"}`}>Calculating…</div>
                                        <p className={`mt-2 text-sm ${darkMode ? "text-slate-400" : "text-muted"}`}>
                                            The site score appears once every page type has finished auditing.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className={`text-5xl font-black leading-none ${siteScore >= 75 ? "text-emerald-500" : siteScore >= 55 ? "text-amber-500" : "text-red-500"}`}>{siteGrade}</div>
                                        <p className={`mt-2 text-sm ${darkMode ? "text-slate-400" : "text-muted"}`}>
                                            Averaged across {scoredPages} audited page type{scoredPages === 1 ? "" : "s"}.
                                        </p>
                                        {excludedPages > 0 && (
                                            <p className={`mt-1 text-xs ${darkMode ? "text-slate-500" : "text-faint"}`}>
                                                {excludedPages} page type{excludedPages === 1 ? "" : "s"} couldn't be measured (blocked or failed) — not counted in this score.
                                            </p>
                                        )}
                                    </>
                                )}
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

                {/* ── Category scorecards ──
                    One card per dimension, scored across the whole site. The heatmap
                    below answers "which page is weak"; these answer "what is wrong
                    with this category, and what do I do about it". */}
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
                        <div>
                            <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-ink"}`}>Category Scores</h2>
                            <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>
                                Averaged across every audited page type — open one for its findings, issues and fixes.
                            </p>
                        </div>
                        {auditPending && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/20 w-fit">
                                <Loader2 className="w-3 h-3 animate-spin" /> Still auditing…
                            </span>
                        )}
                    </div>

                    <CategoryScoreCards
                        sections={SECTIONS}
                        scores={categoryScores}
                        reports={reports}
                        primaryReportId={displayRows[0]?.id || null}
                        darkMode={darkMode}
                        onOpenSection={openCell}
                    />
                </div>

                {/* ── Heatmap ── */}
                <div className={`rounded-3xl p-6 sm:p-8 ${cardClass}`}>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-ink"}`}>Page-Type Heatmap</h2>
                                {auditPending && (
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
                            <Loader2 className="w-8 h-8 animate-spin text-[#F26419]" />
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
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <span>{row.label}</span>
                                                    {row.excluded && (
                                                        <span
                                                            title={row.blocked
                                                                ? "Bot protection blocked this page — excluded from the site score"
                                                                : "This page's audit failed — excluded from the site score"}
                                                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${darkMode ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
                                                        >
                                                            {row.blocked ? "Blocked" : "Failed"}
                                                        </span>
                                                    )}
                                                </div>
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

                                            {/* All-sections cell first → the page's overall score, opens full report.
                                                Gated on `overallPending`, not on `loading`: the overall is the mean
                                                of the eight cells to its right, so it becomes final the moment all
                                                eight have scored — waiting for the report's status to flip left it
                                                spinning next to a fully populated row. It still never shows a partial
                                                overall (that's how a mid-run page read "57 / D" while one of its
                                                dimensions was still spinning) because any unscored section holds it. */}
                                            {(() => {
                                                const tier = row.overallPending || row.excluded ? "na" : tierOf(row.overall);
                                                const excludedNote = row.blocked
                                                    ? " — blocked by bot protection, not counted in the site score"
                                                    : " — audit failed, not counted in the site score";
                                                return (
                                                    <td className="p-0">
                                                        <button
                                                            onClick={() => openAll(row.id)}
                                                            title={`${row.label} · full report${row.overallPending ? " — still auditing" : row.excluded ? excludedNote : row.overall != null ? ` — ${row.overall}` : ""}`}
                                                            className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-xl flex items-center justify-center text-sm font-bold transition-all hover:scale-105 hover:ring-2 hover:ring-offset-1 hover:ring-[#F26419] focus:outline-none
                                                                ${darkMode ? "ring-offset-slate-900" : "ring-offset-card"}
                                                                ${tier === "na"
                                                                    ? (darkMode ? "bg-slate-700/60 text-slate-500" : "bg-slate-200 text-slate-400")
                                                                    : TIER_BG[tier]}`}
                                                        >
                                                            {row.overallPending
                                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                : row.excluded
                                                                    ? <ShieldAlert className="w-4 h-4" />
                                                                    : (row.overall != null ? row.overall : "—")}
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
                                                            className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-xl flex items-center justify-center text-sm font-bold transition-all hover:scale-105 hover:ring-2 hover:ring-offset-1 hover:ring-[#F26419] focus:outline-none
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
