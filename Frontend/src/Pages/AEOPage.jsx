import React from 'react';
import AEOScoreGauge from '../Component/AEOScoreGauge';
import AEOSignalCard from '../Component/AEOSignalCard';
import AEORecommendations from '../Component/AEORecommendations';
import PlatformScoreBar from '../Component/PlatformScoreBar';
import LivePreview from '../Component/LivePreview';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { savePostAuthIntent } from '../utils/intentStore';

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
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
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

    if (!aeo || (!isComplete && Object.keys(aeo?.signals || {}).length === 0)) {
        return (
            <div className="max-w-7xl mx-auto space-y-24 mt-12 transition-colors duration-500">
                <div className={`flex flex-col xl:flex-row items-center ${hideScreenshot ? "justify-center" : "gap-16 py-4"}`}>
                    {!hideScreenshot && (
                        <div className="w-full xl:w-[45%] flex items-center justify-center">
                            <div className="w-full relative">
                                <LivePreview data={auditData} variant="plain" />
                            </div>
                        </div>
                    )}
                    <div className={`w-full ${hideScreenshot ? "max-w-3xl" : "xl:w-[55%]"} flex flex-col items-center justify-center`}>
                        <div className={`flex flex-col items-center justify-center w-full min-h-[400px] border border-dashed rounded-3xl p-12 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-gray-50 border-gray-200"}`}>
                            {auditData?.aioReadiness?.Percentage !== undefined && (
                                <div className="mb-8 flex flex-col items-center">
                                    <div className="text-[3.5rem] font-black text-emerald-500 leading-none tracking-tighter mb-2">
                                        {auditData.aioReadiness.Percentage}%
                                    </div>
                                    <div className="text-[10px] uppercase fontsemibold tracking-widest text-slate-500 mb-6">
                                        Initial AIO Score
                                    </div>
                                </div>
                            )}
                            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mb-6 ${darkMode ? "border-indigo-400" : "border-indigo-600"}`}></div>
                            <h3 className={`text-xl fontsemibold ${darkMode ? "text-slate-200" : "text-gray-700"}`}>AEO Engine Analyzing...</h3>
                            <p className={`text-sm mt-2 text-center max-w-sm ${darkMode ? "text-slate-500" : "text-gray-400"}`}>{streamStatus || "Generating Answer Engine Optimization scores across Gemini, ChatGPT, and Perplexity AI."}</p>
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
                                    title="Trust Signals"
                                    description="Citations & transparency — cited sources/references, policy pages (privacy/terms/contact/about), transparent contact & authorship, and trust basics (HTTPS, disclosures, dates)."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="Citations & Sources" />}

                            {aeo.signals?.indexCoverage ? (
                                <AEOSignalCard
                                    signal="indexCoverage"
                                    score={aeo.signals.indexCoverage.score}
                                    data={aeo.signals.indexCoverage}
                                    title="Index Coverage"
                                    description="Estimated share of your sitemap URLs that are indexable (HTTP 200, no noindex, self-canonical) — index eligibility for Google & AI engines."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="Index Coverage" />}

                            {aeo.signals?.entityRecognition ? (
                                <AEOSignalCard
                                    signal="entityRecognition"
                                    score={aeo.signals.entityRecognition.score}
                                    data={aeo.signals.entityRecognition}
                                    title="Entity Recognition"
                                    description="Organization/LocalBusiness schema + Knowledge Graph presence — how confidently search & AI engines can identify this business as an entity."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="Entity Recognition" />}

                            {aeo.signals?.brandEntityStrength ? (
                                <AEOSignalCard
                                    signal="brandEntityStrength"
                                    score={aeo.signals.brandEntityStrength.score}
                                    data={aeo.signals.brandEntityStrength}
                                    title="Brand Entity Strength"
                                    description="How authoritative & established your brand is as an entity — sameAs breadth, Wikipedia/Knowledge Graph presence, review volume, and brand completeness."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="Brand Entity Strength" />}

                            {aeo.signals?.citationConsistency ? (
                                <AEOSignalCard
                                    signal="citationConsistency"
                                    score={aeo.signals.citationConsistency.score}
                                    data={aeo.signals.citationConsistency}
                                    title="Citation Consistency"
                                    description="NAP (Name/Address/Phone) & brand consistency — whether your identity details agree across schema, tel: links, and brand tags on the page."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="Citation Consistency" />}

                            {aeo.signals?.topicalAuthority ? (
                                <AEOSignalCard
                                    signal="topicalAuthority"
                                    score={aeo.signals.topicalAuthority.score}
                                    data={aeo.signals.topicalAuthority}
                                    title="Topical Authority"
                                    description="Industry & local content depth — content depth, subtopic headings, internal topic-cluster links, automotive topic coverage, and local-authority signals."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="Topical Authority" />}

                            {aeo.signals?.experienceSignals ? (
                                <AEOSignalCard
                                    signal="experienceSignals"
                                    score={aeo.signals.experienceSignals.score}
                                    data={aeo.signals.experienceSignals}
                                    title="Experience Signals"
                                    description="First-hand experience (E-E-A-T) — original media, genuine customer testimonials, an authentic operator voice, and real staff presence."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="Experience Signals" />}

                            {aeo.signals?.expertiseSignals ? (
                                <AEOSignalCard
                                    signal="expertiseSignals"
                                    score={aeo.signals.expertiseSignals.score}
                                    data={aeo.signals.expertiseSignals}
                                    title="Expertise Signals"
                                    description="Credentials (E-E-A-T) — certifications & accreditations, awards/recognition, years in business, and credentialed author bylines."
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="Expertise Signals" />}

                            {aeo.signals?.authoritySignals ? (
                                <AEOSignalCard
                                    signal="authoritySignals"
                                    score={aeo.signals.authoritySignals.score}
                                    data={aeo.signals.authoritySignals}
                                    title="Authority Signals"
                                    description="Mentions & authority (E-E-A-T) — press/'as seen in' mentions, links to authoritative sources, third-party trust badges, and social proof. (On-page proxies; real backlinks need a paid SEO API.)"
                                    darkMode={darkMode}
                                    onInfo={onInfo}
                                    url={auditData.url}
                                />
                            ) : <SignalSkeleton darkMode={darkMode} title="Authority Signals" />}
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
