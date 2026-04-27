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
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import NotFound from "./NotFound";
import { Loader2 } from "lucide-react";

import ReportRestrictionWrapper from "../Component/ReportRestrictionWrapper.jsx";

const ReportLayout = () => {
  const { data, clearData, fetchSingleReport, fetchBulkPageReport } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [isFetching, setIsFetching] = React.useState(false);

  useEffect(() => {
    const bulkId = searchParams.get("bulkId");
    const pageUrl = searchParams.get("url");

    if (id || (bulkId && pageUrl)) {
      // If data is missing OR data exists but ID mismatch -> Fetch
      const currentId = id || `${bulkId}_${Buffer.from(pageUrl).toString('base64')}`;
      
      if (!data || data._id !== currentId) {
        clearData();
        setIsFetching(true);

        const fetchAction = id 
          ? fetchSingleReport(id) 
          : fetchBulkPageReport(bulkId, pageUrl);

        fetchAction.then((result) => {
          setIsFetching(false);
          if (!result.success) {
            const fallbackUrl = searchParams.get("url");
            if (fallbackUrl && !bulkId) { // Only auto-run if NOT a bulk item
              navigate("/", { 
                replace: true, 
                state: { 
                  autoFill: true, 
                  url: fallbackUrl, 
                  device: searchParams.get("device") || "Desktop",
                  report: searchParams.get("report") || "All"
                } 
              });
            } else {
              navigate("/", { replace: true });
            }
          }
        });
      }
    } else {
      if (!data && !isFetching) {
        navigate("/", { replace: true });
      }
    }
  }, [id, searchParams, navigate, fetchSingleReport]);

  // Watch for sudden data loss (e.g. from live poll 404)
  useEffect(() => {
    // Prevent navigating away during initial load of a direct link
    if (!data && !isFetching && !id) {
      navigate("/", { replace: true });
    }
  }, [data, isFetching, navigate, id]);

  if (isFetching) {
    return (
      <div className={`flex h-screen w-full items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      </div>
    );
  }

  // Prevent component rendering while redirecting
  if (!data) {
    return null;
  }


  // ✅ Responsive Error State
  // ✅ Responsive Error State
  if (data.status === "failed") {
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
      {data && data.report === "All" && (
        <div className="flex flex-col w-full space-y-0">
          <section id="dashboard" className="scroll-mt-24">
            <Dashboard2 darkMode={darkMode} />
          </section>

          <section id="rawdata" className="scroll-mt-24">
            <ReportRestrictionWrapper>
              <RawData darkMode={darkMode} data={data} />
            </ReportRestrictionWrapper>
          </section>
        </div>
      )}

      {/* =================================================
          SCENARIO 2: SINGLE REPORT VIEW
      ================================================== */}
      {data && data.report !== "All" && (
        <div
          className={`flex w-full justify-center ${darkMode ? "text-gray-100" : "text-gray-800"
            }`}
        >
          {/* ✅ Max width container for better readability on large screens */}
          <main className="flex-1 flex flex-col w-full max-w-7xl space-y-6 sm:space-y-8 mt-10">
            {/* Report Components */}
            <div className="w-full">
              {data.report === "Technical Performance" && (
                <Technical_Performance darkMode={darkMode} />
              )}
              {data.report === "On Page SEO" && (
                <On_Page_SEO darkMode={darkMode} />
              )}
              {data.report === "Accessibility" && (
                <Accessibility darkMode={darkMode} />
              )}
              {data.report === "Security/Compliance" && (
                <Security_Compilance darkMode={darkMode} />
              )}
              {data.report === "UX & Content Structure" && (
                <UX_Content_Structure darkMode={darkMode} />
              )}
              {data.report === "Conversion & Lead Flow" && (
                <Conversion_Lead_Flow darkMode={darkMode} />
              )}
              {data.report === "AIO (AI-Optimization) Readiness" && (
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