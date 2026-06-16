import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Layers, Zap, Search, ShieldCheck } from "lucide-react";
import PageHeader from "../Component/PageHeader";

export default function ServicesPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const containerClass = darkMode
    ? "min-h-screen py-14 px-4 sm:px-8 flex flex-col items-center bg-[#0B1120] text-white relative font-sans"
    : "min-h-screen py-14 px-4 sm:px-8 flex flex-col items-center bg-surface text-ink relative font-sans";

  const services = [
    {
      icon: <Search size={28} />,
      title: "Deep Crawler Auditing",
      desc: "Our primary offering. Headless Chromium clusters analyze DOM layouts, accessibility trees, and network payloads natively to emulate physical devices.",
      color: "orange"
    },
    {
      icon: <Layers size={28} />,
      title: "AIO Schema Validation",
      desc: "Prepare your content for Generative AI engines. We dissect your JSON-LD implementations to ensure entity graph data is coherent and fully validated.",
      color: "orange"
    },
    {
      icon: <Zap size={28} />,
      title: "Core Web Vitals Mapping",
      desc: "Granular reporting on First Input Delay, Interaction to Next Paint, and shifting layout metrics that inherently control your bounce rates.",
      color: "orange"
    },
    {
      icon: <ShieldCheck size={28} />,
      title: "Edge Security Checks",
      desc: "We verify crucial baseline configurations: enforcing HSTS, CSP validations, out-of-date TLS profiles, and server signature obfuscation.",
      color: "orange"
    }
  ];

  return (
    <div className={containerClass}>
      <div className={`absolute inset-0 ${darkMode ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#ea580c]/10 via-[#0B1120] to-[#0B1120]' : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accentsoft via-surface to-surface'} pointer-events-none`} />

      <div className="relative z-10 max-w-5xl w-full mx-auto space-y-10">

        {/* Header */}
        <PageHeader
          badge="Platform Capabilities"
          title="Comprehensive"
          titleAccent="Web Intelligence."
          subtitle="Our SaaS architecture abstracts away the immense complexity of managing headless browser grids and rendering validation trees."
          darkMode={darkMode}
        />

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {services.map((item, idx) => (
            <div key={idx} className={`group relative p-8 rounded-3xl transition-all duration-500 border overflow-hidden ${darkMode ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-[#ea580c]/50 hover:shadow-[0_0_40px_rgba(234,88,12,0.12)]' : 'bg-card border-line shadow-xl shadow-slate-200/40 hover:border-[#ea580c]/40 hover:shadow-[0_10px_40px_rgba(234,88,12,0.15)]'}`}>
              <div className={`absolute top-0 right-0 p-32 bg-[#ea580c]/10 rounded-full blur-[80px] -mr-16 -mt-16 transition-opacity group-hover:opacity-100 ${darkMode ? 'opacity-0' : 'opacity-50'}`}></div>
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-[#ea580c]/10 flex items-center justify-center ${darkMode ? 'text-orange-400' : 'text-accent'} mb-6 border border-[#ea580c]/20`}>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4">{item.title}</h3>
                <p className={`leading-relaxed ${darkMode ? "text-slate-300" : "text-muted"}`}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
