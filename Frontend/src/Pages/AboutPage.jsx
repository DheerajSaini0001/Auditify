import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { CheckCircle2, Target, Zap, BarChart3, ShieldCheck, Users } from "lucide-react";
import PageHeader from "../Component/PageHeader";

export default function AboutPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  // Shared container styles
  const containerClass = darkMode
    ? "min-h-screen py-12 px-4 flex flex-col items-center bg-[#0B1120] text-white relative overflow-hidden font-sans selection:bg-[#ea580c]/30"
    : "min-h-screen py-12 px-4 flex flex-col items-center bg-surface text-ink relative overflow-hidden font-sans selection:bg-[#ea580c]/20";

  const cardClass = darkMode
    ? "p-8 rounded-2xl bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-colors"
    : "p-8 rounded-2xl bg-card border border-line shadow-xl shadow-slate-200/50 hover:border-[#ea580c]/30 transition-colors";

  return (
    <div className={containerClass}>
      {/* Background Grid Pattern - Consistent with InputForm */}
      <div className={`absolute inset-0 ${darkMode ? 'bg-grid-white/[0.03]' : 'bg-grid-black/[0.03]'} pointer-events-none`} />

      {/* Radial Gradient for depth */}
      <div className={`absolute inset-0 ${darkMode ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#ea580c]/10 via-[#0B1120] to-[#0B1120]' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accentsoft via-surface to-surface'}`} pointerEvents="none" />

      <div className="relative z-10 max-w-6xl w-full">

        {/* Header */}
        <PageHeader
          title="Empowering the Web,"
          titleAccent="One Audit at a Time."
          subtitle="We provide deep insights into performance, SEO, and accessibility to help businesses build faster, compliant, and more profitable websites."
          darkMode={darkMode}
        />

        {/* Content Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">

          {/* Mission Card */}
          <div className={cardClass}>
            <div className="w-12 h-12 rounded-xl bg-accentsoft flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className={`leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
              Our goal is to democratize technical SEO and performance auditing. We believe every website owner—from freelancers to enterprises—deserves clear, actionable data to improve their digital presence without needing a PhD in computer science.
            </p>
          </div>

          {/* Capabilities Grid */}
          <div className={cardClass}>
            <div className="w-12 h-12 rounded-xl bg-accentsoft flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">What We Analyze</h2>
            <ul className="space-y-4">
              {[
                "Core Web Vitals & Performance Speed",
                "On-Page SEO & Meta Tag Health",
                "Accessibility Compliance (WCAG)",
                "Mobile Responsiveness & UX"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? "text-orange-400" : "text-accent"}`} />
                  <span className={darkMode ? "text-slate-300" : "text-inksoft"}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Features / Values Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <BarChart3 className="w-6 h-6 text-accent" />,
              title: "Data-Driven",
              desc: "We rely on real-time data from Lighthouse and other industry-standard APIs."
            },
            {
              icon: <ShieldCheck className="w-6 h-6 text-accent" />,
              title: "Security Focused",
              desc: "Identifying vulnerabilities and security headers to keep your users safe."
            },
            {
              icon: <Users className="w-6 h-6 text-accent" />,
              title: "User Centric",
              desc: "Improving the actual experience of your visitors, not just search bots."
            }
          ].map((feature, idx) => (
            <div key={idx} className={`p-6 rounded-xl border transition-all ${darkMode ? 'bg-slate-900/30 border-slate-800 hover:border-slate-700' : 'bg-card border-linesoft shadow-lg shadow-slate-200/50 hover:border-line'}`}>
              <div className="mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className={`text-sm ${darkMode ? "text-slate-400" : "text-muted"}`}>{feature.desc}</p>
            </div>
          ))}
        </div>

      </div>

      {/* Metric Calculation Documentation Section */}
      <div className="mt-16 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200 max-w-7xl w-full">
        <div className="text-center mb-10 px-4">
          <div className="inline-block mb-3 px-4 py-1.5 rounded-full bg-accentsoft text-accent text-sm font-semibold border border-[#ea580c]/20">
            Transparency Report
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#C2410C]">
            How We Score Your Site
          </h2>
          <p className={`max-w-2xl mx-auto text-lg ${darkMode ? "text-slate-400" : "text-muted"}`}>
            We analyze <span className="text-accent font-semibold">100+ data points</span> across 7 key categories to give you precise, actionable insights. Here's exactly how our algorithm works.
          </p>
        </div>

        <div className="space-y-8">

          {/* 1. Technical Performance */}
          <div className={`group p-8 rounded-3xl border transition-all duration-300 hover:shadow-2xl ${darkMode ? 'bg-slate-900/50 border-slate-800 hover:border-[#ea580c]/30 hover:bg-slate-900/80 backdrop-blur-xl' : 'bg-card border-linesoft shadow-xl shadow-slate-200/50 hover:border-[#ea580c]/30'}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#ea580c]/20 to-[#f97316]/20 text-accent shadow-inner">
                <Zap className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-semibold">1. Technical Performance</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${darkMode ? "bg-[#ea580c]/10 border-[#ea580c]/20 text-orange-400" : "bg-accentsoft border-[#ea580c]/20 text-accent"}`}>Core Web Vitals</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-muted"}`}>Weighted average of Google Lighthouse & CrUX real-user data.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: "LCP", sub: "Load Speed", weight: "25%", color: "text-accent" },
                { label: "TBT", sub: "Responsiveness", weight: "25%", color: "text-accent" },
                { label: "INP", sub: "Interactivity", weight: "15%", color: "text-accent" },
                { label: "FCP", sub: "First Paint", weight: "10%", color: "text-accent" },
                { label: "Speed Index", sub: "Visual Load", weight: "10%", color: "text-accent" },
                { label: "TTFB", sub: "Server Time", weight: "10%", color: "text-accent" },
                { label: "CLS", sub: "Stability", weight: "5%", color: "text-accent" },
              ].map((metric, i) => (
                <div key={i} className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 hover:scale-105 ${darkMode ? "bg-slate-950/40 border-slate-800 hover:border-slate-700" : "bg-cardsoft border-linesoft hover:border-[#ea580c]/30 hover:bg-accentsoft"}`}>
                  <div className={`text-2xl font-black mb-1 ${metric.color}`}>{metric.weight}</div>
                  <div className={`font-semibold text-sm mb-1 ${darkMode ? "text-slate-200" : "text-inksoft"}`}>{metric.label}</div>
                  <div className="text-xs opacity-60 font-medium">{metric.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. On-Page SEO */}
          <div className={`group p-8 rounded-3xl border transition-all duration-300 hover:shadow-2xl ${darkMode ? 'bg-slate-900/50 border-slate-800 hover:border-[#ea580c]/30 hover:bg-slate-900/80 backdrop-blur-xl' : 'bg-card border-linesoft shadow-xl shadow-slate-200/50 hover:border-[#ea580c]/30'}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#ea580c]/20 to-[#f97316]/20 text-accent shadow-inner">
                <Target className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-semibold">2. On-Page SEO</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${darkMode ? "bg-[#ea580c]/10 border-[#ea580c]/20 text-orange-400" : "bg-accentsoft border-[#ea580c]/20 text-accent"}`}>Rankability</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-muted"}`}>Analysis of content structure, meta tags, and semantic HTML.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Critical Tags", color: "from-[#EA580C] to-[#C2410C]", items: [
                    { name: "Title Tag Opt.", val: "12%" },
                    { name: "Meta Description", val: "9%" },
                    { name: "H1 Tag Usage", val: "9%" }
                  ]
                },
                {
                  title: "Content Quality", color: "from-[#F97316] to-[#EA580C]", items: [
                    { name: "Image Alt Text", val: "11%" },
                    { name: "Contextual Links", val: "9%" },
                    { name: "Duplicate Content", val: "9%" }
                  ]
                },
                {
                  title: "Technical Foundation", color: "from-[#EA580C] to-[#C2410C]", items: [
                    { name: "Canonical Tags", val: "8%" },
                    { name: "URL Structure", val: "6%" },
                    { name: "Heading Hierarchy", val: "6%" }
                  ]
                }
              ].map((group, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-950/30 border-slate-800" : "bg-cardsoft border-linesoft"}`}>
                  <h4 className={`text-sm font-semibold uppercase tracking-wider mb-4 bg-clip-text text-transparent bg-gradient-to-r ${group.color}`}>{group.title}</h4>
                  <ul className="space-y-3">
                    {group.items.map((item, i) => (
                      <li key={i} className="flex justify-between items-center text-sm">
                        <span className={darkMode ? "text-slate-300" : "text-muted"}>{item.name}</span>
                        <span className={`font-semibold px-2 py-0.5 rounded text-xs ${darkMode ? "bg-slate-800 text-slate-200" : "bg-card border text-inksoft shadow-sm"}`}>{item.val}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Accessibility & 4. Security */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Accessibility */}
            <div className={`p-8 rounded-3xl border transition-all duration-300 hover:shadow-2xl ${darkMode ? 'bg-slate-900/50 border-slate-800 hover:border-[#ea580c]/30' : 'bg-card border-linesoft shadow-xl shadow-slate-200/50 hover:border-[#ea580c]/30'}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-accentsoft text-accent">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">3. Accessibility</h3>
                  <div className="text-xs font-semibold tracking-wide text-accent uppercase mt-1">WCAG 2.1 Level AA</div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative pl-4 border-l-2 border-[#ea580c]/30">
                  <div className="text-sm font-semibold mb-2">High Impact (3 pts each)</div>
                  <div className={`text-sm leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                    Strict checks for Color Contrast, Focus Order, Labels, and Image Alt Text.
                  </div>
                </div>
                <div className="relative pl-4 border-l-2 border-[#ea580c]/10">
                  <div className="text-sm font-semibold mb-2 opacity-80">Medium Impact (2 pts each)</div>
                  <div className="flex flex-wrap gap-2">
                    {["Tab Index", "ARIA Roles", "ARIA Attr", "Hidden Focus"].map(tag => (
                      <span key={tag} className={`text-xs px-2 py-1 rounded border ${darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-cardsoft border-line text-muted"}`}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className={`p-8 rounded-3xl border transition-all duration-300 hover:shadow-2xl ${darkMode ? 'bg-slate-900/50 border-slate-800 hover:border-red-500/30' : 'bg-card border-linesoft shadow-xl shadow-slate-200/50 hover:border-red-200'}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">4. Security</h3>
                  <div className="text-xs font-semibold tracking-wide text-red-500 uppercase mt-1">Vulnerability Scan</div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative pl-4 border-l-2 border-red-500/30">
                  <div className="text-sm font-semibold mb-2">Critical Checks (5 pts each)</div>
                  <div className={`text-sm leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                    Detection of Malware, SQL Injection flaws, XSS vulnerabilities, and Weak Credential exposure.
                  </div>
                </div>
                <div className="relative pl-4 border-l-2 border-red-500/10">
                  <div className="text-sm font-semibold mb-2 opacity-80">Standard Checks (1-3 pts each)</div>
                  <div className="flex flex-wrap gap-2">
                    {["SSL Validity", "HSTS Header", "CSP Policy", "Secure Cookies", "MFA"].map(tag => (
                      <span key={tag} className={`text-xs px-2 py-1 rounded border ${darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-cardsoft border-line text-muted"}`}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. UX, 6. Conversion, 7. AIO Mix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* UX */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-card border-line shadow-lg'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accentsoft text-accent"><BarChart3 className="w-5 h-5" /></div>
                <h3 className="text-lg font-semibold">5. UX & Structure</h3>
              </div>
              <div className="space-y-3">
                {[
                  { l: "Tap Targets", r: "3 pts", c: "text-accent" },
                  { l: "Text Size", r: "3 pts", c: "text-accent" },
                  { l: "Mobile Viewport", r: "3 pts", c: "text-accent" },
                  { l: "Nav Depth", r: "2 pts", c: "text-ink" },
                ].map((x, i) => (
                  <div key={i} className={`flex justify-between items-center p-2 rounded-lg ${darkMode ? "bg-slate-800/50" : "bg-cardsoft"}`}>
                    <span className="text-sm font-medium">{x.l}</span>
                    <span className={`text-xs font-semibold uppercase ${x.c}`}>{x.r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-card border-line shadow-lg'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accentsoft text-accent"><Target className="w-5 h-5" /></div>
                <h3 className="text-lg font-semibold">6. Conversion</h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {["CTA Visibility", "Form Presence", "Trust Badges", "Contact Info"].map(x => (
                  <span key={x} className="px-2 py-1 text-xs font-semibold text-accent bg-accentsoft rounded-md border border-[#ea580c]/20">{x}</span>
                ))}
              </div>
              <p className={`text-sm ${darkMode ? "text-slate-400" : "text-muted"}`}>
                We verify that your site is built to convert visitors into leads with clear trust signals.
              </p>
            </div>

            {/* AIO */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-card border-line shadow-lg'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accentsoft text-accent"><Zap className="w-5 h-5" /></div>
                <h3 className="text-lg font-semibold">7. AI Readiness</h3>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#ea580c]/10 to-[#f97316]/5 border border-[#ea580c]/20 mb-3">
                <div className="text-xl font-black text-accent mb-1">~10%</div>
                <div className="text-xs uppercase font-semibold tracking-wider opacity-70">Structured Data Score</div>
              </div>
              <div className="space-y-1">
                {[
                  "Metadata Complete (2pt)", "API Access (2pt)", "Fast Load (2pt)",
                  "NLP Friendly (2pt)", "Entity Tagging (2pt)"
                ].map(item => (
                  <div key={item} className={`text-xs p-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>• {item}</div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
