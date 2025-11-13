import { createContext, useState, useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom"; 

const DataContext = createContext();
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  // ⭐ FIXED — do NOT auto-load from localStorage
  const [data, setData] = useState(null); // <— FINAL FIX

  const [loading, setLoading] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  const navigate = useNavigate();

  // Save data to localStorage when updated
  useEffect(() => {
    if (data) {
      localStorage.setItem("appData", JSON.stringify(data));
    }
  }, [data]);

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
        body: JSON.stringify({
          Site: inputValue,
          Device: device,
          Report: report,
        }),
      });

      if (!res.ok) throw new Error("Failed to start audit");

      const auditData = await res.json();
      setData(auditData);

      if (auditData.Status !== "completed") {
        startLiveFetch(auditData.auditId);
      }
    } catch (err) {
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const startLiveFetch = (id) => {
    if (intervalId) clearInterval(intervalId);

    const newInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:2000/report/${id}`);
        if (!res.ok) return;
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

  const clearData = () => {
    navigate("/");
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
      value={{
        data,
        setData,
        loading,
        fetchData,
        clearData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};