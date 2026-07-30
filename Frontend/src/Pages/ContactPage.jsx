import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Mail, MapPin, MessagesSquare, Clock, BookOpen, LifeBuoy, ArrowRight } from "lucide-react";

const SUPPORT_EMAIL = "support@sltechsoft.com";

const TOPICS = [
  "I need help with my report",
  "I have a question before I buy",
  "Billing or invoice",
  "Something else",
];

export default function ContactPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const [form, setForm] = useState({ name: "", email: "", topic: TOPICS[0], message: "" });

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(form.topic);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const cardClass = darkMode
    ? "bg-slate-900/40 border-slate-800"
    : "bg-card border-line";

  const labelClass = `block text-sm font-semibold mb-2 ${darkMode ? "text-slate-300" : "text-ink"}`;

  const fieldClass = `w-full px-4 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 focus:ring-accent transition-all ${
    darkMode ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500" : "bg-card border-line text-ink placeholder-faint"
  }`;

  const contactItems = [
    {
      icon: Mail,
      title: "Email us",
      value: SUPPORT_EMAIL,
      href: `mailto:${SUPPORT_EMAIL}`,
      note: "Best way to reach us. We reply within 24 hours.",
    },
    {
      icon: MapPin,
      title: "Our office",
      value: "Success Ladder Technologies, India",
      note: "Mon to Fri, 10 AM to 7 PM (IST).",
    },
  ];

  return (
    <div
      className={`min-h-screen py-14 px-4 sm:px-6 lg:px-10 flex flex-col items-center relative font-sans ${
        darkMode ? "bg-[#0B1120] text-white" : "bg-surface text-ink"
      }`}
    >
      <div className={`absolute inset-0 ${darkMode ? "bg-grid-white/[0.02]" : "bg-grid-black/[0.02]"} pointer-events-none`} />

      <div className="relative z-10 w-full max-w-7xl mx-auto space-y-10">

        {/* Header — kept short so the form is visible right away */}
        <header className="text-center space-y-5 pt-4 pb-2">
          <div
            className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border ${
              darkMode ? "bg-[#ea580c]/10 border-[#ea580c]/25 text-orange-400" : "bg-[#ea580c]/10 border-[#ea580c]/20 text-accent"
            }`}
          >
            <MessagesSquare size={28} />
          </div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
            Talk to{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] to-[#FB923C]">our team</span>
          </h1>
          <p className={`text-base md:text-lg max-w-2xl mx-auto leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
            Have a question about your website report or our plans? Write to us and a real
            person will get back to you within one working day.
          </p>
        </header>

        {/* Main: info on the left, form on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">

          {/* Left: how to reach us */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`rounded-3xl border p-7 lg:p-8 shadow-xl ${cardClass}`}>
              <h2 className="text-2xl font-bold mb-2">How to reach us</h2>
              <p className={`text-sm mb-7 ${darkMode ? "text-slate-400" : "text-muted"}`}>
                Pick whatever is easiest for you.
              </p>

              <div className="space-y-6">
                {contactItems.map(({ icon: Icon, title, value, href, note }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20">
                      <Icon size={19} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold">{title}</div>
                      {href ? (
                        <a
                          href={href}
                          className={`text-sm break-words ${darkMode ? "text-orange-400 hover:text-orange-300" : "text-accent hover:underline"}`}
                        >
                          {value}
                        </a>
                      ) : (
                        <div className={`text-sm break-words ${darkMode ? "text-slate-300" : "text-ink"}`}>{value}</div>
                      )}
                      <div className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-muted"}`}>{note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Response time */}
            <div className={`rounded-3xl border p-6 flex items-start gap-4 ${cardClass}`}>
              <div className="w-11 h-11 shrink-0 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20">
                <Clock size={19} />
              </div>
              <div>
                <div className="font-semibold">We usually reply in 24 hours</div>
                <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>
                  Messages sent on a weekend are answered on Monday.
                </p>
              </div>
            </div>
          </div>

          {/* Right: message form */}
          <div className="lg:col-span-3">
            <div className={`rounded-3xl border p-7 lg:p-10 shadow-xl ${cardClass}`}>
              <h2 className="text-2xl font-bold mb-2">Send us a message</h2>
              <p className={`text-sm mb-7 ${darkMode ? "text-slate-400" : "text-muted"}`}>
                Fill this in and we will open your email app with the details ready to send.
              </p>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-name" className={labelClass}>Your name</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={update("name")}
                      placeholder="Jane Sharma"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className={labelClass}>Your email</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={update("email")}
                      placeholder="you@company.com"
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-topic" className={labelClass}>What is this about?</label>
                  <select
                    id="contact-topic"
                    value={form.topic}
                    onChange={update("topic")}
                    className={fieldClass}
                  >
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" className={labelClass}>Your message</label>
                  <textarea
                    id="contact-message"
                    rows="6"
                    required
                    value={form.message}
                    onChange={update("message")}
                    placeholder="Tell us what you need help with. If it is about a report, add your website address."
                    className={`${fieldClass} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-accent hover:bg-accenthover transition-colors text-white font-semibold"
                >
                  Send message
                  <ArrowRight size={18} />
                </button>

                <p className={`text-xs ${darkMode ? "text-slate-500" : "text-muted"}`}>
                  Prefer to write yourself? Email us at{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className={darkMode ? "text-orange-400" : "text-accent"}>
                    {SUPPORT_EMAIL}
                  </a>.
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* Quick help */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              icon: LifeBuoy,
              title: "Help centre",
              text: "Answers to the questions we get asked most.",
              to: "/help",
              action: "Browse help",
            },
            {
              icon: BookOpen,
              title: "Documentation",
              text: "Learn what each score in your report means.",
              to: "/documentation",
              action: "Read the docs",
            },
          ].map(({ icon: Icon, title, text, to, action }) => (
            <Link
              key={title}
              to={to}
              className={`rounded-3xl border p-7 flex items-start gap-4 transition-all hover:border-[#ea580c]/40 ${cardClass}`}
            >
              <div className="w-11 h-11 shrink-0 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20">
                <Icon size={19} />
              </div>
              <div>
                <div className="font-semibold">{title}</div>
                <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>{text}</p>
                <span className={`text-sm font-semibold mt-2 inline-flex items-center gap-1 ${darkMode ? "text-orange-400" : "text-accent"}`}>
                  {action} <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
