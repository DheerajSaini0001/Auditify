import React, { useContext, useMemo } from "react";
import { AuditShimmer } from "../components/reusablecomponent/AuditShimmer";
import UrlHeader from "../components/UrlHeader";
import ReportRestrictionWrapper from "../components/ReportRestrictionWrapper";
import PillarHeader from "../components/reusablecomponent/PillarHeader";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../components/LivePreview";
import {
  CheckCircle, XCircle, AlertTriangle, Info,
  Eye, MousePointer, Layout, Type, Image as ImageIcon,
  Link, Navigation, Layers, Code, ShieldCheck,
  Keyboard, Focus, Hash, Anchor, Map, Terminal, Loader2, PersonStanding,
  ChevronDown, ChevronUp, ExternalLink, Copy
} from "lucide-react";

import MetricInfoModal from "../components/MetricInfoModal";
import ParameterInfoModal from "../components/ParameterInfoModal";
import { InfoDetails } from "../components/InfoDetails";
import AskAIButton from "../components/AskAIButton";
import { isVisibleForAudience, isActionableParam } from "../config/parameterAudience";

// Icon Mapping
const iconMap = {
  WCAG_AA_Compliance: ShieldCheck,
  Color_Contrast: Type,
  Focus_Order: Navigation,
  Focusable_Content: Focus,
  Tab_Index: Hash,
  Keyboard_Navigation: Keyboard,
  Interactive_Element_Affordance: MousePointer,
  Label: Type,
  Aria_Allowed_Attr: Code,
  Aria_Roles: Layers,
  Aria_Hidden_Focus: Eye,
  Image_Alt: ImageIcon,
  Skip_Links: Anchor,
  Landmarks: Map,
  Link_Name: Link,
  Button_Name: MousePointer,
  Document_Title: Type,
  Html_Has_Lang: Code,
  Meta_Viewport: Layout,
  List: Layout,
  Heading_Order: Type,
  Target_Size: MousePointer,
  Reflow: Layout,
  Text_Spacing: Type,
  Focus_Not_Obscured: Focus,
  Reduced_Motion: Eye,
};

const educationalContent = InfoDetails;
const scoreCalculationInfo = InfoDetails.Accessibility_Methodology;


// Simplified Metric Card
const MetricCard = ({ metricKey, data, darkMode, onInfo }) => {
  const { score, details, meta, analysis } = data || {};
  // Scores are now graded (e.g. 88), so drive colour off `status`, not score === 100/50.
  const isNA = meta?.notScored || score === null || score === undefined;
  const isPassed = !isNA && (data?.status === "pass" || score === 100);
  const isWarning = !isNA && !isPassed && (data?.status === "warning" || score === 50);
  const isInfo = meta?.informational || data?.infoOnly;
  const [showDetails, setShowDetails] = React.useState(false);

  const Icon = iconMap[metricKey] || CheckCircle;
  const content = educationalContent[metricKey] || { desc: "Accessibility check.", why: "Ensures inclusivity." };
  const reasons = content.actualReasonsForFailure || [];
  const recommendations = content.howToOvercomeFailure || [];
  // Named params derive a title from the key; dynamically-surfaced axe issues
  // (Other_Issues) carry a human-readable `title` from axe's `help` text.
  const title = data?.title || metricKey.replaceAll("_", " ");

  const colors = {
    emerald: { light: "text-emerald-600", dark: "text-emerald-400", border: "border-l-emerald-500", bg: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    amber: { light: "text-amber-600", dark: "text-amber-400", border: "border-l-amber-500", bg: "bg-amber-50 text-amber-700 border-amber-100" },
    rose: { light: "text-rose-600", dark: "text-rose-400", border: "border-l-rose-500", bg: "bg-rose-50 text-rose-700 border-rose-100" },
    slate: { light: "text-slate-500", dark: "text-slate-400", border: "border-l-slate-400", bg: "bg-slate-100 text-slate-600 border-slate-200" }
  };

  const statusType = isNA ? "slate" : (isPassed ? "emerald" : (isWarning ? "amber" : "rose"));
  const themeColors = colors[statusType] || colors.emerald;
  const cardBg = darkMode ? "bg-gray-800/80 border-gray-700" : "bg-card border-line";
  const statusLabel = isNA ? "Not Applicable" : (isPassed ? "Passed" : (isWarning ? "Warning" : "Failed"));

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col`}>
      <div className="p-5 space-y-5">
        {/* 1. Header Section */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {/* Icon Box */}
            <div className={`p-3 rounded-xl ${darkMode ? "bg-slate-700/50" : "bg-surface-2"} shrink-0`}>
              <Icon size={24} className={darkMode ? themeColors.dark : themeColors.light} />
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className={`font-semibold text-lg tracking-tight ${darkMode ? "text-white" : "text-ink"} truncate`}>
                {title}
                {isInfo && !isNA && <span className={`font-medium ${darkMode ? "text-slate-400" : "text-muted"}`} title="Informational — not counted in the section score"> (Info-only)</span>}
              </h3>
              <div className="flex items-center gap-3">
                <div className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${darkMode ? `bg-${statusType}-500/10 text-${statusType}-400` : themeColors.bg}`}>
                  {statusLabel}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {isActionableParam(metricKey) && !isNA && (!isPassed || meta?.failedNodes || meta?.present || meta?.missing || meta?.offenders) && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all ${darkMode ? "bg-slate-700/50 text-slate-300 hover:bg-slate-700" : "bg-cardsoft text-muted hover:bg-surface-2"}`}
              >
                {showDetails ? "Hide Details" : "View Details"}
                {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
            {onInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo({
                    ...content,
                    icon: Icon,
                    thresholds: meta?.threshold || content.thresholds
                  });
                }}
                className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-slate-500 hover:text-white" : "text-faint hover:text-ink"}`}
                title="Methodology"
              >
                <Info size={20} />
              </button>
            )}
          </div>
        </div>



        {/* 3. Status Section */}
        <div className="space-y-2">
          <h4 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-muted"}`}>
            Current Status
          </h4>
          <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
            <p className={`text-base font-semibold ${isNA ? "text-slate-500" : isPassed ? "text-emerald-500" : isWarning ? "text-amber-500" : "text-rose-500"}`}>
              {details || "Audit Passed"}
            </p>
            {(isInfo || isNA) && (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-50">
                {isNA ? "Not applicable on this page — excluded from the score" : "Informational — not counted in the score"}
              </p>
            )}
            {meta?.count !== undefined && !isPassed && (
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-tight opacity-40">
                {meta.count} elements affected
              </p>
            )}
          </div>
        </div>

        {/* WCAG 2.1 AA Compliance summary */}
        {metricKey === "WCAG_AA_Compliance" && meta?.grade && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Grade</p>
                <p className={`text-sm font-semibold mt-0.5 ${isPassed ? "text-emerald-500" : isWarning ? "text-amber-500" : "text-rose-500"}`}>{meta.grade}</p>
              </div>
              <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Conformance</p>
                <p className={`text-sm font-semibold mt-0.5 ${darkMode ? "text-slate-200" : "text-inksoft"}`}>{meta.conformanceRatio}% · {meta.passedRules}/{meta.passedRules + meta.violatedRuleCount} rules</p>
              </div>
            </div>
            {meta.byImpact && (meta.violatedRuleCount > 0) && (
              <div className="flex flex-wrap gap-2">
                {["critical", "serious", "moderate", "minor"].map(imp => meta.byImpact[imp] > 0 && (
                  <span key={imp} className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${imp === "critical" || imp === "serious" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : imp === "moderate" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"}`}>
                    {meta.byImpact[imp]} {imp}
                  </span>
                ))}
              </div>
            )}
            {meta.violatedRules?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {meta.violatedRules.slice(0, 12).map((r, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-mono ${darkMode ? "bg-slate-800 text-slate-300" : "bg-surface-2 text-muted"}`}>{r.id}</span>
                ))}
              </div>
            )}
            {meta.note && (
              <p className={`text-[10px] italic leading-relaxed ${darkMode ? "text-slate-500" : "text-faint"}`}>{meta.note}</p>
            )}
          </div>
        )}

        {/* Document Title uniqueness */}
        {metricKey === "Document_Title" && meta?.currentTitle && (
          <div className="space-y-2">
            <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Current Title</p>
              <p className={`text-xs font-semibold mt-0.5 break-words ${darkMode ? "text-slate-200" : "text-inksoft"}`}>{meta.currentTitle}</p>
              <p className={`text-[10px] mt-1 font-semibold ${meta.unique === false ? "text-rose-500" : meta.unique === true ? "text-emerald-500" : "opacity-40"}`}>
                {meta.unique === false ? `Duplicated on ${meta.duplicates?.length || 0} page(s)` : meta.unique === true ? `Unique across ${meta.checkedCount} sampled page(s)` : "Uniqueness not verified"}
              </p>
            </div>
            {meta.duplicates?.length > 0 && (
              <div className="space-y-1">
                {meta.duplicates.slice(0, 4).map((d, i) => (
                  <p key={i} className={`text-[10px] font-mono break-all ${darkMode ? "text-rose-300" : "text-rose-600"}`}>↳ {d.url}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ask AI Button */}
        {!isPassed && !isNA && (
          <AskAIButton
            finding={{
              type: 'Accessibility',
              title: title,
              details: details || '',
              severity: isPassed ? 'pass' : isWarning ? 'warning' : 'critical',
              url: ''
            }}
            darkMode={darkMode}
            meta={meta}
            paramKey={metricKey}
          />
        )}

        {/* Divider */}
        <div className={`h-px w-full ${darkMode ? "bg-slate-700/50" : "bg-surface-2"}`} />





        {/* 5. Expanded Technical Content */}
        {showDetails && (
          <div className="pt-2 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Analysis Metadata */}
            {(meta?.impact || meta?.helpUrl || meta?.description) && (
              <div className="space-y-3">
                {meta.description && (
                  <div className={`p-3 rounded-lg border-l-4 ${darkMode ? "bg-slate-800/50 border-l-blue-500/50 text-slate-300" : "bg-accentsoft border-l-accent text-inksoft"}`}>
                    <p className="text-xs font-medium leading-relaxed">
                      {meta.description}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {meta.impact && (
                    <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${meta.impact === 'critical' || meta.impact === 'serious'
                      ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      : (meta.impact === 'moderate' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20")
                      }`}>
                      Impact: {meta.impact}
                    </div>
                  )}

                  {meta.helpUrl && (
                    <a href={meta.helpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-500 hover:text-blue-400 transition-colors">
                      Why is this an issue? <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Landmarks Specific Data */}
            {(meta?.present || meta?.missing) && (
              <div className="grid grid-cols-1 gap-4">
                {meta.present?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 opacity-60 flex items-center gap-2">
                      <CheckCircle size={10} /> Found Landmarks
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {meta.present.map((item, idx) => (
                        <div key={idx} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${darkMode ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {meta.missing?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 opacity-60 flex items-center gap-2">
                      <AlertTriangle size={10} /> Missing Landmarks
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {meta.missing.map((item, idx) => (
                        <div key={idx} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-400" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Causes & Recommendations — identical layout to Technical/SEO
                (MetricAnalysisDetails): a rose "Causes" list and an emerald
                "Recommendations" list with dot bullets. */}
            <div className="space-y-4">
              {(analysis?.cause || reasons.length > 0) && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Causes</h5>
                  <ul className="space-y-2">
                    {(analysis?.cause ? [analysis.cause] : reasons).map((cause, idx) => (
                      <li key={idx} className={`text-sm flex items-start gap-2 ${darkMode ? "text-gray-200" : "text-inksoft"}`}>
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(analysis?.recommendation || recommendations.length > 0) && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Recommendations</h5>
                  <ul className="space-y-2">
                    {(analysis?.recommendation ? [analysis.recommendation] : recommendations).map((rec, idx) => (
                      <li key={idx} className={`text-sm flex items-start gap-2 ${darkMode ? "text-gray-200" : "text-inksoft"}`}>
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Affected Nodes */}
            {meta?.failedNodes && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Affected Elements & Issues</span>
                  {meta.help && (
                    <span className="text-[10px] font-semibold text-blue-500/60 italic">"{meta.help}"</span>
                  )}
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {meta.failedNodes.map((node, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border transition-colors ${darkMode ? "bg-slate-900/40 border-slate-800 hover:border-slate-700" : "bg-card border-line hover:border-linesoft"} space-y-3`}>

                      {/* Technical Issue - The most important part */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Issue Detected</span>
                        </div>
                        <p className={`text-xs font-semibold leading-relaxed ${darkMode ? "text-slate-200" : "text-ink"}`}>
                          {node.failureSummary.replace("Fix any of the following:", "").trim()}
                        </p>
                      </div>

                      {/* Selector with Copy */}
                      <div className="space-y-1.5 relative group/selector">
                        <span className="text-[9px] font-semibold uppercase opacity-40 tracking-wider">Target Element</span>
                        <div className={`p-2 pr-8 rounded-lg font-mono text-[10px] break-all border ${darkMode ? "bg-slate-950/50 border-slate-800 text-blue-400" : "bg-cardsoft border-line text-accent"}`}>
                          {Array.isArray(node.target) ? node.target.join(" ") : node.target}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(Array.isArray(node.target) ? node.target.join(" ") : node.target);
                          }}
                          className={`absolute bottom-2 right-2 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-0 group-hover/selector:opacity-100 ${darkMode ? "text-slate-400" : "text-muted"}`}
                          title="Copy Selector"
                        >
                          <Copy size={12} />
                        </button>
                      </div>

                      {/* HTML Snippet */}
                      {node.html && (
                        <div className="space-y-1.5 group/html">
                          <span className="text-[9px] font-semibold uppercase opacity-40 tracking-wider">Source HTML</span>
                          <div className="relative">
                            <div className="p-3 rounded-lg bg-slate-950 overflow-hidden border border-slate-800">
                              <code className="text-[10px] font-mono text-slate-400 block whitespace-pre-wrap leading-tight">{node.html}</code>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(node.html);
                                alert("HTML snippet copied!");
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 text-white opacity-0 group-hover/html:opacity-100 transition-opacity hover:bg-white/20"
                              title="Copy HTML"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

const Section = ({ title, icon: Icon, children, darkMode }) => (
  <div className="space-y-5">
    <div className="flex items-center gap-4 px-2">
      <div className={`p-2.5 rounded-xl ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-accentsoft text-accent shadow-sm"}`}>
        <Icon size={20} />
      </div>
      <h2 className={`text-xl font-semibold tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>{title}</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {children}
    </div>
  </div>
);

// Where the headline score actually went.
//
// The backend has always computed this log (Score_Breakdown.items — one row per
// failing rule, with the element count and the points it cost) but nothing
// rendered it, so the header could claim "score deducts per failing element"
// while a reader had no way to see WHICH elements. That gap is exactly what makes
// a low score look arbitrary: the Passed/Warning/Failed tally counts RULES, the
// score counts ELEMENTS, and without this table the two look contradictory.
const IMPACT_STYLE = {
  critical: { light: "bg-rose-50 text-rose-700 border-rose-100", dark: "bg-rose-900/20 text-rose-300 border-rose-800/50" },
  serious: { light: "bg-orange-50 text-orange-700 border-orange-100", dark: "bg-orange-900/20 text-orange-300 border-orange-800/50" },
  moderate: { light: "bg-amber-50 text-amber-700 border-amber-100", dark: "bg-amber-900/20 text-amber-300 border-amber-800/50" },
  minor: { light: "bg-slate-100 text-slate-600 border-slate-200", dark: "bg-slate-800/60 text-slate-400 border-slate-700/50" },
};

const ScoreBreakdown = ({ breakdown, score, darkMode }) => {
  const items = Array.isArray(breakdown?.items) ? breakdown.items : [];
  if (!items.length) return null;

  const { base, totalDeduction, effectiveDeduction, perRuleCap, softKnee } = breakdown;
  // The tail only engages past the knee; below it raw and effective are equal, so
  // showing "compressed" there would be noise.
  const compressed = typeof totalDeduction === "number" && typeof effectiveDeduction === "number"
    && totalDeduction - effectiveDeduction >= 0.5;
  const cell = darkMode ? "text-slate-300" : "text-ink";
  const muted = darkMode ? "text-slate-500" : "text-muted";

  return (
    <div className={`md:col-span-2 rounded-2xl border overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-line"}`}>
      <div className={`px-5 py-4 border-b ${darkMode ? "border-slate-800" : "border-line"}`}>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={`text-sm font-semibold ${cell}`}>{base}</span>
          <span className={`text-sm ${muted}`}>automated ceiling</span>
          <span className={`text-sm ${muted}`}>−</span>
          <span className="text-sm font-semibold text-rose-500">{effectiveDeduction}</span>
          <span className={`text-sm ${muted}`}>deducted</span>
          <span className={`text-sm ${muted}`}>=</span>
          <span className={`text-sm font-semibold ${cell}`}>{score}%</span>
        </div>
        {compressed && (
          <p className={`text-[11px] mt-1.5 ${muted}`}>
            {totalDeduction} raw points of failures, compressed to {effectiveDeduction} — past {softKnee?.threshold} the curve
            flattens so the worst pages stay ordered instead of all landing on the same score.
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left text-[11px] uppercase tracking-wide ${muted} ${darkMode ? "bg-slate-900/60" : "bg-cardsoft"}`}>
              <th className="px-5 py-2 font-semibold">Rule</th>
              <th className="px-3 py-2 font-semibold">Impact</th>
              <th className="px-3 py-2 font-semibold text-right whitespace-nowrap">Elements</th>
              <th className="px-5 py-2 font-semibold text-right whitespace-nowrap">Cost</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const style = IMPACT_STYLE[it.impact] || IMPACT_STYLE.minor;
              const capped = perRuleCap?.[it.impact] !== undefined && it.deduction >= perRuleCap[it.impact];
              return (
                <tr key={`${it.rule}-${i}`} className={`border-t ${darkMode ? "border-slate-800" : "border-line"}`}>
                  <td className={`px-5 py-2.5 font-medium ${cell}`}>{it.rule}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border ${darkMode ? style.dark : style.light}`}>
                      {it.impact}
                    </span>
                  </td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${cell}`}>{it.nodes || "—"}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums whitespace-nowrap">
                    <span className="font-semibold text-rose-500">−{it.deduction}</span>
                    {capped && <span className={`ml-1.5 text-[10px] ${muted}`}>capped</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={`px-5 py-3 border-t text-[11px] ${muted} ${darkMode ? "border-slate-800 bg-slate-900/60" : "border-line bg-cardsoft"}`}>
        Each rule costs points per FAILING ELEMENT, scaled by impact and capped per rule
        (critical {perRuleCap?.critical} · serious {perRuleCap?.serious} · moderate {perRuleCap?.moderate} · minor {perRuleCap?.minor}).
        This is why the tally above counts rules while the score reflects how many elements each rule breaks —
        one rule failing on 60 elements costs far more than one failing on 1.
      </div>
    </div>
  );
};

// Accessibility Dashboard
const Accessibility_Inner = React.memo(function Accessibility_Inner({ data, loading, darkMode }) {
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const { audienceMode } = useData();

  const auditSteps = useMemo(() => [
    { icon: <Eye className="w-8 h-8 text-blue-500" />, title: "Visual & Media Analysis", text: "Checking Color Contrast, Image Alt Text, and Viewport scaling..." },
    { icon: <Keyboard className="w-8 h-8 text-purple-500" />, title: "Keyboard Navigation", text: "Verifying Focus Order, Tab Index, Skip Links, and Focus traps..." },
    { icon: <MousePointer className="w-8 h-8 text-emerald-500" />, title: "Interactive Elements", text: "Analyzing Buttons, Links, Click targets, and Affordances..." },
    { icon: <Layers className="w-8 h-8 text-amber-500" />, title: "ARIA & Semantics", text: "Validating ARIA Roles, Attributes, Hidden content, and Labels..." },
    { icon: <Layout className="w-8 h-8 text-rose-500" />, title: "Page Structure", text: "Checking Heading hierarchy, Landmarks, Lists, and Document Title..." },
  ], []);

  const metric = data?.accessibility || {};

  if (!data?.accessibility) {
    return (
      <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-surface"} transition-colors duration-300`}>
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-6`}>
          {/* ✅ Card 1: URL Header Card */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
            <UrlHeader
              data={data}
              darkMode={darkMode}
              sectionName="Accessibility"
              sectionData={metric}
              auditScore={metric?.Percentage}
              hideBorder={true}
            />
          </div>

          {/* ✅ Card 2: Overview / Preview Card */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
            <div className={`flex flex-col xl:flex-row ${data?.report === "All" ? "" : "min-h-[300px]"}`}>
              {/* Left Panel: Live Preview (Only if not All) */}
              {data?.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-cardsoft border-line"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}
              {/* Right Panel: Shimmer */}
              <div className="flex-1 flex flex-col justify-center">
                <AuditShimmer darkMode={darkMode} steps={auditSteps} />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Keyboard sub-checks are folded into Keyboard_Navigation and not rendered as
  // their own cards, so exclude them from the header tally to avoid double-counting.
  const HIDDEN_FROM_TALLY = new Set(["Focus_Order", "Focusable_Content", "Tab_Index", "Aria_Hidden_Focus"]);
  const allMetrics = [
    ...Object.entries(metric)
      .filter(([k, val]) => typeof val === 'object' && val !== null && 'score' in val && !HIDDEN_FROM_TALLY.has(k))
      .map(([, val]) => val),
    // Failing axe rules surfaced as their own cards count toward the tally too.
    ...(Array.isArray(metric.Other_Issues) ? metric.Other_Issues : []),
  ];
  // Graded scores → tally by status, not exact score values. Signed-out visitors get
  // this section stripped, so fall back to the server's tallies rather than counting
  // metrics that were never sent.
  const passedCount = metric?.locked ? (metric.passedCount ?? 0) : allMetrics.filter(m => m.status === "pass").length;
  const warningCount = metric?.locked ? (metric.warningCount ?? 0) : allMetrics.filter(m => m.status === "warning").length;
  const failedCount = metric?.locked ? (metric.failedCount ?? 0) : allMetrics.filter(m => m.status === "fail").length;

  return (
    <div className={`w-full min-h-screen ${darkMode ? "bg-gray-900" : "bg-surface"} transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-6">

        {/* ✅ Card 1: URL Header Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
          <UrlHeader
            data={data}
            darkMode={darkMode}
            sectionName="Accessibility"
            sectionData={metric}
            auditScore={metric?.Percentage}
            hideBorder={true}
          />
        </div>

        {/* ✅ Card 2: Overview / Preview Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
          {loading || !data?.accessibility ? (
            <div className={`flex flex-col xl:flex-row ${data?.report === "All" ? "" : "min-h-[300px]"}`}>
              {/* Left Panel: Live Preview (Only if not All) */}
              {data?.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-cardsoft border-line"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}
              {/* Right Panel: Shimmer */}
              <div className="flex-1 flex flex-col justify-center">
                <AuditShimmer darkMode={darkMode} steps={auditSteps} />
              </div>
            </div>
          ) : (
            <div className={`flex flex-col xl:flex-row ${data.report === "All" ? "" : "min-h-[300px]"}`}>
              {/* Left Panel: Live Preview */}
              {data.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-cardsoft border-line"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              {/* Right Panel: Metrics & Score */}
              <PillarHeader
                darkMode={darkMode}
                fullReport={data.report === "All"}
                badge={{ icon: ShieldCheck, label: "WCAG 2.2 AA Audit" }}
                note={<>
                  {metric?.Coverage && (
                    <div className={`inline-flex items-start gap-2 mt-1 px-3 py-1.5 rounded-lg text-[11px] font-medium ${darkMode ? "bg-slate-800/60 text-slate-400 border border-slate-700/50" : "bg-cardsoft text-muted border border-line"}`}>
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                      <span>
                        {metric.Coverage} Score deducts per failing element, scaled by impact and capped per rule — matching how AccessibilityChecker.org counts issues (same WCAG A/AA + best-practice + experimental rule set, excluding AAA) — from an automated ceiling of 90; the last 10 points require manual review (confidence: {metric?.Confidence || "heuristic"}).
                        {typeof metric?.Graded_Percentage === "number" && (
                          <> Page-level element pass rate: {metric.Graded_Percentage}%.</>
                        )}
                      </span>
                    </div>
                  )}
                </>}
                title="Accessibility"
                titleAccent="Health"
                description="Comprehensive analysis of your website's accessibility, ensuring an inclusive experience for all users."
                stats={{ passed: passedCount, warning: warningCount, failed: failedCount }}
                score={metric?.Percentage || 0}
                onMethodology={() => setSelectedMetricInfo(scoreCalculationInfo)}
              />
            </div>
          )}
        </div>

        {/* Visual Accessibility Section (Gated) */}
        <ReportRestrictionWrapper section="Accessibility">
          <div className="space-y-8">
            {(() => {
              const visible = (keys) => keys.filter((k) => metric[k] && isVisibleForAudience(k, audienceMode));
              const visualKeys = visible(["Color_Contrast", "Image_Alt", "Meta_Viewport", "Target_Size", "Reflow", "Text_Spacing", "Reduced_Motion"]);
              // Focus_Order / Focusable_Content / Tab_Index / Aria_Hidden_Focus are the
              // sub-checks folded into the single Keyboard_Navigation parameter (spec §2.3
              // treats keyboard as ONE param) — kept in the payload for the composite
              // breakdown, but NOT rendered as standalone cards (no double-counted display).
              const interactionKeys = visible(["Keyboard_Navigation", "Skip_Links", "Interactive_Element_Affordance", "Focus_Not_Obscured"]);
              const rolesKeys = visible(["Label", "Button_Name", "Link_Name", "Aria_Roles", "Landmarks", "Document_Title", "Html_Has_Lang", "List", "Heading_Order", "Aria_Allowed_Attr"]);
              const card = (k) => <MetricCard key={k} metricKey={k} data={metric[k]} darkMode={darkMode} onInfo={(info) => setSelectedParameterInfo(info)} />;
              return (
                <>
                  {metric.WCAG_AA_Compliance && isVisibleForAudience("WCAG_AA_Compliance", audienceMode) && (
                    <Section title="WCAG 2.2 AA Compliance" icon={ShieldCheck} darkMode={darkMode}>
                      <MetricCard metricKey="WCAG_AA_Compliance" data={metric.WCAG_AA_Compliance} darkMode={darkMode} onInfo={(info) => setSelectedParameterInfo(info)} />
                    </Section>
                  )}

                  {/* What the headline score was actually spent on — rendered right
                      under the compliance card because it is the first question a
                      low score raises, and the rule-vs-element distinction it shows
                      is what reconciles the score with the Passed/Warning/Failed tally. */}
                  {/* Gated on items, not on Score_Breakdown itself: a crashed axe scan
                      still emits the object with an empty log, and ScoreBreakdown would
                      return null under a heading that had nothing beneath it. */}
                  {metric.Score_Breakdown?.items?.length > 0 && (
                    <Section title="Score Breakdown" icon={Layers} darkMode={darkMode}>
                      <ScoreBreakdown breakdown={metric.Score_Breakdown} score={metric?.Percentage ?? 0} darkMode={darkMode} />
                    </Section>
                  )}

                  {visualKeys.length > 0 && (
                    <Section title="Visual & Media" icon={Eye} darkMode={darkMode}>{visualKeys.map(card)}</Section>
                  )}

                  {interactionKeys.length > 0 && (
                    <Section title="Keyboard & Interaction" icon={Keyboard} darkMode={darkMode}>{interactionKeys.map(card)}</Section>
                  )}

                  {rolesKeys.length > 0 && (
                    <Section title="Semantics & Roles" icon={Code} darkMode={darkMode}>{rolesKeys.map(card)}</Section>
                  )}

                  {/* Additional WCAG issues detected by the scan that aren't one of the
                      named parameters above — each with its own cause + fix, so the
                      section explains everything that drove the score. */}
                  {Array.isArray(metric.Other_Issues) && metric.Other_Issues.length > 0 && (
                    <Section title="Additional WCAG Issues" icon={AlertTriangle} darkMode={darkMode}>
                      {metric.Other_Issues.map((iss) => (
                        <MetricCard key={iss.key} metricKey={iss.key} data={iss} darkMode={darkMode} onInfo={(info) => setSelectedParameterInfo(info)} />
                      ))}
                    </Section>
                  )}
                </>
              );
            })()}
          </div>
        </ReportRestrictionWrapper>
      </main>

      <MetricInfoModal isOpen={!!selectedMetricInfo} onClose={() => setSelectedMetricInfo(null)} info={selectedMetricInfo} darkMode={darkMode} />
      <ParameterInfoModal isOpen={!!selectedParameterInfo} onClose={() => setSelectedParameterInfo(null)} info={selectedParameterInfo} darkMode={darkMode} />
    </div>
  );
});

export default function Accessibility({ data: propData, loading: propLoading, darkMode: propDarkMode }) {
  const contextData = useData();
  const { theme } = useContext(ThemeContext);

  const data = propData !== undefined ? propData : contextData.data;
  const loading = propLoading !== undefined ? propLoading : contextData.loading;
  const darkMode = propDarkMode !== undefined ? propDarkMode : (theme === "dark");

  return <Accessibility_Inner data={data} loading={loading} darkMode={darkMode} />;
}