import { FileText } from "lucide-react";
import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";


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

const ShimmerBlock = ({ className = "" }) => (
  <div
    className={`bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-shimmer bg-[length:400%_100%] rounded-md ${className}`}
  ></div>
);

const shimmerStyle = `
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.animate-shimmer {
  animation: shimmer 1.6s infinite linear;
}
`;


const RawData = ({ data, darkMode }) => {
  // --- Styles ---
  const containerBg = darkMode
    ? "bg-gray-900 border-gray-700"
    : "bg-gray-100 border-gray-300";

  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  if (!data?.Site) { 
    return (
      <div
        className={`min-h-fit pt-20 pb-16 rounded-2xl shadow-lg m-4 flex flex-col items-center justify-start p-6 space-y-6 ${containerBg}`}
      >
        <style>{shimmerStyle}</style>
        <ShimmerBlock className="h-8 w-40 mb-6 rounded-md" />
        <div
          className={`w-full    p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
        >
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <ShimmerBlock key={i} className="h-4 w-full rounded-md" />
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <ShimmerBlock className="h-10 w-40 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      id="Rawdata"
      className={`min-h-fit pt-20 pb-16 rounded-2xl shadow-lg m-4 flex flex-col items-center justify-start p-6 space-y-6 ${containerBg}`}
    >
      <style>{shimmerStyle}</style> 
      <h1
        className={`text-3xl font-extrabold mb-6 ${
          darkMode ? "text-white" : "text-black"
        }`}
      >
        Raw Data
      </h1>

      <div
        className={`w-full    p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
      >
        <pre
          className={`whitespace-pre-wrap break-words text-sm ${
            darkMode ? "text-white" : "text-black"
          }`}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => generatePDF(data)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow transition ${
            darkMode
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-green-400 hover:bg-green-500 text-black"
          }`}
        >
          <FileText className="w-5 h-5" />
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default RawData;