import React, { useContext } from "react";
import UrlHeader from "../Component/UrlHeader";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import {
  Activity, Zap, Layout, MousePointer2, Image as ImageIcon,
  Server, Database, FileCode, Globe, Shield, Link, Map,
  FileText, Search, ArrowRightLeft, Clock, Gauge, AlertTriangle,
  CheckCircle, XCircle
} from "lucide-react";

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

const TechShimmer = ({ darkMode }) => (
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
              <ShimmerBlock className="h-8 w-12" />
            </div>
            <div className="space-y-2">
              <ShimmerBlock className="h-4 w-full" />
              <ShimmerBlock className="h-4 w-5/6" />
            </div>
            <ShimmerBlock className="h-8 w-full rounded-lg mt-auto" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ------------------------------------------------------
// ✅ Metric Card (Security Style)
// ------------------------------------------------------
const MetricCard = ({ details, value, dynamicData, darkMode, icon: Icon, className }) => {
  // Determine Status
  let status = "pass";
  if (dynamicData?.status) {
    status = dynamicData.status;
  } else if (details.isCrux) {
    if (dynamicData?.category === "SLOW") status = "fail";
    else if (dynamicData?.category === "AVERAGE") status = "warning";
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

  const meta = dynamicData?.meta || {};
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
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit border ${statusColor}`}>
                  {statusText}
                </span>
                {details.isCrux && <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">CrUX</span>}
              </div>
            </div>
          </div>
          <div className={`text-lg font-black ${isPassed ? "text-green-500" : isWarning ? "text-yellow-500" : "text-red-500"}`}>
            {value !== null && value !== undefined ? `${value}${details.unit || ""}` : "--"}
          </div>
        </div>

        {/* Dynamic Details - Hidden for CrUX */}
        {!details.isCrux && (
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Status Detail
            </h4>
            <p className={`text-sm font-medium ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {dynamicData?.details || "No details available"}
            </p>
          </div>
        )}

        {/* Technical Data */}
        {(metaKeys.length > 0 || activeLists.length > 0) && (
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

        {/* Educational Content */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <p className={`text-sm ${subTextColor}`}>
            {details.analogy}
          </p>
          <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            <span className="font-semibold">Suggestion:</span> {dynamicData?.suggestion || "None"}
          </p>
        </div>
      </div>
    </div>
  );
};

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
  const darkMode = theme === "dark";

  if (!data?.Technical_Performance) {
    return (
      <div className={`min-h-screen w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          <UrlHeader darkMode={darkMode} />
          <TechShimmer darkMode={darkMode} />
        </main>
      </div>
    );
  }

  const metric = data;
  const tech = metric.Technical_Performance;
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

  // Calculate Passed/Failed
  const allMetrics = [];
  sections.forEach(s => {
    if (s.isCrux && !tech.Real_User_Experience) return;
    const source = s.isCrux ? tech.Real_User_Experience : tech;
    s.metrics.forEach(m => {
      if (source[m.key]) allMetrics.push(source[m.key]);
    });
  });

  const passedCount = allMetrics.filter(m => m.score >= 90).length;
  const failedCount = allMetrics.filter(m => m.score < 90).length;

  return (
    <div className={`min-h-screen w-full ${mainBg} transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        <UrlHeader darkMode={darkMode} />

        {/* Header Section */}
        <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl ${darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium border border-blue-500/20">
                <Zap size={14} />
                <span>Performance Audit</span>
              </div>
              <h1 className={`text-4xl sm:text-5xl font-black tracking-tight ${textColor}`}>
                Technical <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">Performance</span>
              </h1>
              <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Comprehensive analysis of speed, stability, and server configurations.
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

        {/* Sections */}
        {sections.map((section) => {
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
                    details={{ ...m, isCrux: section.isCrux }}
                    dynamicData={dynamicData}
                    value={displayValue}
                    darkMode={darkMode}
                    icon={m.icon}
                    className={m.className}
                  />
                );
              })}
            </Section>
          );
        })}

      </main>
    </div>
  );
}