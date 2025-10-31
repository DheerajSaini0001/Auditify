import React, { useState, useContext, useEffect } from "react"; // 👈 useEffect import karein
import { Loader2, Search } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { useNavigate } from "react-router-dom"; // 👈 'replace' yahan zaroori nahi hai
import { ThemeContext } from "../context/ThemeContext.jsx";
import Assets from "../assets/Assets.js";

export default function DarkCard({ setData }) { // 'setData' prop yahan hai par istemaal nahi ho raha, shayad ise hata sakte hain
  const { fetchData, data, loading } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const [inputValue, setInputValue] = useState("");
  const navigate = useNavigate();
  const [device, setDevice] = useState("Desktop"); // ✅ YAHAN FIX KIYA HAI
  const [report, setReport] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState(null); // 👈 alert() ki jagah error message ke liye state

  // ✅ Handle form submission
  const handleClick = async (e) => {
    e.preventDefault();
    setError(null); // Har click par purana error hata dein

    if (!inputValue || inputValue.trim() === "") {
      setError("Please enter a URL before proceeding!"); // 👈 alert() ko isse replace kiya
      return;
    }
    
    // Sirf data fetch karein. Navigation yahan nahi hoga.
    await fetchData(inputValue, device, report);
  };

  // ✅ YEH HAI FIX:
  // Yeh effect tab chalega jab bhi 'data', 'loading', ya 'navigate' badlenge
  useEffect(() => {
    // Check karein ki loading poori ho gayi hai (false) aur data aa gaya hai (null nahi hai)
    if (!loading && data) {
      navigate("/report", { replace: true }); // ✅ Ab navigate karein
      setInputValue(""); // Input ko successful navigation ke baad clear karein
    }
  }, [data, loading, navigate]); // 👈 Dependency array

  // --- Theme-aware classes ---
  const containerClass = darkMode
    ? "scroll-smooth m-0 bg-gray-800 text-white flex flex-col h-[82vh]"
    : "scroll-smooth m-0 bg-gray-100 text-black flex flex-col h-[82vh]";

  const inputClass = darkMode
    ? "flex-1 w-full pl-10 pr-4 rounded-4xl py-2 bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-white"
    : "flex-1 w-full pl-10 pr-4 rounded-4xl py-2 bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-black";

  // ... (baaki sidebarClass etc. same rahega)
  const sidebarClass = darkMode
    ? "fixed left-0 w-64 h-[calc(100vh-4rem)] overflow-x-hidden overflow-y-hidden bg-gray-900 border-r border-gray-700 transform"
    : "fixed left-0 w-64 h-[calc(100vh-4rem)] overflow-x-hidden overflow-y-hidden bg-gray-100 border-r border-gray-300 transform";

  return (
    <div
      className={`${containerClass} bg-cover bg-center bg-no-repeat`}
      style={{
        backgroundImage: `url(${darkMode ? Assets.DarkBg : Assets.Bg})`,
      }}
    >
      {/* Main Content */}
      <div className="mx-6 mt-32 sm:mx-0 w-full backdrop-blur-xl ">
        <div
          className={`w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-6 border mx-auto ${
            darkMode ? "border-gray-700" : "border-gray-300"
          }`}
        >
          <h2 className="text-2xl font-bold text-center">
            Check your Page Audits and Performance
          </h2>

          <p
            className={`text-sm text-center ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Enter URL in the input below, select a device, and click Analyze.
          </p>

          <div className="mx-auto w-full">
            <form
              className="flex flex-col sm:flex-col gap-4 items-center w-full"
              onSubmit={handleClick} // 👈 onSubmit bhi handleClick ko call kar sakta hai
            >
              {/* Input and dropdowns */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {/* Input field */}
                <div className="relative w-full">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={inputValue}
                    disabled={loading}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter URL here..."
                    className={inputClass}
                  Multi-line license agreement
                    with a blank line
                  />
                </div>

                {/* Device Select */}
                <select
                  disabled={loading}
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  className={`w-full sm:w-40 px-4 py-2 rounded-xl shadow-2xl ${
                    darkMode
                      ? "bg-white text-black"
                      : "bg-gray-300 text-black"
                  }`}
                >
                  <option value="Desktop"> 🖥️ Desktop</option>
                  <option value="Mobile"> 📱 Mobile</option>
                </select>

                {/* Report Select */}
                <select
                  disabled={loading}
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  className={`w-full sm:w-40 px-4 py-2 rounded-xl shadow-2xl ${
                    darkMode
                      ? "bg-white text-black"
                      : "bg-gray-300 text-black"
                  }`}
                >
                  <option value="All">🌐 All</option>
                  <option value="technicalMetrics">
                    📊 Technical Performance
                  </option>
                  <option value="seoMetrics">📃 On-Page SEO</option>
                  <option value="accessibilityMetrics">♿ Accessibility</option>
                  <option value="securityCompliance">
                    🔒 Security Compliance
                  </option>
                  <option value="uxContentStructure">
                    🗂️ UX Content Structure
                  </option>
                  <option value="conversionLeadFlow">
                    🔄 Conversion & Lead Flow
                  </option>
                  <option value="aioReadiness">🤖 AIO</option>
                </select>
              </div>

              {/* Analyze Button */}
              <div className="sm:w-48">
                <button
                  type="button" // Type "button" rakhein taaki form submit na ho
                  onClick={handleClick} // 👈 Click event yahan hai
                  disabled={loading}
                  className="flex border-black border-2 gap-2 items-center justify-center bg-[#c2fbd7] text-green-700 rounded-full font-sans w-full px-16 py-2 text-base shadow-2xl select-none transition duration-250 hover:shadow-lg active:scale-[1.05] active:-rotate-1 sm:w-auto"
                >
                  {loading && <Loader2 className="animate-spin w-5 h-5" />}
                  {loading ? "Analyzing.." : "Analyze"}
                </button>
              </div>
            </form>
            
            {/* ✅ Error message yahan dikhayein */}
            {error && (
              <p className="text-red-500 text-center mt-4">{error}</p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

