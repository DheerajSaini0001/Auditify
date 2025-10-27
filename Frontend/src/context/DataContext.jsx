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

  // ✅ Jab bhi data badle, localStorage me save karo
  useEffect(() => {
    if (data) {
      localStorage.setItem("appData", JSON.stringify(data));
    }
  }, [data]);

  // ✅ API call function (handleClick ka logic yahan shift)
  const fetchData = async (inputValue, device, report) => {
    if (!inputValue) return alert("URL is empty");

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
      setData(result); // 👈 Store in context + localStorage (auto via useEffect)
      
      return result;
      
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Optional: clear karne ke liye function
  const clearData = () => {
    setData(null);
    localStorage.removeItem("appData");
  };

  return (
    <DataContext.Provider value={{ data, setData, loading, fetchData, clearData }}>
      {children}
    </DataContext.Provider>
  );
};
