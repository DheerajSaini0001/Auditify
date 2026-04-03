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
};

const educationalContent = InfoDetails;
const scoreCalculationInfo = InfoDetails.AIO_Readiness_Methodologies;

const AIOShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
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

const MetricCard = ({ metricKey, data, darkMode, onInfo }) => {
  const { score, details, meta, analysis, qanda } = data || {};
  const [showAnalysis, setShowAnalysis] = React.useState(false);
  const isPassed = score === 100;

  const Icon = iconMap[metricKey] || CheckCircle;
  const content = educationalContent[metricKey] || { desc: "Metric check.", why: "Important for AI." };
  const title = metricKey.replaceAll("_", " ");

  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";

  const statusColor = isPassed
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : "text-rose-500 bg-rose-500/10 border-rose-500/20";

  return (
    <div className={`relative overflow-hidden rounded-xl border ${cardBg} shadow-sm hover:shadow-md transition-shadow group`}>
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} className={darkMode ? "text-indigo-400" : "text-indigo-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
              <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full w-fit border ${statusColor}`}>
                {isPassed ? "Ready" : "Optimization Needed"}
              </p>
            </div>
          </div>
          <div className="flex justify-end items-center gap-2">
            {analysis && (
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${showAnalysis
                  ? (darkMode ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-900")
                  : (darkMode ? "bg-slate-800/50 text-slate-400 hover:text-white" : "bg-slate-50 text-slate-500 hover:text-slate-900")}`}
              >
                {showAnalysis ? "Hide Detail" : "View Detail"}
                {showAnalysis ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
            {onInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo({ key: metricKey, ...content });
                }}
                className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-800 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"}`}
                title="View Methodology"
              >
                <Info size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Educational Content */}
        <div className="space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
            Description: <span className={`normal-case font-normal opacity-100 text-xs leading-relaxed ${subTextColor}`}>{content.whatThisParameterIs || content.desc}</span>
          </p>
        </div>

        {/* Q&A Insight */}
        {qanda && (
          <div className={`p-4 rounded-xl border-l-[3px] transition-all duration-300 ${darkMode
            ? "bg-indigo-500/5 border-indigo-500/30 text-indigo-100"
            : "bg-indigo-50/30 border-indigo-400 text-indigo-900"}`}>
            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1.5 flex items-center gap-1.5">
              <MessageCircle size={12} className="text-indigo-500" />
              Intelligence Insight
            </h4>
            <div className="space-y-1">
              <p className="text-xs font-bold leading-tight italic">"{qanda.question}"</p>
              <p className={`text-[11px] leading-relaxed font-medium ${darkMode ? "text-indigo-300/80" : "text-indigo-700/80"}`}>
                {qanda.answer}
              </p>
            </div>
          </div>
        )}

        {/* Status Verdict */}
        <div className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all duration-300 ${isPassed
          ? (darkMode ? "bg-emerald-500/5 border-emerald-500/10" : "bg-emerald-50/50 border-emerald-100")
          : (score === 50
            ? (darkMode ? "bg-amber-500/5 border-amber-500/10" : "bg-amber-50/50 border-amber-100")
            : (darkMode ? "bg-rose-500/5 border-rose-500/10" : "bg-rose-50/50 border-rose-100"))}`}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPassed ? "bg-emerald-500" : (score === 50 ? "bg-amber-500" : "bg-rose-500")}`}></div>
            <h4 className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
              Audit Status
            </h4>
          </div>
          <p className={`text-sm font-bold leading-normal ${isPassed ? "text-emerald-600 dark:text-emerald-400" : (score === 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400")}`}>
            {details}
          </p>
        </div>

        {/* Tailored Technical Data for each Parameter */}
        <div className="flex flex-col gap-2.5 mt-2">

          {/* Structured Data */}
          {metricKey === "Structured_Data" && meta?.types && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Detected Schema Types</h5>
                <div className={`p-2 rounded-lg border flex flex-wrap gap-1.5 font-mono text-[10px] ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  {meta.types.length > 0 ? meta.types.map((t, idx) => (
                    <span key={idx} className={`px-2 py-0.5 rounded-md ${darkMode ? "bg-slate-800 text-slate-300" : "bg-white border border-slate-200 text-slate-600"}`}>{t}</span>
                  )) : "None"}
                </div>
              </div>
              <div className="flex items-center gap-2 px-1">
                <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? "bg-slate-600" : "bg-slate-400"}`}></span>
                <span className={`text-[10px] font-bold uppercase tracking-tight ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Blocks Found: {meta.count}</span>
              </div>
            </div>
          )}

          {/* NLP Friendliness */}
          {metricKey === "Content_NLP_Friendly" && (
            <div className="flex flex-col gap-2">
              {meta?.semanticTags && (
                <div className="flex flex-col">
                  <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Semantic Architecture</h5>
                  <div className={`p-2 rounded-lg border flex flex-wrap gap-1.5 font-mono text-[10px] ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    {meta.semanticTags.map((t, idx) => (
                      <span key={idx} className={`px-2 py-0.5 rounded-md ${darkMode ? "bg-slate-800 text-slate-300" : "bg-white border border-slate-200 text-slate-600"}`}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${meta?.hasParagraphs ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                  <span className={`text-[10px] font-bold uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Paragraphs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${meta?.hasLists ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                  <span className={`text-[10px] font-bold uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Lists</span>
                </div>
              </div>
            </div>
          )}

          {/* Keywords & Entities */}
          {metricKey === "Keywords_Entities_Annotated" && (
            <div className={`p-2.5 rounded-lg border flex flex-col gap-2 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Meta Keywords</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${meta?.hasMetaKeywords ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"}`}>
                  {meta?.hasMetaKeywords ? "PRESENT" : "MISSING"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Alt Text Coverage</span>
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
                <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Update Timestamp</h5>
                <div className={`p-2.5 rounded-lg border font-mono text-[10px] ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  {meta?.lastModified || meta?.checked || "No date signal found"}
                </div>
              </div>
              {meta?.daysAgo !== undefined && (
                <div className="flex items-center gap-2 px-1">
                  <div className={`h-1 flex-grow rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden`}>
                    <div className={`h-full rounded-full ${meta.daysAgo <= 30 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.max(10, 100 - (meta.daysAgo / 3.65))}%` }}></div>
                  </div>
                  <span className={`text-[9px] font-black uppercase whitespace-nowrap ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{meta.daysAgo}d Ago</span>
                </div>
              )}
            </div>
          )}

          {/* Internal Linking */}
          {metricKey === "Internal_Linking_AI_Friendly" && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2 rounded-lg border text-center ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`block text-[9px] font-bold opacity-50 uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Internal</span>
                  <span className={`text-sm font-black tracking-tight ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{meta?.internalLinks}</span>
                </div>
                <div className={`p-2 rounded-lg border text-center ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`block text-[9px] font-bold opacity-50 uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Contextual</span>
                  <span className={`text-sm font-black tracking-tight ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{meta?.descriptiveLinks}</span>
                </div>
              </div>
              {meta?.examples?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {meta.examples.map((ex, i) => (
                    <span key={i} className={`text-[10px] px-2 py-0.5 rounded border italic ${darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-100 text-slate-500"}`}>
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
                <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Canonical Signal</h5>
                <div className={`p-2.5 rounded-lg border font-mono text-[10px] break-all ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  {meta?.canonical || "Not Found"}
                </div>
              </div>
              <div className="flex items-center justify-between px-1">
                <span className={`text-[10px] font-bold uppercase ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Noindex Tag</span>
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
                <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Keyword Synergy</h5>
                <div className={`p-2.5 rounded-lg border flex flex-wrap gap-1.5 font-mono text-[10px] ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  {meta?.overlap?.length > 0 ? meta.overlap.map((w, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded-md ${darkMode ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>{w}</span>
                  )) : "Low Entity Alignment"}
                </div>
              </div>
              <div className={`text-[9px] font-medium italic opacity-60 truncate px-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>H1 Matched: {meta?.h1}</div>
            </div>
          )}

          {/* Answer Engine Structure */}
          {metricKey === "Answer_Oriented_Structure" && (
            <div className="flex flex-col gap-2">
              {meta?.pairs?.length > 0 && (
                <div className="flex flex-col">
                  <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Discovered Query-Answer Pairs</h5>
                  <div className={`p-2.5 rounded-xl border flex flex-col gap-3 text-[11px] max-h-[320px] overflow-y-auto pr-2 custom-scrollbar ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                    {meta.pairs.map((pair, i) => (
                      <div key={i} className="flex flex-col gap-1.5 border-b border-slate-800/10 dark:border-slate-100/10 pb-3 last:border-0 last:pb-0">
                        <div className="flex gap-2 items-start text-indigo-500 dark:text-indigo-400 font-bold leading-snug">
                          <span className="flex-shrink-0 opacity-70 italic font-mono uppercase text-[9px] mt-0.5">Q:</span>
                          <span className="italic">{pair.question}</span>
                        </div>
                        <div className={`flex gap-2 items-start leading-relaxed text-[10px] pl-5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          <span className="flex-shrink-0 opacity-70 font-mono uppercase text-[8px] mt-0.5">A:</span>
                          <p>{pair.answer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between px-1 mt-1">
                <span className={`text-[10px] font-bold uppercase ${darkMode ? "text-slate-500" : "text-slate-400"}`}>FAQ Schema Status</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${meta?.pairs?.length > 4 ? (darkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600") : "hidden"}`}>
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
                <div className={`p-2.5 rounded-lg border text-center ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <span className={`block text-[9px] font-bold opacity-50 uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Dense Ps</span>
                  <span className="text-sm font-black text-amber-500">{meta?.longParagraphs}</span>
                </div>
                <div className={`p-2.5 rounded-lg border text-center ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <span className={`block text-[9px] font-bold opacity-50 uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Density</span>
                  <span className={`text-sm font-black ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{meta?.headingFrequency || meta?.headingDensity} P/H</span>
                </div>
              </div>
              <div className={`text-[9px] font-bold opacity-50 text-center uppercase tracking-widest ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Structure: {meta?.totalParagraphs} Paragraphs Total</div>
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
                <div key={i} className={`flex flex-col items-center p-2 rounded-lg border ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                  <span className="text-sm font-black">{item.val}</span>
                  <span className="text-[8px] font-bold uppercase opacity-50 tracking-tighter">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Terminology Consistency */}
          {metricKey === "Terminology_Consistency" && meta?.keyTerms && (
            <div className="flex flex-col">
              <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Primary Entities</h5>
              <div className={`p-2.5 rounded-lg border flex flex-wrap gap-1.5 font-mono text-[10px] ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                {meta.keyTerms.map((term, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-md ${darkMode ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-indigo-50 text-indigo-700 border border-indigo-100"}`}>{term}</span>
                ))}
              </div>
            </div>
          )}

          {/* Attribution & Source */}
          {metricKey === "Author_Source_Attribution" && (
            <div className={`p-2.5 rounded-lg border flex flex-col gap-2 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Byline Visibility</span>
                <span className={`text-[10px] font-black ${meta?.hasByline ? "text-emerald-500" : "text-rose-500"}`}>
                  {meta?.hasByline ? "HUMAN DETECTED" : "ANONYMOUS"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Author Schema</span>
                <span className={`text-[10px] font-black ${meta?.hasAuthorSchema ? "text-emerald-500" : "text-rose-500"}`}>
                  {meta?.hasAuthorSchema ? "ACTIVE" : "MISSING"}
                </span>
              </div>
            </div>
          )}

          {/* Citations & Evidence */}
          {metricKey === "Fact_Vs_Opinion" && (
            <div className="flex flex-col gap-2">
              <div className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                <span className="text-[10px] font-bold uppercase opacity-60">Verified Citations</span>
                <span className="text-sm font-black">{meta?.citations}</span>
              </div>
              <div className="flex items-center justify-between px-1 mt-0.5">
                <span className={`text-[10px] font-bold uppercase ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Bibliography Section</span>
                <span className={`text-[10px] font-black ${meta?.hasReferenceSection ? "text-emerald-500" : "text-slate-400"}`}>
                  {meta?.hasReferenceSection ? "FOUND" : "NOT FOUND"}
                </span>
              </div>
            </div>
          )}

          {/* Content Completeness */}
          {metricKey === "Content_Completeness" && (
            <div className="flex flex-col gap-2">
              <div className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                <span className="text-[10px] font-bold uppercase opacity-60">Quantifiable Depth</span>
                <span className="text-sm font-black tracking-tight">{meta?.wordCount} Words</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-0.5">
                <div className={`p-2 rounded-lg border text-center ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <span className={`block text-[8px] font-bold uppercase opacity-50 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Intro</span>
                  <span className={`text-[10px] font-black ${meta?.hasIntro ? "text-emerald-500" : "text-rose-500"}`}>{meta?.hasIntro ? "YES" : "NO"}</span>
                </div>
                <div className={`p-2 rounded-lg border text-center ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <span className={`block text-[8px] font-bold uppercase opacity-50 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Conclusion</span>
                  <span className={`text-[10px] font-black ${meta?.hasConclusion ? "text-emerald-500" : "text-rose-500"}`}>{meta?.hasConclusion ? "YES" : "NO"}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {analysis && showAnalysis && (
          <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className={`p-3 rounded-lg border ${darkMode ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-100"}`}>
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="text-rose-500 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1">Why This Occurred</h4>
                  <p className={`text-xs leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {analysis.cause}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${darkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"}`}>
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1">How to Fix</h4>
                  <p className={`text-xs leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {analysis.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`mt-auto pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
            Why it matters: <span className="normal-case font-normal opacity-100">{content.whyItMatters || content.why}</span>
          </p>
        </div>

        {/* Ask AI Button */}
        {!isPassed && (
          <AskAIButton
            finding={{ type: 'AIO Readiness', title: title, details: details, severity: isPassed ? 'pass' : 'critical', url: '' }}
            darkMode={darkMode}
            meta={meta}
          />
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
      <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
        {title}
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

export default function AIO() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const darkMode = theme === "dark";

  const auditSteps = useMemo(() => [
    { icon: <Database className="w-8 h-8 text-blue-500" />, title: "Structured Data", text: "Analyzing JSON-LD Schema markup and rich snippets eligibility..." },
    { icon: <MessageSquare className="w-8 h-8 text-purple-500" />, title: "NLP Readiness", text: "Evaluating content structure and semantic clarity for AI models..." },
    { icon: <Zap className="w-8 h-8 text-teal-500" />, title: "Crawl Efficiency", text: "Measuring page load speed and API accessibility for AI bots..." },
    { icon: <Tag className="w-8 h-8 text-indigo-500" />, title: "Entity Recognition", text: "Scanning for named entities, keywords, and topic clusters..." },
    { icon: <Brain className="w-8 h-8 text-amber-500" />, title: "AI Optimization", text: "Checking for voice search compatibility and answer engine readiness..." },
  ], []);

  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (loading || !data || data.status === "inprogress") {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % auditSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);

  if (loading || !data || data.status === "inprogress") {
    return (
      <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>
          {/* ✅ Unified Master Card Loading State */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-slate-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

            {/* 1. URL Header */}
            <div>
              <UrlHeader 
                data={data} 
                darkMode={darkMode} 
                sectionName="AIO (AI Optimization)"
                sectionData={aio}
                auditScore={aio?.Percentage}
              />
            </div>

            <div className="flex flex-col xl:flex-row min-h-[300px]">
              {/* Left Panel: Live Preview (Only if not All) */}
              {data.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              {/* Right/Full Panel: Audit Steps */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full">
                  <AIOShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const aio = data?.aioReadiness || {};
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  const allMetrics = Object.values(aio).filter(val => typeof val === 'object' && val !== null && 'score' in val);
  const passedCount = allMetrics.filter(m => m.status === "pass").length;
  const warningCount = allMetrics.filter(m => m.status === "warning").length;
  const failedCount = allMetrics.filter(m => m.status === "fail").length;

  return (
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>

        {/* ✅ Unified Master Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-slate-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

          {/* 1. URL Header */}
          <div>
            <UrlHeader 
              data={data} 
              darkMode={darkMode} 
              sectionName="AIO (AI Optimization)"
              sectionData={aio}
              auditScore={aio?.Percentage}
            />
          </div>

          {/* 2. Card Body */}
          <div className={`flex flex-col xl:flex-row ${data.report === "All" ? "" : "min-h-[300px]"}`}>

            {/* Left Panel: Live Preview (Only if not All) */}
            {data.report !== "All" && (
              <div className={`w-full xl:w-[45%] ${data.report === "All" ? "p-6 lg:p-10" : "p-3 lg:p-4"} flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>
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
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${darkMode ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-indigo-100/50 text-indigo-600 border border-indigo-200"}`}>
                        <Brain className="w-3.5 h-3.5" />
                        <span>AIO Readiness Report</span>
                      </div>
                      <h3 className={`${data.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                        AIO <span className="text-indigo-500">Readiness</span>
                      </h3>
                      <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        Evaluation of your website's readiness for Artificial Intelligence optimization and crawlers.
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
                          <AlertTriangle size={18} className="text-amber-500" />
                          <span className="text-sm font-bold">{warningCount} Warnings</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle size={18} className="text-rose-500" />
                          <span className="text-sm font-bold">{failedCount} Failed</span>
                        </div>
                      </div>
                      <div className={`w-px h-10 mx-2 hidden sm:block ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}></div>
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border shadow-sm transition-all duration-500 flex items-center gap-3 ${aio?.AIO_Compatibility_Badge === "Yes"
                          ? (darkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white border-emerald-100")
                          : (darkMode ? "bg-rose-500/10 border-rose-500/20" : "bg-white border-rose-100")}`}>

                          {/* Icon Container (Card Style) */}
                          <div className={`p-2 rounded-lg ${aio?.AIO_Compatibility_Badge === "Yes"
                            ? (darkMode ? "bg-emerald-500/20" : "bg-emerald-50")
                            : (darkMode ? "bg-rose-500/20" : "bg-rose-50")}`}>
                            <ShieldCheck size={20} className={aio?.AIO_Compatibility_Badge === "Yes" ? "text-emerald-500" : "text-rose-500"} />
                          </div>

                          {/* Text Area */}
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-bold uppercase tracking-widest opacity-60 ${darkMode ? "text-white" : "text-slate-900"}`}>
                              AIO Compatibility
                            </span>
                            <span className={`text-sm font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                              {aio?.AIO_Compatibility_Badge === "Yes" ? "Compatible" : "Not Optimized"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`w-px h-4 ${darkMode ? "bg-slate-800" : "bg-slate-200 hidden md:block"}`}></div>
                      <button
                        onClick={() => setSelectedMetricInfo(scoreCalculationInfo)}
                        className={`flex items-center gap-2 text-sm font-bold transition-all ${darkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"}`}
                      >
                        <Info size={16} />
                        <span className="border-b border-transparent hover:border-current">Metric Methodology</span>
                      </button>
                    </div>
                  </div>

                  {/* Circular Progress */}
                  <div className="relative flex-shrink-0 group cursor-default order-1 md:order-2">
                    <div className={`absolute -inset-8 rounded-full blur-3xl opacity-25 transition-opacity duration-700 group-hover:opacity-40 ${aio?.Percentage >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                    <CircularProgress value={aio?.Percentage || 0} size={data.report === "All" ? 180 : 150} stroke={14} />
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                      <span className={`${data.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{aio?.Percentage || 0}%</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Gated Detailed Audit Sections */}
        <ReportRestrictionWrapper>
          <div className="space-y-8">
            <Section title="AI Technical & Crawl Foundation" icon={Database} darkMode={darkMode}>
          {["Structured_Data", "Duplicate_Content_Detection_Ready", "Internal_Linking_AI_Friendly", "Content_Updated_Regularly"].map((key) => (
            aio[key] && <MetricCard key={key} metricKey={key} data={aio[key]} darkMode={darkMode} onInfo={() => setSelectedParameterInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
          ))}
        </Section>

        <Section title="Intelligence & Semantic Clarity" icon={Brain} darkMode={darkMode}>
          {["Content_NLP_Friendly", "Keywords_Entities_Annotated", "Topical_Focus_Clarity", "Terminology_Consistency", "Content_Completeness"].map((key) => (
            aio[key] && <MetricCard key={key} metricKey={key} data={aio[key]} darkMode={darkMode} onInfo={() => setSelectedParameterInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
          ))}
        </Section>

            <Section title="E-E-A-T & Answer Optimization" icon={HelpCircle} darkMode={darkMode}>
              {/* Answer Oriented Structure spans full width because it contains detailed Q&A pairs */}
              {aio["Answer_Oriented_Structure"] && (
                <div className="md:col-span-2">
                  <MetricCard
                    metricKey="Answer_Oriented_Structure"
                    data={aio["Answer_Oriented_Structure"]}
                    darkMode={darkMode}
                    onInfo={() => setSelectedParameterInfo({ ...educationalContent["Answer_Oriented_Structure"], icon: iconMap["Answer_Oriented_Structure"] || HelpCircle })}
                  />
                </div>
              )}
              {["Content_Chunking", "Lists_Structured_Blocks", "Author_Source_Attribution", "Fact_Vs_Opinion"].map((key) => (
                aio[key] && <MetricCard key={key} metricKey={key} data={aio[key]} darkMode={darkMode} onInfo={() => setSelectedParameterInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
              ))}
            </Section>

          </div>
        </ReportRestrictionWrapper>
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
}