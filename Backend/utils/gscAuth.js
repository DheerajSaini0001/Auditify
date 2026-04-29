import fetch from 'node-fetch';
import configService from '../services/configService.js';

/**
 * Refreshes the Google Access Token using the Refresh Token.
 * @param {Object} user - The user document from MongoDB
 * @returns {Promise<string|null>} The new access token or null
 */
export const refreshGoogleToken = async (user) => {
  if (!user.googleRefreshToken) {
    console.warn(`[GSC Auth] No refresh token for user ${user.email}`);
    return null;
  }

  try {
    const clientID = configService.getConfig('GOOGLE_CLIENT_ID');
    const clientSecret = configService.getConfig('GOOGLE_CLIENT_SECRET');

    if (!clientID || !clientSecret) {
        throw new Error('Google OAuth credentials missing in configuration');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientID,
        client_secret: clientSecret,
        refresh_token: user.googleRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      user.googleAccessToken = data.access_token;
      // Update DB directly to avoid VersionError in calling controller if it also saves
      await user.constructor.updateOne(
        { _id: user._id },
        { $set: { googleAccessToken: data.access_token } }
      );
      console.log(`[GSC Auth] Token refreshed for ${user.email}`);
      return data.access_token;
    } else {
      console.error(`[GSC Auth] Refresh failed for ${user.email}:`, data);
      return null;
    }
  } catch (err) {
    console.error(`[GSC Auth] Error refreshing token for ${user.email}:`, err.message);
    return null;
  }
};

/**
 * Wrapper for GSC API calls that handles token expiration.
 * @param {string} url - GSC API endpoint
 * @param {Object} user - The user document
 * @returns {Promise<Response>}
 */
export const fetchGSC = async (url, user) => {
  let response = await fetch(url, {
    headers: { Authorization: `Bearer ${user.googleAccessToken}` }
  });

  if (response.status === 401) {
    console.log(`[GSC Auth] Token 401 for ${user.email}, attempting refresh...`);
    const newToken = await refreshGoogleToken(user);
    if (newToken) {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${newToken}` }
      });
    }
  }

  return response;
};
