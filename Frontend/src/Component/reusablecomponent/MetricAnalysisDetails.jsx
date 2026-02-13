import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const MetricAnalysisDetails = ({ analysis, darkMode, isOpen, onToggle }) => {
    if (!analysis) return null;

    return (
        <div className={`mt-6 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <div className={`rounded-xl border transition-all duration-300 ${darkMode ? "bg-slate-800/50 border-slate-700/50 hover:border-slate-600" : "bg-blue-50/50 border-blue-100 hover:border-blue-200"}`}>
                <button
                    onClick={onToggle}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                >
                    <span>{isOpen ? "Hide Details" : "View Details"}</span>
                    {isOpen ? <ChevronUp size={14} strokeWidth={2.5} /> : <ChevronDown size={14} strokeWidth={2.5} />}
                </button>
                {isOpen && (
                    <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        {analysis.insight && (
                            <div className={`p-3 rounded-lg ${darkMode ? "bg-slate-900/50" : "bg-white/50"}`}>
                                <p className={`text-xs leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    <span className="font-semibold text-purple-500">Insight:</span> {analysis.insight}
                                </p>
                            </div>
                        )}
                        {analysis.lcpElement && (
                            <div>
                                <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>LCP Element</h5>
                                <div className={`text-xs p-2 rounded-md font-mono break-all ${darkMode ? "bg-slate-900/50 text-slate-300 border border-slate-800" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
                                    {analysis.lcpElement}
                                </div>
                            </div>
                        )}
                        {analysis.causes && analysis.causes.length > 0 && (
                            <div>
                                <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Causes</h5>
                                <ul className="space-y-2">
                                    {analysis.causes.map((cause, idx) => (
                                        <li key={idx} className={`text-xs flex items-start gap-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
                                            <span>{cause}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {analysis.recommendations && analysis.recommendations.length > 0 && (
                            <div>
                                <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Recommendations</h5>
                                <ul className="space-y-2">
                                    {analysis.recommendations.map((rec, idx) => (
                                        <li key={idx} className={`text-xs flex items-start gap-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Detailed Item Lists from Backend */}
                        {(analysis.uncompressedResources || analysis.uncachedResources || analysis.unoptimizedImages ||
                            analysis.unminifiedScripts || analysis.blockingResources || analysis.brokenLinksList || analysis.redirectDetails) && (
                                <div className="pt-2">
                                    <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Affected Resources</h5>
                                    <div className={`max-h-40 overflow-y-auto space-y-2 rounded-lg p-2 ${darkMode ? "bg-slate-900/30" : "bg-gray-50/50"}`}>
                                        {[
                                            ...(analysis.uncompressedResources || []),
                                            ...(analysis.uncachedResources || []),
                                            ...(analysis.unoptimizedImages || []),
                                            ...(analysis.unminifiedScripts || []),
                                            ...(analysis.blockingResources || []),
                                            ...(analysis.brokenLinksList || []),
                                            ...(analysis.redirectDetails || [])
                                        ].map((item, idx) => {
                                            const url = typeof item === 'string' ? item : item.url;
                                            const details = typeof item === 'object' ? item.details : null;
                                            return (
                                                <div key={idx} className={`text-[10px] p-2 rounded border ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-100"}`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className={`font-mono truncate flex-grow ${darkMode ? "text-gray-300" : "text-gray-700"}`} title={url}>{url}</p>
                                                        {item.type && (
                                                            <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${item.type === 'Image' ? (darkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-50 text-purple-600") : (darkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-600")}`}>
                                                                {item.type}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {details && <p className={`opacity-70 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{details}</p>}
                                                    {item.currentEncoding && <p className={`mt-1 opacity-70 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Encoding: {item.currentEncoding}</p>}
                                                    {item.cachePolicy && <p className={`mt-1 opacity-70 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Policy: {item.cachePolicy}</p>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        {/* Raw Content Viewer (Sitemap, Robots, Schema) */}
                        {analysis.content && (
                            <div className="pt-2">
                                <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Detected Content</h5>
                                <div className={`max-h-60 overflow-y-auto rounded-lg p-3 font-mono text-[10px] border ${darkMode ? "bg-slate-900/50 text-slate-300 border-slate-700/50" : "bg-gray-50 text-gray-700 border-gray-100"}`}>
                                    <pre className="whitespace-pre-wrap break-all">
                                        {typeof analysis.content === 'object'
                                            ? JSON.stringify(analysis.content, null, 2)
                                            : analysis.content}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetricAnalysisDetails;
