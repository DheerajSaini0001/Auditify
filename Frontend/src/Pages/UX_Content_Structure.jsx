import React, { useContext } from "react";
import UrlHeader from "../Component/UrlHeader";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import {
  Layout, Type, Smartphone, MoveHorizontal, PanelTop, Menu,
  ChevronRight, Compass, Touchpad, BookOpen, Layers, Image as ImageIcon,
  XOctagon, MonitorPlay, MousePointer2, CheckCircle2, Loader2,
  ExternalLink, CheckCircle, XCircle
} from "lucide-react";

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

// ------------------------------------------------------
// ✅ Enhanced Shimmer
// ------------------------------------------------------
const ShimmerBlock = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
  </div>
);

const UxShimmer = ({ darkMode }) => (
  <div className="space-y-12 animate-in fade-in zoom-in duration-300">
    {/* Header Shimmer */}
    <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-lg ${darkMode ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-200"}`}>
      <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
        <div className="space-y-6 w-full max-w-2xl">
          <ShimmerBlock className="h-8 w-32 rounded-full" />
          <ShimmerBlock className="h-14 w-3/4" />
          <ShimmerBlock className="h-6 w-1/2" />
          <div className="flex gap-4 pt-2">
            <ShimmerBlock className="h-10 w-32 rounded-lg" />
            <ShimmerBlock className="h-10 w-32 rounded-lg" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <ShimmerBlock className="h-40 w-40 rounded-full" />
          <ShimmerBlock className="h-5 w-24" />
        </div>
      </div>
    </div>

    {/* Metric Cards Shimmer */}
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-4 px-2">
        <ShimmerBlock className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <ShimmerBlock className="h-7 w-48" />
          <ShimmerBlock className="h-4 w-32" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`h-56 rounded-xl border p-6 space-y-6 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <ShimmerBlock className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <ShimmerBlock className="h-5 w-32" />
                  <ShimmerBlock className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <ShimmerBlock className="h-4 w-full" />
              <ShimmerBlock className="h-4 w-5/6" />
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
              <ShimmerBlock className="h-4 w-3/4" />
              <ShimmerBlock className="h-3 w-1/2 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ------------------------------------------------------
// ✅ Metric Card Component
// ------------------------------------------------------
const MetricCard = ({ title, description, score, meta, darkMode, icon: Icon, type, className }) => {
  const isPassed = score === 100;
  const isWarning = score === 50;

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
  const darkMode = theme === "dark";

  if (!data?.UX_or_Content_Structure) {
    return (
      <div className={`min-h-screen w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          <UrlHeader darkMode={darkMode} />
          <UxShimmer darkMode={darkMode} />
        </main>
      </div>
    );
  }

  const results = data.UX_or_Content_Structure;
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
    <div className={`min-h-screen w-full ${mainBg} transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        <UrlHeader darkMode={darkMode} />

        {/* Header Section */}
        <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl ${darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium border border-blue-500/20">
                <Layout size={14} />
                <span>UX Audit</span>
              </div>
              <h1 className={`text-4xl sm:text-5xl font-black tracking-tight ${textColor}`}>
                UX & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">Content</span>
              </h1>
              <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Detailed performance breakdown of user experience and content organization.
              </p>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span>{passedCount} Passed</span>
                </div>
                <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  <XCircle size={16} className="text-rose-500" />
                  <span>{failedCount} Failed</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <CircularProgress value={overallScore} size={140} stroke={12} />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-3xl font-bold ${textColor}`}>{overallScore}</span>
                  <span className={`text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Score</span>
                </div>
              </div>
              <div className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Time Taken: {data.Time_Taken}
              </div>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
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
                meta={results[key]?.Meta}
                darkMode={darkMode}
                icon={iconMap[key] || Layout}
                className={spanMap[key]}
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
                meta={results[key]?.Meta}
                darkMode={darkMode}
                icon={iconMap[key] || Layout}
                className="md:col-span-2 lg:col-span-3"
              />
            ))}
          </Section>
        )}

      </main>
    </div>
  );
}