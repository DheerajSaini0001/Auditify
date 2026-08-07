import { workerData, parentPort } from "worker_threads";
import crypto from "crypto";

import technicalMetrics from "../metricServices/technicalMetrics.js";
import seoMetrics from "../metricServices/seoMetrics.js";
import accessibilityMetrics from "../metricServices/accessibilityMetrics.js";
import securityCompliance from "../metricServices/securityCompliance.js";
import uxContentStructure from "../metricServices/uxContentStructure.js";
import conversionLeadFlow from "../metricServices/conversionLeadFlow.js";
import aioReadiness from "../metricServices/aioReadiness.js";
import AEOService from "../metricServices/aeoService.js";
import Puppeteer_Cheerio, { ensureDomainClearance, closeSharedBrowser } from "../utils/puppeteer_cheerio.js";
import { prefetchPsiBatch, takePsiPrefetch, clearPsiPrefetch } from "../utils/psiPrefetch.js";
import discoverPages from "../utils/sitemapCrawler.js";
import { checkWebsiteExists } from "../utils/fastFetch.js";
import { performance } from "perf_hooks";
import logger from "../utils/logger.js";
import { classifyPageType, classifyServicePageType } from "../utils/pageClassifier.js";
import { applyWorkerConfig } from "../utils/workerConfig.js";
import { siteWeightMultipliers, keyPagesFor, MAX_CRAWL_PAGES } from "../config/siteTypeProfiles.js";
import { weightsForPageType } from "../utils/sectionWeights.js";
import { resolveMarket } from "../utils/marketResolver.js";

const { url, device, report, auditId, pageType: initialPageType, siteType, siteSubType, pageScopes, market: selectedMarket, config: workerConfig } = workerData;

// ── Market resolution (utils/marketResolver.js) ──────────────────────────────
// Resolved BEFORE any pillar runs and never re-decided afterwards, because the
// market chooses which reference lists every check grades against — letting it
// change mid-run would mean two pages of the same audit scored against different
// norms. An explicit selection is decisive on its own, so this first pass needs
// no page content and there is no window where a pillar could see the wrong one.
//
// `refineMarket` is called once the landing page's DOM is available. It cannot
// change `market` when the visitor picked one; it exists to fill in the page
// SIGNALS, which is what turns a selection/page mismatch into the unlocalised-
// template finding rather than a silent override.
let marketInfo = resolveMarket({ url, selected: selectedMarket });
const market = marketInfo.market;

const refineMarket = ($) => {
  if (!$) return marketInfo;
  try {
    const refined = resolveMarket({ url, $, selected: selectedMarket });
    // Guard the invariant above: only ever adopt a refinement that agrees with
    // the market the pillars have already been scoring against.
    if (refined.market === market) marketInfo = refined;
    else marketInfo = { ...refined, market, locale: marketInfo.locale };
  } catch (err) {
    logger.warn(`🌏 [Worker] Market signal collection failed: ${err.message}`);
  }
  return marketInfo;
};

logger.info(`🌏 [Worker] Scoring against ${market} norms (${marketInfo.source}, ${marketInfo.confidence} confidence).`);

// Seed this thread's configService cache from the main thread's snapshot BEFORE
// any metric service runs — googleAPI (PageSpeed) and securityCompliance read
// their keys the moment they're called. Worker threads never run
// configService.initialize(), so without this their cache stays empty and every
// getConfig() falls through to process.env, which the container has nothing in.
// Logs key NAMES only, never values.
const seededConfigKeys = applyWorkerConfig(workerConfig);
if (seededConfigKeys.length) {
  logger.info(`🔑 [Worker] Platform config seeded from main thread: ${seededConfigKeys.join(", ")}`);
} else {
  logger.warn(`🔑 [Worker] No platform config received — API-backed checks (PageSpeed, Safe Browsing, VirusTotal) will fall back to process.env and may not run.`);
}

// Which page types the user ticked in the home-page picker. `null` = no restriction
// (audit whatever discovery finds, the original behaviour). A non-empty list means
// Stage 2 may only audit those types; "home" is the URL the user typed, so a
// selection of just ["home"] skips Stage 2 entirely — exactly one page is audited.
const scopeSet = Array.isArray(pageScopes) && pageScopes.length ? new Set(pageScopes) : null;
const scopedExtraTypes = scopeSet ? [...scopeSet].filter((k) => k !== "home") : null;
// Service/repair sites sell labour, not vehicles, and run a completely different
// page set (booking, service menu, pricing, locations), so they get their own
// taxonomy. Everything else — dealer, corporate/OEM, and "unknown"/unset —
// classifies against the dealer taxonomy.
//
// Corporate used to classify with classifyCorporatePageType (models/locator/press).
// It no longer does: its crawl plan in config/siteTypeProfiles.js is now the
// franchise retail funnel, and the corporate classifier cannot emit any of those
// keys, so keeping it would have matched nothing and audited the home page alone.
const classify =
  siteType === "service" ? classifyServicePageType
    : classifyPageType;
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

// Per-pillar timeouts (all env-tunable). Baseline is 150s; the two heavy pillars —
// Technical and Accessibility — get 300s.
//
// They used to be tiered — 150s Technical / 90s Security / 75s SEO / 60s for the
// rest — on the theory that only those three were slow. That theory kept clipping
// the pillars left on the 60s default, and a clipped pillar is not a degraded
// pillar: withTimeout resolves null, so the whole section comes back empty and the
// audit summary renders "—" for it. Accessibility was the clearest victim — it runs
// axe-core over the entire DOM across the wcag2a…wcag22aa + best-practice +
// experimental + ACT rulesets, easily the heaviest in-page work in the audit, yet it
// sat on the smallest budget. On the 2-vCPU App Service that hosts production, with
// all 8 pillars competing, 60s is not enough headroom — and on a heavy DOM neither
// is 150s, so axe and Technical (whose PageSpeed ladder dominates the audit) sit on
// the heavy cap while the six pillars that comfortably land inside 150s keep the
// baseline.
//
// Raising a cap costs no extra audit wall-clock on a healthy site: the pillars run
// concurrently and the browser is held until the SLOWEST one finishes, so the hold
// is one pillar's worth, not the sum. What changes is the worst case — a genuinely
// stuck Technical/Accessibility waits the full cap before returning null. That is
// why browserManager's BROWSER_SLOT_MAX_HOLD_MS is lifted alongside it: left low,
// the pool watchdog reclaims a permit that a legitimate slow audit is still using,
// letting a second Chromium launch beside a live one.
//
// Keep PILLAR_TECH_TIMEOUT_MS ≥ googleAPI's PAGESPEED_TOTAL_BUDGET_MS (180s as of
// 2026-08-07, one attempt, no retries) so the PageSpeed call still fits inside its
// own pillar. Note the converse: extra Technical headroom only buys PageSpeed more
// time if PAGESPEED_TOTAL_BUDGET_MS is raised too — otherwise the call gives up at
// its own deadline and the surplus goes to Technical's own on-page work (the asset
// and delivery checks, which now run BEFORE PageSpeed is awaited).
const PILLAR_BASE_TIMEOUT_MS = "150000";
const PILLAR_HEAVY_TIMEOUT_MS = "300000";
// [2026-08-07] Technical gets its own, larger cap — and unlike every other pillar
// timeout, raising this one no longer costs browser-pool time. technicalMetrics now
// releases the page before it awaits PageSpeed (its phase 1 / phase 2 split), so the
// only thing this cap holds open is a pending fetch. It has to clear
// PAGESPEED_TOTAL_BUDGET_MS (280s) PLUS phase 1's on-page work, or Technical is killed
// moments before PageSpeed lands — the exact failure this change exists to remove.
//
// Accessibility deliberately stays on the smaller heavy cap: axe DOES hold the browser
// for its whole run, so its ceiling is still a pool cost.
const PILLAR_TECH_DEFAULT_MS = "380000";
const TECH_TIMEOUT_MS = parseInt(process.env.PILLAR_TECH_TIMEOUT_MS || PILLAR_TECH_DEFAULT_MS, 10);
const A11Y_TIMEOUT_MS = parseInt(process.env.PILLAR_A11Y_TIMEOUT_MS || PILLAR_HEAVY_TIMEOUT_MS, 10);
const SEO_TIMEOUT_MS = parseInt(process.env.PILLAR_SEO_TIMEOUT_MS || PILLAR_BASE_TIMEOUT_MS, 10);
const SEC_TIMEOUT_MS = parseInt(process.env.PILLAR_SEC_TIMEOUT_MS || PILLAR_BASE_TIMEOUT_MS, 10);
const PILLAR_TIMEOUT_MS = parseInt(process.env.PILLAR_TIMEOUT_MS || PILLAR_BASE_TIMEOUT_MS, 10);

// Page tilt comes from utils/sectionWeights.js — the single copy. This file used
// to carry a byte-identical duplicate under a slightly different vocabulary
// (`trade`/`specials` rather than `tradein`/`offers`, matching its own
// classifier), aligned by a "keep BOTH tables in sync" comment in each file.
// weightsForPageType() resolves either vocabulary, so the duplicate is gone.

const OverAll = (A, B, C, D, E, F, G, H, pageType = "generic") => {
  // [Tech, OnPage, A11y, Security, UX, Conversion, AIO, AEO] — SECTION_ORDER.
  const w = weightsForPageType(pageType);

  // The page tilt says what kind of PAGE this is; the site profile says what
  // kind of BUSINESS runs it (a repair shop lives on AEO and barely touches
  // finance compliance; a franchise dealer is the reverse). They multiply.
  // `null` for corporate/unresolved sites, in which case the page tilt stands
  // alone exactly as it did before site sub-types existed.
  const m = siteWeightMultipliers(siteSubType) || [1, 1, 1, 1, 1, 1, 1, 1];

  // A section score of null = "Not Run" (e.g. PageSpeed unavailable → Technical). It is
  // EXCLUDED from the overall and the remaining section weights are renormalized, rather
  // than counted as 0 — a measurement gap shouldn't be scored as a real failure.
  const parts = [
    { name: "Technical Performance", score: A, weight: w[0] * m[0] },
    { name: "On-Page SEO", score: B, weight: w[1] * m[1] },
    { name: "Accessibility", score: C, weight: w[2] * m[2] },
    { name: "Security/Compliance", score: D, weight: w[3] * m[3] },
    { name: "UX & Content Structure", score: E, weight: w[4] * m[4] },
    { name: "Conversion & Lead Flow", score: F, weight: w[5] * m[5] },
    { name: "AIO Readiness", score: G, weight: w[6] * m[6] },
    { name: "AEO", score: H, weight: w[7] * m[7] },
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
    //
    // [PERF] Technical runs apart from the other seven (same split as Stage 1): it waits
    // on PageSpeed (~50–75s), so the seven-pillar provisional below makes this page's
    // report viewable early; the final rollup replaces it when PageSpeed lands.
    // Same page/PageSpeed split as Stage 1 — a key page holds a browser slot too, and
    // Stage 2 runs several of them at once, so releasing early matters more here.
    let signalTechPageReleased;
    const techPageReleased = new Promise((resolve) => { signalTechPageReleased = resolve; });
    const techPromise = (async () => { const r = await safeMetric("Technical Performance", () => withTimeout(technicalMetrics(pageUrl, dev, page, response, pageBrowser, pt, psiPrefetch, siteSubType, market, signalTechPageReleased), TECH_TIMEOUT_MS, "Technical Performance")); send({ technicalPerformance: r }); return r; })();
    techPromise.finally(() => signalTechPageReleased());
    const [B_Res, C_Res, D_Res, E_Res, F_Res, G_Res, aeoRes] = await Promise.all([
      (async () => { const r = await safeMetric("On Page SEO", () => withTimeout(seoMetrics(pageUrl, $, page, pt, siteSubType, market), SEO_TIMEOUT_MS, "On Page SEO")); send({ onPageSEO: r, siteSchema: r?.Schema }); return r; })(),
      (async () => { const r = await safeMetric("Accessibility", () => withTimeout(accessibilityMetrics(page, $, pt, market, siteSubType), A11Y_TIMEOUT_MS, "Accessibility")); send({ accessibility: r }); return r; })(),
      (async () => { const r = await safeMetric("Security/Compliance", () => withTimeout(securityCompliance(pageUrl, page, response, pageBrowser, pt, siteSubType, market), SEC_TIMEOUT_MS, "Security/Compliance")); send({ securityOrCompliance: r }); return r; })(),
      (async () => { const r = await safeMetric("UX & Content Structure", () => withTimeout(uxContentStructure(dev, page, pt, siteSubType, market), PILLAR_TIMEOUT_MS, "UX & Content Structure")); send({ UXOrContentStructure: r }); return r; })(),
      (async () => { const r = await safeMetric("Conversion & Lead Flow", () => withTimeout(conversionLeadFlow(page, $, pt, siteSubType, market), PILLAR_TIMEOUT_MS, "Conversion & Lead Flow")); send({ conversionAndLeadFlow: r }); return r; })(),
      (async () => { const r = await safeMetric("AIO Readiness", () => withTimeout(aioReadiness(pageUrl, page, $, pt, siteSubType, market), PILLAR_TIMEOUT_MS, "AIO Readiness")); send({ aioReadiness: r, aioCompatibilityBadge: r?.AIO_Compatibility_Badge }); return r; })(),
      (async () => { const r = await safeMetric("AEO", () => withTimeout(AEOService.runAudit(pageUrl, $, null, 100, { pageType: pt, siteSubType, market }), PILLAR_TIMEOUT_MS, "AEO")); send({ aeo: r }); return r; })(),
    ]);

    // Seven pillars in — publish this page's provisional rollup (Technical renormalized
    // out) so its child report opens before PageSpeed answers. stage1Completed is the
    // same "provisional data is showable" gate the frontend uses for the parent.
    const provisional = OverAll(
      null, B_Res?.Percentage ?? null, C_Res?.Percentage ?? null, D_Res?.Percentage ?? null,
      E_Res?.Percentage ?? null, F_Res?.Percentage ?? null, G_Res?.Percentage ?? null, aeoRes?.Percentage ?? null,
      pt
    );
    send({
      stage1Completed: true,
      psiPending: true,
      score: provisional.totalScore,
      grade: provisional.grade,
      sectionScore: provisional.sectionScores,
    });

    // Release this key page's browser the moment Technical is done with the page, so a
    // slow PageSpeed call no longer occupies a pool permit. The `finally` below still
    // closes it — closing twice is a guarded no-op.
    await techPageReleased;
    if (pageBrowser) {
      try { await pageBrowser.close(); } catch { /* already closed */ }
      pageBrowser = null;
    }

    const A_Res = await techPromise;

    const overall = OverAll(
      A_Res?.Percentage ?? null, B_Res?.Percentage ?? null, C_Res?.Percentage ?? null, D_Res?.Percentage ?? null,
      E_Res?.Percentage ?? null, F_Res?.Percentage ?? null, G_Res?.Percentage ?? null, aeoRes?.Percentage ?? null,
      pt
    );

    return {
      status: "completed",
      pageType: pt,
      psiPending: false,
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
      lease: "Lease Specials",
      specials: "Offers & Specials",
      about: "About / Contact Us",
      content: "Content / Blog",
      home: "Home Page",
      generic: "Key Domain Page",
      // Corporate/OEM taxonomy
      models: "Models & Lineup",
      locator: "Dealer Locator",
      press: "Press & News",
      // Service/repair taxonomy
      booking: "Book / Appointment",
      pricing: "Pricing & Quotes",
      locations: "Locations",
    };

    // Classify all discovered URLs
    const classified = (discovered || [])
      .filter((u) => u !== baseUrl)
      .map((u) => ({ url: u, type: classify(u) }));

    // Which pages, and in what order, for THIS kind of business — see
    // config/siteTypeProfiles.js. This ordering is the whole point of the cap:
    // the slots used to go to whichever categories the crawler happened to
    // surface first, so a dealer could spend all of them on About, Blog,
    // Specials and Service and never fetch a VDP — the one page that unlocks
    // VDP uniqueness, the vehicle gallery, vehicle history and sold-vehicle
    // handling. Anything the plan doesn't name is not crawled at all.
    const plan = keyPagesFor(siteSubType);
    const planRank = new Map(plan.map((k, i) => [k, i]));
    const byPlanOrder = (a, b) => planRank.get(a.type) - planRank.get(b.type);

    // Filter out excluded/generic pages (/login, /signup, /privacy), anything the
    // user unticked in the page picker, and anything this site type's plan
    // doesn't ask for.
    const inScope = (type) => !scopeSet || scopeSet.has(type);
    const wantedPages = classified.filter((item) => planRank.has(item.type) && inScope(item.type));

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
    // FULL Chromium render + 8-pillar pass (~12-14 CPU-s). The default is
    // MAX_CRAWL_PAGES minus one, because Stage 1 has already audited the home
    // page — six pages TOTAL, not six on top of it. On small servers set the
    // MAX_KEY_PAGES env var lower (e.g. 3 on a 1-vCPU box — renders serialize
    // brutally there), or 0 to skip key pages entirely (homepage only).
    const envKeyPages = parseInt(process.env.MAX_KEY_PAGES ?? "", 10);
    const MAX_KEY_PAGES = Number.isFinite(envKeyPages) && envKeyPages >= 0 ? envKeyPages : MAX_CRAWL_PAGES - 1;
    logger.info(`🗺️ [Stage 2a] Crawl plan for ${siteSubType || "unresolved"} site: home + ${plan.join(", ")} (max ${MAX_KEY_PAGES} key pages)`);
    // Valid 24-hex ObjectId string (4-byte unix time + 8 random bytes — the same
    // shape Mongo itself generates, so mongoose casts it losslessly). Hand-rolled
    // because this id was the worker's ONLY use of mongoose, and importing all of
    // mongoose costs ~100ms of module load on every audit in this DB-FREE worker.
    const newChildId = () =>
      Math.floor(Date.now() / 1000).toString(16).padStart(8, "0") +
      crypto.randomBytes(8).toString("hex");
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
          childId: newChildId(),
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

    // Sorted by plan order, NOT by whatever order discovery surfaced them in —
    // when the site has more categories than the cap allows, the ones that get
    // cut have to be the ones the plan ranked last.
    const allJobs = [];
    allJobs.push(...release(
      Object.entries(categoryMap).map(([type, url]) => ({ url, type })).sort(byPlanOrder)
    ));

    // Anything the plan asked for that discovery didn't turn up. Was hard-coded
    // to the dealer set (vdp/service/trade/specials), which meant a service or
    // repair site never got a second look for its booking or pricing page — the
    // two pages its whole score rests on.
    const missingKeys = plan.filter((k) => !categoryMap[k] && inScope(k));

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
              const t = classify(full);
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
    allJobs.push(...release(
      Object.entries(categoryMap).map(([type, url]) => ({ url, type })).sort(byPlanOrder)
    ));

    // A site that genuinely doesn't have some of its plan's pages ends up under
    // the cap. That is now the correct outcome and it is left alone: the old
    // backfill topped the run up with whatever else the crawl had found, which
    // on a 4-page garage meant auditing a random /careers page and reporting it
    // as a key page. A short run on a small site is an honest result.
    if (releasedCount < MAX_KEY_PAGES) {
      logger.info(`🗺️ [Stage 2a] ${releasedCount}/${MAX_KEY_PAGES} planned pages found — this site doesn't have the rest (${plan.filter((k) => !categoryMap[k]).join(", ") || "none"}).`);
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
    // Follow the pool cap instead of a hard-coded 3: with MAX_CONCURRENT_BROWSERS
    // raised (e.g. 6 on an 8-core dev box) the old constant became a silent SECOND
    // cap that left pool permits idle through Stage 2 — 6 key pages ran as 2 waves
    // when they could run as 1. Env unset → 3, identical to the pool's own default.
    const CONCURRENCY = Math.max(1, parseInt(process.env.MAX_CONCURRENT_BROWSERS || "3", 10) || 3);
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

    // Landing-page DOM is available: fill in the market SIGNALS. This never
    // changes which norms the pillars score against (see refineMarket) — it
    // exists so a selection that contradicts the page becomes a reportable
    // finding instead of a silent mismatch.
    const resolvedMarket = refineMarket($);
    postProgress({
      market: resolvedMarket.market,
      marketResolution: {
        market: resolvedMarket.market,
        marketName: resolvedMarket.locale.name,
        source: resolvedMarket.source,
        confidence: resolvedMarket.confidence,
        selected: resolvedMarket.selected,
        detected: resolvedMarket.detected,
        signals: resolvedMarket.signals.map((s) => ({ market: s.market, source: s.source, evidence: s.evidence })),
        conflict: resolvedMarket.conflict,
      },
    });
    if (resolvedMarket.conflict) {
      logger.info(`🌏 [Worker] Market conflict — ${resolvedMarket.conflict.summary}`);
    }

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
          const r = await safeMetric("Technical Performance", () => technicalMetrics(url, device, page, response, browser, pageType, stage1Psi, siteSubType, market));
          postProgress({ technicalPerformance: r });
          return { field: "technicalPerformance", value: r, pct: r?.Percentage ?? null };
        },
        "On Page SEO": async () => {
          const r = await safeMetric("On Page SEO", () => seoMetrics(url, $, page, pageType, siteSubType, market));
          postProgress({ onPageSEO: r, siteSchema: r?.Schema });
          return { field: "onPageSEO", value: r, pct: r?.Percentage ?? null, extra: { siteSchema: r?.Schema } };
        },
        "Accessibility": async () => {
          const r = await safeMetric("Accessibility", () => accessibilityMetrics(page, $, pageType, market, siteSubType));
          postProgress({ accessibility: r });
          return { field: "accessibility", value: r, pct: r?.Percentage ?? null };
        },
        "Security/Compliance": async () => {
          const r = await safeMetric("Security/Compliance", () => securityCompliance(url, page, response, browser, pageType, siteSubType, market));
          postProgress({ securityOrCompliance: r });
          return { field: "securityOrCompliance", value: r, pct: r?.Percentage ?? null };
        },
        "UX & Content Structure": async () => {
          const r = await safeMetric("UX & Content Structure", () => uxContentStructure(device, page, pageType, siteSubType, market));
          postProgress({ UXOrContentStructure: r });
          return { field: "UXOrContentStructure", value: r, pct: r?.Percentage ?? null };
        },
        "Conversion & Lead Flow": async () => {
          const r = await safeMetric("Conversion & Lead Flow", () => conversionLeadFlow(page, $, pageType, siteSubType, market));
          postProgress({ conversionAndLeadFlow: r });
          return { field: "conversionAndLeadFlow", value: r, pct: r?.Percentage ?? null };
        },
        "AIO (AI-Optimization) Readiness": async () => {
          const r = await safeMetric("AIO Readiness", () => aioReadiness(url, page, $, pageType, siteSubType, market));
          postProgress({ aioReadiness: r, aioCompatibilityBadge: r?.AIO_Compatibility_Badge });
          return { field: "aioReadiness", value: r, pct: r?.Percentage ?? null, extra: { aioCompatibilityBadge: r?.AIO_Compatibility_Badge } };
        },
        "AEO (Answer Engine Optimization)": async () => {
          // AEO is a TOP-LEVEL `aeo` section field; headline is the spec-weighted Percentage.
          const r = await safeMetric("AEO", () => AEOService.runAudit(url, $, null, 100, { pageType, siteSubType, market }));
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
      
      // Same page tilt × site profile the full path uses. The site multiplier
      // was previously missing here, so a subset audit of a repair site was
      // weighted as if it were a dealer's — the one place the site profile
      // wasn't reaching.
      const w = weightsForPageType(pageType);
      const m = siteWeightMultipliers(siteSubType) || [1, 1, 1, 1, 1, 1, 1, 1];
      // Section name → its slot in the weight row (SECTION_ORDER).
      const slotOf = {
        "Technical Performance": 0,
        "On Page SEO": 1,
        "Accessibility": 2,
        "Security/Compliance": 3,
        "UX & Content Structure": 4,
        "Conversion & Lead Flow": 5,
        "AIO (AI-Optimization) Readiness": 6,
        "AEO (Answer Engine Optimization)": 7,
      };

      let sumOfScoresTimesWeights = 0;
      let sumOfWeights = 0;
      const sectionScores = [];
      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        if (!res) continue;
        updateData[res.field] = res.value;
        if (res.extra) Object.assign(updateData, res.extra);
        
        const slot = slotOf[selected[i]];
        const weightVal = slot === undefined ? 0 : w[slot] * m[slot];
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
          result = await safeMetric("Technical Performance", () => technicalMetrics(url, device, page, response, browser, pageType, stage1Psi, siteSubType, market));
          break;
        case "On Page SEO":
          result = await safeMetric("On Page SEO", () => seoMetrics(url, $, page, pageType, siteSubType, market));
          break;
        case "Accessibility":
          result = await safeMetric("Accessibility", () => accessibilityMetrics(page, $, pageType, market, siteSubType));
          break;
        case "Security/Compliance":
          result = await safeMetric("Security/Compliance", () => securityCompliance(url, page, response, browser, pageType, siteSubType, market));
          break;
        case "UX & Content Structure":
          result = await safeMetric("UX & Content Structure", () => uxContentStructure(device, page, pageType, siteSubType, market));
          break;
        case "Conversion & Lead Flow":
          result = await safeMetric("Conversion & Lead Flow", () => conversionLeadFlow(page, $, pageType, siteSubType, market));
          break;
        case "AIO (AI-Optimization) Readiness":
          result = await safeMetric("AIO Readiness", () => aioReadiness(url, page, $, pageType, siteSubType, market));
          break;
        case "AEO (Answer Engine Optimization)":
          result = await safeMetric("AEO", () => AEOService.runAudit(url, $, null, 100, { pageType, siteSubType, market }));
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

    // [PERF] Technical Performance runs APART from the other seven pillars: it awaits the
    // PageSpeed response (~50–75s), which dominates the whole audit. The other seven land
    // in a fraction of that, so the report goes visible on their provisional rollup
    // (Technical renormalized out, psiPending: true) and the final score patches in below
    // once PageSpeed answers. Not awaited yet — only after the seven-pillar rollup posts.
    // Technical signals when it is done with the PAGE, which happens well before it is
    // done with PAGESPEED (see technicalMetrics' phase 1/phase 2 split). That signal is
    // what lets Chromium be released while the PSI call is still in flight.
    let signalTechPageReleased;
    const techPageReleased = new Promise((resolve) => { signalTechPageReleased = resolve; });
    const techPromise = (async () => {
      const r = await safeMetric("Technical Performance", () => withTimeout(technicalMetrics(url, device, page, response, browser, pageType, stage1Psi, siteSubType, market, signalTechPageReleased), TECH_TIMEOUT_MS, "Technical Performance"));
      postProgress({ technicalPerformance: r });
      return r;
    })();
    // Belt and braces: if Technical throws, times out, or returns before it ever reaches
    // the hook, the promise above would never settle and the browser would be held to
    // the pillar timeout for nothing. Settling it alongside techPromise makes the wait
    // below "page free OR Technical over", never "page free" alone.
    techPromise.finally(() => signalTechPageReleased());

    const [B_Res, C_Res, D_Res, E_Res, F_Res, G_Res, aeoRes] = await Promise.all([
      (async () => {
        const r = await safeMetric("On Page SEO", () => withTimeout(seoMetrics(url, $, page, pageType, siteSubType, market), SEO_TIMEOUT_MS, "On Page SEO"));
        postProgress({ onPageSEO: r, siteSchema: r?.Schema });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("Accessibility", () => withTimeout(accessibilityMetrics(page, $, pageType, market, siteSubType), A11Y_TIMEOUT_MS, "Accessibility"));
        postProgress({ accessibility: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("Security/Compliance", () => withTimeout(securityCompliance(url, page, response, browser, pageType, siteSubType, market), SEC_TIMEOUT_MS, "Security/Compliance"));
        postProgress({ securityOrCompliance: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("UX & Content Structure", () => withTimeout(uxContentStructure(device, page, pageType, siteSubType, market), PILLAR_TIMEOUT_MS, "UX & Content Structure"));
        postProgress({ UXOrContentStructure: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("Conversion & Lead Flow", () => withTimeout(conversionLeadFlow(page, $, pageType, siteSubType, market), PILLAR_TIMEOUT_MS, "Conversion & Lead Flow"));
        postProgress({ conversionAndLeadFlow: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("AIO Readiness", () => withTimeout(aioReadiness(url, page, $, pageType, siteSubType, market), PILLAR_TIMEOUT_MS, "AIO Readiness"));
        postProgress({ aioReadiness: r, aioCompatibilityBadge: r?.AIO_Compatibility_Badge });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("AEO", () => withTimeout(AEOService.runAudit(url, $, null, 100, { pageType, siteSubType, market }), PILLAR_TIMEOUT_MS, "AEO"));
        postProgress({ aeo: r });
        return r;
      })(),
    ]);

    // Extract percentages for overall score calculation
    // `?? null` (not `|| 0`) so a "Not Run" section (null Percentage) is excluded and
    // renormalized in OverAll rather than counted as a real 0. A legit 0 is preserved.
    const B = B_Res?.Percentage ?? null;
    const C = C_Res?.Percentage ?? null;
    const D = D_Res?.Percentage ?? null;
    const E = E_Res?.Percentage ?? null;
    const F = F_Res?.Percentage ?? null;
    const G = G_Res?.Percentage ?? null;
    const H = aeoRes?.Percentage ?? null;

    // Seven pillars are in — publish the PROVISIONAL rollup so the report opens now.
    // Technical passes as null here, which OverAll renormalizes out (same math as a
    // "Not Run" section); psiPending tells the frontend the Technical card and the
    // overall score are still refining, not finished.
    const provisional = OverAll(null, B, C, D, E, F, G, H, pageType);
    postProgress({
      stage1Completed: true,
      psiPending: true,
      score: provisional.totalScore,
      grade: provisional.grade,
      sectionScore: provisional.sectionScores,
      message: "Report ready — PageSpeed (Technical Performance) is still being analyzed...",
    });
    logger.info(`⚡ [Stage 1] 7/8 pillars complete for ${url} — provisional score ${provisional.totalScore} published, awaiting PageSpeed...`);

    // Release Chromium as soon as Technical is finished with the page — NOT when it is
    // finished with PageSpeed. Those are the same moment only on a fast PSI call; on a
    // slow one they are minutes apart, and holding a browser slot through that wait is
    // what throttled the whole pool. The seven other pillars are already done, so
    // nothing else needs the page here.
    await techPageReleased;
    if (browser) {
      try { await browser.close(); } catch { }
      browser = null;
    }

    // Now wait for PageSpeed with nothing expensive held open.
    const A_Res = await techPromise;
    const A = A_Res?.Percentage ?? null;

    logWorkerMetrics("Stage 1 Complete");

    const overall = OverAll(A, B, C, D, E, F, G, H, pageType);

    // Surface any "Not Run" sections so the overall-score math is auditable — these were
    // renormalized out (not counted as 0). Pairs with the [PageSpeed]/[Technical] trail.
    const notRunSections = overall.sectionScores.filter((s) => s.score === null).map((s) => s.name);
    if (notRunSections.length) {
      logger.warn(`[Overall] ${notRunSections.length} section(s) Not Run — excluded & renormalized: ${notRunSections.join(", ")} | overall=${overall.totalScore} (${url})`);
    }

    // Final Stage 1 rollup — replaces the provisional score now that PageSpeed landed.
    postProgress({
      psiPending: false,
      score: overall.totalScore,
      grade: overall.grade,
      sectionScore: overall.sectionScores,
      message: "Stage 1 initial page complete — Stage 2 parallel crawl of remaining pages is underway...",
    });

    // (The Stage 1 browser was already closed above, the moment Technical released the
    // page — it used to be closed here, after the PageSpeed wait.)

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
      psiPending: false,
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
    // This worker's shared stealth browser (spawned lazily for site-type/robots
    // fetches) lives in THIS thread's module instance — left open it leaks a
    // ~120-250MB Chromium tree past the audit, since thread exit doesn't kill
    // the child process. No-ops safely if a context is still active.
    try { await closeSharedBrowser(); } catch { }
    // Any PSI response prefetched for a page that never got audited (audit failed
    // mid-flight, page skipped) is a multi-MB Lighthouse JSON pinned in memory — drop it.
    clearPsiPrefetch();
  }
})();
