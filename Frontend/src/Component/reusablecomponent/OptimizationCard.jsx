import React from 'react';
import { Info, ChevronUp, ChevronDown } from 'lucide-react';
import DirectThresholdBar from './DirectThresholdBar';
import MetricAnalysisDetails from './MetricAnalysisDetails';
import Tooltip from './Tooltip';
import AskAIButton from '../AskAIButton';
import { isActionableParam } from '../../config/parameterAudience';
import { statusBadge, statusLabelText } from '../../utils/statusColors';

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
    fallbackCauses,
    fallbackRecommendations,
    paramKey,
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
                    <div className={`p-3 rounded-xl flex-shrink-0 ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-accentsoft text-accent"}`}>
                        <Icon size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className={`font-semibold text-lg leading-tight mb-1 ${textColor}`}>{title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${statusBadgeColor}`}>{statusText}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {status !== "pass" && isActionableParam(paramKey) && (
                        <button
                            onClick={onToggle}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${darkMode
                                ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                                : "bg-cardsoft hover:bg-surface-2 text-muted"
                                }`}
                        >
                            {isOpen ? "Hide Details" : "View Details"}
                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
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
                                onInfoClick && onInfoClick();
                            }}
                            className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-gray-500 hover:text-gray-300 hover:bg-gray-700" : "text-faint hover:text-muted hover:bg-surface-2"}`}
                            title="View Methodology"
                        >
                            <Info size={20} />
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Body */}
            <div className="space-y-6 flex-grow">

                {/* Specific Stats Grid (Children) */}
                {children}

                {/* Threshold Bar */}
                <div>
                    <DirectThresholdBar metricData={{ ...needsData, value: displayVal }} darkMode={darkMode} />
                </div>
            </div>


            {/* Analysis Details */}
            <MetricAnalysisDetails
                analysis={needsData?.analysis}
                meta={needsData?.meta}
                darkMode={darkMode}
                isOpen={isOpen}
                onToggle={onToggle}
                fallbackCauses={fallbackCauses}
                fallbackRecommendations={fallbackRecommendations}
            />

            {/* Ask AI Button */}
            {status !== "pass" && (
                <AskAIButton
                    finding={{
                        type: 'Technical Performance',
                        title: title,
                        details: needsData?.details || '',
                        severity: status === 'pass' ? 'pass' : status === 'warning' ? 'warning' : 'critical',
                        url: ''
                    }}
                    darkMode={darkMode}
                    meta={needsData?.meta}
                    paramKey={paramKey}
                />
            )}
        </div>
    );
};

// Helper function for theme styles. Chrome (card/text) stays on theme tokens; the
// status badge + label come from the shared status-colour source of truth.
const getThemeStyles = (darkMode, status) => ({
    cardBg: darkMode ? "bg-gray-800 border-gray-700" : "bg-card border-line",
    textColor: darkMode ? "text-gray-100" : "text-ink",
    subTextColor: darkMode ? "text-gray-400" : "text-muted",
    statusBadgeColor: statusBadge(status, darkMode),
    statusText: statusLabelText(status),
});
export default OptimizationCard;
