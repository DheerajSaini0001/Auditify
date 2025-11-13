import { createContext, useState, useContext, useEffect } from "react";

const DataContext = createContext();
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {

  // ⭐ PERSISTENT DATA LOAD (SAFE)
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("appData");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  // ⭐ SAVE to localStorage only when data changes
  useEffect(() => {
    if (data) {
      localStorage.setItem("appData", JSON.stringify(data));
    }
  }, [data]);

  // 🚀 FETCH DATA (same)
  const fetchData = async (inputValue, device, report) => {
    if (!inputValue) return alert("URL is empty");

    if (inputValue.includes(" ") || !inputValue.includes(".")) {
      alert("Invalid URL");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:2000/audit/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Site: inputValue, Device: device, Report: report }),
      });

      const auditData = await res.json();
      setData(auditData);

      if (auditData.Status !== "completed") {
        startLiveFetch(auditData.auditId);
      }

    } catch {
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 LIVE UPDATES
  const startLiveFetch = (id) => {
    if (intervalId) clearInterval(intervalId);

    const newInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:2000/report/${id}`);
        const updated = await res.json();

        if (updated.Status === "completed") {
          clearInterval(newInterval);
          setIntervalId(null);
        }

        setData(updated);
      } catch {}
    }, 3000);

    setIntervalId(newInterval);
  };

  // 🧹 CLEAR
  const clearData = () => {
    setData(null);
    localStorage.removeItem("appData");
    if (intervalId) clearInterval(intervalId);
  };

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  return (
    <DataContext.Provider
      value={{ data, setData, loading, fetchData, clearData }}
    >
      {children}
    </DataContext.Provider>
  );
};
