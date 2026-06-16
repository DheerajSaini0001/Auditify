import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const MetricAnalysisDetails = ({ analysis, meta, darkMode, isOpen, onToggle, fallbackCauses, fallbackRecommendations }) => {
    if (!isOpen) return null;

    // Fall back to static InfoDetails arrays when backend analysis is absent
    const causes = (analysis?.causes?.length > 0 || analysis?.cause)
        ? null
        : (Array.isArray(fallbackCauses) && fallbackCauses.length > 0 ? fallbackCauses : null);
    const recommendations = (analysis?.recommendations?.length > 0 || analysis?.recommendation)
        ? null
        : (Array.isArray(fallbackRecommendations) && fallbackRecommendations.length > 0 ? fallbackRecommendations : null);

    return (
        <div className={`mt-6 pt-4 border-t ${darkMode ? "border-gray-700" : "border-line"}`}>
            <div className="space-y-4">
                {analysis?.lcpElement && (
                    <div>
                        <h5 className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-blue-400" : "text-ink"}`}>LCP Element</h5>
                        <div className={`text-xs p-2 rounded-md font-mono break-all ${darkMode ? "bg-slate-900/50 text-slate-300 border border-slate-800" : "bg-cardsoft text-muted border border-line"}`}>
                            {analysis.lcpElement}
                        </div>
                    </div>
                )}
                {(analysis?.causes?.length > 0 || analysis?.cause || causes) && (
                    <div>
                        <h5 className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Causes</h5>
                        <ul className="space-y-2">
                            {analysis?.cause && (
                                <li className={`text-xs flex items-start gap-2 ${darkMode ? "text-gray-400" : "text-muted"}`}>
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
                                    <span>{analysis.cause}</span>
                                </li>
                            )}
                            {analysis?.causes?.map((cause, idx) => (
                                <li key={idx} className={`text-xs flex items-start gap-2 ${darkMode ? "text-gray-400" : "text-muted"}`}>
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
                                    <span>{cause}</span>
                                </li>
                            ))}
                            {causes?.map((cause, idx) => (
                                <li key={idx} className={`text-xs flex items-start gap-2 ${darkMode ? "text-gray-400" : "text-muted"}`}>
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
                                    <span>{cause}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {(analysis?.recommendations?.length > 0 || analysis?.recommendation || recommendations) && (
                    <div>
                        <h5 className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Recommendations</h5>
                        <ul className="space-y-2">
                            {analysis?.recommendation && (
                                <li className={`text-xs flex items-start gap-2 ${darkMode ? "text-gray-400" : "text-muted"}`}>
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                                    <span>{analysis.recommendation}</span>
                                </li>
                            )}
                            {analysis?.recommendations?.map((rec, idx) => (
                                <li key={idx} className={`text-xs flex items-start gap-2 ${darkMode ? "text-gray-400" : "text-muted"}`}>
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                                    <span>{rec}</span>
                                </li>
                            ))}
                            {recommendations?.map((rec, idx) => (
                                <li key={idx} className={`text-xs flex items-start gap-2 ${darkMode ? "text-gray-400" : "text-muted"}`}>
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Detailed Item Lists from Backend */}
                {meta && (meta.uncompressedResources || meta.uncachedResources || meta.unoptimizedImages ||
                    meta.unminifiedScripts || meta.blockingResources || meta.redirectDetails) && (
                        <div className="pt-2">
                            <h5 className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-blue-400" : "text-ink"}`}>Affected Resources</h5>
                            <div className={`max-h-40 overflow-y-auto space-y-2 rounded-lg p-2 ${darkMode ? "bg-slate-900/30" : "bg-cardsoft"}`}>
                                {[
                                    ...(meta.uncompressedResources || []),
                                    ...(meta.uncachedResources || []),
                                    ...(meta.unoptimizedImages || []),
                                    ...(meta.unminifiedScripts || []),
                                    ...(meta.blockingResources || []),
                                    ...(meta.redirectDetails || [])
                                ].map((item, idx) => {
                                    const url = typeof item === 'string' ? item : item?.url;
                                    const details = typeof item === 'object' ? item?.details : null;
                                    return (
                                        <div key={idx} className={`text-[10px] p-2 rounded border ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-card border-line"}`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <p className={`font-mono truncate flex-grow ${darkMode ? "text-gray-300" : "text-inksoft"}`} title={url}>{url}</p>
                                                {item?.type && (
                                                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase ${item.type === 'Image' ? (darkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-50 text-purple-600") : (darkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-600")}`}>
                                                        {item.type}
                                                    </span>
                                                )}
                                            </div>
                                            {details && <p className={`opacity-70 ${darkMode ? "text-gray-400" : "text-muted"}`}>{details}</p>}
                                            {item?.currentEncoding && <p className={`mt-1 opacity-70 ${darkMode ? "text-gray-400" : "text-muted"}`}>Encoding: {item.currentEncoding}</p>}
                                            {item?.cachePolicy && <p className={`mt-1 opacity-70 ${darkMode ? "text-gray-400" : "text-muted"}`}>Policy: {item.cachePolicy}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default MetricAnalysisDetails;
