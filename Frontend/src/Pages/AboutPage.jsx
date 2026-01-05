import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { CheckCircle2, Target, Zap, BarChart3, ShieldCheck, Users } from "lucide-react";

export default function AboutPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  // Shared container styles
  const containerClass = darkMode
    ? "min-h-screen py-20 px-4 flex flex-col items-center bg-[#0B1120] text-white relative overflow-hidden font-sans selection:bg-emerald-500/30"
    : "min-h-screen py-20 px-4 flex flex-col items-center bg-slate-50 text-slate-900 relative overflow-hidden font-sans selection:bg-emerald-500/20";

  const cardClass = darkMode
    ? "p-8 rounded-2xl bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-colors"
    : "p-8 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 hover:border-emerald-500/30 transition-colors";

  return (
    <div className={containerClass}>
      {/* Background Grid Pattern - Consistent with InputForm */}
      <div className={`absolute inset-0 ${darkMode ? 'bg-grid-white/[0.03]' : 'bg-grid-black/[0.03]'} pointer-events-none`} />

      {/* Radial Gradient for depth */}
      <div className={`absolute inset-0 ${darkMode ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#0B1120] to-[#0B1120]' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/50 via-slate-50 to-slate-50'}`} pointerEvents="none" />

      <div className="relative z-10 max-w-6xl w-full">

        {/* Header */}
        <div className="text-center mb-20 space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Empowering the Web, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
              One Audit at a Time.
            </span>
          </h1>

          <p className={`max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            We provide deep insights into performance, SEO, and accessibility to help businesses build faster, compliant, and more profitable websites.
          </p>
        </div>

        {/* Content Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">

          {/* Mission Card */}
          <div className={cardClass}>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className={`leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Our goal is to democratize technical SEO and performance auditing. We believe every website owner—from freelancers to enterprises—deserves clear, actionable data to improve their digital presence without needing a PhD in computer science.
            </p>
          </div>

          {/* Capabilities Grid */}
          <div className={cardClass}>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">What We Analyze</h2>
            <ul className="space-y-4">
              {[
                "Core Web Vitals & Performance Speed",
                "On-Page SEO & Meta Tag Health",
                "Accessibility Compliance (WCAG)",
                "Mobile Responsiveness & UX"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                  <span className={darkMode ? "text-slate-300" : "text-slate-700"}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Features / Values Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <BarChart3 className="w-6 h-6 text-purple-500" />,
              title: "Data-Driven",
              desc: "We rely on real-time data from Lighthouse and other industry-standard APIs."
            },
            {
              icon: <ShieldCheck className="w-6 h-6 text-cyan-500" />,
              title: "Security Focused",
              desc: "Identifying vulnerabilities and security headers to keep your users safe."
            },
            {
              icon: <Users className="w-6 h-6 text-orange-500" />,
              title: "User Centric",
              desc: "Improving the actual experience of your visitors, not just search bots."
            }
          ].map((feature, idx) => (
            <div key={idx} className={`p-6 rounded-xl border transition-all ${darkMode ? 'bg-slate-900/30 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 shadow-lg shadow-slate-200/50 hover:border-slate-200'}`}>
              <div className="mb-4">{feature.icon}</div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{feature.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
