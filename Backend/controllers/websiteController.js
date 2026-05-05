import User from '../models/User.js';
import { fetchGSC } from '../utils/gscAuth.js';

/* ===========================
   🔧 Common URL Normalizer
=========================== */
const normalize = (u) =>
  u.toLowerCase()
   .replace(/\/$/, "")
   .replace(/^https?:\/\//, "")
   .replace(/^sc-domain:/, "");


/* ===========================
   1. Add Website
=========================== */
export const addWebsite = async (req, res) => {
  try {
    let { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    try {
      new URL(url);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid URL format' });
    }

    const normalizedUrl = normalize(url);

    const exists = req.user.websites.find(
      site => normalize(site.url) === normalizedUrl
    );

    if (exists) {
      return res.status(409).json({ success: false, message: 'Website already added' });
    }

    req.user.websites.push({
      url,
      verified: false,
      siteId: null
    });

    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Website added. Click Verify to connect with Google Search Console.'
    });

  } catch (err) {
    console.error('[Add Website]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


/* ===========================
   2. Verify Website (GSC)
=========================== */
export const verifyWebsite = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const website = req.user.websites.find(
      site => normalize(site.url) === normalize(url)
    );

    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    if (req.user.authProvider !== 'google' || !req.user.googleAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Please login with Google'
      });
    }

    const gscRes = await fetchGSC(
      'https://www.googleapis.com/webmasters/v3/sites',
      req.user
    );

    if (gscRes.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Google session expired. Re-login required.'
      });
    }

    const gscData = await gscRes.json();
    const siteEntries = gscData.siteEntry || [];

    const target = normalize(url);

    const matched = siteEntries.find(entry =>
      normalize(entry.siteUrl) === target
    );

    if (!matched) {
      return res.status(200).json({
        success: false,
        message: 'Website not found in GSC'
      });
    }

    website.verified = true;
    website.siteId = matched.siteUrl;
    website.permissionLevel = matched.permissionLevel;
    website.verifiedAt = new Date();

    await req.user.save();

    res.json({
      success: true,
      message: 'Website verified successfully!',
      website
    });

  } catch (err) {
    console.error('[Verify GSC]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


/* ===========================
   3. Get Websites
=========================== */
export const getWebsites = async (req, res) => {
  res.json({ success: true, websites: req.user.websites });
};


/* ===========================
   4. Remove Website
=========================== */
export const removeWebsite = async (req, res) => {
  try {
    const { websiteId } = req.params;

    req.user.websites.pull({ _id: websiteId });
    await req.user.save();

    res.json({ success: true, message: 'Website removed' });

  } catch (err) {
    console.error('[Remove Website]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


/* ===========================
   5. Sync Websites (BEST VERSION)
=========================== */
export const syncWebsites = async (req, res) => {
  try {
    if (req.user.authProvider !== 'google' || !req.user.googleAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Google login required'
      });
    }

    const gscRes = await fetchGSC(
      'https://www.googleapis.com/webmasters/v3/sites',
      req.user
    );

    if (gscRes.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Re-login required.'
      });
    }

    if (!gscRes.ok) {
      const errorText = await gscRes.text();
      console.error('[GSC API Error]', errorText);
      throw new Error('GSC API failed');
    }

    const gscData = await gscRes.json();
    const siteEntries = gscData.siteEntry || [];

    console.log(`[GSC Sync] ${siteEntries.length} properties fetched`);

    const existingMap = new Map();

    req.user.websites.forEach(site => {
      existingMap.set(normalize(site.url), site);
    });

    let added = 0;
    let updated = 0;

    for (const site of siteEntries) {
      const norm = normalize(site.siteUrl);

      const existing = existingMap.get(norm);

      if (existing) {
        // 🔁 Update existing
        existing.verified = true;
        existing.siteId = site.siteUrl;
        existing.permissionLevel = site.permissionLevel;
        existing.verifiedAt = new Date();
        updated++;
      } else {
        // ➕ Add new
        req.user.websites.push({
          url: site.siteUrl,
          verified: true,
          siteId: site.siteUrl,
          permissionLevel: site.permissionLevel,
          verifiedAt: new Date()
        });
        added++;
      }
    }

    if (added || updated) {
      await req.user.save();
    }

    res.json({
      success: true,
      message: `Sync complete. Added: ${added}, Updated: ${updated}`,
      websites: req.user.websites
    });

  } catch (err) {
    console.error('[Sync GSC]', err);

    res.status(500).json({
      success: false,
      message: 'Sync failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
