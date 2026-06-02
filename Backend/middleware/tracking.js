import { v4 as uuidv4 } from "uuid";
import { UAParser } from "ua-parser-js";
import fetch from "node-fetch";
import NodeCache from "node-cache";
import configService from "../services/configService.js";
import logger from "../utils/logger.js";

// Cache GeoIP lookups for 24 hours to avoid hitting API limits
const geoCache = new NodeCache({ stdTTL: 86400 });

const trackingMiddleware = async (req, res, next) => {
  // 1. Session ID Handling
  let sessionId = req.cookies.sessionId;

  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: configService.getConfig('NODE_ENV', 'development') === "production",
    });
  }

  const parser = new UAParser(req.headers["user-agent"]);
  const uaResults = parser.getResult();

  let ip = req.headers["x-forwarded-for"]?.split(",")[0] || 
           req.headers["x-real-ip"] || 
           req.socket.remoteAddress || 
           "unknown";
  
  // Normalize IPv4-mapped IPv6 addresses and localhost
  if (ip.includes("::ffff:")) {
    ip = ip.split(":").pop();
  }
  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  // 2. Location Detection
  let country = req.headers["cf-ipcountry"] || req.headers["x-country-code"];
  let region = req.headers["cf-region-code"] || req.headers["cf-region"]; 
  let city = req.headers["cf-ipcity"];

  // Fallback for non-Cloudflare environments using GeoIP API
  if (!country && ip !== "unknown" && ip !== "127.0.0.1") {
    const cachedGeo = geoCache.get(ip);
    if (cachedGeo) {
      country = cachedGeo.country;
      region = cachedGeo.region;
      city = cachedGeo.city;
    } else {
      try {
        // Use ip-api.com (Free tier, no key needed for 45 req/min)
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
        const data = await response.json();
        
        if (data?.status === "success") {
          country = data.country;
          region = data.regionName;
          city = data.city;
          // Store in cache
          geoCache.set(ip, { country, region, city });
        }
      } catch (err) {
        logger.error(`[GeoIP] Lookup failed for ${ip}`, new Error(err.message));
      }
    }
  }

  // Final defaults if everything fails
  country = country || "unknown";
  region = region || "unknown";
  city = city || "unknown";

  // If localhost, set friendly location labels
  if (ip === "127.0.0.1") {
    country = "Localhost";
    region = "Development-Lab"; 
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
