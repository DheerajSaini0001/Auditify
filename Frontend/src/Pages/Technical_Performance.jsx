import React, { useContext, useMemo } from "react";
import UrlHeader from "../Component/UrlHeader";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  Activity, Zap, Layout, MousePointer2, Image as ImageIcon,
  Server, Database, FileCode, Globe, Shield, Link, Map,
  FileText, Search, ArrowRightLeft, Clock, Gauge, AlertTriangle,
  CheckCircle, XCircle, Loader2, Info, Eye, ShieldCheck, LayoutTemplate, TrendingUp, Bot, ChevronDown, ChevronUp
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import { InfoDetails } from "../Component/InfoDetails";
import ThresholdBar from "../Component/reusablecomponent/ThresholdBar";
import MetricCard from "../Component/reusablecomponent/MetricCard";
import DirectThresholdBar from "../Component/reusablecomponent/DirectThresholdBar";
import MetricAnalysisDetails from "../Component/reusablecomponent/MetricAnalysisDetails";


const TechShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
  const step = steps[currentStep] || steps[0];

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 animate-in fade-in zoom-in duration-500 min-h-[350px]">
      <div className={`w-full max-w-xl rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-500 ${darkMode ? "bg-slate-800/40 border border-slate-700/50" : "bg-slate-100/60 border border-slate-200/50"
        }`}>

        {/* Icon Container (Circle) */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${darkMode ? "bg-slate-900 shadow-black/40 text-white" : "bg-[#1e293b] shadow-slate-400/30 text-white"
          }`}>
          <div className="animate-pulse">
            {React.cloneElement(step.icon, {
              className: "w-8 h-8",
              strokeWidth: 2.5
            })}
          </div>
        </div>

        {/* Title */}
        <h2 className={`mt-6 text-2xl font-bold tracking-tight transition-all duration-500 ${darkMode ? "text-white" : "text-slate-900"
          }`}>
          {step.title}
        </h2>

        {/* Description (3 lines focused) */}
        <p className={`mt-4 text-base leading-relaxed max-w-sm mx-auto transition-all duration-500 ${darkMode ? "text-slate-400" : "text-slate-500"
          }`}>
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
              className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep
                ? "w-6 bg-blue-500"
                : i < currentStep
                  ? "w-6 bg-blue-500/40"
                  : "w-2 bg-slate-400/30"
                }`}
            />
          ))}
        </div>

      </div>
    </div>
  );
};


// ------------------------------------------------------
// ✅ Score Calculation Info (Standard Weights)
// ------------------------------------------------------
const scoreCalculationInfo = InfoDetails.Technical_Performance_Methodology;

// ------------------------------------------------------
// ✅ Metric Explanations Data
// ------------------------------------------------------
const metricExplanations = InfoDetails;

// ------------------------------------------------------
// ✅ Section Component
// ------------------------------------------------------
const Section = ({ title, subtitle, icon: Icon, children, darkMode, action }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
          <Icon size={20} />
        </div>
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{title}</h2>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{subtitle}</p>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {children}
    </div>
  </div>
);

// ------------------------------------------------------
// ✅ Main Component
// ------------------------------------------------------
export default function Technical_Performance() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const [selectedSource, setSelectedSource] = React.useState("lab"); // "lab" or "field"
  const [expandedDetails, setExpandedDetails] = React.useState({});
  const toggleDetails = (metric) => setExpandedDetails(prev => ({ ...prev, [metric]: !prev[metric] }));
  const darkMode = theme === "dark";

  const auditSteps = useMemo(() => [
    {
      icon: <Server className="w-8 h-8 text-blue-500" />,
      title: "Server & TTFB",
      text: "Analyzing server response times, DNS lookup speeds, and SSL handshake latency..."
    },
    {
      icon: <Activity className="w-8 h-8 text-purple-500" />,
      title: "Core Web Vitals",
      text: "Measuring Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and Interaction to Next Paint (INP)..."
    },
    {
      icon: <Zap className="w-8 h-8 text-teal-500" />,
      title: "Render Blocking Resources",
      text: "Identifying JavaScript and CSS files that block the main thread and delay page rendering..."
    },
    {
      icon: <FileCode className="w-8 h-8 text-red-500" />,
      title: "Code Minification",
      text: "Checking if CSS, JS, and HTML assets are minified and served with Gzip or Brotli compression..."
    },
    {
      icon: <ImageIcon className="w-8 h-8 text-indigo-500" />,
      title: "Image Optimization",
      text: "Scanning for properly sized images, next-gen formats (WebP/AVIF), and effective lazy loading..."
    },
    {
      icon: <Database className="w-8 h-8 text-amber-500" />,
      title: "Browser Caching",
      text: "Verifying efficient cache policies to speed up repeat visits and reduce server load..."
    },
    {
      icon: <Globe className="w-8 h-8 text-emerald-500" />,
      title: "Third-Party Impact",
      text: "Evaluating the performance cost of external analytics, ads, and tracking scripts..."
    },
  ], []);

  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (loading || !data?.technicalPerformance) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % auditSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);

  const metric = data || {};
  const tech = metric.technicalPerformance || {};
  const overallScore = tech?.Percentage || 0;
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  // Helper to safely get metric score for counting passed/failed
  const getMetricScore = (key) => {
    const m = tech[key];
    if (!m) return 0;
    // If it has separate lab/crux structure
    if (m.lab) return m.lab.score || 0;
    // Legacy/Direct structure
    return m.score !== undefined ? m.score : 0;
  };

  // Calculate passed/failed metrics manually
  let passedCount = 0;
  let failedCount = 0;

  if (getMetricScore("LCP") >= 90) passedCount++; else failedCount++;
  if (getMetricScore("FID") >= 90) passedCount++; else failedCount++;
  if (getMetricScore("TBT") >= 90) passedCount++; else failedCount++;
  if (getMetricScore("INP") >= 90) passedCount++; else failedCount++;
  if (getMetricScore("FCP") >= 90) passedCount++; else failedCount++;
  if (getMetricScore("SI") >= 90) passedCount++; else failedCount++;
  if (getMetricScore("TTFB") >= 90) passedCount++; else failedCount++;
  if (getMetricScore("CLS") >= 90) passedCount++; else failedCount++;

  // Assets & Server (5 Parameters)
  if (tech.Compression?.status === "good") passedCount++; else failedCount++;
  if (tech.Caching?.status === "good") passedCount++; else failedCount++;
  if (tech.Render_Blocking?.status === "good") passedCount++; else failedCount++;
  if (tech.HTTP?.status === "good") passedCount++; else failedCount++;
  if (tech.Resource_Optimization?.status === "good") passedCount++; else failedCount++;

  // SEO & Crawlability (4 Parameters)
  if (tech.Sitemap?.status === "good") passedCount++; else failedCount++;
  if (tech.Robots?.status === "good") passedCount++; else failedCount++;
  if (tech.Structured_Data?.status === "good") passedCount++; else failedCount++;
  if (tech.Redirect_Chains?.status === "good") passedCount++; else failedCount++;

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
          {loading || !data?.technicalPerformance ? (
            <div className="flex flex-col xl:flex-row min-h-[300px]">
              {/* Left Panel: Live Preview (Only if not All) */}
              {data?.report !== "All" && (
                <div className={`w-full xl:w-1/2 p-6 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10 px-2 lg:px-6">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              {/* Right/Full Panel: Audit Steps */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full">
                  <TechShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
                </div>
              </div>
            </div>
          ) : (
            <div className={`flex flex-col xl:flex-row ${data?.report === "All" ? "" : "min-h-[300px]"}`}>

              {/* Left Panel: Live Preview (Only if not All) */}
              {data?.report !== "All" && (
                <div className={`w-full xl:w-[45%] ${data?.report === "All" ? "p-6 lg:p-10" : "p-3 lg:p-4"} flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              {/* Right Panel: Metrics & Score */}
              <div className={`flex-1 ${data?.report === "All" ? "px-6 pb-4 pt-2 lg:px-10 lg:pt-2" : "px-6 pb-4 pt-4 lg:px-12 lg:pt-6"} flex flex-col justify-center`}>
                <div className={`w-full ${data?.report === "All" ? "" : "max-w-2xl mx-auto"} ${data?.report === "All" ? "space-y-10" : "space-y-8"}`}>

                  {/* Top Content Area */}
                  <div className={`flex flex-col md:flex-row items-center ${data?.report === "All" ? "gap-10 md:gap-14 justify-between" : "gap-8 md:gap-12 justify-center"}`}>

                    {/* Text Content */}
                    <div className={`flex-1 ${data?.report === "All" ? "space-y-5" : "space-y-4"} text-left order-2 md:order-1`}>
                      <div className={`${data?.report === "All" ? "space-y-2" : "space-y-1.5"}`}>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-100/50 text-blue-600 border border-blue-200"}`}>
                          <Activity className="w-3.5 h-3.5" />
                          <span>Performance Audit</span>
                        </div>
                        <h3 className={`${data?.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                          Technical <span className="text-blue-500">Performance</span>
                        </h3>
                        <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                          Core vitals and speed configurations analysis.
                        </p>
                      </div>

                      {/* Stats & Tools */}
                      <div className={`flex flex-wrap items-center ${data?.report === "All" ? "gap-6" : "gap-5"}`}>
                        <div className={`flex items-center ${data?.report === "All" ? "gap-5" : "gap-4"}`}>
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
                      <CircularProgress value={overallScore} size={data?.report === "All" ? 180 : 150} stroke={14} />
                      <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                        <span className={`${data?.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{overallScore}%</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                      </div>
                    </div>
                  </div>



                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sections - Manual Unrolled Rendering */}
        {data?.technicalPerformance && (
          <>
            {/* Core Web Vitals */}
            <Section
              title="Technical Performance Metrics"
              subtitle="Core Web Vitals & Loading Metrics"
              icon={Activity}
              darkMode={darkMode}
              action={
                <div className={`flex items-center p-1 rounded-lg border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                  <button
                    onClick={() => setSelectedSource("lab")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedSource === "lab" ? (darkMode ? "bg-blue-600 text-white shadow-sm" : "bg-blue-50 text-blue-600 shadow-sm") : (darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700")}`}
                  >
                    Lab Data
                  </button>
                  <button
                    onClick={() => setSelectedSource("field")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedSource === "field" ? (darkMode ? "bg-blue-600 text-white shadow-sm" : "bg-blue-50 text-blue-600 shadow-sm") : (darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700")}`}
                  >
                    Real User
                  </button>
                </div>
              }
            >
              {tech.LCP && (
                <MetricCard
                  title="Largest Contentful Paint"
                  icon={Layout}
                  metricData={tech.LCP}
                  selectedSource={selectedSource}
                  darkMode={darkMode}
                  description="Largest Contentful Paint (LCP) measures how long it takes for the main content to become visible; a fast LCP ensures users perceive the page as truly useful immediately."
                  whyItMatters="LCP is the primary indicator of how fast your page 'feels'. A good LCP keeps users from leaving due to perceived slow loading."
                  onInfoClick={() => setSelectedParameterInfo({ title: "Largest Contentful Paint", icon: Layout, ...metricExplanations.LCP, metricData: tech.LCP })}
                />
              )}

              {tech.FID && (
                <MetricCard
                  title="First Input Delay"
                  icon={MousePointer2}
                  metricData={tech.FID}
                  selectedSource={selectedSource}
                  darkMode={darkMode}
                  description="First Input Delay (FID) measures the time from a user's first interaction to the browser's response; low FID is critical for making a site feel responsive and snappy."
                  whyItMatters="FID is critical on highly interactive pages. High delay frustrates users and leads to a negative impression of your site's quality."
                  onInfoClick={() => setSelectedParameterInfo({ title: "First Input Delay", icon: MousePointer2, ...metricExplanations.FID, metricData: tech.FID })}
                />
              )}

              {tech.INP && (
                <MetricCard
                  title="Interaction to Next Paint"
                  icon={Activity}
                  metricData={tech.INP}
                  selectedSource={selectedSource}
                  darkMode={darkMode}
                  description="Interaction to Next Paint (INP) quantifies the latency of all user interactions throughout the entire visit; it is the ultimate measure of overall application responsiveness."
                  whyItMatters="INP is the most accurate reflection of a site's responsiveness. A high INP makes the app feel 'laggy' or broken to the end user."
                  onInfoClick={() => setSelectedParameterInfo({ title: "Interaction to Next Paint", icon: Activity, ...metricExplanations.INP, metricData: tech.INP })}
                />
              )}

              {tech.CLS && (
                <MetricCard
                  title="Cumulative Layout Shift"
                  icon={Layout}
                  metricData={tech.CLS}
                  selectedSource={selectedSource}
                  darkMode={darkMode}
                  description="Cumulative Layout Shift (CLS) measures unexpected movement of page elements; a low score prevents annoying layout jumps that cause users to click the wrong things."
                  whyItMatters="A stable UI prevents accidental clicks and enhances trust. High CLS is one of the most common reasons for user frustration."
                  onInfoClick={() => setSelectedParameterInfo({ title: "Cumulative Layout Shift", icon: Layout, ...metricExplanations.CLS, metricData: tech.CLS })}
                />
              )}

              {tech.FCP && (
                <MetricCard
                  title="First Contentful Paint"
                  icon={Zap}
                  metricData={tech.FCP}
                  selectedSource={selectedSource}
                  darkMode={darkMode}
                  description="First Contentful Paint (FCP) is the timestamp when the first text or image is rendered; it is the first signal to the user that the page is actually loading."
                  whyItMatters="FCP provides the first visual feedback. Speeding up FCP reduces the 'bounce rate' of users who might leave if they see nothing."
                  onInfoClick={() => setSelectedParameterInfo({ title: "First Contentful Paint", icon: Zap, ...metricExplanations.FCP, metricData: tech.FCP })}
                />
              )}

              {tech.TTFB && (
                <MetricCard
                  title="Time To First Byte"
                  icon={Server}
                  metricData={tech.TTFB}
                  selectedSource={selectedSource}
                  darkMode={darkMode}
                  description="Time to First Byte (TTFB) measures the server's responsiveness; it is the foundation of speed, as a slow server response delays every other part of the page."
                  whyItMatters="If TTFB is slow, every other metric will be slow. It is the most critical server-side performance indicator."
                  onInfoClick={() => setSelectedParameterInfo({ title: "Time To First Byte", icon: Server, ...metricExplanations.TTFB, metricData: tech.TTFB })}
                />
              )}

              {tech.TBT && (
                <MetricCard
                  title="Total Blocking Time"
                  icon={Clock}
                  metricData={tech.TBT}
                  selectedSource={selectedSource}
                  darkMode={darkMode}
                  description="Total Blocking Time (TBT) tracks how long the main thread is occupied by long tasks; reducing TBT is essential for preventing the 'frozen' feeling during page load."
                  whyItMatters="TBT correlates with user frustration. High blocking time prevents users from scrolling or clicking during the most critical load phase."
                  onInfoClick={() => setSelectedParameterInfo({ title: "Total Blocking Time", icon: Clock, ...metricExplanations.TBT, metricData: tech.TBT })}
                />
              )}

              {tech.SI && (
                <MetricCard
                  title="Speed Index"
                  icon={Gauge}
                  metricData={tech.SI}
                  selectedSource={selectedSource}
                  darkMode={darkMode}
                  description="Speed Index (SI) calculates how quickly content visually populates the screen; a lower index means users aren't left staring at a blank or half-rendered page."
                  whyItMatters="A better Speed Index means your page looks complete faster. This is vital for maintaining user interest during the first few seconds."
                  onInfoClick={() => setSelectedParameterInfo({ title: "Speed Index", icon: Gauge, ...metricExplanations.SI, metricData: tech.SI })}
                />
              )}
            </Section>

            {/* Assets & Server */}
            <Section title="Assets & Server" subtitle="Optimization checks" icon={Server} darkMode={darkMode}>
              {tech.Compression && (() => {
                const needsData = tech.Compression;
                const status = needsData.status || "poor";
                const isPassed = status === "pass";
                const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
                const textColor = darkMode ? "text-gray-100" : "text-gray-900";
                const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";
                const statusBadgeColor = status === "good" ? (darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-600 border-emerald-100") : status === "needs_improvement" ? (darkMode ? "bg-amber-900/30 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-600 border-amber-100") : (darkMode ? "bg-rose-900/30 text-rose-400 border-rose-800" : "bg-rose-50 text-rose-600 border-rose-100");
                const statusText = status === "good" ? "Passed" : status === "needs_improvement" ? "Needs Impr." : "Poor";
                const valueColor = status === "good" ? (darkMode ? "text-emerald-400" : "text-emerald-600") : status === "needs_improvement" ? (darkMode ? "text-amber-400" : "text-amber-600") : (darkMode ? "text-rose-400" : "text-rose-600");
                const displayValue = `${needsData.value}`;

                return (
                  <div className={`rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col h-full`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                          <FileCode size={24} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-lg leading-tight mb-1 ${textColor}`}>Text Compression</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadgeColor}`}>{statusText}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedParameterInfo({ title: "Text Compression", icon: FileCode, ...metricExplanations.Compression, metricData: tech.Compression }) }} className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-gray-500 hover:text-gray-300 hover:bg-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`} title="View Methodology">
                        <Info size={20} />
                      </button>
                    </div>
                    <div className="space-y-6 flex-grow">
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Description: <span className={`normal-case font-normal opacity-100 text-xs leading-relaxed ${subTextColor}`}>Compressing text-based files (HTML, CSS, JS) reduces their size, allowing them to download faster and significantly decreasing initial page load time.</span>
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                          <div className="flex justify-between items-center">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overall Score</p>
                            <span className={`text-xs font-black px-3 py-1 rounded-lg ${needsData.status === "good" ? (darkMode ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30" : "bg-emerald-50 text-emerald-600 border border-emerald-100") : needsData.status === "needs_improvement" ? (darkMode ? "bg-amber-900/20 text-amber-400 border border-amber-800/30" : "bg-amber-50 text-amber-600 border border-amber-100") : (darkMode ? "bg-rose-900/20 text-rose-400 border border-rose-800/30" : "bg-rose-50 text-rose-600 border border-rose-100")}`}>
                              {needsData.value}
                            </span>
                          </div>
                        </div>
                        <div className={`p-3 rounded-xl border ${darkMode ? "bg-emerald-900/10 border-emerald-800/30" : "bg-emerald-50 border-emerald-100"}`}>
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Compressed</p>
                          <p className={`text-xl font-black ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>{needsData.compressedCount || 0}</p>
                        </div>
                        <div className={`p-3 rounded-xl border ${darkMode ? "bg-rose-900/10 border-rose-800/30" : "bg-rose-50 border-rose-100"}`}>
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Uncompressed</p>
                          <p className={`text-xl font-black ${darkMode ? "text-rose-300" : "text-rose-700"}`}>{needsData.uncompressedResourcesCount || 0}</p>
                        </div>
                      </div>

                      <div>
                        <DirectThresholdBar metricData={{ ...needsData, value: displayValue }} darkMode={darkMode} />
                      </div>
                    </div>
                    <div className={`mt-auto pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Why it matters: <span className="normal-case font-normal opacity-100">Compression can reduce file sizes by up to 70%, drastically speeding up data transfer for mobile and slow-connection users.</span>
                      </p>
                    </div>
                    <MetricAnalysisDetails
                      analysis={needsData?.analysis}
                      darkMode={darkMode}
                      isOpen={expandedDetails.compression}
                      onToggle={() => toggleDetails('compression')}
                    />
                  </div>
                );
              })()}

              {tech.Caching && (() => {
                const needsData = tech.Caching;
                const status = needsData.status || "poor";
                const isPassed = status === "pass";
                const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
                const textColor = darkMode ? "text-gray-100" : "text-gray-900";
                const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";
                const statusBadgeColor = status === "good" ? (darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-600 border-emerald-100") : status === "needs_improvement" ? (darkMode ? "bg-amber-900/30 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-600 border-amber-100") : (darkMode ? "bg-rose-900/30 text-rose-400 border-rose-800" : "bg-rose-50 text-rose-600 border-rose-100");
                const statusText = status === "good" ? "Passed" : status === "needs_improvement" ? "Needs Impr." : "Poor";
                const valueColor = status === "good" ? (darkMode ? "text-emerald-400" : "text-emerald-600") : status === "needs_improvement" ? (darkMode ? "text-amber-400" : "text-amber-600") : (darkMode ? "text-rose-400" : "text-rose-600");
                const displayValue = `${needsData.value}`;

                return (
                  <div className={`rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col h-full`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                          <Database size={24} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-lg leading-tight mb-1 ${textColor}`}>Caching Policy</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadgeColor}`}>{statusText}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedParameterInfo({ title: "Caching Policy", icon: Database, ...metricExplanations.Caching, metricData: tech.Caching }) }} className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-gray-500 hover:text-gray-300 hover:bg-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`} title="View Methodology">
                        <Info size={20} />
                      </button>
                    </div>
                    <div className="space-y-6 flex-grow">
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Description: <span className={`normal-case font-normal opacity-100 text-xs leading-relaxed ${subTextColor}`}>Browser caching stores static assets locally on the user device, eliminating the need to re-download them on repeat visits and making your site feel much faster.</span>
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                          <div className="flex justify-between items-center">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overall Score</p>
                            <span className={`text-xs font-black px-3 py-1 rounded-lg ${needsData.status === "good" ? (darkMode ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30" : "bg-emerald-50 text-emerald-600 border border-emerald-100") : needsData.status === "needs_improvement" ? (darkMode ? "bg-amber-900/20 text-amber-400 border border-amber-800/30" : "bg-amber-50 text-amber-600 border border-amber-100") : (darkMode ? "bg-rose-900/20 text-rose-400 border border-rose-800/30" : "bg-rose-50 text-rose-600 border border-rose-100")}`}>
                              {needsData.value}
                            </span>
                          </div>
                        </div>
                        <div className={`p-3 rounded-xl border ${darkMode ? "bg-emerald-900/10 border-emerald-800/30" : "bg-emerald-50 border-emerald-100"}`}>
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Cached</p>
                          <p className={`text-xl font-black ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>{needsData.cachedCount || 0}</p>
                        </div>
                        <div className={`p-3 rounded-xl border ${darkMode ? "bg-rose-900/10 border-rose-800/30" : "bg-rose-50 border-rose-100"}`}>
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Uncached</p>
                          <p className={`text-xl font-black ${darkMode ? "text-rose-300" : "text-rose-700"}`}>{needsData.uncachedResourcesCount || 0}</p>
                        </div>
                      </div>

                      <div>
                        <DirectThresholdBar metricData={{ ...needsData, value: displayValue }} darkMode={darkMode} />
                      </div>
                    </div>
                    <div className={`mt-auto pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Why it matters: <span className="normal-case font-normal opacity-100">Efficient caching reduces server costs and provides an 'instant' feel for returning visitors by reading files directly from their disk.</span>
                      </p>
                    </div>
                    <MetricAnalysisDetails
                      analysis={needsData?.analysis}
                      darkMode={darkMode}
                      isOpen={expandedDetails.caching}
                      onToggle={() => toggleDetails('caching')}
                    />
                  </div>
                );
              })()}

              {tech.Render_Blocking && (() => {
                const needsData = tech.Render_Blocking;
                const status = needsData.status || "poor";
                const isPassed = status === "pass";
                const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
                const textColor = darkMode ? "text-gray-100" : "text-gray-900";
                const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";
                const statusBadgeColor = status === "good" ? (darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-600 border-emerald-100") : status === "needs_improvement" ? (darkMode ? "bg-amber-900/30 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-600 border-amber-100") : (darkMode ? "bg-rose-900/30 text-rose-400 border-rose-800" : "bg-rose-50 text-rose-600 border-rose-100");
                const statusText = status === "good" ? "Passed" : status === "needs_improvement" ? "Needs Impr." : "Poor";
                const valueColor = status === "good" ? (darkMode ? "text-emerald-400" : "text-emerald-600") : status === "needs_improvement" ? (darkMode ? "text-amber-400" : "text-amber-600") : (darkMode ? "text-rose-400" : "text-rose-600");
                const displayValue = needsData.blockingCount === 0 ? "None" : `${needsData.blockingCount} items`;

                return (
                  <div className={`rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col h-full`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                          <AlertTriangle size={24} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-lg leading-tight mb-1 ${textColor}`}>Render-Blocking</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadgeColor}`}>{statusText}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedParameterInfo({ title: "Render-Blocking", icon: AlertTriangle, ...metricExplanations.Render_Blocking, metricData: tech.Render_Blocking }) }} className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-gray-500 hover:text-gray-300 hover:bg-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`} title="View Methodology">
                        <Info size={20} />
                      </button>
                    </div>
                    <div className="space-y-6 flex-grow">
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Description: <span className={`normal-case font-normal opacity-100 text-xs leading-relaxed ${subTextColor}`}>Render-blocking resources are scripts and stylesheets that stop the browser from showing content until they load; removing them enables an instant visual experience.</span>
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                          <div className="flex justify-between items-center">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overall Score</p>
                            <span className={`text-xs font-black px-3 py-1 rounded-lg ${needsData.status === "good" ? (darkMode ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30" : "bg-emerald-50 text-emerald-600 border border-emerald-100") : needsData.status === "needs_improvement" ? (darkMode ? "bg-amber-900/20 text-amber-400 border border-amber-800/30" : "bg-amber-50 text-amber-600 border border-amber-100") : (darkMode ? "bg-rose-900/20 text-rose-400 border border-rose-800/30" : "bg-rose-50 text-rose-600 border border-rose-100")}`}>
                              {needsData.value}
                            </span>
                          </div>
                        </div>
                        <div className={`p-3 rounded-xl border ${darkMode ? "bg-rose-900/10 border-rose-800/30" : "bg-rose-50 border-rose-100"}`}>
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Blocking</p>
                          <p className={`text-xl font-black ${darkMode ? "text-rose-300" : "text-rose-700"}`}>{needsData.blockingCount || 0}</p>
                        </div>
                        <div className={`p-3 rounded-xl border ${darkMode ? "bg-blue-900/10 border-blue-800/30" : "bg-blue-50 border-blue-100"}`}>
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Target</p>
                          <p className={`text-xl font-black ${darkMode ? "text-blue-300" : "text-blue-700"}`}>0</p>
                        </div>
                      </div>

                      <div>
                        <DirectThresholdBar metricData={{ ...needsData, value: displayValue }} darkMode={darkMode} />
                      </div>
                    </div>
                    <div className={`mt-auto pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Why it matters: <span className="normal-case font-normal opacity-100">Eliminating render-blockers ensures that users see your content immediately, without waiting for secondary styles or scripts to finish loading.</span>
                      </p>
                    </div>
                    <MetricAnalysisDetails
                      analysis={needsData?.analysis}
                      darkMode={darkMode}
                      isOpen={expandedDetails.renderBlocking}
                      onToggle={() => toggleDetails('renderBlocking')}
                    />
                  </div>
                );
              })()}

              {tech.HTTP && (() => {
                const needsData = tech.HTTP;
                const status = needsData.status || "poor";
                const isPassed = status === "pass";
                const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
                const textColor = darkMode ? "text-gray-100" : "text-gray-900";
                const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";
                const statusBadgeColor = status === "good" ? (darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-600 border-emerald-100") : status === "needs_improvement" ? (darkMode ? "bg-amber-900/30 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-600 border-amber-100") : (darkMode ? "bg-rose-900/30 text-rose-400 border-rose-800" : "bg-rose-50 text-rose-600 border-rose-100");
                const statusText = status === "good" ? "Passed" : status === "needs_improvement" ? "Needs Impr." : "Poor";
                const valueColor = status === "good" ? (darkMode ? "text-emerald-400" : "text-emerald-600") : status === "needs_improvement" ? (darkMode ? "text-amber-400" : "text-amber-600") : (darkMode ? "text-rose-400" : "text-rose-600");
                const displayValue = status === "good" ? "Secure" : "Insecure";

                return (
                  <div className={`rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col h-full`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                          <Shield size={24} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-lg leading-tight mb-1 ${textColor}`}>HTTPS / HTTP2</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadgeColor}`}>{statusText}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedParameterInfo({ title: "HTTPS / HTTP2", icon: Shield, ...metricExplanations.HTTP, metricData: tech.HTTP }) }} className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-gray-500 hover:text-gray-300 hover:bg-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`} title="View Methodology">
                        <Info size={20} />
                      </button>
                    </div>
                    <div className="space-y-6 flex-grow">
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Description: <span className={`normal-case font-normal opacity-100 text-xs leading-relaxed ${subTextColor}`}>HTTPS encrypts data for security, while HTTP/2 allows multiple files to be sent simultaneously (multiplexing), ensuring both a safe and high-speed connection.</span>
                      </p>

                      <div className="grid grid-cols-1 gap-4">
                        <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                          <div className="flex justify-between items-center">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overall Security</p>
                            <span className={`text-xs font-black uppercase px-3 py-1 rounded-lg ${needsData.status === "good" ? (darkMode ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30" : "bg-emerald-50 text-emerald-600 border border-emerald-100") : needsData.status === "needs_improvement" ? (darkMode ? "bg-amber-900/20 text-amber-400 border border-amber-800/30" : "bg-amber-50 text-amber-600 border border-amber-100") : (darkMode ? "bg-rose-900/20 text-rose-400 border border-rose-800/30" : "bg-rose-50 text-rose-600 border border-rose-100")}`}>
                              {displayValue}
                            </span>
                          </div>
                        </div>

                        <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                          <div className="flex justify-between items-center">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Active Protocol</p>
                            <span className={`text-xs font-black uppercase px-3 py-1 rounded-lg ${needsData.status === "good" ? (darkMode ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30" : "bg-emerald-50 text-emerald-600 border border-emerald-100") : needsData.status === "needs_improvement" ? (darkMode ? "bg-amber-900/20 text-amber-400 border border-amber-800/30" : "bg-amber-50 text-amber-600 border border-amber-100") : (darkMode ? "bg-rose-900/20 text-rose-400 border border-rose-800/30" : "bg-rose-50 text-rose-600 border border-rose-100")}`}>
                              {needsData.protocol || "Unknown"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <DirectThresholdBar metricData={{ ...needsData, value: displayValue }} darkMode={darkMode} />
                      </div>
                    </div>
                    <div className={`mt-auto pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Why it matters: <span className="normal-case font-normal opacity-100">HTTPS is a ranking factor for SEO and required for modern performance features like HTTP/2, which delivers high-speed parallel asset loading.</span>
                      </p>
                    </div>
                    <MetricAnalysisDetails
                      analysis={needsData?.analysis}
                      darkMode={darkMode}
                      isOpen={expandedDetails.http}
                      onToggle={() => toggleDetails('http')}
                    />
                  </div>
                );
              })()}

              {tech.Resource_Optimization && (() => {
                const needsData = tech.Resource_Optimization;
                const status = needsData.status || "poor";
                const isPassed = status === "pass";
                const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
                const textColor = darkMode ? "text-gray-100" : "text-gray-900";
                const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";
                const statusBadgeColor = status === "good" ? (darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-600 border-emerald-100") : status === "needs_improvement" ? (darkMode ? "bg-amber-900/30 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-600 border-amber-100") : (darkMode ? "bg-rose-900/30 text-rose-400 border-rose-800" : "bg-rose-50 text-rose-600 border-rose-100");
                const statusText = status === "good" ? "Passed" : status === "needs_improvement" ? "Needs Impr." : "Poor";
                const valueColor = status === "good" ? (darkMode ? "text-emerald-400" : "text-emerald-600") : status === "needs_improvement" ? (darkMode ? "text-amber-400" : "text-amber-600") : (darkMode ? "text-rose-400" : "text-rose-600");
                const displayValue = status === "good" ? "Optimized" : "Needs Work";

                return (
                  <div className={`rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col h-full md:col-span-2`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                          <ImageIcon size={24} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-lg leading-tight mb-1 ${textColor}`}>Resource Optimization</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadgeColor}`}>{statusText}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedParameterInfo({ title: "Resource Optimization", icon: ImageIcon, ...metricExplanations.Resource_Optimization, metricData: tech.Resource_Optimization }) }} className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-gray-500 hover:text-gray-300 hover:bg-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`} title="View Methodology">
                        <Info size={20} />
                      </button>
                    </div>
                    <div className="space-y-6 flex-grow">
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Description: <span className={`normal-case font-normal opacity-100 text-xs leading-relaxed ${subTextColor}`}>Optimizing images and scripts involves compressing files and using modern formats to minimize payload weight, reducing data usage and speeding up rendering.</span>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border sm:col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                          <div className="flex justify-between items-center">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overall Score</p>
                            <span className={`text-xs font-black px-3 py-1 rounded-lg ${needsData.status === "good" ? (darkMode ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30" : "bg-emerald-50 text-emerald-600 border border-emerald-100") : needsData.status === "needs_improvement" ? (darkMode ? "bg-amber-900/20 text-amber-400 border border-amber-800/30" : "bg-amber-50 text-amber-600 border border-amber-100") : (darkMode ? "bg-rose-900/20 text-rose-400 border border-rose-800/30" : "bg-rose-50 text-rose-600 border border-rose-100")}`}>
                              {needsData.value}
                            </span>
                          </div>
                        </div>
                        {/* Images Stats Group */}
                        <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                          <div className="flex justify-between items-center mb-3">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Images</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                              {needsData.totalImages || 0} Total
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className={`text-[11px] ${subTextColor}`}>Optimized</span>
                              <span className={`text-xs font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{needsData.optimizedImagesCount || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-[11px] ${subTextColor}`}>Heavy/Large</span>
                              <span className={`text-xs font-bold ${darkMode ? "text-rose-400" : "text-rose-600"}`}>{needsData.unoptimizedImagesCount || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Scripts Stats Group */}
                        <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                          <div className="flex justify-between items-center mb-3">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Scripts</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                              {needsData.totalScripts || 0} Total
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className={`text-[11px] ${subTextColor}`}>Minified</span>
                              <span className={`text-xs font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{needsData.minifiedScriptsCount || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-[11px] ${subTextColor}`}>Unminified</span>
                              <span className={`text-xs font-bold ${darkMode ? "text-rose-400" : "text-rose-600"}`}>{needsData.unminifiedScriptsCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <DirectThresholdBar metricData={{ ...needsData, value: displayValue }} darkMode={darkMode} />
                      </div>
                    </div>
                    <div className={`mt-auto pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Why it matters: <span className="normal-case font-normal opacity-100">Proper optimization reduces the CPU and battery power required to render your page, keeping it smooth on all devices.</span>
                      </p>
                    </div>
                    <MetricAnalysisDetails
                      analysis={needsData?.analysis}
                      darkMode={darkMode}
                      isOpen={expandedDetails.resourceOptimization}
                      onToggle={() => toggleDetails('resourceOptimization')}
                    />
                  </div>
                );
              })()}
            </Section>

            {/* SEO & Crawlability */}
            <Section title="SEO & Crawlability" subtitle="Search engine visibility" icon={Search} darkMode={darkMode}>
              {tech.Sitemap && (() => {
                const needsData = tech.Sitemap;
                const status = needsData.status || "poor";
                const isPassed = status === "pass";
                const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
                const textColor = darkMode ? "text-gray-100" : "text-gray-900";
                const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";
                const statusBadgeColor = status === "good" ? (darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-600 border-emerald-100") : status === "needs_improvement" ? (darkMode ? "bg-amber-900/30 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-600 border-amber-100") : (darkMode ? "bg-rose-900/30 text-rose-400 border-rose-800" : "bg-rose-50 text-rose-600 border-rose-100");
                const statusText = status === "good" ? "Passed" : status === "needs_improvement" ? "Needs Impr." : "Poor";
                const valueColor = status === "good" ? (darkMode ? "text-emerald-400" : "text-emerald-600") : status === "needs_improvement" ? (darkMode ? "text-amber-400" : "text-amber-600") : (darkMode ? "text-rose-400" : "text-rose-600");
                const displayValue = status === "good" ? "Found" : "Missing";

                return (
                  <div className={`rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col h-full`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                          <Map size={24} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-lg leading-tight mb-1 ${textColor}`}>Sitemap</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadgeColor}`}>{statusText}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedParameterInfo({ title: "Sitemap", icon: Map, ...metricExplanations.Sitemap, metricData: tech.Sitemap }) }} className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-gray-500 hover:text-gray-300 hover:bg-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`} title="View Methodology">
                        <Info size={20} />
                      </button>
                    </div>
                    <div className="space-y-6 flex-grow">
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Description: <span className={`normal-case font-normal opacity-100 text-xs leading-relaxed ${subTextColor}`}>A Sitemap is a roadmap of your URLs that helps search engine bots discover and index every page efficiently, significantly boosting your site's overall visibility.</span>
                      </p>

                      <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                        <div className="flex justify-between items-center">
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Sitemap Status</p>
                          <span className={`text-xs font-black uppercase px-3 py-1 rounded-lg ${needsData.status === "good" ? (darkMode ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30" : "bg-emerald-50 text-emerald-600 border border-emerald-100") : needsData.status === "needs_improvement" ? (darkMode ? "bg-amber-900/20 text-amber-400 border border-amber-800/30" : "bg-amber-50 text-amber-600 border border-amber-100") : (darkMode ? "bg-rose-900/20 text-rose-400 border border-rose-800/30" : "bg-rose-50 text-rose-600 border border-rose-100")}`}>
                            {needsData.status === "good" ? "Found" : "Missing"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <DirectThresholdBar metricData={{ ...needsData, value: displayValue }} darkMode={darkMode} />
                      </div>
                    </div>
                    <div className={`mt-auto pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Why it matters: <span className="normal-case font-normal opacity-100">Without a sitemap, your newest or deeper pages might take weeks to be found by search engines, leading to lost traffic and revenue.</span>
                      </p>
                    </div>
                    <MetricAnalysisDetails
                      analysis={needsData?.analysis ? { ...needsData.analysis, content: needsData.content } : needsData.content ? { content: needsData.content } : null}
                      darkMode={darkMode}
                      isOpen={expandedDetails.sitemap}
                      onToggle={() => toggleDetails('sitemap')}
                    />
                  </div>
                );
              })()}

              {tech.Robots && (() => {
                const needsData = tech.Robots;
                const status = needsData.status || "poor";
                const isPassed = status === "pass";
                const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
                const textColor = darkMode ? "text-gray-100" : "text-gray-900";
                const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";
                const statusBadgeColor = status === "good" ? (darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-600 border-emerald-100") : status === "needs_improvement" ? (darkMode ? "bg-amber-900/30 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-600 border-amber-100") : (darkMode ? "bg-rose-900/30 text-rose-400 border-rose-800" : "bg-rose-50 text-rose-600 border-rose-100");
                const statusText = status === "good" ? "Passed" : status === "needs_improvement" ? "Needs Impr." : "Poor";
                const valueColor = status === "good" ? (darkMode ? "text-emerald-400" : "text-emerald-600") : status === "needs_improvement" ? (darkMode ? "text-amber-400" : "text-amber-600") : (darkMode ? "text-rose-400" : "text-rose-600");
                const displayValue = status === "good" ? "Found" : "Missing";

                return (
                  <div className={`rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col h-full`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                          <FileText size={24} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-lg leading-tight mb-1 ${textColor}`}>Robots.txt</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadgeColor}`}>{statusText}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedParameterInfo({ title: "Robots.txt", icon: FileText, ...metricExplanations.Robots, metricData: tech.Robots }) }} className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-gray-500 hover:text-gray-300 hover:bg-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`} title="View Methodology">
                        <Info size={20} />
                      </button>
                    </div>
                    <div className="space-y-6 flex-grow">
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Description: <span className={`normal-case font-normal opacity-100 text-xs leading-relaxed ${subTextColor}`}>Robots.txt is a control file that guides search engine crawlers on which parts of your site should be indexed, protecting private areas and optimizing crawl budget.</span>
                      </p>

                      <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                        <div className="flex justify-between items-center">
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Robots Status</p>
                          <span className={`text-xs font-black uppercase px-3 py-1 rounded-lg ${needsData.status === "good" ? (darkMode ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30" : "bg-emerald-50 text-emerald-600 border border-emerald-100") : needsData.status === "needs_improvement" ? (darkMode ? "bg-amber-900/20 text-amber-400 border border-amber-800/30" : "bg-amber-50 text-amber-600 border border-amber-100") : (darkMode ? "bg-rose-900/20 text-rose-400 border border-rose-800/30" : "bg-rose-50 text-rose-600 border border-rose-100")}`}>
                            {needsData.status === "good" ? "Found" : "Missing"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <DirectThresholdBar metricData={{ ...needsData, value: displayValue }} darkMode={darkMode} />
                      </div>
                    </div>
                    <div className={`mt-auto pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Why it matters: <span className="normal-case font-normal opacity-100">Misconfigured robots.txt can accidentally hide your entire site from Google. Managing it correctly ensures search bots focus on your most important content.</span>
                      </p>
                    </div>
                    <MetricAnalysisDetails
                      analysis={needsData?.analysis ? { ...needsData.analysis, content: needsData.content } : needsData.content ? { content: needsData.content } : null}
                      darkMode={darkMode}
                      isOpen={expandedDetails.robots}
                      onToggle={() => toggleDetails('robots')}
                    />
                  </div>
                );
              })()}

              {tech.Structured_Data && (() => {
                const needsData = tech.Structured_Data;
                const status = needsData.status || "poor";
                const isPassed = status === "pass";
                const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
                const textColor = darkMode ? "text-gray-100" : "text-gray-900";
                const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";
                const statusBadgeColor = status === "good" ? (darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-600 border-emerald-100") : status === "needs_improvement" ? (darkMode ? "bg-amber-900/30 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-600 border-amber-100") : (darkMode ? "bg-rose-900/30 text-rose-400 border-rose-800" : "bg-rose-50 text-rose-600 border-rose-100");
                const statusText = status === "good" ? "Passed" : status === "needs_improvement" ? "Needs Impr." : "Poor";
                const valueColor = status === "good" ? (darkMode ? "text-emerald-400" : "text-emerald-600") : status === "needs_improvement" ? (darkMode ? "text-amber-400" : "text-amber-600") : (darkMode ? "text-rose-400" : "text-rose-600");
                const displayValue = status === "good" ? "Found" : "Missing";

                return (
                  <div className={`rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col h-full`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                          <FileCode size={24} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-lg leading-tight mb-1 ${textColor}`}>Structured Data</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadgeColor}`}>{statusText}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedParameterInfo({ title: "Structured Data", icon: FileCode, ...metricExplanations.Structured_Data, metricData: tech.Structured_Data }) }} className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-gray-500 hover:text-gray-300 hover:bg-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`} title="View Methodology">
                        <Info size={20} />
                      </button>
                    </div>
                    <div className="space-y-6 flex-grow">
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Description: <span className={`normal-case font-normal opacity-100 text-xs leading-relaxed ${subTextColor}`}>Structured data (Schema) provides explicit clues to search engines about the meaning of your content, leading to enhanced 'Rich Results' in search listings.</span>
                      </p>

                      <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                        <div className="flex justify-between items-center">
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Detected Entities</p>
                          <span className={`text-xs font-black uppercase px-3 py-1 rounded-lg ${needsData.status === "good" ? (darkMode ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30" : "bg-emerald-50 text-emerald-600 border border-emerald-100") : needsData.status === "needs_improvement" ? (darkMode ? "bg-amber-900/20 text-amber-400 border border-amber-800/30" : "bg-amber-50 text-amber-600 border border-amber-100") : (darkMode ? "bg-rose-900/20 text-rose-400 border border-rose-800/30" : "bg-rose-50 text-rose-600 border border-rose-100")}`}>
                            {needsData.content?.length || 0} Found
                          </span>
                        </div>
                      </div>

                      <div>
                        <DirectThresholdBar metricData={{ ...needsData, value: displayValue }} darkMode={darkMode} />
                      </div>
                    </div>
                    <div className={`mt-auto pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Why it matters: <span className="normal-case font-normal opacity-100">Structured data is the key to getting 'Rich Snippets' (stars, prices, FAQs) in search results, which can double your click-through rate (CTR).</span>
                      </p>
                    </div>
                    <MetricAnalysisDetails
                      analysis={needsData?.analysis ? { ...needsData.analysis, content: needsData.content } : needsData.content ? { content: needsData.content } : null}
                      darkMode={darkMode}
                      isOpen={expandedDetails.structuredData}
                      onToggle={() => toggleDetails('structuredData')}
                    />
                  </div>
                );
              })()}


              {tech.Redirect_Chains && (() => {
                const needsData = tech.Redirect_Chains;
                const status = needsData.status || "poor";
                const isPassed = status === "pass";
                const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
                const textColor = darkMode ? "text-gray-100" : "text-gray-900";
                const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";
                const statusBadgeColor = status === "good" ? (darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-600 border-emerald-100") : status === "needs_improvement" ? (darkMode ? "bg-amber-900/30 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-600 border-amber-100") : (darkMode ? "bg-rose-900/30 text-rose-400 border-rose-800" : "bg-rose-50 text-rose-600 border-rose-100");
                const statusText = status === "good" ? "Passed" : status === "needs_improvement" ? "Needs Impr." : "Poor";
                const valueColor = status === "good" ? (darkMode ? "text-emerald-400" : "text-emerald-600") : status === "needs_improvement" ? (darkMode ? "text-amber-400" : "text-amber-600") : (darkMode ? "text-rose-400" : "text-rose-600");
                const displayValue = needsData.hops + " hops";

                return (
                  <div className={`rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col h-full`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                          <ArrowRightLeft size={24} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-lg leading-tight mb-1 ${textColor}`}>Redirect Chains</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadgeColor}`}>{statusText}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedParameterInfo({ title: "Redirect Chains", icon: ArrowRightLeft, ...metricExplanations.Redirect_Chains, metricData: tech.Redirect_Chains }) }} className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-gray-500 hover:text-gray-300 hover:bg-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`} title="View Methodology">
                        <Info size={20} />
                      </button>
                    </div>
                    <div className="space-y-6 flex-grow">
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Description: <span className={`normal-case font-normal opacity-100 text-xs leading-relaxed ${subTextColor}`}>Redirect chains occur when one URL points to another through multiple steps, which significantly delays the user's arrival and confuses search engine bots.</span>
                      </p>

                      <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Hops</p>
                            <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${needsData.hops <= 1 ? (darkMode ? "bg-emerald-900/20 text-emerald-400" : "bg-emerald-50 text-emerald-600") : (darkMode ? "bg-rose-900/20 text-rose-400" : "bg-rose-50 text-rose-600")}`}>
                              {needsData.hops}
                            </span>
                          </div>

                          {needsData.redirectDetails && needsData.redirectDetails.length > 0 && (
                            <div className="pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Redirect Path</p>
                              <div className="flex flex-col gap-2">
                                {needsData.redirectDetails.map((url, idx) => (
                                  <div key={idx} className="flex flex-col items-start">
                                    <div className="flex items-center gap-2 w-full">
                                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${idx === needsData.redirectDetails.length - 1 ? "bg-emerald-500" : "bg-blue-500"}`} />
                                      <p className={`text-[10px] font-mono truncate flex-grow ${darkMode ? "text-gray-300" : "text-gray-600"}`} title={url}>
                                        {url}
                                      </p>
                                    </div>
                                    {idx < needsData.redirectDetails.length - 1 && (
                                      <div className="ml-0.5 flex flex-col items-center gap-0.5 py-1">
                                        <div className="w-[1px] h-2 bg-gray-300 dark:bg-gray-600" />
                                        <ChevronDown size={10} className={darkMode ? "text-gray-500" : "text-gray-400"} />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <DirectThresholdBar metricData={{ ...needsData, value: displayValue }} darkMode={darkMode} />
                      </div>
                    </div>
                    <div className={`mt-auto pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Why it matters: <span className="normal-case font-normal opacity-100">Each hop in a redirect chain adds hundreds of milliseconds of 'dead time' where the user sees a white screen. Clean URLs provide the fastest experience.</span>
                      </p>
                    </div>
                    <MetricAnalysisDetails
                      analysis={needsData?.analysis}
                      darkMode={darkMode}
                      isOpen={expandedDetails.redirectChains}
                      onToggle={() => toggleDetails('redirectChains')}
                    />
                  </div>
                );
              })()}
            </Section>
          </>
        )}

      </main >


      {/* Methodology Modal */}
      <MetricInfoModal
        isOpen={!!selectedMetricInfo}
        onClose={() => setSelectedMetricInfo(null)}
        info={selectedMetricInfo}
        darkMode={darkMode}
      />
      {/* Parameter Modal */}
      <ParameterInfoModal
        isOpen={!!selectedParameterInfo}
        onClose={() => setSelectedParameterInfo(null)}
        info={selectedParameterInfo}
        darkMode={darkMode}
      />
    </div>
  );
}