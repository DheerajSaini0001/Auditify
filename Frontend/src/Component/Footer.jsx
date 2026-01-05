import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Link } from "react-router-dom";

export default function Footer() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  // Simplified, professional styles matching the new theme
  const footerClass = darkMode
    ? "mt-auto w-full py-6 px-6 border-t bg-[#0B1120] border-slate-800 text-slate-400 text-sm"
    : "mt-auto w-full py-6 px-6 border-t bg-white border-slate-200 text-slate-600 text-sm";

  const linkClass = darkMode
    ? "hover:text-emerald-400 transition-colors"
    : "hover:text-emerald-600 transition-colors";

  return (
    <footer className={footerClass}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">

        {/* Copyright */}
        <div className="text-center md:text-left">
          <Link
            to="https://www.sltechsoft.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`font-medium ${linkClass}`}
          >
            &copy; {new Date().getFullYear()} Success Leader Technologies.
          </Link>
          <span className="opacity-75"> All rights reserved.</span>
        </div>

        {/* Simple Links */}
        <div className="flex items-center gap-8 font-medium">
          <Link replace to="/about" className={linkClass}>
            About
          </Link>
          <a href="https://sltechsoft.com/service" target="_blank" rel="noopener noreferrer" className={linkClass}>
            Services
          </a>
          <a href="https://sltechsoft.com/" target="_blank" rel="noopener noreferrer" className={linkClass}>
            Contact
          </a>
        </div>

      </div>
    </footer>
  );
}
