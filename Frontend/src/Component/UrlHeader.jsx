import React from "react";
import { Globe, ExternalLink, Clock, Smartphone, Monitor, Layers, NotebookPen, Download } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function UrlHeader({ data, darkMode }) {
  const currentDevice = data?.device || "Desktop";

  const handleDownloadPDF = () => {
    if (!data?._id) return toast.error("Report ID missing");
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
    toast.promise(
      (async () => {
        const token = localStorage.getItem('auditify_token');
        const response = await fetch(`${API_URL}/single-audit/${data._id}/export/pdf`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!response.ok) throw new Error('Failed to generate PDF');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Auditify-Report-${data.url?.replace(/[^a-z0-9]/gi, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })(),
      {
        loading: 'Generating professional PDF report...',
        success: 'Report downloaded successfully!',
        error: 'Failed to generate PDF',
      }
    );
  };

  return (
    <div className={`relative p-6 md:p-8 border-b ${darkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/80"}`}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

        {/* Left: URL Section */}
        <div className="space-y-2 w-full lg:w-auto">
          <div className="flex items-center gap-2 opacity-60">
            <Globe className="w-3.5 h-3.5" />
            <span className="text-xs font-bold uppercase tracking-widest">Audit Report For</span>
          </div>
          <div className="flex items-center gap-3 group">
            <a
              href={data?.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-2xl md:text-3xl font-extrabold truncate hover:underline underline-offset-4 decoration-2 decoration-transparent hover:decoration-current transition-all ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              {data?.url || "Analyzing..."}
            </a>
            <ExternalLink className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Right: Metadata Badges */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Device Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${darkMode ? "bg-slate-800/50 border-slate-700/50 text-slate-300" : "bg-slate-100/50 border-slate-200/50 text-slate-600"}`}>
            {currentDevice === "Mobile" ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            <span>{currentDevice}</span>
          </div>

          {/* Report Type Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${darkMode ? "bg-slate-800/50 border-slate-700/50 text-slate-300" : "bg-slate-100/50 border-slate-200/50 text-slate-600"}`}>
            <Layers className="w-4 h-4" />
            <span>{data?.report === "All" ? "Full Audit" : (data?.report || "Full Audit")}</span>
          </div>

          {/* Time Badge (if available) */}
          {data?.timeTaken && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${darkMode ? "bg-slate-800/50 border-slate-700/50 text-slate-300" : "bg-slate-100/50 border-slate-200/50 text-slate-600"}`}>
              <Clock className="w-4 h-4" />
              <span>{data.timeTaken}</span>
            </div>
          )}

          {/* Download PDF Button */}
          {data?.status === "completed" && (
            <button 
              onClick={handleDownloadPDF}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 transform hover:-translate-y-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/20`}
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          )}

          {/* Back to List Button (if from bulk audit) */}
          {data?.fromBulkAudit && (
            <Link to="/bulk-audit">
              <button className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all active:scale-95 transform hover:-translate-y-0.5">
                <NotebookPen className="w-4 h-4" />
                <span>Back to List</span>
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}