import React, { useContext } from "react";
import UrlHeader from "../Component/UrlHeader";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  CheckCircle, XCircle, AlertTriangle, Info,
  Eye, MousePointer, Layout, Type, Image as ImageIcon,
  Link, Navigation, Layers, Code, ShieldCheck,
  Keyboard, Focus, Hash, Anchor, Map, Terminal, Loader2
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";

// ------------------------------------------------------
// ✅ Icon Mapping
// ------------------------------------------------------
const iconMap = {
  Color_Contrast: Type,
  Focus_Order: Navigation,
  Focusable_Content: Focus,
  Tab_Index: Hash,
  Interactive_Element_Affordance: MousePointer,
  Label: Type,
  Aria_Allowed_Attr: Code,
  Aria_Roles: Layers,
  Aria_Hidden_Focus: Eye,
  Image_Alt: ImageIcon,
  Skip_Links: Anchor,
  Landmarks: Map,
};

// ------------------------------------------------------
// ✅ Educational Content
// ------------------------------------------------------
const educationalContent = {
  Color_Contrast: {
    title: "Color Contrast",
    desc: "Ensures sufficient color contrast.",
    why: "Essential for users with low vision.",
    use: "Measures the difference in brightness between text and its background.",
    impact: "Text with low contrast (below 4.5:1) is unreadable for people with visual impairments or in bright sunlight.",
    improvement: "Increase contrast by darkening text or lightening backgrounds to meet WCAG AA standards."
  },
  Focus_Order: {
    title: "Focus Order",
    desc: "Checks logical focus order.",
    why: "Critical for keyboard navigation.",
    use: "The sequence in which elements receive focus when tabbing through the page.",
    impact: " illogical focus order confuses keyboard users, making the site difficult to navigate.",
    improvement: "Ensure the DOM order matches the visual layout. Use tabindex='0' for focusable elements."
  },
  Focusable_Content: {
    title: "Focusable Content",
    desc: "Verifies keyboard reachability.",
    why: "All interactive elements must be accessible.",
    title: "Focusable Content",
    use: "Ensures all interactive elements (buttons, links, inputs) can be reached via keyboard.",
    impact: "If elements are not focusable, keyboard-only users cannot use them.",
    improvement: "Avoid using <div> for buttons. Use <button> or add tabindex='0' and role='button'."
  },
  Tab_Index: {
    title: "Tab Index",
    desc: "Validates tab index usage.",
    why: "Prevents navigation traps.",
    use: "The tabindex attribute controls whether an element is focusable.",
    impact: "Positive values (>0) break natural focus order. Values of -1 remove elements from tab flow.",
    improvement: "Avoid positive tabindex. Use '0' for natural flow and '-1' for programmatically focused items."
  },
  Interactive_Element_Affordance: {
    title: "Clickable Targets",
    desc: "Checks visual cues.",
    why: "Users must know what is clickable.",
    use: "Visual indicators that an element is interactive (e.g., cursor pointer, hover styles).",
    impact: "Without affordance, users may not realize they can interact with buttons or links.",
    improvement: "Use 'cursor: pointer' CSS on clickable elements and ensure they look distinct."
  },
  Label: {
    title: "Form Labels",
    desc: "Checks form labels.",
    why: "Screen readers need labels for inputs.",
    use: "HTML labels associated with form input fields.",
    impact: "Screen readers cannot identify what a form field is for without a label.",
    improvement: "Use <label for='id'> or aria-label attributes for all inputs."
  },
  Aria_Allowed_Attr: {
    title: "ARIA Attributes",
    desc: "Validates ARIA attributes.",
    why: "Prevents screen reader errors.",
    use: "Checks if ARIA attributes used are valid for the element's role.",
    impact: "Invalid ARIA breaks accessibility trees, causing screen readers to announce nonsense.",
    improvement: "Follow ARIA specs. Don't use aria-label on <div> unless it has a role."
  },
  Aria_Roles: {
    title: "ARIA Roles",
    desc: "Verifies ARIA roles.",
    why: "Ensures correct element identification.",
    use: "Attributes that define what an element is (e.g., role='button').",
    impact: "Incorrect roles mislead screen reader users about functionality.",
    improvement: "Use semantic HTML (<button>) instead of roles where possible."
  },
  Aria_Hidden_Focus: {
    title: "Hidden Focus",
    desc: "Checks hidden focusable items.",
    why: "Prevents confusing navigation.",
    use: "Ensures elements hidden with aria-hidden='true' are not focusable.",
    impact: "Focusing on a hidden element confuses users as they cannot see where they are.",
    improvement: "Add tabindex='-1' to elements that are aria-hidden."
  },
  Image_Alt: {
    title: "Alternative Text",
    desc: "Checks image alt text.",
    why: "Describes images to blind users.",
    use: "Text alternatives for non-text content (images).",
    impact: "Without alt text, blind users miss out on visual information.",
    improvement: "Add alt='description' to meaningful images. Use empty alt='' for decoration."
  },
  Skip_Links: {
    title: "Skip Links",
    desc: "Verifies skip links.",
    why: "Allows bypassing repetitive content.",
    use: "Hidden links at the top of the page to jump to main content.",
    impact: "Keyboard users avoid tabbing through 50 menu items on every page load.",
    improvement: "Implement a 'Skip to Main Content' link as the first focusable element."
  },
  Landmarks: {
    title: "Landmarks",
    desc: "Checks landmark roles.",
    why: "Aids in page navigation.",
    use: "Semantic regions (main, nav, banner, complementary).",
    impact: "Screen readers can jump between regions, improving navigation speed drastically.",
    improvement: "Use <main>, <nav>, <header>, <footer> tags."
  },
};

// ------------------------------------------------------
// ✅ Enhanced Shimmer
// ------------------------------------------------------
const ShimmerBlock = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
  </div>
);

const AccessibilityShimmer = ({ darkMode }) => (
  <div className="space-y-12 animate-in fade-in zoom-in duration-300">
    {/* Header Loading */}
    <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-lg ${darkMode ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-200"}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-[shimmer_2s_infinite]"></div>
      <div className="flex flex-col md:flex-row gap-8 items-center justify-between relative z-10">
        <div className="space-y-6 w-full max-w-2xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Initializing Audit</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 animate-pulse">Running Accessibility Audit...</h1>
            <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Checking Color Contrast, ARIA Roles, Focus Order, and Keyboard Navigation.</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={`w-24 h-24 animate-spin ${darkMode ? "text-blue-500" : "text-blue-600"} opacity-20`} />
          <span className="text-sm font-bold animate-pulse">Calculating Score...</span>
        </div>
      </div>
    </div>

    {/* Metric Cards Loading */}
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-4 px-2 opacity-50">
        <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800">
          <ShieldCheck size={24} />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {["Checking Color Contrast...", "Verifying ARIA Roles...", "Testing Keyboard Navigation...", "Analyzing Focus Order...", "Scanning Alt Text...", "Validating Landmarks..."].map((text, i) => (
          <div key={i} className={`h-56 rounded-xl border p-6 flex flex-col justify-center items-center gap-4 text-center ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 opacity-50" />
            <div className="space-y-1">
              <div className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{text}</div>
              <div className="text-xs opacity-50">Please wait...</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ------------------------------------------------------
// ✅ Metric Card (Security Style)
// ------------------------------------------------------
const MetricCard = ({ metricKey, data, darkMode, onInfo }) => {
  const { score, details, meta } = data || {};
  const isPassed = score === 100;
  const isWarning = score === 50;

  const Icon = iconMap[metricKey] || CheckCircle;
  const content = educationalContent[metricKey] || { desc: "Accessibility check.", why: "Important for inclusive design." };
  const title = metricKey.replaceAll("_", " ");

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

  const hasFailures = meta && meta.failedNodes && meta.failedNodes.length > 0;

  return (
    <div className={`relative overflow-hidden rounded-xl border ${cardBg} shadow-sm hover:shadow-md transition-shadow group`}>
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
              <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full w-fit border ${statusColor}`}>
                {statusText}
              </p>
            </div>
          </div>
          {onInfo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInfo();
              }}
              className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
              title="Learn more"
            >
              <Info size={18} />
            </button>
          )}
        </div>

        {/* Dynamic Details */}
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            Status Detail
          </h4>
          <p className={`text-sm font-medium ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {details || "No details available"}
          </p>
          {meta?.count !== undefined && !isPassed && (
            <div className="mt-2 text-xs">
              <span className={`font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Issues Found: </span>
              <code className={`px-1.5 py-0.5 rounded ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`}>
                {String(meta.count)}
              </code>
            </div>
          )}
        </div>

        {/* Technical Data (Failures) - Inline Scrollable */}
        {hasFailures && (
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Technical Data
            </h4>
            <div className={`p-2 rounded text-xs font-mono overflow-x-auto ${darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {meta.failedNodes.map((node, idx) => (
                  <div key={idx} className="space-y-1 border-b border-gray-200 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                    <div className="font-bold break-all">{node.target}</div>
                    <div className="opacity-80 pl-2 border-l-2 border-red-500">{node.failureSummary}</div>
                    {node.html && <div className="opacity-60 truncate pl-2">{node.html}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Educational Content */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className={`text-sm ${subTextColor}`}>
            {content.desc}
          </p>
          <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            <span className="font-semibold">Why:</span> {content.why}
          </p>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Simple Section
// ------------------------------------------------------
const Section = ({ title, icon: Icon, children, darkMode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 px-2">
      <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
        <Icon size={20} />
      </div>
      <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
        {title}
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

// ------------------------------------------------------
// ✅ Main Component
// ------------------------------------------------------
export default function Accessibility() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const darkMode = theme === "dark";

  if (!data?.accessibility) {
    return (
      <div className={`min-h-screen w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          <UrlHeader darkMode={darkMode} />
          {/* ✅ Live Preview (Only for Full Audit) */}
          <LivePreview data={data} showInFullAudit={false} />
          <AccessibilityShimmer darkMode={darkMode} />
        </main>
      </div>
    );
  }

  const metric = data?.accessibility || {};
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  const allMetrics = Object.values(metric).filter(val => typeof val === 'object' && val !== null && 'score' in val);
  const passedCount = allMetrics.filter(m => m.score === 100).length;
  const failedCount = allMetrics.filter(m => m.score < 100).length;

  return (
    <div className={`min-h-screen w-full ${mainBg} transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        <UrlHeader darkMode={darkMode} />

        {/* ✅ Live Preview (Only for Full Audit) */}
        <LivePreview data={data} showInFullAudit={false} />

        {/* Header Section */}
        <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl ${darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium border border-blue-500/20">
                <ShieldCheck size={14} />
                <span>WCAG 2.1 Audit</span>
              </div>
              <h1 className={`text-4xl sm:text-5xl font-black tracking-tight ${textColor}`}>
                Accessibility <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">Health</span>
              </h1>
              <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Comprehensive analysis of your website's accessibility, ensuring an inclusive experience for all users.
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
                <CircularProgress value={metric?.Percentage || 0} size={140} stroke={12} />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-3xl font-bold ${textColor}`}>{metric?.Percentage || 0}%</span>
                  <span className={`text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Score</span>
                </div>
              </div>
              {data.report !== "All" && (
                <div className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Time Taken: {data.timeTaken}
                </div>
              )}
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Section 1: Visual Accessibility */}
        <Section title="Visual Accessibility" icon={Eye} darkMode={darkMode}>
          {["Color_Contrast", "Image_Alt"].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} onInfo={() => setSelectedMetricInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
          ))}
        </Section>

        {/* Section 2: Keyboard Navigation */}
        <Section title="Keyboard Navigation" icon={Keyboard} darkMode={darkMode}>
          {["Focusable_Content", "Focus_Order", "Tab_Index", "Skip_Links"].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} onInfo={() => setSelectedMetricInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
          ))}
        </Section>

        {/* Section 3: Semantic & ARIA Roles */}
        <Section title="Semantic & ARIA Roles" icon={Code} darkMode={darkMode}>
          {["Label", "Aria_Allowed_Attr", "Aria_Roles", "Aria_Hidden_Focus", "Landmarks", "Interactive_Element_Affordance"].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} onInfo={() => setSelectedMetricInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
          ))}
        </Section>

      </main>
      <MetricInfoModal
        isOpen={!!selectedMetricInfo}
        onClose={() => setSelectedMetricInfo(null)}
        info={selectedMetricInfo}
        darkMode={darkMode}
      />
    </div>
  );
}