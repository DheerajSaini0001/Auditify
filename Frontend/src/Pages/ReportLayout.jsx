import React, { useContext, useEffect } from "react";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
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

const ReportLayout = () => {
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

  // ✅ Responsive Error State
  if (data.Status === "failed") {
    return (
      <div
        className={`flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6 ${darkMode ? "text-gray-100" : "text-gray-800"
          }`}
      >
        <p className="text-xl sm:text-2xl font-bold text-red-500">
          ⚠️ Data Fetching Failed
        </p>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
          Please try another website.
        </p>
        <button
          onClick={handleCheckOther}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm sm:text-base"
        >
          🔄 Check Another Website
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* =================================================
          SCENARIO 1: DASHBOARD VIEW ("All")
      ================================================== */}
      {data && data.Report === "All" && (
        <div className="flex flex-col w-full space-y-6 sm:space-y-8">
          <section id="dashboard" className="scroll-mt-24">
            <Dashboard2 darkMode={darkMode} />
          </section>

          <section id="rawdata" className="scroll-mt-24">
            <RawData darkMode={darkMode} data={data} />
          </section>
        </div>
      )}

      {/* =================================================
          SCENARIO 2: SINGLE REPORT VIEW
      ================================================== */}
      {data && data.Report !== "All" && (
        <div
          className={`flex w-full justify-center ${darkMode ? "text-gray-100" : "text-gray-800"
            }`}
        >
          {/* ✅ Max width container for better readability on large screens */}
          <main className="flex-1 flex flex-col w-full max-w-7xl space-y-6 sm:space-y-8 mt-10">
            <UrlHeader darkMode={darkMode} />

            {/* Report Components */}
            <div className="w-full">
              {data.Report === "Technical Performance" && (
                <Technical_Performance darkMode={darkMode} />
              )}
              {data.Report === "On Page SEO" && (
                <On_Page_SEO darkMode={darkMode} />
              )}
              {data.Report === "Accessibility" && (
                <Accessibility darkMode={darkMode} />
              )}
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
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default ReportLayout;