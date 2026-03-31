import { v4 as uuidv4 } from "uuid";
import { UAParser } from "ua-parser-js";

const trackingMiddleware = (req, res, next) => {
  // 1. Session ID Handling
  let sessionId = req.cookies.sessionId;

  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
    });
  }

  const parser = new UAParser(req.headers["user-agent"]);
  const uaResults = parser.getResult();

  let ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";
  
  // Normalize localhost IPs
  if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") {
    ip = "127.0.0.1";
  }

  // Try to get location from headers (Cloudflare, etc.)
  // Try to get location from headers (Cloudflare, etc.)
  let country = req.headers["cf-ipcountry"] || req.headers["x-country-code"] || "unknown";
  let region = req.headers["cf-region-code"] || req.headers["cf-region"] || "unknown"; // State
  let city = req.headers["cf-ipcity"] || "unknown";

  // If localhost, set friendly location labels
  if (ip === "127.0.0.1") {
    country = "Localhost";
    region = "Development-Lab"; // State label for localhost
    city = "Workstation";
  }

  const device = uaResults.device.type || "desktop";
  const browser = `${uaResults.browser.name || "unknown"} ${uaResults.browser.version || ""}`.trim();
  const os = `${uaResults.os.name || "unknown"} ${uaResults.os.version || ""}`.trim();

  // Resolution and other client-side info will be attached from req.body or headers
  const screenResolution = req.headers["x-screen-resolution"] || "unknown";
  const referrer = req.headers["referer"] || "direct";
  const entryPage = req.originalUrl || "/";

  // 3. Attach metadata to request object for later logging
  req.tracking = {
    sessionId,
    ip,
    country,
    region,
    city,
    device,
    browser,
    os,
    screenResolution,
    referrer,
    entryPage,
  };

  next();
};

export default trackingMiddleware;
