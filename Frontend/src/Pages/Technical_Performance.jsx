import React, { useContext, useState } from "react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import Sidebar from "../Component/Sidebar";
import UrlHeader from "../Component/UrlHeader"; // This import wasn't used, but I kept it

// -----------------------------------------------------------------
// ✅ NEW & IMPROVED SKELETON LOADING COMPONENTS
// -----------------------------------------------------------------
const SkeletonSidebar = ({ darkMode }) => (
  <div
    className={`fixed top-0 mt-16 left-0 h-full w-64 ${
      darkMode ? "bg-gray-900" : "bg-white"
    } shadow-lg p-6`}
  >
    <div className={`h-7 rounded mb-5 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
    <div className={`h-7 rounded mb-5 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
    <div className={`h-7 rounded mb-5 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
    <div className={`h-7 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
  </div>
);

const SkeletonMetricCard = ({ darkMode }) => {
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const shimmerCardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-gray-50 to-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <div className={`p-6 rounded-xl shadow-lg ${shimmerCardBg} border ${border}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`h-5 w-1/3 rounded ${shimmerBg}`}></div>
        <div className={`h-6 w-16 rounded-full ${shimmerBg}`}></div>
      </div>
      <div className={`h-10 w-1/2 rounded ${shimmerBg} mb-4`}></div>
      <div className={`h-10 w-full rounded-lg ${shimmerBg} mt-2`}></div>
    </div>
  );
};

const SkeletonHeaderCard = ({ darkMode }) => {
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const data=useData()
  const shimmerCardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <div className={`w-full ${data.Report=="All" ? "max-w-4xl" : "max-w-6xl"}  p-8 rounded-2xl shadow-2xl ${shimmerCardBg} border-l-8 ${border} border-l-gray-500`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className={`h-12 w-80 rounded ${shimmerBg} mb-3`}></div>
          <div className={`h-4 w-64 rounded ${shimmerBg}`}></div>
        </div>
        <div className={`h-20 w-20 rounded-full ${shimmerBg}`}></div>
      </div>
      <div className={`h-8 w-1/3 rounded-full ${shimmerBg}`}></div>
    </div>
  );
};

const SkeletonSectionCard = ({ metricCount, darkMode }) => {
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const data=useData()
  const shimmerCardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";
  
  return (
    <div className={`w-full ${data.Report=="All" ? "max-w-4xl" : "max-w-6xl"} p-8 rounded-2xl shadow-2xl ${shimmerCardBg} border-l-8 ${border} border-l-gray-500`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`h-8 w-8 rounded ${shimmerBg}`}></div>
        <div className={`h-7 w-1/2 rounded ${shimmerBg}`}></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: metricCount }).map((_, index) => (
          <SkeletonMetricCard key={index} darkMode={darkMode} />
        ))}
      </div>
    </div>
  );
};

const SkeletonAuditDropdown = ({ darkMode }) => {
  const shimmerCardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  const data=useData()
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <div className={`w-full ${data.Report=="All" ? "max-w-4xl" : "max-w-6xl"} p-5 rounded-lg shadow-xl ${shimmerCardBg} border ${border}`}>
      <div className={`h-6 w-1/3 rounded ${shimmerBg}`}></div>
    </div>
  );
};

/**
 * ✅ This is the main shimmer component that mimics the final page layout.
 */
function TechnicalPerformanceShimmer({ darkMode }) {
  const mainBg = darkMode 
  const data=useData()
    ? "bg-gray-900" 
    : "bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50";

  return (
    <div className={`relative flex w-full h-full min-h-screen ${mainBg} animate-pulse`}>
     {data.Report=="All" && <SkeletonSidebar darkMode={darkMode} />}
      <main className={`flex-1 ${data.Report=="All" ? "lg:ml-64" : ""} flex flex-col items-center pt-20 pb-12 px-4 space-y-8`}>
        {/* Skeleton for Header Card */}
        <SkeletonHeaderCard darkMode={darkMode} />
        
        {/* Skeleton for "Core & Interaction Vitals" */}
        <SkeletonSectionCard metricCount={4} darkMode={darkMode} />
        
        {/* Skeleton for "Performance Metrics" */}
        <SkeletonSectionCard metricCount={4} darkMode={darkMode} />
        
        {/* Skeleton for "Asset & Server" */}
        <SkeletonSectionCard metricCount={5} darkMode={darkMode} />
        
        {/* Skeleton for "Crawlability & Indexing" */}
        <SkeletonSectionCard metricCount={5} darkMode={darkMode} />
        
        {/* Skeleton for Dropdowns */}
        <SkeletonAuditDropdown darkMode={darkMode} />
        <SkeletonAuditDropdown darkMode={darkMode} />
        <SkeletonAuditDropdown darkMode={darkMode} />
      </main>
    </div>
  );
}

// -----------------------------------------------------------------
// ✅ ENHANCED METRIC CARD WITH ANIMATIONS & ICONS
// -----------------------------------------------------------------
const MetricCard = ({ title, description, score, value, unit, darkMode, icon }) => {
  const [showDescription, setShowDescription] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isPassed = Boolean(score);

  const titleColor = darkMode ? "text-white" : "text-gray-900";
  const descriptionColor = darkMode ? "text-gray-300" : "text-gray-600";
  const valueColor = isPassed
    ? "text-green-500 dark:text-green-400"
    : "text-red-500 dark:text-red-400";
  const cardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-gray-50 to-white";

  const statusText = isPassed ? "Good" : "Needs Work";
  const statusColor = isPassed
    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
    : "bg-gradient-to-r from-red-500 to-rose-600 text-white";

  return (
    <div 
      className={`group relative p-6 rounded-xl shadow-lg ${cardBg} 
        border ${darkMode ? "border-gray-700" : "border-gray-200"}
        transition-all duration-300  
        `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect on hover */}
      <div className={`absolute inset-0 rounded-xl opacity-0   
        ${isPassed 
          ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10' 
          : 'bg-gradient-to-br from-red-500/10 to-rose-500/10'}`}
      ></div>
      
      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <h3 className={`text-lg font-bold ${titleColor} leading-tight`}>{title}</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${statusColor}
            `}>
            {statusText}
          </span>
        </div>

        {/* Value with animation */}
        <div className={`text-3xl font-extrabold mb-4 ${valueColor} 
          transition-all duration-300 `}>
          {value !== null && value !== undefined ? `${value}${unit || ""}` : "--"}
        </div>

        {/* Description toggle button */}
        <button
          onClick={() => setShowDescription(!showDescription)}
          className={`w-full mt-2 px-4 py-2.5 text-sm font-semibold rounded-lg
            transition-all duration-300 transform active:scale-95
            ${darkMode
              ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg hover:shadow-indigo-500/50"
              : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-lg hover:shadow-blue-500/50"
            }`}
        >
          <span className="flex items-center justify-center gap-2">
            {showDescription ? "Hide Details" : "Show Details"}
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${showDescription ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {/* Description with slide animation */}
        <div className={`overflow-hidden transition-all duration-300 ${showDescription ? 'max-h-96 mt-4' : 'max-h-0'}`}>
          <p className={`text-sm ${descriptionColor} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------
// ✅ MAIN COMPONENT
// -----------------------------------------------------------------
export default function Technical_Performance() {
  const { data, loading } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const metric = data;

  // -----------------------------------------------------------------
  // ⭐ BUG FIX: Added "!metric" check.
  // This prevents a crash on the first load when `loading` is true
  // but `metric` is still `null` from the context's initial state.
  // Your code `metric.Status` would crash.
  // -----------------------------------------------------------------
  if (loading || !metric || metric.Status === "inprogress") {
    return <TechnicalPerformanceShimmer darkMode={darkMode} />;
  }

  const textColor = darkMode ? "text-white" : "text-gray-900";
  const mainCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";

  const desc = {
    LCP: `Largest Contentful Paint (Good if < 2.5s). Measures how long it takes for the largest visible element to load.`,
    FID: `First Input Delay (Good if < 100ms). Measures input responsiveness.`,
    CLS: `Cumulative Layout Shift (Good if < 0.1). Indicates layout stability.`,
    FCP: `First Contentful Paint (Good if < 1.8s). Measures how quickly page content is visible.`,
    TTFB: `Time To First Byte (Good if < 0.2s). Server response time.`,
    TBT: `Total Blocking Time (Good if < 300ms). Measures main thread blockage.`,
    SI: `Speed Index (Good if < 3.4s). Measures visual loading speed.`,
    INP: `Interaction to Next Paint (Good if < 200ms). Overall responsiveness.`,
    Compression: `Text-based resources like HTML, CSS, and JavaScript should be served with compression (e.g., GZIP or Brotli). This reduces file transfer sizes, improves loading times, and enhances overall performance.`,
    Caching: `Caching is considered effective when static resources (e.g., images, CSS, JS) have a cache lifetime (TTL) greater than 7 days. Proper caching minimizes server load, speeds up repeat visits, and improves user experience.`,
    Resource_Optimization: `Unoptimized assets (such as large images, unused CSS, or unminified JavaScript) increase load time. Optimize all resources by compressing images, removing unused code, and minimizing files for better performance.`,
    Render_Blocking: `Render-blocking resources delay the first paint of your webpage. To improve performance, defer or async non-critical JavaScript and inline critical CSS to allow faster rendering of above-the-fold content.`,
    HTTP: `Using HTTPS encrypts data between the browser and the server, ensuring security, privacy, and user trust. It also improves SEO rankings and is a must for modern web applications.`,
    Sitemap: `A sitemap.xml helps search engines efficiently discover and index all important pages of your website. Ensure it is up-to-date, correctly formatted, and accessible via robots.txt.`,
    Robots: `The robots.txt file instructs search engine crawlers which pages or sections of your site can or cannot be accessed. Ensure it exists, is correctly configured, and does not block important pages.`,
    Structured_Data: `Structured Data (Schema.org markup) helps search engines understand your content better, enhancing visibility in search results with rich snippets and improved click-through rates.`,
    Broken_Links: `Broken or dead links negatively affect user experience and SEO performance. Regularly check and fix 404 or redirecting links to maintain a healthy site structure.`,
    Redirect_Chains: `Redirect chains (multiple consecutive redirects) slow down page load times and waste crawl budget. Limit redirects to a single step to improve performance and SEO efficiency.`,
  };

  const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;

  return (<>
  {metric.Report=="All" ?
      <div className="relative flex w-full h-full min-h-screen">
    
        <div className={`${sidebarClass} lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}>
          <Sidebar darkMode={darkMode} />
        </div>
      
      <main
        className={`flex-1 lg:ml-64 flex flex-col items-center pt-20 pb-12 px-4 space-y-8 
          ${darkMode ? "bg-gray-900" : "bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50"}`}
      >
        
        <div
          className={`w-full max-w-4xl p-8 rounded-2xl shadow-2xl 
            border-l-8 border-indigo-500 ${mainCardBg}
            transform transition-all duration-300 hover:shadow-indigo-500/20`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-5xl font-black ${textColor} mb-2 
                bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent`}>
                Technical Performance
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Comprehensive analysis of your website's technical metrics
              </p>
            </div>
            <div className="transform transition-transform duration-300 hover:scale-110">
              <CircularProgress
                value={metric?.Technical_Performance?.Percentage || "0"}
                size={80}
                stroke={6}
              />
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full shadow-md
              ${darkMode
                ? "bg-gradient-to-r from-gray-700 to-gray-800 text-blue-400 border border-blue-700/40"
                : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200"
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Time Taken — {metric.Time_Taken}
          </div>
        </div>

        
        <div
          className={`w-full max-w-4xl p-8 rounded-2xl shadow-2xl 
            border-l-8 border-purple-500 ${mainCardBg}
            transform transition-all duration-300`}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">⚡</span>
            <h2 className={`text-2xl font-bold ${textColor}`}>Core & Interaction Vitals</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Largest Contentful Paint"
              description={desc.LCP}
              score={metric.Technical_Performance.LCP.Score}
              value={metric.Technical_Performance.LCP.Value}
              unit="s"
              darkMode={darkMode}
              icon="🎯"
            />
            <MetricCard
              title="First Input Delay"
              description={desc.FID}
              score={metric.Technical_Performance.FID.Score}
              value={metric.Technical_Performance.FID.Value}
              unit="ms"
              darkMode={darkMode}
              icon="⚡"
            />
            <MetricCard
              title="Cumulative Layout Shift"
              description={desc.CLS}
              score={metric.Technical_Performance.CLS.Score}
              value={metric.Technical_Performance.CLS.Value}
              darkMode={darkMode}
              icon="📐"
            />
            <MetricCard
              title="Interaction to Next Paint"
              description={desc.INP}
              score={metric.Technical_Performance.INP.Score}
              value={metric.Technical_Performance.INP.Value}
              unit="ms"
              darkMode={darkMode}
              icon="🖱️"
            />
          </div>
        </div>

        {/* Section 2: Performance Metrics */}
        <div
          className={`w-full max-w-4xl p-8 rounded-2xl shadow-2xl 
            border-l-8 border-blue-500 ${mainCardBg}
            transform transition-all duration-300`}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🚀</span>
            <h2 className={`text-2xl font-bold ${textColor}`}>Performance Metrics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="First Contentful Paint"
              description={desc.FCP}
              score={metric.Technical_Performance.FCP.Score}
              value={metric.Technical_Performance.FCP.Value}
              unit="s"
              darkMode={darkMode}
              icon="🎨"
            />
            <MetricCard
              title="Time To First Byte"
              description={desc.TTFB}
              score={metric.Technical_Performance.TTFB.Score}
              value={metric.Technical_Performance.TTFB.Value}
              unit="s"
              darkMode={darkMode}
              icon="⏱️"
            />
            <MetricCard
              title="Total Blocking Time"
              description={desc.TBT}
              score={metric.Technical_Performance.TBT.Score}
              value={metric.Technical_Performance.TBT.Value}
              unit="ms"
              darkMode={darkMode}
              icon="🚦"
            />
            <MetricCard
              title="Speed Index"
              description={desc.SI}
              score={metric.Technical_Performance.SI.Score}
              value={metric.Technical_Performance.SI.Value}
              unit="s"
              darkMode={darkMode}
              icon="📊"
            />
          </div>
        </div>

        
        <div
          className={`w-full max-w-4xl p-8 rounded-2xl shadow-2xl 
            border-l-8 border-green-500 ${mainCardBg}
            transform transition-all duration-300`}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🛠️</span>
            <h2 className={`text-2xl font-bold ${textColor}`}>Asset & Server</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Compression"
              description={desc.Compression}
              score={metric.Technical_Performance.Compression.Score}
              value={metric.Technical_Performance.Compression.Score ? "Enabled" : "Disabled"}
              darkMode={darkMode}
              icon="📦"
            />
            <MetricCard
              title="Caching"
              description={desc.Caching}
              score={metric.Technical_Performance.Caching.Score}
              value={metric.Technical_Performance.Caching.Score ? "Effective" : "Missing"}
              darkMode={darkMode}
              icon="💾"
            />
            <MetricCard
              title="Resource Optimization"
              description={desc.Resource_Optimization}
              score={metric.Technical_Performance.Resource_Optimization.Score}
              value={
                metric.Technical_Performance.Resource_Optimization.Score
                  ? "Optimized"
                  : "Needs Improvement"
              }
              darkMode={darkMode}
              icon="✨"
            />
            <MetricCard
              title="Render Blocking Resources"
              description={desc.Render_Blocking}
              score={!metric.Technical_Performance.Render_Blocking.Score}
              value={metric.Technical_Performance.Render_Blocking.Score ? "Found" : "None"}
              darkMode={darkMode}
              icon="🚧"
            />
            <MetricCard
              title="HTTPS Protocol"
              description={desc.HTTP}
              score={metric.Technical_Performance.HTTP.Score}
              value={metric.Technical_Performance.HTTP.Score ? "Secure" : "Insecure"}
              darkMode={darkMode}
              icon="🔒"
            />
          </div>
        </div>

        
        <div
          className={`w-full max-w-4xl p-8 rounded-2xl shadow-2xl 
            border-l-8 border-yellow-500 ${mainCardBg}
            transform transition-all duration-300`}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🔍</span>
            <h2 className={`text-2xl font-bold ${textColor}`}>Crawlability & Indexing</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Sitemap"
              description={desc.Sitemap}
              score={metric.Technical_Performance.Sitemap.Score}
              value={metric.Technical_Performance.Sitemap.Score ? "Yes" : "No"}
              darkMode={darkMode}
              icon="🗺️"
            />
            <MetricCard
              title="Robots.txt"
              description={desc.Robots}
              score={metric.Technical_Performance.Robots.Score}
              value={metric.Technical_Performance.Robots.Score ? "Valid" : "Missing"}
              darkMode={darkMode}
              icon="🤖"
            />
            <MetricCard
              title="Structured Data"
              description={desc.Structured_Data}
              score={metric.Technical_Performance.Structured_Data.Score}
              value={metric.Technical_Performance.Structured_Data.Score ? "Yes" : "No"}
              darkMode={darkMode}
              icon="📋"
            />
            <MetricCard
              title="Broken Links"
              description={desc.Broken_Links}
              score={!metric.Technical_Performance.Broken_Links.Score}
              value={metric.Technical_Performance.Broken_Links.Score ? "Yes" : "No"}
              darkMode={darkMode}
              icon="🔗"
            />
            <MetricCard
              title="Redirect Chains"
              description={desc.Redirect_Chains}
              score={!metric.Technical_Performance.Redirect_Chains.Score}
              value={metric.Technical_Performance.Redirect_Chains.Score ? "Yes" : "No"}
              darkMode={darkMode}
              icon="↪️"
            />
          </div>
        </div>

        
        <AuditDropdown
          title="Passed Audits"
          items={metric.Technical_Performance.Passed}
          darkMode={darkMode}
        />
        <AuditDropdown
          title="Warning"
          items={metric.Technical_Performance.Warning}
          darkMode={darkMode}
        />
        <AuditDropdown
          title="Failed Audits"
          items={metric.Technical_Performance.Improvements}
          darkMode={darkMode}
        />
      </main>
    </div>: <div className="relative flex w-full h-full min-h-screen">
    
       
      
      <main
        className={`flex-1  flex flex-col items-center pt-20 pb-12 px-4 space-y-8 
          ${darkMode ? "bg-gray-900" : "bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50"}`}
      >
        
        <div
          className={`w-full max-w-6xl p-8 rounded-2xl shadow-2xl 
            border-l-8 border-indigo-500 ${mainCardBg}
            transform transition-all duration-300 hover:shadow-indigo-500/20`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-5xl font-black ${textColor} mb-2 
                bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent`}>
                Technical Performance
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Comprehensive analysis of your website's technical metrics
              </p>
            </div>
            <div className="transform transition-transform duration-300 hover:scale-110">
              <CircularProgress
                value={metric?.Technical_Performance?.Percentage || "0"}
                size={80}
                stroke={6}
              />
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full shadow-md
              ${darkMode
                ? "bg-gradient-to-r from-gray-700 to-gray-800 text-blue-400 border border-blue-700/40"
                : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200"
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Time Taken — {metric.Time_Taken}
          </div>
        </div>

        
        <div
          className={`w-full max-w-6xl p-8 rounded-2xl shadow-2xl 
            border-l-8 border-purple-500 ${mainCardBg}
            transform transition-all duration-300`}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">⚡</span>
            <h2 className={`text-2xl font-bold ${textColor}`}>Core & Interaction Vitals</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Largest Contentful Paint"
              description={desc.LCP}
              score={metric.Technical_Performance.LCP.Score}
              value={metric.Technical_Performance.LCP.Value}
              unit="s"
              darkMode={darkMode}
              icon="🎯"
            />
            <MetricCard
              title="First Input Delay"
              description={desc.FID}
              score={metric.Technical_Performance.FID.Score}
              value={metric.Technical_Performance.FID.Value}
              unit="ms"
              darkMode={darkMode}
              icon="⚡"
            />
            <MetricCard
              title="Cumulative Layout Shift"
              description={desc.CLS}
              score={metric.Technical_Performance.CLS.Score}
              value={metric.Technical_Performance.CLS.Value}
              darkMode={darkMode}
              icon="📐"
            />
            <MetricCard
              title="Interaction to Next Paint"
              description={desc.INP}
              score={metric.Technical_Performance.INP.Score}
              value={metric.Technical_Performance.INP.Value}
              unit="ms"
              darkMode={darkMode}
              icon="🖱️"
            />
          </div>
        </div>

        {/* Section 2: Performance Metrics */}
        <div
          className={`w-full max-w-6xl p-8 rounded-2xl shadow-2xl 
            border-l-8 border-blue-500 ${mainCardBg}
            transform transition-all duration-300`}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🚀</span>
            <h2 className={`text-2xl font-bold ${textColor}`}>Performance Metrics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="First Contentful Paint"
              description={desc.FCP}
              score={metric.Technical_Performance.FCP.Score}
              value={metric.Technical_Performance.FCP.Value}
              unit="s"
              darkMode={darkMode}
              icon="🎨"
            />
            <MetricCard
              title="Time To First Byte"
              description={desc.TTFB}
              score={metric.Technical_Performance.TTFB.Score}
              value={metric.Technical_Performance.TTFB.Value}
              unit="s"
              darkMode={darkMode}
              icon="⏱️"
            />
            <MetricCard
              title="Total Blocking Time"
              description={desc.TBT}
              score={metric.Technical_Performance.TBT.Score}
              value={metric.Technical_Performance.TBT.Value}
              unit="ms"
              darkMode={darkMode}
              icon="🚦"
            />
            <MetricCard
              title="Speed Index"
              description={desc.SI}
              score={metric.Technical_Performance.SI.Score}
              value={metric.Technical_Performance.SI.Value}
              unit="s"
              darkMode={darkMode}
              icon="📊"
            />
          </div>
        </div>

        
        <div
          className={`w-full max-w-6xl p-8 rounded-2xl shadow-2xl 
            border-l-8 border-green-500 ${mainCardBg}
            transform transition-all duration-300`}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🛠️</span>
            <h2 className={`text-2xl font-bold ${textColor}`}>Asset & Server</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Compression"
              description={desc.Compression}
              score={metric.Technical_Performance.Compression.Score}
              value={metric.Technical_Performance.Compression.Score ? "Enabled" : "Disabled"}
              darkMode={darkMode}
              icon="📦"
            />
            <MetricCard
              title="Caching"
              description={desc.Caching}
              score={metric.Technical_Performance.Caching.Score}
              value={metric.Technical_Performance.Caching.Score ? "Effective" : "Missing"}
              darkMode={darkMode}
              icon="💾"
            />
            <MetricCard
              title="Resource Optimization"
              description={desc.Resource_Optimization}
              score={metric.Technical_Performance.Resource_Optimization.Score}
              value={
                metric.Technical_Performance.Resource_Optimization.Score
                  ? "Optimized"
                  : "Needs Improvement"
              }
              darkMode={darkMode}
              icon="✨"
            />
            <MetricCard
              title="Render Blocking Resources"
              description={desc.Render_Blocking}
              score={!metric.Technical_Performance.Render_Blocking.Score}
              value={metric.Technical_Performance.Render_Blocking.Score ? "Found" : "None"}
              darkMode={darkMode}
              icon="🚧"
            />
            <MetricCard
              title="HTTPS Protocol"
              description={desc.HTTP}
              score={metric.Technical_Performance.HTTP.Score}
              value={metric.Technical_Performance.HTTP.Score ? "Secure" : "Insecure"}
              darkMode={darkMode}
              icon="🔒"
            />
          </div>
        </div>

        
        <div
          className={`w-full max-w-6xl p-8 rounded-2xl shadow-2xl 
            border-l-8 border-yellow-500 ${mainCardBg}
            transform transition-all duration-300`}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🔍</span>
            <h2 className={`text-2xl font-bold ${textColor}`}>Crawlability & Indexing</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Sitemap"
              description={desc.Sitemap}
              score={metric.Technical_Performance.Sitemap.Score}
              value={metric.Technical_Performance.Sitemap.Score ? "Yes" : "No"}
              darkMode={darkMode}
              icon="🗺️"
            />
            <MetricCard
              title="Robots.txt"
              description={desc.Robots}
              score={metric.Technical_Performance.Robots.Score}
              value={metric.Technical_Performance.Robots.Score ? "Valid" : "Missing"}
              darkMode={darkMode}
              icon="🤖"
            />
            <MetricCard
              title="Structured Data"
              description={desc.Structured_Data}
              score={metric.Technical_Performance.Structured_Data.Score}
              value={metric.Technical_Performance.Structured_Data.Score ? "Yes" : "No"}
              darkMode={darkMode}
              icon="📋"
            />
            <MetricCard
              title="Broken Links"
              description={desc.Broken_Links}
              score={!metric.Technical_Performance.Broken_Links.Score}
              value={metric.Technical_Performance.Broken_Links.Score ? "Yes" : "No"}
              darkMode={darkMode}
              icon="🔗"
            />
            <MetricCard
              title="Redirect Chains"
              description={desc.Redirect_Chains}
              score={!metric.Technical_Performance.Redirect_Chains.Score}
              value={metric.Technical_Performance.Redirect_Chains.Score ? "Yes" : "No"}
              darkMode={darkMode}
              icon="↪️"
            />
          </div>
        </div>

        
        <AuditDropdown
          title="Passed Audits"
          items={metric.Technical_Performance.Passed}
          darkMode={darkMode}
        />
        <AuditDropdown
          title="Warning"
          items={metric.Technical_Performance.Warning}
          darkMode={darkMode}
        />
        <AuditDropdown
          title="Failed Audits"
          items={metric.Technical_Performance.Improvements}
          darkMode={darkMode}
        />
      </main>
    </div>}
 </> );
}