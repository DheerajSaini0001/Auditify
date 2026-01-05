import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Menu, X, Sun, Moon } from "lucide-react";
import Assets from "../assets/Assets.js";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext.jsx";

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const { data, clearData } = useData();
  const navigate = useNavigate();

  const handleGoHome = () => {
    clearData();
    navigate("/", { replace: true });
  };

  // Styles
  const navbarClass = darkMode
    ? "bg-[#0B1120]/80 border-b border-slate-800 backdrop-blur-md text-white supports-[backdrop-filter]:bg-[#0B1120]/60"
    : "bg-white/80 border-b border-slate-200 backdrop-blur-md text-slate-900 supports-[backdrop-filter]:bg-white/60";

  const buttonClass = darkMode
    ? "bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 text-slate-300 hover:text-white"
    : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900";

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${navbarClass}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left Section: Mobile Menu & Logo */}
          <div className="flex items-center gap-4">

            {/* Sidebar Toggle (Only visible if data exists & on Mobile) */}
            {data && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`lg:hidden p-2 rounded-lg border transition-all duration-200 ${buttonClass}`}
                aria-label="Toggle Sidebar"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            {/* Logo area */}
            <button
              onClick={handleGoHome}
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="relative">
                <div className={`absolute -inset-1 rounded-full blur-md opacity-40 group-hover:opacity-60 transition duration-500 ${darkMode ? "bg-emerald-500" : "bg-emerald-400"}`}></div>
                <img
                  src={darkMode ? Assets.Logo : Assets.DarkLogo}
                  alt="Site Audit Logo"
                  className="relative h-9 w-auto transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="flex flex-col items-start leading-none">
                <span className={`font-bold text-xl tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                  Site<span className="text-emerald-500">Audit</span>
                </span>
                <span className={`text-[10px] font-medium tracking-wider uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Professional
                </span>
              </div>
            </button>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-3">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-all duration-200 ${buttonClass}`}
              aria-label="Toggle Theme"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />
              )}
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
