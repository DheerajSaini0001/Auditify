import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Cookie, KeyRound, Settings2, BarChart3, Mail } from "lucide-react";

const LAST_UPDATED = "28 July 2026";
const SUPPORT_EMAIL = "support@sltechsoft.com";

const GROUPS = [
  {
    id: "needed",
    icon: KeyRound,
    title: "Needed to run the site",
    intro:
      "Without these you cannot sign in or open your report. They cannot be switched off while you use the service.",
    rows: [
      { name: "Sign-in token", does: "Keeps you signed in as you move between pages.", life: "Until you sign out or clear your browser" },
      { name: "Guest pass", does: "Lets you open the report you just ran without an account.", life: "Until you clear your browser" },
      { name: "Sign-in session", does: "Used while you sign in with Google, to complete the login safely.", life: "Ends with your browser session" },
    ],
  },
  {
    id: "settings",
    icon: Settings2,
    title: "Your settings",
    intro: "Small notes so the site behaves the way you left it.",
    rows: [
      { name: "Light or dark mode", does: "Remembers the look you chose.", life: "Until you change it" },
      { name: "Starred websites", does: "Remembers the sites you marked on your dashboard.", life: "Until you remove them" },
      { name: "Last report opened", does: "Takes you back to the report you were reading.", life: "Cleared when you close the tab" },
    ],
  },
  {
    id: "measure",
    icon: BarChart3,
    title: "Measuring how the site is used",
    intro:
      "We use Google Analytics and Google Tag Manager to count visits and see which pages people use. This tells us what to improve. It does not tell us who you are.",
    rows: [
      { name: "_ga and related Google Analytics cookies", does: "Counts visits and shows which pages are popular.", life: "Up to 2 years" },
    ],
  },
];

export default function CookiesPolicyPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const cardClass = darkMode
    ? "bg-slate-900/40 border-slate-800"
    : "bg-card border-line shadow-lg shadow-slate-200/40";

  const muted = darkMode ? "text-slate-400" : "text-muted";
  const body = darkMode ? "text-slate-300" : "text-inksoft";

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
            <Cookie size={28} />
          </div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
            Cookie{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] to-[#FB923C]">policy</span>
          </h1>
          <p className={`text-base md:text-lg max-w-3xl mx-auto leading-relaxed ${muted}`}>
            What we save in your browser, why we save it, and how to clear it.
            Last updated {LAST_UPDATED}.
          </p>
        </header>

        {/* What a cookie is */}
        <section className={`rounded-3xl border p-8 lg:p-10 ${cardClass}`}>
          <h2 className="text-2xl font-bold mb-4">In short</h2>
          <div className={`space-y-4 text-base leading-relaxed ${body}`}>
            <p>
              A cookie is a small note a website leaves in your browser so it can remember
              something the next time you visit. We also use two similar tools built into your
              browser, called local storage and session storage, for the same purpose.
            </p>
            <p>
              We use them to keep you signed in, to remember your settings, and to count visits.
              We do not use them to follow you around other websites, and we do not sell what
              they hold.
            </p>
          </div>
        </section>

        {/* Groups */}
        <section className="space-y-6">
          {GROUPS.map(({ id, icon: Icon, title, intro, rows }) => (
            <div key={id} className={`rounded-3xl border p-8 lg:p-10 ${cardClass}`}>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20">
                  <Icon size={19} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{title}</h2>
                  <p className={`text-sm mt-1.5 max-w-3xl leading-relaxed ${muted}`}>{intro}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-slate-500" : "text-faint"}`}>
                      <th className="pb-3 pr-6 font-semibold w-1/4">What it is</th>
                      <th className="pb-3 pr-6 font-semibold w-2/4">What it does</th>
                      <th className="pb-3 font-semibold w-1/4">How long it stays</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.name} className={`border-t ${darkMode ? "border-slate-800" : "border-line"}`}>
                        <td className={`py-4 pr-6 align-top font-semibold text-sm ${darkMode ? "text-slate-200" : "text-ink"}`}>
                          {r.name}
                        </td>
                        <td className={`py-4 pr-6 align-top text-sm leading-relaxed ${muted}`}>{r.does}</td>
                        <td className={`py-4 align-top text-sm leading-relaxed ${muted}`}>{r.life}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>

        {/* Control */}
        <section className={`rounded-3xl border p-8 lg:p-10 ${cardClass}`}>
          <h2 className="text-2xl font-bold mb-4">How to clear or block them</h2>
          <div className={`space-y-4 text-base leading-relaxed ${body}`}>
            <p>
              Every browser lets you see what a site has saved and delete it — usually under
              Settings, then Privacy. You can also block cookies completely, or use a private
              window so everything is cleared when you close it.
            </p>
            <p>
              One thing to know: if you block the items in the first group, you will not be able
              to stay signed in or open your report, because the site has no way to remember you.
            </p>
            <p>
              For the measuring group, you can also install Google's own opt-out add-on for your
              browser, or turn on your browser's tracking protection.
            </p>
          </div>
        </section>

        {/* Related pages */}
        <section className={`rounded-3xl border p-7 flex flex-col sm:flex-row sm:items-center gap-5 justify-between ${cardClass}`}>
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20">
              <Mail size={19} />
            </div>
            <div>
              <div className="font-semibold text-lg">Questions about what we store?</div>
              <p className={`text-sm mt-1 ${muted}`}>
                Email {SUPPORT_EMAIL}, or read our{" "}
                <Link to="/privacy" className={darkMode ? "text-orange-400" : "text-accent"}>
                  privacy policy
                </Link>{" "}
                for the full picture.
              </p>
            </div>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-accent hover:bg-accenthover transition-colors text-white font-semibold whitespace-nowrap"
          >
            Contact us
          </Link>
        </section>

      </div>
    </div>
  );
}
