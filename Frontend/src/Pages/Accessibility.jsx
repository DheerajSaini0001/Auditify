import React, { useContext, useState } from "react"; // Added useState
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import Sidebar from "../Component/Sidebar";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";

// -----------------------------------------------------------------
// ✅ NEW: High-Fidelity Skeleton Components
// -----------------------------------------------------------------
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
  const { data } = useData(); 
  const shimmerCardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";
  return (
    <div className={`w-full ${data?.Report === "All" ? "max-w-4xl" : "max-w-6xl"}  p-8 rounded-2xl shadow-2xl ${shimmerCardBg} border-l-8 ${border} border-l-gray-500`}>
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
  const { data } = useData();
  const shimmerCardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";
  
  return (
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

const SkeletonAuditDropdown = ({ darkMode }) => {
  const shimmerCardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  const { data } = useData();
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const border = darkMode ? "border-gray-700" : "border-gray-200";
  return (
    <div className={`w-full ${data?.Report === "All" ? "max-w-4xl" : "max-w-6xl"} p-5 rounded-lg shadow-xl ${shimmerCardBg} border ${border}`}>
      <div className={`h-6 w-1/3 rounded ${shimmerBg}`}></div>
    </div>
  );
};

/**
 * ✅ REPLACED: This is the new, high-fidelity shimmer component
 * that mimics your final page layout perfectly.
 */
function AccessibilityShimmer({ darkMode }) {
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
        
        {/* 2. Section 1 (2 metrics) */}
        <SkeletonSectionCard metricCount={2} darkMode={darkMode} />
        
        {/* 3. Section 2 (4 metrics) */}
        <SkeletonSectionCard metricCount={4} darkMode={darkMode} />
        
        {/* 4. Section 3 (6 metrics) */}
        <SkeletonSectionCard metricCount={6} darkMode={darkMode} />
        
        {/* 5. Dropdowns (2 of them) */}
        <SkeletonAuditDropdown darkMode={darkMode} />
        <SkeletonAuditDropdown darkMode={darkMode} />
      </main>
    </div>
  );
}


// ✅ Reusable Metric Card (SEO-style)
const MetricCard = ({ title, description, score, value, darkMode, icon }) => {
  // Use 'useState' from React import
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

  const statusText = isPassed ? "Accessible" : "Needs Fix";
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

// -----------------------------------------------------------------
// ✅ Helper Section Wrapper (FIXED)
// -----------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// ✅ MAIN ACCESSIBILITY COMPONENT (FIXED)
// ---------------------------------------------------------------------------
export default function Accessibility() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const darkMode = theme === "dark";
  
  // --- ✅ FIX 1: Add '!data' check to prevent crash ---
  if (loading || !data || data.Status === "inprogress") {
    return <AccessibilityShimmer darkMode={darkMode} />;
  }

  // Now it's safe to access data
  const accessibility = data?.Accessibility || {};

  const textColor = darkMode ? "text-white" : "text-gray-900";
  const mainCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";

  const desc = {
    color: "Ensures sufficient color contrast between text and background for readability.",
    focusOrder: "Checks that focus order is logical for keyboard users.",
    focusable: "Ensures all interactive elements are reachable via keyboard navigation.",
    tabIndex: "Validates that tab index values are used correctly for accessibility.",
    affordance: "Verifies that interactive elements are clearly distinguishable and usable.",
    label: "Checks for presence of proper labels on form fields and interactive elements.",
    ariaAttr: "Ensures ARIA attributes are valid and correctly implemented.",
    ariaRoles: "Verifies correct ARIA roles are applied for assistive technologies.",
    ariaHidden: "Checks that hidden elements are not focusable or accessible incorrectly.",
    imageAlt: "Ensures images have meaningful alt text for screen readers.",
    skipLinks: "Validates presence of skip links to improve navigation efficiency.",
    landmarks: "Checks for use of landmark elements for better screen reader structure.",
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
            // --- ✅ FIX 2: Add conditional margin ---
            data?.Report === "All" ? "lg:ml-64" : ""
          } flex flex-col items-center pt-20 pb-12 px-4 space-y-8 ${
          darkMode
            ? "bg-gray-900"
            : "bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50"
        }`}
      >
        {/* Header */}
        <div
          // --- ✅ FIX 3: Add conditional max-width ---
          className={`w-full ${data?.Report === "All" ? "max-w-4xl" : "max-w-6xl"} p-8 rounded-2xl shadow-2xl border-l-8 border-indigo-500 ${mainCardBg}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className={`text-5xl font-black ${textColor} mb-2 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent`}
              >
                Accessibility
              </h2>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Evaluates your website’s accessibility for users with disabilities and keyboard navigation support.
              </p>
            </div>
            <CircularProgress
              value={accessibility?.Percentage || 0}
              size={80}
              stroke={6}
            />
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

        {/* Sections will now correctly size themselves thanks to the fix in 'Section' component */}
        
        {/* Section 1: Visual Accessibility */}
        <Section title="Visual Accessibility" icon="🎨" color="purple" textColor={textColor}>
          <MetricCard title="Color Contrast" description={desc.color} score={accessibility.Color_Contrast?.Score} value={accessibility.Color_Contrast?.Score ? "Good" : "Poor"} darkMode={darkMode} icon="🎨" />
          <MetricCard title="Image Alt" description={desc.imageAlt} score={accessibility.Image_Alt?.Score} value={accessibility.Image_Alt?.Score ? "Present" : "Missing"} darkMode={darkMode} icon="🖼️" />
        </Section>

        {/* Section 2: Keyboard Navigation */}
        <Section title="Keyboard Navigation" icon="⌨️" color="blue" textColor={textColor}>
          <MetricCard title="Focusable Elements" description={desc.focusable} score={accessibility.Focusable_Content?.Score} value={accessibility.Focusable_Content?.Score ? "Good" : "Issues"} darkMode={darkMode} icon="🧭" />
          <MetricCard title="Focus Order" description={desc.focusOrder} score={accessibility.Focus_Order?.Score} value={accessibility.Focus_Order?.Score ? "Logical" : "Incorrect"} darkMode={darkMode} icon="🔁" />
          <MetricCard title="Tab Index" description={desc.tabIndex} score={accessibility.Tab_Index?.Score} value={accessibility.Tab_Index?.Score ? "Valid" : "Invalid"} darkMode={darkMode} icon="↕️" />
          <MetricCard title="Skip Links" description={desc.skipLinks} score={accessibility.Skip_Links?.Score} value={accessibility.Skip_Links?.Score ? "Found" : "Missing"} darkMode={darkMode} icon="⏭️" />
        </Section>

        {/* Section 3: Semantic & ARIA Roles */}
        <Section title="Semantic & ARIA Roles" icon="🧩" color="green" textColor={textColor}>
          <MetricCard title="Labels" description={desc.label} score={accessibility.Label?.Score} value={accessibility.Label?.Score ? "Present" : "Missing"} darkMode={darkMode} icon="🏷️" />
          <MetricCard title="ARIA Attributes" description={desc.ariaAttr} score={accessibility.Aria_Allowed_Attr?.Score} value={accessibility.Aria_Allowed_Attr?.Score ? "Valid" : "Invalid"} darkMode={darkMode} icon="🔤" />
          <MetricCard title="ARIA Roles" description={desc.ariaRoles} score={accessibility.Aria_Roles?.Score} value={accessibility.Aria_Roles?.Score ? "Found" : "Missing"} darkMode={darkMode} icon="🪶" />
          <MetricCard title="ARIA Hidden Focus" description={desc.ariaHidden} score={accessibility.Aria_Hidden_Focus?.Score} value={accessibility.Aria_Hidden_Focus?.Score ? "Valid" : "Invalid"} darkMode={darkMode} icon="🙈" />
          <MetricCard title="Landmarks" description={desc.landmarks} score={accessibility.Landmarks?.Score} value={accessibility.Landmarks?.Score ? "Present" : "Missing"} darkMode={darkMode} icon="🗺️" />
          <MetricCard title="Interactive Affordance" description={desc.affordance} score={accessibility.Interactive_Element_Affordance?.Score} value={accessibility.Interactive_Element_Affordance?.Score ? "Good" : "Needs Fix"} darkMode={darkMode} icon="⚙️" />
        </Section>

        {/* Dropdowns */}
        {/* --- ✅ FIX 4: Wrap dropdowns in sizing div to match shimmer --- */}
        <div className={`w-full ${data?.Report === "All" ? "max-w-4xl" : "max-w-6xl"}`}>
          <AuditDropdown items={accessibility?.Passed} title="✅ Passed Audits" darkMode={darkMode} />
        </div>
        <div className={`w-full ${data?.Report === "All" ? "max-w-4xl" : "max-w-6xl"}`}>
          <AuditDropdown items={accessibility?.Warning} title="⚠️ Warnings" darkMode={darkMode} />
        </div>
      </main>
    </div>
  );
}