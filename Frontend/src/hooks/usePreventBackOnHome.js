// ✅ hooks/usePreventBackOnHome.js
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function usePreventBackOnHome() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      // Clear browser history stack by pushing a fresh entry
      window.history.pushState(null, "", window.location.href);

      const handlePopState = () => {
        // When back is pressed on "/", do nothing
        window.history.pushState(null, "", window.location.href);
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [location]);
}
