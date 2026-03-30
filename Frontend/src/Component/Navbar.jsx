import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Menu, X, Sun, Moon, Home, NotebookPen, Plus, User, LogOut, LayoutDashboard } from "lucide-react";
import Assets from "../assets/Assets.js";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const { data, clearData } = useData();
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      <div className="w-full px-4 sm:px-6 lg:px-8">
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

            {/* New Audit or Back to Bulk - Hidden on Home Page */}
            {location.pathname !== "/" && (
              data?.fromBulkAudit ? (
                <button
                  onClick={() => navigate("/bulk-audit")}
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white shadow-lg transition-all 
                  bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 hover:scale-[1.02] active:scale-[0.98]
                  shadow-blue-500/20`}
                >
                  <NotebookPen className="w-4 h-4" />
                  <span>Back to List</span>
                </button>
              ) : (
                <button
                  onClick={handleGoHome}
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white shadow-lg transition-all 
                  bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 hover:scale-[1.02] active:scale-[0.98]
                  shadow-emerald-500/20`}
                >
                  <Plus className="w-5 h-5" />
                  <span>Start New Audit</span>
                </button>
              )
            )}

            {/* Auth Actions */}
            <div className="flex items-center gap-2 min-w-20 lg:min-w-32">
              {!isLoading && (
                isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <Link
                      to={user?.role === "admin" ? "/admin" : "/dashboard"}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${buttonClass}`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                      <span className="hidden md:inline">Dashboard</span>
                    </Link>
                    <button
                      onClick={logout}
                      className={`p-2 rounded-lg border transition-all duration-200 ${buttonClass}`}
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link to="/login">
                      <button className={`px-4 py-1.5 rounded-lg text-sm font-bold border ${buttonClass}`}>
                        Login
                      </button>
                    </Link>
                    <Link to="/register" className="hidden sm:block">
                      <button className="px-4 py-1.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20">
                        Sign Up
                      </button>
                    </Link>
                  </div>
                )
              )}
            </div>

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
