import React, { useContext, useMemo } from "react";
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
// ✅ Score Calculation Info (Standard Weights)
// ------------------------------------------------------
const scoreCalculationInfo = {
  title: "Score Calculation",
  use: "The Accessibility score measures how usable the site is for all users, including those with disabilities.",
  impact: "Accessible sites reach 100% of the audience and avoid legal risks.",
  improvement: "Fix color contrast, ARIA roles, and ensure keyboard navigability.",
  weightage: [
    { param: "Navigation & Focus Order", weight: "35%" },
    { param: "Visual Labels & Contrast", weight: "35%" },
    { param: "ARIA Roles & Attributes", weight: "25%" },
    { param: "Interactive Elements", weight: "5%" }
  ]
};

// ------------------------------------------------------
// ✅ Enhanced Shimmer
// ------------------------------------------------------
const ShimmerBlock = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
  </div>
);

const AccessShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
  const step = steps[currentStep] || steps[0];

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 animate-in fade-in zoom-in duration-500 min-h-[350px]">
      <div className={`w-full max-w-xl rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-500 ${darkMode ? "bg-slate-800/40 border border-slate-700/50" : "bg-slate-100/60 border border-slate-200/50"}`}>
        {/* Icon Container (Circle) */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${darkMode ? "bg-slate-900 shadow-black/40 text-white" : "bg-[#1e293b] shadow-slate-400/30 text-white"}`}>
          <div className="animate-pulse">
            {React.cloneElement(step.icon, {
              className: "w-8 h-8",
              strokeWidth: 2.5
            })}
          </div>
        </div>

        {/* Title */}
        <h2 className={`mt-6 text-2xl font-bold tracking-tight transition-all duration-500 ${darkMode ? "text-white" : "text-slate-900"}`}>
          {step.title}
        </h2>

        {/* Description */}
        <p className={`mt-4 text-base leading-relaxed max-w-sm mx-auto transition-all duration-500 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          {step.text}
        </p>

        {/* Processing State */}
        <div className="mt-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider">Processing</span>
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center gap-2 mt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? "w-6 bg-blue-500" : i < currentStep ? "w-6 bg-blue-500/40" : "w-2 bg-slate-400/30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

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

  const auditSteps = useMemo(() => [
    { icon: <Eye className="w-8 h-8 text-blue-500" />, title: "Visual Accessibility", text: "Checking Color Contrast ratios and text readability for low-vision users..." },
    { icon: <Keyboard className="w-8 h-8 text-purple-500" />, title: "Keyboard Navigation", text: "Verifying Focus Order, Tab Index, and Skip Links for keyboard-only users..." },
    { icon: <Code className="w-8 h-8 text-teal-500" />, title: "ARIA & Semantics", text: "Validating ARIA roles, labels, and semantic HTML structure for screen readers..." },
    { icon: <ImageIcon className="w-8 h-8 text-indigo-500" />, title: "Media Alternatives", text: "Scanning images for Alt text and media elements for captions/transcripts..." },
    { icon: <MousePointer className="w-8 h-8 text-amber-500" />, title: "Interactive Elements", text: "Ensuring all buttons, links, and inputs have clear affordance and labels..." },
  ], []);

  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (loading || !data?.accessibility) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % auditSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);

  if (!data?.accessibility) {
    return (
      <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>
          {/* ✅ Unified Master Card Loading State */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

            {/* 1. URL Header */}
            <div>
              <UrlHeader data={data} darkMode={darkMode} />
            </div>

            <div className="flex flex-col xl:flex-row min-h-[300px]">
              {/* Left Panel: Live Preview (Only if not All) */}
              {data.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              {/* Right/Full Panel: Audit Steps */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full">
                  <AccessShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
                </div>
              </div>
            </div>
          </div>
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
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>

        {/* ✅ Unified Master Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

          {/* 1. URL Header */}
          <div>
            <UrlHeader data={data} darkMode={darkMode} />
          </div>

          {/* 2. Card Body */}
          <div className={`flex flex-col xl:flex-row ${data.report === "All" ? "" : "min-h-[300px]"}`}>

            {/* Left Panel: Live Preview (Only if not All) */}
            {data.report !== "All" && (
              <div className={`w-full xl:w-[45%] ${data.report === "All" ? "p-6 lg:p-10" : "p-3 lg:p-4"} flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                <div className="w-full relative z-10">
                  <LivePreview data={data} loading={loading} variant="plain" />
                </div>
              </div>
            )}

            {/* Right Panel: Metrics & Score */}
            <div className={`flex-1 ${data.report === "All" ? "px-6 pb-4 pt-2 lg:px-10 lg:pt-2" : "px-6 pb-4 pt-4 lg:px-12 lg:pt-6"} flex flex-col justify-center`}>
              <div className={`w-full ${data.report === "All" ? "" : "max-w-2xl mx-auto"} ${data.report === "All" ? "space-y-10" : "space-y-8"}`}>

                {/* Top Content Area */}
                <div className={`flex flex-col md:flex-row items-center ${data.report === "All" ? "gap-10 md:gap-14 justify-between" : "gap-8 md:gap-12 justify-center"}`}>

                  {/* Text Content */}
                  <div className={`flex-1 ${data.report === "All" ? "space-y-5" : "space-y-4"} text-left order-2 md:order-1`}>
                    <div className={`${data.report === "All" ? "space-y-2" : "space-y-1.5"}`}>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-100/50 text-blue-600 border border-blue-200"}`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>WCAG 2.1 Audit</span>
                      </div>
                      <h3 className={`${data.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                        Accessibility <span className="text-blue-500">Health</span>
                      </h3>
                      <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        Comprehensive analysis of your website's accessibility, ensuring an inclusive experience for all users.
                      </p>
                    </div>

                    {/* Stats & Tools */}
                    <div className={`flex flex-wrap items-center ${data.report === "All" ? "gap-6" : "gap-5"}`}>
                      <div className={`flex items-center ${data.report === "All" ? "gap-5" : "gap-4"}`}>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-emerald-500" />
                          <span className="text-sm font-bold">{passedCount} Passed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle size={18} className="text-rose-500" />
                          <span className="text-sm font-bold">{failedCount} Failed</span>
                        </div>
                      </div>
                      <div className={`w-px h-4 ${darkMode ? "bg-slate-800" : "bg-slate-200 hidden md:block"}`}></div>
                      <button
                        onClick={() => setSelectedMetricInfo(scoreCalculationInfo)}
                        className={`flex items-center gap-2 text-sm font-bold transition-all ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                      >
                        <Info size={16} />
                        <span className="border-b border-transparent hover:border-current">Methodology</span>
                      </button>
                    </div>
                  </div>

                  {/* Circular Progress */}
                  <div className="relative flex-shrink-0 group cursor-default order-1 md:order-2">
                    <div className={`absolute -inset-8 rounded-full blur-3xl opacity-25 transition-opacity duration-700 group-hover:opacity-40 ${metric?.Percentage >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                    <CircularProgress value={metric?.Percentage || 0} size={data.report === "All" ? 180 : 150} stroke={14} />
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                      <span className={`${data.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{metric?.Percentage || 0}%</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
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