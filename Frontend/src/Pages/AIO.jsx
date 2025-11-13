import React, { useContext } from "react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import Sidebar from "../Component/Sidebar";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";

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

function AIOShimmer({ darkMode }) {
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
// ✅ Reusable Metric Card (SEO-style)
// ------------------------------------------------------
const MetricCard = ({ title, description, score, value, darkMode, icon }) => {
  const [showDescription, setShowDescription] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const isPassed = Boolean(score);

  const titleColor = darkMode ? "text-white" : "text-gray-900";
  const descriptionColor = darkMode ? "text-gray-300" : "text-gray-600";
  const valueColor = isPassed
    ? "text-green-500 dark:text-green-400"
    : "text-red-500 dark:text-red-400";
  const cardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-gray-50 to-white";

  const statusText = isPassed ? "Optimized" : "Needs Work";
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
        className={`absolute inset-0 rounded-xl opacity-0  ${
          isPassed
            ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10"
            : "bg-gradient-to-br from-red-500/10 to-rose-500/10"
        }`}
      ></div>

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

        <div
          className={`text-3xl font-extrabold mb-4 ${valueColor} transition-all duration-300 `}
        >
          {value ?? "--"}
        </div>

        <button
          onClick={() => setShowDescription(!showDescription)}
          className={`w-full mt-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
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
// ✅ Section Component
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
// ✅ MAIN COMPONENT — AIO READINESS
// ------------------------------------------------------
export default function AIO() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const darkMode = theme === "dark";
  const aio = data?.AIO_Readiness || {};

  if (loading || data.Status === "inprogress") {
    return <AIOShimmer darkMode={darkMode} />;
  }

  const textColor = darkMode ? "text-white" : "text-gray-900";
  const mainCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";

  // ✅ Descriptions for all 18 parameters
  const desc = {
    Structured_Data: "Checks structured data and schema for AI interpretability.",
    Metadata_Complete: "Ensures all pages have complete metadata (title, desc, tags).",
    Fast_Page_Load: "Analyzes page load speed crucial for AI crawlers.",
    API_Data_Access: "Verifies if structured API endpoints are accessible to AI systems.",
    Dynamic_Content_Available: "Checks if content dynamically updates based on behavior.",
    Multilingual_Support: "Ensures AI can interpret language variants correctly.",
    Content_NLP_Friendly: "Tests content structure for NLP (Natural Language Processing) readiness.",
    Keywords_Entities_Annotated: "Validates semantic annotations and keyword tagging.",
    Content_Updated_Regularly: "Monitors frequency of content updates for freshness.",
    Internal_Linking_AI_Friendly: "Checks internal link structure optimized for AI understanding.",
    Duplicate_Content_Detection_Ready: "Detects duplicate text readiness for AI deduplication.",
    Behavior_Tracking_Implemented: "Verifies user behavior data collection (GDPR compliant).",
    Segmentation_Profiling_Ready: "Checks segmentation setup for AI-driven audience profiling.",
    Event_Goal_Tracking_Integrated: "Validates event/goal tracking systems (GA4, conversions).",
    AB_Testing_Ready: "Ensures site supports AI-driven A/B testing frameworks.",
    User_Feedback_Loops_Present: "Checks for review, rating, or feedback mechanisms.",
    Dynamic_Personalization: "Evaluates AI-based personalization systems for users.",
    AI_Content_Distribution: "Analyzes automation of content distribution via AI channels.",
    AI_Friendly_Structure: "Final evaluation of overall AI-readiness and code structure.",
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
                AIO Readiness
              </h2>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Evaluate your website’s AI optimization — structure, speed, automation, and readiness for AI-driven tools.
              </p>
            </div>
            <CircularProgress value={aio?.Percentage || 0} size={80} stroke={6} />
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

        {/* Sections */}
        <Section title="AI Data & Structure" icon="🧠" color="blue" textColor={textColor}>
          <MetricCard title="Structured Data" description={desc.Structured_Data} score={aio.Structured_Data?.Score} value={aio.Structured_Data?.Score ? "Present" : "Missing"} darkMode={darkMode} icon="🧩" />
          <MetricCard title="Metadata Complete" description={desc.Metadata_Complete} score={aio.Metadata_Complete?.Score} value={aio.Metadata_Complete?.Score ? "Yes" : "No"} darkMode={darkMode} icon="🏷️" />
          <MetricCard title="Fast Page Load" description={desc.Fast_Page_Load} score={aio.Fast_Page_Load?.Score} value={aio.Fast_Page_Load?.Score ? "Fast" : "Slow"} darkMode={darkMode} icon="⚡" />
          <MetricCard title="API Data Access" description={desc.API_Data_Access} score={aio.API_Data_Access?.Score} value={aio.API_Data_Access?.Score ? "Accessible" : "Restricted"} darkMode={darkMode} icon="🔌" />
          <MetricCard title="Dynamic Content" description={desc.Dynamic_Content_Available} score={aio.Dynamic_Content_Available?.Score} value={aio.Dynamic_Content_Available?.Score ? "Available" : "Missing"} darkMode={darkMode} icon="🔄" />
        </Section>

        <Section title="AI Content Intelligence" icon="🧬" color="green" textColor={textColor}>
          <MetricCard title="Multilingual Support" description={desc.Multilingual_Support} score={aio.Multilingual_Support?.Score} value={aio.Multilingual_Support?.Score ? "Enabled" : "Disabled"} darkMode={darkMode} icon="🌐" />
          <MetricCard title="Content NLP Friendly" description={desc.Content_NLP_Friendly} score={aio.Content_NLP_Friendly?.Score} value={aio.Content_NLP_Friendly?.Score ? "Optimized" : "Poor"} darkMode={darkMode} icon="🧩" />
          <MetricCard title="Keyword Entities Annotated" description={desc.Keywords_Entities_Annotated} score={aio.Keywords_Entities_Annotated?.Score} value={aio.Keywords_Entities_Annotated?.Score ? "Yes" : "No"} darkMode={darkMode} icon="🔤" />
          <MetricCard title="Content Updated Regularly" description={desc.Content_Updated_Regularly} score={aio.Content_Updated_Regularly?.Score} value={aio.Content_Updated_Regularly?.Score ? "Yes" : "No"} darkMode={darkMode} icon="🕒" />
          <MetricCard title="Internal Linking AI Friendly" description={desc.Internal_Linking_AI_Friendly} score={aio.Internal_Linking_AI_Friendly?.Score} value={aio.Internal_Linking_AI_Friendly?.Score ? "Good" : "Needs Work"} darkMode={darkMode} icon="🔗" />
        </Section>

        <Section title="AI Analytics & Automation" icon="⚙️" color="purple" textColor={textColor}>
          <MetricCard title="Duplicate Content Detection Ready" description={desc.Duplicate_Content_Detection_Ready} score={aio.Duplicate_Content_Detection_Ready?.Score} value={aio.Duplicate_Content_Detection_Ready?.Score ? "Ready" : "Not Ready"} darkMode={darkMode} icon="📚" />
          <MetricCard title="Behavior Tracking Implemented" description={desc.Behavior_Tracking_Implemented} score={aio.Behavior_Tracking_Implemented?.Score} value={aio.Behavior_Tracking_Implemented?.Score ? "Active" : "Missing"} darkMode={darkMode} icon="👁️" />
          <MetricCard title="Segmentation Profiling Ready" description={desc.Segmentation_Profiling_Ready} score={aio.Segmentation_Profiling_Ready?.Score} value={aio.Segmentation_Profiling_Ready?.Score ? "Ready" : "Not Ready"} darkMode={darkMode} icon="📊" />
          <MetricCard title="Event & Goal Tracking" description={desc.Event_Goal_Tracking_Integrated} score={aio.Event_Goal_Tracking_Integrated?.Score} value={aio.Event_Goal_Tracking_Integrated?.Score ? "Integrated" : "Missing"} darkMode={darkMode} icon="🎯" />
          <MetricCard title="A/B Testing Ready" description={desc.AB_Testing_Ready} score={aio.AB_Testing_Ready?.Score} value={aio.AB_Testing_Ready?.Score ? "Yes" : "No"} darkMode={darkMode} icon="🧪" />
        </Section>

        <Section title="AI Personalization & Feedback" icon="💡" color="orange" textColor={textColor}>
          <MetricCard title="User Feedback Loops" description={desc.User_Feedback_Loops_Present} score={aio.User_Feedback_Loops_Present?.Score} value={aio.User_Feedback_Loops_Present?.Score ? "Present" : "Missing"} darkMode={darkMode} icon="💬" />
          <MetricCard title="Dynamic Personalization" description={desc.Dynamic_Personalization} score={aio.Dynamic_Personalization?.Score} value={aio.Dynamic_Personalization?.Score ? "Enabled" : "Disabled"} darkMode={darkMode} icon="🤖" />
          <MetricCard title="AI Content Distribution" description={desc.AI_Content_Distribution} score={aio.AI_Content_Distribution?.Score} value={aio.AI_Content_Distribution?.Score ? "Automated" : "Manual"} darkMode={darkMode} icon="🚀" />
          <MetricCard title="AI-Friendly Structure" description={desc.AI_Friendly_Structure} score={aio.AI_Friendly_Structure?.Score} value={aio.AI_Friendly_Structure?.Score ? "Optimized" : "Poor"} darkMode={darkMode} icon="🏗️" />
        </Section>

        {/* Dropdowns */}
        <AuditDropdown items={aio?.Passed} title="✅ Passed Audits" darkMode={darkMode} />
        <AuditDropdown items={aio?.Warning} title="⚠️ Warnings" darkMode={darkMode} />
        <AuditDropdown items={aio?.Improvements} title="🚫 Improvements Needed" darkMode={darkMode} />
      </main>
    </div>
  );
}
