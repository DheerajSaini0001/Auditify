import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { BookOpen, Shield, Zap, Terminal, Activity, Focus, Search, Globe, ChevronRight } from "lucide-react";

import PageHeader from "../Component/PageHeader";

export default function DocsPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const containerClass = darkMode
    ? "min-h-screen py-24 px-4 sm:px-8 flex flex-col items-center bg-[#0B1120] text-white relative font-sans"
    : "min-h-screen py-24 px-4 sm:px-8 flex flex-col items-center bg-slate-50 text-slate-900 relative font-sans";

  return (
    <div className={containerClass}>
      {/* Dynamic Backgrounds */}
      <div className={`absolute inset-0 ${darkMode ? 'bg-grid-white/[0.02]' : 'bg-grid-black/[0.02]'} pointer-events-none`} />
      <div className={`fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full mix-blend-screen filter blur-[120px] opacity-30 ${darkMode ? 'bg-emerald-600' : 'bg-emerald-300'} pointer-events-none`} />
      <div className={`fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full mix-blend-screen filter blur-[120px] opacity-20 ${darkMode ? 'bg-teal-600' : 'bg-teal-300'} pointer-events-none`} />

      <div className="relative z-10 max-w-5xl w-full mx-auto space-y-16">
        
        {/* Hero Section */}
        <PageHeader 
            icon={BookOpen}
            badge="Auditify Documentation"
            title="Understand the"
            titleAccent="Intelligence Engine."
            subtitle="Dive deep into how the Auditify crawler traverses, analyzes, and grades your infrastructure. Everything from LCP heuristics to SSL chain validation."
            darkMode={darkMode}
        />

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Card 1 */}
          <div className={`group relative p-8 rounded-3xl transition-all duration-500 border overflow-hidden ${darkMode ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/40 hover:border-emerald-400/50 hover:shadow-[0_10px_40px_rgba(16,185,129,0.15)]'}`}>
            <div className={`absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-[80px] -mr-16 -mt-16 transition-opacity group-hover:opacity-100 ${darkMode ? 'opacity-0' : 'opacity-50'}`}></div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/30">
                <Globe size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Crawler Mechanics</h3>
              <p className={`leading-relaxed mb-6 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                Auditify deploys an isolated headless Chromium instance to inspect your domain. We spoof a standardized modern mobile User-Agent, throttle the network to simulate 4G, and artificially degrade CPU latency to x4 to strictly emulate real-world mid-tier cellular devices.
              </p>
              <div className={`font-mono text-xs p-4 rounded-xl ${darkMode ? 'bg-slate-950 border border-slate-800 text-emerald-400' : 'bg-slate-50 border border-slate-200 text-emerald-600'}`}>
                User-Agent: AuditifyBot/1.0 (Mobile; headless)
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className={`group relative p-8 rounded-3xl transition-all duration-500 border overflow-hidden ${darkMode ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)]' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/40 hover:border-blue-400/50 hover:shadow-[0_10px_40px_rgba(59,130,246,0.15)]'}`}>
            <div className={`absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-[80px] -mr-16 -mt-16 transition-opacity group-hover:opacity-100 ${darkMode ? 'opacity-0' : 'opacity-50'}`}></div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/30">
                <Activity size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Performance Scoring</h3>
              <p className={`leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                Your global Performance Score utilizes a weighted average logarithmic curve. We heavily penalize structural blockers like synchronous JavaScript parsed in the &lt;head&gt; tag, and unoptimized LCP images.
              </p>
              <ul className={`mt-6 space-y-3 font-semibold text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                <li className="flex items-center gap-3"><ChevronRight size={16} className="text-blue-500"/> Largest Contentful Paint (25%)</li>
                <li className="flex items-center gap-3"><ChevronRight size={16} className="text-blue-500"/> Total Blocking Time (25%)</li>
                <li className="flex items-center gap-3"><ChevronRight size={16} className="text-cyan-500"/> Cumulative Layout Shift (15%)</li>
              </ul>
            </div>
          </div>

          {/* Card 3 */}
          <div className={`group relative p-8 rounded-3xl transition-all duration-500 border overflow-hidden ${darkMode ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-purple-500/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.1)]' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/40 hover:border-purple-400/50 hover:shadow-[0_10px_40px_rgba(168,85,247,0.15)]'}`}>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-purple-500/30">
                <Terminal size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">AIO Architecture</h3>
              <p className={`leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                Artificial Intelligence Optimization means speaking directly to parsers. We look for semantic precision over visual bloat. The engine validates the integrity of your JSON-LD Schema markup arrays. Missing entity definitions or disjointed graph data will flatline your AIO grade.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className={`group relative p-8 rounded-3xl transition-all duration-500 border overflow-hidden ${darkMode ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-red-500/50 hover:shadow-[0_0_40px_rgba(239,68,68,0.1)]' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/40 hover:border-red-400/50 hover:shadow-[0_10px_40px_rgba(239,68,68,0.15)]'}`}>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-red-500/30">
                <Shield size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Security Validation</h3>
              <p className={`leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                A fast site is irrelevant if it's leaking data. The scanner runs a lightweight vulnerability sweep across the HTTP response channels. Missing strict Content-Security policies, exposed Git directories, or outdated server headers mapping to known CVEs will flag immediately in the red zone.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
