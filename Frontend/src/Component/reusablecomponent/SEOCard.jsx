import React from "react";
import { ChevronUp, ChevronDown, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { InfoDetails as DefaultInfoDetails } from "../../Component/InfoDetails";
import ScoreBadge from "./ScoreBadge";
import AskAIButton from "../AskAIButton";
import Tooltip from "./Tooltip";
import { isActionableParam } from "../../config/parameterAudience";

/**
 * SEOCard - Flexible reusable wrapper for SEO metric cards
 * 
 * @param {string} title - Card title
 * @param {Component} icon - Lucide React icon component
 * @param {string} iconColor - Icon color class (default: "text-blue-400")
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
    iconColor = "text-blue-400",
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

    // Fallback content from InfoDetails when no backend analysis is supplied.
    const infoEntry = (metricKey && InfoDetails?.[metricKey]) || {};
    const fallbackReasons = infoEntry.actualReasonsForFailure || [];
    const fallbackFixes = infoEntry.howToOvercomeFailure || [];
    const hasFallback = fallbackReasons.length > 0 || fallbackFixes.length > 0;
    // Show the details toggle whenever the card is imperfect and we have something to show
    // — but only for dealer parameters. Developer-only params hide "why the score is less"
    // (requirement b). Hidden, not removed: reclassify in parameterAudience.js to restore.
    const canShowDetails = showAnalysis && !isPassed && (!!currentAnalysis || hasFallback) && isActionableParam(metricKey);

    return (
        <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group ${className} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-card border-line"}`}>
            <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-cardsoft"} group-hover:scale-110 transition-transform duration-300`}>
                            <Icon size={24} className={darkMode ? iconColor : iconColor.replace('400', '600')} />
                        </div>
                        <div>
                            <h3 className={`font-semibold text-lg ${darkMode ? "text-gray-100" : "text-ink"}`}>{title}</h3>
                            <div className={`flex items-center gap-2 mt-1`}>
                                <ScoreBadge
                                    status={currentStatus}
                                    value={statusText}
                                    darkMode={darkMode}
                                />
                                {headerInfo && (
                                    <span className={`text-xs ${darkMode ? "text-gray-400" : "text-muted"}`}>
                                        {headerInfo}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {canShowDetails && (
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${darkMode
                                    ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                                    : "bg-cardsoft hover:bg-surface-2 text-muted"
                                    }`}
                            >
                                {showDetails ? "Hide Details" : "View Details"}
                                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        )}
                        {onInfo && (
                            <Tooltip
                                darkMode={darkMode}
                                content={
                                    <div className="space-y-4 text-left">
                                        {metricKey && InfoDetails?.[metricKey] && (
                                            <>
                                                <div>
                                                    <h4 className="text-[10px] font-semibold uppercase tracking-widest text-blue-500 mb-1">Description</h4>
                                                    <p className="text-xs leading-relaxed opacity-90">
                                                        {InfoDetails[metricKey].whatThisParameterIs || InfoDetails[metricKey].whatThisMetricIs || InfoDetails[metricKey].whatThisParameterIs}
                                                    </p>
                                                </div>
                                                <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-line"}`} />
                                                <div>
                                                    <h4 className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">Why it matters</h4>
                                                    <p className="text-xs leading-relaxed opacity-90">
                                                        {InfoDetails[metricKey].whyItMatters || "No description available."}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                }
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onInfo();
                                    }}
                                    className={`p-1 rounded-full hover:bg-surface-2 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-faint hover:text-ink"}`}
                                >
                                    <Info size={18} />
                                </button>
                            </Tooltip>
                        )}
                    </div>
                </div>

                {/* Content Body */}
                <div className="space-y-4">

                    {/* Custom Content */}
                    {children}


                    {/* Analysis Details (Only if toggled). Uses backend analysis when present,
                        otherwise falls back to InfoDetails reasons + fixes. */}
                    {showDetails && canShowDetails && (
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-line"}`}>
                            {/* Cause */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
                                    <AlertTriangle size={12} />
                                    <span>Cause</span>
                                </div>
                                {currentAnalysis?.cause ? (
                                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-muted"}`}>
                                        {currentAnalysis.cause}
                                    </p>
                                ) : (
                                    <ul className="space-y-1">
                                        {fallbackReasons.map((reason, i) => (
                                            <li key={i} className={`text-sm flex items-start gap-2 ${darkMode ? "text-gray-300" : "text-muted"}`}>
                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
                                                <span>{reason}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Recommendation */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-500">
                                    <CheckCircle size={12} />
                                    <span>Recommendation</span>
                                </div>
                                {currentAnalysis?.recommendation ? (
                                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-muted"}`}>
                                        {currentAnalysis.recommendation}
                                    </p>
                                ) : (
                                    <ul className="space-y-1">
                                        {fallbackFixes.map((rec, i) => (
                                            <li key={i} className={`text-sm flex items-start gap-2 ${darkMode ? "text-gray-300" : "text-muted"}`}>
                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Ask AI Button */}
                    {!isPassed && (
                        <AskAIButton
                            finding={{ type: 'On-Page SEO', title: title, details: statusText || '', severity: currentStatus === 'pass' ? 'pass' : currentStatus === 'warning' ? 'warning' : 'critical', url: '' }}
                            darkMode={darkMode}
                            meta={meta}
                            paramKey={metricKey}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SEOCard;
