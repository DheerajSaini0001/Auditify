import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ExternalLink, Lightbulb, ListChecks, Lock, MinusCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { collectSectionFindings } from "../utils/sectionFindings";
import { useAuth } from "../context/AuthContext";
import { GATE_HEADLINE, GATE_BODY } from "../config/gatedSections";
import { savePostAuthIntent } from "../utils/intentStore";

/**
 * One card per audit category: name, score, and a way into the detail behind it.
 *
 * The summary already had a page-type × dimension heatmap, which answers "which
 * page is weak". It could not answer "what is actually wrong with Accessibility",
 * because a cell is a number with nowhere to go but a whole section page. These
 * cards sit above the heatmap and open the three things a person asks next:
 * what we found, what is broken, and what to do about it.
 */

const TABS = [
    { key: "findings", label: "Findings", icon: ListChecks },
    { key: "issues", label: "Issues", icon: AlertTriangle },
    { key: "recommendations", label: "Recommendations", icon: Lightbulb },
];

const STATUS_STYLE = {
    pass: { icon: CheckCircle2, text: "text-emerald-500", label: "Passed" },
    warning: { icon: AlertTriangle, text: "text-amber-500", label: "Needs work" },
    fail: { icon: XCircle, text: "text-red-500", label: "Failing" },
    na: { icon: MinusCircle, text: "text-slate-400", label: "Not measured" },
};

const scoreText = (score) =>
    score == null ? "text-slate-400" : score >= 75 ? "text-emerald-500" : score >= 55 ? "text-amber-500" : "text-red-500";

const FindingRow = ({ finding, darkMode, showRecommendationOnly = false }) => {
    const style = STATUS_STYLE[finding.status] || STATUS_STYLE.na;
    const Icon = style.icon;

    return (
        <div className={`py-3 border-b last:border-b-0 ${darkMode ? "border-slate-800" : "border-line"}`}>
            <div className="flex items-start gap-2.5">
                <Icon size={15} className={`${style.text} shrink-0 mt-0.5`} />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className={`text-sm font-semibold ${darkMode ? "text-white" : "text-ink"}`}>
                            {finding.name}
                        </span>
                        {finding.value && (
                            <span className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-muted"}`}>
                                {finding.value}
                            </span>
                        )}
                        {finding.pageCount > 1 && (
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "text-slate-500" : "text-faint"}`}>
                                worst of {finding.pageCount} pages
                            </span>
                        )}
                    </div>

                    {showRecommendationOnly ? (
                        <p className={`text-sm mt-1 leading-relaxed ${darkMode ? "text-slate-300" : "text-inksoft"}`}>
                            {finding.recommendation}
                        </p>
                    ) : (
                        <>
                            {finding.details && (
                                <p className={`text-sm mt-1 leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                                    {finding.details}
                                </p>
                            )}
                            {finding.cause && (
                                <p className={`text-xs mt-1.5 leading-relaxed ${darkMode ? "text-slate-500" : "text-faint"}`}>
                                    <span className="font-semibold">Cause: </span>{finding.cause}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * What's behind a category score: Findings / Issues / Recommendations.
 *
 * Exported because the report page shows the same three answers under its own
 * (ring-based) category cards. One implementation means the two surfaces cannot
 * drift into disagreeing about what is wrong with a site.
 */
export const SectionDetailsPanel = ({ section, reportList, reportId, darkMode, onOpenSection }) => {
    const [tab, setTab] = useState("findings");
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Only walked when this panel is mounted — the caller mounts it on open, so
    // eight categories × every audited page is never flattened for panels nobody
    // looks at.
    const groups = useMemo(
        () => collectSectionFindings(reportList, section.key),
        [reportList, section.key]
    );

    const rows = groups?.[tab] || [];

    // The server strips section detail from a signed-out response, so there is
    // genuinely nothing here to show. Saying "no data yet" would read as a broken
    // report; this says what is actually true and what to do about it.
    if (!isAuthenticated) {
        return (
            <div className={`border-t px-5 py-6 text-center ${darkMode ? "border-slate-800" : "border-line"}`}>
                <Lock size={20} className={`mx-auto ${darkMode ? "text-slate-500" : "text-faint"}`} />
                <p className={`text-sm font-semibold mt-2 ${darkMode ? "text-white" : "text-ink"}`}>
                    {GATE_HEADLINE}
                </p>
                <p className={`text-xs mt-1.5 leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                    {GATE_BODY}
                </p>
                <button
                    onClick={() => {
                        if (reportId) savePostAuthIntent(reportId, `/report/${reportId}`);
                        navigate("/register");
                    }}
                    className="mt-4 w-full px-4 py-2.5 rounded-xl bg-accent hover:bg-accenthover text-white text-xs font-semibold shadow-md shadow-accent/20 transition-all active:scale-[0.98]"
                >
                    Sign up free
                </button>
            </div>
        );
    }

    return (
        <div className={`border-t px-5 pb-5 ${darkMode ? "border-slate-800" : "border-line"}`}>
            <div className="flex items-center gap-1 pt-4">
                {TABS.map((t) => {
                    const Icon = t.icon;
                    const count = groups?.[t.key]?.length ?? 0;
                    const active = tab === t.key;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all
                                ${active
                                    ? "bg-accent text-white"
                                    : darkMode ? "text-slate-400 hover:bg-slate-800" : "text-muted hover:bg-surface-2"}`}
                        >
                            <Icon size={12} />
                            {t.label}
                            <span className={active ? "opacity-80" : "opacity-60"}>{count}</span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-2 max-h-80 overflow-y-auto text-left">
                {rows.length === 0 ? (
                    <p className={`text-sm py-6 text-center ${darkMode ? "text-slate-500" : "text-faint"}`}>
                        {tab === "issues"
                            ? "Nothing failing in this category."
                            : tab === "recommendations"
                                ? "No fixes needed here."
                                : "No parameter data for this category yet."}
                    </p>
                ) : (
                    rows.map((f) => (
                        <FindingRow
                            key={f.name}
                            finding={f}
                            darkMode={darkMode}
                            showRecommendationOnly={tab === "recommendations"}
                        />
                    ))
                )}
            </div>

            {reportId && (
                <button
                    onClick={() => onOpenSection(reportId, section.link)}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                >
                    Open the full {section.label} report <ExternalLink size={12} />
                </button>
            )}
        </div>
    );
};

const CategoryCard = ({ section, score, reportList, reportId, darkMode, onOpenSection }) => {
    const [open, setOpen] = useState(false);

    const cardBase = darkMode ? "bg-slate-900 border-slate-800" : "bg-card border-line";

    return (
        <div className={`rounded-2xl border transition-colors ${cardBase}`}>
            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <h3 className={`text-sm font-bold leading-snug ${darkMode ? "text-white" : "text-ink"}`}>
                        {section.label}
                    </h3>
                    <div className="text-right shrink-0">
                        <span className={`text-2xl font-black tabular-nums ${scoreText(score)}`}>
                            {score == null ? "—" : score}
                        </span>
                        <span className={`text-xs font-semibold ${darkMode ? "text-slate-500" : "text-faint"}`}>/100</span>
                    </div>
                </div>

                <div className={`mt-3 h-1.5 w-full rounded-full overflow-hidden ${darkMode ? "bg-slate-800" : "bg-surface-2"}`}>
                    <div
                        className={`h-full rounded-full transition-[width] duration-500 ${score == null ? "bg-slate-400" : score >= 75 ? "bg-emerald-500" : score >= 55 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${score == null ? 0 : Math.max(2, Math.min(100, score))}%` }}
                    />
                </div>

                <button
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    className={`mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98]
                        ${darkMode ? "border-slate-800 text-slate-300 hover:bg-slate-800" : "border-line text-inksoft hover:bg-surface-2"}`}
                >
                    {/* The label has to change with the state — a chevron rotating by
                        13px is not a readable answer to "did my click do anything?" */}
                    {open ? "Hide Details" : "View Details"}
                    <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                </button>
            </div>

            {open && (
                <SectionDetailsPanel
                    section={section}
                    reportList={reportList}
                    reportId={reportId}
                    darkMode={darkMode}
                    onOpenSection={onOpenSection}
                />
            )}
        </div>
    );
};

const CategoryScoreCards = ({ sections, scores, reports, primaryReportId, darkMode, onOpenSection }) => {
    const reportList = useMemo(() => Object.values(reports || {}).filter(Boolean), [reports]);

    // Two per row at most — a wider card leaves the expanded findings panel room
    // to read as prose instead of a narrow column of wrapped text.
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sections.map((section) => (
                <CategoryCard
                    key={section.key}
                    section={section}
                    score={scores[section.key]}
                    reportList={reportList}
                    reportId={primaryReportId}
                    darkMode={darkMode}
                    onOpenSection={onOpenSection}
                />
            ))}
        </div>
    );
};

export default CategoryScoreCards;
