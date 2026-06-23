import React, { useContext, useMemo } from "react";
import UrlHeader from "../Component/UrlHeader";
import ReportRestrictionWrapper from "../Component/ReportRestrictionWrapper";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  CheckCircle, XCircle, AlertTriangle, Info,
  MousePointerClick, FileText, ShieldCheck, LayoutTemplate,
  MessageSquare, Zap, Target, CreditCard, Users, Activity, Loader2, ChevronDown, ChevronUp, Car, Landmark, Calculator, CalendarCheck,
  PartyPopper, Bot, PhoneCall, Phone, BarChart3, Tag, DollarSign, Award, Database, FileClock
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import { InfoDetails } from "../Component/InfoDetails";
import AskAIButton from "../Component/AskAIButton";
import { isVisibleForAudience, isActionableParam } from "../config/parameterAudience";

const iconMap = {
  CTA_Presence: MousePointerClick,
  CTA_Clarity: MessageSquare,
  CTA_Crowding: Activity,
  CTA_Flow_Alignment: Target,
  Form_Presence: FileText,
  Form_Length: FileText,
  Required_vs_Optional_Fields: FileText,
  Inline_Validation: CheckCircle,
  Submit_Button_Clarity: MousePointerClick,
  MultiStep_Form_Progress: Activity,
  Testimonials: Users,
  Reviews: MessageSquare,
  Trust_Badges: ShieldCheck,
  Client_Logos: Users,
  Case_Studies_Accessibility: FileText,
  Lead_Magnets: Zap,
  Progress_Indicators: Activity,
  Friendly_Error_Handling: AlertTriangle,
  Microcopy_Clarity: MessageSquare,
  Incentives_Displayed: CreditCard,
  TradeIn_Flow: Car,
  Financing_Flow: Landmark,
  Finance_Calculator: Calculator,
  Appointment_Booking: CalendarCheck,
  Thank_You_Pages: PartyPopper,
  Chat_Experience: Bot,
  Click_To_Call: PhoneCall,
  GA4_Installed: BarChart3,
  GTM_Configuration: Tag,
  Conversion_Tracking: PhoneCall,
  CRM_Integration: Database,
  Certifications_Awards: Award,
  Pricing_Transparency: DollarSign,
  Vehicle_History: FileClock,
};

const educationalContent = InfoDetails;
const scoreCalculationInfo = InfoDetails.Conversion_And_Lead_Flow_Methodology;

const ConversionShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
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
  const { score, details, meta, status, analysis } = data || {};
  const isPassed = status === "pass" || score === 100;
  const isWarning = status === "warning";
  const [isOpen, setIsOpen] = React.useState(false);

  const Icon = iconMap[metricKey] || CheckCircle;
  const content = educationalContent[metricKey] || { desc: "Conversion metric.", why: "Important for optimization." };
  const info = educationalContent[metricKey] || {};
  const reasons = info.actualReasonsForFailure || [];
  const recommendations = info.howToOvercomeFailure || [];
  const title = metricKey.replaceAll("_", " ");

  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-card border-line";
  const textColor = darkMode ? "text-gray-100" : "text-ink";
  const subTextColor = darkMode ? "text-gray-400" : "text-muted";

  let statusBg = "bg-rose-500";
  let statusBorder = "border-rose-500";
  let statusText = "text-rose-500";
  let statusLabel = "Needs Improvement";

  if (isPassed) {
    statusBg = "bg-emerald-500";
    statusBorder = "border-emerald-500";
    statusText = "text-emerald-500";
    statusLabel = "Optimized";
  } else if (isWarning) {
    statusBg = "bg-amber-500";
    statusBorder = "border-amber-500";
    statusText = "text-amber-500";
    statusLabel = "Warning";
  }

  const statusColor = `${statusText} ${statusBg}/10 ${statusBorder}/20`;

  return (
    <div className={`relative overflow-hidden rounded-xl border ${cardBg} shadow-sm hover:shadow-md transition-shadow group`}>
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-accentsoft"} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} className={darkMode ? "text-blue-400" : "text-accent"} />
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${textColor}`}>{title}</h3>
              <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full w-fit border ${statusColor}`}>
                {statusLabel}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {!isPassed && isActionableParam(metricKey) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded transition-colors ${isOpen ? (darkMode ? "bg-slate-700 text-slate-200" : "bg-surface-2 text-ink") : (darkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-muted hover:text-ink hover:bg-surface-2")}`}
                title="Toggle Analysis"
              >
                {isOpen ? "Hide Detail" : "View Detail"}
              </button>
            )}

            {onInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo({ ...content, icon: Icon, thresholds: meta?.threshold || content.thresholds });
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
              {details}
            </p>
          </div>
        </div>

        {/* Ask AI Button */}
        {!isPassed && (
          <AskAIButton
            finding={{
              type: 'Conversion & Lead Flow',
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

        {/* GA4 Specific Data */}
        {metricKey === "GA4_Installed" && meta?.measurementIds?.length > 0 && (
          <div>
            <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>GA4 Measurement ID</h5>
            <div className="flex flex-wrap gap-1.5">
              {meta.measurementIds.map((id, i) => (
                <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-mono ${darkMode ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>{id}</span>
              ))}
            </div>
          </div>
        )}

        {/* GTM Specific Data */}
        {metricKey === "GTM_Configuration" && meta?.containerIds?.length > 0 && (
          <div>
            <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>GTM Container ID</h5>
            <div className="flex flex-wrap gap-1.5">
              {meta.containerIds.map((id, i) => (
                <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-mono ${darkMode ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>{id}</span>
              ))}
            </div>
          </div>
        )}

        {/* Conversion Tracking Specific Data */}
        {metricKey === "Conversion_Tracking" && meta && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded border ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-cardsoft border-line"}`}>
                <div className="text-[10px] opacity-70">Form tracking</div>
                <div className={`text-[10px] font-semibold ${meta.formTracking ? "text-emerald-500" : "text-rose-500"}`}>{meta.formTracking ? "Detected" : "Missing"}</div>
              </div>
              <div className={`p-2 rounded border ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-cardsoft border-line"}`}>
                <div className="text-[10px] opacity-70">Call tracking{meta.telLinks > 0 ? ` (${meta.telLinks} tel link${meta.telLinks === 1 ? "" : "s"})` : ""}</div>
                <div className={`text-[10px] font-semibold ${meta.callTracking ? "text-emerald-500" : "text-rose-500"}`}>{meta.callTracking ? "Detected" : "Missing"}</div>
              </div>
            </div>
            {meta.signals?.length > 0 && (
              <div>
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Tracking Signals</h5>
                <div className="flex flex-wrap gap-1.5">
                  {meta.signals.map((s, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-mono ${darkMode ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA Presence Specific Data */}
        {metricKey === "CTA_Presence" && meta?.selectors && meta.selectors.length > 0 && (
          <div>
            <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Found CTA Selectors</h5>
            <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
              <span className="break-all">{meta.selectors.join(", ")}</span>
            </div>
          </div>
        )}

        {/* CTA Clarity Specific Data */}
        {metricKey === "CTA_Clarity" && (
          <>
            {meta?.totalChecked > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Total CTA Checked</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.totalChecked}</span>
                </div>
              </div>
            )}
            {meta?.examples && meta.examples.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Clear CTA Examples</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.examples.join(", ")}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* CTA Crowding Specific Data */}
        {metricKey === "CTA_Crowding" && meta?.limit !== undefined && (
          <div className="mt-2">
            <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Recommended Maximum</h5>
            <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
              <span className="break-all">{meta.limit}</span>
            </div>
          </div>
        )}

        {/* CTA Flow Alignment Specific Data */}
        {metricKey === "CTA_Flow_Alignment" && (
          <>
            {meta?.compositeScore !== undefined && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Funnel Placement Score</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.compositeScore}/100</span>
                </div>
              </div>
            )}
            {meta?.aboveFoldCTA !== undefined && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Above-the-Fold CTA</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.aboveFoldCTA ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                  <span className="break-all">{meta.aboveFoldCTA ? "Yes" : "No"}</span>
                </div>
              </div>
            )}
            {meta?.distribution && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>CTA Distribution (Top / Mid / Bottom)</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.distribution.top} / {meta.distribution.middle} / {meta.distribution.bottom}{meta.isLongPage ? " (long page)" : ""}</span>
                </div>
              </div>
            )}
            {meta?.ctaCount !== undefined && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>CTAs Found</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.ctaCount}{meta.examples && meta.examples.length > 0 ? ` — ${meta.examples.join(", ")}` : ""}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Form Presence Specific Data */}
        {metricKey === "Form_Presence" && meta?.count !== undefined && (
          <div className="mt-2">
            <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Total Forms Detected</h5>
            <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
              <span className="break-all">{meta.count}</span>
            </div>
          </div>
        )}

        {/* Form Length Specific Data */}
        {metricKey === "Form_Length" && (
          <>
            {meta?.optimalForms !== undefined && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Optimal Forms Count</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.optimalForms}</span>
                </div>
              </div>
            )}
            {meta?.totalForms !== undefined && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Total Forms Analyzed</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.totalForms}</span>
                </div>
              </div>
            )}
            {meta?.details && meta.details.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Issues Detected</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.details.join(", ")}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Required vs Optional Fields & Inline Validation */}
        {(metricKey === "Required_vs_Optional_Fields" || metricKey === "Inline_Validation") && (
          <>
            {meta?.checkedInputs && meta.checkedInputs.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Checked Inputs</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.checkedInputs.join(", ")}</span>
                </div>
              </div>
            )}
            {meta?.hasValidation !== undefined && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Validation Active</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.hasValidation ? "Yes" : "No"}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Submit Button Clarity */}
        {metricKey === "Submit_Button_Clarity" && (
          <>
            {meta?.totalCount !== undefined && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Total Buttons</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.totalCount}</span>
                </div>
              </div>
            )}
            {meta?.clearCount !== undefined && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Clear Count</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.clearCount}</span>
                </div>
              </div>
            )}
            {meta?.examples && meta.examples.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Button Examples</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.examples.join(", ")}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* MultiStep Form Progress */}
        {metricKey === "MultiStep_Form_Progress" && meta?.hasProgress !== undefined && (
          <div className="mt-2">
            <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Progress Indicators</h5>
            <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
              <span className="break-all">{meta.hasProgress ? "Detected" : "Not Found"}</span>
            </div>
          </div>
        )}

        {/* Testimonials */}
        {metricKey === "Testimonials" && (
          <>
            {meta?.checkedKeywords && meta.checkedKeywords.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Target Keywords</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.checkedKeywords.join(", ")}</span>
                </div>
              </div>
            )}
            {meta?.found && meta.found.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Found Matches</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.found.join(", ")}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Reviews */}
        {metricKey === "Reviews" && (
          <>
            {meta?.checkedKeywords && meta.checkedKeywords.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Target Keywords</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.checkedKeywords.join(", ")}</span>
                </div>
              </div>
            )}
            {meta?.found && meta.found.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Found Matches</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.found.join(", ")}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Trust_Badges */}
        {metricKey === "Trust_Badges" && (
          <>
            {meta?.checkedKeywords && meta.checkedKeywords.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Target Keywords</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.checkedKeywords.join(", ")}</span>
                </div>
              </div>
            )}
            {meta?.found && meta.found.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Found Matches</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.found.join(", ")}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Case_Studies_Accessibility */}
        {metricKey === "Case_Studies_Accessibility" && (
          <>
            {meta?.checkedKeywords && meta.checkedKeywords.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Target Keywords</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.checkedKeywords.join(", ")}</span>
                </div>
              </div>
            )}
            {meta?.found && meta.found.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Found Matches</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.found.join(", ")}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Lead_Magnets */}
        {metricKey === "Lead_Magnets" && (
          <>
            {meta?.checkedKeywords && meta.checkedKeywords.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Target Keywords</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.checkedKeywords.join(", ")}</span>
                </div>
              </div>
            )}
            {meta?.found && meta.found.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Found Matches</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.found.join(", ")}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Incentives_Displayed */}
        {metricKey === "Incentives_Displayed" && (
          <>
            {meta?.checkedKeywords && meta.checkedKeywords.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Target Keywords</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.checkedKeywords.join(", ")}</span>
                </div>
              </div>
            )}
            {meta?.found && meta.found.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Found Matches</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.found.join(", ")}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Client_Logos */}
        {metricKey === "Client_Logos" && meta?.checkedSelectors && meta.checkedSelectors.length > 0 && (
          <div className="mt-2">
            <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Checked Selectors</h5>
            <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
              <span className="break-all">{meta.checkedSelectors.join(", ")}</span>
            </div>
          </div>
        )}

        {/* Friendly_Error_Handling */}
        {metricKey === "Friendly_Error_Handling" && meta?.checkedSelectors && meta.checkedSelectors.length > 0 && (
          <div className="mt-2">
            <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Checked Selectors</h5>
            <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
              <span className="break-all">{meta.checkedSelectors.join(", ")}</span>
            </div>
          </div>
        )}

        {/* Microcopy_Clarity */}
        {metricKey === "Microcopy_Clarity" && meta?.checkedSelectors && meta.checkedSelectors.length > 0 && (
          <div className="mt-2">
            <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Checked Selectors</h5>
            <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
              <span className="break-all">{meta.checkedSelectors.join(", ")}</span>
            </div>
          </div>
        )}

        {/* Progress_Indicators */}
        {metricKey === "Progress_Indicators" && meta?.checkedSelectors && meta.checkedSelectors.length > 0 && (
          <div className="mt-2">
            <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Checked Selectors</h5>
            <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
              <span className="break-all">{meta.checkedSelectors.join(", ")}</span>
            </div>
          </div>
        )}

        {/* Link_Relevance */}
        {metricKey === "Link_Relevance" && (
          <div className="flex flex-col gap-4 mt-2">
            <div className={`flex flex-col md:flex-row gap-4 justify-between w-full`}>

              {/* Incorrect CTAs */}
              {meta?.incorrectCtas && meta.incorrectCtas.length > 0 && (
                <div className="flex-1 min-w-[50%]">
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Needs Attention</h5>
                  <div className={`mt-1 p-2 rounded border flex flex-col gap-1.5 font-mono text-[10px] max-h-[150px] overflow-y-auto ${darkMode ? "bg-rose-900/10 border-rose-800/30 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
                    {meta.incorrectCtas.map((cta, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 bg-rose-500`}></span>
                        <span className="break-all">
                          <span className="font-semibold">"{cta.text}"</span> → {cta.href}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Correct CTAs */}
              {meta?.correctCtas && meta.correctCtas.length > 0 && (
                <div className="flex-1 min-w-[50%]">
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Correctly Linked</h5>
                  <div className={`mt-1 p-2 rounded border flex flex-col gap-1.5 font-mono text-[10px] max-h-[180px] overflow-y-auto ${darkMode ? "bg-emerald-900/10 border-emerald-800/30 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
                    {meta.correctCtas.map((cta, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 bg-emerald-500`}></span>
                        <span className="break-all">
                          <span className="font-semibold">"{cta.text}"</span> → {cta.href}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dealer Lead Flows (TradeIn_Flow / Financing_Flow / Finance_Calculator) */}
        {(metricKey === "TradeIn_Flow" || metricKey === "Financing_Flow" || metricKey === "Finance_Calculator" || metricKey === "Appointment_Booking" || metricKey === "Chat_Experience") && (() => {
          const labels = {
            TradeIn_Flow: { widgets: "Estimator Widgets", cta: "Trade-In CTAs", form: "Valuation Form Fields" },
            Financing_Flow: { widgets: "Lender Widgets", cta: "Financing CTAs", form: "Credit Application Fields" },
            Finance_Calculator: { widgets: "Calculator Widgets", cta: "Calculator CTAs", form: "Calculator Inputs" },
            Appointment_Booking: { widgets: "Scheduling Widgets", cta: "Appointment CTAs", form: "Booking Form Fields" },
            Chat_Experience: { widgets: "Chat Widgets", cta: "Chat Launchers", form: "" },
          };
          const { widgets: widgetsLabel, cta: ctaLabel, form: formLabel } = labels[metricKey];
          return (
            <>
              {meta?.detectionType && meta.detectionType !== "none" && (
                <div className="mt-2">
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Detection Type</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                    <span className="break-all">{meta.detectionType.replaceAll("-", " ")}</span>
                  </div>
                </div>
              )}
              {meta?.foundWidgets && meta.foundWidgets.length > 0 && (
                <div className="mt-2">
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>{widgetsLabel}</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                    <span className="break-all">{meta.foundWidgets.join(", ")}</span>
                  </div>
                </div>
              )}
              {meta?.ctaExamples && meta.ctaExamples.length > 0 && (
                <div className="mt-2">
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>{ctaLabel}</h5>
                  <div className={`mt-1 p-2 rounded border flex flex-col gap-1.5 font-mono text-[10px] max-h-[150px] overflow-y-auto ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    {meta.ctaExamples.map((cta, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 bg-slate-400`}></span>
                        <span className="break-all">{cta}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {meta?.formFieldsDetected && meta.formFieldsDetected.length > 0 && (
                <div className="mt-2">
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>{formLabel}</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                    <span className="break-all">{meta.formFieldsDetected.join(", ")}</span>
                  </div>
                </div>
              )}
              {meta?.matchedKeywords && meta.matchedKeywords.length > 0 && (
                <div className="mt-2">
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Matched Keywords</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                    <span className="break-all">{meta.matchedKeywords.join(", ")}</span>
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* Thank_You_Pages */}
        {metricKey === "Thank_You_Pages" && (
          <>
            {meta?.detectionType && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Detection Type</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.detectionType.replaceAll("-", " ")}</span>
                </div>
              </div>
            )}
            {meta?.formCount !== undefined && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Forms Detected</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.formCount}</span>
                </div>
              </div>
            )}
            {meta?.references && meta.references.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Thank-You / Confirmation References</h5>
                <div className={`mt-1 p-2 rounded border flex flex-col gap-1.5 font-mono text-[10px] max-h-[150px] overflow-y-auto ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  {meta.references.map((ref, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 bg-slate-400`}></span>
                      <span className="break-all">{ref}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Click_To_Call */}
        {metricKey === "Click_To_Call" && (
          <>
            {meta?.detectionType && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Detection Type</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.detectionType.replaceAll("-", " ")}</span>
                </div>
              </div>
            )}
            {meta?.telCount > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Click-to-Call Links</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.telCount}</span>
                </div>
              </div>
            )}
            {meta?.telExamples && meta.telExamples.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Phone Numbers</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.telExamples.join(", ")}</span>
                </div>
              </div>
            )}
            {meta?.phoneSample && meta.phoneSample.length > 0 && (
              <div className="mt-2">
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Unlinked Phone Numbers</h5>
                <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-cardsoft border-line text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400`}></span>
                  <span className="break-all">{meta.phoneSample.join(", ")}</span>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex-grow" />


        {/* Expanded Analysis Content */}
        {isOpen && (
          <div className={`mt-3 p-3 rounded-lg text-xs leading-relaxed border animate-in slide-in-from-top-2 duration-200 ${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-card border-line text-muted"}`}>

            {/* Cause */}
            {(analysis?.cause || reasons.length > 0) && (
              <div className="mb-4">
                <p className={`font-semibold mb-1 ${darkMode ? "text-slate-200" : "text-inksoft"}`}>Cause:</p>
                <div className="pl-1 opacity-90">
                  {analysis?.cause ? (
                    <p>{analysis.cause}</p>
                  ) : (
                    <ul className="list-disc pl-4 space-y-1">
                      {reasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
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
                    <ul className="list-disc pl-4 space-y-1">
                      {recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  )}
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
      <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-accentsoft text-accent"}`}>
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

const Conversion_Lead_Flow_Inner = React.memo(({ data, loading, darkMode }) => {
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const { audienceMode } = useData();

  const auditSteps = useMemo(() => [
    { icon: <MousePointerClick className="w-8 h-8 text-blue-500" />, title: "CTA Optimization", text: "Analyzing Call-To-Action (CTA) placement, contrast, and clarity..." },
    { icon: <FileText className="w-8 h-8 text-purple-500" />, title: "Form Analysis", text: "Evaluating form length, validation feedback, and required field indicators..." },
    { icon: <ShieldCheck className="w-8 h-8 text-teal-500" />, title: "Trust Signals", text: "Checking for testimonials, reviews, security badges, and client logos..." },
    { icon: <Zap className="w-8 h-8 text-indigo-500" />, title: "Lead Generation", text: "Identifying lead magnets, exit intent triggers, and value propositions..." },
    { icon: <Activity className="w-8 h-8 text-amber-500" />, title: "User Flow", text: "Mapping user journey linearity and removing friction points..." },
  ], []);

  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (loading || !data?.conversionAndLeadFlow) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % auditSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);

  const flow = data?.conversionAndLeadFlow || {};

  if (!data?.conversionAndLeadFlow) {
    return (
      <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-surface"} transition-colors duration-300`}>
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-6`}>
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
            <UrlHeader
              data={data}
              darkMode={darkMode}
              sectionName="Conversion & Lead Flow"
              sectionData={flow}
              auditScore={flow.Percentage}
              hideBorder={true}
            />
          </div>

          {/* ✅ Card 2: Overview / Preview Card */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
            <div className={`flex flex-col xl:flex-row ${data?.report === "All" ? "" : "min-h-[300px]"}`}>
              {/* Left Panel: Live Preview (Only if not All) */}
              {data?.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-surface-2 border-linesoft"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}
              {/* Right Panel: Shimmer */}
              <div className="flex-1 flex flex-col justify-center">
                <ConversionShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const mainBg = darkMode ? "bg-gray-900" : "bg-surface";

  const allMetrics = Object.values(flow).filter(val => typeof val === 'object' && val !== null && 'status' in val);
  const passedCount = allMetrics.filter(m => m.status === "pass").length;
  const warningCount = allMetrics.filter(m => m.status === "warning").length;
  const failedCount = allMetrics.filter(m => m.status === "fail").length;

  return (
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-6`}>

        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
          <UrlHeader
            data={data}
            darkMode={darkMode}
            sectionName="Conversion & Lead Flow"
            sectionData={flow}
            auditScore={flow.Percentage}
            hideBorder={true}
          />
        </div>

        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
          <div className={`flex flex-col xl:flex-row ${data.report === "All" ? "" : "min-h-[300px]"}`}>

            {data.report !== "All" && (
              <div className={`w-full xl:w-[45%] ${data.report === "All" ? "p-6 lg:p-10" : "p-3 lg:p-4"} flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-surface-2 border-linesoft"}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                <div className="w-full relative z-10">
                  <LivePreview data={data} loading={loading} variant="plain" />
                </div>
              </div>
            )}

            <div className={`flex-1 ${data.report === "All" ? "px-6 pb-4 pt-2 lg:px-10 lg:pt-2" : "px-6 pb-4 pt-4 lg:px-12 lg:pt-6"} flex flex-col justify-center`}>
              <div className={`w-full ${data.report === "All" ? "" : "max-w-2xl mx-auto"} ${data.report === "All" ? "space-y-7" : "space-y-6"}`}>

                <div className={`flex flex-col md:flex-row items-center ${data.report === "All" ? "gap-7 md:gap-9 justify-between" : "gap-8 md:gap-8 justify-center"}`}>

                  <div className={`flex-1 ${data.report === "All" ? "space-y-5" : "space-y-4"} text-left order-2 md:order-1`}>
                    <div className={`${data.report === "All" ? "space-y-2" : "space-y-1.5"}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-accentsoft text-accent border border-accent/20"}`}>
                          <Target className="w-3.5 h-3.5" />
                          <span>Conversion Audit</span>
                        </div>
                        {flow.Confidence && (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-surface-2 text-muted border border-line"}`} title="Conversion signals are measured from the rendered DOM (heuristic confidence). Page-specific parameters are scored only where they apply and renormalized.">
                            <Info className="w-3.5 h-3.5" />
                            <span>Confidence: {flow.Confidence}{flow.pageType ? ` · ${flow.pageType}` : ""}</span>
                          </div>
                        )}
                      </div>
                      <h3 className={`${data.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
                        Conversion & <span className={darkMode ? "text-blue-500" : "text-accent"}>Lead Flow</span>
                      </h3>
                    </div>
                    <p className={`text-sm font-medium leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                      Optimize your checkout paths, signup structures, value arguments, and Call-to-Actions to maximize page ROI.
                    </p>

                    <div className={`flex flex-wrap items-center ${data.report === "All" ? "gap-6" : "gap-5"}`}>
                                         <div className={`flex items-center ${data.report === "All" ? "gap-5" : "gap-4"}`}>
                                           <div className="flex items-center gap-2">
                                             <CheckCircle size={18} className="text-emerald-500" />
                                             <span className={`text-xs font-semibold  tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{passedCount} Passed</span>
                                           </div>
                                           {warningCount > 0 && (
                                             <div className="flex items-center gap-2">
                                               <AlertTriangle size={18} className="text-amber-500" />
                                               <span className={`text-xs font-semibold  tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{warningCount} Warning</span>
                                             </div>
                                           )}
                                           <div className="flex items-center gap-2">
                                             <XCircle size={18} className="text-rose-500" />
                                             <span className={`text-xs font-semibold  tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{failedCount} Failed</span>
                                           </div>
                                         </div>
                                         <div className={`w-px h-4 ${darkMode ? "bg-slate-800" : "bg-line hidden md:block"}`}></div>
                                         <button
                                           onClick={() => setSelectedMetricInfo(scoreCalculationInfo)}
                                           className={`flex items-center gap-2 text-sm font-semibold transition-all ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-accent hover:text-accenthover"}`}
                                         >
                                           <Info size={16} />
                                           <span className="border-b border-transparent hover:border-current">Metric Methodology</span>
                                         </button>
                                       </div>
                  </div>

                  <div className="relative flex-shrink-0 group cursor-default order-1 md:order-2">
                    <div className={`absolute -inset-8 rounded-full blur-3xl opacity-25 transition-opacity duration-700 group-hover:opacity-40 ${flow.Percentage >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                    <CircularProgress value={flow.Percentage || 0} size={data.report === "All" ? 180 : 150} stroke={14} />
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                      <span className={`${data.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>{flow.Percentage || 0}%</span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ReportRestrictionWrapper>
          <div className="space-y-6">
            {(() => {
              const visible = (keys) => keys.filter((k) => flow[k] && isVisibleForAudience(k, audienceMode));
              const ctaKeys = visible(["CTA_Presence", "CTA_Clarity", "CTA_Crowding", "CTA_Flow_Alignment"]);
              const analyticsKeys = visible(["GA4_Installed", "GTM_Configuration", "Conversion_Tracking", "CRM_Integration"]);
              const leadKeys = visible(["Form_Presence", "Lead_Magnets", "Incentives_Displayed", "Form_Length"]);
              const trustKeys = visible(["Testimonials", "Reviews", "Trust_Badges", "Client_Logos", "Case_Studies_Accessibility", "Certifications_Awards"]);
              const commercialKeys = visible(["Pricing_Transparency", "Vehicle_History"]);
              const frictionKeys = visible(["Required_vs_Optional_Fields", "Inline_Validation", "Submit_Button_Clarity", "Friendly_Error_Handling", "Microcopy_Clarity", "MultiStep_Form_Progress", "Thank_You_Pages"]);
              const dealerKeys = visible(["TradeIn_Flow", "Financing_Flow", "Finance_Calculator", "Appointment_Booking"]);
              const contactKeys = visible(["Click_To_Call", "Chat_Experience"]);
              return (
                <>
                  {ctaKeys.length > 0 && (
                    <Section title="Call-to-Action (CTA) Strategy" icon={MousePointerClick} darkMode={darkMode}>
                      {ctaKeys.map((key) => {
                        if (key === "Link_Relevance") {
                          return (
                            <div key={key} className="col-span-1 md:col-span-2">
                              <MetricCard metricKey={key} data={flow[key]} darkMode={darkMode} onInfo={() => setSelectedParameterInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
                            </div>
                          );
                        }
                        return <MetricCard key={key} metricKey={key} data={flow[key]} darkMode={darkMode} onInfo={() => setSelectedParameterInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />;
                      })}
                    </Section>
                  )}

                  {analyticsKeys.length > 0 && (
                    <Section title="Analytics & Conversion Tracking" icon={BarChart3} darkMode={darkMode}>
                      {analyticsKeys.map((key) => (
                        <MetricCard key={key} metricKey={key} data={flow[key]} darkMode={darkMode} onInfo={() => setSelectedParameterInfo({ ...educationalContent[key], icon: iconMap[key] || CheckCircle })} />
                      ))}
                    </Section>
                  )}

                  {leadKeys.length > 0 && (
                    <Section title="Lead Capture & Incentives" icon={Target} darkMode={darkMode}>
                      {leadKeys.map((key) => (
                        <MetricCard key={key} metricKey={key} data={flow[key]} darkMode={darkMode} onInfo={(info) => setSelectedParameterInfo(info)} />
                      ))}
                    </Section>
                  )}

                  {trustKeys.length > 0 && (
                    <Section title="Trust & Social Proof" icon={ShieldCheck} darkMode={darkMode}>
                      {trustKeys.map((key) => (
                        <MetricCard key={key} metricKey={key} data={flow[key]} darkMode={darkMode} onInfo={(info) => setSelectedParameterInfo(info)} />
                      ))}
                    </Section>
                  )}

                  {commercialKeys.length > 0 && (
                    <Section title="Pricing & Vehicle Trust" icon={DollarSign} darkMode={darkMode}>
                      {commercialKeys.map((key) => (
                        <MetricCard key={key} metricKey={key} data={flow[key]} darkMode={darkMode} onInfo={(info) => setSelectedParameterInfo(info)} />
                      ))}
                    </Section>
                  )}

                  {frictionKeys.length > 0 && (
                    <Section title="Friction Reduction & Validation" icon={LayoutTemplate} darkMode={darkMode}>
                      {frictionKeys.map((key) => (
                        <MetricCard key={key} metricKey={key} data={flow[key]} darkMode={darkMode} onInfo={(info) => setSelectedParameterInfo(info)} />
                      ))}
                    </Section>
                  )}

                  {dealerKeys.length > 0 && (
                    <Section title="Dealer Lead Flows" icon={Car} darkMode={darkMode}>
                      {dealerKeys.map((key) => (
                        <MetricCard key={key} metricKey={key} data={flow[key]} darkMode={darkMode} onInfo={(info) => setSelectedParameterInfo(info)} />
                      ))}
                    </Section>
                  )}

                  {contactKeys.length > 0 && (
                    <Section title="Contact & Engagement" icon={Phone} darkMode={darkMode}>
                      {contactKeys.map((key) => (
                        <MetricCard key={key} metricKey={key} data={flow[key]} darkMode={darkMode} onInfo={(info) => setSelectedParameterInfo(info)} />
                      ))}
                    </Section>
                  )}
                </>
              );
            })()}
          </div>
        </ReportRestrictionWrapper>
      </main>
      <MetricInfoModal
        isOpen={!!selectedMetricInfo}
        onClose={() => setSelectedMetricInfo(null)}
        info={selectedMetricInfo}
        darkMode={darkMode}
      />
      <ParameterInfoModal
        isOpen={!!selectedParameterInfo}
        onClose={() => setSelectedParameterInfo(null)}
        info={selectedParameterInfo}
        darkMode={darkMode}
      />
    </div>
  );
});

export default function Conversion_Lead_Flow({ data: propData, loading: propLoading, darkMode: propDarkMode }) {
  const contextData = useData();
  const { theme } = useContext(ThemeContext);

  const data = propData !== undefined ? propData : contextData.data;
  const loading = propLoading !== undefined ? propLoading : contextData.loading;
  const darkMode = propDarkMode !== undefined ? propDarkMode : (theme === "dark");

  return <Conversion_Lead_Flow_Inner data={data} loading={loading} darkMode={darkMode} />;
}