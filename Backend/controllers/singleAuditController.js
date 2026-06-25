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
import { classifyPageType, computePageScoreFromMap } from "../utils/sectionWeights.js";
 
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
    let { url, device, report, force, pageType } = req.body;

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
          // matching what a fresh subset audit of this URL would produce.
          const sectionScore = computePageScoreFromMap(pctBySection, classifyPageType(url));
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

    logger.info(`➡️ Starting NEW Audit Request → ${url} | ${device} | ${report}`);

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

    const workerPath = join(process.cwd(), "workers", "singleAuditWorker.js");

    const worker = new Worker(workerPath, {
      workerData: {
        url,
        device,
        report,
        auditId: newReport._id.toString(),
        pageType: newReport.pageType || null,
      },
    });

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

    worker.on("message", async (msg) => {
      if (!msg || !msg.type) return;

      if (msg.type === "progress") {
        // Live, in-memory update — served straight to polling clients, no DB hit.
        auditStore.applyPatch(newReport._id, msg.patch || {});
        return;
      }

      if (msg.type === "error") {
        logger.error(`❌ Audit Failed: ${msg.error}`);
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
      "_id status screenshotUrl error technicalPerformance.Percentage onPageSEO.Percentage " +
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
    } else if (completedSections > 0) {
      progress = Math.min(99, 45 + Math.round((completedSections / total) * 55));
      message = `Analyzing your site — ${completedSections}/${total} sections scored`;
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
// Builds ONE averaged report from several sample reports (e.g. the 5 VDP samples):
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
