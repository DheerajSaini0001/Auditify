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

// Presentational component wrapped in React.memo
const Dashboard2_Inner = React.memo(function Dashboard2_Inner({ data, loading, clearData, darkMode }) {
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
      icon: <Server className="w-8 h-8 text-blue-500" />,
      title: "Technical Performance",
      text: "Analyzing server response time, identifying render-blocking resources, and measuring load speeds..."
    },
    {
      icon: <Search className="w-8 h-8 text-purple-500" />,
      title: "On-Page SEO",
      text: "Crawling meta tags, heading structure, keyword density, and checking for broken links..."
    },
    {
      icon: <Eye className="w-8 h-8 text-teal-500" />,
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
      icon: <Bot className="w-8 h-8 text-emerald-500" />,
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

  const [countdown, setCountdown] = React.useState(20);

  React.useEffect(() => {
    if (data?.status === "waiting_for_render") {
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCountdown(20);
    }
  }, [data?.status]);

  const stageInfo = useMemo(() => {
    let progress = 0;
    let message = "Initializing...";
    
    switch (data?.status) {
      case "launching":
        progress = 15;
        message = "🚀 Launching browser...";
        break;
      case "navigating":
        progress = 35;
        message = "⏳ Navigating to target URL...";
        break;
      case "waiting_for_render":
        progress = 55;
        message = "⏳ Waiting for website to fully load... (~20s)";
        break;
      case "screenshot_ready":
        progress = 75;
        message = "✅ Website loaded successfully — crawling this page";
        break;
      case "extracting_data":
        progress = 90;
        message = "🧠 Extracting audit data...";
        break;
      case "completed":
        progress = 100;
        message = "✅ Audit completed successfully!";
        break;
      case "failed":
        progress = 100;
        message = data?.error || "❌ Audit failed";
        break;
      default:
        progress = Math.round((completedSections / 7) * 100) || 10;
        message = "⏳ Auditing in progress...";
    }
    return { progress, message };
  }, [data?.status, data?.error, completedSections]);

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

  // Styles
  const bgClass = darkMode ? "bg-[#0B1120] text-slate-300" : "bg-slate-50 text-slate-600";
  const cardClass = darkMode
    ? "bg-slate-900 border border-slate-800 shadow-xl shadow-black/20"
    : "bg-white border border-slate-200 shadow-xl shadow-slate-200/50";

  // Define grade colors
  const gradeColor = (grade) => {
    if (["A+", "A", "B"].includes(grade)) return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20";
    if (["C", "D"].includes(grade)) return "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20";
    return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20";
  };

  return (
    <div id="dashboard" className={`w-full font-sans transition-colors duration-300 ${bgClass}`}>

      <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ✅ Card 1: URL Header Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${cardClass}`}>
          <UrlHeader data={data} darkMode={darkMode} hideBorder={true} />
        </div>

        {/* ✅ Card 2: Overview / Preview Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${cardClass}`}>
          <div className="flex flex-col xl:flex-row min-h-[300px]">

            {/* Left Panel: Live Preview (Widened) */}
            <div className={`w-full xl:w-1/2 p-6 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
              {/* Decorative Background Blob */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>

              <div className="w-full relative z-10 px-2 lg:px-6">
                <LivePreview data={data} loading={loading} variant="plain" />
              </div>
            </div>

            {/* Right Panel: Metrics & Score */}
            <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center">

              {(loading || !isAuditComplete) ? (
                /* Loading State: Dynamic status & countdown */
                <div className="flex flex-col justify-center h-full min-h-[300px] animate-in fade-in duration-500">
                  <div className="w-full max-w-lg mx-auto space-y-8">

                    {/* Progress Bar */}
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-70">
                        <span className="text-emerald-500 font-extrabold">{stageInfo.message}</span>
                        <span>{stageInfo.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 transition-all duration-700 ease-out"
                          style={{ width: `${stageInfo.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Custom Loading Card based on State */}
                    {data?.status === "waiting_for_render" ? (
                      /* Countdown Stage */
                      <div className="relative overflow-hidden rounded-2xl border bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 p-8 text-center transition-all duration-500 flex flex-col items-center">
                        <div className="mb-6 relative">
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                          <div className="relative w-20 h-20 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                            <span className="text-3xl font-black text-emerald-500 animate-pulse">{countdown}s</span>
                          </div>
                        </div>
                        <div className="space-y-3 max-w-md">
                          <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                            Dynamic Page Rendering
                          </h3>
                          <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            Waiting for single-page applications, dynamic javascript elements, and client-rendered visual modules to fully materialize in headless browser.
                          </p>
                        </div>
                      </div>
                    ) : (data?.status === "screenshot_ready" || data?.status === "extracting_data") ? (
                      /* Screenshot Ready Banner / Verified Stage */
                      <div className="relative overflow-hidden rounded-2xl border bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 p-8 text-center transition-all duration-500 flex flex-col items-center">
                        <div className="mb-6 relative">
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                          <div className="relative w-20 h-20 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center text-emerald-500 animate-pulse">
                            <CheckCircle2 className="w-10 h-10" strokeWidth={2.5} />
                          </div>
                        </div>
                        <div className="space-y-4 max-w-md">
                          <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            Visual Scan Verified
                          </h3>
                          <div className="p-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-xl font-semibold text-sm border border-emerald-500/20 shadow-sm animate-pulse">
                            ✅ Website loaded successfully — crawling this page
                          </div>
                          <p className={`text-xs md:text-sm leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            The live rendering matches the expected viewport layout. Data parsing and optimization auditing are executing in background.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Default Carousel Stage */
                      <div className="relative overflow-hidden rounded-2xl border bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 p-8 text-center transition-all duration-500 flex flex-col items-center">
                        
                        {/* Animated Icon Ring */}
                        <div className="mb-6 relative">
                          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                          <div className="relative p-5 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 transition-all duration-300 transform">
                            {auditSteps[currentStepIndex]?.icon || <Loader2 className="w-8 h-8 animate-spin text-blue-500" />}
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
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStepIndex ? "w-8 bg-blue-500" : "w-1.5 bg-slate-300 dark:bg-slate-700"}`} />
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ) : (
                /* Real Data */
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto w-full">

                  {/* Overall Score Section - Refined */}
                  <div className="flex flex-col sm:flex-row items-center gap-12 justify-center xl:justify-start">
                    <div className="relative flex-shrink-0 group cursor-default">
                      {/* Subtle Glow Effect */}
                      <div className={`absolute -inset-4 rounded-full blur-3xl opacity-10 transition-opacity duration-700 group-hover:opacity-20 ${data.grade && ["A+", "A", "B"].includes(data.grade) ? "bg-emerald-500" : "bg-amber-500"}`}></div>

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
                    onClick={() => navigate(data?._id ? `/aio/${data._id}` : '/aio')}
                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${darkMode ? "bg-slate-800/20 border-slate-700/50 hover:bg-slate-800/40 hover:border-slate-600" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"}`}
                  >
                    {/* Hover Gradient Line */}
                    <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-300 ${data.aioCompatibilityBadge === "High" ? "bg-emerald-500" : "bg-amber-500"}`}></div>

                    <div className="p-5 flex items-center justify-between pl-7">
                      <div className="flex items-center gap-5">
                        <div className={`p-3.5 rounded-full ${data.aioCompatibilityBadge === "High" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
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
                        <span className={`text-lg font-bold ${data.aioCompatibilityBadge === "High" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
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
                    statusColor = "text-emerald-500";
                    statusText = "Excellent";
                    ringColor = "#10b981";
                  } else if (score >= 50) {
                    statusColor = "text-amber-500";
                    statusText = "Needs Work";
                    ringColor = "#f59e0b";
                  }

                  return (
                    <button
                      key={item.name}
                      onClick={() => navigate(data?._id ? `/${item.Link}/${data._id}` : `/${item.Link}`)}
                      className={`group relative p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center text-center ${darkMode ? "bg-slate-800/30 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:border-slate-200"}`}
                    >
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                        <ArrowRight className={`w-5 h-5 ${darkMode ? "text-slate-400" : "text-slate-400"}`} />
                      </div>

                      <div className="mb-6 mt-2 relative">
                        {/* Glowing Background for Score */}
                        <div className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${score >= 90 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"}`}></div>
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
});

export default function Dashboard2({ data: propData, loading: propLoading, clearData: propClearData, darkMode }) {
  const contextData = useData();

  const data = propData !== undefined ? propData : contextData.data;
  const loading = propLoading !== undefined ? propLoading : contextData.loading;
  const clearData = propClearData !== undefined ? propClearData : contextData.clearData;

  return <Dashboard2_Inner data={data} loading={loading} clearData={clearData} darkMode={darkMode} />;
}