import React, { useState } from 'react';
import { Eye, ChevronRight, Activity, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

const PlatformScoreBar = ({ platforms, darkMode, platformKey = null, singleCard = false }) => {
    const [expandedPlatform, setExpandedPlatform] = useState(null);

    const fullPlatformData = [
        { name: 'Gemini', key: 'gemini', score: platforms?.gemini?.score || 0, color: '#4285F4', shadow: 'shadow-blue-500/20', bg: 'bg-blue-500' },
        { name: 'ChatGPT', key: 'chatgpt', score: platforms?.chatgpt?.score || 0, color: '#10A37F', shadow: 'shadow-emerald-500/20', bg: 'bg-emerald-500' },
        { name: 'Perplexity', key: 'perplexity', score: platforms?.perplexity?.score || 0, color: '#A259FF', shadow: 'shadow-purple-500/20', bg: 'bg-purple-500' },
    ];

    const platformData = singleCard && platformKey 
        ? fullPlatformData.filter(p => p.key === platformKey)
        : fullPlatformData;

    const parameterLabels = {
        answerFirst: "Direct Answer (TL;DR)",
        llmsTxt: "/llms.txt Presence",
        schema: "Schema.org (FAQ / HowTo)",
        structuredContent: "Data Tables & Lists",
        botAccess: "Search Index status",
        pageSpeed: "Page Speed / Performance",
        markdownHeaders: "Markdown Header Hierarchy",
        citations: "Citations & External Sources"
    };

    const platformRelevance = {
        gemini: ['schema', 'botAccess', 'answerFirst', 'llmsTxt', 'structuredContent'],
        chatgpt: ['llmsTxt', 'markdownHeaders', 'answerFirst', 'botAccess', 'schema'],
        perplexity: ['structuredContent', 'citations', 'pageSpeed']
    };

    const renderPlatformCard = (plat, idx) => (
        <div key={idx} className={`relative group p-10 rounded-[2.5rem] border transition-all duration-500 flex flex-col gap-8 ${singleCard ? (darkMode ? "bg-slate-900 border-slate-800 shadow-2xl shadow-black/80" : "bg-white border-gray-100 shadow-xl shadow-slate-200/50") : ""}`}>
            
            {/* Header: Name & Score */}
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${plat.bg} animate-pulse shadow-[0_0_10px_rgba(0,0,0,0.2)]`}></div>
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: plat.color }}>
                            {plat.name} Engine
                        </span>
                    </div>
                    <h5 className={`text-3xl font-black tracking-tight ${darkMode ? "text-slate-200" : "text-slate-900"}`}>{plat.name}</h5>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-black italic tracking-tighter ${darkMode ? "text-white" : "text-slate-900"}`}>
                            {plat.score}
                        </span>
                        <span className="text-lg font-black italic opacity-20">%</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${plat.score >= 80 ? "bg-emerald-500/10 text-emerald-500" : plat.score >= 50 ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"}`}>
                        {plat.score >= 80 ? 'Optimized' : plat.score >= 50 ? 'Average' : 'Critical'}
                    </div>
                </div>
            </div>

            {/* Main Progress Bar */}
            <div className="space-y-4">
                <div className={`overflow-hidden h-4 text-xs flex rounded-full shadow-inner ${darkMode ? "bg-slate-950/50" : "bg-slate-100"}`}>
                    <div
                        style={{ width: `${plat.score}%`, backgroundColor: plat.color }}
                        className={`shadow-lg flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden ${plat.shadow}`}
                    >
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg] animate-shimmer"></div>
                    </div>
                </div>
            </div>
            
            {/* Strategic Insight Box */}
            <div className={`p-6 rounded-3xl border flex flex-col gap-3 transition-all duration-500 ${plat.score < 50 
                ? (darkMode ? "bg-rose-500/5 border-rose-500/10 shadow-[inner_0_0_20px_rgba(244,63,94,0.05)]" : "bg-rose-50/30 border-rose-100") 
                : (darkMode ? "bg-slate-800/20 border-slate-800 shadow-[inner_0_0_20px_rgba(99,102,241,0.03)]" : "bg-slate-50 border-slate-100 shadow-sm")}`}>
                
                <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${plat.score < 50 ? "text-rose-500 bg-rose-500/10" : "text-indigo-500 bg-indigo-500/10"}`}>
                        <AlertTriangle size={14} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        Strategic Insight
                    </span>
                </div>
                
                <p className={`text-sm font-bold leading-relaxed tracking-tight ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    {platforms[plat.key].reason}
                </p>
            </div>

            {/* Analyze Button (Now at bottom) */}
            <div className="pt-2 border-t border-slate-800/10 dark:border-slate-100/10 flex justify-center">
                <button 
                    onClick={() => setExpandedPlatform(expandedPlatform === plat.key ? null : plat.key)}
                    className={`group/btn px-8 py-3 rounded-2xl transition-all duration-500 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.15em] ${expandedPlatform === plat.key 
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 translate-y-[-2px]' 
                        : (darkMode ? 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50')}`}
                >
                    {expandedPlatform === plat.key ? 'Collapse Report' : 'Detailed Analysis'}
                    <ChevronRight size={14} className={`transition-transform duration-500 group-hover/btn:translate-x-1 ${expandedPlatform === plat.key ? 'rotate-90' : ''}`} />
                </button>
            </div>

            {/* Parameter Breakdown Overlay */}
            {expandedPlatform === plat.key && (
                <div className={`animate-in slide-in-from-top-4 duration-700 p-8 rounded-[2.2rem] shadow-inner ${darkMode ? "bg-black/40 border border-slate-800" : "bg-slate-50 border border-slate-200"}`}>
                    <div className="flex items-center gap-3 mb-10">
                        <div className={`w-2.5 h-2.5 rounded-full ${plat.bg} shadow-[0_0_15px_rgba(0,0,0,0.3)]`}></div>
                        <h5 className={`text-[11px] font-black uppercase tracking-[0.3em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            Formula Breakdown
                        </h5>
                    </div>

                    <div className="space-y-8">
                        {Object.entries(platforms[plat.key].breakdown)
                            .filter(([param]) => platformRelevance[plat.key]?.includes(param))
                            .map(([param, points]) => (
                            <div key={param} className="space-y-3.5">
                                <div className="flex items-center justify-between px-1">
                                    <span className={`text-xs font-bold tracking-tight ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                                        {parameterLabels[param] || param}
                                    </span>
                                    <span className={`text-[11px] font-black ${points > 0 ? "text-indigo-500" : "text-slate-600 opacity-40"}`}>
                                        +{points} PTS
                                    </span>
                                </div>
                                <div className={`h-2 rounded-full overflow-hidden ${darkMode ? "bg-slate-900" : "bg-slate-200"}`}>
                                    <div 
                                        className={`h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)] ${points > 0 ? plat.bg : "bg-transparent"}`} 
                                        style={{ width: `${(points / platformData.find(p => p.key === plat.key).score) * 200}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    if (singleCard) {
        return renderPlatformCard(platformData[0], 0);
    }

    return (
        <div className={`rounded-[3.5rem] border p-12 shadow-3xl mb-12 transition-all ${darkMode ? "bg-slate-900 border-slate-800 shadow-black/80" : "bg-white border-gray-100 shadow-slate-200/50"}`}>
            <div className="space-y-16">
                {platformData.map((plat, idx) => renderPlatformCard(plat, idx))}
            </div>
            
            <div className={`mt-20 p-10 rounded-[2.5rem] border flex items-center gap-8 transition-all hover:border-indigo-500/30 ${darkMode ? "bg-indigo-500/5 border-indigo-500/10 shadow-[inner_0_0_30px_rgba(99,102,241,0.03)]" : "bg-slate-50/50 border-slate-100 shadow-sm"}`}>
                <div className={`p-4 rounded-2xl shadow-inner ${darkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-white text-indigo-600 shadow-sm"}`}>
                    <Info size={28} />
                </div>
                <div className="flex flex-col gap-2">
                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>Methodology Standard</span>
                    <p className={`text-sm font-semibold leading-relaxed italic ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                        Final scores are dynamically weighted across 8 proprietary signal groups, prioritizing platform-specific ingestion heuristics for LLMs and Answer Engines.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PlatformScoreBar;
