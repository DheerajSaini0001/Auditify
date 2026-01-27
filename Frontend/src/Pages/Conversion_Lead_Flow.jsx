import React, { useContext } from "react";
import UrlHeader from "../Component/UrlHeader";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  CheckCircle, XCircle, AlertTriangle, Info,
  MousePointerClick, FileText, ShieldCheck, LayoutTemplate,
  MessageSquare, Zap, Target, CreditCard, Users,
  Smartphone, Mail, Bell, Lock, Search,
  ChevronDown, ChevronUp, Terminal, Activity,
  ArrowRight, Loader2
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";

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
  CTA_Visibility: {
    title: "CTA Visibility",
    desc: "Checks if primary CTAs are visible.",
    why: "Visible CTAs guide users.",
    use: "Checks if the Call to Action button is above the fold and distinguishable.",
    impact: "Invisible or hard-to-find CTAs drastically reduce conversion rates.",
    improvement: "Use contrasting colors and plenty of whitespace around CTAs."
  },
  CTA_Clarity: {
    title: "CTA Clarity",
    desc: "Evaluates CTA text clarity.",
    why: "Clear text reduces cognitive load.",
    use: "Analyzes button text for action-oriented language.",
    impact: "Vague labels like 'Submit' perform worse than 'Get My Free Quote'.",
    improvement: "Use clear, benefit-driven text (e.g., 'Start Free Trial')."
  },
  CTA_Contrast: {
    title: "CTA Contrast",
    desc: "Assesses button contrast.",
    why: "High contrast ensures accessibility.",
    use: "Measures color contrast ratio against the background.",
    impact: "Low contrast buttons blend in, causing users to miss them.",
    improvement: "Ensure a contrast ratio of at least 4.5:1 (WCAG AA)."
  },
  CTA_Crowding: {
    title: "CTA Crowding",
    desc: "Checks for cluttered CTAs.",
    why: "Crowding causes decision paralysis.",
    use: "Checks proximity of other clickable elements to the CTA.",
    impact: "Too many choices overwhelm users (Hick's Law), leading to no action.",
    improvement: "Isolate primary CTAs. Provide only one main goal per section."
  },
  CTA_Flow_Alignment: {
    title: "Flow Alignment",
    desc: "Checks CTA placement flow.",
    why: "CTAs should match user intent.",
    use: "Checks if CTAs appear logically after value propositions.",
    impact: "Asking for a sale before explaining value leads to rejection.",
    improvement: "Place CTAs after key benefits or testimonials."
  },
  Form_Presence: {
    title: "Lead Capture Form",
    desc: "Verifies form existence.",
    why: "Forms capture lead data.",
    use: "Detects input forms on the landing page.",
    impact: "No form means no way to collect user info (unless pure click-through).",
    improvement: "Embed a simple signup form or email capture field."
  },
  Form_Length: {
    title: "Form Length",
    desc: "Measures form complexity.",
    why: "Short forms convert better.",
    use: "Counts the number of input fields in the form.",
    impact: "Each extra field reduces conversion rate by ~10-15%.",
    improvement: "Ask only for essential info (e.g., Email). Enrich data later."
  },
  Required_vs_Optional_Fields: {
    title: "Field Requirements",
    desc: "Checks field markings.",
    why: "Clarity prevents frustration.",
    use: "Checks if required fields are clearly marked (asterisks or labels).",
    impact: "Users hate guessing which fields are mandatory upon submission error.",
    improvement: "Mark optional fields explicitly or remove them."
  },
  Inline_Validation: {
    title: "Inline Validation",
    desc: "Checks for real-time validation.",
    why: "Instant feedback improves UX.",
    use: "Checks if the form gives feedback as the user types.",
    impact: "Waiting until submit to show errors frustrating users and causes abandonment.",
    improvement: "Implement real-time validation (green checkmarks/red borders)."
  },
  Submit_Button_Clarity: {
    title: "Submit Button",
    desc: "Analyzes submit button.",
    why: "Action must be obvious.",
    use: "Checks the text of the form submit button.",
    impact: "Generic 'Submit' buttons feel transactional and boring.",
    improvement: "Use value-based text like 'Send Me the Guide'."
  },
  AutoFocus_Field: {
    title: "Auto-Focus",
    desc: "Checks auto-focus.",
    why: "Saves user clicks.",
    use: "Checks if the first input is auto-focused on load.",
    impact: "Auto-focus prompts users to start typing immediately, increasing engagement.",
    improvement: "Add 'autofocus' attribute to the first input on landing pages."
  },
  MultiStep_Form_Progress: {
    title: "Multi-step Progress",
    desc: "Checks progress indicators.",
    why: "Encourages completion.",
    use: "Detects progress bars for long forms.",
    impact: "Users abandon long forms if they don't know how much is left.",
    improvement: "Show 'Step 1 of 3' or a progress bar for complex forms."
  },
  Testimonials: {
    title: "Testimonials",
    desc: "Validates testimonials.",
    why: "Social proof builds trust.",
    use: "Scans for testimonial sections or quotes.",
    impact: "Social proof is a top psychological driver of conversion.",
    improvement: "Add authentic customer quotes with photos."
  },
  Reviews: {
    title: "Reviews",
    desc: "Checks for reviews.",
    why: "Reviews influence decisions.",
    use: "Checks for star ratings or review widgets.",
    impact: "0 reviews signals a lack of usage or trust.",
    improvement: "Embed reviews from Google, Trustpilot, or G2."
  },
  Trust_Badges: {
    title: "Trust Badges",
    desc: "Detects trust badges.",
    why: "Badges reassure users.",
    use: "Scans for security seals, guarantees, or partner logos.",
    impact: "Visual symbols of trust reduce anxiety about scams.",
    improvement: "Add badges like 'Secure Checkout', '30-Day Guarantee'."
  },
  Client_Logos: {
    title: "Client Logos",
    desc: "Verifies client logos.",
    why: "Logos establish authority.",
    use: "Checks for a 'Trusted By' logo strip.",
    impact: "Recognizable brands transfer credibility to you.",
    improvement: "Showcase logos of your best known clients."
  },
  Case_Studies_Accessibility: {
    title: "Case Studies",
    desc: "Checks case studies.",
    why: "Proof of value.",
    use: "Checks for links to 'Case Studies' or 'Success Stories'.",
    impact: "Deep dive content proves your solution works.",
    improvement: "Link to at least one detailed case study."
  },
  Exit_Intent_Triggers: {
    title: "Exit Intent",
    desc: "Detects exit popups.",
    why: "Recovers lost leads.",
    use: "Checks for scripts that trigger on mouse leaving the window.",
    impact: "Can recover 10-15% of abandoning visitors.",
    improvement: "Offer a discount or lead magnet when user tries to leave."
  },
  Lead_Magnets: {
    title: "Lead Magnet",
    desc: "Checks for lead magnets.",
    why: "Incentivizes signups.",
    use: "Checks for downloadable resources (PDFs, Ebooks).",
    impact: "Users rarely give emails for nothing. Value exchange is key.",
    improvement: "Offer a free checklist, ebook, or trial."
  },
  Contact_Info_Visibility: {
    title: "Contact Info",
    desc: "Ensures contact info visibility.",
    why: "Builds trust.",
    use: "Checks for phone number, email, or physical address.",
    impact: "Hidden contact info makes a company look like a shell entity.",
    improvement: "Put your phone or email clearly in the footer/header."
  },
  Chatbot_Presence: {
    title: "Live Chat",
    desc: "Verifies chatbot.",
    why: "Provides instant support.",
    use: "Detects live chat widgets (Intercom, Drift).",
    impact: "Answers pre-sale questions instantly, boosting conversion.",
    improvement: "Install a live chat or support bot."
  },
  Interactive_Elements: {
    title: "Interactivity",
    desc: "Checks interactive tools.",
    why: "Increases engagement.",
    use: "Checks for calculators, quizzes, or interactive demos.",
    impact: "Interactive content converts 2x better than static content.",
    improvement: "Add a 'ROI Calculator' or 'Product Quiz'."
  },
  Personalization: {
    title: "Personalization",
    desc: "Assesses personalization.",
    why: "Relevance boosts conversion.",
    use: "Checks for dynamic text replacement or personalized greetings.",
    impact: "Generic pages convert less than tailored ones.",
    improvement: "Use URL parameters to personalize headlines."
  },
  Progress_Indicators: {
    title: "Progress Indicators",
    desc: "Validates progress bars.",
    why: "Visualizes completion.",
    use: "Checks for step visualizers in funnels.",
    impact: "Reduces anxiety about process length.",
    improvement: "Visually show steps (1 -> 2 -> 3) in checkout."
  },
  Friendly_Error_Handling: {
    title: "Error Messages",
    desc: "Ensures clear errors.",
    why: "Helps users recover.",
    use: "Checks if error messages are helpful vs generic.",
    impact: "'Error 500' scares users. 'Please enter a valid email' helps them.",
    improvement: "Write human-friendly error copy."
  },
  Microcopy_Clarity: {
    title: "Microcopy",
    desc: "Checks helper text.",
    why: "Guides users smoothly.",
    use: "Checks for small instructional text under fields.",
    impact: "Clarifies ambiguity (e.g., 'No credit card required').",
    improvement: "Add reassuring microcopy near friction points."
  },
  Incentives_Displayed: {
    title: "Incentives",
    desc: "Verifies incentives.",
    why: "Motivates action.",
    use: "Checks for 'Free Shipping', 'Bonus', 'Discount' keywords.",
    impact: "Sweetening the deal tips the scales for hesitant users.",
    improvement: "Highlight free shipping or bonuses near the button."
  },
  Scarcity_Urgency: {
    title: "Urgency Signals",
    desc: "Checks urgency triggers.",
    why: "Encourages immediate action.",
    use: "Checks for countdown timers or 'Limited Stock' warnings.",
    impact: "FOMO (Fear Of Missing Out) drives faster decisions.",
    improvement: "Use authentic urgency (e.g., 'Offer ends soon')."
  },
  Smooth_Scrolling: {
    title: "Smooth Scroll",
    desc: "Ensures smooth scroll.",
    why: "Enhances feel.",
    use: "Checks for 'scroll-behavior: smooth' in CSS.",
    impact: "Jerky anchor jumps feel broken/old.",
    improvement: "Enable smooth scrolling for anchor links."
  },
  Mobile_CTA_Adaptation: {
    title: "Mobile Sticky CTA",
    desc: "Checks mobile CTAs.",
    why: "Critical for mobile users.",
    use: "Checks if a sticky CTA exists on mobile screens.",
    impact: "Mobile users shouldn't scroll miles to find the buy button.",
    improvement: "Add a sticky bottom bar with a CTA on mobile."
  },
  MultiChannel_FollowUp: {
    title: "Retargeting",
    desc: "Verifies follow-up.",
    why: "Increases retention.",
    use: "Checks for retargeting pixels (FB Pixel, LinkedIn Insight).",
    impact: "Most users don't buy on visit 1. Retargeting brings them back.",
    improvement: "Install Facebook Pixel and Google Ads Tag."
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

const ConversionShimmer = ({ darkMode }) => (
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
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 animate-pulse">Running Conversion Audit...</h1>
            <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Analyzing Call-to-Actions, Forms, Trust Signals, and Engagement Flow.</p>
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
          <Target size={24} />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {["Analyzing Call-to-Actions...", "Checking Form Fields...", "Verifying Trust Signals...", "Scanning Lead Magnets...", "Testing Submit Buttons...", "Analyzing User Flow..."].map((text, i) => (
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
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const darkMode = theme === "dark";

  if (!data?.conversionAndLeadFlow) {
    return (
      <div className={`min-h-screen w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          <UrlHeader darkMode={darkMode} />
          {/* ✅ Live Preview (Only for Full Audit) */}
          <LivePreview data={data} showInFullAudit={false} />
          <ConversionShimmer darkMode={darkMode} />
        </main>
      </div>
    );
  }

  const flow = data?.conversionAndLeadFlow || {};
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  const allMetrics = Object.values(flow).filter(val => typeof val === 'object' && val !== null && 'score' in val);
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

        {/* Section 1: CTA & Forms */}
        <Section title="Call-to-Actions & Forms" icon={MousePointerClick} darkMode={darkMode}>
          {["CTA_Visibility", "CTA_Clarity", "CTA_Contrast", "CTA_Crowding", "CTA_Flow_Alignment", "Form_Presence", "Form_Length", "Required_vs_Optional_Fields", "Inline_Validation", "Submit_Button_Clarity", "AutoFocus_Field", "MultiStep_Form_Progress"].map((key) => (
            flow[key] && <MetricCard key={key} metricKey={key} data={flow[key]} darkMode={darkMode} onInfo={() => setSelectedMetricInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
          ))}
        </Section>

        {/* Section 2: Trust & Engagement */}
        <Section title="Trust & Engagement Signals" icon={ShieldCheck} darkMode={darkMode}>
          {["Testimonials", "Reviews", "Trust_Badges", "Client_Logos", "Case_Studies_Accessibility", "Lead_Magnets", "Exit_Intent_Triggers", "Chatbot_Presence", "Contact_Info_Visibility"].map((key) => (
            flow[key] && <MetricCard key={key} metricKey={key} data={flow[key]} darkMode={darkMode} onInfo={() => setSelectedMetricInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
          ))}
        </Section>

        {/* Section 3: UX & Interaction */}
        <Section title="UX Flow & Interaction" icon={LayoutTemplate} darkMode={darkMode}>
          {["Interactive_Elements", "Personalization", "Progress_Indicators", "Friendly_Error_Handling", "Microcopy_Clarity", "Incentives_Displayed", "Scarcity_Urgency", "Smooth_Scrolling", "Mobile_CTA_Adaptation", "MultiChannel_FollowUp"].map((key) => (
            flow[key] && <MetricCard key={key} metricKey={key} data={flow[key]} darkMode={darkMode} onInfo={() => setSelectedMetricInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
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