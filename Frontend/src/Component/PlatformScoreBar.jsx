import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Target, Gauge, Cpu, BarChart3, Activity, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const PlatformScoreBar = ({ platforms, darkMode, platformKey = null, singleCard = false }) => {
    const [expandedPlatform, setExpandedPlatform] = useState(null);

    const fullPlatformData = [
        {
            name: 'Gemini',
            key: 'gemini',
            score: platforms?.gemini?.score || 0,
            color: '#2563eb', // Professional Indigo-Blue
            border: 'border-blue-500/20',
            bg: 'bg-blue-600',
            icon: <Target size={18} />
        },
        {
            name: 'ChatGPT',
            key: 'chatgpt',
            score: platforms?.chatgpt?.score || 0,
            color: '#059669', // Professional Emerald-Green
            border: 'border-emerald-500/20',
            bg: 'bg-emerald-600',
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

    const ratingLabel = (s) => (s >= 80 ? 'Ready' : s >= 50 ? 'Almost There' : 'Needs Work');
    const ratingPill = (s) => (s >= 80
        ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
        : s >= 50
            ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
            : "text-rose-500 bg-rose-500/10 border-rose-500/20");

    const renderPlatformCard = (plat, idx) => {
        const isOpen = expandedPlatform === plat.key;
        return (
            <div key={idx} className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group ${darkMode ? "bg-gray-800 border-gray-700" : "bg-card border-line"}`}>
                <div className="p-5 space-y-4">

                    {/* Header — matches the standard title card; View Detail sits top-right */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-cardsoft"} group-hover:scale-110 transition-transform duration-300`}>
                                <span style={{ color: plat.color }}>{plat.icon}</span>
                            </div>
                            <div>
                                <h3 className={`font-semibold text-lg ${darkMode ? "text-gray-100" : "text-ink"}`}>{plat.name}</h3>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    <p className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit border ${ratingPill(plat.score)}`}>
                                        {ratingLabel(plat.score)}
                                    </p>
                                    <span className={`text-xs font-semibold ${darkMode ? "text-slate-400" : "text-muted"}`}>{plat.score}%</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setExpandedPlatform(isOpen ? null : plat.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 ${isOpen
                                ? (darkMode ? "bg-slate-700 text-white" : "bg-cardsoft text-ink")
                                : (darkMode ? "bg-slate-800/50 text-slate-400 hover:text-white" : "bg-cardsoft text-muted hover:text-ink")}`}
                        >
                            {isOpen ? 'Hide Detail' : 'View Detail'}
                            {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                    </div>

                    {/* Score bar */}
                    <div className="h-2 w-full rounded-full bg-surface-2 dark:bg-slate-800 overflow-hidden">
                        <div
                            style={{ width: `${plat.score}%`, backgroundColor: plat.color }}
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                        />
                    </div>

                    {/* Parameter Detail — failed and passed kept in separate groups */}
                    {isOpen && (() => {
                        const all = platforms[plat.key].parameters || [];
                        const failed = all.filter((p) => !p.passed);
                        const passed = all.filter((p) => p.passed);

                        const renderRow = (p) => (
                            <div
                                key={p.key}
                                className={`p-4 rounded-xl border ${p.passed
                                    ? (darkMode ? "bg-slate-900/40 border-slate-800" : "bg-card border-line")
                                    : (darkMode ? "bg-rose-500/5 border-rose-500/20" : "bg-rose-50/50 border-rose-100")}`}
                            >
                                {/* Parameter header: name + pass/fail */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        {p.passed
                                            ? <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                                            : <XCircle size={15} className="text-rose-500 flex-shrink-0" />}
                                        <span className={`text-xs font-semibold ${darkMode ? "text-slate-200" : "text-inksoft"}`}>
                                            {p.label}
                                        </span>
                                    </div>
                                    <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${p.passed
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                                        {p.passed ? 'Passed' : 'Not Passed'}
                                    </span>
                                </div>

                                {/* What this parameter wants in order to pass (always shown) */}
                                {p.requirement && (
                                    <p className={`mt-2 text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                                        <span className="font-semibold opacity-70">Wants: </span>{p.requirement}
                                    </p>
                                )}

                                {/* Cause — only when the parameter does not pass */}
                                {!p.passed && p.cause && (
                                    <div className={`mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed ${darkMode ? "text-rose-300" : "text-rose-700"}`}>
                                        <AlertCircle size={13} className="text-rose-500 flex-shrink-0 mt-0.5" />
                                        <span><span className="font-semibold">Cause: </span>{p.cause}</span>
                                    </div>
                                )}
                            </div>
                        );

                        const groupHeader = (icon, label, count, color) => (
                            <div className="flex items-center gap-2">
                                {icon}
                                <span className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${color}`}>{label}</span>
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${darkMode ? "bg-slate-800 text-slate-400" : "bg-surface-2 text-muted"}`}>{count}</span>
                            </div>
                        );

                        return (
                            <div className={`p-4 rounded-xl space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 ${darkMode ? "bg-slate-950/50 border border-slate-800" : "bg-cardsoft border border-line"}`}>
                                <div className="flex items-center gap-2 opacity-40">
                                    <BarChart3 size={12} />
                                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em]">What This AI Checks</span>
                                </div>

                                {/* Needs Attention group */}
                                {failed.length > 0 && (
                                    <div className="space-y-3">
                                        {groupHeader(<XCircle size={12} className="text-rose-500" />, 'Needs Attention', failed.length, "text-rose-500")}
                                        <div className="flex flex-col gap-3">{failed.map(renderRow)}</div>
                                    </div>
                                )}

                                {/* Passed group */}
                                {passed.length > 0 && (
                                    <div className="space-y-3">
                                        {groupHeader(<CheckCircle2 size={12} className="text-emerald-500" />, 'Passed', passed.length, "text-emerald-500")}
                                        <div className="flex flex-col gap-3">{passed.map(renderRow)}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>
        );
    };

    if (singleCard) {
        return renderPlatformCard(platformData[0], 0);
    }

    return (
        <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {platformData.map((plat, idx) => renderPlatformCard(plat, idx))}
            </div>

            <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center gap-6 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-cardsoft border-line"}`}>
                <div className={`p-3 rounded-xl ${darkMode ? "bg-slate-800 text-slate-400" : "bg-card text-muted shadow-sm"}`}>
                    <Activity size={24} />
                </div>
                <div className="flex-1 space-y-1 text-center sm:text-left">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-faint"}`}>Methodology Standard</p>
                    <p className={`text-xs font-medium leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                        AEO Readiness is calculated using weighted analysis of schema entities, technical crawl accessibility, and direct semantic extraction capabilities specific to each LLM environment.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PlatformScoreBar;
