import { Worker } from "worker_threads";
import { join } from "path";
import mongoose from "mongoose";
import SingleAuditReport from "../models/singleAuditReport.js";
import AuditLog from "../models/AuditLog.js";
import ActivityLog from "../models/ActivityLog.js";
import Puppeteer_Cheerio from "../utils/puppeteer_cheerio.js";
import { checkWebsiteExists } from "../utils/fastFetch.js";
import { validateUrlSafety } from "../utils/ssrfGuard.js";
import auditStore from "../utils/auditStore.js";
import logger from "../utils/logger.js";
import { classifyPageType, classifyCorporatePageType, computePageScoreFromMap } from "../utils/sectionWeights.js";
import { detectSiteType } from "../utils/siteTypeDetector.js";
import { registerWorkerWithManager } from "../utils/browserManager.js";
import { acquireAuditSlot } from "../utils/auditQueue.js";
import { collectWorkerConfig } from "../utils/workerConfig.js";
 
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

export const startAudit = async (req, res) => {

  try {
    let { url, device, report, force, pageType, siteType, pageScopes } = req.body;

    // Page types the user kept ticked in the home-page picker. Stage 2 only audits
    // these; ["home"] alone means "just the URL I entered". Unknown keys are dropped
    // so a stale or hand-rolled client can't widen the crawl.
    const VALID_PAGE_SCOPES = new Set([
      "home", "srp", "vdp", "trade", "lease", "finance", "service", "specials",
      "about", "content", "models", "locator", "press",
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
      return res.status(400).json({ error: `Website not found — ${existence.reason}` });
    }

    if (force) {
      logger.info(`🗑️ Force run: Deleting existing single audit report for: ${url}`);
      await SingleAuditReport.deleteMany({
        url,
        device,
        report,
        userId: req.user?.userId || null
      });
      // Also drop any in-memory copy that hasn't been flushed yet.
      auditStore.removeMatching({ url, device, report, userId: req.user?.userId || null });
    }

    // Strict Deduplication: Check if a successful audit already exists or a very recent in-progress one.
    // Check the in-memory store FIRST (reports may not be flushed to Mongo yet), then Mongo.
    let existing = null;
    if (!force) {
      existing = auditStore.findActiveDuplicate({ url, device, report, userId: req.user?.userId || null });
      if (!existing) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        existing = await SingleAuditReport.findOne({
          url,
          device,
          report,
          userId: req.user?.userId || null,
          $or: [
            { status: "completed" },
            { status: "inprogress", createdAt: { $gt: fiveMinutesAgo } }
          ]
        }).sort({ createdAt: -1 });
      }
    }

    if (existing) {
      logger.info(`♻️ Safeguard: Reusing existing Audit (${existing.status}) for: ${url}`);
      
      // Save an AuditLog so it appears in User's history even though it was cached
      const auditLog = new AuditLog({
        userId: req.user?.userId || null,
        guestEmail: req.guestEmail || null,
        sessionId: req.tracking?.sessionId || 'N/A',
        ip: req.tracking?.ip || '0.0.0.0',
        country: req.tracking?.country,
        city: req.tracking?.city,
        device: existing.device || device || 'Desktop',
        browser: req.tracking?.browser,
        os: req.tracking?.os,
        screenResolution: req.body.screenResolution || req.tracking?.screenResolution,
        url: url,
        reportId: existing._id,
        reportType: report,
        referrer: req.tracking?.referrer || 'direct',
        entryPage: req.tracking?.entryPage || '/',
        actions: ["visited", "audit_run_cached"],
        captchaPassed: true,
        status: existing.status === "completed" ? "success" : existing.status === "failed" ? "failed" : "pending",
        score: existing.score,
        grade: existing.grade,
      });

      if (req.user) {
        ActivityLog.create({
          userId: req.user.userId,
          sessionId: req.tracking?.sessionId || 'N/A',
          ip: req.tracking?.ip || '0.0.0.0',
          device: device,
          browser: req.tracking?.browser || 'Unknown',
          os: req.tracking?.os || 'Unknown',
          action: 'AUDIT_RUN_CACHED',
          metadata: { url, device, reportId: existing._id }
        }).catch(err => logger.error("Error saving cached ActivityLog", err));
      }

      auditLog.save().catch(err => logger.error("Error saving cached AuditLog", err));

      return res.status(200).json(existing);
    }
 
    // ⭐ ENHANCEMENT: Extract one OR MORE sections from an existing "Full Audit".
    // `report` is a single section name or a comma-joined subset chosen via the
    // report-scope checklist; if a completed full audit already holds every
    // requested section, we clone those fields out instead of re-running a worker.
    if (report !== "All") {
      const sections = String(report).split(",").map((s) => s.trim()).filter(Boolean);

      // Prefer an in-memory completed full audit; fall back to Mongo.
      let fullAudit = auditStore.findCompletedFullAudit({ url, device, userId: req.user?.userId || null });
      if (!fullAudit) {
        fullAudit = await SingleAuditReport.findOne({
          url,
          device,
          report: "All",
          userId: req.user?.userId || null,
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
            userId: req.user?.userId || null
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
          // whichever siteType the original full audit was classified as.
          const classify = fullAudit.siteType === "corporate" ? classifyCorporatePageType : classifyPageType;
          const sectionScore = computePageScoreFromMap(pctBySection, classify(url));
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
            url: url,
            reportId: newSectionReport._id,
            reportType: report,
            status: "success",
            score: sectionScore,
            grade: sectionGrade,
            actions: ["visited", "audit_section_extracted"],
          });
          auditLog.save().catch(err => logger.error("Error saving extracted AuditLog", err));

          return res.status(200).json(newSectionReport);
        }
      }
    }

    // Double-check race condition (buffer for parallel requests). Check the
    // in-memory store first (the in-progress report isn't in Mongo yet), then Mongo.
    await new Promise(resolve => setTimeout(resolve, 200));
    const raceDup = auditStore.findActiveDuplicate({ url, device, report, userId: req.user?.userId || null });
    if (raceDup) return res.status(200).json(raceDup);
    const raceCheck = await SingleAuditReport.findOne({ url, device, report, status: "inprogress", userId: req.user?.userId || null });
    if (raceCheck) return res.status(200).json(raceCheck);

    // The frontend already ran /single-audit/discover for this URL and knows the
    // siteType from that single homepage fetch — trust it when supplied so we
    // never re-fetch. Only direct API callers (or the merge/reuse paths) land
    // here without one; fall back to detecting it ourselves.
    //
    // Product decision: Auditify only audits dealership and automotive
    // corporate/OEM sites — "unknown" (including inconclusive) is REJECTED,
    // not failed open. /single-audit/discover already enforces this same gate
    // before a user ever reaches this endpoint through the normal UI flow;
    // this is the defense-in-depth check for direct API callers and a stale
    // or tampered client-supplied siteType.
    let normalizedSiteType = siteType === "corporate" || siteType === "dealer" ? siteType : null;
    if (!normalizedSiteType) {
      const detection = await detectSiteType(url);
      if (detection.siteType !== "dealer" && detection.siteType !== "corporate") {
        logger.info(`🚫 Rejected audit — not a dealer or automotive corporate site: ${url} (${detection.reason})`);
        return res.status(400).json({
          error: "This doesn't look like a dealership or automotive corporate/OEM website. Auditify only audits dealer and automotive-corporate sites.",
        });
      }
      normalizedSiteType = detection.siteType;
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

    logger.info(`➡️ Starting NEW Audit Request → ${url} | ${device} | ${report} | ${normalizedSiteType}`);

    // No DB write here. The report lives in memory until the worker finishes; the
    // main thread then batches it to Mongo. We generate the id up front so the
    // client can poll immediately and AuditLog can reference it.
    const newReport = auditStore.createInProgress({
      _id: new mongoose.Types.ObjectId(),
      url,
      device,
      report,
      userId: req.user?.userId || null,
      pageType: pageType || null,
      siteType: normalizedSiteType,
    });

    // Create a pending AuditLog entry asynchronously
    const auditLog = new AuditLog({
      userId: req.user?.userId || null,
      guestEmail: req.guestEmail || null,
      sessionId: req.tracking?.sessionId || 'N/A',
      ip: req.tracking?.ip || '0.0.0.0',
      country: req.tracking?.country || 'unknown',
      city: req.tracking?.city || 'unknown',
      device: device || 'Desktop',
      browser: req.tracking?.browser || 'unknown',
      os: req.tracking?.os || 'unknown',
      screenResolution: req.body.screenResolution || req.tracking?.screenResolution || 'unknown',
      url: url,
      reportId: newReport._id,
      reportType: report,
      referrer: req.tracking?.referrer || 'direct',
      entryPage: req.tracking?.entryPage || '/',
      actions: ["visited", "audit_run"],
      captchaPassed: true,
      status: "pending",
    });

    // Create detailed activity log for RBAC (Section 3.3)
    if (req.user) {
      ActivityLog.create({
        userId: req.user.userId,
        sessionId: req.tracking?.sessionId || 'N/A',
        ip: req.tracking?.ip || '0.0.0.0',
        device: device,
        browser: req.tracking?.browser || 'Unknown',
        os: req.tracking?.os || 'Unknown',
        action: 'AUDIT_RUN',
        metadata: { url, device, reportId: newReport._id }
      }).catch(err => logger.error("Error saving ActivityLog", err));
    }

    auditLog.save().catch(err => logger.error("Error saving AuditLog", err));

    const startTime = Date.now();

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
    const releaseAuditSlot = await acquireAuditSlot({
      label: url,
      onPosition: (position) => {
        auditStore.applyPatch(newReport._id, { status: "queued", queuePosition: position });
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
          pageScopes: normalizedScopes,
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
      auditStore.complete(newReport._id, { status: "failed", error: spawnErr.message });
      return;
    }

    // The audit is leaving the queue — clear the waiting marker so the status
    // endpoint stops reporting a queue position for a run that has started.
    auditStore.applyPatch(newReport._id, { status: "inprogress", queuePosition: 0 });

    // Release when the audit's WORK is done (the terminal done/error message),
    // not when the thread exits: measured, a finished worker can sit for minutes
    // before 'exit' fires because pending handles keep its event loop alive, and
    // holding the slot that long would stall the queue behind an audit that has
    // already delivered its report. 'exit' and 'error' stay wired as backstops
    // for a crash that never sends a terminal message — release() is idempotent,
    // so whichever fires first wins and the rest are no-ops.
    worker.on("exit", () => releaseAuditSlot());

    registerWorkerWithManager(worker);

    // The worker is DB-free: it streams progress and the final result here. The
    // main thread owns the in-memory store and batches the final write to Mongo.
    const markAuditLog = async (fields) => {
      try {
        await AuditLog.updateMany(
          { reportId: newReport._id, status: "pending" },
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
        auditStore.removeMatching({ url: c.url, device: childDevice, report: "All", userId: newReport.userId || null });
        auditStore.createInProgress({
          _id: new mongoose.Types.ObjectId(c.childId),
          url: c.url,
          device: childDevice,
          report: "All",
          userId: newReport.userId || null,
          pageType: c.pageType || null,
          siteType: newReport.siteType || null,
        });
        upsertCrawledPage(newReport._id, {
          url: c.url, pageType: c.pageType || "generic", label: c.label || "Key Page",
          reportId: c.childId, isProcessing: true, success: false, status: 200, title: c.label || "Auditing…",
        });
        SingleAuditReport.deleteMany({
          _id: { $ne: new mongoose.Types.ObjectId(c.childId) },
          url: c.url, device: childDevice, report: "All",
          userId: newReport.userId || null, status: { $ne: "failed" },
        }).catch(() => { /* best-effort; the batch flush also tolerates dup-key */ });
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
        auditStore.complete(newReport._id, { status: "failed", error: msg.error });
        await markAuditLog({
          status: "failed",
          auditDuration: Date.now() - startTime,
          $push: { actions: "failed" },
        });
        return;
      }

      if (msg.type === "done") {
        const duration = Date.now() - startTime;
        releaseAuditSlot(); // terminal — let the next queued audit start now
        // Finalize in memory; this queues the report for the next batched flush.
        const finalDoc = auditStore.complete(newReport._id, msg.patch || {});

        if (finalDoc?.status === "failed") {
          await markAuditLog({
            status: "failed",
            auditDuration: duration,
            $push: { actions: "failed" },
          });
          return;
        }

        logger.info("✅ Audit Completed Successfully");
        await markAuditLog({
          status: "success",
          score: finalDoc?.score,
          grade: finalDoc?.grade,
          auditDuration: duration,
          exitPage: "/report",
          $push: { actions: "completed" },
        });
      }
    });

    worker.on("error", async (err) => {
      logger.error(`❌ Audit Failed with worker error`, err);
      releaseAuditSlot();
      auditStore.complete(newReport._id, { status: "failed", error: err.message });
      await markAuditLog({
        status: "failed",
        auditDuration: Date.now() - startTime,
        $push: { actions: "failed" },
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
const canAccessReport = (req, report) => {
  if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return String(report.userId || "") === String(req.user.userId || "");
  }
  return true;
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
  const query = { _id: id };
  if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    query.userId = req.user.userId; // non-admins only see their own reports
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
    res.status(200).json(doc);
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
      "_id status screenshotUrl error stage1Completed stage2Completed stage2Progress crawledPagesCount crawledPagesSummary technicalPerformance.Percentage onPageSEO.Percentage " +
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

    res.status(200).json({
      _id: report._id,
      status: report.status,
      screenshotUrl: report.screenshotUrl,
      stage1Completed: report.stage1Completed,
      stage2Completed: report.stage2Completed,
      stage2Progress: report.stage2Progress,
      crawledPagesCount: report.crawledPagesCount,
      crawledPagesSummary: report.crawledPagesSummary || [],
      progress,
      message,
      completedSections,
      totalSections: total,
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
      try { await browser.close(); } catch (_) {}
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
