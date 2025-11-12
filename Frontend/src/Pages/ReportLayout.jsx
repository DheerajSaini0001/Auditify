import React, { useContext, useEffect } from "react";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
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
import { useNavigate, useLocation } from "react-router-dom";

const ReportLayout = ({ sidebarOpen, setSidebarOpen }) => {
  const { data, clearData } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ 1️⃣ Redirect user to "/" if they open /report directly without data
  useEffect(() => {
    if (!data) {
      navigate("/", { replace: true });
    }
  }, [data, navigate]);

  // ✅ 2️⃣ Optional: clear data when user presses browser back button
  useEffect(() => {
    const handlePop = () => {
      clearData(); // 🧹 clear state and localStorage (if used)
    };

    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [clearData]);

  // ✅ 3️⃣ Manual “Back to Home” button click handler
  const handleCheckOther = () => {
    clearData();
    navigate("/");
  };

  // --- If no data available ---
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500 dark:text-gray-400">
        <p>No data available. Please analyze a site first.</p>
      </div>
    );
  }

  // --- If audit failed ---
  if (data.Status === "failed") {
    return (
      <div
        className={`flex flex-col items-center justify-center mt-50 text-center space-y-6 ${
          darkMode ? "text-gray-100" : "text-gray-800"
        }`}
      >
        <p className="text-2xl font-bold text-red-500">⚠️ Data Fetching Failed</p>
        <p className="max-w-md text-gray-500 dark:text-gray-400">
          The audit could not complete for this URL. This may be due to a network
          issue, invalid URL, or the target site being unreachable.
          Please check your connection or try another website.
        </p>
        <button
          onClick={handleCheckOther}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
        >
          🔄 Check Another Website
        </button>
      </div>
    );
  }

  // --- Default: Show report data (non-failed status) ---
  const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;

  return (
    <>
      {/* --- STATE 1: ALL REPORTS --- */}
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

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main content */}
          <main
            className={`flex-1 lg:ml-64 flex flex-col pb-0 pr-4 pl-4 lg:pl-0 space-y-8 ${
              darkMode ? "text-gray-100" : "text-gray-800"
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
            darkMode ? "text-gray-100" : "text-gray-800"
          }`}
        >
          <main className="flex-1 flex flex-col pb-0 space-y-8 max-w-7xl">
            <UrlHeader darkMode={darkMode} />

            {data.Report === "technicalMetrics" && (
              <Technical_Performance darkMode={darkMode} />
            )}
            {data.Report === "seoMetrics" && <On_Page_SEO darkMode={darkMode} />}
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
            {data.Report === "aioReadiness" && <AIO darkMode={darkMode} />}

            {/* ✅ Optional Back to Home button */}
            <div className="text-center mt-10">
              <button
                onClick={handleCheckOther}
                className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 shadow-md"
              >
                ← Back to Home
              </button>
            </div>
          </main>
        </div>
      )}
    </>
  );
};

export default ReportLayout;
