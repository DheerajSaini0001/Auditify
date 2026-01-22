import { createContext, useState, useContext, useEffect } from "react";

const DataContext = createContext();
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {

  // ⭐ DATA STATE (In-Memory Only)
  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  // 🚀 FETCH DATA
  const fetchData = async (inputValue, device, report) => {
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
        body: JSON.stringify({ url: inputValue, device: device, report: report }),
      });

      const auditData = await res.json();

      if (!res.ok) {
        // Handle specific status codes
        if (res.status === 429) {
          return { success: false, error: "Too many requests. Please wait 15 minutes." };
        }
        return { success: false, error: auditData.error || auditData.message || "Audit failed to start." };
      }

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
        const res = await fetch(`${API_URL}/audit-report/single/${id}`);
        const updated = await res.json();

        if (updated.status === "completed") {
          clearInterval(newInterval);
          setIntervalId(null);
        }

        setData(updated);
      } catch { }
    }, 3000);

    setIntervalId(newInterval);
  };

  // 🚀 BULK AUDIT: DISCOVER
  const discoverUrls = async (url, maxPages) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
      const res = await fetch(`${API_URL}/bulk-audit/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, maxPages }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Discovery failed");
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 🚀 BULK AUDIT: START
  const startBulkAudit = async (url, selectedUrls, device, report) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
      const res = await fetch(`${API_URL}/bulk-audit/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, selectedUrls, device, report }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Audit start failed");
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 🚀 BULK AUDIT: COMPLETED STATUS
  const getBulkAuditStatus = async (bulkAuditId) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
      const res = await fetch(`${API_URL}/audit-report/bulk/${bulkAuditId}`);
      if (!res.ok) {
        return { success: false, status: res.status };
      }
      const result = await res.json();
      return { success: true, data: result };
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
      value={{ data, setData, loading, fetchData, clearData, discoverUrls, startBulkAudit, getBulkAuditStatus }}
    >
      {children}
    </DataContext.Provider>
  );
};
