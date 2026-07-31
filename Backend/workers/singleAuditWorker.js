import { workerData, parentPort } from "worker_threads";
import mongoose from "mongoose";

import technicalMetrics from "../metricServices/technicalMetrics.js";
import seoMetrics from "../metricServices/seoMetrics.js";
import accessibilityMetrics from "../metricServices/accessibilityMetrics.js";
import securityCompliance from "../metricServices/securityCompliance.js";
import uxContentStructure from "../metricServices/uxContentStructure.js";
import conversionLeadFlow from "../metricServices/conversionLeadFlow.js";
import aioReadiness from "../metricServices/aioReadiness.js";
import AEOService from "../metricServices/aeoService.js";
import Puppeteer_Cheerio, { ensureDomainClearance } from "../utils/puppeteer_cheerio.js";
import { prefetchPsiBatch, takePsiPrefetch, clearPsiPrefetch } from "../utils/psiPrefetch.js";
import discoverPages from "../utils/sitemapCrawler.js";
import { checkWebsiteExists } from "../utils/fastFetch.js";
import { performance } from "perf_hooks";
import logger from "../utils/logger.js";
import { classifyPageType, classifyCorporatePageType } from "../utils/pageClassifier.js";

const { url, device, report, auditId, pageType: initialPageType, siteType, pageScopes } = workerData;

// Which page types the user ticked in the home-page picker. `null` = no restriction
// (audit whatever discovery finds, the original behaviour). A non-empty list means
// Stage 2 may only audit those types; "home" is the URL the user typed, so a
// selection of just ["home"] skips Stage 2 entirely — exactly one page is audited.
const scopeSet = Array.isArray(pageScopes) && pageScopes.length ? new Set(pageScopes) : null;
const scopedExtraTypes = scopeSet ? [...scopeSet].filter((k) => k !== "home") : null;
// Corporate/OEM sites have no VDP/SRP/trade/lease/finance/service of their own —
// classify against the corporate taxonomy instead. "unknown"/unset siteType
// falls back to the dealer classifier, matching the app's original behavior.
const classify = siteType === "corporate" ? classifyCorporatePageType : classifyPageType;
const pageType = initialPageType || classify(url);

// `report` is one of: "All" (full audit), a single section name, or a comma-joined
// list of section names — a custom subset chosen via the report-scope checklist.
// Parse it once so the worker can branch between the single / subset / full paths.
const requestedSections = report === "All"
  ? null
  : String(report).split(",").map((s) => s.trim()).filter(Boolean);
const isSubset = Array.isArray(requestedSections) && requestedSections.length > 1;

// Display names for the sectionScore rollup (match OverAll's labels).
const SECTION_DISPLAY_NAMES = {
  "Technical Performance": "Technical Performance",
  "On Page SEO": "On-Page SEO",
  "Accessibility": "Accessibility",
  "Security/Compliance": "Security/Compliance",
  "UX & Content Structure": "UX & Content Structure",
  "Conversion & Lead Flow": "Conversion & Lead Flow",
  "AIO (AI-Optimization) Readiness": "AIO Readiness",
  "AEO (Answer Engine Optimization)": "AEO",
};

const gradeFor = (score) =>
  score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";

// [NEW] — This worker is DB-FREE. It never opens a Mongo connection. Instead it
// streams progress and the final result to the main thread, which owns the
// in-memory audit store and batches writes to MongoDB. These two helpers replace
// every former `SingleAuditReport.findByIdAndUpdate(...)` call.
//
//   postProgress(patch) — a progressive update (status change / one metric's result)
//   finish(patch)       — terminal update; the audit is done (completed or failed)
const postProgress = (patch) => {
  parentPort.postMessage({ type: "progress", auditId, patch });
};
const finish = (patch) => {
  parentPort.postMessage({ type: "done", auditId, patch });
};

// [NEW] — Worker-level unhandled rejection & uncaught exception safety net
// Catches any fire-and-forget promise rejections or asynchronous exceptions from
// third-party metric libraries or playwright-extra (e.g. cdpSession) that occur during page teardown.
// Without this, a late cdpSession or axe-core error crashes the worker thread.
function handleWorkerSafetyError(error) {
  const msg = error?.message || (typeof error === 'string' ? error : '');
  const lmsg = msg.toLowerCase();
  const isPageError = (
    lmsg.includes('detached') ||
    lmsg.includes('session closed') ||
    lmsg.includes('target closed') ||
    lmsg.includes('context was destroyed') ||
    lmsg.includes('frame is not ready') ||
    lmsg.includes('page/frame is not ready') ||
    lmsg.includes('cdpsession') ||
    !error // undefined/null error
  );
  if (isPageError) {
    // Expected during page teardown — suppress silently
  } else {
    logger.warn(`[Worker] Uncaught safety exception/promise rejection (non-fatal):`, error);
  }
}

process.on('unhandledRejection', handleWorkerSafetyError);
process.on('uncaughtException', handleWorkerSafetyError);


// [NEW] — Centralized detached frame error detector (mirrors puppeteer_cheerio.js)
function isDetachedFrameError(error) {
  if (!error) return true; // undefined/null rejection — treat as page teardown
  if (!error.message) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('detached frame') ||
    msg.includes('attempted to use detached') ||
    msg.includes('session closed') ||
    msg.includes('target closed') ||
    msg.includes('execution context was destroyed') ||
    msg.includes('context was destroyed') ||
    msg.includes('cannot find context with specified id') ||
    msg.includes('frame was detached') ||
    msg.includes('page/frame is not ready') ||  // axe-core specific
    msg.includes('frame is not ready')
  );
}

// [NEW] — Page-ENVIRONMENT error detector: the page is alive, but its document
// denies an API to injected scripts — e.g. document.cookie throwing SecurityError
// ("Access is denied for this document") on an opaque-origin/sandboxed document,
// which WAF/bot-protection interstitials (Imperva/Incapsula CSP `sandbox`) serve.
// Confirmed in production on lexusofnorthmiami.com: ONE pillar hitting this killed
// the whole audit even though 6/8 sections had already completed.
function isPageEnvironmentError(error) {
  if (!error || !error.message) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('securityerror') ||
    msg.includes('access is denied for this document') ||
    msg.includes('permission denied to access property')
  );
}

// [NEW] — Safe metric wrapper
// Runs a metric service function. If a detached-frame error OR a page-environment
// denial (sandboxed/opaque document) occurs mid-metric, logs a warning and returns
// null for THAT section only — the audit continues and the section is excluded &
// renormalized ("Not Run") instead of the entire audit failing.
async function safeMetric(name, fn) {
  try {
    return await fn();
  } catch (err) {
    if (isDetachedFrameError(err)) {
      logger.warn(`[Worker] ${name} skipped due to detached frame during page evaluation — continuing audit with partial data.`);
      return null;
    }
    if (isPageEnvironmentError(err)) {
      logger.warn(`[Worker] ${name} skipped — the document denied a script API (${err.message.split('\n')[0]}). Likely a sandboxed WAF/bot-protection document; continuing audit with partial data.`);
      return null;
    }
    // Unexpected error — re-throw so the outer catch can handle it
    throw err;
  }
}

function logWorkerMetrics(contextName) {
  const mem = process.memoryUsage();
  const rssMB = (mem.rss / 1024 / 1024).toFixed(1);
  const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
  const cpu = process.cpuUsage();
  logger.info(`📊 [Worker Metrics - ${contextName}] Memory: RSS ${rssMB}MB, Heap ${heapUsedMB}MB | CPU: User ${(cpu.user/1000).toFixed(0)}ms, Sys ${(cpu.system/1000).toFixed(0)}ms`);
}

function withTimeout(promise, timeoutMs = 30000, pillarName = "Metric") {
  let timer;
  const timeoutPromise = new Promise((resolve) => {
    timer = setTimeout(() => {
      logger.warn(`⏱️ [Worker] Pillar "${pillarName}" timed out after ${timeoutMs}ms — returning partial result.`);
      resolve(null);
    }, timeoutMs);
  });

  return Promise.race([
    Promise.resolve(promise).then((res) => {
      clearTimeout(timer);
      return res;
    }).catch((err) => {
      clearTimeout(timer);
      throw err;
    }),
    timeoutPromise
  ]);
}

// Per-pillar timeouts (all env-tunable). Three pillars need their own, larger caps
// or they get killed mid-run and the section comes back null (an empty column):
//   • Technical Performance runs Google PageSpeed (~50-75s/page, more with a retry).
//   • On-Page SEO's scan on a heavy home page can run past the fast budget.
//   • Security/Compliance does ACTIVE probing (opens tabs to test XSS / weak creds /
//     finance forms, reputation-API calls, admin-path checks) — ~37s solo, and more
//     under the 8-pillar concurrent load, so 45s was clipping it on every page.
// The browser is held until the SLOWEST pillar (Technical, 150s) finishes anyway,
// so a bigger Security/SEO cap costs no extra browser-hold time. The remaining
// pillars are quick on-page checks and share PILLAR_TIMEOUT_MS.
const TECH_TIMEOUT_MS = parseInt(process.env.PILLAR_TECH_TIMEOUT_MS || "150000", 10);
const SEO_TIMEOUT_MS = parseInt(process.env.PILLAR_SEO_TIMEOUT_MS || "75000", 10);
const SEC_TIMEOUT_MS = parseInt(process.env.PILLAR_SEC_TIMEOUT_MS || "90000", 10);
const PILLAR_TIMEOUT_MS = parseInt(process.env.PILLAR_TIMEOUT_MS || "60000", 10);

// AI-forward weighting (July 2026 product decision, mirrors utils/sectionWeights.js):
// AIO+AEO ≈ 20 combined on customer-facing pages (AEO leads), funded by A11y/UX;
// transactional pages (trade/finance) stay ~16. Keep BOTH tables in sync.
const SECTION_WEIGHTS_BY_PAGE_TYPE = {
  home:    { tech: 18, seo: 18, a11y: 8,  sec: 12, ux: 10, conv: 14, aio: 8, aeo: 12 },
  srp:     { tech: 20, seo: 20, a11y: 7,  sec: 8,  ux: 11, conv: 14, aio: 8, aeo: 12 },
  vdp:     { tech: 18, seo: 18, a11y: 8,  sec: 8,  ux: 11, conv: 18, aio: 7, aeo: 12 },
  specials:{ tech: 15, seo: 16, a11y: 8,  sec: 13, ux: 11, conv: 17, aio: 8, aeo: 12 },
  lease:   { tech: 15, seo: 16, a11y: 8,  sec: 14, ux: 11, conv: 16, aio: 8, aeo: 12 },
  trade:   { tech: 14, seo: 12, a11y: 9,  sec: 16, ux: 11, conv: 22, aio: 7, aeo: 9 },
  finance: { tech: 14, seo: 12, a11y: 9,  sec: 22, ux: 9,  conv: 18, aio: 7, aeo: 9 },
  service: { tech: 16, seo: 16, a11y: 8,  sec: 10, ux: 11, conv: 19, aio: 8, aeo: 12 },
  about:   { tech: 14, seo: 16, a11y: 11, sec: 10, ux: 15, conv: 12, aio: 10,aeo: 12 },
  content: { tech: 14, seo: 22, a11y: 9,  sec: 9,  ux: 15, conv: 7,  aio: 10,aeo: 14 },
  generic: { tech: 18, seo: 17, a11y: 8,  sec: 12, ux: 11, conv: 14, aio: 8, aeo: 12 },
  // Corporate/OEM page types (siteType "corporate" — no per-vehicle lead flow of
  // its own, so Conversion weight drops and SEO/AEO — brand & answer-engine
  // visibility — rise). `locator`'s "conversion" is successfully finding a
  // dealer, so it keeps real Conversion weight tied to UX (map/store-finder
  // usability). `about`/`content` reuse the existing dealer rows above.
  models:  { tech: 18, seo: 20, a11y: 10, sec: 8,  ux: 14, conv: 10, aio: 9, aeo: 11 },
  locator: { tech: 16, seo: 14, a11y: 8,  sec: 8,  ux: 14, conv: 20, aio: 8, aeo: 12 },
  press:   { tech: 14, seo: 18, a11y: 10, sec: 8,  ux: 14, conv: 6,  aio: 10,aeo: 20 },
};

const OverAll = (A, B, C, D, E, F, G, H, pageType = "generic") => {
  const w = SECTION_WEIGHTS_BY_PAGE_TYPE[pageType] || SECTION_WEIGHTS_BY_PAGE_TYPE.generic;

  // A section score of null = "Not Run" (e.g. PageSpeed unavailable → Technical). It is
  // EXCLUDED from the overall and the remaining section weights are renormalized, rather
  // than counted as 0 — a measurement gap shouldn't be scored as a real failure.
  const parts = [
    { name: "Technical Performance", score: A, weight: w.tech },
    { name: "On-Page SEO", score: B, weight: w.seo },
    { name: "Accessibility", score: C, weight: w.a11y },
    { name: "Security/Compliance", score: D, weight: w.sec },
    { name: "UX & Content Structure", score: E, weight: w.ux },
    { name: "Conversion & Lead Flow", score: F, weight: w.conv },
    { name: "AIO Readiness", score: G, weight: w.aio },
    { name: "AEO", score: H, weight: w.aeo },
  ];

  let sum = 0, wsum = 0;
  for (const p of parts) {
    if (p.score === null || p.score === undefined) continue; // Not Run — renormalize out
    sum += p.score * p.weight;
    wsum += p.weight;
  }
  const total = wsum > 0 ? sum / wsum : 0;

  return {
    totalScore: Number(total.toFixed(1)),
    grade: gradeFor(total),
    sectionScores: parts.map((p) => ({ name: p.name, score: p.score ?? null })),
  };
};

// ── Reusable full-page audit ────────────────────────────────────────────────
// Runs ONE page's complete 8-pillar audit inside ONE freshly-launched browser.
// Puppeteer_Cheerio takes a global browser-pool permit, so however many of these
// run in parallel, the number of live browsers is hard-capped at
// MAX_CONCURRENT_BROWSERS (default 3). Every status update and section result is
// streamed through `emit(patch)`; the caller wires that to whichever report id
// this page belongs to (the parent for Stage 1, a per-page child report for
// Stage 2). Never throws — a dead/blocked page yields a graceful partial so one
// bad key page can't sink the batch.
async function auditOnePage({ url: pageUrl, device: dev, pageType: forcedType, auditId: pageAuditId, emit }) {
  const startedAt = performance.now();
  const send = typeof emit === "function" ? emit : () => {};
  let pageBrowser;

  // [PERF] Claim this page's PageSpeed call instead of starting it here. Stage 2a fired
  // PSI for EVERY key page the moment discovery named them (see prefetchPsiBatch below),
  // in parallel and while Stage 1 was still running — so for a key page this usually
  // resolves instantly rather than costing the pillar its ~50–75s. When the URL was never
  // prefetched (a page audited outside that flow) takePsiPrefetch just starts a fresh call
  // right here, which is exactly the old behaviour: still ahead of the browser work, so
  // the page-setup window (~2s clean, 10–30s behind a WAF) is still overlapped.
  const psiPrefetch = takePsiPrefetch(pageUrl, dev);

  try {
    const { browser: b, page, response, $, screenshot, isBotProtected } =
      await Puppeteer_Cheerio(pageUrl, dev, { auditId: pageAuditId, onProgress: send });
    pageBrowser = b;

    const screenshotUrl = screenshot ? `/api/screenshot/view/${pageAuditId}` : null;
    send({ screenshot, screenshotUrl, isBotProtected });

    // Page context lost (detached frame) or a hard bot-wall → graceful partial.
    if (!page || isBotProtected) {
      return {
        status: "completed",
        error: isBotProtected
          ? "Bot Protected: advanced bot detection (CAPTCHA/Cloudflare) blocked a full analysis."
          : "Audit completed with partial data — the page context was lost during the crawl.",
        score: 0,
        grade: "F",
        isBotProtected: !!isBotProtected,
        timeTaken: `${((performance.now() - startedAt) / 1000).toFixed(0)}s`,
      };
    }

    // Classify by where the browser actually landed (post-redirect), unless forced.
    let landed = pageUrl;
    try { const u = typeof page?.url === "function" ? page.url() : null; if (u) landed = u; } catch { /* keep */ }
    const pt = forcedType || classify(landed);

    // The 8 pillars, in parallel against this single page — same set + timeouts
    // as Stage 1. Each streams its own section the moment it lands.
    const [A_Res, B_Res, C_Res, D_Res, E_Res, F_Res, G_Res, aeoRes] = await Promise.all([
      (async () => { const r = await safeMetric("Technical Performance", () => withTimeout(technicalMetrics(pageUrl, dev, page, response, pageBrowser, pt, psiPrefetch), TECH_TIMEOUT_MS, "Technical Performance")); send({ technicalPerformance: r }); return r; })(),
      (async () => { const r = await safeMetric("On Page SEO", () => withTimeout(seoMetrics(pageUrl, $, page, pt), SEO_TIMEOUT_MS, "On Page SEO")); send({ onPageSEO: r, siteSchema: r?.Schema }); return r; })(),
      (async () => { const r = await safeMetric("Accessibility", () => withTimeout(accessibilityMetrics(page, $, pt), PILLAR_TIMEOUT_MS, "Accessibility")); send({ accessibility: r }); return r; })(),
      (async () => { const r = await safeMetric("Security/Compliance", () => withTimeout(securityCompliance(pageUrl, page, response, pageBrowser, pt), SEC_TIMEOUT_MS, "Security/Compliance")); send({ securityOrCompliance: r }); return r; })(),
      (async () => { const r = await safeMetric("UX & Content Structure", () => withTimeout(uxContentStructure(dev, page, pt), PILLAR_TIMEOUT_MS, "UX & Content Structure")); send({ UXOrContentStructure: r }); return r; })(),
      (async () => { const r = await safeMetric("Conversion & Lead Flow", () => withTimeout(conversionLeadFlow(page, $, pt), PILLAR_TIMEOUT_MS, "Conversion & Lead Flow")); send({ conversionAndLeadFlow: r }); return r; })(),
      (async () => { const r = await safeMetric("AIO Readiness", () => withTimeout(aioReadiness(pageUrl, page, $, pt), PILLAR_TIMEOUT_MS, "AIO Readiness")); send({ aioReadiness: r, aioCompatibilityBadge: r?.AIO_Compatibility_Badge }); return r; })(),
      (async () => { const r = await safeMetric("AEO", () => withTimeout(AEOService.runAudit(pageUrl, $, null, 100, { pageType: pt }), PILLAR_TIMEOUT_MS, "AEO")); send({ aeo: r }); return r; })(),
    ]);

    const overall = OverAll(
      A_Res?.Percentage ?? null, B_Res?.Percentage ?? null, C_Res?.Percentage ?? null, D_Res?.Percentage ?? null,
      E_Res?.Percentage ?? null, F_Res?.Percentage ?? null, G_Res?.Percentage ?? null, aeoRes?.Percentage ?? null,
      pt
    );

    return {
      status: "completed",
      pageType: pt,
      score: overall.totalScore,
      grade: overall.grade,
      sectionScore: overall.sectionScores,
      timeTaken: `${((performance.now() - startedAt) / 1000).toFixed(0)}s`,
    };
  } catch (err) {
    logger.warn(`[Worker] auditOnePage failed for ${pageUrl}: ${err?.message || err}`);
    return {
      status: "failed",
      error: err?.message || "Audit failed",
      score: 0,
      grade: "F",
      timeTaken: `${((performance.now() - startedAt) / 1000).toFixed(0)}s`,
    };
  } finally {
    if (pageBrowser) { try { await pageBrowser.close(); } catch { /* already closed */ } }
  }
}

// Set when Stage 1 fails. Discovery now runs in the background alongside Stage 1, so
// it can still be in flight when the audit dies — this stops it from registering child
// pages (which would sit "auditing…" forever) against an audit that already errored.
let auditAborted = false;

// ── Live key-page queue (Stage 2a producer → Stage 2b consumers) ──────────────
//
// [PERF] Discovery used to hand Stage 2b one finished array, so NOTHING could start
// until the LAST key page was known. On a site with no usable sitemap that meant the
// crawler had the full URL list after ~5s but the queue only opened ~23s later, because
// job creation sat behind a second browser render (the missing-key lookup).
//
// Now discovery pushes pages the moment it identifies them and Stage 2b's slots pull
// from here, so a page starts auditing as soon as a browser permit frees up. The global
// browser pool still hard-caps how many actually run — a slot that pulls a job simply
// blocks on its permit, which is exactly the "wait for a free browser" behaviour.
const keyPageQueue = {
  items: [],
  closed: false,
  waiters: [],
  total: 0,
  _wake() { this.waiters.splice(0).forEach((resolve) => resolve()); },
  push(jobs) {
    if (!jobs?.length || this.closed) return;
    this.items.push(...jobs);
    this.total += jobs.length;
    this._wake();
  },
  // No more pages are coming (discovery finished, or the audit died).
  close() { this.closed = true; this._wake(); },
  // Next page to audit, or null once the queue is closed AND drained.
  async next() {
    for (;;) {
      if (auditAborted) return null;
      if (this.items.length) return this.items.shift();
      if (this.closed) return null;
      await new Promise((resolve) => this.waiters.push(resolve));
    }
  },
};

// Stage 1 died / was gated (bot wall, lost page context, hard error) → stop Stage 2
// before it registers or audits pages for an audit that is already over.
const abortKeyPages = () => { auditAborted = true; keyPageQueue.close(); };

// 🔎 STAGE 2a — DISCOVERY. Find the site's key pages and register each one as an
// in-progress child report (childInit), so the audit-summary matrix can list every
// page as "auditing…" right away.
//
// This runs CONCURRENTLY with Stage 1 (see the main flow below): discovery is
// sitemap/link crawling and doesn't need Stage 1's result, so making the user wait
// for the first page's 8 pillars before even *finding* the key pages was dead time.
// It takes its own browser-pool permit, so Stage 1 (1 permit) + discovery (1 permit)
// stay inside MAX_CONCURRENT_BROWSERS.
//
// Returns the job list for Stage 2b; [] when nothing worth auditing was found.
async function discoverKeyPages(baseUrl, currentAuditId, device) {
  try {
    // The user narrowed the audit to the page they typed → nothing to discover.
    if (scopedExtraTypes && scopedExtraTypes.length === 0) {
      logger.info(`📍 [Stage 2a] Skipped — only the entered page was selected for ${baseUrl}`);
      return [];
    }

    logger.info(`🔎 [Stage 2a] Discovering key pages of ${baseUrl} (in parallel with Stage 1)...`);
    const discovered = await discoverPages(baseUrl, 40);

    const PAGE_LABELS = {
      vdp: "Vehicle Detail Page (VDP)",
      srp: "Inventory / SRP",
      service: "Service & Parts",
      trade: "Trade-In Tool",
      finance: "Financing / Credit App",
      specials: "Lease Specials / Offers",
      about: "About / Contact Us",
      content: "Content / Blog",
      home: "Home Page",
      generic: "Key Domain Page",
    };

    // Classify all discovered URLs
    const classified = (discovered || [])
      .filter((u) => u !== baseUrl)
      .map((u) => ({ url: u, type: classifyPageType(u) }));

    // Filter out excluded/generic pages (/login, /signup, /privacy), and anything
    // the user unticked in the page picker.
    const inScope = (type) => !scopeSet || scopeSet.has(type);
    const wantedPages = classified.filter((item) => item.type !== "generic" && inScope(item.type));

    // Select 1 representative URL per wanted category
    const categoryMap = {};
    for (const item of wantedPages) {
      if (!categoryMap[item.type]) {
        categoryMap[item.type] = item.url;
      }
    }

    // ── Release pages to Stage 2b AS THEY ARE IDENTIFIED ──────────────────────
    // `release` is the single place that turns a {url,type} into a job: it caps the run
    // at MAX_KEY_PAGES, de-dupes, prefetches PageSpeed, registers the child report (so
    // the row shows up on /audit-summary immediately) and hands the page to the audit
    // queue. Called once here with everything the crawl already found, and again after
    // the missing-key lookup — so nothing waits for the slowest discovery step.
    //
    // MAX_KEY_PAGES is the single biggest lever on audit cost: every key page is a
    // FULL Chromium render + 8-pillar pass (~12-14 CPU-s). Was hard-coded 6; the
    // default is now 3 (halves Stage 2 work). Set MAX_KEY_PAGES=6 to restore the old
    // breadth, or 0 to skip key pages entirely (Stage 1 / homepage only).
    const envKeyPages = parseInt(process.env.MAX_KEY_PAGES ?? "", 10);
    const MAX_KEY_PAGES = Number.isFinite(envKeyPages) && envKeyPages >= 0 ? envKeyPages : 3;
    const releasedUrls = new Set();
    let releasedCount = 0;
    const release = (entries) => {
      if (auditAborted) return [];
      const jobs = [];
      for (const { url: pageUrl, type } of entries) {
        if (releasedCount >= MAX_KEY_PAGES) break;
        if (!pageUrl || releasedUrls.has(pageUrl)) continue;
        releasedUrls.add(pageUrl);
        releasedCount++;
        jobs.push({
          childId: new mongoose.Types.ObjectId().toString(),
          url: pageUrl,
          type,
          label: PAGE_LABELS[type] || "Key Page",
        });
      }
      if (!jobs.length) return [];

      // PageSpeed needs nothing but the URL — fire before the browser work, as always.
      prefetchPsiBatch(jobs.map((j) => j.url), device);

      for (const j of jobs) {
        parentPort.postMessage({
          type: "childInit",
          parentAuditId: currentAuditId,
          child: { childId: j.childId, url: j.url, pageType: j.type, label: j.label, device },
        });
      }
      keyPageQueue.push(jobs);
      postProgress({
        stage2Progress: `Found ${releasedCount} key page(s) — auditing as browsers free up`,
        crawledPagesCount: releasedCount,
      });
      logger.info(`🔎 [Stage 2a] Released ${jobs.length} key page(s) to the audit queue (${releasedCount}/${MAX_KEY_PAGES} so far).`);
      return jobs;
    };

    const allJobs = [];
    allJobs.push(...release(Object.entries(categoryMap).map(([type, url]) => ({ url, type }))));

    // Ensure key automotive categories (VDP, Service, Trade, Specials) are present
    const missingKeys = ["vdp", "service", "trade", "specials"].filter((k) => !categoryMap[k] && inScope(k));

    // [PERF] …but only when there is still room for one. This lookup renders a whole
    // extra page in its own browser (measured 22.6s on a sitemap-less site) and the
    // categories it finds are appended LAST — so once 6 pages are already released,
    // everything it could discover would be cut by the 6-page cap anyway. Skipping it
    // then changes no result; it only stops us paying for a page we would discard.
    if (missingKeys.length > 0 && releasedCount < MAX_KEY_PAGES) {
      try {
        const targetSearchUrl = categoryMap["srp"] || baseUrl;
        const { browser: mkBrowser, $ } = await Puppeteer_Cheerio(targetSearchUrl, device, { auditId: currentAuditId });
        try {
          const allHrefs = $("a[href]")
            .toArray()
            .map((a) => $(a).attr("href"))
            .filter(Boolean);

          for (const href of allHrefs) {
            try {
              const full = href.startsWith("http") ? href : new URL(href, baseUrl).href;
              const t = classifyPageType(full);
              if (missingKeys.includes(t) && !categoryMap[t]) {
                categoryMap[t] = full;
                logger.info(`🚗 Discovered missing key page (${t}): ${full}`);
              }
            } catch {}
          }
        } finally {
          // [FIX] this browser was previously never closed — it leaked a Chromium
          // process and held a global browser-pool permit until the watchdog reclaimed it.
          if (mkBrowser) await mkBrowser.close().catch(() => {});
        }
      } catch (e) {
        logger.warn(`Could not extract missing key pages: ${e.message}`);
      }
    }

    // Anything the missing-key lookup just added (it appends to categoryMap, so the
    // dedupe in `release` skips everything already queued).
    allJobs.push(...release(Object.entries(categoryMap).map(([type, url]) => ({ url, type }))));

    // If still under 6 pages, backfill from remaining non-generic discovered pages.
    // Skipped once the user restricted the page types — backfilling would quietly
    // pull back in the very pages they unticked. Deliberately LAST: backfill depends on
    // how many real categories exist, so it can only be decided once discovery is done.
    if (releasedCount < MAX_KEY_PAGES && !scopeSet) {
      allJobs.push(...release(classified.map((item) => ({ url: item.url, type: item.type }))));
    }

    if (allJobs.length === 0) {
      logger.info(`📍 [Stage 2a] No additional internal URLs found for ${baseUrl}`);
      return [];
    }

    logger.info(`🔎 [Stage 2a] Discovery complete for ${baseUrl} — ${allJobs.length} key page(s) released.`);
    return allJobs;
  } catch (err) {
    logger.warn(`⚠️ [Stage 2a] Key-page discovery warning (non-fatal):`, err);
    return [];
  }
}

// 🚀 STAGE 2b — AUDIT. Run a FULL 8-pillar audit of each key page discovered above:
// one browser per page, 3 in flight (hard-capped by the global browser pool). Each
// key page fills in its OWN child report (created from the childInit above and
// finalized by childDone) so the summary page can list every page, roll them into a
// site score, and open each page's full report independently.
//
// [PERF] No longer waits for Stage 1, and no longer waits for discovery to FINISH: the
// slots below start as soon as the worker does and block on `keyPageQueue.next()` until
// discovery releases a page. What actually limits parallelism is the global browser pool
// — a slot that has a page but no free permit simply waits for one, which is precisely
// the "audit it when a browser frees up" behaviour we want.
async function auditKeyPages(currentAuditId, device) {
  try {
    logger.info(`📍 [Stage 2b] Key-page auditor started — one browser per page, pulling pages as discovery finds them (global cap ${process.env.MAX_CONCURRENT_BROWSERS || 3})...`);

    // One browser per page, CONCURRENCY pages IN FLIGHT at all times (rolling pool).
    // The global browser pool caps live browsers at MAX_CONCURRENT_BROWSERS regardless,
    // so this is the intended parallelism, not a second cap.
    //
    // This used to run in fixed chunks of 3 (`Promise.all` per chunk), which meant the
    // whole group waited for its SLOWEST page: two browsers sat idle — and two pool
    // permits stayed free — while the third finished. Now each slot pulls the next
    // queued page the instant its current page closes, so 3 audits are always running
    // until the queue drains.
    const CONCURRENCY = 3;
    let completed = 0;
    const results = [];

    // [KEEP] — If this domain is behind a bot challenge (Cloudflare/Imperva/etc.), solve
    // it ONCE and cache the clearance cookie, so all the Stage-2 key pages inject it and
    // skip their own challenge. Without this, each key page re-runs the timing-flaky
    // solve independently and some come back "Bot Protected" even though the homepage
    // passed — leaving the site only partially crawled. No-op (one ~200ms fetch) when the
    // site isn't protected, or instant when the Stage 1 warm-up already cached it.
    //
    // Probe a DEEP key page, not the homepage: Cloudflare commonly serves a cached
    // homepage at HTTP 200 while challenging deep paths (SRP/VDP/finance). Gating the
    // warm-up on the homepage would see 200, conclude "not protected", and skip — leaving
    // the deep pages to fail. cf_clearance is domain-scoped, so clearing ONE deep page
    // covers the whole domain (homepage included).
    //
    // This used to run between discovery and Stage 2b. Now that pages stream in, it runs
    // once against the first batch and EVERY slot awaits it before its first audit, so no
    // page can race ahead of the clearance.
    let clearanceOnce = null;
    const ensureClearanceForCrawl = (firstJob) => {
      if (!clearanceOnce) {
        const deepFirst = ["srp", "vdp", "finance", "trade", "specials", "service"];
        // Whatever else is already queued is fair game for picking a deep probe.
        const candidates = [firstJob, ...keyPageQueue.items];
        const probe = candidates.find((j) => deepFirst.includes(j.type)) || firstJob;
        clearanceOnce = ensureDomainClearance(probe.url, device)
          .catch((e) => { logger.warn(`⚠️ [WAF] Clearance warm-up skipped: ${e?.message || e}`); });
      }
      return clearanceOnce;
    };

    const runJob = async (j) => {
      // Stream this page's every status/section update straight to its own child report.
      const emit = (patch) => parentPort.postMessage({ type: "childProgress", childId: j.childId, patch });
      const res = await auditOnePage({ url: j.url, device, pageType: j.type, auditId: j.childId, emit });

      // Finalize the child report + fill in the parent's summary row for this page.
      parentPort.postMessage({
        type: "childDone",
        parentAuditId: currentAuditId,
        childId: j.childId,
        patch: res,
        summary: {
          url: j.url,
          pageType: res.pageType || j.type,
          label: j.label,
          reportId: j.childId,
          score: res.score ?? null,
          grade: res.grade ?? null,
          success: res.status === "completed",
          isBotProtected: !!res.isBotProtected,
          isProcessing: false,
          status: 200,
          title: j.label,
        },
      });

      completed++;
      // `keyPageQueue.total` grows as discovery releases more pages, so this reads
      // "3/5" and later "4/6" rather than pretending the final count is known up front.
      postProgress({ stage2Progress: `Full-audited ${completed}/${keyPageQueue.total} key pages` });
      results.push({ url: j.url, pageType: j.type, score: res.score ?? null, status: res.status });
    };

    // One pool slot: wait for a page, audit it, repeat until discovery closes the queue
    // and it is drained. auditOnePage never throws, but the guard keeps a messaging
    // failure from killing a slot (which would silently shrink the pool for the run).
    const poolSlot = async () => {
      for (;;) {
        const job = await keyPageQueue.next();
        if (!job) return;
        try {
          await ensureClearanceForCrawl(job);
          if (auditAborted) return;
          await runJob(job);
        } catch (e) {
          logger.warn(`⚠️ [Stage 2b] Key page failed outright (${job?.url}): ${e?.message || e}`);
        }
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, () => poolSlot()));

    logger.info(`✅ [Stage 2b] Completed full 8-pillar audits of ${results.length} key pages.`);
    return results;
  } catch (err) {
    logger.warn(`⚠️ [Stage 2b] Full-audit crawl warning (non-fatal):`, err);
    return [];
  }
}

(async () => {
  let browser;
  const start = performance.now();
  let currentAuditId = auditId;

  try {
    // [NEW] — WEBSITE EXISTENCE GATE (runs FIRST, BEFORE anything else)
    // Hit the URL with one lightweight HTTP GET. If the domain doesn't resolve
    // or the host refuses/drops the connection, there is no website to audit —
    // record the failure and STOP before launching Chromium or any metric.
    // A timeout/block/TLS error is treated as "exists" (fail open) so a slow or
    // bot-protected real site is never wrongly rejected. We keep the fetched
    // html/status to reuse for the dealership pre-check (no second round-trip).
    const existence = await checkWebsiteExists(url);
    if (!existence.exists) {
      logger.info(`🌐 Audit gated — website does not exist / unreachable: ${url} (${existence.errorCode})`);
      finish({
        status: "failed",
        error: `WEBSITE NOT FOUND — ${existence.reason}`,
        score: 0,
        grade: "F",
        timeTaken: `${((performance.now() - start) / 1000).toFixed(0)}s`,
      });
      return;
    }

    // [CHANGE] — Dealership detection check bypassed to allow auditing any website.
    // Set isDealership to true upfront so frontend knows it is allowed.
    postProgress({
      isDealership: true,
      dealershipDetection: null,
    });

    // ⚡ [PERF] Same trick for the page the user actually typed: start its PageSpeed call
    // HERE, before the WAF warm-up and the Chrome launch, rather than inside the Technical
    // pillar minutes later. Stage 1 was the one path still paying the full ~50–75s PSI wait
    // serially (auditOnePage already overlapped it for key pages). Only fired when Technical
    // Performance is actually part of this audit — a subset that excludes it must not burn
    // an API call.
    const runsTechnical = report === "All" || (requestedSections || []).includes("Technical Performance");
    // takePsiPrefetch (not startPsiPrefetch) so the call is owned by this scope and never
    // parked in the shared registry — nothing else audits the entered URL.
    const stage1Psi = runsTechnical ? takePsiPrefetch(url, device) : null;

    // [ADD] — Pre-solve any bot challenge on the landing page BEFORE the main render, so
    // even Stage 1 injects a cached clearance and passes reliably. The full render path's
    // resource-blocking + reload solve loop is timing-flaky and sometimes marks the
    // homepage itself "Bot Protected" (which aborts the whole audit — nothing crawls). A
    // clean navigate + quiet wait clears the challenge reliably and caches the domain
    // clearance for every page that follows. No-op (one ~200ms fetch) on unprotected sites.
    try { await ensureDomainClearance(url, device); }
    catch (e) { logger.warn(`⚠️ [WAF] Pre-Stage-1 clearance warm-up skipped: ${e?.message || e}`); }

    // 🔎 [PERF] Kick off key-page DISCOVERY + the Stage 2b auditor HERE — before Stage 1
    // even launches its browser. Discovery only ever needed the URL (it crawls the
    // sitemap/links itself), yet it used to start after Stage 1's render, and Stage 2b
    // started only once discovery had FINISHED. Measured on a sitemap-less site: the
    // crawler had the full URL list 4.8s in, but the first key page could not begin for
    // another ~23s. Now both run from the top and the browser pool decides the pacing.
    //
    // Only for a full audit — a single-section or subset run never crawls key pages, so
    // starting discovery there would burn a browser and a PageSpeed call for nothing.
    // Neither promise is awaited here; Stage 1 owns the critical path and both are
    // collected after it. `.catch` keeps a failure from surfacing as an unhandled
    // rejection (discoverKeyPages already swallows its own errors and returns []).
    const runsKeyPages = report === "All";
    const discoveryPromise = runsKeyPages
      ? discoverKeyPages(url, currentAuditId, device)
        .catch((e) => { logger.warn(`⚠️ [Stage 2a] Discovery rejected: ${e?.message || e}`); return []; })
        // Whatever happened, no more pages are coming — let the Stage 2b slots finish.
        .finally(() => keyPageQueue.close())
      : null;
    const keyPagesPromise = runsKeyPages ? auditKeyPages(currentAuditId, device) : null;

    const { browser: b, page, response, $, screenshot, isBotProtected } = await Puppeteer_Cheerio(url, device, { auditId: currentAuditId, onProgress: postProgress });
    browser = b;
    const screenshotUrl = screenshot ? `/api/screenshot/view/${currentAuditId}` : null;
    postProgress({ screenshot, screenshotUrl, isBotProtected });

    // [NEW] — Guard: if page is null (Puppeteer_Cheerio returned a partial result due to
    // a top-level detached frame), complete audit gracefully with zero scores
    if (!page) {
      logger.warn(`[Worker] page is null after Puppeteer_Cheerio — frame detached during crawl. Completing audit with partial data.`);
      // Discovery/Stage 2b are already running (they start before this render). Stop them
      // here or they would keep registering "auditing…" child pages under a dead audit.
      abortKeyPages();
      finish({
        status: "completed",
        error: "Audit completed with partial data — page context was lost due to a frame detachment event.",
        score: 0,
        grade: "F",
        timeTaken: `${((performance.now() - start) / 1000).toFixed(0)}s`
      });
      return;
    }

    if (isBotProtected) {
      logger.info(`🛡️ Marking report as Bot Protected: ${url}`);
      abortKeyPages();
      finish({
        status: "completed",
        error: "Bot Protected: This site is using advanced bot detection (CAPTCHA/Cloudflare). Only partial analysis was possible.",
        score: 0,
        grade: "F",
        timeTaken: `${((performance.now() - start) / 1000).toFixed(0)}s`
      });
      return;
    }

    // Fallback dealership gate removed.

    // Page type drives the per-section weighting of the page score (spec §5.6).
    // Use the post-redirect URL (page.url()) so a /finance → /credit-app redirect
    // is classified by where the browser actually landed.
    let finalUrl = url;
    try { const u = typeof page?.url === "function" ? page.url() : null; if (u) finalUrl = u; } catch { /* keep url */ }
    const pageType = classify(finalUrl);

    // ── Custom subset (2–6 sections chosen via the checklist) ──
    // Run only the selected metrics in parallel — each streams its own section the
    // moment it lands (like the full audit), then we roll the selected scores up to
    // a combined score/grade. A single section still uses the focused path below.
    if (isSubset) {
      // One runner per section: runs the metric, streams its result, returns the
      // field name + percentage so we can build the final patch + score rollup.
      const sectionRunners = {
        "Technical Performance": async () => {
          const r = await safeMetric("Technical Performance", () => technicalMetrics(url, device, page, response, browser, pageType, stage1Psi));
          postProgress({ technicalPerformance: r });
          return { field: "technicalPerformance", value: r, pct: r?.Percentage ?? null };
        },
        "On Page SEO": async () => {
          const r = await safeMetric("On Page SEO", () => seoMetrics(url, $, page, pageType));
          postProgress({ onPageSEO: r, siteSchema: r?.Schema });
          return { field: "onPageSEO", value: r, pct: r?.Percentage ?? null, extra: { siteSchema: r?.Schema } };
        },
        "Accessibility": async () => {
          const r = await safeMetric("Accessibility", () => accessibilityMetrics(page, $, pageType));
          postProgress({ accessibility: r });
          return { field: "accessibility", value: r, pct: r?.Percentage ?? null };
        },
        "Security/Compliance": async () => {
          const r = await safeMetric("Security/Compliance", () => securityCompliance(url, page, response, browser, pageType));
          postProgress({ securityOrCompliance: r });
          return { field: "securityOrCompliance", value: r, pct: r?.Percentage ?? null };
        },
        "UX & Content Structure": async () => {
          const r = await safeMetric("UX & Content Structure", () => uxContentStructure(device, page, pageType));
          postProgress({ UXOrContentStructure: r });
          return { field: "UXOrContentStructure", value: r, pct: r?.Percentage ?? null };
        },
        "Conversion & Lead Flow": async () => {
          const r = await safeMetric("Conversion & Lead Flow", () => conversionLeadFlow(page, $, pageType));
          postProgress({ conversionAndLeadFlow: r });
          return { field: "conversionAndLeadFlow", value: r, pct: r?.Percentage ?? null };
        },
        "AIO (AI-Optimization) Readiness": async () => {
          const r = await safeMetric("AIO Readiness", () => aioReadiness(url, page, $, pageType));
          postProgress({ aioReadiness: r, aioCompatibilityBadge: r?.AIO_Compatibility_Badge });
          return { field: "aioReadiness", value: r, pct: r?.Percentage ?? null, extra: { aioCompatibilityBadge: r?.AIO_Compatibility_Badge } };
        },
        "AEO (Answer Engine Optimization)": async () => {
          // AEO is a TOP-LEVEL `aeo` section field; headline is the spec-weighted Percentage.
          const r = await safeMetric("AEO", () => AEOService.runAudit(url, $, null, 100, { pageType }));
          postProgress({ aeo: r });
          return { field: "aeo", value: r, pct: r?.Percentage ?? null };
        },
      };

      const selected = requestedSections.filter((s) => sectionRunners[s]);
      const results = (await Promise.all(selected.map((s) => sectionRunners[s]())));

      const updateData = {
        status: "completed",
        timeTaken: `${((performance.now() - start) / 1000).toFixed(0)}s`,
      };
      
      const w = SECTION_WEIGHTS_BY_PAGE_TYPE[pageType] || SECTION_WEIGHTS_BY_PAGE_TYPE.generic;
      const keyMap = {
        "Technical Performance": "tech",
        "On Page SEO": "seo",
        "Accessibility": "a11y",
        "Security/Compliance": "sec",
        "UX & Content Structure": "ux",
        "Conversion & Lead Flow": "conv",
        "AIO (AI-Optimization) Readiness": "aio",
        "AEO (Answer Engine Optimization)": "aeo"
      };

      let sumOfScoresTimesWeights = 0;
      let sumOfWeights = 0;
      const sectionScores = [];
      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        if (!res) continue;
        updateData[res.field] = res.value;
        if (res.extra) Object.assign(updateData, res.extra);
        
        const weightKey = keyMap[selected[i]];
        const weightVal = w[weightKey] || 0;
        const name = SECTION_DISPLAY_NAMES[selected[i]] || selected[i];
        // null pct = "Not Run" (e.g. PageSpeed unavailable) — excluded from the weighted
        // average and renormalized, not counted as 0.
        if (res.pct === null || res.pct === undefined) {
          sectionScores.push({ name, score: null });
          continue;
        }
        sumOfScoresTimesWeights += res.pct * weightVal;
        sumOfWeights += weightVal;
        sectionScores.push({ name, score: res.pct });
      }
      const avg = sumOfWeights > 0 ? sumOfScoresTimesWeights / sumOfWeights : 0;
      updateData.score = Number(avg.toFixed(1));
      updateData.grade = gradeFor(avg);
      updateData.sectionScore = sectionScores;

      const notRunSections = sectionScores.filter((s) => s.score === null).map((s) => s.name);
      if (notRunSections.length) {
        logger.warn(`[Overall] ${notRunSections.length} section(s) Not Run — excluded & renormalized: ${notRunSections.join(", ")} | overall=${updateData.score} (${url})`);
      }

      finish(updateData);
      logger.info(`🧠 Worker Completed (subset: ${selected.join(", ")}) for URL: ${url}`);
      return;
    }

    if (report !== "All") {
      let result;

      // [NEW] — Each metric wrapped in safeMetric() to catch detached frame errors
      switch (report) {
        case "Technical Performance":
          result = await safeMetric("Technical Performance", () => technicalMetrics(url, device, page, response, browser, pageType, stage1Psi));
          break;
        case "On Page SEO":
          result = await safeMetric("On Page SEO", () => seoMetrics(url, $, page, pageType));
          break;
        case "Accessibility":
          result = await safeMetric("Accessibility", () => accessibilityMetrics(page, $, pageType));
          break;
        case "Security/Compliance":
          result = await safeMetric("Security/Compliance", () => securityCompliance(url, page, response, browser, pageType));
          break;
        case "UX & Content Structure":
          result = await safeMetric("UX & Content Structure", () => uxContentStructure(device, page, pageType));
          break;
        case "Conversion & Lead Flow":
          result = await safeMetric("Conversion & Lead Flow", () => conversionLeadFlow(page, $, pageType));
          break;
        case "AIO (AI-Optimization) Readiness":
          result = await safeMetric("AIO Readiness", () => aioReadiness(url, page, $, pageType));
          break;
        case "AEO (Answer Engine Optimization)":
          result = await safeMetric("AEO", () => AEOService.runAudit(url, $, null, 100, { pageType }));
          break;
      }

      const timeTaken = ((performance.now() - start) / 1000).toFixed(0);

      const score = result?.Percentage || 0;
      const grade = score >= 90 ? "A+" :
        score >= 80 ? "A" :
          score >= 70 ? "B" :
            score >= 60 ? "C" :
              score >= 50 ? "D" : "F";

      const updateData = {
        status: "completed",
        timeTaken: `${timeTaken}s`,
        score: score,
        grade: grade,
      };

      if (report === "Technical Performance") updateData.technicalPerformance = result;
      if (report === "On Page SEO") {
        updateData.onPageSEO = result;
        updateData.siteSchema = result?.Schema;
      }
      if (report === "Accessibility") updateData.accessibility = result;
      if (report === "Security/Compliance") updateData.securityOrCompliance = result;
      if (report === "UX & Content Structure") updateData.UXOrContentStructure = result;
      if (report === "Conversion & Lead Flow") updateData.conversionAndLeadFlow = result;
      if (report === "AIO (AI-Optimization) Readiness") {
        updateData.aioReadiness = result;
        updateData.aioCompatibilityBadge = result?.AIO_Compatibility_Badge;
      }
      // AEO is its own top-level `aeo` section field; its headline is the spec-weighted Percentage.
      if (report === "AEO (Answer Engine Optimization)") {
        updateData.aeo = result;
      }

      finish(updateData);

      logger.info(`🧠 Worker Completed for URL: ${url}`);
      return;
    }

    // (Discovery + the Stage 2b auditor were started before this render — see above.)
    logger.info(`⚡ [Stage 1] Running all 8 audit pillars concurrently in parallel against single browser instance for: ${url}`);
    logWorkerMetrics("Stage 1 Start");

    const [A_Res, B_Res, C_Res, D_Res, E_Res, F_Res, G_Res, aeoRes] = await Promise.all([
      (async () => {
        const r = await safeMetric("Technical Performance", () => withTimeout(technicalMetrics(url, device, page, response, browser, pageType, stage1Psi), TECH_TIMEOUT_MS, "Technical Performance"));
        postProgress({ technicalPerformance: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("On Page SEO", () => withTimeout(seoMetrics(url, $, page, pageType), SEO_TIMEOUT_MS, "On Page SEO"));
        postProgress({ onPageSEO: r, siteSchema: r?.Schema });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("Accessibility", () => withTimeout(accessibilityMetrics(page, $, pageType), PILLAR_TIMEOUT_MS, "Accessibility"));
        postProgress({ accessibility: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("Security/Compliance", () => withTimeout(securityCompliance(url, page, response, browser, pageType), SEC_TIMEOUT_MS, "Security/Compliance"));
        postProgress({ securityOrCompliance: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("UX & Content Structure", () => withTimeout(uxContentStructure(device, page, pageType), PILLAR_TIMEOUT_MS, "UX & Content Structure"));
        postProgress({ UXOrContentStructure: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("Conversion & Lead Flow", () => withTimeout(conversionLeadFlow(page, $, pageType), PILLAR_TIMEOUT_MS, "Conversion & Lead Flow"));
        postProgress({ conversionAndLeadFlow: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("AIO Readiness", () => withTimeout(aioReadiness(url, page, $, pageType), PILLAR_TIMEOUT_MS, "AIO Readiness"));
        postProgress({ aioReadiness: r, aioCompatibilityBadge: r?.AIO_Compatibility_Badge });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("AEO", () => withTimeout(AEOService.runAudit(url, $, null, 100, { pageType }), PILLAR_TIMEOUT_MS, "AEO"));
        postProgress({ aeo: r });
        return r;
      })(),
    ]);

    logWorkerMetrics("Stage 1 Complete");

    // Extract percentages for overall score calculation
    // `?? null` (not `|| 0`) so a "Not Run" section (null Percentage) is excluded and
    // renormalized in OverAll rather than counted as a real 0. A legit 0 is preserved.
    const A = A_Res?.Percentage ?? null;
    const B = B_Res?.Percentage ?? null;
    const C = C_Res?.Percentage ?? null;
    const D = D_Res?.Percentage ?? null;
    const E = E_Res?.Percentage ?? null;
    const F = F_Res?.Percentage ?? null;
    const G = G_Res?.Percentage ?? null;
    const H = aeoRes?.Percentage ?? null;

    const overall = OverAll(A, B, C, D, E, F, G, H, pageType);

    // Surface any "Not Run" sections so the overall-score math is auditable — these were
    // renormalized out (not counted as 0). Pairs with the [PageSpeed]/[Technical] trail.
    const notRunSections = overall.sectionScores.filter((s) => s.score === null).map((s) => s.name);
    if (notRunSections.length) {
      logger.warn(`[Overall] ${notRunSections.length} section(s) Not Run — excluded & renormalized: ${notRunSections.join(", ")} | overall=${overall.totalScore} (${url})`);
    }

    const timeTaken = ((performance.now() - start) / 1000).toFixed(0);

    // Emit Stage 1 completion progress update so initial single-page scores populate on screen immediately
    postProgress({
      stage1Completed: true,
      score: overall.totalScore,
      grade: overall.grade,
      sectionScore: overall.sectionScores,
      message: "Stage 1 initial page complete — launching Stage 2 3-Puppeteer crawl of remaining pages...",
    });

    // Close Stage 1 single page browser before spawning Stage 2 parallel workers
    if (browser) {
      try { await browser.close(); } catch { }
      browser = null;
    }

    logger.info(`🧠 [Stage 1] Completed for URL: ${url}. Stage 2 key pages have been auditing alongside it...`);

    // 🚀 Stage 2b has been pulling pages since the top of the run; Stage 1 releasing its
    // browser just widens the pool. Wait for discovery to name every page, then for the
    // auditor to drain the queue.
    await discoveryPromise;
    const stage2Results = (await keyPagesPromise) || [];

    const finalTimeTaken = ((performance.now() - start) / 1000).toFixed(0);

    finish({
      status: "completed",
      timeTaken: `${finalTimeTaken}s`,
      score: overall.totalScore,
      grade: overall.grade,
      sectionScore: overall.sectionScores,
      stage1Completed: true,
      stage2Completed: true,
      crawledPagesCount: stage2Results ? stage2Results.length : 0,
      // crawledPagesSummary is owned by the main thread (assembled from each key
      // page's child report via childInit/childDone) — do NOT send it here or it
      // would clobber the per-page reportId/score rows the controller built.
    });

  } catch (err) {
    // Tell any still-running background discovery to drop its findings — and the Stage 2b
    // slots to stop pulling — before they register key pages under an audit that failed.
    abortKeyPages();
    // Report the failure to the main thread; it owns persistence.
    parentPort.postMessage({ type: "error", auditId: currentAuditId, error: err.message });

  } finally {
    if (browser) {
      try { await browser.close(); } catch { }
    }
    // Any PSI response prefetched for a page that never got audited (audit failed
    // mid-flight, page skipped) is a multi-MB Lighthouse JSON pinned in memory — drop it.
    clearPsiPrefetch();
  }
})();
