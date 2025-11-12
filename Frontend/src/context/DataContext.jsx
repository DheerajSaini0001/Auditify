import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const DataContext = createContext();
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("appData");
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.error("Error parsing localStorage data:", err);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Save data to localStorage when it changes
  useEffect(() => {
    if (data) {
      localStorage.setItem("appData", JSON.stringify(data));
    }
  }, [data]);

  // ✅ Verify saved data with backend on app load
  useEffect(() => {
    const verifyData = async () => {
      if (data && data._id) {
        try {
          const res = await fetch(`http://localhost:2000/live/${data._id}`);
          if (!res.ok) {
            console.warn("⚠️ Saved data invalid — clearing...");
            clearData();
            navigate("/", { replace: true });
            return;
          }

          const verified = await res.json();
          setData(verified);
        } catch (err) {
          console.error("Error verifying saved data:", err);
          clearData();
          navigate("/", { replace: true });
        }
      }
    };

    verifyData();
  }, []); // Run only once at mount

  // ✅ Fetch audit data
  const fetchData = async (inputValue, device, report) => {
    if (!inputValue) return alert("URL is empty");

    const checkURL = () => {
      if (inputValue.includes(" ") || !inputValue.includes(".")) {
        alert("Invalid URL");
        return false;
      }
      return true;
    };
    if (!checkURL()) return;

    setLoading(true);

    try {
      const res = await fetch("http://localhost:2000/audit/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Site: inputValue, Device: device, Report: report }),
      });

      if (!res.ok) throw new Error("Failed to start audit");

      const auditData = await res.json();
      setData(auditData);

      if (auditData.Status !== "completed") {
        startLiveFetch(auditData._id);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Polling for live updates
  const startLiveFetch = (id) => {
    if (intervalId) clearInterval(intervalId);

    const newInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:2000/live/${id}`);
        if (!res.ok) return;

        const updated = await res.json();
        setData(updated);

        if (updated.Status === "completed") {
          clearInterval(newInterval);
          setIntervalId(null);
        }
      } catch (err) {
        console.error("Error getting live updates:", err);
      }
    }, 3000);

    setIntervalId(newInterval);
  };

  // ✅ Clear function
  const clearData = () => {
    setData(null);
    localStorage.removeItem("appData");
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  // ✅ Back navigation — clear data when leaving /report
  useEffect(() => {
    const handlePop = () => {
      if (location.pathname === "/report") {
        clearData();
      }
    };

    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [location.pathname, clearData]);

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
