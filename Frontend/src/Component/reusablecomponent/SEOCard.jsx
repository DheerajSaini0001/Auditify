import React from "react";
import { ChevronUp, ChevronDown, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { InfoDetails as DefaultInfoDetails } from "../../Component/InfoDetails";
import ScoreBadge from "./ScoreBadge";
import AskAIButton from "../AskAIButton";

/**
 * SEOCard - Flexible reusable wrapper for SEO metric cards
 * 
 * @param {string} title - Card title
 * @param {Component} icon - Lucide React icon component
 * @param {string} iconColor - Icon color class (default: "text-violet-400")
 * @param {number} score - Metric score (0.0 - 1.0)
 * @param {string} statusText - Status description text
 * @param {object} meta - Backend meta object
 * @param {string} metricKey - Key for seoMetricExplanations lookup
 * @param {boolean} darkMode - Dark mode state
 * @param {function} onInfo - Info button click handler
 * @param {string} className - Additional CSS classes
 * @param {string} headerInfo - Extra info to display next to status badge
 * @param {React.ReactNode} children - Custom card content
 * @param {boolean} showAnalysis - Whether to show Analysis/Recommendation section
 * @param {function} getStatusFromScore - Score to status mapper function
 * @param {object} InfoDetails - SEO explanations object (Optional prop)
 */
const SEOCard = ({
    title,
    icon: Icon,
    iconColor = "text-violet-400",
    score, // 0-100 now
    status, // pass, warning, fail
    statusText,
    meta,
    analysis,
    metricKey,
    darkMode,
    onInfo,
    className = "",
    headerInfo,
    children,
    showAnalysis = true,
    getStatusFromScore,
    InfoDetails: propInfoDetails,
}) => {
    const InfoDetails = propInfoDetails || DefaultInfoDetails;
    const [showDetails, setShowDetails] = React.useState(false);
    const currentStatus = getStatusFromScore ? getStatusFromScore(score) : status;
    const isPassed = currentStatus === "pass";
    const currentAnalysis = analysis;

    return (
        <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group ${className} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
                            <Icon size={24} className={darkMode ? iconColor : iconColor.replace('400', '600')} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{title}</h3>
                            <div className={`flex items-center gap-2 mt-1`}>
                                <ScoreBadge
                                    status={currentStatus}
                                    value={statusText}
                                    darkMode={darkMode}
                                />
                                {headerInfo && (
                                    <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                        {headerInfo}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {showAnalysis && currentAnalysis && !isPassed && (
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${darkMode
                                    ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                    }`}
                            >
                                {showDetails ? "Hide Details" : "View Details"}
                                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        )}
                        {onInfo && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onInfo();
                                }}
                                className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
                            >
                                <Info size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Body */}
                <div className="space-y-4">
                    {/* Description */}
                    {metricKey && InfoDetails?.[metricKey] && (
                        <div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>DESCRIPTION: </span>
                            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                {InfoDetails[metricKey].whatThisParameterIs || InfoDetails[metricKey].whatThisMetricIs || InfoDetails[metricKey].whatThisParameterIs}
                            </span>
                        </div>
                    )}

                    {/* Custom Content */}
                    {children}

                    {/* Why it matters */}
                    {metricKey && InfoDetails?.[metricKey] && (
                        <div className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>WHY IT MATTERS: </span>
                            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                {InfoDetails[metricKey].whyItMatters || "No description available."}
                            </span>
                        </div>
                    )}

                    {/* Analysis Details (Only if toggled) */}
                    {showAnalysis && showDetails && currentAnalysis && !isPassed && (
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                            {/* Analysis */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                                    <AlertTriangle size={12} />
                                    <span>Analysis</span>
                                </div>
                                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                    {currentAnalysis.cause}
                                </p>
                            </div>

                            {/* Recommendation */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-500">
                                    <CheckCircle size={12} />
                                    <span>Recommendation</span>
                                </div>
                                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                    {currentAnalysis.recommendation}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Ask AI Button */}
                    {!isPassed && (
                        <AskAIButton
                            finding={{ type: 'On-Page SEO', title: title, details: statusText || '', severity: currentStatus === 'pass' ? 'pass' : currentStatus === 'warning' ? 'warning' : 'critical', url: '' }}
                            darkMode={darkMode}
                            meta={meta}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SEOCard;
