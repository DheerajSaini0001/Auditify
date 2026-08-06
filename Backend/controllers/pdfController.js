import SingleAuditReport from "../models/singleAuditReport.js";
import ReportLead from "../models/ReportLead.js";
import { logActivity, touchSession, trackingContext } from "../utils/activityTracker.js";
import { sendReportPdfEmail } from "../utils/auditNotifier.js";
import { markReportOutcome } from "./trackingController.js";
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import auditStore from "../utils/auditStore.js";
import logger from "../utils/logger.js";
import { acquireBrowserSlot, releaseBrowserSlot } from "../utils/browserManager.js";
import { buildReportHtml, reportFileName, reportDomain } from "../utils/reportPdfTemplate.js";

// The report HTML is handed to Playwright via setContent, so it has no origin to
// resolve relative URLs against — and an absolute URL would make every export wait
// on a network fetch. Inline the logo as a data URI, read once at module load.
const BRAND_LOGO_DATA_URI = (() => {
    try {
        const here = path.dirname(fileURLToPath(import.meta.url));
        const file = path.join(here, "..", "assets", "brand", "logo-horizontal-navy.png");
        return `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
    } catch (err) {
        // A missing logo must not cost the user their report — fall back to the wordmark.
        logger.warn?.(`PDF brand logo unavailable, falling back to text: ${err.message}`);
        return null;
    }
})();

// Chromium renders header/footer templates in their own document — the page's own
// stylesheet does not reach them, so every rule here has to be inline. `pageNumber`
// and `totalPages` are the two class names Chromium substitutes.
const footerTemplate = (domain, stamp) => `
  <div style="width:100%;padding:0 40px;font-family:Helvetica,Arial,sans-serif;
              font-size:8px;color:#8B949E;display:flex;justify-content:space-between;
              align-items:center;border-top:1px solid #E4E1D9;padding-top:5px;margin:0 0 4px;">
    <span>${domain} &middot; ${stamp}</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
  </div>`;

/**
 * Resolve the report this caller is allowed to export, or null.
 *
 * Same access rule as singleAuditController.canAccessReport — admins see all,
 * signed-out callers get guest runs only, signed-in users get their own plus
 * unowned guest runs (so signing in does not take the download button away from
 * the report they were just reading).
 */
const loadAccessibleReport = async (req, id) => {
    const isAdmin = !!req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');

    // A completed report may still be buffered in memory (not yet flushed to Mongo).
    const live = auditStore.get(id);
    if (live) {
        const allowed = isAdmin
            || !live.userId
            || (!!req.user && String(live.userId) === String(req.user.userId || ""));
        return allowed ? live : null;
    }

    const query = { _id: id };
    if (!req.user) {
        query.userId = null;
    } else if (!isAdmin) {
        query.$or = [{ userId: req.user.userId }, { userId: null }];
    }
    return SingleAuditReport.findOne(query);
};

/**
 * Render one report to a PDF buffer.
 *
 * Takes a global browser permit for the duration — a PDF export is a full
 * headless Chrome, and browserManager exists so those cannot outnumber the
 * machine. Both export paths (direct download and emailed copy) go through here,
 * so the file a visitor downloads and the file we mail them are the same document.
 */
const renderReportPdf = async (report) => {
    let slotId = null;
    let browser = null;
    try {
        slotId = await acquireBrowserSlot({ label: 'pdf-export' });
        browser = await chromium.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        const htmlContent = buildReportHtml(report, { logoDataUri: BRAND_LOGO_DATA_URI });

        // `load` rather than `networkidle`: the document is fully self-contained
        // (inlined logo, inlined screenshot, no remote font), so there is no network
        // to go idle — waiting for it only added the idle timer to every export.
        await page.setContent(htmlContent, { waitUntil: "load" });

        const domain = reportDomain(report.url);
        const stamp = new Date(report.createdAt || Date.now())
            .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            displayHeaderFooter: true,
            // An empty headerTemplate makes Chromium fall back to its own date/title
            // header, so it is explicitly blanked instead of omitted.
            headerTemplate: `<div style="display:none"></div>`,
            footerTemplate: footerTemplate(domain, stamp),
            margin: {
                top: "26px",
                bottom: "42px",
                left: "0px",
                right: "0px",
            },
        });

        return Buffer.from(pdfBuffer);
    } finally {
        if (browser) await browser.close().catch(() => {});
        if (slotId) await releaseBrowserSlot(slotId);
    }
};

export const generatePDFReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await loadAccessibleReport(req, id);

        if (!report) {
            return res.status(404).json({ error: "Report not found or access denied" });
        }

        if (report.status !== "completed") {
            return res.status(400).json({ error: "Audit is not completed yet" });
        }

        const pdfBuffer = await renderReportPdf(report);

        res.contentType("application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${reportFileName(report)}"`
        );

        // Activity Log for analytics (Admin Dashboard).
        //
        // Guests are logged too. This used to be gated on `req.user`, which meant
        // every guest PDF export was invisible: the download count on the dashboard
        // only ever counted logged-in users, while the export route itself is open
        // to guests reading their own report.
        logActivity(req, {
            action: 'REPORT_DOWNLOAD',
            url: report.url,
            metadata: {
                reportId: id,
                reportType: report.report,
                deviceProfile: report.device,
                score: report.score ?? null,
                delivery: 'download',
            },
        });
        touchSession(req, { reportsDownloaded: 1 });
        // Also stamp the audit's own journey row, so "did they download it?" is
        // answerable from the journey table without a second lookup.
        markReportOutcome(report._id, 'download');

        res.send(pdfBuffer);

    } catch (error) {
        logger.error("PDF generation error", error);
        res.status(500).json({ error: "Failed to generate PDF report" });
    }
};

// Deliberately permissive but structural: one @, a dot-bearing domain, no spaces.
// Real validation is the delivery attempt — an address that does not exist bounces,
// and the lead is stored with `delivered: false` either way.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Render the report and mail it, AFTER the visitor has been answered.
 *
 * Measured on a real report: building the PDF is ~0.5s, but pushing the ~600 KB
 * attachment through Gmail's SMTP took 11s once and 85s the next time — same
 * file, same code, so the variance is the mail provider's, not ours. Holding the
 * HTTP request open for that meant the visitor watched a spinner for over a
 * minute, and a dev-server restart mid-send lost the request entirely.
 *
 * So the request ends at "we're sending it" and delivery happens here. Nothing is
 * lost by that: the lead row is already written, and `delivered` / `deliveryError`
 * on it stay the record of what actually happened. A synchronous wait was never
 * buying real certainty anyway — Gmail accepts mail for a non-existent mailbox
 * and bounces it minutes later, long after any response we could have sent.
 *
 * A lead left at `delivered: false` with no `deliveryError` means this never
 * finished — the process died mid-send. That is still visible in the admin list
 * as an undelivered lead, which is the outcome that matters.
 *
 * Never throws: it runs detached, so a rejection here has no caller to catch it.
 */
const deliverReportInBackground = async (lead, report) => {
    try {
        const pdfBuffer = await renderReportPdf(report);
        await sendReportPdfEmail({
            to: lead.email,
            name: lead.name,
            url: report.url,
            reportId: String(report._id),
            score: report.score ?? null,
            grade: report.grade ?? null,
            filename: reportFileName(report),
            pdf: pdfBuffer,
        });
        await ReportLead.updateOne(
            { _id: lead._id },
            { delivered: true, deliveredAt: new Date(), deliveryError: null }
        ).catch(() => {});
    } catch (err) {
        logger.error(`[emailReport] delivery FAILED for ${lead.email} / report ${lead.reportId}`, err);
        await ReportLead.updateOne(
            { _id: lead._id },
            { delivered: false, deliveryError: String(err?.message || err).slice(0, 300) }
        ).catch(() => {});
    }
};

/**
 * POST /single-audit/:id/email-report
 *
 * The signed-out path to the report. A guest gives a name and an address, we keep
 * the lead, answer immediately, and mail the PDF from the background (see above).
 * The details are recorded BEFORE anything can fail: if the send never lands, the
 * contact is still ours and the row says so — a lead to chase by hand rather than
 * one that quietly evaporated.
 *
 * Rate-limited at the route — an endpoint that mails a file to any address a
 * stranger types is a spam relay if it is not.
 */
export const emailReportToLead = async (req, res) => {
    try {
        const { id } = req.params;
        const name = String(req.body?.name ?? "").trim();
        const email = String(req.body?.email ?? "").trim().toLowerCase();

        if (name.length < 2 || name.length > 80) {
            return res.status(400).json({ error: "Please enter your name.", code: "INVALID_NAME" });
        }
        if (!EMAIL_RE.test(email) || email.length > 254) {
            return res.status(400).json({ error: "Please enter a valid email address.", code: "INVALID_EMAIL" });
        }

        const report = await loadAccessibleReport(req, id);
        if (!report) {
            return res.status(404).json({ error: "Report not found or access denied" });
        }
        if (report.status !== "completed") {
            return res.status(400).json({ error: "Audit is not completed yet" });
        }

        const ctx = trackingContext(req);
        const lead = await ReportLead.create({
            name,
            email,
            reportId: report._id,
            url: report.url,
            domain: reportDomain(report.url),
            score: report.score ?? null,
            grade: report.grade ?? null,
            reportType: report.report ?? null,
            auditDevice: report.device ?? null,
            userId: req.user?.userId || null,
            sessionId: ctx.sessionId,
            ip: ctx.ip,
            country: ctx.country,
            region: ctx.region,
            city: ctx.city,
            visitorDevice: ctx.device,
            browser: ctx.browser,
            os: ctx.os,
            userAgent: ctx.userAgent,
            referrer: ctx.referrer,
        });

        // Same journey bookkeeping the direct download does — an emailed report is a
        // downloaded report as far as "did they take it away?" is concerned, and that
        // is true the moment they ask, not whenever SMTP gets around to it. The
        // address rides along on `guestEmail`, which is what makes an anonymous
        // session on the activity log resolvable to a person.
        logActivity(req, {
            action: 'REPORT_DOWNLOAD',
            url: report.url,
            guestEmail: email,
            metadata: {
                reportId: id,
                reportType: report.report,
                deviceProfile: report.device,
                score: report.score ?? null,
                delivery: 'email',
                leadId: String(lead._id),
                name,
            },
        });
        touchSession(req, { reportsDownloaded: 1 });
        markReportOutcome(report._id, 'download');

        // Detached on purpose — not awaited, so the response below goes out now.
        // The .catch() is belt-and-braces: deliverReportInBackground swallows its
        // own failures, and an unhandled rejection escaping a detached promise is
        // exactly the kind of thing that should not be able to reach the process.
        deliverReportInBackground(lead, report).catch(() => {});

        return res.json({
            success: true,
            message: `Sending the report to ${email}. It usually arrives within a minute — check spam if you don't see it.`,
        });

    } catch (error) {
        logger.error("Report email error", error);
        return res.status(500).json({ error: "Failed to send the report. Please try again." });
    }
};
