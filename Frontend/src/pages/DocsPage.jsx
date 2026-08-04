import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { SCORE_BANDS } from "../utils/statusColors.js";
import {
  BookOpen,
  Gauge,
  Search,
  Accessibility,
  Smartphone,
  ShieldCheck,
  Sparkles,
  MessageSquareText,
  Target,
  ArrowRight,
  LifeBuoy,
} from "lucide-react";

const STEPS = [
  {
    n: "1",
    title: "You enter your web address",
    desc: "Nothing to install and no changes are made to your website. We check dealership and automotive sites.",
  },
  {
    n: "2",
    title: "We open your site like a visitor",
    desc: "We load it as a mid-range phone on a normal 4G connection, because that is how most people see your site.",
  },
  {
    n: "3",
    title: "We find your other key pages",
    desc: "Along with the page you entered, we look for the important pages on your site and check those too.",
  },
  {
    n: "4",
    title: "You get scores and a fix list",
    desc: "Each area gets its own score, and every problem comes with a short note on what to do.",
  },
];

// What each band means, in plain language. Derived from SCORE_BANDS rather than
// restated, so this customer-facing table can never promise thresholds the app
// does not actually use — the previous hardcoded copy published three bands while
// the report rendered a different split.
const BAND_COPY = {
  excellent: "This area is in great shape. Keep an eye on it after big website changes.",
  good: "Solid, with a little room to tighten up. Worth a look when you have time.",
  needs_improvement: "Nothing is broken, but visitors or Google are being slowed down. Worth fixing soon.",
  poor: "This is costing you visitors or search traffic. Put it near the top of the list.",
  critical: "This is actively hurting your site or putting it at risk. Fix these items first.",
};

const BANDS = SCORE_BANDS.map((band, i) => {
  const upper = i === 0 ? 100 : SCORE_BANDS[i - 1].min - 1;
  return {
    range: `${band.min} – ${upper}`,
    label: band.label,
    desc: BAND_COPY[band.key],
    dot: band.solidBg,
    text: band.text,
  };
});

const AREAS = [
  {
    icon: Gauge,
    title: "Speed",
    what: "How long your pages take to open and become usable.",
    low: "A low score usually means heavy images, too many scripts, or a slow server.",
  },
  {
    icon: Search,
    title: "SEO",
    what: "Whether Google can find, read and rank your pages.",
    low: "A low score usually means missing page titles, weak descriptions, or broken links.",
  },
  {
    icon: Accessibility,
    title: "Accessibility",
    what: "Whether people with poor eyesight or other needs can use your site.",
    low: "A low score usually means faint text, tiny fonts, or images without descriptions.",
  },
  {
    icon: Smartphone,
    title: "Mobile and design",
    what: "Whether your site is comfortable to use on a phone.",
    low: "A low score usually means buttons that are too small or text that needs zooming.",
  },
  {
    icon: ShieldCheck,
    title: "Security",
    what: "Whether your site and your visitors' details are protected.",
    low: "A low score usually means a certificate problem or missing safety settings.",
  },
  {
    icon: Sparkles,
    title: "AI readiness",
    what: "Whether AI tools can read your site and mention your business.",
    low: "A low score usually means your pages do not describe your business in a way software understands.",
  },
  {
    icon: MessageSquareText,
    title: "Answers",
    what: "Whether your pages answer the questions people actually search for.",
    low: "A low score usually means long pages with no clear questions and answers.",
  },
  {
    icon: Target,
    title: "Enquiries",
    what: "Whether a visitor can easily contact you, book, or buy.",
    low: "A low score usually means hidden contact details or unclear buttons.",
  },
];

const FAQS = [
  {
    q: "Does the check change anything on my website?",
    a: "No. We only read your pages, exactly like a normal visitor. Nothing is edited, added or deleted.",
  },
  {
    q: "How long does one check take?",
    a: "A few minutes for most websites. Larger sites with many pages take a little longer.",
  },
  {
    q: "How often should I run it?",
    a: "Run it once now to see where you stand, again after your fixes, and then about once a month.",
  },
  {
    q: "Why did my score change without me doing anything?",
    a: "Speed depends on live conditions such as your server and network, so small changes between runs are normal. Big drops are worth looking into.",
  },
  {
    q: "Can I share the report with my developer?",
    a: "Yes. Download it as a PDF and send it on — every problem is written so anyone can follow it.",
  },
  {
    q: "Which page is checked?",
    a: "The page you enter, plus the other important pages we find on your site.",
  },
];

export default function DocsPage() {
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
              darkMode ? "bg-[#F26419]/10 border-[#F26419]/25 text-orange-400" : "bg-[#F26419]/10 border-[#F26419]/20 text-accent"
            }`}
          >
            <BookOpen size={28} />
          </div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
            How your report{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F26419] to-[#F4874A]">works</span>
          </h1>
          <p className={`text-base md:text-lg max-w-3xl mx-auto leading-relaxed ${muted}`}>
            A short guide to what we check, what the numbers mean, and what to do with them.
            No technical background needed.
          </p>
        </header>

        {/* How a check runs */}
        <section className="space-y-7">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">How a check runs</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className={`rounded-2xl border p-6 ${cardClass}`}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4 ${
                    darkMode ? "bg-[#F26419]/15 text-orange-400" : "bg-[#F26419]/10 text-accent"
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

        {/* Score meaning */}
        <section className="space-y-7">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">What your score means</h2>
            <p className={`text-base max-w-2xl mx-auto ${muted}`}>
              Every area is scored out of 100. Your overall score is the picture across all areas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BANDS.map(({ range, label, desc, dot, text }) => (
              <div key={label} className={`rounded-3xl border p-7 ${cardClass}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-3 h-3 rounded-full ${dot}`} />
                  <span className={`font-bold text-lg ${text}`}>{label}</span>
                </div>
                <div className="text-3xl font-black mb-3">{range}</div>
                <p className={`text-sm leading-relaxed ${muted}`}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The areas */}
        <section className="space-y-7">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">The eight areas</h2>
            <p className={`text-base max-w-2xl mx-auto ${muted}`}>
              What each one looks at, and what a low score usually points to.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AREAS.map(({ icon: Icon, title, what, low }) => (
              <div key={title} className={`rounded-2xl border p-6 ${cardClass}`}>
                <div className="w-11 h-11 rounded-xl bg-[#F26419]/10 flex items-center justify-center text-accent border border-[#F26419]/20 mb-4">
                  <Icon size={19} />
                </div>
                <h3 className="font-semibold text-lg mb-1.5">{title}</h3>
                <p className={`text-sm leading-relaxed mb-3 ${muted}`}>{what}</p>
                <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-300" : "text-inksoft"}`}>{low}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-7">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Good to know</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FAQS.map(({ q, a }) => (
              <div key={q} className={`rounded-2xl border p-6 ${cardClass}`}>
                <h3 className="font-semibold text-base mb-2">{q}</h3>
                <p className={`text-sm leading-relaxed ${muted}`}>{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Next steps */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/help"
            className={`rounded-3xl border p-7 flex items-start gap-4 transition-all hover:border-[#F26419]/40 ${cardClass}`}
          >
            <div className="w-11 h-11 shrink-0 rounded-xl bg-[#F26419]/10 flex items-center justify-center text-accent border border-[#F26419]/20">
              <LifeBuoy size={19} />
            </div>
            <div>
              <div className="font-semibold text-lg">Still stuck?</div>
              <p className={`text-sm mt-1 ${muted}`}>Visit the help centre for step-by-step answers.</p>
              <span className={`text-sm font-semibold mt-2 inline-flex items-center gap-1 ${darkMode ? "text-orange-400" : "text-accent"}`}>
                Browse help <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <Link
            to="/contact"
            className={`rounded-3xl border p-7 flex items-start gap-4 transition-all hover:border-[#F26419]/40 ${cardClass}`}
          >
            <div className="w-11 h-11 shrink-0 rounded-xl bg-[#F26419]/10 flex items-center justify-center text-accent border border-[#F26419]/20">
              <MessageSquareText size={19} />
            </div>
            <div>
              <div className="font-semibold text-lg">Ask a person</div>
              <p className={`text-sm mt-1 ${muted}`}>Send us your question and we reply within a working day.</p>
              <span className={`text-sm font-semibold mt-2 inline-flex items-center gap-1 ${darkMode ? "text-orange-400" : "text-accent"}`}>
                Contact us <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        </section>

      </div>
    </div>
  );
}
