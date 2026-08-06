import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Lifts the per-page mobile drawer state up to the layout so the navbar can own
 * the hamburger.
 *
 * Dashboard, Admin, Admin Config and Audit History each render their own mobile
 * sidebar drawer, and each used to render its own toggle button somewhere inside
 * the page content. That put the hamburger in a different spot on every screen.
 * Now the page keeps its drawer markup but registers with this context, and the
 * navbar renders one toggle in a fixed position for all of them.
 */
const PageSidebarContext = createContext(null);

export function PageSidebarProvider({ children }) {
  const [open, setOpen] = useState(false);
  // Ref-counted so a page unmounting after another has mounted (route change
  // renders the next page before tearing the old one down) can't leave the
  // navbar toggle hidden on a screen that does have a drawer.
  const [drawerCount, setDrawerCount] = useState(0);

  const registerDrawer = useCallback(() => {
    setDrawerCount((n) => n + 1);
    return () => {
      setDrawerCount((n) => Math.max(0, n - 1));
      setOpen(false);
    };
  }, []);

  const value = useMemo(
    () => ({ open, setOpen, hasDrawer: drawerCount > 0, registerDrawer }),
    [open, drawerCount, registerDrawer]
  );

  return <PageSidebarContext.Provider value={value}>{children}</PageSidebarContext.Provider>;
}

/** Navbar-side hook: whether to show the toggle, and how to flip it. */
export function usePageSidebarNav() {
  return useContext(PageSidebarContext);
}

/**
 * Page-side hook. Drop-in replacement for `useState(false)` — returns the same
 * `[open, setOpen]` pair, and tells the navbar this screen has a drawer for as
 * long as the page is mounted.
 */
export function usePageSidebar() {
  const ctx = useContext(PageSidebarContext);
  const registerDrawer = ctx?.registerDrawer;

  useEffect(() => {
    if (!registerDrawer) return undefined;
    return registerDrawer();
  }, [registerDrawer]);

  // Rendered outside the provider (tests, storybook) the page still works — it
  // just falls back to a drawer with no navbar toggle.
  const fallback = useState(false);
  if (!ctx) return fallback;
  return [ctx.open, ctx.setOpen];
}
