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
      <div className="relative mt-6 mb-10 rounded-[2rem] overflow-hidden">
        {/* Faintly blurred content peeking behind the card (sits behind, no own box) */}
        <div className="absolute inset-0 filter blur-[40px] opacity-[0.03] pointer-events-none select-none overflow-hidden">
          {children}
        </div>

        {/* Login card defines the height — sits directly over the content */}
        <div className="relative z-30 flex items-center justify-center px-4 py-8">
          <LoginOverlay darkMode={darkMode} />
        </div>
      </div>
    );
  }

  return children;
};

export default ReportRestrictionWrapper;
