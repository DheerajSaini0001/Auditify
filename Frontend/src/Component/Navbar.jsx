import React from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import Assets from "../assets/Assets.js"; // 🖼️ adjust this import based on your folder structure

const Navbar = ({
  result,
  darkMode,
  toggleTheme,
  sidebarOpen,
  setSidebarOpen,
  navbarClass,
}) => {
  return (
    <nav className={navbarClass}>
      {result && (
        <button
          className={
            darkMode
              ? "lg:hidden p-2 rounded-lg mr-5 bg-gray-800"
              : "lg:hidden p-2 rounded-lg bg-gray-200 mr-5"
          }
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      )}

      {/* LOGO + TITLE */}
      <div
        className={
          darkMode
            ? "flex flex-col-rev justify-center items-center gap-4 font-serif text-4xl font-bold bg-gradient-to-r from-sky-200 via-rose-200 to-orange-200 bg-clip-text text-transparent"
            : "flex flex-col-rev justify-center items-center gap-4 font-serif text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#000428] to-[#004e92]"
        }
      >
        <div>
         <a href="/"> <img
            src={darkMode ? Assets.Logo : Assets.DarkLogo}
            alt="Site Audit Logo"
            className="sm:h-10 h-12 lg:h-14"
          /></a>
        </div>
        
        <div><a href="/">Site Audits</a></div>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={
          darkMode
            ? "px-4 py-2 text-white rounded"
            : "px-4 py-2 text-black rounded"
        }
      >
        {darkMode ? (
          <Sun color="#FFD700" strokeWidth={3} size={20} />
        ) : (
          <Moon color="#4B5563" strokeWidth={3} size={20} />
        )}
      </button>
    </nav>
  );
};

export default Navbar;
