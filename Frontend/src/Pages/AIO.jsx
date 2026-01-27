import React, { useContext } from "react";
import UrlHeader from "../Component/UrlHeader";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  CheckCircle, XCircle, AlertTriangle, Info,
  Database, FileText, Zap, Server, RefreshCw, Globe,
  MessageSquare, Tag, Calendar, Link, Copy, Activity,
  Users, Target, FlaskConical, MessageCircle,
  Brain, Cpu, Network, Loader2
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";

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
  Structured_Data: {
    title: "Structured Data",
    desc: "Checks for valid JSON-LD structured data.",
    why: "Helps AI understand context.",
    use: "Schema markup (JSON-LD) explicitly tells machines what the content means.",
    impact: "Essential for Rich Snippets and AI training data.",
    improvement: "Implement Schema.org types (Article, Product, FAQ)."
  },
  Metadata_Complete: {
    title: "Meta Tags",
    desc: "Verifies essential meta tags.",
    why: "Ensures accurate AI summaries.",
    use: "Checks for title, description, and social meta tags.",
    impact: "AI summarizers rely on these tags to generate snippets.",
    improvement: "Ensure every page has unique meta tags."
  },
  Fast_Page_Load: {
    title: "Load Speed",
    desc: "Measures page load speed.",
    why: "Crucial for AI crawling efficiency.",
    use: "Fast loading pages are easier and cheaper for AI bots to crawl.",
    impact: "Slow sites get crawled less frequently by AI search engines.",
    improvement: "Optimize LCP and reduce server response time."
  },
  API_Data_Access: {
    title: "API Access",
    desc: "Checks for accessible API endpoints.",
    why: "Allows direct data consumption by AI.",
    use: "Detects if content is accessible via JSON/XML APIs.",
    impact: "AI agents prefer structured API data over scraping HTML.",
    improvement: "Expose public content via a REST or GraphQL API."
  },
  Dynamic_Content_Available: {
    title: "Dynamic Content",
    desc: "Detects dynamic content.",
    why: "Enables personalized experiences.",
    use: "Checks if content changes based on user interaction.",
    impact: "Static sites are harder to personalize for AI-driven user journeys.",
    improvement: "Use client-side rendering or edge functions."
  },
  Multilingual_Support: {
    title: "Multilingual",
    desc: "Checks for language tags.",
    why: "Supports global AI reach.",
    use: "Verifies headers and HTML tags for language declaration.",
    impact: "AI translation models fail without clear language signals.",
    improvement: "Use 'lang' attribute and Hreflang tags."
  },
  Content_NLP_Friendly: {
    title: "NLP Friendly",
    desc: "Evaluates semantic structure.",
    why: "Helps NLP models parse content.",
    use: "Checks sentence structure and semantic HTML.",
    impact: "Complex, unstructured text confuses Natural Language Processing models.",
    improvement: "Use simple sentences and semantic tags (<article>, <section>)."
  },
  Keywords_Entities_Annotated: {
    title: "Entity Annotation",
    desc: "Checks for keyword annotations.",
    why: "Identifies key topics for AI.",
    use: "Checks if entities are tagged (e.g., using specific HTML attributes).",
    impact: "Helps AI map relationships between concepts.",
    improvement: "Use semantic HTML5 tags to highlight entities."
  },
  Content_Updated_Regularly: {
    title: "Freshness",
    desc: "Monitors content freshness.",
    why: "Fresh content is prioritized.",
    use: "Checks last-modified headers.",
    impact: "AI models favor up-to-date information.",
    improvement: "Update content regularly and send 'Last-Modified' headers."
  },
  Internal_Linking_AI_Friendly: {
    title: "Internal Linking",
    desc: "Analyzes internal links.",
    why: "Maps site structure for AI.",
    use: "Checks link depth and anchor text.",
    impact: "AI crawlers follow links to discover relationships.",
    improvement: "Use descriptive anchor text for internal links."
  },
  Duplicate_Content_Detection_Ready: {
    title: "Duplicate Check",
    desc: "Checks for duplicate protection.",
    why: "Ensures correct indexing.",
    use: "Verifies canonical tags.",
    impact: "Duplicate content confuses AI about the authoritative source.",
    improvement: "Use self-referencing canonical tags."
  },
  Behavior_Tracking_Implemented: {
    title: "Behavior Tracking",
    desc: "Verifies behavior tracking.",
    why: "Feeds personalization models.",
    use: "Checks for analytics scripts.",
    impact: "Data on user behavior is fuel for AI personalization algorithms.",
    improvement: "Implement event tracking (Google Analytics 4)."
  },
  Segmentation_Profiling_Ready: {
    title: "Segmentation",
    desc: "Checks segmentation setup.",
    why: "Tailors AI responses.",
    use: "Checks if users can be grouped by attributes.",
    impact: "AI needs segments to deliver relevant recommendations.",
    improvement: "Capture user attributes (role, interest)."
  },
  Event_Goal_Tracking_Integrated: {
    title: "Goal Tracking",
    desc: "Validates goal tracking.",
    why: "Optimizes AI objectives.",
    use: "Checks if conversion goals are defined.",
    impact: "AI optimization needs clear success metrics.",
    improvement: "Define clear conversion events."
  },
  AB_Testing_Ready: {
    title: "A/B Testing",
    desc: "Checks for A/B testing.",
    why: "Supports automated experiments.",
    use: "Detects testing frameworks.",
    impact: "AI can auto-optimize pages if testing infrastructure exists.",
    improvement: "Integrate a testing tool (VWO, Optimizely)."
  },
  User_Feedback_Loops_Present: {
    title: "Feedback Loops",
    desc: "Detects feedback forms.",
    why: "Provides training data.",
    use: "Checks for rating widgets or comment sections.",
    impact: "User feedback reinforces AI learning (RLHF).",
    improvement: "Add 'Was this helpful?' buttons."
  },
  Dynamic_Personalization: {
    title: "Dynamic Personalization",
    desc: "Checks personalization capabilities.",
    why: "Tailors content to user context.",
    use: "Verifies ability to change content dynamically.",
    impact: "Increases engagement.",
    improvement: "Use personalized content blocks."
  },
  AI_Content_Distribution: {
    title: "AI Distribution",
    desc: "Checks readiness for AI feeds.",
    why: "Distributes content via AI channels.",
    use: "Checks for RSS/Atom feeds.",
    impact: "Feeds AI aggregators.",
    improvement: "Enable RSS feeds."
  },
  AI_Friendly_Structure: {
    title: "AI Friendly Structure",
    desc: "Checks overall structure.",
    why: "Easier for AI to parse.",
    use: "Verifies logical hierarchy.",
    impact: "Better understanding by AI models.",
    improvement: "Use widely accepted patterns."
  }
};

// ------------------------------------------------------
// ✅ Enhanced Shimmer
// ------------------------------------------------------
const ShimmerBlock = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
  </div>
);

const AIOShimmer = ({ darkMode }) => (
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
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 animate-pulse">Running AIO Audit...</h1>
            <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Analyzing Structured Data, NLP Compatibility, and AI Readiness.</p>
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
          <Brain size={24} />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {["Analyzing Structured Data...", "Checking NLP Compatibility...", "Verifying Metadata...", "Scanning for AI Optimizations...", "Testing API Access...", "Analyzing Entity Recognition..."].map((text, i) => (
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

  const Icon = iconMap[metricKey] || CheckCircle;
  const content = educationalContent[metricKey] || { desc: "Metric check.", why: "Important for AI." };
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
              <Icon size={24} className={darkMode ? "text-indigo-400" : "text-indigo-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
              <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full w-fit border ${statusColor}`}>
                {isPassed ? "Ready" : "Optimization Needed"}
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
      <div className={`p-2 rounded-lg ${darkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"}`}>
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
export default function AIO() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const darkMode = theme === "dark";

  if (loading || !data || data.status === "inprogress") {
    return (
      <div className={`min-h-screen w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          <UrlHeader darkMode={darkMode} />
          {/* ✅ Live Preview (Only for Full Audit) */}
          <LivePreview data={data} showInFullAudit={false} />
          <AIOShimmer darkMode={darkMode} />
        </main>
      </div>
    );
  }

  const aio = data?.aioReadiness || {};
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  const allMetrics = Object.values(aio).filter(val => typeof val === 'object' && val !== null && 'score' in val);
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-medium border border-indigo-500/20">
                <Brain size={14} />
                <span>AI Readiness Report</span>
              </div>
              <h1 className={`text-4xl sm:text-5xl font-black tracking-tight ${textColor}`}>
                AIO <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Readiness</span>
              </h1>
              <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Evaluation of your website's readiness for Artificial Intelligence optimization and crawlers.
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
                <CircularProgress value={aio?.Percentage || 0} size={140} stroke={12} />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-3xl font-bold ${textColor}`}>{aio?.Percentage || 0}%</span>
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
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <Section title="AI Data & Structure" icon={Database} darkMode={darkMode}>
          {["Structured_Data", "Metadata_Complete", "Fast_Page_Load", "API_Data_Access", "Dynamic_Content_Available"].map((key) => (
            aio[key] && <MetricCard key={key} metricKey={key} data={aio[key]} darkMode={darkMode} onInfo={() => setSelectedMetricInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
          ))}
        </Section>

        <Section title="AI Content Intelligence" icon={Brain} darkMode={darkMode}>
          {["Multilingual_Support", "Content_NLP_Friendly", "Keywords_Entities_Annotated", "Content_Updated_Regularly", "Internal_Linking_AI_Friendly"].map((key) => (
            aio[key] && <MetricCard key={key} metricKey={key} data={aio[key]} darkMode={darkMode} onInfo={() => setSelectedMetricInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
          ))}
        </Section>

        <Section title="AI Analytics & Automation" icon={Cpu} darkMode={darkMode}>
          {["Duplicate_Content_Detection_Ready", "Behavior_Tracking_Implemented", "Segmentation_Profiling_Ready", "Event_Goal_Tracking_Integrated", "AB_Testing_Ready"].map((key) => (
            aio[key] && <MetricCard key={key} metricKey={key} data={aio[key]} darkMode={darkMode} onInfo={() => setSelectedMetricInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
          ))}
        </Section>

        <Section title="AI Personalization & Feedback" icon={Network} darkMode={darkMode}>
          {["User_Feedback_Loops_Present", "Dynamic_Personalization", "AI_Content_Distribution", "AI_Friendly_Structure"].map((key) => (
            aio[key] && <MetricCard key={key} metricKey={key} data={aio[key]} darkMode={darkMode} onInfo={() => setSelectedMetricInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
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