import React, { useState, useEffect, useRef, useContext } from 'react';
import { useData } from '../context/DataContext';
import { ThemeContext } from '../context/ThemeContext';
import { Sparkles, X, Send, MessageSquare, Loader2, User, Bot, Minimize2 } from 'lucide-react';
import { formatMarkdown } from '../utils/formatMarkdown.js';
import './aiChatWidget.css';

const AIChatWidget = () => {
    const { data } = useData();
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === 'dark';
    
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Hi! I am your DealerPulse Assistant. Ask me anything about your current audit results! ✨' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    
    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:2000';

        try {
            const response = await fetch(`${baseUrl}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    auditData: data, // Send full audit report for context
                    history: messages.slice(-5) // Send last few messages for conversation context
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
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-50 animate-bounce-subtle ${darkMode ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-indigo-600 text-white shadow-indigo-200'}`}
            >
                <MessageSquare className="w-6 h-6" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></div>
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl z-50 transition-all duration-300 transform origin-bottom-right border ${darkMode ? 'bg-[#0F172A] border-slate-700 shadow-indigo-500/10' : 'bg-white border-slate-200'}`}>
            {/* Subtle Inner Glow for Dark Mode */}
            {darkMode && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>}
            
            {/* Header */}
            <div className={`p-4 rounded-t-2xl flex items-center justify-between border-b ${darkMode ? 'bg-gradient-to-r from-[#1E293B] to-[#0F172A] border-slate-700 text-white' : 'bg-indigo-600 text-white border-transparent'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold">DealerPulse Intelligence</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                            <span className={`text-[10px] uppercase tracking-wider font-bold ${darkMode ? 'text-violet-400' : 'text-[#ffffffb3]'}`}>AI Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsOpen(false)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-white/10 text-white'}`}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Chat Body */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar ${darkMode ? 'bg-[#0F172A]' : 'bg-slate-50'}`}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center border ${msg.role === 'user' ? (darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-indigo-100 border-indigo-200 text-indigo-600') : (darkMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-indigo-600 border-indigo-500 text-white')}`}>
                                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                msg.role === 'user' 
                                ? (darkMode ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' : 'bg-white shadow-sm border border-slate-100 rounded-tr-none text-slate-700') 
                                : (darkMode ? 'bg-slate-800 text-white border border-slate-700 rounded-tl-none shadow-sm' : 'bg-white shadow-sm border border-slate-100 rounded-tl-none text-slate-700')
                            }`}>
                                <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }} />
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] flex gap-2">
                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center border ${darkMode ? 'bg-indigo-600 border-indigo-500' : 'bg-indigo-600 border-indigo-500 text-white'}`}>
                                <Bot size={14} />
                            </div>
                            <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${darkMode ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white shadow-sm border border-slate-100'}`}>
                                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                                Analyzing results...
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className={`p-4 border-t ${darkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        className={`flex-1 bg-transparent border-none focus:ring-0 text-xs py-2 px-1 ${darkMode ? 'text-white placeholder-slate-400' : 'text-slate-800'}`}
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim() || isLoading}
                        className={`p-2 rounded-xl transition-all duration-300 ${input.trim() && !isLoading ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400 dark:bg-slate-700'}`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIChatWidget;
