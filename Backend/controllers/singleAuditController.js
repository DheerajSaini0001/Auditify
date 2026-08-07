import { Worker } from "worker_threads";
import { join } from "path";
import mongoose from "mongoose";
import SingleAuditReport from "../models/singleAuditReport.js";
import AuditLog from "../models/AuditLog.js";
import Puppeteer_Cheerio from "../utils/puppeteer_cheerio.js";
import { checkWebsiteExists } from "../utils/fastFetch.js";
import { validateUrlSafety } from "../utils/ssrfGuard.js";
import auditStore from "../utils/auditStore.js";
import logger from "../utils/logger.js";
import { gateReportForViewer } from "../utils/reportGating.js";
import { sendAuditCompleteEmail, sendAuditFailedEmail } from "../utils/auditNotifier.js";
import { classifyPageType, classifyServicePageType, computePageScoreFromMap } from "../utils/sectionWeights.js";
import { detectSiteType } from "../utils/siteTypeDetector.js";
import { getLocale } from "../config/locale/index.js";
import { ACCEPTED_SITE_TYPES, normalizeSubType, keyPageCountFor } from "../config/siteTypeProfiles.js";
import { registerWorkerWithManager } from "../utils/browserManager.js";
import { acquireAuditSlot } from "../utils/auditQueue.js";
import { collectWorkerConfig } from "../utils/workerConfig.js";
import { logActivity, touchSession, sanitizeUrl } from "../utils/activityTracker.js";

const reportFieldMap = {
  "Technical Performance": "technicalPerformance",
  "On Page SEO": "onPageSEO",
  "Accessibility": "accessibility",
  "Security/Compliance": "securityOrCompliance",
  "UX & Content Structure": "UXOrContentStructure",
  "Conversion & Lead Flow": "conversionAndLeadFlow",
  "AIO (AI-Optimization) Readiness": "aioReadiness",
  "AEO (Answer Engine Optimization)": "aeo"
};

// Section field ↔ display name, used by the merge rollup (mirrors the worker's OverAll labels).
const MERGE_SECTIONS = [
  { field: "technicalPerformance", display: "Technical Performance" },
  { field: "onPageSEO", display: "On-Page SEO" },
  { field: "accessibility", display: "Accessibility" },
  { field: "securityOrCompliance", display: "Security/Compliance" },
  { field: "UXOrContentStructure", display: "UX & Content Structure" },
  { field: "conversionAndLeadFlow", display: "Conversion & Lead Flow" },
  { field: "aioReadiness", display: "AIO Readiness" },
  { field: "aeo", display: "AEO" },
];

const gradeForScore = (s) => {
  const v = Number(s) || 0;
  return v >= 90 ? "A+" : v >= 80 ? "A" : v >= 70 ? "B" : v >= 60 ? "C" : v >= 50 ? "D" : "F";
};

// Mean of the numeric values only (rounded); null when none are numbers.
const avgScores = (vals) => {
  const nums = vals.filter((v) => typeof v === "number");
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
};

// Re-derive a parameter's pass/warn/fail from its averaged score so the card's status
// can't contradict its (averaged) number. Uses the same bands as the summary heatmap
// (Strong ≥75 / Needs work 55–74 / Critical <55). Non-standard statuses (not_applicable,
// notCalculated, …) are preserved untouched.
const statusFromScore = (score, original) => {
  if (!["pass", "warning", "fail"].includes(original)) return original;
  return score >= 75 ? "pass" : score >= 55 ? "warning" : "fail";
};

// Deep-average every numeric `score` across the aligned sample nodes (recursing into
// nested sub-objects like keyboard composites), re-deriving `status` from the average.
// Every other field (details, qanda, meta, analysis) is kept from `base` (a representative
// sample) — those carry per-sample evidence/text that can't be meaningfully averaged.
const mergeScores = (base, siblings) => {
  if (!base || typeof base !== "object" || Array.isArray(base)) return base;
  const out = { ...base };
  if (typeof base.score === "number") {
    const avg = avgScores(siblings.map((s) => (s && typeof s.score === "number" ? s.score : null)));
    if (avg !== null) {
      out.score = avg;
      if (typeof base.status === "string") out.status = statusFromScore(avg, base.status);
    }
  }
  for (const key of Object.keys(base)) {
    if (key === "score" || key === "status") continue;
    const child = base[key];
    if (child && typeof child === "object" && !Array.isArray(child)) {
      out[key] = mergeScores(child, siblings.map((s) => (s ? s[key] : undefined)));
    }
  }
  return out;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Write the mail's outcome onto the report — in BOTH places the report can live.
 *
 * A completed report is buffered in memory and flushed to Mongo in batches, so an
 * SMTP round-trip (seconds, with retries) routinely straddles that flush: the doc
 * can be in memory when the send starts and only in Mongo when it finishes. Writing
 * to whichever one holds it is not knowable in advance, so both are written — the
 * one that doesn't hold it simply matches nothing.
 *
 * `notifiedAt` means DELIVERED, nothing weaker. `notifyError` is the only surviving
 * trace of a mail that didn't go, and is what makes "the audit finished but nothing
 * arrived" answerable afterwards instead of a guess.
 */
const recordNotifyOutcome = (reportId, result) => {
  const fields = result?.ok
    ? { notifiedAt: new Date(), notifyError: null }
    : { notifiedAt: null, notifyError: String(result?.error || 'Unknown mail error').slice(0, 500) };

  // Guarded: applyPatch warns about a missing audit, and "already flushed" is the
  // expected case here, not a problem worth a line in the log.
  if (auditStore.get(reportId)) auditStore.applyPatch(reportId, fields);

  SingleAuditReport.updateOne({ _id: reportId }, { $set: fields }).catch((err) =>
    logger.error(`[Audit] could not record mail outcome for ${reportId}`, err)
  );
};

/**
 * Build the "we'll email you when it's done" notifier for ONE run.
 *
 * Only runs that actually asked for a mail have an address, and each of these is
 * once-only — several terminal paths can fire for the same run (a worker that
 * errors after its own done, the exit backstop below) and none of them may send a
 * second copy. Never awaited by the audit pipeline and never allowed to throw: the
 * report is already saved by the time this runs, so a broken SMTP config must not
 * take the run down.
 *
 * The address is captured HERE, at request time, rather than read off the report
 * every time. The live doc is still preferred — a request that dedupes onto this
 * run can attach its address to it mid-flight — but `auditStore.complete()`
 * returns NULL for a report that is no longer in memory (flushed, or swept after
 * the in-memory TTL), and the old version read the address straight off that null
 * and returned silently. The promise we made to the visitor then just evaporated,
 * with nothing in the log to say so.
 */
const makeAuditNotifier = ({ fallbackEmail, url, reportId }) => {
  let sent = false;
  return (doc, { failed = false } = {}) => {
    if (sent) return;
    if (doc?.notifiedAt) return; // already mailed on another path

    const to = doc?.notifyEmail || fallbackEmail;
    if (!to) return;

    // Taken synchronously, before anything is awaited: this is what stops two
    // terminal paths racing into two copies of the same mail. It is NOT a claim
    // that the mail was delivered — that is `notifiedAt`, written only once the
    // send comes back successful.
    sent = true;

    // A run with no live report has nothing for the visitor to open. `complete()`
    // returns null exactly when the doc was wiped or evicted — a force re-run of
    // the same target, or the in-memory TTL — and such a doc is never queued for
    // persistence either, so it is in neither memory nor Mongo. Measured: mailing
    // "your report is ready" here links them to a 404, which is worse than the
    // silence this replaced. They get the "we couldn't finish it" mail instead.
    const lost = !doc;
    if (lost) {
      logger.warn(`[Audit] ${reportId} reached a terminal state with no live report in the store — mailing it as failed`);
    }

    const payload = { to, url: doc?.url || url, reportId: doc?._id || reportId };
    const send = (failed || lost)
      ? sendAuditFailedEmail(payload)
      : sendAuditCompleteEmail({ ...payload, score: doc.score });

    send
      .then((result) => recordNotifyOutcome(payload.reportId, result))
      .catch((err) => {
        logger.error(`[Audit] completion mail threw for ${payload.reportId}`, err);
        recordNotifyOutcome(payload.reportId, { ok: false, error: err?.message || String(err) });
      });
  };
};

/* ===========================
   ⏱️ How long will this take?
   ===========================
   The visitor is asked to walk away from a multi-page run, so "some time" is not
   good enough — they need a number. These are wall-clock costs measured on the
   production box (App Service B2, MAX_CONCURRENT_AUDITS=1): one page is dominated
   by its two PageSpeed calls, and each extra key page adds a full Stage-2 pass.

   This is only the opening estimate. Once a run reports real progress the status
   endpoint extrapolates from elapsed time instead, so a slow site corrects itself
   rather than sitting on a promise it cannot keep. */
const AUDIT_BASE_SECONDS = 90;      // single page, all 8 pillars
const AUDIT_PER_PAGE_SECONDS = 45;  // each additional key page in Stage 2

const estimateAuditSeconds = (pageCount) =>
  AUDIT_BASE_SECONDS + AUDIT_PER_PAGE_SECONDS * Math.max(0, (pageCount || 1) - 1);

export const startAudit = async (req, res) => {

  try {
    let { url, device, report, force, pageType, siteType, siteSubType, pageScopes, notifyEmail, country } = req.body;

    // Where to mail the finished report. A multi-page run takes minutes, so the
    // client collects an address up front and tells the visitor to walk away —
    // that promise is only kept if the address survives to the report doc.
    const sanitizeEmail = (value) =>
      typeof value === 'string' && EMAIL_RE.test(value.trim()) ? value.trim().toLowerCase() : null;

    // A SIGNED-IN run always has somewhere to send the report, whether or not the
    // surface that started it remembered to ask for an address. Leaving this to
    // the client meant "you get a mail" depended on which button was pressed: the
    // dashboard attaches the account address on every path, but the landing-page
    // form only attaches one for a full-site run, so a signed-in single-page run
    // from there silently promised nothing. The address is read off the token
    // (every login signs { userId, email, role }), so this costs no DB read.
    // A body address still wins — that is the visitor naming a different inbox.
    const cleanNotifyEmail = sanitizeEmail(notifyEmail) || sanitizeEmail(req.user?.email);

    // Market the visitor selected. ISO 3166-1 alpha-2 (or the literal "OTHER"),
    // so anything else is a client that has drifted from the catalog — drop it
    // rather than storing free text on every report.
    const cleanCountry = typeof country === 'string' && /^[A-Z]{2}$|^OTHER$/.test(country.trim().toUpperCase())
      ? country.trim().toUpperCase()
      : null;

    // The market whose norms this run will actually be scored against. Resolved
    // HERE rather than in the worker because it is part of the audit's identity:
    // the same URL graded for the US and for Australia compares against different
    // reference lists and produces a different score, so the dedupe below has to
    // be able to tell the two runs apart before either of them starts. Without
    // this, asking for AU after US silently returns the US report.
    //
    // getLocale() folds every unsupported value ("OTHER", "GB", null) onto the US
    // reference pack, so runs that would produce identical output still share.
    const resolvedMarket = getLocale(cleanCountry).code;

    // Page types the user kept ticked in the home-page picker. Stage 2 only audits
    // these; ["home"] alone means "just the URL I entered". Unknown keys are dropped
    // so a stale or hand-rolled client can't widen the crawl.
    const VALID_PAGE_SCOPES = new Set([
      "home", "srp", "vdp", "trade", "lease", "finance", "service", "specials",
      "about", "content", "models", "locator", "press",
      // Service/repair taxonomy (pageClassifier.classifyServicePageType)
      "booking", "pricing", "locations",
    ]);
    const normalizedScopes = Array.isArray(pageScopes)
      ? [...new Set(pageScopes.filter((k) => VALID_PAGE_SCOPES.has(k)))]
      : null;

    if (!url || !device || !report) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    url = url.trim().toLowerCase().replace(/\/$/, "");
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    // SSRF guard: resolves the host and rejects private/reserved/metadata targets.
    const safety = await validateUrlSafety(url);
    if (!safety.ok) {
      return res.status(400).json({ error: `Invalid or Restricted URL — ${safety.reason}` });
    }

    // EXISTENCE CHECK — hit the URL up front. If the domain doesn't resolve or
    // the host refuses the connection, there's no website to audit: reject now,
    // BEFORE creating any report or spawning a worker. (Timeouts / blocks / TLS
    // errors are treated as "exists" so a slow or protected real site still runs.)
    const existence = await checkWebsiteExists(url);
    if (!existence.exists) {
      logger.info(`🌐 Rejected audit — website does not exist: ${url} (${existence.errorCode})`);
      // A rejection is a failed attempt from the visitor's point of view. Logging
      // it is what lets the dashboard explain the gap between "clicked Site Audit"
      // and "audit started" instead of just showing a drop.
      logActivity(req, {
        action: 'AUDIT_FAILED',
        status: 'FAILURE',
        url,
        errorMessage: `Website not found — ${existence.reason}`,
        metadata: { stage: 'existence_check', errorCode: existence.errorCode },
      });
      return res.status(400).json({ error: `Website not found — ${existence.reason}` });
    }

    // Declared before the force block: a force re-run that collides with a RUNNING
    // audit resolves to that audit instead of deleting it (see below).
    let existing = null;

    if (force) {
      // A force re-run must never delete an audit that is still in flight. It used
      // to: removeMatching() dropped the live report while its worker was mid-run,
      // and since an in-progress report lives ONLY in memory, the worker's remaining
      // patches — and its final complete() — were silently discarded. The report
      // never went terminal, /single-audit/:id/status 404'd from then on, and the
      // first visitor's page span forever on a half-filled report. For guests the
      // blast radius crossed visitors, because every guest's userId is null.
      //
      // Reusing the running audit is also what the caller actually wants: a run that
      // started seconds ago IS the fresh report a force re-run was asking for.
      const inFlight = auditStore.findInFlight({
        url, device, report, userId: req.user?.userId || null, market: resolvedMarket,
      });

      if (inFlight) {
        logger.info(`♻️ Force run for ${url} collided with an audit already running (${inFlight._id}) — reusing it instead of deleting it.`);
        existing = inFlight;
      } else {
        logger.info(`🗑️ Force run: Deleting existing single audit report for: ${url}`);
        await SingleAuditReport.deleteMany({
          url,
          device,
          report,
          userId: req.user?.userId || null,
          // Scoped to this market so a force re-run of the AU report does not also
          // delete the visitor's US report for the same URL.
          market: resolvedMarket,
        });
        // Also drop any in-memory copy that hasn't been flushed yet. Terminal
        // entries only — removeMatching now refuses to touch a running one.
        auditStore.removeMatching({ url, device, report, userId: req.user?.userId || null, market: resolvedMarket });
      }
    }

    // Strict Deduplication: Check if a successful audit already exists or a very recent in-progress one.
    // Check the in-memory store FIRST (reports may not be flushed to Mongo yet), then Mongo.
    if (!force) {
      existing = auditStore.findActiveDuplicate({ url, device, report, userId: req.user?.userId || null, market: resolvedMarket });
      if (!existing) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        existing = await SingleAuditReport.findOne({
          url,
          device,
          report,
          userId: req.user?.userId || null,
          // Same reasoning as the in-memory lookup: a report scored for another
          // market is not a duplicate of this one. Reports written before market
          // existed have no field at all and so never match a real market code —
          // they are re-audited rather than served under a jurisdiction they were
          // never graded against.
          market: resolvedMarket,
          $or: [
            { status: "completed" },
            { status: "inprogress", createdAt: { $gt: fiveMinutesAgo } }
          ]
        }).sort({ createdAt: -1 });
      }
    }

    if (existing) {
      logger.info(`♻️ Safeguard: Reusing existing Audit (${existing.status}) for: ${url}`);

      // Riding on someone else's in-flight run still earns the mail we promised.
      // Without this, asking for a long audit that happens to dedupe onto a run
      // started without an address means waiting for an email that never comes.
      // Only fills a blank — never redirects a mail already promised elsewhere.
      if (cleanNotifyEmail && existing.status !== "completed" && !existing.notifyEmail) {
        if (auditStore.get(existing._id)) {
          // Live run: the completion handler reads the address off this object.
          auditStore.applyPatch(existing._id, { notifyEmail: cleanNotifyEmail });
        } else {
          await SingleAuditReport.updateOne(
            { _id: existing._id, notifyEmail: null },
            { $set: { notifyEmail: cleanNotifyEmail } }
          );
        }
        existing.notifyEmail = cleanNotifyEmail;
      }

      // Save an AuditLog so it appears in User's history even though it was cached
      const auditLog = new AuditLog({
        userId: req.user?.userId || null,
        guestEmail: req.user ? null : (cleanNotifyEmail || req.guestEmail || null),
        sessionId: req.tracking?.sessionId || 'N/A',
        ip: req.tracking?.ip || '0.0.0.0',
        country: req.tracking?.country,
        city: req.tracking?.city,
        device: existing.device || device || 'Desktop',
        browser: req.tracking?.browser,
        os: req.tracking?.os,
        userAgent: req.headers['user-agent'] || null,
        screenResolution: req.body.screenResolution || req.tracking?.screenResolution,
        url: url,
        siteType: existing.siteType || null,
        siteSubType: existing.siteSubType || null,
        pageType: pageType || existing.pageType || null,
        reportId: existing._id,
        reportType: report,
        referrer: sanitizeUrl(req.tracking?.referrer) || 'direct',
        entryPage: sanitizeUrl(req.tracking?.entryPage) || '/',
        actions: ["visited", "audit_run_cached"],
        captchaPassed: true,
        status: existing.status === "completed" ? "success" : existing.status === "failed" ? "failed" : "pending",
        score: existing.score,
        grade: existing.grade,
        // A cache hit takes no measurable time — recording it as instantly
        // complete keeps it out of the "average completion time" average, which
        // is meant to describe how long a real audit takes.
        startedAt: new Date(),
        completedAt: existing.status === "completed" ? new Date() : null,
        auditDuration: existing.status === "completed" ? 0 : null,
      });

      // Tracked for guests too — most audits on this platform are run signed
      // out, and a log that only sees logged-in runs misses most of the traffic.
      logActivity(req, {
        action: 'AUDIT_RUN_CACHED',
        url,
        guestEmail: req.user ? null : (cleanNotifyEmail || req.guestEmail || null),
        metadata: { device, report, reportId: String(existing._id), cached: true },
      });
      touchSession(req, { auditsStarted: 1 });

      auditLog.save().catch(err => logger.error("Error saving cached AuditLog", err));

      return res.status(200).json(gateReportForViewer(existing, !!req.user));
    }

    // ⭐ ENHANCEMENT: Extract one OR MORE sections from an existing "Full Audit".
    // `report` is a single section name or a comma-joined subset chosen via the
    // report-scope checklist; if a completed full audit already holds every
    // requested section, we clone those fields out instead of re-running a worker.
    if (report !== "All") {
      const sections = String(report).split(",").map((s) => s.trim()).filter(Boolean);

      // Prefer an in-memory completed full audit; fall back to Mongo. Scoped to
      // this market like every other reuse lookup — the sections are cloned as-is,
      // so a full audit scored against another market's reference lists is not a
      // source this request can honestly copy from.
      let fullAudit = auditStore.findCompletedFullAudit({ url, device, userId: req.user?.userId || null, market: resolvedMarket });
      if (!fullAudit) {
        fullAudit = await SingleAuditReport.findOne({
          url,
          device,
          report: "All",
          userId: req.user?.userId || null,
          market: resolvedMarket,
          status: "completed"
        }).sort({ createdAt: -1 });
      }

      if (fullAudit) {
        const fields = sections.map((s) => reportFieldMap[s]);
        // Only reuse when EVERY requested section is present in the full audit.
        const allPresent = fields.length > 0 && fields.every((f) => f && fullAudit[f]);
        if (allPresent) {
          logger.info(`✨ Section Reuse: Extracting [${sections.join(", ")}] from existing Full Audit for: ${url}`);

          const newSectionReport = new SingleAuditReport({
            url: fullAudit.url,
            device: fullAudit.device,
            report: report,
            status: "completed",
            screenshot: fullAudit.screenshot,
            timeTaken: "0s (cached)",
            isBotProtected: fullAudit.isBotProtected,
            siteType: fullAudit.siteType || null,
            siteSubType: fullAudit.siteSubType || null,
            userId: req.user?.userId || null,
            // Part of the unique index key AND of the dedupe filter above, so a
            // derived report that omitted it could never be found again — the
            // next identical request re-derived it and collided with itself.
            country: cleanCountry,
            market: resolvedMarket,
            marketResolution: fullAudit.marketResolution ?? null,
          });

          const pctBySection = {};
          for (const section of sections) {
            const fieldName = reportFieldMap[section];
            newSectionReport[fieldName] = fullAudit[fieldName];
            pctBySection[section] = fullAudit[fieldName]?.Percentage || 0;

            // Include each section's sub-dependencies.
            if (section === "On Page SEO") newSectionReport.siteSchema = fullAudit.siteSchema;
            if (section === "AIO (AI-Optimization) Readiness") {
              newSectionReport.aioCompatibilityBadge = fullAudit.aioCompatibilityBadge;
            }
          }

          // Weighted by the page-type tilt over the extracted sections (spec §5.4),
          // matching what a fresh subset audit of this URL would produce. Reuse
          // whichever siteType/siteSubType the original full audit was classified
          // as — a reused section must be weighted the same way the fresh run
          // that produced it was, or the same numbers yield a different score.
          const classify =
            fullAudit.siteType === "service" ? classifyServicePageType
              : classifyPageType;
          const sectionScore = computePageScoreFromMap(pctBySection, classify(url), fullAudit.siteSubType || null);
          const sectionGrade = sectionScore >= 90 ? "A+" : sectionScore >= 80 ? "A" : sectionScore >= 70 ? "B" : sectionScore >= 60 ? "C" : sectionScore >= 50 ? "D" : "F";
          newSectionReport.score = sectionScore;
          newSectionReport.grade = sectionGrade;

          await newSectionReport.save();

          // Log the cached audit run
          const auditLog = new AuditLog({
            userId: req.user?.userId || null,
            guestEmail: req.guestEmail || null,
            sessionId: req.tracking?.sessionId || 'N/A',
            ip: req.tracking?.ip || '0.0.0.0',
            country: req.tracking?.country || 'unknown',
            region: req.tracking?.region || 'unknown',
            city: req.tracking?.city || 'unknown',
            device: device || 'Desktop',
            browser: req.tracking?.browser || 'unknown',
            os: req.tracking?.os || 'unknown',
            userAgent: req.headers['user-agent'] || null,
            url: url,
            siteType: fullAudit.siteType || null,
            siteSubType: fullAudit.siteSubType || null,
            pageType: pageType || null,
            reportId: newSectionReport._id,
            reportType: report,
            status: "success",
            score: sectionScore,
            grade: sectionGrade,
            actions: ["visited", "audit_section_extracted"],
            startedAt: new Date(),
            completedAt: new Date(),
            auditDuration: 0, // reused from an existing full audit, nothing was run
          });
          auditLog.save().catch(err => logger.error("Error saving extracted AuditLog", err));

          logActivity(req, {
            action: 'AUDIT_RUN_CACHED',
            url,
            metadata: { device, report, reportId: String(newSectionReport._id), sectionReuse: true },
          });
          touchSession(req, { auditsStarted: 1 });

          return res.status(200).json(gateReportForViewer(newSectionReport, !!req.user));
        }
      }
    }

    // Double-check race condition (buffer for parallel requests). Check the
    // in-memory store first (the in-progress report isn't in Mongo yet), then Mongo.
    await new Promise(resolve => setTimeout(resolve, 200));
    const raceDup = auditStore.findActiveDuplicate({ url, device, report, userId: req.user?.userId || null });
    if (raceDup) return res.status(200).json(gateReportForViewer(raceDup, !!req.user));
    const raceCheck = await SingleAuditReport.findOne({ url, device, report, status: "inprogress", userId: req.user?.userId || null });
    if (raceCheck) return res.status(200).json(gateReportForViewer(raceCheck, !!req.user));

    // The frontend already ran /single-audit/discover for this URL and knows the
    // siteType from that single homepage fetch — trust it when supplied so we
    // never re-fetch. Only direct API callers (or the merge/reuse paths) land
    // here without one; fall back to detecting it ourselves.
    //
    // Product decision: DealerSiteAudit  audits dealership, automotive service/repair
    // and automotive corporate/OEM sites — "unknown" (including inconclusive)
    // is REJECTED, not failed open. /single-audit/discover already enforces
    // this same gate before a user ever reaches this endpoint through the
    // normal UI flow; this is the defense-in-depth check for direct API callers
    // and a stale or tampered client-supplied siteType.
    //
    // siteSubType is what the scoring pipeline actually keys off (parameter
    // applicability + the section tilt, see config/siteTypeProfiles.js), so it
    // must survive the client round-trip alongside siteType — but only as a
    // value CONSISTENT with the siteType the client also sent. A tampered
    // "dealer"+"repair" pair would otherwise renormalise the 12 inventory
    // parameters out of a real dealer's score.
    let normalizedSiteType = ACCEPTED_SITE_TYPES.has(siteType) ? siteType : null;
    let normalizedSubType = normalizedSiteType ? normalizeSubType(normalizedSiteType, siteSubType) : null;
    if (!normalizedSiteType) {
      const detection = await detectSiteType(url);
      if (!ACCEPTED_SITE_TYPES.has(detection.siteType)) {
        logger.info(`🚫 Rejected audit — not an automotive dealer, service or corporate site: ${url} (${detection.reason})`);
        logActivity(req, {
          action: 'AUDIT_FAILED',
          status: 'FAILURE',
          url,
          errorMessage: `Not an automotive site — ${detection.reason}`,
          metadata: { stage: 'site_type_gate', detectedType: detection.siteType || 'unknown' },
        });
        return res.status(400).json({
          error: "This doesn't look like a dealership, automotive service/repair or automotive corporate/OEM website. DealerSiteAudit only audits automotive sites.",
        });
      }
      normalizedSiteType = detection.siteType;
      normalizedSubType = normalizeSubType(detection.siteType, detection.siteSubType);
      // detection.resolvedUrl may differ from what was submitted — e.g. a bare
      // apex domain that fails outright (TLS/DNS-level) while "www." works.
      // Classification already succeeded against the working hostname; the
      // worker that's about to launch a real browser against `url` needs that
      // same hostname or it repeats the identical failure.
      if (detection.resolvedUrl && detection.resolvedUrl !== url) {
        logger.info(`${url} didn't resolve directly — auditing ${detection.resolvedUrl} instead`);
        url = detection.resolvedUrl;
      }
    }

    logger.info(`➡️ Starting NEW Audit Request → ${url} | ${device} | ${report} | ${normalizedSiteType}/${normalizedSubType}`);

    // No DB write here. The report lives in memory until the worker finishes; the
    // main thread then batches it to Mongo. We generate the id up front so the
    // client can poll immediately and AuditLog can reference it.
    // `normalizedScopes` null means "no restriction" — every key page the crawler
    // finds, which is the widest (slowest) run there is. Its size is the key-page
    // count for THIS site type, not the size of VALID_PAGE_SCOPES: that set is the
    // union of all three taxonomies (dealer + corporate + service), so using it
    // promised a garage a 16-page crawl of a 7-category site.
    const plannedPages = normalizedScopes ? normalizedScopes.length : keyPageCountFor(normalizedSubType);

    const newReport = auditStore.createInProgress({
      _id: new mongoose.Types.ObjectId(),
      url,
      device,
      report,
      userId: req.user?.userId || null,
      pageType: pageType || null,
      siteType: normalizedSiteType,
      siteSubType: normalizedSubType,
      notifyEmail: cleanNotifyEmail,
      country: cleanCountry,
      market: resolvedMarket,
      plannedPages,
      estimatedSeconds: estimateAuditSeconds(plannedPages),
    });

    // One notifier for this run — every terminal path below goes through it, so
    // "once only" holds across all of them even when the report itself is gone.
    const notifyAuditFinished = makeAuditNotifier({
      fallbackEmail: cleanNotifyEmail,
      url,
      reportId: newReport._id,
    });

    // Create a pending AuditLog entry asynchronously
    const auditLog = new AuditLog({
      userId: req.user?.userId || null,
      // For a signed-out run the notify address is the only identity we have, so
      // it is what attributes this row in the admin log.
      guestEmail: req.user ? null : (cleanNotifyEmail || req.guestEmail || null),
      sessionId: req.tracking?.sessionId || 'N/A',
      ip: req.tracking?.ip || '0.0.0.0',
      country: req.tracking?.country || 'unknown',
      city: req.tracking?.city || 'unknown',
      device: device || 'Desktop',
      browser: req.tracking?.browser || 'unknown',
      os: req.tracking?.os || 'unknown',
      userAgent: req.headers['user-agent'] || null,
      screenResolution: req.body.screenResolution || req.tracking?.screenResolution || 'unknown',
      url: url,
      // The detected website category — resolved above, before the worker spawns,
      // so the journey row can name it even for a run that fails immediately.
      siteType: normalizedSiteType,
      siteSubType: normalizedSubType,
      pageType: pageType || null,
      reportId: newReport._id,
      reportType: report,
      // Sanitized: these are stored on the journey row and leave the system in
      // the admin CSV export, and an OAuth callback entry page carries a live code.
      referrer: sanitizeUrl(req.tracking?.referrer) || 'direct',
      entryPage: sanitizeUrl(req.tracking?.entryPage) || '/',
      actions: ["visited", "audit_run"],
      captchaPassed: true,
      status: "pending",
      startedAt: new Date(),
    });

    // Tracked for guests as well as signed-in users — this is the "audit started"
    // number the dashboard funnel counts, and most runs here are signed out.
    logActivity(req, {
      action: 'AUDIT_RUN',
      url,
      guestEmail: req.user ? null : (cleanNotifyEmail || req.guestEmail || null),
      metadata: {
        device, report, reportId: String(newReport._id),
        siteType: normalizedSiteType, siteSubType: normalizedSubType,
      },
    });
    touchSession(req, { auditsStarted: 1 });

    // Kept as a promise rather than fired and forgotten: every lifecycle update
    // below targets this row by reportId, and they run within milliseconds of
    // here. Without something to await, the queued/running updates raced the
    // INSERT, matched nothing, and the row sat at "pending" for the whole run —
    // losing the running state and queueWaitMs entirely. Still not awaited before
    // the response, so the client is not made to wait on a log write.
    const auditLogSaved = auditLog
      .save()
      .catch(err => logger.error("Error saving AuditLog", err));

    const startTime = Date.now();
    // The tracking context is captured now because the worker callbacks below fire
    // long after this request's lifecycle — `req` is still in scope, but reading it
    // there would be reading a request object that Express has already responded to.
    const journeyReq = { tracking: req.tracking, user: req.user, headers: req.headers };

    res.status(201).json({
      message: "Audit started successfully",
      _id: newReport._id,
      url,
      device,
      report,
      status: "inprogress",
    });

    // ── Admission control ────────────────────────────────────────────────────
    // The client already has its report id (responded above) and is polling. Hold
    // the WORKER until an audit slot frees: concurrent audits each want the whole
    // browser pool, and over-admitting them doesn't just slow the run, it makes
    // pillars time out and score on partial data (see utils/auditQueue.js). While
    // queued the report says so, instead of showing fake browser-launch progress.
    const queuedAt = Date.now();
    // Flips on the first position callback. The queue re-fires onPosition every
    // time the line moves, and writing on each shuffle would be one update per
    // position per waiting audit — but gating on `position === 1` instead would
    // never fire at all: acquireAuditSlot shifts the granted audit OFF the queue
    // before renumbering, so an audit that waits goes straight from position N to
    // running and is never told it reached the front.
    let markedQueued = false;
    const releaseAuditSlot = await acquireAuditSlot({
      label: url,
      onPosition: (position) => {
        auditStore.applyPatch(newReport._id, { status: "queued", queuePosition: position });
        if (markedQueued) return;
        markedQueued = true;
        // Chained off the insert so the update cannot outrun the row it targets.
        auditLogSaved
          .then(() => AuditLog.updateMany(
            { reportId: newReport._id, status: "pending" },
            { $set: { status: "queued" } }
          ))
          .catch((err) => logger.error("Error marking AuditLog queued", err));
      },
    });

    const workerPath = join(process.cwd(), "workers", "singleAuditWorker.js");

    let worker;
    try {
      worker = new Worker(workerPath, {
        workerData: {
          url,
          device,
          report,
          auditId: newReport._id.toString(),
          pageType: newReport.pageType || null,
          siteType: newReport.siteType || null,
          siteSubType: newReport.siteSubType || null,
          pageScopes: normalizedScopes,
          // The market whose norms this run is scored against. Stored on the
          // report as `country` (that is the visitor-facing field name), but the
          // engine calls it `market` throughout because it selects a locale pack
          // rather than describing where the visitor sat. "OTHER" and anything
          // the locale registry does not know resolve to the US reference pack
          // inside utils/marketResolver.js, so no validation is needed here.
          market: newReport.market || resolvedMarket,
          // Platform config resolved on THIS thread. The worker's own
          // configService cache is always empty (see utils/workerConfig.js), and
          // in the container there is no .env to fall back to — without this,
          // every key set through the admin UI is invisible to the audit and
          // Technical Performance silently scores "Not Run".
          config: collectWorkerConfig(),
        },
      });
    } catch (spawnErr) {
      // Never strand the slot: without this the queue would leak a permit per
      // failed spawn and eventually admit nothing at all.
      releaseAuditSlot();
      logger.error(`❌ Failed to spawn audit worker for ${url}`, spawnErr);
      notifyAuditFinished(
        auditStore.complete(newReport._id, { status: "failed", error: spawnErr.message }),
        { failed: true }
      );
      // A run that never got a worker is still a failed run to the visitor who
      // asked for it — leaving the row `pending` forever would hide it from both
      // the failure count and its reason breakdown.
      AuditLog.updateMany(
        { reportId: newReport._id, status: { $in: ["pending", "queued", "running"] } },
        {
          $set: {
            status: "failed",
            failureReason: `Worker could not start: ${spawnErr.message}`,
            completedAt: new Date(),
            auditDuration: Date.now() - startTime,
          },
          $push: { actions: "failed" },
        }
      ).catch((err) => logger.error("Error marking AuditLog spawn failure", err));
      logActivity(journeyReq, {
        action: 'AUDIT_FAILED',
        status: 'FAILURE',
        url,
        errorMessage: `Worker could not start: ${spawnErr.message}`,
        metadata: { reportId: String(newReport._id) },
      });
      return;
    }

    // The audit is leaving the queue — clear the waiting marker so the status
    // endpoint stops reporting a queue position for a run that has started.
    auditStore.applyPatch(newReport._id, { status: "inprogress", queuePosition: 0 });

    // Queue wait is recorded SEPARATELY from the audit duration below. Rolling the
    // two together is what makes an "average audit takes 4 minutes" number that is
    // really "the server was busy" — the admin dashboard needs to tell those apart.
    const queueWaitMs = Date.now() - queuedAt;
    // Awaited on the insert (see auditLogSaved) — a slot that was free resolves
    // acquireAuditSlot synchronously, so this fires microseconds after the row is
    // created and would otherwise lose the race with its own INSERT.
    auditLogSaved
      .then(() => AuditLog.updateMany(
        { reportId: newReport._id, status: { $in: ["pending", "queued"] } },
        { $set: { status: "running", queueWaitMs, startedAt: new Date() } }
      ))
      .catch((err) => logger.error("Error marking AuditLog running", err));

    // Release when the audit's WORK is done (the terminal done/error message),
    // not when the thread exits: measured, a finished worker can sit for minutes
    // before 'exit' fires because pending handles keep its event loop alive, and
    // holding the slot that long would stall the queue behind an audit that has
    // already delivered its report. 'exit' and 'error' stay wired as backstops
    // for a crash that never sends a terminal message — release() is idempotent,
    // so whichever fires first wins and the rest are no-ops.
    worker.on("exit", async (code) => {
      releaseAuditSlot();

      // Backstop for a worker that dies WITHOUT sending done/error and without
      // raising 'error' — an OOM kill, an explicit terminate, a thread that just
      // goes away. Releasing the queue slot (all this used to do) unblocks the
      // queue but leaves the REPORT non-terminal, and a non-terminal report lives
      // only in memory: the client then polls /status forever and gets 404s on a
      // report that will never finish. The comment above claimed 'exit' was a
      // backstop for exactly this — it backstopped the queue, not the report.
      const liveDoc = auditStore.get(newReport._id);
      if (!liveDoc || liveDoc.status === "completed" || liveDoc.status === "failed") return;

      const reason = `Audit worker exited (code ${code}) before reporting a result`;
      logger.error(`❌ ${reason} — marking ${newReport._id} failed`);
      notifyAuditFinished(
        auditStore.complete(newReport._id, { status: "failed", error: reason }),
        { failed: true }
      );
      await markAuditLog({
        $set: {
          status: "failed",
          failureReason: reason,
          completedAt: new Date(),
          auditDuration: Date.now() - startTime,
        },
        $push: { actions: "failed" },
      });
    });

    registerWorkerWithManager(worker);

    // The worker is DB-free: it streams progress and the final result here. The
    // main thread owns the in-memory store and batches the final write to Mongo.
    // Close out the journey row. The filter matches every NON-terminal status, not
    // just "pending": the row now moves pending → queued → running on its way here,
    // and a filter pinned to "pending" would silently stop closing rows the moment
    // the queue promoted them — leaving finished audits stuck as in-flight forever.
    const markAuditLog = async (fields) => {
      try {
        await auditLogSaved;
        await AuditLog.updateMany(
          { reportId: newReport._id, status: { $in: ["pending", "queued", "running"] } },
          fields
        );
      } catch (err) {
        logger.error("Error updating AuditLog", err);
      }
    };

    // Insert or update ONE row in the parent report's crawledPagesSummary (keyed by
    // reportId, falling back to url). Drives the summary page's per-page rows.
    const upsertCrawledPage = (parentId, entry) => {
      const parent = auditStore.get(parentId);
      if (!parent) return;
      const list = Array.isArray(parent.crawledPagesSummary) ? [...parent.crawledPagesSummary] : [];
      const idx = list.findIndex(
        (p) => (entry.reportId && p.reportId === entry.reportId) || (entry.url && p.url === entry.url)
      );
      if (idx >= 0) list[idx] = { ...list[idx], ...entry };
      else list.push(entry);
      auditStore.applyPatch(parentId, { crawledPagesSummary: list, crawledPagesCount: list.length });
    };

    worker.on("message", async (msg) => {
      if (!msg || !msg.type) return;

      // ── Multi-page fan-out ──
      // Each key page is audited in its OWN browser and becomes its OWN child
      // report. The worker streams these three messages; the main thread owns
      // creating/patching the child reports and the parent's per-page summary rows
      // (so each child is independently openable and the summary can roll them up).
      if (msg.type === "childInit") {
        const c = msg.child || {};
        if (!c.childId || !c.url) return;
        const childDevice = c.device || device;
        // Clear any stale, NON-failed report for this exact {url,device,report} so
        // the partial-unique index can't reject the child (and a forced re-audit
        // refreshes the page). Memory is sync; the old Mongo doc (if any, e.g. from
        // a prior forced run) is cleared best-effort, never touching the new child.
        // `market` rides down from the parent: a key page is scored against the
        // same jurisdiction as the run it belongs to, and the unique index is
        // keyed on it — a child left at null indexes under a market it was never
        // scored for, and the two cleanups below stop matching it.
        const childMarket = newReport.market || null;
        auditStore.removeMatching({ url: c.url, device: childDevice, report: "All", userId: newReport.userId || null, market: childMarket });
        auditStore.createInProgress({
          _id: new mongoose.Types.ObjectId(c.childId),
          url: c.url,
          device: childDevice,
          report: "All",
          userId: newReport.userId || null,
          pageType: c.pageType || null,
          siteType: newReport.siteType || null,
          siteSubType: newReport.siteSubType || null,
          market: childMarket,
          // Back-pointer to the run this key page belongs to. The parent lists its
          // children in crawledPagesSummary; this is the edge in the other direction,
          // and it is how a child report opened on its own (an admin from Journeys, a
          // shared link) can still reach the run's audit summary.
          parentReportId: newReport._id,
        });
        upsertCrawledPage(newReport._id, {
          url: c.url, pageType: c.pageType || "generic", label: c.label || "Key Page",
          reportId: c.childId, isProcessing: true, success: false, status: 200, title: c.label || "Auditing…",
        });
        // Mirrors the unique index key exactly ({url, device, report, market,
        // userId}) — a cleanup narrower than the index leaves an occupant the
        // child's insert will then collide with, and one wider deletes a report
        // that was never in this child's way.
        SingleAuditReport.deleteMany({
          _id: { $ne: new mongoose.Types.ObjectId(c.childId) },
          url: c.url, device: childDevice, report: "All", market: childMarket,
          userId: newReport.userId || null, status: { $ne: "failed" },
        }).catch(() => { /* best-effort; the batch flush now resolves any leftover collision */ });
        return;
      }

      if (msg.type === "childProgress") {
        if (msg.childId) auditStore.applyPatch(msg.childId, msg.patch || {});
        return;
      }

      if (msg.type === "childDone") {
        if (!msg.childId) return;
        auditStore.complete(msg.childId, msg.patch || {});
        const s = msg.summary || {};
        upsertCrawledPage(newReport._id, {
          url: s.url, pageType: s.pageType || "generic", label: s.label || "Key Page",
          reportId: msg.childId, score: s.score ?? null, grade: s.grade ?? null,
          isProcessing: false, success: s.success !== false, isBotProtected: !!s.isBotProtected,
          status: s.status || 200, title: s.label || "",
        });
        return;
      }

      if (msg.type === "progress") {
        // Live, in-memory update — served straight to polling clients, no DB hit.
        auditStore.applyPatch(newReport._id, msg.patch || {});
        return;
      }

      if (msg.type === "error") {
        logger.error(`❌ Audit Failed: ${msg.error}`);
        releaseAuditSlot(); // terminal — let the next queued audit start now
        const failedDoc = auditStore.complete(newReport._id, { status: "failed", error: msg.error });
        notifyAuditFinished(failedDoc, { failed: true });
        await markAuditLog({
          $set: {
            status: "failed",
            failureReason: String(msg.error || 'Unknown error').slice(0, 500),
            completedAt: new Date(),
            auditDuration: Date.now() - startTime,
          },
          $push: { actions: "failed" },
        });
        logActivity(journeyReq, {
          action: 'AUDIT_FAILED',
          status: 'FAILURE',
          url,
          errorMessage: String(msg.error || 'Unknown error').slice(0, 500),
          metadata: { reportId: String(newReport._id), device, report },
        });
        return;
      }

      if (msg.type === "done") {
        const duration = Date.now() - startTime;
        releaseAuditSlot(); // terminal — let the next queued audit start now
        // Finalize in memory; this queues the report for the next batched flush.
        const finalDoc = auditStore.complete(newReport._id, msg.patch || {});

        if (finalDoc?.status === "failed") {
          notifyAuditFinished(finalDoc, { failed: true });
          await markAuditLog({
            $set: {
              status: "failed",
              failureReason: String(finalDoc?.error || 'Audit finished in a failed state').slice(0, 500),
              completedAt: new Date(),
              auditDuration: duration,
            },
            $push: { actions: "failed" },
          });
          logActivity(journeyReq, {
            action: 'AUDIT_FAILED',
            status: 'FAILURE',
            url,
            errorMessage: String(finalDoc?.error || 'Audit finished in a failed state').slice(0, 500),
            metadata: { reportId: String(newReport._id), device, report },
          });
          return;
        }

        logger.info("✅ Audit Completed Successfully");
        notifyAuditFinished(finalDoc);
        await markAuditLog({
          $set: {
            status: "success",
            score: finalDoc?.score,
            grade: finalDoc?.grade,
            // The classifier can refine the site type mid-run (a redirect, a
            // clearer signal on the real page), so take the finished report's
            // verdict over the pre-flight guess written when the row was created.
            siteType: finalDoc?.siteType || normalizedSiteType,
            siteSubType: finalDoc?.siteSubType || normalizedSubType,
            completedAt: new Date(),
            auditDuration: duration,
            exitPage: "/report",
          },
          $push: { actions: "completed" },
        });
        logActivity(journeyReq, {
          action: 'AUDIT_COMPLETED',
          url,
          metadata: {
            reportId: String(newReport._id), device, report,
            score: finalDoc?.score ?? null, grade: finalDoc?.grade ?? null,
            durationMs: duration,
          },
        });
      }
    });

    worker.on("error", async (err) => {
      logger.error(`❌ Audit Failed with worker error`, err);
      releaseAuditSlot();
      notifyAuditFinished(
        auditStore.complete(newReport._id, { status: "failed", error: err.message }),
        { failed: true }
      );
      await markAuditLog({
        $set: {
          status: "failed",
          failureReason: String(err.message || 'Worker crashed').slice(0, 500),
          completedAt: new Date(),
          auditDuration: Date.now() - startTime,
        },
        $push: { actions: "failed" },
      });
      logActivity(journeyReq, {
        action: 'AUDIT_FAILED',
        status: 'FAILURE',
        url,
        errorMessage: String(err.message || 'Worker crashed').slice(0, 500),
        metadata: { reportId: String(newReport._id), device, report },
      });
    });

  } catch (error) {
    if (!res.headersSent) {
      logger.error("Audit Controller Error", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  }
};

// Enforce the same per-user access control whether the report comes from the
// in-memory store or Mongo. Returns true if the requester may see this report.
// A report with no userId is a guest run. Those are already readable by anyone
// holding the id — a signed-out GET /single-audit/:id returns one today — so
// letting a signed-in user read them grants no access that did not already exist.
//
// Scoping them to `userId` instead did something much worse: it made the report a
// visitor was reading disappear the moment they signed in, because their new
// userId could never equal the null on the doc. The report pages then sat on
// "Analyzing…" forever waiting for data that was 404ing. That is the exact path a
// visitor takes when they hit the sign-up gate on a locked section, so the gate
// was breaking the flow it exists to drive.
const isUnownedReport = (report) => !report?.userId;

const canAccessReport = (req, report) => {
  // Admins see everything.
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) return true;

  // Signed out: only guest runs. This branch used to be skipped entirely for
  // anonymous requests — `if (req.user && …)` meant no scoping was applied at all,
  // so anyone holding a report id could read someone else's report without logging
  // in. Ids are ObjectIds so they are not guessable, but a shared link was enough.
  if (!req.user) return isUnownedReport(report);

  // Signed in: own reports, plus unowned guest runs so the report a visitor was
  // reading does not vanish the moment they create an account.
  if (isUnownedReport(report)) return true;
  return String(report.userId || "") === String(req.user.userId || "");
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Completed reports are buffered in memory and written to Mongo in batches, so a
// report can briefly be in neither place (mid-flush) or lag a DB write/replication.
// These give a refresh a short cooldown to settle before we declare it missing.
const REPORT_LOOKUP_RETRIES = 3;
const REPORT_LOOKUP_COOLDOWN_MS = 400; // up to ~1.2s total before a 404

// Resolve a report by id: memory first, then Mongo with a cooldown+retry, then null.
// `projection` (optional) restricts the Mongo fields fetched (used by the status poll).
const resolveReport = async (req, id, projection = null) => {
  // 1) Memory — in-progress and not-yet-flushed reports live only here.
  const liveDoc = auditStore.get(id);
  if (liveDoc) return { doc: liveDoc, ok: canAccessReport(req, liveDoc) };

  // 2) Mongo, with a short cooldown+retry to ride out the flush / write-lag window.
  // Mirrors canAccessReport — keep the two in step. `userId: null` also matches
  // docs missing the field, which is how older guest reports were written.
  const query = { _id: id };
  if (!req.user) {
    // Signed out: guest runs only. Previously unscoped, which let anyone with a
    // report id read another account's report.
    query.userId = null;
  } else if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    // Own reports, plus unowned guest runs so a visitor's report survives sign-up.
    query.$or = [{ userId: req.user.userId }, { userId: null }];
  }

  for (let attempt = 0; attempt < REPORT_LOOKUP_RETRIES; attempt++) {
    const q = SingleAuditReport.findOne(query);
    const found = await (projection ? q.select(projection) : q);
    if (found) return { doc: found, ok: true }; // Mongo query already scoped by userId

    // Cheap re-check of memory in case a failed flush re-queued the report.
    const reappeared = auditStore.get(id);
    if (reappeared) return { doc: reappeared, ok: canAccessReport(req, reappeared) };

    if (attempt < REPORT_LOOKUP_RETRIES - 1) await sleep(REPORT_LOOKUP_COOLDOWN_MS);
  }

  return { doc: null, ok: false };
};

/**
 * Attach a guest report to the account that just signed in.
 *
 * A visitor's audit is written with `userId: null` on both the report and its
 * AuditLog row. Signing in to read it left both untouched, and getHistory filters
 * on `userId` — so the report a visitor created an account *for* was the one
 * report missing from their past reports.
 *
 * Deliberately explicit rather than claiming on read: a guest report is readable
 * by anyone holding the id, so adopting on read would let the first signed-in
 * viewer of a shared link take it and lock everyone else out. The client only
 * calls this for the report its saved post-auth intent points at.
 *
 * Idempotent — the `userId: null` filters mean a second call changes nothing, and
 * an already-owned report is never reassigned.
 */
export const claimReport = async (req, res) => {
  try {
    const id = req.params.singleAuditId;

    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: "Sign in required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid report id" });
    }

    // In-memory first: a just-finished audit may not have been flushed yet, and
    // getHistory unions live ids for the user.
    const claimedInMemory = auditStore.claimForUser(id, req.user.userId);

    // `{ userId: null }` also matches docs where the field is absent, which is how
    // older guest reports were written.
    const report = await SingleAuditReport.updateOne(
      { _id: id, userId: null },
      { $set: { userId: req.user.userId } }
    );

    // The history list joins AuditLog → report, so the log row has to move too.
    const log = await AuditLog.updateMany(
      { reportId: id, userId: null },
      { $set: { userId: req.user.userId } }
    );

    const claimed = claimedInMemory || report.modifiedCount > 0 || log.modifiedCount > 0;
    if (claimed) {
      logger.info(`[Claim Report] ${id} → user ${req.user.userId}`);
    }

    res.json({ success: true, claimed });

  } catch (error) {
    logger.error("[Claim Report]", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getReportById = async (req, res) => {
  try {
    const id = req.params.singleAuditId;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Report not found or access denied" });
    }

    const { doc, ok } = await resolveReport(req, id);
    if (!doc || !ok) {
      return res.status(404).json({ message: "Report not found or access denied" });
    }

    // NOT where a report view is counted. The report page polls this endpoint
    // every 3 seconds for live updates and keeps polling after the audit finishes,
    // so logging a view here would write an activity row every 3s per open tab and
    // drive reportViewCount into the thousands for a single reader.
    //
    // The view is recorded by the client instead (POST /api/track/event, fired
    // once when a completed report is first rendered) — the browser is the only
    // party that can tell "opened the report" apart from "polled it again".
    res.status(200).json(gateReportForViewer(doc, !!req.user));
  } catch (error) {
    logger.error("Error fetching report", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getReportStatusById = async (req, res) => {
  try {
    const id = req.params.singleAuditId;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Report not found or access denied" });
    }

    // Memory first (no DB read on the in-progress 3s poll), then Mongo. We also need
    // each section's Percentage so progress can track SECTION COMPLETION — the status
    // field only moves through the browser/crawl phases, then sits still through the
    // (longest) scoring phase, so on its own it stalls the bar. Project just the
    // Percentage sub-fields (cheap) — never the full section objects or screenshot.
    const { doc: report, ok } = await resolveReport(
      req,
      id,
      // psiPending/score/grade ride along because they are what CHANGES on the
      // PageSpeed patch — the report is already open and readable at 7/8 pillars, and
      // that patch rewrites the Technical card and the headline score without moving
      // `status`. The report page watches these to know when a refetch of the (195 KB)
      // full report is actually worth making; without them the only hint is
      // completedSections, which is indirect. Three scalars, still a ~500-byte reply.
      "_id status screenshotUrl error psiPending score grade stage1Completed stage2Completed stage2Progress crawledPagesCount crawledPagesSummary " +
      "createdAt estimatedSeconds plannedPages notifyEmail technicalPerformance.Percentage onPageSEO.Percentage " +
      "accessibility.Percentage securityOrCompliance.Percentage UXOrContentStructure.Percentage " +
      "conversionAndLeadFlow.Percentage aioReadiness.Percentage aeo.Percentage"
    );
    if (!report || !ok) {
      return res.status(404).json({ message: "Report not found or access denied" });
    }

    // How many of the 8 dimensions have finished scoring. These stream in as the worker
    // completes each metric, so this climbs steadily even while `status` is unchanged.
    const SECTION_KEYS = [
      "technicalPerformance", "onPageSEO", "accessibility", "securityOrCompliance",
      "UXOrContentStructure", "conversionAndLeadFlow", "aioReadiness", "aeo",
    ];
    const total = SECTION_KEYS.length;
    const completedSections = SECTION_KEYS.filter(
      (k) => report[k] && typeof report[k].Percentage === "number"
    ).length;

    // Browser/crawl phases own the first ~45%; section completion drives 45 → 100%.
    // Mirrors the dashboard loading model so a page's progress never freezes mid-run.
    const PHASES = {
      launching: [10, "Launching browser"],
      navigating: [20, "Opening your website"],
      waiting_for_render: [30, "Rendering the page"],
      screenshot_ready: [40, "Capturing the page"],
      extracting_data: [45, "Scoring sections"],
    };

    let progress = 0;
    let message = "";
    if (report.status === "failed") {
      progress = 100;
      message = report.error || "Audit failed";
    } else if (report.status === "completed") {
      progress = 100;
      message = "Audit completed";
    } else if (report.status === "queued") {
      // Admitted but not started: another audit holds the slot. Say so rather
      // than showing browser-launch progress for work that hasn't begun.
      progress = 5;
      message = report.queuePosition > 1
        ? `Waiting for a free audit slot — #${report.queuePosition} in queue`
        : "Waiting for a free audit slot — next in line";
    } else if (completedSections > 0) {
      progress = Math.min(99, 45 + Math.round((completedSections / total) * 55));
      message = report.stage2Progress || `Analyzing your site — ${completedSections}/${total} sections scored`;
    } else if (PHASES[report.status]) {
      progress = PHASES[report.status][0];
      message = PHASES[report.status][1];
    } else {
      progress = 8;
      message = "Starting audit";
    }

    // ── How much longer? ──
    // Below ~15% there is not enough signal to extrapolate from, so the opening
    // estimate (set at creation from the page count) stands. After that, elapsed
    // time is the honest source: a site that is running slow stretches its own
    // estimate instead of us repeating a number we can no longer meet. A queued
    // run has not started, so it waits out the runs ahead of it first.
    const elapsedSeconds = Math.max(0, (Date.now() - new Date(report.createdAt).getTime()) / 1000);
    const openingEstimate = report.estimatedSeconds || AUDIT_BASE_SECONDS;

    let estimatedSecondsRemaining;
    if (report.status === "completed" || report.status === "failed") {
      estimatedSecondsRemaining = 0;
    } else if (report.status === "queued") {
      const ahead = Math.max(0, (report.queuePosition || 1) - 1);
      estimatedSecondsRemaining = Math.round(openingEstimate * (ahead + 1));
    } else if (progress >= 15) {
      const projectedTotal = elapsedSeconds * (100 / progress);
      estimatedSecondsRemaining = Math.round(Math.max(5, projectedTotal - elapsedSeconds));
    } else {
      estimatedSecondsRemaining = Math.round(Math.max(5, openingEstimate - elapsedSeconds));
    }

    res.status(200).json({
      _id: report._id,
      status: report.status,
      screenshotUrl: report.screenshotUrl,
      estimatedSecondsRemaining,
      estimatedSeconds: openingEstimate,
      elapsedSeconds: Math.round(elapsedSeconds),
      plannedPages: report.plannedPages || 1,
      // Lets the client say "we'll email <address>" instead of a vague promise.
      notifyEmail: report.notifyEmail || null,
      queuePosition: report.queuePosition || 0,
      stage1Completed: report.stage1Completed,
      stage2Completed: report.stage2Completed,
      stage2Progress: report.stage2Progress,
      crawledPagesCount: report.crawledPagesCount,
      crawledPagesSummary: report.crawledPagesSummary || [],
      progress,
      message,
      completedSections,
      totalSections: total,
      // Refetch triggers for the report page — see the projection note above.
      psiPending: report.psiPending ?? false,
      score: report.score ?? null,
      grade: report.grade ?? null,
    });
  } catch (error) {
    logger.error("Error fetching report status", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// POST /single-audit/merge  { ids: [reportId…], pageType?, label? }
// Builds ONE averaged report from several sample reports (e.g. the VDP samples):
// each section keeps a representative sample's rich detail, but its headline Percentage
// — and the overall score — become the MEAN across the samples. Saved as a new report so
// the summary shows a single VDP row whose drill-in IS the averaged report. The samples'
// own reports are left untouched (still individually addressable, just not surfaced).
export const mergeReports = async (req, res) => {
  try {
    const { ids, pageType } = req.body || {};
    if (!Array.isArray(ids) || ids.length < 2) {
      return res.status(400).json({ error: "Provide at least two report ids to merge" });
    }

    // Resolve each (in-memory store first, then Mongo), enforcing per-user access.
    const docs = [];
    for (const id of ids) {
      if (!mongoose.Types.ObjectId.isValid(id)) continue;
      const doc = auditStore.get(id) || await SingleAuditReport.findById(id);
      if (doc && canAccessReport(req, doc)) docs.push(doc);
    }

    // Prefer completed reports that actually carry section data; fall back to whatever resolved.
    const usable = docs.filter(
      (d) => d.status === "completed" &&
        MERGE_SECTIONS.some(({ field }) => d[field] && typeof d[field].Percentage === "number")
    );
    const source = usable.length ? usable : docs;
    if (!source.length) {
      return res.status(404).json({ error: "No accessible, completed reports to merge" });
    }

    // Average the overall scores first, then choose the representative sample whose
    // overall score is CLOSEST to that average — its non-numeric evidence (details,
    // recommendations, meta) is what we keep, so the kept text reflects a typical
    // sample rather than an arbitrary first one. All scores are still averaged below.
    const overall = avgScores(source.map((d) => d.score));
    const scoredSamples = source.filter((d) => typeof d.score === "number");
    const base = (overall == null || !scoredSamples.length)
      ? source[0]
      : scoredSamples.reduce(
        (best, d) => (Math.abs(d.score - overall) < Math.abs(best.score - overall) ? d : best),
        scoredSamples[0]
      );

    const mergedId = new mongoose.Types.ObjectId();
    const sectionScore = [];
    const mergedDoc = {
      _id: mergedId,
      // Synthetic, unique URL so the {url,device,report} unique index never collides
      // with an underlying sample report (or a re-run of this merge).
      url: `${base.url}#merged-${mergedId.toString()}`,
      device: base.device || "Desktop",
      report: "All",
      status: "completed",
      pageType: pageType || base.pageType || "vdp",
      timeTaken: `0s (merged)`,
      screenshot: base.screenshot || null,
      siteSchema: base.siteSchema || null,
      isBotProtected: false,
      userId: req.user?.userId || null,
    };

    for (const { field, display } of MERGE_SECTIONS) {
      const sectionSamples = source.map((d) => d[field]).filter(Boolean);
      if (!sectionSamples.length) { mergedDoc[field] = null; continue; }
      const baseSection = base[field] || sectionSamples[0];

      // Deep-average every parameter's score (+ re-derive its status); keep the
      // representative sample's text/meta. Then overwrite the section headline
      // Percentage with the mean so the section gauge matches its cards.
      const mergedSection = mergeScores(baseSection, sectionSamples);
      const avgPct = avgScores(sectionSamples.map((s) => s.Percentage));
      mergedSection.Percentage = avgPct ?? baseSection.Percentage;
      mergedSection.merged = true;
      mergedSection.mergedFrom = sectionSamples.length;
      // Keep AIO's compatibility badge consistent with the averaged headline.
      if (field === "aioReadiness") {
        mergedSection.AIO_Compatibility_Badge = mergedSection.Percentage >= 50 ? "Yes" : "No";
      }
      mergedDoc[field] = mergedSection;
      sectionScore.push({ name: display, score: mergedSection.Percentage });
    }

    mergedDoc.aioCompatibilityBadge = mergedDoc.aioReadiness?.AIO_Compatibility_Badge || base.aioCompatibilityBadge || null;

    mergedDoc.score = overall;
    mergedDoc.grade = gradeForScore(overall);
    mergedDoc.sectionScore = sectionScore;
    mergedDoc.mergedFrom = source.length;

    await new SingleAuditReport(mergedDoc).save();

    // Master report persisted → discard the source samples so Mongo holds ONE VDP report.
    // Drop them from the in-memory store (incl. the pending-flush queue) FIRST so a batched
    // flush can't re-insert them, then delete from Mongo. AuditLog rows are intentionally
    // left as-is — the same state as when a report TTL-expires (the app already tolerates
    // "log exists, report gone"). Only runs after the merged report saved successfully.
    const sourceIds = docs.map((d) => d._id).filter(Boolean);
    try {
      auditStore.removeByIds(sourceIds);
      const del = await SingleAuditReport.deleteMany({ _id: { $in: sourceIds } });
      logger.info(`🧹 Merge ${mergedId}: removed ${del?.deletedCount ?? 0} source sample report(s) from Mongo`);
    } catch (delErr) {
      logger.warn(`Merge ${mergedId}: source-report cleanup failed (master kept)`, delErr);
    }

    logger.info(`🧩 Merged ${source.length} reports → ${mergedId} (avg score ${overall})`);
    return res.status(201).json({
      _id: mergedId,
      score: overall,
      grade: mergedDoc.grade,
      pageType: mergedDoc.pageType,
      mergedFrom: source.length,
    });
  } catch (error) {
    logger.error("Merge reports failed", error);
    return res.status(500).json({ error: "Failed to merge reports", details: error.message });
  }
};

// Look up an existing merged (multi-sample averaged) report for a site + pageType,
// so a repeat audit of the same site reuses the VDP/SRP average instead of
// re-auditing every sample. Merged reports live under a synthetic
// "<sampleUrl>#merged-<id>" URL (see mergeReports) and their source samples are
// deleted after merging, so startAudit's {url,device,report} dedupe can never
// find them — this endpoint matches by site HOST + pageType + device instead,
// scoped per user exactly like the startAudit dedupe (guests share the
// null-user pool). TTL expiry keeps hits fresh (reports self-delete after
// REPORT_TTL_SECONDS — default 24h, see models/singleAuditReport.js).
export const findMergedReport = async (req, res) => {
  try {
    const { url, pageType, device } = req.body || {};
    if (!url || !pageType) {
      return res.status(400).json({ error: "url and pageType are required" });
    }

    let host;
    try {
      host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./i, "");
    } catch {
      return res.status(400).json({ error: "Invalid url" });
    }

    const esc = host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = {
      // any sample URL on this site carrying the merge marker
      url: { $regex: `^https?://(www\\.)?${esc}(/|:).*#merged-`, $options: "i" },
      pageType,
      status: "completed",
      userId: req.user?.userId || null,
    };
    if (device) query.device = device;

    const doc = await SingleAuditReport.findOne(query)
      .sort({ createdAt: -1 })
      .select("_id url device report pageType score grade mergedFrom createdAt");
    if (!doc) return res.status(404).json({ error: "No merged report found for this site/pageType" });

    logger.info(`♻️ Reusing merged ${pageType} report ${doc._id} for ${host} (no re-audit)`);
    return res.status(200).json({
      _id: doc._id,
      pageType: doc.pageType,
      device: doc.device,
      report: doc.report,
      score: doc.score,
      grade: doc.grade,
      mergedFrom: doc.mergedFrom || undefined,
      createdAt: doc.createdAt,
    });
  } catch (error) {
    logger.error("find-merged lookup failed", error);
    return res.status(500).json({ error: "Failed to look up merged report" });
  }
};

export const captureScreenshot = async (req, res) => {
  try {
    const { url, auditId } = req.body;
    if (!url || !auditId) {
      return res.status(400).json({ error: "Missing url or auditId" });
    }

    // SSRF guard: this endpoint drives Puppeteer against the supplied URL.
    const safety = await validateUrlSafety(url);
    if (!safety.ok) {
      return res.status(400).json({ error: `Invalid or Restricted URL — ${safety.reason}` });
    }

    // The report may still be in memory (not yet flushed to Mongo).
    const liveReport = auditStore.get(auditId);
    const report = liveReport || await SingleAuditReport.findById(auditId);
    if (!report) {
      return res.status(404).json({ error: "Audit report not found" });
    }

    // Only the report owner (or an admin) may trigger a screenshot for it.
    if (!canAccessReport(req, report)) {
      return res.status(404).json({ error: "Audit report not found" });
    }

    // Write a patch to wherever the report currently lives.
    const patchReport = async (patch) => {
      if (auditStore.get(auditId)) auditStore.applyPatch(auditId, patch);
      else await SingleAuditReport.findByIdAndUpdate(auditId, patch);
    };

    const device = report.device || "Desktop";

    logger.info(`📸 Taking parallel screenshot for ${url} on ${device}...`);
    let result;
    try {
      result = await Puppeteer_Cheerio(url, device);
    } catch (scrapingError) {
      logger.error("Puppeteer capture failed", scrapingError);
      await patchReport({ screenshot: null, screenshotUrl: null });
      return res.status(200).json({ screenshotUrl: null, error: "timeout" });
    }

    const { screenshot, isBotProtected, browser } = result;

    if (browser) {
      try { await browser.close(); } catch (_) { }
    }

    if (!screenshot) {
      logger.warn("Screenshot capture returned empty.");
      await patchReport({
        screenshot: null,
        screenshotUrl: null,
        isBotProtected: isBotProtected || false
      });
      return res.status(200).json({ screenshotUrl: null, error: "empty" });
    }

    // Dynamic self-hosted URL
    const screenshotUrl = `/api/screenshot/view/${auditId}`;

    await patchReport({
      screenshot,
      screenshotUrl,
      isBotProtected: isBotProtected || false
    });

    logger.info(`📸 Screenshot captured successfully and saved for ${url}`);
    return res.status(200).json({ screenshotUrl });

  } catch (error) {
    logger.error("Screenshot Endpoint Error", error);
    return res.status(200).json({ screenshotUrl: null, error: error.message });
  }
};

export const getScreenshotImage = async (req, res) => {
  try {
    // The screenshot is held in memory during the audit; fall back to Mongo after flush.
    const report =
      auditStore.get(req.params.auditId) ||
      await SingleAuditReport.findById(req.params.auditId).select("screenshot");
    if (!report || !report.screenshot) {
      return res.status(404).send("Screenshot not found");
    }
    const imgBuffer = Buffer.from(report.screenshot, "base64");
    res.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Content-Length": imgBuffer.length,
      "Cache-Control": "public, max-age=86400"
    });
    res.end(imgBuffer);
  } catch (err) {
    logger.error("Error serving screenshot", err);
    res.status(500).send("Internal Server Error");
  }
};
