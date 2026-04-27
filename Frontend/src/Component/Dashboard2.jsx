import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine
} from "recharts";
import { ArrowRight, Loader2, Bot, CheckCircle2, AlertCircle, Server, Search, Eye, ShieldCheck, LayoutTemplate, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CircularProgress from "./CircularProgress";
import LivePreview from "./LivePreview";
import UrlHeader from "./UrlHeader";
import { useData } from "../context/DataContext";

// ✅ Custom Shimmer (Modernized)
// ✅ Custom Shimmer (Modernized) - Removed as we are replacing it with rotating content
// const ShimmerBlock = ... 

export default function Dashboard2({ darkMode }) {
  const { data, loading, clearData } = useData();
  const navigate = useNavigate();

  const sectionMappings = useMemo(() => [
    { key: "technicalPerformance", name: "Technical Performance", link: "technical-performance" },
    { key: "onPageSEO", name: "On-Page SEO", link: "on-page-seo" },
    { key: "accessibility", name: "Accessibility", link: "accessibility" },
    { key: "securityOrCompliance", name: "Security/Compliance", link: "security-compliance" },
    { key: "UXOrContentStructure", name: "UX & Content", link: "ux-content-structure" },
    { key: "conversionAndLeadFlow", name: "Conversion & Lead Flow", link: "conversion-lead-flow" },
    { key: "aioReadiness", name: "AIO Readiness", link: "aio" },
  ], []);

  // Rotating Audit Steps (Process for all 7 Metrics)

  const auditSteps = useMemo(() => [
    {
      icon: <Server className="w-8 h-8 text-violet-500" />,
      title: "Technical Performance",
      text: "Analyzing server response time, identifying render-blocking resources, and measuring load speeds..."
    },
    {
      icon: <Search className="w-8 h-8 text-purple-500" />,
      title: "On-Page SEO",
      text: "Crawling meta tags, heading structure, keyword density, and checking for broken links..."
    },
    {
      icon: <Eye className="w-8 h-8 text-purple-500" />,
      title: "Accessibility Check",
      text: "Verifying ARIA labels, contrast ratios, and keyboard navigation support for all users..."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-red-500" />,
      title: "Security & Compliance",
      text: "Inspecting SSL certificates, HTTPS protocols, and scanning for vulnerability exposure..."
    },
    {
      icon: <LayoutTemplate className="w-8 h-8 text-indigo-500" />,
      title: "UX & Content Structure",
      text: "Evaluating visual hierarchy, mobile responsiveness, and content readability..."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-amber-500" />,
      title: "Conversion & Lead Flow",
      text: "Analyzing call-to-action placement, form accessibility, and user journey friction..."
    },
    {
      icon: <Bot className="w-8 h-8 text-violet-500" />,
      title: "AIO Intelligence",
      text: "Simulating AI Search bots to ensure your content is optimized for ChatGPT and Gemini..."
    },
  ], []);

  // Calculate completed sections based on real data
  const completedSections = useMemo(() => {
    if (!data) return 0;
    // Count how many keys from sectionMappings exist in data AND have a valid Percentage calculated
    return sectionMappings.filter(section =>
      data[section.key] &&
      data[section.key].Percentage !== undefined &&
      data[section.key].Percentage !== null
    ).length;
  }, [data, sectionMappings]);

  const isAuditComplete = completedSections === sectionMappings.length;

  // Rotating Audit Steps (Timer-based for visual engagement)
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);

  React.useEffect(() => {
    // Check if audit is finished
    if (completedSections === sectionMappings.length) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % auditSteps.length);
    }, 2000); // Rotate card every 2 seconds

    return () => clearInterval(interval);
  }, [completedSections, sectionMappings.length, auditSteps.length]);

  const barData = useMemo(() => sectionMappings.map((section) => ({
    name: section.name,
    value: data?.[section.key]?.Percentage || 0,
    Link: section.link,
  })), [data, sectionMappings]);

  const handleCheckOther = () => {
    clearData();
    navigate("/", { replace: true });
  };

  // Styles
  const bgClass = darkMode ? "bg-[#020617] text-slate-300" : "bg-slate-50 text-slate-600";
  const cardClass = darkMode
    ? "bg-slate-900 border border-slate-800 shadow-xl shadow-black/20"
    : "bg-white border border-slate-200 shadow-xl shadow-slate-200/50";

  // Define grade colors
  const gradeColor = (grade) => {
    if (["A+", "A", "B"].includes(grade)) return "text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-500/10 dark:border-violet-500/20";
    if (["C", "D"].includes(grade)) return "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20";
    return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20";
  };

  return (
    <div id="dashboard" className={`w-full font-sans transition-colors duration-300 ${bgClass}`}>

      <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        {/* ✅ Unified Master Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${cardClass}`}>

          {/* 1. Enhanced Glass Header */}
          <UrlHeader data={data} darkMode={darkMode} />

          {/* 2. Card Body */}
          <div className="flex flex-col xl:flex-row min-h-[300px]">

            {/* Left Panel: Live Preview (Widened) */}
            <div className={`w-full xl:w-1/2 p-6 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
              {/* Decorative Background Blob */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-violet-500/5 blur-3xl rounded-full pointer-events-none"></div>

              <div className="w-full relative z-10 px-2 lg:px-6">
                <LivePreview data={data} loading={loading} variant="plain" />
              </div>
            </div>

            {/* Right Panel: Metrics & Score */}
            <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center">

              {(loading || !isAuditComplete) ? (
                /* Loading State: Rotating Content */
                <div className="flex flex-col justify-center h-full min-h-[300px] animate-in fade-in duration-500">
                  <div className="w-full max-w-lg mx-auto space-y-8">

                    {/* Progress Bar */}
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-50">
                        <span>Analyzing...</span>
                        <span>{Math.round((completedSections / 7) * 100)}% Complete</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 transition-all duration-700 ease-out"
                          style={{ width: `${(completedSections / 7) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Audit Progress Card (Carousel) */}
                    <div className="relative overflow-hidden rounded-2xl border bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 p-8 text-center transition-all duration-500 flex flex-col items-center">

                      {/* Animated Icon Ring */}
                      <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative p-5 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 transition-all duration-300 transform">
                          {auditSteps[currentStepIndex]?.icon || <Loader2 className="w-8 h-8 animate-spin text-violet-500" />}
                        </div>
                      </div>

                      <div key={currentStepIndex} className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-3 max-w-md">
                        <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                          {auditSteps[currentStepIndex]?.title}
                        </h3>
                        <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {auditSteps[currentStepIndex]?.text}
                        </p>
                      </div>

                      {/* Step Indicators */}
                      <div className="flex justify-center gap-2 mt-8">
                        {auditSteps.map((_, i) => (
                          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStepIndex ? "w-8 bg-violet-500" : "w-1.5 bg-slate-300 dark:bg-slate-700"}`} />
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                /* Real Data */
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto w-full">

                  {/* Overall Score Section - Refined */}
                  <div className="flex flex-col sm:flex-row items-center gap-12 justify-center xl:justify-start">
                    <div className="relative flex-shrink-0 group cursor-default">
                      {/* Subtle Glow Effect */}
                      <div className={`absolute -inset-4 rounded-full blur-3xl opacity-10 transition-opacity duration-700 group-hover:opacity-20 ${data.grade && ["A+", "A", "B"].includes(data.grade) ? "bg-violet-500" : "bg-amber-500"}`}></div>

                      <CircularProgress value={data.score?.toFixed(0) || 0} size={160} stroke={14} />
                      <div className="absolute inset-0 flex items-center justify-center flex-col gap-1">
                        <span className={`text-3xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{data.score?.toFixed(0)}%</span>
                        <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-slate-400"}`}>SCORE</span>
                      </div>
                    </div>

                    <div className="text-center sm:text-left space-y-4 max-w-lg">
                      <div>
                        <h3 className={`text-3xl font-bold tracking-tight mb-3 ${darkMode ? "text-white" : "text-slate-900"}`}>Overall Health Score</h3>
                        <p className={`text-sm md:text-base leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Aggregated score reflecting Core Web Vitals, SEO, and technical performance benchmarks.
                        </p>
                      </div>

                      <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-sm font-bold border shadow-sm ${gradeColor(data.grade)}`}>
                        {["A+", "A", "B"].includes(data.grade) ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        Grade {data.grade || "-"}
                      </div>
                    </div>
                  </div>

                  <div className={`w-full h-px ${darkMode ? "bg-slate-800/60" : "bg-slate-100"}`}></div>

                  {/* AIO Readiness Card - Production Polished */}
                  <div
                    onClick={() => navigate('/aio')}
                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${darkMode ? "bg-slate-800/20 border-slate-700/50 hover:bg-slate-800/40 hover:border-slate-600" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"}`}
                  >
                    {/* Hover Gradient Line */}
                    <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-300 ${data.aioCompatibilityBadge === "High" ? "bg-violet-500" : "bg-amber-500"}`}></div>

                    <div className="p-5 flex items-center justify-between pl-7">
                      <div className="flex items-center gap-5">
                        <div className={`p-3.5 rounded-full ${data.aioCompatibilityBadge === "High" ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                          <Bot className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className={`font-bold text-base mb-1 ${darkMode ? "text-white" : "text-slate-900"}`}>AIO & GEO Readiness</h4>
                          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            {data.aioCompatibilityBadge === "High"
                              ? "Content is structure-optimized for AI engines (ChatGPT, Gemini) coverage."
                              : "Optimization required for better visibility in Generative AI results."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${data.aioCompatibilityBadge === "High" ? "text-violet-600 dark:text-violet-400" : "text-amber-600 dark:text-amber-400"}`}>
                          {data.aioCompatibilityBadge || "N/A"}
                        </span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${darkMode ? "bg-slate-800 group-hover:bg-slate-700" : "bg-slate-100 group-hover:bg-slate-200"}`}>
                          <ArrowRight className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>


        {/* ✅ Detailed Metrics Grid & Charts (Only when loaded) */}
        {!loading && isAuditComplete && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Category Breakdown - Production Ready */}
            <div className={`p-8 rounded-3xl border ${cardClass}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>Category Performance</h3>
                  <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Detailed analysis across key audit verticals</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {barData.map((item, index) => {
                  /* Determine Color & Status */
                  const score = item.value || 0;
                  let statusColor = "text-red-500";
                  let statusText = "Action Needed";
                  let ringColor = "#ef4444"; // red-500

                  if (score >= 90) {
                    statusColor = "text-violet-500";
                    statusText = "Excellent";
                    ringColor = "#8b5cf6";
                  } else if (score >= 50) {
                    statusColor = "text-amber-500";
                    statusText = "Needs Work";
                    ringColor = "#f59e0b";
                  }

                  return (
                    <button
                      key={item.name}
                      onClick={() => navigate(`/${item.Link}`)}
                      className={`group relative p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center text-center ${darkMode ? "bg-slate-800/30 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:border-slate-200"}`}
                    >
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                        <ArrowRight className={`w-5 h-5 ${darkMode ? "text-slate-400" : "text-slate-400"}`} />
                      </div>

                      <div className="mb-6 mt-2 relative">
                        {/* Glowing Background for Score */}
                        <div className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${score >= 90 ? "bg-violet-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"}`}></div>
                        <CircularProgress value={score} size={110} stroke={8} color={ringColor} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                            {score}%
                          </span>
                        </div>
                      </div>

                      <h4 className={`text-base font-bold mb-1 ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                        {item.name}
                      </h4>
                      <span className={`text-xs font-bold uppercase tracking-wider ${statusColor}`}>
                        {statusText}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div >
  );
}