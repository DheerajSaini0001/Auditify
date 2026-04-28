import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { ShieldOff, Eye, UserX, Database } from "lucide-react";
import PageHeader from "../Component/PageHeader";

export default function DoNotSellInfoPage() {
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
            <div className="text-xl font-bold mb-4">Consumer Rights</div>
            <ul className={`space-y-4 text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              <li className="text-emerald-500 transition-colors">1. CCPA Overview</li>
              <li className="hover:text-emerald-500 transition-colors cursor-pointer">2. Data Sales Policy</li>
              <li className="hover:text-emerald-500 transition-colors cursor-pointer">3. Opt-Out Request</li>
              <li className="hover:text-emerald-500 transition-colors cursor-pointer">4. Verification Process</li>
            </ul>
          </div>
          <div className={`text-xs p-4 rounded-xl border ${darkMode ? "bg-slate-900/50 border-slate-800 text-slate-500" : "bg-white border-slate-200 text-slate-400"}`}>
            Document Revision: 1.0.0<br/>
            Last Modified: April 28, 2026
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-3/4 space-y-12">
          
          <PageHeader 
            badge="Privacy"
            title="Do Not Sell"
            titleAccent="My Info."
            subtitle="Understand your rights under the California Consumer Privacy Act (CCPA) and how to exercise your right to opt-out of the sale of your personal information."
            darkMode={darkMode}
          />

          <div className={`space-y-16 text-base md:text-lg leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-2xl font-bold">
                <ShieldOff className="text-rose-500" />
                <h2>1. CCPA and Your Privacy Rights</h2>
              </div>
              <p>The California Consumer Privacy Act (CCPA) grants California residents specific rights regarding their personal information. One of these is the right to opt-out of the "sale" of personal information. Auditify respects these rights for all users, regardless of their location.</p>
              <p>While Auditify does not sell your personal information in the traditional sense (exchanging it for money), the CCPA defines "sale" broadly to include sharing information for other benefits.</p>
            </section>

            <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}></div>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-2xl font-bold">
                <Database className="text-blue-500" />
                <h2>2. What Information We Collect</h2>
              </div>
              <p>We collect minimal data necessary to provide our auditing services. This includes your email address for account management and the URLs you submit for analysis. We do not track your browsing history across the web or build advertising profiles.</p>
              <div className={`p-6 rounded-2xl border-l-4 border-blue-500 ${darkMode ? "bg-blue-500/5 text-blue-100 border-r border-t border-b border-slate-800" : "bg-blue-50 text-slate-800 border-r border-t border-b border-slate-200"}`}>
                <span className="font-bold">Our Commitment:</span> We explicitly do not syndicate, trade, or offload customer data to third-party data brokers or marketing exchanges.
              </div>
            </section>

             <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}></div>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-2xl font-bold">
                <UserX className="text-emerald-500" />
                <h2>3. How to Opt-Out</h2>
              </div>
              <p>If you wish to exercise your right to opt-out of any potential sharing of your information that could be categorized as a "sale" under CCPA, you can do so through the following methods:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Submit a request through our contact form.</li>
                <li>Email us directly at privacy@auditify.ai with the subject "CCPA Opt-Out Request".</li>
                <li>Adjust your privacy settings within your user dashboard.</li>
              </ul>
            </section>

            <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}></div>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-2xl font-bold">
                <Eye className="text-purple-500" />
                <h2>4. Verification and Response</h2>
              </div>
              <p>To protect your privacy, we must verify your identity before fulfilling your request. We may ask for information that allows us to reasonably verify you are the person about whom we collected personal information.</p>
              <p>We aim to respond to a verifiable consumer request within forty-five (45) days of its receipt. If we require more time, we will inform you of the reason and extension period in writing.</p>
            </section>

          </div>

        </div>
      </div>
    </div>
  );
}
