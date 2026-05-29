import React, { useContext } from "react";
import UrlHeader from "../Component/UrlHeader";
import ReportRestrictionWrapper from "../Component/ReportRestrictionWrapper";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  Activity, Zap, Layout, Image as ImageIcon,
  Server, Database, FileCode, Globe,
  ArrowRightLeft, Clock, Gauge, AlertTriangle,
  Info, ChevronDown, Sparkles, Briefcase
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

const scoreCalculationInfo = InfoDetails.Technical_Performance_Methodology;
const metricExplanations = InfoDetails;

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

const Technical_Performance_Inner = React.memo(({ data, loading, darkMode }) => {
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const [selectedSource, setSelectedSource] = React.useState("lab");
  const [expandedDetails, setExpandedDetails] = React.useState({});
  const toggleDetails = (metric) => setExpandedDetails(prev => ({ ...prev, [metric]: !prev[metric] }));

  const isCoreExpanded = expandedDetails.LCP || expandedDetails.INP || expandedDetails.CLS || expandedDetails.FCP || expandedDetails.TTFB;
  const isLabExpanded = expandedDetails.TBT || expandedDetails.SI;
  const isAssetsExpanded = expandedDetails.compression || expandedDetails.caching || expandedDetails.redirectChains || expandedDetails.renderBlocking || expandedDetails.resourceOptimization;

  const metric = data || {};
  const tech = metric.technicalPerformance || {};
  const overallScore = tech?.Percentage || 0;
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";

  return (
    <div className={`w-full min-h-screen ${mainBg} transition-colors duration-300 relative overflow-hidden`}>
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none overflow-hidden">
        <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[120px] opacity-20 ${darkMode ? "bg-blue-600" : "bg-blue-400"}`}></div>
        <div className={`absolute top-48 -right-24 w-80 h-80 rounded-full blur-[100px] opacity-15 ${darkMode ? "bg-indigo-600" : "bg-indigo-400"}`}></div>
        <div className={`absolute -bottom-12 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 rounded-full blur-[150px] opacity-5 ${darkMode ? "bg-purple-600" : "bg-purple-400"}`}></div>
      </div>

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-4"} pb-16 space-y-6 relative z-10`}>

        {/* ✅ Card 1: URL Header Card */}
        <div className={`rounded-[2.5rem] overflow-hidden transition-all duration-500 transform hover:shadow-2xl ${darkMode ? "bg-slate-900/40 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-black/40" : "bg-white/60 backdrop-blur-xl border border-slate-200 shadow-2xl shadow-slate-200/40"}`}>
          <UrlHeader
            data={data}
            darkMode={darkMode}
            sectionName="Technical Performance"
            sectionData={tech}
            auditScore={overallScore}
            hideBorder={true}
          />
        </div>

        <div className={`rounded-[2.5rem] overflow-hidden transition-all duration-500 transform hover:shadow-2xl ${darkMode ? "bg-slate-900/40 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-black/40" : "bg-white/60 backdrop-blur-xl border border-slate-200 shadow-2xl shadow-slate-200/40"}`}>
          {loading || !data?.technicalPerformance ? (
            <div className={`flex flex-col xl:flex-row ${data?.report === "All" ? "" : "min-h-[300px]"}`}>
              {/* Left Panel: Live Preview (Only if not All) */}
              {data?.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden backdrop-blur-md ${darkMode ? "bg-slate-955/40 border-slate-800" : "bg-white/40 border-white/20"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10 hover:scale-[1.02] transition-transform duration-500">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}
              {/* Right Panel: Shimmer */}
              <div className="flex-1 flex flex-col justify-center">
                <AuditShimmer darkMode={darkMode} loading={loading} data={data} auditSteps={AUDIT_STEPS} />
              </div>
            </div>
          ) : (
            <div className={`flex flex-col xl:flex-row ${data?.report === "All" ? "" : "min-h-[300px]"}`}>

              {/* Left Panel: Live Preview (Only if not All) */}
              {data?.report !== "All" && (
                <div className={`w-full xl:w-[45%] ${data?.report === "All" ? "p-6 lg:p-10" : "p-3 lg:p-4"} flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden backdrop-blur-md ${darkMode ? "bg-slate-955/40 border-slate-800" : "bg-white/40 border-white/20"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none animate-pulse duration-[10000ms]"></div>
                  <div className="w-full relative z-10 hover:scale-[1.02] transition-transform duration-500">
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
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] fontsemibold uppercase tracking-wider animate-in fade-in slide-in-from-left-4 duration-500 ${darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]" : "bg-blue-100/50 text-blue-600 border border-blue-200"}`}>
                          <Activity className="w-3.5 h-3.5 animate-pulse" />
                          <span>Performance Audit</span>
                        </div>
                        <h3 className={`${data?.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight animate-in fade-in slide-in-from-left-6 duration-700 delay-75 ${darkMode ? "text-white" : "text-slate-900"}`}>
                          Technical <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">Performance</span>
                        </h3>
                        <p className={`text-sm leading-relaxed opacity-70 animate-in fade-in slide-in-from-left-8 duration-700 delay-150 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                          Core vitals and speed configurations analysis for a faster user experience.
                        </p>
                      </div>

                      {/* Stats & Tools */}
                      <div className={`flex flex-wrap items-center ${data?.report === "All" ? "gap-6" : "gap-5"}`}>
                        <StatusSummary tech={tech} className={data?.report === "All" ? "gap-5" : "gap-4"} />
                        <div className={`w-px h-4 ${darkMode ? "bg-slate-800" : "bg-slate-200 hidden md:block"}`}></div>
                        <button
                          onClick={() => setSelectedMetricInfo(scoreCalculationInfo)}
                          className={`group flex items-center gap-2 px-4 py-1.5 rounded-full text-xs fontsemibold transition-all duration-300 border ${darkMode ? "bg-slate-800/50 border-slate-700 hover:border-blue-500/50 text-blue-400 hover:text-blue-300 shadow-lg shadow-blue-500/5" : "bg-blue-50 border-blue-100 hover:border-blue-300 text-blue-600 shadow-sm"}`}
                        >
                          <Info size={14} className="transition-transform group-hover:rotate-12" />
                          <span>Methodology</span>
                        </button>
                      </div>
                    </div>

                    {/* Circular Progress */}
                    <div className="relative flex-shrink-0 group cursor-default order-1 md:order-2 animate-in zoom-in duration-1000 delay-300">
                      <div className={`absolute -inset-10 rounded-full blur-[40px] opacity-30 transition-all duration-700 group-hover:opacity-50 group-hover:blur-[60px] ${overallScore >= 80 ? "bg-emerald-500" : overallScore >= 50 ? "bg-amber-500" : "bg-rose-500"}`}></div>
                      <div className="relative z-10">
                        <CircularProgress value={overallScore} size={data?.report === "All" ? 200 : 160} stroke={16} />
                        <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                          <span className={`text-4xl ${data?.report === "All" ? "lg:text-6xl" : "lg:text-5xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{overallScore}%</span>
                          <span className="text-[11px] fontsemibold uppercase tracking-[0.25em] opacity-40">SCORE</span>
                        </div>
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
          <ReportRestrictionWrapper>
            <div className="space-y-8">
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
                      className={`px-3 py-1.5 text-xs fontsemibold rounded-md transition-all ${selectedSource === "lab" ? (darkMode ? "bg-blue-600 text-white shadow-sm" : "bg-blue-50 text-blue-600 shadow-sm") : (darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700")}`}
                    >
                      Lab Data
                    </button>
                    <button
                      onClick={() => setSelectedSource("field")}
                      className={`px-3 py-1.5 text-xs fontsemibold rounded-md transition-all ${selectedSource === "field" ? (darkMode ? "bg-blue-600 text-white shadow-sm" : "bg-blue-50 text-blue-600 shadow-sm") : (darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700")}`}
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
                    title="Speed Index (SI)"
                    description={tech.SI.details || "Measures visual loading progression rates during screen paint."}
                    score={tech.SI.score || 0}
                    status={tech.SI.status || "fail"}
                    analysis={tech.SI.analysis}
                    meta={tech.SI.meta}
                    darkMode={darkMode}
                    icon={Activity}
                    type="SI"
                    className={expandedDetails.SI ? "md:col-span-2" : ""}
                    onInfo={setSelectedParameterInfo}
                  />
                )}
              </Section>

              {/* Category 3: Asset & Optimizations (Gated) */}
              <ReportRestrictionWrapper>
                <div className="space-y-12">
                  <Section title="Asset Distribution & Code Delivery Optimizations" icon={Sparkles} darkMode={darkMode}>
                    {tech.Compression && (
                      <OptimizationCard
                        icon={Briefcase}
                        title="Asset Compression Status"
                        metricData={tech.Compression}
                        darkMode={darkMode}
                        isOpen={expandedDetails.compression}
                        onToggle={() => toggleDetails('compression')}
                        description={metricExplanations.Compression.whatThisParameterIs}
                        whyItMatters={metricExplanations.Compression.whyItMatters}
                        onInfoClick={() => setSelectedParameterInfo({ title: "Asset Compression Status", icon: Briefcase, ...metricExplanations.Compression, metricData: tech.Compression })}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                              <div className="flex justify-between items-center">
                                <p className={`text-[10px] fontsemibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overall Score</p>
                                <ScoreBadge status={tech.Compression.status} value={tech.Compression.meta?.value} darkMode={darkMode} />
                              </div>
                            </div>
                            <div className={`p-3 rounded-xl border ${darkMode ? "bg-emerald-900/10 border-emerald-800/30" : "bg-emerald-50 border-emerald-100"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Compressed</p>
                              <p className={`text-xl font-black ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>{tech.Compression.meta?.compressedCount}</p>
                            </div>
                            <div className={`p-3 rounded-xl border ${darkMode ? "bg-rose-900/10 border-rose-800/30" : "bg-rose-50 border-rose-100"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Uncompressed</p>
                              <p className={`text-xl font-black ${darkMode ? "text-rose-300" : "text-rose-700"}`}>{tech.Compression.meta?.uncompressedCount}</p>
                            </div>
                          </div>

                          {tech.Compression.meta?.uncompressedResources && tech.Compression.meta.uncompressedResources.length > 0 && (
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Uncompressed Resources</p>
                              <div className="flex flex-col gap-2">
                                {tech.Compression.meta.uncompressedResources.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <p className={`text-[10px] truncate max-w-[70%] font-mono ${darkMode ? "text-gray-300" : "text-gray-600"}`} title={item.url}>
                                      {item.fileName || item.url}
                                    </p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${darkMode ? "bg-rose-900/20 text-rose-400" : "bg-rose-100 text-rose-600"}`}>
                                      Encoding: {item.currentEncoding || 'None'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                              <div className="flex justify-between items-center">
                                <p className={`text-[10px] fontsemibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overall Score</p>
                                <ScoreBadge status={tech.Caching.status} value={tech.Caching.meta?.value} darkMode={darkMode} />
                              </div>
                            </div>
                            <div className={`p-3 rounded-xl border ${darkMode ? "bg-emerald-900/10 border-emerald-800/30" : "bg-emerald-50 border-emerald-100"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Cached</p>
                              <p className={`text-xl font-black ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>{tech.Caching.meta?.cachedCount}</p>
                            </div>
                            <div className={`p-3 rounded-xl border ${darkMode ? "bg-rose-900/10 border-rose-800/30" : "bg-rose-50 border-rose-100"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Uncached</p>
                              <p className={`text-xl font-black ${darkMode ? "text-rose-300" : "text-rose-700"}`}>{tech.Caching.meta?.uncachedCount}</p>
                            </div>
                          </div>

                          {tech.Caching.meta?.uncachedResources && tech.Caching.meta.uncachedResources.length > 0 && (
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Uncached Resources</p>
                              <div className="flex flex-col gap-2">
                                {tech.Caching.meta.uncachedResources.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <p className={`text-[10px] truncate max-w-[70%] font-mono ${darkMode ? "text-gray-300" : "text-gray-600"}`} title={item.url}>
                                      {item.fileName || item.url}
                                    </p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${darkMode ? "bg-rose-900/20 text-rose-400" : "bg-rose-100 text-rose-600"}`}>
                                      Policy: {item.cachePolicy || 'None'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
                        displayValue={`${tech.Redirect_Chains.meta?.hops} hops`}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                              <div className="flex justify-between items-center">
                                <p className={`text-[10px] fontsemibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overall Score</p>
                                <ScoreBadge status={tech.Redirect_Chains.status} value={tech.Redirect_Chains.meta?.value} darkMode={darkMode} />
                              </div>
                            </div>
                            <div className={`p-3 rounded-xl border ${darkMode ? "bg-emerald-900/10 border-emerald-800/30" : "bg-emerald-50 border-emerald-100"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Total Redirects</p>
                              <p className={`text-xl font-black ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>{tech.Redirect_Chains.meta?.redirectsCount}</p>
                            </div>
                            <div className={`p-3 rounded-xl border ${darkMode ? "bg-rose-900/10 border-rose-800/30" : "bg-rose-50 border-rose-100"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Redirect Duration</p>
                              <p className={`text-xl font-black ${darkMode ? "text-rose-300" : "text-rose-700"}`}>{tech.Redirect_Chains.meta?.redirectTime}ms</p>
                            </div>
                          </div>

                          {tech.Redirect_Chains.meta?.redirectChains && tech.Redirect_Chains.meta.redirectChains.length > 0 && (
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Redirect Chains</p>
                              <div className="flex flex-col gap-2">
                                {tech.Redirect_Chains.meta.redirectChains.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <p className={`text-[10px] truncate max-w-[70%] font-mono ${darkMode ? "text-gray-300" : "text-gray-600"}`} title={item.url}>
                                      {item.fileName || item.url}
                                    </p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${darkMode ? "bg-rose-900/20 text-rose-400" : "bg-rose-100 text-rose-600"}`}>
                                      Chain Type: {item.redirectType || '302'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </OptimizationCard>
                    )}

                    {tech.Render_Blocking && (
                      <OptimizationCard
                        icon={Server}
                        title="Render Blocking"
                        metricData={tech.Render_Blocking}
                        darkMode={darkMode}
                        isOpen={expandedDetails.renderBlocking}
                        onToggle={() => toggleDetails('renderBlocking')}
                        description={metricExplanations.Render_Blocking.whatThisParameterIs}
                        whyItMatters={metricExplanations.Render_Blocking.whyItMatters}
                        onInfoClick={() => setSelectedParameterInfo({ title: "Render Blocking", icon: Server, ...metricExplanations.Render_Blocking, metricData: tech.Render_Blocking })}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                              <div className="flex justify-between items-center">
                                <p className={`text-[10px] fontsemibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overall Score</p>
                                <ScoreBadge status={tech.Render_Blocking.status} value={tech.Render_Blocking.meta?.value} darkMode={darkMode} />
                              </div>
                            </div>
                            <div className={`p-3 rounded-xl border ${darkMode ? "bg-emerald-900/10 border-emerald-800/30" : "bg-emerald-50 border-emerald-100"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Scripts</p>
                              <p className={`text-xl font-black ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>{tech.Render_Blocking.meta?.renderBlockingCount}</p>
                            </div>
                            <div className={`p-3 rounded-xl border ${darkMode ? "bg-rose-900/10 border-rose-800/30" : "bg-rose-50 border-rose-100"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Total Size</p>
                              <p className={`text-xl font-black ${darkMode ? "text-rose-300" : "text-rose-700"}`}>{tech.Render_Blocking.meta?.renderBlockingTime}ms</p>
                            </div>
                          </div>

                          {tech.Render_Blocking.meta?.renderBlockingResources && tech.Render_Blocking.meta.renderBlockingResources.length > 0 && (
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Blocking Resources</p>
                              <div className="flex flex-col gap-2">
                                {tech.Render_Blocking.meta.renderBlockingResources.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <p className={`text-[10px] truncate max-w-[70%] font-mono ${darkMode ? "text-gray-300" : "text-gray-600"}`} title={item.url}>
                                      {item.fileName || item.url}
                                    </p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${darkMode ? "bg-rose-900/20 text-rose-400" : "bg-rose-100 text-rose-600"}`}>
                                      Size: {((item.savingBytes || 0) / 1024).toFixed(1)} KB
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </OptimizationCard>
                    )}

                    {tech.Resource_Optimization && (
                      <OptimizationCard
                        icon={ImageIcon}
                        title="Resource Optimization"
                        metricData={tech.Resource_Optimization}
                        darkMode={darkMode}
                        isOpen={expandedDetails.resourceOptimization}
                        onToggle={() => toggleDetails('resourceOptimization')}
                        description={metricExplanations.Resource_Optimization.whatThisParameterIs}
                        whyItMatters={metricExplanations.Resource_Optimization.whyItMatters}
                        onInfoClick={() => setSelectedParameterInfo({ title: "Resource Optimization", icon: ImageIcon, ...metricExplanations.Resource_Optimization, metricData: tech.Resource_Optimization })}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                              <div className="flex justify-between items-center">
                                <p className={`text-[10px] fontsemibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overall Score</p>
                                <ScoreBadge status={tech.Resource_Optimization.status} value={tech.Resource_Optimization.meta?.value} darkMode={darkMode} />
                              </div>
                            </div>
                            {/* Images Stats Group */}
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                              <div className="flex justify-between items-center mb-3">
                                <p className={`text-[10px] fontsemibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Images</p>
                                <span className={`text-[10px] fontsemibold px-2 py-0.5 rounded-full ${darkMode ? "bg-emerald-900/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                                  {tech.Resource_Optimization.meta?.totalImages || 0} Total
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className={`text-[11px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Optimized</span>
                                  <span className={`text-xs fontsemibold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{tech.Resource_Optimization.meta?.optimizedImagesCount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={`text-[11px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Heavy/Large</span>
                                  <span className={`text-xs fontsemibold ${darkMode ? "text-rose-400" : "text-rose-600"}`}>{tech.Resource_Optimization.meta?.unoptimizedImagesCount || 0}</span>
                                </div>
                              </div>
                            </div>

                            {/* Scripts Stats Group */}
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                              <div className="flex justify-between items-center mb-3">
                                <p className={`text-[10px] fontsemibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Scripts</p>
                                <span className={`text-[10px] fontsemibold px-2 py-0.5 rounded-full ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                                  {tech.Resource_Optimization.meta?.totalScripts || 0} Total
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className={`text-[11px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Minified</span>
                                  <span className={`text-xs fontsemibold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{tech.Resource_Optimization.meta?.minifiedScriptsCount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={`text-[11px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Unminified</span>
                                  <span className={`text-xs fontsemibold ${darkMode ? "text-rose-400" : "text-rose-600"}`}>{tech.Resource_Optimization.meta?.unminifiedScriptsCount || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </OptimizationCard>
                    )}
                  </Section>
                </div>
              </ReportRestrictionWrapper>
            </div>
          </ReportRestrictionWrapper>
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
});

export default function Technical_Performance({ data: propData, loading: propLoading, darkMode: propDarkMode }) {
  const contextData = useData();
  const { theme } = React.useContext(ThemeContext);

  const data = propData !== undefined ? propData : contextData.data;
  const loading = propLoading !== undefined ? propLoading : contextData.loading;
  const darkMode = propDarkMode !== undefined ? propDarkMode : (theme === "dark");

  return <Technical_Performance_Inner data={data} loading={loading} darkMode={darkMode} />;
}