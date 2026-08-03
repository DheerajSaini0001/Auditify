import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

import Assets from "../assets/Assets.js";

export default function Footer() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  // "My Reports" is a signed-in-only page — hide it from guests.
  const { isAuthenticated } = useAuth();

  return (
    <footer className={`relative overflow-hidden transition-colors duration-500 border-t ${darkMode ? 'bg-[#060B18] border-white/5 text-slate-500' : 'bg-surface border-line text-muted'}`}>

      {/* Subtle Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

      {/* Full-width on laptops: no narrow max-width cap, just comfortable side gutters. */}
      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-10 mb-10">

          {/* Brand Column — wider so the footer fills the laptop width nicely */}
          <div className="col-span-2 lg:col-span-2 space-y-5 pr-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={darkMode ? Assets.Logo : Assets.DarkLogo} alt="Site Audit" title="Site Audit" className="h-16 w-auto" />
            </Link>
            <p className="text-sm font-medium leading-relaxed max-w-md">
              Site Audit checks your website for speed, SEO, security, and more —
              then gives you a simple report with clear steps to make it better.
            </p>
          </div>

          {/* Get Started */}
          <div className="space-y-5">
            <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${darkMode ? 'text-white' : 'text-ink'}`}>Get Started</h2>
            <ul className="space-y-4 text-sm font-semibold">
              <li><Link to="/" state={{ focusAudit: true }} className="hover:text-emerald-500 transition-colors">Check My Website</Link></li>
              {isAuthenticated && (
                <li><Link to="/dashboard" className="hover:text-emerald-500 transition-colors">My Reports</Link></li>
              )}
            </ul>
          </div>

          {/* About */}
          <div className="space-y-5">
            <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${darkMode ? 'text-white' : 'text-ink'}`}>About</h2>
            <ul className="space-y-4 text-sm font-semibold">
              <li><Link to="/about" className="hover:text-emerald-500 transition-colors">About Us</Link></li>
              <li><Link to="/services" className="hover:text-emerald-500 transition-colors">What We Do</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-500 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div className="space-y-5">
            <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${darkMode ? 'text-white' : 'text-ink'}`}>Help</h2>
            <ul className="space-y-4 text-sm font-semibold">
              <li><Link to="/documentation" className="hover:text-emerald-500 transition-colors">How It Works</Link></li>
              <li><Link to="/help" className="hover:text-emerald-500 transition-colors">Help Center</Link></li>
            </ul>
          </div>

        </div>

        <div className={`pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-5 ${darkMode ? 'border-white/5' : 'border-linesoft'}`}>
          <div className="text-[12px] font-semibold flex items-center gap-2">
            <span className={darkMode ? 'text-slate-600' : 'text-faint'}>&copy; {new Date().getFullYear()}</span>
            <a href="https://www.sltechsoft.com" target="_blank" rel="noopener noreferrer" className={`hover:text-emerald-500 transition-colors ${darkMode ? 'text-white' : 'text-ink'}`}>
              Success Ladder Technologies
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[12px] font-semibold">
            <Link to="/privacy" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-emerald-500 transition-colors">Terms of Use</Link>
            <Link to="/cookies" className="hover:text-emerald-500 transition-colors">Cookie Policy</Link>
            <Link to="/do-not-sell" className="hover:text-emerald-500 transition-colors whitespace-nowrap">Do Not Sell My Info</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

