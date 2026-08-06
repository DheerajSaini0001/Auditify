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
   * Live polling — driven by the cheap status endpoint, so the full report is only
   * refetched when the run actually produced something new.
   *
   * This used to refetch the ENTIRE report every 3s for as long as the page stayed
   * open, terminal or not. Measured against a live run: 22 fetches, of which only 9
   * returned new data — and once the audit completed every further fetch was
   * byte-identical, forever, at 195 KB a time (~234 MB/hour per open tab, plus a
   * Mongo read and a full gating pass each). The report page is the one users leave
   * open the longest, so it was the worst possible place for it.
   *
   * /single-audit/:id/status is ~500 bytes and is served from the in-memory audit
   * store (usually no DB read at all), and it already carries every signal that marks
   * new data: completedSections climbs 0→8 as pillars land, psiPending/score/grade
   * flip when PageSpeed patches the Technical card, stage2Progress moves as extra
   * pages land. So nothing is invisible to it — the progressive reveal is unchanged.
   *
   * One subtlety, measured rather than assumed: the payload changes ONCE MORE a beat
   * after `status` turns terminal, because the finished report is buffered in memory
   * and flushed to Mongo in batches ("buffered 1/10 for next flush") and the two
   * serialize differently. Stopping the instant status is terminal would drop that,
   * so we stop the interval and take one final pass after the flush has landed.
   */
  const FINAL_REFETCH_MS = 4000; // > the observed memory→Mongo flush lag
  const pollSigRef = React.useRef(null);

  // Depend on the PRIMITIVES, never on the searchParams object: useSearchParams hands
  // back a fresh instance on every render, so listing it here tore the interval down
  // and rebuilt it on each tick — which reset pollSigRef and made the very next tick
  // look like "new data", refetching the full report anyway. Measured: 28 full fetches
  // across a 105s run instead of the ~10 the run actually produced.
  const bulkId = searchParams.get("bulkId");
  const pageUrl = searchParams.get("url");

  useEffect(() => {
    if (!id && !(bulkId && pageUrl)) return;

    let cancelled = false;
    let intervalId = null;
    let finalTimeoutId = null;

    const stop = () => {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
    };
    const scheduleFinalPass = (refetch) => {
      stop();
      finalTimeoutId = setTimeout(() => { if (!cancelled) refetch(); }, FINAL_REFETCH_MS);
    };

    // Bulk pages have no status endpoint of their own, so they keep polling the full
    // payload — but they no longer do it forever once the run is terminal.
    if (!id) {
      intervalId = setInterval(() => {
        // NOTE: this is the NORMALIZED status off `data` (DataContext collapses every
        // backend stage into pending | success | failed), so terminal is "success" —
        // NOT the raw "completed" that the /status endpoint reports.
        const s = statusRef.current;
        if (s === "success" || s === "failed") {
          scheduleFinalPass(() => fetchBulkPageReport(bulkId, pageUrl));
          return;
        }
        fetchBulkPageReport(bulkId, pageUrl);
      }, 3000);
      return () => { cancelled = true; stop(); if (finalTimeoutId) clearTimeout(finalTimeoutId); };
    }

    pollSigRef.current = null;
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";

    const tick = async () => {
      let status;
      try {
        const token = localStorage.getItem("dealerpulse_token");
        const res = await fetch(`${API_URL}/single-audit/${id}/status`, {
          credentials: "include",
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });
        if (!res.ok) return; // transient — try again on the next tick
        status = await res.json();
      } catch {
        return;
      }
      if (cancelled) return;

      // Everything whose movement means the report BODY changed.
      const sig = [
        status.status,
        status.completedSections,
        status.psiPending,
        status.score,
        status.grade,
        status.stage2Progress,
        status.crawledPagesCount,
        status.screenshotUrl,
      ].join("|");

      if (sig !== pollSigRef.current) {
        pollSigRef.current = sig;
        fetchSingleReport(id);
      }

      if (status.status === "completed" || status.status === "failed") {
        scheduleFinalPass(() => fetchSingleReport(id));
      }
    };

    intervalId = setInterval(tick, 3000);

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

      {/* Progress, ETA and — for a multi-page run — permission to walk away.
          Renders itself to null once the audit reaches a terminal state, so a
          finished report shows nothing extra. */}
      {id && data?.status !== "completed" && data?.status !== "failed" && (
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