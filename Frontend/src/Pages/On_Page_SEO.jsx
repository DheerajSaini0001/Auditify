import React, { useContext, useMemo } from "react";
import UrlHeader from "../Component/UrlHeader";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  Search, FileText, Link, Image as ImageIcon, Video,
  Layout, FileCode, Lock, Copy, List, Tag, Globe,
  CheckCircle, AlertTriangle, XCircle, Info, Loader2
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";

const seoMetricExplanations = {
  Title: {
    title: "Title Tag",
    use: "The HTML <title> element that specifies the title of a web page.",
    impact: "Your title is the first thing people see on Google. A clear, catchy title makes them want to click.",
    improvement: "Write a unique title (50-60 characters) that includes your main keyword. Make it sound appealing to a human.",
    calculation: "We check if your title exists, is unique, and fits within standard length limits."
  },
  Meta_Description: {
    title: "Meta Description",
    use: "A brief summary of the page content that appears under the title in search results.",
    impact: "This summary appears under your title. A good description acts like ad copy, convincing users to visit your site.",
    improvement: "Write a unique, 160-character summary for each page that clearly explains what the user will get.",
    calculation: "We verify that a description exists and is the right length to be fully displayed in search results."
  },
  Canonical: {
    title: "Canonical Tag",
    use: "Tells search engines which URL is the 'master' version of a page to prevent duplicate content issues.",
    impact: "Prevents confusion when multiple pages have similar content. It tells Google which version is the 'original' one.",
    improvement: "Ensure every page points to itself as the original source unless it is a direct copy of another page.",
    calculation: "We check for a 'canonical tag' in your code that points to a valid URL."
  },
  URL_Structure: {
    title: "URL Structure",
    use: "The format and readability of your webpage address.",
    impact: "Simple, readable URLs help users (and Google) guess what the page is about before clicking.",
    improvement: "Keep URLs short, lowercase, and easy to read. Avoid random numbers or strange symbols.",
    calculation: "We analyze your link structure to ensure it is readable and free of unnecessary characters."
  },
  H1: {
    title: "H1 Tag",
    use: "The main heading of the page, acting as the primary topic indicator.",
    impact: "This is the main headline of your page. It tells Google exactly what the main topic is.",
    improvement: "Use exactly one main headline (H1) per page that contains your primary keyword.",
    calculation: "We count the main headlines on your page. Ideally, there should be exactly one."
  },
  Image: {
    title: "Image Metadata (Alt Text)",
    use: "Alt text describes images for screen readers and search engines.",
    impact: "Alt text describes images to search engines (who can't see) and screen readers (for accessibility).",
    improvement: "Add a short description to every meaningful image explaining what it shows.",
    calculation: "We scan your images to see if they have descriptions (alt text) attached to them."
  },
  Compression: {
    title: "Image Compression",
    use: "Optimization of image file sizes to improve loading speed.",
    impact: "Large images slow down your site. Users hate waiting for heavy photos to load.",
    improvement: "Resize images to be only as big as needed and use modern formats like WebP.",
    calculation: "We verify if your images are saved in optimized formats and logical file sizes."
  },
  Video: {
    title: "Internal Videos",
    use: "Video content hosted or embedded on the page.",
    impact: "Videos engage users, but if they load too slowly, they can make your page feel sluggish.",
    improvement: "Prevent videos from loading until the user actually scrolls down to them (lazy loading).",
    calculation: "We check if your video players are set up to load efficiently only when needed."
  },
  Semantic: {
    title: "Semantic Tags",
    use: "HTML5 tags (nav, article, section) that define content meaning.",
    impact: "Using correct HTML tags helps search engines understand which parts of your page are content, menus, or footers.",
    improvement: "Use standard tags like <header>, <nav>, and <footer> to organize your page layout.",
    calculation: "We look for standard layout tags that help robots understand your page structure."
  },
  Contextual: {
    title: "Contextual Links",
    use: "Links embedded within the main body content pointing to other relevant pages.",
    impact: "Links inside your articles help Google discover new pages and understand how your topics are connected.",
    improvement: "Add links to other relevant pages on your site within your text.",
    calculation: "We count how many links appear inside your main text paragraphs pointing to your own site."
  },
  Hierarchy: {
    title: "Heading Hierarchy",
    use: "The nested order of headings (H1 > H2 > H3).",
    impact: "A logical heading structure (H1 -> H2 -> H3) makes your content easier to read and scan.",
    improvement: "Organize content like an outline. Don't skip levels (e.g., don't go from H1 to H4).",
    calculation: "We check the order of your headlines to ensure they follow a logical nested sequence."
  },
  HTTPS: {
    title: "HTTPS Security",
    use: "Secure encryption protocol for data transfer.",
    impact: "Security is non-negotiable. Users and browsers distrust sites that are not secure.",
    improvement: "Install an SSL certificate to ensure your site loads securely (https://).",
    calculation: "We verify if your site connection is secure and encrypted."
  },
  Duplicate: {
    title: "Content Quality",
    use: "Uniqueness and depth of the page content.",
    impact: "Search engines prefer unique content. Repeated content confuses them about which page to rank.",
    improvement: "Make sure the text on this page is substantially different from other pages on your site.",
    calculation: "We analyze your text to ensure it isn't identical or highly similar to other pages we have scanned."
  },
  Links: {
    title: "Link Profile",
    use: "The mix of internal and external hyperlinks.",
    impact: "Broken links frustrate users and tell Google your site is neglected.",
    improvement: "Check and fix any links that lead to '404' error pages.",
    calculation: "We test all the links on your page to ensure they lead to working destinations."
  },
  Hreflang: {
    title: "Hreflang Tags",
    use: "Code that tells Google which language/region a specific page is for.",
    impact: "Critical for multi-language sites. It ensures users see the page in their own language.",
    improvement: "If you have multiple languages, use these tags to tell Google which is which.",
    calculation: "We check for language tags that direct users to the correct regional version of your site."
  },
  Slug: {
    title: "URL Slugs",
    use: "The part of the URL identifying the specific page.",
    impact: "The end part of your link (slug) should clearly describe the page content.",
    improvement: "Use real words instead of ID numbers (e.g., use '/about-us' instead of '/page?id=5').",
    calculation: "We evaluate the final part of your URL to see if it contains readable keywords."
  },
  OpenGraph: {
    title: "Open Graph Tags",
    use: "Meta tags that control how URLs look when shared on social media (Facebook, LinkedIn).",
    impact: "Controls how your page looks when shared on Facebook or LinkedIn.",
    improvement: "Add specific tags (OG tags) so your shares show a nice image and title.",
    calculation: "We check for social media tags that define your page's preview image and title."
  },
  Twitter: {
    title: "Twitter Card",
    use: "Metadata specific to Twitter for rich media previews.",
    impact: "Ensures your links look professional and engaging when shared on Twitter (X).",
    improvement: "Add TwitterCard tags to control the image and summary shown in tweets.",
    calculation: "We look for specific tags designed to format your link previews on Twitter."
  },
  Social: {
    title: "Social Profiles",
    use: "Links to your official social media channels.",
    impact: "Linking to your social profiles builds trust and verifies your brand identity.",
    improvement: "Include links to your active social media accounts in your footer or contact page.",
    calculation: "We scan for links pointing to major social media platforms."
  }
};




// ------------------------------------------------------
// ✅ Score Calculation Info (Standard Weights)
// ------------------------------------------------------
const scoreCalculationInfo = {
  icon: Search,
  title: "On-Page SEO",
  guideLink: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
  use: (
    <div className="space-y-2">
      <p>Evaluates how well your page content, structure, and metadata are optimized for search engines and users.</p>
      <p>This includes page titles, headings, URLs, internal linking, media optimization, and content quality signals that help search engines understand and rank your page.</p>
    </div>
  ),
  impact: "Strong on-page SEO makes your content easier to discover, understand, and rank in search results. Well-structured pages improve visibility, click-through rates, accessibility, and overall user experience—leading to more organic traffic and better engagement.",
  improvement: (
    <ul className="list-disc pl-5 space-y-2">
      <li>
        <span className="font-semibold">Optimize page titles and meta descriptions:</span> Use clear, descriptive titles and summaries that accurately reflect page content and encourage clicks from search results.
      </li>
      <li>
        <span className="font-semibold">Use a clear heading structure:</span> Ensure each page has a single main heading, followed by logically ordered subheadings that organize content clearly.
      </li>
      <li>
        <span className="font-semibold">Improve content quality and uniqueness:</span> Avoid thin or repetitive content. Provide enough original, meaningful text to fully cover the topic.
      </li>
      <li>
        <span className="font-semibold">Optimize images and videos:</span> Add descriptive alt text, meaningful titles, and ensure media files are properly sized and optimized for performance and accessibility.
      </li>
      <li>
        <span className="font-semibold">Strengthen internal and contextual linking:</span> Use descriptive link text and include links within content to important internal pages, not just navigation menus.
      </li>
      <li>
        <span className="font-semibold">Clean up URLs and slugs:</span> Keep URLs short, readable, lowercase, and hyphen-separated. Avoid unnecessary parameters or overly deep paths.
      </li>
      <li>
        <span className="font-semibold">Use semantic HTML elements:</span> Structure pages with semantic tags to improve readability, accessibility, and search engine understanding.
      </li>
      <li>
        <span className="font-semibold">Ensure canonical and HTTPS best practices:</span> Use valid canonical tags to avoid duplicate content issues and serve pages securely over HTTPS.
      </li>
    </ul>
  ),
  calculation: (
    <div className="space-y-2">
      <p>We analyze multiple on-page SEO signals related to content quality, page structure, metadata, media usage, internal linking, and URL best practices. Each factor contributes to the final score based on its relative importance in helping search engines understand and rank your page.</p>
      <p>Higher-impact elements—such as titles, content quality, images, internal linking, and headings—carry more weight to reflect what most influences search performance.</p>
    </div>
  ),
  weightage: [
    { param: "URL Structure & Hierarchy", weight: "15%" },
    { param: "Image & Video Optimization", weight: "15%" },
    { param: "Title Tags", weight: "12%" },
    { param: "Content Quality & Uniqueness", weight: "10%" },
    { param: "Meta Descriptions", weight: "9%" },
    { param: "H1 Tags", weight: "9%" },
    { param: "Contextual Linking", weight: "9%" },
    { param: "Canonicalization", weight: "8%" },
    { param: "Other Technical SEO", weight: "13%" }
  ]
};

// ------------------------------------------------------
// ✅ Simple Skeleton
// ------------------------------------------------------
// ------------------------------------------------------
// ✅ Enhanced Shimmer
// ------------------------------------------------------
const ShimmerBlock = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
  </div>
);

const SeoShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
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
const MetricCard = ({ title, description, score, value, unit, darkMode, icon: Icon, children, className, onInfo }) => {
  const displayScore = score !== undefined && score !== null ? (score > 1 ? 100 : Math.round(score * 100)) : 0;
  const isPassed = displayScore >= 90;
  const isWarning = displayScore >= 50 && displayScore < 90;

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

  return (
    <div className={`relative overflow-hidden rounded-xl border ${cardBg} shadow-sm hover:shadow-md transition-shadow group ${className || ""}`}>
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
          <div className="flex items-start gap-3">
            <div className={`text-lg font-black ${isPassed ? "text-green-500" : isWarning ? "text-yellow-500" : "text-red-500"}`}>
              {value || "--"} <span className="text-sm font-semibold text-gray-400">{unit}</span>
            </div>
            {onInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo();
                }}
                className={`mt-1 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
                title="View Methodology"
              >
                <Info size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Details */}
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            Status Detail
          </h4>
          <p className={`text-sm font-medium ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {description}
          </p>
        </div>

        {/* Technical Data / Children */}
        {children && (
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Technical Data
            </h4>
            <div className={`p-2 rounded text-xs font-mono overflow-x-auto ${darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
              {children}
            </div>
          </div>
        )}
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
export default function On_Page_SEO() {
  const { data, loading } = useData();
  const { theme } = useContext(ThemeContext);
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const darkMode = theme === "dark";

  const auditSteps = useMemo(() => [
    { icon: <Search className="w-8 h-8 text-blue-500" />, title: "Metadata Analysis", text: "Scanning Title tags, Meta Descriptions, and URL structure for SEO best practices..." },
    { icon: <Layout className="w-8 h-8 text-purple-500" />, title: "Content Structure", text: "Evaluating Heading Hierarchy (H1-H6) and semantic HTML5 tags..." },
    { icon: <FileCode className="w-8 h-8 text-teal-500" />, title: "Technical SEO", text: "Verifying Canonical tags, Robots.txt, Sitemap presence, and HTTPS security..." },
    { icon: <ImageIcon className="w-8 h-8 text-indigo-500" />, title: "Visual Assets", text: "Checking image Alt text, file sizes, and video optimization..." },
    { icon: <Link className="w-8 h-8 text-amber-500" />, title: "Link Profile", text: "Analyzing internal linking structure, identifying broken links and orphan pages..." },
    { icon: <Copy className="w-8 h-8 text-red-500" />, title: "Content Quality", text: "Detecting duplicate content, thin pages, and keyword consistency..." },
    { icon: <Globe className="w-8 h-8 text-emerald-500" />, title: "Social Signals", text: "Reviewing Open Graph tags and Twitter Cards for social media optimization..." },
  ], []);

  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (loading || !data?.onPageSEO) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % auditSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);

  if (!data?.onPageSEO) {
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
                  <SeoShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const seo = data.onPageSEO;
  const overallScore = seo.Percentage || 0;
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  // Calculate Passed/Failed
  // Updated to support both old (Score) and new (score) formats temporarily or permanently
  const getScore = (metric) => metric?.score !== undefined ? metric.score : metric?.Score;

  const allMetrics = [
    seo.Title, seo.Meta_Description, seo.URL_Structure, seo.Canonical, seo.H1,
    seo.Image, seo.Video, seo.Heading_Hierarchy, seo.Semantic_Tags,
    seo.Contextual_Linking, seo.Links, seo.Duplicate_Content, seo.URL_Slugs, seo.HTTPS
  ].filter(Boolean);

  const passedCount = allMetrics.filter(m => (getScore(m) !== undefined ? (getScore(m) > 1 ? 100 : getScore(m) * 100) : 0) >= 90).length;
  const failedCount = allMetrics.filter(m => (getScore(m) !== undefined ? (getScore(m) > 1 ? 100 : getScore(m) * 100) : 0) < 90).length;

  const desc = {
    title: seo.Title?.details || "Main headline in search results.",
    meta: seo.Meta_Description?.details || "Summary text in search results.",
    url: seo.URL_Structure?.details || "Address bar structure.",
    canonical: seo.Canonical?.details || "Prevents duplicate content.",
    h1: seo.H1?.details || "Main page heading.",
    image: seo.Image?.details || "Alt text for accessibility.",
    video: seo.Video?.details || "Embedded video content.",
    imagecompression: "File size optimization.",
    heading: seo.Heading_Hierarchy?.details || "Logical content structure.",
    semantic: seo.Semantic_Tags?.details || "HTML5 structural tags.",
    structured: "Schema.org metadata.",
    contextual: seo.Contextual_Linking?.details || "Internal links in content.",
    https: seo.HTTPS?.details || "Secure connection.",
    links: seo.Links?.details || "Internal and external navigation.",
    duplicate: seo.Duplicate_Content?.details || "Content uniqueness.",
    slug: seo.URL_Slugs?.details || "URL path readability.",
  };

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
                        <Search className="w-3.5 h-3.5" />
                        <span>SEO Audit</span>
                      </div>
                      <h3 className={`${data.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                        On-Page <span className="text-blue-500">SEO</span>
                      </h3>
                      <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        Deep dive into your content strategy, technical structure, and user experience signals.
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
                    <div className={`absolute -inset-8 rounded-full blur-3xl opacity-25 transition-opacity duration-700 group-hover:opacity-40 ${overallScore >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                    <CircularProgress value={overallScore} size={data.report === "All" ? 180 : 150} stroke={14} />
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                      <span className={`${data.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{overallScore}%</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Content Essentials */}
        <Section title="Content Essentials" icon={FileText} darkMode={darkMode}>
          <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Title, icon: Tag })} title="Title Tag" description={desc.title} score={seo.Title?.score} value={seo.Title?.meta?.length + " chars"} darkMode={darkMode} icon={Tag}>
            {seo.Title?.meta?.title && <div className="italic">"{seo.Title.meta.title}"</div>}
          </MetricCard>
          <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Meta_Description, icon: FileText })} title="Meta Description" description={desc.meta} score={seo.Meta_Description?.score} value={seo.Meta_Description?.meta?.length + " chars"} darkMode={darkMode} icon={FileText}>
            {seo.Meta_Description?.meta?.description && <div className="italic">"{seo.Meta_Description.meta.description}"</div>}
          </MetricCard>
          <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Canonical, icon: Copy })} title="Canonical Tag" description={desc.canonical} score={seo.Canonical?.score} value={seo.Canonical?.meta?.isSelfReferencing ? "Self-Ref" : (seo.Canonical?.score === 1 ? "Valid" : "Invalid")} darkMode={darkMode} icon={Copy}>
            <div className="space-y-1 text-xs">
              {seo.Canonical?.details && <div className={seo.Canonical.score === 1 ? "text-green-500 font-medium" : "text-amber-500"}>{seo.Canonical.details}</div>}
              {seo.Canonical?.meta?.canonical && (
                <div className={`break-all p-1.5 rounded border ${darkMode ? "bg-gray-800 border-gray-700 font-mono text-gray-300" : "bg-gray-50 border-gray-200 font-mono text-gray-600"}`}>
                  {seo.Canonical.meta.canonical}
                </div>
              )}
            </div>
          </MetricCard>
          <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.URL_Structure, icon: Link })} title="URL Structure" description={desc.url} score={seo.URL_Structure?.score} value={seo.URL_Structure?.score === 1 ? "Clean" : "Issues"} darkMode={darkMode} icon={Link}>
            <div className="space-y-2">
              {seo.URL_Structure?.meta?.url && <div className="break-all p-1.5 rounded border font-mono text-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 bg-gray-50 border-gray-200 text-gray-600">{seo.URL_Structure.meta.url}</div>}
              {seo.URL_Structure?.meta?.issues?.length > 0 && (
                <div className="space-y-1">
                  <div className="font-semibold text-red-500 text-xs uppercase">Structure Issues:</div>
                  {seo.URL_Structure.meta.issues.map((issue, i) => (
                    <div key={i} className="text-xs opacity-90 flex items-start gap-2">
                      <XCircle size={12} className="mt-0.5 flex-shrink-0 text-red-500" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </MetricCard>
          <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.H1, icon: Layout })} title="H1 Tag" description={desc.h1} score={seo.H1?.score} value={seo.H1?.meta?.count + " Found"} darkMode={darkMode} icon={Layout}>
            {seo.H1?.meta?.content?.map((h, i) => <div key={i} className="mb-1">• {h}</div>)}
          </MetricCard>
        </Section>

        {/* Media & Accessibility */}
        <Section title="Media & Accessibility" icon={ImageIcon} darkMode={darkMode}>
          {seo.Image?.meta?.total > 0 && (
            <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Image, icon: ImageIcon })} title="Image Metadata" description="Alt text check." score={seo.Image?.meta?.altScore} value={seo.Image?.meta?.withAlt + "/" + seo.Image?.meta?.total + " optimized"} darkMode={darkMode} icon={ImageIcon}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="opacity-70">Total Images</div>
                    <div className="text-lg font-bold">{seo.Image?.meta?.total || 0}</div>
                  </div>
                  <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="opacity-70">Alt Text</div>
                    <div className="text-lg font-bold">{seo.Image?.meta?.withAlt || 0} <span className="text-[10px] opacity-60">({Math.round((seo.Image?.meta?.altScore || 0) * 100)}%)</span></div>
                  </div>
                  <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="opacity-70">Meaningful</div>
                    <div className="text-lg font-bold">{seo.Image?.meta?.meaningfulAlt || 0}</div>
                  </div>
                  <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="opacity-70">Title Attr</div>
                    <div className="text-lg font-bold">{seo.Image?.meta?.total - (seo.Image?.meta?.missingTitle?.length || 0)}</div>
                  </div>
                </div>

                {/* Missing Alt */}
                {seo.Image?.meta?.missingAlt?.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-semibold text-red-500 text-xs uppercase flex items-center gap-1">
                      <AlertTriangle size={10} />
                      Missing Alt Text ({seo.Image.meta.missingAlt.length}):
                    </div>
                    <div className={`max-h-24 overflow-y-auto custom-scrollbar p-1.5 rounded border ${darkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50 border-red-100"}`}>
                      {seo.Image.meta.missingAlt.map((img, i) => (
                        <div key={i} className="truncate text-[10px] opacity-80 mb-0.5 font-mono" title={img.src}>• {img.src.split('/').pop() || "unknown"}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Title */}
                {seo.Image?.meta?.missingTitle?.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-semibold text-amber-500 text-xs uppercase flex items-center gap-1">
                      <Info size={10} />
                      Missing Title Attr ({seo.Image.meta.missingTitle.length}):
                    </div>
                    <div className={`max-h-24 overflow-y-auto custom-scrollbar p-1.5 rounded border ${darkMode ? "bg-amber-900/10 border-amber-900/30" : "bg-amber-50 border-amber-100"}`}>
                      {seo.Image.meta.missingTitle.map((img, i) => (
                        <div key={i} className="truncate text-[10px] opacity-80 mb-0.5 font-mono" title={img.src}>• {img.src.split('/').pop() || "unknown"}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </MetricCard>
          )}

          {seo.Image?.meta?.total > 0 && (
            <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Compression, icon: ImageIcon })} title="Compression" description={desc.imagecompression} score={seo.Image?.meta?.sizeScore} value={seo.Image?.meta?.sizeScore === 1 ? "Good" : "Heavy Images"} darkMode={darkMode} icon={ImageIcon}>
              {seo.Image?.meta?.largeImages?.length > 0 ? (
                <div className="space-y-1">
                  <div className="font-semibold text-red-500 text-xs uppercase flex items-center gap-1">
                    <AlertTriangle size={10} />
                    Large Images ({">"}150KB):
                  </div>
                  <div className={`max-h-32 overflow-y-auto custom-scrollbar p-1.5 rounded border ${darkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50 border-red-100"}`}>
                    {seo.Image.meta.largeImages.map((img, i) => (
                      <div key={i} className="flex justify-between items-center text-[10px] mb-1 last:mb-0">
                        <span className="truncate opacity-80 font-mono w-2/3" title={img.src}>{img.src.split('/').pop() || "unknown"}</span>
                        <span className="font-bold text-red-500">{img.size} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm opacity-80 flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  <span>All checked images are under 150KB.</span>
                </div>
              )}
            </MetricCard>
          )}

          {seo.Video?.meta?.total > 0 && (
            <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Video, icon: Video })} title="Internal Videos" description={desc.video} score={seo.Video?.score} value={seo.Video?.meta?.total + " Found"} darkMode={darkMode} icon={Video}>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="opacity-70">Total</div>
                  <div className="text-lg font-bold">{seo.Video.meta.total}</div>
                </div>
                <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="opacity-70">Embedded</div>
                  <div className="text-lg font-bold">{seo.Video.meta.embeddingCount ?? seo.Video.meta.embedding}</div>
                </div>
                <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="opacity-70">Lazy Load</div>
                  <div className={`text-lg font-bold ${seo.Video.meta.lazyCount === seo.Video.meta.total ? "text-green-500" : "text-yellow-500"}`}>{seo.Video.meta.lazyCount || 0}</div>
                </div>
                <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="opacity-70">Metadata</div>
                  <div className={`text-lg font-bold ${seo.Video.meta.metaCount > 0 ? "text-green-500" : "text-red-500"}`}>{seo.Video.meta.metaCount || 0}</div>
                </div>
              </div>
            </MetricCard>
          )}
        </Section>

        {/* Structure & Semantics */}
        <Section title="Structure & Semantics" icon={Layout} darkMode={darkMode}>
          <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Semantic, icon: FileCode })} title="Semantic Tags" description={desc.semantic} score={seo.Semantic_Tags?.score} value={seo.Semantic_Tags?.score === 1 ? "Excellent" : "Partial"} darkMode={darkMode} icon={FileCode}>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {['main', 'nav', 'header', 'footer', 'article', 'section'].map((tag) => {
                const isPresent = seo.Semantic_Tags?.meta?.[tag] === 1;
                return (
                  <div key={tag} className={`px-2 py-1.5 rounded text-xs text-center border font-semibold capitalize ${isPresent
                    ? (darkMode ? "bg-green-900/20 border-green-800/30 text-green-400" : "bg-green-50 border-green-100 text-green-700")
                    : (darkMode ? "bg-gray-800 border-gray-700 text-gray-500" : "bg-gray-100 border-gray-200 text-gray-400")
                    }`}>
                    {tag}
                  </div>
                );
              })}
            </div>
          </MetricCard>
          <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Contextual, icon: Link })} title="Contextual Links" description={desc.contextual} score={seo.Contextual_Linking?.score} value={seo.Contextual_Linking?.meta?.totalContextual + " Links"} darkMode={darkMode} icon={Link}>
            <div className="space-y-3">
              {seo.Contextual_Linking?.meta?.missingLinks?.length > 0 && (
                <div className="space-y-1">
                  <div className="font-semibold text-yellow-500">Missing from Menu:</div>
                  <div className="flex flex-wrap gap-1">
                    {seo.Contextual_Linking.meta.missingLinks.map((link, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded text-xs ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>{link}</span>
                    ))}
                  </div>
                </div>
              )}
              {seo.Contextual_Linking?.meta?.issues?.length > 0 && (
                <div className="space-y-1">
                  <div className="font-semibold text-red-500">Issues Found:</div>
                  <ul className="list-disc list-inside text-xs opacity-90 space-y-1">
                    {seo.Contextual_Linking.meta.issues.map((issue, i) => (
                      <li key={i}>{typeof issue === 'string' ? issue : issue.finding}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </MetricCard>
          {seo.Heading_Hierarchy && (
            <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Hierarchy, icon: List })} title="Hierarchy" description={desc.heading} score={seo.Heading_Hierarchy?.score} value={seo.Heading_Hierarchy?.score ? "Logical" : "Broken"} darkMode={darkMode} icon={List} className="md:col-span-2 lg:col-span-3">
              <div className="space-y-4">
                {/* Heading Counts */}
                <div className="grid grid-cols-6 gap-2 text-center">
                  {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => (
                    <div key={tag} className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                      <div className="text-xs font-bold opacity-60 uppercase">{tag}</div>
                      <div className={`font-bold text-lg ${seo.Heading_Hierarchy?.meta?.counts?.[tag] > 0 ? (darkMode ? "text-blue-400" : "text-blue-600") : "text-gray-400"}`}>
                        {seo.Heading_Hierarchy?.meta?.counts?.[tag] || 0}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Heading List */}
                {seo.Heading_Hierarchy?.meta?.headings?.length > 0 && (
                  <div className={`rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-100 bg-gray-50"}`}>
                    <div className={`px-4 py-2 border-b text-xs font-bold uppercase tracking-wider ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                      Heading Structure
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                      {seo.Heading_Hierarchy.meta.headings.map((h, i) => {
                        const indent = {
                          h1: '',
                          h2: 'ml-4',
                          h3: 'ml-8',
                          h4: 'ml-12',
                          h5: 'ml-16',
                          h6: 'ml-20'
                        };
                        return (
                          <div key={i} className={`flex items-start gap-3 p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${indent[h.tag] || ''}`}>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex-shrink-0 ${h.tag === 'h1' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                              h.tag === 'h2' ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" :
                                "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              }`}>
                              {h.tag}
                            </span>
                            <span className={`text-sm truncate ${h.tag === 'h1' ? "font-bold" :
                              h.tag === 'h2' ? "font-semibold opacity-90" :
                                "opacity-80"
                              } ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                              {h.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Issues (if any) */}
                {seo.Heading_Hierarchy?.meta?.issues?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <div className="font-semibold text-red-500 text-sm">Hierarchy Issues:</div>
                    {seo.Heading_Hierarchy.meta.issues.map((issue, i) => (
                      <div key={i} className="text-xs opacity-90 flex items-start gap-2">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0 text-red-500" />
                        <span>{issue.finding}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </MetricCard>
          )}
        </Section>

        {/* Technical SEO */}
        <Section title="Technical SEO" icon={Lock} darkMode={darkMode}>
          <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.HTTPS, icon: Lock })} title="HTTPS" description={seo.HTTPS?.details || "Secure connection."} score={seo.HTTPS?.score} value={seo.HTTPS?.score === 1 ? "Secure Connection" : "Insecure Connection"} darkMode={darkMode} icon={Lock}>
            {seo.HTTPS?.meta?.url && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-bold ${seo.HTTPS.score === 1 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}>
                    {seo.HTTPS.score === 1 ? "HTTPS" : "HTTP"}
                  </div>
                  <div className={`text-xs font-mono break-all ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {seo.HTTPS.meta.url}
                  </div>
                </div>
              </div>
            )}
          </MetricCard>
          <MetricCard
            onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Duplicate, icon: Copy })}
            title="Content Quality"
            description={desc.duplicate}
            score={seo.Duplicate_Content?.score}
            value={seo.Duplicate_Content?.score === 1 ? "Good" : seo.Duplicate_Content?.score === 0.5 ? "Repetitive" : "Thin"}
            darkMode={darkMode}
            icon={Copy}
          >
            <div className="space-y-3">
              <div className="text-sm font-semibold">
                Total Words: <span className={darkMode ? "text-blue-400" : "text-blue-600"}>{seo.Duplicate_Content?.meta?.wordCount || 0}</span>
              </div>

              {seo.Duplicate_Content?.meta?.repeatedSentences?.length > 0 && (
                <div className="space-y-1">
                  <div className="font-semibold text-red-500 text-xs uppercase tracking-wide">Repetitive Sentences:</div>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                    {seo.Duplicate_Content.meta.repeatedSentences.map((item, i) => (
                      <div key={i} className="flex justify-between items-start gap-2 p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                        <span className="text-xs opacity-90 italic line-clamp-2" title={item.text}>
                          "{item.text}"
                        </span>
                        <span className="text-xs font-bold text-red-500 whitespace-nowrap bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                          x{item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </MetricCard>
          <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Links, icon: Globe })} title="Link Profile" description={desc.links} score={seo.Links?.score} value={seo.Links?.meta?.total + " Total"} darkMode={darkMode} icon={Globe} className="md:col-span-2 lg:col-span-3">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`p-3 rounded-lg text-center ${darkMode ? "bg-gray-700/50" : "bg-gray-100/50"}`}>
                <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Internal</div>
                <div className={`text-2xl font-black ${darkMode ? "text-blue-400" : "text-blue-600"}`}>{seo.Links?.meta?.internal}</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${darkMode ? "bg-gray-700/50" : "bg-gray-100/50"}`}>
                <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">External</div>
                <div className={`text-2xl font-black ${darkMode ? "text-purple-400" : "text-purple-600"}`}>{seo.Links?.meta?.external}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Internal Links List */}
              {seo.Links?.meta?.internalLinks?.length > 0 && (
                <div className={`rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-200 bg-gray-50/50"}`}>
                  <div className={`px-4 py-2 border-b text-xs font-bold uppercase tracking-wider ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                    Internal Links
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {seo.Links.meta.internalLinks.map((link, i) => (
                      <div key={i} className="group p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? "bg-blue-500" : "bg-blue-600"}`}></div>
                          <span className={`text-xs font-bold ${darkMode ? "text-gray-300" : "text-gray-700"} truncate`}>
                            {link}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Links List */}
              {seo.Links?.meta?.externalLinks?.length > 0 && (
                <div className={`rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-200 bg-gray-50/50"}`}>
                  <div className={`px-4 py-2 border-b text-xs font-bold uppercase tracking-wider ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                    External Links
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {seo.Links.meta.externalLinks.map((link, i) => (
                      <div key={i} className="group p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? "bg-purple-500" : "bg-purple-600"}`}></div>
                          <span className={`text-xs font-bold ${darkMode ? "text-gray-300" : "text-gray-700"} truncate`}>
                            {link}
                          </span>
                          {/* External Icon */}
                          <Globe size={10} className="opacity-40" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Display Broken Link Counts if they exist */}
            {(seo.Links?.meta?.brokenInternal > 0 || seo.Links?.meta?.brokenExternal > 0) && (
              <div className="mt-4 flex gap-4 text-xs font-bold">
                {seo.Links?.meta?.brokenInternal > 0 && <span className="text-red-500">Broken Internal: {seo.Links.meta.brokenInternal}</span>}
                {seo.Links?.meta?.brokenExternal > 0 && <span className="text-red-500">Broken External: {seo.Links.meta.brokenExternal}</span>}
              </div>
            )}
          </MetricCard>

          {/* Hreflang - Wrapped in Card */}
          {(seo.Hreflang?.Results?.length > 0 || seo.Hreflang?.Issues?.length > 0) && (
            <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Hreflang, icon: Globe })} title="Hreflang" description="International targeting." score={seo.Hreflang?.score} value={seo.Hreflang?.score === 1 ? "Valid" : "Issues"} darkMode={darkMode} icon={Globe}>
              <div className="space-y-3">
                {seo.Hreflang?.Results?.length > 0 && (
                  <div className="space-y-1">
                    <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Link Validation</div>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                      {seo.Hreflang.Results.map((res, i) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}>
                                {res.hreflang}
                              </span>
                              <span className={`text-[10px] font-mono opacity-80 truncate max-w-[150px]`} title={res.target}>
                                {res.target}
                              </span>
                            </div>
                          </div>
                          <div className={`text-xs font-bold whitespace-nowrap ${res.returnLink === "PASS" ? "text-green-500" : "text-red-500"}`}>
                            {res.returnLink === "PASS" ? "Valid" : "Missing"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {seo.Hreflang?.Issues?.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <div className="font-semibold text-red-500 text-xs">Validation Issues:</div>
                    {seo.Hreflang.Issues.map((issue, i) => (
                      <div key={i} className="text-xs opacity-90 flex items-start gap-2 text-red-400">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                        <span>{issue.finding}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </MetricCard>
          )}

          {/* Slugs - Always show */}
          <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Slug, icon: Link })} title="URL Slugs" description={desc.slug} score={seo.URL_Slugs?.score} value={seo.URL_Slugs?.score === 1 ? "Valid" : "Issues Found"} darkMode={darkMode} icon={Link}>
            <div className="space-y-2">
              {seo.URL_Slugs?.meta?.slug && (
                <div className={`text-xs font-mono p-1.5 rounded break-all ${darkMode ? "bg-gray-700/50 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  /{seo.URL_Slugs.meta.slug}
                </div>
              )}
              {seo.URL_Slugs?.meta?.issues?.length > 0 ? (
                <div className="space-y-1">
                  <div className="font-semibold text-red-500 text-xs uppercase">Slug Issues:</div>
                  {seo.URL_Slugs.meta.issues.map((issue, i) => (
                    <div key={i} className="text-xs opacity-90 flex items-start gap-2">
                      <XCircle size={12} className="mt-0.5 flex-shrink-0 text-red-500" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs opacity-70 flex items-center gap-1 text-green-500">
                  <CheckCircle size={12} />
                  <span>Slug format matches SEO best practices.</span>
                </div>
              )}
            </div>
          </MetricCard>
        </Section>

        {/* Schema Data */}
        <div className={`rounded-xl p-8 shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-3 mb-4">
            <FileCode size={24} className={darkMode ? "text-indigo-400" : "text-indigo-600"} />
            <h3 className={`text-xl font-bold ${textColor}`}>Detected Schema Markup</h3>
          </div>
          <div className={`p-4 rounded-lg overflow-x-auto border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
            <pre className="text-xs font-mono leading-relaxed">
              {!data.siteSchema ? "No Schema Markup Found" : JSON.stringify(data.siteSchema, null, 2)}
            </pre>
          </div>
        </div>

        {/* Social Media Optimization */}
        <Section title="Social Media Optimization" icon={Globe} darkMode={darkMode}>
          {/* Open Graph Card */}
          <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.OpenGraph, icon: Globe })} title="Open Graph" description={seo.Open_Graph?.details || "Social sharing meta tags."} score={seo.Open_Graph?.score} value={seo.Open_Graph?.score === 1 ? "Optimized" : "Missing / Incomplete"} darkMode={darkMode} icon={Globe}>
            <div className="space-y-3">
              {seo.Open_Graph?.meta?.tags && (
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(seo.Open_Graph.meta.tags).map(([key, val], i) => (
                    <div key={i} className={`p-2 rounded border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                      <div className="text-[10px] font-bold uppercase opacity-60 mb-0.5">{key}</div>
                      <div className={`text-xs font-mono break-all ${val ? (darkMode ? "text-blue-300" : "text-blue-600") : "text-red-500 italic"}`}>
                        {val || "Missing"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {seo.Open_Graph?.meta?.missing?.length > 0 && (
                <div className="text-xs text-red-500 font-medium">
                  Missing: {seo.Open_Graph.meta.missing.join(", ")}
                </div>
              )}
            </div>
          </MetricCard>

          {/* Twitter Card */}
          <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Twitter, icon: Globe })} title="Twitter Card" description={seo.Twitter_Card?.details || "Twitter specific meta tags."} score={seo.Twitter_Card?.score} value={seo.Twitter_Card?.score === 1 ? "Optimized" : "Missing / Incomplete"} darkMode={darkMode} icon={Globe}>
            <div className="space-y-3">
              {seo.Twitter_Card?.meta?.tags && (
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(seo.Twitter_Card.meta.tags).map(([key, val], i) => (
                    <div key={i} className={`p-2 rounded border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                      <div className="text-[10px] font-bold uppercase opacity-60 mb-0.5">{key}</div>
                      <div className={`text-xs font-mono break-all ${val ? (darkMode ? "text-cyan-300" : "text-cyan-600") : "text-red-500 italic"}`}>
                        {val || "Missing"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {seo.Twitter_Card?.meta?.missing?.length > 0 && (
                <div className="text-xs text-red-500 font-medium">
                  Missing: {seo.Twitter_Card.meta.missing.join(", ")}
                </div>
              )}
            </div>
          </MetricCard>

          {/* Social Links Card */}
          <MetricCard onInfo={() => setSelectedMetricInfo({ ...seoMetricExplanations.Social, icon: Globe })} title="Social Profiles" description="Detected social media links." score={seo.Social_Links?.score} value={seo.Social_Links?.meta?.count + " Found"} darkMode={darkMode} icon={Globe}>
            {seo.Social_Links?.meta?.links?.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {seo.Social_Links.meta.links.map((link, i) => {
                  let domain = "Link";
                  try { domain = new URL(link).hostname.replace("www.", ""); } catch { }
                  return (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 rounded border transition-colors ${darkMode ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-blue-300" : "bg-gray-50 border-gray-100 hover:bg-gray-100 text-blue-600"}`}>
                      <Link size={12} className="opacity-50" />
                      <span className="text-xs font-medium truncate">{domain}</span>
                    </a>
                  )
                })}
              </div>
            ) : (
              <div className="text-xs opacity-60 italic">No social profile links detected on page.</div>
            )}
          </MetricCard>
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