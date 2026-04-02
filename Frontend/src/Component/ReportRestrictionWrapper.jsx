import React, { useContext } from "react";
import { useAuth } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import LoginOverlay from "./LoginOverlay";

const ReportRestrictionWrapper = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  if (isLoading) return children; // Wait for auth status

  if (!isAuthenticated) {
    return (
      <div className={`relative mt-6 rounded-[2rem] overflow-hidden max-h-[460px] ${darkMode ? "bg-slate-900/20" : "bg-white/40"}`}>
        {/* Blurring the content for a premium feel - Fixed height to prevent scroll */}
        <div className="px-4 py-8 filter blur-[40px] opacity-[0.03] pointer-events-none select-none h-[460px] overflow-hidden">
          {children}
        </div>
        
        {/* Lock Overlay Background Wrapper */}
        <div className={`absolute inset-0 z-30 flex items-center justify-center p-4 backdrop-blur-md ${
          darkMode ? "bg-slate-950/40" : "bg-white/30"
        }`}>
          <LoginOverlay darkMode={darkMode} />
        </div>
      </div>
    );
  }

  return children;
};

export default ReportRestrictionWrapper;
