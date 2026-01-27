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
  const containerBg = darkMode
    ? "bg-gray-900 border-t border-gray-800"
    : "bg-gray-50 border-t border-gray-200";

  const cardClass = darkMode
    ? "bg-gray-800 border border-gray-700"
    : "bg-white border border-gray-200 shadow-sm";

  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-400" : "text-gray-600";

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
    <div id="raw-data-section" className={`w-full py-16 ${containerBg}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Section Header */}
        <div className="mb-10">
          <h2 className={`text-2xl font-bold ${textPrimary}`}>Export & Data</h2>
          <p className={`mt-2 text-sm ${textSecondary}`}>
            Download the full audit report or inspect the raw data payload.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* --- Card 1: PDF Export --- */}
          <div className={`p-8 rounded-xl flex flex-col justify-between h-full ${cardClass}`}>
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-lg ${darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-semibold ${textPrimary}`}>PDF Report</h3>
              </div>

              <p className={`text-sm leading-relaxed mb-8 ${textSecondary}`}>
                Generate a comprehensive PDF document including detailed scores, actionable insights, and visuals. Ideal for client presentations or archiving.
              </p>
            </div>

            <button
              onClick={() => generatePDF(data)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>


          {/* --- Card 2: JSON Inspector --- */}
          <div className={`p-8 rounded-xl flex flex-col justify-between h-full ${cardClass}`}>
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-lg ${darkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-50 text-purple-600"}`}>
                  <Database className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-semibold ${textPrimary}`}>Raw Data</h3>
              </div>

              <p className={`text-sm leading-relaxed mb-8 ${textSecondary}`}>
                Access the complete JSON dataset returned by the analysis engine. Useful for developers who need to validate values or integrate with other systems.
              </p>
            </div>

            <button
              onClick={() => setShowRaw(!showRaw)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium border transition-colors ${darkMode
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Code className="w-4 h-4" />
              {showRaw ? "Close Viewer" : "View JSON Payload"}
            </button>
          </div>

        </div>

        {/* --- Collapsible JSON Viewer --- */}
        <AnimatePresence>
          {showRaw && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className={`mt-4 rounded-xl border overflow-hidden ${darkMode ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"}`}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? "bg-gray-900 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                  <span className={`text-xs font-mono font-medium ${textSecondary}`}>
                    payload.json
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded transition-colors ${copied
                        ? "text-green-600 bg-green-50"
                        : darkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-600 hover:text-black hover:bg-gray-200"
                      }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="p-4 overflow-auto max-h-[500px] custom-scrollbar">
                  <pre className={`text-xs font-mono leading-relaxed ${darkMode ? "text-blue-300" : "text-blue-800"}`}>
                    {jsonString}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default RawData;