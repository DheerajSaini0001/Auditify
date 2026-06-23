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
  ListTree, AlignLeft, Grid3X3, Repeat, AppWindow, Anchor, Navigation, SlidersHorizontal,
  SearchX, Award, DollarSign, FileText, Users, ShieldCheck
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import { InfoDetails } from "../Component/InfoDetails";
import AskAIButton from "../Component/AskAIButton";
import { isVisibleForAudience, isActionableParam } from "../config/parameterAudience";

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
  Hierarchy_Flow_Clarity: ListTree,
  Content_Density_Balance: Grid3X3,
  Layout_Consistency: AppWindow,
  Mobile_Experience: Smartphone,
  In_Page_Navigation: Anchor,
  Inventory_Filtering: SlidersHorizontal,
  No_Results_UX: SearchX,
  Vehicle_Image_Gallery: ImageIcon
};

const uxEducationalContent = InfoDetails;
const scoreCalculationInfo = InfoDetails.UX_And_Content_Methodology;


const UxShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
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
        <div className="mt-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-accent dark:text-blue-400">
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

const MetricCard = ({ title, description, score, status, analysis, meta, darkMode, icon: Icon, type, className, onInfo }) => {
  const isPassed = status === 'pass' || score === 100;
  const isWarning = status === 'warning' || score === 50;
  const [isOpen, setIsOpen] = useState(false);

  // Get static educational content
  const info = InfoDetails[type] || {};
  const reasons = info.actualReasonsForFailure || [];
  const recommendations = info.howToOvercomeFailure || [];

  // Simple Colors
  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-card border-line";
  const textColor = darkMode ? "text-gray-100" : "text-ink";
  const subTextColor = darkMode ? "text-gray-400" : "text-muted";

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
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-accentsoft"} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} className={darkMode ? "text-blue-400" : "text-accent"} />
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${textColor}`}>{title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <p className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit border ${statusColor}`}>
                  {statusLabel}
                </p>
                {meta?.infoOnly && (
                  <span
                    title="Informational — not included in the section score"
                    className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide ${darkMode ? "bg-slate-700/50 text-slate-300 border-slate-600" : "bg-cardsoft text-muted border-line"}`}
                  >
                    Info · not scored
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {!isPassed && isActionableParam(type) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded transition-colors ${isOpen ? (darkMode ? "bg-slate-700 text-slate-200" : "bg-cardsoft text-ink") : (darkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-muted hover:text-ink hover:bg-cardsoft")}`}
                title="Toggle Analysis"
              >
                {isOpen ? "Hide Detail" : "View Detail"}
              </button>
            )}

            {onInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo({ ...info, icon: Icon });
                }}
                className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-faint hover:text-ink"}`}
                title="View Methodology"
              >
                <Info size={18} />
              </button>
            )}
          </div>
        </div>



        <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${darkMode ? "bg-slate-800/50" : "bg-cardsoft"}`}>
          <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${isPassed ? "bg-emerald-500/10 text-emerald-500" : isWarning ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"}`}>
            {isPassed ? <CheckCircle size={14} /> : isWarning ? <AlertTriangle size={14} /> : <XCircle size={14} />}
          </div>
          <div>
            <h4 className={`text-xs font-semibold uppercase tracking-wide mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>
              Key Insight
            </h4>
            <p className={`text-sm font-medium leading-relaxed ${darkMode ? "text-slate-200" : "text-inksoft"}`}>
              {description}
            </p>
          </div>
        </div>

        {/* Ask AI Button */}
        {!isPassed && (
          <AskAIButton
            finding={{
              type: 'UX & Content Structure',
              title: title,
              details: description || '',
              severity: isPassed ? 'pass' : isWarning ? 'warning' : 'critical',
              url: ''
            }}
            darkMode={darkMode}
            meta={meta}
            paramKey={type}
          />
        )}

        {/* Audit Details Area */}
        <div className="space-y-6">
          {/* Inline Meta Attributes */}
          <div className="space-y-4">
            {/* 1. Content & Readability Section */}
            {type === "Text_Readability" && meta?.overallStats && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-muted"}`}>Page Target</h5>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-accentsoft text-accent"}`}>
                    {meta.pageType} ({meta.targetMin}-{meta.targetMax})
                  </span>
                </div>
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Readability Index</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <span>Complexity Score:</span>
                    <span>{meta.overallStats.score?.toFixed(1)} / 100</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <p className="opacity-70 mb-1">Sentences</p>
                    <p className="font-semibold">{meta.overallStats.sentenceCount} found</p>
                  </div>
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <p className="opacity-70 mb-1">Avg Length</p>
                    <p className="font-semibold">{meta.overallStats.ASL?.toFixed(1)} words</p>
                  </div>
                </div>

                {/* Problematic Sentences */}
                {meta.problematicContent?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dashed border-slate-700/50">
                    <h5 className={`text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>
                      <AlertTriangle size={14} />
                      Hard-to-Read Content
                    </h5>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1.5 custom-scrollbar">
                      {meta.problematicContent.map((item, idx) => (
                        <div key={idx} className={`group relative p-2.5 rounded-lg border transition-all duration-300 hover:scale-[1.01] ${darkMode ? "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10" : "bg-rose-50/50 border-rose-100 hover:bg-rose-50"}`}>
                          <p className={`text-[11px] leading-relaxed italic mb-1.5 ${darkMode ? "text-slate-200" : "text-inksoft"}`}>
                            "{item.text}"
                          </p>
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-tight ${darkMode ? "bg-rose-500/20 text-rose-300" : "bg-rose-100 text-rose-700"}`}>
                            <Info size={10} />
                            {item.reason}
                          </div>

                          {/* Score Badge */}
                          <div className={`absolute top-2 right-2 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded ${item.score < 30 ? "bg-rose-500 text-white" : "bg-amber-500 text-white"}`}>
                            Score: {Math.round(item.score)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {type === "Hierarchy_Flow_Clarity" && meta && (
              <div className="space-y-3">
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Heading Hierarchy</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.h1Count === 1 && meta.isSequential ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                    <span className="break-all">{meta.h1Count} H1 / {meta.totalHeadings} headings · {meta.isSequential ? "sequential" : "skips levels"}</span>
                  </div>
                </div>
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Section Labeling</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-400"></span>
                    <span className="break-all">{meta.labeledCount} of {meta.totalSections} sections labeled</span>
                  </div>
                </div>
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Onward Flow</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "Footer", v: meta.hasFooter ? "Yes" : "No", ok: meta.hasFooter },
                      { l: "Internal links", v: meta.internalLinks, ok: meta.internalLinks > 2 },
                      { l: "Next steps", v: meta.nextStepCTAs, ok: meta.nextStepCTAs > 0 }
                    ].map((item, i) => (
                      <div key={i} className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                        <p className="opacity-70 mb-1">{item.l}</p>
                        <p className={`font-semibold ${item.ok ? "text-emerald-500" : "text-rose-500"}`}>{item.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {type === "Section_Labeling_Clarity" && meta && (
              <div>
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Semantic Clarity</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-400"></span>
                  <span className="break-all">{meta.labeledCount} of {meta.totalSections} sections correctly labeled</span>
                </div>
              </div>
            )}

            {type === "Content_Density_Balance" && meta && (
              <div className="space-y-3">
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Visual Load</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <span>Density Score:</span>
                    <span>{meta.densityScore?.toFixed(2)} pts</span>
                  </div>
                </div>
                <div className={`p-2 rounded border font-mono text-[10px] flex justify-between ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className="opacity-70">Text Volume:</span>
                  <span className="font-semibold">{meta.charCount?.toLocaleString()} chars</span>
                </div>
              </div>
            )}

            {/* 2. Navigation & Flow Section */}
            {type === "Navigation_Discoverability" && meta && (
              <div className="space-y-3">
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Discovery Assets</h5>
                  <div className="grid grid-cols-1 gap-1.5 mt-2">
                    {[
                      { l: "Global Nav", v: meta.hasNavMenu },
                      { l: "Mobile Menu", v: meta.hasHamburger }
                    ].map((item, i) => (
                      <div key={i} className={`p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-cardsoft border-line"}`}>
                        <span className={darkMode ? "text-slate-300" : "text-muted"}>{item.l}:</span>
                        <span className={item.v ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>{item.v ? "ACTIVE" : "MISSING"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Site Search — three-dimension breakdown */}
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between ${darkMode ? "text-slate-400" : "text-muted"}`}>
                    <span>Site Search</span>
                    {meta.search?.present && meta.search?.type && (
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-accentsoft text-accent"}`}>
                        {meta.search.type.toUpperCase()}
                      </span>
                    )}
                  </h5>
                  <div className="grid grid-cols-1 gap-1.5 mt-2">
                    {[
                      { l: "Present", v: !!(meta.search?.present ?? meta.hasSearch) },
                      { l: "Discoverable", v: !!meta.search?.discoverable },
                      { l: "Functional", v: !!meta.search?.functional }
                    ].map((item, i) => (
                      <div key={i} className={`p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-cardsoft border-line"}`}>
                        <span className={darkMode ? "text-slate-300" : "text-muted"}>{item.l}:</span>
                        <span className={item.v ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>{item.v ? "YES" : "NO"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {type === "Breadcrumbs" && meta && (
              <div>
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Path Anchors</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-400"></span>
                  <span className="break-all">{meta.isHomepage ? "Homepage (Exempt)" : (status === 'pass' ? "Secondary Path Active" : "No path trail found")}</span>
                </div>
              </div>
            )}

            {type === "In_Page_Navigation" && meta && (
              <div>
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Local Routing</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-400"></span>
                  <span className="break-all">{meta.anchorLinks} Skip-links | Top-scroll: {meta.backToTop ? "Yes" : "No"}</span>
                </div>
              </div>
            )}

            {type === "Inventory_Filtering" && meta && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-muted"}`}>Filtering Quality</h5>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${meta.context === 'srp' ? (darkMode ? "bg-blue-500/20 text-blue-400" : "bg-accentsoft text-accent") : (darkMode ? "bg-slate-600/30 text-slate-300" : "bg-cardsoft text-muted")}`}>
                    {meta.context === 'srp' ? 'Inventory Page' : meta.context === 'homepage' ? 'Homepage Finder · Info' : 'N/A'}
                  </span>
                </div>

                {/* SRP: facet coverage + mechanism + feedback */}
                {meta.context === 'srp' && (
                  <>
                    <div>
                      <p className={`text-[10px] mb-1.5 ${darkMode ? "text-slate-400" : "text-muted"}`}>Core facets detected ({meta.coreFacetsFound?.length || 0}/6)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["make", "model", "year", "price", "mileage", "bodyType"].map((f) => {
                          const on = meta.coreFacetsFound?.includes(f);
                          return (
                            <span key={f} className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${on ? (darkMode ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-600 border-emerald-200") : (darkMode ? "bg-slate-800/50 text-slate-500 border-slate-700" : "bg-cardsoft text-faint border-line")}`}>
                              {f === "bodyType" ? "body" : f}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { l: "Result count", v: meta.feedback?.hasResultCount },
                        { l: "Active chips", v: meta.feedback?.hasActiveChips },
                        { l: "Clear filters", v: meta.feedback?.hasClearReset },
                        { l: "Sort control", v: meta.feedback?.hasSort },
                        { l: "Range sliders", v: meta.mechanismRich }
                      ].map((item, i) => (
                        <div key={i} className={`p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-cardsoft border-line"}`}>
                          <span className={darkMode ? "text-slate-300" : "text-muted"}>{item.l}:</span>
                          <span className={item.v ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>{item.v ? "YES" : "NO"}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Homepage: finder widget summary */}
                {meta.context === 'homepage' && (
                  <div className={`p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.homepageFinder ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                    <span className="break-all">
                      {meta.homepageFinder ? `Finder widget: ${(meta.finderFacets || []).join(', ') || 'make/model'}` : "No homepage inventory finder detected"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {type === "No_Results_UX" && meta && (
              <div className="space-y-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>
                  {meta.observed ? "Empty-State Recovery" : "Fallback Infrastructure"}
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: "Suggestions", v: meta.hasSuggestions },
                    { l: "Clear / Reset", v: meta.hasReset },
                    { l: "Alternatives", v: meta.hasAlternatives },
                    { l: "Contact CTA", v: meta.hasCTA }
                  ].map((item, i) => (
                    <div key={i} className={`p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-cardsoft border-line"}`}>
                      <span className={darkMode ? "text-slate-300" : "text-muted"}>{item.l}:</span>
                      <span className={item.v ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>{item.v ? "YES" : "NO"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === "Certifications_Awards" && meta && (
              <div>
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Trust Signals ({meta.found?.length || 0})</h5>
                {meta.found?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {meta.found.map((f, i) => (
                      <span key={i} className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${darkMode ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>{f}</span>
                    ))}
                    {meta.badgeImgs > 0 && (
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${darkMode ? "bg-blue-500/15 text-blue-400 border-blue-500/30" : "bg-accentsoft text-accent border-accent/30"}`}>{meta.badgeImgs} badge img</span>
                    )}
                  </div>
                ) : (
                  <div className={`mt-1 p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-400" : "bg-cardsoft border-line text-muted"}`}>No certifications / awards detected</div>
                )}
              </div>
            )}

            {type === "Pricing_Transparency" && meta && !meta.notApplicable && (
              <div>
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Transparency Signals</h5>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { l: "Real Prices", v: meta.showsRealPrices },
                    { l: "Fee Disclosure", v: meta.feeDisclosure },
                    { l: "Disclaimer", v: meta.disclaimer },
                    { l: "Financing Info", v: meta.financing },
                    { l: "No Hidden Fees", v: meta.noHidden }
                  ].map((item, i) => (
                    <div key={i} className={`p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-cardsoft border-line"}`}>
                      <span className={darkMode ? "text-slate-300" : "text-muted"}>{item.l}:</span>
                      <span className={item.v ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>{item.v ? "YES" : "NO"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === "Vehicle_History" && meta && !meta.notApplicable && (
              <div>
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>History Reports</h5>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { l: "CARFAX", v: meta.carfax },
                    { l: "AutoCheck", v: meta.autocheck },
                    { l: "Report Links", v: meta.reportLinks > 0 },
                    { l: "History Language", v: meta.historyLang }
                  ].map((item, i) => (
                    <div key={i} className={`p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-cardsoft border-line"}`}>
                      <span className={darkMode ? "text-slate-300" : "text-muted"}>{item.l}:</span>
                      <span className={item.v ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>{item.v ? "YES" : "NO"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === "Staff_Profiles" && meta && (
              <div className="space-y-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Team Presence</h5>
                <div className={`p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className="opacity-70">Team / Staff page:</span>
                  <span className={meta.hasTeamLink ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>{meta.hasTeamLink ? "LINKED" : "MISSING"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <p className="opacity-70 mb-1">Profiles</p>
                    <p className="font-semibold">{meta.profileCount || 0}</p>
                  </div>
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <p className="opacity-70 mb-1">Photos</p>
                    <p className="font-semibold">{meta.withPhoto || 0}</p>
                  </div>
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <p className="opacity-70 mb-1">Contact</p>
                    <p className="font-semibold">{meta.withContact || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {type === "Page_to_Page_Flow" && meta && (
              <div className="space-y-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Traversal Map</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <p className="opacity-70 mb-1">Next Steps</p>
                    <p className="font-semibold">{meta.nextStepCTAs} Buttons Found</p>
                  </div>
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <p className="opacity-70 mb-1">Inter-linking</p>
                    <p className="font-semibold">{meta.internalLinks} Internal links</p>
                  </div>
                </div>
                <div className={`p-2 rounded border font-mono text-[10px] flex justify-between ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className="opacity-70">Site Footer:</span>
                  <span className={meta.hasFooter ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>{meta.hasFooter ? "ACTIVE" : "MISSING"}</span>
                </div>
              </div>
            )}

            {/* 3. Interactive Experience Section */}
            {type === "Interactive_Click_Feedback" && meta && (
              <div className="space-y-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>State Response</h5>
                <div className={`p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.withFeedback === meta.totalInteractive ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                  <span className="break-all">{meta.withFeedback} of {meta.totalInteractive} assets react</span>
                </div>

                {meta.elements?.length > 0 && (
                  <div className="grid grid-cols-1 gap-1 max-h-[80px] overflow-y-auto pr-1 custom-scrollbar border-t border-dashed border-slate-700/30 pt-2">
                    {meta.elements.map((el, idx) => (
                      <div key={idx} className={`flex items-center justify-between gap-2 p-1 rounded border text-[9px] ${darkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-cardsoft border-linesoft"}`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`font-semibold opacity-60 uppercase scale-90 ${darkMode ? "text-slate-400" : "text-muted"}`}>
                            {el.tag}
                          </span>
                          <p className={`font-medium truncate ${darkMode ? "text-slate-200" : "text-inksoft"}`}>
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
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Async Signals</h5>
                <div className="grid grid-cols-1 gap-1.5 mt-2">
                  {[
                    { l: "Spinners", v: meta.summary.spinners },
                    { l: "Skeletons", v: meta.summary.skeletons },
                    { l: "Text Indicators", v: meta.summary.textLoading?.length || 0 }
                  ].map((item, i) => (
                    <div key={i} className={`p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-cardsoft border-line"}`}>
                      <span className={darkMode ? "text-slate-300" : "text-muted"}>{item.l}:</span>
                      <span className={item.v > 0 ? "text-emerald-500 font-semibold" : "text-faint"}>{item.v} detected</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === "Broken_Links" && meta && (
              <div className="space-y-3">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>URL Health</h5>
                <div className={`p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className="opacity-70">Results:</span>
                  <span className={meta.brokenCount > 0 ? "text-rose-500 font-semibold" : "text-emerald-500 font-semibold"}>{meta.brokenCount} Broken / {meta.totalChecked} Checked</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <p className="opacity-70 mb-1">Internal</p>
                    <p className="font-semibold">{meta.totalInternal} links</p>
                  </div>
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <p className="opacity-70 mb-1">External</p>
                    <p className="font-semibold">{meta.totalExternal} links</p>
                  </div>
                </div>

                {/* Broken Links List */}
                {meta.brokenLinks?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dashed border-slate-700/50">
                    <h5 className={`text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>
                      <Unlink size={14} />
                      Identified Broken Links
                    </h5>
                    <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1.5 custom-scrollbar">
                      {meta.brokenLinks.map((link, idx) => (
                        <div key={idx} className={`p-2 rounded-lg border flex items-start justify-between gap-2.5 text-[10px] transition-colors ${darkMode ? "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10" : "bg-rose-50 border-rose-100 hover:bg-rose-100"}`}>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate text-[10px] mb-0.5 ${darkMode ? "text-slate-200" : "text-ink"}`}>
                              {link.text || 'Anchor Link'}
                            </p>
                            <p className="truncate opacity-60 font-mono text-[8px]">{link.url}</p>
                          </div>
                          <div className={`flex-shrink-0 px-1.5 py-0.5 rounded font-semibold uppercase tracking-tighter text-[9px] ${darkMode ? "bg-rose-500/20 text-rose-400" : "bg-rose-100 text-rose-700"}`}>
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
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Initial Exposure</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <p className="opacity-70 mb-1">ATF Score</p>
                    <p className="font-semibold text-indigo-500">{meta.atfScore}%</p>
                  </div>
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <p className="opacity-70 mb-1">Viewport</p>
                    <p className="font-semibold">{meta.viewportHeight}px</p>
                  </div>
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <p className="opacity-70 mb-1">Visible Assets</p>
                    <p className="font-semibold">{meta.importantVisible}</p>
                  </div>
                  <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <p className="opacity-70 mb-1">Total Assets</p>
                    <p className="font-semibold">{meta.totalImportant}</p>
                  </div>
                </div>
              </div>
            )}

            {type === "Sticky_Header_Usage" && meta && (
              <div>
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Viewport Footprint</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-400"></span>
                  <span className="break-all">{meta.height}px height used (Max: {meta.limit}px)</span>
                </div>
              </div>
            )}

            {type === "Intrusive_Interstitials" && meta && (
              <div>
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Obstruction Level</h5>
                <div className="grid grid-cols-1 gap-1.5 mt-2">
                  {[
                    { l: "Full Overlay", v: meta.hasOverlay },
                    { l: "Scroll Block", v: meta.hasScrollBlock },
                    { l: "Modal Shield", v: meta.hasModal }
                  ].map((item, i) => (
                    <div key={i} className={`p-2 rounded border flex items-center justify-between font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-cardsoft border-line"}`}>
                      <span className={darkMode ? "text-slate-300" : "text-muted"}>{item.l}:</span>
                      <span className={item.v ? "text-rose-500 font-semibold" : "text-emerald-500 font-semibold"}>{item.v ? "ACTIVE" : "NONE"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === "Layout_Consistency" && meta && (
              <div>
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Grid Engine</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-400"></span>
                  <span className="break-all">{meta.hasFlexOrGrid ? "Modern Flex/Grid Layout" : "Legacy Structural Pattern"}</span>
                </div>
              </div>
            )}

            {type === "Mobile_Experience" && meta && (
              <div className="space-y-2">
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Responsive Viewport</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.hasDeviceWidth ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                    <span className="break-all">{meta.hasDeviceWidth ? "width=device-width set" : meta.hasViewportMeta ? "viewport meta present, no device-width" : "no viewport meta"}</span>
                  </div>
                </div>
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Horizontal Overflow</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.horizontalOverflow ? "bg-rose-500" : "bg-emerald-500"}`}></span>
                    <span className="break-all">{meta.horizontalOverflow ? `Overflows by ${meta.overflowBy}px${meta.offenders && meta.offenders.length ? ` (${meta.offenders.join(", ")})` : ""}` : "None"}</span>
                  </div>
                </div>
                {meta.responsiveImageRatio !== null && meta.responsiveImageRatio !== undefined && (
                  <div>
                    <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Responsive Images</h5>
                    <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400"></span>
                      <span className="break-all">{meta.responsiveImages}/{meta.imagesTotal} ({meta.responsiveImageRatio}%) · {meta.mediaQueryCount} media queries</span>
                    </div>
                  </div>
                )}

                {/* Touch ergonomics — absorbed "Mobile Usability" (spec §2.5). Weighted only on mobile. */}
                {(meta.touchTargetPct !== null && meta.touchTargetPct !== undefined) || (meta.legibleTextPct !== null && meta.legibleTextPct !== undefined) ? (
                  <div className="pt-2 mt-1 border-t border-dashed border-slate-700/30">
                    <h5 className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center justify-between ${darkMode ? "text-slate-400" : "text-muted"}`}>
                      <span>Touch Ergonomics</span>
                      {meta.usabilityWeighted === false && (
                        <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${darkMode ? "bg-slate-700/50 text-slate-400" : "bg-cardsoft text-muted"}`}>desktop · info</span>
                      )}
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {meta.touchTargetPct !== null && meta.touchTargetPct !== undefined && (
                        <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                          <p className="opacity-70 mb-1">Tap targets ≥44px</p>
                          <p className={`font-semibold ${meta.touchTargetPct >= 80 ? "text-emerald-500" : "text-rose-500"}`}>{meta.adequateTargets}/{meta.totalTargets} ({meta.touchTargetPct}%)</p>
                        </div>
                      )}
                      {meta.legibleTextPct !== null && meta.legibleTextPct !== undefined && (
                        <div className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                          <p className="opacity-70 mb-1">Legible text ≥12px</p>
                          <p className={`font-semibold ${meta.legibleTextPct >= 90 ? "text-emerald-500" : "text-amber-500"}`}>{meta.legibleText}/{meta.textTotal} ({meta.legibleTextPct}%)</p>
                        </div>
                      )}
                    </div>
                    <div className={`mt-2 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.thumbReachOk ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                      <span className="break-all">{meta.thumbReachOk ? "Reachable sticky / mobile nav (thumb reach)" : "No reachable sticky or mobile nav"}</span>
                    </div>
                    {meta.smallExamples && meta.smallExamples.length > 0 && (
                      <div className={`mt-2 p-2 rounded border flex flex-col gap-1 font-mono text-[10px] max-h-[120px] overflow-y-auto ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                        <p className="opacity-70 mb-0.5">Smallest tap targets:</p>
                        {meta.smallExamples.map((ex, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 bg-slate-400"></span>
                            <span className="break-all">{ex}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {type === "Vehicle_Image_Gallery" && meta && !meta.notApplicable && (
              <div className="space-y-3">
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Gallery Quality</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { l: "Photos", v: meta.photoCount, ok: meta.photoCount >= 8 },
                      { l: "With alt text", v: `${meta.withAlt}/${meta.photoCount}`, ok: meta.photoCount && meta.withAlt / meta.photoCount >= 0.5 },
                      { l: "Lazy-loaded", v: `${meta.lazyLoaded}/${meta.photoCount}`, ok: meta.photoCount && meta.lazyLoaded / meta.photoCount >= 0.5 },
                      { l: "Stock-like", v: meta.stockLike, ok: meta.photoCount && meta.stockLike / meta.photoCount < 0.5 }
                    ].map((item, i) => (
                      <div key={i} className={`p-2 rounded border font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                        <p className="opacity-70 mb-1">{item.l}</p>
                        <p className={`font-semibold ${item.ok ? "text-emerald-500" : "text-rose-500"}`}>{item.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>



        {/* Expanded Analysis Content */}
        {isOpen && (
          <div className={`mt-3 p-3 rounded-lg text-xs leading-relaxed border animate-in slide-in-from-top-2 duration-200 ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>

            {/* Cause */}
            {(analysis?.cause || reasons.length > 0) && (
              <div className="mb-4">
                <p className={`font-semibold mb-1 ${darkMode ? "text-slate-200" : "text-inksoft"}`}>Cause:</p>
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

      </div>
    </div >
  );
};

const Section = ({ title, icon: Icon, children, darkMode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 px-2">
      <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-accentsoft text-accent"}`}>
        <Icon size={20} />
      </div>
      <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-ink"}`}>
        {title}
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {children}
    </div>
  </div>
);

const UX_Content_Structure_Inner = React.memo(({ data, loading, darkMode }) => {
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const { audienceMode } = useData();

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

  const results = data?.UXOrContentStructure || {};
  const overallScore = results.Percentage || 0;

  if (!data?.UXOrContentStructure) {
    return (
      <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-surface"} transition-colors duration-300`}>
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-6`}>
          {/* ✅ Card 1: URL Header Card */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
            <UrlHeader
              data={data}
              darkMode={darkMode}
              sectionName="UX & Content Structure"
              sectionData={results}
              auditScore={overallScore}
              hideBorder={true}
            />
          </div>

          {/* ✅ Card 2: Overview / Preview Card */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
            <div className={`flex flex-col xl:flex-row ${data?.report === "All" ? "" : "min-h-[300px]"}`}>
              {/* Left Panel: Live Preview (Only if not All) */}
              {data?.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-cardsoft border-linesoft"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}
              {/* Right Panel: Shimmer */}
              <div className="flex-1 flex flex-col justify-center">
                <UxShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const mainBg = darkMode ? "bg-gray-900" : "bg-surface";
  const textColor = darkMode ? "text-white" : "text-ink";

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
    Hierarchy_Flow_Clarity: "md:col-span-2",
    Above_the_Fold_Content: "md:col-span-2",
    Navigation_Discoverability: "md:col-span-2",
    In_Page_Navigation: "md:col-span-2",
    Broken_Links: "md:col-span-2",
    Inventory_Filtering: "md:col-span-2",
  };

  const detailedKeys = [
    "Text_Readability",
    "Hierarchy_Flow_Clarity",
    "Navigation_Discoverability",
    "In_Page_Navigation",
    "Broken_Links"
  ];

  const sectionDefinitions = [
    {
      title: "Content & Readability",
      icon: BookOpen,
      keys: ["Text_Readability", "Hierarchy_Flow_Clarity", "Content_Density_Balance"]
    },
    {
      title: "Navigation & Flow",
      icon: Compass,
      keys: ["Navigation_Discoverability", "Breadcrumbs", "In_Page_Navigation"]
    },
    {
      title: "Interactive Experience",
      icon: MousePointer2,
      keys: ["Interactive_Click_Feedback", "Loading_Feedback", "Broken_Links"]
    },
    {
      title: "Mobile Layout & Stability",
      icon: Smartphone,
      keys: ["Mobile_Experience", "Above_the_Fold_Content", "Sticky_Header_Usage", "Intrusive_Interstitials", "Layout_Consistency"]
    },
    {
      title: "Inventory & Vehicle Signals",
      icon: SlidersHorizontal,
      keys: ["Inventory_Filtering", "No_Results_UX", "Vehicle_Image_Gallery"]
    }
  ];

  return (
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-6`}>

        {/* ✅ Card 1: URL Header Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
          <UrlHeader
            data={data}
            darkMode={darkMode}
            sectionName="UX & Content Structure"
            sectionData={results}
            auditScore={overallScore}
            hideBorder={true}
          />
        </div>

        {/* ✅ Card 2: Overview / Preview Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
          <div className={`flex flex-col xl:flex-row ${data.report === "All" ? "" : "min-h-[300px]"}`}>

            {/* Left Panel: Live Preview (Only if not All) */}
            {data.report !== "All" && (
              <div className={`w-full xl:w-[45%] ${data.report === "All" ? "p-6 lg:p-10" : "p-3 lg:p-4"} flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-cardsoft border-linesoft"}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                <div className="w-full relative z-10">
                  <LivePreview data={data} loading={loading} variant="plain" />
                </div>
              </div>
            )}

            {/* Right Panel: Metrics & Score */}
            <div className={`flex-1 ${data.report === "All" ? "px-6 pb-4 pt-2 lg:px-10 lg:pt-2" : "px-6 pb-4 pt-4 lg:px-12 lg:pt-6"} flex flex-col justify-center`}>
              <div className={`w-full ${data.report === "All" ? "" : "max-w-2xl mx-auto"} ${data.report === "All" ? "space-y-7" : "space-y-6"}`}>

                {/* Top Content Area */}
                <div className={`flex flex-col md:flex-row items-center ${data.report === "All" ? "gap-7 md:gap-9 justify-between" : "gap-8 md:gap-8 justify-center"}`}>

                  {/* Text Content */}
                  <div className={`flex-1 ${data.report === "All" ? "space-y-5" : "space-y-4"} text-left order-2 md:order-1`}>
                    <div className={`${data.report === "All" ? "space-y-2" : "space-y-1.5"}`}>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-accentsoft text-accent border border-accent/20"}`}>
                        <Layout className="w-3.5 h-3.5" />
                        <span>UX Audit</span>
                      </div>
                      <h3 className={`${data.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
                        UX & <span className={darkMode ? "text-blue-500" : "text-accent"}>Content</span>
                      </h3>
                      <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-muted"}`}>
                        Detailed performance breakdown of user experience and content organization.
                      </p>
                    </div>

                    {/* Stats & Tools */}
                    <div className={`flex flex-wrap items-center ${data.report === "All" ? "gap-6" : "gap-5"}`}>
                      <div className={`flex flex-wrap items-center ${data.report === "All" ? "gap-5" : "gap-4"}`}>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-emerald-500" />
                          <span className={`text-xs font-semibold  tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{passedCount} Passed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={18} className="text-amber-500" />
                          <span className={`text-xs font-semibold  tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{warningCount} Warning</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle size={18} className="text-rose-500" />
                          <span className={`text-xs font-semibold  tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{failedCount} Failed</span>
                        </div>
                      </div>
                      <div className={`w-px h-4 ${darkMode ? "bg-slate-800" : "bg-slate-200 hidden md:block"}`}></div>
                      <button
                        onClick={() => setSelectedMetricInfo(scoreCalculationInfo)}
                        className={`flex items-center gap-2 text-sm font-semibold transition-all ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-accent hover:text-accenthover"}`}
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
                      <span className={`${data.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>{overallScore}%</span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Filtered Sections */}
        <ReportRestrictionWrapper>
          <div className="space-y-8">
            {sectionDefinitions.map((section, idx) => {
              const visibleKeys = section.keys.filter((key) => isVisibleForAudience(key, audienceMode));
              if (visibleKeys.length === 0) return null;
              return (
              <Section key={idx} title={section.title} icon={section.icon} darkMode={darkMode}>
                {visibleKeys.map((key) => {
                  const metric = results[key];
                  if (!metric) return null;
                  // Hide "not applicable" params (no score returned), e.g. pricing on a page with no prices.
                  if ((metric.Score ?? metric.score) === undefined) return null;
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
                      onInfo={(info) => setSelectedParameterInfo(info)}
                    />
                  );
                })}
              </Section>
              );
            })}
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
});

export default function UX_Content_Structure({ data: propData, loading: propLoading, darkMode: propDarkMode }) {
  const contextData = useData();
  const { theme } = React.useContext(ThemeContext);

  const data = propData !== undefined ? propData : contextData.data;
  const loading = propLoading !== undefined ? propLoading : contextData.loading;
  const darkMode = propDarkMode !== undefined ? propDarkMode : (theme === "dark");

  return <UX_Content_Structure_Inner data={data} loading={loading} darkMode={darkMode} />;
}