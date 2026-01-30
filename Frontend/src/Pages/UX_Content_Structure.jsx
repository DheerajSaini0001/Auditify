import React, { useContext, useMemo } from "react";
import UrlHeader from "../Component/UrlHeader";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  Layout, Type, Smartphone, MoveHorizontal, PanelTop, Menu,
  ChevronRight, Compass, Touchpad, BookOpen, Layers, Image as ImageIcon,
  XOctagon, MonitorPlay, MousePointer2, CheckCircle2, Loader2,
  ExternalLink, CheckCircle, XCircle, Info
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import { InfoDetails } from "../Component/InfoDetails";

// ------------------------------------------------------
// ✅ Icon Mapping
// ------------------------------------------------------
const iconMap = {
  Viewport_Meta_Tag: Smartphone,
  Horizontal_Scroll: MoveHorizontal,
  Sticky_Header_Height: PanelTop,
  Navigation_Depth: Menu,
  Breadcrumbs: ChevronRight,
  Navigation_Discoverability: Compass,
  Tap_Target_Size: Touchpad,
  Text_Readability: BookOpen,
  Text_Font_Size: Type,
  Cumulative_Layout_Shift: Layers,
  Image_Stability: ImageIcon,
  Intrusive_Interstitials: XOctagon,
  Above_The_Fold_Content: MonitorPlay,
  Click_Feedback: MousePointer2,
  Form_Validation: CheckCircle2,
  Loading_Feedback: Loader2
};

const uxEducationalContent = InfoDetails;

// ------------------------------------------------------
// ✅ Score Calculation Info (Calculated based on average importance)
// ------------------------------------------------------
const scoreCalculationInfo = InfoDetails.UX_And_Content_Methodology;

// ------------------------------------------------------
// ✅ Enhanced Shimmer
// ------------------------------------------------------
const ShimmerBlock = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
  </div>
);

const UxShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
  const step = steps[currentStep] || steps[0];

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 animate-in fade-in zoom-in duration-500 min-h-[350px]">
      <div className={`w-full max-w-xl rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-500 ${darkMode ? "bg-slate-800/40 border border-slate-700/50" : "bg-slate-100/60 border border-slate-200/50"}`}>
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
        <h2 className={`mt-6 text-2xl font-bold tracking-tight transition-all duration-500 ${darkMode ? "text-white" : "text-slate-900"}`}>
          {step.title}
        </h2>

        {/* Description */}
        <p className={`mt-4 text-base leading-relaxed max-w-sm mx-auto transition-all duration-500 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
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
              className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? "w-6 bg-blue-500" : i < currentStep ? "w-6 bg-blue-500/40" : "w-2 bg-slate-400/30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Metric Card Component
// ------------------------------------------------------
const MetricCard = ({ title, description, score, status, meta, darkMode, icon: Icon, type, className, onInfo }) => {
  const isPassed = status === 'pass' || score === 100;
  const isWarning = status === 'warning' || score === 50;

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

  const hasDetails = meta && (
    (Array.isArray(meta.failedNodes) && meta.failedNodes.length > 0) ||
    (Array.isArray(meta.problematicContent) && meta.problematicContent.length > 0) ||
    (Array.isArray(meta.smallTargets) && meta.smallTargets.length > 0) ||
    (Array.isArray(meta.smallFonts) && meta.smallFonts.length > 0) ||
    (Array.isArray(meta.unstableImages) && meta.unstableImages.length > 0) ||
    (Array.isArray(meta.deepLinks) && meta.deepLinks.length > 0) ||
    (typeof meta === 'object' && Object.keys(meta).length > 0)
  );

  const renderDetails = () => {
    if (type === 'Text_Readability' && meta?.overallStats) {
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className={`p-2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <div className="text-[10px] uppercase opacity-60">Score</div>
              <div className="font-bold">{meta.overallStats.score?.toFixed(1)}</div>
            </div>
            <div className={`p-2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <div className="text-[10px] uppercase opacity-60">Words/Sent</div>
              <div className="font-bold">{meta.overallStats.ASL?.toFixed(1)}</div>
            </div>
            <div className={`p-2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <div className="text-[10px] uppercase opacity-60">Syll/Word</div>
              <div className="font-bold">{meta.overallStats.ASW?.toFixed(2)}</div>
            </div>
          </div>
          {/* Grid layout for problematic content if card is wide */}
          <div className={className?.includes('col-span') ? "grid grid-cols-1 md:grid-cols-2 gap-2" : "space-y-2"}>
            {meta.problematicContent?.map((item, i) => (
              <div key={i} className="text-xs border-l-2 border-red-500 pl-2 mt-2">
                <div className="font-bold text-red-500">{item.reason}</div>
                <div className="italic opacity-70">"{item.text}"</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Generic List Renderer for various issues
    const listItems =
      meta?.smallTargets ||
      meta?.smallFonts ||
      meta?.unstableImages ||
      meta?.deepLinks ||
      meta?.failedNodes;

    if (Array.isArray(listItems) && listItems.length > 0) {
      return (
        <div className={`max-h-64 overflow-y-auto custom-scrollbar ${className?.includes('col-span') ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-2"}`}>
          {listItems.map((item, i) => (
            <div key={i} className="text-xs border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0 break-words">
              {item.tag && <span className="font-mono font-bold opacity-70 mr-2">{item.tag}</span>}
              {item.text && <span className="italic">"{item.text}"</span>}
              {item.src && <div className="truncate opacity-60">{item.src}</div>}
              {item.href && <div className="truncate opacity-60">{item.href}</div>}
              {item.width && item.height && <span className="ml-2 opacity-60">({Math.round(item.width)}x{Math.round(item.height)})</span>}
              {item.size && <span className="ml-2 opacity-60">({item.size})</span>}
              {item.depth && <span className="ml-2 font-bold">Depth: {item.depth}</span>}
            </div>
          ))}
        </div>
      );
    }

    // Generic Object Renderer
    if (typeof meta === 'object') {
      return (
        <div className="space-y-1">
          {Object.entries(meta).map(([k, v]) => {
            if (typeof v === 'object' || Array.isArray(v)) return null;
            return (
              <div key={k} className="flex justify-between text-xs">
                <span className="opacity-70">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="font-mono">{String(v)}</span>
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border ${cardBg} shadow-sm hover:shadow-md transition-shadow group ${className || ""}`}>
      <div className="p-5 space-y-4 h-full flex flex-col">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
              <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full w-fit border ${statusColor}`}>
                {statusText}
              </p>
            </div>
          </div>
          {onInfo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInfo();
              }}
              className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
              title="Learn more"
            >
              <Info size={18} />
            </button>
          )}
        </div>

        {/* Dynamic Details */}
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            Status Detail
          </h4>
          <p className={`text-sm font-medium ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {description || "No details available"}
          </p>
        </div>

        {/* Technical Data / Diagnostics - Inline Scrollable */}
        {hasDetails && (
          <div className="flex-grow">
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Technical Data
            </h4>
            <div className={`p-2 rounded text-xs overflow-x-auto border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
              {renderDetails()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Simple Section
// ------------------------------------------------------
const Section = ({ title, icon: Icon, children, darkMode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 px-2">
      <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
        <Icon size={20} />
      </div>
      <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
        {title}
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

// ------------------------------------------------------
// ✅ Main Component
// ------------------------------------------------------
export default function UX_Content_Structure() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const darkMode = theme === "dark";

  const auditSteps = useMemo(() => [
    { icon: <BookOpen className="w-8 h-8 text-blue-500" />, title: "Content Readability", text: "Analyzing sentence length, word complexity, and font sizing for optimal reading..." },
    { icon: <Touchpad className="w-8 h-8 text-purple-500" />, title: "Tap Targets", text: "Verifying button sizes and spacing to ensure touch-friendliness on mobile devices..." },
    { icon: <Layers className="w-8 h-8 text-teal-500" />, title: "Visual Stability", text: "Measuring Cumulative Layout Shift (CLS) and image dimensions..." },
    { icon: <Smartphone className="w-8 h-8 text-indigo-500" />, title: "Mobile Responsiveness", text: "Checking Viewport meta tags and horizontal scrolling issues..." },
    { icon: <Menu className="w-8 h-8 text-amber-500" />, title: "Navigation Structure", text: "Evaluating menu depth and breadcrumb reliability for easy user flow..." },
  ], []);

  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (loading || !data?.UXOrContentStructure) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % auditSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);

  if (!data?.UXOrContentStructure) {
    return (
      <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>
          {/* ✅ Unified Master Card Loading State */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

            {/* 1. URL Header */}
            <div>
              <UrlHeader data={data} darkMode={darkMode} />
            </div>

            <div className="flex flex-col xl:flex-row min-h-[300px]">
              {/* Left Panel: Live Preview (Only if not All) */}
              {data.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              {/* Right/Full Panel: Audit Steps */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full">
                  <UxShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const results = data.UXOrContentStructure;
  const overallScore = results.Percentage || 0;
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  const metrics = Object.keys(results).filter(k => typeof results[k] === 'object' && results[k]?.Score !== undefined);
  const passedCount = metrics.filter(k => results[k].Score === 100).length;
  const failedCount = metrics.filter(k => results[k].Score < 100).length;

  // Define column spans for metrics with potentially large content
  const spanMap = {
    Text_Readability: "md:col-span-2 lg:col-span-3",
    Tap_Target_Size: "md:col-span-2",
    Text_Font_Size: "md:col-span-2",
    Image_Stability: "md:col-span-2",
    Navigation_Depth: "md:col-span-2",
    Navigation_Discoverability: "md:col-span-2",
  };

  const detailedKeys = [
    "Text_Readability",
    "Tap_Target_Size",
    "Text_Font_Size",
    "Image_Stability",
    "Navigation_Depth",
    "Navigation_Discoverability"
  ];

  const quickMetrics = metrics.filter(k => !detailedKeys.includes(k));
  const detailedMetrics = metrics.filter(k => detailedKeys.includes(k));

  return (
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>

        {/* ✅ Unified Master Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

          {/* 1. URL Header */}
          <div>
            <UrlHeader data={data} darkMode={darkMode} />
          </div>

          {/* 2. Card Body */}
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
                        <Layout className="w-3.5 h-3.5" />
                        <span>UX Audit</span>
                      </div>
                      <h3 className={`${data.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                        UX & <span className="text-blue-500">Content</span>
                      </h3>
                      <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        Detailed performance breakdown of user experience and content organization.
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
        </div>

        {/* Quick Checks Section */}
        {quickMetrics.length > 0 && (
          <Section title="Quick Checks" icon={CheckCircle2} darkMode={darkMode}>
            {quickMetrics.map((key) => (
              <MetricCard
                key={key}
                type={key}
                title={key.replaceAll("_", " ")}
                description={results[key]?.Details}
                score={results[key]?.Score}
                status={results[key]?.Status}
                meta={results[key]?.Meta}
                darkMode={darkMode}
                icon={iconMap[key] || Layout}
                className={spanMap[key]}
                onInfo={() => setSelectedParameterInfo({ ...uxEducationalContent[key], icon: iconMap[key] || Layout })}
              />
            ))}
          </Section>
        )}

        {/* Detailed Analysis Section */}
        {detailedMetrics.length > 0 && (
          <Section title="Detailed Analysis" icon={Layout} darkMode={darkMode}>
            {detailedMetrics.map((key) => (
              <MetricCard
                key={key}
                type={key}
                title={key.replaceAll("_", " ")}
                description={results[key]?.Details}
                score={results[key]?.Score}
                status={results[key]?.Status}
                meta={results[key]?.Meta}
                darkMode={darkMode}
                icon={iconMap[key] || Layout}
                className="md:col-span-2 lg:col-span-3"
                onInfo={() => setSelectedParameterInfo({ ...uxEducationalContent[key], icon: iconMap[key] || Layout })}
              />
            ))}
          </Section>
        )}

      </main>
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