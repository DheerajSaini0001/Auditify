import React, { useContext } from "react";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import { motion } from "framer-motion";
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
// ✅ Descriptions & Educational Content
// ------------------------------------------------------
const educationalContent = {
  CTA_Visibility: {
    desc: "Checks if primary CTAs are visible and above the fold.",
    why: "Visible CTAs guide users to take action immediately, increasing conversion rates."
  },
  CTA_Clarity: {
    desc: "Evaluates if CTAs clearly communicate the intended action.",
    why: "Clear text like 'Buy Now' reduces cognitive load compared to vague text like 'Click Here'."
  },
  CTA_Contrast: {
    desc: "Assesses color contrast and visual distinction of CTAs.",
    why: "High contrast ensures buttons stand out and are accessible to all users."
  },
  CTA_Crowding: {
    desc: "Ensures CTAs are well-spaced and not cluttered.",
    why: "Too many competing CTAs can cause decision paralysis and lower conversions."
  },
  CTA_Flow_Alignment: {
    desc: "Checks if CTAs are placed in a natural reading flow.",
    why: "CTAs should appear when the user is ready to act, not too early or too late."
  },
  Form_Presence: {
    desc: "Verifies that forms exist on key conversion pages.",
    why: "Lead capture forms are essential for collecting user information."
  },
  Form_Length: {
    desc: "Measures form complexity; shorter forms convert better.",
    why: "Reducing fields increases completion rates by minimizing user effort."
  },
  Required_vs_Optional_Fields: {
    desc: "Ensures clarity between mandatory and optional fields.",
    why: "Users need to know exactly what is required to prevent frustration."
  },
  Inline_Validation: {
    desc: "Checks for real-time field validation to reduce form errors.",
    why: "Real-time feedback helps users correct errors instantly, improving experience."
  },
  Submit_Button_Clarity: {
    desc: "Analyzes visibility and clarity of the submit button.",
    why: "The submit button is the final step; it must be obvious and actionable."
  },
  AutoFocus_Field: {
    desc: "Ensures the cursor auto-focuses on the first field.",
    why: "Auto-focus reduces friction by saving the user a click."
  },
  MultiStep_Form_Progress: {
    desc: "Checks multi-step form usability and progress visibility.",
    why: "Progress indicators reduce abandonment by showing users how close they are to finishing."
  },
  Testimonials: {
    desc: "Validates presence of customer testimonials for trust.",
    why: "Social proof builds credibility and trust with potential customers."
  },
  Reviews: {
    desc: "Checks for product/service reviews to build credibility.",
    why: "Reviews provide unbiased feedback that influences purchasing decisions."
  },
  Trust_Badges: {
    desc: "Detects security/trust badges improving confidence.",
    why: "Badges (SSL, Payment) reassure users that their data is safe."
  },
  Client_Logos: {
    desc: "Verifies display of notable client logos.",
    why: "Showcasing recognizable clients establishes authority and reliability."
  },
  Case_Studies_Accessibility: {
    desc: "Checks accessibility of case studies or portfolios.",
    why: "Case studies prove your value proposition with real-world examples."
  },
  Exit_Intent_Triggers: {
    desc: "Detects exit intent popups or re-engagement triggers.",
    why: "Capturing users before they leave can recover lost leads."
  },
  Lead_Magnets: {
    desc: "Checks for offers like free downloads, demos, or resources.",
    why: "Free value (magnets) incentivizes users to share their contact info."
  },
  Contact_Info_Visibility: {
    desc: "Ensures phone/email info is clearly visible.",
    why: "Visible contact info builds trust and provides a safety net for users."
  },
  Chatbot_Presence: {
    desc: "Verifies chatbot or instant support availability.",
    why: "Immediate support answers questions that might otherwise block a sale."
  },
  Interactive_Elements: {
    desc: "Checks interactive engagement tools like quizzes/sliders.",
    why: "Interactivity keeps users engaged longer and can personalize the experience."
  },
  Personalization: {
    desc: "Assesses AI-based or dynamic personalization presence.",
    why: "Personalized experiences feel more relevant and increase conversion likelihood."
  },
  Progress_Indicators: {
    desc: "Validates progress bars or indicators during steps.",
    why: "Visual progress encourages users to complete long tasks."
  },
  Friendly_Error_Handling: {
    desc: "Ensures clear error messages and input feedback.",
    why: "Friendly errors help users recover quickly without frustration."
  },
  Microcopy_Clarity: {
    desc: "Checks clarity of helper text and microcopy messages.",
    why: "Clear microcopy resolves ambiguity and guides users smoothly."
  },
  Incentives_Displayed: {
    desc: "Verifies incentive display like discounts or offers.",
    why: "Incentives provide a compelling reason to act now."
  },
  Scarcity_Urgency: {
    desc: "Checks use of urgency triggers (limited time/stock).",
    why: "Urgency leverages FOMO to encourage immediate action."
  },
  Smooth_Scrolling: {
    desc: "Ensures smooth scrolling enhances UX flow.",
    why: "Smooth transitions make the site feel polished and modern."
  },
  Mobile_CTA_Adaptation: {
    desc: "Checks if CTAs are optimized for mobile users.",
    why: "Mobile users need larger, easily tappable targets."
  },
  MultiChannel_FollowUp: {
    desc: "Verifies multi-channel follow-up strategies post-lead.",
    why: "Engaging users across multiple channels increases retention."
  },
};

// ------------------------------------------------------
// ✅ Skeleton Components
// ------------------------------------------------------
const SkeletonMetricCard = ({ darkMode }) => {
  const shimmerBg = darkMode ? "bg-gray-800" : "bg-gray-200";
  return (
    <div className={`h-48 rounded-2xl ${shimmerBg} animate-pulse`} />
  );
};

const ConversionShimmer = ({ darkMode }) => {
  const mainBg = darkMode ? "bg-gray-950" : "bg-gray-50";
  return (
    <div className={`min-h-screen ${mainBg} p-8 space-y-8`}>
      <div className={`h-80 rounded-3xl ${darkMode ? "bg-gray-900" : "bg-white"} animate-pulse shadow-xl`} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
  const isWarning = score === 50;

  const Icon = iconMap[metricKey] || CheckCircle;
  const content = educationalContent[metricKey] || { desc: "Conversion metric.", why: "Important for optimization." };
  const title = metricKey.replaceAll("_", " ");

  // Dynamic Styles based on status
  const cardBg = darkMode
    ? "bg-gray-900/80 backdrop-blur-md border-gray-800"
    : "bg-white/90 backdrop-blur-md border-gray-100";

  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";

  let statusColor = "text-rose-500 bg-rose-500/10 border-rose-500/20";
  let statusText = "Needs Attention";
  let StatusIcon = XCircle;
  let accentGradient = "from-rose-500 to-red-600";
  let iconStyle = darkMode ? "bg-rose-500/10 text-rose-400" : "bg-rose-50 text-rose-600";

  if (isPassed) {
    statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    statusText = "Passed";
    StatusIcon = CheckCircle;
    accentGradient = "from-emerald-500 to-teal-500";
    iconStyle = darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600";
  } else if (isWarning) {
    statusColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    statusText = "Warning";
    StatusIcon = AlertTriangle;
    accentGradient = "from-amber-500 to-orange-500";
    iconStyle = darkMode ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600";
  }

  const hasMetaDetails = meta && Object.keys(meta).some(k => k !== 'count');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className={`relative overflow-hidden rounded-2xl border ${cardBg} shadow-sm flex flex-col h-full`}
    >
      {/* Top Accent Line */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${accentGradient} opacity-80`} />

      <div className="p-6 flex-1 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-xl shadow-sm ${iconStyle}`}>
              <Icon size={24} />
            </div>
            <div>
              <h3 className={`font-bold text-lg leading-tight ${textColor}`}>{title}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor} flex items-center gap-1.5`}>
                  <StatusIcon size={12} />
                  {statusText}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Detail */}
        <div className="flex-1">
          <p className={`text-sm font-medium leading-relaxed ${isPassed ? "text-emerald-600 dark:text-emerald-400" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
            {details || "No details available"}
          </p>

          {/* Detected Value */}
          {meta?.count !== undefined && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <span className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Detected:</span>
              <span className={`text-sm font-bold font-mono ${isPassed ? "text-emerald-500" : "text-rose-500"}`}>{String(meta.count)}</span>
            </div>
          )}
        </div>

        {/* Educational Content Box */}
        <div className={`mt-2 p-4 rounded-xl ${darkMode ? "bg-gray-800/50 border border-gray-700/50" : "bg-gray-50 border border-gray-100"}`}>
          <p className={`text-sm ${subTextColor} leading-relaxed mb-2`}>
            {content.desc}
          </p>
          <div className="flex gap-2 items-start">
            <Info size={14} className={`mt-0.5 shrink-0 ${darkMode ? "text-blue-400" : "text-blue-500"}`} />
            <p className={`text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              <span className="opacity-70">Why it matters:</span> {content.why}
            </p>
          </div>
        </div>

        {/* Failure Analysis (Only for Failures/Warnings) */}
        {!isPassed && hasMetaDetails && (
          <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className={`rounded-xl overflow-hidden border ${darkMode ? "bg-gray-950 border-gray-800" : "bg-slate-900 border-slate-800"} shadow-inner`}>
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-2 text-rose-400">
                  <Activity size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Diagnostics</span>
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-60 overflow-y-auto custom-scrollbar text-xs font-mono text-slate-300">
                {Object.entries(meta).map(([key, value]) => {
                  if (key === 'count') return null;

                  return (
                    <div key={key} className="group/item">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 group-hover/item:text-blue-400 transition-colors">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>

                      {Array.isArray(value) ? (
                        <div className="pl-3 border-l-2 border-slate-700 space-y-2">
                          {value.length > 0 ? value.map((item, idx) => (
                            <div key={idx} className="break-all">
                              {typeof item === 'object' ? (
                                <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50">
                                  {Object.entries(item).map(([k, v]) => (
                                    <div key={k} className="flex gap-3 justify-between border-b border-white/5 last:border-0 pb-1 last:pb-0 mb-1 last:mb-0">
                                      <span className="opacity-50">{k}:</span>
                                      <span className="text-emerald-400">{String(v)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-start gap-2">
                                  <span className="text-rose-500 mt-1">›</span>
                                  <span>{String(item)}</span>
                                </div>
                              )}
                            </div>
                          )) : <span className="italic opacity-30">None</span>}
                        </div>
                      ) : (
                        <div className="pl-3 border-l-2 border-slate-700 break-all text-emerald-400">
                          {String(value)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
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
      className="space-y-8"
    >
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className={`p-3 rounded-2xl ${darkMode ? "bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]" : "bg-indigo-50 text-indigo-600 shadow-sm"}`}>
          <Icon size={28} />
        </div>
        <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {children}
      </div>
    </motion.div>
  );
};

// ------------------------------------------------------
// ✅ MAIN COMPONENT
// ------------------------------------------------------
export default function Conversion_Lead_Flow() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const darkMode = theme === "dark";

  if (loading || !data || data.Status === "inprogress") {
    return <ConversionShimmer darkMode={darkMode} />;
  }

  const flow = data?.Conversion_and_Lead_Flow || {};
  const mainBg = darkMode ? "bg-[#0B0F19]" : "bg-gray-50"; // Darker, richer background for dark mode
  const textColor = darkMode ? "text-white" : "text-gray-900";

  return (
    <div className={`min-h-screen w-full ${mainBg} transition-colors duration-500`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`relative overflow-hidden rounded-[2.5rem] p-8 sm:p-16 shadow-2xl ${darkMode ? "bg-gradient-to-br from-gray-900 via-[#111827] to-black border border-gray-800" : "bg-white border border-gray-100"}`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${darkMode ? "white" : "black"} 1px, transparent 0)`, backgroundSize: "40px 40px" }}>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="text-center lg:text-left space-y-8 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest border border-indigo-500/20 backdrop-blur-sm shadow-sm">
                <Target size={14} />
                <span>Conversion Audit Report</span>
              </div>

              <h1 className={`text-5xl sm:text-7xl font-black tracking-tighter ${textColor} leading-[1.1]`}>
                Conversion & <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-x">
                  Lead Flow
                </span>
              </h1>

              <p className={`text-xl ${darkMode ? "text-gray-400" : "text-gray-600"} leading-relaxed font-light`}>
                Comprehensive analysis of your conversion funnels, CTA effectiveness, and user journey optimization.
              </p>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
                {(() => {
                  const allMetrics = Object.values(flow).filter(val => typeof val === 'object' && val !== null && 'score' in val);
                  const passedCount = allMetrics.filter(m => m.score === 100).length;
                  const warningCount = allMetrics.filter(m => m.score === 50).length;
                  const failedCount = allMetrics.filter(m => m.score === 0).length;

                  return (
                    <>
                      <div className={`flex items-center gap-3 text-sm font-bold px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${darkMode ? "bg-gray-800/50 text-emerald-400 border border-emerald-500/20" : "bg-white text-emerald-600 border border-emerald-100"}`}>
                        <div className="p-1.5 bg-emerald-500/10 rounded-full"><CheckCircle size={20} /></div>
                        <div className="flex flex-col text-left">
                          <span className="text-2xl font-black leading-none">{passedCount}</span>
                          <span className="text-[10px] uppercase opacity-70">Passing</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 text-sm font-bold px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${darkMode ? "bg-gray-800/50 text-amber-400 border border-amber-500/20" : "bg-white text-amber-600 border border-amber-100"}`}>
                        <div className="p-1.5 bg-amber-500/10 rounded-full"><AlertTriangle size={20} /></div>
                        <div className="flex flex-col text-left">
                          <span className="text-2xl font-black leading-none">{warningCount}</span>
                          <span className="text-[10px] uppercase opacity-70">Warnings</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 text-sm font-bold px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${darkMode ? "bg-gray-800/50 text-rose-400 border border-rose-500/20" : "bg-white text-rose-600 border border-rose-100"}`}>
                        <div className="p-1.5 bg-rose-500/10 rounded-full"><XCircle size={20} /></div>
                        <div className="flex flex-col text-left">
                          <span className="text-2xl font-black leading-none">{failedCount}</span>
                          <span className="text-[10px] uppercase opacity-70">Critical</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex flex-col items-center gap-8 relative">
              <div className="relative group cursor-default">
                <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 ${darkMode ? "bg-indigo-500" : "bg-indigo-600"}`}></div>
                <CircularProgress value={flow?.Percentage || 0} size={220} stroke={20} />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-6xl font-black ${textColor} tracking-tighter`}>{flow?.Percentage || 0}</span>
                  <span className={`text-xs font-bold uppercase tracking-[0.2em] mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Score</span>
                </div>
              </div>
              <div className={`flex items-center gap-3 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg ${darkMode ? "bg-gray-800 text-gray-300 border border-gray-700" : "bg-white text-gray-600 border border-gray-100"}`}>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Time Taken: <span className="font-mono font-bold">{data.Time_Taken}</span>
              </div>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-32 -mr-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
          <div className="absolute bottom-0 left-0 -mb-32 -ml-32 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
        </motion.div>

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