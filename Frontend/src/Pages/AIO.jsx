import React, { useContext } from "react";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import { motion } from "framer-motion";
import {
  CheckCircle, XCircle, AlertTriangle, Info,
  Database, FileText, Zap, Server, RefreshCw, Globe,
  MessageSquare, Tag, Calendar, Link, Copy, Activity,
  Users, Target, FlaskConical, MessageCircle,
  Brain, Cpu, Network
} from "lucide-react";

// ------------------------------------------------------
// ✅ Icon Mapping
// ------------------------------------------------------
const iconMap = {
  Structured_Data: Database,
  Metadata_Complete: FileText,
  Fast_Page_Load: Zap,
  API_Data_Access: Server,
  Dynamic_Content_Available: RefreshCw,
  Multilingual_Support: Globe,
  Content_NLP_Friendly: MessageSquare,
  Keywords_Entities_Annotated: Tag,
  Content_Updated_Regularly: Calendar,
  Internal_Linking_AI_Friendly: Link,
  Duplicate_Content_Detection_Ready: Copy,
  Behavior_Tracking_Implemented: Activity,
  Segmentation_Profiling_Ready: Users,
  Event_Goal_Tracking_Integrated: Target,
  AB_Testing_Ready: FlaskConical,
  User_Feedback_Loops_Present: MessageCircle,
};

// ------------------------------------------------------
// ✅ Educational Content
// ------------------------------------------------------
const educationalContent = {
  Structured_Data: { desc: "Checks for valid JSON-LD structured data.", why: "Helps AI understand context." },
  Metadata_Complete: { desc: "Verifies essential meta tags.", why: "Ensures accurate AI summaries." },
  Fast_Page_Load: { desc: "Measures page load speed.", why: "Crucial for AI crawling efficiency." },
  API_Data_Access: { desc: "Checks for accessible API endpoints.", why: "Allows direct data consumption by AI." },
  Dynamic_Content_Available: { desc: "Detects dynamic content.", why: "Enables personalized experiences." },
  Multilingual_Support: { desc: "Checks for language tags.", why: "Supports global AI reach." },
  Content_NLP_Friendly: { desc: "Evaluates semantic structure.", why: "Helps NLP models parse content." },
  Keywords_Entities_Annotated: { desc: "Checks for keyword annotations.", why: "Identifies key topics for AI." },
  Content_Updated_Regularly: { desc: "Monitors content freshness.", why: "Fresh content is prioritized." },
  Internal_Linking_AI_Friendly: { desc: "Analyzes internal links.", why: "Maps site structure for AI." },
  Duplicate_Content_Detection_Ready: { desc: "Checks for duplicate protection.", why: "Ensures correct indexing." },
  Behavior_Tracking_Implemented: { desc: "Verifies behavior tracking.", why: "Feeds personalization models." },
  Segmentation_Profiling_Ready: { desc: "Checks segmentation setup.", why: "Tailors AI responses." },
  Event_Goal_Tracking_Integrated: { desc: "Validates goal tracking.", why: "Optimizes AI objectives." },
  AB_Testing_Ready: { desc: "Checks for A/B testing.", why: "Supports automated experiments." },
  User_Feedback_Loops_Present: { desc: "Detects feedback forms.", why: "Provides training data." },
};

// ------------------------------------------------------
// ✅ Simple Skeleton
// ------------------------------------------------------
const AIOShimmer = ({ darkMode }) => (
  <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} p-8 space-y-8`}>
    <div className={`h-64 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} animate-pulse`} />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(9)].map((_, i) => (
        <div key={i} className={`h-40 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} animate-pulse`} />
      ))}
    </div>
  </div>
);

// ------------------------------------------------------
// ✅ Simple Metric Card
// ------------------------------------------------------
const MetricCard = ({ metricKey, data, darkMode }) => {
  const { score, details, meta } = data || {};
  const isPassed = score === 100;
  const isWarning = score === 50;

  const Icon = iconMap[metricKey] || CheckCircle;
  const content = educationalContent[metricKey] || { desc: "Metric check.", why: "Important for AI." };
  const title = metricKey.replaceAll("_", " ");

  // Simple Colors
  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";

  let statusColor = "text-red-600 bg-red-50 border-red-100";
  let statusText = "Failed";
  let borderClass = "border-l-4 border-l-red-500";

  if (darkMode) {
    statusColor = "text-red-400 bg-red-900/20 border-red-800/30";
  }

  if (isPassed) {
    statusColor = darkMode ? "text-green-400 bg-green-900/20 border-green-800/30" : "text-green-600 bg-green-50 border-green-100";
    statusText = "Passed";
    borderClass = "border-l-4 border-l-green-500";
  } else if (isWarning) {
    statusColor = darkMode ? "text-yellow-400 bg-yellow-900/20 border-yellow-800/30" : "text-yellow-600 bg-yellow-50 border-yellow-100";
    statusText = "Warning";
    borderClass = "border-l-4 border-l-yellow-500";
  }

  const hasMetaDetails = meta && Object.keys(meta).some(k => k !== 'count');

  return (
    <div className={`rounded-lg border shadow-sm p-5 ${cardBg} ${borderClass} flex flex-col h-full`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
            <Icon size={20} />
          </div>
          <h3 className={`font-bold text-base ${textColor}`}>{title}</h3>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded border ${statusColor}`}>
          {statusText}
        </span>
      </div>

      <p className={`text-sm mb-3 ${isPassed ? "text-green-600 dark:text-green-400" : isWarning ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
        {details}
      </p>

      <div className={`mt-auto pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
        <p className={`text-xs ${subTextColor} mb-1`}>{content.desc}</p>
        <p className={`text-xs font-medium ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
          Why: {content.why}
        </p>
      </div>

      {/* Simple Diagnostics Panel */}
      {!isPassed && hasMetaDetails && (
        <div className={`mt-3 p-3 rounded text-xs font-mono ${darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-50 text-gray-700"}`}>
          <div className="font-bold mb-2 uppercase tracking-wider opacity-70">Diagnostics</div>
          <div className="space-y-1">
            {Object.entries(meta).map(([k, v]) => {
              if (k === 'count') return null;
              return (
                <div key={k} className="break-all">
                  <span className="font-semibold">{k.replace(/([A-Z])/g, ' $1').trim()}: </span>
                  <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------
// ✅ Simple Section
// ------------------------------------------------------
const Section = ({ title, icon: Icon, children, darkMode }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-gray-700">
      <Icon size={24} className={darkMode ? "text-indigo-400" : "text-indigo-600"} />
      <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{title}</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  </div>
);

// ------------------------------------------------------
// ✅ Main Component
// ------------------------------------------------------
export default function AIO() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const darkMode = theme === "dark";

  if (loading || !data || data.Status === "inprogress") {
    return <AIOShimmer darkMode={darkMode} />;
  }

  const aio = data?.AIO_Readiness || {};
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  return (
    <div className={`min-h-screen w-full ${mainBg} transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* Simple Header */}
        <div className={`rounded-xl p-8 shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <h1 className={`text-3xl font-bold ${textColor}`}>AIO Readiness Report</h1>
              <p className={`max-w-2xl ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Evaluation of your website's readiness for Artificial Intelligence optimization and crawlers.
              </p>
              <div className="flex gap-4 justify-center md:justify-start text-sm font-medium">
                <span className={`px-3 py-1 rounded-full ${darkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"}`}>
                  {Object.values(aio).filter(m => m?.score === 100).length} Passed
                </span>
                <span className={`px-3 py-1 rounded-full ${darkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"}`}>
                  {Object.values(aio).filter(m => m?.score < 100).length} Issues
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className={`text-4xl font-black ${textColor}`}>{aio?.Percentage || 0}%</div>
                <div className={`text-xs uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Score</div>
              </div>
              <CircularProgress value={aio?.Percentage || 0} size={80} stroke={8} />
            </div>
          </div>
        </div>

        <Section title="AI Data & Structure" icon={Database} darkMode={darkMode}>
          {["Structured_Data", "Metadata_Complete", "Fast_Page_Load", "API_Data_Access", "Dynamic_Content_Available"].map((key) => (
            aio[key] && <MetricCard key={key} metricKey={key} data={aio[key]} darkMode={darkMode} />
          ))}
        </Section>

        <Section title="AI Content Intelligence" icon={Brain} darkMode={darkMode}>
          {["Multilingual_Support", "Content_NLP_Friendly", "Keywords_Entities_Annotated", "Content_Updated_Regularly", "Internal_Linking_AI_Friendly"].map((key) => (
            aio[key] && <MetricCard key={key} metricKey={key} data={aio[key]} darkMode={darkMode} />
          ))}
        </Section>

        <Section title="AI Analytics & Automation" icon={Cpu} darkMode={darkMode}>
          {["Duplicate_Content_Detection_Ready", "Behavior_Tracking_Implemented", "Segmentation_Profiling_Ready", "Event_Goal_Tracking_Integrated", "AB_Testing_Ready"].map((key) => (
            aio[key] && <MetricCard key={key} metricKey={key} data={aio[key]} darkMode={darkMode} />
          ))}
        </Section>

        <Section title="AI Personalization & Feedback" icon={Network} darkMode={darkMode}>
          {["User_Feedback_Loops_Present", "Dynamic_Personalization", "AI_Content_Distribution", "AI_Friendly_Structure"].map((key) => (
            aio[key] && <MetricCard key={key} metricKey={key} data={aio[key]} darkMode={darkMode} />
          ))}
        </Section>

      </main>
    </div>
  );
}