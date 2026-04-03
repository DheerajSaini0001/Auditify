import React, { useContext, useMemo, useState } from "react";
import UrlHeader from "../Component/UrlHeader";
import ReportRestrictionWrapper from "../Component/ReportRestrictionWrapper";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  Layout, Type, Smartphone, MoveHorizontal, PanelTop, Menu,
  ChevronRight, ChevronUp, Compass, Touchpad, BookOpen, Layers, Image as ImageIcon,
  XOctagon, MonitorPlay, MousePointer2, CheckCircle2, Loader2,
  ExternalLink, CheckCircle, XCircle, Info, Search, Unlink, Tag, AlertTriangle,
  ListTree, AlignLeft, Grid3X3, Repeat, AppWindow, Anchor, Navigation
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import { InfoDetails } from "../Component/InfoDetails";
import AskAIButton from "../Component/AskAIButton";

const iconMap = {
  Text_Readability: BookOpen,
  Sticky_Header_Usage: PanelTop,
  Intrusive_Interstitials: XOctagon,
  Breadcrumbs: ChevronRight,
  Navigation_Discoverability: Compass,
  Above_the_Fold_Content: MonitorPlay,
  Interactive_Click_Feedback: MousePointer2,
  Loading_Feedback: Loader2,
  Broken_Links: Unlink,
  UX_Content_Hierarchy_Clarity: ListTree,
  Section_Labeling_Clarity: AlignLeft,
  Content_Density_Balance: Grid3X3,
  Page_to_Page_Flow: Repeat,
  Layout_Consistency: AppWindow,
  In_Page_Navigation: Anchor
};

const uxEducationalContent = InfoDetails;
const scoreCalculationInfo = InfoDetails.UX_And_Content_Methodology;


const UxShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
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

const MetricCard = ({ title, description, score, status, analysis, meta, darkMode, icon: Icon, type, className, onInfo }) => {
  const isPassed = status === 'pass' || score === 100;
  const isWarning = status === 'warning' || score === 50;
  const [isOpen, setIsOpen] = useState(false);

  // Get static educational content
  const info = InfoDetails[type] || {};
  const reasons = info.actualReasonsForFailure || [];
  const recommendations = info.howToOvercomeFailure || [];

  // Simple Colors
  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";

  let statusBg = "bg-rose-500";
  let statusBorder = "border-rose-500";
  let statusTextColor = "text-rose-500";
  let statusLabel = "Needs Improvement";

  if (isPassed) {
    statusBg = "bg-emerald-500";
    statusBorder = "border-emerald-500";
    statusTextColor = "text-emerald-500";
    statusLabel = "Optimized";
  } else if (isWarning) {
    statusBg = "bg-amber-500";
    statusBorder = "border-amber-500";
    statusTextColor = "text-amber-500";
    statusLabel = "Warning";
  }

  const statusColor = `${statusTextColor} ${statusBg}/10 ${statusBorder}/20`;

  return (
    <div className={`relative overflow-hidden rounded-xl border ${cardBg} shadow-sm hover:shadow-md transition-shadow group ${className || ""}`}>
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
              <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full w-fit border ${statusColor}`}>
                {statusLabel}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {!isPassed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors ${isOpen ? (darkMode ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-800") : (darkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")}`}
                title="Toggle Analysis"
              >
                {isOpen ? "Hide Detail" : "View Detail"}
              </button>
            )}

            {onInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo();
                }}
                className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
                title="View Methodology"
              >
                <Info size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
            Description: <span className={`normal-case font-normal opacity-100 text-xs leading-relaxed ${subTextColor}`}>{info.whatThisParameterIs || "No details available."}</span>
          </p>
        </div>

        <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${darkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
          <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${isPassed ? "bg-emerald-500/10 text-emerald-500" : isWarning ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"}`}>
            {isPassed ? <CheckCircle size={14} /> : isWarning ? <AlertTriangle size={14} /> : <XCircle size={14} />}
          </div>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wide mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Key Insight
            </h4>
            <p className={`text-sm font-medium leading-relaxed ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
              {description}
            </p>
          </div>
        </div>

        {/* Audit Details Area */}
        <div className="space-y-6">
          {/* Inline Meta Attributes */}
          <div className="space-y-4">
            {/* 1. Content & Readability Section */}
            {type === "Text_Readability" && meta?.overallStats && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Page Target</h5>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700"}`}>
                    {meta.pageType} ({meta.targetMin}-{meta.targetMax})
                  </span>
                </div>
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Readability Index</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <span>Complexity Score:</span>
                    <span>{meta.overallStats.score?.toFixed(1)} / 100</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <p className="opacity-70 mb-1">Sentences</p>
                    <p className="font-bold">{meta.overallStats.sentenceCount} found</p>
                  </div>
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <p className="opacity-70 mb-1">Avg Length</p>
                    <p className="font-bold">{meta.overallStats.ASL?.toFixed(1)} words</p>
                  </div>
                </div>

                {/* Problematic Sentences */}
                {meta.problematicContent?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dashed border-slate-700/50">
                    <h5 className={`text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>
                      <AlertTriangle size={14} />
                      Hard-to-Read Content
                    </h5>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1.5 custom-scrollbar">
                      {meta.problematicContent.map((item, idx) => (
                        <div key={idx} className={`group relative p-2.5 rounded-lg border transition-all duration-300 hover:scale-[1.01] ${darkMode ? "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10" : "bg-rose-50/50 border-rose-100 hover:bg-rose-50"}`}>
                          <p className={`text-[11px] leading-relaxed italic mb-1.5 ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                            "{item.text}"
                          </p>
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight ${darkMode ? "bg-rose-500/20 text-rose-300" : "bg-rose-100 text-rose-700"}`}>
                            <Info size={10} />
                            {item.reason}
                          </div>

                          {/* Score Badge */}
                          <div className={`absolute top-2 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${item.score < 30 ? "bg-rose-500 text-white" : "bg-amber-500 text-white"}`}>
                            Score: {Math.round(item.score)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {type === "UX_Content_Hierarchy_Clarity" && meta && (
              <div className="space-y-3">
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Heading Distro</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-indigo-400"></span>
                    <span className="break-all">{meta.h1Count} H1 found | {meta.totalHeadings} total tags</span>
                  </div>
                </div>
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Sequence Logic</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.isSequential ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                    <span className="break-all">{meta.isSequential ? "Perfect Nesting" : "Non-sequential levels detected"}</span>
                  </div>
                </div>
              </div>
            )}

            {type === "Section_Labeling_Clarity" && meta && (
              <div>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Semantic Clarity</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-400"></span>
                  <span className="break-all">{meta.labeledCount} of {meta.totalSections} sections correctly labeled</span>
                </div>
              </div>
            )}

            {type === "Content_Density_Balance" && meta && (
              <div className="space-y-3">
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Visual Load</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <span>Density Score:</span>
                    <span>{meta.densityScore?.toFixed(2)} pts</span>
                  </div>
                </div>
                <div className={`p-2 rounded border font-mono text-[10px] flex justify-between ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  <span className="opacity-70">Text Volume:</span>
                  <span className="font-bold">{meta.charCount?.toLocaleString()} chars</span>
                </div>
              </div>
            )}

            {/* 2. Navigation & Flow Section */}
            {type === "Navigation_Discoverability" && meta && (
              <div>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Discovery Assets</h5>
                <div className="grid grid-cols-1 gap-1.5 mt-2">
                  {[
                    { l: "Global Nav", v: meta.hasNavMenu },
                    { l: "Mobile Menu", v: meta.hasHamburger },
                    { l: "Search Field", v: meta.hasSearch }
                  ].map((item, i) => (
                    <div key={i} className={`p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <span className={darkMode ? "text-slate-300" : "text-slate-600"}>{item.l}:</span>
                      <span className={item.v ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>{item.v ? "ACTIVE" : "MISSING"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === "Breadcrumbs" && meta && (
              <div>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Path Anchors</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-400"></span>
                  <span className="break-all">{meta.isHomepage ? "Homepage (Exempt)" : (status === 'pass' ? "Secondary Path Active" : "No path trail found")}</span>
                </div>
              </div>
            )}

            {type === "In_Page_Navigation" && meta && (
              <div>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Local Routing</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-400"></span>
                  <span className="break-all">{meta.anchorLinks} Skip-links | Top-scroll: {meta.backToTop ? "Yes" : "No"}</span>
                </div>
              </div>
            )}

            {type === "Page_to_Page_Flow" && meta && (
              <div className="space-y-2">
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Traversal Map</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <p className="opacity-70 mb-1">Next Steps</p>
                    <p className="font-bold">{meta.nextStepCTAs} Buttons Found</p>
                  </div>
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <p className="opacity-70 mb-1">Inter-linking</p>
                    <p className="font-bold">{meta.internalLinks} Internal links</p>
                  </div>
                </div>
                <div className={`p-2 rounded border font-mono text-[10px] flex justify-between ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  <span className="opacity-70">Site Footer:</span>
                  <span className={meta.hasFooter ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>{meta.hasFooter ? "ACTIVE" : "MISSING"}</span>
                </div>
              </div>
            )}

            {/* 3. Interactive Experience Section */}
            {type === "Interactive_Click_Feedback" && meta && (
              <div className="space-y-2">
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>State Response</h5>
                <div className={`p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.withFeedback === meta.totalInteractive ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                  <span className="break-all">{meta.withFeedback} of {meta.totalInteractive} assets react</span>
                </div>

                {meta.elements?.length > 0 && (
                  <div className="grid grid-cols-1 gap-1 max-h-[80px] overflow-y-auto pr-1 custom-scrollbar border-t border-dashed border-slate-700/30 pt-2">
                    {meta.elements.map((el, idx) => (
                      <div key={idx} className={`flex items-center justify-between gap-2 p-1 rounded border text-[9px] ${darkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-slate-50 border-slate-200/50"}`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`font-bold opacity-60 uppercase scale-90 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            {el.tag}
                          </span>
                          <p className={`font-medium truncate ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                            {el.text || 'Unnamed'}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <div className={`w-0.5 h-0.5 rounded-full ${el.feedback.hoverChanged ? "bg-emerald-500" : "bg-slate-300/20"}`} />
                          <div className={`w-0.5 h-0.5 rounded-full ${el.feedback.activeChanged ? "bg-emerald-500" : "bg-slate-300/20"}`} />
                          <div className={`w-0.5 h-0.5 rounded-full ${el.feedback.focusChanged ? "bg-emerald-500" : "bg-slate-300/20"}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {type === "Loading_Feedback" && meta?.summary && (
              <div>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Async Signals</h5>
                <div className="grid grid-cols-1 gap-1.5 mt-2">
                  {[
                    { l: "Spinners", v: meta.summary.spinners },
                    { l: "Skeletons", v: meta.summary.skeletons },
                    { l: "Text Indicators", v: meta.summary.textLoading?.length || 0 }
                  ].map((item, i) => (
                    <div key={i} className={`p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <span className={darkMode ? "text-slate-300" : "text-slate-600"}>{item.l}:</span>
                      <span className={item.v > 0 ? "text-emerald-500 font-bold" : "text-slate-400"}>{item.v} detected</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === "Broken_Links" && meta && (
              <div className="space-y-3">
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>URL Health</h5>
                <div className={`p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  <span className="opacity-70">Results:</span>
                  <span className={meta.brokenCount > 0 ? "text-rose-500 font-bold" : "text-emerald-500 font-bold"}>{meta.brokenCount} Broken / {meta.totalChecked} Checked</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <p className="opacity-70 mb-1">Internal</p>
                    <p className="font-bold">{meta.totalInternal} links</p>
                  </div>
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <p className="opacity-70 mb-1">External</p>
                    <p className="font-bold">{meta.totalExternal} links</p>
                  </div>
                </div>

                {/* Broken Links List */}
                {meta.brokenLinks?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dashed border-slate-700/50">
                    <h5 className={`text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>
                      <Unlink size={14} />
                      Identified Broken Links
                    </h5>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1.5 custom-scrollbar">
                      {meta.brokenLinks.map((link, idx) => (
                        <div key={idx} className={`p-2 rounded-lg border flex items-start justify-between gap-2.5 text-[10px] transition-colors ${darkMode ? "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10" : "bg-rose-50 border-rose-100 hover:bg-rose-100"}`}>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold truncate text-[10px] mb-0.5 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                              {link.text || 'Anchor Link'}
                            </p>
                            <p className="truncate opacity-60 font-mono text-[8px]">{link.url}</p>
                          </div>
                          <div className={`flex-shrink-0 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter text-[9px] ${darkMode ? "bg-rose-500/20 text-rose-400" : "bg-rose-100 text-rose-700"}`}>
                            {link.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Mobile Layout & Stability Section */}
            {type === "Above_the_Fold_Content" && meta && (
              <div className="space-y-3">
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Initial Exposure</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <p className="opacity-70 mb-1">ATF Score</p>
                    <p className="font-bold text-indigo-500">{meta.atfScore}%</p>
                  </div>
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <p className="opacity-70 mb-1">Viewport</p>
                    <p className="font-bold">{meta.viewportHeight}px</p>
                  </div>
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <p className="opacity-70 mb-1">Visible Assets</p>
                    <p className="font-bold">{meta.importantVisible}</p>
                  </div>
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <p className="opacity-70 mb-1">Total Assets</p>
                    <p className="font-bold">{meta.totalImportant}</p>
                  </div>
                </div>
              </div>
            )}

            {type === "Sticky_Header_Usage" && meta && (
              <div>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Viewport Footprint</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-400"></span>
                  <span className="break-all">{meta.height}px height used (Max: {meta.limit}px)</span>
                </div>
              </div>
            )}

            {type === "Intrusive_Interstitials" && meta && (
              <div>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Obstruction Level</h5>
                <div className="grid grid-cols-1 gap-1.5 mt-2">
                  {[
                    { l: "Full Overlay", v: meta.hasOverlay },
                    { l: "Scroll Block", v: meta.hasScrollBlock },
                    { l: "Modal Shield", v: meta.hasModal }
                  ].map((item, i) => (
                    <div key={i} className={`p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <span className={darkMode ? "text-slate-300" : "text-slate-600"}>{item.l}:</span>
                      <span className={item.v ? "text-rose-500 font-bold" : "text-emerald-500 font-bold"}>{item.v ? "ACTIVE" : "NONE"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === "Layout_Consistency" && meta && (
              <div>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Grid Engine</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-400"></span>
                  <span className="break-all">{meta.hasFlexOrGrid ? "Modern Flex/Grid Layout" : "Legacy Structural Pattern"}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`mt-auto pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
            Why it matters: <span className="normal-case font-normal opacity-100">{info.whyItMatters || "Important for user experience."}</span>
          </p>
        </div>

        {/* Expanded Analysis Content */}
        {isOpen && (
          <div className={`mt-3 p-3 rounded-lg text-xs leading-relaxed border animate-in slide-in-from-top-2 duration-200 ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-600"}`}>

            {/* Cause */}
            {(analysis?.cause || reasons.length > 0) && (
              <div className="mb-4">
                <p className={`font-semibold mb-1 ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Cause:</p>
                <div className="pl-1 opacity-90">
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
            )}

            {/* Recommendation */}
            {(analysis?.recommendation || recommendations.length > 0) && (
              <div>
                <p className={`font-semibold mb-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Recommendation:</p>
                <div className="pl-1 opacity-90">
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
            )}
          </div>
        )}

        {/* Ask AI Button */}
        {!isPassed && (
          <AskAIButton
            finding={{ type: 'UX & Content Structure', title: title, details: description, severity: isPassed ? 'pass' : isWarning ? 'warning' : 'critical', url: '' }}
            darkMode={darkMode}
            meta={meta}
          />
        )}
      </div>
    </div >
  );
};

const Section = ({ title, icon: Icon, children, darkMode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 px-2">
      <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
        <Icon size={20} />
      </div>
      <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
        {title}
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {children}
    </div>
  </div>
);

export default function UX_Content_Structure() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const darkMode = theme === "dark";

  const auditSteps = useMemo(() => [
    { icon: <BookOpen className="w-8 h-8 text-blue-500" />, title: "Content & Readability", text: "Analyzing language complexity, text flow, and reading ease for optimal engagement..." },
    { icon: <ListTree className="w-8 h-8 text-purple-500" />, title: "Visual Hierarchy", text: "Evaluating heading structure and content organization for clear information flow..." },
    { icon: <Compass className="w-8 h-8 text-teal-500" />, text: "Verifying navigation discoverability, breadcrumbs, and in-page anchor links..." },
    { icon: <MonitorPlay className="w-8 h-8 text-indigo-500" />, title: "Interactive Experience", text: "Measuring ATF content visibility, click feedback, and layout consistency..." },
    { icon: <Loader2 className="w-8 h-8 text-amber-500" />, title: "Usability Signals", text: "Checking for broken links, loading feedback, and intrusive interstitials..." },
  ], []);

  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (loading || !data?.UXOrContentStructure) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % auditSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);

  if (!data?.UXOrContentStructure) {
    return (
      <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>
          {/* ✅ Unified Master Card Loading State */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

            {/* 1. URL Header */}
            <div>
              <UrlHeader 
                data={data} 
                darkMode={darkMode} 
                sectionName="UX & Content Structure"
                sectionData={results}
                auditScore={overallScore}
              />
            </div>

            <div className="flex flex-col xl:flex-row min-h-[300px]">
              {/* Left Panel: Live Preview (Only if not All) */}
              {data.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              {/* Right/Full Panel: Audit Steps */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full">
                  <UxShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const results = data.UXOrContentStructure;
  const overallScore = results.Percentage || 0;
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  const metrics = Object.keys(results).filter(k => {
    const metric = results[k];
    if (typeof metric !== 'object') return false;
    const scoreVal = metric.Score ?? metric.score;
    if (scoreVal === undefined) return false;

    // Skip Breadcrumbs on homepage
    const meta = metric.Meta ?? metric.meta;
    if (k === 'Breadcrumbs' && meta?.isHomepage) return false;
    return true;
  });

  const getStatus = (key) => results[key]?.Status ?? results[key]?.status;
  const getScoreValue = (key) => results[key]?.Score ?? results[key]?.score ?? 0;

  const passedCount = metrics.filter(k => getStatus(k) === 'pass').length;
  const warningCount = metrics.filter(k => getStatus(k) === 'warning').length;
  const failedCount = metrics.filter(k => getStatus(k) === 'fail').length;

  // Define column spans for metrics with potentially large content
  const spanMap = {
    Text_Readability: "md:col-span-2",
    UX_Content_Hierarchy_Clarity: "md:col-span-2",
    Above_the_Fold_Content: "md:col-span-2",
    Navigation_Discoverability: "md:col-span-2",
    In_Page_Navigation: "md:col-span-2",
    Broken_Links: "md:col-span-2",
    Page_to_Page_Flow: "md:col-span-2",
  };

  const detailedKeys = [
    "Text_Readability",
    "UX_Content_Hierarchy_Clarity",
    "Navigation_Discoverability",
    "In_Page_Navigation",
    "Broken_Links",
    "Page_to_Page_Flow"
  ];

  const sectionDefinitions = [
    {
      title: "Content & Readability",
      icon: BookOpen,
      keys: ["Text_Readability", "UX_Content_Hierarchy_Clarity", "Section_Labeling_Clarity", "Content_Density_Balance"]
    },
    {
      title: "Navigation & Flow",
      icon: Compass,
      keys: ["Navigation_Discoverability", "Breadcrumbs", "In_Page_Navigation", "Page_to_Page_Flow"]
    },
    {
      title: "Interactive Experience",
      icon: MousePointer2,
      keys: ["Interactive_Click_Feedback", "Loading_Feedback", "Broken_Links"]
    },
    {
      title: "Mobile Layout & Stability",
      icon: Smartphone,
      keys: ["Above_the_Fold_Content", "Sticky_Header_Usage", "Intrusive_Interstitials", "Layout_Consistency"]
    }
  ];

  return (
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-12`}>

        {/* ✅ Unified Master Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

          {/* 1. URL Header */}
          <div>
            <UrlHeader 
              data={data} 
              darkMode={darkMode} 
              sectionName="UX & Content Structure"
              sectionData={results}
              auditScore={overallScore}
            />
          </div>

          {/* 2. Card Body */}
          <div className={`flex flex-col xl:flex-row ${data.report === "All" ? "" : "min-h-[300px]"}`}>

            {/* Left Panel: Live Preview (Only if not All) */}
            {data.report !== "All" && (
              <div className={`w-full xl:w-[45%] ${data.report === "All" ? "p-6 lg:p-10" : "p-3 lg:p-4"} flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
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
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-100/50 text-blue-600 border border-blue-200"}`}>
                        <Layout className="w-3.5 h-3.5" />
                        <span>UX Audit</span>
                      </div>
                      <h3 className={`${data.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                        UX & <span className="text-blue-500">Content</span>
                      </h3>
                      <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        Detailed performance breakdown of user experience and content organization.
                      </p>
                    </div>

                    {/* Stats & Tools */}
                    <div className={`flex flex-wrap items-center ${data.report === "All" ? "gap-6" : "gap-5"}`}>
                      <div className={`flex flex-wrap items-center ${data.report === "All" ? "gap-5" : "gap-4"}`}>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-emerald-500" />
                          <span className="text-sm font-bold">{passedCount} Passed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={18} className="text-amber-500" />
                          <span className="text-sm font-bold">{warningCount} Warning</span>
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
                    <CircularProgress value={overallScore} size={data.report === "All" ? 180 : 150} stroke={14} />
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                      <span className={`${data.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{overallScore}%</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Filtered Sections */}
        <ReportRestrictionWrapper>
          <div className="space-y-12">
            {sectionDefinitions.map((section, idx) => (
              <Section key={idx} title={section.title} icon={section.icon} darkMode={darkMode}>
                {section.keys.map((key) => {
                  const metric = results[key];
                  if (!metric) return null;
                  return (
                    <MetricCard
                      key={key}
                      type={key}
                      title={key.replaceAll("_", " ")}
                      description={metric.Details || metric.details}
                      score={getScoreValue(key)}
                      status={getStatus(key)}
                      meta={metric.Meta || metric.meta}
                      analysis={metric.Analysis || metric.analysis}
                      darkMode={darkMode}
                      icon={iconMap[key] || Layout}
                      className={spanMap[key] || ""}
                      onInfo={() => setSelectedParameterInfo({ ...uxEducationalContent[key], icon: iconMap[key] || Layout })}
                    />
                  );
                })}
              </Section>
            ))}
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