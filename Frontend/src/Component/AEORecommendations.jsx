import React from 'react';

const AEORecommendations = ({ recommendations, darkMode }) => {
    if (!recommendations || recommendations.length === 0) {
        return (
            <div className={`border p-8 rounded-2xl text-center shadow-lg transition-all duration-500 ${darkMode ? "bg-violet-500/5 border-violet-500/20 shadow-black/20" : "bg-violet-50 border-violet-200"}`}>
                <div className={`mb-4 inline-block p-4 rounded-full ${darkMode ? "bg-violet-500/20" : "bg-violet-100"}`}>
                    <svg className={`w-8 h-8 ${darkMode ? "text-violet-400" : "text-violet-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className={`text-xl font-bold ${darkMode ? "text-violet-400" : "text-violet-800"}`}>Perfect AI Optimization!</h3>
                <p className={`text-sm mt-1 ${darkMode ? "text-violet-500/70" : "text-violet-600"}`}>Your site is perfectly configured for all AI answer engines.</p>
            </div>
        );
    }

    const priorityColors = {
        "Critical": "bg-red-500",
        "High": "bg-orange-500",
        "Medium": "bg-violet-500",
        "Low": "bg-gray-500"
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="space-y-6">
            <h3 className={`text-2xl font-black tracking-tight ${darkMode ? "text-slate-200" : "text-gray-800"}`}>AEO Action Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec, index) => (
                    <div key={index} className={`rounded-3xl border p-5 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group border-opacity-50 ${darkMode ? "bg-slate-800/80 border-slate-700 hover:bg-slate-800" : "bg-white border-gray-100"}`}>
                        <div className={`absolute top-0 right-0 px-3 py-1 text-[9px] uppercase font-black text-white tracking-widest shadow-lg ${priorityColors[rec.priority]}`}>
                            {rec.priority}
                        </div>
                        <div className="pt-2 mb-4">
                             <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black text-white bg-opacity-80 shadow-sm ${priorityColors[rec.priority]}`}>
                                    -{rec.impact}%
                                </span>
                                <h4 className={`font-bold leading-tight ${darkMode ? "text-slate-100" : "text-gray-800"}`}>{rec.title}</h4>
                             </div>
                             <p className={`text-[10px] font-mono flex items-center gap-1 uppercase tracking-tighter ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
                                platform: <span className={`${darkMode ? "text-indigo-400" : "text-gray-600"}`}>{rec.platform}</span>
                             </p>
                        </div>
                        <p className={`text-sm leading-relaxed mb-6 min-h-[60px] ${darkMode ? "text-slate-400" : "text-gray-600"}`}>{rec.action}</p>
                        <button 
                            onClick={() => handleCopy(rec.action)}
                            className={`w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 border ${darkMode 
                                ? "bg-slate-900/50 hover:bg-indigo-500 text-slate-300 hover:text-white border-slate-700 hover:border-indigo-500" 
                                : "bg-gray-50 hover:bg-gray-800 text-gray-700 hover:text-white border-gray-100 hover:border-gray-800"}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copy Implementation Fix
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AEORecommendations;
