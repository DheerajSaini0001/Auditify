import React, { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import ThresholdBar from "./ThresholdBar";
import MetricAnalysisDetails from "./MetricAnalysisDetails";

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

    const status = activeData.status || "poor";
    const statusBadgeColor =
        status === "good"
            ? darkMode
                ? "bg-emerald-900/30 text-emerald-400 border-emerald-800"
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
            : status === "needs_improvement"
                ? darkMode
                    ? "bg-amber-900/30 text-amber-400 border-amber-800"
                    : "bg-amber-50 text-amber-600 border-amber-100"
                : darkMode
                    ? "bg-rose-900/30 text-rose-400 border-rose-800"
                    : "bg-rose-50 text-rose-600 border-rose-100";

    const statusText =
        status === "good"
            ? "Passed"
            : status === "needs_improvement"
                ? "Warning" // Note: Some cards used "Needs Impr." I will stick to the LCP example "Warning" or consistency? LCP had "Warning", others "Needs Impr.". I'll use "Warning" for consistency with the requested card.
                : "Poor";

    const valueColor =
        status === "good"
            ? darkMode
                ? "text-emerald-400"
                : "text-emerald-600"
            : status === "needs_improvement"
                ? darkMode
                    ? "text-amber-400"
                    : "text-amber-600"
                : darkMode
                    ? "text-rose-400"
                    : "text-rose-600";

    const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
    const textColor = darkMode ? "text-gray-100" : "text-gray-900";
    const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";

    return (
        <div
            className={`rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col h-full`}
        >
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                    <div
                        className={`p-3 rounded-xl flex-shrink-0 ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"
                            }`}
                    >
                        <Icon size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg leading-tight mb-1 ${textColor}`}>
                            {title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadgeColor}`}
                            >
                                {statusText}
                            </span>
                            <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-md border uppercase ${(selectedSource === "lab" || !needsData.crux)
                                    ? (darkMode ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-600 border-blue-200")
                                    : (darkMode ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-purple-50 text-purple-600 border-purple-200")
                                    }`}
                            >
                                {selectedSource === "lab" ? "LAB" : (needsData.crux ? "REAL USERS" : "LAB")}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {activeData?.analysis && (
                        <button
                            onClick={handleToggle}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${darkMode
                                ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                }`}
                        >
                            {showDetails ? "Hide Details" : "View Details"}
                            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onInfoClick) onInfoClick();
                        }}
                        className={`p-1.5 rounded-full transition-colors ${darkMode
                            ? "text-gray-500 hover:text-gray-300 hover:bg-gray-700"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            }`}
                        title="View Methodology"
                    >
                        <Info size={20} />
                    </button>
                </div>
            </div>
            <div className="space-y-6 flex-grow">
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    Description: <span className={`normal-case font-normal opacity-100 text-xs leading-relaxed ${subTextColor}`}>{description}</span>
                </p>
                <div>
                    <h4
                        className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                    >
                        Current Value
                    </h4>
                    <div
                        className={`text-base font-medium ${darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                    >
                        {title} is{" "}
                        <span className={`font-black text-xl ml-1 ${valueColor}`}>
                            {activeData.value}
                            {activeData.unit}
                        </span>
                    </div>
                </div>
                <div className="-mt-2">
                    <ThresholdBar
                        activeData={activeData}
                        metricData={metricData}
                        isPassed={status === "good"}
                        isWarning={status === "needs_improvement"}
                        darkMode={darkMode}
                        scaleFactor={1.5}
                    />
                </div>
            </div>
            <div
                className={`mt-auto pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"
                    }`}
            >
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    Why it matters:{" "}
                    <span className="normal-case font-normal opacity-100">
                        {whyItMatters}
                    </span>
                </p>
            </div>
            <MetricAnalysisDetails
                analysis={activeData?.analysis}
                darkMode={darkMode}
                isOpen={showDetails}
                onToggle={handleToggle}
            />

        </div>
    );
};

export default MetricCard;
