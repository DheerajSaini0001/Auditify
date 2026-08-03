import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ThemeContext } from '../context/ThemeContext';
import { Sparkles, X, Send, MessageSquare, Loader2, User, Bot } from 'lucide-react';
import { formatMarkdown } from '../utils/formatMarkdown.js';
import { useAuth } from '../context/AuthContext';
import './aiChatWidget.css';

const AIChatWidget = () => {
    const { data } = useData();
    const { theme } = useContext(ThemeContext);
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const darkMode = theme === 'dark';

    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Hi! I am your Site Audit AI Assistant. Ask me anything about your current audit results! ✨' }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Reset messages when active audit changes to prevent carrying over stale history
    useEffect(() => {
        setMessages([
            { role: 'bot', text: 'Hi! I am your Site Audit AI Assistant. Ask me anything about your current audit results! ✨' }
        ]);
        setInput('');
        setIsLoading(false);
    }, [data?._id]);

    // Hide widget on dashboard page, when no completed audit is loaded, or if not authenticated
    if (!isAuthenticated || !data || data.status !== 'success' || location.pathname === '/dashboard') {
        return null;
    }

    const getActiveSectionDetails = () => {
        const path = location.pathname;
        if (path.includes('/accessibility')) {
            return {
                sectionName: "Accessibility",
                sectionData: data.accessibility,
                auditScore: data.accessibility?.Percentage
            };
        }
        if (path.includes('/technical-performance')) {
            return {
                sectionName: "Technical Performance",
                sectionData: data.technicalPerformance,
                auditScore: data.technicalPerformance?.Percentage || data.technicalPerformance?.overallScore
            };
        }
        if (path.includes('/on-page-seo')) {
            return {
                sectionName: "On-Page SEO",
                sectionData: data.onPageSEO,
                auditScore: data.onPageSEO?.Percentage
            };
        }
        if (path.includes('/ux-content-structure')) {
            return {
                sectionName: "UX & Content Structure",
                sectionData: data.UXOrContentStructure,
                auditScore: data.UXOrContentStructure?.Percentage
            };
        }
        if (path.includes('/security-compliance')) {
            return {
                sectionName: "Security & Compliance",
                sectionData: data.securityOrCompliance,
                auditScore: data.securityOrCompliance?.Percentage
            };
        }
        if (path.includes('/conversion-lead-flow')) {
            return {
                sectionName: "Conversion & Lead Flow",
                sectionData: data.conversionAndLeadFlow,
                auditScore: data.conversionAndLeadFlow?.Percentage
            };
        }
        if (path.includes('/aeo')) {
            return {
                sectionName: "AEO (Answer Engine Optimization)",
                sectionData: data.aeo,
                auditScore: data.aeo?.Percentage
            };
        }
        if (path.includes('/aio')) {
            return {
                sectionName: "AIO Readiness",
                sectionData: data.aioReadiness,
                auditScore: data.aioReadiness?.Percentage
            };
        }
        return {
            sectionName: null,
            sectionData: null,
            auditScore: null
        };
    };

    const getTrimmerPayload = () => {
        const path = location.pathname;
        const basePayload = {
            url: data.url,
            score: data.score || data.totalScore,
            grade: data.grade,
            status: data.status,
            _id: data._id
        };

        if (path.includes('/accessibility')) {
            return {
                ...basePayload,
                accessibility: data.accessibility
            };
        }
        if (path.includes('/technical-performance')) {
            return {
                ...basePayload,
                technicalPerformance: data.technicalPerformance
            };
        }
        if (path.includes('/on-page-seo')) {
            return {
                ...basePayload,
                onPageSEO: data.onPageSEO
            };
        }
        if (path.includes('/ux-content-structure')) {
            return {
                ...basePayload,
                UXOrContentStructure: data.UXOrContentStructure
            };
        }
        if (path.includes('/security-compliance')) {
            return {
                ...basePayload,
                securityOrCompliance: data.securityOrCompliance
            };
        }
        if (path.includes('/conversion-lead-flow')) {
            return {
                ...basePayload,
                conversionAndLeadFlow: data.conversionAndLeadFlow
            };
        }
        if (path.includes('/aeo')) {
            return {
                ...basePayload,
                aeo: data.aeo
            };
        }
        if (path.includes('/aio')) {
            return {
                ...basePayload,
                aioReadiness: data.aioReadiness
            };
        }
        return data;
    };

    const initializeAssistantChat = async () => {
        setIsLoading(true);
        const baseUrl = 'https://siteaudit.sltechsoft.com/api' || 'http://localhost:2000';
        const activeSection = getActiveSectionDetails();
        const trimmedData = getTrimmerPayload();

        try {
            const response = await fetch(`${baseUrl}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: 'INIT_CHAT',
                    auditData: trimmedData,
                    history: [],
                    sectionName: activeSection.sectionName,
                    sectionData: activeSection.sectionData,
                    auditScore: activeSection.auditScore
                })
            });

            if (!response.ok) {
                throw new Error('Failed to connect');
            }

            const result = await response.json();
            setMessages([{ role: 'bot', text: result.text }]);
        } catch (error) {
            console.error("Assistant Init Error:", error);
            // Dynamic fallback message if AI fails or rate limits are reached
            setMessages([
                {
                    role: 'bot',
                    text: activeSection.sectionName
                        ? `Hi! I've loaded your **${activeSection.sectionName}** report (Score: **${activeSection.auditScore || 'N/A'}/100**). Ask me anything about these results! ✨`
                        : 'Hi! I am your Site Audit AI Assistant. Ask me anything about your current audit results! ✨'
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenWidget = () => {
        setIsOpen(true);
        // Trigger live welcome analysis if the welcome message is currently the generic static one
        if (messages.length <= 1 && messages[0]?.text.startsWith('Hi! I am your Site Audit AI Assistant')) {
            initializeAssistantChat();
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        const baseUrl = 'https://siteaudit.sltechsoft.com/api' || 'http://localhost:2000';
        const activeSection = getActiveSectionDetails();
        const trimmedData = getTrimmerPayload();

        try {
            const response = await fetch(`${baseUrl}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    auditData: trimmedData, // Send only dynamic section-trimmed data
                    history: messages.slice(-5), // Send last few messages
                    sectionName: activeSection.sectionName,
                    sectionData: activeSection.sectionData,
                    auditScore: activeSection.auditScore
                })
            });

            if (!response.ok) {
                const isJson = response.headers.get('content-type')?.includes('application/json');
                const errData = isJson ? await response.json() : { error: `Server returned ${response.status} (${response.statusText})` };
                throw new Error(errData.error || 'Failed to connect to AI');
            }

            const result = await response.json();
            setMessages(prev => [...prev, { role: 'bot', text: result.text }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', text: `⚠️ **AI Brain Error:** ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={handleOpenWidget}
                className={`fixed bottom-6 right-6 h-14 px-6 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-orange-350-500/40 active:scale-95 z-50 group animate-bounce-subtle ${darkMode ? 'bg-orange-600 text-white shadow-orange-350/20' : 'bg-orange-600 text-white shadow-orange-200'}`}
            >
                <div className="relative flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 border-2 border-orange-600 rounded-full animate-pulse"></div>
                </div>
                <span className="font-semibold tracking-tight text-sm sm:text-base">Ask AI Assistant</span>
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl z-50 transition-all duration-300 transform origin-bottom-right border ${darkMode ? 'bg-[#0F172A] border-slate-700 shadow-blue-500/10' : 'bg-card border-line'}`}>
            {/* Subtle Inner Glow for Dark Mode */}
            {darkMode && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>}

            {/* Header */}
            <div className={`p-4 rounded-t-2xl flex items-center justify-between border-b ${darkMode ? 'bg-gradient-to-r from-[#1E293B] to-[#0F172A] border-slate-700 text-white' : 'bg-surface text-ink border-line'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className={`text-xs font-semibold  tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>Site Audit AI Intelligence</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span className={`text-[10px] uppercase tracking-wider font-semibold ${darkMode ? 'text-emerald-400' : 'text-accent'}`}>AI Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setMessages([{ role: 'bot', text: 'Hi! I am your Site Audit AI Assistant. Ask me anything about your current audit results! ✨' }])}
                        className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-linesoft text-ink'}`}
                        title="Clear Chat"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 16h-5.38" />
                        </svg>
                    </button>
                    <button onClick={() => setIsOpen(false)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-linesoft text-ink'}`}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Chat Body */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar ${darkMode ? 'bg-[#0F172A]' : 'bg-surface-2'}`}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] flex gap-2 min-w-0 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center border ${msg.role === 'user' ? (darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-accentsoft border-accentsoft text-accent') : (darkMode ? 'bg-blue-700 border-blue-600 text-white' : 'bg-accent border-accent text-white')}`}>
                                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed break-all whitespace-pre-wrap overflow-hidden ${msg.role === 'user'
                                ? (darkMode ? 'bg-blue-700 text-white rounded-tr-none shadow-lg' : 'bg-card shadow-sm border border-line rounded-tr-none text-inksoft')
                                : (darkMode ? 'bg-slate-800 text-white border border-slate-700 rounded-tl-none shadow-sm' : 'bg-card shadow-sm border border-line rounded-tl-none text-inksoft')
                                }`}>
                                <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }} />
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] flex gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center border ${darkMode ? 'bg-blue-700 border-blue-600' : 'bg-accent border-accent text-white'}`}>
                                <Bot size={14} />
                            </div>
                            <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 break-all whitespace-pre-wrap overflow-hidden ${darkMode ? 'bg-slate-800 text-white border border-slate-700' : 'bg-card shadow-sm border border-line'}`}>
                                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                                Analyzing results...
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className={`p-4 border-t ${darkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-card border-line'}`}>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        className={`flex-1 bg-transparent border-none focus:ring-0 text-xs py-2 px-1 ${darkMode ? 'text-white placeholder-slate-400' : 'text-ink placeholder-faint'}`}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className={`p-2 rounded-xl transition-all duration-300 ${input.trim() && !isLoading ? 'bg-orange-600 text-white shadow-lg' : 'bg-cardsoft text-faint dark:bg-slate-700'}`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIChatWidget;
