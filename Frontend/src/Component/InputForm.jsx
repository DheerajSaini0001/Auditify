import React, { useState, useContext, useEffect } from "react";
import { Loader2, Search, Monitor, Smartphone, ChevronDown, Settings, AlertCircle } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext.jsx";
import Assets from "../assets/Assets.js";

export default function InputForm() {
  const { fetchData, data, loading } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const [inputValue, setInputValue] = useState("");
  const [device, setDevice] = useState("Desktop");
  const [report, setReport] = useState("All");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Handle submit
  const handleClick = async (e) => {
    e.preventDefault();
    setError(null);

    if (!inputValue.trim()) {
      setError("Please enter a URL before proceeding!");
      return;
    }

    // Auto-prefix protocol if missing
    let urlToFetch = inputValue.trim();
    if (!/^https?:\/\//i.test(urlToFetch)) {
      urlToFetch = `https://${urlToFetch}`;
    }

    await fetchData(urlToFetch, device, report);
  };

  // Navigate to /report after data arrives
  // YEH WALA CODE BILKUL SAHI HAI
  useEffect(() => {
    if (inputValue && data?.Site && !loading) {
      // ⭐ FINAL FIX → CLEAN NAVIGATION
      navigate("/report");
      setInputValue("");
    }
    else {
      navigate("/");
    }
  }, [data, loading, navigate]);


  // Styles
  const containerClass = darkMode
    ? "min-h-[70vh] flex flex-col items-center justify-center bg-[#0B1120] text-white relative overflow-hidden font-sans"
    : "min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 text-slate-900 relative overflow-hidden font-sans";

  return (
    <div className={containerClass}>
      {/* Background Grid Pattern */}
      <div className={`absolute inset-0 ${darkMode ? 'bg-grid-white/[0.03]' : 'bg-grid-black/[0.03]'} pointer-events-none`} />

      {/* Content Wrapper */}
      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center">

        {/* Header Section */}
        <div className="text-center mb-10 space-y-5 animate-in fade-in slide-in-from-bottom-5 duration-700">

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Analyze your <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">Website Health</span>
          </h1>

          <p className={`max-w-2xl mx-auto text-lg ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Get a comprehensive professional audit of your site's Performance, SEO, Accessibility, and UX in seconds.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleClick} className="w-full max-w-4xl relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">

          <div className={`
            flex flex-col lg:flex-row items-center p-2 rounded-2xl border transition-all duration-300
            ${darkMode
              ? "bg-slate-900/90 border-slate-700 shadow-2xl shadow-black/50 hover:border-slate-600"
              : "bg-white border-slate-200 shadow-xl shadow-slate-200/50 hover:border-slate-300"
            }
          `}>

            {/* Main Input */}
            <div className="flex-1 w-full relative flex items-center px-4 h-14">
              <Search className={`w-5 h-5 flex-shrink-0 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
                placeholder="Enter website URL (e.g. example.com)"
                className={`w-full h-full bg-transparent border-none outline-none text-lg px-4 font-medium placeholder-slate-500 ${darkMode ? "text-white" : "text-slate-900"}`}
              />
            </div>

            {/* Divider */}
            <div className={`hidden lg:block w-px h-8 ${darkMode ? "bg-slate-700" : "bg-slate-200"} mx-2`}></div>

            {/* Mobile Divider */}
            <div className={`lg:hidden w-full h-px ${darkMode ? "bg-slate-700" : "bg-slate-200"} my-2`}></div>

            {/* Controls Group */}
            <div className="flex w-full lg:w-auto items-center gap-2 px-2">

              {/* Device Selector */}
              <div className="relative group flex-1 lg:flex-none">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}>
                  {device === "Desktop" ? <Monitor className="w-4 h-4 text-blue-500" /> : <Smartphone className="w-4 h-4 text-purple-500" />}
                  <select
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    disabled={loading}
                    className={`appearance-none bg-transparent border-none outline-none text-sm font-medium cursor-pointer w-20 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    <option value="Desktop">Desktop</option>
                    <option value="Mobile">Mobile</option>
                  </select>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </div>
              </div>

              {/* Report Selector */}
              <div className="relative group flex-1 lg:flex-none">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}>
                  <Settings className="w-4 h-4 text-emerald-500" />
                  <select
                    value={report}
                    onChange={(e) => setReport(e.target.value)}
                    disabled={loading}
                    className={`appearance-none bg-transparent border-none outline-none text-sm font-medium cursor-pointer w-24 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    <option value="All">Full Audit</option>
                    <option value="Technical Performance">Performance</option>
                    <option value="On Page SEO">SEO</option>
                    <option value="Accessibility">Accessibility</option>
                    <option value="Security/Compliance">Security</option>
                    <option value="UX & Content Structure">UX / Structure</option>
                    <option value="Conversion & Lead Flow">Conversion</option>
                    <option value="AIO (AI-Optimization) Readiness">AI Readiness</option>
                  </select>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`
                  hidden lg:flex items-center justify-center gap-2 px-6 py-3 ml-2 rounded-xl font-bold text-white shadow-lg transition-all 
                  bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 hover:shadow-emerald-500/25 active:scale-95
                  disabled:opacity-70 disabled:cursor-wait min-w-[140px]
                `}
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Analyze"}
              </button>

            </div>
          </div>

          {/* Mobile Submit Button (Visible only on mobile) */}
          <button
            type="submit"
            disabled={loading}
            className={`
              lg:hidden w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white shadow-lg transition-all 
              bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95
              disabled:opacity-70 disabled:cursor-wait
            `}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                <span>Analyzing...</span>
              </>
            ) : (
              "Run Free Audit"
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="absolute -bottom-16 left-0 right-0 mx-auto w-full max-w-md animate-in slide-in-from-top-2 fade-in">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}