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
} from "lucide-react";
import { ThemeContext } from "../ThemeContext";

export default function Sidebar({ data }) {
  const { darkMode } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { name: "Technical Performance", link: "/technical-performance", icon: <Gauge size={20} /> },
    { name: "On Page SEO", link: "/on-page-seo", icon: <Image size={20} /> },
    { name: "Accessibility", link: "/accessibility", icon: <Accessibility size={20} /> },
    { name: "Security/Compliance", link: "/security-compliance", icon: <Shield size={20} /> },
    { name: "UX & Content Structure", link: "/ux-content-structure", icon: <Layout size={20} /> },
    { name: "Conversion & Lead Flow", link: "/conversion-lead-flow", icon: <TrendingUp size={20} /> },
    { name: "AIO (AI-Optimization) Readiness", link: "/aio", icon: <Brain size={20} /> },
    { name: "Raw Data", link: "#Rawdata", icon: <Database size={20} /> },
  ];

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
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.link}
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              {item.icon} <span>{item.name}</span>
            </a>
          ))}

          {/* Download Button */}
          <button
            onClick={() => downloadObject(data)}
            className={`flex items-center space-x-3 p-3 w-full rounded-md transition ${hoverClass}`}
          >
            <FileText className="w-5 h-5" />
            <span>Download TXT</span>
          </button>
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
