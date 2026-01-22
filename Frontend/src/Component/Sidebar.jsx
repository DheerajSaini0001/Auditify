import React from "react";
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
  ChevronRight,
  BarChart2
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useData } from "../context/DataContext";
import { generatePDF } from "../utils/pdfGenerator";

export default function Sidebar({ darkMode }) {
  const { data, loading } = useData();
  const location = useLocation();

  // Define menu items configuration
  const menuItems = [
    { key: "technicalPerformance", label: "Technical Performance", path: "/technical-performance", icon: Gauge },
    { key: "onPageSEO", label: "On-Page SEO", path: "/on-page-seo", icon: Image },
    { key: "accessibility", label: "Accessibility", path: "/accessibility", icon: Accessibility },
    { key: "securityOrCompliance", label: "Security & Compliance", path: "/security-compliance", icon: Shield },
    { key: "UXOrContentStructure", label: "UX & Content", path: "/ux-content-structure", icon: Layout },
    { key: "conversionAndLeadFlow", label: "Conversion Flow", path: "/conversion-lead-flow", icon: TrendingUp },
    { key: "aioReadiness", label: "AIO Readiness", path: "/aio", icon: Brain },
  ];

  // Styles
  const sidebarClass = darkMode
    ? "bg-[#0B1120] border-r border-slate-800 text-slate-300"
    : "bg-white border-r border-slate-200 text-slate-600";

  const headerClass = darkMode
    ? "border-b border-slate-800 bg-[#0B1120]"
    : "border-b border-slate-200 bg-white";

  const getItemClass = (isActive, isDisabled) => {
    if (isDisabled) {
      return `opacity-50 cursor-not-allowed ${darkMode ? "text-slate-600" : "text-slate-400"}`;
    }
    if (isActive) {
      return darkMode
        ? "bg-emerald-500/10 text-emerald-400 border-r-2 border-emerald-500"
        : "bg-emerald-50 text-emerald-700 border-r-2 border-emerald-500";
    }
    return darkMode
      ? "hover:bg-slate-800 hover:text-white"
      : "hover:bg-slate-50 hover:text-slate-900";
  };

  return (
    <div className={`flex flex-col h-full w-64 shrink-0 transition-colors duration-300 ${sidebarClass}`}>

      {/* Header */}
      <div className={`flex items-center gap-3 p-6 shrink-0 ${headerClass}`}>
        <div className={`p-2 rounded-lg ${darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
          <BarChart2 className="w-6 h-6" />
        </div>
        <Link to="/report" replace className="block">
          <h2 className={`text-lg font-bold leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>
            Audit Report
          </h2>
          <span className="text-xs font-medium opacity-60">Overview</span>
        </Link>
      </div>

      {/* Navigation */}
      <aside className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const isAvailable = data?.[item.key];
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              to={item.path}
              replace
              className={`
                group flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all duration-200
                ${getItemClass(isActive, false)}
              `}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? "" : "opacity-70 group-hover:opacity-100"}`} />
                <span>{item.label}</span>
              </div>

              {!isAvailable && (
                <Loader2 className="w-4 h-4 animate-spin opacity-40 block" />
              )}

              {isAvailable && isActive && (
                <ChevronRight className="w-4 h-4 opacity-50 block" />
              )}
            </Link>
          );
        })}
      </aside>

      {/* Footer / Actions */}
      <div className={`p-4 border-t ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
        {data?.sectionScore ? (
          <button
            onClick={() => generatePDF(data)}
            className={`
                flex items-center justify-center gap-2 w-full p-3 rounded-xl font-semibold transition-all shadow-sm
                ${darkMode
                ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600"
                : "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 hover:border-slate-300"
              }
            `}
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        ) : (
          <div className={`text-xs text-center p-2 opacity-40 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            Waiting for analysis...
          </div>
        )}
      </div>

    </div>
  );
}
