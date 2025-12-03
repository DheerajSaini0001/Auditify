import React, { useContext, useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import {
  Activity,
  Zap,
  Layout,
  MousePointer2,
  Image as ImageIcon,
  Server,
  Database,
  FileCode,
  Globe,
  Shield,
  Link,
  Map,
  FileText,
  Search,
  ArrowRightLeft,
  AlertTriangle,
  Clock,
  Gauge,
  Lightbulb,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// ------------------------------------------------------
// 🎨 Utilities & Helpers
// ------------------------------------------------------
const getStatusColor = (score, status) => {
  if (status === "pass") return {
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    shadow: "shadow-emerald-500/20",
    gradient: "from-emerald-500 to-teal-400",
    icon: CheckCircle2
  };
  if (status === "warning") return {
    text: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    shadow: "shadow-amber-500/20",
    gradient: "from-amber-500 to-orange-400",
    icon: AlertCircle
  };
  if (status === "fail") return {
    text: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    shadow: "shadow-rose-500/20",
    gradient: "from-rose-500 to-red-600",
    icon: XCircle
  };

  // Fallback
  if (score >= 90) return {
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    shadow: "shadow-emerald-500/20",
    gradient: "from-emerald-500 to-teal-400",
    icon: CheckCircle2
  };
  if (score >= 50) return {
    text: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    shadow: "shadow-amber-500/20",
    gradient: "from-amber-500 to-orange-400",
    icon: AlertCircle
  };
  return {
    text: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    shadow: "shadow-rose-500/20",
    gradient: "from-rose-500 to-red-600",
    icon: XCircle
  };
};

// ------------------------------------------------------
// 🦴 Skeleton Loader
// ------------------------------------------------------
const TechShimmer = ({ darkMode }) => (
  <div className={`min-h-screen p-8 ${darkMode ? "bg-[#050505]" : "bg-gray-50"}`}>
    <div className={`h-80 w-full rounded-3xl mb-12 ${darkMode ? "bg-slate-900/50" : "bg-white"} animate-pulse`}></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {[...Array(9)].map((_, i) => (
        <div key={i} className={`h-72 rounded-2xl ${darkMode ? "bg-slate-900/50" : "bg-white"} animate-pulse`}></div>
      ))}
    </div>
  </div>
);

// ------------------------------------------------------
// 🧊 Metric Card (Static 3D Look)
// ------------------------------------------------------
const MetricCard = ({ details, value, dynamicData, darkMode, icon: Icon }) => {
  // Determine Status
  let status = "pass";
  if (dynamicData?.status) {
    status = dynamicData.status;
  } else if (details.isCrux) {
    if (dynamicData?.category === "SLOW") status = "fail";
    else if (dynamicData?.category === "AVERAGE") status = "warning";
    else status = "pass";
  }

  const colors = getStatusColor(dynamicData?.score || 0, status);
  const StatusIcon = colors.icon;
  const suggestion = dynamicData?.suggestion || "No specific suggestion available.";
  const auditResult = dynamicData?.details || "";

  // Filter Meta Data
  const meta = dynamicData?.meta || {};
  const excludedKeys = ['value', 'unit', 'score', 'status', 'details', 'suggestion', 'exists', 'hasStructuredData', 'brokenLinksList', 'target', 'uncompressedResources', 'uncachedResources', 'unoptimizedImages', 'unminifiedScripts', 'blockingResources'];
  const metaKeys = Object.keys(meta).filter(key => !excludedKeys.includes(key));
  const brokenLinks = meta.brokenLinksList || [];
  const uncompressedResources = meta.uncompressedResources || [];
  const uncachedResources = meta.uncachedResources || [];
  const unoptimizedImages = meta.unoptimizedImages || [];
  const unminifiedScripts = meta.unminifiedScripts || [];
  const blockingResources = meta.blockingResources || [];

  const renderMetaValue = (val) => {
    if (typeof val === 'object' && val !== null) {
      return Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(', ');
    }
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return val;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`relative group rounded-2xl p-[1px]`}
    >
      {/* Animated Gradient Border */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colors.gradient} opacity-40 blur-sm group-hover:opacity-100 transition-opacity duration-500`} />

      {/* Card Content */}
      <div className={`relative h-full rounded-2xl overflow-hidden backdrop-blur-xl border-t border-l border-white/10 shadow-2xl
        ${darkMode ? "bg-[#0a0a0a]/90" : "bg-white/90"}
      `}>

        {/* Status Strip */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors.gradient}`} />

        <div className="p-6 flex flex-col h-full relative z-10">

          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl shadow-lg ${darkMode ? "bg-slate-900" : "bg-white"} ${colors.text} ring-1 ring-white/10`}>
                <Icon size={24} strokeWidth={2} />
              </div>
              <div>
                <h3 className={`font-bold text-base tracking-tight ${darkMode ? "text-slate-100" : "text-gray-800"}`}>
                  {details.title}
                </h3>
                <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mt-1 ${colors.text}`}>
                  <StatusIcon size={12} />
                  {status === "pass" ? "Good" : status === "warning" ? "Needs Work" : "Poor"}
                </div>
              </div>
            </div>

            {/* Value */}
            <div className={`text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br ${colors.gradient} drop-shadow-sm`}>
              {value !== null && value !== undefined ? `${value}${details.unit || ""}` : "--"}
            </div>
          </div>

          {/* Insight */}
          <div className={`mb-6 text-xs font-medium leading-relaxed p-3 rounded-lg border border-white/5
            ${darkMode ? "bg-white/5 text-slate-300" : "bg-slate-50 text-gray-600"}
          `}>
            <div className="flex flex-col gap-2">
              <div>
                <span className="text-indigo-400 font-bold mr-1">Insight:</span>
                {details.analogy}
              </div>
              {meta.target && (
                <div className={`pt-2 mt-1 border-t ${darkMode ? "border-white/10" : "border-gray-200"} flex items-center gap-2`}>
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${darkMode ? "text-slate-500" : "text-gray-400"}`}>Target:</span>
                  <span className={`text-xs font-mono font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{meta.target}</span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Stats (Holographic Panel) */}
          {(metaKeys.length > 0 || auditResult) && (
            <div className={`mt-auto rounded-xl border overflow-hidden transition-all duration-300
              ${darkMode ? "bg-black/40 border-white/10" : "bg-gray-50 border-gray-200"}
            `}>
              {auditResult && (
                <div className={`px-4 py-2.5 text-[11px] font-semibold border-b ${darkMode ? "border-white/10 text-slate-400" : "border-gray-200 text-gray-500"}`}>
                  {auditResult}
                </div>
              )}
              {metaKeys.length > 0 && (
                <div className="p-3 grid gap-2">
                  {metaKeys.map((key) => (
                    <div key={key} className="flex justify-between items-center text-xs group/item">
                      <span className={`capitalize font-medium transition-colors ${darkMode ? "text-slate-500 group-hover/item:text-slate-300" : "text-gray-500 group-hover/item:text-gray-700"}`}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={`font-mono font-bold ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
                        {renderMetaValue(meta[key])}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Uncompressed Resources List */}
          {uncompressedResources.length > 0 && (
            <div className={`mt-3 rounded-lg border overflow-hidden ${darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
              <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b ${darkMode ? "border-white/10 text-slate-400" : "border-gray-200 text-gray-500"}`}>
                Uncompressed Resources ({uncompressedResources.length})
              </div>
              <div className="max-h-32 overflow-y-auto custom-scrollbar">
                {uncompressedResources.map((url, i) => (
                  <div key={i} className={`px-3 py-2 text-[10px] border-b last:border-0 flex justify-between gap-2 ${darkMode ? "border-white/5 text-amber-400" : "border-gray-100 text-amber-600"}`}>
                    <span className="truncate flex-1" title={url}>{url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uncached Resources List */}
          {uncachedResources.length > 0 && (
            <div className={`mt-3 rounded-lg border overflow-hidden ${darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
              <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b ${darkMode ? "border-white/10 text-slate-400" : "border-gray-200 text-gray-500"}`}>
                Uncached Resources ({uncachedResources.length})
              </div>
              <div className="max-h-32 overflow-y-auto custom-scrollbar">
                {uncachedResources.map((url, i) => (
                  <div key={i} className={`px-3 py-2 text-[10px] border-b last:border-0 flex justify-between gap-2 ${darkMode ? "border-white/5 text-amber-400" : "border-gray-100 text-amber-600"}`}>
                    <span className="truncate flex-1" title={url}>{url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unoptimized Images List */}
          {unoptimizedImages.length > 0 && (
            <div className={`mt-3 rounded-lg border overflow-hidden ${darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
              <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b ${darkMode ? "border-white/10 text-slate-400" : "border-gray-200 text-gray-500"}`}>
                Unoptimized Images ({unoptimizedImages.length})
              </div>
              <div className="max-h-32 overflow-y-auto custom-scrollbar">
                {unoptimizedImages.map((url, i) => (
                  <div key={i} className={`px-3 py-2 text-[10px] border-b last:border-0 flex justify-between gap-2 ${darkMode ? "border-white/5 text-amber-400" : "border-gray-100 text-amber-600"}`}>
                    <span className="truncate flex-1" title={url}>{url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unminified Scripts List */}
          {unminifiedScripts.length > 0 && (
            <div className={`mt-3 rounded-lg border overflow-hidden ${darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
              <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b ${darkMode ? "border-white/10 text-slate-400" : "border-gray-200 text-gray-500"}`}>
                Unminified Scripts ({unminifiedScripts.length})
              </div>
              <div className="max-h-32 overflow-y-auto custom-scrollbar">
                {unminifiedScripts.map((url, i) => (
                  <div key={i} className={`px-3 py-2 text-[10px] border-b last:border-0 flex justify-between gap-2 ${darkMode ? "border-white/5 text-amber-400" : "border-gray-100 text-amber-600"}`}>
                    <span className="truncate flex-1" title={url}>{url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blocking Resources List */}
          {blockingResources.length > 0 && (
            <div className={`mt-3 rounded-lg border overflow-hidden ${darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
              <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b ${darkMode ? "border-white/10 text-slate-400" : "border-gray-200 text-gray-500"}`}>
                Blocking Resources ({blockingResources.length})
              </div>
              <div className="max-h-32 overflow-y-auto custom-scrollbar">
                {blockingResources.map((url, i) => (
                  <div key={i} className={`px-3 py-2 text-[10px] border-b last:border-0 flex justify-between gap-2 ${darkMode ? "border-white/5 text-amber-400" : "border-gray-100 text-amber-600"}`}>
                    <span className="truncate flex-1" title={url}>{url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Broken Links List */}
          {brokenLinks.length > 0 && (
            <div className={`mt-3 rounded-lg border overflow-hidden ${darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
              <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b ${darkMode ? "border-white/10 text-slate-400" : "border-gray-200 text-gray-500"}`}>
                Broken URLs ({brokenLinks.length})
              </div>
              <div className="max-h-32 overflow-y-auto custom-scrollbar">
                {brokenLinks.map((link, i) => (
                  <div key={i} className={`px-3 py-2 text-[10px] border-b last:border-0 flex justify-between gap-2 ${darkMode ? "border-white/5 text-rose-400" : "border-gray-100 text-rose-600"}`}>
                    <span className="truncate flex-1" title={link.url}>{link.url}</span>
                    <span className="font-mono opacity-70">{link.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className={`mt-4 pt-4 border-t ${darkMode ? "border-white/10" : "border-gray-100"}`}>
            <div className="flex gap-2.5 items-start">
              <Info size={14} className={`mt-0.5 shrink-0 ${darkMode ? "text-slate-500" : "text-gray-400"}`} />
              <p className={`text-[11px] leading-relaxed font-medium ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                {suggestion}
              </p>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

// ------------------------------------------------------
// 🚀 Main Component
// ------------------------------------------------------
export default function Technical_Performance() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const darkMode = theme === "dark";
  const [activeSection, setActiveSection] = useState(null);

  // Handle Scroll Spy
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 200) {
          current = section.getAttribute('id');
        }
      });
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 120,
        behavior: 'smooth'
      });
    }
  };

  if (loading || !data || data.Status === "inprogress") {
    return <TechShimmer darkMode={darkMode} />;
  }

  if (data.Status === "failed") {
    return (
      <div className={`flex items-center justify-center h-screen w-full ${darkMode ? "bg-[#050505]" : "bg-gray-50"}`}>
        <div className={`text-center p-8 rounded-2xl shadow-2xl border ${darkMode ? "bg-slate-900 border-rose-900/30" : "bg-white border-rose-100"}`}>
          <div className="text-rose-500 text-5xl mb-4 flex justify-center"><AlertTriangle size={48} /></div>
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Audit Failed</h2>
          <p className={`max-w-md mx-auto mb-6 ${darkMode ? "text-slate-400" : "text-gray-600"}`}>
            {data.Error_Message || "An unexpected error occurred while analyzing the website."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const metric = data;
  const overallScore = metric?.Technical_Performance?.Percentage || 0;

  // Metric Sections Config
  const sections = [
    {
      id: "crux",
      title: "Real User Experience",
      subtitle: "Field data from actual users (CrUX)",
      icon: Globe,
      isCrux: true,
      metrics: [
        { key: 'LCP', title: "Largest Contentful Paint", analogy: "Time until main content is visible.", unit: "ms", icon: Layout },
        { key: 'FID', title: "First Input Delay", analogy: "Time until page reacts to click.", unit: "ms", icon: MousePointer2 },
        { key: 'CLS', title: "Cumulative Layout Shift", analogy: "Visual stability of the page.", unit: "", icon: Layout },
        { key: 'INP', title: "Interaction to Next Paint", analogy: "Overall responsiveness.", unit: "ms", icon: Activity },
        { key: 'FCP', title: "First Contentful Paint", analogy: "First visual response.", unit: "ms", icon: Zap },
        { key: 'TTFB', title: "Time To First Byte", analogy: "Server response speed.", unit: "ms", icon: Server }
      ]
    },
    {
      id: "core-vitals",
      title: "Core Web Vitals",
      subtitle: "Lab data simulation",
      icon: Activity,
      metrics: [
        { key: 'LCP', title: "Largest Contentful Paint", analogy: "Main content load speed.", unit: "ms", icon: Layout },
        { key: 'FID', title: "First Input Delay", analogy: "Input responsiveness.", unit: "ms", icon: MousePointer2 },
        { key: 'CLS', title: "Cumulative Layout Shift", analogy: "Visual stability.", unit: "", icon: Layout },
        { key: 'INP', title: "Interaction to Next Paint", analogy: "Interaction latency.", unit: "ms", icon: Activity }
      ]
    },
    {
      id: "performance",
      title: "Performance",
      subtitle: "Speed & loading metrics",
      icon: Zap,
      metrics: [
        { key: 'FCP', title: "First Contentful Paint", analogy: "First paint time.", unit: "ms", icon: Zap },
        { key: 'TTFB', title: "Time To First Byte", analogy: "Server latency.", unit: "ms", icon: Server },
        { key: 'TBT', title: "Total Blocking Time", analogy: "Main thread blocking time.", unit: "ms", icon: Clock },
        { key: 'SI', title: "Speed Index", analogy: "Visual population speed.", unit: "ms", icon: Gauge }
      ]
    },
    {
      id: "assets",
      title: "Assets & Server",
      subtitle: "Optimization checks",
      icon: Server,
      metrics: [
        { key: 'Compression', title: "Text Compression", analogy: "Gzip/Brotli compression.", unit: "", icon: FileCode, getValue: (m) => m.meta.value === 100 ? "Enabled" : `${m.meta.value}%` },
        { key: 'Caching', title: "Caching Policy", analogy: "Browser caching settings.", unit: "%", icon: Database, getValue: (m) => `${m.meta.value}%` },
        { key: 'Resource_Optimization', title: "Resource Optimization", analogy: "Image & code minification.", unit: "", icon: ImageIcon, getValue: (m) => m.score >= 80 ? "Optimized" : "Needs Work" },
        { key: 'Render_Blocking', title: "Render-Blocking", analogy: "Critical path blocking.", unit: "", icon: AlertTriangle, getValue: (m) => m.meta.value === 0 ? "None" : `${m.meta.value} items` },
        { key: 'HTTP', title: "HTTPS / HTTP2", analogy: "Secure transport protocols.", unit: "", icon: Shield, getValue: (m) => m.score === 100 ? "Secure" : "Insecure" }
      ]
    },
    {
      id: "seo",
      title: "SEO & Crawlability",
      subtitle: "Search engine visibility",
      icon: Search,
      metrics: [
        { key: 'Sitemap', title: "Sitemap", analogy: "XML Sitemap presence.", unit: "", icon: Map, getValue: (m) => m.meta.exists ? "Found" : "Missing" },
        { key: 'Robots', title: "Robots.txt", analogy: "Crawling instructions.", unit: "", icon: FileText, getValue: (m) => m.meta.exists ? "Found" : "Missing" },
        { key: 'Structured_Data', title: "Structured Data", analogy: "Schema markup.", unit: "", icon: FileCode, getValue: (m) => m.meta.hasStructuredData ? "Found" : "Missing" },
        { key: 'Broken_Links', title: "Broken Links", analogy: "Dead internal links.", unit: "%", icon: Link, getValue: (m) => m.meta.brokenPercent },
        { key: 'Redirect_Chains', title: "Redirect Chains", analogy: "Multiple redirects.", unit: " hops", icon: ArrowRightLeft, getValue: (m) => m.meta.value }
      ]
    }
  ];

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 ${darkMode ? "bg-[#050505] text-slate-100" : "bg-gray-50 text-gray-900"}`}>

      {/* 🟢 Sticky Header / Navigation */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all ${darkMode ? "bg-[#050505]/80 border-white/5" : "bg-white/80 border-gray-200"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${darkMode ? "bg-indigo-500/20" : "bg-indigo-50"}`}>
              <Activity className="text-indigo-500" size={20} />
            </div>
            <span className="font-bold text-lg tracking-tight">TechAudit<span className="text-indigo-500">.</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full border border-white/5 bg-white/5">
            {sections.map(section => {
              if (section.isCrux && !metric.Technical_Performance.Real_User_Experience) return null;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300
                    ${activeSection === section.id
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                      : (darkMode ? "text-slate-400 hover:text-white" : "text-gray-500 hover:text-gray-900")}
                  `}
                >
                  {section.title}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className={`text-sm font-bold px-3 py-1 rounded-full border ${overallScore >= 90
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
              : overallScore >= 50
                ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                : "border-rose-500/20 bg-rose-500/10 text-rose-500"
              }`}>
              Score: {overallScore}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🟢 Hero Section */}
      <div className={`relative overflow-hidden border-b ${darkMode ? "bg-[#050505] border-white/5" : "bg-white border-gray-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8 border bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <Globe size={12} />
                {data.Device} Performance Report
              </div>
              <h1 className={`text-6xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1] ${darkMode ? "text-white" : "text-gray-900"}`}>
                Technical <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">
                  Health Check
                </span>
              </h1>
              <p className={`text-xl leading-relaxed max-w-xl ${darkMode ? "text-slate-400" : "text-gray-600"}`}>
                Comprehensive analysis of <span className={`font-semibold ${darkMode ? "text-slate-200" : "text-gray-900"}`}>{new URL(data.Site).hostname}</span>.
                We've analyzed speed, stability, and SEO factors to provide actionable insights.
              </p>
            </motion.div>

            {/* Score Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
              className={`relative p-10 rounded-[2.5rem] border flex flex-col items-center justify-center gap-6 shadow-2xl backdrop-blur-xl
                ${darkMode ? "bg-white/5 border-white/10 shadow-indigo-500/10" : "bg-white border-gray-100 shadow-xl"}
              `}
            >
              <CircularProgress value={overallScore} size={160} stroke={12} />
              <div className="text-center">
                <div className={`text-4xl font-black ${overallScore >= 90 ? "text-emerald-500" : overallScore >= 50 ? "text-amber-500" : "text-rose-500"}`}>
                  {overallScore}/100
                </div>
                <div className={`text-xs font-bold uppercase tracking-widest mt-2 ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
                  Overall Score
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[1000px] h-[1000px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      </div>

      {/* 🟢 Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-24 flex flex-col gap-32">

        {sections.map((section) => {
          if (section.isCrux && !metric.Technical_Performance.Real_User_Experience) return null;

          return (
            <section key={section.id} id={section.id} className="scroll-mt-32">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-6 border-b border-dashed dark:border-white/10 border-gray-200">
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl shadow-lg ${darkMode ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 ring-1 ring-white/10" : "bg-indigo-50 text-indigo-600"}`}>
                    <section.icon size={32} />
                  </div>
                  <div>
                    <h2 className={`text-4xl font-bold tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>{section.title}</h2>
                    <p className={`text-lg mt-1 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>{section.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1000">
                {section.metrics.map((m) => {
                  const dataSource = section.isCrux
                    ? metric.Technical_Performance.Real_User_Experience
                    : metric.Technical_Performance;

                  const dynamicData = dataSource[m.key];

                  let displayValue = dynamicData?.meta?.value;
                  if (m.getValue) {
                    displayValue = m.getValue(dynamicData);
                  } else if (section.isCrux) {
                    displayValue = dynamicData?.value;
                  }

                  return (
                    <MetricCard
                      key={m.key}
                      details={{ ...m, isCrux: section.isCrux }}
                      dynamicData={dynamicData}
                      value={displayValue}
                      darkMode={darkMode}
                      icon={m.icon}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}

      </main>
    </div>
  );
}