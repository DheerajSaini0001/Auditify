import React, { useContext } from "react";
import UrlHeader from "../Component/UrlHeader";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import {
  CheckCircle, XCircle, AlertTriangle, Info,
  MousePointerClick, FileText, ShieldCheck, LayoutTemplate,
  MessageSquare, Zap, Target, CreditCard, Users,
  Smartphone, Mail, Bell, Lock, Search,
  ChevronDown, ChevronUp, Terminal, Activity,
  ArrowRight
} from "lucide-react";

// ------------------------------------------------------
// ✅ Icon Mapping
// ------------------------------------------------------
const iconMap = {
  CTA_Visibility: MousePointerClick,
  CTA_Clarity: MessageSquare,
  CTA_Contrast: LayoutTemplate,
  CTA_Crowding: Activity,
  CTA_Flow_Alignment: Target,
  Form_Presence: FileText,
  Form_Length: FileText,
  Required_vs_Optional_Fields: FileText,
  Inline_Validation: CheckCircle,
  Submit_Button_Clarity: MousePointerClick,
  AutoFocus_Field: Target,
  MultiStep_Form_Progress: Activity,
  Testimonials: Users,
  Reviews: MessageSquare,
  Trust_Badges: ShieldCheck,
  Client_Logos: Users,
  Case_Studies_Accessibility: FileText,
  Exit_Intent_Triggers: Bell,
  Lead_Magnets: Zap,
  Contact_Info_Visibility: Mail,
  Chatbot_Presence: MessageSquare,
  Interactive_Elements: MousePointerClick,
  Personalization: Users,
  Progress_Indicators: Activity,
  Friendly_Error_Handling: AlertTriangle,
  Microcopy_Clarity: MessageSquare,
  Incentives_Displayed: CreditCard,
  Scarcity_Urgency: Activity,
  Smooth_Scrolling: LayoutTemplate,
  Mobile_CTA_Adaptation: Smartphone,
  MultiChannel_FollowUp: Mail,
};

// ------------------------------------------------------
// ✅ Educational Content
// ------------------------------------------------------
const educationalContent = {
  CTA_Visibility: { desc: "Checks if primary CTAs are visible.", why: "Visible CTAs guide users." },
  CTA_Clarity: { desc: "Evaluates CTA text clarity.", why: "Clear text reduces cognitive load." },
  CTA_Contrast: { desc: "Assesses button contrast.", why: "High contrast ensures accessibility." },
  CTA_Crowding: { desc: "Checks for cluttered CTAs.", why: "Crowding causes decision paralysis." },
  CTA_Flow_Alignment: { desc: "Checks CTA placement flow.", why: "CTAs should match user intent." },
  Form_Presence: { desc: "Verifies form existence.", why: "Forms capture lead data." },
  Form_Length: { desc: "Measures form complexity.", why: "Short forms convert better." },
  Required_vs_Optional_Fields: { desc: "Checks field markings.", why: "Clarity prevents frustration." },
  Inline_Validation: { desc: "Checks for real-time validation.", why: "Instant feedback improves UX." },
  Submit_Button_Clarity: { desc: "Analyzes submit button.", why: "Action must be obvious." },
  AutoFocus_Field: { desc: "Checks auto-focus.", why: "Saves user clicks." },
  MultiStep_Form_Progress: { desc: "Checks progress indicators.", why: "Encourages completion." },
  Testimonials: { desc: "Validates testimonials.", why: "Social proof builds trust." },
  Reviews: { desc: "Checks for reviews.", why: "Reviews influence decisions." },
  Trust_Badges: { desc: "Detects trust badges.", why: "Badges reassure users." },
  Client_Logos: { desc: "Verifies client logos.", why: "Logos establish authority." },
  Case_Studies_Accessibility: { desc: "Checks case studies.", why: "Proof of value." },
  Exit_Intent_Triggers: { desc: "Detects exit popups.", why: "Recovers lost leads." },
  Lead_Magnets: { desc: "Checks for lead magnets.", why: "Incentivizes signups." },
  Contact_Info_Visibility: { desc: "Ensures contact info visibility.", why: "Builds trust." },
  Chatbot_Presence: { desc: "Verifies chatbot.", why: "Provides instant support." },
  Interactive_Elements: { desc: "Checks interactive tools.", why: "Increases engagement." },
  Personalization: { desc: "Assesses personalization.", why: "Relevance boosts conversion." },
  Progress_Indicators: { desc: "Validates progress bars.", why: "Visualizes completion." },
  Friendly_Error_Handling: { desc: "Ensures clear errors.", why: "Helps users recover." },
  Microcopy_Clarity: { desc: "Checks helper text.", why: "Guides users smoothly." },
  Incentives_Displayed: { desc: "Verifies incentives.", why: "Motivates action." },
  Scarcity_Urgency: { desc: "Checks urgency triggers.", why: "Encourages immediate action." },
  Smooth_Scrolling: { desc: "Ensures smooth scroll.", why: "Enhances feel." },
  Mobile_CTA_Adaptation: { desc: "Checks mobile CTAs.", why: "Critical for mobile users." },
  MultiChannel_FollowUp: { desc: "Verifies follow-up.", why: "Increases retention." },
};

// ------------------------------------------------------
// ✅ Enhanced Shimmer
// ------------------------------------------------------
const ShimmerBlock = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
  </div>
);

const ConversionShimmer = ({ darkMode }) => (
  <div className="space-y-12 animate-in fade-in zoom-in duration-300">
    {/* Header Shimmer */}
    <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-lg ${darkMode ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-200"}`}>
      <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
        <div className="space-y-6 w-full max-w-2xl">
          <ShimmerBlock className="h-8 w-32 rounded-full" />
          <ShimmerBlock className="h-14 w-3/4" />
          <ShimmerBlock className="h-6 w-1/2" />
          <div className="flex gap-4 pt-2">
            <ShimmerBlock className="h-10 w-32 rounded-lg" />
            <ShimmerBlock className="h-10 w-32 rounded-lg" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <ShimmerBlock className="h-40 w-40 rounded-full" />
          <ShimmerBlock className="h-5 w-24" />
        </div>
      </div>
    </div>

    {/* Metric Cards Shimmer */}
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-4 px-2">
        <ShimmerBlock className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <ShimmerBlock className="h-7 w-48" />
          <ShimmerBlock className="h-4 w-32" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`h-56 rounded-xl border p-6 space-y-6 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <ShimmerBlock className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <ShimmerBlock className="h-5 w-32" />
                  <ShimmerBlock className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <ShimmerBlock className="h-4 w-full" />
              <ShimmerBlock className="h-4 w-5/6" />
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
              <ShimmerBlock className="h-4 w-3/4" />
              <ShimmerBlock className="h-3 w-1/2 mt-2" />
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
const MetricCard = ({ metricKey, data, darkMode }) => {
  const { score, details, meta } = data || {};
  const isPassed = score === 100;

  const Icon = iconMap[metricKey] || CheckCircle;
  const content = educationalContent[metricKey] || { desc: "Conversion metric.", why: "Important for optimization." };
  const title = metricKey.replaceAll("_", " ");

  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";

  const statusColor = isPassed
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : "text-rose-500 bg-rose-500/10 border-rose-500/20";

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
                {isPassed ? "Optimized" : "Needs Improvement"}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Details */}
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            Status Detail
          </h4>
          <p className={`text-sm font-medium ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {details}
          </p>
          {meta?.count !== undefined && (
            <div className="mt-2 text-xs">
              <span className={`font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Detected Count: </span>
              <code className={`px-1.5 py-0.5 rounded ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`}>
                {String(meta.count)}
              </code>
            </div>
          )}
        </div>

        {/* Technical Data */}
        {meta && Object.keys(meta).some(k => k !== 'count') && (
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Technical Data
            </h4>
            <div className={`p-2 rounded text-xs font-mono overflow-x-auto ${darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
              {Object.entries(meta).map(([key, value]) => {
                if (key === 'count') return null;
                return (
                  <div key={key} className="flex flex-col sm:flex-row sm:gap-2 mb-1 last:mb-0">
                    <span className="font-semibold opacity-70">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </div>
                );
              })}
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
// ✅ Section Component
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
export default function Conversion_Lead_Flow() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const darkMode = theme === "dark";

  if (!data?.Conversion_and_Lead_Flow) {
    return (
      <div className={`min-h-screen w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          <UrlHeader darkMode={darkMode} />
          <ConversionShimmer darkMode={darkMode} />
        </main>
      </div>
    );
  }

  const flow = data?.Conversion_and_Lead_Flow || {};
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  const allMetrics = Object.values(flow).filter(val => typeof val === 'object' && val !== null && 'score' in val);
  const passedCount = allMetrics.filter(m => m.score === 100).length;
  const failedCount = allMetrics.filter(m => m.score < 100).length;

  return (
    <div className={`min-h-screen w-full ${mainBg} transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        <UrlHeader darkMode={darkMode} />

        {/* Header Section */}
        <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl ${darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium border border-blue-500/20">
                <Target size={14} />
                <span>Conversion Audit</span>
              </div>
              <h1 className={`text-4xl sm:text-5xl font-black tracking-tight ${textColor}`}>
                Conversion & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">Lead Flow</span>
              </h1>
              <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Analysis of your conversion funnels, CTA effectiveness, and user journey optimization.
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
                <CircularProgress value={flow?.Percentage || 0} size={140} stroke={12} />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-3xl font-bold ${textColor}`}>{flow?.Percentage || 0}%</span>
                  <span className={`text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Score</span>
                </div>
              </div>
              <div className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Time Taken: {data.Time_Taken}
              </div>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Section 1: CTA & Forms */}
        <Section title="Call-to-Actions & Forms" icon={MousePointerClick} darkMode={darkMode}>
          {["CTA_Visibility", "CTA_Clarity", "CTA_Contrast", "CTA_Crowding", "CTA_Flow_Alignment", "Form_Presence", "Form_Length", "Required_vs_Optional_Fields", "Inline_Validation", "Submit_Button_Clarity", "AutoFocus_Field", "MultiStep_Form_Progress"].map((key) => (
            flow[key] && <MetricCard key={key} metricKey={key} data={flow[key]} darkMode={darkMode} />
          ))}
        </Section>

        {/* Section 2: Trust & Engagement */}
        <Section title="Trust & Engagement Signals" icon={ShieldCheck} darkMode={darkMode}>
          {["Testimonials", "Reviews", "Trust_Badges", "Client_Logos", "Case_Studies_Accessibility", "Lead_Magnets", "Exit_Intent_Triggers", "Chatbot_Presence", "Contact_Info_Visibility"].map((key) => (
            flow[key] && <MetricCard key={key} metricKey={key} data={flow[key]} darkMode={darkMode} />
          ))}
        </Section>

        {/* Section 3: UX & Interaction */}
        <Section title="UX Flow & Interaction" icon={LayoutTemplate} darkMode={darkMode}>
          {["Interactive_Elements", "Personalization", "Progress_Indicators", "Friendly_Error_Handling", "Microcopy_Clarity", "Incentives_Displayed", "Scarcity_Urgency", "Smooth_Scrolling", "Mobile_CTA_Adaptation", "MultiChannel_FollowUp"].map((key) => (
            flow[key] && <MetricCard key={key} metricKey={key} data={flow[key]} darkMode={darkMode} />
          ))}
        </Section>

      </main>
    </div>
  );
}