// Discover SRP / VDP / finance / trade pages from dealer homepages, for the
// page-type phase of the weight-calibration batch. Uses the SAME classifier the
// page score uses (utils/sectionWeights.js), so a discovered "srp" is exactly
// what the audit will weight as an SRP.
//
// VDPs are rarely linked from the homepage, so for each site that yields an SRP
// we fetch the SRP too and take the first VDP link found there.
//
// Usage: node scripts/discoverPages.js <homes.txt> <pages-out.txt>

import fs from "fs";
import { classifyPageType } from "../utils/sectionWeights.js";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const homes = fs.readFileSync(process.argv[2], "utf8")
  .split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
const outFile = process.argv[3];

const getLinks = async (url) => {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    const html = await res.text();
    const base = new URL(res.url || url);
    const hrefs = [...html.matchAll(/href\s*=\s*["']([^"'#?]+)[^"']*["']/gi)].map((m) => m[1]);
    const links = new Set();
    for (const h of hrefs) {
      try {
        const u = new URL(h, base);
        if (u.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) continue;
        links.add(u.origin + u.pathname);
      } catch { /* skip bad href */ }
    }
    return [...links];
  } catch { return null; }
};

const WANT = ["srp", "finance", "trade"];

(async () => {
  const out = [];
  for (const home of homes) {
    const links = await getLinks(home);
    if (!links) { console.log(`SKIP (unreachable to plain fetch) ${home}`); continue; }
    const picked = {};
    for (const l of links) {
      const t = classifyPageType(l);
      if (WANT.includes(t) && !picked[t]) picked[t] = l;
    }
    // VDP via the SRP (vehicle links live on inventory pages, not the homepage)
    if (picked.srp) {
      const srpLinks = await getLinks(picked.srp);
      if (srpLinks) {
        const vdp = srpLinks.find((l) => classifyPageType(l) === "vdp");
        if (vdp) picked.vdp = vdp;
      }
    }
    const found = Object.entries(picked);
    console.log(`${home} → ${found.map(([t]) => t).join(", ") || "nothing found"}`);
    found.forEach(([t, u]) => out.push(`${u},${t}`));
  }
  fs.writeFileSync(outFile, out.join("\n") + "\n");
  console.log(`\nWrote ${out.length} page URLs to ${outFile}`);
})();
