import React, { useContext, useState } from "react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import Sidebar from "../Component/Sidebar";

// ------------------------------------------------------
// ✅ Skeleton for Loading
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

function OnPageSeoShimmer({ darkMode }) {
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
        <main className="flex-1 lg:ml-64 flex flex-col justify-center items-center pt-20 pb-8 px-4 space-y-8">
          <SkeletonMetricCard />
          <SkeletonMetricCard />
        </main>
      </div>
    </div>
  );
}

// ------------------------------------------------------
// ✅ MetricCard Component
// ------------------------------------------------------
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
        transition-all duration-300 hover:shadow-2xl hover:-translate-y-1
        ${isHovered ? "scale-[1.02]" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 
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
          className={`text-3xl font-extrabold mb-4 ${valueColor} transition-all duration-300 ${
            isHovered ? "scale-110" : ""
          }`}
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
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ MAIN COMPONENT
// ------------------------------------------------------
export default function On_Page_SEO() {
  const { data, loading } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const seo = data?.On_Page_SEO || {};

  if (loading) {
    return <OnPageSeoShimmer darkMode={darkMode} />;
  }

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
        className={`flex-1 lg:ml-64 flex flex-col items-center pt-20 pb-12 px-4 space-y-8 ${
          darkMode ? "bg-gray-900" : "bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50"
        }`}
      >
        {/* Header */}
        <div
          className={`w-full max-w-4xl p-8 rounded-2xl shadow-2xl border-l-8 border-indigo-500 ${mainCardBg}`}
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
        </div>

        {/* 🧠 Section 1: Content Essentials */}
        <Section title="Content Essentials" icon="🧠" color="indigo" textColor={textColor}>
          <MetricCard title="Title Tag" description={desc.title} score={seo.Title?.Score} value={seo.Title?.Title_Length + " chars"} darkMode={darkMode} icon="🏷️" />
          <MetricCard title="Meta Description" description={desc.meta} score={seo.Meta_Description?.Score} value={seo.Meta_Description?.MetaDescription_Length + " chars"} darkMode={darkMode} icon="📝" />
          <MetricCard title="URL Structure" description={desc.url} score={seo.URL_Structure?.Score} value={seo.URL_Structure?.Score ? "Clean" : "Poor"} darkMode={darkMode} icon="🔗" />
          <MetricCard title="Canonical Tag" description={desc.canonical} score={seo.Canonical?.Score} value={seo.Canonical?.Score ? "Valid" : "Missing"} darkMode={darkMode} icon="📜" />
          <MetricCard title="H1 Tag" description={desc.h1} score={seo.H1?.Score} value={seo.H1?.H1_Count || 0} darkMode={darkMode} icon="🔠" />
        </Section>

        {/* 🖼️ Section 2: Media & Accessibility */}
        <Section title="Media & Accessibility" icon="🖼️" color="purple" textColor={textColor}>
          <MetricCard title="Image Optimization" description={desc.image} score={seo.Image?.Image_Alt_Meaningfull_Exist} value={seo.Image?.Image_Alt_Meaningfull_Exist ? "Optimized" : "Missing Alt"} darkMode={darkMode} icon="🖼️" />
          <MetricCard title="Video Implementation" description={desc.video} score={seo.Video?.Video_Exist} value={seo.Video?.Video_Exist ? "Present" : "Missing"} darkMode={darkMode} icon="🎥" />
          <MetricCard title="ALT Text Relevance" description={desc.alt} score={seo.ALT_Text_Relevance?.Score} value={seo.ALT_Text_Relevance?.Score ? "Relevant" : "Irrelevant"} darkMode={darkMode} icon="🪶" />
        </Section>

        {/* 🏗️ Section 3: Structure & Semantics */}
        <Section title="Structure & Semantics" icon="🏗️" color="green" textColor={textColor}>
          <MetricCard title="Heading Hierarchy" description={desc.heading} score={seo.Heading_Hierarchy?.Score} value={seo.Heading_Hierarchy?.Score ? "Proper" : "Needs Fix"} darkMode={darkMode} icon="📚" />
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

        {/* Dropdowns */}
        <AuditDropdown items={seo?.Passed} title="✅ Passed Audits" darkMode={darkMode} />
        <AuditDropdown items={seo?.Improvements} title="⚠️ Improvements Needed" darkMode={darkMode} />
      </main>
    </div>
  );
}

// ------------------------------------------------------
// ✅ Helper Component for Section Layouts
// ------------------------------------------------------
function Section({ title, icon, color, children, textColor }) {
  return (
    <div
      className={`w-full max-w-4xl p-8 rounded-2xl shadow-2xl border-l-8 border-${color}-500`}
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{icon}</span>
        <h2 className={`text-2xl font-bold ${textColor}`}>{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
    </div>
  );
}
