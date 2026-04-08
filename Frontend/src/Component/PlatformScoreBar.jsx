import React, { useState } from 'react';
import { Eye, ChevronRight } from 'lucide-react';

const PlatformScoreBar = ({ platforms, darkMode }) => {
    const [expandedPlatform, setExpandedPlatform] = useState(null);

    const platformData = [
        { name: 'Gemini', key: 'gemini', score: platforms.gemini.score, color: '#4285F4' },
        { name: 'ChatGPT', key: 'chatgpt', score: platforms.chatgpt.score, color: '#10A37F' },
        { name: 'Perplexity', key: 'perplexity', score: platforms.perplexity.score, color: '#A259FF' },
    ];

    const parameterLabels = {
        answerFirst: "Citations / Sources (TL;DR)",
        llmsTxt: "/llms.txt Presence",
        schema: "Schema.org (FAQ / HowTo)",
        structuredContent: "Markdown Headers / Tables",
        botAccess: "Search Index Crawler Status",
        pageSpeed: "Page Speed / Performance"
    };

    return (
        <div className={`rounded-2xl border p-6 shadow-lg mb-8 transition-all hover:scale-[1.01] ${darkMode ? "bg-slate-900 border-slate-800 shadow-black/40" : "bg-white border-gray-100"}`}>
            <h4 className={`text-xl font-bold mb-6 flex items-center gap-2 ${darkMode ? "text-slate-200" : "text-gray-800"}`}>
                <svg className={`w-6 h-6 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Platform AI Readiness Breakdown
            </h4>
            <div className="space-y-8">
                {platformData.map((plat, idx) => (
                    <div key={idx} className="relative">
                        <div className="flex mb-2 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black inline-block py-1 px-3 uppercase rounded-full tracking-widest text-white shadow-sm" style={{ backgroundColor: plat.color }}>
                                    {plat.name}
                                </span>
                                <button 
                                    onClick={() => setExpandedPlatform(expandedPlatform === plat.key ? null : plat.key)}
                                    className={`p-1.5 rounded-lg transition-all transform hover:scale-110 ${expandedPlatform === plat.key 
                                        ? (darkMode ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' : 'bg-indigo-100 text-indigo-600 animate-pulse') 
                                        : (darkMode ? 'bg-slate-800 text-slate-500 hover:text-indigo-400' : 'bg-gray-50 text-gray-400 hover:text-indigo-500')}`}
                                    title="View Parameter Breakdown"
                                >
                                    <Eye size={16} />
                                </button>
                            </div>
                            <div className="text-right">
                                <span className={`text-sm font-black inline-block tracking-tighter ${darkMode ? "text-white" : "text-gray-900"}`}>
                                    {plat.score}%
                                </span>
                            </div>
                        </div>
                        
                        <div className={`overflow-hidden h-3 mb-2 text-xs flex rounded-full shadow-inner group ${darkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                            <div
                                style={{ width: `${plat.score}%`, backgroundColor: plat.color }}
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-out animate-pulse-once group-hover:brightness-110"
                            ></div>
                        </div>
                        
                        <p className={`text-[10px] font-medium leading-relaxed italic mb-1 ${plat.score < 60 ? (darkMode ? "text-rose-400" : "text-rose-500") : (darkMode ? "text-slate-500" : "text-gray-500")}`}>
                            {plat.score >= 80 ? "✅ Why: " : "⚠️ Why: "}{platforms[plat.key].reason}
                        </p>

                        {/* Parameter Breakdown Overlay */}
                        {expandedPlatform === plat.key && (
                            <div className={`mt-4 p-4 border rounded-2xl animate-in slide-in-from-top-2 duration-300 ${darkMode ? "bg-slate-950/40 border-slate-800" : "bg-gray-50/80 border-gray-100"}`}>
                                <h5 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
                                    <ChevronRight size={10} className="text-indigo-500" />
                                    Scoring Formula Performance
                                </h5>
                                <div className="space-y-3">
                                    {Object.entries(platforms[plat.key].breakdown).map(([param, points]) => (
                                        <div key={param} className="flex items-center justify-between">
                                            <span className={`text-[11px] font-bold ${darkMode ? "text-slate-400" : "text-gray-600"}`}>{parameterLabels[param] || param}</span>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-20 h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-slate-800" : "bg-gray-200"}`}>
                                                    <div 
                                                        className={`h-full ${darkMode ? "bg-indigo-500" : "bg-indigo-500/50"}`} 
                                                        style={{ width: `${(points / platformData.find(p => p.key === plat.key).score) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`text-[10px] font-black w-10 text-right ${darkMode ? "text-white" : "text-gray-900"}`}>+{points} pts</span>
                                            </div>
                                        </div>
                                    ))}
                                    {platforms[plat.key].blocked && (
                                        <div className={`pt-2 border-t mt-2 ${darkMode ? "border-slate-800" : "border-gray-200"}`}>
                                            <span className={`text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1 ${darkMode ? "text-rose-400" : "text-rose-500"}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full animate-ping ${darkMode ? "bg-rose-400" : "bg-rose-500"}`}></div>
                                                Crawler Blocking Penalty Applied (100% Score Cut)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className={`mt-8 p-4 rounded-xl border ${darkMode ? "bg-indigo-500/5 border-indigo-500/10" : "bg-indigo-50/50 border-indigo-100"}`}>
                 <p className={`text-[11px] italic flex items-center gap-2 font-semibold ${darkMode ? "text-indigo-400" : "text-indigo-700"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Weights are optimized based on each platform's unique AI citation & crawling heuristics.
                 </p>
            </div>
        </div>
    );
};

export default PlatformScoreBar;
