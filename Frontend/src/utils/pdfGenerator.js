import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const sanitizeText = (t) => {
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

export const cleanKey = (str) =>
    String(str)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

export const formatValue = (val) => {
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

export const filterRawData = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(filterRawData).filter(item => item !== null && item !== undefined);
    }

    const filtered = {};
    const ignoredKeys = ['_id', 'Status', 'createdAt', 'updatedAt', '__v', 'Error_Message', 'Raw'];
    const metricSections = [
        'Technical_Performance',
        'On_Page_SEO',
        'Accessibility',
        'Security_or_Compliance',
        'UX_or_Content_Structure',
        'Conversion_and_Lead_Flow',
        'AIO_Readiness'
    ];
    const metricIgnoredKeys = ['Warning', 'Improvements', 'Passed', 'Percentage'];

    Object.entries(obj).forEach(([key, value]) => {
        // 1. Remove null values
        if (value === null) return;

        // 2. Remove specific top-level/general ignored keys
        if (ignoredKeys.includes(key)) return;

        // 3. Handle Metric Sections specifically
        if (metricSections.includes(key) && typeof value === 'object') {
            const filteredMetric = {};
            Object.entries(value).forEach(([subKey, subValue]) => {
                // Remove nulls inside metrics
                if (subValue === null) return;

                // Remove Warning, Improvements, Passed, Percentage from specific metrics
                if (metricIgnoredKeys.includes(subKey)) return;

                // Recursively filter other objects (like nested metrics)
                filteredMetric[subKey] = filterRawData(subValue);
            });
            // Only add if not empty (optional, but keeps it clean)
            if (Object.keys(filteredMetric).length > 0) {
                filtered[key] = filteredMetric;
            }
            return;
        }

        // 4. Recursive call for other objects
        filtered[key] = filterRawData(value);
    });

    return filtered;
};

// ========================================================
//  PDF GENERATOR (PREMIUM + CLEAN VERSION)
// ========================================================

export const generatePDF = (originalObj) => {
    // Filter the object first to ensure PDF matches Raw Data view
    const obj = filterRawData(originalObj);

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
        if (sectionName.toLowerCase() === "schema" || sectionName.toLowerCase() === "siteschema") {
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

                    // Determine Color based on Status/Score
                    let blockColor = [245, 245, 245]; // Default Gray
                    const sVal = Object.entries(metricVal).find(([k]) => k.toLowerCase() === 'status')?.[1];

                    if (sVal) {
                        const statusStr = String(sVal).toLowerCase();
                        if (statusStr.includes("pass")) {
                            blockColor = [220, 252, 231]; // Green-100
                        } else if (statusStr.includes("fail")) {
                            blockColor = [254, 226, 226]; // Red-100
                        } else if (statusStr.includes("warning")) {
                            blockColor = [255, 237, 213]; // Orange-100
                        }
                    }

                    rows.push({
                        type: "metric",
                        Key: Metric,
                        Value: "",
                        blockColor: blockColor
                    });

                    Object.entries(metricVal).forEach(([k2, v2]) => {
                        // USER REQUEST: Only show Score and Status (Case Insensitive)
                        if (["score", "status"].includes(k2.toLowerCase())) {
                            rows.push({
                                type: "normal",
                                Key: cleanKey(k2),
                                Value: formatValue(v2),
                            });
                        }
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
                dataCell.cell.styles.fillColor = [220, 235, 255];
                dataCell.cell.styles.textColor = [0, 70, 150];
                dataCell.cell.styles.fontStyle = "bold";
                dataCell.cell.styles.fontSize = 11;
            }

            // ⭐ METRIC (sub-section) (Dynamic BG)
            if (row.type === "metric") {
                dataCell.cell.colSpan = 2;
                dataCell.cell.styles.fillColor = row.blockColor || [245, 245, 245];
                dataCell.cell.styles.fontStyle = "bold";
            }

            // ⭐ NORMAL ROW (Key को un-bold करें)
            if (row.type === "normal" && dataCell.column.index === 0) {
                dataCell.cell.styles.fontStyle = "normal";
            }

            // ⭐ STATUS COLOR CODING
            if (row.Key === "Status" && dataCell.column.index === 1) {
                const statusVal = String(row.Value).toLowerCase();
                if (statusVal.includes("pass")) {
                    dataCell.cell.styles.textColor = [34, 197, 94]; // Green
                    dataCell.cell.styles.fontStyle = "bold";
                } else if (statusVal.includes("fail")) {
                    dataCell.cell.styles.textColor = [239, 68, 68]; // Red
                    dataCell.cell.styles.fontStyle = "bold";
                } else if (statusVal.includes("warning")) {
                    dataCell.cell.styles.textColor = [249, 115, 22]; // Orange
                    dataCell.cell.styles.fontStyle = "bold";
                }
            }

            // ⭐ HEADING SCHEME block (NO BG)
            if (row.type === "heading_box") {
                dataCell.cell.styles.fillColor = [255, 245, 225];
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
