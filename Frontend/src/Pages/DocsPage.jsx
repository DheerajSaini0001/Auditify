import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { BookOpen, Shield, Zap, Terminal, Activity, Focus, Search, Globe, ChevronRight } from "lucide-react";

import PageHeader from "../Component/PageHeader";

export default function DocsPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const containerClass = darkMode
    ? "min-h-screen py-14 px-4 sm:px-8 flex flex-col items-center bg-[#0B1120] text-white relative font-sans"
    : "min-h-screen py-14 px-4 sm:px-8 flex flex-col items-center bg-surface text-ink relative font-sans";

  return (
    <div className={containerClass}>
      {/* Dynamic Backgrounds */}
      <div className={`absolute inset-0 ${darkMode ? 'bg-grid-white/[0.02]' : 'bg-grid-black/[0.02]'} pointer-events-none`} />
      <div className={`fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full mix-blend-screen filter blur-[120px] opacity-30 ${darkMode ? 'bg-[#ea580c]' : 'bg-accentsoft'} pointer-events-none`} />
      <div className={`fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full mix-blend-screen filter blur-[120px] opacity-20 ${darkMode ? 'bg-[#f97316]' : 'bg-accentsoft'} pointer-events-none`} />

      <div className="relative z-10 max-w-5xl w-full mx-auto space-y-10">

        {/* Hero Section */}
        <PageHeader
          icon={BookOpen}
          badge="Dealer Pulse Documentation"
          title="Understand the"
          titleAccent="Intelligence Engine."
          subtitle="Dive deep into how the Dealer Pulse crawler traverses, analyzes, and grades your infrastructure. Everything from LCP heuristics to SSL chain validation."
          darkMode={darkMode}
        />

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Card 1 */}
          <div className={`group relative p-8 rounded-3xl transition-all duration-500 border overflow-hidden ${darkMode ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-[#ea580c]/50 hover:shadow-[0_0_40px_rgba(234,88,12,0.1)]' : 'bg-card border-line shadow-xl shadow-slate-200/40 hover:border-[#ea580c]/40 hover:shadow-[0_10px_40px_rgba(234,88,12,0.15)]'}`}>
            <div className={`absolute top-0 right-0 p-32 bg-[#ea580c]/10 rounded-full blur-[80px] -mr-16 -mt-16 transition-opacity group-hover:opacity-100 ${darkMode ? 'opacity-0' : 'opacity-50'}`}></div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] flex items-center justify-center text-white mb-6 shadow-lg shadow-[#ea580c]/30">
                <Globe size={28} />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Crawler Mechanics</h3>
              <p className={`leading-relaxed mb-6 ${darkMode ? "text-slate-300" : "text-muted"}`}>
                Dealer Pulse deploys an isolated headless Chromium instance to inspect your domain. We spoof a standardized modern mobile User-Agent, throttle the network to simulate 4G, and artificially degrade CPU latency to x4 to strictly emulate real-world mid-tier cellular devices.
              </p>
              <div className={`font-mono text-xs p-4 rounded-xl ${darkMode ? 'bg-slate-950 border border-slate-800 text-orange-400' : 'bg-cardsoft border border-line text-accent'}`}>
                User-Agent: Dealer Pulse /1.0 (Mobile; headless)
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className={`group relative p-8 rounded-3xl transition-all duration-500 border overflow-hidden ${darkMode ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-[#ea580c]/50 hover:shadow-[0_0_40px_rgba(234,88,12,0.1)]' : 'bg-card border-line shadow-xl shadow-slate-200/40 hover:border-[#ea580c]/40 hover:shadow-[0_10px_40px_rgba(234,88,12,0.15)]'}`}>
            <div className={`absolute top-0 right-0 p-32 bg-[#ea580c]/10 rounded-full blur-[80px] -mr-16 -mt-16 transition-opacity group-hover:opacity-100 ${darkMode ? 'opacity-0' : 'opacity-50'}`}></div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F97316] to-[#C2410C] flex items-center justify-center text-white mb-6 shadow-lg shadow-[#ea580c]/30">
                <Activity size={28} />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Performance Scoring</h3>
              <p className={`leading-relaxed ${darkMode ? "text-slate-300" : "text-muted"}`}>
                Your global Performance Score utilizes a weighted average logarithmic curve. We heavily penalize structural blockers like synchronous JavaScript parsed in the &lt;head&gt; tag, and unoptimized LCP images.
              </p>
              <ul className={`mt-6 space-y-3 font-semibold text-sm ${darkMode ? "text-slate-400" : "text-muted"}`}>
                <li className="flex items-center gap-3"><ChevronRight size={16} className="text-accent" /> Largest Contentful Paint (25%)</li>
                <li className="flex items-center gap-3"><ChevronRight size={16} className="text-accent" /> Total Blocking Time (25%)</li>
                <li className="flex items-center gap-3"><ChevronRight size={16} className="text-accent" /> Cumulative Layout Shift (15%)</li>
              </ul>
            </div>
          </div>

          {/* Card 3 */}
          <div className={`group relative p-8 rounded-3xl transition-all duration-500 border overflow-hidden ${darkMode ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-[#ea580c]/50 hover:shadow-[0_0_40px_rgba(234,88,12,0.1)]' : 'bg-card border-line shadow-xl shadow-slate-200/40 hover:border-[#ea580c]/40 hover:shadow-[0_10px_40px_rgba(234,88,12,0.15)]'}`}>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#F97316] flex items-center justify-center text-white mb-6 shadow-lg shadow-[#ea580c]/30">
                <Terminal size={28} />
              </div>
              <h3 className="text-2xl font-semibold mb-4">AIO Architecture</h3>
              <p className={`leading-relaxed ${darkMode ? "text-slate-300" : "text-muted"}`}>
                Artificial Intelligence Optimization means speaking directly to parsers. We look for semantic precision over visual bloat. The engine validates the integrity of your JSON-LD Schema markup arrays. Missing entity definitions or disjointed graph data will flatline your AIO grade.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className={`group relative p-8 rounded-3xl transition-all duration-500 border overflow-hidden ${darkMode ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-[#ea580c]/50 hover:shadow-[0_0_40px_rgba(234,88,12,0.1)]' : 'bg-card border-line shadow-xl shadow-slate-200/40 hover:border-[#ea580c]/40 hover:shadow-[0_10px_40px_rgba(234,88,12,0.15)]'}`}>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#F97316] flex items-center justify-center text-white mb-6 shadow-lg shadow-[#ea580c]/30">
                <Shield size={28} />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Security Validation</h3>
              <p className={`leading-relaxed ${darkMode ? "text-slate-300" : "text-muted"}`}>
                A fast site is irrelevant if it's leaking data. The scanner runs a lightweight vulnerability sweep across the HTTP response channels. Missing strict Content-Security policies, exposed Git directories, or outdated server headers mapping to known CVEs will flag immediately in the red zone.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
