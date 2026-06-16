import React, { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { HeartHandshake, Sparkles, Plus, Minus, Search } from "lucide-react";
import PageHeader from "../Component/PageHeader";

export default function HelpCenterPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const [openFaq, setOpenFaq] = useState(1);
  const [search, setSearch] = useState("");

  const containerClass = darkMode
    ? "min-h-screen pb-14 flex flex-col items-center bg-[#0B1120] text-white relative font-sans"
    : "min-h-screen pb-14 flex flex-col items-center bg-surface text-ink relative font-sans";

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
      <div className={`relative w-full py-14 px-4 sm:px-8 border-b overflow-hidden ${darkMode ? "bg-[#0B1120]/40 border-[#ea580c]/20" : "bg-card border-line"}`}>
        <div className={`absolute top-0 right-1/4 w-96 h-96 bg-[#ea580c]/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen`}></div>
        <div className={`absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#f97316]/20 rounded-full blur-[140px] pointer-events-none mix-blend-screen`}></div>

        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6">
          <PageHeader
            icon={HeartHandshake}
            variant="iconic"
            title="We've got"
            titleAccent="you covered."
            subtitle="Our support matrix is engineered like our auditing tools—fast, transparent, and built for builders."
            darkMode={darkMode}
          />

          <div className="relative max-w-xl mx-auto mt-8 group">
            <div className={`absolute -inset-1 rounded-2xl blur-lg transition duration-500 group-hover:duration-200 ${darkMode ? "bg-gradient-to-r from-[#EA580C] to-[#C2410C] opacity-20 group-hover:opacity-60" : "bg-line opacity-50"}`}></div>
            <div className={`relative flex items-center px-6 py-4 rounded-2xl border ${darkMode ? "bg-[#0B1120] border-[#ea580c]/20 hover:border-[#ea580c]/30" : "bg-card border-line shadow-lg"}`}>
              <Search className="text-faint w-6 h-6 mr-4" />
              <input
                type="text"
                placeholder="Search troubleshooting guides..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full bg-transparent focus:outline-none text-lg ${darkMode ? "text-white placeholder:text-faint" : "text-ink placeholder:text-faint"}`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 mt-10 space-y-10">

        <div>
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="text-accent" />
            <h2 className="text-3xl font-semibold tracking-tight">Frequent Friction Points</h2>
          </div>

          <div className="grid gap-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                className={`group cursor-pointer rounded-3xl border transition-all duration-300 overflow-hidden ${darkMode
                    ? `bg-[#0B1120]/30 border-[#ea580c]/20 ${openFaq === faq.id ? 'border-[#ea580c]/50 bg-[#0B1120]/80' : 'hover:border-[#ea580c]/30'}`
                    : `bg-card border-line ${openFaq === faq.id ? 'border-[#ea580c]/40 shadow-xl shadow-[#ea580c]/10' : 'hover:border-line shadow-sm'}`
                  }`}
              >
                <div className="flex items-center justify-between p-6 md:p-8">
                  <h3 className={`text-xl font-semibold transition-colors ${openFaq === faq.id ? 'text-accent' : ''}`}>{faq.q}</h3>
                  <div className={`p-2 rounded-full transition-transform duration-300 ${openFaq === faq.id ? 'rotate-90 bg-accent text-white' : (darkMode ? 'bg-[#0B1120] text-faint' : 'bg-cardsoft text-muted')}`}>
                    {openFaq === faq.id ? <Minus size={20} /> : <Plus size={20} />}
                  </div>
                </div>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${openFaq === faq.id ? 'grid-rows-[1fr] opacity-100 pb-8 px-6 md:px-8' : 'grid-rows-[0fr] opacity-0 px-6 md:px-8'}`}
                >
                  <div className="overflow-hidden">
                    <p className={`text-lg leading-relaxed ${darkMode ? "text-inksoft" : "text-muted"}`}>
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
