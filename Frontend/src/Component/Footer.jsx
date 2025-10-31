import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Link } from "react-router-dom";

export default function Footer() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const footerClass = darkMode
    ? "mt-auto flex bg-gray-900 text-gray-200 py-6 pt-8 border-t border-gray-700"
    : "mt-auto flex bg-gray-200 text-gray-800 py-6 pt-8 border-t border-gray-300";

  const linkHoverClass = darkMode
    ? "hover:text-blue-400 transition"
    : "hover:text-blue-600 transition";

  return (
    <footer className={footerClass}>
      <div className="container ml-64 w-full mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm">
          <Link replace className={linkHoverClass} to="https://www.sltechsoft.com" target="_blank" rel="noopener noreferrer">
            &copy; {new Date().getFullYear()} Success Leader Technologies.
          </Link>{" "}
          All rights reserved.
        </p>

        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link replace to="/about" className={linkHoverClass}>
            About
          </Link>
          <Link replace to="https://sltechsoft.com/service" className={linkHoverClass}>
            Services
          </Link>
          <Link replace to="https://sltechsoft.com/" className={linkHoverClass}>
            Contact
          </Link>
        
        </div>
      </div>
    </footer>
  );
}
