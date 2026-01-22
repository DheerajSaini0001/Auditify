import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";

import Homepage from "./Pages/Homepage";
import AboutPage from "./Pages/AboutPage";
import BulkAudit from "./Pages/BulkAudit";
import Technical_Performance from "./Pages/Technical_Performance";
import On_Page_SEO from "./Pages/On_Page_SEO";
import Accessibility from "./Pages/Accessibility";
import UX_Content_Structure from "./Pages/UX_Content_Structure";
import Conversion_Lead_Flow from "./Pages/Conversion_Lead_Flow";
import Security_Compilance from "./Pages/Security_Compilance";
import AIO from "./Pages/AIO";
import NotFound from "./Pages/NotFound.jsx";
import ReportLayout from "./Pages/ReportLayout.jsx";
import { ThemeProvider, ThemeContext } from "./context/ThemeContext.jsx";

import MainLayout from "./Component/MainLayout";

function AppContentInner() {
  // ✅ We only need theme for the background class now
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Homepage />} />
        <Route path="/bulk-audit" element={<BulkAudit />} />

        {/* Report Layout handles the dashboard view */}
        <Route
          path="/report"
          element={<ReportLayout />}
        />

        {/* Individual Report Pages */}
        <Route path="/technical-performance" element={<Technical_Performance />} />
        <Route path="/on-page-seo" element={<On_Page_SEO />} />
        <Route path="/accessibility" element={<Accessibility />} />
        <Route path="/ux-content-structure" element={<UX_Content_Structure />} />
        <Route path="/security-compliance" element={<Security_Compilance />} />
        <Route path="/conversion-lead-flow" element={<Conversion_Lead_Flow />} />
        <Route path="/aio" element={<AIO />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

// ✅ Wrap the whole app in ThemeProvider
export default function AppContent() {
  return (
    <ThemeProvider>
      <AppContentInner />
    </ThemeProvider>
  );
}