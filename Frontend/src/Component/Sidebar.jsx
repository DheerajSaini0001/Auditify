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
  BarChart2,
  Plus,
  NotebookPen,
  Ban
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import toast from 'react-hot-toast';
import { savePostAuthIntent } from "../utils/intentStore";

export default function Sidebar({ darkMode }) {
  const { data, loading, clearData } = useData();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Dealership gate: when the audited site is not a dealership there are no
  // sections to load — avoid showing endless loading spinners.
  const notDealership = data?.isDealership === false;

  const handleGoHome = () => {
    clearData();
    navigate("/", { replace: true });
  };

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
    : "bg-surface text-muted";

  const headerClass = darkMode
    ? "border-b border-slate-800 bg-[#0B1120]"
    : "border-b border-linesoft bg-surface";

  const getItemClass = (isActive, isDisabled) => {
    if (isDisabled) {
      return `opacity-50 cursor-not-allowed ${darkMode ? "text-slate-600" : "text-faint"}`;
    }
    if (isActive) {
      return darkMode
        ? "bg-emerald-500/10 text-emerald-400 border-r-2 border-emerald-500"
        : "bg-emerald-50 text-emerald-700 border-r-2 border-emerald-500";
    }
    return darkMode
      ? "hover:bg-emerald-500/10 hover:text-emerald-400"
      : "hover:bg-emerald-50 hover:text-emerald-700";
  };

  return (
    <div className={`flex flex-col h-full w-64 shrink-0 transition-colors duration-300 ${sidebarClass}`}>

      {/* Header */}
      <div className={`flex items-center gap-3 p-6 shrink-0 ${headerClass}`}>
        <div className={`p-2 rounded-lg ${darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
          <BarChart2 className="w-6 h-6" />
        </div>
        <Link to={data?._id ? `/report/${data._id}` : "/report"} replace className="block">
          <h2 className={`text-lg font-semibold leading-none ${darkMode ? "text-white" : "text-ink"}`}>
            Audit Report
          </h2>
          <span className={`text-xs font-semibold ${darkMode ? 'text-slate-500' : 'text-muted'}`}>Overview</span>
        </Link>
      </div>

      {/* Navigation */}
      <aside className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {notDealership ? (
          <div className="flex flex-col items-center text-center px-3 py-10 gap-3">
            <div className={`p-3 rounded-xl ${darkMode ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-500"}`}>
              <Ban className="w-7 h-7" />
            </div>
            <p className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-inksoft"}`}>
              Not a dealership website
            </p>
            <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-500" : "text-muted"}`}>
              Sorry, this site doesn’t belong to a car dealership, so no audit sections are available.
            </p>
          </div>
        ) : menuItems.map((item) => {
          const isAvailable = data?.[item.key];
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          const targetPath = data?._id ? `${item.path}/${data._id}` : item.path;

          return (
            <Link
              key={item.key}
              to={targetPath}
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

              {!isAvailable ? (
                <Loader2 className="w-4 h-4 animate-spin opacity-40 block" />
              ) : isActive ? (
                <ChevronRight className="w-4 h-4 opacity-50 block" />
              ) : null}
            </Link>
          );
        })}
      </aside>

      {/* Footer / Actions */}
      <div className={`p-3 border-t space-y-3 ${darkMode ? "border-slate-800 bg-[#0B1120]" : "border-linesoft bg-surface"}`}>
        {data?.sectionScore ? (
          <>
            <button
              onClick={async () => {
                // Guests may download too (they verified their email via OTP before the audit).
                const reportId = data._id;
                if (!reportId) return toast.error("Report ID not found");

                  const toastId = toast.loading('Preparing professional PDF report...');
                  try {
                    const token = localStorage.getItem('dealerpulse_token');
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
                    const response = await fetch(`${API_URL}/single-audit/${reportId}/export/pdf`, {
                      headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      }
                    });

                  if (!response.ok) throw new Error('Failed to generate PDF');

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `DealerPulse-Report-${data.url.replace(/[^a-z0-9]/gi, '-')}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                    toast.success('Report downloaded!', { id: toastId });
                  } catch (error) {
                    toast.error('Failed to generate PDF', { id: toastId });
                  }
                }
              }
              className={`group w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white shadow-md shadow-black/10 transition-all hover:shadow-black/20 active:scale-[0.98] ${darkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-[#16213E] hover:bg-[#2A3656]"}`}
            >
              <FileText className="w-4 h-4" />
              <span>Download Report</span>
            </button>
          </>
        ) : notDealership ? (
          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] shadow-emerald-500/20"
          >
            <Plus className="w-5 h-5" />
            <span>Start New Audit</span>
          </button>
        ) : (
          <div className={`text-xs text-center p-2 font-semibold ${darkMode ? "text-slate-500 opacity-60" : "text-muted"}`}>
            Waiting for analysis...
          </div>
        )}

        {/* Mobile only actions */}
        <div className="sm:hidden">
          <button
            onClick={handleGoHome}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all
            bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98]
            shadow-emerald-500/20`}
          >
            <Plus className="w-5 h-5" />
            <span>Start New Audit</span>
          </button>
        </div>
      </div>

    </div>
  );
}
