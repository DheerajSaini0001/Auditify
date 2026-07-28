import React, { createContext, useEffect } from "react";

// Dark mode was removed from the product — the app is light-only now.
//
// This provider is deliberately kept (rather than deleted) because ~84 files still
// read `theme` from it. They all now receive "light", so every `darkMode ? … : …`
// branch resolves to its light side. `toggleTheme` stays as a no-op so any leftover
// caller cannot crash. Once the dark branches have been stripped out of the
// components, this file and its consumers can go too.
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const theme = "light";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    // Clear any theme a user picked before dark mode was removed, so an old
    // localStorage value can't put `.dark` back later.
    try {
      localStorage.removeItem("theme");
    } catch {
      /* storage unavailable — nothing to clean up */
    }
  }, []);

  useEffect(() => {
    const favicon = document.querySelector("link[rel='icon'][type='image/png']");
    if (favicon) favicon.href = "/favicon-light.png";
  }, []);

  const toggleTheme = () => {
    /* no-op: the app has a single (light) theme */
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
