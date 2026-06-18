import React from "react";
import { Globe, ExternalLink, Clock, Smartphone, Monitor, Layers, NotebookPen, Download, Lock } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { savePostAuthIntent } from "../utils/intentStore";
import { useData } from "../context/DataContext";
import { Sparkles } from "lucide-react";

export default function UrlHeader({ data, darkMode, sectionName, sectionData, auditScore, hideBorder }) {
  const currentDevice = data?.device || "Desktop";
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { setIsAiChatOpen, setAiChatContext } = useData();
  const location = useLocation();

  // Auto-trigger actions after login redirect
  React.useEffect(() => {
    if (isAuthenticated && location.state?.action === 'download' && data?.status === "success") {
      console.log("[UrlHeader] Auto-triggering download from intent...");
      // Clear action from state to prevent loops
      window.history.replaceState({ ...location.state, action: null }, '');
      handleDownloadPDF();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, location.state, data?.status]);

  const handleDownloadPDF = () => {
    // Guests may download too (they verified their email via OTP before the audit).
    if (!data?._id) return toast.error("Report ID missing");

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
    toast.promise(
      (async () => {
        const token = localStorage.getItem('dealerpulse_token');
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
        link.download = `Dealerpulse-Report-${data.url?.replace(/[^a-z0-9]/gi, '-')}.pdf`;
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

  const handleGetAISummary = () => {
    if (!isAuthenticated) {
      toast("Sign in to unlock AI strategic insights.", {
        icon: "✨",
        duration: 4000,
      });
      if (data?._id) {
        savePostAuthIntent(data._id, `/report/${data._id}`);
      }
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setAiChatContext({
      sectionName,
      sectionData,
      auditScore,
      url: data?.url
    });
    setIsAiChatOpen(true);
  };

  const displayUrl = data?.url ? data.url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '') : "Analyzing...";
  const formattedUrl = displayUrl.length > 45 ? `${displayUrl.substring(0, 42)}...` : displayUrl;

  return (
    <div className={`relative p-6 md:p-8 ${hideBorder ? "" : "border-b"} ${darkMode ? "border-slate-800 bg-slate-900/50" : "border-line bg-surface-2/80"}`}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 min-w-0 w-full">

        {/* Left: URL Section */}
        <div className="space-y-2 w-full lg:flex-1 min-w-0">
          <div className="flex items-center gap-2 opacity-60">
            <Globe className={`w-3.5 h-3.5 ${darkMode ? "text-slate-200" : "text-muted"}`} />
            <span className={`text-xs font-semibold uppercase tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>Audit Report For</span>
          </div>
          <div className="flex items-center gap-3 group min-w-0 w-full">
            <a
              href={data?.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-2xl md:text-3xl font-semibold truncate hover:underline underline-offset-4 decoration-2 decoration-transparent hover:decoration-current transition-all ${darkMode ? "text-white" : "text-ink"}`}
              title={data?.url || ""}
            >
              {formattedUrl}
            </a>
            <ExternalLink className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        </div>

        {/* Middle: Average Score */}
        {typeof data?.score === 'number' && (
          <div className="flex items-center justify-center w-full lg:flex-1 min-w-0 order-3 lg:order-2 mt-4 lg:mt-0">
            <div className={`flex items-center gap-3 px-5 py-2 rounded-2xl border shadow-sm transition-all ${darkMode ? "bg-slate-800/50 border-slate-700/50" : "bg-card border-line/50"}`}>
              <div className={`text-2xl font-black ${
                data.score >= 90 ? "text-emerald-500" : 
                data.score >= 50 ? "text-amber-500" : "text-red-500"
              }`}>
                {data.score.toFixed(0)}%
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? "text-slate-400" : "text-muted"}`}>Overall</span>
                <span className={`text-xs font-medium ${darkMode ? "text-slate-300" : "text-inksoft"}`}>Average</span>
              </div>
            </div>
          </div>
        )}

        {/* Right: Metadata Badges */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:flex-1 lg:justify-end order-2 lg:order-3">
          {/* AI Summary Button */}
          {data?.status === "success" && sectionData && (
            <button
              onClick={handleGetAISummary}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-semibold bg-accent hover:bg-accenthover text-white shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all transition-all`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask AI</span>
            </button>
          )}

          {/* Device Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${darkMode ? "bg-slate-800/50 border-slate-700/50 text-slate-300" : "bg-surface-2/50 border-line/50 text-muted"}`}>
            {currentDevice === "Mobile" ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            <span>{currentDevice}</span>
          </div>

          {/* Report Type Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${darkMode ? "bg-slate-800/50 border-slate-700/50 text-slate-300" : "bg-surface-2/50 border-line/50 text-muted"}`}>
            <Layers className="w-4 h-4" />
            <span>{data?.report === "All" ? "Full Audit" : (data?.report || "Full Audit")}</span>
          </div>

          {/* Time Badge (if available) */}
          {data?.timeTaken && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${darkMode ? "bg-slate-800/50 border-slate-700/50 text-slate-300" : "bg-surface-2/50 border-line/50 text-muted"}`}>
              <Clock className="w-4 h-4" />
              <span>{data.timeTaken}</span>
            </div>
          )}

          {/* Download PDF Button */}
          {data?.status === "success" && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-6 py-2 rounded-xl font-semibold text-white shadow-lg transition-all active:scale-95 transform hover:-translate-y-0.5 bg-gradient-to-r from-[#16213E] to-[#2A3656] hover:from-[#1F2D52] hover:to-[#374468] shadow-[#16213E]/25"
            >
              {isAuthenticated ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>Download Report</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 