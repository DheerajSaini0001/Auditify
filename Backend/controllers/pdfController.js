import SingleAuditReport from "../models/singleAuditReport.js";
import puppeteer from "puppeteer";
import path from "path";

export const generatePDFReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await SingleAuditReport.findById(id);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.status !== "completed") {
      return res.status(400).json({ error: "Audit is not completed yet" });
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    const sections = [
        { key: 'technicalPerformance', title: 'Technical Performance' },
        { key: 'onPageSEO', title: 'On-Page SEO' },
        { key: 'accessibility', title: 'Accessibility' },
        { key: 'securityOrCompliance', title: 'Security & Compliance' },
        { key: 'UXOrContentStructure', title: 'UX & Content Structure' },
        { key: 'conversionAndLeadFlow', title: 'Conversion & Lead Flow' },
        { key: 'aioReadiness', title: 'AIO Readiness' }
    ];

    let dynamicContent = "";

    const formatValue = (val) => {
        if (typeof val === 'object' && val !== null) return JSON.stringify(val);
        return String(val || 'N/A');
    }

    sections.forEach((sec, sIdx) => {
        const data = report[sec.key];
        if (data && typeof data === 'object') {
            dynamicContent += `<div class="page-break"></div><h2 class="section-main-title">Section ${sIdx + 1}: ${sec.title}</h2>`;
            
            Object.entries(data).forEach(([mKey, mVal]) => {
                if (['Percentage', 'Section_Score', 'score', 'grade'].includes(mKey)) return;

                const processMetric = (metric, subName = "") => {
                   if (!metric || typeof metric !== 'object' || Array.isArray(metric)) return;

                   let title = mKey.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
                   if (subName) title += ` (${subName})`;

                   const detailsObj = metric.description || metric.Description || metric.details || metric.Details || metric.value || "No detailed description provided by the scan.";
                   let detailsStr = typeof detailsObj === 'object' ? JSON.stringify(detailsObj) : detailsObj;
                   if (detailsStr.startsWith('{') && detailsStr.length > 50) detailsStr = "Complex Object Evaluated (See Advanced Diagnostic Data)";

                   const score = metric.score ?? metric.Score ?? 100;
                   const status = metric.status || metric.Status || (score >= 90 ? 'Pass' : score >= 50 ? 'Warning' : 'Fail');
                   const cause = metric.cause || (metric.analysis && metric.analysis.cause) || (metric.meta && metric.meta.why_this_occurred) || metric.failureMessage || "";
                   const recommendation = metric.recommendation || (metric.analysis && metric.analysis.recommendation) || (metric.meta && metric.meta.how_to_fix) || metric.suggestion || metric.Suggestion || "";

                   const statusClass = status.toLowerCase().includes('pass') ? 'status-pass' : status.toLowerCase().includes('fail') ? 'status-fail' : 'status-warn';

                   let advancedDataHtml = "";
                   
                   if (!statusClass.includes('pass')) {
                       let diagnosticData = {};
                       // Safely collect diagnostic data specifically for errors
                       if (metric.meta) diagnosticData = { ...diagnosticData, ...metric.meta };
                       if (metric.details && typeof metric.details === 'object') diagnosticData = { ...diagnosticData, ...metric.details };
                       if (metric.items) diagnosticData.items = metric.items;
                       if (metric.nodes) diagnosticData.nodes = metric.nodes;
                       
                       // Remove redundant standard fields before dumping
                       delete diagnosticData.cause;
                       delete diagnosticData.recommendation;
                       delete diagnosticData.score;
                       delete diagnosticData.status;

                       if (Object.keys(diagnosticData).length > 0) {
                           const rawString = JSON.stringify(diagnosticData, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;');
                           advancedDataHtml = `
                           <div class="nodes-box mt-10" style="background:#f8fafc; padding: 20px; border-left: 6px solid #475569; border-radius: 0 12px 12px 0;">
                                <strong style="color: var(--dark); font-size: 16px;">Advanced Diagnostic Data (All Contextual Metrics):</strong>
                                <pre style="font-family: monospace; font-size: 11px; color: #334155; margin-top: 15px; background: #f1f5f9; padding: 15px; border-radius: 8px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;">${rawString}</pre>
                           </div>`;
                       }
                   }

                   dynamicContent += `
                   <div class="metric-detailed-card">
                       <div class="metric-detailed-header">
                           <h3>${title}</h3>
                           <span class="badge ${statusClass}">${status}</span>
                       </div>
                       <div class="metric-detailed-body">
                           <p style="font-size: 16px; line-height: 2;"><strong>Status Description:</strong> ${detailsStr}</p>
                           
                           ${cause && statusClass.includes('fail') ? `<div class="error-box mt-10"><strong>Why It Failed (Root Cause Analysis):</strong> <br/><span style="color: #991b1b; display:inline-block; margin-top: 8px;">${cause}</span></div>` : ''}
                           
                           ${advancedDataHtml}

                           ${recommendation ? `<div class="recommendation-box mt-10"><strong>Recommended Engineering Action:</strong> <br/><span style="color: #166534; display:inline-block; margin-top: 8px;">${recommendation}</span></div>` : ''}
                           
                           <div style="margin-top: 30px; font-size: 14px; color: #94a3b8; border-top: 2px dashed #e2e8f0; padding-top: 15px; font-weight: bold;">
                               Recorded Metric Score: ${score}/100
                           </div>
                       </div>
                   </div>
                   `;
                };

                if (mVal && typeof mVal === 'object' && (mVal.lab || mVal.crux)) {
                    if (mVal.lab) processMetric(mVal.lab, "Lab Data");
                    if (mVal.crux) processMetric(mVal.crux, "Real-World Data");
                } else if (mVal && typeof mVal === 'object' && ('details' in mVal || 'Details' in mVal || 'value' in mVal || 'score' in mVal || 'status' in mVal)) {
                    processMetric(mVal);
                } else {
                    const title = mKey.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
                    dynamicContent += `
                    <div class="metric-detailed-card">
                        <div class="metric-detailed-header">
                            <h3>${title}</h3>
                            <span class="badge status-pass">Info</span>
                        </div>
                        <div class="metric-detailed-body">
                            <p style="font-size: 16px; line-height: 2;"><strong>Recorded Data:</strong> ${formatValue(mVal)}</p>
                        </div>
                    </div>
                    `;
                }
            });
        }
    });

    // Professional HTML Template for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            
            :root {
                --primary: #3b82f6;
                --success: #10b981;
                --warning: #f59e0b;
                --danger: #ef4444;
                --dark: #0f172a;
                --light: #f8fafc;
                --border: #e2e8f0;
            }

            body {
                font-family: 'Inter', sans-serif;
                margin: 0;
                padding: 40px;
                color: var(--dark);
                background: white;
                line-height: 1.6;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid var(--border);
                padding-bottom: 20px;
                margin-bottom: 40px;
            }

            .logo {
                font-size: 24px;
                font-weight: 800;
                color: var(--primary);
                letter-spacing: -1px;
            }

            .url-info h1 {
                margin: 0;
                font-size: 18px;
                color: var(--dark);
            }

            .url-info p {
                margin: 5px 0 0;
                font-size: 12px;
                color: #64748b;
            }

            .hero {
                background: var(--light);
                border-radius: 24px;
                padding: 40px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 40px;
                border: 1px solid var(--border);
            }

            .score-circle {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                background: white;
                border: 8px solid var(--primary);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }

            .score-value {
                font-size: 32px;
                font-weight: 800;
                color: var(--dark);
            }

            .score-label {
                font-size: 10px;
                font-weight: 700;
                color: #64748b;
                text-transform: uppercase;
            }

            .grade-badge {
                padding: 8px 20px;
                border-radius: 100px;
                font-weight: 800;
                font-size: 14px;
                background: var(--primary);
                color: white;
                text-transform: uppercase;
            }

            .section-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 40px;
            }

            .section-card {
                padding: 20px;
                border: 1px solid var(--border);
                border-radius: 16px;
                background: white;
            }

            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .section-title {
                font-weight: 700;
                font-size: 14px;
                color: #475569;
            }

            .section-score {
                font-weight: 800;
                font-size: 16px;
                color: var(--primary);
            }

            .page-break {
                page-break-after: always;
            }

            .section-main-title {
                font-size: 28px;
                color: var(--dark);
                border-bottom: 4px solid var(--primary);
                padding-bottom: 15px;
                margin-bottom: 40px;
                margin-top: 40px;
            }

            .metric-detailed-card {
                border: 2px solid var(--border);
                border-radius: 16px;
                padding: 40px;
                margin-bottom: 60px;
                background: white;
                page-break-inside: avoid;
                min-height: 400px; /* Forces large vertical space ensuring high page count */
            }

            .metric-detailed-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid var(--border);
                padding-bottom: 20px;
                margin-bottom: 20px;
            }

            .metric-detailed-header h3 {
                margin: 0;
                font-size: 22px;
                font-weight: 800;
                color: var(--dark);
            }

            .badge {
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 800;
                text-transform: uppercase;
            }

            .status-pass { background: #dcfce7; color: #166534; }
            .status-warn { background: #fef9c3; color: #854d0e; }
            .status-fail { background: #fee2e2; color: #991b1b; }

            .error-box {
                background: #fef2f2;
                border-left: 6px solid #ef4444;
                padding: 25px;
                color: #7f1d1d;
                border-radius: 0 12px 12px 0;
                font-size: 16px;
                line-height: 1.8;
                page-break-inside: avoid;
            }

            .recommendation-box {
                background: #f0fdf4;
                border-left: 6px solid #22c55e;
                padding: 25px;
                color: #14532d;
                border-radius: 0 12px 12px 0;
                font-size: 16px;
                line-height: 1.8;
                page-break-inside: avoid;
            }

            .mt-10 { margin-top: 25px; }

            .footer {
                margin-top: 60px;
                text-align: center;
                font-size: 14px;
                color: #94a3b8;
                border-top: 1px solid var(--border);
                padding-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">Auditify.</div>
            <div class="url-info">
                <h1>${report.url}</h1>
                <p>Audit Date: ${new Date(report.createdAt).toLocaleDateString()}</p>
                <p>Device: ${report.device} | Report Type: ${report.report}</p>
            </div>
        </div>

        <div class="hero">
            <div>
                <h2 style="border:none; padding: 0; margin-bottom: 10px;">Audit Performance Summary</h2>
                <p style="color: #64748b; font-size: 16px; max-width: 500px; line-height: 1.6;">
                    Detailed analysis of your website's performance, SEO, accessibility, and security compliance benchmarks.
                </p>
                <div style="margin-top: 25px;">
                    <span class="grade-badge" style="background: ${report.grade.startsWith('A') ? 'var(--success)' : report.grade === 'B' ? 'var(--primary)' : 'var(--danger)'}">
                        Grade ${report.grade}
                    </span>
                </div>
            </div>
            <div class="score-circle" style="border-color: ${report.score >= 90 ? 'var(--success)' : report.score >= 70 ? 'var(--primary)' : 'var(--danger)'}">
                <span class="score-value">${report.score}%</span>
                <span class="score-label">OVERALL SCORE</span>
            </div>
        </div>

        <h2 style="font-size: 24px;">Category Breakdown</h2>
        <div class="section-grid">
            ${report.sectionScore ? report.sectionScore.map(s => `
                <div class="section-card">
                    <div class="section-header">
                        <span class="section-title">${s.name}</span>
                        <span class="section-score" style="color: ${s.score >= 90 ? 'var(--success)' : s.score >= 70 ? 'var(--primary)' : 'var(--danger)'}">
                            ${s.score}%
                          </span>
                    </div>
                    <div style="height: 6px; width: 100%; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                        <div style="height: 100%; width: ${s.score}%; background: ${s.score >= 90 ? 'var(--success)' : s.score >= 70 ? 'var(--primary)' : 'var(--danger)'};"></div>
                    </div>
                </div>
            `).join('') : `
                <div class="section-card" style="grid-column: span 2; text-align: center; color: #94a3b8; padding: 40px;">
                    No detailed category metrics available for this report type.
                </div>
            `}
        </div>

        <div class="page-break"></div>
        <div class="methodology-section" style="padding: 40px; border: 2px solid var(--border); border-radius: 16px; background: white; margin-bottom: 40px; min-height: 300px;">
             <h2 style="font-size: 28px; color: var(--dark); border-bottom: 4px solid var(--primary); padding-bottom: 15px; margin-bottom: 20px;">Methodology & Legend</h2>
             <p style="font-size: 16px; line-height: 2;">
                 This comprehensive audit report evaluates the target URL across hundreds of automated parameters.
                 Each parameter has been meticulously analyzed, graded, and formatted to ensure maximum clarity and actionability.
             </p>
             <ul style="font-size: 16px; line-height: 2.2; margin-top: 20px; color: #475569;">
                <li><strong style="color: #166534;">PASS (Green):</strong> Optimal performance. No immediate action required.</li>
                <li><strong style="color: #854d0e;">WARNING (Yellow):</strong> Fair performance. Action recommended.</li>
                <li><strong style="color: #991b1b;">FAIL (Red):</strong> Poor performance. Critical attention required.</li>
             </ul>
        </div>
        
        ${dynamicContent}

        <div class="page-break"></div>
        <div class="methodology-section" style="padding: 40px; border: 2px solid var(--border); border-radius: 16px; background: white; margin-bottom: 40px; min-height: 800px;">
             <h2 style="font-size: 28px; color: var(--dark); border-bottom: 4px solid var(--primary); padding-bottom: 15px; margin-bottom: 20px;">Glossary & Next Steps</h2>
             <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">What's next?</p>
             <p style="font-size: 16px; line-height: 2.5; color: #475569;">
                 1. Distribute this comprehensive audit to the lead engineering and SEO teams.<br/>
                 2. Prioritize failing elements (Red metrics) immediately.<br/>
                 3. Remediate warning elements (Yellow metrics) within current sprint cycles.<br/>
                 4. Use the recorded recommendations to configure standard operating procedures.<br/>
                 5. Re-run the Auditify tool after deployments to verify changes in Lab/Crux data.<br/>
             </p>
             <div style="margin-top: 150px; text-align: center;">
                 <div class="logo" style="font-size: 32px; opacity: 0.3;">Auditify.</div>
                 <p style="color: #94a3b8; margin-top: 10px;">End of Report</p>
             </div>
        </div>

        <div class="footer">
            Generated by Auditify AI Engine. © 2026 Auditify. All Rights Reserved.
            <br/>
            This document is a technical analysis and should be used as a reference for website optimization.
        </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });

    await browser.close();

    res.contentType("application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Auditify-Report-${report.url.replace(/[^a-z0-9]/gi, "-")}.pdf`
    );
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate PDF report" });
  }
};
