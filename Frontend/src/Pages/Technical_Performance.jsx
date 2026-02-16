import React, { useContext } from "react";
import UrlHeader from "../Component/UrlHeader";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  Activity, Zap, Layout, Image as ImageIcon,
  Server, Database, FileCode, Globe,
  ArrowRightLeft, Clock, Gauge, AlertTriangle,
  Info, ChevronDown
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import { InfoDetails } from "../Component/InfoDetails";

import MetricCard from "../Component/reusablecomponent/MetricCard";
import StatusSummary from "../Component/reusablecomponent/StatusSummary";
import { AuditShimmer } from "../Component/reusablecomponent/AuditShimmer";

import Section from "../Component/reusablecomponent/Section";
import OptimizationCard from "../Component/reusablecomponent/OptimizationCard";
import ScoreBadge from "../Component/reusablecomponent/ScoreBadge";

// ✅ Score Calculation Info (Standard Weights)
const scoreCalculationInfo = InfoDetails.Technical_Performance_Methodology;

// ✅ Metric Explanations Data
const metricExplanations = InfoDetails;

// ✅ Audit Steps Data
const AUDIT_STEPS = [
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
];

// ✅ Main Component
export default function Technical_Performance() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const [selectedSource, setSelectedSource] = React.useState("lab"); // "lab" or "field"
  const [expandedDetails, setExpandedDetails] = React.useState({});
  const toggleDetails = (metric) => setExpandedDetails(prev => ({ ...prev, [metric]: !prev[metric] }));
  const darkMode = theme === "dark";

  // Check section expansion states
  const isCoreExpanded = expandedDetails.LCP || expandedDetails.INP || expandedDetails.CLS || expandedDetails.FCP || expandedDetails.TTFB;
  const isLabExpanded = expandedDetails.TBT || expandedDetails.SI;
  const isAssetsExpanded = expandedDetails.compression || expandedDetails.caching || expandedDetails.redirectChains || expandedDetails.renderBlocking || expandedDetails.resourceOptimization;

  const metric = data || {};
  const tech = metric.technicalPerformance || {};
  const overallScore = tech?.Percentage || 0;
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

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
                  <AuditShimmer darkMode={darkMode} loading={loading} data={data} auditSteps={AUDIT_STEPS} />
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
                        <StatusSummary tech={tech} className={data?.report === "All" ? "gap-5" : "gap-4"} />
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
              title="Core Web Vitals"
              subtitle="Field & Lab Data"
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
              shouldAlignStart={isCoreExpanded}
            >
              {tech.LCP && (
                <MetricCard
                  key="LCP"
                  title="Largest Contentful Paint"
                  icon={Layout}
                  metricData={tech.LCP}
                  selectedSource={selectedSource}
                  darkMode={darkMode}
                  isOpen={!!expandedDetails.LCP}
                  onToggle={() => toggleDetails('LCP')}
                  description={metricExplanations.LCP.whatThisParameterIs}
                  whyItMatters={metricExplanations.LCP.whyItMatters}
                  onInfoClick={() => setSelectedParameterInfo({ title: "Largest Contentful Paint", icon: Layout, ...metricExplanations.LCP, metricData: tech.LCP })}
                />
              )}



              {tech.INP && (
                <MetricCard
                  key="INP"
                  title="Interaction to Next Paint"
                  icon={Activity}
                  metricData={tech.INP}
                  selectedSource={selectedSource}
                  darkMode={darkMode}
                  isOpen={!!expandedDetails.INP}
                  onToggle={() => toggleDetails('INP')}
                  description={metricExplanations.INP.whatThisParameterIs}
                  whyItMatters={metricExplanations.INP.whyItMatters}
                  onInfoClick={() => setSelectedParameterInfo({ title: "Interaction to Next Paint", icon: Activity, ...metricExplanations.INP, metricData: tech.INP })}
                />
              )}

              {tech.CLS && (
                <MetricCard
                  key="CLS"
                  title="Cumulative Layout Shift"
                  icon={Layout}
                  metricData={tech.CLS}
                  selectedSource={selectedSource}
                  darkMode={darkMode}
                  isOpen={!!expandedDetails.CLS}
                  onToggle={() => toggleDetails('CLS')}
                  description={metricExplanations.CLS.whatThisParameterIs}
                  whyItMatters={metricExplanations.CLS.whyItMatters}
                  onInfoClick={() => setSelectedParameterInfo({ title: "Cumulative Layout Shift", icon: Layout, ...metricExplanations.CLS, metricData: tech.CLS })}
                />
              )}

              {tech.FCP && (
                <MetricCard
                  key="FCP"
                  title="First Contentful Paint"
                  icon={Zap}
                  metricData={tech.FCP}
                  selectedSource={selectedSource}
                  darkMode={darkMode}
                  isOpen={!!expandedDetails.FCP}
                  onToggle={() => toggleDetails('FCP')}
                  description={metricExplanations.FCP.whatThisParameterIs}
                  whyItMatters={metricExplanations.FCP.whyItMatters}
                  onInfoClick={() => setSelectedParameterInfo({ title: "First Contentful Paint", icon: Zap, ...metricExplanations.FCP, metricData: tech.FCP })}
                />
              )}

              {tech.TTFB && (
                <MetricCard
                  key="TTFB"
                  title="Time To First Byte"
                  icon={Server}
                  metricData={tech.TTFB}
                  selectedSource={selectedSource}
                  darkMode={darkMode}
                  isOpen={!!expandedDetails.TTFB}
                  onToggle={() => toggleDetails('TTFB')}
                  description={metricExplanations.TTFB.whatThisParameterIs}
                  whyItMatters={metricExplanations.TTFB.whyItMatters}
                  onInfoClick={() => setSelectedParameterInfo({ title: "Time To First Byte", icon: Server, ...metricExplanations.TTFB, metricData: tech.TTFB })}
                />
              )}

            </Section>

            {/* Other Lab Metrics */}
            <Section title="Other Lab Metrics" subtitle="Additional performance indicators" icon={Gauge} darkMode={darkMode} shouldAlignStart={isLabExpanded}>
              {tech.TBT && (
                <MetricCard
                  key="TBT"
                  title="Total Blocking Time"
                  icon={Clock}
                  metricData={tech.TBT}
                  selectedSource="lab"
                  darkMode={darkMode}
                  isOpen={!!expandedDetails.TBT}
                  onToggle={() => toggleDetails('TBT')}
                  description={metricExplanations.TBT.whatThisParameterIs}
                  whyItMatters={metricExplanations.TBT.whyItMatters}
                  onInfoClick={() => setSelectedParameterInfo({ title: "Total Blocking Time", icon: Clock, ...metricExplanations.TBT, metricData: tech.TBT })}
                />
              )}

              {tech.SI && (
                <MetricCard
                  key="SI"
                  title="Speed Index"
                  icon={Gauge}
                  metricData={tech.SI}
                  selectedSource="lab"
                  darkMode={darkMode}
                  isOpen={!!expandedDetails.SI}
                  onToggle={() => toggleDetails('SI')}
                  description={metricExplanations.SI.whatThisParameterIs}
                  whyItMatters={metricExplanations.SI.whyItMatters}
                  onInfoClick={() => setSelectedParameterInfo({ title: "Speed Index", icon: Gauge, ...metricExplanations.SI, metricData: tech.SI })}
                />
              )}
            </Section>

            {/* Assets & Optimization */}
            <Section title="Assets & Optimization" subtitle="Optimization checks" icon={Server} darkMode={darkMode} shouldAlignStart={isAssetsExpanded}>
              {tech.Compression && (
                <OptimizationCard
                  icon={FileCode}
                  title="Text Compression"
                  metricData={tech.Compression}
                  darkMode={darkMode}
                  isOpen={expandedDetails.compression}
                  onToggle={() => toggleDetails('compression')}
                  description={metricExplanations.Compression.whatThisParameterIs}
                  whyItMatters={metricExplanations.Compression.whyItMatters}
                  onInfoClick={() => setSelectedParameterInfo({ title: "Text Compression", icon: FileCode, ...metricExplanations.Compression, metricData: tech.Compression })}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                      <div className="flex justify-between items-center">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overall Score</p>
                        <ScoreBadge status={tech.Compression.status} value={tech.Compression.value} darkMode={darkMode} />
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl border ${darkMode ? "bg-emerald-900/10 border-emerald-800/30" : "bg-emerald-50 border-emerald-100"}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Compressed</p>
                      <p className={`text-xl font-black ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>{tech.Compression.compressedCount || 0}</p>
                    </div>
                    <div className={`p-3 rounded-xl border ${darkMode ? "bg-rose-900/10 border-rose-800/30" : "bg-rose-50 border-rose-100"}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Uncompressed</p>
                      <p className={`text-xl font-black ${darkMode ? "text-rose-300" : "text-rose-700"}`}>{tech.Compression.uncompressedResourcesCount || 0}</p>
                    </div>
                  </div>
                </OptimizationCard>
              )}

              {tech.Caching && (
                <OptimizationCard
                  icon={Database}
                  title="Caching Policy"
                  metricData={tech.Caching}
                  darkMode={darkMode}
                  isOpen={expandedDetails.caching}
                  onToggle={() => toggleDetails('caching')}
                  description={metricExplanations.Caching.whatThisParameterIs}
                  whyItMatters={metricExplanations.Caching.whyItMatters}
                  onInfoClick={() => setSelectedParameterInfo({ title: "Caching Policy", icon: Database, ...metricExplanations.Caching, metricData: tech.Caching })}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                      <div className="flex justify-between items-center">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overall Score</p>
                        <ScoreBadge status={tech.Caching.status} value={tech.Caching.value} darkMode={darkMode} />
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl border ${darkMode ? "bg-emerald-900/10 border-emerald-800/30" : "bg-emerald-50 border-emerald-100"}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Cached</p>
                      <p className={`text-xl font-black ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>{tech.Caching.cachedCount || 0}</p>
                    </div>
                    <div className={`p-3 rounded-xl border ${darkMode ? "bg-rose-900/10 border-rose-800/30" : "bg-rose-50 border-rose-100"}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Uncached</p>
                      <p className={`text-xl font-black ${darkMode ? "text-rose-300" : "text-rose-700"}`}>{tech.Caching.uncachedResourcesCount || 0}</p>
                    </div>
                  </div>
                </OptimizationCard>
              )}


              {tech.Redirect_Chains && (
                <OptimizationCard
                  icon={ArrowRightLeft}
                  title="Redirect Chains"
                  metricData={tech.Redirect_Chains}
                  darkMode={darkMode}
                  isOpen={expandedDetails.redirectChains}
                  onToggle={() => toggleDetails('redirectChains')}
                  description={metricExplanations.Redirect_Chains.whatThisParameterIs}
                  whyItMatters={metricExplanations.Redirect_Chains.whyItMatters}
                  onInfoClick={() => setSelectedParameterInfo({ title: "Redirect Chains", icon: ArrowRightLeft, ...metricExplanations.Redirect_Chains, metricData: tech.Redirect_Chains })}
                  displayValue={`${tech.Redirect_Chains.hops} hops`}
                >
                  <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Hops</p>
                        <ScoreBadge
                          status={tech.Redirect_Chains.hops <= 1 ? "good" : "poor"}
                          value={tech.Redirect_Chains.hops}
                          darkMode={darkMode}
                        />
                      </div>

                      {tech.Redirect_Chains.redirectDetails && tech.Redirect_Chains.redirectDetails.length > 0 && (
                        <div className="pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Redirect Path</p>
                          <div className="flex flex-col gap-2">
                            {tech.Redirect_Chains.redirectDetails.map((url, idx) => (
                              <div key={idx} className="flex flex-col items-start">
                                <div className="flex items-center gap-2 w-full">
                                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${idx === tech.Redirect_Chains.redirectDetails.length - 1 ? "bg-emerald-500" : "bg-blue-500"}`} />
                                  <p className={`text-[10px] font-mono truncate flex-grow ${darkMode ? "text-gray-300" : "text-gray-600"}`} title={url}>
                                    {url}
                                  </p>
                                </div>
                                {idx < tech.Redirect_Chains.redirectDetails.length - 1 && (
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
                </OptimizationCard>
              )}

              {tech.Render_Blocking && (
                <OptimizationCard
                  icon={AlertTriangle}
                  title="Render-Blocking"
                  metricData={tech.Render_Blocking}
                  darkMode={darkMode}
                  isOpen={expandedDetails.renderBlocking}
                  onToggle={() => toggleDetails('renderBlocking')}
                  description={metricExplanations.Render_Blocking.whatThisParameterIs}
                  whyItMatters={metricExplanations.Render_Blocking.whyItMatters}
                  onInfoClick={() => setSelectedParameterInfo({ title: "Render-Blocking", icon: AlertTriangle, ...metricExplanations.Render_Blocking, metricData: tech.Render_Blocking })}
                  displayValue={tech.Render_Blocking.blockingCount === 0 ? "None" : `${tech.Render_Blocking.blockingCount} items`}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                      <div className="flex justify-between items-center">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overall Score</p>
                        <ScoreBadge status={tech.Render_Blocking.status} value={tech.Render_Blocking.value} darkMode={darkMode} />
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl border ${darkMode ? "bg-rose-900/10 border-rose-800/30" : "bg-rose-50 border-rose-100"}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Blocking</p>
                      <p className={`text-xl font-black ${darkMode ? "text-rose-300" : "text-rose-700"}`}>{tech.Render_Blocking.blockingCount || 0}</p>
                    </div>
                    <div className={`p-3 rounded-xl border ${darkMode ? "bg-blue-900/10 border-blue-800/30" : "bg-blue-50 border-blue-100"}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Target</p>
                      <p className={`text-xl font-black ${darkMode ? "text-blue-300" : "text-blue-700"}`}>0</p>
                    </div>
                  </div>
                </OptimizationCard>
              )}

              {tech.Resource_Optimization && (
                <OptimizationCard
                  fullWidth={true}
                  icon={ImageIcon}
                  title="Resource Optimization"
                  metricData={tech.Resource_Optimization}
                  darkMode={darkMode}
                  isOpen={expandedDetails.resourceOptimization}
                  onToggle={() => toggleDetails('resourceOptimization')}
                  description={metricExplanations.Resource_Optimization.whatThisParameterIs}
                  whyItMatters={metricExplanations.Resource_Optimization.whyItMatters}
                  onInfoClick={() => setSelectedParameterInfo({ title: "Resource Optimization", icon: ImageIcon, ...metricExplanations.Resource_Optimization, metricData: tech.Resource_Optimization })}
                  displayValue={tech.Resource_Optimization.status === "good" ? "Optimized" : "Needs Work"}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border sm:col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                      <div className="flex justify-between items-center">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overall Score</p>
                        <ScoreBadge status={tech.Resource_Optimization.status} value={tech.Resource_Optimization.value} darkMode={darkMode} />
                      </div>
                    </div>
                    {/* Images Stats Group */}
                    <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                      <div className="flex justify-between items-center mb-3">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Images</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                          {tech.Resource_Optimization.totalImages || 0} Total
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={`text-[11px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Optimized</span>
                          <span className={`text-xs font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{tech.Resource_Optimization.optimizedImagesCount || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-[11px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Heavy/Large</span>
                          <span className={`text-xs font-bold ${darkMode ? "text-rose-400" : "text-rose-600"}`}>{tech.Resource_Optimization.unoptimizedImagesCount || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Scripts Stats Group */}
                    <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                      <div className="flex justify-between items-center mb-3">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Scripts</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                          {tech.Resource_Optimization.totalScripts || 0} Total
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={`text-[11px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Minified</span>
                          <span className={`text-xs font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{tech.Resource_Optimization.minifiedScriptsCount || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-[11px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Unminified</span>
                          <span className={`text-xs font-bold ${darkMode ? "text-rose-400" : "text-rose-600"}`}>{tech.Resource_Optimization.unminifiedScriptsCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </OptimizationCard>
              )}



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