import { useEffect, useRef, useState } from "react";
import { useData } from "../context/DataContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";

// The finished report is buffered in memory and flushed to Mongo in batches, so the
// payload changes ONCE MORE a beat after `status` turns terminal. Stopping the instant
// status goes terminal drops that last change, so take one final pass after the flush.
const FINAL_REFETCH_MS = 4000;

/**
 * Keep the report DataContext holds for `id` FRESH while the run is still going.
 *
 * The section pages (/technical-performance/:id, /on-page-seo/:id, …) are opened from
 * the summary heatmap mid-run, and the copy this tab holds is whatever the audit
 * STARTED with — an empty shell with no pillars on it. Fetching once on mount is not
 * enough either: it is only ever right for the instant it lands, and the id already
 * matches, so nothing refetches. That is how a page whose scores the summary was
 * happily rendering sat on "Processing…" until the whole run finished.
 *
 * The full report (~195 KB) is only refetched when the ~500-byte status endpoint says
 * something in the BODY actually moved — a pillar landed, PageSpeed patched the
 * Technical card and the headline score, a Stage-2 page finished. Same contract
 * ReportLayout polls on.
 *
 * Returns:
 *  • `isInitialFetch` — true only while the FIRST fetch for an id we hold nothing for
 *    is in flight, so a caller can hold the render back exactly once and let every
 *    later refresh happen silently underneath the page.
 *  • `loadFailed` — that first fetch came back empty-handed (expired, deleted, or
 *    access denied). Callers that own a whole route act on it; the ones that just
 *    render a shimmer can ignore it.
 */
export const useLiveReport = (id) => {
  const { data, fetchSingleReport } = useData();
  const [isInitialFetch, setIsInitialFetch] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  // The poll reads the CURRENT report through this ref instead of taking `data` as a
  // dependency — listing it would tear the interval down and rebuild it on every tick.
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    if (!id) return;
    setLoadFailed(false);

    let cancelled = false;
    let intervalId = null;
    let finalTimeoutId = null;
    let settled = false;
    let sig = null;
    // The bootstrap fetch below already brought the body up to date, so the first tick
    // only has to RECORD the signature rather than act on it.
    let skipNextRefetch = false;

    const stop = () => {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
    };

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
      const next = [
        status.status,
        status.completedSections,
        status.psiPending,
        status.score,
        status.grade,
        status.stage2Progress,
        status.crawledPagesCount,
        status.screenshotUrl,
      ].join("|");

      if (next !== sig) {
        sig = next;
        if (skipNextRefetch) skipNextRefetch = false;
        else fetchSingleReport(id);
      }

      if (status.status === "completed" || status.status === "failed") {
        settled = true;
        stop();
        finalTimeoutId = setTimeout(() => {
          if (!cancelled) fetchSingleReport(id);
        }, FINAL_REFETCH_MS);
      }
    };

    (async () => {
      const held = dataRef.current;

      if (held?._id !== id) {
        // Nothing for this id yet — a deep link, a refresh, or a different report still
        // in context. This one fetch is the only one the caller ever waits on.
        setIsInitialFetch(true);
        const res = await fetchSingleReport(id);
        if (cancelled) return;
        setIsInitialFetch(false);
        // No report behind this id — expired, deleted, or not ours to read. There is
        // nothing to poll for; the caller decides what to do about it.
        if (!res?.success) { setLoadFailed(true); return; }
        // Opening a report that finished long ago: it is already whole, so there is
        // no status to watch and no flush still to come. (Read off the RESPONSE, not
        // the ref — the context update behind it lands a render later.)
        const fresh = res.data;
        if (fresh?.status === "success" || fresh?.status === "failed") return;
        skipNextRefetch = true;
      } else if (held.status === "success" || held.status === "failed") {
        // Already holding the finished report — nothing left to watch, and polling it
        // would just re-download a terminal report twice for no new data.
        return;
      }

      // An in-flight copy can already be stale the moment we mount (the summary page
      // fills in live while this tab's copy is frozen at whatever the run started
      // with), so check straight away instead of waiting out the first 3s tick.
      await tick();
      if (cancelled || settled) return;
      intervalId = setInterval(tick, 3000);
    })();

    return () => {
      cancelled = true;
      stop();
      if (finalTimeoutId) clearTimeout(finalTimeoutId);
    };
  }, [id, fetchSingleReport]);

  return { isInitialFetch, loadFailed };
};
