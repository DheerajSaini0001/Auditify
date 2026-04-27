import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
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
        <div className={`mt-8 p-6 rounded-2xl border-2 transition-all ${
            darkMode 
              ? 'bg-violet-600/5 border-violet-500/20' 
              : 'bg-violet-50 border-violet-200'
        }`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-violet-600/20 text-violet-400' : 'bg-violet-600 text-white'}`}>
                    <Sparkles className="w-5 h-5" />
                </div>
                <h3 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                    AI Actionable Summary 
                    <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-violet-500/10 text-violet-500' : 'bg-violet-600/10 text-violet-600'}`}>
                        {sectionName}
                    </span>
                </h3>
            </div>

            <div className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-blue-800'}`}>
                {loading ? (
                    <div className="flex items-center gap-2 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                        Generating expert strategic analysis...
                    </div>
                ) : error ? (
                    <p className="italic opacity-50">{error}</p>
                ) : (
                    <p className="font-medium">"{summary}"</p>
                )}
            </div>

            {!loading && !error && (
                <div className="mt-4 pt-4 border-t border-violet-500/10 flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-violet-500/40' : 'text-violet-400'}`}>
                        DealerPulse Intelligence Protocol v2.5.0
                    </span>
                </div>
            )}
        </div>
    );
};

export default AISummaryBlock;
