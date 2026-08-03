import React, { useContext, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext.jsx";
import {
  HeartHandshake,
  Plus,
  Minus,
  Search,
  BookOpen,
  MessageSquareText,
  Mail,
  ArrowRight,
} from "lucide-react";

const SUPPORT_EMAIL = "support@sltechsoft.com";

const CATEGORIES = ["Getting started", "Your report", "Fixing problems", "Account"];

const FAQS = [
  {
    id: 1,
    cat: "Getting started",
    q: "How do I check my website?",
    a: "Paste your web address on the home page and press start. That is all — nothing to install and no changes are made to your site.",
  },
  {
    id: 2,
    cat: "Getting started",
    q: "How long does a check take?",
    a: "A few minutes for most websites. Larger sites with many pages take a little longer. You can leave the page open while it runs.",
  },
  {
    id: 3,
    cat: "Getting started",
    q: "Do I need an account?",
    a: "You can run a check without one and see a preview of your score. Create a free account to open the full report with every score and fix.",
  },
  {
    id: 4,
    cat: "Getting started",
    q: "Which pages get checked?",
    a: "The page you enter, plus the other important pages we find on your site, such as your contact and service pages.",
  },
  {
    id: 16,
    cat: "Getting started",
    q: "Which websites can be checked?",
    a: "Site Audit is built for dealership and automotive websites, including manufacturer and corporate sites. If you enter a website outside that, the check will not run and we will tell you why.",
  },
  {
    id: 5,
    cat: "Your report",
    q: "What does my score mean?",
    a: "Every area is scored out of 100. 90 and above is good, 50 to 89 needs work, and below 50 should be fixed first.",
  },
  {
    id: 6,
    cat: "Your report",
    q: "Where do I start if lots of things are red?",
    a: "Start at the top of the fix list. It is already sorted, so the first items are the ones costing you the most visitors.",
  },
  {
    id: 7,
    cat: "Your report",
    q: "Can I download or share the report?",
    a: "Yes. Download it as a PDF and send it to your developer, agency or team. Every problem is written in plain English.",
  },
  {
    id: 8,
    cat: "Your report",
    q: "Why did my score change on its own?",
    a: "Speed depends on live conditions such as your server and your visitors' network, so small differences between runs are normal. A large drop is worth looking into.",
  },
  {
    id: 9,
    cat: "Fixing problems",
    q: "The check could not open my website. What now?",
    a: "This usually means your site is offline, the address has a typo, or your security service is blocking automated visits. Check the address first, then ask your hosting provider to allow our checker.",
  },
  {
    id: 10,
    cat: "Fixing problems",
    q: "My site is fine on my computer but the speed score is low.",
    a: "We test as a mid-range phone on a normal 4G connection, not on office broadband. That is closer to how most of your visitors see the site.",
  },
  {
    id: 11,
    cat: "Fixing problems",
    q: "I fixed something but the score is the same.",
    a: "Run the check again — scores only update on a new run. If it still has not moved, the change may not be live yet, or a cache may still be serving the old page.",
  },
  {
    id: 12,
    cat: "Fixing problems",
    q: "Do I need a developer to fix these?",
    a: "Some items, like adding contact details or better page titles, you can do yourself. Others need your developer — the PDF is written so you can hand it straight over.",
  },
  {
    id: 13,
    cat: "Account",
    q: "How do I reset my password?",
    a: "Use the 'Forgot password' link on the login page. We will email you a link to set a new one.",
  },
  {
    id: 14,
    cat: "Account",
    q: "Can I see my earlier reports?",
    a: "Your recent checks appear in your audit history. Full reports are removed automatically after a few hours, so download the PDF if you want to keep one.",
  },
  {
    id: 15,
    cat: "Account",
    q: "How do I get in touch with a person?",
    a: "Write to us on the contact page or email us directly. We reply within one working day.",
  },
];

export default function HelpCenterPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const [openFaq, setOpenFaq] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const cardClass = darkMode
    ? "bg-slate-900/40 border-slate-800"
    : "bg-card border-line shadow-lg shadow-slate-200/40";

  const muted = darkMode ? "text-slate-400" : "text-muted";

  const visibleFaqs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return FAQS.filter((f) => {
      const matchesCategory = category === "All" || f.cat === category;
      const matchesSearch =
        !term || f.q.toLowerCase().includes(term) || f.a.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  return (
    <div
      className={`min-h-screen py-14 px-4 sm:px-6 lg:px-10 flex flex-col items-center relative font-sans ${
        darkMode ? "bg-[#0B1120] text-white" : "bg-surface text-ink"
      }`}
    >
      <div className={`absolute inset-0 ${darkMode ? "bg-grid-white/[0.02]" : "bg-grid-black/[0.02]"} pointer-events-none`} />

      <div className="relative z-10 w-full max-w-7xl mx-auto space-y-12">

        {/* Header */}
        <header className="text-center space-y-5 pt-4">
          <div
            className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border ${
              darkMode ? "bg-[#ea580c]/10 border-[#ea580c]/25 text-orange-400" : "bg-[#ea580c]/10 border-[#ea580c]/20 text-accent"
            }`}
          >
            <HeartHandshake size={28} />
          </div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
            How can we{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] to-[#FB923C]">help?</span>
          </h1>
          <p className={`text-base md:text-lg max-w-2xl mx-auto leading-relaxed ${muted}`}>
            Answers to the questions we get asked most. Search below, or write to us and a real
            person will reply.
          </p>
        </header>

        {/* Search + categories */}
        <section className="space-y-5">
          <div className="relative max-w-2xl mx-auto">
            <Search
              size={19}
              className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? "text-slate-500" : "text-faint"}`}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for an answer, for example 'password' or 'speed'"
              className={`w-full pl-12 pr-4 py-4 rounded-2xl border text-base focus:outline-none focus:ring-2 focus:ring-accent transition-all ${
                darkMode
                  ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                  : "bg-card border-line text-ink placeholder-faint"
              }`}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2.5">
            {["All", ...CATEGORIES].map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
                    active
                      ? "bg-accent border-accent text-white"
                      : darkMode
                      ? "bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700"
                      : "bg-card border-line text-ink hover:border-[#ea580c]/40"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </section>

        {/* Questions */}
        <section>
          {visibleFaqs.length === 0 ? (
            <div className={`rounded-3xl border p-10 text-center ${cardClass}`}>
              <h3 className="text-xl font-semibold mb-2">No answer matched your search</h3>
              <p className={`text-sm mb-6 ${muted}`}>
                Try a different word, or ask us directly — we are happy to help.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-accent hover:bg-accenthover transition-colors text-white font-semibold"
              >
                Ask us your question
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {visibleFaqs.map((faq) => {
                const open = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl border transition-all ${cardClass} ${
                      open ? "border-[#ea580c]/40" : "hover:border-[#ea580c]/25"
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(open ? null : faq.id)}
                      aria-expanded={open}
                      className="w-full flex items-center justify-between gap-4 p-6 text-left"
                    >
                      <span>
                        <span className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? "text-slate-500" : "text-faint"}`}>
                          {faq.cat}
                        </span>
                        <span className={`text-lg font-semibold ${open ? "text-accent" : ""}`}>{faq.q}</span>
                      </span>
                      <span
                        className={`shrink-0 p-2 rounded-full transition-colors ${
                          open ? "bg-accent text-white" : darkMode ? "bg-slate-800 text-slate-400" : "bg-cardsoft text-muted"
                        }`}
                      >
                        {open ? <Minus size={18} /> : <Plus size={18} />}
                      </span>
                    </button>

                    <div
                      className={`grid transition-all duration-300 ease-in-out px-6 ${
                        open ? "grid-rows-[1fr] opacity-100 pb-6" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className={`leading-relaxed ${muted}`}>{faq.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Still need help */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/contact"
            className={`rounded-3xl border p-7 flex items-start gap-4 transition-all hover:border-[#ea580c]/40 ${cardClass}`}
          >
            <div className="w-11 h-11 shrink-0 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20">
              <MessageSquareText size={19} />
            </div>
            <div>
              <div className="font-semibold text-lg">Message us</div>
              <p className={`text-sm mt-1 ${muted}`}>Send your question and we reply within a working day.</p>
              <span className={`text-sm font-semibold mt-2 inline-flex items-center gap-1 ${darkMode ? "text-orange-400" : "text-accent"}`}>
                Contact us <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <Link
            to="/documentation"
            className={`rounded-3xl border p-7 flex items-start gap-4 transition-all hover:border-[#ea580c]/40 ${cardClass}`}
          >
            <div className="w-11 h-11 shrink-0 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20">
              <BookOpen size={19} />
            </div>
            <div>
              <div className="font-semibold text-lg">Read the guide</div>
              <p className={`text-sm mt-1 ${muted}`}>Learn what each score in your report means.</p>
              <span className={`text-sm font-semibold mt-2 inline-flex items-center gap-1 ${darkMode ? "text-orange-400" : "text-accent"}`}>
                Open the guide <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className={`rounded-3xl border p-7 flex items-start gap-4 transition-all hover:border-[#ea580c]/40 ${cardClass}`}
          >
            <div className="w-11 h-11 shrink-0 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20">
              <Mail size={19} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-lg">Email us</div>
              <p className={`text-sm mt-1 ${muted}`}>Prefer email? Write to us directly.</p>
              <span className={`text-sm font-semibold mt-2 inline-flex items-center gap-1 break-words ${darkMode ? "text-orange-400" : "text-accent"}`}>
                {SUPPORT_EMAIL}
              </span>
            </div>
          </a>
        </section>

      </div>
    </div>
  );
}
