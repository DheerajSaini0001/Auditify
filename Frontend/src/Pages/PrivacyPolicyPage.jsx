import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Lock, FileKey, ShieldCheck, DatabaseZap } from "lucide-react";
import PageHeader from "../Component/PageHeader";

export default function PrivacyPolicyPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const containerClass = darkMode
    ? "min-h-screen py-24 px-4 sm:px-8 flex flex-col items-center bg-[#060B14] text-white relative font-sans"
    : "min-h-screen py-24 px-4 sm:px-8 flex flex-col items-center bg-[#F8FAFC] text-slate-900 relative font-sans";

  return (
    <div className={containerClass}>
      <div className={`absolute inset-0 block pointer-events-none ${darkMode ? 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")] opacity-5' : 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")] opacity-10'}`}></div>
      
      <div className="relative z-10 max-w-6xl w-full mx-auto md:flex gap-16 relative items-start">
        
        {/* Sticky Sidebar */}
        <div className={`hidden md:block sticky top-32 w-1/4 space-y-8 pl-4 border-l-2 ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
          <div>
            <div className="text-xl font-bold mb-4">Privacy Framework</div>
            <ul className={`space-y-4 text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              <li className="text-emerald-500 transition-colors">1. Data Architecture</li>
              <li className="hover:text-emerald-500 transition-colors cursor-pointer">2. Retention Cycles</li>
              <li className="hover:text-emerald-500 transition-colors cursor-pointer">3. Sub-processors</li>
              <li className="hover:text-emerald-500 transition-colors cursor-pointer">4. GDPR & Compliance</li>
            </ul>
          </div>
          <div className={`text-xs p-4 rounded-xl border ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-500" : "bg-white border-slate-200 text-slate-400"}`}>
            Document Revision: 2.4.1<br/>
            Last Modified: Nov 12, 2024
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-3/4 space-y-12">
          
          <PageHeader 
            badge="Legal"
            title="Privacy"
            titleAccent="Policy."
            subtitle="Total transparency regarding how Auditify crawler nodes and backend services handle target domain ingestion and user metadata."
            darkMode={darkMode}
          />

          <div className={`space-y-16 text-base md:text-lg leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-2xl font-bold">
                <DatabaseZap className="text-emerald-500" />
                <h2>1. The Extraction Mechanics</h2>
              </div>
              <p>When our core engine executes an audit against an URL endpoint, it operates indistinguishably from an standard browser client. We download static assets, parse DOM nodes, and evaluate network watermarks. This downloaded information is highly volatile; it resides strictly in memory arrays during the scraping phase.</p>
              <p>Post-processing, exclusively aggregated scalar metrics (e.g. integer scores and localized string warnings) are committed to persistent storage mechanisms. The raw extracted payload structure itself is aggressively dumped to prevent localized storage bloat.</p>
            </section>

            <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}></div>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-2xl font-bold">
                <FileKey className="text-blue-500" />
                <h2>2. Asynchronous Data Expiration</h2>
              </div>
              <p>For unauthenticated, "guest" network streams, any resulting generated PDF reports or direct relational database entries inherit a strictly enforced twenty-four hour TTL (Time To Live). A chron routine aggressively wipes these ghost artifacts.</p>
              <div className={`p-6 rounded-2xl border-l-4 border-blue-500 ${darkMode ? "bg-blue-500/5 text-blue-100 border-r border-t border-b border-slate-800" : "bg-blue-50 text-slate-800 border-r border-t border-b border-slate-200"}`}>
                <span className="font-bold">Important:</span> Manual deletions triggered via the authenticated user dashboard dashboard represent irreversible hard-deletes. We maintain zero invisible redundant fallback clusters holding dropped projects.
              </div>
            </section>

             <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}></div>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-2xl font-bold">
                <ShieldCheck className="text-purple-500" />
                <h2>3. Cross-Border Sub-Processors</h2>
              </div>
              <p>The intricate processing capabilities needed to fire off hundreds of browser trees simultaneously mandate working with infrastructure behemoths like Amazon Web Services (AWS) and Vercel.</p>
              <p>Consequently, telemetry identifiers linking your external IP and session hashes flow across their edge routing mesh. We explicitly do not syndicate or offload customer analytics blocks to auxiliary marketing exchanges or data brokers.</p>
            </section>

            <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}></div>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-2xl font-bold">
                <Lock className="text-emerald-500" />
                <h2>4. GDPR & CCPA Compliance</h2>
              </div>
              <p>Under the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA), we are committed to providing you with control over your personal data. We collect only what is necessary to provide our services, such as your email address for account authentication and website URLs for auditing.</p>
              <p>You have the right to access, rectify, or erase your data at any time through your dashboard settings. We do not sell your personal information to third parties. If you wish to exercise your right to opt-out of data collection or request a complete data export, please contact our support team.</p>
            </section>

          </div>

        </div>
      </div>
    </div>
  );
}
