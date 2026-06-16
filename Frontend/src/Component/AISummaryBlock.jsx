import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const AISummaryBlock = ({ sectionName, sectionData, auditScore, url, darkMode }) => {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSummary = async () => {
            const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:2000';
            try {
                setLoading(true);
                const { data } = await axios.post(`${baseUrl}/api/ai/summarize-section`, {
                    sectionName,
                    sectionData,
                    auditScore,
                    url
                });
                setSummary(data.text);
            } catch (err) {
                console.error('Summary Error:', err);
                const serverMsg = err.response?.data?.error || 'Intelligence engine is calibrating.';
                setError(`Insight Delay: ${serverMsg}`);
            } finally {
                setLoading(false);
            }
        };

        if (sectionData && Object.keys(sectionData).length > 0) {
            fetchSummary();
        } else {
            setLoading(false);
            setError('Waiting for audit data to complete...');
        }
    }, [sectionName, url, JSON.stringify(sectionData)]);

    return (
        <div className={`mt-8 p-6 rounded-2xl border-2 transition-all ${darkMode
                ? 'bg-blue-600/5 border-blue-500/20'
                : 'bg-accentsoft border-line'
            }`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-accent text-white'}`}>
                    <Sparkles className="w-5 h-5" />
                </div>
                <h3 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-ink'}`}>
                    AI Actionable Summary
                    <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${darkMode ? 'bg-blue-500/10 text-blue-500' : 'bg-accentsoft text-accent'}`}>
                        {sectionName}
                    </span>
                </h3>
            </div>

            <div className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-inksoft'}`}>
                {loading ? (
                    <div className="flex items-center gap-2 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        Generating expert strategic analysis...
                    </div>
                ) : error ? (
                    (() => {
                        const isQuota = error.toLowerCase().includes('429') || error.toLowerCase().includes('quota') || error.toLowerCase().includes('limit');
                        if (isQuota) {
                            return (
                                <div className="space-y-2 mt-1">
                                    <p className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-amber-450' : 'text-amber-800'}`}>
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                                        AI Quota Limit Exceeded
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
                                        Your free-tier Gemini API key has exceeded its daily limit of 20 requests. Please configure Pay-As-You-Go billing in Google AI Studio to unlock unlimited access, or try again tomorrow.
                                    </p>
                                </div>
                            );
                        }
                        return <p className="italic opacity-50">{error}</p>;
                    })()
                ) : (
                    <p className="font-medium">"{summary}"</p>
                )}
            </div>

            {!loading && !error && (
                <div className="mt-4 pt-4 border-t border-blue-500/10 flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-blue-500/40' : 'text-accent'}`}>
                        Dealer Pulse Intelligence Protocol v2.5.0
                    </span>
                </div>
            )}
        </div>
    );
};

export default AISummaryBlock;
