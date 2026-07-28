import { discoverDealerPages } from "../utils/pageDiscovery.js";
import { detectSiteType } from "../utils/siteTypeDetector.js";
import logger from "../utils/logger.js";

/**
 * POST /single-audit/discover
 * Body: { url }
 *
 * Classifies the site as dealer / corporate / unknown (one homepage fetch,
 * escalating to a stealth browser and probing likely subpages when needed —
 * see siteTypeDetector.js), then runs the sitemap → robots.txt → crawl
 * discovery against the matching taxonomy and returns the site's main pages
 * bucketed into the checklist categories.
 *
 * Product decision: Auditify only audits dealership and automotive
 * corporate/OEM sites. A confident "unknown" (or inconclusive — couldn't be
 * evaluated even after the bot-bypass/probing escalation) is REJECTED here,
 * before any page discovery runs, rather than failing open. This is the main
 * gate — singleAuditController's /audit has the same check as a defense-in-
 * depth backstop for direct API callers.
 *
 * Sits behind the same gate as /audit (tryAuthenticate + guestAuditGate), so
 * guests reuse the short-lived email-verification grant they already hold
 * (body `auditToken` or the `x-audit-token` header).
 */
export const discover = async (req, res) => {
  try {
    let { url, scopes } = req.body || {};
    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ error: "Missing required field: url" });
    }

    url = url.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;

    // Optional: restrict discovery to the page types the user kept selected in the
    // form. When omitted (or not an array), every page type is discovered as before.
    const scopeList = Array.isArray(scopes)
      ? scopes.filter((s) => typeof s === "string")
      : null;

    const detection = await detectSiteType(url);

    if (detection.siteType !== "dealer" && detection.siteType !== "corporate") {
      logger.info(`🚫 Rejected discovery — not a dealer or automotive corporate site: ${url} (${detection.reason})`);
      return res.status(400).json({
        error: "This doesn't look like a dealership or automotive corporate/OEM website. Auditify only audits dealer and automotive-corporate sites.",
        siteType: "unknown",
        reason: detection.reason,
      });
    }

    // detection.resolvedUrl may differ from the URL the user typed — e.g. a
    // bare apex domain ("example.com") that fails outright (TLS/DNS-level)
    // while "www.example.com" works fine. Classification already succeeded
    // against the working hostname; page discovery MUST crawl that same
    // hostname too, or it repeats the identical failure and finds nothing.
    if (detection.resolvedUrl && detection.resolvedUrl !== url) {
      logger.info(`[discovery] ${url} didn't resolve directly — discovering against ${detection.resolvedUrl} instead`);
    }
    const result = await discoverDealerPages(detection.resolvedUrl || url, scopeList, detection.siteType);
    result.siteType = detection.siteType;
    result.siteTypeConfidence = detection.confidence;
    return res.status(200).json(result);
  } catch (err) {
    if (err?.code === "UNSAFE_URL") {
      return res.status(400).json({ error: `Invalid or restricted URL — ${err.message}` });
    }
    logger.error("[discovery] controller failed", err);
    return res.status(500).json({ error: "Page discovery failed", details: err.message });
  }
};

export default discover;
