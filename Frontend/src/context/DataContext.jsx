import { createContext, useState, useContext, useEffect, useCallback } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";

const DataContext = createContext();
export const useData = () => useContext(DataContext);

// Collapse the audit report's status into ONLY three values: pending | success | failed.
// The backend pipeline uses many internal stages (inprogress, launching, navigating,
// waiting_for_render, screenshot_ready, extracting_data, completed). We normalize them
// here so the whole app sees a single, simple status model.
const normalizeStatus = (raw) => {
  if (raw === "success" || raw === "completed") return "success";
  if (raw === "failed") return "failed";
  return "pending"; // any in-flight / unknown stage
};
const withNormalizedStatus = (report) =>
  report ? { ...report, rawStatus: report.status, status: normalizeStatus(report.status) } : report;

export const DataProvider = ({ children }) => {

  // ⭐ DATA STATE (Persist in LocalStorage to handle refresh)
  // ⭐ DATA STATE
  const [data, setData] = useState(null);
  
  // 🔄 ISOLATED POLLING STATE
  const [pollingState, setPollingState] = useState({}); // { [auditId]: "inprogress" | "completed" | "failed" }

  // 🤖 AI CHAT OVERLAY STATE
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiChatContext, setAiChatContext] = useState(null);

  // 👥 AUDIENCE MODE — the report now has a SINGLE mode that shows every parameter,
  // so this no longer affects what's displayed or downloaded (the dealer/developer
  // toggle has been removed). It's kept only so existing call sites that still read
  // it from context keep working; the visibility helpers ignore its value.
  const [audienceMode, setAudienceMode] = useState("dealer");

  // 🛡️ HELPER: Safe LocalStorage with Cleanup
  const safeLocalStorageSet = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn("🧹 LocalStorage full, clearing old audit data...");
        // Clear all audit-related keys except for essential ones
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('dealerpulse_audit_') && k !== key) {
            localStorage.removeItem(k);
          }
        });
        // Try again for the current data
        try {
          localStorage.setItem(key, value);
        } catch (retryError) {
          console.error("❌ LocalStorage still full after cleanup", retryError);
        }
      }
    }
  };

  // Sync data to state, but avoid global collision by using ID-based logic where possible
  useEffect(() => {
    if (data && data._id) {
      safeLocalStorageSet(`dealerpulse_audit_${data._id}`, JSON.stringify(data));
      localStorage.setItem("dealerpulse_latest_audit_id", data._id);
    }
  }, [data]);

  // 👥 Reset to Dealer view whenever a DIFFERENT report loads, so every new audit
  // opens in Dealer mode regardless of the last toggle. Keyed on data._id (a string),
  // so live-poll refreshes of the SAME report don't reset it — a manual switch to
  // Developer stays put while viewing that one report, and only snaps back to Dealer
  // when another audit/report is opened.
  useEffect(() => {
    setAudienceMode("dealer");
  }, [data?._id]);

  const [loading, setLoading] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  // ️ HELPER: Standardized Response Handler
  const handleResponse = async (res) => {
    let data;
    try {
      data = await res.json();
    } catch {
      data = {}; // Fallback if JSON parse fails
    }

    if (!res.ok) {
      if (res.status === 429) {
        return { success: false, status: 429, error: data.error || "Too many requests. Please wait 15 minutes." };
      }
      return { success: false, status: res.status, error: data.error || data.message || `Request failed with status ${res.status}` };
    }

    return { success: true, status: res.status, data };
  };

  const syncAuditSummaryStorage = (reportData) => {
    if (!reportData) return;
    // Only a PARENT (multi-page) report owns the summary's page list — it's the one
    // that fanned out to key pages, so it carries crawledPagesSummary. A child/leaf
    // page report has none; VIEWING one (clicking VDP, then "Back to Summary") must
    // NOT overwrite the saved page list, otherwise the summary collapses to that one
    // page. EXCEPTION: the ROOT audit (the one this session started) also has zero
    // crawled pages before its Stage-2 rows land — it must still SEED the summary
    // (home-only) or "/audit-summary" has nothing to render and bounces to "/".
    const crawled = Array.isArray(reportData.crawledPagesSummary) ? reportData.crawledPagesSummary : [];
    const isRootAudit = sessionStorage.getItem('auditRootId') === String(reportData._id);
    if (crawled.length === 0 && !isRootAudit) return;
    try {
      const summaryPages = [];

      summaryPages.push({
        key: reportData.pageType || 'home',
        label: 'Home Page',
        url: reportData.url,
        id: reportData._id,
        status: 'done'
      });

      crawled.forEach((p) => {
        if (p.url && !summaryPages.some((sp) => sp.url === p.url)) {
          summaryPages.push({
            key: p.pageType || 'generic',
            label: p.label || 'Key Page',
            url: p.url,
            // Each key page now has its OWN full child report — open THAT, not the
            // parent (falls back to the parent id only until the child id lands).
            id: p.reportId || reportData._id,
            status: p.isProcessing ? 'pending' : (p.success ? 'done' : 'pending')
          });
        }
      });

      sessionStorage.setItem("auditSummary", JSON.stringify({
        siteUrl: reportData.url,
        device: reportData.device || 'Desktop',
        pages: summaryPages
      }));
    } catch (e) {
      console.warn("Could not update audit summary storage:", e);
    }
  };

  // 🚀 FETCH DATA
  // Audits need no guest verification — no captcha, no emailed OTP, no grant.
  // Logged-in users still hit /api/user/audit with their Bearer token.
  const fetchData = async (inputValue, device, report, force = false, pageScopes = null, notifyEmail = null, country = null) => {
    if (loading) return { success: false, error: "An audit is already in progress." };
    if (!inputValue) return { success: false, error: "URL is empty" };

    if (inputValue.includes(" ") || !inputValue.includes(".")) {
      return { success: false, error: "Invalid URL format" };
    }

    setLoading(true);

    try {
      const screenResolution = `${window.screen.width}x${window.screen.height}`;
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
      
      const token = localStorage.getItem('dealerpulse_token');
      const endpoint = token ? '/api/user/audit' : '/single-audit/audit';

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({
          url: inputValue,
          device,
          report,
          screenResolution,
          force,
          // Page types the user kept ticked on the home page. ["home"] alone means
          // "audit only the URL I entered" — the worker then skips the key-page crawl.
          ...(Array.isArray(pageScopes) && pageScopes.length ? { pageScopes } : {}),
          // Multi-page runs take minutes, so the visitor is told to leave the page.
          // This is where the finished report reaches them.
          ...(notifyEmail ? { notifyEmail } : {}),
          // Market the visitor selected on the home page. Stored with the run;
          // see Frontend/src/config/countries.js for its current effect.
          ...(country ? { country } : {}),
        })
      });

      const result = await handleResponse(res);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const auditData = withNormalizedStatus(result.data);
      setData(auditData);

      // Remember WHICH audit this session started (the parent/root). Lets
      // syncAuditSummaryStorage seed the summary before Stage-2 pages land, and
      // lets /audit-summary rebuild its payload if sessionStorage was empty —
      // instead of bouncing the user to "/". Set BEFORE the first sync below.
      try {
        sessionStorage.setItem('auditRootId', String(auditData._id));
        sessionStorage.setItem('auditRootUrl', auditData.url || inputValue);
        sessionStorage.setItem('auditRootDevice', auditData.device || device || 'Desktop');
      } catch { /* storage full/blocked — non-fatal */ }

      syncAuditSummaryStorage(auditData);

      if (auditData.status !== "success") {
        startLiveFetch(auditData._id);
      }

      return { success: true, id: auditData._id };

    } catch (err) {
      console.error(err);
      return { success: false, error: "Server connection failed. Is the backend running?" };
    } finally {
      setLoading(false);
    }
  };

  // 🔄 LIVE UPDATES (Status-Only)
  const startLiveFetch = (id) => {
    if (intervalId) clearInterval(intervalId);

    setPollingState(prev => ({ ...prev, [id]: "pending" }));

    // Poll the ~500-byte STATUS endpoint, not the full report. This used to refetch
    // the entire ~195 KB report every 3s for the whole run, which is pure waste: the
    // only things this poller produces are `pollingState` and the completion toast,
    // and neither needs the report body. The finished report is pulled exactly once,
    // when the run actually reaches a terminal state.
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";

    const newInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem("dealerpulse_token");
        const res = await fetch(`${API_URL}/single-audit/${id}/status`, {
          credentials: "include",
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });

        // Report is gone (deleted/expired) — stop, same as the old !success branch.
        if (res.status === 404 || res.status === 403) {
          clearInterval(newInterval);
          setIntervalId(null);
          return;
        }
        if (!res.ok) return; // transient — try again on the next tick

        const raw = await res.json();
        const newStatus = normalizeStatus(raw.status);
        setPollingState(prev => ({ ...prev, [id]: newStatus }));

        if (newStatus === "success" || newStatus === "failed") {
          clearInterval(newInterval);
          setIntervalId(null);

          // One full fetch, now that there is a finished report worth fetching.
          await fetchSingleReport(id);

          if (newStatus === "success") {
            toast.success("Audit complete!");
          } else {
            toast.error("Audit run failed.");
          }
        }
      } catch (err) {
        console.error("Error polling audit:", err);
      }
    }, 3000);

    setIntervalId(newInterval);
  };

  // 🚀 SINGLE AUDIT: GET BY ID
  const fetchSingleReport = useCallback(async (id) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
      const token = localStorage.getItem('dealerpulse_token');
      const res = await fetch(`${API_URL}/single-audit/${id}`, { 
        credentials: 'include',
        headers: {
          ...(token && { "Authorization": `Bearer ${token}` })
        }
      });

      const result = await handleResponse(res);
      if (result.success) {
        result.data = withNormalizedStatus(result.data);
        setData(result.data);
        syncAuditSummaryStorage(result.data);
        safeLocalStorageSet(`dealerpulse_audit_${id}`, JSON.stringify(result.data));
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // 🧹 CLEAR
  const clearData = () => {
    setData(null);
    // LocalStorage removal not needed as we don't store it anymore
    if (intervalId) clearInterval(intervalId);
  };

  // 🔄 RESTART POLLING ON REFRESH
  useEffect(() => {
    if (data && data.status === "pending" && !intervalId) {
      startLiveFetch(data._id);
    }
  }, [data, intervalId]);

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  const getAuditById = async (id) => {
    // 1. Check current state
    if (data && data._id === id) return data;

    // 2. Check localStorage
    const saved = localStorage.getItem(`dealerpulse_audit_${id}`);
    if (saved) {
        const parsed = JSON.parse(saved);
        setData(parsed);
        return parsed;
    }

    // 3. Fetch from backend
    const result = await fetchSingleReport(id);
    return result.success ? result.data : null;
  };

  return (
    <DataContext.Provider
      value={{ 
        data, setData, loading, fetchData, clearData, fetchSingleReport, getAuditById,
        isAiChatOpen, setIsAiChatOpen, aiChatContext, setAiChatContext,
        audienceMode, setAudienceMode,
        pollingState, setPollingState
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
