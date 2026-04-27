import React, { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { HeartHandshake, Sparkles, Plus, Minus, Search } from "lucide-react";

export default function HelpCenterPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const [openFaq, setOpenFaq] = useState(1);
  const [search, setSearch] = useState("");

  const containerClass = darkMode
    ? "min-h-screen pb-24 flex flex-col items-center bg-[#020617] text-white relative font-sans"
    : "min-h-screen pb-24 flex flex-col items-center bg-[#F8FAFC] text-slate-900 relative font-sans";

  const faqs = [
    {
      id: 1,
      q: "The crawler is blocked by Cloudflare. What next?",
      a: "If your domain is sitting behind 'Under Attack Mode' or strict WAF rules, our headless Chrome instance will be met with a Javascript challenge it cannot bypass. You must insert an IP bypass rule inside Cloudflare's WAF utilizing our proxy IP array."
    },
    {
      id: 2,
      q: "AIO Score states I'm missing 'Organization' schema?",
      a: "Our parser specifically looks for valid JSON-LD blobs containing the '@type': 'Organization' entity. Make sure this blob exists exactly inside the <head> tag and validates via Google's Rich Results checking tool."
    },
    {
      id: 3,
      q: "How to interpret the TTFB flag?",
      a: "Time To First Byte simply measures backend latency. If this is red, it's not a frontend issue. Your server or database query taking too long to spit out the initial DOM is the culprit. We recommend edge caching HTML slices."
    },
    {
      id: 4,
      q: "Is there a hard limit on manual audit generation?",
      a: "Yes. Basic tiers are restricted to 10 audits per day to prevent compute exhaustion on our Selenium/Puppeteer clusters. Pro users have effectively unlimited quotas utilizing priority queues."
    }
  ];

  return (
    <div className={containerClass}>
      
      {/* Cool 3D-ish Hero Section */}
      <div className={`relative w-full py-24 px-4 sm:px-8 border-b overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className={`absolute top-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen`}></div>
        <div className={`absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[140px] pointer-events-none mix-blend-screen`}></div>

        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-8">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-2xl shadow-indigo-500/40 mb-4 animate-bounce hover:animate-none transition-all cursor-pointer">
            <HeartHandshake className="text-white w-10 h-10" />
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
            We've got <br/> you covered.
          </h1>
          <p className={`text-xl font-medium max-w-xl mx-auto ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Our support matrix is engineered like our auditing tools—fast, transparent, and built for builders.
          </p>

          <div className="relative max-w-xl mx-auto mt-12 group">
            <div className={`absolute -inset-1 rounded-2xl blur-lg transition duration-500 group-hover:duration-200 ${darkMode ? "bg-gradient-to-r from-violet-500 to-purple-600 opacity-20 group-hover:opacity-60" : "bg-slate-300 opacity-50"}`}></div>
            <div className={`relative flex items-center px-6 py-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-700 hover:border-slate-600" : "bg-white border-slate-200 shadow-lg"}`}>
              <Search className="text-slate-400 w-6 h-6 mr-4" />
              <input 
                type="text" 
                placeholder="Search troubleshooting guides..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full bg-transparent focus:outline-none text-lg ${darkMode ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"}`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 mt-16 space-y-16">
        
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="text-indigo-500" />
            <h2 className="text-3xl font-bold tracking-tight">Frequent Friction Points</h2>
          </div>

          <div className="grid gap-4">
            {faqs.map((faq) => (
              <div 
                key={faq.id} 
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                className={`group cursor-pointer rounded-3xl border transition-all duration-300 overflow-hidden ${
                  darkMode 
                    ? `bg-slate-900/30 border-slate-800 ${openFaq === faq.id ? 'border-indigo-500/50 bg-slate-800/80' : 'hover:border-slate-700'}` 
                    : `bg-white border-slate-200 ${openFaq === faq.id ? 'border-indigo-400/50 shadow-xl shadow-indigo-500/10' : 'hover:border-slate-300 shadow-sm'}`
                }`}
              >
                <div className="flex items-center justify-between p-6 md:p-8">
                  <h3 className={`text-xl font-bold transition-colors ${openFaq === faq.id ? 'text-indigo-500' : ''}`}>{faq.q}</h3>
                  <div className={`p-2 rounded-full transition-transform duration-300 ${openFaq === faq.id ? 'rotate-90 bg-indigo-500 text-white' : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
                    {openFaq === faq.id ? <Minus size={20} /> : <Plus size={20} />}
                  </div>
                </div>
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${openFaq === faq.id ? 'grid-rows-[1fr] opacity-100 pb-8 px-6 md:px-8' : 'grid-rows-[0fr] opacity-0 px-6 md:px-8'}`}
                >
                  <div className="overflow-hidden">
                    <p className={`text-lg leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
