import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";

import Homepage from "./Pages/Homepage";
import AboutPage from "./Pages/AboutPage";
import Technical_Performance from "./Pages/Technical_Performance";
import On_Page_SEO from "./Pages/On_Page_SEO";
import Accessibility from "./Pages/Accessibility";
import UX_Content_Structure from "./Pages/UX_Content_Structure";
import Conversion_Lead_Flow from "./Pages/Conversion_Lead_Flow";
import Security_Compilance from "./Pages/Security_Compilance";
import AIO from "./Pages/AIO";
import Navbar from "./Component/Navbar.jsx";
import Footer from "./Component/Footer.jsx";
import { useData } from "./context/DataContext.jsx";
import NotFound from "./Pages/NotFound.jsx";
import ReportLayout from "./Pages/ReportLayout.jsx"; // ✅ Check your path (Pages vs Component)

// ✅ Import ThemeContext and ThemeProvider
import { ThemeProvider, ThemeContext } from "./context/ThemeContext.jsx";
import ScrollToTop from "./Component/ScrollToTop.jsx";

function AppContentInner() {
  // ✅ We only need theme for the background class now
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  // Note: We no longer need to manually create 'navbarClass' here, 
  // as the Navbar component handles its own styling based on the context.

  return (
    <div
      className={`min-h-screen flex flex-col transition-all duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"
      }`}
    >
      {/* ✅ Navbar Implementation Updated:
          - Removed 'toggleTheme' (Navbar uses Context)
          - Removed 'navbarClass' (Navbar uses Context)
          - Kept sidebar props for mobile menu toggling
      */}
      <Navbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-grow">
        <ScrollToTop/>
        <Routes>
          <Route path="/" element={<Homepage />} />
          
          {/* Report Layout handles the dashboard view */}
          <Route
            path="/report"
            element={
              <ReportLayout
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            }
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
        </Routes>
      </main>

      <Footer />
    </div>
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