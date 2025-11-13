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
import { useNavigate } from "react-router-dom";

const ReportLayout = ({ sidebarOpen, setSidebarOpen }) => {
  const { data, clearData } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const navigate = useNavigate();

  // Redirect to home if data is missing
  useEffect(() => {
    if (!data) {
      navigate("/", { replace: true });
    }
  }, [data, navigate]);

  // Prevent component rendering while redirecting
  if (!data) {
    return null;
  }

  const handleCheckOther = () => {
    clearData();
    navigate("/", { replace: true });
  };

  if (data.Status === "failed") {
    return (
      <div
        className={`flex flex-col items-center justify-center mt-50 text-center space-y-6 ${
          darkMode ? "text-gray-100" : "text-gray-800"
        }`}
      >
        <p className="text-2xl font-bold text-red-500">⚠️ Data Fetching Failed</p>
        <p className="max-w-md text-gray-500 dark:text-gray-400">
          Please try another website.
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

  const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;

  return (
    <>
      {data && data.Report === "All" && (
        <div className="relative flex w-full h-full">
          <div
            className={`${sidebarClass} ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
          >
            <Sidebar darkMode={darkMode} />
          </div>

          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

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

      {data && data.Report !== "All" && (
        <div
          className={`relative flex w-full h-full justify-center px-4 ${
            darkMode ? "text-gray-100" : "text-gray-800"
          }`}
        >
          <main className="flex-1 flex flex-col pb-0 space-y-8 max-w-7xl">
            <UrlHeader darkMode={darkMode} />

            {data.Report === "Technical Performance" && (
              <Technical_Performance darkMode={darkMode} />
            )}
            {data.Report === "On Page SEO" && <On_Page_SEO darkMode={darkMode} />}
            {data.Report === "Accessibility" && <Accessibility darkMode={darkMode} />}
            {data.Report === "Security/Compliance" && (
              <Security_Compilance darkMode={darkMode} />
            )}
            {data.Report === "UX & Content Structure" && (
              <UX_Content_Structure darkMode={darkMode} />
            )}
            {data.Report === "Conversion & Lead Flow" && (
              <Conversion_Lead_Flow darkMode={darkMode} />
            )}
            {data.Report === "AIO (AI-Optimization) Readiness" && (
              <AIO darkMode={darkMode} />
            )}
          </main>
        </div>
      )}
    </>
  );
};

export default ReportLayout;
