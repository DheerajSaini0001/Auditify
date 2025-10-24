import React, { useState, useContext } from "react";
import { Loader2, Menu, X, Search, Sun, Moon, Layout } from "lucide-react";
import Sidebar from "./Sidebar";
import Dashboard2 from "./Dashboard2";
import Technical_Performance from "../Pages/Technical_Performance.jsx";
import On_Page_SEO from "../Pages/On_Page_SEO.jsx";
import Accessibility from "../Pages/Accessibility.jsx";
import Security_Compilance from "../Pages/Security_Compilance.jsx";
import UX_Content_Structure from "../Pages/UX_Content_Structure.jsx";
import Conversion_Lead_Flow from "../Pages/Conversion_Lead_Flow.jsx";
import AIO from "../Pages/AIO.jsx";
import Footer from "./Footer";
import RawData from "../Pages/RawData.jsx";
import Assets from "../assets/Assets.js";



export default function DarkCard({ darkMode,setData }) {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [device, setDevice] = useState("Desktop");
  const [report, setReport] = useState("All");

  
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
        body: JSON.stringify([inputValue,device,report]),
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
    ? "fixed  left-0  w-64 h-[calc(100vh-4rem)] overflow-x-hidden bg-gray-900 border-r border-gray-700 transform"
    : "fixed   left-0  w-64 h-[calc(100vh-4rem)] overflow-x-hidden bg-gray-100 border-r border-gray-300 transform";

  return (
    <div 
    className={containerClass}>
      {/* Navbar */}
      

      {/* spacer */}

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
  <select
    disabled={loading}
    value={report}
    onChange={(e) => setReport(e.target.value)}
    className={`w-full sm:w-40 px-4 py-2 rounded-xl shadow-2xl ${
      darkMode ? "bg-white text-black" : "bg-gray-300 text-black"
    }`}
  >
  <option value="All">All</option>
  <option value="technicalMetrics">Technical Performance</option>
  <option value="seoMetrics">On-Page SEO</option>
  <option value="accessibilityMetrics">Accessibility</option>
  <option value="securityCompliance">Security Compliance</option>
  <option value="uxContentStructure">UX Content Structure</option>
  <option value="conversionLeadFlow">Conversion & Lead Flow</option>
  <option value="aioReadiness">AIO</option>
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

{setData(result)}

        {result && (

          
          <div className={`${containerClass} relative flex w-full min-h-screen`}>
  {/* Sidebar */}
  <div
    className={`responsive ${sidebarClass} ${
      sidebarOpen ? "translate-x-0 overflow-y-hidden" : "-translate-x-full"
    } lg:translate-x-0 transition-transform duration-300 ease-in-out fixed responsive:relative h-full z-40 bg-gray-800`}
  >
    <Sidebar data={result.Raw} darkMode={darkMode} />
  </div>

  {/* Overlay for mobile when sidebar is open */}
  {sidebarOpen && (
    <div
      className="fixed inset-0 bg-black/50 z-30 lg:hidden"
      onClick={() => setSidebarOpen(false)}
    />
  )}

  {/* Main content */}
  <div className="flex-1 lg:ml-64 flex flex-col pb-0 pr-4 pt-2 space-y-8">
  {(result.Metric.Report=="All") &&( 
   <section id="deshboard" className="scroll-mt-20">
      <Dashboard2 darkMode={darkMode} data={result.Metric} />
    </section>)}

{(result.Metric.Report=="technicalMetrics"||result.Metric.Report=="All") &&( <section id="technical-performance" className="scroll-mt-20">
      <Technical_Performance darkMode={darkMode} data={result.Metric} />
    </section>)}

{(result.Metric.Report=="seoMetrics"||result.Metric.Report=="All") &&(  <section id="on-page-seo" className="scroll-mt-20">
      <On_Page_SEO darkMode={darkMode} data={result.Metric} />
    </section>)}
  
  {(result.Metric.Report=="accessibilityMetrics"||result.Metric.Report=="All") &&(
<section id="accessibility">
      <Accessibility darkMode={darkMode} data={result.Metric} />
    </section>)}

{(result.Metric.Report=="securityCompliance"||result.Metric.Report=="All") &&(<section id="security" className="scroll-mt-20">
      <Security_Compilance darkMode={darkMode} data={result.Metric} />
    </section>)}

{(result.Metric.Report=="uxContentStructure"||result.Metric.Report=="All") &&(<section id="ux" className="scroll-mt-20">
      <UX_Content_Structure darkMode={darkMode} data={result.Metric} />
    </section>)}

{(result.Metric.Report=="conversionLeadFlow"||result.Metric.Report=="All") &&( <section id="conversion" className="scroll-mt-20">
      <Conversion_Lead_Flow darkMode={darkMode} data={result.Metric} />
    </section>)}

{(result.Metric.Report=="aioReadiness"||result.Metric.Report=="All") &&( <section id="aio" className="scroll-mt-20">
      <AIO darkMode={darkMode} data={result.Metric} />
    </section>)}
   
{result.Metric.Report=="All" &&( <section id="Rawdata" className="scroll-mt-20">
      <RawData darkMode={darkMode} data={result.Raw} />
    </section>)}
   
  </div>
</div>

        )}
      </div>

      
    </div>
  );
}
