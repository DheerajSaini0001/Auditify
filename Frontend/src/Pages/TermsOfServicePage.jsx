import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { AlertCircle, FileText, Gavel, ServerCrash } from "lucide-react";

export default function TermsOfServicePage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const containerClass = darkMode
    ? "min-h-screen py-24 px-4 sm:px-8 flex flex-col items-center bg-[#060B14] text-white relative font-sans"
    : "min-h-screen py-24 px-4 sm:px-8 flex flex-col items-center bg-[#F8FAFC] text-slate-900 relative font-sans";

  return (
    <div className={containerClass}>
      <div className="relative z-10 max-w-4xl w-full mx-auto space-y-12">
        
        <header className="text-center space-y-6 mb-16">
          <div className="mx-auto w-20 h-20 rounded-[2rem] rotate-3 bg-red-500/10 flex items-center justify-center border border-red-500/30 text-red-500">
            <Gavel size={32} className="-rotate-3" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter">Terms of Service.</h1>
          <p className={`text-lg font-medium mx-auto max-w-lg ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            The legal constraints, limitations of liability, and usage bounds for the Auditify platform.
          </p>
        </header>

        <div className={`p-10 rounded-3xl border transition-all ${darkMode ? "bg-slate-900/40 border-slate-800 shadow-2xl shadow-black" : "bg-white border-slate-200 shadow-2xl shadow-slate-200/50"}`}>
          <div className={`space-y-12 text-base md:text-lg leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <AlertCircle className="text-red-500" />
                1. Prohibition of Abuse
              </h2>
              <p>Auditify implements a highly resource-intensive scraping phase. Programmatically forcing the engine to audit the same domain structure aggressively every few seconds is functionally equivalent to launching a Denial of Service (Layer 7) sequence.</p>
              <p>Circumventing REST rate-limits using randomized proxy ingress arrays or botnets forces an automatic and permanent network ban. You must respect the 429 Too Many Requests response headers.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FileText className="text-blue-500" />
                2. Imperfect Diagnostic Output
              </h2>
              <p>Automated software is, inherently, flawed. Validating WCAG accessibility properties programmatically via DOM assertions can occasionally result in False Positives (flagging an element that is visually accessible but theoretically incorrect in markup).</p>
              <p>Auditify accepts zero legal or financial liability if actions taken based on our audit diagnostics induce accidental downtime, layout fractures, or ranking drops on major search consolidators. The score holds no legal guarantee of SEO infallibility.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <ServerCrash className="text-purple-500" />
                3. Service Level Modifications
              </h2>
              <p>We perpetually deploy upstream modifications to the scoring algorithm. A domain rating 99 Points today may retroactively regress to 85 Points tomorrow if we integrate a stricter validation phase for Core Web Vitals or patch a miscalculation exploit. You accept that metrics are fluid and reactive benchmarks rather than permanent achievements.</p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
