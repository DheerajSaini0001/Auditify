import React, { useState } from 'react';
import { 
    Brain, Info, ChevronDown, ChevronUp, AlertCircle, CheckCircle, 
    MessageCircle, Database, ShieldCheck, FileText, Layout, 
    Table, Link, Activity 
} from 'lucide-react';
import AskAIButton from './AskAIButton';

const iconMap = {
    aeoSchema: Database,
    botAccess: ShieldCheck,
    markdownHeaders: Layout,
    llmsTxt: FileText,
    structuredContent: Table,
    citations: Link,
    answerFirst: MessageCircle
};

const getStatusDetail = (signal, data, isFailed) => {
    // Prioritize signal-specific reasons if provided
    if (data?.reason) return data.reason;
    if (data?.reasons && Array.isArray(data.reasons) && data.reasons.length > 0) {
        return data.reasons[0];
    }
    
    if (!isFailed) return "Your page is perfectly optimized for this Answer Engine signal.";

    switch (signal) {
        case 'aeoSchema':
            return data?.count === 0 
                ? "Warning: No JSON-LD schema found. AI engines cannot verify your entity data." 
                : `Partial: Only ${data?.count} schema types detected. FAQPage or HowTo markup is recommended.`;
        case 'botAccess':
            const blocked = Object.entries(data?.bots || {}).filter(([_, s]) => s === 'blocked').map(([b]) => b);
            return blocked.length > 0 
                ? `Blocked: ${blocked.join(', ')} are restricted in robots.txt.` 
                : "Accessibility: Bot access is allowed but indexing signals are weak.";
        case 'llmsTxt':
            return data?.exists 
                ? "Invalid: /llms.txt found but lacks standard context headers." 
                : "Missing: No /llms.txt manifest found for OpenAI context mapping.";
        case 'markdownHeaders':
            return `Unoptimized: Heading hierarchy issues detected (Score: ${data?.score}%). Proper H1->H2 flow is required.`;
        case 'structuredContent':
            return `Low Density: Only ${data?.tables || 0} tables and ${data?.lists || 0} lists found. AI agents prefer higher data density.`;
        case 'answerFirst':
            return `Timing Issue: Direct answer found in sentence ${data?.sentenceCount || 0}. AI models prefer answers in the first 1-2 sentences.`;
        case 'citations':
            return "Trust Gap: Low external citation signals. Perplexity and search engines value verifiable sources.";
        default:
            return "Signal requires optimization for better AI indexing and extraction.";
    }
};

const getWhyItMatters = (signal) => {
    switch (signal) {
        case 'aeoSchema':
            return "Schema.org markup acts as a 'Fact Sheet' for AI, allowing models like Gemini to verify your identity, products, and FAQs with 100% confidence.";
        case 'botAccess':
            return "If search crawlers or AI agents are blocked, your content will never appear in 'Direct Answer' snippets, regardless of quality.";
        case 'llmsTxt':
            return "OpenAI uses /llms.txt to quickly understand a site's structure map. This file is the primary context source for GPT-4 crawl agents.";
        case 'markdownHeaders':
            return "Markdown headers (H1-H3) are the primary way LLMs 'read' your page. A broken hierarchy causes extraction errors and loss of context.";
        case 'structuredContent':
            return "Answer engines prioritize tables and lists because they provide high-density, reliable data that is easy to summarize for users.";
        case 'answerFirst':
            return "AI models are trained to find the 'Nugget' of info immediately. Pushing the answer down increases the risk of being ignored.";
        case 'citations':
            return "Citations build authority. RAG-based search engines (like Perplexity) prioritize content that links to reputable external sources.";
        default:
            return "This signal is a key weighted parameter in establishing your AEO Mastery score and engine visibility.";
    }
};

const AEOSignalCard = ({ signal, score, data, title, description, darkMode, onInfo, url }) => {
    const [showDetails, setShowDetails] = useState(false);
    const Icon = iconMap[signal] || Database;
    
    let status = "Failed";
    let statusColor = "text-rose-500 bg-rose-500/10 border-rose-500/20";
    
    if (score >= 100) {
        status = "Passed";
        statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    } else if (score > 40 || ((signal === 'aeoSchema' || signal === 'structuredContent') && score === 0)) {
        status = score === 0 && (signal === 'aeoSchema' || signal === 'structuredContent') ? "Warning" : "Partial";
        statusColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    }

    const isFailed = score < 100 && status !== "Warning";
    const isWarning = status === "Warning" || (score < 100 && score > 40);

    const boxBg = isFailed 
        ? (darkMode ? "bg-rose-500/5 border-rose-500/20" : "bg-rose-50 border-rose-100")
        : (isWarning 
            ? (darkMode ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-100")
            : (darkMode ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50/50 border-emerald-100"));

    const boxText = isFailed ? "text-rose-600" : (isWarning ? "text-amber-600" : "text-emerald-600");

    return (
        <div className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 p-8 flex flex-col gap-6 ${darkMode ? "bg-slate-900 border-slate-800 shadow-xl" : "bg-white border-gray-100 shadow-sm shadow-slate-200 hover:shadow-md"}`}>
            
            {/* Header Area */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-105 ${darkMode ? "bg-slate-800" : "bg-slate-50 border border-slate-100 shadow-inner"}`}>
                        <Icon size={28} className={darkMode ? "text-indigo-400" : "text-indigo-600"} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h3 className={`text-xl font-black tracking-tight ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{title}</h3>
                        <div className={`w-fit px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColor}`}>
                            {status}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {score < 100 && (
                        <button 
                            onClick={() => setShowDetails(!showDetails)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${showDetails 
                                ? (darkMode ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-800 shadow-sm")
                                : (darkMode ? "bg-slate-800/50 text-slate-400 hover:text-white" : "bg-transparent text-slate-400 hover:text-indigo-600")}`}
                        >
                            {showDetails ? "Hide Detail" : "View Detail"}
                            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                    )}
                    {onInfo && (
                        <button 
                            onClick={() => onInfo(signal)}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? "bg-slate-800 text-slate-500 hover:text-indigo-400" : "bg-slate-50 text-slate-400 hover:text-indigo-600 border border-slate-100"}`}
                        >
                            <Info size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Description Section */}
            <div className="flex flex-col gap-3">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ${darkMode ? "text-white" : "text-slate-900"}`}>Description:</span>
                <p className={`text-sm leading-relaxed font-bold tracking-tight ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{description}</p>
            </div>

            {/* Status Detail Section */}
            <div className="flex flex-col gap-3">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ${darkMode ? "text-white" : "text-slate-900"}`}>Status Detail</span>
                <div className={`p-6 rounded-2xl border transition-all duration-500 ${boxBg}`}>
                    <p className={`text-sm md:text-base font-black tracking-tight ${boxText}`}>
                        {getStatusDetail(signal, data, score < 100)}
                    </p>
                </div>
            </div>

            {/* Expanded Content (Analysis & Remediation) */}
            {showDetails && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500 pt-2 border-t border-slate-800/10 dark:border-slate-100/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Current vs Target */}
                        <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                            <div className="flex flex-col gap-4">
                                <div className="space-y-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Current Status</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                        <span className={`text-xs font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                                             {signal === 'aeoSchema' ? (data?.count === 0 ? 'Zero Markup' : (data?.types?.length > 2 ? 'Multi-Type' : 'Partial Types')) :
                                              signal === 'llmsTxt' ? (data?.exists ? 'Header Issue' : 'File Missing') :
                                              signal === 'markdownHeaders' ? `Score: ${data?.score}%` :
                                              signal === 'structuredContent' ? `${data?.tables + data?.lists} Entities` :
                                              `${score}% Ready`}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Remediation Action</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className={`text-xs font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                                            {signal === 'aeoSchema' ? "Inject FAQPage Schema" : 
                                             signal === 'llmsTxt' ? "Initialize /llms.txt" :
                                             signal === 'markdownHeaders' ? "Fix Heading Hierarchy" :
                                             "Refactor Structural Logic"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Impact Stat */}
                        <div className={`p-5 rounded-2xl border flex flex-col gap-2 ${darkMode ? "bg-indigo-500/5 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"}`}>
                            <div className="flex items-center gap-2">
                                <Brain size={14} className="text-indigo-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">AEO Engine Impact</span>
                            </div>
                            <p className={`text-[11px] leading-snug font-bold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                                Failing this signal reduces AI selection probability by ~70% across premium engines.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Why It Matters / Bottom Section */}
            <div className="flex flex-col gap-3">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ${darkMode ? "text-white" : "text-slate-900"}`}>Why It Matters:</span>
                <p className={`text-sm leading-relaxed font-bold tracking-tight ${darkMode ? "text-slate-500" : "text-slate-600"}`}>
                   {getWhyItMatters(signal)}
                </p>
            </div>

            {/* Action Area */}
            <div className="pt-2 border-t border-slate-800/10 dark:border-slate-100/10">
                {!isFailed && status === "Passed" ? (
                    <div className="flex items-center gap-3 py-2">
                        <CheckCircle className="text-emerald-500" size={18} />
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Optimized & Confirmed</span>
                    </div>
                ) : (
                    <AskAIButton 
                        finding={{
                            type: 'AEO Readiness',
                            title: title,
                            details: data?.reason || description,
                            severity: score > 50 ? 'warning' : 'critical',
                            url: url
                        }}
                        darkMode={darkMode}
                    />
                )}
            </div>
        </div>
    );
};

export default AEOSignalCard;
