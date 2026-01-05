import React from "react";
import { useData } from "../context/DataContext";
// NEW: Added FileText and Smartphone icons
import { NotebookPen, FileText, Smartphone, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const UrlHeader = ({ darkMode }) => {
  var { data, loading } = useData();
  const site = data.Site;
  const { clearData } = useData();

  // Consistent Styles with Dashboard
  const cardBg = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const textMain = darkMode ? "text-white" : "text-slate-900";
  const textSub = darkMode ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 rounded-2xl border shadow-sm transition-colors duration-300 ${cardBg}`}>

      {/* Left Section: URL & Meta Info */}
      <div className="flex flex-col gap-3 w-full md:w-auto overflow-hidden">
        <label className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>
          Audit Report For
        </label>

        <div className="flex items-center gap-3 group">
          <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
            <ExternalLink className={`w-5 h-5 ${textMain}`} />
          </div>
          <a
            href={site || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xl md:text-2xl font-bold truncate hover:underline decoration-2 underline-offset-4 ${textMain}`}
          >
            {site || "No Site Provided"}
          </a>
        </div>

        {/* Meta Badges */}
        <div className="flex flex-wrap items-center gap-3 mt-1">
          {/* Report Type Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${darkMode ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
            <FileText size={14} />
            <span>{data?.Report || "Report"}</span>
          </div>

          {/* Device Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${darkMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
            <Smartphone size={14} />
            <span>{data?.Device || "Device"}</span>
          </div>
        </div>
      </div>

      {/* Right Section: Action Button */}
      <Link to="/" replace className="w-full md:w-auto flex-shrink-0">
        <button
          onClick={clearData}
          className={`
            w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-emerald-500/20 transition-all 
            bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 hover:scale-[1.02] active:scale-[0.98]
          `}
        >
          <NotebookPen size={20} />
          <span>Check Another</span>
        </button>
      </Link>
    </div>
  );
};

export default UrlHeader;