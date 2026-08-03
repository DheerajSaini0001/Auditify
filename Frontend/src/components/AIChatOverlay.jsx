import React, { useState, useEffect, useRef, useContext } from 'react';
import { useData } from '../context/DataContext';
import { ThemeContext } from '../context/ThemeContext';
import { Sparkles, X, Send, Bot, User, Loader2, Target, AlertTriangle, Lightbulb, RefreshCw, HelpCircle, Layers, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMarkdown } from '../utils/formatMarkdown.js';
import axios from 'axios';
import './aiChatOverlay.css';

export default function AIChatOverlay() {
  const { isAiChatOpen, setIsAiChatOpen, aiChatContext, setAiChatContext, data } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === 'dark';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Strategic Summary Sidebar States
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const messagesEndRef = useRef(null);

  // Robust URL helper to avoid duplicate /api/api configurations
  const getApiUrl = (endpoint) => {
    const base = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:2000';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    if (cleanBase.endsWith('/api') && endpoint.startsWith('/api/')) {
      return `${cleanBase}${endpoint.substring(4)}`;
    }
    return `${cleanBase}${endpoint}`;
  };

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAiChatOpen) {
      scrollToBottom();
    }
  }, [messages, chatLoading, isAiChatOpen]);

  // Fetch summary and trigger welcome message when overlay opens
  useEffect(() => {
    if (isAiChatOpen && aiChatContext) {
      // 1. Reset states
      setMessages([]);
      setSummary(null);
      setSummaryError(null);

      // 2. Fetch Strategic Summary (Strength, Bottleneck, Action)
      fetchStrategicSummary();

      // 3. Trigger context-aware welcome message
      initializeWelcomeMessage();
    }
  }, [isAiChatOpen, aiChatContext?.sectionName]);

  const fetchStrategicSummary = async () => {
    if (!aiChatContext) return;
    try {
      setSummaryLoading(true);
      setSummaryError(null);

      const { sectionName, sectionData, auditScore, url } = aiChatContext;
      const apiUrl = getApiUrl('/api/ai/summarize-section');

      const response = await axios.post(apiUrl, {
        sectionName,
        sectionData,
        auditScore,
        url
      });
      setSummary(response.data);
    } catch (err) {
      console.error('[AI Strategic Summary Error]:', err);
      const msg = err.response?.data?.error || 'Intelligence engine is currently busy.';
      setSummaryError(`Synthesis Delay: ${msg}`);
    } finally {
      setSummaryLoading(false);
    }
  };

  const initializeWelcomeMessage = async () => {
    if (!aiChatContext) return;
    try {
      setChatLoading(true);
      const { sectionName, sectionData, auditScore } = aiChatContext;
      const apiUrl = getApiUrl('/api/ai/chat');

      // Send INIT_CHAT special request to retrieve a highly contextual, personalized welcome message
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'INIT_CHAT',
          auditData: data, // Complete report context
          sectionName,
          sectionData, // Module specific context
          auditScore,
          history: []
        })
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve intelligence greeting');
      }

      const result = await response.json();
      setMessages([{ role: 'bot', text: result.text }]);
    } catch (err) {
      console.error('[AI Welcomer Error]:', err);
      setMessages([
        {
          role: 'bot',
          text: `👋 Hi! I am your Site Audit AI Intelligence Assistant.\n\nI have successfully loaded your **${aiChatContext.sectionName}** report (Score: **${aiChatContext.auditScore || 'N/A'}/100**).\n\nAsk me anything about your current audit findings! What issue would you like to investigate or fix first?`
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSend = async (textToSend) => {
    const activeText = textToSend || input;
    if (!activeText.trim() || chatLoading) return;

    if (!textToSend) setInput('');

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', text: activeText }]);
    setChatLoading(true);

    try {
      const { sectionName, sectionData, auditScore } = aiChatContext;
      const apiUrl = getApiUrl('/api/ai/chat');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: activeText,
          auditData: data,
          sectionName,
          sectionData,
          auditScore,
          history: messages.slice(-6) // Send last few messages for conversational context
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Connection to AI failed');
      }

      const result = await response.json();
      setMessages(prev => [...prev, { role: 'bot', text: result.text }]);
    } catch (err) {
      console.error('[AI Chat Send Error]:', err);
      const errMsg = err.message || '';
      const isQuota = errMsg.toLowerCase().includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('limit');

      if (isQuota) {
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            text: `⚠️ **AI Daily Quota Limit Reached (429)**\n\nYour Google Gemini API key's free-tier daily cap of **20 requests** has been exceeded.\n\n### 💡 How to Unlock Unlimited Access:\n1. Go to your **[Google AI Studio](https://aistudio.google.com/)** dashboard.\n2. Transition your account or project to **Pay-As-You-Go** billing to get immediate, unlimited, and faster responses.\n3. Alternatively, you can wait for the daily quota reset or configure a premium API key under server settings.`
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'bot', text: `⚠️ **AI Communication Error:** ${errMsg}. Please try again.` }
        ]);
      }
    } finally {
      setChatLoading(false);
    }
  };

  const simulateQuotaLimit = () => {
    // Set strategic summary error state to a realistic 429 quota exception
    setSummaryError('Synthesis Delay: AI Connection Error: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent: [429 Too Many Requests] You exceeded your current quota, please check your plan and billing details.');

    // Add the user message mimicking a question and the quota bot response
    setMessages(prev => [
      ...prev,
      { role: 'user', text: 'How can I fix the critical bottleneck?' },
      {
        role: 'bot',
        text: `⚠️ **AI Daily Quota Limit Reached (429)**\n\nYour Google Gemini API key's free-tier daily cap of **20 requests** has been exceeded.\n\n### 💡 How to Unlock Unlimited Access:\n1. Go to your **[Google AI Studio](https://aistudio.google.com/)** dashboard.\n2. Transition your account or project to **Pay-As-You-Go** billing to get immediate, unlimited, and faster responses.\n3. Alternatively, you can wait for the daily quota reset or configure a premium API key under server settings.`
      }
    ]);
  };

  const handleClose = () => {
    setIsAiChatOpen(false);
    setAiChatContext(null);
  };

  // Suggestion Pills Click Handler
  const handlePillClick = (prompt) => {
    if (chatLoading) return;
    handleSend(prompt);
  };

  if (!isAiChatOpen || !aiChatContext) return null;

  const { sectionName, auditScore, url } = aiChatContext;

  // Determine circular gauge variables
  const strokeWidth = 8;
  const size = 96;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const scoreNum = Number(auditScore) || 0;
  const strokeDashoffset = circumference - (scoreNum / 100) * circumference;

  // Gauge color based on score
  const gaugeColor = scoreNum >= 90
    ? '#10B981' // emerald
    : scoreNum >= 50
      ? '#F59E0B' // amber
      : '#EF4444'; // rose

  const suggestionChips = [
    'How can I improve this score?',
    'What is the most critical issue?',
    'Explain the errors in detail',
    'Provide step-by-step code fixes'
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-6 overflow-hidden">
        {/* Full-screen Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Floating / Full-screen Dashboard Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={`relative w-full h-full md:h-[90vh] md:max-w-7xl flex flex-col md:flex-row md:rounded-3xl overflow-hidden border shadow-2xl ${darkMode
            ? 'bg-slate-900/90 border-slate-800 text-white shadow-black/80'
            : 'bg-card border-line text-inksoft shadow-slate-200/50'
            }`}
        >
          {/* Header Close Button for Mobile Stack */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-[200] p-2.5 rounded-full bg-slate-800/80 text-white hover:bg-slate-700/80 active:scale-95 transition-all shadow-lg md:hidden"
            title="Close AI Assistant"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ========================================== */}
          {/* LEFT PANEL: Module Overview & Synthesis    */}
          {/* ========================================== */}
          <div className={`w-full md:w-[38%] flex flex-col p-6 md:p-8 border-b md:border-b-0 md:border-r overflow-y-auto custom-scrollbar ${darkMode
            ? 'bg-slate-950/40 border-slate-800/70'
            : 'bg-surface-2 border-line'
            }`}>
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 block leading-none mb-1">
                  Active Audit Module
                </span>
                <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
                  {sectionName}
                </h2>
              </div>
            </div>

            {/* Score & URL Overview Card */}
            <div className={`p-5 rounded-2xl border flex items-center gap-5 mb-6 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-card border-line shadow-sm'
              }`}>
              {/* Circular Gauge */}
              <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    className={darkMode ? 'stroke-slate-800' : 'stroke-[#E7E0D2]'}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={gaugeColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black tracking-tighter">
                    {auditScore !== undefined ? `${auditScore}%` : 'N/A'}
                  </span>
                  <span className="text-[8px] font-black opacity-40 uppercase tracking-widest leading-none mt-0.5">
                    SCORE
                  </span>
                </div>
              </div>

              {/* Target Info */}
              <div className="flex-grow overflow-hidden space-y-2">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-semibold uppercase tracking-wider opacity-40 flex items-center gap-1">
                    <Globe className="w-2.5 h-2.5" /> Target URL
                  </span>
                  <p className="text-xs font-semibold truncate opacity-90 block hover:underline cursor-pointer" title={url}>
                    {url || 'N/A'}
                  </p>
                </div>
                {data?.device && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border leading-none bg-slate-500/5 border-slate-500/10 opacity-70">
                    <Layers className="w-3 h-3" />
                    <span>{data.device} Mode</span>
                  </div>
                )}
              </div>
            </div>

            {/* Strategic Overview Content */}
            <div className="flex-1 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.25em] opacity-40 mb-1">
                Strategic Synthesis
              </h3>

              {summaryLoading ? (
                /* Synthesis Skeleton Loader */
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`p-4 rounded-xl border h-24 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-cardsoft border-line'}`} />
                  ))}
                </div>
              ) : summaryError ? (
                /* Fallback on summary error */
                (() => {
                  const isQuota = summaryError.toLowerCase().includes('429') || summaryError.toLowerCase().includes('quota') || summaryError.toLowerCase().includes('limit');
                  if (isQuota) {
                    return (
                      <div className={`p-4 rounded-xl border flex items-start gap-3 ${darkMode ? 'bg-amber-500/5 border-amber-500/15 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}>
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-black uppercase tracking-wider">AI Quota Reached</h4>
                          <p className="text-xs leading-relaxed opacity-90">
                            Your Gemini API key's daily limit of 20 requests has been reached.
                          </p>
                          <div className="text-[10px] font-medium opacity-75 mt-1">
                            💡 Tip: Configure Pay-As-You-Go in your Google AI Studio account to resolve this.
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${darkMode ? 'bg-rose-500/5 border-rose-500/15 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'
                      }`}>
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold uppercase tracking-wider">Strategic Delay</h4>
                        <p className="text-xs leading-relaxed opacity-90">{summaryError}</p>
                        <button
                          onClick={fetchStrategicSummary}
                          className="mt-2 text-[10px] font-semibold flex items-center gap-1 underline uppercase hover:opacity-85"
                        >
                          <RefreshCw className="w-2.5 h-2.5" /> Retry Synthesis
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : summary ? (
                /* Strategic Summary Cards */
                <div className="space-y-4">
                  {/* Strength Card */}
                  {summary.strength && (
                    <div className={`flex gap-3.5 p-4 rounded-xl border transition-all hover:scale-[1.01] ${darkMode
                      ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-50'
                      : 'bg-emerald-50/20 border-emerald-100 text-emerald-950 shadow-sm'
                      }`}>
                      <Target className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[9px] font-black uppercase tracking-wider text-emerald-500/80 mb-0.5">
                          Health Strength
                        </h4>
                        <p className="text-xs font-semibold leading-relaxed">
                          {summary.strength}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bottleneck Card */}
                  {summary.bottleneck && (
                    <div className={`flex gap-3.5 p-4 rounded-xl border transition-all hover:scale-[1.01] ${darkMode
                      ? 'bg-amber-500/5 border-amber-500/15 text-amber-50'
                      : 'bg-amber-50/20 border-amber-100 text-amber-950 shadow-sm'
                      }`}>
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[9px] font-black uppercase tracking-wider text-amber-500/80 mb-0.5">
                          Critical Bottleneck
                        </h4>
                        <p className="text-xs font-semibold leading-relaxed">
                          {summary.bottleneck}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Card */}
                  {summary.action && (
                    <div className={`flex gap-3.5 p-4 rounded-xl border transition-all hover:scale-[1.02] shadow-lg ${darkMode
                      ? 'bg-indigo-500/10 border-indigo-500/25 text-white shadow-indigo-500/5'
                      : 'bg-indigo-50 border-indigo-150 text-indigo-950 shadow-indigo-100/30'
                      }`}>
                      <Lightbulb className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <h4 className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'
                          }`}>
                          Priority Strategist Action
                        </h4>
                        <p className="text-xs font-semibold leading-relaxed">
                          {summary.action}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Version Badge Footer */}
            <div className="pt-6 mt-6 border-t border-slate-800/10 dark:border-slate-800/50 flex justify-between items-center text-[8px] font-black tracking-widest opacity-35 leading-none">
              <span>INTELLIGENCE CAPABLE v3.1</span>
              <span>SYNTHESIS COMPLETE</span>
            </div>
          </div>

          {/* ========================================== */}
          {/* RIGHT PANEL: Conversational AI Chat        */}
          {/* ========================================== */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">

            {/* Overlay Header close button on Desktop */}
            <button
              onClick={handleClose}
              className={`absolute top-4 right-4 z-50 p-2 rounded-xl transition-all duration-200 active:scale-95 hidden md:block border ${darkMode
                ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-300'
                : 'bg-cardsoft border-line hover:bg-surface-2 text-muted'
                }`}
              title="Minimize Overlay"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Conversation Header */}
            <div className={`px-6 py-4 flex items-center justify-between border-b ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-card border-line shadow-sm'
              }`}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className={`text-[10px] uppercase font-black tracking-widest opacity-60`}>
                  Site Audit AI Chat Context Active
                </span>
              </div>

              <button
                onClick={simulateQuotaLimit}
                type="button"
                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 border flex items-center gap-1.5 active:scale-95 cursor-pointer ${darkMode
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
                  }`}
                title="Simulate a 429 Quota Exceeded API response across both panels"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                Simulate Quota Limit
              </button>
            </div>

            {/* Chat Messages viewport */}
            <div className={`flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar ${darkMode ? 'bg-slate-900/20' : 'bg-surface-2'
              }`}>
              {/* If empty and greeting is loading, show loading skeleton */}
              {messages.length === 0 && chatLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] flex gap-3">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border bg-indigo-600 border-indigo-500 text-white animate-bounce-subtle">
                      <Bot size={16} />
                    </div>
                    <div className={`p-4 rounded-2xl rounded-tl-none text-sm flex items-center gap-3 border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-card border-line text-inksoft'
                      }`}>
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Site Audit AI is analyzing detailed module JSON data...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Feed */}
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${msg.role === 'user'
                      ? (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-cardsoft border-line text-muted')
                      : 'bg-indigo-600 border-indigo-500 text-white'
                      }`}>
                      {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
                    </div>

                    <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${msg.role === 'user'
                      ? (darkMode
                        ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none shadow-lg shadow-indigo-600/10'
                        : 'bg-card border-line text-inksoft rounded-tr-none shadow-sm')
                      : (darkMode
                        ? 'bg-slate-800 border-slate-700/80 text-slate-100 rounded-tl-none'
                        : 'bg-card border-line text-inksoft rounded-tl-none shadow-sm')
                      }`}>
                      <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }} />
                    </div>
                  </div>
                </div>
              ))}

              {/* Follow-up / reply generation indicator */}
              {messages.length > 0 && chatLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] flex gap-3">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border bg-indigo-600 border-indigo-500 text-white">
                      <Bot size={15} />
                    </div>
                    <div className={`p-4 rounded-2xl rounded-tl-none text-sm flex items-center gap-3 border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-card border-line text-inksoft'
                      }`}>
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Assistant is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* suggestion template pills container */}
            <div className={`px-6 py-3 border-t flex flex-wrap gap-2 ${darkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-surface-2 border-line'
              }`}>
              <span className="text-[9px] font-black uppercase tracking-wider opacity-45 flex items-center gap-1 mr-1 shrink-0 h-6">
                <HelpCircle className="w-3 h-3" /> Quick Context Queries:
              </span>
              {suggestionChips.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handlePillClick(prompt)}
                  disabled={chatLoading}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 leading-none shrink-0 ${darkMode
                    ? 'bg-slate-850 border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white'
                    : 'bg-card border-line hover:border-indigo-500 text-muted hover:text-indigo-600 shadow-sm'
                    }`}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Input Container */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className={`p-6 border-t flex items-center gap-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-card border-line'
                }`}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask AI anything about this ${sectionName} audit...`}
                className={`flex-1 bg-transparent rounded-xl border border-transparent focus:ring-0 text-sm py-3 px-4 transition-all ${darkMode
                  ? 'text-white bg-slate-950/60 border-slate-800 focus:border-slate-700'
                  : 'text-inksoft bg-surface-2 border-line focus:border-slate-350'
                  }`}
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || chatLoading}
                className={`p-3.5 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 active:scale-95 border ${input.trim() && !chatLoading
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-550'
                  : (darkMode
                    ? 'bg-slate-800 border-slate-750 text-slate-500'
                    : 'bg-cardsoft border-line text-faint')
                  }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
