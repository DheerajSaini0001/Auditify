import React from 'react';
import AEOScoreGauge from '../Component/AEOScoreGauge';
import AEOSignalCard from '../Component/AEOSignalCard';
import AEORecommendations from '../Component/AEORecommendations';
import PlatformScoreBar from '../Component/PlatformScoreBar';
import LivePreview from '../Component/LivePreview';
import { useAuth } from '../context/AuthContext';
import { Lock, FileText, MessageCircle, Layout, ShieldCheck, Database, Table, Link, Gauge, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { savePostAuthIntent } from '../utils/intentStore';
import { API_URL } from '../config';

const signalMetadata = [
    {
        key: 'llmsTxt',
        name: 'Manifest Analysis',
        displayName: 'Manifest Analysis (/llms.txt)',
        description: 'Presence of /llms.txt manifest file used for OpenAI context mapping.',
        icon: FileText,
        color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
        key: 'answerFirst',
        name: 'Direct Answer Logic',
        displayName: 'Direct Answer Logic',
        description: 'Evaluation of concise, immediate answers in the first 200 words.',
        icon: MessageCircle,
        color: 'text-blue-500 bg-blue-500/10'
    },
    {
        key: 'markdownHeaders',
        name: 'Document Hierarchy',
        displayName: 'Document Hierarchy (Markdown)',
        description: 'Quality of H1-H3 hierarchy for clean LLM information extraction.',
        icon: Layout,
        color: 'text-purple-500 bg-purple-500/10'
    },
    {
        key: 'botAccess',
        name: 'Crawler Accessibility',
        displayName: 'Crawler Accessibility',
        description: 'Verification that search crawlers and AI bots are not blocked in robots.txt.',
        icon: ShieldCheck,
        color: 'text-rose-500 bg-rose-500/10'
    },
    {
        key: 'schema',
        name: 'Structured Entity Markup',
        displayName: 'Structured Entity Markup (JSON-LD)',
        description: 'Deep evaluation of Schema.org markup prioritized by Gemini (FAQ/Product).',
        icon: Database,
        color: 'text-amber-500 bg-amber-500/10'
    },
    {
        key: 'structuredContent',
        name: 'Data Table Density',
        displayName: 'Data Table Density',
        description: 'Heuristic evaluation of tables and data blocks preferred by RAG search engines.',
        icon: Table,
        color: 'text-teal-500 bg-teal-500/10'
    },
    {
        key: 'citations',
        name: 'Citations & Sources',
        displayName: 'Citations & Sources',
        description: 'Verification of external links and citation markers for source attribution.',
        icon: Link,
        color: 'text-pink-500 bg-pink-500/10'
    },
    {
        key: 'semanticTags',
        name: 'Semantic Tagging',
        displayName: 'Semantic Tagging (HTML5)',
        description: 'Analysis of native elements like main, section, nav, and article tags.',
        icon: Layout,
        color: 'text-cyan-500 bg-cyan-500/10'
    }
];

const SignalSkeleton = ({ darkMode, title }) => (
    <div className={`relative overflow-hidden rounded-[2rem] border p-8 flex flex-col gap-6 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-gray-50 border-gray-200"}`}>
        <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}></div>
            <div className="flex flex-col gap-2">
                <div className={`h-6 w-48 rounded animate-pulse ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}></div>
                <div className={`h-4 w-16 rounded-full animate-pulse ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}></div>
            </div>
        </div>
        <div className={`h-24 w-full rounded-2xl animate-pulse ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}></div>
    </div>
);

const AEOPage = ({ auditData, darkMode, onInfo, hideScreenshot = false }) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const auditId = auditData?._id;
    const intendedPath = auditId ? `/report/${auditId}` : null;

    const handleLogin = () => {
      if (auditId) {
        savePostAuthIntent(auditId, `/report/${auditId}`);
      }
      navigate("/login", { state: { from: intendedPath } });
    };
    
    const [streamedAeo, setStreamedAeo] = React.useState(null);
    const [streamStatus, setStreamStatus] = React.useState("Initializing AEO Engine...");
    const [isStreaming, setIsStreaming] = React.useState(false);
    const baseUrl = API_URL;
    
    React.useEffect(() => {
        if (!auditData?.aeo && auditData?.url && !isStreaming && !streamedAeo) {
            setIsStreaming(true);
            let active = true;
            
            const startStream = async () => {
                try {
                    const response = await fetch(`${baseUrl}/api/aeo/stream`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: auditData.url, device: auditData.device || "desktop", reportId: auditData._id })
                    });
                    
                    if (!response.body) return;
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    
                    let signals = {};
                    setStreamedAeo({ signals });

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done || !active) break;
                        
                        const chunkStr = decoder.decode(value);
                        const lines = chunkStr.split('\n');
                        
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const dataStr = line.replace('data: ', '').trim();
                                if (!dataStr) continue;
                                try {
                                    const { type, data, error } = JSON.parse(dataStr);
                                    if (type === 'error') {
                                        setStreamStatus("Error: " + error);
                                        break;
                                    } else if (type === 'status') {
                                        setStreamStatus(data.message);
                                    } else if (type === 'signal') {
                                        signals = { ...signals, [data.name]: data.data };
                                        setStreamedAeo(prev => ({ ...prev, signals }));
                                    } else if (type === 'complete') {
                                        setStreamedAeo(data);
                                        setIsStreaming(false);
                                    }
                                } catch (e) {
                                    console.error("Error parsing stream:", e);
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error("Stream error", e);
                    setStreamStatus("Failed to load AEO data.");
                    setIsStreaming(false);
                }
            };
            startStream();
            return () => { active = false; };
        }
    }, [auditData, isStreaming, streamedAeo, baseUrl]);

    const aeo = auditData?.aeo || streamedAeo;
    const isComplete = aeo && aeo.overallScore !== undefined;

    const completedSignals = Object.keys(aeo?.signals || {}).filter(k => k !== 'pageSpeed');
    const completedCount = completedSignals.length;
    const progressPercent = Math.round((completedCount / 8) * 100);

    if (!isComplete) {
        return (
            <div className="max-w-7xl mx-auto space-y-12 mt-12 transition-colors duration-500 pb-20">
                <div className={`flex flex-col xl:flex-row gap-16 items-start ${hideScreenshot ? "justify-center" : "py-4"}`}>
                    {!hideScreenshot && (
                        <div className="w-full xl:w-[42%] flex items-center justify-center sticky top-24">
                            <div className="w-full relative">
                                <LivePreview data={auditData} variant="plain" />
                            </div>
                        </div>
                    )}
                    <div className={`w-full ${hideScreenshot ? "max-w-3xl" : "xl:w-[58%]"} flex flex-col gap-8`}>
                        {/* Status Card Header */}
                        <div className={`p-8 rounded-[2rem] border transition-all duration-300 ${darkMode ? "bg-slate-900 border-slate-800 shadow-xl" : "bg-white border-slate-100 shadow-sm"}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="text-indigo-500 animate-pulse" size={18} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-slate-400"}`}>AEO Engine</span>
                                    </div>
                                    <h3 className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>Live Auditing Parameters...</h3>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs fontsemibold ${darkMode ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-indigo-50 border-indigo-100 text-indigo-600"}`}>
                                    <Loader2 className="animate-spin" size={14} />
                                    <span>Evaluating {completedCount} / 8 Signals</span>
                                </div>
                            </div>

                            {/* Overall Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs fontsemibold">
                                    <span className={darkMode ? "text-slate-400" : "text-slate-500"}>Audit Completion</span>
                                    <span className={darkMode ? "text-indigo-400" : "text-indigo-600"}>{progressPercent}%</span>
                                </div>
                                <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                                    <div
                                        style={{ width: `${progressPercent}%` }}
                                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Parameter List Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {signalMetadata.map((signal) => {
                                const isDone = aeo?.signals?.[signal.key] !== undefined;
                                const isCurrent = !isDone && completedCount === signalMetadata.findIndex(s => s.key === signal.key);
                                const Icon = signal.icon;
                                const score = aeo?.signals?.[signal.key]?.score;

                                return (
                                    <div
                                        key={signal.key}
                                        className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 ${
                                            isDone
                                                ? (darkMode ? "bg-slate-900/40 border-emerald-500/20 shadow-md" : "bg-emerald-50/20 border-emerald-100 shadow-sm")
                                                : isCurrent
                                                    ? (darkMode ? "bg-slate-900 border-indigo-500/30 shadow-lg scale-[1.02] ring-1 ring-indigo-500/20" : "bg-indigo-50/30 border-indigo-200 shadow-md scale-[1.02] ring-1 ring-indigo-500/10")
                                                    : (darkMode ? "bg-slate-900/20 border-slate-850 opacity-60" : "bg-gray-50/50 border-gray-150 opacity-60")
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl flex items-center justify-center ${signal.color} shrink-0 ${isCurrent ? "animate-pulse" : ""}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className={`text-sm font-black tracking-tight ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                                                    {signal.displayName}
                                                </h4>
                                                <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                                    {signal.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status Footer inside card */}
                                        <div className="flex items-center justify-end border-t border-slate-800/10 dark:border-slate-100/10 pt-3">
                                            {isDone ? (
                                                <div className="flex items-center gap-1.5 text-emerald-500 text-xs fontsemibold uppercase tracking-wider">
                                                    <CheckCircle2 size={14} />
                                                    <span>Completed ({score}%)</span>
                                                </div>
                                            ) : isCurrent ? (
                                                <div className="flex items-center gap-1.5 text-indigo-500 text-xs fontsemibold uppercase tracking-wider animate-pulse">
                                                    <Loader2 className="animate-spin" size={14} />
                                                    <span>Auditing...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-500 text-xs fontsemibold uppercase tracking-wider">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                    <span>Queued...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-24 mt-12 transition-colors duration-500">
          
                 {/* Visual Overview (Top Row) */}
            <div className={`flex flex-col xl:flex-row items-center ${hideScreenshot ? "justify-center" : "gap-16 py-4"}`}>
                {/* Left Column: LivePreview */}
                {!hideScreenshot && (
                    <div className="w-full xl:w-[45%] flex items-center justify-center">
                        <div className="w-full relative">
                            <LivePreview data={auditData} variant="plain" />
                        </div>
                    </div>
                )}

                {/* Right Column: AEO Score Section */}
                <div className={`w-full ${hideScreenshot ? "max-w-3xl" : "xl:w-[55%]"} flex flex-col items-center justify-center`}>
                    <h2 className={`text-[1.35rem] fontsemibold mb-10 tracking-tight ${darkMode ? "text-slate-100" : "text-gray-900"}`}>
                        AI Engine Visibility
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl">
                        {isComplete ? (
                            <>
                                <AEOScoreGauge score={aeo.platforms?.gemini?.score || 0} title="GOOGLE" subtitle="GEMINI" color="#4285F4" size={160} darkMode={darkMode} />
                                <AEOScoreGauge score={aeo.platforms?.chatgpt?.score || 0} title="OPENAI" subtitle="CHATGPT" color="#10A37F" size={160} darkMode={darkMode} />
                                <AEOScoreGauge score={aeo.platforms?.perplexity?.score || 0} title="PERPLEXITY" subtitle="AI" color="#A259FF" size={160} darkMode={darkMode} />
                            </>
                        ) : (
                            <div className="col-span-3 flex flex-col items-center justify-center py-12">
                                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mb-6 ${darkMode ? "border-indigo-400" : "border-indigo-600"}`}></div>
                                <h3 className={`text-xl fontsemibold ${darkMode ? "text-slate-200" : "text-gray-700"}`}>{streamStatus}</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div> 
            {/* Header Section (Middle Row) */}
            <header className={`flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-transparent`}>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      
                        <h1 className={`text-4xl md:text-[2.75rem] font-black tracking-tight ${darkMode ? "text-white" : "text-gray-900"} leading-none`}>
                            Answer Engine <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Optimization</span>
                        </h1>
                    </div>
                    <p className="text-[1.1rem] font-medium text-slate-400">Measuring your site's readiness for the next generation of AI search.</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-[3.5rem] font-black leading-none text-blue-600 tracking-tighter">{isComplete ? `${aeo.overallScore}%` : '...'}</div>
                        <div className="text-[10px] uppercase fontsemibold tracking-[0.2em] mt-1 text-slate-600">AEO Mastery</div>
                    </div>
                    <div className="h-16 w-[1px] bg-slate-800"></div>
                    <div className="text-xs font-medium leading-relaxed max-w-[120px] text-slate-500">
                        Overall platform readiness across 5 signals.
                    </div>
                </div>
            </header>

            {/* Platform Master Grid (Bottom Row) */}
            {isComplete && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {['gemini', 'chatgpt', 'perplexity'].map((platform) => (
                        <PlatformScoreBar
                            key={platform}
                            platformKey={platform}
                            platforms={aeo.platforms}
                            darkMode={darkMode}
                            singleCard={true}
                        />
                    ))}
                </div>
            )}

     

            {/* Gated Sections */}
            {!isAuthenticated ? (
                <div className={`relative overflow-hidden rounded-[3.5rem] border p-12 text-center flex flex-col items-center justify-center mt-12 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
                    <div className="absolute inset-0 filter blur-[15px] opacity-20 pointer-events-none flex flex-col gap-4 p-8">
                        <div className="h-20 bg-slate-400 rounded-xl w-full"></div>
                        <div className="h-40 bg-slate-400 rounded-xl w-full"></div>
                    </div>
                    <div className="relative z-10 flex flex-col items-center max-w-md mx-auto py-12">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl ${darkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"}`}>
                            <Lock className="w-10 h-10" />
                        </div>
                        <h3 className={`text-2xl font-black tracking-tight mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Login to unlock full AEO insights</h3>
                        <p className={`text-base mb-8 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                            Get deep dive analysis into your Core Signal Breakdown and a personalized Action Plan for generative AI search.
                        </p>
                        <button onClick={handleLogin} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white fontsemibold rounded-full transition-colors shadow-lg shadow-indigo-500/30">
                            Login to unlock full AEO insights
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Signal Breakdown */}
                    <div className="space-y-6 pt-6">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-6 w-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                            <h2 className={`text-2xl fontsemibold tracking-tight ${darkMode ? "text-slate-200" : "text-gray-800"}`}>Core Signal Breakdown</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                            {aeo.signals?.schema ? (
                                <AEOSignalCard
                                    signal="aeoSchema"
                                    score={aeo.signals.schema.score}
                                    data={aeo.signals.schema}
                                    title="FAQ & HowTo Schema"
                                    description="Deep evaluation of Schema.org markup prioritized by Gemini (FAQPage/HowTo)."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="FAQ & HowTo Schema" />}
                            
                            {aeo.signals?.botAccess ? (
                                <AEOSignalCard
                                    signal="botAccess"
                                    score={aeo.signals.botAccess.score}
                                    data={aeo.signals.botAccess}
                                    title="Search Index Status"
                                    description="Visibility status for Google-Extended and Perplexity crawlers (Index/Noindex)."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="Search Index Status" />}
                            
                            {aeo.signals?.markdownHeaders ? (
                                <AEOSignalCard
                                    signal="markdownHeaders"
                                    score={aeo.signals.markdownHeaders.score}
                                    data={aeo.signals.markdownHeaders}
                                    title="Markdown Structure"
                                    description="Quality of H1-H3 hierarchy for clean LLM extraction (ChatGPT Priority)."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="Markdown Structure" />}
                            
                            {aeo.signals?.llmsTxt ? (
                                <AEOSignalCard
                                    signal="llmsTxt"
                                    score={aeo.signals.llmsTxt.score}
                                    data={aeo.signals.llmsTxt}
                                    title="llms.txt Standard"
                                    description="Presence of the /llms.txt manifest file used for OpenAI context mapping."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="llms.txt Standard" />}
                            
                            {aeo.signals?.structuredContent ? (
                                <AEOSignalCard
                                    signal="structuredContent"
                                    score={aeo.signals.structuredContent.score}
                                    data={aeo.signals.structuredContent}
                                    title="Data Table Density"
                                    description="Heuristic evaluation of tables and data blocks for RAG-based search engines."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="Data Table Density" />}
                            
                            {aeo.signals?.citations ? (
                                <AEOSignalCard
                                    signal="citations"
                                    score={aeo.signals.citations.score}
                                    data={aeo.signals.citations}
                                    title="Citations & Sources"
                                    description="Verification of external links and citation markers (Source Attribution)."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="Citations & Sources" />}

                            {aeo.signals?.semanticTags ? (
                                <AEOSignalCard
                                    signal="semanticTags"
                                    score={aeo.signals.semanticTags.score}
                                    data={aeo.signals.semanticTags}
                                    title="Semantic Tagging"
                                    description="Analysis of native HTML5 semantic tags like main, section, nav, and article."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="Semantic Tagging" />}
                        </div>
                    </div>

                    {/* Actionable Recommendations */}
                    {isComplete && (
                        <div className={`pt-12 border-t ${darkMode ? "border-slate-800" : "border-gray-50"}`}>
                            <AEORecommendations recommendations={aeo.recommendations} darkMode={darkMode} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AEOPage;
