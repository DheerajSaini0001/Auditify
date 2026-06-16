import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { ShieldAlert, Cookie, Zap } from "lucide-react";

import PageHeader from "../Component/PageHeader";

export default function CookiesPolicyPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const containerClass = darkMode
    ? "min-h-screen py-14 px-4 sm:px-8 flex items-center justify-center bg-[#0B1120] text-white relative font-sans"
    : "min-h-screen py-14 px-4 sm:px-8 flex items-center justify-center bg-surface text-ink relative font-sans";

  return (
    <div className={containerClass}>
      <div className={`absolute inset-0 ${darkMode ? 'bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#ea580c]/10 via-[#0B1120] to-[#0B1120]' : 'bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accentsoft via-surface to-surface'} pointer-events-none`} />

      <div className="relative z-10 max-w-3xl w-full">

        <div className={`overflow-hidden rounded-[2.5rem] border shadow-2xl ${darkMode ? "bg-[#060B14]/80 backdrop-blur-xl border-slate-800 shadow-[#ea580c]/5" : "bg-card border-line shadow-slate-200"}`}>

          <div className={`p-12 md:p-16 border-b ${darkMode ? "border-slate-800 bg-slate-900/30" : "border-linesoft bg-surface-2/50"}`}>
            <PageHeader
              variant="iconic"
              icon={Cookie}
              title="Storage"
              titleAccent="Policies."
              subtitle="Detailed explanation regarding how Dealer Pulse relies on local browser caches, JWT footprints, and telemetry cookies."
              darkMode={darkMode}
            />
          </div>

          <div className="p-12 md:p-16 space-y-8">

            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2"><Zap className={`w-5 h-5 ${darkMode ? "text-orange-400" : "text-accent"}`} /> Required Auth Tokens</h3>
              <p className={`leading-relaxed ${darkMode ? "text-slate-300" : "text-muted"}`}>
                Session integrity leans heavily on HTTP-Only configured cookies. Upon OAuth culmination or standard local authorization, our backend plants an encrypted Json Web Token. Without this localized state artifact, routing through protected dashboard layers collapses entirely. It is fundamentally mandatory for platform operation.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2"><ShieldAlert className={`w-5 h-5 ${darkMode ? "text-orange-400" : "text-accent"}`} /> Diagnostic Telemetry</h3>
              <p className={`leading-relaxed ${darkMode ? "text-slate-300" : "text-muted"}`}>
                Engineers require real-world metrics to solve crashes. Anomalous frontend javascript exceptions, combined with API latency reports, are funneled out using completely anonymized storage identifiers. We are not feeding your behavioral metrics into an ad-exchange marketplace.
              </p>
            </div>

            <div className={`p-6 rounded-2xl text-sm font-medium border ${darkMode ? "bg-[#ea580c]/10 border-[#ea580c]/20 text-orange-400" : "bg-accentsoft border-[#ea580c]/20 text-accent"}`}>
              By proceeding to operate the Dealer Pulse panel, you acknowledge the persistent placement of these critical utility scripts.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
