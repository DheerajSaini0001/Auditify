import React, { useContext, useMemo } from "react";
import UrlHeader from "../Component/UrlHeader";
import ReportRestrictionWrapper from "../Component/ReportRestrictionWrapper";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  CheckCircle, XCircle, AlertTriangle, Info,
  Eye, MousePointer, Layout, Type, Image as ImageIcon,
  Link, Navigation, Layers, Code, ShieldCheck,
  Keyboard, Focus, Hash, Anchor, Map, Terminal, Loader2, PersonStanding,
  ChevronDown, ChevronUp, ExternalLink, Copy
} from "lucide-react";

import MetricInfoModal from "../Component/MetricInfoModal";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import { InfoDetails } from "../Component/InfoDetails";
import AskAIButton from "../Component/AskAIButton";
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

const AccessibilityShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
  const step = steps[currentStep] || steps[0];

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 animate-in fade-in zoom-in duration-500 min-h-[350px]">
      <div className={`w-full max-w-xl rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-500 ${darkMode ? "bg-slate-800/40 border border-slate-700/50" : "bg-cardsoft border border-line"}`}>
        {/* Icon Container (Circle) */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${darkMode ? "bg-slate-900 shadow-black/40 text-white" : "bg-[#1e293b] shadow-slate-400/30 text-white"}`}>
          <div className="animate-pulse">
            {React.cloneElement(step.icon, {
              className: "w-8 h-8",
              strokeWidth: 2.5
            })}
          </div>
        </div>

        {/* Title */}
        <h2 className={`mt-6 text-2xl font-semibold tracking-tight transition-all duration-500 ${darkMode ? "text-white" : "text-ink"}`}>
          {step.title}
        </h2>

        {/* Description */}
        <p className={`mt-4 text-base leading-relaxed max-w-sm mx-auto transition-all duration-500 ${darkMode ? "text-slate-400" : "text-muted"}`}>
          {step.text}
        </p>

        {/* Processing State */}
        <div className="mt-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-wider">Processing</span>
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center gap-2 mt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? "w-6 bg-blue-500" : i < currentStep ? "w-6 bg-blue-500/40" : "w-2 bg-slate-400/30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

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
  const title = metricKey.replaceAll("_", " ");

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
        {metricKey === "WCAG_AA_Compliance" && meta && (
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

            {/* Cause & Recommendation */}
            <div className={`p-4 rounded-xl space-y-4 border ${darkMode ? "bg-blue-500/5 border-blue-500/20" : "bg-accentsoft border-accentsoft"}`}>
              {(analysis?.cause || reasons.length > 0) && (
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Root Cause:</span>
                  {analysis?.cause ? (
                    <p className={`text-xs font-semibold leading-relaxed ${darkMode ? "text-slate-300" : "text-inksoft"}`}>{analysis.cause}</p>
                  ) : (
                    <ul className="space-y-1.5 list-disc list-inside">
                      {reasons.map((reason, idx) => (
                        <li key={idx} className={`text-xs leading-relaxed ${darkMode ? "text-slate-300" : "text-inksoft"}`}>{reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {(analysis?.recommendation || recommendations.length > 0) && (
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Fix Action Plan:</span>
                  {analysis?.recommendation ? (
                    <div className="flex gap-2 items-start">
                      <ShieldCheck size={14} className="mt-0.5 text-blue-500 shrink-0" />
                      <p className={`text-xs font-semibold leading-relaxed ${darkMode ? "text-slate-200" : "text-ink"}`}>{analysis.recommendation}</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <ShieldCheck size={14} className="mt-0.5 text-blue-500 shrink-0" />
                          <p className={`text-xs font-semibold leading-relaxed ${darkMode ? "text-slate-200" : "text-ink"}`}>{rec}</p>
                        </li>
                      ))}
                    </ul>
                  )}
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

  const [activeStep, setActiveStep] = React.useState(0);
  React.useEffect(() => {
    if (loading || !data?.accessibility) {
      const interval = setInterval(() => { setActiveStep(prev => (prev + 1) % auditSteps.length); }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);

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
                <AccessibilityShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
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
  const allMetrics = Object.entries(metric)
    .filter(([k, val]) => typeof val === 'object' && val !== null && 'score' in val && !HIDDEN_FROM_TALLY.has(k))
    .map(([, val]) => val);
  // Graded scores → tally by status, not exact score values.
  const passedCount = allMetrics.filter(m => m.status === "pass").length;
  const warningCount = allMetrics.filter(m => m.status === "warning").length;
  const failedCount = allMetrics.filter(m => m.status === "fail").length;

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
                <AccessibilityShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
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
              <div className={`flex-1 ${data.report === "All" ? "px-6 pb-4 pt-2 lg:px-10 lg:pt-2" : "px-6 pb-4 pt-4 lg:px-12 lg:pt-6"} flex flex-col justify-center`}>
                <div className={`w-full ${data.report === "All" ? "" : "max-w-2xl mx-auto"} ${data.report === "All" ? "space-y-7" : "space-y-6"}`}>

                  <div className={`flex flex-col md:flex-row items-center ${data.report === "All" ? "gap-7 md:gap-9 justify-between" : "gap-6 md:gap-8 justify-center"}`}>

                    {/* Text Content */}
                    <div className={`flex-1 ${data.report === "All" ? "space-y-5" : "space-y-4"} text-left order-2 md:order-1`}>
                      <div className={`${data.report === "All" ? "space-y-2" : "space-y-1.5"}`}>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-accentsoft text-accent border border-accentsoft"}`}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>WCAG 2.2 AA Audit</span>
                        </div>
                        <h3 className={`${data.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
                          Accessibility <span className="text-blue-500">Health</span>
                        </h3>
                        <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-muted"}`}>
                          Comprehensive analysis of your website's accessibility, ensuring an inclusive experience for all users.
                        </p>
                        {metric?.Coverage && (
                          <div className={`inline-flex items-start gap-2 mt-1 px-3 py-1.5 rounded-lg text-[11px] font-medium ${darkMode ? "bg-slate-800/60 text-slate-400 border border-slate-700/50" : "bg-cardsoft text-muted border border-line"}`}>
                            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                            <span>{metric.Coverage} Automated checks ≈ 30–40% of WCAG, so the score is capped below 100 (confidence: {metric?.Confidence || "heuristic"}). Manual review still required.</span>
                          </div>
                        )}
                      </div>

                      <div className={`flex flex-wrap items-center ${data.report === "All" ? "gap-6" : "gap-5"}`}>
                        <div className={`flex items-center ${data.report === "All" ? "gap-5" : "gap-4"}`}>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-emerald-500" />
                            <span className={`text-xs font-semibold  tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{passedCount} Passed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" />
                            <span className={`text-xs font-semibold  tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{warningCount} Warning</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle size={18} className="text-rose-500" />
                            <span className={`text-xs font-semibold  tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{failedCount} Failed</span>
                          </div>
                        </div>
                        <div className={`w-px h-4 ${darkMode ? "bg-slate-800" : "bg-surface-2 hidden md:block"}`}></div>
                        <button
                          onClick={() => setSelectedMetricInfo(scoreCalculationInfo)}
                          className={`flex items-center gap-2 text-sm font-semibold transition-all ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-accent hover:text-accenthover"}`}
                        >
                          <Info size={16} />
                          <span className="border-b border-transparent hover:border-current">Metric Methodology</span>
                        </button>
                      </div>
                    </div>

                    {/* Circular Progress */}
                    <div className="relative flex-shrink-0 group cursor-default order-1 md:order-2">
                      <div className={`absolute -inset-8 rounded-full blur-3xl opacity-25 transition-opacity duration-700 group-hover:opacity-40 ${metric?.Percentage >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                      <CircularProgress value={metric?.Percentage || 0} size={data.report === "All" ? 180 : 150} stroke={14} />
                      <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                        <span className={`${data.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>{metric?.Percentage || 0}%</span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Visual Accessibility Section (Gated) */}
        <ReportRestrictionWrapper>
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

                  {visualKeys.length > 0 && (
                    <Section title="Visual & Media" icon={Eye} darkMode={darkMode}>{visualKeys.map(card)}</Section>
                  )}

                  {interactionKeys.length > 0 && (
                    <Section title="Keyboard & Interaction" icon={Keyboard} darkMode={darkMode}>{interactionKeys.map(card)}</Section>
                  )}

                  {rolesKeys.length > 0 && (
                    <Section title="Semantics & Roles" icon={Code} darkMode={darkMode}>{rolesKeys.map(card)}</Section>
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