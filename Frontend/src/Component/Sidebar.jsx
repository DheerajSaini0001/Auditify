import React, { useState, useContext } from "react";
import {
  Accessibility,
  Gauge,
  Image,
  Shield,
  Layout,
  TrendingUp,
  Brain,
  Database,
  FileText,
  Loader2
} from "lucide-react";
import { ThemeContext } from "../ThemeContext";
import { useData } from "../context/DataContext";

export default function Sidebar({ darkMode }) {
  
  const [isOpen, setIsOpen] = useState(true);
  const { data: rawData, loading } = useData();
  const data = rawData;



  function downloadObject(obj) {
    if (!obj) return alert("No data to download");
    const fileName = obj.Site ? `${obj.Site.split("/")[2].split(".")[0]}.txt` : "report.txt";
    const jsonStr = JSON.stringify(obj, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sidebarBg = darkMode ? "bg-gray-900 text-white" : "bg-gray-200 text-black";
  const sidebarBorder = darkMode ? "border-gray-700" : "border-gray-300";
  const hoverClass = darkMode ? "hover:bg-gray-700 hover:text-blue-500" : "hover:bg-gray-300 hover:text-blue-600";

  return (
    <div className={`${sidebarBg} flex mb-0 pb-0 flex-col`}>
         <div className={`flex justify-center items-center text-2xl p-4 border-b ${sidebarBorder}`}>
          <a href="#deshboard" className={darkMode ? "text-4xl font-bold text-green-100" : "text-4xl font-bold text-green-500"}>
            Result
          </a>
        </div>
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 shadow-lg transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0
          ${sidebarBg} border-r ${sidebarBorder} overflow-y-auto
        `}
      > 
        {/* Header */}
    

        {/* Menu */}
        <nav className="flex flex-col p-2 space-y-2">
          {data?.Technical_Performance ?
           <a
              href="/technical-performance"
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <Gauge size={20} /> <span>Technical Performance</span>
            </a> 
            :<a
              href="/technical-performance"
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
             <div className="flex flex-row items-center justify-center gap-2"> <Gauge size={20} /> Technical Performance <Loader2 size={20} className="animate-spin w-5 h-5" /></div>
            </a> }
{data?.On_Page_SEO ? (
  <a
    href="/on-page-seo"
    className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
  >
    <Image size={20} /> <span>On Page SEO</span>
  </a>
) : (
  <a
    href="/on-page-seo"
    className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
  >
    <div className="flex flex-row items-center justify-center gap-2">
      <Image size={20} /> On Page SEO{" "}
      <Loader2 size={20} className="animate-spin w-5 h-5" />
    </div>
  </a>
)}

{data?.Accessibility ? (
  <a
    href="/accessibility"
    className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
  >
    <Accessibility size={20} /> <span>Accessibility</span>
  </a>
) : (
  <a
    href="/accessibility"
    className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
  >
    <div className="flex flex-row items-center justify-center gap-2">
      <Accessibility size={20} /> Accessibility{" "}
      <Loader2 size={20} className="animate-spin w-5 h-5" />
    </div>
  </a>
)}

{data?.Security_or_Compliance ? (
  <a
    href="/security-compliance"
    className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
  >
    <Shield size={20} /> <span>Security/Compliance</span>
  </a>
) : (
  <a
    href="/security-compliance"
    className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
  >
    <div className="flex flex-row items-center justify-center gap-2">
      <Shield size={20} /> Security/Compliance{" "}
      <Loader2 size={20} className="animate-spin w-5 h-5" />
    </div>
  </a>
)}

{data?.UX_or_Content_Structure ? (
  <a
    href="/ux-content-structure"
    className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
  >
    <Layout size={20} /> <span>UX & Content Structure</span>
  </a>
) : (
  <a
    href="/ux-content-structure"
    className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
  >
    <div className="flex flex-row items-center justify-center gap-2">
      <Layout size={20} /> UX & Content Structure{" "}
      <Loader2 size={20} className="animate-spin w-5 h-5" />
    </div>
  </a>
)}

{data?.Conversion_and_Lead_Flow ? (
  <a
    href="/conversion-lead-flow"
    className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
  >
    <TrendingUp size={20} /> <span>Conversion & Lead Flow</span>
  </a>
) : (
  <a
    href="/conversion-lead-flow"
    className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
  >
    <div className="flex flex-row items-center justify-center gap-2">
      <TrendingUp size={20} /> Conversion & Lead Flow{" "}
      <Loader2 size={20} className="animate-spin w-5 h-5" />
    </div>
  </a>
)}

{data?.AIO_Compatibility_Badge ? (
  <a
    href="/aio"
    className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
  >
    <Brain size={20} /> <span>AIO (AI-Optimization) Readiness</span>
  </a>
) : (
  <a
    href="/aio"
    className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
  >
    <div className="flex flex-row items-center justify-center gap-2">
      <Brain size={20} /> AIO (AI-Optimization) Readiness{" "}
      <Loader2 size={20} className="animate-spin w-5 h-5" />
    </div>
  </a>
)}

{data.Raw.Section_Score && (
  <a
    href="#Rawdata"
    className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
  >
    <Database size={20} /> <span>Raw Data</span>
  </a>
) 
}
          {/* Download Button */}
          {data.Raw.Section_Score && 
          <button
            onClick={() => downloadObject(data.Raw)}
            className={`flex items-center space-x-3 p-3 w-full rounded-md transition ${hoverClass}`}
          >
            <FileText className="w-5 h-5" />
            <span>Download TXT</span>
          </button>}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
