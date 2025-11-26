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

  const navbarClass = darkMode
    ? "bg-gray-900 text-white border-b border-gray-700"
    : "bg-white text-black border-b border-gray-200";

  return (
    <>


      {/* ---------------------- NAVBAR ---------------------- */}
      <nav
        className={`flex items-center justify-between px-4 py-3 sticky top-0 z-50 shadow-sm transition-colors duration-300 ${navbarClass}`}
      >
        {/* Sidebar Toggle (Mobile) */}
        <div className="flex items-center">
          {data && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`lg:hidden p-2 mr-3 rounded-lg transition ${darkMode
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-gray-200 hover:bg-gray-300"
                }`}
              aria-label="Toggle Sidebar"
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          )}
        </div>

        {/* Logo + Title */}
        <div className="flex-1 flex items-center gap-3 font-serif text-2xl font-bold">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-3 focus:outline-none"
          >
            <img
              src={darkMode ? Assets.Logo : Assets.DarkLogo}
              alt="Site Audit Logo"
              className="h-10 sm:h-10 lg:h-14 transition-transform hover:scale-105"
            />

            <span
              className={`block bg-clip-text text-transparent text-lg sm:text-2xl ${darkMode
                ? "bg-gradient-to-r from-sky-200 via-rose-200 to-orange-200"
                : "bg-gradient-to-r from-[#000428] to-[#004e92]"
                }`}
            >
              Site Audits
            </span>
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"
            }`}
          aria-label="Toggle Theme"
        >
          {darkMode ? (
            <Sun color="#FFD700" strokeWidth={3} size={22} />
          ) : (
            <Moon color="#4B5563" strokeWidth={3} size={22} />
          )}
        </button>
      </nav>
    </>
  );
};

export default Navbar;
