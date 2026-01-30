import React, { useContext, useMemo } from "react";
import UrlHeader from "../Component/UrlHeader";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  Activity, Zap, Layout, MousePointer2, Image as ImageIcon,
  Server, Database, FileCode, Globe, Shield, Link, Map,
  FileText, Search, ArrowRightLeft, Clock, Gauge, AlertTriangle,
  CheckCircle, XCircle, Loader2, Info, Eye, ShieldCheck, LayoutTemplate, TrendingUp, Bot
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import { InfoDetails } from "../Component/InfoDetails";
// ------------------------------------------------------
// ✅ Simple Skeleton
// ------------------------------------------------------
// ------------------------------------------------------
// ✅ Enhanced Shimmer
// ------------------------------------------------------
const ShimmerBlock = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
  </div>
);

const TechShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
  const step = steps[currentStep] || steps[0];

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 animate-in fade-in zoom-in duration-500 min-h-[350px]">
      <div className={`w-full max-w-xl rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-500 ${darkMode ? "bg-slate-800/40 border border-slate-700/50" : "bg-slate-100/60 border border-slate-200/50"
        }`}>

        {/* Icon Container (Circle) */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${darkMode ? "bg-slate-900 shadow-black/40 text-white" : "bg-[#1e293b] shadow-slate-400/30 text-white"
          }`}>
          <div className="animate-pulse">
            {React.cloneElement(step.icon, {
              className: "w-8 h-8",
              strokeWidth: 2.5
            })}
          </div>
        </div>

        {/* Title */}
        <h2 className={`mt-6 text-2xl font-bold tracking-tight transition-all duration-500 ${darkMode ? "text-white" : "text-slate-900"
          }`}>
          {step.title}
        </h2>

        {/* Description (3 lines focused) */}
        <p className={`mt-4 text-base leading-relaxed max-w-sm mx-auto transition-all duration-500 ${darkMode ? "text-slate-400" : "text-slate-500"
          }`}>
          {step.text}
        </p>

        {/* Processing State */}
        <div className="mt-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider">Processing</span>
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center gap-2 mt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep
                ? "w-6 bg-blue-500"
                : i < currentStep
                  ? "w-6 bg-blue-500/40"
                  : "w-2 bg-slate-400/30"
                }`}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Metric Card (Security Style)
// ------------------------------------------------------
const MetricCard = ({ details, value, dynamicData, darkMode, icon: Icon, className, selectedSource, metricKey }) => {
  // Check if this metric has lab/field structure
  const hasLabFieldStructure = dynamicData?.lab || dynamicData?.field;

  // Use activeData based on selectedSource, with fallback to lab if field is null/unavailable
  const activeData = hasLabFieldStructure
    ? (selectedSource === "field" && dynamicData.field ? dynamicData.field : dynamicData.lab)
    : dynamicData;

  // Determine Status from activeData
  let status = "pass";
  if (activeData?.status) {
    // Map backend status to our status
    if (activeData.status === "good") status = "pass";
    else if (activeData.status === "needs_improvement") status = "warning";
    else if (activeData.status === "poor") status = "fail";
  } else if (details.isCrux) {
    if (activeData?.category === "SLOW") status = "fail";
    else if (activeData?.category === "AVERAGE") status = "warning";
    else status = "pass";
  }

  const isPassed = status === "pass";
  const isWarning = status === "warning";

  // Simple Colors
  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";

  let statusColor = "text-red-600 bg-red-50 border-red-100";
  let statusText = "Failed";

  if (darkMode) {
    statusColor = "text-red-400 bg-red-900/20 border-red-800/30";
  }

  if (isPassed) {
    statusColor = darkMode ? "text-green-400 bg-green-900/20 border-green-800/30" : "text-green-600 bg-green-50 border-green-100";
    statusText = "Passed";
  } else if (isWarning) {
    statusColor = darkMode ? "text-yellow-400 bg-yellow-900/20 border-yellow-800/30" : "text-yellow-600 bg-yellow-50 border-yellow-100";
    statusText = "Warning";
  }

  const meta = activeData?.meta || {};
  const excludedKeys = ['value', 'unit', 'score', 'status', 'details', 'suggestion', 'exists', 'hasStructuredData', 'brokenLinksList', 'target', 'uncompressedResources', 'uncachedResources', 'unoptimizedImages', 'unminifiedScripts', 'blockingResources'];
  const metaKeys = Object.keys(meta).filter(key => !excludedKeys.includes(key));

  // Lists
  const brokenLinks = meta.brokenLinksList || [];
  const uncompressedResources = meta.uncompressedResources || [];
  const uncachedResources = meta.uncachedResources || [];
  const unoptimizedImages = meta.unoptimizedImages || [];
  const unminifiedScripts = meta.unminifiedScripts || [];
  const blockingResources = meta.blockingResources || [];

  const activeLists = [
    { title: "Uncompressed Resources", items: uncompressedResources },
    { title: "Uncached Resources", items: uncachedResources },
    { title: "Unoptimized Images", items: unoptimizedImages },
    { title: "Unminified Scripts", items: unminifiedScripts },
    { title: "Blocking Resources", items: blockingResources },
    { title: "Broken Links", items: brokenLinks.map(l => l.url) }
  ].filter(l => l.items.length > 0);

  // Get display value from activeData for lab/field metrics
  const displayValue = hasLabFieldStructure
    ? `${activeData?.value || 0}${activeData?.unit || ""}`
    : (value !== null && value !== undefined ? `${value}${details.unit || ""}` : "--");


  return (
    <div className={`relative overflow-hidden rounded-xl border ${cardBg} shadow-sm hover:shadow-md transition-shadow group ${className || ""}`}>
      <div className="p-5 space-y-4 h-full flex flex-col">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${textColor}`}>{details.title}</h3>
              <p className={`text-xs ${subTextColor} font-medium`}>{details.analogy}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit border ${statusColor}`}>
                  {statusText}
                </span>
                {hasLabFieldStructure && (
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${selectedSource === "lab"
                    ? darkMode ? "bg-blue-900/30 text-blue-400 border border-blue-700" : "bg-blue-100 text-blue-700 border border-blue-300"
                    : darkMode ? "bg-purple-900/30 text-purple-400 border border-purple-700" : "bg-purple-100 text-purple-700 border border-purple-300"
                    }`}>
                    {selectedSource === "lab"
                      ? "LAB"
                      : (dynamicData.field ? "REAL USERS" : "LAB")}
                  </span>
                )}
                {details.isCrux && <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">CrUX</span>}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className={`text-lg font-black ${isPassed ? "text-green-500" : isWarning ? "text-yellow-500" : "text-red-500"}`}>
              {displayValue}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                details.onInfo?.();
              }}
              className={`mt-1 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
              title="View Methodology"
            >
              <Info size={18} />
            </button>
          </div>
        </div>

        {/* Current Value Display for Lab/Field Metrics */}
        {hasLabFieldStructure && activeData?.value !== undefined && (
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Current Value
            </h4>
            <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              {details.title} is <span className={`font-bold ${isPassed ? "text-green-500" : isWarning ? "text-yellow-500" : "text-red-500"}`}>{activeData.value}{activeData.unit}</span>
            </p>
          </div>
        )}

        {/* Thresholds - Only for Lab/Field Metrics */}
        {hasLabFieldStructure && dynamicData?.thresholds && (
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Thresholds
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Good:</span>
                <span className={`font-mono font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                  ≤ {dynamicData.thresholds.good}{activeData?.unit || "ms"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Needs Improvement:</span>
                <span className={`font-mono font-semibold ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                  {dynamicData.thresholds.good + 1}–{dynamicData.thresholds.needsImprovement}{activeData?.unit || "ms"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Poor:</span>
                <span className={`font-mono font-semibold ${darkMode ? "text-red-400" : "text-red-600"}`}>
                  &gt; {dynamicData.thresholds.needsImprovement}{activeData?.unit || "ms"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Common Causes - Only for Lab/Field Metrics */}
        {hasLabFieldStructure && dynamicData?.analysis?.causes && dynamicData.analysis.causes.length > 0 && (
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Common Causes
            </h4>
            <ul className="space-y-1">
              {dynamicData.analysis.causes.map((cause, idx) => (
                <li key={idx} className={`text-xs flex items-start gap-1.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations - Only for Lab/Field Metrics */}
        {hasLabFieldStructure && dynamicData?.analysis?.recommendations && dynamicData.analysis.recommendations.length > 0 && (
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Recommendations
            </h4>
            <ul className="space-y-1">
              {dynamicData.analysis.recommendations.map((rec, idx) => (
                <li key={idx} className={`text-xs flex items-start gap-1.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Insight - Only for Lab/Field Metrics */}
        {hasLabFieldStructure && dynamicData?.analysis?.aiInsight && (
          <div className={`p-3 rounded-lg ${darkMode ? "bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20" : "bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200"}`}>
            <div className="flex gap-2 items-start">
              <span className="text-lg flex-shrink-0">🤖</span>
              <p className={`text-xs leading-relaxed ${darkMode ? "text-purple-200" : "text-slate-700"}`}>
                <span className="font-semibold">AI Insight:</span> {dynamicData.analysis.aiInsight}
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Details - Hidden for CrUX and Lab/Field Metrics */}
        {!details.isCrux && !hasLabFieldStructure && (
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Status Detail
            </h4>
            <p className={`text-sm font-medium ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {activeData?.details || "No details available"}
            </p>
          </div>
        )}

        {/* Technical Data - Hidden for Lab/Field Metrics */}
        {!hasLabFieldStructure && (metaKeys.length > 0 || activeLists.length > 0) && (
          <div className="flex-grow">
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Technical Data
            </h4>
            <div className={`p-2 rounded text-xs font-mono overflow-x-auto ${darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-100 text-gray-700"}`}>

              {/* Layout for Broken Links: Split Meta Keys (left) and Lists (right) */}
              {details.key === 'Broken_Links' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Meta Keys (Counts) */}
                  <div className="space-y-1">
                    {metaKeys.map(k => (
                      <div key={k} className="flex flex-col sm:flex-row sm:gap-2 mb-1 last:mb-0">
                        <span className="font-semibold opacity-70">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="break-all">
                          {typeof meta[k] === 'object' ? JSON.stringify(meta[k]).replace(/"/g, '').replace(/{/g, '').replace(/}/g, '').replace(/,/g, ', ') : String(meta[k])}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Right: Lists (Broken Links) */}
                  <div className="space-y-2">
                    {activeLists.map((list, idx) => (
                      <div key={idx}>
                        <div className="font-semibold opacity-80 mb-1">{list.title} ({list.items.length})</div>
                        <div className="pl-2 border-l-2 border-gray-300 dark:border-gray-700 max-h-32 overflow-y-auto custom-scrollbar">
                          {list.items.map((item, i) => (
                            <div key={i} className="truncate mb-0.5" title={item}>{item}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Default Layout */
                <>
                  {/* Meta Keys */}
                  {metaKeys.map(k => (
                    <div key={k} className="flex flex-col sm:flex-row sm:gap-2 mb-1 last:mb-0">
                      <span className="font-semibold opacity-70">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="break-all">
                        {typeof meta[k] === 'object' ? JSON.stringify(meta[k]).replace(/"/g, '').replace(/{/g, '').replace(/}/g, '').replace(/,/g, ', ') : String(meta[k])}
                      </span>
                    </div>
                  ))}

                  {/* Lists - Grid Layout for Resource Optimization */}
                  {activeLists.length > 0 && (
                    <div className={`mt-2 ${details.key === 'Resource_Optimization' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-2'}`}>
                      {activeLists.map((list, idx) => (
                        <div key={idx} className={details.key !== 'Resource_Optimization' ? "mt-2 first:mt-0" : ""}>
                          <div className="font-semibold opacity-80 mb-1">{list.title} ({list.items.length})</div>
                          <div className="pl-2 border-l-2 border-gray-300 dark:border-gray-700 max-h-24 overflow-y-auto custom-scrollbar">
                            {list.items.map((item, i) => (
                              <div key={i} className="truncate mb-0.5" title={item}>{item}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Educational Content / Suggestion - Hidden for Lab/Field Metrics */}
        {!hasLabFieldStructure && activeData?.suggestion && activeData.suggestion !== "None" && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              <span className="font-semibold">Suggestion:</span> {activeData.suggestion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Metric Info Modal
// ------------------------------------------------------


// ------------------------------------------------------
// ✅ Metric Explanations Data
// ------------------------------------------------------

// ------------------------------------------------------
// ✅ Score Calculation Info (Standard Weights)
// ------------------------------------------------------
// ------------------------------------------------------
// ✅ Score Calculation Info (Standard Weights)
// ------------------------------------------------------
const scoreCalculationInfo = InfoDetails.Technical_Performance_Methodology;

// ------------------------------------------------------
// ✅ Metric Explanations Data
// ------------------------------------------------------
// ------------------------------------------------------
// ✅ Metric Explanations Data
// ------------------------------------------------------
const metricExplanations = InfoDetails;

// ------------------------------------------------------
// ✅ Section Component
// ------------------------------------------------------
const Section = ({ title, subtitle, icon: Icon, children, darkMode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 px-2">
      <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
        <Icon size={20} />
      </div>
      <div>
        <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{title}</h2>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{subtitle}</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

// ------------------------------------------------------
// ✅ Main Component
// ------------------------------------------------------
export default function Technical_Performance() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const [selectedSource, setSelectedSource] = React.useState("lab"); // "lab" or "field"
  const darkMode = theme === "dark";

  const auditSteps = useMemo(() => [
    {
      icon: <Server className="w-8 h-8 text-blue-500" />,
      title: "Server & TTFB",
      text: "Analyzing server response times, DNS lookup speeds, and SSL handshake latency..."
    },
    {
      icon: <Activity className="w-8 h-8 text-purple-500" />,
      title: "Core Web Vitals",
      text: "Measuring Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and Interaction to Next Paint (INP)..."
    },
    {
      icon: <Zap className="w-8 h-8 text-teal-500" />,
      title: "Render Blocking Resources",
      text: "Identifying JavaScript and CSS files that block the main thread and delay page rendering..."
    },
    {
      icon: <FileCode className="w-8 h-8 text-red-500" />,
      title: "Code Minification",
      text: "Checking if CSS, JS, and HTML assets are minified and served with Gzip or Brotli compression..."
    },
    {
      icon: <ImageIcon className="w-8 h-8 text-indigo-500" />,
      title: "Image Optimization",
      text: "Scanning for properly sized images, next-gen formats (WebP/AVIF), and effective lazy loading..."
    },
    {
      icon: <Database className="w-8 h-8 text-amber-500" />,
      title: "Browser Caching",
      text: "Verifying efficient cache policies to speed up repeat visits and reduce server load..."
    },
    {
      icon: <Globe className="w-8 h-8 text-emerald-500" />,
      title: "Third-Party Impact",
      text: "Evaluating the performance cost of external analytics, ads, and tracking scripts..."
    },
  ], []);

  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (loading || !data?.technicalPerformance) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % auditSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);

  const metric = data || {};
  const tech = metric.technicalPerformance || {};
  const overallScore = tech?.Percentage || 0;
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  // Sections Config
  const sections = [
    {
      id: "crux",
      title: "Real User Experience",
      subtitle: "Field data from actual users (CrUX)",
      icon: Globe,
      isCrux: true,
      metrics: [
        { key: 'LCP', title: "Largest Contentful Paint", analogy: "Time until main content is visible.", unit: "ms", icon: Layout },
        { key: 'INP', title: "Interaction to Next Paint", analogy: "Overall responsiveness.", unit: "ms", icon: Activity },
        { key: 'CLS', title: "Cumulative Layout Shift", analogy: "Visual stability of the page.", unit: "", icon: Layout },
        { key: 'FCP', title: "First Contentful Paint", analogy: "First visual response.", unit: "ms", icon: Zap },
        { key: 'TTFB', title: "Time To First Byte", analogy: "Server response speed.", unit: "ms", icon: Server }
      ]
    },
    {
      id: "core-vitals",
      title: "Core Web Vitals",
      subtitle: "Lab data simulation",
      icon: Activity,
      metrics: [
        { key: 'LCP', title: "Largest Contentful Paint", analogy: "Main content load speed.", unit: "ms", icon: Layout },
        { key: 'FID', title: "First Input Delay", analogy: "Input responsiveness.", unit: "ms", icon: MousePointer2 },
        { key: 'INP', title: "Interaction to Next Paint", analogy: "Interaction latency.", unit: "ms", icon: Activity },
        { key: 'CLS', title: "Cumulative Layout Shift", analogy: "Visual stability.", unit: "", icon: Layout },
      ]
    },
    {
      id: "performance",
      title: "Performance",
      subtitle: "Speed & loading metrics",
      icon: Zap,
      metrics: [
        { key: 'FCP', title: "First Contentful Paint", analogy: "First paint time.", unit: "ms", icon: Zap },
        { key: 'TTFB', title: "Time To First Byte", analogy: "Server latency.", unit: "ms", icon: Server },
        { key: 'TBT', title: "Total Blocking Time", analogy: "Main thread blocking time.", unit: "ms", icon: Clock },
        { key: 'SI', title: "Speed Index", analogy: "Visual population speed.", unit: "ms", icon: Gauge }
      ]
    },
    {
      id: "assets",
      title: "Assets & Server",
      subtitle: "Optimization checks",
      icon: Server,
      metrics: [
        { key: 'Compression', title: "Text Compression", analogy: "Gzip/Brotli compression.", unit: "", icon: FileCode, getValue: (m) => m.meta.value === 100 ? "Enabled" : `${m.meta.value}%` },
        { key: 'Caching', title: "Caching Policy", analogy: "Browser caching settings.", unit: "%", icon: Database, getValue: (m) => `${m.meta.value}` },
        { key: 'Render_Blocking', title: "Render-Blocking", analogy: "Critical path blocking.", unit: "", icon: AlertTriangle, getValue: (m) => m.meta.value === 0 ? "None" : `${m.meta.value} items` },
        { key: 'HTTP', title: "HTTPS / HTTP2", analogy: "Secure transport protocols.", unit: "", icon: Shield, getValue: (m) => m.score === 100 ? "Secure" : "Insecure" },
        { key: 'Resource_Optimization', title: "Resource Optimization", analogy: "Image & code minification.", unit: "", icon: ImageIcon, getValue: (m) => m.score >= 80 ? "Optimized" : "Needs Work", className: "md:col-span-2" },
      ]
    },
    {
      id: "seo",
      title: "SEO & Crawlability",
      subtitle: "Search engine visibility",
      icon: Search,
      metrics: [
        { key: 'Sitemap', title: "Sitemap", analogy: "XML Sitemap presence.", unit: "", icon: Map, getValue: (m) => m.meta.exists ? "Found" : "Missing" },
        { key: 'Robots', title: "Robots.txt", analogy: "Crawling instructions.", unit: "", icon: FileText, getValue: (m) => m.meta.exists ? "Found" : "Missing" },
        { key: 'Structured_Data', title: "Structured Data", analogy: "Schema markup.", unit: "", icon: FileCode, getValue: (m) => m.meta.hasStructuredData ? "Found" : "Missing" },
        { key: 'Broken_Links', title: "Broken Links", analogy: "Dead internal links.", unit: "%", icon: Link, getValue: (m) => m.meta.brokenPercent, className: "md:col-span-2" },
        { key: 'Redirect_Chains', title: "Redirect Chains", analogy: "Multiple redirects.", unit: " hops", icon: ArrowRightLeft, getValue: (m) => m.meta.value }
      ]
    }
  ];

  // Calculate Passed/Failed based on lab data only
  const allMetrics = [];
  const allowedMetrics = ["LCP", "TBT", "INP", "FCP", "SI", "TTFB", "CLS"];

  sections.forEach((s) => {
    if (s.isCrux && !tech.Real_User_Experience) return;
    const source = s.isCrux ? tech.Real_User_Experience : tech;
    if (!source) return;

    s.metrics.forEach((m) => {
      if (allowedMetrics.includes(m.key) && source[m.key]) {
        const metricData = source[m.key];

        // Check if metric has lab/field structure
        const hasLabFieldStructure = metricData?.lab || metricData?.field;

        if (hasLabFieldStructure) {
          // Always use lab data for passed/failed count
          const labData = metricData.lab;

          if (labData?.score !== undefined) {
            allMetrics.push(labData);
          }
        } else {
          // Legacy metric structure
          if (metricData?.score !== undefined) {
            allMetrics.push(metricData);
          }
        }
      }
    });
  });

  const passedCount = allMetrics.filter((m) => m.score >= 90).length;
  const failedCount = allMetrics.filter((m) => m.score < 90).length;

  return (
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>

        {/* ✅ Unified Master Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

          {/* 1. URL Header */}
          <div>
            <UrlHeader data={data} darkMode={darkMode} />
          </div>

          {/* 2. Card Body */}
          {loading || !data?.technicalPerformance ? (
            <div className="flex flex-col xl:flex-row min-h-[300px]">
              {/* Left Panel: Live Preview (Only if not All) */}
              {data.report !== "All" && (
                <div className={`w-full xl:w-1/2 p-6 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10 px-2 lg:px-6">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              {/* Right/Full Panel: Audit Steps */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full">
                  <TechShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
                </div>
              </div>
            </div>
          ) : (
            <div className={`flex flex-col xl:flex-row ${data.report === "All" ? "" : "min-h-[300px]"}`}>

              {/* Left Panel: Live Preview (Only if not All) */}
              {data.report !== "All" && (
                <div className={`w-full xl:w-[45%] ${data.report === "All" ? "p-6 lg:p-10" : "p-3 lg:p-4"} flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              {/* Right Panel: Metrics & Score */}
              <div className={`flex-1 ${data.report === "All" ? "px-6 pb-4 pt-2 lg:px-10 lg:pt-2" : "px-6 pb-4 pt-4 lg:px-12 lg:pt-6"} flex flex-col justify-center`}>
                <div className={`w-full ${data.report === "All" ? "" : "max-w-2xl mx-auto"} ${data.report === "All" ? "space-y-10" : "space-y-8"}`}>

                  {/* Top Content Area */}
                  <div className={`flex flex-col md:flex-row items-center ${data.report === "All" ? "gap-10 md:gap-14 justify-between" : "gap-8 md:gap-12 justify-center"}`}>

                    {/* Text Content */}
                    <div className={`flex-1 ${data.report === "All" ? "space-y-5" : "space-y-4"} text-left order-2 md:order-1`}>
                      <div className={`${data.report === "All" ? "space-y-2" : "space-y-1.5"}`}>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-100/50 text-blue-600 border border-blue-200"}`}>
                          <Activity className="w-3.5 h-3.5" />
                          <span>Performance Audit</span>
                        </div>
                        <h3 className={`${data.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                          Technical <span className="text-blue-500">Performance</span>
                        </h3>
                        <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                          Core vitals and speed configurations analysis.
                        </p>
                      </div>

                      {/* Stats & Tools */}
                      <div className={`flex flex-wrap items-center ${data.report === "All" ? "gap-6" : "gap-5"}`}>
                        <div className={`flex items-center ${data.report === "All" ? "gap-5" : "gap-4"}`}>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-emerald-500" />
                            <span className="text-sm font-bold">{passedCount} Passed</span>
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


                      {/* Data Source Toggle */}
                      <div className={`flex flex-wrap items-center ${data.report === "All" ? "gap-6 justify-start" : "gap-4 justify-start"}`}>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">Data Source</span>

                        <div className={`flex p-1 ${data.report === "All" ? "rounded-2xl" : "rounded-xl"} border ${darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-100/50 border-slate-200"}`}>
                          <button
                            onClick={() => setSelectedSource("lab")}
                            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all duration-300 ${selectedSource === "lab"
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                              : `hover:bg-slate-400/10 ${darkMode ? "text-slate-400" : "text-slate-600"}`
                              }`}
                          >
                            <Zap size={16} className={selectedSource === "lab" ? "text-white" : "text-blue-500"} />
                            <span className="text-sm font-bold">Lab Data</span>
                            {selectedSource === "lab" && <CheckCircle className="w-4 h-4 ml-1" />}
                          </button>

                          <button
                            onClick={() => setSelectedSource("field")}
                            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all duration-300 ${selectedSource === "field"
                              ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                              : `hover:bg-slate-400/10 ${darkMode ? "text-slate-400" : "text-slate-600"}`
                              }`}
                          >
                            <TrendingUp size={16} className={selectedSource === "field" ? "text-white" : "text-purple-500"} />
                            <span className="text-sm font-bold">Real User Data</span>
                            {selectedSource === "field" && <CheckCircle className="w-4 h-4 ml-1" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Circular Progress */}
                    <div className="relative flex-shrink-0 group cursor-default order-1 md:order-2">
                      <div className={`absolute -inset-8 rounded-full blur-3xl opacity-25 transition-opacity duration-700 group-hover:opacity-40 ${overallScore >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                      <CircularProgress value={overallScore} size={data.report === "All" ? 180 : 150} stroke={14} />
                      <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                        <span className={`${data.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{overallScore}%</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                      </div>
                    </div>
                  </div>



                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sections */}
        {
          data?.technicalPerformance && sections.map((section) => {
            if (section.isCrux && !tech.Real_User_Experience) return null;
            return (
              <Section key={section.id} title={section.title} subtitle={section.subtitle} icon={section.icon} darkMode={darkMode}>
                {section.metrics.map((m) => {
                  const dataSource = section.isCrux ? tech.Real_User_Experience : tech;
                  const dynamicData = dataSource[m.key];

                  let displayValue = dynamicData?.meta?.value;
                  if (m.getValue) {
                    displayValue = m.getValue(dynamicData);
                  } else if (section.isCrux) {
                    displayValue = dynamicData?.value;
                  }

                  return (
                    <MetricCard
                      key={m.key}
                      details={{
                        ...m,
                        isCrux: section.isCrux,
                        onInfo: () => setSelectedParameterInfo({
                          title: m.title,
                          icon: m.icon,
                          ...metricExplanations[m.key],
                          metricData: dynamicData // Pass full metric data for modal
                        })
                      }}
                      dynamicData={dynamicData}
                      value={displayValue}
                      darkMode={darkMode}
                      icon={m.icon}
                      className={m.className}
                      selectedSource={selectedSource}
                      metricKey={m.key}
                    />
                  );
                })}
              </Section>
            );
          })
        }

      </main >

      {/* Methodology Modal */}
      <MetricInfoModal
        isOpen={!!selectedMetricInfo}
        onClose={() => setSelectedMetricInfo(null)}
        info={selectedMetricInfo}
        darkMode={darkMode}
      />
      {/* Parameter Modal */}
      <ParameterInfoModal
        isOpen={!!selectedParameterInfo}
        onClose={() => setSelectedParameterInfo(null)}
        info={selectedParameterInfo}
        darkMode={darkMode}
      />
    </div>
  );
}