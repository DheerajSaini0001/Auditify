import React from 'react';
import AEOScoreGauge from '../Component/AEOScoreGauge';
import AEOSignalCard from '../Component/AEOSignalCard';
import AEORecommendations from '../Component/AEORecommendations';
import PlatformScoreBar from '../Component/PlatformScoreBar';
import LivePreview from '../Component/LivePreview';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';

const AEOPage = ({ auditData, darkMode, onInfo }) => {
    const aeo = auditData?.aeo;
    const { isAuthenticated } = useAuth();

    if (!aeo) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-3xl p-12 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-gray-50 border-gray-200"}`}>
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mb-6 ${darkMode ? "border-indigo-400" : "border-indigo-600"}`}></div>
                <h3 className={`text-xl fontsemibold ${darkMode ? "text-slate-200" : "text-gray-700"}`}>AEO Engine Analyzing...</h3>
                <p className={`text-sm mt-2 text-center max-w-sm ${darkMode ? "text-slate-500" : "text-gray-400"}`}>Generating Answer Engine Optimization scores across Gemini, ChatGPT, and Perplexity AI.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-24 mt-12 transition-colors duration-500">
            {/* Visual Overview (Top Row) */}
            <div className="flex flex-col xl:flex-row items-center gap-16 py-4">
                {/* Left Column: LivePreview */}
                <div className="w-full xl:w-[45%] flex items-center justify-center">
                    <div className="w-full relative">
                        <LivePreview data={auditData} variant="plain" />
                    </div>
                </div>

                {/* Right Column: AEO Score Section */}
                <div className="w-full xl:w-[55%] flex flex-col items-center justify-center">
                    <h2 className={`text-[1.35rem] fontsemibold mb-10 tracking-tight ${darkMode ? "text-slate-100" : "text-gray-900"}`}>
                        AI Engine Visibility
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl">
                        <AEOScoreGauge score={aeo.platforms?.gemini?.score || 0} title="GOOGLE" subtitle="GEMINI" color="#4285F4" size={160} darkMode={darkMode} />
                        <AEOScoreGauge score={aeo.platforms?.chatgpt?.score || 0} title="OPENAI" subtitle="CHATGPT" color="#10A37F" size={160} darkMode={darkMode} />
                        <AEOScoreGauge score={aeo.platforms?.perplexity?.score || 0} title="PERPLEXITY" subtitle="AI" color="#A259FF" size={160} darkMode={darkMode} />
                    </div>
                </div>
            </div>

            {/* Header Section (Middle Row) */}
            <header className={`flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-transparent`}>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="text-[11px] uppercase fontsemibold px-3 py-1 rounded-full tracking-widest bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                            PILLAR 6 EXTENSION
                        </span>
                        <h1 className="text-4xl md:text-[2.75rem] font-black tracking-tight text-white leading-none">
                            Answer Engine <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Optimization</span>
                        </h1>
                    </div>
                    <p className="text-[1.1rem] font-medium text-slate-400">Measuring your site's readiness for the next generation of AI search.</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-[3.5rem] font-black leading-none text-blue-600 tracking-tighter">{aeo.overallScore}%</div>
                        <div className="text-[10px] uppercase fontsemibold tracking-[0.2em] mt-1 text-slate-600">AEO Mastery</div>
                    </div>
                    <div className="h-16 w-[1px] bg-slate-800"></div>
                    <div className="text-xs font-medium leading-relaxed max-w-[120px] text-slate-500">
                        Overall platform readiness across 5 signals.
                    </div>
                </div>
            </header>

            {/* Platform Master Grid (Bottom Row) */}
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
                        <button onClick={() => window.location.href = '/register'} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white fontsemibold rounded-full transition-colors shadow-lg shadow-indigo-500/30">
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
                            <AEOSignalCard
                                signal="aeoSchema"
                                score={aeo.signals?.schema?.score}
                                data={aeo.signals?.schema}
                                title="FAQ & HowTo Schema"
                                description="Deep evaluation of Schema.org markup prioritized by Gemini (FAQPage/HowTo)."
                                darkMode={darkMode}
                                onInfo={onInfo}
                                url={auditData.url}
                            />
                            <AEOSignalCard
                                signal="botAccess"
                                score={aeo.signals?.botAccess?.score}
                                data={aeo.signals?.botAccess}
                                title="Search Index Status"
                                description="Visibility status for Google-Extended and Perplexity crawlers (Index/Noindex)."
                                darkMode={darkMode}
                                onInfo={onInfo}
                                url={auditData.url}
                            />
                            <AEOSignalCard
                                signal="markdownHeaders"
                                score={aeo.signals?.markdownHeaders?.score}
                                data={aeo.signals?.markdownHeaders}
                                title="Markdown Structure"
                                description="Quality of H1-H3 hierarchy for clean LLM extraction (ChatGPT Priority)."
                                darkMode={darkMode}
                                onInfo={onInfo}
                                url={auditData.url}
                            />
                            <AEOSignalCard
                                signal="llmsTxt"
                                score={aeo.signals?.llmsTxt?.score}
                                data={aeo.signals?.llmsTxt}
                                title="llms.txt Standard"
                                description="Presence of the /llms.txt manifest file used for OpenAI context mapping."
                                darkMode={darkMode}
                                onInfo={onInfo}
                                url={auditData.url}
                            />
                            <AEOSignalCard
                                signal="structuredContent"
                                score={aeo.signals?.structuredContent?.score}
                                data={aeo.signals?.structuredContent}
                                title="Data Table Density"
                                description="Heuristic evaluation of tables and data blocks for RAG-based search engines."
                                darkMode={darkMode}
                                onInfo={onInfo}
                                url={auditData.url}
                            />
                            <AEOSignalCard
                                signal="citations"
                                score={aeo.signals?.citations?.score}
                                data={aeo.signals?.citations}
                                title="Citations & Sources"
                                description="Verification of external links and citation markers (Source Attribution)."
                                darkMode={darkMode}
                                onInfo={onInfo}
                                url={auditData.url}
                            />
                        </div>
                    </div>

                    {/* Actionable Recommendations */}
                    <div className={`pt-12 border-t ${darkMode ? "border-slate-800" : "border-gray-50"}`}>
                        <AEORecommendations recommendations={aeo.recommendations} darkMode={darkMode} />
                    </div>
                </>
            )}
        </div>
    );
};

export default AEOPage;
