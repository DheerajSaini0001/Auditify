import React, { useState, useContext } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
import { Link } from "react-router-dom";
import { ThemeContext } from "../ThemeContext";
import { useData } from "../context/DataContext";

export default function Sidebar({ darkMode }) {
  const { data: rawData, loading } = useData();
  const data = rawData;

  // ... (keep existing helper functions like sanitizeText, cleanKey, formatValue, generatePDF) ...

  const sanitizeText = (t) => {
    if (t == null) return "";
    return String(t)
      .replace(/≤|<=/g, " (less than or equal to) ")
      .replace(/≥|>=/g, " (greater than or equal to) ")
      .replace(/→|->/g, " to ")
      .replace(/</g, " (less than) ")
      .replace(/>/g, " (greater than) ")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  };

  const cleanKey = (str) =>
    String(str)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatValue = (val) => {
    if (val == null) return "";

    // ⭐ Heading Scheme special case
    if (Array.isArray(val) && val[0]?.tag) {
      return val
        .map((h) => `${h.tag.toUpperCase()}: ${sanitizeText(h.text)}`)
        .join("\n");
    }

    // ⭐ Arrays
    if (Array.isArray(val)) {
      return val
        .map((item) =>
          typeof item === "object"
            ? JSON.stringify(item, null, 2)
            : sanitizeText(item)
        )
        .join("\n");
    }

    // ⭐ Objects
    if (typeof val === "object") {
      return JSON.stringify(val, null, 2);
    }

    // ⭐ Normal values
    return sanitizeText(val);
  };

  // ========================================================
  //  PDF GENERATOR (PREMIUM + CLEAN VERSION)
  // ========================================================

  const generatePDF = (obj) => {
    const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    doc.setFont("helvetica");

    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - margin * 2;

    const colKey = 170;
    const colVal = usableWidth - colKey;

    // -----------------------------------------
    // PAGE HEADER
    // -----------------------------------------
    doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text("Website Report", margin, 40);

    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`URL: ${sanitizeText(obj.Site)}`, margin, 65);

    // ========================================================
    // BUILDING TABLE ROWS CLEANLY
    // ========================================================

    const rows = [];

    // ⭐ SECTION SCORE AT TOP (NO OBJ OBJ)
    if (obj.Section_Score != null) {
      rows.push({
        type: "scorebox",
        Key: "Section Score",
        Value: Array.isArray(obj.Section_Score)
          ? obj.Section_Score.map(s => `${s.name}: ${s.score}%`).join('\n')
          : sanitizeText(obj.Section_Score),
      });
    }


    const topLevelKeys = ['Site', 'Report', 'Device', 'Time_Taken', 'Score', 'Grade', 'AIO_Compatibility_Badge'];
    topLevelKeys.forEach(key => {
      if (obj[key] != null) {
        rows.push({
          type: "normal",
          Key: cleanKey(key),
          Value: sanitizeText(obj[key]),
        });
      }
    });


    // ⭐ Iterate full object sections
    Object.entries(obj).forEach(([sectionName, sectionValue]) => {
      if (topLevelKeys.includes(sectionName) || sectionName === 'Section_Score') {
        return;
      }

      const Section = cleanKey(sectionName);

      // -------- SECTION HEADER --------
      rows.push({
        type: "section",
        Key: Section,
        Value: "",
      });

      // ⭐ HEADING SCHEME FIX — clean block
      if (sectionName.toLowerCase() === "heading_scheme" || sectionName.toLowerCase() === "heading_hierarchy") {
        rows.push({
          type: "heading_box",
          Key: "Heading Scheme",
          Value: formatValue(sectionValue?.Heading || sectionValue),
        });
        return;
      }

      // ⭐ SCHEMA FIX — short readable message
      if (sectionName.toLowerCase() === "schema") {
        rows.push({
          type: "heading_box",
          Key: "Schema",
          Value: formatValue(sectionValue),
        });
        return;
      }

      // Normal object section (e.g., Technical_Performance)
      if (typeof sectionValue === "object" && !Array.isArray(sectionValue)) {
        Object.entries(sectionValue).forEach(([metric, metricVal]) => {
          const Metric = cleanKey(metric);

          // metric block (e.g., LCP, FID)
          if (typeof metricVal === "object" && !Array.isArray(metricVal)) {
            rows.push({
              type: "metric",
              Key: Metric,
              Value: "",
            });

            Object.entries(metricVal).forEach(([k2, v2]) => {
              rows.push({
                type: "normal",
                Key: cleanKey(k2),
                Value: formatValue(v2),
              });
            });
          } else {
            // Simple key-value (e.g., Percentage)
            rows.push({
              type: "normal",
              Key: Metric,
              Value: formatValue(metricVal),
            });
          }
        });
      }

      // Array section
      else if (Array.isArray(sectionValue)) {
        rows.push({
          type: "normal",
          Key: "Data",
          Value: formatValue(sectionValue),
        });
      }

      // Simple <key: value> (fallback)
      else {
        rows.push({
          type: "normal",
          Key: Section,
          Value: sanitizeText(sectionValue),
        });
      }
    });

    // ========================================================
    // AUTO TABLE (PREMIUM FORMATTING)
    // ========================================================

    autoTable(doc, {
      startY: 100,
      head: [["Key", "Value"]],
      body: rows.map((r) => [r.Key, r.Value]),

      styles: {
        font: "helvetica",
        fontSize: 9,
        overflow: "linebreak",
        cellPadding: 4,
        valign: "top",
      },

      columnStyles: {
        0: { cellWidth: colKey, fontStyle: "bold" },
        1: { cellWidth: colVal },
      },

      didParseCell(dataCell) {
        const row = rows[dataCell.row.index];

        if (!row) return;

        // ⭐ SECTION SCORE BLOCK (Green BG)
        if (row.type === "scorebox") {
          dataCell.cell.colSpan = 2;
          dataCell.cell.styles.fillColor = [225, 255, 225];
          dataCell.cell.styles.textColor = [0, 120, 0];
          dataCell.cell.styles.fontStyle = "bold";
          dataCell.cell.styles.fontSize = 10;
        }

        // ⭐ SECTION HEADER BLOCK (NO BG)
        if (row.type === "section") {
          dataCell.cell.colSpan = 2;
          dataCell.cell.styles.fillColor = [220, 235, 255]; // <-- YAHAN FIX KIYA GAYA HAI
          dataCell.cell.styles.textColor = [0, 70, 150];
          dataCell.cell.styles.fontStyle = "bold";
          dataCell.cell.styles.fontSize = 11;
        }

        // ⭐ METRIC (sub-section) (Gray BG)
        if (row.type === "metric") {
          dataCell.cell.colSpan = 2;
          dataCell.cell.styles.fillColor = [245, 245, 245]; // <-- YEH WALA RAKHA HAI
          dataCell.cell.styles.fontStyle = "bold";
        }

        // ⭐ NORMAL ROW (Key को un-bold करें)
        if (row.type === "normal" && dataCell.column.index === 0) {
          dataCell.cell.styles.fontStyle = "normal";
        }

        // ⭐ HEADING SCHEME block (NO BG)
        if (row.type === "heading_box") {
          dataCell.cell.styles.fillColor = [255, 245, 225]; // <-- YAHAN FIX KIYA GAYA HAI
          dataCell.cell.styles.textColor = [100, 70, 20];
          dataCell.cell.styles.fontStyle = "normal";
          if (dataCell.column.index === 0) {
            dataCell.cell.styles.fontStyle = "bold";
          }
        }
      },

      headStyles: {
        fillColor: [30, 144, 255],
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
      },

      margin: { left: margin, right: margin },
    });

    let site = obj.Site || "report";

    try {
      let url = new URL(site);
      let host = url.hostname.replace(/^www\./, ""); // remove www

      // remove TLD(s) -> .com .in .ae .co.uk .org etc.
      host = host.split(".")[0];

      // only letters & numbers
      host = host.replace(/[^a-zA-Z0-9]/g, "_");

      site = host;
    } catch (e) {
      site = site
        .replace(/https?:\/\//g, "")
        .replace(/^www\./, "")
        .split(".")[0]
        .replace(/[^a-zA-Z0-9]/g, "_");
    }

    const file = site;

    doc.save(`${file}.pdf`);
  };

  const sidebarBg = darkMode ? "bg-gray-900 text-white" : "bg-gray-200 text-black";
  const sidebarBorder = darkMode ? "border-gray-700" : "border-gray-300";
  const hoverClass = darkMode ? "hover:bg-gray-700 hover:text-blue-500" : "hover:bg-gray-300 hover:text-blue-600";

  return (
    <div className={`${sidebarBg} flex flex-col h-full border-r ${sidebarBorder}`}>
      <div className={`flex justify-center items-center text-2xl p-4 border-b ${sidebarBorder} shrink-0`}>
        <Link to="/report" replace className={darkMode ? "text-4xl font-bold text-green-100" : "text-4xl font-bold text-green-500"}>
          Result
        </Link>
      </div>
      <aside
        className={`flex-1 overflow-y-auto ${sidebarBg}`}
      >
        {/* Menu */}
        <nav className="flex flex-col p-2 space-y-2">
          {data?.Technical_Performance ?
            <Link
              replace to="/technical-performance"
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <Gauge size={20} /> <span>Technical Performance</span>
            </Link>
            : <Link
              replace to="/technical-performance"
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass} pointer-events-none opacity-60 cursor-not-allowed `}
            >
              <div className="flex flex-row items-center justify-center gap-2"> <Gauge size={20} /> Technical Performance <Loader2 size={20} className="animate-spin w-5 h-5" /></div>
            </Link>}
          {data?.On_Page_SEO ? (
            <Link
              replace to="/on-page-seo"
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <Image size={20} /> <span>On Page SEO</span>
            </Link>
          ) : (
            <Link
              replace to="/on-page-seo"
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass} pointer-events-none opacity-60 cursor-not-allowed  `}
            >
              <div className="flex flex-row items-center justify-center gap-2">
                <Image size={20} /> On Page SEO{" "}
                <Loader2 size={20} className="animate-spin w-5 h-5" />
              </div>
            </Link>
          )}

          {data?.Accessibility ? (
            <Link
              replace to="/accessibility"
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <Accessibility size={20} /> <span>Accessibility</span>
            </Link>
          ) : (
            <Link
              replace to="/accessibility"
              className={`flex items-center space-x-3 p-3 rounded-md transition pointer-events-none opacity-60 cursor-not-allowed  ${hoverClass}`}
            >
              <div className="flex flex-row items-center justify-center gap-2">
                <Accessibility size={20} /> Accessibility{" "}
                <Loader2 size={20} className="animate-spin w-5 h-5" />
              </div>
            </Link>
          )}

          {data?.Security_or_Compliance ? (
            <Link
              replace to="/security-compliance"
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <Shield size={20} /> <span>Security/Compliance</span>
            </Link>
          ) : (
            <Link
              replace to="/security-compliance"
              className={`flex items-center space-x-3 p-3 rounded-md transition pointer-events-none opacity-60 cursor-not-allowed  ${hoverClass}`}
            >
              <div className="flex flex-row items-center justify-center gap-2">
                <Shield size={20} /> Security/Compliance{" "}
                <Loader2 size={20} className="animate-spin w-5 h-5" />
              </div>
            </Link>
          )}

          {data?.UX_or_Content_Structure ? (
            <Link
              replace to="/ux-content-structure"
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <Layout size={20} /> <span>UX & Content Structure</span>
            </Link>
          ) : (
            <Link
              replace to="/ux-content-structure"
              disabled
              className={`flex items-center space-x-3 p-3 rounded-md transition pointer-events-none opacity-60 cursor-not-allowed  ${hoverClass}
   pointer-events-none opacity-60 cursor-not-allowed `}
            >
              <div className="flex flex-row items-center justify-center gap-2">
                <Layout size={20} /> UX & Content Structure{" "}
                <Loader2 size={20} className="animate-spin w-5 h-5" />
              </div>
            </Link>
          )}

          {data?.Conversion_and_Lead_Flow ? (
            <Link
              replace to="/conversion-lead-flow"
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <TrendingUp size={20} /> <span>Conversion & Lead Flow</span>
            </Link>
          ) : (
            <Link
              replace to="/conversion-lead-flow"
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass} pointer-events-none opacity-60 cursor-not-allowed`}
            >
              <div className="flex flex-row items-center justify-center gap-2">
                <TrendingUp size={20} /> Conversion & Lead Flow{" "}
                <Loader2 size={20} className="animate-spin w-5 h-5" />
              </div>
            </Link>
          )}

          {data?.AIO_Compatibility_Badge ? (
            <Link
              replace to="/aio"
              className={`flex items-center space-x-3 p-3 rounded-md transition ${hoverClass}`}
            >
              <Brain size={20} /> <span>AIO (AI-Optimization) Readiness</span>
            </Link>
          ) : (
            <Link
              replace to="/aio"
              className={`flex items-center space-x-3 p-3 rounded-md transition pointer-events-none opacity-60 cursor-not-allowed  ${hoverClass}`}
            >
              <div className="flex flex-row items-center justify-center gap-2">
                <Brain size={20} /> AIO (AI-Optimization) Readiness{" "}
                <Loader2 size={20} className="animate-spin w-5 h-5" />
              </div>
            </Link>
          )}


          {/* Download Button */}
          {data?.Raw?.Section_Score &&
            <button
              onClick={() => generatePDF(data.Raw)}
              className={`flex items-center space-x-3 p-3 w-full rounded-md transition ${hoverClass}`}
            >
              <FileText className="w-5 h-5" />
              <span>Download Report</span>
            </button>}
        </nav>
      </aside>
    </div>
  );
}
