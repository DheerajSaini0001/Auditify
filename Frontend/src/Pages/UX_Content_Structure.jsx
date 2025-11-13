import React, { useContext } from "react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import Sidebar from "../Component/Sidebar";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";

// ------------------------------------------------------
// ✅ Skeleton Loader
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

function UxShimmer({ darkMode }) {
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
// ✅ MetricCard (Expandable Animated Card)
// ------------------------------------------------------
const MetricCard = ({ title, description, score, darkMode, icon }) => {
  const [showDescription, setShowDescription] = React.useState(false);
  const isPassed = Boolean(score);

  const titleColor = darkMode ? "text-white" : "text-gray-900";
  const descriptionColor = darkMode ? "text-gray-300" : "text-gray-600";
  const valueColor = isPassed
    ? "text-green-500 dark:text-green-400"
    : "text-red-500 dark:text-red-400";
  const cardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-gray-50 to-white";

  const statusText = isPassed ? "Good" : "Needs Improvement";
  const statusColor = isPassed
    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
    : "bg-gradient-to-r from-red-500 to-rose-600 text-white";

  return (
    <div
      className={`group relative p-6 rounded-xl shadow-lg ${cardBg}
      border ${darkMode ? "border-gray-700" : "border-gray-200"}
      transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}
    >
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <h3 className={`text-lg font-bold ${titleColor}`}>{title}</h3>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${statusColor}`}
          >
            {statusText}
          </span>
        </div>

        <div className={`text-2xl font-bold mb-4 ${valueColor}`}>
          {isPassed ? "✅ Pass" : "⚠️ Check"}
        </div>

        <button
          onClick={() => setShowDescription(!showDescription)}
          className={`w-full mt-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
            darkMode
              ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white"
              : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white"
          }`}
        >
          {showDescription ? "Hide Details" : "Show Details"}
        </button>

        {showDescription && (
          <p
            className={`mt-4 text-sm ${descriptionColor} border-t ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } pt-4`}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Section Wrapper Component
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

// ------------------------------------------------------
// ✅ MAIN COMPONENT — UX & Content Structure
// ------------------------------------------------------
export default function UX_Content_Structure() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const darkMode = theme === "dark";
  const metric = data?.UX_or_Content_Structure || {};

  if (loading || data.Status === "inprogress") {
    return <UxShimmer darkMode={darkMode} />;
  }

  const textColor = darkMode ? "text-white" : "text-gray-900";
  const mainCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";

  // 📋 Descriptions for UX Metrics
  const desc = {
    Navigation_Clarity: "Evaluates clarity and ease of navigation for users.",
    Breadcrumbs: "Checks breadcrumb availability to guide user location.",
    Clickable_Logo: "Ensures the site logo links back to the homepage.",
    Mobile_Responsiveness: "Checks site’s adaptability to mobile devices.",
    Font_Style_and_Size_Consistency: "Evaluates consistent typography across sections.",
    Whitespace_Usage: "Assesses proper spacing and visual balance.",
    Paragraph_Length_and_Spacing: "Checks optimal paragraph readability and spacing.",
    Contrast_and_Color_Harmony: "Ensures color contrast and harmony improve UX.",
    Content_Relevance: "Analyzes if page content aligns with user intent.",
    Call_to_Action_Clarity: "Verifies clear and visually distinct CTAs.",
    Multimedia_Balance: "Ensures balanced use of text, images, and videos.",
    Error_and_Empty_State_Handling: "Checks user feedback for errors or empty states.",
    Interactive_Feedback: "Ensures UI responds visibly to user interactions.",
    Sticky_Navigation: "Checks fixed navigation availability for better UX.",
    Scroll_Depth_Logic: "Analyzes scroll-based content logic for engagement.",
    Loading_Indicators: "Ensures visual loading indicators exist.",
    Internal_Linking_Quality: "Evaluates internal links for usability and SEO flow.",
    User_Journey_Continuity: "Ensures smooth transition between pages or actions.",
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
          darkMode
            ? "bg-gray-900"
            : "bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50"
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
                UX & Content Structure
              </h2>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Evaluate clarity, readability, interactivity, and overall user experience of your site.
              </p>
            </div> 
            <CircularProgress value={metric?.Percentage || 0} size={80} stroke={6} />
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

        {/* 🧭 Section 1: Navigation & Layout */}
        <Section title="Navigation & Layout" icon="🧭" color="blue" textColor={textColor}>
          {["Navigation_Clarity", "Breadcrumbs", "Clickable_Logo", "Sticky_Navigation", "Scroll_Depth_Logic"].map((key) => (
            <MetricCard key={key} title={key.replaceAll("_", " ")} description={desc[key]} score={metric[key]?.Score} darkMode={darkMode} icon="📂" />
          ))}
        </Section>

        {/* 📖 Section 2: Readability & Design */}
        <Section title="Readability & Design" icon="🎨" color="purple" textColor={textColor}>
          {[
            "Mobile_Responsiveness",
            "Font_Style_and_Size_Consistency",
            "Whitespace_Usage",
            "Paragraph_Length_and_Spacing",
            "Contrast_and_Color_Harmony",
          ].map((key) => (
            <MetricCard key={key} title={key.replaceAll("_", " ")} description={desc[key]} score={metric[key]?.Score} darkMode={darkMode} icon="📝" />
          ))}
        </Section>

        {/* ⚡ Section 3: Content & Interaction */}
        <Section title="Content & Interaction" icon="⚡" color="green" textColor={textColor}>
          {[
            "Content_Relevance",
            "Call_to_Action_Clarity",
            "Multimedia_Balance",
            "Error_and_Empty_State_Handling",
            "Interactive_Feedback",
            "Loading_Indicators",
            "Internal_Linking_Quality",
            "User_Journey_Continuity",
          ].map((key) => (
            <MetricCard key={key} title={key.replaceAll("_", " ")} description={desc[key]} score={metric[key]?.Score} darkMode={darkMode} icon="💡" />
          ))}
        </Section>

        {/* Dropdowns */}
        <AuditDropdown items={metric?.Passed} title="✅ Passed Audits" darkMode={darkMode} />
        <AuditDropdown items={metric?.Warning} title="⚠️ Warnings" darkMode={darkMode} />
        <AuditDropdown items={metric?.Improvements} title="🚫 Improvements Needed" darkMode={darkMode} />
      </main>
    </div>
  );
}
