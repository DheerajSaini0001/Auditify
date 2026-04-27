import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const MetricAnalysisDetails = ({ analysis, meta, darkMode, isOpen, onToggle }) => {
    if (!analysis || !isOpen) return null;

    return (
        <div className={`mt-6 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <div className="space-y-4">
                {analysis.lcpElement && (
                    <div>
                        <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>LCP Element</h5>
                        <div className={`text-xs p-2 rounded-md font-mono break-all ${darkMode ? "bg-slate-900/50 text-slate-300 border border-slate-800" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
                            {analysis.lcpElement}
                        </div>
                    </div>
                )}
                {(analysis.causes?.length > 0 || analysis.cause) && (
                    <div>
                        <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Causes</h5>
                        <ul className="space-y-2">
                            {analysis.cause && (
                                <li className={`text-xs flex items-start gap-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
                                    <span>{analysis.cause}</span>
                                </li>
                            )}
                            {analysis.causes?.map((cause, idx) => (
                                <li key={idx} className={`text-xs flex items-start gap-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
                                    <span>{cause}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {(analysis.recommendations?.length > 0 || analysis.recommendation) && (
                    <div>
                        <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Recommendations</h5>
                        <ul className="space-y-2">
                            {analysis.recommendation && (
                                <li className={`text-xs flex items-start gap-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                                    <span>{analysis.recommendation}</span>
                                </li>
                            )}
                            {analysis.recommendations?.map((rec, idx) => (
                                <li key={idx} className={`text-xs flex items-start gap-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
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
                            <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Affected Resources</h5>
                            <div className={`max-h-40 overflow-y-auto space-y-2 rounded-lg p-2 ${darkMode ? "bg-slate-900/30" : "bg-gray-50/50"}`}>
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
                                        <div key={idx} className={`text-[10px] p-2 rounded border ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-100"}`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <p className={`font-mono truncate flex-grow ${darkMode ? "text-gray-300" : "text-gray-700"}`} title={url}>{url}</p>
                                                {item?.type && (
                                                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${item.type === 'Image' ? (darkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-50 text-purple-600") : (darkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-600")}`}>
                                                        {item.type}
                                                    </span>
                                                )}
                                            </div>
                                            {details && <p className={`opacity-70 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{details}</p>}
                                            {item?.currentEncoding && <p className={`mt-1 opacity-70 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Encoding: {item.currentEncoding}</p>}
                                            {item?.cachePolicy && <p className={`mt-1 opacity-70 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Policy: {item.cachePolicy}</p>}
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
