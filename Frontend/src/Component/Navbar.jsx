import React, { useContext } from "react";
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

  const handleGoHome = () => {
    clearData();
    navigate("/", { replace: true });
  };

  // Styles
  const navbarClass = darkMode
    ? "bg-[#0A0F1E]/60 border-b border-white/5 backdrop-blur-2xl text-white shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
    : "bg-white/70 border-b border-slate-200 backdrop-blur-2xl text-slate-900 shadow-[0_4px_30px_rgba(0,0,0,0.05)]";

  const buttonClass = darkMode
    ? "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white"
    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900";


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
                  alt="DealerPulse Logo"
                  title="DealerPulse Logo"
                  className="relative h-14 w-auto transition-transform duration-300 group-hover:scale-105"
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
            <div className="flex items-center gap-2">
              {!isLoading && (
                isAuthenticated ? (
                  <div className="relative">
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className={`flex items-center gap-2 p-1 pl-2 rounded-full border transition-all duration-300 ${buttonClass}`}
                    >
                      <div className="hidden sm:flex flex-col items-end mr-1">
                        <span className="text-[10px] font-bold leading-none truncate max-w-[80px]">{user?.name?.split(' ')[0]}</span>
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
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)}></div>
                        <div className={`absolute right-0 mt-3 w-56 rounded-3xl border shadow-2xl z-20 py-3 overflow-hidden animate-in fade-in zoom-in duration-200 ${
                          darkMode ? "bg-[#0B1120] border-slate-800" : "bg-white border-slate-100"
                        }`}>
                          <div className="px-5 pb-3 mb-2 border-b border-slate-800/10">
                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Signed in as</p>
                            <p className="font-bold text-sm truncate">{user?.email}</p>
                          </div>

                          <div className="space-y-1">
                            <Link to="/dashboard" onClick={() => setProfileOpen(false)} className={`flex items-center gap-3 px-5 py-2.5 text-sm font-bold transition-all ${darkMode ? "hover:bg-white/5" : "hover:bg-slate-50"}`}>
                              <LayoutDashboard size={16} className="text-emerald-500" /> Dashboard
                            </Link>
                            
                            <Link to="/dashboard#audit-history" onClick={() => setProfileOpen(false)} className={`flex items-center gap-3 px-5 py-2.5 text-sm font-bold transition-all ${darkMode ? "hover:bg-white/5" : "hover:bg-slate-50"}`}>
                              <History size={16} className="text-indigo-500" /> Audit History
                            </Link>

                            {user?.role === 'admin' && (
                              <Link to="/admin" onClick={() => setProfileOpen(false)} className={`flex items-center gap-3 px-5 py-2.5 text-sm font-bold transition-all ${darkMode ? "hover:bg-white/5" : "hover:bg-slate-50"}`}>
                                <ShieldCheck size={16} className="text-blue-500" /> Admin Panel
                              </Link>
                            )}

                            {user?.role === 'super_admin' && (
                              <>
                                <Link to="/admin" onClick={() => setProfileOpen(false)} className={`flex items-center gap-3 px-5 py-2.5 text-sm font-bold transition-all ${darkMode ? "hover:bg-white/5" : "hover:bg-slate-50"}`}>
                                  <ShieldCheck size={16} className="text-blue-500" /> Admin Panel
                                </Link>
                                <Link to="/admin/setup" onClick={() => setProfileOpen(false)} className={`flex items-center gap-3 px-5 py-2.5 text-sm font-bold transition-all ${darkMode ? "hover:bg-white/5" : "hover:bg-slate-50"}`}>
                                  <Settings size={16} className="text-indigo-500" /> System Setup
                                </Link>
                              </>
                            )}

                            <div className="my-2 border-t border-slate-800/10"></div>
                            
                            <button 
                              onClick={() => toggleTheme()}
                              className={`w-full flex items-center justify-between px-5 py-2.5 text-sm font-bold transition-all ${darkMode ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
                            >
                              <div className="flex items-center gap-3">
                                {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-500" />}
                                {darkMode ? "Light Mode" : "Dark Mode"}
                              </div>
                              <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${darkMode ? "bg-amber-400/20" : "bg-slate-200"}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 ${darkMode ? "right-0.5 bg-amber-400" : "left-0.5 bg-slate-400"}`}></div>
                              </div>
                            </button>

                            <div className="my-2 border-t border-slate-800/10"></div>
                            
                            <button 
                              onClick={() => { logout(); setProfileOpen(false); }}
                              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-rose-500 transition-all ${darkMode ? "hover:bg-rose-500/10" : "hover:bg-rose-50"}`}
                            >
                              <LogOut size={16} /> Logout
                            </button>
                          </div>
                        </div>
                      </>
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
                    <Link to="/login" state={{ from: location.pathname + location.search }}>
                      <button className={`px-4 py-1.5 rounded-lg text-sm font-bold border ${buttonClass}`}>
                        Login
                      </button>
                    </Link>
                    <Link to="/register" state={{ from: location.pathname + location.search }} className="hidden sm:block">
                      <button className="px-4 py-1.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20">
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
