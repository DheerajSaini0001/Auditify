import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Gavel, Mail } from "lucide-react";

const LAST_UPDATED = "28 July 2026";
const SUPPORT_EMAIL = "support@sltechsoft.com";

const SECTIONS = [
  { id: "use", title: "Using Site Audit" },
  { id: "account", title: "Your account" },
  { id: "fair", title: "Fair use" },
  { id: "report", title: "What the report is" },
  { id: "changes", title: "Scores can change" },
  { id: "content", title: "Your website stays yours" },
  { id: "availability", title: "Availability" },
  { id: "liability", title: "Our responsibility" },
  { id: "ending", title: "Ending your use" },
  { id: "updates", title: "Changes to these terms" },
  { id: "contact", title: "Contact us" },
];

export default function TermsOfServicePage() {
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
              darkMode ? "bg-[#F26419]/10 border-[#F26419]/25 text-orange-400" : "bg-[#F26419]/10 border-[#F26419]/20 text-accent"
            }`}
          >
            <Gavel size={28} />
          </div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
            Terms of{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F26419] to-[#F4874A]">use</span>
          </h1>
          <p className={`text-base md:text-lg max-w-3xl mx-auto leading-relaxed ${muted}`}>
            The rules for using Site Audit, in plain English. By using the service you agree to
            them. Last updated {LAST_UPDATED}.
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

              <Section id="use" title="Using Site Audit">
                <p>
                  Site Audit checks a website and gives you a report on it. You may use it on
                  websites you own, or on websites you have permission to test. Please do not run
                  checks on someone else's site without their agreement.
                </p>
                <p>You must be old enough to enter into a contract in your country to use the service.</p>
              </Section>

              <Divider />

              <Section id="account" title="Your account">
                <Bullets
                  items={[
                    "Give us a real email address — we send your sign-in codes and reports there.",
                    "Keep your password to yourself. Anything done from your account is treated as done by you.",
                    "Tell us straight away if you think someone else has got into your account.",
                    "We may suspend an account that is being used to break these rules.",
                  ]}
                />
              </Section>

              <Divider />

              <Section id="fair" title="Fair use">
                <p>
                  Each check uses real computing power on our side, so we ask you to use the
                  service sensibly.
                </p>
                <Bullets
                  items={[
                    "Do not run the same check over and over in quick succession.",
                    "Do not use scripts or bots to hammer the service, and do not try to get around our limits.",
                    "Do not try to break into, copy or resell the service.",
                  ]}
                />
                <p>
                  If you go over our limits you will be asked to wait a moment and try again.
                  Repeated abuse can get your access blocked. If you genuinely need to run a large
                  number of checks, talk to us first — we are happy to help.
                </p>
              </Section>

              <Divider />

              <Section id="report" title="What the report is">
                <p>
                  Your report is advice, not a promise. The checks are automated, and automated
                  checks are not perfect. Sometimes something is flagged that turns out to be
                  fine, and sometimes an issue is missed.
                </p>
                <p>
                  Please read the report as a starting point and use your own judgement before
                  making changes to your website. If a change is important, test it before it goes
                  live. We cannot promise that following the report will improve your search
                  ranking, your traffic or your sales.
                </p>
              </Section>

              <Divider />

              <Section id="changes" title="Scores can change">
                <p>
                  We keep improving how we score websites. That means a site scoring 99 today
                  might score lower after an update — not because your site got worse, but because
                  the check got stricter or more accurate.
                </p>
                <p>
                  Speed also depends on live conditions such as your server and network, so small
                  differences between two runs are normal. Treat scores as a health check over
                  time, not a fixed award.
                </p>
              </Section>

              <Divider />

              <Section id="content" title="Your website stays yours">
                <p>
                  Everything on your website remains yours. By running a check you give us
                  permission to open your pages, read them and analyse them so we can produce your
                  report — nothing more. We do not change anything on your site.
                </p>
                <p>
                  The report itself, and the software behind it, remain ours. You are free to
                  download your report, share it and act on it.
                </p>
              </Section>

              <Divider />

              <Section id="availability" title="Availability">
                <p>
                  We work hard to keep the service running, but we cannot promise it will always
                  be available. We may add features, change them, or take them away.
                </p>
                <p>
                  Full reports are removed automatically a few hours after a check finishes, so
                  download the PDF if you want to keep a copy. See our{" "}
                  <Link to="/privacy" className={darkMode ? "text-orange-400" : "text-accent"}>
                    privacy policy
                  </Link>{" "}
                  for how long we keep things.
                </p>
              </Section>

              <Divider />

              <Section id="liability" title="Our responsibility">
                <p>
                  The service is provided as it is. We are not responsible for losses that come
                  from decisions you make based on the report — for example, a change that breaks
                  a page, a drop in search ranking, or lost sales.
                </p>
                <p>
                  Nothing here removes any rights you have by law in your country that cannot be
                  signed away.
                </p>
              </Section>

              <Divider />

              <Section id="ending" title="Ending your use">
                <p>
                  You can stop using Site Audit at any time and ask us to delete your account. We
                  can suspend or close an account that breaks these rules, or that puts the
                  service or other users at risk. Where we reasonably can, we will tell you why.
                </p>
              </Section>

              <Divider />

              <Section id="updates" title="Changes to these terms">
                <p>
                  We may update these terms as the service changes. The date at the top always
                  shows the latest version, and continuing to use Site Audit means you accept the
                  updated terms.
                </p>
              </Section>

              <Divider />

              <Section id="contact" title="Contact us">
                <p>
                  If anything here is unclear, ask us before you agree to it. We reply within one
                  working day.
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
                  <div className="font-semibold text-lg">Not sure about something here?</div>
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
