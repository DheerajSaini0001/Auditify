import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Key, Code, Database, Webhook, TerminalSquare, Copy, CheckCircle2 } from "lucide-react";

export default function ApiAccessPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const containerClass = darkMode
    ? "min-h-screen py-24 px-4 sm:px-8 flex flex-col items-center bg-[#060B14] text-white relative font-sans"
    : "min-h-screen py-24 px-4 sm:px-8 flex flex-col items-center bg-[#F8FAFC] text-slate-900 relative font-sans";

  return (
    <div className={containerClass}>
      <div className={`absolute inset-0 ${darkMode ? 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]' : 'bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]'} pointer-events-none`} />
      
      <div className="relative z-10 max-w-5xl w-full mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-16 border-b pb-12 border-slate-500/20">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-blue-500/10 text-blue-500 text-sm font-black tracking-widest uppercase border border-blue-500/20">
              <Code size={16} /> API Reference
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter">Automate Everything.</h1>
            <p className={`text-lg max-w-md ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Integrate world-class auditing directly into your CI/CD pipelines, dashboards, and automated workflows.
            </p>
          </div>
          <div className={`p-6 rounded-2xl border backdrop-blur-md ${darkMode ? "bg-blue-500/5 border-blue-500/20" : "bg-white border-slate-200 shadow-xl"}`}>
            <h4 className="font-bold text-sm mb-2 opacity-70 uppercase tracking-widest">Base URL</h4>
            <div className="text-lg font-mono font-bold text-blue-500">https://api.auditify.com/v1</div>
            <div className="mt-4 flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 size={14}/> 99.9% Uptime</span>
              <span className="flex items-center gap-1 text-purple-500"><TerminalSquare size={14}/> REST JSON</span>
            </div>
          </div>
        </header>

        {/* Auth Section */}
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${darkMode ? "bg-[#09101C] border-slate-800" : "bg-white border-slate-200 shadow-2xl shadow-slate-200/50"}`}>
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <div className="p-8 md:p-12 md:flex gap-12 items-center">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Key size={24} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Authentication</h2>
              <p className={`text-lg leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                Requests to the Auditify API must be authenticated using a Bearer token. Create API Keys directly inside your developer dashboard. We recommend cycling these keys every 90 days.
              </p>
            </div>
            <div className={`flex-1 rounded-2xl border overflow-hidden mt-8 md:mt-0 ${darkMode ? "bg-[#0B1221] border-slate-800" : "bg-slate-900 border-slate-800"}`}>
              <div className="flex px-4 py-3 border-b border-white/10 items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="text-xs font-mono text-slate-400">headers.json</div>
              </div>
              <div className="p-6 font-mono text-sm leading-8 text-slate-300 overflow-x-auto">
                <span className="text-pink-400">"Authorization"</span>: <span className="text-emerald-400">"Bearer sk_live_xxxxxxxxxxx"</span>,<br/>
                <span className="text-pink-400">"Content-Type"</span>: <span className="text-emerald-400">"application/json"</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Audit Section */}
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${darkMode ? "bg-[#09101C] border-slate-800" : "bg-white border-slate-200 shadow-2xl shadow-slate-200/50"}`}>
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
          <div className="p-8 md:p-12 md:flex flex-row-reverse gap-12 items-center">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Webhook size={24} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Initiate an Audit</h2>
              <p className={`text-lg leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                Kick off a headless scanning sequence by sending a POST request containing the target URL. Because auditing takes time, this endpoint returns immediately with a <code className={`px-2 py-1 rounded-md text-sm ${darkMode?"bg-slate-800":"bg-slate-100"}`}>job_id</code>. Process completion is transmitted automatically to your registered Webhook URI.
              </p>
            </div>
            <div className={`flex-1 rounded-2xl border overflow-hidden mt-8 md:mt-0 ${darkMode ? "bg-[#0B1221] border-slate-800" : "bg-slate-900 border-slate-800"}`}>
              <div className="flex px-4 py-3 border-b border-white/10 items-center justify-between">
                <div className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">POST /v1/scan</div>
              </div>
              <div className="p-6 font-mono text-sm leading-8 text-slate-300 overflow-x-auto">
                <span className="text-blue-400">curl</span> -X POST https://api.auditify.com/v1/scan \<br/>
                &nbsp;&nbsp;-H <span className="text-emerald-400">"Authorization: Bearer sk_live_..."</span> \<br/>
                &nbsp;&nbsp;-d <span className="text-yellow-300">'{'{'}"url": "https://example.com"{'}'}'</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
