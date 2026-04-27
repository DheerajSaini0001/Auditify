import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Mail, MapPin, MessagesSquare, Phone } from "lucide-react";

export default function ContactPage() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const containerClass = darkMode
    ? "min-h-screen py-24 px-4 sm:px-8 flex flex-col items-center bg-[#020617] text-white relative font-sans"
    : "min-h-screen py-24 px-4 sm:px-8 flex flex-col items-center bg-slate-50 text-slate-900 relative font-sans";

  return (
    <div className={containerClass}>
      <div className={`absolute inset-0 ${darkMode ? 'bg-grid-white/[0.02]' : 'bg-grid-black/[0.02]'} pointer-events-none`} />

      <div className="relative z-10 max-w-5xl w-full mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <MessagesSquare size={32} />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">
            Get in touch.
          </h1>
          <p className={`text-lg max-w-2xl mx-auto font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Bypassing the generic chatbot menus. Connect directly with the team orchestrating the engine.
          </p>
        </div>

        <div className={`md:flex gap-12 p-8 md:p-12 rounded-[2.5rem] border ${darkMode ? "bg-slate-900/40 border-slate-800 shadow-2xl" : "bg-white border-slate-200 shadow-2xl shadow-slate-200/50"}`}>
          
          <div className="flex-1 space-y-10">
            <div>
              <h2 className="text-3xl font-bold mb-4">Direct Channels</h2>
              <p className={darkMode ? "text-slate-400" : "text-slate-600"}>We operate synchronously in UTC+5:30. Inquiries are generally processed within 24 hours.</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 border border-violet-500/20">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="font-bold">Email Us</div>
                  <a href="mailto:support@sltechsoft.com" className={`text-sm ${darkMode ? "text-slate-400 hover:text-violet-400" : "text-slate-600 hover:text-violet-600"}`}>support@sltechsoft.com</a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="font-bold">Enterprise Line</div>
                  <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>+91 XX-XXXX-XXXX (SLA Holders Only)</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="font-bold">Headquarters</div>
                  <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Success Ladder Technologies, India</div>
                </div>
              </div>
            </div>
          </div>

          <div className={`flex-1 rounded-3xl p-8 mt-12 md:mt-0 ${darkMode ? "bg-[#020617] border border-slate-800" : "bg-slate-50 border border-slate-200"}`}>
            <h3 className="text-2xl font-bold mb-6">Send a message</h3>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div>
                <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Email Address</label>
                <input type="email" placeholder="you@company.com" className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300"}`} />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Message</label>
                <textarea rows="4" placeholder="How can we assist you?" className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300"}`}></textarea>
              </div>
              <button disabled className="w-full py-4 rounded-xl bg-violet-500 hover:bg-violet-600 transition-colors text-white font-bold opacity-80 cursor-not-allowed">
                Transmission Offline (Demo)
              </button>
            </form>
          </div>
          
        </div>

      </div>
    </div>
  );
}
