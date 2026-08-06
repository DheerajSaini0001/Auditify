import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Lock, Mail } from "lucide-react";

const LAST_UPDATED = "28 July 2026";
const SUPPORT_EMAIL = "support@sltechsoft.com";

const SECTIONS = [
  { id: "collect", title: "What we collect" },
  { id: "website", title: "The website you check" },
  { id: "keep", title: "How long we keep it" },
  { id: "share", title: "Who else sees it" },
  { id: "rights", title: "Your choices" },
  { id: "cookies", title: "Cookies" },
  { id: "contact", title: "Contact us" },
];

export default function PrivacyPolicyPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const cardClass = darkMode
    ? "bg-slate-900/40 border-slate-800"
    : "bg-card border-line shadow-lg shadow-slate-200/40";

  const muted = darkMode ? "text-slate-400" : "text-muted";
  const body = darkMode ? "text-slate-300" : "text-inksoft";

  const Section = ({ id, title, children }) => (
    <section id={id} className="scroll-mt-32 space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className={`space-y-4 text-base leading-relaxed ${body}`}>{children}</div>
    </section>
  );

  const Bullets = ({ items }) => (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${darkMode ? "bg-orange-400" : "bg-accent"}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );

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
              darkMode ? "bg-[#F26419]/10 border-[#F26419]/25 text-orange-400" : "bg-[#F26419]/10 border-[#F26419]/20 text-accent"
            }`}
          >
            <Lock size={28} />
          </div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
            Privacy{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F26419] to-[#F4874A]">policy</span>
          </h1>
          <p className={`text-base md:text-lg max-w-3xl mx-auto leading-relaxed ${muted}`}>
            What we collect, why we need it, and how long we keep it — written so you can
            actually read it. Last updated {LAST_UPDATED}.
          </p>
        </header>

        <div className="lg:flex gap-10 items-start">

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-28">
            <div className={`rounded-3xl border p-6 ${cardClass}`}>
              <div className={`text-xs font-semibold uppercase tracking-wide mb-4 ${darkMode ? "text-slate-500" : "text-faint"}`}>
                On this page
              </div>
              <ul className="space-y-3">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={`text-sm font-medium transition-colors ${
                        darkMode ? "text-slate-300 hover:text-orange-400" : "text-muted hover:text-accent"
                      }`}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-6">

            <div className={`rounded-3xl border p-8 lg:p-10 space-y-10 ${cardClass}`}>

              <Section id="collect" title="What we collect">
                <p>We only collect what we need to run your check and keep your account working.</p>
                <Bullets
                  items={[
                    "Your email address — to create your account, sign you in, and send your report. Guests are asked for an email before a check runs.",
                    "Your name, if you give one when you sign up.",
                    "The website addresses you ask us to check.",
                    "Basic visit details for each check: your IP address, the rough area it points to (country, state, city), your device, browser and screen size, and which page you came from.",
                  ]}
                />
                <p>
                  We use the visit details to stop misuse, fix problems, and understand how the
                  service is being used. We do not use them to build advertising profiles, and we
                  do not sell them.
                </p>
              </Section>

              <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-line"}`} />

              <Section id="website" title="The website you check">
                <p>
                  When you start a check, we open your website the same way a normal visitor's
                  browser does. We read the pages, look at the settings behind them, and score
                  what we find. We do not change, add or delete anything on your site.
                </p>
                <p>
                  The page content we download is used only to work out your scores. Once the
                  check is done, we keep the results — your scores and the list of problems — not
                  a copy of your whole website.
                </p>
                <p>
                  If you use the AI explanation feature, the parts of your report you are asking
                  about are sent to Google's AI service to write that explanation.
                </p>
              </Section>

              <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-line"}`} />

              <Section id="keep" title="How long we keep it">
                <Bullets
                  items={[
                    "Full reports are deleted automatically 24 hours after the check finishes. Download the PDF if you want to keep a copy.",
                    "A short record of each check — the address, the score and the date, along with the visit details listed above — stays in our logs.",
                    "Sign-in codes expire in 10 minutes. Password reset links expire in 1 hour.",
                    "Your account details are kept until you ask us to delete your account.",
                  ]}
                />
              </Section>

              <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-line"}`} />

              <Section id="share" title="Who else sees it">
                <p>We do not sell your information. A few trusted services help us run the checks:</p>
                <Bullets
                  items={[
                    "Google — for speed data, safety checks and business information used in your report, and for signing in with Google if you choose that option.",
                    "Google's AI service — only when you ask for an AI explanation of your report.",
                    "Google Analytics — to count visits and see which pages are used most.",
                    "Our email provider — to send sign-in codes, password resets and reports.",
                    "Our hosting provider — the servers your data sits on while the service runs.",
                  ]}
                />
                <p>
                  We may also share information if the law requires it, or to protect the service
                  from abuse.
                </p>
              </Section>

              <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-line"}`} />

              <Section id="rights" title="Your choices">
                <p>You are in control of your information. You can ask us to:</p>
                <Bullets
                  items={[
                    "Send you a copy of the information we hold about you.",
                    "Correct anything that is wrong.",
                    "Delete your account and the information linked to it.",
                  ]}
                />
                <p>
                  Write to us at{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className={darkMode ? "text-orange-400" : "text-accent"}>
                    {SUPPORT_EMAIL}
                  </a>{" "}
                  and we will handle it. If you are in a region with data protection laws such as
                  the GDPR or the CCPA, these rights apply to you by law and we follow them.
                </p>
                <p>
                  You can also tell us not to sell or share your information on our{" "}
                  <Link to="/do-not-sell" className={darkMode ? "text-orange-400" : "text-accent"}>
                    do not sell my information
                  </Link>{" "}
                  page.
                </p>
              </Section>

              <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-line"}`} />

              <Section id="cookies" title="Cookies">
                <p>
                  We save a few small items in your browser to keep you signed in, remember
                  settings such as light or dark mode, and count visits using Google Analytics.
                  Full details are on our{" "}
                  <Link to="/cookies" className={darkMode ? "text-orange-400" : "text-accent"}>
                    cookie policy
                  </Link>{" "}
                  page.
                </p>
              </Section>

              <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-line"}`} />

              <Section id="contact" title="Contact us">
                <p>
                  If anything here is unclear, or you want us to act on one of your rights, just
                  ask. We reply within one working day.
                </p>
              </Section>

            </div>

            {/* Contact card */}
            <div className={`rounded-3xl border p-7 flex flex-col sm:flex-row sm:items-center gap-5 justify-between ${cardClass}`}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-[#F26419]/10 flex items-center justify-center text-accent border border-[#F26419]/20">
                  <Mail size={19} />
                </div>
                <div>
                  <div className="font-semibold text-lg">Questions about your privacy?</div>
                  <p className={`text-sm mt-1 ${muted}`}>
                    Email {SUPPORT_EMAIL} or use the contact page.
                  </p>
                </div>
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-accent hover:bg-accenthover transition-colors text-white font-semibold whitespace-nowrap"
              >
                Contact us
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
