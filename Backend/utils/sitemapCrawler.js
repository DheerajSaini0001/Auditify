import * as cheerio from "cheerio";
import { gunzipSync } from "zlib";
import { parseStringPromise } from "xml2js";
import { newStealthPage, detectChallenge, waitForChallengeResolution } from "./puppeteer_cheerio.js";

// Page-discovery browser usage is now bounded by the SINGLE global browser pool
// (utils/browserManager.js, default MAX_CONCURRENT_BROWSERS=3) that every
// headless-Chrome launch in the app shares. newStealthPage takes a permit from
// that pool for the lifetime of its context, so concurrent discovery crawls
// queue against the same cap as the audit browsers instead of contending with
// them uncounted — which previously let total concurrent Chrome exceed the cap
// and stall large JS-heavy corporate sites (ford.com, bmwusa.com).

// Sitemap-index handling bounds. A dealer sitemap index commonly fans out to
// 10-30 child sitemaps (pages, inventory shards, blog, images…). Every child is
// SAMPLED (round-robin interleave, see mergeChildSitemapUrls) so no single huge
// child — usually the first inventory shard — floods the discovery cap while
// service/finance/blog children never contribute a URL.
const MAX_CHILD_SITEMAPS = 12;      // children fetched per index (rest logged + skipped)
const CHILD_FETCH_CONCURRENCY = 3;  // parallel child fetches (pages within the ONE pooled browser)
const MAX_SITEMAP_DEPTH = 3;        // index-inside-index recursion guard
const MAX_URLS_PER_SITEMAP = 1000;  // memory bound per <urlset> (discovery keeps ~40 anyway)

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
    // robots.txt is checked FIRST: it is the standard place a site announces a
    // sitemap living at a non-default path (or on a www/CDN host), and dealer
    // platforms use that constantly. Its declared sitemaps outrank the three
    // guessed default paths.
    const robotsSitemaps = await fetchRobotsSitemapUrls(context, domain);
    const candidates = [...new Set([
        ...robotsSitemaps,
        `${domain}/sitemap.xml`,
        `${domain}/sitemap_index.xml`,
        `${domain}/sitemap-index.xml`,
    ])];
    const robotsCount = robotsSitemaps.length;

    // One visited-set across every candidate: /sitemap.xml and /sitemap_index.xml
    // frequently point at the SAME children — without this each candidate would
    // re-fetch the whole child fan-out.
    const visited = new Set(candidates);

    const attempts = await Promise.all(
        candidates.map((sitemapUrl) => fetchOneSitemapCandidate(context, sitemapUrl, domain, visited))
    );

    // robots-declared sitemaps are MERGED (a site may declare several — e.g. a
    // pages sitemap AND an inventory sitemap); the guessed defaults keep the old
    // first-non-empty-wins order.
    const robotsUrls = attempts.slice(0, robotsCount).flat();
    if (robotsUrls.length) return [...new Set(robotsUrls)];
    for (const urls of attempts.slice(robotsCount)) {
        if (urls.length) return [...new Set(urls)];
    }
    return [];
}

// Read `Sitemap:` declarations out of robots.txt (spec allows several, and they
// may point anywhere — a subdomain, a CDN, a non-default filename). Raw request
// first (robots.txt is plain text); rendered-page fallback for WAF'd origins.
async function fetchRobotsSitemapUrls(context, domain) {
    const parseDeclarations = (text) => text
        .split(/\r?\n/)
        .map((line) => line.match(/^\s*sitemap\s*:\s*(\S+)/i)?.[1])
        .filter(Boolean)
        .slice(0, 5);

    try {
        const resp = await context.request.get(`${domain}/robots.txt`, { timeout: 10000 });
        if (resp.ok()) {
            const declared = parseDeclarations(await resp.text());
            if (declared.length) {
                console.log(`🤖 robots.txt declares ${declared.length} sitemap(s): ${declared.join(", ")}`);
                return declared;
            }
        }
    } catch { /* fall through to the rendered-page path */ }

    let page;
    try {
        page = await context.newPage();
        await page.goto(`${domain}/robots.txt`, { waitUntil: "domcontentloaded", timeout: 12000 });
        const declared = parseDeclarations(await page.evaluate(() => document.body.innerText));
        if (declared.length) console.log(`🤖 robots.txt declares ${declared.length} sitemap(s): ${declared.join(", ")}`);
        return declared;
    } catch {
        return [];
    } finally {
        if (page) await page.close().catch(() => {});
    }
}

async function fetchOneSitemapCandidate(context, sitemapUrl, domain, visited, depth = 0) {
    // Raw request first: no XML-viewer wrapper, no page overhead, .xml.gz handled.
    const rawXml = await readSitemapBody(context, sitemapUrl);
    if (rawXml) return parseSitemap(context, rawXml, domain, visited, depth);

    // Fallback: render the page so a WAF challenge can be waited out.
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
            return await parseSitemap(context, content, domain, visited, depth);
        }
        return [];
    } catch (error) {
        return [];
    } finally {
        if (page) await page.close().catch(() => {});
    }
}

// Hostname with any leading "www." stripped — sitemap <loc>s routinely disagree
// with the audited origin on www vs apex (the old startsWith(domain) check
// silently dropped EVERY url in that case and discovery fell back to crawling).
const registrableHost = (url) => {
    try { return new URL(url).hostname.replace(/^www\./i, "").toLowerCase(); } catch { return null; }
};

// A <loc> that IS itself a sitemap file. Some sites (wrongly but commonly) list
// their child sitemaps inside a plain <urlset> instead of a <sitemapindex> — e.g.
// a top sitemap whose 6 entries are each another sitemap. Those must be RECURSED
// INTO, not treated as auditable pages (or dropped by the asset filter), or the
// whole tree is missed and discovery falls back to link crawling.
const looksLikeSitemapUrl = (url) => /\.xml(\.gz)?(\?[^#]*)?$/i.test(url);

// Fetch one sitemap's raw XML without rendering a page: the context's request
// API sends the browser's cookies (incl. WAF clearance) but skips the XML-viewer
// wrapper entirely, and we gunzip .xml.gz payloads (compressed child sitemaps
// are standard on large sites). Returns null when the answer isn't a sitemap.
async function readSitemapBody(context, url) {
    try {
        const resp = await context.request.get(url, { timeout: 10000 });
        if (!resp.ok()) return null;
        const buf = await resp.body();
        const xml = buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b
            ? gunzipSync(buf).toString("utf8")
            : buf.toString("utf8");
        return xml.includes("<urlset") || xml.includes("<sitemapindex") ? xml : null;
    } catch {
        return null;
    }
}

// Fetch + parse a set of child-sitemap urls (from a <sitemapindex> OR sitemap-like
// <loc>s found inside a <urlset>): bounded fan-out, small parallel chunks, shared
// visited-set against loops, raw request first with a rendered-page fallback for
// challenge-protected origins. Children are round-robin merged so each one is
// sampled by the discovery cap.
async function fetchChildSitemaps(context, childLocs, domain, visited, depth) {
    if (depth >= MAX_SITEMAP_DEPTH) {
        console.log(`🗺️ Sitemap nested deeper than ${MAX_SITEMAP_DEPTH} levels — stopping recursion`);
        return [];
    }

    const fresh = childLocs.filter((loc) => loc && !visited.has(loc));
    fresh.forEach((loc) => visited.add(loc));

    const toFetch = fresh.slice(0, MAX_CHILD_SITEMAPS);
    if (fresh.length > toFetch.length) {
        console.log(`🗺️ ${fresh.length} child sitemap(s) found — fetching first ${toFetch.length}`);
    } else if (toFetch.length) {
        console.log(`🗺️ Fetching ${toFetch.length} child sitemap(s) before any page crawling`);
    }

    const childResults = [];
    for (let i = 0; i < toFetch.length; i += CHILD_FETCH_CONCURRENCY) {
        const chunk = toFetch.slice(i, i + CHILD_FETCH_CONCURRENCY);
        const chunkResults = await Promise.all(chunk.map(async (subSitemapUrl) => {
            const rawXml = await readSitemapBody(context, subSitemapUrl);
            if (rawXml) return parseSitemap(context, rawXml, domain, visited, depth + 1);

            // Fallback: a challenge page or non-XML answer — render it like before.
            let subPage;
            try {
                subPage = await context.newPage();
                await subPage.goto(subSitemapUrl, { waitUntil: "domcontentloaded", timeout: 10000 });
                const subData = await subPage.evaluate(() => document.body.innerText);
                return await parseSitemap(context, subData, domain, visited, depth + 1);
            } catch (error) {
                return [];
            } finally {
                if (subPage) await subPage.close().catch(() => {});
            }
        }));
        childResults.push(...chunkResults);
    }
    return mergeChildSitemapUrls(childResults);
}

// Round-robin interleave of each child sitemap's urls, so the ~40-url discovery
// cap samples EVERY child (pages + inventory + service + blog) instead of being
// exhausted by whichever child the index happened to list first.
const mergeChildSitemapUrls = (lists) => {
    const merged = [];
    const longest = lists.reduce((m, l) => Math.max(m, l.length), 0);
    for (let i = 0; i < longest; i++) {
        for (const list of lists) if (i < list.length) merged.push(list[i]);
    }
    return merged;
};

async function parseSitemap(context, xmlData, domain, visited = new Set(), depth = 0) {
    const urls = [];
    try {
        // Content read via page.evaluate(innerText) carries Chrome's XML-viewer
        // preamble ("This XML file does not appear to have any style information…")
        // ahead of the actual XML — xml2js chokes on it and the silent .catch turned
        // EVERY sitemap into "Found 0 URLs" for as long as this crawler has existed.
        // Slice to the first "<" so the parser always sees real XML.
        const xmlStart = xmlData.indexOf("<");
        const cleanXml = xmlStart > 0 ? xmlData.slice(xmlStart) : xmlData;
        const result = await parseStringPromise(cleanXml).catch(() => null);
        if (!result) return [];

        // ── Sitemap INDEX: fetch the child sitemaps (bounded, parallel, loop-safe) ──
        if (result.sitemapindex && result.sitemapindex.sitemap) {
            const childLocs = result.sitemapindex.sitemap.map((s) => s.loc && s.loc[0]);
            urls.push(...await fetchChildSitemaps(context, childLocs, domain, visited, depth));
        }

        // ── Plain <urlset> ──
        // Split the <loc>s: entries that are THEMSELVES sitemap files (a top
        // sitemap listing its 6 child sitemaps inside a urlset — malformed but
        // real) are recursed into like index children; the rest are kept as
        // same-site page urls (www/apex-insensitive, asset extensions dropped —
        // dealer sitemaps list inventory .json feeds and images alongside pages).
        if (result.urlset && result.urlset.url) {
            const baseHost = registrableHost(domain);
            const nestedSitemapLocs = [];
            const pageUrls = [];
            for (const url of result.urlset.url) {
                if (pageUrls.length >= MAX_URLS_PER_SITEMAP) break;
                if (!url.loc || !url.loc[0]) continue;
                const pageUrl = url.loc[0];
                if (looksLikeSitemapUrl(pageUrl)) {
                    nestedSitemapLocs.push(pageUrl);
                } else if (
                    registrableHost(pageUrl) === baseHost &&
                    !pageUrl.match(/\.(pdf|jpg|jpeg|png|gif|svg|zip|mp4|mp3|doc|docx|xls|xlsx|css|js|json|woff|woff2|ttf|eot)$/i)
                ) {
                    pageUrls.push(pageUrl);
                }
            }

            if (nestedSitemapLocs.length) {
                console.log(`🗺️ urlset carries ${nestedSitemapLocs.length} sitemap-file link(s) — treating them as child sitemaps`);
                const childUrls = await fetchChildSitemaps(context, nestedSitemapLocs, domain, visited, depth);
                urls.push(...mergeChildSitemapUrls([pageUrls, childUrls]));
            } else {
                urls.push(...pageUrls);
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
