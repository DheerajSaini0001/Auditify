import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Code,
  Database,
  Copy,
  Check
} from "lucide-react";
import { generatePDF, filterRawData } from "../utils/pdfGenerator";

const RawData = ({ data, darkMode }) => {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- Theme Classes ---
  // The outer container background (the page background)
  const containerBg = darkMode
    ? "bg-slate-950"
    : "bg-slate-50";

  // The Master Card background
  const masterCardClass = darkMode
    ? "bg-slate-900 border-slate-800 shadow-black/20"
    : "bg-white border-slate-200 shadow-slate-200/50";

  // Inner cards (PDF/JSON) need to be distinct from the Master Card
  const innerCardClass = darkMode
    ? "bg-slate-800/50 border border-slate-700"
    : "bg-slate-50 border border-slate-100";

  const textPrimary = darkMode ? "text-white" : "text-slate-900";
  const textSecondary = darkMode ? "text-slate-400" : "text-slate-500";

  // --- Data Prep ---
  if (data?.status !== "completed") return null;

  const filteredData = filterRawData(data);
  const jsonString = JSON.stringify(filteredData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="raw-data-section" className={`w-full pt-0 pb-8 ${containerBg}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* ✅ Unified Master Card Wrapper */}
        <div className={`rounded-3xl border overflow-hidden shadow-xl ${masterCardClass}`}>
          <div className="p-8 md:p-12">

            {/* Section Header */}
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className={`text-3xl font-bold tracking-tight mb-3 ${textPrimary}`}>Export & Data Payload</h2>
                <p className={`text-base ${textSecondary} max-w-2xl`}>
                  Download the comprehensive audit report or inspect the unfiltered JSON data returned by the analysis engine.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* --- Card 1: PDF Export (Inner Card) --- */}
              <div className={`p-8 rounded-2xl flex flex-col transition-all duration-300 hover:-translate-y-1 ${innerCardClass}`}>
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3.5 rounded-xl shadow-inner ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                      <FileText className="w-8 h-8" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${textPrimary}`}>PDF Report</h3>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Document</span>
                    </div>
                  </div>

                  <p className={`text-sm leading-relaxed mb-10 ${textSecondary}`}>
                    Generate a professional-grade PDF document featuring detailed scores, visual snapshots, and prioritized actionable insights. Ideal for stakeholder presentations.
                  </p>
                </div>

                <div className="mt-auto pt-8">
                  <button
                    onClick={() => generatePDF(data)}
                    className="group w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-600/30 active:scale-[0.98]"
                  >
                    <Download className="w-5 h-5 transition-transform group-hover:-translate-y-1" />
                    <span>Download Comprehensive PDF</span>
                  </button>
                </div>
              </div>


              {/* --- Card 2: JSON Inspector (Inner Card) --- */}
              <div className={`p-8 rounded-2xl flex flex-col transition-all duration-300 hover:-translate-y-1 ${innerCardClass}`}>
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3.5 rounded-xl shadow-inner ${darkMode ? "bg-purple-500/10 text-purple-400" : "bg-purple-100 text-purple-600"}`}>
                      <Database className="w-8 h-8" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${textPrimary}`}>Raw JSON Data</h3>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-purple-400" : "text-purple-600"}`}>Developer API</span>
                    </div>
                  </div>

                  <p className={`text-sm leading-relaxed mb-10 ${textSecondary}`}>
                    Direct access to the raw JSON object associated with this audit. Use this for debugging, custom integrations, or validating specific metric values manually.
                  </p>
                </div>

                <div className="mt-auto pt-8">
                  <button
                    onClick={() => setShowRaw(!showRaw)}
                    className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold border transition-all active:scale-[0.98] ${darkMode
                      ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                      : "border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400 hover:text-black shadow-sm"
                      }`}
                  >
                    <Code className="w-5 h-5" />
                    {showRaw ? "Collapse Data Viewer" : "Inspect JSON Payload"}
                  </button>
                </div>
              </div>

            </div>

            {/* --- Collapsible JSON Viewer (Code Editor Style) --- */}
            <AnimatePresence>
              {showRaw && (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: 20 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // smooth easeOutQuint
                  className="overflow-hidden mt-12"
                >
                  <div className={`rounded-2xl border overflow-hidden shadow-2xl ${darkMode ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"}`}>

                    {/* Editor Toolbar */}
                    <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <div className="flex items-center gap-2">
                        {/* Mac-like dots */}
                        <div className="flex gap-1.5 mr-4">
                          <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                          <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                        </div>
                        <span className={`text-xs font-mono font-medium opacity-70 ${textSecondary}`}>
                          audit_payload_{data._id || "temp"}.json
                        </span>
                      </div>
                      <button
                        onClick={handleCopy}
                        className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all ${copied
                          ? "text-emerald-600 bg-emerald-50 border border-emerald-100"
                          : darkMode ? "text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700" : "text-slate-600 hover:text-black hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm"
                          }`}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "COPIED" : "COPY RAW"}
                      </button>
                    </div>

                    {/* Code Area */}
                    <div className={`p-6 overflow-auto max-h-[600px] custom-scrollbar text-sm font-mono leading-relaxed ${darkMode ? "text-blue-300 bg-[#0B1120]" : "text-indigo-700 bg-slate-50"}`}>
                      <pre>{jsonString}</pre>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RawData;