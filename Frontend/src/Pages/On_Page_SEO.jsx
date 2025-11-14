import React, { use, useContext, useState } from "react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import Sidebar from "../Component/Sidebar";

// ------------------------------------------------------
// ✅ NEW: High-Fidelity Skeleton Components
// ------------------------------------------------------
const SkeletonSidebar = ({ darkMode }) => (
  <div
    className={`fixed top-0 mt-16 left-0 h-full w-64 ${
      darkMode ? "bg-gray-900" : "bg-white"
    } shadow-lg p-6`}
  >
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className={`h-7 rounded mb-5 animate-pulse ${
          darkMode ? "bg-gray-700" : "bg-gray-300"
        }`}
      ></div>
    ))}
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
  const shimmerCardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  
  // --- ✅ FIX 1: Destructure 'data' ---
  const { data } = useData();
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    // --- ✅ FIX 2: Use optional chaining 'data?.Report' ---
    <div className={`w-full ${data?.Report === "All" ? "max-w-4xl" : "max-w-6xl"} p-8 rounded-2xl shadow-2xl ${shimmerCardBg} border-l-8 ${border} border-l-gray-500`}>
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
  
  // --- ✅ FIX 1: Destructure 'data' ---
  const { data } = useData();
  
  const shimmerCardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";
  
  return (
    // --- ✅ FIX 2: Use optional chaining 'data?.Report' ---
    <div className={`w-full ${data?.Report === "All" ? "max-w-4xl" : "max-w-6xl"} p-8 rounded-2xl shadow-2xl ${shimmerCardBg} border-l-8 ${border} border-l-gray-500`}>
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

const SkeletonSchemaCard = ({ darkMode }) => {
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const shimmerCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";

  // --- ✅ FIX 1: Destructure 'data' ---
  const { data } = useData();
  
  const preBg = darkMode ? "bg-gray-800" : "bg-gray-100";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    // --- ✅ FIX 2: Use optional chaining 'data?.Report' ---
    <div className={`w-full ${data?.Report === "All" ? "max-w-4xl" : "max-w-6xl"} p-6 rounded-2xl shadow-lg ${shimmerCardBg} border ${border}`}>
      <div className={`h-6 w-1/3 rounded ${shimmerBg} mb-4`}></div>
      <div className={`h-40 w-full rounded-xl ${preBg}`}></div>
    </div>
  );
};

const SkeletonAuditDropdown = ({ darkMode }) => {
  const shimmerCardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";

  // --- ✅ FIX 1: Destructure 'data' ---
  const { data } = useData();
  
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    // --- ✅ FIX 2: Use optional chaining 'data?.Report' ---
    <div className={`w-full ${data?.Report === "All" ? "max-w-4xl" : "max-w-6xl"} p-5 rounded-lg shadow-xl ${shimmerCardBg} border ${border}`}>
      <div className={`h-6 w-1/3 rounded ${shimmerBg}`}></div>
    </div>
  );
};

/**
 * ✅ REPLACED: This is the new, high-fidelity shimmer component
 * that mimics your final page layout perfectly.
 */
function OnPageSeoShimmer({ darkMode }) {
  // --- ✅ FIX 1: Destructure 'data' ---
  const { data } = useData();
  
  const mainBg = darkMode 
    ? "bg-gray-900" 
    : "bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50";

  return (
    <div className={`relative flex w-full h-full min-h-screen ${mainBg} animate-pulse`}>
      {/* --- ✅ FIX 2: Use optional chaining 'data?.Report' --- */}
      {data?.Report === "All" && <SkeletonSidebar darkMode={darkMode} />}
      
      <main className={`flex-1 ${data?.Report === "All" ? "lg:ml-64" : ""} flex flex-col items-center pt-20 pb-12 px-4 space-y-8`}>
        {/* 1. Header Card */}
        <SkeletonHeaderCard darkMode={darkMode} />
        
        {/* 2. Section 1 ("Content Essentials") - 5 metrics */}
        <SkeletonSectionCard metricCount={5} darkMode={darkMode} />
        
        {/* 3. Section 2 ("Media & Accessibility") - 2 metrics */}
        <SkeletonSectionCard metricCount={2} darkMode={darkMode} />
        
        {/* 4. Section 3 ("Structure & Semantics") - 3 metrics */}
        <SkeletonSectionCard metricCount={3} darkMode={darkMode} />
        
        {/* 5. Section 4 ("Technical SEO") - 5 metrics */}
        <SkeletonSectionCard metricCount={5} darkMode={darkMode} />

        {/* 6. Schema Card */}
        <SkeletonSchemaCard darkMode={darkMode} />
        
        {/* 7. Dropdowns - 2 of them */}
        <SkeletonAuditDropdown darkMode={darkMode} />
        <SkeletonAuditDropdown darkMode={darkMode} />
      </main>
    </div>
  );
}


// ------------------------------------------------------
// ✅ MetricCard Component (Unchanged)
// ------------------------------------------------------
const MetricCard = ({ title, description, score, value, unit, darkMode, icon, heading }) => {
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
      <div
        className={`absolute inset-0 rounded-xl opacity-0   
        ${
          isPassed
            ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10"
            : "bg-gradient-to-br from-red-500/10 to-rose-500/10"
        }`}
      ></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <h3 className={`text-lg font-bold ${titleColor} leading-tight`}>
              {title}
            </h3>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${statusColor}`}
          >
            {statusText}
          </span>
        </div>

        {/* Value */}
        <div
          className={`text-3xl font-extrabold mb-4 ${valueColor} transition-all duration-300`}
        >
          {value !== null && value !== undefined ? `${value}${unit || ""}` : "--"}
        </div>

        {/* Toggle Details */}
        <button
          onClick={() => setShowDescription(!showDescription)}
          className={`w-full mt-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300
            ${
              darkMode
                ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white"
            }`}
        >
          {showDescription ? "Hide Details" : "Show Details"}
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            showDescription ? "max-h-96 mt-4" : "max-h-0"
          }`}
        >
          <p
            className={`text-sm ${descriptionColor} border-t ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } pt-4`}
          >
            {description}
          </p>
          {heading && <div className="mt-4"><HeadingHierarchyCard data={heading} /></div>}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ MAIN COMPONENT (with fixes)
// ------------------------------------------------------
export default function On_Page_SEO() {
  const { data, loading } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  // ⭐ BUG FIX #1: Added "!data" check to prevent crash on initial load
  // when `data` is null and `loading` is true.
  if (loading || !data || data.Status === "inprogress") {
    return <OnPageSeoShimmer darkMode={darkMode} />;
  }
  
  // Now it's safe to access data
  const seo = data?.On_Page_SEO || {};

  const textColor = darkMode ? "text-white" : "text-gray-900";
  const mainCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";

  const desc = {
    title: "The HTML <title> defines the page’s main topic and appears on search results. Ideal length: 30–60 characters.",
    meta: "Meta description summarizes the page content. Ideal length: 50–160 characters, concise and keyword-optimized.",
    url: "Short, keyword-focused, hyphen-separated URLs are easier to read and rank better.",
    canonical: "Canonical tags prevent duplicate content issues by pointing to the original page version.",
    h1: "Each page should have exactly one H1 that clearly represents the main topic.",
    image: "Images should include meaningful alt text and be optimized for faster loading.",
    video: "Embedded videos improve engagement but should use lazy-loading and metadata.",
    heading: "Proper heading hierarchy (H1 → H2 → H3) improves readability and SEO structure.",
    alt: "Alt text should describe image purpose and include relevant keywords.",
    semantic: "Semantic tags (article, header, footer, section) improve content structure and accessibility.",
    structured: "Schema markup helps search engines understand content for rich snippets.",
    https: "HTTPS ensures secure communication and improves trust and SEO ranking.",
    pagination: "Pagination tags (rel=next/prev) help crawlers understand multi-page content.",
    links: "Internal links should use descriptive anchor text and connect related pages.",
    duplicate: "Unique content is critical. Avoid duplicating text across multiple pages.",
    slug: "SEO-friendly slugs are lowercase, hyphenated, and concise.",
  };
const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;
  return (
    <div className="relative flex w-full h-full min-h-screen">
      {data?.Report === "All" && (
      <div className={`${sidebarClass} lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}>
          <Sidebar darkMode={darkMode} />
        </div>
      )}

      <main
        className={`flex-1 ${
            // ⭐ BUG FIX #2: Conditionally apply margin ONLY if sidebar is present
            data?.Report === "All" ? "lg:ml-64" : ""
          } flex flex-col items-center pt-20 pb-12 px-4 space-y-8 ${
          darkMode ? "bg-gray-900" : "bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50"
        }`}
      >
        {/* Header */}
        <div
          className={`w-full ${data.Report=="All" ? "max-w-4xl" : "max-w-6xl"} p-8 rounded-2xl shadow-2xl border-l-8 border-indigo-500 ${mainCardBg}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className={`text-5xl font-black ${textColor} mb-2 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent`}
              >
                On-Page SEO
              </h2>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Detailed analysis of your website’s on-page optimization factors
              </p>
            </div>
            <CircularProgress value={seo?.Percentage || 0} size={80} stroke={6} />
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
            Time Taken — {data.Time_Taken}
          </div>
        </div>

        {/* 🧠 Section 1: Content Essentials */}
        <Section title="Content Essentials" icon="🧠" color="indigo" textColor={textColor}>
          <MetricCard title="Title Tag" description={desc.title} score={seo.Title?.Score} value={seo.Title?.Title_Length + " chars"} darkMode={darkMode} icon="🏷️" />
          <MetricCard title="Meta Description" description={desc.meta} score={seo.Meta_Description?.Score} value={seo.Meta_Description?.MetaDescription_Length + " chars"} darkMode={darkMode} icon="📝" />
          <MetricCard title="URL Structure" description={desc.url} score={seo.URL_Structure?.Score} value={seo.URL_Structure?.Score ? "Clean" : "Poor"} darkMode={darkMode} icon="🔗" />
          <MetricCard title="Canonical Tag" description={desc.canonical} score={seo.Canonical?.Score} value={seo.Canonical?.Score ? "Valid" : "Missing"} darkMode={darkMode} icon="📜" />
          <MetricCard title="H1 Tag" description={desc.h1} score={seo.H1?.Score} value={"H1 Count-"+(seo.H1?.H1_Count || 0)} darkMode={darkMode} icon="🔠" />
        </Section>

        {/* 🖼️ Section 2: Media & Accessibility */}
        <Section title="Media & Accessibility" icon="🖼️" color="purple" textColor={textColor}>
      {seo.Image?.Image_Exist!=0 && <MetricCard title="Image Optimization" description={desc.image} score={seo.Image?.Image_Alt_Meaningfull_Exist} value={seo.Image?.Image_Alt_Meaningfull_Exist ? "Optimized" : "Missing Alt"} darkMode={darkMode} icon="🖼️" />}    
         {seo.Video?.Video_Exist!=0 && <MetricCard title="Video Implementation" description={desc.video} score={seo.Video?.Video_Exist} value={seo.Video?.Video_Exist ? "Present" : "Missing"} darkMode={darkMode} icon="🎥" />} 
          <MetricCard title="ALT Text Relevance" description={desc.alt} score={seo.ALT_Text_Relevance?.Score} value={seo.ALT_Text_Relevance?.Score ? "Relevant" : "Irrelevant"} darkMode={darkMode} icon="🪶" />
        </Section>

        {/* 🏗️ Section 3: Structure & Semantics */}
        <Section title="Structure & Semantics" icon="🏗️" color="green" textColor={textColor}>
          <MetricCard
  title="Heading Hierarchy"
  description={desc.heading
  }
  heading={seo.Heading_Hierarchy?.Heading}
  score={seo.Heading_Hierarchy?.Score}
  value={seo.Heading_Hierarchy?.Score ? "Proper" : "Needs Fix"}
  darkMode={darkMode}
  icon="📚"
/>

          <MetricCard title="Semantic HTML Tags" description={desc.semantic} score={seo.Semantic_Tags?.Article_Score} value={seo.Semantic_Tags?.Article_Score ? "Present" : "Missing"} darkMode={darkMode} icon="📄" />
          <MetricCard title="Structured Data" description={desc.structured} score={seo.Structured_Data?.Score} value={seo.Structured_Data?.Score ? "Added" : "Missing"} darkMode={darkMode} icon="🧩" />
        </Section>

        {/* ⚙️ Section 4: Technical SEO */}
        <Section title="Technical SEO" icon="⚙️" color="blue" textColor={textColor}>
          <MetricCard title="HTTPS" description={desc.https} score={seo.HTTPS?.Score} value={seo.HTTPS?.Score ? "Secure" : "Insecure"} darkMode={darkMode} icon="🔒" />
          <MetricCard title="Pagination Tags" description={desc.pagination} score={seo.Pagination_Tags?.Score} value={seo.Pagination_Tags?.Score ? "Present" : "Missing"} darkMode={darkMode} icon="📑" />
          <MetricCard title="Internal Links" description={desc.links} score={seo.Internal_Links?.Descriptive_Score} value={seo.Internal_Links?.Total || 0} darkMode={darkMode} icon="🧭" />
          <MetricCard title="Duplicate Content" description={desc.duplicate} score={seo.Duplicate_Content?.Score} value={seo.Duplicate_Content?.Score ? "Unique" : "Duplicate"} darkMode={darkMode} icon="🧬" />
          <MetricCard title="URL Slugs" description={desc.slug} score={seo.URL_Slugs?.Slug_Check_Score} value={seo.URL_Slugs?.Slug_Check_Score ? "Valid" : "Invalid"} darkMode={darkMode} icon="🧾" />
        </Section>
<div className={`w-full ${data.Report=="All" ? "max-w-4xl" : "max-w-6xl"} p-6 rounded-2xl shadow-lg ${mainCardBg} border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
      <SchemaCard schema={data.Schema} />
    </div>
        {/* Dropdowns */}
        <AuditDropdown items={seo?.Passed} title="✅ Passed Audits" darkMode={darkMode} />
        <AuditDropdown items={seo?.Improvements} title="⚠️ Improvements Needed" darkMode={darkMode} />
      </main>
    </div>
  );
}

// ------------------------------------------------------
// ✅ Helper Component for SchemaCard
// ------------------------------------------------------
function SchemaCard({ schema }) {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  return (
    // Note: Removed redundant container styles, as parent div now handles width/bg
    <>
      <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
        Schema Data
      </h2>

      <pre className={`p-4 rounded-xl text-sm overflow-x-auto whitespace-pre-wrap ${darkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
        {JSON.stringify(schema, null, 2)}
      </pre>
    </>
  );
}

// ------------------------------------------------------
// ✅ Helper Component for Section Layouts (FIXED)
// ------------------------------------------------------
function Section({ title, icon, color, children, textColor }) {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  
  // --- ✅ FIX 1: Destructure 'data' ---
  const { data } = useData();
  
  const mainCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  
  // --- ✅ FIX 2: Tailwind Production Build Fix (Color Map) ---
  const borderColorMap = {
    indigo: "border-indigo-500",
    purple: "border-purple-500",
    green: "border-green-500",
    blue: "border-blue-500",
  };

  return (
    <div
      className={`w-full p-8 rounded-2xl shadow-2xl border-l-8 ${mainCardBg}
        ${/* --- FIX 3: Use optional chaining 'data?.Report' --- */''}
        ${data?.Report === "All" ? "max-w-4xl" : "max-w-6xl"}
        ${/* --- FIX 2 (Applied): Use color map --- */''}
        ${borderColorMap[color] || "border-gray-500"}
      `}
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{icon}</span>
        <h2 className={`text-2xl font-bold ${textColor}`}>{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
    </div>
  );
}


function HeadingHierarchyCard({ data }) {

  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const getIndent = (tag) => {
    switch (tag) {
      case "h1": return "ml-0";
      case "h2": return "ml-4";
      case "h3": return "ml-8";
      case "h4": return "ml-12";
      default: return "ml-0";
    }
  };

  // Reduced font sizes
  const getFont = (tag) => {
    switch (tag) {
      case "h1": return "text-xl font-bold";     // smaller than before
      case "h2": return "text-lg font-semibold";
      case "h3": return "text-base font-medium";
      case "h4": return "text-sm";
      default: return "text-sm";
    }
  };

  return (
    <div
      className={`w-full max-w-3xl mx-auto shadow-lg rounded-2xl p-4 space-y-4 
      ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}
    >

      <h2 className="text-lg font-bold mb-4 text-blue-600 dark:text-blue-400">Headings Structure</h2>

      <div
        className={`space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin 
        ${darkMode ? "scrollbar-thumb-gray-600" : "scrollbar-thumb-gray-400"}`}
      >
        {data?.map((item, index) => {
          // Handle cases where item or item.tag might be null/undefined
          if (!item || !item.tag) return null;
          
          const Tag = item.tag;
          return (
            <div
              key={index}
              className={`${getIndent(item.tag)} border-l-2 pl-3 
              ${darkMode ? "border-gray-700" : "border-gray-300"}`}
            >

              <div className="flex items-center space-x-2">

                {/* tag like <h1> */}
                <span className={`font-mono text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  &lt;{item.tag}&gt;
                </span>

                {/* actual smaller heading */}
                {React.createElement(
                  Tag,
                  { className: `${getFont(item.tag)} leading-tight inline-block ${darkMode ? "text-gray-200" : "text-gray-800"}` },
                  item.text
                )}

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}