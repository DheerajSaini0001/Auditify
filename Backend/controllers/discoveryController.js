import { discoverDealerPages } from "../utils/pageDiscovery.js";
import logger from "../utils/logger.js";

/**
 * POST /single-audit/discover
 * Body: { url }
 *
 * Runs the sitemap → robots.txt → crawl discovery and returns the dealership's
 * main pages bucketed into the fixed checklist categories. Sits behind the same
 * gate as /audit (tryAuthenticate + guestAuditGate), so guests reuse the
 * short-lived email-verification grant they already hold (body `auditToken` or
 * the `x-audit-token` header).
 */
export const discover = async (req, res) => {
  try {
    let { url } = req.body || {};
    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ error: "Missing required field: url" });
    }

    url = url.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;

    const result = await discoverDealerPages(url);
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
