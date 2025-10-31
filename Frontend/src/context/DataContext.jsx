import { createContext, useState, useContext, useEffect } from "react";

// Context create
const DataContext = createContext();

// Custom hook for easy access
export const useData = () => useContext(DataContext);

// Provider component
export const DataProvider = ({ children }) => {
  // ✅ Pehle localStorage se data read karo
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

  // ✅ Jab bhi data badle, localStorage me save karo
  useEffect(() => {
    if (data) {
      localStorage.setItem("appData", JSON.stringify(data));
    }
  }, [data]);

  // ✅ API call function (start or continue audit)
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
    // 1️⃣ Start or resume audit
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
    setData(auditData); // save in state + localStorage

    // 2️⃣ ✅ Check if already completed
    if (auditData.Status === "completed") {
      // console.log("✅ Audit already completed — skipping live polling.");
    } else {
      // console.log("⏳ Starting live updates...");
      startLiveFetch(auditData._id);
    }
  } catch (err) {
    console.error("Error fetching data:", err);
    alert("Something went wrong!");
  } finally {
    setLoading(false);
  }
};



  // ✅ Function to fetch live updates every 3 seconds
  const startLiveFetch = (id) => {
    // Agar already koi interval chal raha hai, use stop karo
    if (intervalId) clearInterval(intervalId);

    const newInterval = setInterval(async () => {
  try {
    const res = await fetch(`http://localhost:2000/live/${id}`);
    if (!res.ok) return;
    const updated = await res.json();

    // console.log("Live Update:", updated);

    // ✅ Stop live updates when audit is completed
    if (updated.Status === "completed") {
      clearInterval(newInterval);
      setIntervalId(null);
    }

    setData(updated);
  } catch (err) {
    console.error("Error getting live updates:", err);
  }
}, 3000);


    setIntervalId(newInterval);
  };

  // ✅ Optional: clear karne ke liye function
  const clearData = () => {
    setData(null);
    localStorage.removeItem("appData");
    if (intervalId) clearInterval(intervalId);
  };

  // ✅ Cleanup jab component unmount ho
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