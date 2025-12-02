import React, { useContext, useState } from "react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";

import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";


// -----------------------------------------------------------------
// ✅ SKELETON COMPONENTS (FIXED)
// -----------------------------------------------------------------
const SkeletonSidebar = ({ darkMode }) => (
  <div
    className={`fixed top-0 mt-16 left-0 h-full w-64 ${darkMode ? "bg-gray-900" : "bg-white"
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

  // --- ✅ FIX: Destructure 'data' from useData() ---
  const { data } = useData();

  const shimmerCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";
  return (
    // --- ✅ FIX: Added optional chaining (data?.Report) ---
    <div className={`w-full ${data?.Report === "All" ? "  " : " "}  p-8 rounded-2xl shadow-2xl ${shimmerCardBg} border-l-8 ${border} border-l-gray-500`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className={`h-12 w-full max-w-xs rounded ${shimmerBg} mb-3`}></div>
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

  // --- ✅ FIX: Destructure 'data' from useData() ---
  const { data } = useData();

  const shimmerCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    // --- ✅ FIX: Added optional chaining (data?.Report) ---
    <div className={`w-full ${data?.Report === "All" ? "  " : " "} p-8 rounded-2xl shadow-2xl ${shimmerCardBg} border-l-8 ${border} border-l-gray-500`}>
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

  // --- ✅ FIX: Destructure 'data' from useData() ---
  const { data } = useData();

  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const border = darkMode ? "border-gray-700" : "border-gray-200";
  return (
    // --- ✅ FIX: Added optional chaining (data?.Report) ---
    <div className={`w-full ${data?.Report === "All" ? "  " : " "} p-5 rounded-lg shadow-xl ${shimmerCardBg} border ${border}`}>
      <div className={`h-6 w-1/3 rounded ${shimmerBg}`}></div>
    </div>
  );
};

/**
 * ✅ This is the main shimmer component that mimics the final page layout.
 */
function TechnicalPerformanceShimmer({ darkMode }) {

  // --- ✅ FIX: Destructure 'data' from useData() ---
  const { data } = useData();

  const mainBg = darkMode
    ? "bg-gray-900"
    : "bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50";

  return (
    <div className={`relative flex w-full h-full min-h-screen ${mainBg} animate-pulse`}>
      <main className={`flex-1 flex flex-col items-center pt-20 pb-12 px-4 space-y-8`}>
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

  if (metric.Status === "failed") {
    return (
      <div className={`flex items-center justify-center h-screen w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center p-8 rounded-xl shadow-xl bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Audit Failed</h2>
          <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto">
            {metric.Error_Message || "An unexpected error occurred while analyzing the website."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const textColor = darkMode ? "text-white" : "text-gray-900";
  const mainCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  const desc = {
    LCP: `Largest Contentful Paint (LCP): This measures how long it takes for the most important part of your page (like the main banner image or title) to appear. It's the "wow, the page is loaded" moment for a user. A fast LCP (under 2.5 seconds) makes your site feel fast and professional. If it's slow, users get impatient and might leave. This is a key factor in Google's ranking and user satisfaction.`,

    FID: `First Input Delay (FID): This measures your site's responsiveness. When a user clicks a button or a link, how long does it take for the site to actually start doing something? A good score (under 100 milliseconds) makes the site feel instant and responsive. A slow score feels 'laggy' or 'stuck,' which is very frustrating for users. This is often caused by heavy background tasks that we can optimize.`,

    CLS: `Cumulative Layout Shift (CLS): This measures how much your page's content 'jumps around' while it's loading. It’s that annyoing experience where you try to tap a button, but an image or ad loads above it at the last second, pushing the button down and making you tap the wrong thing. A good, stable layout (a low score) is key for a professional feel and prevents user frustration. We can fix this by properly reserving space for all content.`,

    FCP: `First Contentful Paint (FCP): This measures how long it takes for the *very first* piece of content (like the site header or the first line of text) to appear on the screen. It's the "Okay, it's working" signal for the user. A fast FCP (under 1.8 seconds) reassures the user that the page is loading and not stuck. A slow FCP makes them wonder if they should just hit the 'back' button. This is the first impression of your site's speed.`,

    TTFB: `Time To First Byte (TTFB): This measures how long it takes for your website's server to "wake up" and send back the very first piece of data after a user requests the page. Think of it as how long it takes for a restaurant's kitchen to start preparing your order. A slow TTFB (over 0.2 seconds is not ideal) means your server itself is slow, and this delay will make *everything* else on the page load slower. This is often fixed with better web hosting.`,

    TBT: `Total Blocking Time (TBT): This measures the total time your page was 'frozen' and couldn't respond to a user's click or tap. While the page is loading, it has to run a lot of code. If a piece of code takes too long, it 'blocks' the page, making it feel unresponsive. A low TBT means the page becomes interactive quickly. We can improve this by breaking up heavy code into smaller, faster pieces so the user never feels a lag.`,

    SI: `Speed Index (SI): This metric measures how quickly the content on the visible part of your screen (what you see without scrolling) loads. It's not just one single moment; it's a score of the *entire* loading experience. Think of it like a video playback of your page loading—a fast Speed Index means the user sees the important content fill in smoothly and quickly, rather than staring at a white screen for a long time.`,

    INP: `Interaction to Next Paint (INP): This is a new Core Web Vital that measures your site's *overall* responsiveness. While FID just checks the *first* click, INP checks *all* interactions (clicks, taps, typing) a user makes. It measures the full time from when you click to when you see the result on screen (like a menu opening). A low INP (under 200ms) means your site feels fluid and responsive all the time, not just at the beginning.`,

    Compression: `Text Compression: This checks if your website is 'zipping' its text files (like HTML, CSS, and JavaScript) before sending them to the user. Just like zipping a folder on your computer, this makes the files much smaller and faster to download. The user's browser automatically 'unzips' them. This is a simple server setting that dramatically speeds up your site's loading time and uses less data, which is especially important for users on mobile phones.`,

    Caching: `Caching: This checks if your site tells a user's browser to "remember" parts of your website. When a user visits your site, their browser can save files like your logo, images, and style files. The *next* time they visit, they don't have to re-download everything. The page loads almost instantly. Effective caching is the main reason why sites feel so much faster for repeat visitors. It also reduces the load on your web server.`,

    Resource_Optimization: `Resource Optimization: This checks if all your site's files (images, code, etc.) are as small as possible. This includes three main things: 1) **Compressing images** so they load fast without losing quality. 2) **Minifying code**, which means removing all the unnecessary spaces and comments that developers use. 3) **Removing unused code** that might be left over from old features. A well-optimized site is lean, fast, and provides a much better user experience.`,

    Render_Blocking: `Render-Blocking Resources: This checks for files that 'block' your page from loading. Imagine your browser is trying to build your webpage, but it hits a big code file at the top and has to stop everything to read it. This creates a "bottleneck" and leaves the user staring at a white screen. We fix this by telling the browser to load non-important files later and load the most critical styles first, so the page *starts* to appear right away.`,

    HTTP: `HTTPS & Modern Protocols: This checks two things. First, **HTTPS** (the 'S' stands for Secure) ensures your site is secure by encrypting all data between the user and your server. This is what gives you the 'padlock' icon in the browser and is essential for user trust and Google rankings. Second, using HTTPS allows your site to use modern, faster protocols like **HTTP/2**. Think of HTTP/2 as a multi-lane highway, allowing the browser to download many files at once instead of one-by-one.`,

    Sitemap: `Sitemap: A sitemap is literally a 'map' of all the important pages on your website, created specifically for search engines like Google. Instead of making Google 'crawl' your site by clicking link-by-link to find everything, a sitemap hands Google a complete list. This ensures Google can easily find and index all your pages, especially new ones or ones that are hard to find. It's a fundamental part of good SEO (Search Engine Optimization).`,

    Robots: `Robots.txt: The 'robots.txt' file is a simple set of instructions for search engines, telling them which parts of your website they *should not* look at. You can use it to block them from private areas (like your admin login page) or from temporary pages you don't want showing up in search results. It's like putting a "Staff Only" or "Do Not Enter" sign on certain doors of your website to guide the search engine crawlers.`,

    Structured_Data: `Structured Data: This is a special 'label' you add to your site's code to clearly explain your content to search engines. Instead of making Google *guess* what your page is about, you can tell it: "This is a recipe, and the rating is 5 stars" or "This is a product, and the price is $50." When Google understands this, it can show your page with "rich snippets" in the search results—like star ratings, prices, or event dates right under your link. This makes your site stand out and gets you more clicks.`,

    Broken_Links: `Broken Links: This checks for 'dead ends' on your website. These are links that point to a '404 Not Found' error page, either on your own site or on an external site. Broken links are very frustrating for users and make your site look unprofessional and out-of-date. They also hurt your Google ranking because search engines see them as a sign of a low-quality, poorly maintained website. We need to find and fix these links regularly.`,

    Redirect_Chains: `Redirect Chains: This checks for "wild goose chases" on your site. A redirect chain is when a user tries to go to Page A, but your site sends them to Page B... which then sends them to Page C. Each of these 'hops' is a separate step that wastes time and slows down the page load. It's also inefficient for Google's crawlers. We fix this by updating all old links to point directly to the final destination (Page C), which is much faster.`,
  };

  return (
    <div className="relative flex w-full h-full min-h-screen">
      <main
        className={`flex-1 flex flex-col items-center pt-10 pb-12 px-4 space-y-8  
          ${darkMode ? "bg-gray-900" : "bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50"}`}
      >

        <div
          className={`w-full    p-8 rounded-2xl shadow-2xl 
            border-l-8 border-indigo-500 ${mainCardBg}
            transform transition-all duration-300 hover:shadow-indigo-500/20`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-3xl sm:text-5xl font-black ${textColor} mb-2 
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

        {/* Section: Real User Experience (CrUX) */}
        {metric.Technical_Performance.Real_User_Experience && (
          <div
            className={`w-full p-8 rounded-2xl shadow-2xl 
              border-l-8 border-orange-500 ${mainCardBg}
              transform transition-all duration-300`}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🌍</span>
              <h2 className={`text-2xl font-bold ${textColor}`}>Real User Experience (CrUX)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MetricCard
                title="Largest Contentful Paint"
                description={desc.LCP}
                score={metric.Technical_Performance.Real_User_Experience.LCP?.category === "FAST"}
                value={metric.Technical_Performance.Real_User_Experience.LCP?.value}
                unit="ms"
                darkMode={darkMode}
                icon="🎯"
              />
              <MetricCard
                title="First Input Delay"
                description={desc.FID}
                score={metric.Technical_Performance.Real_User_Experience.FID?.category === "FAST"}
                value={metric.Technical_Performance.Real_User_Experience.FID?.value}
                unit="ms"
                darkMode={darkMode}
                icon="⚡"
              />
              <MetricCard
                title="Cumulative Layout Shift"
                description={desc.CLS}
                score={metric.Technical_Performance.Real_User_Experience.CLS?.category === "FAST"}
                value={metric.Technical_Performance.Real_User_Experience.CLS?.value}
                darkMode={darkMode}
                icon="📐"
              />
              <MetricCard
                title="Interaction to Next Paint"
                description={desc.INP}
                score={metric.Technical_Performance.Real_User_Experience.INP?.category === "FAST"}
                value={metric.Technical_Performance.Real_User_Experience.INP?.value}
                unit="ms"
                darkMode={darkMode}
                icon="🖱️"
              />
              <MetricCard
                title="First Contentful Paint"
                description={desc.FCP}
                score={metric.Technical_Performance.Real_User_Experience.FCP?.category === "FAST"}
                value={metric.Technical_Performance.Real_User_Experience.FCP?.value}
                unit="ms"
                darkMode={darkMode}
                icon="🎨"
              />
              <MetricCard
                title="Time To First Byte"
                description={desc.TTFB}
                score={metric.Technical_Performance.Real_User_Experience.TTFB?.category === "FAST"}
                value={metric.Technical_Performance.Real_User_Experience.TTFB?.value}
                unit="ms"
                darkMode={darkMode}
                icon="⏱️"
              />
            </div>
          </div>
        )}

        <div
          className={`w-full    p-8 rounded-2xl shadow-2xl 
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
          className={`w-full    p-8 rounded-2xl shadow-2xl 
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
          className={`w-full    p-8 rounded-2xl shadow-2xl 
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
          className={`w-full    p-8 rounded-2xl shadow-2xl 
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
    </div>
  );
}