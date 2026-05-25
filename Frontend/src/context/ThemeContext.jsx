import React, { createContext, useState, useEffect } from "react";
import logoDark from "../assets/Logo.png";
import logoLight from "../assets/logolight.png";

// 1️⃣ Create the context
export const ThemeContext = createContext();

// 2️⃣ Create the provider
export const ThemeProvider = ({ children }) => {
  // Read initial theme from localStorage (before hydration)
  const getInitialTheme = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored) return stored;
      // Use system preference if no saved theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    }
    return "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Sync the HTML <html> class with current theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Sync favicon with the system color scheme (prefers-color-scheme: dark)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const updateFavicon = (e) => {
      const isSystemDark = e.matches;
      const favicon = document.querySelector("link[rel='icon']");
      if (favicon) {
        favicon.href = isSystemDark ? logoLight : logoDark;
        favicon.type = "image/png";
      }
    };

    // Initialize favicon
    updateFavicon(mediaQuery);

    // Watch for system theme changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateFavicon);
      return () => mediaQuery.removeEventListener("change", updateFavicon);
    } else {
      mediaQuery.addListener(updateFavicon);
      return () => mediaQuery.removeListener(updateFavicon);
    }
  }, []);

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "theme" && e.newValue) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Toggle function
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
