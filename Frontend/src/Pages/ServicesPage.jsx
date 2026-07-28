import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext.jsx";
import {
  Layers,
  Gauge,
  Search,
  ShieldCheck,
  Sparkles,
  Accessibility,
  Target,
  FileText,
  ListChecks,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const SERVICES = [
  {
    icon: Search,
    title: "Full website check",
    desc: "One scan that covers every area below, so nothing is missed.",
    points: ["Runs on your live site", "No code to install", "Takes a few minutes"],
  },
  {
    icon: Gauge,
    title: "Speed check",
    desc: "We measure how long your pages take to open and what is slowing them down.",
    points: ["Loading time", "Heavy images and scripts", "Mobile and desktop"],
  },
  {
    icon: Layers,
    title: "SEO check",
    desc: "We check whether Google can find your pages and show them to the right people.",
    points: ["Page titles and descriptions", "Headings and links", "Broken pages"],
  },
  {
    icon: ShieldCheck,
    title: "Security check",
    desc: "We look for gaps that could put your site or your customers' details at risk.",
    points: ["SSL certificate", "Safety settings", "Known weak spots"],
  },
  {
    icon: Sparkles,
    title: "AI and answer check",
    desc: "We check whether AI tools and search engines can read, quote and answer from your site.",
    points: ["Structured data", "Clear answers on your pages", "Content AI can read"],
  },
  {
    icon: Accessibility,
    title: "Accessibility check",
    desc: "We check whether people with poor eyesight or other needs can use your site.",
    points: ["Colour and text size", "Keyboard use", "Image descriptions"],
  },
  {
    icon: Target,
    title: "Enquiry check",
    desc: "We check how easily a visitor can contact you, book, or buy.",
    points: ["Contact details", "Buttons and forms", "Trust signals"],
  },
  {
    icon: BarChart3,
    title: "Repeat checks",
    desc: "Run the audit again after your fixes and see the score move.",
    points: ["Compare with the last run", "Track each area", "Keep a history"],
  },
];

const DELIVERABLES = [
  {
    icon: BarChart3,
    title: "One score per area",
    desc: "You see at a glance which parts of your site are fine and which need work.",
  },
  {
    icon: ListChecks,
    title: "A fix list in order",
    desc: "Problems are sorted by importance, each with a plain-English explanation.",
  },
  {
    icon: FileText,
    title: "A PDF you can share",
    desc: "Download the report and pass it to your developer, agency or team.",
  },
];

const AUDIENCE = [
  {
    title: "Dealership owners and managers",
    desc: "Find out what is costing you enquiries, without needing a technical background.",
  },
  {
    title: "Automotive marketing teams",
    desc: "Show exactly what is wrong and what you are fixing, with the numbers behind it.",
  },
  {
    title: "The people who build your site",
    desc: "Skip the manual testing. Every check in one place, ready to work through.",
  },
];

export default function ServicesPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const cardClass = darkMode
    ? "bg-slate-900/40 border-slate-800"
    : "bg-card border-line shadow-lg shadow-slate-200/40";

  const muted = darkMode ? "text-slate-400" : "text-muted";

  return (
    <div
      className={`min-h-screen py-14 px-4 sm:px-6 lg:px-10 flex flex-col items-center relative font-sans ${
        darkMode ? "bg-[#0B1120] text-white" : "bg-surface text-ink"
      }`}
    >
      <div className={`absolute inset-0 ${darkMode ? "bg-grid-white/[0.02]" : "bg-grid-black/[0.02]"} pointer-events-none`} />

      <div className="relative z-10 w-full max-w-7xl mx-auto space-y-14">

        {/* Header */}
        <header className="text-center space-y-5 pt-4">
          <div
            className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border ${
              darkMode ? "bg-[#ea580c]/10 border-[#ea580c]/25 text-orange-400" : "bg-[#ea580c]/10 border-[#ea580c]/20 text-accent"
            }`}
          >
            <Layers size={28} />
          </div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
            Everything we{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] to-[#FB923C]">
              check for you
            </span>
          </h1>
          <p className={`text-base md:text-lg max-w-3xl mx-auto leading-relaxed ${muted}`}>
            We do the difficult testing in the background. You get one simple report that says
            what is working, what is not, and what to fix first. Made for dealership and
            automotive websites.
          </p>
        </header>

        {/* Services */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SERVICES.map(({ icon: Icon, title, desc, points }) => (
            <div
              key={title}
              className={`rounded-2xl border p-6 transition-all hover:border-[#ea580c]/40 ${cardClass}`}
            >
              <div className="w-11 h-11 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20 mb-4">
                <Icon size={19} />
              </div>
              <h3 className="font-semibold text-lg mb-1.5">{title}</h3>
              <p className={`text-sm leading-relaxed mb-4 ${muted}`}>{desc}</p>
              <ul className="space-y-1.5">
                {points.map((p) => (
                  <li key={p} className={`text-sm flex items-start gap-2 ${muted}`}>
                    <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${darkMode ? "bg-orange-400" : "bg-accent"}`} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* What you get */}
        <section className="space-y-7">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">What you get</h2>
            <p className={`text-base max-w-2xl mx-auto ${muted}`}>
              Every check ends up in the same easy report.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DELIVERABLES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className={`rounded-3xl border p-7 ${cardClass}`}>
                <div className="w-11 h-11 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20 mb-4">
                  <Icon size={19} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className={`text-sm leading-relaxed ${muted}`}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who it is for */}
        <section className="space-y-7">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Who it is for</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AUDIENCE.map(({ title, desc }) => (
              <div key={title} className={`rounded-3xl border p-7 ${cardClass}`}>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className={`text-sm leading-relaxed ${muted}`}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section
          className={`rounded-3xl border p-8 lg:p-12 text-center ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-card border-line shadow-lg shadow-slate-200/40"
          }`}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Try it on your own website</h2>
          <p className={`text-base max-w-xl mx-auto mb-7 ${muted}`}>
            Enter your web address and get your first report. No card needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-accent hover:bg-accenthover transition-colors text-white font-semibold"
            >
              Check my website
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/contact"
              className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border font-semibold transition-colors ${
                darkMode
                  ? "border-slate-700 text-slate-200 hover:border-slate-600"
                  : "border-line text-ink hover:border-[#ea580c]/40"
              }`}
            >
              Ask us a question
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
