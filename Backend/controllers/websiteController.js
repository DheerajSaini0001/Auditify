import User from '../models/User.js';
import { fetchGSC } from '../utils/gscAuth.js';

// 4.5.1 Add website to user profile
export const addWebsite = async (req, res) => {
  try {
    let { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL is required' });

    try {
      new URL(url);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid URL format' });
    }

    // Normalize URL
    url = url.toLowerCase().replace(/\/$/, "");

    // Check existing
    const existing = req.user.websites.find(site => site.url.toLowerCase() === url);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Website already added' });
    }

    req.user.websites.push({ url, verified: false, siteId: null });
    await req.user.save();

    res.status(201).json({ success: true, message: 'Website added. Click Verify to connect with Google Search Console.' });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 4.5.2 Verify owner in Google Search Console
export const verifyWebsite = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    const website = req.user.websites.find(site => site.url.toLowerCase() === url.toLowerCase());
    if (!website) {
      return res.status(404).json({ message: 'Website not found in your list' });
    }

    if (req.user.authProvider !== 'google' || !req.user.googleAccessToken) {
      return res.status(400).json({ success: false, message: 'Please log in with Google to verify via Search Console' });
    }

    // Call GSC API using helper (handles auto-refresh)
    const gscRes = await fetchGSC(
      'https://www.googleapis.com/webmasters/v3/sites',
      req.user
    );

    if (gscRes.status === 401) {
      return res.status(401).json({ success: false, message: 'Google session expired. Please re-login with Google.' });
    }

    const gscData = await gscRes.json();
    const siteEntries = gscData.siteEntry || [];

    // Matching logic
    const normalize = (u) => u.toLowerCase().replace(/\/$/, "").replace(/^https?:\/\//, "");
    const targetUrlNorm = normalize(url);

    const matchedSite = siteEntries.find(entry => {
      let entryUrl = entry.siteUrl.toLowerCase().replace(/\/$/, "");
      
      // Check for sc-domain: prefix
      if (entryUrl.startsWith('sc-domain:')) {
        return entryUrl.replace('sc-domain:', '') === targetUrlNorm;
      }
      
      return normalize(entryUrl) === targetUrlNorm;
    });

    if (matchedSite) {
      website.verified = true;
      website.siteId = matchedSite.siteUrl;
      website.verifiedAt = new Date();
      website.permissionLevel = matchedSite.permissionLevel;
      await req.user.save();

      return res.json({ success: true, message: 'Website verified successfully!', website });
    }

    res.status(200).json({ 
      success: false, 
      message: 'Website not found in your Google Search Console. Ensure you have added and verified it in GSC first.' 
    });

  } catch (err) {
    console.error('[Verify GSC] Error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 4.5.3 List user's websites
export const getWebsites = async (req, res) => {
  res.json({ success: true, websites: req.user.websites });
};

// 4.5.4 Remove website from list
export const removeWebsite = async (req, res) => {
  try {
    const { websiteId } = req.params;
    req.user.websites.pull({ _id: websiteId });
    await req.user.save();
    res.json({ success: true, message: 'Website removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 4.5.5 Sync with GSC (Manual or Auto trigger)
export const syncWebsites = async (req, res) => {
  try {
    if (req.user.authProvider !== 'google' || !req.user.googleAccessToken) {
      return res.status(400).json({ success: false, message: 'Google login required for sync' });
    }

    const gscRes = await fetchGSC(
      'https://www.googleapis.com/webmasters/v3/sites',
      req.user
    );

    if (gscRes.status === 401) {
      return res.status(401).json({ 
        success: false, 
        message: 'Google Search Console session expired. Please re-login with Google to sync.' 
      });
    }

    if (!gscRes.ok) {
      const errorText = await gscRes.text().catch(() => 'Unknown error');
      console.error('[Sync GSC] GSC API Error:', gscRes.status, errorText);
      throw new Error(`GSC API returned ${gscRes.status}`);
    }

    const gscData = await gscRes.json();
    const siteEntries = gscData.siteEntry || [];

    console.log(`[Sync GSC] API returned ${siteEntries.length} properties for user ${req.user.email}`);

    let addedCount = 0;
    // Normalize existing URLs for reliable comparison
    const existingUrls = req.user.websites.map(s => s.url.toLowerCase().replace(/\/$/, ""));

    for (const site of siteEntries) {
      const siteUrl = site.siteUrl.toLowerCase().replace(/\/$/, "");
      
      // If it's not already in our list, add it
      if (!existingUrls.includes(siteUrl)) {
        req.user.websites.push({
          url: siteUrl,
          verified: true, 
          siteId: site.siteUrl,
          verifiedAt: new Date(),
          permissionLevel: site.permissionLevel
        });
        addedCount++;
      }
    }

    if (addedCount > 0) await req.user.save();

    res.json({ 
      success: true, 
      message: `Sync complete. ${addedCount} new properties found.`,
      websites: req.user.websites 
    });

  } catch (err) {
    console.error('[Sync GSC] Critical Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Sync failed due to an internal error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
