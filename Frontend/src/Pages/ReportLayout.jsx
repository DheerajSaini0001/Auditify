import React, { useContext, useEffect, useMemo } from "react";
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
import NotADealership from "./NotADealership";
import { Loader2 } from "lucide-react";

import ReportRestrictionWrapper from "../Component/ReportRestrictionWrapper.jsx";

const ReportLayout = () => {
  const { data, clearData, fetchSingleReport, fetchBulkPageReport, pollingState } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [isFetching, setIsFetching] = React.useState(false);
  const [isReloading, setIsReloading] = React.useState(false);

  useEffect(() => {
    const bulkId = searchParams.get("bulkId");
    const pageUrl = searchParams.get("url");

    if (id || (bulkId && pageUrl)) {
      // If data is missing OR data exists but ID mismatch -> Fetch
      const currentId = id || `${bulkId}_${window.btoa(pageUrl)}`;
      
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
    // We only redirect if there's no data, no fetching is happening, 
    // AND there's no ID or Bulk ID in the URL.
    if (!data && !isFetching && !id && !searchParams.get("bulkId")) {
      navigate("/", { replace: true });
    }
  }, [data, isFetching, navigate, id, searchParams]);

  // Live polling for continuous updates
  useEffect(() => {
    const bulkId = searchParams.get("bulkId");
    const pageUrl = searchParams.get("url");
    let intervalId;

    if (id || (bulkId && pageUrl)) {
      intervalId = setInterval(() => {
        if (id) {
          fetchSingleReport(id);
        } else if (bulkId && pageUrl) {
          fetchBulkPageReport(bulkId, pageUrl);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, searchParams]);

  const handleRefresh = async () => {
    if (!id) return;
    setIsReloading(true);
    await fetchSingleReport(id);
    setIsReloading(false);
  };

  // Derived loading state checks
  const stableData = data;
  const stableLoading = isFetching || isReloading;

  // `data.report` is "All", a single section name, or a comma-joined subset chosen
  // via the report-scope checklist. Split it into the list of sections to render.
  const reportSections = useMemo(
    () => (data?.report && data.report !== "All"
      ? String(data.report).split(",").map((s) => s.trim()).filter(Boolean)
      : []),
    [data?.report]
  );

  if (isFetching) {
    return (
      <div className={`flex h-screen w-full items-center justify-center ${darkMode ? "bg-gray-900" : "bg-surface"}`}>
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Prevent component rendering while redirecting
  if (!data) {
    return null;
  }

  // 🚫 Not-a-dealership gate result — show a friendly message instead of a
  // misleading 0% Overall / Average dashboard.
  if (data.isDealership === false) {
    return (
      <NotADealership
        darkMode={darkMode}
        data={data}
        onButtonClick={() => {
          clearData();
          navigate("/", { replace: true });
        }}
      />
    );
  }

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
    <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-surface"}`}>
      
      {/* =================================================
          SCENARIO 1: DASHBOARD VIEW ("All")
      ================================================== */}
      {data && data.report === "All" && (
        <div className="flex flex-col w-full space-y-0">
          <section id="dashboard" className="scroll-mt-24">
            <Dashboard2 darkMode={darkMode} data={stableData} loading={stableLoading} />
          </section>

          <section id="rawdata" className="scroll-mt-24">
            <ReportRestrictionWrapper>
              <RawData darkMode={darkMode} data={stableData} />
            </ReportRestrictionWrapper>
          </section>
        </div>
      )}

      {/* =================================================
          SCENARIO 2: SINGLE / CUSTOM-SUBSET REPORT VIEW
          `data.report` is a single section name or a comma-joined subset chosen
          via the report-scope checklist. Render each selected section, stacked.
      ================================================== */}
      {data && data.report !== "All" && (
        <div
          className={`flex w-full justify-center ${darkMode ? "text-gray-100" : "text-ink"
            }`}
        >
          {/* ✅ Max width container for better readability on large screens */}
          <main className="flex-1 flex flex-col w-full max-w-7xl space-y-6 sm:space-y-6 mt-7">
            {/* Report Components */}
            <div className="w-full space-y-6 sm:space-y-8">
              {reportSections.includes("Technical Performance") && (
                <Technical_Performance darkMode={darkMode} data={stableData} loading={stableLoading} />
              )}
              {reportSections.includes("On Page SEO") && (
                <On_Page_SEO darkMode={darkMode} data={stableData} loading={stableLoading} />
              )}
              {reportSections.includes("Accessibility") && (
                <Accessibility darkMode={darkMode} data={stableData} loading={stableLoading} />
              )}
              {reportSections.includes("Security/Compliance") && (
                <Security_Compilance darkMode={darkMode} data={stableData} loading={stableLoading} />
              )}
              {reportSections.includes("UX & Content Structure") && (
                <UX_Content_Structure darkMode={darkMode} data={stableData} loading={stableLoading} />
              )}
              {reportSections.includes("Conversion & Lead Flow") && (
                <Conversion_Lead_Flow darkMode={darkMode} data={stableData} loading={stableLoading} />
              )}
              {reportSections.includes("AIO (AI-Optimization) Readiness") && (
                <AIO darkMode={darkMode} data={stableData} loading={stableLoading} />
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default ReportLayout;