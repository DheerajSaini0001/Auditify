import React, { useState, useContext, useEffect } from "react";
import { Loader2, Search, Monitor, Smartphone, ChevronDown, Settings, AlertCircle } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Assets from "../assets/Assets.js";
import ReCAPTCHA from "react-google-recaptcha";
import { useRef } from "react";

// Custom Dropdown Component
const CustomDropdown = ({ value, onChange, options, icon, darkMode, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || value;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors border ${darkMode
          ? "hover:bg-slate-800 border-transparent hover:border-slate-700"
          : "hover:bg-slate-50 border-transparent hover:border-slate-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {icon}
        <span className={`text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"} truncate`}>
          {selectedLabel}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""} ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute top-full mt-2 left-0 w-max min-w-full z-[110] rounded-xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${darkMode ? "bg-slate-900 border-slate-700 text-slate-300" : "bg-white border-slate-100 text-slate-700"
          }`}>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium cursor-pointer transition-colors ${darkMode
                  ? "hover:bg-slate-800 hover:text-white"
                  : "hover:bg-slate-50 hover:text-black"
                  } ${value === option.value ? (darkMode ? "bg-slate-800 text-white" : "bg-slate-50 text-black") : ""}`}
              >
                {/* Optional: Add check icon or dot for selected state */}
                {value === option.value && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function InputForm() {
  const { fetchData, data, loading } = useData();
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const darkMode = theme === "dark";

  const [inputValue, setInputValue] = useState("");
  const [device, setDevice] = useState("Desktop");
  const [report, setReport] = useState("All");
  const [error, setError] = useState(null);

  // reCAPTCHA v2 State
  const recaptchaRef = useRef(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const isAuditStarting = useRef(false);
  const processedUrlRef = useRef(null);

  // Auto-fill from query params or lost report recovery
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryUrl = params.get("url");

    if (queryUrl && queryUrl !== processedUrlRef.current && !isAuditStarting.current) {
      setInputValue(queryUrl);
      processedUrlRef.current = queryUrl;
      
      // Auto-trigger audit logic
      const runDirectly = async () => {
        // If logged in, skip captcha and run
        if (localStorage.getItem('auditify_token')) {
          let urlToFetch = queryUrl.trim();
          if (!/^https?:\/\//i.test(urlToFetch)) {
            urlToFetch = `https://${urlToFetch}`;
          }
          
          isAuditStarting.current = true;
          await fetchData(urlToFetch, device, report, null);
          isAuditStarting.current = false;
        } else {
          // Guest user: just show captcha modal for the URL
          setShowCaptcha(true);
        }
      };

      runDirectly();
      
      // Remove query param from URL (standard React Router way)
      navigate(location.pathname, { replace: true });
    } else if (location.state?.autoFill) {
      setInputValue(location.state.url);
      setDevice(location.state.device);
      setReport(location.state.report);
      setError("This specific audit record is no longer available. Re-run it now.");
      setShowCaptcha(true);
      
      // Clear state to prevent loop if user reloads
      window.history.replaceState({}, document.title);
    }
  }, [location.search, location.state, navigate, device, report, fetchData]);

  // Handle submit (v2 Click → Trigger Modal)
  const handleClick = (e) => {
    e.preventDefault();
    setError(null);

    if (!inputValue.trim()) {
      setError("Please enter a URL before proceeding!");
      return;
    }

    // Open verification modal
    setShowCaptcha(true);
    setCaptchaError(false);
  };

  const handleCaptchaChange = (token) => {
    if (token) {
      setCaptchaError(false);
      handleSubmitWithToken(token);
    }
  };

  const handleCaptchaExpired = () => {
    setCaptchaError(true);
  };

  const handleSubmitWithToken = async (token) => {
    setShowCaptcha(false);
    setError(null);

    // Auto-prefix protocol if missing
    let urlToFetch = inputValue.trim();
    if (!/^https?:\/\//i.test(urlToFetch)) {
      urlToFetch = `https://${urlToFetch}`;
    }

    const result = await fetchData(urlToFetch, device, report, token);

    if (!result?.success) {
      setError(result?.error || "An unknown error occurred.");
      recaptchaRef.current?.reset();
    }
  };

  // ⭐ FINAL FIX → CLEAN NAVIGATION
  useEffect(() => {
    if (inputValue && data?.url && !loading) {
      navigate("/report");
      setInputValue("");
    }
  }, [data, loading, navigate]);


  // Styles
  const baseClass ="flex flex-col items-center justify-start min-h-screen relative font-sans px-4 pt-24";

const containerClass = darkMode
  ? `${baseClass} bg-[#0B1120] text-white`
  : `${baseClass} bg-slate-50 text-slate-900`; 
  return (
    <div className={containerClass}>
      {/* Background Grid Pattern */}
      <div className={`absolute inset-0 ${darkMode ? 'bg-grid-white/[0.03]' : 'bg-grid-black/[0.03]'} pointer-events-none`} />

      {/* Content Wrapper */}
      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center">

        {/* Header Section */}
        <div className="text-center mb-12 space-y-5 animate-in fade-in slide-in-from-bottom-5 duration-700">

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Analyze your <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">Website Health</span>
          </h1>

          <p className={`max-w-2xl mx-auto text-lg ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Get a comprehensive professional audit of your site's Performance, SEO, Accessibility, and UX in seconds.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleClick} className="w-full max-w-4xl relative z-[50] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">

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
                className={`w-full h-full bg-transparent border-none outline-none text-lg px-4 font-medium placeholder-slate-500 placeholder:text-base ${darkMode ? "text-white" : "text-slate-900"}`}
              />
            </div>

            {/* Divider */}
            <div className={`hidden lg:block w-px h-8 ${darkMode ? "bg-slate-700" : "bg-slate-200"} mx-2`}></div>

            {/* Mobile Divider */}
            <div className={`lg:hidden w-full h-px ${darkMode ? "bg-slate-700" : "bg-slate-200"} my-2`}></div>

            {/* Controls Group */}
            <div className="flex w-full lg:w-auto items-center gap-2 px-2">

              {/* Device Selector */}
              <div className="relative group flex-1 lg:flex-none min-w-[120px] z-20">
                <CustomDropdown
                  value={device}
                  onChange={setDevice}
                  options={[
                    { value: "Desktop", label: "Desktop" },
                    { value: "Mobile", label: "Mobile" },
                  ]}
                  icon={device === "Desktop" ? <Monitor className="w-4 h-4 text-blue-500" /> : <Smartphone className="w-4 h-4 text-purple-500" />}
                  darkMode={darkMode}
                  disabled={loading}
                />
              </div>

              {/* Report Selector */}
              <div className="relative group flex-1 lg:flex-none min-w-[200px] z-20">
                <CustomDropdown
                  value={report}
                  onChange={setReport}
                  options={[
                    { value: "All", label: "Full Audit" },
                    { value: "Technical Performance", label: "Technical Performance" },
                    { value: "On Page SEO", label: "On Page SEO" },
                    { value: "Accessibility", label: "Accessibility" },
                    { value: "Security/Compliance", label: "Security & Compliance" },
                    { value: "UX & Content Structure", label: "UX & Content" },
                    { value: "Conversion & Lead Flow", label: "Conversion & Lead Flow" },
                    { value: "AIO (AI-Optimization) Readiness", label: "AIO Readiness" },
                  ]}
                  icon={<Settings className="w-4 h-4 text-emerald-500" />}
                  darkMode={darkMode}
                  disabled={loading}
                />
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
            <div className="w-full max-w-md mx-auto animate-in slide-in-from-top-2 fade-in mt-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 backdrop-blur-sm shadow-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

        </form>

      </div>

      {/* reCAPTCHA v2 Modal Overlay */}
      {showCaptcha && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md transition-all duration-300">
          <div className={`
            ${darkMode ? "bg-slate-900 border-slate-700 shadow-emerald-500/10" : "bg-white border-slate-100 shadow-slate-200/50"}
            border border-solid rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center gap-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200
          `}>
            <div className={`p-5 rounded-full ${darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
              <Monitor className="w-10 h-10" />
            </div>

            <div className="text-center space-y-2">
              <h3 className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>Verify Security</h3>
              <p className={`text-sm font-medium leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Confirm you're human to generate your site health report.
              </p>
            </div>

            <div className={`p-2 rounded-2xl border ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}
                onExpired={handleCaptchaExpired}
                theme={darkMode ? "dark" : "light"}
              />
            </div>

            {captchaError && (
              <div className="flex items-center gap-2 text-rose-500 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 animate-pulse">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Verification Expired</span>
              </div>
            )}

            <button
              onClick={() => setShowCaptcha(false)}
              className={`text-xs font-bold uppercase tracking-[0.2em] ${darkMode ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-900"} transition-all duration-200 hover:scale-110 active:scale-95`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}