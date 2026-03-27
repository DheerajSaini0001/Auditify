import { createContext, useState, useContext, useEffect, useCallback } from "react";

const DataContext = createContext();
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {

  // ⭐ DATA STATE (In-Memory Only)
  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  // �️ HELPER: Standardized Response Handler
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

  // �🚀 FETCH DATA
  const fetchData = async (inputValue, device, report, recaptchaToken) => {
    if (!inputValue) return { success: false, error: "URL is empty" };

    if (inputValue.includes(" ") || !inputValue.includes(".")) {
      return { success: false, error: "Invalid URL format" };
    }

    setLoading(true);

    try {
      // Use environment variable for API URL
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";

      const res = await fetch(`${API_URL}/single-audit/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputValue, device: device, report: report, recaptchaToken: recaptchaToken }),
      });

      const result = await handleResponse(res);

      if (!result.success) {
        return result;
      }

      const auditData = result.data;
      setData(auditData);

      if (auditData.status !== "completed") {
        startLiveFetch(auditData._id);
      }

      return { success: true };

    } catch (err) {
      console.error(err);
      return { success: false, error: "Server connection failed. Is the backend running?" };
    } finally {
      setLoading(false);
    }
  };

  // 🔄 LIVE UPDATES
  const startLiveFetch = (id) => {
    if (intervalId) clearInterval(intervalId);

    const newInterval = setInterval(async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
        const res = await fetch(`${API_URL}/single-audit/${id}`);

        // Stop polling if data is lost/deleted (404)
        if (res.status === 404) {
          clearInterval(newInterval);
          setIntervalId(null);
          setData(null); // Triggers redirect in ReportLayout
          return;
        }

        // For live poll, we just silently fail/ignore errors mostly, but we should parse safely
        if (res.ok) {
          const updated = await res.json();
          if (updated.status === "completed") {
            clearInterval(newInterval);
            setIntervalId(null);
          }
          setData(updated);
        }
      } catch { }
    }, 3000);

    setIntervalId(newInterval);
  };

  // 🚀 BULK AUDIT: DISCOVER
  const discoverUrls = async (url, maxPages, recaptchaToken) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
      const res = await fetch(`${API_URL}/bulk-audit/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, maxPages, recaptchaToken }),
      });

      return await handleResponse(res);

    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 🚀 BULK AUDIT: START
  const startBulkAudit = async (url, selectedUrls, device, report, recaptchaToken) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
      const res = await fetch(`${API_URL}/bulk-audit/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, selectedUrls, device, report, recaptchaToken }),
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
      const res = await fetch(`${API_URL}/single-audit/${id}`);

      const result = await handleResponse(res);
      if (result.success) {
        setData(result.data);
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
      const res = await fetch(`${API_URL}/bulk-audit/${bulkAuditId}`);

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

  // 🧹 CLEAR
  const clearData = () => {
    setData(null);
    // LocalStorage removal not needed as we don't store it anymore
    if (intervalId) clearInterval(intervalId);
  };

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  return (
    <DataContext.Provider
      value={{ data, setData, loading, fetchData, clearData, discoverUrls, startBulkAudit, getBulkAuditStatus, fetchSingleReport }}
    >
      {children}
    </DataContext.Provider>
  );
};
