import React, { useContext, useMemo } from "react";
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
    impact: "Structured data is like a translator for search engines. It turns your content into answers.",
    improvement: "Add Schema markup to help Google display rich snippets (stars, prices, FAQs).",
    calculation: "We scan your code for JSON-LD schema markup."
  },
  Metadata_Complete: {
    title: "Meta Tags",
    desc: "Verifies essential meta tags.",
    why: "Ensures accurate AI summaries.",
    use: "Checks for title, description, and social meta tags.",
    impact: "AI bots read your meta tags first. If they are missing, you risk being ignored.",
    improvement: "Ensure every page has a unique title and description that summarizes the content.",
    calculation: "We check for the presence of title, description, and social meta tags."
  },
  Fast_Page_Load: {
    title: "Load Speed",
    desc: "Measures page load speed.",
    why: "Crucial for AI crawling efficiency.",
    use: "Fast loading pages are easier and cheaper for AI bots to crawl.",
    impact: "Slow sites are expensive for AI to crawl. If you're slow, you get indexed less.",
    improvement: "Speed up your site so AI agents can read more of your pages in less time.",
    calculation: "We measure how fast your page loads standard content."
  },
  API_Data_Access: {
    title: "API Access",
    desc: "Checks for accessible API endpoints.",
    why: "Allows direct data consumption by AI.",
    use: "Detects if content is accessible via JSON/XML APIs.",
    impact: "Advanced AI agents prefer raw data over messy HTML. An API makes you AI-ready.",
    improvement: "If you have a lot of data, consider offering a public API.",
    calculation: "We look for links to API documentation."
  },
  Dynamic_Content_Available: {
    title: "Dynamic Content",
    desc: "Detects dynamic content.",
    why: "Enables personalized experiences.",
    use: "Checks if content changes based on user interaction.",
    impact: "Static sites are boring. Dynamic sites can adapt to who is visiting.",
    improvement: "Use tools that let you change content based on user behavior.",
    calculation: "We check if your site structure allows for dynamic updates."
  },
  Multilingual_Support: {
    title: "Multilingual",
    desc: "Checks for language tags.",
    why: "Supports global AI reach.",
    use: "Verifies headers and HTML tags for language declaration.",
    impact: "AI is global. If you only speak English, you miss 80% of the world.",
    improvement: "Use 'hreflang' tags to tell AI which language your page is in.",
    calculation: "We check for language tags in your HTML."
  },
  Content_NLP_Friendly: {
    title: "NLP Friendly",
    desc: "Evaluates semantic structure.",
    why: "Helps NLP models parse content.",
    use: "Checks sentence structure and semantic HTML.",
    impact: "If your sentences are too complex, AI gets confused. Simple writing wins.",
    improvement: "Write in short, clear sentences. Use headings to organize your thoughts.",
    calculation: "We analyze readability and structure."
  },
  Keywords_Entities_Annotated: {
    title: "Entity Annotation",
    desc: "Checks for keyword annotations.",
    why: "Identifies key topics for AI.",
    use: "Checks if entities are tagged (e.g., using specific HTML attributes).",
    impact: "Keywords are good, but 'Entities' are better. They help AI understand context.",
    improvement: "Use markup to highlight important people, places, and products.",
    calculation: "We check for semantic tags that identify specific entities."
  },
  Content_Updated_Regularly: {
    title: "Freshness",
    desc: "Monitors content freshness.",
    why: "Fresh content is prioritized.",
    use: "Checks last-modified headers.",
    impact: "Old news is no news. AI loves fresh, up-to-date information.",
    improvement: "Update your key pages regularly to keep AI coming back.",
    calculation: "We check the 'Last-Modified' date of your content."
  },
  Internal_Linking_AI_Friendly: {
    title: "Internal Linking",
    desc: "Analyzes internal links.",
    why: "Maps site structure for AI.",
    use: "Checks link depth and anchor text.",
    impact: "Links are the roads AI travels. No links mean dead ends.",
    improvement: "Use clear text for your links (e.g., 'See Pricing' not 'Click Here').",
    calculation: "We analyze how your internal links describe the destination."
  },
  Duplicate_Content_Detection_Ready: {
    title: "Duplicate Check",
    desc: "Checks for duplicate protection.",
    why: "Ensures correct indexing.",
    use: "Verifies canonical tags.",
    impact: "Duplicate content confuses AI. It doesn't know which page is the 'real' one.",
    improvement: "Use 'canonical' tags to point to the original version of a page.",
    calculation: "We check for canonical tags."
  },
  Behavior_Tracking_Implemented: {
    title: "Behavior Tracking",
    desc: "Verifies behavior tracking.",
    why: "Feeds personalization models.",
    use: "Checks for analytics scripts.",
    impact: "You receive what you measure. Tracking helps AI learn what users like.",
    improvement: "Use analytics to track how users interact with your site.",
    calculation: "We check for common analytics scripts."
  },
  Segmentation_Profiling_Ready: {
    title: "Segmentation",
    desc: "Checks segmentation setup.",
    why: "Tailors AI responses.",
    use: "Checks if users can be grouped by attributes.",
    impact: "Treating everyone the same is inefficient. Segments allow for targeted AI responses.",
    improvement: "Group your users by interest or behavior.",
    calculation: "We check for segmentation tools."
  },
  Event_Goal_Tracking_Integrated: {
    title: "Goal Tracking",
    desc: "Validates goal tracking.",
    why: "Optimizes AI objectives.",
    use: "Checks if conversion goals are defined.",
    impact: "AI needs a goal. Tell it what 'success' looks like.",
    improvement: "Define clear goals (like 'Sign Up') for tracking.",
    calculation: "We check if you are tracking specific success events."
  },
  AB_Testing_Ready: {
    title: "A/B Testing",
    desc: "Checks for A/B testing.",
    why: "Supports automated experiments.",
    use: "Detects testing frameworks.",
    impact: "Guessing is risky. Testing is smart. AI can auto-optimize if you let it.",
    improvement: "Set up A/B testing to let data decide the best design.",
    calculation: "We look for testing tools like Optimizely."
  },
  User_Feedback_Loops_Present: {
    title: "Feedback Loops",
    desc: "Detects feedback forms.",
    why: "Provides training data.",
    use: "Checks for rating widgets or comment sections.",
    impact: "Feedback trains the AI. A simple 'thumbs up' can improve results.",
    improvement: "Add simple feedback buttons to your content.",
    calculation: "We search for feedback widgets."
  },
  Dynamic_Personalization: {
    title: "Dynamic Personalization",
    desc: "Checks personalization capabilities.",
    why: "Tailors content to user context.",
    use: "Verifies ability to change content dynamically.",
    impact: "Personalization increases relevance. Relevance increases sales.",
    improvement: "Show different content to different users based on their history.",
    calculation: "We check for personalization capabilities."
  },
  AI_Content_Distribution: {
    title: "AI Distribution",
    desc: "Checks readiness for AI feeds.",
    why: "Distributes content via AI channels.",
    use: "Checks for RSS/Atom feeds.",
    impact: "Don't wait for users to come to you. Push content to AI where it lives.",
    improvement: "Use RSS feeds to syndicate your content.",
    calculation: "We check for RSS feed links."
  },
  AI_Friendly_Structure: {
    title: "AI Friendly Structure",
    desc: "Checks overall structure.",
    why: "Easier for AI to parse.",
    use: "Verifies logical hierarchy.",
    impact: "A messy room is hard to clean. A messy code structure is hard for AI to read.",
    improvement: "Use standard HTML5 tags (header, nav, main, footer) to organize code.",
    calculation: "We check the logical structure of your HTML code."
  }
};

// ------------------------------------------------------
// ✅ Score Calculation Info (Standard Weights)
// ------------------------------------------------------
const scoreCalculationInfo = {
  icon: Brain,
  title: "AI Optimization (AIO) Readiness",
  guideLink: "https://developers.google.com/search/docs/appearance/structured-data",
  use: (
    <div className="space-y-2">
      <p>Measures how well your website is structured, understood, and usable by modern AI systems — including search engines, AI assistants, recommendation engines, and automation tools.</p>
      <p>It evaluates whether your content, data, and tracking signals are accessible, interpretable, and ready for AI-driven discovery and optimization.</p>
    </div>
  ),
  impact: (
    <div className="space-y-4">
      <p>AI systems increasingly decide what content is surfaced, summarized, recommended, or ignored.</p>

      <div>
        <span className="font-semibold block mb-1">Websites that are AI-ready:</span>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Are easier for search and AI assistants to understand</li>
          <li>Appear more accurately in AI-generated answers</li>
          <li>Enable smarter personalization and automation</li>
          <li>Adapt faster to future AI-driven platforms</li>
        </ul>
      </div>

      <p className="font-medium">AI readiness is quickly becoming as important as SEO.</p>
    </div>
  ),
  improvement: (
    <ul className="list-disc pl-5 space-y-4">
      <li>
        <span className="font-semibold block mb-1">Improve AI understanding of your content:</span>
        <ul className="list-[circle] pl-5 space-y-1 text-sm">
          <li>Use structured data (Schema) to clearly describe pages and entities</li>
          <li>Organize content with semantic HTML and proper headings</li>
          <li>Ensure text content is clear, well-structured, and machine-readable</li>
        </ul>
      </li>
      <li>
        <span className="font-semibold block mb-1">Strengthen metadata and content signals:</span>
        <ul className="list-[circle] pl-5 space-y-1 text-sm">
          <li>Provide complete metadata for search and sharing platforms</li>
          <li>Clearly annotate key topics using headings, image alt text, and page structure</li>
          <li>Keep content fresh and updated when relevant</li>
        </ul>
      </li>
      <li>
        <span className="font-semibold block mb-1">Enable AI-friendly data access:</span>
        <ul className="list-[circle] pl-5 space-y-1 text-sm">
          <li>Expose content and data through APIs or structured endpoints</li>
          <li>Avoid blocking important content behind scripts or inaccessible formats</li>
          <li>Ensure pages load quickly for automated crawlers</li>
        </ul>
      </li>
      <li>
        <span className="font-semibold block mb-1">Support personalization and learning:</span>
        <ul className="list-[circle] pl-5 space-y-1 text-sm">
          <li>Implement behavior tracking to understand user interactions</li>
          <li>Enable segmentation and profiling signals</li>
          <li>Use dynamic content patterns where appropriate</li>
        </ul>
      </li>
      <li>
        <span className="font-semibold block mb-1">Improve AI-driven discovery and indexing:</span>
        <ul className="list-[circle] pl-5 space-y-1 text-sm">
          <li>Use descriptive internal links, not generic anchors</li>
          <li>Prevent duplicate content with canonical or indexing controls</li>
          <li>Support multilingual discovery when targeting multiple regions</li>
        </ul>
      </li>
      <li>
        <span className="font-semibold block mb-1">Close the optimization feedback loop:</span>
        <ul className="list-[circle] pl-5 space-y-1 text-sm">
          <li>Track meaningful events and goals</li>
          <li>Support A/B testing or experimentation</li>
          <li>Collect user feedback to guide continuous improvement</li>
        </ul>
      </li>
    </ul>
  ),
  calculation: (
    <div className="space-y-2">
      <p>We analyze multiple AI-readiness signals across content structure, metadata quality, data accessibility, tracking, and optimization infrastructure.</p>
      <p>Each area is weighted by its importance to AI understanding and automation. Strong signals earn full credit, partial readiness earns partial credit, and missing foundations reduce the score.</p>
      <p>An overall AI Readiness badge indicates whether your site meets a minimum baseline for AI compatibility.</p>
    </div>
  ),
  weightage: [
    { param: "Technical AI Foundation", weight: "35%" },
    { param: "Content NLP Readiness", weight: "25%" },
    { param: "Analytics & Tracking", weight: "25%" },
    { param: "Advanced Capabilities", weight: "15%" }
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

const AIOShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
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
              title="View Methodology"
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

  const auditSteps = useMemo(() => [
    { icon: <Database className="w-8 h-8 text-blue-500" />, title: "Structured Data", text: "Analyzing JSON-LD Schema markup and rich snippets eligibility..." },
    { icon: <MessageSquare className="w-8 h-8 text-purple-500" />, title: "NLP Readiness", text: "Evaluating content structure and semantic clarity for AI models..." },
    { icon: <Zap className="w-8 h-8 text-teal-500" />, title: "Crawl Efficiency", text: "Measuring page load speed and API accessibility for AI bots..." },
    { icon: <Tag className="w-8 h-8 text-indigo-500" />, title: "Entity Recognition", text: "Scanning for named entities, keywords, and topic clusters..." },
    { icon: <Brain className="w-8 h-8 text-amber-500" />, title: "AI Optimization", text: "Checking for voice search compatibility and answer engine readiness..." },
  ], []);

  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (loading || !data || data.status === "inprogress") {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % auditSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);

  if (loading || !data || data.status === "inprogress") {
    return (
      <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>
          {/* ✅ Unified Master Card Loading State */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-slate-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

            {/* 1. URL Header */}
            <div>
              <UrlHeader data={data} darkMode={darkMode} />
            </div>

            <div className="flex flex-col xl:flex-row min-h-[300px]">
              {/* Left Panel: Live Preview (Only if not All) */}
              {data.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              {/* Right/Full Panel: Audit Steps */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full">
                  <AIOShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
                </div>
              </div>
            </div>
          </div>
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
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>

        {/* ✅ Unified Master Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-slate-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

          {/* 1. URL Header */}
          <div>
            <UrlHeader data={data} darkMode={darkMode} />
          </div>

          {/* 2. Card Body */}
          <div className={`flex flex-col xl:flex-row ${data.report === "All" ? "" : "min-h-[300px]"}`}>

            {/* Left Panel: Live Preview (Only if not All) */}
            {data.report !== "All" && (
              <div className={`w-full xl:w-[45%] ${data.report === "All" ? "p-6 lg:p-10" : "p-3 lg:p-4"} flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>
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
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${darkMode ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-indigo-100/50 text-indigo-600 border border-indigo-200"}`}>
                        <Brain className="w-3.5 h-3.5" />
                        <span>AIO Readiness Report</span>
                      </div>
                      <h3 className={`${data.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                        AIO <span className="text-indigo-500">Readiness</span>
                      </h3>
                      <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        Evaluation of your website's readiness for Artificial Intelligence optimization and crawlers.
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
                        className={`flex items-center gap-2 text-sm font-bold transition-all ${darkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"}`}
                      >
                        <Info size={16} />
                        <span className="border-b border-transparent hover:border-current">Metric Methodology</span>
                      </button>
                    </div>
                  </div>

                  {/* Circular Progress */}
                  <div className="relative flex-shrink-0 group cursor-default order-1 md:order-2">
                    <div className={`absolute -inset-8 rounded-full blur-3xl opacity-25 transition-opacity duration-700 group-hover:opacity-40 ${aio?.Percentage >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                    <CircularProgress value={aio?.Percentage || 0} size={data.report === "All" ? 180 : 150} stroke={14} />
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                      <span className={`${data.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{aio?.Percentage || 0}%</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
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