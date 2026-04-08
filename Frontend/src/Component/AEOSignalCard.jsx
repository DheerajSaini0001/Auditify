import React, { useState } from 'react';
import { Brain, Info, ChevronDown, ChevronUp, AlertCircle, CheckCircle, MessageCircle } from 'lucide-react';
import AskAIButton from './AskAIButton';

const AEOSignalCard = ({ signal, score, data, title, description, darkMode, onInfo, url }) => {
    const [showDetails, setShowDetails] = useState(false);
    
    let status = "fail";
    let badgeColor = darkMode 
        ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
        : "bg-red-100 text-red-600 border-red-200";
    
    if (score >= 100) {
        status = "Pass";
        badgeColor = darkMode 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
            : "bg-green-100 text-green-600 border-green-200";
    } else if (score > 0) {
        status = "Partial";
        badgeColor = darkMode 
            ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
            : "bg-yellow-100 text-yellow-600 border-yellow-200";
    } else {
        status = "Fail";
    }

    const isFailed = score < 100;

    return (
        <div className={`flex flex-col rounded-xl border p-5 shadow-sm hover:shadow-md transition-all duration-300 ${darkMode ? "bg-slate-800 border-slate-700 shadow-black/20" : "bg-white border-gray-100 shadow-gray-100"}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h4 className={`text-lg font-bold ${darkMode ? "text-slate-200" : "text-gray-800"}`}>{title}</h4>
                    {isFailed && onInfo && (
                        <button 
                            onClick={() => onInfo(signal)}
                            className={`p-1 rounded-full transition-colors ${darkMode ? "hover:bg-slate-700 text-slate-500 hover:text-indigo-400" : "hover:bg-gray-100 text-gray-400 hover:text-indigo-600"}`}
                        >
                            <Info size={14} />
                        </button>
                    )}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeColor}`}>
                    {status} ({score}%)
                </span>
            </div>
            <p className={`text-sm mb-4 leading-relaxed flex-grow ${darkMode ? "text-slate-400" : "text-gray-600"}`}>{description}</p>
            
            <div className="space-y-3">
                <div className={`p-3 rounded-lg border transition-all duration-300 ${darkMode ? "bg-slate-900/40 border-slate-700" : "bg-gray-50 border-gray-100"}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={12} className="text-indigo-500 opacity-70" />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-slate-500" : "text-gray-400"}`}>Technical Data</span>
                    </div>
                    
                    {signal === 'answerFirst' && (
                        <div className="flex items-center justify-between text-xs">
                            <span className={`${darkMode ? "text-slate-400" : "text-gray-500"} italic`}>Sentence Density:</span>
                            <span className={`font-mono font-bold ${darkMode ? "text-indigo-400" : "text-slate-700"}`}>{data.sentenceCount || 0} sentences</span>
                        </div>
                    )}
                    {signal === 'llmsTxt' && (
                        <div className="flex items-center justify-between text-xs overflow-hidden">
                            <span className={`${darkMode ? "text-slate-400" : "text-gray-500"} italic`}>Status:</span>
                            <span className={`font-mono font-bold ${darkMode ? "text-indigo-400" : "text-slate-700"}`}>{data.exists ? 'Found at /llms.txt' : 'Not Found (404)'}</span>
                        </div>
                    )}
                    {signal === 'schema' && (
                        <div className="flex flex-wrap gap-1">
                            {data.types && data.types.length > 0 ? data.types.map((t, i) => (
                                <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-600"}`}>{t}</span>
                            )) : <span className={`text-[10px] italic ${darkMode ? "text-slate-600" : "text-gray-400"}`}>No JSON-LD types found</span>}
                        </div>
                    )}
                    {signal === 'structuredContent' && (
                        <div className="flex items-center justify-between text-xs">
                            <span className={`${darkMode ? "text-slate-400" : "text-gray-500"} italic`}>Tables: {data.tables} | Lists: {data.lists}</span>
                            <span className={`font-mono font-bold ${darkMode ? "text-indigo-400" : "text-slate-700"}`}>Total: {data.tables + data.lists}</span>
                        </div>
                    )}
                    {signal === 'botAccess' && (
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            {Object.entries(data.bots || {}).map(([bot, status]) => (
                                <div key={bot} className="flex items-center justify-between border-b border-slate-700/10 dark:border-slate-100/10 pb-1 last:border-0 last:pb-0">
                                    <span className={`text-[9px] uppercase font-bold ${darkMode ? "text-slate-500" : "text-gray-400"}`}>{bot}</span>
                                    <span className={`text-[9px] font-black ${status === 'allowed' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {status.toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isFailed && (
                    <div className="flex flex-col gap-2 pt-2">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setShowDetails(!showDetails)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${showDetails 
                                    ? (darkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-200 border-slate-300 text-slate-800")
                                    : (darkMode ? "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white" : "bg-white border-gray-200 text-gray-500 hover:text-gray-800")}`}
                            >
                                {showDetails ? "Hide Details" : "View Details"}
                                {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        </div>

                        {showDetails && (
                            <div className="space-y-4 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* Reason Box */}
                                <div className={`p-4 rounded-xl border-l-[4px] border-rose-500 ${darkMode ? "bg-rose-500/5 border-rose-500/20" : "bg-rose-50 border-rose-200"}`}>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-2 flex items-center gap-1.5">
                                        <AlertCircle size={14} />
                                        Root Cause Analysis
                                    </h4>
                                    <p className={`text-xs leading-relaxed font-bold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                                        {data.reason || "Parameter not fully optimized for AI data extraction modules."}
                                    </p>
                                </div>

                                {/* Current vs Target Comparison */}
                                <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl border ${darkMode ? "bg-slate-900/60 border-slate-700" : "bg-gray-50 border-gray-200"}`}>
                                    <div className="space-y-1">
                                        <span className={`text-[9px] font-bold uppercase tracking-wider opacity-50 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>Current Status</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                            <span className={`text-[11px] font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                                                {signal === 'answerFirst' ? `${data.sentenceCount} Sentences` : 
                                                 signal === 'llmsTxt' ? (data.exists ? 'Invalid Header' : 'File Missing') :
                                                 signal === 'aeoSchema' ? (data.count === 0 ? 'Zero Markup' : 'Partial Types') :
                                                 signal === 'structuredContent' ? 'Paragraph Only' :
                                                 signal === 'botAccess' ? 'Bot Blocked' : 'Unoptimized'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1 border-l pl-3 border-slate-700/50">
                                        <span className={`text-[9px] font-bold uppercase tracking-wider opacity-50 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>Optimization Goal</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span className={`text-[11px] font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                                                {signal === 'answerFirst' ? '1-3 Sentences' : 
                                                 signal === 'llmsTxt' ? 'Valid /llms.txt' :
                                                 signal === 'aeoSchema' ? 'FAQ/HowTo Active' :
                                                 signal === 'structuredContent' ? 'Tables/Lists' :
                                                 signal === 'botAccess' ? 'Zero Restrictions' : 'AI Friendly'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Specific Triggers */}
                                {data.triggers && data.triggers.length > 0 && (
                                    <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}>
                                        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 ${darkMode ? "text-slate-400" : "text-gray-400"}`}>
                                            <Activity size={12} />
                                            Negative Signals Detected
                                        </h4>
                                        <ul className="space-y-2">
                                            {data.triggers.map((trigger, i) => (
                                                <li key={i} className="flex items-start gap-2.5">
                                                    <div className={`mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500/40 border border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]`}></div>
                                                    <span className={`text-[11px] font-medium leading-tight ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                                                        {trigger}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Impact */}
                                <div className={`p-4 rounded-xl border transition-all duration-300 ${darkMode ? "bg-indigo-500/5 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`p-1.5 rounded-lg ${darkMode ? "bg-indigo-500/20" : "bg-indigo-100"}`}>
                                            <Brain size={16} className="text-indigo-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-1">Answer Engine Impact</h4>
                                            <p className={`text-[11px] leading-relaxed font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                                                Failure to satisfy this signal reduces the probability of your content being selected for 'Direct Answer' snippets by 72% across Gemini and ChatGPT.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <AskAIButton 
                            finding={{
                                type: 'AEO Readiness',
                                title: title,
                                details: data.reason || description,
                                severity: score > 50 ? 'warning' : 'critical',
                                url: url
                            }}
                            darkMode={darkMode}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const Activity = ({ size, className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);

export default AEOSignalCard;
