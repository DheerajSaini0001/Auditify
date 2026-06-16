import React, { useContext, useRef, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Menu, X, Sun, Moon, Home, NotebookPen, Plus, User, LogOut, LayoutDashboard, ShieldCheck, History, ChevronDown, Settings } from "lucide-react";
import Assets from "../assets/Assets.js";
import DarkLogoDealerPulse from "../assets/DarkLogoDealer_Pulse.png";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { savePostAuthIntent } from "../utils/intentStore";

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const { data, clearData } = useData();
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState(false);

  // Build initials for the fallback avatar. Full name -> first letter of first
  // and last name; single name -> first letter doubled (e.g. "Keshav" -> "KK").
  const getInitials = (name) => {
    if (!name || !name.trim()) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return (parts[0][0] + parts[0][0]).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const handleGoHome = () => {
    clearData();
    navigate("/dashboard", { replace: true });
  };

  const handleLogin = () => {
    if (data?._id) {
      savePostAuthIntent(data._id, `/report/${data._id}`);
      navigate("/login", { state: { from: `/report/${data._id}` } });
    } else if (location.pathname.startsWith("/report")) {
      savePostAuthIntent("temp", location.pathname);
      navigate("/login", { state: { from: location.pathname } });
    } else {
      navigate("/login");
    }
  };

  const handleRegister = () => {
    if (data?._id) {
      savePostAuthIntent(data._id, `/report/${data._id}`);
      navigate("/register", { state: { from: `/report/${data._id}` } });
    } else if (location.pathname.startsWith("/report")) {
      savePostAuthIntent("temp", location.pathname);
      navigate("/register", { state: { from: location.pathname } });
    } else {
      navigate("/register");
    }
  };

  // Styles dynamically based on scroll and theme
  const isTop = !isScrolled;

  // In dark theme the top-of-page hero is the blue gradient (white text); in
  // light theme the hero is cream, so the navbar text must be navy at all times.
  const textClass = darkMode ? "text-white" : "text-ink";

  // The scrolled (solid) background is a separate layer that fades in over the
  // gradient via opacity, so there's no abrupt background-image swap.
  const scrolledBgClass = darkMode
    ? "bg-[#0B1120] border-b border-slate-800 shadow-lg"
    : "bg-surface";

  const buttonClass = darkMode
    ? "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white"
    : "bg-cardsoft hover:bg-surface-2 border-line text-muted hover:text-ink";


  return (
    <nav className={`sticky top-0 w-full z-50 transition-colors duration-300 ${textClass}`}>
      {/* Base gradient (always present, never swapped — avoids snap) */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none ${darkMode ? "bg-gradient-to-r from-[#1E3A8A] to-[#1E47C3]" : "bg-surface"}`}
      />
      {/* Solid scrolled background fades in on top of the gradient */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ease-out ${isScrolled ? "opacity-100" : "opacity-0"} ${scrolledBgClass}`}
      />
      <div className={`relative w-full py-1 px-4 sm:px-6 lg:px-8`}>
        <div className={`flex items-center justify-between h-16 `}>

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
                <div className={`absolute opacity-0 rounded-full ${darkMode ? "bg-emerald-500" : "bg-emerald-400"}`}></div>
                <img
                  src={darkMode ? Assets.Logo : DarkLogoDealerPulse}
                  alt="DealerPulse Logo"
                  title="DealerPulse Logo"
                  className="relative h-14 w-auto -hover:scale-105 transition-all duration-300"
                />
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
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white shadow-lg transition-all 
                  bg-orange-600 hover:bg-orange-350 hover:scale-[1.02] active:scale-[0.98]
                  shadow-orange-350/20`}
                >
                  <NotebookPen className="w-4 h-4" />
                  <span>Back to List</span>
                </button>
              ) : (
                <button
                  onClick={handleGoHome}
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white shadow-lg transition-all 
                  bg-orange-600 hover:bg-orange-350 hover:scale-[1.02] active:scale-[0.98]
                  shadow-orange-350/20`}
                >
                  <Plus className="w-5 h-5" />
                  <span>Start New Audit</span>
                </button>
              )
            )}

            {/* Auth Actions */}
            <div className="flex items-center gap-2">
              {!isLoading && (
                isAuthenticated ? (
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className={`flex items-center gap-2 p-1 pl-2 rounded-full border transition-all duration-300 ${buttonClass}`}
                    >
                      <div className="hidden sm:flex flex-col items-end mr-1">
                        <span className="text-[10px] font-semibold leading-none truncate max-w-[80px]">{user?.name?.split(' ')[0]}</span>
                        <span className="text-[8px] font-black uppercase text-accent tracking-tighter">{user?.role}</span>
                      </div>

                      {user?.avatar && !avatarError ? (
                        <img
                          src={user.avatar}
                          alt="Profile"
                          title="User Profile"
                          onError={() => setAvatarError(true)}
                          className="w-8 h-8 rounded-full border border-white/20 shadow-sm object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#16213E] flex items-center justify-center text-white text-[11px] font-black tracking-tight">
                          {getInitials(user?.name)}
                        </div>
                      )}
                      <ChevronDown className={`w-3 h-3 text-faint transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Profile Dropdown */}
                    {profileOpen && (
                      <div className={`absolute right-0 mt-3 w-56 rounded-3xl border shadow-2xl z-20 py-3 overflow-hidden animate-in fade-in zoom-in duration-200 ${darkMode ? "bg-[#0B1120] border-slate-800" : "bg-card border-line"
                        }`}>
                        <div className="px-5 pb-3 mb-2 border-b border-slate-800/10">
                          <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Signed in as</p>
                          <p className={`font-semibold text-sm truncate ${darkMode ? "text-white" : "text-muted"}`}>{user?.email}</p>
                        </div>

                        <div className="space-y-1">
                          <button
                            onClick={() => { logout(); setProfileOpen(false); }}
                            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-semibold text-rose-500 transition-all ${darkMode ? "hover:bg-rose-500/10" : "hover:bg-rose-50"}`}
                          >
                            <LogOut size={16} /> Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Theme Toggle (Outside for guests) */}
                    <button
                      onClick={toggleTheme}
                      className={`p-2 rounded-lg border transition-all duration-200 ${buttonClass} mr-1`}
                      aria-label="Toggle Theme"
                    >
                      {darkMode ? (
                        <Sun className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                      ) : (
                        <Moon className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />
                      )}
                    </button>
                    <button onClick={handleLogin} className={`px-4 py-1.5 rounded-lg text-sm font-semibold border ${buttonClass}`}>
                      Login
                    </button>
                    <button onClick={handleRegister} className="hidden sm:block px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-orange-600 hover:bg-orange-350 shadow-md shadow-orange-600/20">
                      Sign Up
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
