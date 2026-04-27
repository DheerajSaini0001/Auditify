import React, { useState, useEffect } from "react";
import { X, Sparkles, Loader2, Target, AlertTriangle, Lightbulb } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export function AISummaryModal({ isOpen, onClose, sectionName, sectionData, auditScore, url, darkMode }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && sectionData && Object.keys(sectionData).length > 0) {
      fetchSummary();
    }
  }, [isOpen, sectionName]);

  const fetchSummary = async () => {
    const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:2000";
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.post(`${baseUrl}/api/ai/summarize-section`, {
        sectionName,
        sectionData,
        auditScore,
        url,
      });
      setSummary(data.text);
    } catch (err) {
      console.error("Summary Error:", err);
      const serverMsg = err.response?.data?.error || "Intelligence engine is calibrating.";
      setError(`Insight Delay: ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sentences = summary ? summary.split('.').filter(s => s.trim().length > 0) : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border ${
            darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          {/* Header */}
          <div className={`p-6 flex items-center justify-between border-b ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20`}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                  AI Strategic Overview
                </h3>
                <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? "text-violet-400" : "text-violet-600"}`}>
                  Section: {sectionName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${
                darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 blur-2xl bg-violet-500/20 rounded-full animate-pulse"></div>
                  <Loader2 className="w-10 h-10 animate-spin text-violet-500 relative z-10" />
                </div>
                <p className={`text-sm font-bold tracking-tight animate-pulse ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Synthesizing audit data with AI Intelligence...
                </p>
              </div>
            ) : error ? (
              <div className={`p-6 rounded-2xl border flex items-center gap-4 ${
                darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-400" : "bg-rose-50 border-rose-100 text-rose-600"
              }`}>
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Strength Card */}
                {summary?.strength && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex gap-4 p-5 rounded-2xl border transition-all ${
                      darkMode ? "bg-violet-500/5 border-violet-500/20 shadow-[0_0_15px_-3px_rgba(139,92,246,0.1)]" : "bg-violet-50/30 border-violet-200"
                    }`}
                  >
                    <div className="mt-1 flex-shrink-0">
                       <Target className="w-6 h-6 text-violet-500" />
                    </div>
                    <div>
                      <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 ${darkMode ? "text-violet-400/70" : "text-violet-600/70"}`}>Performance Strength</h4>
                      <p className={`text-sm md:text-base font-semibold leading-relaxed ${darkMode ? "text-violet-50" : "text-violet-900"}`}>
                        {summary.strength}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* 2. Bottleneck Card */}
                {summary?.bottleneck && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className={`flex gap-4 p-5 rounded-2xl border transition-all ${
                      darkMode ? "bg-amber-500/5 border-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]" : "bg-amber-50/30 border-amber-200"
                    }`}
                  >
                    <div className="mt-1 flex-shrink-0">
                       <AlertTriangle className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 ${darkMode ? "text-amber-400/70" : "text-amber-600/70"}`}>Critical Bottleneck</h4>
                      <p className={`text-sm md:text-base font-semibold leading-relaxed ${darkMode ? "text-amber-50" : "text-amber-900"}`}>
                        {summary.bottleneck}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* 3. Action Card */}
                {summary?.action && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`flex gap-4 p-5 rounded-2xl border transition-all ${
                      darkMode ? "bg-violet-500/10 border-violet-500/20 shadow-[0_4px_20px_-5px_rgba(59,130,246,0.3)] scale-[1.02]" : "bg-violet-50 border-violet-200 shadow-md"
                    }`}
                  >
                    <div className="mt-1 flex-shrink-0">
                       <Lightbulb className="w-6 h-6 text-violet-500 shadow-glow" />
                    </div>
                    <div>
                      <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 ${darkMode ? "text-violet-400" : "text-violet-600 font-bold"}`}>Strategist Recommended Action</h4>
                      <p className={`text-sm md:text-base font-bold leading-relaxed ${darkMode ? "text-white" : "text-blue-900"}`}>
                        {summary.action}
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="pt-4 flex items-center justify-between opacity-50">
                   <span className="text-[10px] font-black tracking-[0.2em] uppercase">Intelligence Protocol v3.0</span>
                   <span className="text-[10px] font-bold">Strategic Synthesis Engine</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`p-6 flex justify-end gap-3 border-t ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
             <button
              onClick={onClose}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                darkMode ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
             >
                Close Insights
             </button>
             {!loading && !error && (
               <button
                onClick={fetchSummary}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:scale-105 transition-all"
               >
                  Regenerate
               </button>
             )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
