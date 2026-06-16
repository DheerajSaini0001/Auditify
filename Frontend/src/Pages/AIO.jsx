import React, { useContext, useMemo } from "react";
import UrlHeader from "../Component/UrlHeader";
import ReportRestrictionWrapper from "../Component/ReportRestrictionWrapper";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  CheckCircle, XCircle, AlertTriangle, Info,
  Database, FileText, Zap, Server, RefreshCw,
  MessageSquare, Tag, Calendar, Link, Copy, Activity,
  Users, Target, FlaskConical, MessageCircle,
  Brain, Cpu, Network, Loader2,
  Compass, HelpCircle, Layers, List, UserCheck, CheckSquare, BookOpen, ShieldCheck, AlertCircle,
  ChevronDown, ChevronUp
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import { InfoDetails } from "../Component/InfoDetails";
import AskAIButton from "../Component/AskAIButton";
import AEOPage from "./AEOPage";
import { isVisibleForAudience, isActionableParam } from "../config/parameterAudience";

const iconMap = {
  Structured_Data: Database,
  Metadata_Complete: FileText,
  Fast_Page_Load: Zap,
  API_Data_Access: Server,
  Dynamic_Content_Available: RefreshCw,

  Content_NLP_Friendly: MessageSquare,
  Keywords_Entities_Annotated: Tag,
  Content_Updated_Regularly: Calendar,
  Internal_Linking_AI_Friendly: Link,
  User_Feedback_Loops_Present: MessageCircle,

  Topical_Focus_Clarity: Compass,
  Answer_Oriented_Structure: HelpCircle,
  Content_Chunking: Layers,
  Lists_Structured_Blocks: List,
  Terminology_Consistency: Network,
  Author_Source_Attribution: UserCheck,
  Fact_Vs_Opinion: CheckSquare,
  Content_Completeness: BookOpen,
  answerFirst: MessageSquare,
  llmsTxt: FileText,
  aeoSchema: Database,
  structuredContent: Layers,
  botAccess: ShieldCheck,
};

const educationalContent = InfoDetails;
const scoreCalculationInfo = InfoDetails.AIO_Readiness_Methodologies;

const AIOShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
  const step = steps[currentStep] || steps[0];

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 animate-in fade-in zoom-in duration-500 min-h-[350px]">

      <div className={`w-full max-w-xl rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-500 ${darkMode ? "bg-slate-800/40 border border-slate-700/50" : "bg-cardsoft border border-line"}`}>
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
        <h2 className={`mt-6 text-2xl font-semibold tracking-tight transition-all duration-500 ${darkMode ? "text-white" : "text-ink"}`}>
          {step.title}
        </h2>

        {/* Description */}
        <p className={`mt-4 text-base leading-relaxed max-w-sm mx-auto transition-all duration-500 ${darkMode ? "text-slate-400" : "text-muted"}`}>
          {step.text}
        </p>

        {/* Processing State */}
        <div className="mt-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-wider">Processing</span>
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

const MetricCard = ({ metricKey, data, darkMode, onInfo }) => {
  const { score, status, details, meta, analysis, qanda } = data || {};
  const [showAnalysis, setShowAnalysis] = React.useState(false);

  // Three-tier status: green (100 / near 100), amber (partial), red (0 / near 0).
  // Prefer the backend status (used by the summary counts); fall back to score bands.
  const tier = status || (score >= 80 ? "pass" : score >= 40 ? "warning" : "fail");
  const isPassed = tier === "pass";
  const isWarning = tier === "warning";

  const Icon = iconMap[metricKey] || CheckCircle;
  const content = educationalContent[metricKey] || { desc: "Metric check.", why: "Important for AI." };
  const reasons = content.actualReasonsForFailure || [];
  const recommendations = content.howToOvercomeFailure || [];
  const title = metricKey.replaceAll("_", " ");

  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-card border-line";
  const textColor = darkMode ? "text-gray-100" : "text-ink";
  const subTextColor = darkMode ? "text-gray-400" : "text-muted";

  const statusColor = isPassed
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : isWarning
      ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
      : "text-rose-500 bg-rose-500/10 border-rose-500/20";

  return (

    <div className={`relative overflow-hidden rounded-xl border ${cardBg} shadow-sm hover:shadow-md transition-shadow group`}>
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-cardsoft"} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} className={darkMode ? "text-indigo-400" : "text-indigo-600"} />
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${textColor}`}>{title}</h3>
              <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full w-fit border ${statusColor}`}>
                {isPassed ? "Ready" : isWarning ? "Partially Ready" : "Optimization Needed"}
              </p>
            </div>
          </div>
          <div className="flex justify-end items-center gap-2">
            {!isPassed && isActionableParam(metricKey) && (
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 ${showAnalysis
                  ? (darkMode ? "bg-slate-700 text-white" : "bg-cardsoft text-ink")
                  : (darkMode ? "bg-slate-800/50 text-slate-400 hover:text-white" : "bg-cardsoft text-muted hover:text-ink")}`}
              >
                {showAnalysis ? "Hide Detail" : "View Detail"}
                {showAnalysis ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
            {onInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo({ ...content, icon: Icon, thresholds: meta?.threshold || content.thresholds });
                }}
                className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-800 text-gray-400 hover:text-white" : "hover:bg-cardsoft text-muted hover:text-ink"}`}
                title="View Methodology"
              >
                <Info size={18} />
              </button>
            )}
          </div>
        </div>



        {/* Q&A Insight */}
        {qanda && (
          <div className={`p-4 rounded-xl border-l-[3px] transition-all duration-300 ${darkMode
            ? "bg-indigo-500/5 border-indigo-500/30 text-indigo-100"
            : "bg-indigo-50/30 border-indigo-400 text-indigo-900"}`}>
            <h4 className="text-[10px] font-semibold uppercase tracking-widest opacity-60 mb-1.5 flex items-center gap-1.5">
              <MessageCircle size={12} className="text-indigo-500" />
              Intelligence Insight
            </h4>
            <div className="space-y-1">
              <p className="text-xs font-semibold leading-tight italic">"{qanda.question}"</p>
              <p className={`text-[11px] leading-relaxed font-medium ${darkMode ? "text-indigo-300/80" : "text-indigo-700/80"}`}>
                {qanda.answer}
              </p>
            </div>
          </div>
        )}

        {/* Status Verdict */}
        <div className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all duration-300 ${isPassed
          ? (darkMode ? "bg-emerald-500/5 border-emerald-500/10" : "bg-emerald-50/50 border-emerald-100")
          : (isWarning
            ? (darkMode ? "bg-amber-500/5 border-amber-500/10" : "bg-amber-50/50 border-amber-100")
            : (darkMode ? "bg-rose-500/5 border-rose-500/10" : "bg-rose-50/50 border-rose-100"))}`}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPassed ? "bg-emerald-500" : (isWarning ? "bg-amber-500" : "bg-rose-500")}`}></div>
            <h4 className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "text-slate-500" : "text-faint"}`}>
              Audit Status
            </h4>
          </div>
          <p className={`text-sm font-semibold leading-normal ${isPassed ? "text-emerald-600 dark:text-emerald-400" : (isWarning ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400")}`}>
            {details}
          </p>
        </div>

        {/* Ask AI Button */}
        {!isPassed && (
          <AskAIButton
            finding={{
              type: 'AIO (AI Optimization)',
              title: title,
              details: details || '',
              severity: isPassed ? 'pass' : isWarning ? 'warning' : 'critical',
              url: ''
            }}
            darkMode={darkMode}
            meta={meta}
            paramKey={metricKey}
          />
        )}

        {/* Tailored Technical Data for each Parameter */}
        <div className="flex flex-col gap-2.5 mt-2">

          {/* Structured Data */}
          {metricKey === "Structured_Data" && meta?.types && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <h5 className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-faint"}`}>Detected Schema Types</h5>
                <div className={`p-2 rounded-lg border flex flex-wrap gap-1.5 font-mono text-[10px] ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  {meta.types.length > 0 ? meta.types.map((t, idx) => (
                    <span key={idx} className={`px-2 py-0.5 rounded-md ${darkMode ? "bg-slate-800 text-slate-300" : "bg-card border border-line text-muted"}`}>{t}</span>
                  )) : "None"}
                </div>
              </div>
              <div className="flex items-center gap-2 px-1">
                <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? "bg-slate-600" : "bg-slate-400"}`}></span>
                <span className={`text-[10px] font-semibold uppercase tracking-tight ${darkMode ? "text-slate-400" : "text-muted"}`}>Blocks Found: {meta.count}</span>
              </div>
            </div>
          )}

          {/* NLP Friendliness */}
          {metricKey === "Content_NLP_Friendly" && (
            <div className="flex flex-col gap-2">
              {meta?.semanticTags && (
                <div className="flex flex-col">
                  <h5 className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-faint"}`}>Semantic Architecture</h5>
                  <div className={`p-2 rounded-lg border flex flex-wrap gap-1.5 font-mono text-[10px] ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    {meta.semanticTags.map((t, idx) => (
                      <span key={idx} className={`px-2 py-0.5 rounded-md ${darkMode ? "bg-slate-800 text-slate-300" : "bg-card border border-line text-muted"}`}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${meta?.hasParagraphs ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                  <span className={`text-[10px] font-semibold uppercase ${darkMode ? "text-slate-400" : "text-muted"}`}>Paragraphs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${meta?.hasLists ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                  <span className={`text-[10px] font-semibold uppercase ${darkMode ? "text-slate-400" : "text-muted"}`}>Lists</span>
                </div>
              </div>
            </div>
          )}

          {/* Keywords & Entities */}
          {metricKey === "Keywords_Entities_Annotated" && (
            <div className={`p-2.5 rounded-lg border flex flex-col gap-2 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-cardsoft border-line"}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold uppercase ${darkMode ? "text-slate-400" : "text-muted"}`}>Meta Keywords</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${meta?.hasMetaKeywords ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"}`}>
                  {meta?.hasMetaKeywords ? "PRESENT" : "MISSING"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold uppercase ${darkMode ? "text-slate-400" : "text-muted"}`}>Alt Text Coverage</span>
                <span className="text-[10px] font-black">
                  {meta?.imagesWithAlt} / {meta?.totalImages}
                </span>
              </div>
            </div>
          )}

          {/* Content Freshness */}
          {metricKey === "Content_Updated_Regularly" && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <h5 className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-faint"}`}>Update Timestamp</h5>
                <div className={`p-2.5 rounded-lg border font-mono text-[10px] ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  {meta?.lastModified || meta?.checked || "No date signal found"}
                </div>
              </div>
              {meta?.daysAgo !== undefined && (
                <div className="flex items-center gap-2 px-1">
                  <div className={`h-1 flex-grow rounded-full bg-line dark:bg-slate-800 overflow-hidden`}>
                    <div className={`h-full rounded-full ${meta.daysAgo <= 30 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.max(10, 100 - (meta.daysAgo / 3.65))}%` }}></div>
                  </div>
                  <span className={`text-[9px] font-black uppercase whitespace-nowrap ${darkMode ? "text-slate-400" : "text-muted"}`}>{meta.daysAgo}d Ago</span>
                </div>
              )}
            </div>
          )}

          {/* Internal Linking */}
          {metricKey === "Internal_Linking_AI_Friendly" && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2 rounded-lg border text-center ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-cardsoft border-line'}`}>
                  <span className={`block text-[9px] font-semibold opacity-50 uppercase ${darkMode ? "text-slate-400" : "text-muted"}`}>Internal</span>
                  <span className={`text-sm font-black tracking-tight ${darkMode ? "text-slate-200" : "text-inksoft"}`}>{meta?.internalLinks}</span>
                </div>
                <div className={`p-2 rounded-lg border text-center ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-cardsoft border-line'}`}>
                  <span className={`block text-[9px] font-semibold opacity-50 uppercase ${darkMode ? "text-slate-400" : "text-muted"}`}>Contextual</span>
                  <span className={`text-sm font-black tracking-tight ${darkMode ? "text-slate-200" : "text-inksoft"}`}>{meta?.descriptiveLinks}</span>
                </div>
              </div>
              {meta?.examples?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {meta.examples.map((ex, i) => (
                    <span key={i} className={`text-[10px] px-2 py-0.5 rounded border italic ${darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-card border-line text-muted"}`}>
                      "{ex}"
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Duplicate Content / Canonical */}
          {metricKey === "Duplicate_Content_Detection_Ready" && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <h5 className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-faint"}`}>Canonical Signal</h5>
                <div className={`p-2.5 rounded-lg border font-mono text-[10px] break-all ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  {meta?.canonical || "Not Found"}
                </div>
              </div>
              <div className="flex items-center justify-between px-1">
                <span className={`text-[10px] font-semibold uppercase ${darkMode ? "text-slate-500" : "text-faint"}`}>Noindex Tag</span>
                <span className={`text-[10px] font-black ${meta?.hasNoindex ? "text-emerald-500" : "text-slate-400"}`}>
                  {meta?.hasNoindex ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          )}

          {/* Topical Focus Clarity */}
          {metricKey === "Topical_Focus_Clarity" && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <h5 className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-faint"}`}>Keyword Synergy</h5>
                <div className={`p-2.5 rounded-lg border flex flex-wrap gap-1.5 font-mono text-[10px] ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  {meta?.overlap?.length > 0 ? meta.overlap.map((w, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded-md ${darkMode ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>{w}</span>
                  )) : "Low Entity Alignment"}
                </div>
              </div>
              <div className={`text-[9px] font-medium italic opacity-60 truncate px-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>H1 Matched: {meta?.h1}</div>
            </div>
          )}

          {/* Answer Engine Structure */}
          {metricKey === "Answer_Oriented_Structure" && (
            <div className="flex flex-col gap-2">
              {meta?.pairs?.length > 0 && (
                <div className="flex flex-col">
                  <h5 className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-faint"}`}>Discovered Query-Answer Pairs</h5>
                  <div className={`p-2.5 rounded-xl border flex flex-col gap-3 text-[11px] max-h-[320px] overflow-y-auto pr-2 custom-scrollbar ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-cardsoft border-line text-inksoft"}`}>
                    {meta.pairs.map((pair, i) => (
                      <div key={i} className="flex flex-col gap-1.5 border-b border-slate-800/10 dark:border-slate-100/10 pb-3 last:border-0 last:pb-0">
                        <div className="flex gap-2 items-start text-indigo-500 dark:text-indigo-400 font-semibold leading-snug">
                          <span className="flex-shrink-0 opacity-70 italic font-mono uppercase text-[9px] mt-0.5">Q:</span>
                          <span className="italic">{pair.question}</span>
                        </div>
                        <div className={`flex gap-2 items-start leading-relaxed text-[10px] pl-5 ${darkMode ? "text-slate-400" : "text-muted"}`}>
                          <span className="flex-shrink-0 opacity-70 font-mono uppercase text-[8px] mt-0.5">A:</span>
                          <p>{pair.answer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between px-1 mt-1">
                <span className={`text-[10px] font-semibold uppercase ${darkMode ? "text-slate-500" : "text-faint"}`}>FAQ Schema Status</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${meta?.pairs?.length > 4 ? (darkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600") : "hidden"}`}>
                    +{meta.pairs.length - 4} More Discovered
                  </span>
                  <span className={`text-[10px] font-black ${meta?.hasFAQ ? "text-emerald-500" : "text-slate-400"}`}>
                    {meta?.hasFAQ ? "DETECTED" : "MISSING"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Content Chunking */}
          {metricKey === "Content_Chunking" && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2.5 rounded-lg border text-center ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-cardsoft border-line'}`}>
                  <span className={`block text-[9px] font-semibold opacity-50 uppercase ${darkMode ? "text-slate-400" : "text-muted"}`}>Dense Ps</span>
                  <span className="text-sm font-black text-amber-500">{meta?.longParagraphs}</span>
                </div>
                <div className={`p-2.5 rounded-lg border text-center ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-cardsoft border-line'}`}>
                  <span className={`block text-[9px] font-semibold opacity-50 uppercase ${darkMode ? "text-slate-400" : "text-muted"}`}>Density</span>
                  <span className={`text-sm font-black ${darkMode ? "text-slate-200" : "text-inksoft"}`}>{meta?.headingFrequency || meta?.headingDensity} P/H</span>
                </div>
              </div>
              <div className={`text-[9px] font-semibold opacity-50 text-center uppercase tracking-widest ${darkMode ? "text-slate-400" : "text-muted"}`}>Structure: {meta?.totalParagraphs} Paragraphs Total</div>
            </div>
          )}

          {/* Lists & Tables */}
          {metricKey === "Lists_Structured_Blocks" && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Lists', val: meta?.listCount },
                { label: 'Tables', val: meta?.tableCount },
                { label: 'Quotes', val: meta?.blockquoteCount }
              ].map((item, i) => (
                <div key={i} className={`flex flex-col items-center p-2 rounded-lg border ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-cardsoft border-line text-muted'}`}>
                  <span className="text-sm font-black">{item.val}</span>
                  <span className="text-[8px] font-semibold uppercase opacity-50 tracking-tighter">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Terminology Consistency */}
          {metricKey === "Terminology_Consistency" && meta?.keyTerms && (
            <div className="flex flex-col">
              <h5 className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-faint"}`}>Primary Entities</h5>
              <div className={`p-2.5 rounded-lg border flex flex-wrap gap-1.5 font-mono text-[10px] ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                {meta.keyTerms.map((term, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-md ${darkMode ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-indigo-50 text-indigo-700 border border-indigo-100"}`}>{term}</span>
                ))}
              </div>
            </div>
          )}

          {/* Attribution & Source */}
          {metricKey === "Author_Source_Attribution" && (
            <div className={`p-2.5 rounded-lg border flex flex-col gap-2 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-cardsoft border-line"}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold uppercase ${darkMode ? "text-slate-400" : "text-muted"}`}>Byline Visibility</span>
                <span className={`text-[10px] font-black ${meta?.hasByline ? "text-emerald-500" : "text-rose-500"}`}>
                  {meta?.hasByline ? "HUMAN DETECTED" : "ANONYMOUS"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold uppercase ${darkMode ? "text-slate-400" : "text-muted"}`}>Author Schema</span>
                <span className={`text-[10px] font-black ${meta?.hasAuthorSchema ? "text-emerald-500" : "text-rose-500"}`}>
                  {meta?.hasAuthorSchema ? "ACTIVE" : "MISSING"}
                </span>
              </div>
            </div>
          )}

          {/* Citations & Evidence */}
          {metricKey === "Fact_Vs_Opinion" && (
            <div className="flex flex-col gap-2">
              <div className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-cardsoft border-line text-muted'}`}>
                <span className="text-[10px] font-semibold uppercase opacity-60">Verified Citations</span>
                <span className="text-sm font-black">{meta?.citations}</span>
              </div>
              <div className="flex items-center justify-between px-1 mt-0.5">
                <span className={`text-[10px] font-semibold uppercase ${darkMode ? "text-slate-500" : "text-faint"}`}>Bibliography Section</span>
                <span className={`text-[10px] font-black ${meta?.hasReferenceSection ? "text-emerald-500" : "text-slate-400"}`}>
                  {meta?.hasReferenceSection ? "FOUND" : "NOT FOUND"}
                </span>
              </div>
            </div>
          )}

          {/* Content Completeness */}
          {metricKey === "Content_Completeness" && (
            <div className="flex flex-col gap-2">
              <div className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-cardsoft border-line text-muted'}`}>
                <span className="text-[10px] font-semibold uppercase opacity-60">Quantifiable Depth</span>
                <span className="text-sm font-black tracking-tight">{meta?.wordCount} Words</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-0.5">
                <div className={`p-2 rounded-lg border text-center ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-cardsoft border-line'}`}>
                  <span className={`block text-[8px] font-semibold uppercase opacity-50 ${darkMode ? "text-slate-400" : "text-muted"}`}>Intro</span>
                  <span className={`text-[10px] font-black ${meta?.hasIntro ? "text-emerald-500" : "text-rose-500"}`}>{meta?.hasIntro ? "YES" : "NO"}</span>
                </div>
                <div className={`p-2 rounded-lg border text-center ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-cardsoft border-line'}`}>
                  <span className={`block text-[8px] font-semibold uppercase opacity-50 ${darkMode ? "text-slate-400" : "text-muted"}`}>Conclusion</span>
                  <span className={`text-[10px] font-black ${meta?.hasConclusion ? "text-emerald-500" : "text-rose-500"}`}>{meta?.hasConclusion ? "YES" : "NO"}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {showAnalysis && (
          <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {(analysis?.cause || reasons.length > 0) && (
              <div className={`p-3 rounded-lg border ${darkMode ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-100"}`}>
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} className="text-rose-500 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-rose-500 mb-1">Why This Occurred</h4>
                    <div className={`text-xs leading-relaxed ${darkMode ? "text-gray-300" : "text-inksoft"}`}>
                      {analysis?.cause ? (
                        <p>{analysis.cause}</p>
                      ) : (
                        <ul className="space-y-1">
                          {reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(analysis?.recommendation || recommendations.length > 0) && (
              <div className={`p-3 rounded-lg border ${darkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"}`}>
                <div className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-emerald-500 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 mb-1">How to Fix</h4>
                    <div className={`text-xs leading-relaxed ${darkMode ? "text-gray-300" : "text-inksoft"}`}>
                      {analysis?.recommendation ? (
                        <p>{analysis.recommendation}</p>
                      ) : (
                        <ul className="space-y-1">
                          {recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

const Section = ({ title, icon: Icon, children, darkMode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 px-2">
      <div className={`p-2 rounded-lg ${darkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"}`}>
        <Icon size={20} />
      </div>
      <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-ink"}`}>
        {title}
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

const AIO_Inner = React.memo(({ data, loading, darkMode }) => {
  const aio = data?.aioReadiness || {};
  const aeo = data?.aeo || {};

  // Calculate Combined AIO Readiness Score (Average of Foundation + Engine Scores)
  const unifiedAioScore = useMemo(() => {
    const foundationScore = aio?.Percentage || 0;
    const engineScore = aeo?.overallScore || 0;

    // If one is missing, use the other; otherwise average them
    if (!foundationScore) return engineScore;
    if (!engineScore) return foundationScore;
    return Math.round((foundationScore + engineScore) / 2);
  }, [aio?.Percentage, aeo?.overallScore]);

  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const { audienceMode } = useData();

  const auditSteps = useMemo(() => [
    { icon: <Database className="w-8 h-8 text-blue-500" />, title: "Structured Data", text: "Analyzing JSON-LD Schema markup and rich snippets eligibility..." },
    { icon: <MessageSquare className="w-8 h-8 text-purple-500" />, title: "NLP Readiness", text: "Evaluating content structure and semantic clarity for AI models..." },
    { icon: <Zap className="w-8 h-8 text-teal-500" />, title: "Crawl Efficiency", text: "Measuring page load speed and API accessibility for AI bots..." },
    { icon: <Tag className="w-8 h-8 text-indigo-500" />, title: "Entity Recognition", text: "Scanning for named entities, keywords, and topic clusters..." },
    { icon: <Brain className="w-8 h-8 text-amber-500" />, title: "AI Optimization", text: "Checking for voice search compatibility and answer engine readiness..." },
  ], []);

  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (loading || !data || data.status === "pending") {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % auditSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);

  const hasAioData = aio && Object.keys(aio).length > 0;
  const isAioLoading = loading || !data || data.status === "pending" || !hasAioData;

  const allMetrics = Object.values(aio).filter(val => typeof val === 'object' && val !== null && 'score' in val);
  const passedCount = allMetrics.filter(m => m.status === "pass").length;
  const warningCount = allMetrics.filter(m => m.status === "warning").length;
  const failedCount = allMetrics.filter(m => m.status === "fail").length;

  const mainBg = darkMode ? "bg-gray-900" : "bg-surface";

  return (
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-6`}>

        {/* ✅ Card 1: URL Header Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
          <UrlHeader
            data={data}
            darkMode={darkMode}
            sectionName="AIO (AI Optimization)"
            sectionData={aio}
            auditScore={unifiedAioScore}
            hideBorder={true}
          />
        </div>

        {/* ✅ Card 2: Overview / Preview Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
          {isAioLoading ? (
            <div className={`flex flex-col xl:flex-row ${data?.report === "All" ? "" : "min-h-[300px]"}`}>
              {/* Right Panel: Shimmer */}
              <div className="flex-1 flex flex-col justify-center">
                <AIOShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
              </div>
            </div>
          ) : (
            <div className={`flex flex-col xl:flex-row ${data?.report === "All" ? "" : "min-h-[300px]"}`}>
              {/* Right Panel: Metrics & Score */}
              <div className={`flex-1 ${data?.report === "All" ? "px-6 pb-4 pt-2 lg:px-10 lg:pt-2" : "px-6 pb-4 pt-4 lg:px-12 lg:pt-6"} flex flex-col justify-center`}>
                <div className={`w-full ${data?.report === "All" ? "" : "max-w-2xl mx-auto"} ${data?.report === "All" ? "space-y-7" : "space-y-6"}`}>

                  {/* Top Content Area */}
                  <div className={`flex flex-col md:flex-row items-center ${data?.report === "All" ? "gap-7 md:gap-9 justify-between" : "gap-8 md:gap-8 justify-center"}`}>

                    {/* Text Content */}
                    <div className={`flex-1 ${data?.report === "All" ? "space-y-5" : "space-y-4"} text-left order-2 md:order-1`}>
                      <div className={`${data?.report === "All" ? "space-y-2" : "space-y-1.5"}`}>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-indigo-100/50 text-indigo-600 border border-indigo-200"}`}>
                          <Brain className="w-3.5 h-3.5" />
                          <span>AIO Readiness Report</span>
                        </div>
                        <h3 className={`${data?.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
                          AIO <span className="text-indigo-500">Readiness</span>
                        </h3>
                        <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-muted"}`}>
                          Evaluation of your website's readiness for Artificial Intelligence optimization and crawlers.
                        </p>
                      </div>

                      {/* Stats & Tools */}
                      <div className={`flex flex-wrap items-center ${data?.report === "All" ? "gap-6" : "gap-5"}`}>
                        <div className={`flex items-center ${data?.report === "All" ? "gap-5" : "gap-4"}`}>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-emerald-500" />
                            <span className={`text-xs font-semibold  tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{passedCount} Passed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" />
                            <span className={`text-xs font-semibold  tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{warningCount} Warnings</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle size={18} className="text-rose-500" />
                            <span className={`text-xs font-semibold  tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{failedCount} Failed</span>
                          </div>
                        </div>
                        <div className={`w-px h-10 mx-2 hidden sm:block ${darkMode ? "bg-slate-700" : "bg-line"}`}></div>
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border shadow-sm transition-all duration-500 flex items-center gap-3 ${aio?.AIO_Compatibility_Badge === "Yes"
                            ? (darkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-card border-emerald-100")
                            : (darkMode ? "bg-rose-500/10 border-rose-500/20" : "bg-card border-rose-100")}`}>

                            {/* Icon Container (Card Style) */}
                            <div className={`p-2 rounded-lg ${aio?.AIO_Compatibility_Badge === "Yes"
                              ? (darkMode ? "bg-emerald-500/20" : "bg-emerald-50")
                              : (darkMode ? "bg-rose-500/20" : "bg-rose-50")}`}>
                              <ShieldCheck size={20} className={aio?.AIO_Compatibility_Badge === "Yes" ? "text-emerald-500" : "text-rose-500"} />
                            </div>

                            {/* Text Area */}
                            <div className="flex flex-col">
                              <span className={`text-[10px] font-semibold uppercase tracking-widest opacity-60 ${darkMode ? "text-white" : "text-ink"}`}>
                                AIO Compatibility
                              </span>
                              <span className={`text-sm font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
                                {aio?.AIO_Compatibility_Badge === "Yes" ? "Compatible" : "Not Optimized"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={`w-px h-4 ${darkMode ? "bg-slate-800" : "bg-line hidden md:block"}`}></div>
                        <button
                          onClick={() => setSelectedMetricInfo(scoreCalculationInfo)}
                          className={`flex items-center gap-2 text-sm font-semibold transition-all ${darkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"}`}
                        >
                          <Info size={16} />
                          <span className="border-b border-transparent hover:border-current">Metric Methodology</span>
                        </button>
                      </div>
                    </div>

                    {/* Circular Progress */}
                    <div className="relative flex-shrink-0 group cursor-default order-1 md:order-2">
                      <div className={`absolute -inset-8 rounded-full blur-3xl opacity-25 transition-opacity duration-700 group-hover:opacity-40 ${unifiedAioScore >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                      <CircularProgress value={unifiedAioScore} size={data?.report === "All" ? 180 : 150} stroke={14} />
                      <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                        <span className={`${data?.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>{unifiedAioScore}%</span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>

        {/* AEO Page Section (Contains own gating logic) */}
        <div id="aeo-section" className="mt-10 animate-in slide-in-from-bottom-10 duration-1000">
          <AEOPage
            auditData={data}
            darkMode={darkMode}
            onInfo={(info) => setSelectedParameterInfo(info)}
            hideScreenshot={data?.report === "All"}
          />
        </div>

        {/* Gated Detailed Audit Sections */}
        {hasAioData && (
          <ReportRestrictionWrapper>
            <div className="space-y-6 mt-6">
              {(() => {
                const visible = (keys) => keys.filter((k) => aio[k] && isVisibleForAudience(k, audienceMode));
                const foundationKeys = visible(["Structured_Data", "Duplicate_Content_Detection_Ready", "Internal_Linking_AI_Friendly", "Content_Updated_Regularly"]);
                const semanticKeys = visible(["Content_NLP_Friendly", "Keywords_Entities_Annotated", "Topical_Focus_Clarity", "Terminology_Consistency", "Content_Completeness"]);
                const answerVisible = aio["Answer_Oriented_Structure"] && isVisibleForAudience("Answer_Oriented_Structure", audienceMode);
                const eeatKeys = visible(["Content_Chunking", "Lists_Structured_Blocks", "Author_Source_Attribution", "Fact_Vs_Opinion"]);
                const card = (key) => <MetricCard key={key} metricKey={key} data={aio[key]} darkMode={darkMode} onInfo={(info) => setSelectedParameterInfo(info)} />;
                return (
                  <>
                    {foundationKeys.length > 0 && (
                      <Section title="AI Technical & Crawl Foundation" icon={Database} darkMode={darkMode}>{foundationKeys.map(card)}</Section>
                    )}

                    {semanticKeys.length > 0 && (
                      <Section title="Intelligence & Semantic Clarity" icon={Brain} darkMode={darkMode}>{semanticKeys.map(card)}</Section>
                    )}

                    {(answerVisible || eeatKeys.length > 0) && (
                      <Section title="E-E-A-T & Answer Optimization" icon={HelpCircle} darkMode={darkMode}>
                        {/* Answer Oriented Structure spans full width because it contains detailed Q&A pairs */}
                        {answerVisible && (
                          <div className="md:col-span-2">
                            <MetricCard
                              metricKey="Answer_Oriented_Structure"
                              data={aio["Answer_Oriented_Structure"]}
                              darkMode={darkMode}
                              onInfo={() => setSelectedParameterInfo({ ...educationalContent["Answer_Oriented_Structure"], icon: iconMap["Answer_Oriented_Structure"] || HelpCircle })}
                            />
                          </div>
                        )}
                        {eeatKeys.map(card)}
                      </Section>
                    )}
                  </>
                );
              })()}

            </div>
          </ReportRestrictionWrapper>
        )}

      </main>
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

export default function AIO({ data: propData, loading: propLoading, darkMode: propDarkMode }) {
  const contextData = useData();
  const { theme } = useContext(ThemeContext);

  const data = propData !== undefined ? propData : contextData.data;
  const loading = propLoading !== undefined ? propLoading : contextData.loading;
  const darkMode = propDarkMode !== undefined ? propDarkMode : (theme === "dark");

  return <AIO_Inner data={data} loading={loading} darkMode={darkMode} />;
}