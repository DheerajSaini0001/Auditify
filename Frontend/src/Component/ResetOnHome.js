import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useData } from "../context/DataContext"; // 👈 path adjust if needed

export default function ResetOnHome() {
  const location = useLocation();
  const { clearData } = useData();

  useEffect(() => {
    if (location.pathname === "/") {
      clearData(); // ✅ reset context + localStorage
    }
  }, [location.pathname]);

  return null;
}
