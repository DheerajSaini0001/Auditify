import React, { useState } from 'react';
import { formatMarkdown } from '../utils/formatMarkdown.js';
import './aiAssistant.css';
import { Sparkles, X } from 'lucide-react';

const AskAIButton = ({ finding, auditScore, darkMode, meta }) => {
  const [aiExplanation, setAiExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);

  const handleAskAI = async () => {
    setIsLoading(true);
    setIsOpen(true);
    setAiExplanation('');
    setError(null);

    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:2000';

    try {
      const response = await fetch(`${baseUrl}/api/ai/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingType: finding.type || 'Audit Metric',
          findingTitle: finding.title || 'Unknown Finding',
          findingDetails: finding.details || '',
          findingMeta: meta || null,
          severity: finding.severity || 'info',
          pageUrl: finding.url || window.location.href,
          auditScore: auditScore || 0
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Connection failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value);
        const lines = chunkStr.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;
            try {
              const { text } = JSON.parse(dataStr);
              setAiExplanation(prev => prev + text);
            } catch (e) { }
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Error communicating with AI service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 w-full">
      {!isOpen && (
        <button
          onClick={handleAskAI}
          className={`ask-ai-btn flex items-center gap-2 px-4 py-2 ${darkMode ? 'dark-ai-btn' : ''}`}
          disabled={isLoading}
        >
          <Sparkles className="w-4 h-4" />
          {isLoading ? 'AI Analyzing...' : 'Ask AI ✨'}
        </button>
      )}

      {isOpen && (
        <div className={`ai-explanation-panel ${darkMode ? 'dark-ai-panel' : ''}`}>
          <div className="ai-explanation-header">
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4"/> AI Assistant Explanation</span>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-75 transition-opacity">
               <X className="w-4 h-4" />
            </button>
          </div>
          <div className="ai-explanation-content text-left">
            {error && <div className="text-red-500 font-medium mb-3 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}
            {isLoading && !aiExplanation && <div className="ai-skeleton">Analyzing issue and generating fixes...</div>}
            
            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(aiExplanation) }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AskAIButton;
