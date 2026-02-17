import React, { useContext, useMemo } from "react";
import UrlHeader from "../Component/UrlHeader";
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
import { AuditShimmer } from "../Component/reusablecomponent/AuditShimmer";
import MetricInfoModal from "../Component/MetricInfoModal";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import { InfoDetails } from "../Component/InfoDetails";

// Icon Mapping
const iconMap = {
  Color_Contrast: Type,
  Focus_Order: Navigation,
  Focusable_Content: Focus,
  Tab_Index: Hash,
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
};

const educationalContent = InfoDetails;
const scoreCalculationInfo = InfoDetails.Accessibility_Methodology;

// Simplified Metric Card
const MetricCard = ({ metricKey, data, darkMode, onInfo }) => {
  const { score, details, analysis } = data || {};
  const meta = analysis;
  const isPassed = score === 100;
  const isWarning = score === 50;
  const [showDetails, setShowDetails] = React.useState(false);

  const Icon = iconMap[metricKey] || CheckCircle;
  const content = educationalContent[metricKey] || { desc: "Accessibility check.", why: "Ensures inclusivity." };
  const title = metricKey.replaceAll("_", " ");

  const colors = {
    emerald: { light: "text-emerald-600", dark: "text-emerald-400", border: "border-l-emerald-500", bg: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    amber: { light: "text-amber-600", dark: "text-amber-400", border: "border-l-amber-500", bg: "bg-amber-50 text-amber-700 border-amber-100" },
    rose: { light: "text-rose-600", dark: "text-rose-400", border: "border-l-rose-500", bg: "bg-rose-50 text-rose-700 border-rose-100" }
  };

  const statusType = isPassed ? "emerald" : (isWarning ? "amber" : "rose");
  const themeColors = colors[statusType];
  const cardBg = darkMode ? "bg-gray-800/80 border-gray-700" : "bg-white border-gray-200";
  const statusLabel = isPassed ? "Passed" : (isWarning ? "Warning" : "Failed");

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col`}>
      <div className="p-5 space-y-5">
        {/* 1. Header Section */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {/* Icon Box */}
            <div className={`p-3 rounded-xl ${darkMode ? "bg-slate-700/50" : "bg-slate-100"} shrink-0`}>
              <Icon size={24} className={darkMode ? themeColors.dark : themeColors.light} />
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className={`font-bold text-lg tracking-tight ${darkMode ? "text-white" : "text-slate-900"} truncate`}>
                {title}
              </h3>
              <div className="flex items-center gap-3">
                <div className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${darkMode ? `bg-${statusType}-500/10 text-${statusType}-400` : themeColors.bg}`}>
                  {statusLabel}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {(!isPassed || meta?.failedNodes || meta?.present || meta?.missing) && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${darkMode ? "bg-slate-700/50 text-slate-300 hover:bg-slate-700" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
              >
                {showDetails ? "Hide Details" : "View Details"}
                {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
            {onInfo && (
              <button
                onClick={(e) => { e.stopPropagation(); onInfo(); }}
                className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-900"}`}
                title="Methodology"
              >
                <Info size={20} />
              </button>
            )}
          </div>
        </div>

        {/* 2. Description Section */}
        <div className="space-y-3">
          <div className="text-xs leading-relaxed font-medium">
            <span className={`font-black uppercase tracking-widest text-[10px] mr-2 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
              Description:
            </span>
            <span className={darkMode ? "text-slate-300" : "text-slate-600"}>
              {content.whatThisParameterIs}
            </span>
          </div>

          <div className="text-xs leading-relaxed font-medium">
            <span className={`font-black uppercase tracking-widest text-[10px] mr-2 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
              Threshold:
            </span>
            <span className={darkMode ? "text-slate-300" : "text-slate-600"}>
              {data.threshold}
            </span>
          </div>
        </div>

        {/* 3. Status Section */}
        <div className="space-y-2">
          <h4 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            Current Status
          </h4>
          <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-slate-100/30 border-slate-200/50"}`}>
            <p className={`text-base font-bold ${isPassed ? "text-emerald-500" : "text-rose-500"}`}>
              {details || "Audit Passed"}
            </p>
            {meta?.count !== undefined && !isPassed && (
              <p className="mt-1 text-[11px] font-bold uppercase tracking-tight opacity-40">
                {meta.count} elements affected
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px w-full ${darkMode ? "bg-slate-700/50" : "bg-slate-100"}`} />

        {/* 4. Why It Matters Section */}
        <div className="text-xs leading-relaxed font-medium pb-1">
          <span className={`font-black uppercase tracking-widest text-[10px] mr-2 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            Why it matters:
          </span>
          <span className={darkMode ? "text-slate-400" : "text-slate-500"}>
            {content.whyItMatters}
          </span>
        </div>



        {/* 5. Expanded Technical Content */}
        {showDetails && (
          <div className="pt-2 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Analysis Metadata */}
            {(meta?.impact || meta?.helpUrl || meta?.description) && (
              <div className="space-y-3">
                {meta.description && (
                  <div className={`p-3 rounded-lg border-l-4 ${darkMode ? "bg-slate-800/50 border-l-blue-500/50 text-slate-300" : "bg-blue-50/50 border-l-blue-400 text-slate-700"}`}>
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
                    <a href={meta.helpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-500 hover:text-blue-400 transition-colors">
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
                        <div key={idx} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${darkMode ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
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
                        <div key={idx} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-400" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cause & Recommendation */}
            <div className={`p-4 rounded-xl space-y-4 border ${darkMode ? "bg-blue-500/5 border-blue-500/20" : "bg-blue-50/50 border-blue-100"}`}>
              {data.cause && (
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Root Cause:</span>
                  <p className={`text-xs font-semibold leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{data.cause}</p>
                </div>
              )}
              {data.recommendation && (
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Fix Action Plan:</span>
                  <div className="flex gap-2 items-start">
                    <ShieldCheck size={14} className="mt-0.5 text-blue-500 shrink-0" />
                    <p className={`text-xs font-bold leading-relaxed ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{data.recommendation}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Affected Nodes */}
            {meta?.failedNodes && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Affected Elements & Issues</span>
                  {meta.help && (
                    <span className="text-[10px] font-bold text-blue-500/60 italic">"{meta.help}"</span>
                  )}
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {meta.failedNodes.map((node, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border transition-colors ${darkMode ? "bg-slate-900/40 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"} space-y-3`}>

                      {/* Technical Issue - The most important part */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Issue Detected</span>
                        </div>
                        <p className={`text-xs font-bold leading-relaxed ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                          {node.failureSummary.replace("Fix any of the following:", "").trim()}
                        </p>
                      </div>

                      {/* Selector with Copy */}
                      <div className="space-y-1.5 relative group/selector">
                        <span className="text-[9px] font-bold uppercase opacity-40 tracking-wider">Target Element</span>
                        <div className={`p-2 pr-8 rounded-lg font-mono text-[10px] break-all border ${darkMode ? "bg-slate-950/50 border-slate-800 text-blue-400" : "bg-slate-50 border-slate-200 text-blue-600"}`}>
                          {Array.isArray(node.target) ? node.target.join(" ") : node.target}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(Array.isArray(node.target) ? node.target.join(" ") : node.target);
                          }}
                          className={`absolute bottom-2 right-2 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-0 group-hover/selector:opacity-100 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                          title="Copy Selector"
                        >
                          <Copy size={12} />
                        </button>
                      </div>

                      {/* HTML Snippet */}
                      {node.html && (
                        <div className="space-y-1.5 group/html">
                          <span className="text-[9px] font-bold uppercase opacity-40 tracking-wider">Source HTML</span>
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
      <div className={`p-2.5 rounded-xl ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600 shadow-sm"}`}>
        <Icon size={20} />
      </div>
      <h2 className={`text-xl font-bold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{title}</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {children}
    </div>
  </div>
);

// Accessibility Dashboard
export default function Accessibility() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const darkMode = theme === "dark";

  const auditSteps = useMemo(() => [
    { icon: <Eye />, title: "Visual & Media Analysis", text: "Checking Color Contrast, Image Alt Text, and Viewport scaling..." },
    { icon: <Keyboard />, title: "Keyboard Navigation", text: "Verifying Focus Order, Tab Index, Skip Links, and Focus traps..." },
    { icon: <MousePointer />, title: "Interactive Elements", text: "Analyzing Buttons, Links, Click targets, and Affordances..." },
    { icon: <Layers />, title: "ARIA & Semantics", text: "Validating ARIA Roles, Attributes, Hidden content, and Labels..." },
    { icon: <Layout />, title: "Page Structure", text: "Checking Heading hierarchy, Landmarks, Lists, and Document Title..." },
  ], []);

  const [activeStep, setActiveStep] = React.useState(0);
  React.useEffect(() => {
    if (loading || !data?.accessibility) {
      const interval = setInterval(() => { setActiveStep(prev => (prev + 1) % auditSteps.length); }, 2500);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);


  if (!data?.accessibility) {
    return (
      <div className={`w-full min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <main className="max-w-7xl mx-auto px-6 py-10">
          <div className={`rounded-3xl overflow-hidden ${darkMode ? "bg-slate-800/40 border border-slate-700/50" : "bg-white border border-slate-200 shadow-xl shadow-slate-200/50"}`}>
            <UrlHeader data={data} darkMode={darkMode} />
            <div className="flex flex-col xl:flex-row min-h-[300px]">
              {data.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-6 border-b xl:border-b-0 xl:border-r ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                  <LivePreview data={data} loading={loading} variant="plain" />
                </div>
              )}
              <div className="flex-1 flex items-center justify-center">
                <AuditShimmer darkMode={darkMode} loading={loading} data={data} auditSteps={auditSteps} metricKey="accessibility" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const metric = data.accessibility;
  const allMetrics = Object.values(metric).filter(val => typeof val === 'object' && val !== null && 'score' in val);
  const passedCount = allMetrics.filter(m => m.score === 100).length;
  const warningCount = allMetrics.filter(m => m.score === 50).length;
  const failedCount = allMetrics.filter(m => m.score < 50).length;

  return (
    <div className={`w-full min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {/* ✅ Unified Master Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

          <UrlHeader data={data} darkMode={darkMode} />

          {loading || !data?.accessibility ? (
            <div className="flex flex-col xl:flex-row min-h-[300px]">
              {data.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-6 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10 px-2 lg:px-6">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}
              <div className="flex-1 flex items-center justify-center">
                <AuditShimmer darkMode={darkMode} loading={loading} data={data} auditSteps={auditSteps} metricKey="accessibility" />
              </div>
            </div>
          ) : (
            <div className={`flex flex-col xl:flex-row ${data.report === "All" ? "" : "min-h-[300px]"}`}>
              {/* Left Panel: Live Preview */}
              {data.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              {/* Right Panel: Metrics & Score */}
              <div className={`flex-1 ${data.report === "All" ? "px-6 pb-4 pt-2 lg:px-10 lg:pt-2" : "px-6 pb-4 pt-4 lg:px-12 lg:pt-6"} flex flex-col justify-center`}>
                <div className={`w-full ${data.report === "All" ? "" : "max-w-2xl mx-auto"} ${data.report === "All" ? "space-y-10" : "space-y-8"}`}>

                  <div className={`flex flex-col md:flex-row items-center ${data.report === "All" ? "gap-10 md:gap-14 justify-between" : "gap-8 md:gap-12 justify-center"}`}>

                    {/* Text Content */}
                    <div className={`flex-1 ${data.report === "All" ? "space-y-5" : "space-y-4"} text-left order-2 md:order-1`}>
                      <div className={`${data.report === "All" ? "space-y-2" : "space-y-1.5"}`}>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-100/50 text-blue-600 border border-blue-200"}`}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>WCAG 2.1 Audit</span>
                        </div>
                        <h3 className={`${data.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                          Accessibility <span className="text-blue-500">Health</span>
                        </h3>
                        <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                          Comprehensive analysis of your website's accessibility, ensuring an inclusive experience for all users.
                        </p>
                      </div>

                      <div className={`flex flex-wrap items-center ${data.report === "All" ? "gap-6" : "gap-5"}`}>
                        <div className={`flex items-center ${data.report === "All" ? "gap-5" : "gap-4"}`}>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-emerald-500" />
                            <span className="text-sm font-bold">{passedCount} Passed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" />
                            <span className="text-sm font-bold">{warningCount} Warning</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle size={18} className="text-rose-500" />
                            <span className="text-sm font-bold">{failedCount} Failed</span>
                          </div>
                        </div>
                        <div className={`w-px h-4 ${darkMode ? "bg-slate-800" : "bg-slate-200 hidden md:block"}`}></div>
                        <button
                          onClick={() => setSelectedMetricInfo(scoreCalculationInfo)}
                          className={`flex items-center gap-2 text-sm font-bold transition-all ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
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
                        <span className={`${data.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{metric?.Percentage || 0}%</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Visual Accessibility Section */}
        <Section title="Visual & Media" icon={Eye} darkMode={darkMode}>
          {["Color_Contrast", "Image_Alt", "Meta_Viewport"].map(k => metric[k] && (
            <MetricCard key={k} metricKey={k} data={metric[k]} darkMode={darkMode} onInfo={() => setSelectedParameterInfo({ ...educationalContent[k], icon: iconMap[k] })} />
          ))}
        </Section>

        {/* Interaction Section */}
        <Section title="Keyboard & Interaction" icon={Keyboard} darkMode={darkMode}>
          {["Focusable_Content", "Focus_Order", "Tab_Index", "Skip_Links", "Interactive_Element_Affordance", "Aria_Hidden_Focus"].map(k => metric[k] && (
            <MetricCard key={k} metricKey={k} data={metric[k]} darkMode={darkMode} onInfo={() => setSelectedParameterInfo({ ...educationalContent[k], icon: iconMap[k] })} />
          ))}
        </Section>

        {/* Roles & Details Section */}
        <Section title="Semantics & Roles" icon={Code} darkMode={darkMode}>
          {["Label", "Button_Name", "Link_Name", "Aria_Roles", "Landmarks", "Document_Title", "Html_Has_Lang", "List", "Heading_Order", "Aria_Allowed_Attr"].map(k => metric[k] && (
            <MetricCard key={k} metricKey={k} data={metric[k]} darkMode={darkMode} onInfo={() => setSelectedParameterInfo({ ...educationalContent[k], icon: iconMap[k] })} />
          ))}
        </Section>
      </main>

      <MetricInfoModal isOpen={!!selectedMetricInfo} onClose={() => setSelectedMetricInfo(null)} info={selectedMetricInfo} darkMode={darkMode} />
      <ParameterInfoModal isOpen={!!selectedParameterInfo} onClose={() => setSelectedParameterInfo(null)} info={selectedParameterInfo} darkMode={darkMode} />
    </div>
  );
}