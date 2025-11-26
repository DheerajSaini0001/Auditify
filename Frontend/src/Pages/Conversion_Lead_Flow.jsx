import React, { useContext, useState } from "react"; // Added useState
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";

import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";

// ------------------------------------------------------
// ✅ NEW: High-Fidelity Skeleton Components
// ------------------------------------------------------
const SkeletonSidebar = ({ darkMode }) => (
  <div
    className={`fixed top-0 mt-16 left-0 h-full w-64 ${darkMode ? "bg-gray-900" : "bg-white"
      } shadow-lg p-6`}
  >
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className={`h-7 rounded mb-5 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-300"
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
  const { data } = useData();
  const shimmerCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";
  return (
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
  const { data } = useData();
  const shimmerCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
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
  const { data } = useData();
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const border = darkMode ? "border-gray-700" : "border-gray-200";
  return (
    <div className={`w-full ${data?.Report === "All" ? "  " : " "} p-5 rounded-lg shadow-xl ${shimmerCardBg} border ${border}`}>
      <div className={`h-6 w-1/3 rounded ${shimmerBg}`}></div>
    </div>
  );
};

/**
 * ✅ REPLACED: This is the new, high-fidelity shimmer component
 * that mimics your final page layout perfectly.
 */
function ConversionShimmer({ darkMode }) {
  const { data } = useData(); // Get data for conditional layout
  const mainBg = darkMode
    ? "bg-gray-900"
    : "bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50";

  return (
    <div className={`relative flex w-full h-full min-h-screen ${mainBg} animate-pulse`}>
      {/* Conditional Sidebar */}
      {data?.Report === "All" && <SkeletonSidebar darkMode={darkMode} />}

      {/* Main content area with conditional margin */}
      <main className={`flex-1 ${data?.Report === "All" ? "lg:ml-64" : ""} flex flex-col items-center pt-20 pb-12 px-4 space-y-8`}>

        {/* 1. Header Card */}
        <SkeletonHeaderCard darkMode={darkMode} />

        {/* 2. Section 1 (12 metrics) - show 8 */}
        <SkeletonSectionCard metricCount={8} darkMode={darkMode} />

        {/* 3. Section 2 (9 metrics) - show 6 */}
        <SkeletonSectionCard metricCount={6} darkMode={darkMode} />

        {/* 4. Section 3 (10 metrics) - show 6 */}
        <SkeletonSectionCard metricCount={6} darkMode={darkMode} />

        {/* 5. Dropdowns (3 of them) */}
        <SkeletonAuditDropdown darkMode={darkMode} />
        <SkeletonAuditDropdown darkMode={darkMode} />
        <SkeletonAuditDropdown darkMode={darkMode} />
      </main>
    </div>
  );
}

// ------------------------------------------------------
// ✅ Metric Card (Reusable UI Component)
// ------------------------------------------------------
const MetricCard = ({ title, description, score, darkMode, icon }) => {
  const [showDescription, setShowDescription] = useState(false); // Use useState from import
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

  const statusText = isPassed ? "Optimized" : "Needs Fix";
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
        className={`absolute inset-0 rounded-xl opacity-0   ${isPassed
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

        <div className={`text-2xl font-bold mb-4 ${valueColor}`}>
          {isPassed ? "✓ Good" : "⚠️ Check"}
        </div>

        <button
          onClick={() => setShowDescription(!showDescription)}
          className={`w-full mt-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${darkMode
            ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white"
            : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white"
            }`}
        >
          {showDescription ? "Hide Details" : "Show Details"}
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${showDescription ? "max-h-96 mt-4" : "max-h-0"
            }`}
        >
          <p
            className={`text-sm ${descriptionColor} border-t ${darkMode ? "border-gray-700" : "border-gray-200"
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
// ✅ Section Component (FIXED)
// ------------------------------------------------------
function Section({ title, icon, color, children, textColor }) {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  // --- ✅ FIX 1: Destructure 'data' ---
  const { data } = useData();

  // --- ✅ FIX 2: Add mainCardBg for consistent UI ---
  const mainCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";

  // --- ✅ FIX 3: Tailwind Production Build Fix (Color Map) ---
  const borderColorMap = {
    indigo: "border-indigo-500",
    purple: "border-purple-500",
    green: "border-green-500",
    blue: "border-blue-500",
  };

  return (
    <div
      className={`w-full p-8 rounded-2xl shadow-2xl border-l-8 ${mainCardBg}
        ${/* --- ✅ FIX 4: Use optional chaining 'data?.Report' --- */''}
        ${data?.Report === "All" ? "  " : " "}
        ${/* --- ✅ FIX 3 (Applied): Use color map --- */''}
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

// ------------------------------------------------------
// ✅ MAIN COMPONENT (FIXED)
// ------------------------------------------------------
export default function Conversion_Lead_Flow() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const darkMode = theme === "dark";

  // --- ✅ FIX 1: Add '!data' check to prevent crash ---
  if (loading || !data || data.Status === "inprogress") {
    return <ConversionShimmer darkMode={darkMode} />;
  }

  // Now it's safe to access data
  const flow = data?.Conversion_and_Lead_Flow || {};

  const textColor = darkMode ? "text-white" : "text-gray-900";
  const mainCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";

  const desc = {
    CTA_Visibility: "Checks if primary CTAs are visible and above the fold.",
    CTA_Clarity: "Evaluates if CTAs clearly communicate the intended action.",
    CTA_Contrast: "Assesses color contrast and visual distinction of CTAs.",
    CTA_Crowding: "Ensures CTAs are well-spaced and not cluttered.",
    CTA_Flow_Alignment: "Checks if CTAs are placed in a natural reading flow.",
    Form_Presence: "Verifies that forms exist on key conversion pages.",
    Form_Length: "Measures form complexity; shorter forms convert better.",
    Required_vs_Optional_Fields: "Ensures clarity between mandatory and optional fields.",
    Inline_Validation: "Checks for real-time field validation to reduce form errors.",
    Submit_Button_Clarity: "Analyzes visibility and clarity of the submit button.",
    AutoFocus_Field: "Ensures the cursor auto-focuses on the first field.",
    MultiStep_Form_Progress: "Checks multi-step form usability and progress visibility.",
    Testimonials: "Validates presence of customer testimonials for trust.",
    Reviews: "Checks for product/service reviews to build credibility.",
    Trust_Badges: "Detects security/trust badges improving confidence.",
    Client_Logos: "Verifies display of notable client logos.",
    Case_Studies_Accessibility: "Checks accessibility of case studies or portfolios.",
    Exit_Intent_Triggers: "Detects exit intent popups or re-engagement triggers.",
    Lead_Magnets: "Checks for offers like free downloads, demos, or resources.",
    Contact_Info_Visibility: "Ensures phone/email info is clearly visible.",
    Chatbot_Presence: "Verifies chatbot or instant support availability.",
    Interactive_Elements: "Checks interactive engagement tools like quizzes/sliders.",
    Personalization: "Assesses AI-based or dynamic personalization presence.",
    Progress_Indicators: "Validates progress bars or indicators during steps.",
    Friendly_Error_Handling: "Ensures clear error messages and input feedback.",
    Microcopy_Clarity: "Checks clarity of helper text and microcopy messages.",
    Incentives_Displayed: "Verifies incentive display like discounts or offers.",
    Scarcity_Urgency: "Checks use of urgency triggers (limited time/stock).",
    Smooth_Scrolling: "Ensures smooth scrolling enhances UX flow.",
    Mobile_CTA_Adaptation: "Checks if CTAs are optimized for mobile users.",
    MultiChannel_FollowUp: "Verifies multi-channel follow-up strategies post-lead.",
  };

  return (
    <div className="relative flex w-full h-full min-h-screen">
      <main
        className={`flex-1 flex flex-col items-center pt-20 pb-12 px-4 space-y-8 ${darkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50"
          }`}
      >
        {/* Header */}
        <div
          // --- ✅ FIX 3: Add conditional max-width ---
          className={`w-full ${data?.Report === "All" ? "  " : " "} p-8 rounded-2xl shadow-2xl border-l-8 border-indigo-500 ${mainCardBg}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className={`text-3xl sm:text-5xl font-black ${textColor} mb-2 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent`}
              >
                Conversion & Lead Flow
              </h2>
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
              >
                Analyze conversion optimization, UX flow, and lead capture readiness.
              </p>
            </div>
            <CircularProgress value={flow?.Percentage || 0} size={80} stroke={6} />
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

        {/* 🔵 Section 1: CTA & Forms */}
        <Section title="Call-to-Actions & Forms" icon="🧭" color="blue" textColor={textColor}>
          {Object.entries({
            CTA_Visibility: "🚀",
            CTA_Clarity: "🗣️",
            CTA_Contrast: "🎨",
            CTA_Crowding: "📏",
            CTA_Flow_Alignment: "🔄",
            Form_Presence: "🧾",
            Form_Length: "✏️",
            Required_vs_Optional_Fields: "⚖️",
            Inline_Validation: "✅",
            Submit_Button_Clarity: "📍",
            AutoFocus_Field: "🎯",
            MultiStep_Form_Progress: "📊",
          }).map(([key, icon]) => (
            flow[key] && <MetricCard
              key={key}
              title={key.replaceAll("_", " ")}
              description={desc[key]}
              score={flow[key]?.Score}
              darkMode={darkMode}
              icon={icon}
            />
          ))}
        </Section>

        {/* 🟢 Section 2: Trust & Engagement */}
        <Section title="Trust & Engagement Signals" icon="🤝" color="green" textColor={textColor}>
          {[
            "Testimonials",
            "Reviews",
            "Trust_Badges",
            "Client_Logos",
            "Case_Studies_Accessibility",
            "Lead_Magnets",
            "Exit_Intent_Triggers",
            "Chatbot_Presence",
            "Contact_Info_Visibility",
          ].map((key) => (
            flow[key] && <MetricCard
              key={key}
              title={key.replaceAll("_", " ")}
              description={desc[key]}
              score={flow[key]?.Score}
              darkMode={darkMode}
              icon="💬"
            />
          ))}
        </Section>

        {/* 🟣 Section 3: UX & Interaction */}
        <Section title="UX Flow & Interaction" icon="💡" color="purple" textColor={textColor}>
          {[
            "Interactive_Elements",
            "Personalization",
            "Progress_Indicators",
            "Friendly_Error_Handling",
            "Microcopy_Clarity",
            "Incentives_Displayed",
            "Scarcity_Urgency",
            "Smooth_Scrolling",
            "Mobile_CTA_Adaptation",
            "MultiChannel_FollowUp",
          ].map((key) => (
            flow[key] && <MetricCard
              key={key}
              title={key.replaceAll("_", " ")}
              description={desc[key]}
              score={flow[key]?.Score}
              darkMode={darkMode}
              icon="⚙️"
            />
          ))}
        </Section>

        {/* --- ✅ FIX 4: Wrap dropdowns in sizing div --- */}
        <div className={`w-full ${data?.Report === "All" ? "  " : " "}`}>
          <AuditDropdown items={flow?.Passed} title="✅ Passed Audits" darkMode={darkMode} />
        </div>
        <div className={`w-full ${data?.Report === "All" ? "  " : " "}`}>
          <AuditDropdown items={flow?.Warning} title="⚠️ Warnings" darkMode={darkMode} />
        </div>
        <div className={`w-full ${data?.Report === "All" ? "  " : " "}`}>
          <AuditDropdown items={flow?.Improvements} title="🚫 Improvements Needed" darkMode={darkMode} />
        </div>
      </main>
    </div>
  );
}