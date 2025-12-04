import React, { useContext, useState } from "react";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, AlertTriangle, Info,
  Eye, MousePointer, Layout, Type, Image as ImageIcon,
  Link, Navigation, Layers, Code, ShieldCheck,
  Keyboard, Focus, Hash, Anchor, Map, ChevronDown, ChevronUp, Terminal
} from "lucide-react";

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
// ✅ Descriptions & Educational Content
// ------------------------------------------------------
const educationalContent = {
  Color_Contrast: {
    desc: "Ensures sufficient color contrast between text and background.",
    why: "Low contrast text is difficult or impossible for users with visual impairments to read."
  },
  Focus_Order: {
    desc: "Checks that focus order is logical for keyboard users.",
    why: "Keyboard users rely on a logical tab order to navigate the page. Random jumping confuses users."
  },
  Focusable_Content: {
    desc: "Ensures all interactive elements are reachable via keyboard.",
    why: "If a button or link cannot be reached with the Tab key, it is inaccessible to keyboard-only users."
  },
  Tab_Index: {
    desc: "Validates that tab index values are used correctly.",
    why: "Positive tabindex values can break the natural reading order. 0 or -1 are usually the only safe values."
  },
  Interactive_Element_Affordance: {
    desc: "Verifies that interactive elements look clickable.",
    why: "Users need visual cues (like underline or button shape) to know which elements they can interact with."
  },
  Label: {
    desc: "Checks for presence of proper labels on form fields.",
    why: "Screen readers need labels to tell users what data to enter into a form field."
  },
  Aria_Allowed_Attr: {
    desc: "Ensures ARIA attributes are valid for the element's role.",
    why: "Using invalid ARIA attributes can confuse screen readers and lead to unexpected behavior."
  },
  Aria_Roles: {
    desc: "Verifies correct ARIA roles are applied.",
    why: "ARIA roles define what an element is (e.g., button, slider). Incorrect roles mislead assistive technology."
  },
  Aria_Hidden_Focus: {
    desc: "Checks that hidden elements are not focusable.",
    why: "Focusing on an invisible element is confusing and frustrating for keyboard users."
  },
  Image_Alt: {
    desc: "Ensures images have meaningful alt text.",
    why: "Screen readers read alt text to describe images to blind users. It's also good for SEO."
  },
  Skip_Links: {
    desc: "Validates presence of skip-to-content links.",
    why: "Skip links allow keyboard users to bypass repetitive navigation menus and go straight to the main content."
  },
  Landmarks: {
    desc: "Checks for use of landmark roles (banner, main, etc.).",
    why: "Landmarks provide a powerful way for screen reader users to navigate large sections of the page."
  },
};

// ------------------------------------------------------
// ✅ Skeleton Components
// ------------------------------------------------------
const SkeletonMetricCard = ({ darkMode }) => {
  const shimmerBg = darkMode ? "bg-gray-800" : "bg-gray-200";
  return (
    <div className={`h-48 rounded-xl ${shimmerBg} animate-pulse`} />
  );
};

const AccessibilityShimmer = ({ darkMode }) => {
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  return (
    <div className={`min-h-screen ${mainBg} p-8 space-y-8`}>
      <div className={`h-64 rounded-3xl ${darkMode ? "bg-gray-800" : "bg-gray-200"} animate-pulse`} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <SkeletonMetricCard key={i} darkMode={darkMode} />
        ))}
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ MetricCard Component
// ------------------------------------------------------
const MetricCard = ({ metricKey, data, darkMode }) => {
  const { score, details, meta } = data || {};
  const isPassed = score === 100;
  const [isExpanded, setIsExpanded] = useState(false);

  const Icon = iconMap[metricKey] || CheckCircle;
  const content = educationalContent[metricKey] || { desc: "Accessibility check.", why: "Important for inclusive design." };
  const title = metricKey.replaceAll("_", " ");

  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";

  const statusColor = isPassed
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : "text-rose-500 bg-rose-500/10 border-rose-500/20";

  const hasFailures = meta && meta.failedNodes && meta.failedNodes.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl border ${cardBg} shadow-sm hover:shadow-lg transition-all duration-300 group`}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusColor} flex items-center gap-1`}>
                  {isPassed ? <CheckCircle size={10} /> : <XCircle size={10} />}
                  {isPassed ? "Passed" : "Needs Attention"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Details */}
        <div>
          <p className={`text-sm font-medium ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {details || "No details available"}
          </p>
          {meta?.count !== undefined && !isPassed && (
            <div className="mt-2 text-xs font-mono">
              <span className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>Issues Found: </span>
              <span className="font-bold text-rose-500">{String(meta.count)}</span>
            </div>
          )}
        </div>

        {/* Educational Content */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700/50 space-y-2">
          <p className={`text-sm ${subTextColor} leading-relaxed`}>
            {content.desc}
          </p>
          <div className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            <span className="font-semibold opacity-90">Why it matters:</span> {content.why}
          </div>
        </div>

        {/* Collapsible Failure Details */}
        {hasFailures && (
          <div className="mt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-2 text-xs font-semibold w-full justify-center py-2 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200" : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"}`}
            >
              {isExpanded ? "Hide Technical Details" : "View Technical Details"}
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`mt-2 p-3 rounded-lg text-xs font-mono overflow-x-auto border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-300" : "bg-slate-900 border-slate-800 text-slate-300"}`}>
                    <div className="flex items-center gap-2 mb-2 text-rose-400 border-b border-gray-700 pb-1">
                      <Terminal size={12} />
                      <span className="font-bold uppercase tracking-wider">Failing Elements Log</span>
                    </div>
                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                      {meta.failedNodes.map((node, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="font-bold text-yellow-400 break-all">{node.target}</div>
                          <div className="opacity-80 pl-2 border-l-2 border-rose-500/50">{node.failureSummary}</div>
                          {node.html && <div className="text-gray-500 truncate pl-2">{node.html}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ------------------------------------------------------
// ✅ Section Component
// ------------------------------------------------------
const Section = ({ title, icon: Icon, children, darkMode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 px-2 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className={`p-2 rounded-lg ${darkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"}`}>
          <Icon size={24} />
        </div>
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </motion.div>
  );
};

// ------------------------------------------------------
// ✅ MAIN COMPONENT
// ------------------------------------------------------
export default function Accessibility() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const darkMode = theme === "dark";

  if (loading || !data || data.Status === "inprogress") {
    return <AccessibilityShimmer darkMode={darkMode} />;
  }

  const metric = data?.Accessibility || {};
  const mainBg = darkMode ? "bg-gray-950" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  return (
    <div className={`min-h-screen w-full ${mainBg} transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative overflow-hidden rounded-3xl p-8 sm:p-12 shadow-2xl ${darkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-800" : "bg-white border border-gray-200"}`}
        >
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-left space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-bold border border-indigo-500/20 backdrop-blur-sm">
                <ShieldCheck size={16} />
                <span>WCAG 2.1 Compliant Audit</span>
              </div>

              <h1 className={`text-4xl sm:text-6xl font-black tracking-tight ${textColor} leading-tight`}>
                Accessibility <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  Health Check
                </span>
              </h1>

              <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"} leading-relaxed`}>
                Comprehensive analysis of your website's accessibility, ensuring an inclusive experience for all users including those with disabilities.
              </p>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2">
                {(() => {
                  const allMetrics = Object.values(metric).filter(val => typeof val === 'object' && val !== null && 'score' in val);
                  const passedCount = allMetrics.filter(m => m.score === 100).length;
                  const failedCount = allMetrics.filter(m => m.score < 100).length;

                  return (
                    <>
                      <div className={`flex items-center gap-3 text-sm font-bold px-5 py-3 rounded-xl shadow-sm ${darkMode ? "bg-gray-800/50 text-emerald-400 border border-emerald-500/20" : "bg-white text-emerald-600 border border-emerald-100"}`}>
                        <div className="p-1 bg-emerald-500/10 rounded-full"><CheckCircle size={18} /></div>
                        <span>{passedCount} Passing</span>
                      </div>
                      <div className={`flex items-center gap-3 text-sm font-bold px-5 py-3 rounded-xl shadow-sm ${darkMode ? "bg-gray-800/50 text-rose-400 border border-rose-500/20" : "bg-white text-rose-600 border border-rose-100"}`}>
                        <div className="p-1 bg-rose-500/10 rounded-full"><AlertTriangle size={18} /></div>
                        <span>{failedCount} Issues</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 relative">
              <div className="relative group">
                <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 ${darkMode ? "bg-indigo-500" : "bg-indigo-600"}`}></div>
                <CircularProgress value={metric?.Percentage || 0} size={180} stroke={16} />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-5xl font-black ${textColor}`}>{metric?.Percentage || 0}</span>
                  <span className={`text-xs font-bold uppercase tracking-widest mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Score</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full ${darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Time Taken: {data.Time_Taken}
              </div>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-32 -mr-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-32 -ml-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        </motion.div>

        {/* Section 1: Visual Accessibility */}
        <Section title="Visual Accessibility" icon={Eye} darkMode={darkMode}>
          {["Color_Contrast", "Image_Alt"].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} />
          ))}
        </Section>

        {/* Section 2: Keyboard Navigation */}
        <Section title="Keyboard Navigation" icon={Keyboard} darkMode={darkMode}>
          {["Focusable_Content", "Focus_Order", "Tab_Index", "Skip_Links"].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} />
          ))}
        </Section>

        {/* Section 3: Semantic & ARIA Roles */}
        <Section title="Semantic & ARIA Roles" icon={Code} darkMode={darkMode}>
          {["Label", "Aria_Allowed_Attr", "Aria_Roles", "Aria_Hidden_Focus", "Landmarks", "Interactive_Element_Affordance"].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} />
          ))}
        </Section>

      </main>
    </div>
  );
}