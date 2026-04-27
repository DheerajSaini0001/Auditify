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
    if (s.includes('pass') || (typeof score === 'number' && score >= 90)) return [139, 92, 246]; // Violet
    if (s.includes('fail') || (typeof score === 'number' && score < 50)) return [239, 68, 68]; // Red
    if (s.includes('warning') || (typeof score === 'number' && score < 90)) return [249, 115, 22]; // Orange
    return [100, 100, 100]; // Grey
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
    const successColor = [139, 92, 246];
    const warningColor = [249, 115, 22];
    const errorColor = [239, 68, 68];
    const textColor = [52, 73, 94];

    const sections = [
        { key: 'technicalPerformance', alt: 'Technical_Performance', title: 'Technical Performance' },
        { key: 'onPageSEO', alt: 'On_Page_SEO', title: 'On-Page SEO' },
        { key: 'accessibility', alt: 'Accessibility', title: 'Accessibility' },
        { key: 'securityOrCompliance', alt: 'Security_or_Compliance', title: 'Security & Compliance' },
        { key: 'UXOrContentStructure', alt: 'UX_or_Content_Structure', title: 'UX & Content Structure' },
        { key: 'conversionAndLeadFlow', alt: 'Conversion_and_Lead_Flow', title: 'Conversion & Lead Flow' },
        { key: 'aioReadiness', alt: 'AIO_Readiness', title: 'AIO Readiness' }
    ];

    // --- HELPERS ---
    const drawBranding = () => {
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 5, "F");
    };

    const addFooter = () => {
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFillColor(...secondaryColor);
            doc.rect(0, pageHeight - 15, pageWidth, 15, "F");

            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            const str = `Page ${i} of ${totalPages}`;
            doc.text(str, pageWidth - margin, pageHeight - 20, { align: 'right' });
            doc.text("PageSpeed SLT - Confidential Technical Audit", margin, pageHeight - 20);
        }
    };

    let yPos = 0;

    // --- PAGE 1: INTEGRATED COVER & SUMMARY ---
    // Left Accent Sidebar
    doc.setFillColor(...secondaryColor);
    doc.rect(0, 0, 10, pageHeight, "F");

    drawBranding();
    yPos = 80;

    // Header Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(42);
    doc.setTextColor(...secondaryColor);
    doc.text("WEBSITE", margin + 10, yPos);
    yPos += 45;
    doc.text("AUDIT REPORT", margin + 10, yPos);

    yPos += 15;
    doc.setFillColor(...primaryColor);
    doc.rect(margin + 10, yPos, 60, 4, "F");

    yPos += 35;
    doc.setFontSize(15);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "normal");
    doc.text("Comprehensive Deep-Dive Audit & Performance Roadmap", margin + 10, yPos);

    // Meta Info Block
    yPos += 60;
    const siteUrl = data.url || data.Site || "Reported URL";
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + 10, yPos - 15, pageWidth - (margin * 2) - 10, 55, 6, 6, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("TARGET AUDIT URL", margin + 25, yPos + 5);
    doc.text("DATE GENERATED", margin + 25, yPos + 25);

    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    doc.setFont("helvetica", "normal");
    doc.text(siteUrl.length > 70 ? siteUrl.substring(0, 70) + "..." : siteUrl, margin + 130, yPos + 5);
    doc.text(dateStr, margin + 130, yPos + 25);

    // --- EXECUTIVE SUMMARY ---
    yPos += 90;
    doc.setFontSize(20);
    doc.setTextColor(...secondaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", margin + 10, yPos);

    const overallScore = (data.score ?? data.Score ?? 0);
    const overallGrade = (data.grade || data.Grade || "N/A");
    let badgeColor = overallScore >= 90 ? successColor : overallScore >= 50 ? warningColor : errorColor;
    let statusLabel = overallScore >= 90 ? "OPTIMAL PERFORMANCE" : overallScore >= 50 ? "NEEDS IMPROVEMENT" : "CRITICAL ATTENTION";

    // Status Label Tag
    doc.setFontSize(9);
    doc.setFillColor(...badgeColor);
    doc.roundedRect(pageWidth - margin - 140, yPos - 17, 130, 20, 10, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(statusLabel, pageWidth - margin - 75, yPos - 4, { align: "center" });

    yPos += 30;
    doc.setFillColor(252, 252, 253);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + 10, yPos, pageWidth - (margin * 2) - 10, 100, 8, 8, "FD");

    // Score Circle
    const circleX = margin + 70;
    const circleY = yPos + 50;
    doc.setFillColor(...badgeColor);
    doc.circle(circleX, circleY, 36, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.text(`${overallScore}`, circleX, circleY + 8, { align: "center" });

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(22);
    doc.text(`Grade: ${overallGrade}`, margin + 125, yPos + 48);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(`The overall score is calculated across all ${sections.filter(s => data[s.key] || data[s.alt]).length} audit categories.`, margin + 125, yPos + 68);

    yPos += 160;

    // TOC
    doc.setFontSize(16);
    doc.setTextColor(...secondaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("Audit Index", margin + 10, yPos);

    yPos += 30;
    let tocY = yPos;
    let count = 1;

    sections.forEach((sec) => {
        const hasData = data[sec.key] || data[sec.alt];
        if (hasData) {
            // Bullet Point
            doc.setFillColor(...primaryColor);
            doc.circle(margin + 18, tocY - 4, 3, "F");

            doc.setFontSize(10);
            doc.setTextColor(...textColor);
            doc.setFont("helvetica", "bold");
            doc.text(`${sec.title}`, margin + 30, tocY);

            doc.setDrawColor(241, 245, 249);
            doc.line(margin + 175, tocY - 3, pageWidth - margin - 10, tocY - 3);

            tocY += 24;
            count++;
        }
    });

    // --- AUDIT SECTIONS (Each on a fresh page) ---
    sections.forEach(sec => {
        const sectionData = data[sec.key] || data[sec.alt];
        if (!sectionData || (typeof sectionData === 'object' && Object.keys(sectionData).length === 0)) return;

        doc.addPage();
        drawBranding();
        yPos = 60;

        doc.setFontSize(22);
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text(sec.title, margin, yPos);

        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(2);
        doc.line(margin, yPos + 8, margin + 40, yPos + 8);

        yPos += 45;

        const tableRows = [];

        // Section Parameters & Core Web Vitals (Lab vs Field)
        Object.entries(sectionData).forEach(([k, v]) => {
            if (['Percentage', 'Real_User_Experience', 'Schema', 'siteSchema', 'Section_Score', 'score', 'grade'].includes(k)) return;

            // Helper to process a single metric object (supports nested lab/crux)
            const processMetric = (metric, subName = "") => {
                if (!metric || typeof metric !== 'object' || Array.isArray(metric)) return;

                const name = subName ? `${cleanKey(k)} (${subName})` : cleanKey(k);
                const valDetails = metric.details || metric.Details || (metric.value != null ? String(metric.value) : "");
                const valStatus = (metric.status || metric.Status || (metric.score >= 90 ? 'Pass' : (metric.score >= 50 ? 'Warning' : 'Fail')));
                const statusClean = cleanKey(valStatus);
                const isIssue = cleanedStatusIsIssue(statusClean);

                const cause = metric.cause || (metric.analysis && metric.analysis.cause) || (metric.meta && metric.meta.why_this_occurred) || "";
                const recommendation = metric.recommendation || (metric.analysis && metric.analysis.recommendation) || (metric.meta && metric.meta.how_to_fix) || metric.suggestion || metric.Suggestion || "";

                let cellBody = sanitizeText(valDetails);
                if (cause && isIssue) cellBody += `\n\nCause: ${sanitizeText(cause)}`;
                if (recommendation && isIssue) cellBody += `\n\nRecommendation: ${sanitizeText(recommendation)}`;

                tableRows.push({ name, details: cellBody, status: statusClean, score: metric.score ?? metric.Score ?? 0 });
            };

            // Detect Lab/Crux structure (Typical for Technical Performance)
            if (v && typeof v === 'object' && (v.lab || v.crux)) {
                if (v.lab) processMetric(v.lab, "Lab Data");
                if (v.crux) processMetric(v.crux, "Real-World Data");
            } else {
                processMetric(v);
            }
        });

        if (tableRows.length > 0) {
            autoTable(doc, {
                startY: yPos,
                head: [['Parameter', 'Description & Action Plan', 'Status']],
                body: tableRows.map(r => [r.name, r.details, r.status]),
                theme: 'striped',
                headStyles: { fillColor: secondaryColor, textColor: 255, fontSize: 10, cellPadding: 10 },
                bodyStyles: { fontSize: 9, cellPadding: 10, textColor: [40, 40, 40], valign: 'top' },
                columnStyles: {
                    0: { cellWidth: 120, fontStyle: 'bold' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 65, halign: 'center', fontStyle: 'bold' }
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 2) {
                        const r = tableRows[data.row.index];
                        data.cell.styles.textColor = getStatusColor(r.status, r.score);
                    }
                }
            });
        }
    });

    // --- FINAL PAGE: CLOSING ---
    doc.addPage();
    drawBranding();
    yPos = 100;

    doc.setFontSize(24);
    doc.setTextColor(...secondaryColor);
    doc.text("Next Steps & Disclaimer", margin, yPos);

    yPos += 40;
    doc.setFontSize(10);
    doc.setTextColor(...textColor);

    const closingText = [
        "1. Immediate Actions: Address all 'Fail' status parameters as they directly impact your SEO and performance.",
        "2. Continuous Monitoring: Run this audit monthly to catch new issues as your content updates.",
        "3. Technical Integration: Share this report with your engineering team for structural fixes.",
        "",
        "Disclaimer: This report is based on automated assessment tools and simulated visitor data. Results may vary based on user device, connection speed, and geographic location. PageSpeed SLT does not guarantee specific SERP rankings."
    ];

    closingText.forEach(line => {
        const splitText = doc.splitTextToSize(line, pageWidth - (margin * 2));
        doc.text(splitText, margin, yPos);
        yPos += (splitText.length * 14) + 6;
    });

    addFooter();

    const fileName = siteUrl.replace(/^https?:\/\//, '').replace(/[^\w]/g, '_');
    doc.save(`Audit_Report_${fileName}.pdf`);
};
