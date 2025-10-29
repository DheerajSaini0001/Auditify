import { createContext, useState, useContext, useEffect } from "react";

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  // ✅ Safe initial load
  const initialState = (() => {
    try {
      const saved = localStorage.getItem("appData");
      return saved ? JSON.parse(saved) : {}; // 👈 null → {} (empty object)
    } catch (err) {
      console.error("Error parsing localStorage data:", err);
      return {};
    }
  })();

  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false); // 👈 to prevent weird double fetches

  // ✅ Sync with localStorage (and remove when empty)
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      localStorage.setItem("appData", JSON.stringify(data));
    } else {
      localStorage.removeItem("appData");
    }
  }, [data]);

  // ✅ Fetch API data
  const fetchData = async (inputValue, device, report) => {
    if (!inputValue) {
      alert("URL is empty");
      return;
    }

    if (isFetching) return; // 👈 stop duplicate triggers
    setIsFetching(true);
    setLoading(true);

    const checkURL = () => {
      if (inputValue.includes(" ") || !inputValue.includes(".")) {
        alert("Invalid URL");
        return false;
      }
      return true;
    };

    if (!checkURL()) {
      setLoading(false);
      setIsFetching(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:2000/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([inputValue, device, report]),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const result = await response.json();

      // ✅ Set in both state and localStorage instantly (first call fix)
      setData(result);
      localStorage.setItem("appData", JSON.stringify(result)); // 👈 ADD THIS LINE

      return result;
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // ✅ Clear all stored data
  const clearData = () => {
    localStorage.removeItem("appData");
    setData({});
  };

  return (
    <DataContext.Provider
      value={{ data, setData, loading, fetchData, clearData }}
    >
      {children}
    </DataContext.Provider>
  );
};
