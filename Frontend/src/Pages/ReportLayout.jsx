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
import { useNavigate } from "react-router-dom";
import NotFound from "./NotFound";

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


  // ✅ Responsive Error State
  // ✅ Responsive Error State
  if (data.Status === "failed") {
    return (
      <NotFound
        darkMode={darkMode}
        title="Data Fetching Failed"
        subtitle="Unable to retrieve site metrics"
        description="Please check the URL or try another website."
        buttonText="Check Another Website"
        onButtonClick={() => {
          clearData();
          navigate("/", { replace: true });
        }}
      />
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