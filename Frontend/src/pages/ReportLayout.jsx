import React, { useContext, useEffect, useMemo } from "react";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import Dashboard2 from "../components/Dashboard2";
import Technical_Performance from "./Technical_Performance";
import On_Page_SEO from "./On_Page_SEO";
import Accessibility from "./Accessibility";
import Security_Compilance from "./Security_Compilance";
import UX_Content_Structure from "./UX_Content_Structure";
import Conversion_Lead_Flow from "./Conversion_Lead_Flow";
import AIO from "./AIO";
import AEO from "./AEO";
import RawData from "./RawData";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import NotFound from "./NotFound";
import NotADealership from "./NotADealership";
import { Loader2 } from "lucide-react";

import ReportRestrictionWrapper from "../components/ReportRestrictionWrapper.jsx";
import AuditProgressPanel from "../components/AuditProgressPanel.jsx";
import { useLiveReport } from "../hooks/useLiveReport.js";
import { trackEvent } from "../utils/tracking.js";

const ReportLayout = () => {
  const { data, clearData, fetchSingleReport, fetchBulkPageReport, pollingState } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isFetching, setIsFetching] = React.useState(false);
  const [isReloading, setIsReloading] = React.useState(false);

  // `/report/:id` is fetched AND kept live by this hook — the same one the standalone
  // section pages use, so the two can't drift apart. Everything below deals only with
  // what the hook has no notion of: bulk pages, and where to send someone whose id
  // turned out to be dead.
  const { isInitialFetch, loadFailed } = useLiveReport(id);

  useEffect(() => {
    if (id) return; // the hook owns the single-report path
    const bulkId = searchParams.get("bulkId");
    const pageUrl = searchParams.get("url");

    if (bulkId && pageUrl) {
      // If data is missing OR data exists but ID mismatch -> Fetch
      const currentId = `${bulkId}_${window.btoa(pageUrl)}`;

      if (!data || data._id !== currentId) {
        clearData();
        setIsFetching(true);

        fetchBulkPageReport(bulkId, pageUrl).then((result) => {
          setIsFetching(false);
          // Never auto-run a bulk item — it belongs to a batch, not to the URL bar.
          if (!result.success) navigate("/", { replace: true });
        });
      }
    } else {
      if (!data && !isFetching) {
        navigate("/", { replace: true });
      }
    }
  }, [id, searchParams, navigate, fetchBulkPageReport]);

  // The id is dead (expired, deleted, or someone else's). If the link carried the URL
  // it was for, offer to run it again rather than dumping the visitor on a blank home
  // page. `clearData` because the report we still hold is a different one.
  useEffect(() => {
    if (!id || !loadFailed) return;
    clearData();
    const fallbackUrl = searchParams.get("url");
    if (fallbackUrl) {
      navigate("/", {
        replace: true,
        state: {
          autoFill: true,
          url: fallbackUrl,
          device: searchParams.get("device") || "Desktop",
          report: searchParams.get("report") || "All",
        },
      });
    } else {
      navigate("/", { replace: true });
    }
    // searchParams is a fresh object on every render — read it, never depend on it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loadFailed, navigate]);

  /**
   * Count this report as READ, exactly once.
   *
   * The ref is what makes "once" true: this component re-renders on every 3s poll
   * tick, and without the guard each tick would fire another beacon and report one
   * reader as hundreds of views. It is keyed by report id so opening a different
   * report in the same mounted layout still counts.
   *
   * Gated on `completed` because the page mounts while the audit is still running
   * — counting that would mark every audit as read whether or not anyone stayed
   * for the result.
   */
  const viewTrackedFor = React.useRef(null);
  useEffect(() => {
    const reportId = data?._id;
    // `data.status` is the NORMALIZED status — DataContext collapses every backend
    // stage into pending | success | failed, so a finished report reads "success",
    // never the raw "completed". Comparing against "completed" here meant this guard
    // always returned early and REPORT_VIEW was never emitted once (verified: zero
    // rows in activitylogs, while every other action type is present).
    if (!reportId || data?.status !== 'success') return;
    if (viewTrackedFor.current === reportId) return;
    viewTrackedFor.current = reportId;

    trackEvent('REPORT_VIEW', {
      url: data.url,
      reportId,
      metadata: { score: data.score ?? null, grade: data.grade ?? null, reportType: data.report },
    });
  }, [data?._id, data?.status]);

  // Watch for sudden data loss (e.g. from live poll 404)
  useEffect(() => {
    // Prevent navigating away during initial load of a direct link
    // We only redirect if there's no data, no fetching is happening, 
    // AND there's no ID or Bulk ID in the URL.
    if (!data && !isFetching && !id && !searchParams.get("bulkId")) {
      navigate("/", { replace: true });
    }
  }, [data, isFetching, navigate, id, searchParams]);

  // Mirror of the live status, so the bulk poll below can see it without taking
  // `data` as a dependency (which would tear the interval down on every tick).
  const statusRef = React.useRef(null);
  useEffect(() => { statusRef.current = data?.status ?? null; }, [data?.status]);

  /**
   * Live polling for BULK pages only. A single report is watched by useLiveReport,
   * which polls the cheap ~500-byte status endpoint and only pulls the full report
   * when something in the body actually moved — see the hook for why.
   *
   * Bulk pages have no status endpoint of their own, so they keep polling the full
   * payload — but they no longer do it forever once the run is terminal. The payload
   * changes ONCE MORE a beat after status turns terminal (the finished report is
   * buffered in memory and flushed to Mongo in batches, and the two serialize
   * differently), so we stop the interval and take one final pass after the flush.
   */
  const FINAL_REFETCH_MS = 4000; // > the observed memory→Mongo flush lag

  // Depend on the PRIMITIVES, never on the searchParams object: useSearchParams hands
  // back a fresh instance on every render, so listing it here tore the interval down
  // and rebuilt it on each tick — refetching the full payload anyway.
  const bulkId = searchParams.get("bulkId");
  const pageUrl = searchParams.get("url");

  useEffect(() => {
    if (id || !(bulkId && pageUrl)) return;

    let cancelled = false;
    let intervalId = null;
    let finalTimeoutId = null;

    const stop = () => {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
    };

    intervalId = setInterval(() => {
      // NOTE: this is the NORMALIZED status off `data` (DataContext collapses every
      // backend stage into pending | success | failed), so terminal is "success" —
      // NOT the raw "completed" that the /status endpoint reports.
      const s = statusRef.current;
      if (s === "success" || s === "failed") {
        stop();
        finalTimeoutId = setTimeout(() => {
          if (!cancelled) fetchBulkPageReport(bulkId, pageUrl);
        }, FINAL_REFETCH_MS);
        return;
      }
      fetchBulkPageReport(bulkId, pageUrl);
    }, 3000);

    return () => {
      cancelled = true;
      stop();
      if (finalTimeoutId) clearTimeout(finalTimeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, bulkId, pageUrl]);

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

  // `isInitialFetch` is the hook's first pull for a report we hold nothing for; every
  // refresh after it lands quietly, so the page never flashes back to a spinner.
  if (isFetching || isInitialFetch) {
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

      {/* Progress, ETA and — for a multi-page run — permission to walk away.
          Renders itself to null once the audit reaches a terminal state, so a
          finished report shows nothing extra. */}
      {/* `data.status` is the NORMALIZED status (pending | success | failed) — a
          finished report reads "success", never the raw "completed". Excluding
          "completed" therefore excluded nothing, so this panel mounted on top of
          every FINISHED report too: it polled once, saw a terminal status and
          fired "your audit has been completed successfully" at someone who was
          just re-opening an old report — plus a pointless full refetch. Gate on
          the only non-terminal value instead. */}
      {id && data?.status === "pending" && (
        <div className="px-4 sm:px-6 lg:px-8 pt-6 max-w-[1600px] mx-auto w-full">
          <AuditProgressPanel
            reportId={id}
            notifyEmail={location.state?.notifyEmail || null}
            onComplete={() => fetchSingleReport(id)}
          />
        </div>
      )}

      {/* =================================================
          SCENARIO 1: DASHBOARD VIEW ("All")
      ================================================== */}
      {data && data.report === "All" && (
        <div className="flex flex-col w-full space-y-0">
          <section id="dashboard" className="scroll-mt-24">
            <Dashboard2 darkMode={darkMode} data={stableData} loading={stableLoading} />
          </section>

          <section id="rawdata" className="scroll-mt-24">
            {/* No `section` — this dumps whatever data the client actually holds,
                and for a signed-out visitor the backend has already stripped the
                gated pillars out of it. Gating it here as well would be a
                frontend-only lock with nothing behind it. */}
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
              {reportSections.includes("AEO (Answer Engine Optimization)") && (
                <AEO darkMode={darkMode} data={stableData} loading={stableLoading} />
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default ReportLayout;