import React from 'react';
import { Info, ChevronUp, ChevronDown } from 'lucide-react';
import DirectThresholdBar from './DirectThresholdBar';
import MetricAnalysisDetails from './MetricAnalysisDetails';

const OptimizationCard = ({
    icon: Icon,
    title,
    metricData,
    darkMode,
    isOpen,
    onToggle,
    description,
    whyItMatters,
    onInfoClick,
    children,
    displayValue,
    fullWidth = false,
}) => {
    const needsData = metricData;
    const status = needsData.status || "poor";
    const { cardBg, textColor, subTextColor, statusBadgeColor, statusText } = getThemeStyles(darkMode, status);
    const displayVal = displayValue || needsData.value || needsData.score;

    return (
        <div
            data-col-span={fullWidth ? "all" : undefined}
            className={`rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col h-full ${fullWidth ? "md:col-span-2" : ""}`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl flex-shrink-0 ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                        <Icon size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg leading-tight mb-1 ${textColor}`}>{title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadgeColor}`}>{statusText}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {needsData?.analysis && (
                        <button
                            onClick={onToggle}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${darkMode
                                ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                }`}
                        >
                            {isOpen ? "Hide Details" : "View Details"}
                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onInfoClick && onInfoClick();
                        }}
                        className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-gray-500 hover:text-gray-300 hover:bg-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                        title="View Methodology"
                    >
                        <Info size={20} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="space-y-6 flex-grow">
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    Description: <span className={`normal-case font-normal opacity-100 text-xs leading-relaxed ${subTextColor}`}>{description}</span>
                </p>

                {/* Specific Stats Grid (Children) */}
                {children}

                {/* Threshold Bar */}
                <div>
                    <DirectThresholdBar metricData={{ ...needsData, value: displayVal }} darkMode={darkMode} />
                </div>
            </div>

            {/* Footer */}
            <div className={`mt-auto pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    Why it matters: <span className="normal-case font-normal opacity-100">{whyItMatters}</span>
                </p>
            </div>

            {/* Analysis Details */}
            <MetricAnalysisDetails
                analysis={needsData?.analysis}
                meta={needsData?.meta}
                darkMode={darkMode}
                isOpen={isOpen}
                onToggle={onToggle}
            />
        </div>
    );
};

// Helper function for theme styles
const getThemeStyles = (darkMode, status) => {
    const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
    const textColor = darkMode ? "text-gray-100" : "text-gray-900";
    const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";

    let statusBadgeColor, statusText;

    if (status === "pass") {
        statusBadgeColor = darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-600 border-emerald-100";
        statusText = "Passed";
    } else if (status === "warning") {
        statusBadgeColor = darkMode ? "bg-amber-900/30 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-600 border-amber-100";
        statusText = "Warning";
    } else {
        statusBadgeColor = darkMode ? "bg-rose-900/30 text-rose-400 border-rose-800" : "bg-rose-50 text-rose-600 border-rose-100";
        statusText = "Poor";
    }

    return { cardBg, textColor, subTextColor, statusBadgeColor, statusText };
};
export default OptimizationCard;
