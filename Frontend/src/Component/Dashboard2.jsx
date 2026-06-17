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
import { useAuth } from "../context/AuthContext";

// Presentational component wrapped in React.memo
const Dashboard2_Inner = React.memo(function Dashboard2_Inner({ data, loading, clearData, darkMode, isAuthenticated }) {
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
  const isLoadingView = loading || !isAuditComplete;

  // Current audit PHASE (no timer). Driven by the backend's raw status (data.rawStatus);
  // the overall status is normalized elsewhere to pending/success/failed. Each phase
  // maps to a checkpoint % and a plain-language title + description shown while loading.
  const stageInfo = useMemo(() => {
    // Browser/crawl phases only cover the first ~45% of the bar. The remaining 55% is
    // driven by SECTIONS completing (they run concurrently and finish at different
    // times) — so the bar keeps moving through the analysis instead of jumping to ~90%
    // and stalling while every section finishes.
    const phases = {
      launching: { base: 8, title: "Launching browser", desc: "Spinning up a secure headless browser to load your website." },
      navigating: { base: 18, title: "Opening your website", desc: "Navigating to the target URL." },
      waiting_for_render: { base: 30, title: "Rendering the page", desc: "Waiting for the page and its dynamic content to fully load." },
      screenshot_ready: { base: 40, title: "Capturing the page", desc: "Page loaded — capturing a snapshot and crawling the content." },
      extracting_data: { base: 45, title: "Analyzing your site", desc: "Extracting page data and scoring the report sections." },
    };
    if (data?.status === "failed") {
      return { progress: 100, title: "Audit failed", desc: data?.error || "Something went wrong while auditing this site." };
    }
    const total = sectionMappings.length;
    const phase = phases[data?.rawStatus];
    // Once any section reports, the bar tracks section completion across 45% → 100%.
    if (completedSections > 0) {
      return {
        progress: Math.min(99, 45 + Math.round((completedSections / total) * 55)),
        title: "Analyzing your site",
        desc: "Scoring SEO, performance, accessibility, security and more.",
      };
    }
    if (phase) return { progress: phase.base, title: phase.title, desc: phase.desc };
    return { progress: 8, title: "Auditing your site", desc: "Running checks across all report sections." };
  }, [data?.rawStatus, data?.status, data?.error, completedSections, sectionMappings.length]);

  // Rotating "did you know" quotes to keep the user engaged while they wait.
  const loadingQuotes = useMemo(() => [
    "53% of mobile visitors leave a page that takes longer than 3 seconds to load.",
    "Nearly 95% of car buyers research online before stepping into a dealership.",
    "75% of users judge a business's credibility on its website design alone.",
    "Most shoppers never scroll past page one of Google — local visibility is everything.",
    "A one-second delay in load time can cut conversions by around 7%.",
    "Clear calls-to-action and visible trust signals turn more visitors into leads.",
  ], []);
  const [quoteIndex, setQuoteIndex] = React.useState(0);
  React.useEffect(() => {
    if (!isLoadingView) return;
    const t = setInterval(() => setQuoteIndex((p) => (p + 1) % loadingQuotes.length), 5000);
    return () => clearInterval(t);
  }, [isLoadingView, loadingQuotes.length]);

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
  const bgClass = darkMode ? "bg-[#0B1120] text-slate-300" : "bg-surface text-muted";
  const cardClass = darkMode
    ? "bg-slate-900 border border-slate-800 shadow-xl shadow-black/20"
    : "bg-card border border-line shadow-xl shadow-slate-200/50";

  // Define grade colors
  const gradeColor = (grade) => {
    if (["A+", "A", "B"].includes(grade)) return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20";
    if (["C", "D"].includes(grade)) return "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20";
    return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20";
  };

  // Plain-language summary of what the overall score means for the business.
  const healthSummary = (score) => {
    const s = Number(score) || 0;

    // Score-band intro (plain language, business-focused).
    let intro;
    if (s >= 90) intro = "Your website is in excellent shape — fast, easy to use, and well set up to win leads and rank in search.";
    else if (s >= 75) intro = "Your website is performing well, with a few areas to tidy up to capture more leads, bookings, and search visibility.";
    else if (s >= 50) intro = "Your website works, but it's leaving leads and search traffic on the table.";
    else intro = "Your website has issues that are likely costing you leads, customers, and search ranking.";

    // Lowest-scoring sections (below 75) = the priorities to work on first.
    const weak = sectionMappings
      .map((sec) => ({ name: sec.name, value: data?.[sec.key]?.Percentage }))
      .filter((sec) => typeof sec.value === "number" && sec.value < 75)
      .sort((a, b) => a.value - b.value);
    const top = weak.slice(0, 3).map((w) => `${w.name} (${Math.round(w.value)}%)`);

    let focus;
    if (top.length === 0) {
      focus = " No major problem areas — focus on maintenance and fine-tuning.";
    } else {
      const joined =
        top.length === 1 ? top[0]
          : top.length === 2 ? `${top[0]} and ${top[1]}`
            : `${top[0]}, ${top[1]}, and ${top[2]}`;
      const extra = weak.length > 3 ? `, plus ${weak.length - 3} more` : "";
      const label = top.length === 1 ? "Top priority" : `Top ${top.length} priorities`;
      focus = ` ${label} to work on: ${joined}${extra}.`;
    }

    return intro + focus;
  };

  return (
    <div id="dashboard" className={`w-full font-sans transition-colors duration-300 ${bgClass}`}>

      <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ✅ Card 1: URL Header Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${cardClass}`}>
          <UrlHeader data={data} darkMode={darkMode} hideBorder={true} />
        </div>

        {/* ✅ Card 2: Overview / Preview Card — visible to everyone (guests included) */}
        {true && (
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${cardClass}`}>
            <div className="flex flex-col xl:flex-row min-h-[300px]">

              {/* Left Panel: Live Preview (Widened) */}
              <div className={`w-full xl:w-1/2 border-b xl:border-b-0 xl:border-r p-6 flex items-center justify-center relative overflow-hidden ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-cardsoft border-line"}`}>
                {/* Decorative Background Blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>

                <div className="w-full relative z-10 px-2 lg:px-6">
                  <LivePreview data={data} loading={loading} variant="plain" />
                </div>
              </div>

              {/* Right Panel: Metrics & Score — visible to everyone */}
              {true && (
                <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center">

                  {(loading || !isAuditComplete) ? (
                    /* Loading State: Dynamic status & countdown */
                    <div className="flex flex-col justify-center h-full min-h-[300px] animate-in fade-in duration-500">
                      <div className="w-full max-w-lg mx-auto space-y-6">

                        {/* Progress Bar */}
                        <div className="w-full space-y-2">
                          <div className="flex justify-end text-sm font-bold tracking-wide opacity-80">
                            <span>{stageInfo.progress}%</span>
                          </div>
                          <div className="h-2 w-full bg-line dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 transition-all duration-700 ease-out"
                              style={{ width: `${stageInfo.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Current audit phase / status — shown until the report is ready */}
                        <div className="relative overflow-hidden rounded-2xl border bg-cardsoft dark:bg-slate-800/30 border-line dark:border-slate-700/50 p-10 text-center transition-all duration-500 flex flex-col items-center">
                          <div className="relative mb-6">
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative w-20 h-20 bg-card dark:bg-slate-800 rounded-full shadow-lg border border-line dark:border-slate-700 flex items-center justify-center text-emerald-500">
                              <Loader2 className="w-9 h-9 animate-spin" />
                            </div>
                          </div>
                          <div key={stageInfo.title} className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-2 max-w-md">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500">Current Step</span>
                            <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-ink"}`}>{stageInfo.title}</h3>
                            <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>{stageInfo.desc}</p>
                          </div>
                        </div>

                        {/* Rotating quote to pass the time */}
                        <p
                          key={quoteIndex}
                          className={`text-center text-sm italic leading-relaxed animate-in fade-in duration-700 ${darkMode ? "text-slate-400" : "text-muted"}`}
                        >
                          “{loadingQuotes[quoteIndex]}”
                        </p>

                      </div>
                    </div>
                  ) : (
                    /* Real Data */
                    <div className="space-y-7 animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto w-full">

                      {/* Overall Score Section - Refined */}
                      <div className="flex flex-col sm:flex-row items-center gap-8 justify-center xl:justify-start">
                        <div className="relative flex-shrink-0 group cursor-default">
                          {/* Subtle Glow Effect */}
                          <div className={`absolute -inset-4 rounded-full blur-3xl opacity-10 transition-opacity duration-700 group-hover:opacity-20 ${data.grade && ["A+", "A", "B"].includes(data.grade) ? "bg-emerald-500" : "bg-amber-500"}`}></div>

                          <CircularProgress value={data.score?.toFixed(0) || 0} size={160} stroke={14} />
                          <div className="absolute inset-0 flex items-center justify-center flex-col gap-1">
                            <span className={`text-3xl font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>{data.score?.toFixed(0)}%</span>
                            <span className={`text-xs font-semibold uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-faint"}`}>SCORE</span>
                          </div>
                        </div>

                        <div className="text-center sm:text-left space-y-4 max-w-lg">
                          <div>
                            <h3 className={`text-3xl font-semibold tracking-tight mb-3 ${darkMode ? "text-white" : "text-ink"}`}>Overall Health Score</h3>
                            <p className={`text-sm md:text-base leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                              {healthSummary(data.score)}
                            </p>
                          </div>

                          <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-sm font-semibold border shadow-sm ${gradeColor(data.grade)}`}>
                            {["A+", "A", "B"].includes(data.grade) ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            Grade {data.grade || "-"}
                          </div>
                        </div>
                      </div>

                      <div className={`w-full h-px ${darkMode ? "bg-slate-800/60" : "bg-line"}`}></div>

                      {/* AIO Readiness Card - Production Polished */}
                      <div
                        onClick={() => navigate(data?._id ? `/aio/${data._id}` : '/aio')}
                        className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${darkMode ? "bg-slate-800/20 border-slate-700/50 hover:bg-slate-800/40 hover:border-slate-600" : "bg-card border-line hover:border-slate-300 hover:shadow-md"}`}
                      >
                        {/* Hover Gradient Line */}
                        <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-300 ${data.aioCompatibilityBadge === "High" ? "bg-emerald-500" : "bg-amber-500"}`}></div>

                        <div className="p-5 flex items-center justify-between pl-7">
                          <div className="flex items-center gap-5">
                            <div className={`p-3.5 rounded-full ${data.aioCompatibilityBadge === "High" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                              <Bot className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className={`font-semibold text-base mb-1 ${darkMode ? "text-white" : "text-ink"}`}>AIO & GEO Readiness</h4>
                              <p className={`text-sm ${darkMode ? "text-slate-400" : "text-muted"}`}>
                                {data.aioCompatibilityBadge === "High"
                                  ? "Content is structure-optimized for AI engines (ChatGPT, Gemini) coverage."
                                  : "Optimization required for better visibility in Generative AI results."}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`text-lg font-semibold ${data.aioCompatibilityBadge === "High" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                              {data.aioCompatibilityBadge || "N/A"}
                            </span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${darkMode ? "bg-slate-800 group-hover:bg-slate-700" : "bg-surface-2 group-hover:bg-slate-200"}`}>
                              <ArrowRight className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${darkMode ? "text-slate-400" : "text-muted"}`} />
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Guest lock removed — reports are open to everyone, so guests see the
            same full Overview + Category grid as authenticated users. */}


        {/* ✅ Detailed Metrics Grid & Charts — visible to everyone once loaded */}
        {!loading && isAuditComplete && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Category Breakdown - Production Ready */}
            <div className={`p-8 rounded-3xl border ${cardClass}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-ink"}`}>Category Performance</h3>
                  <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Detailed analysis across key audit verticals</p>
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
                      className={`group relative p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center text-center ${darkMode ? "bg-slate-800/30 border-slate-700 hover:bg-slate-800" : "bg-card border-linesoft hover:border-slate-200"}`}
                    >
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                        <ArrowRight className={`w-5 h-5 ${darkMode ? "text-slate-400" : "text-faint"}`} />
                      </div>

                      <div className="mb-6 mt-2 relative">
                        {/* Glowing Background for Score */}
                        <div className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${score >= 90 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"}`}></div>
                        <CircularProgress value={score} size={110} stroke={8} color={ringColor} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-2xl font-black ${darkMode ? "text-white" : "text-ink"}`}>
                            {score}%
                          </span>
                        </div>
                      </div>

                      <h4 className={`text-base font-semibold mb-1 ${darkMode ? "text-slate-200" : "text-inksoft"}`}>
                        {item.name}
                      </h4>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${statusColor}`}>
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
  const authData = useAuth();

  const data = propData !== undefined ? propData : contextData.data;
  const loading = propLoading !== undefined ? propLoading : contextData.loading;
  const clearData = propClearData !== undefined ? propClearData : contextData.clearData;
  const isAuthenticated = authData?.isAuthenticated;

  return <Dashboard2_Inner data={data} loading={loading} clearData={clearData} darkMode={darkMode} isAuthenticated={isAuthenticated} />;
}