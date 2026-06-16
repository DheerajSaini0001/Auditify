import React, { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import ThresholdBar from "./ThresholdBar";
import MetricAnalysisDetails from "./MetricAnalysisDetails";
import AskAIButton from "../AskAIButton";
import Tooltip from "./Tooltip";
import { isActionableParam } from "../../config/parameterAudience";

const MetricCard = ({
    title,
    icon: Icon,
    metricData,
    selectedSource,
    darkMode,
    description,
    whyItMatters,
    onInfoClick,
    isOpen,
    onToggle,
    fallbackCauses,
    fallbackRecommendations,
    paramKey,
}) => {
    const [internalOpen, setInternalOpen] = useState(false);

    // Determine if controlled or uncontrolled
    const isControlled = isOpen !== undefined;
    const showDetails = isControlled ? isOpen : internalOpen;

    const handleToggle = () => {
        if (isControlled && onToggle) {
            onToggle();
        } else {
            setInternalOpen(!internalOpen);
        }
    };

    if (!metricData) return null;

    const needsData = metricData;
    const activeData =
        selectedSource === "field" && needsData.crux
            ? needsData.crux
            : needsData.lab || needsData;

    const status = activeData.status || "fail";
    const statusBadgeColor =
        (status === "pass")
            ? darkMode
                ? "bg-emerald-900/30 text-emerald-400 border-emerald-800"
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
            : (status === "needs_improvement" || status === "warning")
                ? darkMode
                    ? "bg-amber-900/30 text-amber-400 border-amber-800"
                    : "bg-amber-50 text-amber-600 border-amber-100"
                : darkMode
                    ? "bg-rose-900/30 text-rose-400 border-rose-800"
                    : "bg-rose-50 text-rose-600 border-rose-100";

    const statusText =
        (status === "pass")
            ? "Passed"
            : (status === "warning")
                ? "Warning"
                : "Poor";

    const valueColor =
        (status === "pass")
            ? darkMode
                ? "text-emerald-400"
                : "text-emerald-600"
            : (status === "warning")
                ? darkMode
                    ? "text-amber-400"
                    : "text-amber-600"
                : darkMode
                    ? "text-rose-400"
                    : "text-rose-600";

    const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-card border-line";
    const textColor = darkMode ? "text-gray-100" : "text-ink";
    const subTextColor = darkMode ? "text-gray-400" : "text-muted";

    return (
        <div
            className={`rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col h-full`}
        >
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                    <div
                        className={`p-3 rounded-xl flex-shrink-0 ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-accentsoft text-accent"
                            }`}
                    >
                        <Icon size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className={`font-semibold text-lg leading-tight mb-1 ${textColor}`}>
                            {title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${statusBadgeColor}`}
                            >
                                {statusText}
                            </span>

                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {status !== "pass" && isActionableParam(paramKey) && (
                        <button
                            onClick={handleToggle}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${darkMode
                                ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                                : "bg-cardsoft hover:bg-surface-2 text-muted"
                                }`}
                        >
                            {showDetails ? "Hide Details" : "View Details"}
                            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    )}
                    <Tooltip
                        darkMode={darkMode}
                        content={
                            <div className="space-y-4 text-left">
                                <div>
                                    <h4 className="text-[10px] font-semibold uppercase tracking-widest text-blue-500 mb-1">Description</h4>
                                    <p className="text-xs leading-relaxed opacity-90">{description}</p>
                                </div>
                                <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-line"}`} />
                                <div>
                                    <h4 className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">Why it matters</h4>
                                    <p className="text-xs leading-relaxed opacity-90">{whyItMatters}</p>
                                </div>
                            </div>
                        }
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onInfoClick) onInfoClick();
                            }}
                            className={`p-1.5 rounded-full transition-colors ${darkMode
                                ? "text-gray-500 hover:text-gray-300 hover:bg-gray-700"
                                : "text-faint hover:text-muted hover:bg-surface-2"
                                }`}
                            title="View Methodology"
                        >
                            <Info size={20} />
                        </button>
                    </Tooltip>
                </div>
            </div>
            <div className="space-y-6 flex-grow">
                <div>
                    <h4
                        className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-faint"
                            }`}
                    >
                        Current Value
                    </h4>
                    <div
                        className={`text-base font-medium ${darkMode ? "text-gray-300" : "text-inksoft"
                            }`}
                    >
                        {title} is{" "}
                        <span className={`font-black text-xl ml-1 ${valueColor}`}>
                            {activeData.meta.value}
                        </span>
                    </div>
                </div>
                <div className="-mt-2">
                    <ThresholdBar
                        activeData={activeData}
                        metricData={metricData}
                        isPassed={status === "pass"}
                        isWarning={status === "warning"}
                        darkMode={darkMode}
                        scaleFactor={1.5}
                    />
                </div>
            </div>
            <MetricAnalysisDetails
                analysis={activeData?.analysis}
                meta={activeData.meta}
                darkMode={darkMode}
                isOpen={showDetails}
                onToggle={handleToggle}
                fallbackCauses={fallbackCauses}
                fallbackRecommendations={fallbackRecommendations}
            />

            {/* Ask AI Button */}
            {status !== "pass" && (
                <AskAIButton
                    finding={{ type: 'Technical Performance', title: title, details: activeData?.details || '', severity: status === 'pass' ? 'pass' : status === 'warning' ? 'warning' : 'critical', url: '' }}
                    darkMode={darkMode}
                    meta={activeData?.meta}
                    paramKey={paramKey}
                />
            )}

        </div>
    );
};

export default MetricCard;
