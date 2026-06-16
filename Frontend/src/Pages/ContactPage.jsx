import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Mail, MapPin, MessagesSquare, Phone, Twitter, Github, Linkedin, Facebook } from "lucide-react";
import PageHeader from "../Component/PageHeader";

export default function ContactPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const containerClass = darkMode
    ? "min-h-screen py-14 px-4 sm:px-8 flex flex-col items-center bg-[#0B1120] text-white relative font-sans"
    : "min-h-screen py-14 px-4 sm:px-8 flex flex-col items-center bg-surface text-ink relative font-sans";

  return (
    <div className={containerClass}>
      <div className={`absolute inset-0 ${darkMode ? 'bg-grid-white/[0.02]' : 'bg-grid-black/[0.02]'} pointer-events-none`} />

      <div className="relative z-10 max-w-5xl w-full mx-auto space-y-10">

        {/* Header */}
        <PageHeader
          variant="iconic"
          icon={MessagesSquare}
          title="Get in"
          titleAccent="touch."
          subtitle="Bypassing the generic chatbot menus. Connect directly with the team orchestrating the engine."
          darkMode={darkMode}
        />

        <div className={`md:flex gap-8 p-8 md:p-12 rounded-[2.5rem] border ${darkMode ? "bg-slate-900/40 border-slate-800 shadow-2xl" : "bg-card border-line shadow-2xl shadow-slate-200/50"}`}>

          <div className="flex-1 space-y-7">
            <div>
              <h2 className="text-3xl font-semibold mb-4">Direct Channels</h2>
              <p className={darkMode ? "text-slate-400" : "text-muted"}>We operate synchronously in UTC+5:30. Inquiries are generally processed within 24 hours.</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="font-semibold">Email Us</div>
                  <a href="mailto:support@sltechsoft.com" className={`text-sm ${darkMode ? "text-slate-400 hover:text-orange-400" : "text-muted hover:text-accent"}`}>support@sltechsoft.com</a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="font-semibold">Enterprise Line</div>
                  <div className={`text-sm ${darkMode ? "text-slate-400" : "text-muted"}`}>+91 XX-XXXX-XXXX (SLA Holders Only)</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#ea580c]/10 flex items-center justify-center text-accent border border-[#ea580c]/20">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="font-semibold">Headquarters</div>
                  <div className={`text-sm ${darkMode ? "text-slate-400" : "text-muted"}`}>Success Ladder Technologies, India</div>
                </div>
              </div>
            </div>

            <div className={`pt-7 border-t ${darkMode ? "border-slate-800" : "border-linesoft"}`}>
              <div className={`text-xs font-black uppercase tracking-[0.2em] mb-4 ${darkMode ? "text-slate-500" : "text-faint"}`}>Social Infrastructure</div>
              <div className="flex gap-4">
                {[
                  { Icon: Twitter, href: "https://twitter.com/dealerpulse", color: "hover:text-accent hover:border-[#ea580c]/50 hover:bg-[#ea580c]/5" },
                  { Icon: Facebook, href: "https://facebook.com/dealerpulse", color: "hover:text-accent hover:border-[#ea580c]/50 hover:bg-[#ea580c]/5" },
                  { Icon: Github, href: "https://github.com/dealerpulse", color: "hover:text-accent hover:border-[#ea580c]/50 hover:bg-[#ea580c]/5" },
                  { Icon: Linkedin, href: "https://linkedin.com/company/dealerpulse", color: "hover:text-accent hover:border-[#ea580c]/50 hover:bg-[#ea580c]/5" }
                ].map(({ Icon, href, color }, i) => (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3.5 rounded-2xl border transition-all duration-300 ${darkMode ? 'border-slate-800 bg-slate-900/50 text-slate-400' : 'border-line bg-card text-muted'} ${color}`}
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className={`flex-1 rounded-3xl p-8 mt-8 md:mt-0 ${darkMode ? "bg-[#060B14] border border-slate-800" : "bg-cardsoft border border-line"}`}>
            <h3 className="text-2xl font-semibold mb-6">Send a message</h3>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div>
                <label className={`block text-xs font-semibold mb-2 uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-muted"}`}>Email Address</label>
                <input type="email" placeholder="you@company.com" className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-accent transition-all ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-card border-line text-ink"}`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-2 uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-muted"}`}>Message</label>
                <textarea rows="4" placeholder="How can we assist you?" className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-card border-line text-ink"}`}></textarea>
              </div>
              <button disabled className="w-full py-4 rounded-xl bg-accent hover:bg-accenthover transition-colors text-white font-semibold opacity-80 cursor-not-allowed">
                Transmission Offline (Demo)
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
