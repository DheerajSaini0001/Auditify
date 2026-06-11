import * as cheerio from "cheerio";
import seoMetrics from "./metricServices/seoMetrics.js";
for (const url of process.argv.slice(2)) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    const $ = cheerio.load(await r.text());
    const res = await seoMetrics(url, $, null);
    const e = res.EEAT?.meta || {};
    console.log("\n==== " + url + " | EEAT " + e.score10 + "/10 ====");
    console.log("discoveredPages:", JSON.stringify(e.discoveredPages));
    const c = e.checks || {};
    for (const k of Object.keys(c)) console.log("  " + k + " [" + c[k].mark + "/2]:", JSON.stringify(c[k].found));
  } catch (e) { console.log("ERR", url, e.message); }
}
