import axios from "axios";
import * as cheerio from "cheerio";
import { parseStringPromise } from "xml2js";

export default async function discoverPages(baseUrl, maxPages = 50) {
    const discoveredUrls = new Set();
    const urlsToVisit = [baseUrl];
    const visitedUrls = new Set();

    try {
        // Normalize base URL
        const normalizedBase = new URL(baseUrl);
        const domain = normalizedBase.origin;

        console.log(`🚀 Starting discovery for: ${domain}`);

        // Step 1: Try to fetch sitemap.xml
        const sitemapUrls = await fetchSitemapUrls(domain);
        sitemapUrls.forEach(url => discoveredUrls.add(url));

        console.log(`📍 Found ${sitemapUrls.length} URLs from sitemap`);

        // If we have enough URLs from sitemap, return them
        if (discoveredUrls.size >= maxPages) {
            return Array.from(discoveredUrls).slice(0, maxPages);
        }

        // Add sitemap URLs to queue if we need to crawl more (optional, but good for coverage)
        // For now, we stick to checking from baseUrl if sitemap didn't give enough

        // Step 2: Crawl internal links from pages
        while (urlsToVisit.length > 0 && discoveredUrls.size < maxPages) {
            const currentUrl = urlsToVisit.shift();

            // Skip if already visited
            if (visitedUrls.has(currentUrl)) continue;
            visitedUrls.add(currentUrl);

            try {
                const internalLinks = await extractInternalLinks(currentUrl, domain);

                internalLinks.forEach(link => {
                    if (discoveredUrls.size < maxPages && !discoveredUrls.has(link)) {
                        discoveredUrls.add(link);

                        // Add to queue for further crawling (only if we need more pages)
                        if (discoveredUrls.size < maxPages && !visitedUrls.has(link)) {
                            urlsToVisit.push(link);
                        }
                    }
                });

                console.log(`🔍 Crawled: ${currentUrl} | Found: ${internalLinks.length} new links | Total: ${discoveredUrls.size}`);

            } catch (error) {
                console.error(`❌ Error crawling ${currentUrl}:`, error.message);
            }

            // Limit crawling depth/count to prevent infinite loops
            if (visitedUrls.size > maxPages * 2) break;
        }

        const finalUrls = Array.from(discoveredUrls).slice(0, maxPages);
        console.log(`✅ Total pages discovered: ${finalUrls.length}`);

        return finalUrls;

    } catch (error) {
        console.error("Error discovering pages:", error.message);
        // Return at least the base URL
        return [baseUrl];
    }
}

// Fetches URLs from sitemap.xml
async function fetchSitemapUrls(domain) {
    const sitemapUrls = [];
    const possibleSitemaps = [
        `${domain}/sitemap.xml`,
        `${domain}/sitemap_index.xml`,
        `${domain}/sitemap-index.xml`,
        `${domain}/post-sitemap.xml`,
        `${domain}/page-sitemap.xml`
    ];

    for (const sitemapUrl of possibleSitemaps) {
        try {
            const response = await axios.get(sitemapUrl, {
                timeout: 10000,
                headers: { "User-Agent": "Mozilla/5.0 (compatible; SiteAuditor/1.0)" }
            });

            if (response.status === 200 && response.data) {
                // Verify it looks like XML
                if (typeof response.data === 'string' && (response.data.trim().startsWith('<?xml') || response.data.includes('<urlset') || response.data.includes('<sitemapindex'))) {
                    const urls = await parseSitemap(response.data, domain);
                    urls.forEach(url => sitemapUrls.push(url));

                    if (sitemapUrls.length > 0) {
                        console.log(`✅ Found sitemap: ${sitemapUrl}`);
                        // Don't break immediately, maybe multiple sitemaps? 
                        // Usually one main index is enough but multiple standard names might exist.
                        // Code break logic: "Stop after finding first valid sitemap".
                        break;
                    }
                }
            }
        } catch (error) {
            // Silently continue to next sitemap
            continue;
        }
    }

    return [...new Set(sitemapUrls)]; // Remove duplicates
}

// Parses sitemap XML and extracts URLs
async function parseSitemap(xmlData, domain) {
    const urls = [];

    try {
        const result = await parseStringPromise(xmlData);

        // Handle sitemap index (contains links to other sitemaps)
        if (result.sitemapindex && result.sitemapindex.sitemap) {
            for (const sitemap of result.sitemapindex.sitemap) {
                if (sitemap.loc && sitemap.loc[0]) {
                    try {
                        const subSitemapUrl = sitemap.loc[0];
                        const response = await axios.get(subSitemapUrl, {
                            timeout: 10000,
                            headers: { "User-Agent": "Mozilla/5.0 (compatible; SiteAuditor/1.0)" }
                        });

                        if (response.status === 200) {
                            const subUrls = await parseSitemap(response.data, domain);
                            urls.push(...subUrls);
                        }
                    } catch (error) {
                        console.error(`Error fetching sub-sitemap:`, error.message);
                    }
                }
            }
        }

        // Handle regular sitemap (contains page URLs)
        if (result.urlset && result.urlset.url) {
            for (const url of result.urlset.url) {
                if (url.loc && url.loc[0]) {
                    const pageUrl = url.loc[0];
                    // Only include URLs from the same domain
                    if (pageUrl.startsWith(domain)) {
                        urls.push(pageUrl);
                    }
                }
            }
        }

    } catch (error) {
        console.error("Error parsing sitemap:", error.message);
    }

    return urls;
}

// Extracts internal links from a page
async function extractInternalLinks(url, domain) {
    const links = new Set();

    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; SiteAuditor/1.0)",
                "Accept": "text/html"
            },
            maxRedirects: 5
        });

        if (response.status === 200 && response.data) {
            const $ = cheerio.load(response.data);

            // Extract all href attributes
            $("a[href]").each((_, element) => {
                const href = $(element).attr("href");
                if (!href) return;

                try {
                    // Resolve relative URLs
                    const absoluteUrl = new URL(href, url);
                    // Include query params (search) to handle dynamic pages
                    const normalizedUrl = absoluteUrl.origin + absoluteUrl.pathname + absoluteUrl.search;

                    // Only include same-domain URLs, exclude files and fragments
                    // Extended file exclusion list
                    if (
                        absoluteUrl.origin === domain &&
                        !normalizedUrl.match(/\.(pdf|jpg|jpeg|png|gif|svg|zip|mp4|mp3|doc|docx|xls|xlsx|css|js|json|xml|woff|woff2|ttf|eot)$/i) &&
                        !normalizedUrl.includes("#") &&
                        normalizedUrl !== url // Don't include self
                    ) {
                        links.add(normalizedUrl);
                    }
                } catch (error) {
                    // Invalid URL, skip
                }
            });
        }

    } catch (error) {
        console.error(`Error extracting links from ${url}:`, error.message);
    }

    return Array.from(links);
}
