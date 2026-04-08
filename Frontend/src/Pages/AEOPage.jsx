import React from 'react';
import AEOScoreGauge from '../Component/AEOScoreGauge';
import AEOSignalCard from '../Component/AEOSignalCard';
import AEORecommendations from '../Component/AEORecommendations';
import PlatformScoreBar from '../Component/PlatformScoreBar';

const AEOPage = ({ auditData, darkMode, onInfo }) => {
    const aeo = auditData?.aeo;

    if (!aeo) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-3xl p-12 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-gray-50 border-gray-200"}`}>
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mb-6 ${darkMode ? "border-indigo-400" : "border-indigo-600"}`}></div>
                <h3 className={`text-xl font-bold ${darkMode ? "text-slate-200" : "text-gray-700"}`}>AEO Engine Analyzing...</h3>
                <p className={`text-sm mt-2 text-center max-w-sm ${darkMode ? "text-slate-500" : "text-gray-400"}`}>Generating Answer Engine Optimization scores across Gemini, ChatGPT, and Perplexity AI.</p>
            </div>
        );
    }

    return (
        <div className={`max-w-7xl mx-auto p-4 md:p-8 space-y-12 rounded-[3rem] shadow-2xl border overflow-hidden mt-8 transition-colors duration-500 ${darkMode ? "bg-slate-900 border-slate-800 shadow-black/40" : "bg-white border-gray-100 shadow-slate-200"}`}>
            {/* Header Section */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-12 ${darkMode ? "border-slate-800" : "border-gray-50"}`}>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                         <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full tracking-widest shadow-lg ${darkMode ? "bg-indigo-500 text-white shadow-indigo-900/40" : "bg-indigo-600 text-white shadow-indigo-200"}`}>
                             Pillar 6 Extension
                         </span>
                         <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>Answer Engine <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Optimization</span></h1>
                    </div>
                    <p className={`text-lg font-medium ${darkMode ? "text-slate-400" : "text-gray-400"}`}>Measuring your site's readiness for the next generation of AI search.</p>
                </div>
                
                <div className={`rounded-3xl p-6 flex items-center gap-6 shadow-2xl transform hover:scale-105 transition-all duration-500 ${darkMode ? "bg-slate-800 text-white shadow-black/60" : "bg-gray-900 text-white"}`}>
                    <div className="text-center">
                        <div className={`text-5xl font-black leading-none ${darkMode ? "text-indigo-400" : "text-indigo-400"}`}>{aeo.overallScore}%</div>
                        <div className={`text-[10px] uppercase font-bold tracking-[0.2em] mt-1 ${darkMode ? "text-slate-500" : "text-gray-500"}`}>AEO Mastery</div>
                    </div>
                    <div className={`h-10 w-[1px] ${darkMode ? "bg-slate-700" : "bg-gray-800"}`}></div>
                     <div className={`text-xs font-medium leading-relaxed max-w-[120px] ${darkMode ? "text-slate-400" : "text-gray-400"}`}>
                        Overall platform readiness across 5 signals.
                     </div>
                </div>
            </div>

            {/* Platform Master Grid (Top Row) */}
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

            {/* Visual Overview (Middle Row) */}
            <div className={`p-12 rounded-[3.5rem] border shadow-2xl transition-all duration-500 overflow-hidden relative ${darkMode ? "bg-slate-950/80 border-slate-800 shadow-black/60" : "bg-white border-gray-100 shadow-slate-200"}`}>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                    <AEOScoreGauge score={aeo.platforms?.gemini?.score || 0} label="Google Gemini" color="#4285F4" size={180} darkMode={darkMode} />
                    <AEOScoreGauge score={aeo.platforms?.chatgpt?.score || 0} label="OpenAI ChatGPT" color="#10A37F" size={180} darkMode={darkMode} />
                    <AEOScoreGauge score={aeo.platforms?.perplexity?.score || 0} label="Perplexity AI" color="#A259FF" size={180} darkMode={darkMode} />
                </div>
            </div>

            {/* Signal Breakdown */}
            <div className="space-y-6 pt-6">
                <div className="flex items-center gap-3 mb-8">
                     <div className="h-6 w-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                     <h2 className={`text-2xl font-bold tracking-tight ${darkMode ? "text-slate-200" : "text-gray-800"}`}>Core Signal Breakdown</h2>
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
        </div>
    );
};

export default AEOPage;
