import * as cheerio from "cheerio";
import { parseStringPromise } from "xml2js";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

export default async function discoverPages(baseUrl, maxPages = 50) {
    const discoveredUrls = new Set();
    const urlsToVisit = [baseUrl];
    const visitedUrls = new Set();
    let browser;

    try {
        const normalizedBase = new URL(baseUrl);
        const domain = normalizedBase.origin;

        console.log(`🚀 Starting discovery for: ${domain}`);

        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        });

        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36");

        // Step 1: Try to fetch sitemap.xml using Puppeteer
        const sitemapUrls = await fetchSitemapUrls(page, domain);
        sitemapUrls.forEach(url => discoveredUrls.add(url));

        console.log(`📍 Found ${sitemapUrls.length} URLs from sitemap`);

        if (discoveredUrls.size >= maxPages) {
            await browser.close();
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

            if (visitedUrls.size > maxPages * 2) break;
        }

        await browser.close();
        const finalUrls = Array.from(discoveredUrls).slice(0, maxPages);
        console.log(`✅ Total pages discovered: ${finalUrls.length}`);

        return finalUrls;

    } catch (error) {
        console.error("Error discovering pages:", error.message);
        if (browser) await browser.close();
        return [baseUrl];
    }
}

async function fetchSitemapUrls(page, domain) {
    const sitemapUrls = [];
    const possibleSitemaps = [
        `${domain}/sitemap.xml`,
        `${domain}/sitemap_index.xml`,
        `${domain}/sitemap-index.xml`,
    ];

    for (const sitemapUrl of possibleSitemaps) {
        try {
            await page.goto(sitemapUrl, { waitUntil: "networkidle2", timeout: 20000 });
            
            // Handle bot verification
            const { detectChallenge, waitForChallengeResolution } = await import('./puppeteer_cheerio.js');
            if (await detectChallenge(page)) {
                console.log(`🛡️ Sitemap challenge detected for ${sitemapUrl}, attempting bypass...`);
                await waitForChallengeResolution(page, 60000); // Increased to 60s for production reliability
            }

            const data = await page.content();
            
            // Cheerio can extract the text from the raw XML if it's served as text/xml
            // but Puppeteer might wrap it in HTML tags. 
            // We'll try to extract the innerText which should be the XML content
            const content = await page.evaluate(() => document.body.innerText);
            
            if (content.includes('<urlset') || content.includes('<sitemapindex')) {
                const urls = await parseSitemap(page, content, domain);
                urls.forEach(url => sitemapUrls.push(url));
                if (sitemapUrls.length > 0) break;
            }
        } catch (error) {
            continue;
        }
    }

    return [...new Set(sitemapUrls)];
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

async function extractInternalLinks(page, url, domain) {
    const links = new Set();
    try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
        
        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 2000));
        
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

