import React, { useContext, useRef, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Menu, X, Sun, Moon, Home, NotebookPen, Plus, User, LogOut, LayoutDashboard, ShieldCheck, History, ChevronDown, Settings } from "lucide-react";
import Assets from "../assets/Assets.js";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const { data, clearData } = useData();
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const [profileOpen, setProfileOpen] = React.useState(false);
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

  // Styles dynamically based on scroll and theme
  const isTop = !isScrolled;

  const navbarClass = isTop
    ? "bg-transparent text-white"
    : (darkMode ? "bg-[#0B1120] text-white shadow-lg border-b border-slate-800" : "bg-white text-slate-900 shadow-md border-b border-slate-200");

  const innerBgClass = isTop
    ? "bg-[#1B1464]"
    : "bg-transparent";

  const buttonClass = isTop
    ? "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white"
    : (darkMode ? "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white" : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900");


  return (
    <nav className={`sticky top-0 w-full z-50 transition-all duration-300 ${navbarClass}`}>
      <div className={`w-full py-1 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${innerBgClass}`}>
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
                  src={isTop ? Assets.Logo : (darkMode ? Assets.Logo : Assets.DarkLogo)}
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
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl fontsemibold text-white shadow-lg transition-all 
                  bg-orange-600 hover:bg-orange-350 hover:scale-[1.02] active:scale-[0.98]
                  shadow-orange-350/20`}
                >
                  <NotebookPen className="w-4 h-4" />
                  <span>Back to List</span>
                </button>
              ) : (
                <button
                  onClick={handleGoHome}
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl fontsemibold text-white shadow-lg transition-all 
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
                        <span className="text-[10px] fontsemibold leading-none truncate max-w-[80px]">{user?.name?.split(' ')[0]}</span>
                        <span className="text-[8px] font-black uppercase text-blue-500 tracking-tighter">{user?.role}</span>
                      </div>

                      {user?.avatar ? (
                        <img src={user.avatar} alt="Profile" title="User Profile" className="w-8 h-8 rounded-full border border-white/20 shadow-sm" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black">
                          {user?.name?.charAt(0)}
                        </div>
                      )}
                      <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Profile Dropdown */}
                    {profileOpen && (
                      <div className={`absolute right-0 mt-3 w-56 rounded-3xl border shadow-2xl z-20 py-3 overflow-hidden animate-in fade-in zoom-in duration-200 ${darkMode ? "bg-[#0B1120] border-slate-800" : "bg-white border-slate-100"
                        }`}>
                        <div className="px-5 pb-3 mb-2 border-b border-slate-800/10">
                          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Signed in as</p>
                          <p className={`fontsemibold text-sm truncate ${darkMode ? "text-white" : "text-slate-500"}`}>{user?.email}</p>
                        </div>

                        <div className="space-y-1">
                          <button
                            onClick={() => { logout(); setProfileOpen(false); }}
                            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm fontsemibold text-rose-500 transition-all ${darkMode ? "hover:bg-rose-500/10" : "hover:bg-rose-50"}`}
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
                    <Link to="/login">
                      <button className={`px-4 py-1.5 rounded-lg text-sm fontsemibold border ${buttonClass}`}>
                        Login
                      </button>
                    </Link>
                    <Link to="/register" className="hidden sm:block">
                      <button className="px-4 py-1.5 rounded-lg text-sm fontsemibold text-white bg-orange-600 hover:bg-orange-350 shadow-md shadow-orange-600/20">
                        Sign Up
                      </button>
                    </Link>
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
