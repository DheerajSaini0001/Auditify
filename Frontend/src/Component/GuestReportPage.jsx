import React, { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Lock, UserPlus, LogIn, BarChart2, Search, Shield,
  Zap, Eye, Globe, Monitor, Layers, ExternalLink,
  CheckCircle, AlertTriangle, XCircle,
} from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";
import { savePostAuthIntent } from "../utils/intentStore";
import { useData } from "../context/DataContext";

// Map route → page meta
const ROUTE_META = {
  "/technical-performance": {
    label: "Technical Performance",
    badge: "Performance Audit",
    color: "text-blue-400",
    accent: "blue",
    score: 74,
  },
  "/on-page-seo": {
    label: "On-Page SEO",
    badge: "SEO Audit",
    color: "text-emerald-400",
    accent: "emerald",
    score: 80,
  },
  "/accessibility": {
    label: "Accessibility",
    badge: "A11y Audit",
    color: "text-purple-400",
    accent: "purple",
    score: 68,
  },
  "/security-compliance": {
    label: "Security & Compliance",
    badge: "Security Audit",
    color: "text-rose-400",
    accent: "rose",
    score: 91,
  },
  "/ux-content-structure": {
    label: "UX & Content Structure",
    badge: "UX Audit",
    color: "text-amber-400",
    accent: "amber",
    score: 77,
  },
  "/conversion-lead-flow": {
    label: "Conversion & Lead Flow",
    badge: "Conversion Audit",
    color: "text-cyan-400",
    accent: "cyan",
    score: 62,
  },
  "/aio": {
    label: "AIO Readiness",
    badge: "AI-Optimization Audit",
    color: "text-violet-400",
    accent: "violet",
    score: 55,
  },
};

// Circular arc SVG for fake score
const FakeScore = ({ score, darkMode, accent }) => {
  const r = 56;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = {
    blue: "#3b82f6", emerald: "#10b981", purple: "#a855f7",
    rose: "#f43f5e", amber: "#f59e0b", cyan: "#06b6d4", violet: "#8b5cf6",
  }[accent] || "#3b82f6";

  return (
    <div className="relative flex-shrink-0">
      <div
        className="absolute -inset-6 rounded-full blur-3xl opacity-20"
        style={{ background: color }}
      />
      <svg width="140" height="140" className="-rotate-90">
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke={darkMode ? "#1e293b" : "#e2e8f0"}
          strokeWidth="12"
        />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className={`text-3xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
          {score}%
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">SCORE</span>
      </div>
    </div>
  );
};

// Fake stat pill
const FakeStat = ({ icon: Icon, label, value, color, darkMode }) => (
  <div className={`flex items-center gap-2 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
    <Icon size={14} className={color} />
    <span className="font-bold">{value}</span>
    <span className="opacity-60">{label}</span>
  </div>
);

// Fake blurred metric card placeholder
const FakeCard = ({ darkMode, w = "col-span-1" }) => (
  <div className={`${w} h-28 rounded-2xl border blur-[2px] opacity-40 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`} />
);

/** Shown when a user visits a report route directly without being logged in */
const GuestReportPage = () => {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data } = useData();

  const auditId = data?._id;

  const handleLogin = () => {
    if (auditId) {
      savePostAuthIntent(auditId, `/report/${auditId}`);
    }
    navigate("/login");
  };

  const handleRegister = () => {
    if (auditId) {
      savePostAuthIntent(auditId, `/report/${auditId}`);
    }
    navigate("/register");
  };

  const meta = ROUTE_META[pathname] || {
    label: "Audit Report",
    badge: "Audit",
    color: "text-blue-400",
    accent: "blue",
    score: 72,
  };

  return (
    <div className={`w-full min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* ── URL HEADER CARD ── */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-8`}>
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${
          darkMode
            ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20"
            : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"
        }`}>

          {/* Top URL bar — just like UrlHeader */}
          <div className={`relative p-6 md:p-8 border-b ${darkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/80"}`}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 opacity-50">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Audit Report For</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl md:text-3xl font-extrabold ${darkMode ? "text-white/40" : "text-slate-400"} italic`}>
                    Run an audit to see your report...
                  </span>
                  <ExternalLink className="w-5 h-5 opacity-20" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${darkMode ? "bg-slate-800/50 border-slate-700/50 text-slate-400" : "bg-slate-100/50 border-slate-200/50 text-slate-500"}`}>
                  <Monitor className="w-4 h-4" />
                  <span>Desktop</span>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${darkMode ? "bg-slate-800/50 border-slate-700/50 text-slate-400" : "bg-slate-100/50 border-slate-200/50 text-slate-500"}`}>
                  <Layers className="w-4 h-4" />
                  <span>{meta.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Score + Stats panel */}
          <div className={`flex flex-col xl:flex-row min-h-[260px]`}>

            {/* Left: fake preview area */}
            <div className={`w-full xl:w-[45%] p-6 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
              <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full" />
              <div className={`relative z-10 w-full h-40 rounded-2xl border flex items-center justify-center ${darkMode ? "bg-slate-800/60 border-slate-700" : "bg-slate-200/40 border-slate-200"}`}>
                <div className="text-center space-y-2 opacity-30">
                  <Globe size={32} className={darkMode ? "text-slate-400 mx-auto" : "text-slate-400 mx-auto"} />
                  <p className="text-xs font-bold uppercase tracking-widest">Preview Unavailable</p>
                </div>
              </div>
            </div>

            {/* Right: Score + label */}
            <div className="flex-1 px-6 pb-6 pt-6 lg:px-12 lg:pt-8 flex flex-col justify-center">
              <div className="max-w-2xl mx-auto w-full space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 justify-center">

                  {/* Text */}
                  <div className="flex-1 space-y-4 text-left order-2 md:order-1">
                    <div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${
                        darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-100/50 text-blue-600 border border-blue-200"
                      }`}>
                        <BarChart2 className="w-3.5 h-3.5" />
                        {meta.badge}
                      </div>
                      <h2 className={`text-2xl lg:text-4xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                        {meta.label.split(" ")[0]}{" "}
                        <span className={meta.color}>{meta.label.split(" ").slice(1).join(" ")}</span>
                      </h2>
                      <p className={`text-sm leading-relaxed opacity-60 mt-2 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        Run an audit to see your full detailed results.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <FakeStat icon={CheckCircle} label="Passed" value="—" color="text-emerald-500" darkMode={darkMode} />
                      <FakeStat icon={AlertTriangle} label="Warning" value="—" color="text-amber-500" darkMode={darkMode} />
                      <FakeStat icon={XCircle} label="Failed" value="—" color="text-red-500" darkMode={darkMode} />
                    </div>
                  </div>

                  {/* Circular Score */}
                  <div className="order-1 md:order-2 opacity-30 pointer-events-none select-none">
                    <FakeScore score={meta.score} darkMode={darkMode} accent={meta.accent} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BLURRED FAKE CONTENT + LOCK OVERLAY ── */}
        <div className="relative mt-6">

          {/* Fake metric cards — blurred */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pointer-events-none select-none">
            {[...Array(6)].map((_, i) => (
              <FakeCard key={i} darkMode={darkMode} />
            ))}
          </div>

          {/* Lock Overlay */}
          <div className={`absolute inset-0 z-10 flex items-center justify-center p-4 rounded-3xl backdrop-blur-sm ${
            darkMode ? "bg-slate-950/60" : "bg-slate-50/70"
          }`}>
            <div className={`max-w-xl w-full p-10 rounded-[2.5rem] text-center shadow-2xl border transition-all duration-300 ${
              darkMode
                ? "bg-slate-900 border-slate-800 shadow-black/40"
                : "bg-white border-slate-200 shadow-slate-200/50"
            }`}>

              {/* Lock Icon */}
              <div className="mb-6 relative flex justify-center">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                <div className={`relative p-6 rounded-full border shadow-inner ${
                  darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-white"
                }`}>
                  <Lock className={`w-10 h-10 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                </div>
              </div>

              <h2 className={`text-2xl md:text-3xl font-black tracking-tight mb-3 ${darkMode ? "text-white" : "text-slate-900"}`}>
                Log in or Sign up to see the Report
              </h2>
              <p className={`text-sm leading-relaxed mb-8 opacity-70 max-w-sm mx-auto ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                Try DealerPulse for <strong>FREE</strong> and get full report details, detailed findings, monitoring, and more!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleLogin}
                  className={`flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold transition-all duration-300 w-full sm:w-auto shadow-lg hover:shadow-xl active:scale-95 ${
                    darkMode
                      ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                      : "bg-slate-800 text-white hover:bg-slate-900"
                  }`}
                >
                  <LogIn size={17} />
                  Log in
                </button>

                <span className={`text-sm font-bold uppercase tracking-widest opacity-40 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                  or
                </span>

                <button
                  onClick={handleRegister}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold transition-all duration-300 w-full sm:w-auto shadow-lg hover:shadow-xl active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                >
                  <UserPlus size={17} />
                  Create a FREE account
                </button>
              </div>

              <div className={`mt-8 pt-6 border-t border-dashed ${darkMode ? "border-slate-700/60" : "border-slate-200"}`} />
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 mt-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                Join 50,000+ businesses auditing with DealerPulse
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestReportPage;
