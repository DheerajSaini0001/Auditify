// Lightweight same-origin crawler (fetch + cheerio, no browser — fast and scalable).
// Discovers and fetches pages breadth-first up to maxPages, capturing per-page data the
// checks operate on. Reports progress via the onPage callback so the processor can push
// updates to Redis. Swap this for a Puppeteer-based crawler if JS-rendered pages are needed.
import * as cheerio from "cheerio";
import { env } from "../config/env.js";
import createLogger from "../utils/logger.js";

const log = createLogger("crawler");

const SKIP_EXT = /\.(pdf|jpg|jpeg|png|gif|svg|webp|ico|zip|mp4|mp3|css|js|json|xml|woff2?|ttf|eot)$/i;

async function fetchPage(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "AuditifyBot/1.0 (+https://auditify.local)" },
    });
    const html = await res.text();
    const headers = Object.fromEntries(res.headers.entries());
    return {
      url,
      status: res.status,
      ok: res.ok,
      finalUrl: res.url || url,
      html,
      headers,
      sizeBytes: Buffer.byteLength(html, "utf8"),
      timingMs: Date.now() - startedAt,
      error: null,
    };
  } catch (err) {
    return {
      url,
      status: 0,
      ok: false,
      finalUrl: url,
      html: "",
      headers: {},
      sizeBytes: 0,
      timingMs: Date.now() - startedAt,
      error: err.name === "AbortError" ? "timeout" : err.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

function extractLinks(html, baseUrl, origin) {
  const links = new Set();
  try {
    const $ = cheerio.load(html);
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      try {
        const u = new URL(href, baseUrl);
        u.hash = "";
        const normalized = u.origin + u.pathname + (u.search || "");
        if (u.origin === origin && !SKIP_EXT.test(u.pathname)) links.add(normalized);
      } catch (_) { /* ignore malformed */ }
    });
  } catch (_) { /* ignore parse errors */ }
  return [...links];
}

/**
 * Crawl a site breadth-first.
 * @param {string} startUrl
 * @param {object} options { maxPages }
 * @param {(info:{pagesFound:number,pagesScanned:number,currentUrl:string})=>Promise<void>} onPage
 * @returns {Promise<{pages:object[], pagesFound:number, pagesScanned:number}>}
 */
export async function crawl(startUrl, options = {}, onPage = async () => {}) {
  const maxPages = Math.max(1, Math.min(Number(options.maxPages) || env.DEFAULT_MAX_PAGES, 200));
  const origin = new URL(startUrl).origin;

  const queue = [startUrl];
  const discovered = new Set([startUrl]);
  const pages = [];

  while (queue.length && pages.length < maxPages) {
    const current = queue.shift();
    await onPage({ pagesFound: discovered.size, pagesScanned: pages.length, currentUrl: current });

    const page = await fetchPage(current, env.CRAWL_REQUEST_TIMEOUT_MS);
    pages.push(page);

    if (page.ok && page.html) {
      for (const link of extractLinks(page.html, page.finalUrl, origin)) {
        if (!discovered.has(link) && discovered.size < maxPages * 3) {
          discovered.add(link);
          if (queue.length + pages.length < maxPages) queue.push(link);
        }
      }
    }
    await onPage({ pagesFound: discovered.size, pagesScanned: pages.length, currentUrl: current });
  }

  log.info(`Crawled ${pages.length} page(s) from ${startUrl}`);
  return { pages, pagesFound: discovered.size, pagesScanned: pages.length };
}

export default crawl;
