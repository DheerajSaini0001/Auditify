import React, { useContext, useMemo } from "react";
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
    impact: "If users can't find the 'Buy' button instantly, they can't buy. It's that simple.",
    improvement: "Make your main button big, bold, and distinct from everything else.",
    calculation: "We check if your main Call-to-Action button is clearly visible without scrolling."
  },
  CTA_Clarity: {
    title: "CTA Clarity",
    desc: "Evaluates CTA text clarity.",
    why: "Clear text reduces cognitive load.",
    use: "Analyzes button text for action-oriented language.",
    impact: "Vague buttons like 'Submit' kill curiosity. Clear buttons like 'Get My Free Guide' drive action.",
    improvement: "Use action-oriented text that tells the user exactly what they will get.",
    calculation: "We read your button text to see if it uses persuasive, action-oriented words."
  },
  CTA_Contrast: {
    title: "CTA Contrast",
    desc: "Assesses button contrast.",
    why: "High contrast ensures accessibility.",
    use: "Measures color contrast ratio against the background.",
    impact: "Buttons that blend in get ignored. Your primary action must pop off the screen.",
    improvement: "Use a color for your main button that stands out strongly against the background.",
    calculation: "We measure how much your button color stands out from the background color."
  },
  CTA_Crowding: {
    title: "CTA Crowding",
    desc: "Checks for cluttered CTAs.",
    why: "Crowding causes decision paralysis.",
    use: "Checks proximity of other clickable elements to the CTA.",
    impact: "Too many choices confuse users. When faced with clutter, people choose nothing.",
    improvement: "Give your main button plenty of breathing room (whitespace).",
    calculation: "We check if other clickable items are too close to your main button."
  },
  CTA_Flow_Alignment: {
    title: "Flow Alignment",
    desc: "Checks CTA placement flow.",
    why: "CTAs should match user intent.",
    use: "Checks if CTAs appear logically after value propositions.",
    impact: "Asking for a sale before explaining the value is like proposing on the first date.",
    improvement: "Place your Call-to-Action immediately after you've made your best pitch.",
    calculation: "We check if your buttons appear logically after persuasive content."
  },
  Form_Presence: {
    title: "Lead Capture Form",
    desc: "Verifies form existence.",
    why: "Forms capture lead data.",
    use: "Detects input forms on the landing page.",
    impact: "You can't get leads if you don't ask. No form means no way to follow up.",
    improvement: "Add a simple email signup form to capture interested visitors.",
    calculation: "We look for a form on your page designed to collect user information."
  },
  Form_Length: {
    title: "Form Length",
    desc: "Measures form complexity.",
    why: "Short forms convert better.",
    use: "Counts the number of input fields in the form.",
    impact: "Every extra field you ask for cuts your conversion rate significantly.",
    improvement: "Ask only for what you absolutely need (usually just an email).",
    calculation: "We count the number of fields in your forms. Fewer is better."
  },
  Required_vs_Optional_Fields: {
    title: "Field Requirements",
    desc: "Checks field markings.",
    why: "Clarity prevents frustration.",
    use: "Checks if required fields are clearly marked (asterisks or labels).",
    impact: "Users hate guessing. Error messages frustrate them and cause drop-offs.",
    improvement: "Clearly mark which fields are required so users get it right the first time.",
    calculation: "We check if required fields are visually distinguished from optional ones."
  },
  Inline_Validation: {
    title: "Inline Validation",
    desc: "Checks for real-time validation.",
    why: "Instant feedback improves UX.",
    use: "Checks if the form gives feedback as the user types.",
    impact: "Waiting until the end to say 'Error' is annoying. Real-time feedback feels superior.",
    improvement: "Show a green checkmark as soon as a user fills a field correctly.",
    calculation: "We check if the form gives immediate feedback while typing."
  },
  Submit_Button_Clarity: {
    title: "Submit Button",
    desc: "Analyzes submit button.",
    why: "Action must be obvious.",
    use: "Checks the text of the form submit button.",
    impact: "'Submit' is boring technical jargon. It feels like filing taxes, not getting value.",
    improvement: "Change 'Submit' to something exciting like 'Join the Club' or 'Start Now'.",
    calculation: "We check if you are using generic words or exciting action phrases on buttons."
  },
  AutoFocus_Field: {
    title: "Auto-Focus",
    desc: "Checks auto-focus.",
    why: "Saves user clicks.",
    use: "Checks if the first input is auto-focused on load.",
    impact: "Autofocus invites the user to type immediately, reducing friction.",
    improvement: "Make the cursor jump automatically to the first field when the page loads.",
    calculation: "We check if the first input field is automatically selected on load."
  },
  MultiStep_Form_Progress: {
    title: "Multi-step Progress",
    desc: "Checks progress indicators.",
    why: "Encourages completion.",
    use: "Detects progress bars for long forms.",
    impact: "Long forms feel endless without a map. Users quit if they don't know how far they have to go.",
    improvement: "Show a simple progress bar (Step 1 of 3) to keep users motivated.",
    calculation: "For pages with multiple forms or steps, we check for visual progress indicators (e.g., 'Step X of Y' or progress bars)."
  },
  Testimonials: {
    title: "Testimonials",
    desc: "Validates testimonials.",
    why: "Social proof builds trust.",
    use: "Scans for testimonial sections or quotes.",
    impact: "People trust other people more than they trust brands. Social proof is a powerful persuader.",
    improvement: "Showcase quote from a happy customer to build instant credibility.",
    calculation: "We check for sections that look like customer quotes or reviews."
  },
  Reviews: {
    title: "Reviews",
    desc: "Checks for reviews.",
    why: "Reviews influence decisions.",
    use: "Checks for star ratings or review widgets.",
    impact: "Zero reviews looks suspicious. 5-star reviews drive sales.",
    improvement: "Embed reviews from Google, Trustpilot, or other trusted sources.",
    calculation: "We look for star ratings or widgets from review platforms."
  },
  Trust_Badges: {
    title: "Trust Badges",
    desc: "Detects trust badges.",
    why: "Badges reassure users.",
    use: "Scans for security seals, guarantees, or partner logos.",
    impact: "Badges reduce anxiety. They tell users 'your money and data are safe here'.",
    improvement: "Add recognizable security seals or money-back guarantee badges.",
    calculation: "We look for images containing keywords like 'secure', 'guarantee', or 'trusted'."
  },
  Client_Logos: {
    title: "Client Logos",
    desc: "Verifies client logos.",
    why: "Logos establish authority.",
    use: "Checks for a 'Trusted By' logo strip.",
    impact: "If big brands trust you, new visitors will too. It's borrowed credibility.",
    improvement: "Display a 'Trusted By' strip with logos of recognizable clients.",
    calculation: "We check for a row of images typically found in a 'Trusted By' section."
  },
  Case_Studies_Accessibility: {
    title: "Case Studies",
    desc: "Checks case studies.",
    why: "Proof of value.",
    use: "Checks for links to 'Case Studies' or 'Success Stories'.",
    impact: "Claims are cheap. Proof is valuable. Case studies show exactly how you deliver results.",
    improvement: "Link clearly to success stories or detailed case studies.",
    calculation: "We scan links for anchor text related to 'Case Studies' or 'Success Stories'."
  },
  Exit_Intent_Triggers: {
    title: "Exit Intent",
    desc: "Detects exit popups.",
    why: "Recovers lost leads.",
    use: "Checks for scripts that trigger on mouse leaving the window.",
    impact: "Most visitors leave and never come back. An exit popup gives you one last chance.",
    improvement: "Offer a special deal or free guide just as a user tries to close the tab.",
    calculation: "We detect code that tracks when a user's mouse moves to leave the page."
  },
  Lead_Magnets: {
    title: "Lead Magnet",
    desc: "Checks for lead magnets.",
    why: "Incentivizes signups.",
    use: "Checks for downloadable resources (PDFs, Ebooks).",
    impact: "Visitors rarely give their email for free. You need to offer something valuable in return.",
    improvement: "Offer a free ebook, checklist, or discount in exchange for their email.",
    calculation: "We check for offers of free content (PDFs, Guides) in exchange for signups."
  },
  Contact_Info_Visibility: {
    title: "Contact Info",
    desc: "Ensures contact info visibility.",
    why: "Builds trust.",
    use: "Checks for phone number, email, or physical address.",
    impact: "Hiding your contact info makes you look like a scam. Transparency builds trust.",
    improvement: "Put your phone number or email clearly in the header or footer.",
    calculation: "We scan the page for phone numbers, emails, or address details."
  },
  Chatbot_Presence: {
    title: "Live Chat",
    desc: "Verifies chatbot.",
    why: "Provides instant support.",
    use: "Detects live chat widgets (Intercom, Drift).",
    impact: "Customers have questions now. If they have to wait, they go to a competitor.",
    improvement: "Add a live chat widget to answer pre-sale questions instantly.",
    calculation: "We check for scripts from popular live chat services."
  },
  Interactive_Elements: {
    title: "Interactivity",
    desc: "Checks interactive tools.",
    why: "Increases engagement.",
    use: "Checks for calculators, quizzes, or interactive demos.",
    impact: "Passive reading is boring. Quizzes and calculators engage users and capture leads.",
    improvement: "Add a simple ROI calculator or a 'Find your fit' quiz.",
    calculation: "We look for interactive tools like sliders, calculators, or quizzes."
  },
  Personalization: {
    title: "Personalization",
    desc: "Assesses personalization.",
    why: "Relevance boosts conversion.",
    use: "Checks for dynamic text replacement or personalized greetings.",
    impact: "Generic messages get generic results. Speaking 'to' the user converts better.",
    improvement: "Use dynamic text to welcome users based on where they came from.",
    calculation: "We check for scripts that change content based on user data."
  },
  Progress_Indicators: {
    title: "Progress Indicators",
    desc: "Validates progress bars.",
    why: "Visualizes completion.",
    use: "Checks for step visualizers in funnels.",
    impact: "Seeing progress (Step 1 -> 2) motivates users to finish what they started.",
    improvement: "Visually number the steps in your process or checkout flow.",
    calculation: "We check for numbered lists or visual steps indicating a process."
  },
  Friendly_Error_Handling: {
    title: "Error Messages",
    desc: "Ensures clear errors.",
    why: "Helps users recover.",
    use: "Checks if error messages are helpful vs generic.",
    impact: "Technical errors scare users away. Friendly help keeps them on track.",
    improvement: "Rewrite error messages to be human, helpful, and polite.",
    calculation: "We verify if error messages provide helpful guidance."
  },
  Microcopy_Clarity: {
    title: "Microcopy",
    desc: "Checks helper text.",
    why: "Guides users smoothly.",
    use: "Checks for small instructional text under fields.",
    impact: "Tiny text can remove big fears. 'No credit card required' is a powerful friction remover.",
    improvement: "Add helpful reassurances under your signup buttons.",
    calculation: "We look for small helper text near input fields."
  },
  Incentives_Displayed: {
    title: "Incentives",
    desc: "Verifies incentives.",
    why: "Motivates action.",
    use: "Checks for 'Free Shipping', 'Bonus', 'Discount' keywords.",
    impact: "Everyone loves a deal. A clear bonus can be the tipping point for a decision.",
    improvement: "Clearly mention 'Free Shipping', 'Bonus', or 'Discount' near your price.",
    calculation: "We scan for keywords related to improved value or savings."
  },
  Scarcity_Urgency: {
    title: "Urgency Signals",
    desc: "Checks urgency triggers.",
    why: "Encourages immediate action.",
    use: "Checks for countdown timers or 'Limited Stock' warnings.",
    impact: "Procrastination kills sales. Genuine urgency forces a decision now.",
    improvement: "Use 'Limited Time' offers or countdowns, but always be honest.",
    calculation: "We detect elements that signal time sensitivity or limited stock."
  },
  Smooth_Scrolling: {
    title: "Smooth Scroll",
    desc: "Ensures smooth scroll.",
    why: "Enhances feel.",
    use: "Checks for 'scroll-behavior: smooth' in CSS.",
    impact: "Jerky movement feels cheap. Smooth movement feels premium.",
    improvement: "Enable 'smooth scrolling' in your site's code.",
    calculation: "We check your CSS settings for smooth scrolling behavior."
  },
  Mobile_CTA_Adaptation: {
    title: "Mobile Sticky CTA",
    desc: "Checks mobile CTAs.",
    why: "Critical for mobile users.",
    use: "Checks if a sticky CTA exists on mobile screens.",
    impact: "Mobile screens are small. Don't make users scroll for miles to find the button.",
    improvement: "Stick a 'Buy' button to the bottom of the screen on mobile devices.",
    calculation: "We check if a Call-to-Action button stays visible on mobile screens."
  },
  MultiChannel_FollowUp: {
    title: "Retargeting",
    desc: "Verifies follow-up.",
    why: "Increases retention.",
    use: "Checks for retargeting pixels (FB Pixel, LinkedIn Insight).",
    impact: "97% of visitors don't buy the first time. You need a way to bring them back.",
    improvement: "Install tracking pixels (Facebook/Google) to show ads to past visitors.",
    calculation: "We look for tracking scripts used for retargeting ads."
  },
};

// ------------------------------------------------------
// ✅ Score Calculation Info (Standard Weights)
// ------------------------------------------------------
const scoreCalculationInfo = {
  icon: Target,
  title: "Conversion & Lead Flow",
  guideLink: "https://www.nngroup.com/articles/web-form-design/",
  use: (
    <div className="space-y-2">
      <p>Measures how effectively your website guides visitors toward taking meaningful actions — such as signing up, contacting you, or making a purchase.</p>
      <p>It evaluates call-to-action quality, lead capture forms, trust signals, engagement elements, and overall conversion flow clarity.</p>
    </div>
  ),
  impact: (
    <div className="space-y-2">
      <p>Traffic alone doesn’t grow a business — conversions do.</p>
      <p>If users can’t clearly see what to do next, don’t trust the page, or feel friction while taking action, they’ll leave. Strong conversion flow turns visitors into leads, customers, and revenue.</p>
    </div>
  ),
  improvement: (
    <ul className="list-disc pl-5 space-y-4">
      <li>
        <span className="font-semibold block mb-1">Improve Call-to-Action (CTA) effectiveness:</span>
        <ul className="list-[circle] pl-5 space-y-1 text-sm">
          <li>Make sure primary CTAs are visible and easy to find</li>
          <li>Use clear, action-oriented language (e.g. “Get Started”, “Sign Up”)</li>
          <li>Ensure CTA buttons stand out visually with strong contrast</li>
          <li>Avoid cluttering the page with too many CTAs</li>
          <li>Place CTAs where they naturally fit the user’s reading flow</li>
        </ul>
      </li>
      <li>
        <span className="font-semibold block mb-1">Optimize forms and lead capture:</span>
        <ul className="list-[circle] pl-5 space-y-1 text-sm">
          <li>Keep forms short and focused</li>
          <li>Clearly mark required vs optional fields</li>
          <li>Use descriptive submit buttons, not generic labels</li>
          <li>Add inline validation to prevent form errors</li>
          <li>Provide progress indicators for multi-step forms</li>
          <li>Use autofocus to help users start faster</li>
        </ul>
      </li>
      <li>
        <span className="font-semibold block mb-1">Build trust and credibility:</span>
        <ul className="list-[circle] pl-5 space-y-1 text-sm">
          <li>Display testimonials, reviews, or ratings</li>
          <li>Show trust badges or security indicators where relevant</li>
          <li>Highlight client logos or case studies</li>
          <li>Make contact information easy to find</li>
        </ul>
      </li>
      <li>
        <span className="font-semibold block mb-1">Support engagement and follow-through:</span>
        <ul className="list-[circle] pl-5 space-y-1 text-sm">
          <li>Offer lead magnets like guides or downloads</li>
          <li>Use chat or live support where appropriate</li>
          <li>Add subtle incentives or offers</li>
          <li>Avoid aggressive popups, but support exit-intent thoughtfully</li>
          <li>Include social or multi-channel follow-up options</li>
        </ul>
      </li>
      <li>
        <span className="font-semibold block mb-1">Reduce friction during interaction:</span>
        <ul className="list-[circle] pl-5 space-y-1 text-sm">
          <li>Provide clear microcopy and helper text</li>
          <li>Use friendly error handling</li>
          <li>Show progress or loading indicators</li>
          <li>Ensure CTAs and forms are optimized for mobile users</li>
        </ul>
      </li>
    </ul>
  ),
  calculation: (
    <div className="space-y-2">
      <p>We evaluate multiple conversion-focused signals across CTAs, forms, trust elements, and user engagement patterns.</p>
      <p>Each area is weighted based on its impact on real conversion behavior. Strong signals earn full credit, partial optimizations earn partial credit, and missing elements reduce the score.</p>
      <p>The final score reflects how easy it is for a visitor to move from interest to action.</p>
    </div>
  ),
  weightage: [
    { param: "Form Optimization", weight: "25%" },
    { param: "Call-to-Action (CTA) Strategy", weight: "20%" },
    { param: "Trust & Social Proof", weight: "15%" },
    { param: "Engagement Experience", weight: "15%" },
    { param: "Lead Capture Mechanisms", weight: "15%" },
    { param: "Mobile Adaptation", weight: "10%" }
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

const ConversionShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
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

  const auditSteps = useMemo(() => [
    { icon: <MousePointerClick className="w-8 h-8 text-blue-500" />, title: "CTA Optimization", text: "Analyzing Call-To-Action (CTA) placement, contrast, and clarity..." },
    { icon: <FileText className="w-8 h-8 text-purple-500" />, title: "Form Analysis", text: "Evaluating form length, validation feedback, and required field indicators..." },
    { icon: <ShieldCheck className="w-8 h-8 text-teal-500" />, title: "Trust Signals", text: "Checking for testimonials, reviews, security badges, and client logos..." },
    { icon: <Zap className="w-8 h-8 text-indigo-500" />, title: "Lead Generation", text: "Identifying lead magnets, exit intent triggers, and value propositions..." },
    { icon: <Activity className="w-8 h-8 text-amber-500" />, title: "User Flow", text: "Mapping user journey linearity and removing friction points..." },
  ], []);

  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (loading || !data?.conversionAndLeadFlow) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % auditSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);

  if (!data?.conversionAndLeadFlow) {
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
                  <ConversionShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
                </div>
              </div>
            </div>
          </div>
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
                        <Target className="w-3.5 h-3.5" />
                        <span>Conversion Audit</span>
                      </div>
                      <h3 className={`${data.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                        Conversion & <span className="text-blue-500">Lead Flow</span>
                      </h3>
                      <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        Analysis of your conversion funnels, CTA effectiveness, and user journey optimization.
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
                        <span className="border-b border-transparent hover:border-current">Metric Methodology</span>
                      </button>
                    </div>
                  </div>

                  {/* Circular Progress */}
                  <div className="relative flex-shrink-0 group cursor-default order-1 md:order-2">
                    <div className={`absolute -inset-8 rounded-full blur-3xl opacity-25 transition-opacity duration-700 group-hover:opacity-40 ${flow?.Percentage >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                    <CircularProgress value={flow?.Percentage || 0} size={data.report === "All" ? 180 : 150} stroke={14} />
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                      <span className={`${data.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{flow?.Percentage || 0}%</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
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