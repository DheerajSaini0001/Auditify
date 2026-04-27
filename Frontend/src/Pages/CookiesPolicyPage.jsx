import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { ShieldAlert, Cookie, Zap } from "lucide-react";

export default function CookiesPolicyPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const containerClass = darkMode
    ? "min-h-screen py-24 px-4 sm:px-8 flex items-center justify-center bg-[#0B1120] text-white relative font-sans"
    : "min-h-screen py-24 px-4 sm:px-8 flex items-center justify-center bg-slate-50 text-slate-900 relative font-sans";

  return (
    <div className={containerClass}>
      <div className={`absolute inset-0 ${darkMode ? 'bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-900/20 via-[#0B1120] to-[#0B1120]' : 'bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-50/80 via-slate-50 to-slate-50'} pointer-events-none`} />

      <div className="relative z-10 max-w-3xl w-full">
        
        <div className={`overflow-hidden rounded-[2.5rem] border shadow-2xl ${darkMode ? "bg-[#060B14]/80 backdrop-blur-xl border-slate-800 shadow-teal-500/5" : "bg-white border-slate-200 shadow-slate-200"}`}>
          
          <div className={`p-12 md:p-16 border-b ${darkMode ? "border-slate-800 bg-slate-900/30" : "border-slate-100 bg-slate-50/50"}`}>
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 mb-8 border border-teal-500/20">
              <Cookie size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Storage Policies.</h1>
            <p className={`text-lg font-medium leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Detailed explanation regarding how Auditify relies on local browser caches, JWT footprints, and telemetry cookies.
            </p>
          </div>

          <div className="p-12 md:p-16 space-y-12">
            
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2"><Zap className="text-teal-500 w-5 h-5"/> Required Auth Tokens</h3>
              <p className={`leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                Session integrity leans heavily on HTTP-Only configured cookies. Upon OAuth culmination or standard local authorization, our backend plants an encrypted Json Web Token. Without this localized state artifact, routing through protected dashboard layers collapses entirely. It is fundamentally mandatory for platform operation.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2"><ShieldAlert className="text-teal-500 w-5 h-5"/> Diagnostic Telemetry</h3>
              <p className={`leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                Engineers require real-world metrics to solve crashes. Anomalous frontend javascript exceptions, combined with API latency reports, are funneled out using completely anonymized storage identifiers. We are not feeding your behavioral metrics into an ad-exchange marketplace.
              </p>
            </div>

            <div className={`p-6 rounded-2xl text-sm font-medium border ${darkMode ? "bg-teal-500/5 border-teal-500/20 text-teal-400" : "bg-teal-50 border-teal-200 text-teal-700"}`}>
              By proceeding to operate the Auditify panel, you acknowledge the persistent placement of these critical utility scripts.
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
}
