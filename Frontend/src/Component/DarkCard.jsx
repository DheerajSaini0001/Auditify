import React, { useState, useContext } from "react";
import { Loader2, Menu, X, Search, Sun, Moon } from "lucide-react";
import Sidebar from "./Sidebar";
import Dashboard2 from "./Dashboard2";
import Technical_Performance from "../Metrices/Technical_Performance";
import On_Page_SEO from "../Metrices/On_Page_SEO";
import Accessibility from "../Metrices/Accessibility";
import Security_Compilance from "../Metrices/Security_Compilance";
import UX_Content_Structure from "../Metrices/UX_Content_Structure";
import Conversion_Lead_Flow from "../Metrices/Conversion_Lead_Flow";
import AIO from "../Metrices/AIO";
import Footer from "./Footer";
import RawData from "../Metrices/RawData";
import Assets from "../assets/Assets.js";

import { ThemeContext } from "../ThemeContext.jsx"; // ✅ ThemeContext import

export default function DarkCard() {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [device, setDevice] = useState("Desktop");

  const { darkMode, toggleTheme } = useContext(ThemeContext); // ✅ context use
  const handleClick = async (e) => {
    e.preventDefault();
    console.log(device);
    
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
        body: JSON.stringify([inputValue,device]),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const result = await response.json();
      setResult(result);
      setInputValue("");
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Theme-aware container classes
  const containerClass = darkMode
    ? "scroll-smooth m-0 bg-gray-800 text-white flex flex-col min-h-screen"
    : "scroll-smooth m-0 bg-gray-100 text-black flex flex-col min-h-screen";

  const inputClass = darkMode
    ? "flex-1 w-full  pl-10 pr-4 rounded-4xl py-2 bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-white"
    : "flex-1 w-full  pl-10 pr-4 rounded-4xl py-2 bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-black";

  const navbarClass = darkMode
    ? "fixed top-0 left-0 w-full lg:h-16 sm:h-20 bg-gray-900 border-b sm: border-gray-700 flex items-center justify-between px-4 z-50"
    : "fixed top-0 left-0 w-full lg:h-16 sm:h-20 bg-gray-200 border-b border-gray-300 flex items-center justify-between px-4 z-50";

  const sidebarClass = darkMode
    ? "fixed  left-0 z-40 w-64 h-[calc(100vh-4rem)] overflow-x-hidden bg-gray-900 border-r border-gray-700 transform"
    : "fixed   left-0 z-40 w-64 h-[calc(100vh-4rem)] overflow-x-hidden bg-gray-100 border-r border-gray-300 transform";

  return (
    <div className={containerClass}>
      {/* Navbar */}
      <nav className={navbarClass}>
        {result && (
          <button
            className={darkMode ? "lg:hidden p-2 rounded-lg mr-5 bg-gray-800" : "lg:hidden p-2 rounded-lg bg-gray-200 mr-5"}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        )}
        <div className={darkMode?"flex flex-col-rev justify-center items-center gap-4 font-serif text-4xl font-bold bg-gradient-to-r from-sky-200 via-rose-200 to-orange-200 bg-clip-text text-transparent":"flex flex-col-rev justify-center items-center gap-4 font-serif text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#000428] to-[#004e92]"}>
          <div>
           <img src={darkMode?Assets.Logo:Assets.DarkLogo} alt="" className="sm:h-1 h-12  lg:h-14" />
          </div>
          <div>Site Audits</div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={darkMode ? "px-4 py-2  text-white rounded" : "px-4 py-2  text-black rounded"}
        >
          {darkMode ? <Sun color="#FFD700" strokeWidth={3} size={20}/> : <Moon color="#4B5563" strokeWidth={3} size={20}/>}
        </button>
      </nav>

      <div className="h-10"></div> {/* spacer */}

      <div className=" flex flex-col items-center  justify-center">
      {!result && (
  <div className="mx-6 sm:mx-0">
    <div
      className={
        darkMode
          ? "w-full mt-20 max-w-2xl bg-gray-900 rounded-2xl shadow-2xl p-6 space-y-6 border border-gray-700 mx-auto"
          : "w-full mt-20 max-w-2xl bg-white rounded-2xl shadow-2xl p-6 space-y-6 border border-gray-300 mx-auto"
      }
    >
      <h2 className="text-2xl font-bold text-center">
        Check your Page Audits and Performance
      </h2>
      <p
        className={
          darkMode
            ? "text-gray-400 text-sm text-center"
            : "text-gray-600 text-sm text-center"
        }
      >
        Enter URL in the input below, select a device, and click Analyze.
      </p>

      <div className="mx-auto w-full">
        <form
          className="flex flex-col sm:flex-col gap-4 items-center w-full"
          onSubmit={handleClick}
        >
          {/* Input */}
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
    />
  </div>

  {/* Dropdown for device selection */}
  <select
    disabled={loading}
    value={device}
    onChange={(e) => setDevice(e.target.value)}
    className={`w-full sm:w-40 px-4 py-2 rounded-xl shadow-2xl ${
      darkMode ? "bg-white text-black" : "bg-gray-300 text-black"
    }`}
  >
    <option value="Desktop">Desktop</option>
    <option value="Mobile">Mobile</option>
  </select>
</div>

         
          <div className=" sm:w-48">
             {/* Analyze button */}
             <button
              type="submit"
              disabled={loading}
              className="flex gap-2 items-center justify-center bg-[#c2fbd7] text-green-700 rounded-full font-sans w-full px-16 py-2 text-base border-0 select-none transition duration-250  shadow hover:shadow-lg active:scale-[1.05] active:-rotate-1  sm:w-auto"
            >
              {loading && <Loader2 className="animate-spin w-5 h-5" />}
              {loading ? "Analyzing.." : "Analyze"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}


        {result && (
          <div className={`${containerClass} relative w-full  flex flex-1`}>
            {/* Sidebar */}
            <div
              className={`${sidebarClass} ${sidebarOpen ? "translate-x-0 overflow-y-auto" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 ease-in-out min-h-screen overflow-y-auto pb-4`}
            >
              <Sidebar data={result} />
            </div>

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Dashboard */}
            <div className="flex-1 lg:ml-64 pb-0 flex-col justify-center pr-4 pt-2 space-y-8">
              <section id="deshboard" className="scroll-mt-20"><Dashboard2 data={result} /></section>
              <section id="technical-performance" className="scroll-mt-20"><Technical_Performance data={result} /></section>
              <section id="on-page-seo" className="scroll-mt-20"><On_Page_SEO data={result} /></section>
              <section id="accessibility"><Accessibility data={result} /></section>
              <section id="security" className="scroll-mt-20"><Security_Compilance data={result} /></section>
              <section id="ux" className="scroll-mt-20"><UX_Content_Structure data={result} /></section>
           <section id="conversion" className="scroll-mt-20"><Conversion_Lead_Flow data={result} /></section>
           {/*   <section id="aio" className="scroll-mt-20"><AIO data={result} /></section>
              <section id="Rawdata" className="scroll-mt-20"><RawData data={result} /></section> */}
            </div>
          </div>
        )}
      </div>

      <footer className={darkMode ? "mt-auto bg-gray-800 text-white text-center" : "mt-auto bg-gray-200 text-black text-center"}>
        <Footer />
      </footer>
    </div>
  );
}
