import * as cheerio from "cheerio";
import { parseStringPromise } from "xml2js";
import { newStealthPage, detectChallenge, waitForChallengeResolution } from "./puppeteer_cheerio.js";

// Page-discovery browser usage is now bounded by the SINGLE global browser pool
// (utils/browserManager.js, default MAX_CONCURRENT_BROWSERS=3) that every
// headless-Chrome launch in the app shares. newStealthPage takes a permit from
// that pool for the lifetime of its context, so concurrent discovery crawls
// queue against the same cap as the audit browsers instead of contending with
// them uncounted — which previously let total concurrent Chrome exceed the cap
// and stall large JS-heavy corporate sites (ford.com, bmwusa.com).

// Once the homepage ALONE yields at least this many same-origin links, stop —
// a real dealer/OEM homepage nav almost always already links to every major
// section (inventory, service, about, trade-in, etc.). Recursing into MORE
// pages beyond that mainly re-discovers the SAME site-wide nav with only a
// handful of net-new links per extra page visited (confirmed on
// fjmercedes.com: needed 90 page visits and 11 minutes to reach a 250-link
// target this way, when the homepage alone already had every category).
const HEALTHY_HOMEPAGE_LINK_COUNT = 20;
// Separate from `maxPages` (which bounds total DISCOVERED links) — this bounds
// how many pages we'll actually visit/render when the homepage alone wasn't
// enough. Low on purpose: rendering each page costs real navigation time, so
// a handful of secondary pages is the right budget for "homepage was thin,
// try a bit harder" — not license for an unbounded site-wide crawl.
const MAX_PAGES_TO_VISIT = 15;

export default async function discoverPages(baseUrl, maxPages = 50) {
    return discoverPagesInner(baseUrl, maxPages);
}

async function discoverPagesInner(baseUrl, maxPages) {
    const discoveredUrls = new Set();
    const urlsToVisit = [baseUrl];
    const visitedUrls = new Set();
    let context;

    try {
        const normalizedBase = new URL(baseUrl);
        const domain = normalizedBase.origin;

        console.log(`🚀 Starting discovery for: ${domain}`);

        // Shared, already-warm, well-hardened stealth browser (same pool
        // site-type detection uses) — instead of this crawler launching its
        // own separate, minimally-stealthed, non-pooled browser per call.
        const created = await newStealthPage("Desktop");
        context = created.context;
        const page = created.page;

        // Step 1: Try to fetch sitemap.xml
        const sitemapUrls = await fetchSitemapUrls(context, domain);
        sitemapUrls.forEach(url => discoveredUrls.add(url));

        console.log(`📍 Found ${sitemapUrls.length} URLs from sitemap`);

        if (discoveredUrls.size >= maxPages) {
            await context.close();
            return Array.from(discoveredUrls).slice(0, maxPages);
        }

        // Step 2: Crawl internal links from pages
        while (urlsToVisit.length > 0 && discoveredUrls.size < maxPages) {
            const currentUrl = urlsToVisit.shift();

            if (visitedUrls.has(currentUrl)) continue;
            visitedUrls.add(currentUrl);

            try {
                const internalLinks = await extractInternalLinks(page, currentUrl, domain);

                internalLinks.forEach(link => {
                    if (discoveredUrls.size < maxPages && !discoveredUrls.has(link)) {
                        discoveredUrls.add(link);
                        if (discoveredUrls.size < maxPages && !visitedUrls.has(link)) {
                            urlsToVisit.push(link);
                        }
                    }
                });

                console.log(`🔍 Crawled: ${currentUrl} | Found: ${internalLinks.length} new links | Total: ${discoveredUrls.size}`);

            } catch (error) {
                console.error(`❌ Error crawling ${currentUrl}:`, error.message);
            }

            // Continue crawling secondary pages to ensure key automotive sections (VDP, Service, Trade) are found
            if (visitedUrls.size >= 5 && discoveredUrls.size >= maxPages) break;

            if (visitedUrls.size >= MAX_PAGES_TO_VISIT) break;
        }

        await context.close();
        const finalUrls = Array.from(discoveredUrls).slice(0, maxPages);
        console.log(`✅ Total pages discovered: ${finalUrls.length}`);

        return finalUrls;

    } catch (error) {
        console.error("Error discovering pages:", error.message);
        if (context) await context.close().catch(() => {});
        return [baseUrl];
    }
}

// Try each candidate sitemap path in turn. If the FIRST one that responds is
// challenge-protected and doesn't clear within one wait, don't keep retrying
// the other candidates with their own full-length waits — they're the same
// origin behind the same WAF, so a second or third attempt is exceedingly
// unlikely to behave differently. That "retry every candidate at full cost"
// pattern previously burned up to 3 minutes (3 × 60s waits) before ever
// reaching the actual page crawl, on a site whose sitemap simply isn't
// reachable at all.
// Checked in PARALLEL, on separate short-lived pages from the same context —
// a single Playwright page can only navigate once at a time, so the old
// implementation reusing ONE page for all 3 candidates sequentially meant an
// origin that times out on navigation (rather than 404ing fast) paid up to
// 3 x 20s nav + 3 x 20s challenge-wait = up to 120s here alone. Confirmed
// contributing to ford.com/bmwusa.com's residual latency after fixing the
// equivalent axios-level sequential-candidate bug in pageDiscovery.js.
async function fetchSitemapUrls(context, domain) {
    const possibleSitemaps = [
        `${domain}/sitemap.xml`,
        `${domain}/sitemap_index.xml`,
        `${domain}/sitemap-index.xml`,
    ];

    const attempts = await Promise.all(
        possibleSitemaps.map((sitemapUrl) => fetchOneSitemapCandidate(context, sitemapUrl, domain))
    );

    // First candidate (in priority order) that found anything wins.
    for (const urls of attempts) {
        if (urls.length) return [...new Set(urls)];
    }
    return [];
}

async function fetchOneSitemapCandidate(context, sitemapUrl, domain) {
    let page;
    try {
        page = await context.newPage();
        await page.goto(sitemapUrl, { waitUntil: "domcontentloaded", timeout: 20000 });

        if (await detectChallenge(page)) {
            console.log(`🛡️ Sitemap challenge detected for ${sitemapUrl}, attempting bypass...`);
            await waitForChallengeResolution(page, 20000);
            if (await detectChallenge(page)) {
                console.log(`🛡️ Sitemap challenge did not clear for ${sitemapUrl}`);
                return [];
            }
        }

        const content = await page.evaluate(() => document.body.innerText);
        if (content.includes('<urlset') || content.includes('<sitemapindex')) {
            return await parseSitemap(page, content, domain);
        }
        return [];
    } catch (error) {
        return [];
    } finally {
        if (page) await page.close().catch(() => {});
    }
}

async function parseSitemap(page, xmlData, domain) {
    const urls = [];
    try {
        const result = await parseStringPromise(xmlData).catch(() => null);
        if (!result) return [];

        if (result.sitemapindex && result.sitemapindex.sitemap) {
            for (const sitemap of result.sitemapindex.sitemap) {
                if (sitemap.loc && sitemap.loc[0]) {
                    try {
                        const subSitemapUrl = sitemap.loc[0];
                        await page.goto(subSitemapUrl, { waitUntil: "domcontentloaded", timeout: 10000 });
                        const subData = await page.evaluate(() => document.body.innerText);
                        const subUrls = await parseSitemap(page, subData, domain);
                        urls.push(...subUrls);
                    } catch (error) {}
                }
            }
        }

        if (result.urlset && result.urlset.url) {
            for (const url of result.urlset.url) {
                if (url.loc && url.loc[0]) {
                    const pageUrl = url.loc[0];
                    if (pageUrl.startsWith(domain)) {
                        urls.push(pageUrl);
                    }
                }
            }
        }
    } catch (error) {}
    return urls;
}

/**
 * Render ONE JS page with the stealth browser and return its same-origin internal
 * links (query strings preserved). Used to mine VDP links off an SRP that plain
 * axios can't read because the site is bot-protected (403) or renders its listing
 * client-side. Returns [] on any failure so callers can fall back gracefully.
 */
export async function fetchRenderedPageLinks(url, maxLinks = 400) {
  return fetchRenderedPageLinksInner(url, maxLinks);
}

async function fetchRenderedPageLinksInner(url, maxLinks) {
  let context;
  try {
    const origin = new URL(url).origin;
    const created = await newStealthPage("Desktop");
    context = created.context;
    const links = await extractInternalLinks(created.page, url, origin);
    await context.close();
    return links.slice(0, maxLinks);
  } catch (error) {
    if (context) await context.close().catch(() => {});
    console.error(`[fetchRenderedPageLinks] ${url}: ${error.message}`);
    return [];
  }
}

// Renders `url` and returns its same-origin internal links. Now checks for a
// bot-protection challenge and waits it out — previously this had NO
// challenge handling at all, so a blocked page (which happens more easily
// after several rapid prior navigations to the same origin) silently yielded
// zero links with no indication anything was wrong.
async function extractInternalLinks(page, url, domain) {
    const links = new Set();
    try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

        if (await detectChallenge(page)) {
            console.log(`🛡️ Challenge detected while crawling ${url}, attempting bypass...`);
            await waitForChallengeResolution(page, 20000);
        }

        const html = await page.content();
        const $ = cheerio.load(html);

        $("a[href]").each((_, element) => {
            const href = $(element).attr("href");
            if (!href) return;
            try {
                const absoluteUrl = new URL(href, url);
                const normalizedUrl = absoluteUrl.origin + absoluteUrl.pathname + absoluteUrl.search;
                if (
                    absoluteUrl.origin === domain &&
                    !normalizedUrl.match(/\.(pdf|jpg|jpeg|png|gif|svg|zip|mp4|mp3|doc|docx|xls|xlsx|css|js|json|xml|woff|woff2|ttf|eot)$/i) &&
                    !normalizedUrl.includes("#") &&
                    normalizedUrl !== url
                ) {
                    links.add(normalizedUrl);
                }
            } catch (error) {}
        });
    } catch (error) {
        console.error(`Error extracting links from ${url}:`, error.message);
    }
    return Array.from(links);
}
