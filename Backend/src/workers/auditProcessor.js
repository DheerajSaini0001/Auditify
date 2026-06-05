// The BullMQ job processor. This is where an audit actually runs.
//
// THE RULE: this function NEVER writes to MongoDB during processing. It writes exactly
// ONCE — at the very end (status=completed + report). All intermediate progress goes to
// Redis only. If anything throws, BullMQ catches it and retries; the permanent-failure
// MongoDB write happens in auditWorker.js (and only after all attempts are exhausted).
import { crawl } from "./crawler.js";
import { getChecks } from "./checks/index.js";
import { updateProgress } from "../progress/progressStore.js";
import Audit from "../models/Audit.js";
import createLogger from "../utils/logger.js";

const log = createLogger("processor");

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export async function processAudit(job) {
  const { auditId, url, options = {} } = job.data;
  const startedAt = new Date();
  const maxPages = Math.max(1, Number(options.maxPages) || 20);

  log.info(`Processing audit ${auditId} for ${url} (attempt ${job.attemptsMade + 1})`);

  // 1. Mark processing in Redis (NOT Mongo).
  await updateProgress(auditId, {
    status: "processing",
    stage: "crawling",
    percent: 0,
    startedAt: startedAt.toISOString(),
    error: job.attemptsMade > 0 ? `retrying, attempt ${job.attemptsMade + 1} of ${job.opts.attempts}` : null,
  });

  // 2-3. Crawl. Crawling occupies 0% -> 40% of total progress.
  const { pages, pagesFound, pagesScanned } = await crawl(url, { maxPages }, async (info) => {
    await updateProgress(auditId, {
      stage: "crawling",
      pagesFound: info.pagesFound,
      pagesScanned: info.pagesScanned,
      currentUrl: info.currentUrl,
      percent: clamp(Math.round((info.pagesScanned / maxPages) * 40), 0, 40),
    });
  });

  // 4-6. Run checks one by one. Checks occupy 40% -> 95% of total progress.
  const checks = getChecks(options);
  const checkResults = {};
  for (let i = 0; i < checks.length; i++) {
    const check = checks[i];
    await updateProgress(auditId, { stage: `${check.key}-check`, checks: { [check.key]: "running" } });

    const result = await check.run(pages, { url, options });
    checkResults[check.key] = result;

    await updateProgress(auditId, {
      checks: { [check.key]: result.status === "failed" ? "failed" : "done" },
      percent: clamp(40 + Math.round(((i + 1) / checks.length) * 55), 40, 95),
    });
  }

  // 7. Finalizing.
  await updateProgress(auditId, { stage: "finalizing", percent: 96, currentUrl: null });

  // 8. Build the full report IN MEMORY.
  const checkList = Object.values(checkResults);
  const issuesFound = checkList.reduce((s, c) => s + (c.issuesFound || 0), 0);
  const criticalIssues = checkList.reduce((s, c) => s + (c.criticalIssues || 0), 0);
  const score = checkList.length
    ? Math.round(checkList.reduce((s, c) => s + (c.score || 0), 0) / checkList.length)
    : 0;

  const completedAt = new Date();
  const summary = { pagesScanned, issuesFound, score, criticalIssues };
  const report = {
    url,
    options,
    generatedAt: completedAt.toISOString(),
    pagesFound,
    pagesScanned,
    pages: pages.map((p) => ({ url: p.url, status: p.status, timingMs: p.timingMs, sizeBytes: p.sizeBytes, error: p.error })),
    checks: checkResults,
    score,
    issuesFound,
    criticalIssues,
  };

  // 9. THE SINGLE MongoDB write for a successful audit.
  await Audit.updateOne(
    { _id: auditId },
    {
      $set: {
        status: "completed",
        startedAt,
        completedAt,
        durationMs: completedAt - startedAt,
        report,
        summary,
        error: null,
        attemptsMade: job.attemptsMade + 1,
      },
    }
  );

  // 10. Reflect completion in Redis.
  await updateProgress(auditId, {
    status: "completed",
    stage: "completed",
    percent: 100,
    pagesScanned,
    pagesFound,
    error: null,
  });

  log.info(`Audit ${auditId} completed: score=${score}, issues=${issuesFound}`);
  return { auditId, score, issuesFound }; // returned value is stored by BullMQ (small)
}

export default processAudit;
