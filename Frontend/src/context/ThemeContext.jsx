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

  // NOTE: nothing here touches the favicon, deliberately.
  //
  // There used to be an effect that pointed the first `link[rel=icon][type=png]`
  // at /favicon-light.png, on the reasoning that a light-only app should show the
  // light favicon. It broke the tab icon, for two reasons:
  //
  //   1. That first PNG link is the one carrying media="(prefers-color-scheme:
  //      dark)". The effect rewrote its href but left the media query alone, so
  //      a visitor on a DARK-themed OS was served favicon-light.png — a navy mark
  //      on transparent, sitting on a dark tab strip. The frame and bars
  //      disappeared into the background and only the orange check survived,
  //      which at 16px reads as an unrecognisable smudge rather than the brand.
  //   2. favicon-dark.png (white mark on a navy square, drawn precisely for that
  //      case) was left unused.
  //
  // The app's theme and the BROWSER CHROME's theme are different things: the app
  // is light-only, but the tab strip still follows the visitor's OS. So favicon
  // selection belongs to the media queries in index.html, which already declare
  // both variants correctly — the right amount of JavaScript here is none.

  const toggleTheme = () => {
    /* no-op: the app has a single (light) theme */
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
