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
                line-height: 1.5;
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

            .url-info {
                text-align: right;
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

            .metric-row {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                padding: 8px 0;
                border-top: 1px solid #f1f5f9;
            }

            .metric-label {
                color: #64748b;
            }

            .metric-value {
                font-weight: 600;
                color: var(--dark);
            }

            .footer {
                margin-top: 60px;
                text-align: center;
                font-size: 12px;
                color: #94a3b8;
                border-top: 1px solid var(--border);
                padding-top: 20px;
            }

            .page-break {
                page-break-after: always;
            }

            .status-pass { color: var(--success); }
            .status-fail { color: var(--danger); }
            .status-warn { color: var(--warning); }

            h2 {
                font-size: 20px;
                font-weight: 800;
                margin-bottom: 20px;
                border-left: 4px solid var(--primary);
                padding-left: 15px;
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
                <p style="color: #64748b; font-size: 14px; max-width: 400px;">
                    Detailed analysis of your website's performance, SEO, accessibility, and security compliance benchmarks.
                </p>
                <div style="margin-top: 20px;">
                    <span class="grade-badge" style="background: ${report.grade.startsWith('A') ? 'var(--success)' : report.grade === 'B' ? 'var(--primary)' : 'var(--danger)'}">
                        Grade ${report.grade}
                    </span>
                </div>
            </div>
            <div class="score-circle" style="border-color: ${report.score >= 90 ? 'var(--success)' : report.score >= 70 ? 'var(--primary)' : 'var(--danger)'}">
                <span class="score-value">${report.score}%</span>
                <span class="score-label">OVERALL</span>
            </div>
        </div>

        <h2>Category Breakdown</h2>
        <div class="section-grid">
            ${report.sectionScore ? report.sectionScore.map(s => `
                <div class="section-card">
                    <div class="section-header">
                        <span class="section-title">${s.name}</span>
                        <span class="section-score" style="color: ${s.score >= 90 ? 'var(--success)' : s.score >= 70 ? 'var(--primary)' : 'var(--danger)'}">
                            ${s.score}%
                          </span>
                    </div>
                    <div style="height: 4px; width: 100%; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                        <div style="height: 100%; width: ${s.score}%; background: ${s.score >= 90 ? 'var(--success)' : s.score >= 70 ? 'var(--primary)' : 'var(--danger)'};"></div>
                    </div>
                </div>
            `).join('') : `
                <div class="section-card" style="grid-column: span 2; text-align: center; color: #94a3b8;">
                    No detailed category metrics available for this report type.
                </div>
            `}
        </div>

        <div class="page-break"></div>

        <h2>Technical Performance</h2>
        <div class="section-card" style="margin-bottom: 30px;">
            <div class="metric-row">
                <span class="metric-label">Load Time</span>
                <span class="metric-value">${report.technicalPerformance?.LoadTime || 'N/A'}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Page Size</span>
                <span class="metric-value">${report.technicalPerformance?.PageSize || 'N/A'}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">HTTP Requests</span>
                <span class="metric-value">${report.technicalPerformance?.Requests || 'N/A'}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">TTFB (Server Response)</span>
                <span class="metric-value">${report.technicalPerformance?.TTFB || 'N/A'}</span>
            </div>
        </div>

        <h2>On-Page SEO Metrics</h2>
        <div class="section-card" style="margin-bottom: 30px;">
            <div class="metric-row">
                <span class="metric-label">Title Tag</span>
                <span class="metric-value" style="font-size: 10px;">${report.onPageSEO?.Title || 'Missing'}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Meta Description</span>
                <span class="metric-value" style="font-size: 10px;">${report.onPageSEO?.Description || 'Missing'}</span>
            </div>
             <div class="metric-row">
                <span class="metric-label">Robots.txt</span>
                <span class="metric-value ${report.onPageSEO?.RobotsTxt ? 'status-pass' : 'status-fail'}">
                    ${report.onPageSEO?.RobotsTxt ? 'Present' : 'Missing'}
                </span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Sitemap</span>
                <span class="metric-value ${report.onPageSEO?.Sitemap ? 'status-pass' : 'status-fail'}">
                    ${report.onPageSEO?.Sitemap ? 'Present' : 'Missing'}
                </span>
            </div>
        </div>

        <h2>Accessibility & UX</h2>
        <div class="section-card">
            <div class="metric-row">
                <span class="metric-label">Axe Violations</span>
                <span class="metric-value">${report.accessibility?.TotalViolations || 0} Issues</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Mobile Responsive</span>
                <span class="metric-value ${report.UXOrContentStructure?.MobileFriendly ? 'status-pass' : 'status-fail'}">
                    ${report.UXOrContentStructure?.MobileFriendly ? 'Yes' : 'No'}
                </span>
            </div>
             <div class="metric-row">
                <span class="metric-label">HTTPS Usage</span>
                <span class="metric-value ${report.securityOrCompliance?.HTTPS ? 'status-pass' : 'status-fail'}">
                    ${report.securityOrCompliance?.HTTPS ? 'Secure' : 'Insecure'}
                </span>
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
    res.send(pdfBuffer);

  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate PDF report" });
  }
};
