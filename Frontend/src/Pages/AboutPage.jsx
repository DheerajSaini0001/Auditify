import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext.jsx";
import {
  Gauge,
  Search,
  Accessibility,
  Smartphone,
  ShieldCheck,
  Sparkles,
  MessageSquareText,
  Target,
  Info,
  ArrowRight,
} from "lucide-react";

const CHECKS = [
  {
    icon: Gauge,
    title: "Speed",
    desc: "How quickly your pages open for a real visitor.",
  },
  {
    icon: Search,
    title: "SEO",
    desc: "Whether Google can find, read and rank your pages.",
  },
  {
    icon: Accessibility,
    title: "Accessibility",
    desc: "Whether people with poor eyesight or other needs can use your site.",
  },
  {
    icon: Smartphone,
    title: "Mobile & design",
    desc: "Whether your site is easy to use on a phone.",
  },
  {
    icon: ShieldCheck,
    title: "Security",
    desc: "Whether your site and your visitors' details are safe.",
  },
  {
    icon: Sparkles,
    title: "AI readiness",
    desc: "Whether AI tools like ChatGPT can read and mention your site.",
  },
  {
    icon: MessageSquareText,
    title: "Answers",
    desc: "Whether your pages answer the questions people actually ask.",
  },
  {
    icon: Target,
    title: "Enquiries",
    desc: "Whether visitors can easily call, message or buy from you.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Enter your website",
    desc: "Just paste your web address. No setup, no code to install.",
  },
  {
    n: "2",
    title: "We check it",
    desc: "We open your site the way a visitor does and run every check.",
  },
  {
    n: "3",
    title: "You get a report",
    desc: "A score for each area, plus a clear list of what to fix first.",
  },
];

const VALUES = [
  {
    title: "Real numbers, not guesses",
    desc: "Every score comes from an actual test on your live website.",
  },
  {
    title: "Plain English",
    desc: "We explain each problem in words anyone on your team can follow.",
  },
  {
    title: "Built for dealerships",
    desc: "We check dealer and automotive websites, so the report knows what your pages are for.",
  },
];

export default function AboutPage() {
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
            <Info size={28} />
          </div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
            We check your website,{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] to-[#FB923C]">
              you get a clear plan
            </span>
          </h1>
          <p className={`text-base md:text-lg max-w-3xl mx-auto leading-relaxed ${muted}`}>
            Most website reports are full of technical words that nobody outside the tech team
            understands. We built Site Audit to fix that: one simple report that tells you what is
            wrong, why it matters, and what to do next — made for dealership and automotive
            websites.
          </p>
        </header>

        {/* Why we exist + quick facts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 rounded-3xl border p-8 lg:p-10 flex flex-col justify-center ${cardClass}`}>
            <h2 className="text-2xl font-bold mb-4">Why we built this</h2>
            <div className={`space-y-4 text-base leading-relaxed ${muted}`}>
              <p>
                A slow page, a broken link or a missing security setting quietly costs you
                customers every day. Most owners never find out, because the tools that spot these
                problems are made for developers.
              </p>
              <p>
                Site Audit runs the same deep checks, then writes the results the way a person
                would explain them to you. You see your score, the problems in order of importance,
                and the exact step to fix each one — no jargon in between.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-6">
            {[
              { big: "8", small: "areas checked on every website" },
              { big: "100+", small: "individual checks behind your score" },
              { big: "1", small: "simple report, written in plain English" },
            ].map(({ big, small }) => (
              <div key={small} className={`rounded-3xl border p-6 ${cardClass}`}>
                <div className={`text-4xl font-black mb-1 ${darkMode ? "text-orange-400" : "text-accent"}`}>{big}</div>
                <div className={`text-sm ${muted}`}>{small}</div>
              </div>
            ))}
          </div>
        </section>

        {/* What we check */}
        <section className="space-y-7">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">What we check</h2>
            <p className={`text-base max-w-2xl mx-auto ${muted}`}>
              Eight areas, each with its own score in your report.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CHECKS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className={`rounded-2xl border p-6 transition-all hover:border-[#ea580c]/40 ${cardClass}`}
              >
                <div className="w-11 h-11 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20 mb-4">
                  <Icon size={19} />
                </div>
                <h3 className="font-semibold text-lg mb-1.5">{title}</h3>
                <p className={`text-sm leading-relaxed ${muted}`}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-7">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className={`text-base max-w-2xl mx-auto ${muted}`}>Three steps, a few minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className={`rounded-3xl border p-7 ${cardClass}`}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4 ${
                    darkMode ? "bg-[#ea580c]/15 text-orange-400" : "bg-[#ea580c]/10 text-accent"
                  }`}
                >
                  {n}
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className={`text-sm leading-relaxed ${muted}`}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What we believe */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VALUES.map(({ title, desc }) => (
            <div key={title} className={`rounded-3xl border p-7 ${cardClass}`}>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className={`text-sm leading-relaxed ${muted}`}>{desc}</p>
            </div>
          ))}
        </section>

        {/* Call to action */}
        <section
          className={`rounded-3xl border p-8 lg:p-12 text-center ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-card border-line shadow-lg shadow-slate-200/40"
          }`}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-3">See how your website is doing</h2>
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
              Talk to us first
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
