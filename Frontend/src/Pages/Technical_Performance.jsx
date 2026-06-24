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
  Info, ChevronDown, Sparkles, Briefcase, MousePointerClick, Car, Wrench,
  Smartphone, Layers, Cpu
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import { InfoDetails } from "../Component/InfoDetails";
import { isVisibleForAudience } from "../config/parameterAudience";

import MetricCard from "../Component/reusablecomponent/MetricCard";
import { NotCalculatedNote, AffectedList } from "../Component/reusablecomponent/MetricExtras";
import StatusSummary from "../Component/reusablecomponent/StatusSummary";
import { AuditShimmer } from "../Component/reusablecomponent/AuditShimmer";

import Section from "../Component/reusablecomponent/Section";
import OptimizationCard from "../Component/reusablecomponent/OptimizationCard";
import ScoreBadge from "../Component/reusablecomponent/ScoreBadge";
import { statusText, scoreToStatus, statusSolidBg } from "../utils/statusColors";

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
  {
    icon: <Car className="w-8 h-8 text-cyan-500" />,
    title: "Inventory Page Load",
    text: "Locating your vehicle inventory page (sitemap or crawl) and timing it until it is fully loaded..."
  },
  {
    icon: <Wrench className="w-8 h-8 text-orange-500" />,
    title: "Service Page Load",
    text: "Locating your service department page (sitemap or crawl) and timing it until it is fully loaded..."
  },
];

const Technical_Performance_Inner = React.memo(({ data, loading, darkMode }) => {
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  // Core Web Vitals always display real-user (field/CrUX) data; lab is only a fallback inside MetricCard
  const selectedSource = "field";
  const [expandedDetails, setExpandedDetails] = React.useState({});
  const toggleDetails = (metric) => setExpandedDetails(prev => ({ ...prev, [metric]: !prev[metric] }));

  const isCoreExpanded = expandedDetails.LCP || expandedDetails.INP || expandedDetails.FID || expandedDetails.CLS || expandedDetails.FCP || expandedDetails.TTFB;
  const isLabExpanded = expandedDetails.TBT || expandedDetails.SI || expandedDetails.inventoryLoad || expandedDetails.serviceLoad;
  const isAssetsExpanded = expandedDetails.compression || expandedDetails.caching || expandedDetails.redirectChains || expandedDetails.renderBlocking || expandedDetails.resourceOptimization;
  const isMobileExpanded = expandedDetails.pageSpeedScore || expandedDetails.mobileUsability || expandedDetails.mobileLoadSpeed || expandedDetails.renderingPerformance;
  const isScriptExpanded = expandedDetails.lazyLoading || expandedDetails.thirdPartyOptimization || expandedDetails.jsExecution;

  // 👥 Dealer/Developer audience filtering (presentation-only; scores unchanged)
  const { audienceMode } = useData();

  const metric = data || {};
  const tech = metric.technicalPerformance || {};
  const overallScore = tech?.Percentage || 0;
  const mainBg = darkMode ? "bg-gray-900" : "bg-surface";

  const anyVisible = (keys) => keys.some((k) => tech[k] && isVisibleForAudience(k, audienceMode));
  const coreVisible = anyVisible(['LCP', 'INP', 'FID', 'CLS', 'FCP', 'TTFB']);
  const labVisible = anyVisible(['TBT', 'Inventory_Load_Time', 'Service_Load_Time', 'SI']);
  const assetsVisible = anyVisible(['Compression', 'Caching', 'Redirect_Chains', 'Render_Blocking', 'Resource_Optimization']);

  return (
    <div className={`w-full min-h-screen ${mainBg} transition-colors duration-300 relative overflow-hidden`}>
      {/* Background Decorative Elements */}
     

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-4"} pb-10 space-y-6 relative z-10`}>

        {/* ✅ Card 1: URL Header Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
          <UrlHeader
            data={data}
            darkMode={darkMode}
            sectionName="Technical Performance"
            sectionData={tech}
            auditScore={overallScore}
            hideBorder={true}
          />
        </div>

        {/* ✅ Card 2: Overview / Preview Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
            {loading || !data?.technicalPerformance ? (
            <div className={`flex flex-col xl:flex-row ${data?.report === "All" ? "" : "min-h-[300px]"}`}>
              {/* Left Panel: Live Preview (Only if not All) */}
              {data?.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden backdrop-blur-md ${darkMode ? "bg-slate-955/40 border-slate-800" : "bg-card border-line"}`}>
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
                <div className={`w-full xl:w-[45%] ${data?.report === "All" ? "p-6 lg:p-10" : "p-3 lg:p-4"} flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden backdrop-blur-md ${darkMode ? "bg-slate-955/40 border-slate-800" : "bg-card border-line"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none animate-pulse duration-[10000ms]"></div>
                  <div className="w-full relative z-10 hover:scale-[1.02] transition-transform duration-500">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              {/* Right Panel: Metrics & Score */}
              <div className={`flex-1 ${data?.report === "All" ? "px-6 pb-4 pt-2 lg:px-10 lg:pt-2" : "px-6 pb-4 pt-4 lg:px-12 lg:pt-6"} flex flex-col justify-center`}>
                <div className={`w-full ${data?.report === "All" ? "" : "max-w-2xl mx-auto"} ${data?.report === "All" ? "space-y-7" : "space-y-6"}`}>

                  {/* Top Content Area */}
                  <div className={`flex flex-col md:flex-row items-center ${data?.report === "All" ? "gap-7 md:gap-9 justify-between" : "gap-8 md:gap-8 justify-center"}`}>

                    {/* Text Content */}
                    <div className={`flex-1 ${data?.report === "All" ? "space-y-5" : "space-y-4"} text-left order-2 md:order-1`}>
                      <div className={`${data?.report === "All" ? "space-y-2" : "space-y-1.5"}`}>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider animate-in fade-in slide-in-from-left-4 duration-500 ${darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]" : "bg-accentsoft text-accent border border-accent/20"}`}>
                          <Activity className="w-3.5 h-3.5 animate-pulse" />
                          <span>Performance Audit</span>
                        </div>
                        <h3 className={`${data?.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight animate-in fade-in slide-in-from-left-6 duration-700 delay-75 ${darkMode ? "text-white" : "text-ink"}`}>
                          Technical <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">Performance</span>
                        </h3>
                        <p className={`text-sm leading-relaxed opacity-70 animate-in fade-in slide-in-from-left-8 duration-700 delay-150 ${darkMode ? "text-slate-300" : "text-muted"}`}>
                          Core vitals and speed configurations analysis for a faster user experience.
                        </p>
                        {/* Confidence (spec §0.5): tell the user whether Core Web Vitals came
                            from real users (CrUX field) or are a lab estimate, so the score is
                            never over-claimed as real-world when it isn't. */}
                        {tech.Confidence && (
                          <span
                            title={tech.Confidence === "field"
                              ? "Core Web Vitals scored from real-user field data (Chrome UX Report, p75)."
                              : "No real-user field data for this site — Core Web Vitals are scored from a single lab run (estimate)."}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                              tech.Confidence === "field"
                                ? (darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-600 border-emerald-100")
                                : (darkMode ? "bg-amber-900/30 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-600 border-amber-100")
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${tech.Confidence === "field" ? "bg-emerald-500" : "bg-amber-500"}`} />
                            {tech.Confidence === "field" ? "Real-user field data" : "Lab estimate · no field data"}
                          </span>
                        )}
                      </div>

                      {/* Stats & Tools */}
                      <div className={`flex flex-wrap items-center ${data?.report === "All" ? "gap-6" : "gap-5"}`}>
                        <StatusSummary tech={tech} className={data?.report === "All" ? "gap-5" : "gap-4"} />
                        <div className={`w-px h-4 ${darkMode ? "bg-slate-800" : "bg-line hidden md:block"}`}></div>
                        <button
                          onClick={() => setSelectedMetricInfo(scoreCalculationInfo)}
                          className={`group flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border ${darkMode ? "bg-slate-800/50 border-slate-700 hover:border-blue-500/50 text-blue-400 hover:text-blue-300 shadow-lg shadow-blue-500/5" : "bg-accentsoft border-accent/20 hover:border-accent/40 text-accent shadow-sm"}`}
                        >
                          <Info size={14} className="transition-transform group-hover:rotate-12" />
                          <span>Methodology</span>
                        </button>
                      </div>
                    </div>

                    {/* Circular Progress */}
                    <div className="relative flex-shrink-0 group cursor-default order-1 md:order-2">
                      <div className={`absolute -inset-8 rounded-full blur-3xl opacity-25 transition-opacity duration-700 group-hover:opacity-40 ${statusSolidBg(scoreToStatus(overallScore))}`}></div>
                      <CircularProgress value={overallScore} size={data?.report === "All" ? 180 : 150} stroke={14} />
                      <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                        <span className={`${data?.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>{overallScore}%</span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-50">SCORE</span>
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
            <div className="space-y-6">
              {/* Core Web Vitals */}
              {coreVisible && (
              <Section
                title="Core Web Vitals"
                subtitle="Real User Data"
                icon={Activity}
                darkMode={darkMode}
                shouldAlignStart={isCoreExpanded}
              >
                {tech.LCP && isVisibleForAudience('LCP', audienceMode) && (
                  <MetricCard
                    key="LCP"
                    title="Largest Contentful Paint"
                    icon={Layout}
                    metricData={tech.LCP}
                    paramKey="LCP"
                    selectedSource={selectedSource}
                    darkMode={darkMode}
                    isOpen={!!expandedDetails.LCP}
                    onToggle={() => toggleDetails('LCP')}
                    description={metricExplanations.LCP.whatThisParameterIs}
                    whyItMatters={metricExplanations.LCP.whyItMatters}
                    fallbackCauses={metricExplanations.LCP.actualReasonsForFailure}
                    fallbackRecommendations={metricExplanations.LCP.howToOvercomeFailure}
                    onInfoClick={() => setSelectedParameterInfo({ title: "Largest Contentful Paint", icon: Layout, ...metricExplanations.LCP, metricData: tech.LCP })}
                  />
                )}



                {tech.INP && isVisibleForAudience('INP', audienceMode) && (
                  <MetricCard
                    key="INP"
                    title="Interaction to Next Paint"
                    icon={Activity}
                    metricData={tech.INP}
                    paramKey="INP"
                    selectedSource={selectedSource}
                    darkMode={darkMode}
                    isOpen={!!expandedDetails.INP}
                    onToggle={() => toggleDetails('INP')}
                    description={metricExplanations.INP.whatThisParameterIs}
                    whyItMatters={metricExplanations.INP.whyItMatters}
                    fallbackCauses={metricExplanations.INP.actualReasonsForFailure}
                    fallbackRecommendations={metricExplanations.INP.howToOvercomeFailure}
                    onInfoClick={() => setSelectedParameterInfo({ title: "Interaction to Next Paint", icon: Activity, ...metricExplanations.INP, metricData: tech.INP })}
                  />
                )}

                {tech.FID && isVisibleForAudience('FID', audienceMode) && (
                  <MetricCard
                    key="FID"
                    title="First Input Delay"
                    icon={MousePointerClick}
                    metricData={tech.FID}
                    paramKey="FID"
                    selectedSource={selectedSource}
                    darkMode={darkMode}
                    isOpen={!!expandedDetails.FID}
                    onToggle={() => toggleDetails('FID')}
                    description={metricExplanations.FID.whatThisParameterIs}
                    whyItMatters={metricExplanations.FID.whyItMatters}
                    fallbackCauses={metricExplanations.FID.actualReasonsForFailure}
                    fallbackRecommendations={metricExplanations.FID.howToOvercomeFailure}
                    onInfoClick={() => setSelectedParameterInfo({ title: "First Input Delay", icon: MousePointerClick, ...metricExplanations.FID, metricData: tech.FID })}
                  />
                )}

                {tech.CLS && isVisibleForAudience('CLS', audienceMode) && (
                  <MetricCard
                    key="CLS"
                    title="Cumulative Layout Shift"
                    icon={Layout}
                    metricData={tech.CLS}
                    paramKey="CLS"
                    selectedSource={selectedSource}
                    darkMode={darkMode}
                    isOpen={!!expandedDetails.CLS}
                    onToggle={() => toggleDetails('CLS')}
                    description={metricExplanations.CLS.whatThisParameterIs}
                    whyItMatters={metricExplanations.CLS.whyItMatters}
                    fallbackCauses={metricExplanations.CLS.actualReasonsForFailure}
                    fallbackRecommendations={metricExplanations.CLS.howToOvercomeFailure}
                    onInfoClick={() => setSelectedParameterInfo({ title: "Cumulative Layout Shift", icon: Layout, ...metricExplanations.CLS, metricData: tech.CLS })}
                  />
                )}

                {tech.FCP && isVisibleForAudience('FCP', audienceMode) && (
                  <MetricCard
                    key="FCP"
                    title="First Contentful Paint"
                    icon={Zap}
                    metricData={tech.FCP}
                    paramKey="FCP"
                    selectedSource={selectedSource}
                    darkMode={darkMode}
                    isOpen={!!expandedDetails.FCP}
                    onToggle={() => toggleDetails('FCP')}
                    description={metricExplanations.FCP.whatThisParameterIs}
                    whyItMatters={metricExplanations.FCP.whyItMatters}
                    fallbackCauses={metricExplanations.FCP.actualReasonsForFailure}
                    fallbackRecommendations={metricExplanations.FCP.howToOvercomeFailure}
                    onInfoClick={() => setSelectedParameterInfo({ title: "First Contentful Paint", icon: Zap, ...metricExplanations.FCP, metricData: tech.FCP })}
                  />
                )}

                {tech.TTFB && isVisibleForAudience('TTFB', audienceMode) && (
                  <MetricCard
                    key="TTFB"
                    title="Time To First Byte"
                    icon={Server}
                    metricData={tech.TTFB}
                    paramKey="TTFB"
                    selectedSource={selectedSource}
                    darkMode={darkMode}
                    isOpen={!!expandedDetails.TTFB}
                    onToggle={() => toggleDetails('TTFB')}
                    description={metricExplanations.TTFB.whatThisParameterIs}
                    whyItMatters={metricExplanations.TTFB.whyItMatters}
                    fallbackCauses={metricExplanations.TTFB.actualReasonsForFailure}
                    fallbackRecommendations={metricExplanations.TTFB.howToOvercomeFailure}
                    onInfoClick={() => setSelectedParameterInfo({ title: "Time To First Byte", icon: Server, ...metricExplanations.TTFB, metricData: tech.TTFB })}
                  />
                )}

              </Section>
              )}

              {/* Other Lab Metrics */}
              {labVisible && (
              <Section title="Other Lab Metrics" subtitle="Additional performance indicators" icon={Gauge} darkMode={darkMode} shouldAlignStart={isLabExpanded}>
                {tech.TBT && isVisibleForAudience('TBT', audienceMode) && (
                  <MetricCard
                    key="TBT"
                    title="Total Blocking Time"
                    icon={Clock}
                    metricData={tech.TBT}
                    paramKey="TBT"
                    selectedSource="lab"
                    darkMode={darkMode}
                    isOpen={!!expandedDetails.TBT}
                    onToggle={() => toggleDetails('TBT')}
                    description={metricExplanations.TBT.whatThisParameterIs}
                    whyItMatters={metricExplanations.TBT.whyItMatters}
                    fallbackCauses={metricExplanations.TBT.actualReasonsForFailure}
                    fallbackRecommendations={metricExplanations.TBT.howToOvercomeFailure}
                    onInfoClick={() => setSelectedParameterInfo({ title: "Total Blocking Time", icon: Clock, ...metricExplanations.TBT, metricData: tech.TBT })}
                  />
                )}

                {tech.Inventory_Load_Time && isVisibleForAudience('Inventory_Load_Time', audienceMode) && (
                  <MetricCard
                    key="InventoryLoad"
                    title="Inventory Page Load Time"
                    icon={Car}
                    metricData={tech.Inventory_Load_Time}
                    paramKey="Inventory_Load_Time"
                    selectedSource="lab"
                    darkMode={darkMode}
                    isOpen={!!expandedDetails.inventoryLoad}
                    onToggle={() => toggleDetails('inventoryLoad')}
                    description={metricExplanations.Inventory_Load_Time.whatThisParameterIs}
                    whyItMatters={metricExplanations.Inventory_Load_Time.whyItMatters}
                    fallbackCauses={metricExplanations.Inventory_Load_Time.actualReasonsForFailure}
                    fallbackRecommendations={metricExplanations.Inventory_Load_Time.howToOvercomeFailure}
                    onInfoClick={() => setSelectedParameterInfo({ title: "Inventory Page Load Time", icon: Car, ...metricExplanations.Inventory_Load_Time, metricData: tech.Inventory_Load_Time })}
                  />
                )}

                {tech.Service_Load_Time && isVisibleForAudience('Service_Load_Time', audienceMode) && (
                  <MetricCard
                    key="ServiceLoad"
                    title="Service Page Load Time"
                    icon={Wrench}
                    metricData={tech.Service_Load_Time}
                    paramKey="Service_Load_Time"
                    selectedSource="lab"
                    darkMode={darkMode}
                    isOpen={!!expandedDetails.serviceLoad}
                    onToggle={() => toggleDetails('serviceLoad')}
                    description={metricExplanations.Service_Load_Time.whatThisParameterIs}
                    whyItMatters={metricExplanations.Service_Load_Time.whyItMatters}
                    fallbackCauses={metricExplanations.Service_Load_Time.actualReasonsForFailure}
                    fallbackRecommendations={metricExplanations.Service_Load_Time.howToOvercomeFailure}
                    onInfoClick={() => setSelectedParameterInfo({ title: "Service Page Load Time", icon: Wrench, ...metricExplanations.Service_Load_Time, metricData: tech.Service_Load_Time })}
                  />
                )}

                {tech.SI && isVisibleForAudience('SI', audienceMode) && (
                  <MetricCard
                    key="SI"
                    title="Speed Index (SI)"
                    icon={Activity}
                    metricData={tech.SI}
                    paramKey="SI"
                    selectedSource="lab"
                    darkMode={darkMode}
                    isOpen={!!expandedDetails.SI}
                    onToggle={() => toggleDetails('SI')}
                    description={metricExplanations.SI.whatThisParameterIs}
                    whyItMatters={metricExplanations.SI.whyItMatters}
                    fallbackCauses={metricExplanations.SI.actualReasonsForFailure}
                    fallbackRecommendations={metricExplanations.SI.howToOvercomeFailure}
                    onInfoClick={() => setSelectedParameterInfo({ title: "Speed Index (SI)", icon: Activity, ...metricExplanations.SI, metricData: tech.SI })}
                  />
                )}
              </Section>
              )}

              {/* PageSpeed & AI Agent Readiness */}
              {(tech.PageSpeed_Score || tech.Mobile_Usability || tech.Mobile_Load_Speed || tech.Rendering_Performance) && (
                <Section
                  title="PageSpeed Score"
                  subtitle="Official Lighthouse performance score"
                  icon={Smartphone}
                  darkMode={darkMode}
                  shouldAlignStart={isMobileExpanded}
                >
                  {tech.PageSpeed_Score && (
                    <OptimizationCard
                      icon={Gauge}
                      title="PageSpeed Score"
                      metricData={tech.PageSpeed_Score}
                      paramKey="PageSpeed_Score"
                      darkMode={darkMode}
                      isOpen={expandedDetails.pageSpeedScore}
                      onToggle={() => toggleDetails('pageSpeedScore')}
                      description={metricExplanations.PageSpeed_Score.whatThisParameterIs}
                      whyItMatters={metricExplanations.PageSpeed_Score.whyItMatters}
                      onInfoClick={() => setSelectedParameterInfo({ title: "PageSpeed Score", icon: Gauge, ...metricExplanations.PageSpeed_Score, metricData: tech.PageSpeed_Score })}
                      displayValue={tech.PageSpeed_Score.meta?.value}
                    >
                      {tech.PageSpeed_Score.meta?.notScored ? (
                        <NotCalculatedNote metric={tech.PageSpeed_Score} darkMode={darkMode} />
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${statusText(tech.PageSpeed_Score.meta?.mobileStatus, darkMode, "label")}`}>Mobile</p>
                            <p className={`text-xl font-black ${statusText(tech.PageSpeed_Score.meta?.mobileStatus, darkMode, "value")}`}>{tech.PageSpeed_Score.meta?.mobileScore}</p>
                          </div>
                          <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${statusText(tech.PageSpeed_Score.meta?.desktopStatus, darkMode, "label")}`}>Desktop</p>
                            <p className={`text-xl font-black ${statusText(tech.PageSpeed_Score.meta?.desktopStatus, darkMode, "value")}`}>{tech.PageSpeed_Score.meta?.desktopScore}</p>
                          </div>
                        </div>
                      )}
                    </OptimizationCard>
                  )}



                  {tech.Mobile_Usability && (
                    <OptimizationCard
                      icon={Smartphone}
                      title="Mobile Usability"
                      metricData={tech.Mobile_Usability}
                      darkMode={darkMode}
                      isOpen={expandedDetails.mobileUsability}
                      onToggle={() => toggleDetails('mobileUsability')}
                      description={metricExplanations.Mobile_Usability.whatThisParameterIs}
                      whyItMatters={metricExplanations.Mobile_Usability.whyItMatters}
                      onInfoClick={() => setSelectedParameterInfo({ title: "Mobile Usability", icon: Smartphone, ...metricExplanations.Mobile_Usability, metricData: tech.Mobile_Usability })}
                      displayValue={tech.Mobile_Usability.meta?.value}
                    >
                      {tech.Mobile_Usability.meta?.notScored ? (
                        <NotCalculatedNote metric={tech.Mobile_Usability} darkMode={darkMode} />
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Viewport</p>
                              <p className={`text-sm font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Mobile_Usability.meta?.viewport}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Horizontal Scroll</p>
                              <p className={`text-sm font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Mobile_Usability.meta?.horizontalScroll}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Tap Targets</p>
                              <p className={`text-sm font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Mobile_Usability.meta?.tapTargets}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Legible Fonts</p>
                              <p className={`text-sm font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Mobile_Usability.meta?.legibleFonts}</p>
                            </div>
                          </div>
                          <AffectedList
                            title="Tap Targets Too Small (<44×44px)"
                            items={tech.Mobile_Usability.meta?.smallTapTargets}
                            darkMode={darkMode}
                            renderLabel={(i) => (i.text ? `<${i.tag}> ${i.text}` : `<${i.tag}>`)}
                            renderBadge={(i) => i.size}
                          />
                          <AffectedList
                            title="Elements Overflowing the Screen"
                            items={tech.Mobile_Usability.meta?.overflowingElements}
                            darkMode={darkMode}
                            renderLabel={(i) => (i.cls ? `${i.tag}.${i.cls}` : i.tag)}
                            renderBadge={(i) => `right: ${i.right}px`}
                          />
                        </div>
                      )}
                    </OptimizationCard>
                  )}

                  {tech.Rendering_Performance && (
                    <OptimizationCard
                      icon={Layers}
                      title="Rendering Performance"
                      metricData={tech.Rendering_Performance}
                      paramKey="Rendering_Performance"
                      darkMode={darkMode}
                      isOpen={expandedDetails.renderingPerformance}
                      onToggle={() => toggleDetails('renderingPerformance')}
                      description={metricExplanations.Rendering_Performance.whatThisParameterIs}
                      whyItMatters={metricExplanations.Rendering_Performance.whyItMatters}
                      onInfoClick={() => setSelectedParameterInfo({ title: "Rendering Performance", icon: Layers, ...metricExplanations.Rendering_Performance, metricData: tech.Rendering_Performance })}
                      displayValue={tech.Rendering_Performance.meta?.value}
                    >
                      {tech.Rendering_Performance.meta?.notScored ? (
                        <NotCalculatedNote metric={tech.Rendering_Performance} darkMode={darkMode} />
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Layout Shift (CLS)</p>
                              <p className={`text-xl font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Rendering_Performance.meta?.cls}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Shifting Elements</p>
                              <p className={`text-xl font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Rendering_Performance.meta?.layoutShiftElements}</p>
                            </div>
                            <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Unsized Images</p>
                              <p className={`text-xl font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Rendering_Performance.meta?.unsizedImages}</p>
                            </div>
                          </div>
                          <AffectedList
                            title="Images Missing Width/Height"
                            items={tech.Rendering_Performance.meta?.unsizedImageSamples}
                            darkMode={darkMode}
                            renderLabel={(i) => i.fileName || i.snippet}
                            renderBadge={() => "no dimensions"}
                          />
                        </div>
                      )}
                    </OptimizationCard>
                  )}

                  {tech.Mobile_Load_Speed && (
                    <MetricCard
                      key="MobileLoadSpeed"
                      title="Mobile Load Speed"
                      icon={Clock}
                      metricData={tech.Mobile_Load_Speed}
                      paramKey="Mobile_Load_Speed"
                      selectedSource="lab"
                      darkMode={darkMode}
                      isOpen={!!expandedDetails.mobileLoadSpeed}
                      onToggle={() => toggleDetails('mobileLoadSpeed')}
                      description={metricExplanations.Mobile_Load_Speed.whatThisParameterIs}
                      whyItMatters={metricExplanations.Mobile_Load_Speed.whyItMatters}
                      onInfoClick={() => setSelectedParameterInfo({ title: "Mobile Load Speed", icon: Clock, ...metricExplanations.Mobile_Load_Speed, metricData: tech.Mobile_Load_Speed })}
                    />
                  )}
                </Section>
              )}

              {/* Script & Loading Efficiency */}
              {(tech.Lazy_Loading || tech.Third_Party_Optimization || tech.JS_Execution) && (
                <Section
                  title="Script & Loading Efficiency"
                  subtitle="Third-party scripts, lazy-loading and JS execution"
                  icon={Cpu}
                  darkMode={darkMode}
                  shouldAlignStart={isScriptExpanded}
                >
                  {tech.Third_Party_Optimization && (
                    <OptimizationCard
                      icon={Globe}
                      title="Third-Party Script Optimization"
                      metricData={tech.Third_Party_Optimization}
                      paramKey="Third_Party_Optimization"
                      darkMode={darkMode}
                      isOpen={expandedDetails.thirdPartyOptimization}
                      onToggle={() => toggleDetails('thirdPartyOptimization')}
                      description={metricExplanations.Third_Party_Optimization.whatThisParameterIs}
                      whyItMatters={metricExplanations.Third_Party_Optimization.whyItMatters}
                      onInfoClick={() => setSelectedParameterInfo({ title: "Third-Party Script Optimization", icon: Globe, ...metricExplanations.Third_Party_Optimization, metricData: tech.Third_Party_Optimization })}
                      displayValue={tech.Third_Party_Optimization.meta?.value}
                    >
                      {tech.Third_Party_Optimization.meta?.notScored ? (
                        <NotCalculatedNote metric={tech.Third_Party_Optimization} darkMode={darkMode} />
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Third-Party Scripts</p>
                              <p className={`text-xl font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Third_Party_Optimization.meta?.thirdPartyScripts}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Async / Defer</p>
                              <p className={`text-xl font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Third_Party_Optimization.meta?.asyncDeferCount}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Blocking</p>
                              <p className={`text-xl font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Third_Party_Optimization.meta?.blockingCount}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Main-Thread Block</p>
                              <p className={`text-xl font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Third_Party_Optimization.meta?.thirdPartyBlockingMs}ms</p>
                            </div>
                          </div>
                          <AffectedList
                            title="Synchronous (Blocking) Third-Party Scripts"
                            items={tech.Third_Party_Optimization.meta?.blockingScripts}
                            darkMode={darkMode}
                            renderLabel={(i) => i.fileName || i.url}
                            renderBadge={(i) => i.host}
                          />
                        </div>
                      )}
                    </OptimizationCard>
                  )}

                  {tech.Lazy_Loading && (
                    <OptimizationCard
                      icon={ImageIcon}
                      title="Lazy Loading Implementation"
                      metricData={tech.Lazy_Loading}
                      paramKey="Lazy_Loading"
                      darkMode={darkMode}
                      isOpen={expandedDetails.lazyLoading}
                      onToggle={() => toggleDetails('lazyLoading')}
                      description={metricExplanations.Lazy_Loading.whatThisParameterIs}
                      whyItMatters={metricExplanations.Lazy_Loading.whyItMatters}
                      onInfoClick={() => setSelectedParameterInfo({ title: "Lazy Loading Implementation", icon: ImageIcon, ...metricExplanations.Lazy_Loading, metricData: tech.Lazy_Loading })}
                      displayValue={tech.Lazy_Loading.meta?.value}
                    >
                      {tech.Lazy_Loading.meta?.notScored ? (
                        <NotCalculatedNote metric={tech.Lazy_Loading} darkMode={darkMode} />
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Below-Fold Images</p>
                              <p className={`text-xl font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Lazy_Loading.meta?.belowFoldImages}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Lazy-Loaded</p>
                              <p className={`text-xl font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Lazy_Loading.meta?.lazyImages}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Eager Images</p>
                              <p className={`text-xl font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Lazy_Loading.meta?.eagerImages}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Iframes / Videos</p>
                              <p className={`text-xl font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.Lazy_Loading.meta?.belowFoldIframes} / {tech.Lazy_Loading.meta?.totalVideos}</p>
                            </div>
                          </div>
                          <AffectedList
                            title="Eagerly-Loaded Below-Fold Media"
                            items={tech.Lazy_Loading.meta?.eagerMediaSamples}
                            darkMode={darkMode}
                            renderLabel={(i) => `${i.type}: ${i.fileName || i.src}`}
                            renderBadge={(i) => (i.top ? `@ ${i.top}px` : i.type)}
                          />
                        </div>
                      )}
                    </OptimizationCard>
                  )}

                  {tech.JS_Execution && (
                    <OptimizationCard
                      icon={Cpu}
                      title="JavaScript Execution Efficiency"
                      metricData={tech.JS_Execution}
                      paramKey="JS_Execution"
                      darkMode={darkMode}
                      isOpen={expandedDetails.jsExecution}
                      onToggle={() => toggleDetails('jsExecution')}
                      description={metricExplanations.JS_Execution.whatThisParameterIs}
                      whyItMatters={metricExplanations.JS_Execution.whyItMatters}
                      onInfoClick={() => setSelectedParameterInfo({ title: "JavaScript Execution Efficiency", icon: Cpu, ...metricExplanations.JS_Execution, metricData: tech.JS_Execution })}
                      displayValue={tech.JS_Execution.meta?.value}
                    >
                      {tech.JS_Execution.meta?.notScored ? (
                        <NotCalculatedNote metric={tech.JS_Execution} darkMode={darkMode} />
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>JS Execution Time</p>
                              <p className={`text-xl font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.JS_Execution.meta?.jsExecutionTime}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-muted"}`}>Main-Thread Time</p>
                              <p className={`text-xl font-black ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{tech.JS_Execution.meta?.mainThreadTime}</p>
                            </div>
                          </div>
                          <AffectedList
                            title="Scripts Costing the Most Execution Time"
                            items={tech.JS_Execution.meta?.topScripts}
                            darkMode={darkMode}
                            renderLabel={(i) => i.fileName || i.url}
                            renderBadge={(i) => `${i.scriptingMs}ms`}
                          />
                        </div>
                      )}
                    </OptimizationCard>
                  )}
                </Section>
              )}

              {/* Category 3: Asset & Optimizations (Gated) */}
              {assetsVisible && (
              <ReportRestrictionWrapper>
                <div className="space-y-8">
                  <Section title="Asset Distribution & Code Delivery Optimizations" icon={Sparkles} darkMode={darkMode}>
                    {tech.Compression && isVisibleForAudience('Compression', audienceMode) && (
                      <OptimizationCard
                        icon={Briefcase}
                        title="Asset Compression Status"
                        metricData={tech.Compression}
                        paramKey="Compression"
                        darkMode={darkMode}
                        isOpen={expandedDetails.compression}
                        onToggle={() => toggleDetails('compression')}
                        description={metricExplanations.Compression.whatThisParameterIs}
                        whyItMatters={metricExplanations.Compression.whyItMatters}
                        fallbackCauses={metricExplanations.Compression.actualReasonsForFailure}
                        fallbackRecommendations={metricExplanations.Compression.howToOvercomeFailure}
                        onInfoClick={() => setSelectedParameterInfo({ title: "Asset Compression Status", icon: Briefcase, ...metricExplanations.Compression, metricData: tech.Compression })}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <div className="flex justify-between items-center">
                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted"}`}>Overall Score</p>
                                <ScoreBadge status={tech.Compression.status} value={tech.Compression.meta?.value} darkMode={darkMode} />
                              </div>
                            </div>
                            <div className={`p-3 rounded-xl border ${darkMode ? "bg-emerald-900/10 border-emerald-800/30" : "bg-emerald-50 border-emerald-100"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Compressed</p>
                              <p className={`text-xl font-black ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>{tech.Compression.meta?.compressedCount}</p>
                            </div>
                            <div className={`p-3 rounded-xl border ${darkMode ? "bg-rose-900/10 border-rose-800/30" : "bg-rose-50 border-rose-100"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Uncompressed</p>
                              <p className={`text-xl font-black ${darkMode ? "text-rose-300" : "text-rose-700"}`}>{tech.Compression.meta?.uncompressedCount}</p>
                            </div>
                          </div>

                          {tech.Compression.meta?.uncompressedResources && tech.Compression.meta.uncompressedResources.length > 0 && (
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-500" : "text-faint"}`}>Uncompressed Resources</p>
                              <div className="flex flex-col gap-2">
                                {tech.Compression.meta.uncompressedResources.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <p className={`text-[10px] truncate max-w-[70%] font-mono ${darkMode ? "text-gray-300" : "text-muted"}`} title={item.url}>
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

                    {tech.Caching && isVisibleForAudience('Caching', audienceMode) && (
                      <OptimizationCard
                        icon={Database}
                        title="Caching Policy"
                        metricData={tech.Caching}
                        paramKey="Caching"
                        darkMode={darkMode}
                        isOpen={expandedDetails.caching}
                        onToggle={() => toggleDetails('caching')}
                        description={metricExplanations.Caching.whatThisParameterIs}
                        whyItMatters={metricExplanations.Caching.whyItMatters}
                        fallbackCauses={metricExplanations.Caching.actualReasonsForFailure}
                        fallbackRecommendations={metricExplanations.Caching.howToOvercomeFailure}
                        onInfoClick={() => setSelectedParameterInfo({ title: "Caching Policy", icon: Database, ...metricExplanations.Caching, metricData: tech.Caching })}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <div className="flex justify-between items-center">
                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted"}`}>Overall Score</p>
                                <ScoreBadge status={tech.Caching.status} value={tech.Caching.meta?.value} darkMode={darkMode} />
                              </div>
                            </div>
                            <div className={`p-3 rounded-xl border ${darkMode ? "bg-emerald-900/10 border-emerald-800/30" : "bg-emerald-50 border-emerald-100"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Cached</p>
                              <p className={`text-xl font-black ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>{tech.Caching.meta?.cachedCount}</p>
                            </div>
                            <div className={`p-3 rounded-xl border ${darkMode ? "bg-rose-900/10 border-rose-800/30" : "bg-rose-50 border-rose-100"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Uncached</p>
                              <p className={`text-xl font-black ${darkMode ? "text-rose-300" : "text-rose-700"}`}>{tech.Caching.meta?.uncachedCount}</p>
                            </div>
                          </div>

                          {tech.Caching.meta?.uncachedResources && tech.Caching.meta.uncachedResources.length > 0 && (
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-500" : "text-faint"}`}>Uncached Resources</p>
                              <div className="flex flex-col gap-2">
                                {tech.Caching.meta.uncachedResources.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <p className={`text-[10px] truncate max-w-[70%] font-mono ${darkMode ? "text-gray-300" : "text-muted"}`} title={item.url}>
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

                    {tech.Redirect_Chains && isVisibleForAudience('Redirect_Chains', audienceMode) && (
                      <OptimizationCard
                        icon={ArrowRightLeft}
                        title="Redirect Chains"
                        metricData={tech.Redirect_Chains}
                        paramKey="Redirect_Chains"
                        darkMode={darkMode}
                        isOpen={expandedDetails.redirectChains}
                        onToggle={() => toggleDetails('redirectChains')}
                        description={metricExplanations.Redirect_Chains.whatThisParameterIs}
                        whyItMatters={metricExplanations.Redirect_Chains.whyItMatters}
                        fallbackCauses={metricExplanations.Redirect_Chains.actualReasonsForFailure}
                        fallbackRecommendations={metricExplanations.Redirect_Chains.howToOvercomeFailure}
                        onInfoClick={() => setSelectedParameterInfo({ title: "Redirect Chains", icon: ArrowRightLeft, ...metricExplanations.Redirect_Chains, metricData: tech.Redirect_Chains })}
                        displayValue={`${tech.Redirect_Chains.meta?.hops} hops`}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted"}`}>Overall Score</p>
                              <div className="mt-2"><ScoreBadge status={tech.Redirect_Chains.status} value={tech.Redirect_Chains.meta?.value} darkMode={darkMode} /></div>
                            </div>
                            {/* Hops coloured by status: 0–1 good (green), 2 warning (amber), 3+ poor (red). */}
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${statusText(tech.Redirect_Chains.status, darkMode, "label")}`}>Redirect Hops</p>
                              <p className={`text-xl font-black ${statusText(tech.Redirect_Chains.status, darkMode, "value")}`}>{tech.Redirect_Chains.meta?.hops ?? 0}</p>
                            </div>
                          </div>

                          {/* Full request path to the final 200 (only meaningful when a redirect occurred). */}
                          {tech.Redirect_Chains.meta?.redirectDetails && tech.Redirect_Chains.meta.redirectDetails.length > 1 && (
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-500" : "text-faint"}`}>Redirect Path</p>
                              <div className="flex flex-col gap-2">
                                {tech.Redirect_Chains.meta.redirectDetails.map((u, idx, arr) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <span className={`text-[10px] font-semibold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 ${idx === arr.length - 1 ? (darkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-600") : (darkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-600")}`}>{idx + 1}</span>
                                    <p className={`text-[10px] truncate font-mono ${darkMode ? "text-gray-300" : "text-muted"}`} title={u}>{u}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </OptimizationCard>
                    )}

                    {tech.Render_Blocking && isVisibleForAudience('Render_Blocking', audienceMode) && (
                      <OptimizationCard
                        icon={Server}
                        title="Render Blocking"
                        metricData={tech.Render_Blocking}
                        paramKey="Render_Blocking"
                        darkMode={darkMode}
                        isOpen={expandedDetails.renderBlocking}
                        onToggle={() => toggleDetails('renderBlocking')}
                        description={metricExplanations.Render_Blocking.whatThisParameterIs}
                        whyItMatters={metricExplanations.Render_Blocking.whyItMatters}
                        fallbackCauses={metricExplanations.Render_Blocking.actualReasonsForFailure}
                        fallbackRecommendations={metricExplanations.Render_Blocking.howToOvercomeFailure}
                        onInfoClick={() => setSelectedParameterInfo({ title: "Render Blocking", icon: Server, ...metricExplanations.Render_Blocking, metricData: tech.Render_Blocking })}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted"}`}>Overall Score</p>
                              <div className="mt-2"><ScoreBadge status={tech.Render_Blocking.status} value={tech.Render_Blocking.meta?.value} darkMode={darkMode} /></div>
                            </div>
                            {/* Count coloured by status — 0 blocking = green, any = amber/red. */}
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${statusText(tech.Render_Blocking.status, darkMode, "label")}`}>Blocking Resources</p>
                              <p className={`text-xl font-black ${statusText(tech.Render_Blocking.status, darkMode, "value")}`}>{tech.Render_Blocking.meta?.blockingCount ?? 0}</p>
                            </div>
                          </div>

                          {tech.Render_Blocking.meta?.blockingResources && tech.Render_Blocking.meta.blockingResources.length > 0 && (
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-500" : "text-faint"}`}>Blocking Resources</p>
                              <div className="flex flex-col gap-2.5">
                                {tech.Render_Blocking.meta.blockingResources.map((item, idx) => (
                                  <div key={idx} className="flex flex-col gap-0.5">
                                    <p className={`text-[10px] truncate font-mono ${darkMode ? "text-gray-300" : "text-muted"}`} title={item.url}>
                                      {item.url}
                                    </p>
                                    {item.details && (
                                      <p className={`text-[10px] ${darkMode ? "text-gray-500" : "text-faint"}`}>{item.details}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </OptimizationCard>
                    )}

                    {tech.Resource_Optimization && isVisibleForAudience('Resource_Optimization', audienceMode) && (
                      <OptimizationCard
                        icon={ImageIcon}
                        title="Resource Optimization"
                        metricData={tech.Resource_Optimization}
                        paramKey="Resource_Optimization"
                        darkMode={darkMode}
                        isOpen={expandedDetails.resourceOptimization}
                        onToggle={() => toggleDetails('resourceOptimization')}
                        description={metricExplanations.Resource_Optimization.whatThisParameterIs}
                        whyItMatters={metricExplanations.Resource_Optimization.whyItMatters}
                        fallbackCauses={metricExplanations.Resource_Optimization.actualReasonsForFailure}
                        fallbackRecommendations={metricExplanations.Resource_Optimization.howToOvercomeFailure}
                        onInfoClick={() => setSelectedParameterInfo({ title: "Resource Optimization", icon: ImageIcon, ...metricExplanations.Resource_Optimization, metricData: tech.Resource_Optimization })}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border col-span-2 ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <div className="flex justify-between items-center">
                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted"}`}>Overall Score</p>
                                <ScoreBadge status={tech.Resource_Optimization.status} value={tech.Resource_Optimization.meta?.value} darkMode={darkMode} />
                              </div>
                            </div>
                            {/* Images Stats Group */}
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <div className="flex justify-between items-center mb-3">
                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted"}`}>Images</p>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${darkMode ? "bg-emerald-900/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                                  {tech.Resource_Optimization.meta?.totalImages || 0} Total
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className={`text-[11px] ${darkMode ? "text-gray-400" : "text-muted"}`}>Optimized</span>
                                  <span className={`text-xs font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{tech.Resource_Optimization.meta?.optimizedImagesCount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={`text-[11px] ${darkMode ? "text-gray-400" : "text-muted"}`}>Heavy/Large</span>
                                  <span className={`text-xs font-semibold ${darkMode ? "text-rose-400" : "text-rose-600"}`}>{tech.Resource_Optimization.meta?.unoptimizedImagesCount || 0}</span>
                                </div>
                              </div>
                            </div>

                            {/* Scripts Stats Group */}
                            <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-cardsoft border-line"}`}>
                              <div className="flex justify-between items-center mb-3">
                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted"}`}>Scripts</p>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                                  {tech.Resource_Optimization.meta?.totalScripts || 0} Total
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className={`text-[11px] ${darkMode ? "text-gray-400" : "text-muted"}`}>Minified</span>
                                  <span className={`text-xs font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{tech.Resource_Optimization.meta?.minifiedScriptsCount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={`text-[11px] ${darkMode ? "text-gray-400" : "text-muted"}`}>Unminified</span>
                                  <span className={`text-xs font-semibold ${darkMode ? "text-rose-400" : "text-rose-600"}`}>{tech.Resource_Optimization.meta?.unminifiedScriptsCount || 0}</span>
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
              )}
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