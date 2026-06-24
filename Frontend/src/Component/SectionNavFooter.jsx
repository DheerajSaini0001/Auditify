import React, { useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, FileText } from "lucide-react";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";

// Canonical section order — mirrors the sidebar / report layout.
const SECTION_NAV = [
  { key: "technicalPerformance", label: "Technical Performance", path: "/technical-performance" },
  { key: "onPageSEO", label: "On-Page SEO", path: "/on-page-seo" },
  { key: "accessibility", label: "Accessibility", path: "/accessibility" },
  { key: "securityOrCompliance", label: "Security & Compliance", path: "/security-compliance" },
  { key: "UXOrContentStructure", label: "UX & Content", path: "/ux-content-structure" },
  { key: "conversionAndLeadFlow", label: "Conversion Flow", path: "/conversion-lead-flow" },
  { key: "aioReadiness", label: "AIO Readiness", path: "/aio" },
  { key: "aeo", label: "AEO", path: "/aeo" },
];

/**
 * Rendered at the bottom of a standalone section page (e.g. /aio/:id). Links to the
 * NEXT section of the same report; at the last section it links back to the full report.
 * Sections the audit didn't include are skipped.
 */
export default function SectionNavFooter({ currentKey }) {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const { data } = useData();
  const { id } = useParams();

  const reportId = id || data?._id;
  if (!reportId) return null;

  const idx = SECTION_NAV.findIndex((s) => s.key === currentKey);
  if (idx === -1) return null;

  // Next section that exists in this report; else fall back to the full report.
  const next = SECTION_NAV.slice(idx + 1).find((s) => data?.[s.key]);
  const target = next ? `${next.path}/${reportId}` : `/report/${reportId}`;
  const label = next ? next.label : "Full report";

  const linkClass = darkMode
    ? "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700"
    : "bg-card text-ink hover:bg-emerald-50 hover:text-emerald-700 border border-line";

  return (
    <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-surface"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-12 flex justify-end">
        <Link
          to={target}
          replace
          title={next ? `Next section: ${label}` : "Back to the full report"}
          className={`group inline-flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold shadow-sm transition-all active:scale-[0.98] ${linkClass}`}
        >
          <span className="flex flex-col items-end leading-tight">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-slate-500" : "text-faint"}`}>
              {next ? "Next section" : "Back to"}
            </span>
            <span>{label}</span>
          </span>
          {next
            ? <ArrowRight className="w-5 h-5 shrink-0 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            : <FileText className="w-5 h-5 shrink-0 opacity-70" />}
        </Link>
      </div>
    </div>
  );
}
