import React, { useState } from 'react';
import { ChevronRight, Target, Shield, Gauge, Cpu, BarChart3, Activity } from 'lucide-react';

const PlatformScoreBar = ({ platforms, darkMode, platformKey = null, singleCard = false }) => {
    const [expandedPlatform, setExpandedPlatform] = useState(null);

    const fullPlatformData = [
        { 
            name: 'Gemini', 
            key: 'gemini', 
            score: platforms?.gemini?.score || 0, 
            color: '#2563eb', // Professional Indigo-Blue
            border: 'border-violet-500/20',
            bg: 'bg-violet-600',
            icon: <Target size={18} />
        },
        { 
            name: 'ChatGPT', 
            key: 'chatgpt', 
            score: platforms?.chatgpt?.score || 0, 
            color: '#7c3aed', // Professional Violet-Purple
            border: 'border-violet-500/20',
            bg: 'bg-violet-600',
            icon: <Cpu size={18} />
        },
        { 
            name: 'Perplexity', 
            key: 'perplexity', 
            score: platforms?.perplexity?.score || 0, 
            color: '#7c3aed', // Professional Violet
            border: 'border-purple-500/20',
            bg: 'bg-purple-600',
            icon: <Gauge size={18} />
        },
    ];

    const platformData = singleCard && platformKey 
        ? fullPlatformData.filter(p => p.key === platformKey)
        : fullPlatformData;

    const parameterLabels = {
        answerFirst: "Direct Answer Logic",
        llmsTxt: "Manifest Analysis",
        schema: "Structured Entity Markup",
        structuredContent: "Information Density",
        botAccess: "Crawler Accessibility",
        pageSpeed: "Technical Performance",
        markdownHeaders: "Document Hierarchy",
        citations: "Authority Signals"
    };

    const platformRelevance = {
        gemini: ['schema', 'botAccess', 'answerFirst', 'pageSpeed'],
        chatgpt: ['llmsTxt', 'markdownHeaders', 'answerFirst', 'botAccess'],
        perplexity: ['structuredContent', 'citations', 'pageSpeed']
    };

    const renderPlatformCard = (plat, idx) => (
        <div key={idx} className={`relative p-8 rounded-2xl border transition-all duration-300 flex flex-col gap-6 ${darkMode ? "bg-slate-900 border-slate-800 shadow-xl" : "bg-white border-slate-100 shadow-sm hover:shadow-md"}`}>
            
            {/* Header: Pro Identity */}
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span style={{ color: plat.color }}>{plat.icon}</span>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                            {plat.name} Analysis
                        </span>
                    </div>
                    <h5 className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{plat.name}</h5>
                </div>
                
                <div className="text-right">
                    <div className="flex items-baseline justify-end gap-1">
                        <span className={`text-4xl font-extrabold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                            {plat.score}
                        </span>
                        <span className="text-xs font-bold opacity-30">%</span>
                    </div>
                </div>
            </div>

            {/* Pro Progress Bar */}
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                <div
                    style={{ width: `${plat.score}%`, backgroundColor: plat.color }}
                    className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                />
            </div>
            
            {/* Insight Label */}
            <div className={`px-3 py-1.5 rounded-lg w-fit text-[10px] font-bold uppercase tracking-widest border transition-colors ${plat.score >= 80 ? "bg-violet-500/5 text-violet-600 border-violet-500/20" : plat.score >= 50 ? "bg-amber-500/5 text-amber-600 border-amber-500/20" : "bg-rose-500/5 text-rose-600 border-rose-500/20"}`}>
                Engine Rating: {plat.score >= 80 ? 'Optimized' : plat.score >= 50 ? 'Average' : 'Critical'}
            </div>

            {/* Strategic Summary Box */}
            <div className={`p-5 rounded-xl border-l-4 ${plat.score < 50 
                ? (darkMode ? "bg-rose-500/5 border-rose-500/40" : "bg-rose-50/50 border-rose-500/30") 
                : (darkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200")}`}>
                
                <div className="flex items-center gap-2 mb-3">
                    <Shield size={14} className={plat.score < 50 ? "text-rose-500" : "text-slate-400"} />
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                        Strategic Diagnostic
                    </span>
                </div>
                
                <p className={`text-sm font-semibold leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    {platforms[plat.key].reason}
                </p>
            </div>

            {/* Minimal Toggle */}
            <button 
                onClick={() => setExpandedPlatform(expandedPlatform === plat.key ? null : plat.key)}
                className={`flex items-center justify-between w-full p-4 rounded-xl border transition-all ${expandedPlatform === plat.key 
                    ? (darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-100 border-slate-200 text-slate-900") 
                    : (darkMode ? "bg-transparent border-slate-800 text-slate-400 hover:text-white" : "bg-transparent border-slate-100 text-slate-500 hover:text-slate-900")}`}
            >
                <span className="text-[10px] font-bold uppercase tracking-widest">Technical Breakdown</span>
                <ChevronRight size={14} className={`transition-transform duration-300 ${expandedPlatform === plat.key ? 'rotate-90' : ''}`} />
            </button>

            {/* Parameter Matrix */}
            {expandedPlatform === plat.key && (
                <div className={`p-6 rounded-xl space-y-6 animate-in slide-in-from-top-2 duration-300 ${darkMode ? "bg-slate-950/50 border border-slate-800" : "bg-white border border-slate-200 shadow-inner"}`}>
                    <div className="flex items-center gap-2 opacity-40">
                        <BarChart3 size={12} />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Signal Distribution</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {Object.entries(platforms[plat.key].breakdown)
                            .filter(([param]) => platformRelevance[plat.key]?.includes(param))
                            .map(([param, points]) => (
                            <div key={param} className="space-y-2">
                                <div className="flex items-center justify-between pointer-events-none">
                                    <span className={`text-xs font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                                        {parameterLabels[param] || param}
                                    </span>
                                    <span className={`text-[10px] font-bold ${points > 0 ? (darkMode ? "text-violet-400" : "text-violet-600") : "text-slate-500"}`}>
                                        +{points} PTS
                                    </span>
                                </div>
                                <div className={`h-1.5 rounded-full ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                    <div 
                                        className="h-full rounded-full transition-all duration-700" 
                                        style={{ width: `${(points / 40) * 100}%`, backgroundColor: plat.color }}
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
        <div className="space-y-6 mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {platformData.map((plat, idx) => renderPlatformCard(plat, idx))}
            </div>
            
            <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center gap-6 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                <div className={`p-3 rounded-xl ${darkMode ? "bg-slate-800 text-slate-400" : "bg-white text-slate-500 shadow-sm"}`}>
                    <Activity size={24} />
                </div>
                <div className="flex-1 space-y-1 text-center sm:text-left">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Methodology Standard</p>
                    <p className={`text-xs font-medium leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        AEO Readiness is calculated using weighted analysis of schema entities, technical crawl accessibility, and direct semantic extraction capabilities specific to each LLM environment.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PlatformScoreBar;
