import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, ExternalLink } from "lucide-react";
import Assets from "../assets/Assets.js";

export default function Footer() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  return (
    <footer className={`relative overflow-hidden transition-colors duration-500 border-t ${darkMode ? 'bg-[#060B18] border-white/5 text-slate-500' : 'bg-white border-slate-200 text-slate-600'}`}>

      {/* Subtle Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

          {/* Brand Column */}
          <div className="md:col-span-1 space-y-6">
            <Link to="/" className="flex items-center gap-3">
              <img src={darkMode ? Assets.Logo : Assets.DarkLogo} alt="Dealerpulse" className="h-16 w-auto" />
            </Link>
            <p className="text-sm font-medium leading-relaxed">
              Deep-intelligence website auditing. Performance, SEO, Security, and more. All in one place.
            </p>
            <div className="flex items-center gap-4">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${darkMode ? 'border-white/10 hover:bg-white/5 hover:text-white' : 'border-slate-200 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="space-y-6">
            <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>Product</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/" className="hover:text-emerald-500 transition-colors">Audit Engine</Link></li>
              <li><Link to="/bulk-audit" className="hover:text-emerald-500 transition-colors">Bulk Analysis</Link></li>
              <li><Link to="/dashboard" className="hover:text-emerald-500 transition-colors">Personal Dashboard</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>Company</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/about" className="hover:text-emerald-500 transition-colors">About Us</Link></li>
              <li><Link to="/services" className="hover:text-emerald-500 transition-colors">Services</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-500 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>Resources</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/documentation" className="hover:text-emerald-500 transition-colors">Documentation</Link></li>
              <li><Link to="/help" className="hover:text-emerald-500 transition-colors">Help Center</Link></li>
            </ul>
          </div>

        </div>

        <div className={`pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="text-[12px] font-black uppercase tracking-widest flex items-center gap-2">
            <span className={darkMode ? 'text-slate-600' : 'text-slate-400'}>&copy; {new Date().getFullYear()}</span>
            <a href="https://www.sltechsoft.com" target="_blank" rel="noopener noreferrer" className={`hover:text-emerald-500 transition-colors ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Success Ladder Technologies
            </a>
          </div>
          <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-widest">
            <Link to="/privacy" className="hover:text-emerald-500 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-emerald-500 transition-colors">Terms</Link>
            <Link to="/cookies" className="hover:text-emerald-500 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

