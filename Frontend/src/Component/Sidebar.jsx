import React, { useState } from "react";
import {
  Accessibility,
  Gauge,
  Image,
  Shield,
  Layout,
  TrendingUp,
  Brain,
  FileText,
  Loader2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../ThemeContext";

export default function Sidebar({ darkMode }) {
  const [isOpen, setIsOpen] = useState(true);
  const { data: rawData, loading } = useData();
  const data = rawData;
  const location = useLocation(); // ✅ to track current route

  // ✅ Download data as .txt
  function downloadObject(obj) {
    if (!obj) return alert("No data to download");
    const fileName = obj.Site
      ? `${obj.Site.split("/")[2].split(".")[0]}.txt`
      : "report.txt";
    const jsonStr = JSON.stringify(obj, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ✅ Theming
  const sidebarBg = darkMode ? "bg-gray-900 text-white" : "bg-gray-200 text-black";
  const sidebarBorder = darkMode ? "border-gray-700" : "border-gray-300";
  const hoverClass = darkMode
    ? "hover:bg-gray-700 hover:text-blue-500"
    : "hover:bg-gray-300 hover:text-blue-600";

  return (
    <div className={`${sidebarBg} flex mb-0 pb-0 flex-col`}>
      {/* Sidebar Header */}
      <div
        className={`flex justify-center items-center text-2xl p-4 border-b ${sidebarBorder}`}
      >
        <Link
          to="/report"
          state={{ from: location.pathname }}
          className={
            darkMode
              ? "text-4xl font-bold text-green-100"
              : "text-4xl font-bold text-green-500"
          }
        >
          Result
        </Link>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 shadow-lg transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0
          ${sidebarBg} border-r ${sidebarBorder} overflow-y-auto`}
      >
        <nav className="flex flex-col p-2 space-y-2">
          {/* ✅ Technical Performance */}
          {data?.Technical_Performance ? (
            <Link
              to="/technical-performance"
              state={{ from: location.pathname }}
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <Gauge size={20} /> <span>Technical Performance</span>
            </Link>
          ) : (
            <div
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass} opacity-60 cursor-not-allowed`}
            >
              <Gauge size={20} /> Technical Performance{" "}
              <Loader2 size={20} className="animate-spin w-5 h-5" />
            </div>
          )}

          {/* ✅ On Page SEO */}
          {data?.On_Page_SEO ? (
            <Link
              to="/on-page-seo"
              state={{ from: location.pathname }}
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <Image size={20} /> <span>On Page SEO</span>
            </Link>
          ) : (
            <div
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass} opacity-60 cursor-not-allowed`}
            >
              <Image size={20} /> On Page SEO{" "}
              <Loader2 size={20} className="animate-spin w-5 h-5" />
            </div>
          )}

          {/* ✅ Accessibility */}
          {data?.Accessibility ? (
            <Link
              to="/accessibility"
              state={{ from: location.pathname }}
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <Accessibility size={20} /> <span>Accessibility</span>
            </Link>
          ) : (
            <div
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass} opacity-60 cursor-not-allowed`}
            >
              <Accessibility size={20} /> Accessibility{" "}
              <Loader2 size={20} className="animate-spin w-5 h-5" />
            </div>
          )}

          {/* ✅ Security / Compliance */}
          {data?.Security_or_Compliance ? (
            <Link
              to="/security-compliance"
              state={{ from: location.pathname }}
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <Shield size={20} /> <span>Security / Compliance</span>
            </Link>
          ) : (
            <div
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass} opacity-60 cursor-not-allowed`}
            >
              <Shield size={20} /> Security / Compliance{" "}
              <Loader2 size={20} className="animate-spin w-5 h-5" />
            </div>
          )}

          {/* ✅ UX & Content Structure */}
          {data?.UX_or_Content_Structure ? (
            <Link
              to="/ux-content-structure"
              state={{ from: location.pathname }}
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <Layout size={20} /> <span>UX & Content Structure</span>
            </Link>
          ) : (
            <div
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass} opacity-60 cursor-not-allowed`}
            >
              <Layout size={20} /> UX & Content Structure{" "}
              <Loader2 size={20} className="animate-spin w-5 h-5" />
            </div>
          )}

          {/* ✅ Conversion & Lead Flow */}
          {data?.Conversion_and_Lead_Flow ? (
            <Link
              to="/conversion-lead-flow"
              state={{ from: location.pathname }}
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <TrendingUp size={20} /> <span>Conversion & Lead Flow</span>
            </Link>
          ) : (
            <div
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass} opacity-60 cursor-not-allowed`}
            >
              <TrendingUp size={20} /> Conversion & Lead Flow{" "}
              <Loader2 size={20} className="animate-spin w-5 h-5" />
            </div>
          )}

          {/* ✅ AIO Readiness */}
          {data?.AIO_Compatibility_Badge ? (
            <Link
              to="/aio"
              state={{ from: location.pathname }}
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <Brain size={20} /> <span>AIO (AI Optimization)</span>
            </Link>
          ) : (
            <div
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass} opacity-60 cursor-not-allowed`}
            >
              <Brain size={20} /> AIO (AI Optimization){" "}
              <Loader2 size={20} className="animate-spin w-5 h-5" />
            </div>
          )}

          {/* ✅ Download TXT */}
          {data?.Raw?.Section_Score && (
            <button
              onClick={() => downloadObject(data.Raw)}
              className={`flex items-center space-x-3 p-3 w-full rounded-md transition ${hoverClass}`}
            >
              <FileText className="w-5 h-5" />
              <span>Download TXT</span>
            </button>
          )}
        </nav>
      </aside>

      {/* ✅ Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
