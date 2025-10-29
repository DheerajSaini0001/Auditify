import React, { useContext } from "react";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext"; // ✅ import ThemeContext
import Sidebar from "../Component/Sidebar";
import Dashboard2 from "../Component/Dashboard2";
import Technical_Performance from "./Technical_Performance";
import On_Page_SEO from "./On_Page_SEO";
import Accessibility from "./Accessibility";
import Security_Compilance from "./Security_Compilance";
import UX_Content_Structure from "./UX_Content_Structure";
import Conversion_Lead_Flow from "./Conversion_Lead_Flow";
import AIO from "./AIO";
import RawData from "./RawData";
import UrlHeader from "../Component/UrlHeader";

const ReportLayout = ({ sidebarOpen, setSidebarOpen }) => {
  const { data } = useData();
  const { theme } = useContext(ThemeContext); // ✅ access theme from context

  // Convert theme into boolean for styling consistency
  const darkMode = theme === "dark";

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 dark:text-gray-400">
        <p>No data available. Please analyze a site first.</p>
      </div>
    );
  }

  const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;

  return (
    <>
      {/* --- STATE 1: "ALL REPORTS" --- */}
      {data.Report === "All" && (
        <div className="relative flex w-full h-full">
          {/* Sidebar */}
          <div
            className={`${sidebarClass} ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
          >
            <Sidebar darkMode={darkMode} />
          </div>

          {/* Overlay for mobile when sidebar is open */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main content */}
          <main
            className={`flex-1 lg:ml-64 flex flex-col pb-0 pr-4 pl-4 lg:pl-0 space-y-8 ${
              darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-800"
            }`}
          >
            <section id="dashboard" className="scroll-mt-20">
              <Dashboard2 darkMode={darkMode} />
            </section>
            <section id="rawdata" className="scroll-mt-20">
              <RawData darkMode={darkMode} data={data.Raw} />
            </section>
          </main>
        </div>
      )}

      {/* --- STATE 2: SINGLE REPORT --- */}
      {data.Report !== "All" && (
        <div
          className={`relative flex w-full h-full justify-center px-4 ${
            darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-800"
          }`}
        >
          <main className="flex-1 flex flex-col pb-0 space-y-8 max-w-7xl">
            <UrlHeader darkMode={darkMode} />

            {data.Report === "technicalMetrics" && (
              <Technical_Performance darkMode={darkMode} />
            )}
            {data.Report === "seoMetrics" && (
              <On_Page_SEO darkMode={darkMode} />
            )}
            {data.Report === "accessibilityMetrics" && (
              <Accessibility darkMode={darkMode} />
            )}
            {data.Report === "securityCompliance" && (
              <Security_Compilance darkMode={darkMode} />
            )}
            {data.Report === "uxContentStructure" && (
              <UX_Content_Structure darkMode={darkMode} />
            )}
            {data.Report === "conversionLeadFlow" && (
              <Conversion_Lead_Flow darkMode={darkMode} />
            )}
            {data.Report === "aioReadiness" && (
              <AIO darkMode={darkMode} />
            )}
          </main>
        </div>
      )}
    </>
  );
};

export default ReportLayout;
