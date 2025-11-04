import React, { useContext, useState } from "react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import Sidebar from "../Component/Sidebar";
import UrlHeader from "../Component/UrlHeader"

// -----------------------------------------------------------------
// ✅ SKELETON COMPONENTS
// -----------------------------------------------------------------
const SkeletonSidebar = ({ darkMode }) => (
  <div
    className={`fixed top-0 mt-16 left-0 h-full w-64 ${
      darkMode ? "bg-gray-900" : "bg-white"
    } shadow-lg p-6`}
  >
    <div className={`h-7 rounded mb-5 ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
    <div className={`h-7 rounded mb-5 ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
    <div className={`h-7 rounded mb-5 ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
    <div className={`h-7 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
  </div>
);

function TechnicalPerformanceShimmer({ darkMode }) {
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const shimmerCardBg = darkMode ? "bg-gray-800" : "bg-gray-200";

  const SkeletonMetricCard = () => (
    <div className={`p-5 rounded-lg shadow-lg ${shimmerCardBg}`}>
      <div className="flex justify-between items-center mb-2">
        <div className={`h-5 w-1/3 rounded ${shimmerBg}`}></div>
        <div className={`h-4 w-1/4 rounded-full ${shimmerBg}`}></div>
      </div>
      <div className={`h-10 w-1/2 rounded ${shimmerBg} mb-3`}></div>
      <div className={`h-4 w-full rounded ${shimmerBg} mt-4`}></div>
    </div>
  );

  return (
    <div className="animate-pulse">
      <div className="relative flex w-full h-full">
        <SkeletonSidebar darkMode={darkMode} />
        <main className="flex-1 lg:ml-64 flex flex-col justify-center items-center pt-20 pb-8 pr-4 pl-4 space-y-8">
          <SkeletonMetricCard />
          <SkeletonMetricCard />
        </main>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// ✅ METRIC CARD COMPONENT (Each Has Its Own Toggle)
// -----------------------------------------------------------------
const MetricCard = ({ title, description, score, value, unit, darkMode }) => {
  const [showDescription, setShowDescription] = useState(false);
  const isPassed = Boolean(score);

  const titleColor = darkMode ? "text-white" : "text-black";
  const descriptionColor = darkMode ? "text-gray-300" : "text-gray-700";
  const valueColor = isPassed
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
  const cardBg = darkMode ? "bg-gray-800" : "bg-white";

  const statusText = isPassed ? "Good" : "Improvement";
  const statusColor = isPassed
    ? "bg-green-400 text-black dark:bg-green-400"
    : "bg-red-500 text-white dark:bg-red-600";

  return (
    <div className={`p-5 rounded-lg shadow-lg ${cardBg} flex flex-col`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className={`text-2xl font-semibold ${titleColor}`}>{title}</h3>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${statusColor}`}>
          {statusText}
        </span>
      </div>

      <div className={`text-xl font-bold mb-3 ${valueColor}`}>
        {value !== null && value !== undefined ? `${value}${unit || ""}` : "--"}
      </div>

      <button
        onClick={() => setShowDescription(!showDescription)}
        className={`self-end mt-auto mb-1 px-2  py-1 text-xs  font-semibold tracking-wide flex items-center gap-1 justify-center rounded-full
  transition-all duration-300 border border-transparent shadow-sm hover:shadow-md active:scale-95
  ${
    darkMode
      ? "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white border-indigo-500/30"
      : "bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-400 hover:to-indigo-400 text-white border-blue-500/30"
  }`}
      >
        {showDescription ? "Hide Description" : "Show Description"}
      </button>

      {showDescription && (
        <p className={`text-sm ${descriptionColor} border-t border-gray-600 pt-3 mt-3`}>
          {description}
        </p>
      )}
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

  if (loading || !metric) {
    return <TechnicalPerformanceShimmer darkMode={darkMode} />;
  }

  const textColor = darkMode ? "text-white" : "text-black";
  const mainCardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

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
  return (
    <div className="relative flex w-full h-full">
      <Sidebar darkMode={darkMode} />
      <main
        className={`flex-1 lg:ml-35 flex flex-col justify-center items-center pt-20 pb-8  space-y-8 ${
          darkMode ? "text-gray-100" : "text-gray-800"
        }`}
      >
      <UrlHeader darkMode={darkMode} />
   <div
  className={`w-full max-w-6xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${mainCardBg}`}
>
  <div className="flex items-center justify-between mb-5">
    <h2 className={`text-4xl font-bold ${textColor}`}>Technical Performance</h2>

    <CircularProgress
      value={metric.Technical_Performance.Percentage}
      size={70}
      stroke={5}
    />
  </div>
 <div
  className={`text-sm font-semibold px-4 py-2 rounded-md shadow-sm border
  ${darkMode 
    ? "bg-gray-800 text-blue-400 border-blue-700/40" 
    : "bg-blue-50 text-blue-600 border-blue-200"
  }`}
>
  Time Taken — {metric.Time_Taken}
</div>
</div>
      

        {/* ✅ SECTION 1: Core & Interaction Vitals */}
        <div
          className={`w-full max-w-6xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${mainCardBg}`}
        >
          <h2 className={`text-xl font-bold mb-5 ${textColor}`}>Core & Interaction Vitals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Largest Contentful Paint"
              description={desc.LCP}
              score={metric.Technical_Performance.LCP.Score}
              value={metric.Technical_Performance.LCP.Value}
              unit="s"
              darkMode={darkMode}
            />
            <MetricCard
              title="First Input Delay"
              description={desc.FID}
              score={metric.Technical_Performance.FID.Score}
              value={metric.Technical_Performance.FID.Value}
              unit="ms"
              darkMode={darkMode}
            />
            <MetricCard
              title="Cumulative Layout Shift"
              description={desc.CLS}
              score={metric.Technical_Performance.CLS.Score}
              value={metric.Technical_Performance.CLS.Value}
              darkMode={darkMode}
            />
            <MetricCard
              title="Interaction to Next Paint"
              description={desc.INP}
              score={metric.Technical_Performance.INP.Score}
              value={metric.Technical_Performance.INP.Value}
              unit="ms"
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* ✅ SECTION 2: Performance Metrics */}
        <div
          className={`w-full max-w-6xl p-6 rounded-2xl shadow-lg border-l-4 border-blue-500 ${mainCardBg}`}
        >
          <h2 className={`text-xl font-bold mb-5 ${textColor}`}>Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="First Contentful Paint"
              description={desc.FCP}
              score={metric.Technical_Performance.FCP.Score}
              value={metric.Technical_Performance.FCP.Value}
              unit="s"
              darkMode={darkMode}
            />
            <MetricCard
              title="Time To First Byte"
              description={desc.TTFB}
              score={metric.Technical_Performance.TTFB.Score}
              value={metric.Technical_Performance.TTFB.Value}
              unit="s"
              darkMode={darkMode}
            />
            <MetricCard
              title="Total Blocking Time"
              description={desc.TBT}
              score={metric.Technical_Performance.TBT.Score}
              value={metric.Technical_Performance.TBT.Value}
              unit="ms"
              darkMode={darkMode}
            />
            <MetricCard
              title="Speed Index"
              description={desc.SI}
              score={metric.Technical_Performance.SI.Score}
              value={metric.Technical_Performance.SI.Value}
              unit="s"
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* ✅ SECTION 3: Asset & Server */}
        <div
          className={`w-full max-w-6xl p-6 rounded-2xl shadow-lg border-l-4 border-green-500 ${mainCardBg}`}
        >
          <h2 className={`text-xl font-bold mb-5 ${textColor}`}>Asset & Server</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Compression"
              description={desc.Compression}
              score={metric.Technical_Performance.Compression.Score}
              value={
                metric.Technical_Performance.Compression.Score ? "Enabled" : "Disabled"
              }
              darkMode={darkMode}
            />
            <MetricCard
              title="Caching"
              description={desc.Caching}
              score={metric.Technical_Performance.Caching.Score}
              value={
                metric.Technical_Performance.Caching.Score ? "Effective" : "Missing"
              }
              darkMode={darkMode}
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
            />
            <MetricCard
              title="Render Blocking Resources"
              description={desc.Render_Blocking}
              score={!metric.Technical_Performance.Render_Blocking.Score}
              value={
                metric.Technical_Performance.Render_Blocking.Score ? "Found" : "None"
              }
              darkMode={darkMode}
            />
            <MetricCard
              title="HTTPS Protocol"
              description={desc.HTTP}
              score={metric.Technical_Performance.HTTP.Score}
              value={
                metric.Technical_Performance.HTTP.Score ? "Secure" : "Insecure"
              }
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* ✅ SECTION 4: Crawlability & Indexing */}
        <div
          className={`w-full max-w-6xl p-6 rounded-2xl shadow-lg border-l-4 border-yellow-500 ${mainCardBg}`}
        >
          <h2 className={`text-xl font-bold mb-5 ${textColor}`}>Crawlability & Indexing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Sitemap"
              description={desc.Sitemap}
              score={metric.Technical_Performance.Sitemap.Score}
              value={metric.Technical_Performance.Sitemap.Score ? "Yes" : "No"}
              darkMode={darkMode}
            />
            <MetricCard
              title="Robots.txt"
              description={desc.Robots}
              score={metric.Technical_Performance.Robots.Score}
              value={metric.Technical_Performance.Robots.Score ? "Valid" : "Missing"}
              darkMode={darkMode}
            />
            <MetricCard
              title="Structured Data"
              description={desc.Structured_Data}
              score={metric.Technical_Performance.Structured_Data.Score}
              value={
                metric.Technical_Performance.Structured_Data.Score ? "Yes" : "No"
              }
              darkMode={darkMode}
            />
            <MetricCard
              title="Broken Links"
              description={desc.Broken_Links}
              score={!metric.Technical_Performance.Broken_Links.Score}
              value={
                metric.Technical_Performance.Broken_Links.Score ? "Yes" : "No"
              }
              darkMode={darkMode}
            />
            <MetricCard
              title="Redirect Chains"
              description={desc.Redirect_Chains}
              score={!metric.Technical_Performance.Redirect_Chains.Score}
              value={
                metric.Technical_Performance.Redirect_Chains.Score ? "Yes" : "No"
              }
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* ✅ Audit Dropdowns */}
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
    </div>
  );
}
