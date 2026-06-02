import User from '../models/User.js';
import { fetchGSC } from '../utils/gscAuth.js';
import logger from '../utils/logger.js';

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
    logger.error('[Add Website]', err);
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
    logger.error('[Verify GSC]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


/* ===========================
   3. Get Websites
=========================== */
export const getWebsites = async (req, res) => {
  try {
    const { q } = req.query;
    let websites = req.user.websites;
    if (q) {
      const query = q.toLowerCase();
      websites = websites.filter(site => site.url.toLowerCase().includes(query));
    }
    res.json({ success: true, websites });
  } catch (err) {
    logger.error('[Get Websites]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
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
    logger.error('[Remove Website]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


/* ===========================
   5. Sync Websites (ROBUST VERSION)
=========================== */
export const syncWebsites = async (req, res) => {
  try {
    // 1. Verify User and Google Connection
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
    }

    if (req.user.authProvider !== 'google' || !req.user.googleAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Action required: Please login with Google to sync your Search Console properties.'
      });
    }

    // 2. Fetch data from Google Search Console API
    let gscRes;
    try {
      gscRes = await fetchGSC(
        'https://www.googleapis.com/webmasters/v3/sites',
        req.user
      );
    } catch (fetchErr) {
      logger.error('[GSC Fetch Error]', fetchErr);
      return res.status(502).json({
        success: false,
        message: 'Failed to communicate with Google API. Please try again later.'
      });
    }

    // Handle session expiration
    if (gscRes.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Google session expired. Please logout and login again.'
      });
    }

    // Handle other API errors
    if (!gscRes.ok) {
      const errorBody = await gscRes.text();
      logger.error('[GSC API Error Response]', new Error(errorBody));
      return res.status(gscRes.status).json({
        success: false,
        message: 'Google Search Console API error',
        details: process.env.NODE_ENV === 'development' ? errorBody : undefined
      });
    }

    const gscData = await gscRes.json();
    const siteEntries = gscData.siteEntry || [];

    logger.info(`[GSC Sync] Found ${siteEntries.length} properties for ${req.user.email}`);

    // 3. Merge Logic (Comparison using Normalized URL)
    const existingWebsites = req.user.websites.map(s => s.toObject ? s.toObject() : s);
    const updatedWebsites = [...existingWebsites];

    let added = 0;
    let updated = 0;

    // Define valid permission levels to prevent Mongoose validation errors
    const validPermissions = ['siteOwner', 'siteFullUser', 'siteRestrictedUser', 'siteUnverifiedUser'];

    for (const site of siteEntries) {
      const norm = normalize(site.siteUrl);
      const existingIdx = updatedWebsites.findIndex(s => normalize(s.url) === norm);

      const permission = validPermissions.includes(site.permissionLevel)
        ? site.permissionLevel
        : 'siteUnverifiedUser';

      if (existingIdx !== -1) {
        // Update existing website record
        updatedWebsites[existingIdx] = {
          ...updatedWebsites[existingIdx],
          verified: true,
          siteId: site.siteUrl, // Save ORIGINAL siteUrl as siteId (crucial for performance API)
          permissionLevel: permission,
          verifiedAt: new Date()
        };
        updated++;
      } else {
        // Add new website record
        updatedWebsites.push({
          url: site.siteUrl,
          verified: true,
          siteId: site.siteUrl,
          permissionLevel: permission,
          verifiedAt: new Date(),
          addedAt: new Date()
        });
        added++;
      }
    }

    // 4. Atomic Update using findByIdAndUpdate
    // This avoids VersionError and ensures the update is atomic
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { websites: updatedWebsites } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User record not found' });
    }

    res.json({
      success: true,
      message: `Successfully synced ${siteEntries.length} properties. (Added: ${added}, Updated: ${updated})`,
      websites: updatedUser.websites
    });

  } catch (err) {
    logger.error('[Sync Websites Exception]', err);

    // Distinguish between validation errors and generic errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Data validation failed during sync',
        errors: err.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during GSC synchronization',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
