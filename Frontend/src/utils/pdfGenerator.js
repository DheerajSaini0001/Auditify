/* eslint-disable no-unused-vars */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ========================================================
// UTILITY FUNCTIONS
// ========================================================

export const sanitizeText = (t) => {
    if (t == null) return "";
    return String(t)
        .replace(/≤/g, "<= ")
        .replace(/≥/g, ">= ")
        .replace(/→/g, " to ")
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/\s+/g, " ")
        .trim();
};

export const cleanKey = (str) =>
    String(str)
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (c) => c.toUpperCase());

export const formatValue = (val) => {
    if (val == null) return "";
    if (typeof val === "object") return JSON.stringify(val, null, 2);
    return sanitizeText(val);
};

export const cleanedStatusIsIssue = (status) => {
    const s = String(status).toLowerCase();
    return s.includes('fail') || s.includes('warning') || s.includes('poor');
};

// ========================================================
// RAW DATA FILTER (For JSON View in Frontend)
// ========================================================

export const filterRawData = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(filterRawData).filter(item => item !== null && item !== undefined);
    }

    const filtered = {};
    const ignoredKeys = ['_id', 'Status', 'createdAt', 'updatedAt', '__v', 'Error_Message', 'Raw', 'screenshot', 'error'];
    const metricSections = [
        'Technical_Performance', 'technicalPerformance',
        'On_Page_SEO', 'onPageSEO',
        'Accessibility', 'accessibility',
        'Security_or_Compliance', 'securityOrCompliance',
        'UX_or_Content_Structure', 'UXOrContentStructure',
        'Conversion_and_Lead_Flow', 'conversionAndLeadFlow',
        'AIO_Readiness', 'aioReadiness'
    ];
    const metricIgnoredKeys = ['Warning', 'Improvements', 'Passed', 'Percentage'];

    Object.entries(obj).forEach(([key, value]) => {
        if (value === null) return;
        if (ignoredKeys.includes(key)) return;

        if (metricSections.includes(key) && typeof value === 'object') {
            const filteredMetric = {};
            Object.entries(value).forEach(([subKey, subValue]) => {
                if (subValue === null) return;
                if (metricIgnoredKeys.includes(subKey)) return;
                filteredMetric[subKey] = filterRawData(subValue);
            });
            if (Object.keys(filteredMetric).length > 0) {
                filtered[key] = filteredMetric;
            }
            return;
        }

        filtered[key] = filterRawData(value);
    });

    return filtered;
};

// ========================================================
// PDF GENERATOR
// ========================================================

const getStatusColor = (status, score) => {
    const s = String(status || "").toLowerCase();
    if (s.includes('pass') || (typeof score === 'number' && score >= 90)) return [34, 197, 94]; // Green
    if (s.includes('fail') || (typeof score === 'number' && score < 50)) return [239, 68, 68]; // Red
    if (s.includes('warning') || (typeof score === 'number' && score < 90)) return [249, 115, 22]; // Orange
    return [100, 100, 100]; // Grey
};

const addFooter = (doc, pageNumber) => {
    const totalPages = doc.getNumberOfPages();
    const str = `Page ${pageNumber} of ${totalPages}`;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("PageSpeed SLT - Comprehensive Website Audit", 40, pageHeight - 20);
    doc.text(str, pageWidth - 80, pageHeight - 20);
};

export const generatePDF = (data) => {
    if (!data) return;

    const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;

    // --- COLORS ---
    const primaryColor = [41, 128, 185]; // Blue
    const secondaryColor = [44, 62, 80]; // Dark Navy
    const accentColor = [236, 240, 241]; // Light Gray
    const successColor = [39, 174, 96];
    const warningColor = [230, 126, 34];
    const errorColor = [192, 57, 43];

    let yPos = 40;

    // --- HELPER: DRAW HEADER ---
    const drawHeader = () => {
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 15, "F"); // Top branded bar
    };

    // --- PAGE 1: COVER & SUMMARY ---
    drawHeader();
    yPos = 80;

    // Title Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(...secondaryColor);
    doc.text("PageSpeed SLT", margin, yPos);

    doc.setFontSize(14);
    doc.setTextColor(127, 140, 141);
    doc.setFont("helvetica", "normal");
    doc.text("Comprehensive Deep-Dive Audit Report", margin, yPos + 20);

    // Report Metadata Table (Right Aligned - conceptually)
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setFontSize(10);
    doc.text(`Generated on: ${dateStr}`, margin, yPos + 45);

    yPos += 80;

    // --- EXECUTIVE SUMMARY CARD ---
    const overallScore = (data.score ?? data.Score ?? 0);
    const overallGrade = (data.grade || data.Grade || "N/A");

    // Determine Color
    let badgeColor = overallScore >= 90 ? successColor : overallScore >= 50 ? warningColor : errorColor;

    // Card Background
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 140, 5, 5, "FD");

    // Score Circle (Left)
    const circleX = margin + 70;
    const circleY = yPos + 70;
    doc.setFillColor(...badgeColor);
    doc.circle(circleX, circleY, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text(`${overallScore}`, circleX, circleY + 10, { align: "center" });

    // Details (Right)
    const textStartX = margin + 140;
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(22);
    doc.text(`Grade ${overallGrade}`, textStartX, yPos + 45);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");

    const urlText = data.url || data.Site || "Analyzed Website";
    // Check url length
    const displayUrl = urlText.length > 50 ? urlText.substring(0, 50) + "..." : urlText;

    doc.text(`Target URL: ${displayUrl}`, textStartX, yPos + 75);
    doc.text(`Device Strategy: ${data.device || data.Device || "Desktop"}`, textStartX, yPos + 95);

    yPos += 180;

    // --- SECTION BREAKDOWN SUMMARY ---
    const sectionScores = data.sectionScore || data.Section_Score;
    if (sectionScores && Array.isArray(sectionScores) && sectionScores.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(...secondaryColor);
        doc.setFont("helvetica", "bold");
        doc.text("Performance Overview", margin, yPos);
        yPos += 20;

        const scoreRows = sectionScores.map(s => {
            const name = s.name || s.Name || "Unknown";
            const val = s.score ?? s.Score ?? 0;
            let assessment = "Critical";
            if (val >= 90) assessment = "Excellent";
            else if (val >= 50) assessment = "Needs Work";
            return { name, val, assessment };
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Audit Category', 'Score', 'Status']],
            body: scoreRows.map(r => [r.name, r.val + "%", r.assessment]),
            theme: 'grid',
            headStyles: {
                fillColor: secondaryColor,
                textColor: 255,
                fontStyle: 'bold',
                halign: 'left',
                cellPadding: 8
            },
            bodyStyles: {
                cellPadding: 8,
                fontSize: 10,
                textColor: 50
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 60, halign: 'center', fontStyle: 'bold' },
                2: { cellWidth: 100, halign: 'center' }
            },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 1) {
                    const val = parseInt(data.cell.raw);
                    if (val >= 90) data.cell.styles.textColor = successColor;
                    else if (val >= 50) data.cell.styles.textColor = warningColor;
                    else data.cell.styles.textColor = errorColor;
                }
            }
        });
        yPos = doc.lastAutoTable.finalY + 40;
    }

    // --- DETAILED AUDIT SECTIONS ---
    const sections = [
        { key: 'technicalPerformance', alt: 'Technical_Performance', title: 'Technical Performance' },
        { key: 'onPageSEO', alt: 'On_Page_SEO', title: 'On-Page SEO' },
        { key: 'accessibility', alt: 'Accessibility', title: 'Accessibility' },
        { key: 'securityOrCompliance', alt: 'Security_or_Compliance', title: 'Security & Compliance' },
        { key: 'UXOrContentStructure', alt: 'UX_or_Content_Structure', title: 'UX & Content Structure' },
        { key: 'conversionAndLeadFlow', alt: 'Conversion_and_Lead_Flow', title: 'Conversion & Lead Flow' },
        { key: 'aioReadiness', alt: 'AIO_Readiness', title: 'AIO Readiness' }
    ];

    sections.forEach(sec => {
        const sectionData = data[sec.key] || data[sec.alt];
        if (!sectionData || (typeof sectionData === 'object' && Object.keys(sectionData).length === 0)) return;

        // Page Break Logic
        if (yPos > pageHeight - 100) {
            doc.addPage();
            drawHeader();
            yPos = 60;
        }

        // Section Title
        doc.setFillColor(245, 247, 250);
        doc.rect(margin, yPos - 15, pageWidth - (margin * 2), 30, 'F'); // Subheader bg

        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text(sec.title.toUpperCase(), margin + 10, yPos + 5);
        yPos += 30;

        const tableRows = [];

        // Crux Data (if any)
        if (sectionData.Real_User_Experience) {
            Object.entries(sectionData.Real_User_Experience).forEach(([metric, val]) => {
                tableRows.push({
                    name: `Core Web Vital: ${cleanKey(metric)}`,
                    details: `Value: ${val.value || '-'}\n${val.suggestion || ''}`,
                    status: val.category === 'GOOD' ? 'Pass' : val.category === 'POOR' ? 'Fail' : 'Warning',
                    score: val.category === 'GOOD' ? 100 : val.category === 'POOR' ? 0 : 50
                });
            });
        }

        // Metrics Loop
        Object.entries(sectionData).forEach(([k, v]) => {
            if (['Percentage', 'Real_User_Experience', 'Schema', 'siteSchema'].includes(k)) return;

            if (v && typeof v === 'object' && !Array.isArray(v)) {
                // ... same logic as before but cleaner structure ...
                const name = cleanKey(k);
                const valDetails = v.details || v.Details || (v.value != null ? String(v.value) : "");
                const valSuggestion = v.suggestion || v.Suggestion || "";
                const valScore = v.score ?? v.Score ?? 0;
                let valStatus = v.status || v.Status || "";
                if (!valStatus) valStatus = (valScore >= 90) ? 'Pass' : 'Fail';

                const statusClean = cleanKey(valStatus);
                const isIssue = cleanedStatusIsIssue(statusClean);

                let cellContent = "";

                // Analysis
                if (valDetails) {
                    let text = sanitizeText(valDetails);
                    if (text.length > 60 && !text.includes(' ') && !text.includes('\n')) text = text.substring(0, 60) + "...";
                    if (isIssue) cellContent += `ISSUE: ${text}`;
                    else cellContent += text;
                }
                // Fix
                if (valSuggestion && isIssue) {
                    cellContent += `\n\nFIX: ${sanitizeText(valSuggestion)}`;
                }

                // Meta
                if (v.meta || v.Meta) {
                    const metaObj = v.meta || v.Meta;
                    let metaLines = [];
                    // Target
                    const targetInfo = metaObj.target || metaObj.parameter;
                    if (targetInfo && typeof targetInfo === 'string') metaLines.push(`Target: ${sanitizeText(targetInfo)}`);

                    // Lists
                    const listKeys = [
                        { key: 'unoptimizedImages', label: 'Unoptimized Images' },
                        { key: 'brokenLinksList', label: 'Broken Links', mapFn: (i) => i.url || i },
                        { key: 'failedNodes', label: 'Failing Elements', mapFn: (i) => (i.html || i.target || "").slice(0, 80) },
                        { key: 'issues', label: 'Findings' },
                        { key: 'failingElements', label: 'Elements', mapFn: (i) => i.text || i },
                        { key: 'evidence', label: 'Evidence' }
                    ];

                    let listFound = false;
                    for (const { key, label, mapFn } of listKeys) {
                        const val = metaObj[key];
                        if (Array.isArray(val) && val.length > 0) {
                            if (listFound) continue;
                            const count = val.length;
                            const itemsToShow = val.slice(0, 3).map(item => {
                                const str = mapFn ? mapFn(item) : (typeof item === 'object' ? JSON.stringify(item) : String(item));
                                return sanitizeText(str);
                            });
                            metaLines.push(`${label} (${count}):\n- ${itemsToShow.join('\n- ')}`);
                            if (count > 3) metaLines.push(`...and ${count - 3} more`);
                            listFound = true;
                        }
                    }
                    if (metaLines.length > 0) cellContent += `\n\n${metaLines.join("\n")}`;
                }

                tableRows.push({ name, details: cellContent, status: statusClean, score: valScore });

            } else if (v && typeof v !== 'object') {
                tableRows.push({ name: cleanKey(k), details: String(v), status: 'Info', score: null });
            }
        });

        if (tableRows.length > 0) {
            autoTable(doc, {
                startY: yPos,
                head: [['Metric', 'Analysis & Recommendations', 'Status']],
                body: tableRows.map(r => [r.name, r.details, r.status]),
                theme: 'plain', // Cleaner look
                styles: {
                    fontSize: 9,
                    cellPadding: 10,
                    overflow: 'linebreak',
                    valign: 'top',
                    lineColor: [230, 230, 230],
                    lineWidth: { bottom: 0.5 }
                },
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [100, 100, 100],
                    fontStyle: 'bold',
                    lineWidth: { bottom: 1, top: 0, left: 0, right: 0 },
                    lineColor: [200, 200, 200]
                },
                columnStyles: {
                    0: { cellWidth: 100, fontStyle: 'bold', textColor: [50, 50, 50] },
                    1: { cellWidth: 'auto', textColor: [80, 80, 80] },
                    2: { cellWidth: 60, halign: 'center', fontStyle: 'bold' }
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 2) {
                        const row = tableRows[data.row.index];
                        if (row.score !== null) {
                            data.cell.styles.textColor = getStatusColor(row.status, row.score);
                        } else {
                            data.cell.styles.textColor = [150, 150, 150];
                        }
                    }
                }
            });
            yPos = doc.lastAutoTable.finalY + 30;
        }
    });

    // --- FOOTER ON ALL PAGES ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(...primaryColor);
        doc.rect(0, pageHeight - 15, pageWidth, 15, "F"); // Bottom bar

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
        doc.text("PageSpeed SLT Audit", margin, pageHeight - 20);
    }

    let siteName = (data.url || "site").replace(/^https?:\/\//, '').replace(/[^\w]/g, '_');
    doc.save(`PageSpeed_SLT_Audit_${siteName}.pdf`);
};
