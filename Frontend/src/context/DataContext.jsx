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

  // 👥 AUDIENCE MODE ('dealer' | 'developer') — controls which parameters show
  // across all report sections and which PDF gets downloaded. ALWAYS defaults to
  // 'dealer' on a fresh load (the primary audience); the toggle changes it for the
  // current session only — we intentionally do NOT persist it, so every page load /
  // new audit starts in Dealer view.
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

  // 🚀 FETCH DATA
  const fetchData = async (inputValue, device, report, captchaAnswer, captchaId, force = false) => {
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
          captchaAnswer,
          captchaId, // Added
          screenResolution,
          force
        })
      });

      const result = await handleResponse(res);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const auditData = withNormalizedStatus(result.data);
      setData(auditData);

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

    const newInterval = setInterval(async () => {
      try {
        const result = await fetchSingleReport(id);

        if (result && result.success && result.data) {
          const newStatus = result.data.status;
          setPollingState(prev => ({ ...prev, [id]: newStatus }));

          if (newStatus === "success" || newStatus === "failed") {
            clearInterval(newInterval);
            setIntervalId(null);

            if (newStatus === "success") {
              toast.success("Audit complete!");
            } else if (newStatus === "failed") {
              toast.error("Audit run failed.");
            }
          }
        } else {
          clearInterval(newInterval);
          setIntervalId(null);
        }
      } catch (err) {
        console.error("Error polling audit:", err);
      }
    }, 3000);

    setIntervalId(newInterval);
  };

  // 🚀 BULK AUDIT: DISCOVER
  const discoverUrls = async (url, maxPages, captchaAnswer, captchaId) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
      const token = localStorage.getItem('dealerpulse_token');

      const res = await fetch(`${API_URL}/bulk-audit/discover`, {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({ url, maxPages, captchaAnswer, captchaId }),
      });

      return await handleResponse(res);

    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 🚀 BULK AUDIT: START
  const startBulkAudit = async (url, selectedUrls, device, report, captchaAnswer, captchaId) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
      const token = localStorage.getItem('dealerpulse_token');
      const screenResolution = `${window.screen.width}x${window.screen.height}`;

      const res = await fetch(`${API_URL}/bulk-audit/audit`, {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({ 
          url: url, 
          selectedUrls, 
          device, 
          report, 
          captchaAnswer,
          captchaId,
          screenResolution
        }),
      });

      return await handleResponse(res);

    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 🚀 BULK AUDIT: AUTO DISCOVER & START
  const autoBulkAudit = async (url, maxPages, device, report, captchaAnswer, captchaId) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
      const token = localStorage.getItem('dealerpulse_token');

      const res = await fetch(`${API_URL}/bulk-audit/auto-audit`, {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({ url, maxPages, device, report, captchaAnswer, captchaId }),
      });

      return await handleResponse(res);

    } catch (error) {
      return { success: false, error: error.message };
    }
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
        safeLocalStorageSet(`dealerpulse_audit_${id}`, JSON.stringify(result.data));
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // 🚀 BULK AUDIT: COMPLETED STATUS
  const getBulkAuditStatus = async (bulkAuditId) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
      const res = await fetch(`${API_URL}/bulk-audit/${bulkAuditId}`, { credentials: 'include' });

      const result = await handleResponse(res);
      if (!result.success) {
        // Pass status code for polling logic
        return { ...result, status: res.status };
      }
      return result;

    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const fetchBulkPageReport = async (bulkId, pageUrl) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
      const token = localStorage.getItem('dealerpulse_token');
      const res = await fetch(`${API_URL}/bulk-audit/${bulkId}/page?url=${encodeURIComponent(pageUrl)}`, { 
        credentials: 'include',
        headers: {
          ...(token && { "Authorization": `Bearer ${token}` })
        }
      });

      const result = await handleResponse(res);
      if (result.success) {
        result.data = withNormalizedStatus(result.data);
        setData(result.data);
        safeLocalStorageSet(`dealerpulse_audit_${result.data._id}`, JSON.stringify(result.data));
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

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
        data, setData, loading, fetchData, clearData, discoverUrls, startBulkAudit, autoBulkAudit, getBulkAuditStatus, fetchSingleReport, getAuditById, fetchBulkPageReport,
        isAiChatOpen, setIsAiChatOpen, aiChatContext, setAiChatContext,
        audienceMode, setAudienceMode,
        pollingState, setPollingState
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
