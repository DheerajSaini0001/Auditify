import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { ShieldOff, Mail } from "lucide-react";

const LAST_UPDATED = "28 July 2026";
const SUPPORT_EMAIL = "support@sltechsoft.com";
const REQUEST_SUBJECT = "Do not sell or share my information";

const SECTIONS = [
  { id: "short", title: "The short answer" },
  { id: "collect", title: "What we hold about you" },
  { id: "analytics", title: "The one exception" },
  { id: "ask", title: "How to tell us" },
  { id: "next", title: "What happens next" },
  { id: "rights", title: "Your other rights" },
];

export default function DoNotSellInfoPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const cardClass = darkMode
    ? "bg-slate-900/40 border-slate-800"
    : "bg-card border-line shadow-lg shadow-slate-200/40";

  const muted = darkMode ? "text-slate-400" : "text-muted";
  const body = darkMode ? "text-slate-300" : "text-inksoft";

  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(REQUEST_SUBJECT)}`;

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

  const Divider = () => <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-line"}`} />;

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
            <ShieldOff size={28} />
          </div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
            Do not sell or share{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] to-[#FB923C]">
              my information
            </span>
          </h1>
          <p className={`text-base md:text-lg max-w-3xl mx-auto leading-relaxed ${muted}`}>
            California law gives you the right to say no. Here is what we hold, what we do with
            it, and how to tell us to stop. Last updated {LAST_UPDATED}.
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

              <Section id="short" title="The short answer">
                <p>
                  We do not sell your personal information, and we never have. We do not pass it
                  to data brokers, advertising networks or marketing lists.
                </p>
                <p>
                  California law uses a wide meaning of "sell" and "share" — it can include
                  passing information to another company even when no money changes hands. So
                  that you are not left guessing, the rest of this page explains exactly where
                  your information goes.
                </p>
              </Section>

              <Divider />

              <Section id="collect" title="What we hold about you">
                <Bullets
                  items={[
                    "Your email address, and your name if you gave one.",
                    "The website addresses you asked us to check, and the scores from those checks.",
                    "Basic visit details: your IP address, the rough area it points to, your device and browser.",
                  ]}
                />
                <p>
                  We do not follow you around other websites and we do not build advertising
                  profiles. The full picture is in our{" "}
                  <Link to="/privacy" className={darkMode ? "text-orange-400" : "text-accent"}>
                    privacy policy
                  </Link>
                  .
                </p>
              </Section>

              <Divider />

              <Section id="analytics" title="The one exception worth knowing">
                <p>
                  We use Google Analytics to count visits and see which pages people use, so we
                  know what to improve. Under California law, passing information to an analytics
                  provider like this can count as "sharing", even though we get no money for it
                  and it is not used to advertise to you.
                </p>
                <p>
                  If you would rather we did not, send us the request at the bottom of this page
                  and we will exclude you. You can also stop it yourself right now by turning on your
                  browser's tracking protection, using a private window, or installing Google's
                  own opt-out add-on. See our{" "}
                  <Link to="/cookies" className={darkMode ? "text-orange-400" : "text-accent"}>
                    cookie policy
                  </Link>{" "}
                  for the details.
                </p>
              </Section>

              <Divider />

              <Section id="ask" title="How to tell us">
                <p>
                  There is no form to fill in and no account needed. Send us one email and we will
                  do the rest:
                </p>
                <Bullets
                  items={[
                    `Email ${SUPPORT_EMAIL} with the subject "${REQUEST_SUBJECT}".`,
                    "Tell us the email address you use with us, so we can find your record.",
                    "Or send the same request from our contact page — either way reaches us.",
                  ]}
                />
                <p>
                  You can also ask on behalf of someone else if you are allowed to act for them.
                  Just say so in the message.
                </p>
              </Section>

              <Divider />

              <Section id="next" title="What happens next">
                <p>
                  We may need to check that the request really came from you — usually by replying
                  to the email address on your account. We will not ask for documents or anything
                  sensitive.
                </p>
                <p>
                  We aim to reply within one working day, and to complete the request within 45
                  days at the very latest. If we genuinely need longer, we will write and tell you
                  why.
                </p>
                <p>
                  Making this request costs nothing and will not change the service you get. We
                  will not treat you differently for asking.
                </p>
              </Section>

              <Divider />

              <Section id="rights" title="Your other rights">
                <p>You can also ask us at any time to:</p>
                <Bullets
                  items={[
                    "Send you a copy of the information we hold about you.",
                    "Correct anything that is wrong.",
                    "Delete your account and the information linked to it.",
                  ]}
                />
                <p>
                  These apply whether you are in California, under the GDPR in Europe, or
                  anywhere else — we handle every request the same way.
                </p>
              </Section>

            </div>

            {/* Action card */}
            <div className={`rounded-3xl border p-7 flex flex-col sm:flex-row sm:items-center gap-5 justify-between ${cardClass}`}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20">
                  <Mail size={19} />
                </div>
                <div>
                  <div className="font-semibold text-lg">Ready to send your request?</div>
                  <p className={`text-sm mt-1 ${muted}`}>
                    We will open your email app with the subject already filled in.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={mailtoHref}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-accent hover:bg-accenthover transition-colors text-white font-semibold whitespace-nowrap"
                >
                  Email my request
                </a>
                <Link
                  to="/contact"
                  className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border font-semibold transition-colors whitespace-nowrap ${
                    darkMode
                      ? "border-slate-700 text-slate-200 hover:border-slate-600"
                      : "border-line text-ink hover:border-[#ea580c]/40"
                  }`}
                >
                  Use the contact page
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
