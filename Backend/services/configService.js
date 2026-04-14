import NodeCache from 'node-cache';
import PlatformConfig from '../models/PlatformConfig.js';
import { encrypt, decrypt } from '../utils/encrypt.js';
import dotenv from 'dotenv';

dotenv.config();

// Standard TTL 0 means items never expire from cache unless manual refresh
const cache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

class ConfigService {
  constructor() {
    this.isInitialized = false;
    this.lastRefresh = null;
  }

  /**
   * Initializer: On startup, check for default keys and sync from process.env if missing in DB.
   */
  async initialize() {
    console.log('🚀 [ConfigService] Initializing Dynamic Platform Configuration...');

    const defaultKeys = [
      // ── API Keys & Third Party ──
      { key: 'GEMINI_API_KEY', label: 'Gemini AI API Key', group: 'google', isSecret: true },
      { key: 'API_KEY', label: 'Google Maps/Search API Key', group: 'google', isSecret: true },
      { key: 'SafeBrowsing', label: 'Google Safe Browsing Key', group: 'google', isSecret: true },
      { key: 'vt_key', label: 'VirusTotal API Key', group: 'security', isSecret: true },
      { key: 'RECAPTCHA_SECRET_KEY', label: 'reCAPTCHA Secret Key', group: 'google', isSecret: true },
      { key: 'RECAPTCHA_VERIFY_URL', label: 'reCAPTCHA Verify URL', group: 'google', isSecret: false },
      
      // ── Authentication & Security ──
      { key: 'JWT_SECRET', label: 'JWT Authentication Secret', group: 'security', isSecret: true },
      { key: 'JWT_EXPIRY', label: 'JWT Expiry Duration', group: 'security', isSecret: false },
      { key: 'JWT_EXPIRES_IN', label: 'JWT Refresh Token Expiry', group: 'security', isSecret: false },
      { key: 'ENCRYPTION_KEY', label: 'Master Encryption Key', group: 'security', isSecret: true },
      { key: 'CONFIG_ENCRYPTION_KEY', label: 'Legacy Config Encryption Key', group: 'security', isSecret: true },
      { key: 'SESSION_SECRET', label: 'Express Session Secret', group: 'security', isSecret: true },
      
      // ── Google OAuth ──
      { key: 'GOOGLE_CLIENT_ID', label: 'Google OAuth Client ID', group: 'google', isSecret: false },
      { key: 'GOOGLE_CLIENT_SECRET', label: 'Google OAuth Client Secret', group: 'google', isSecret: true },
      { key: 'GOOGLE_CALLBACK_URL', label: 'Google OAuth Callback URL', group: 'google', isSecret: false },
      
      // ── Email (SMTP) ──
      { key: 'SMTP_HOST', label: 'SMTP Mail Host', group: 'email', isSecret: false },
      { key: 'SMTP_PORT', label: 'SMTP Mail Port', group: 'email', isSecret: false },
      { key: 'SMTP_USER', label: 'SMTP Mail User', group: 'email', isSecret: false },
      { key: 'SMTP_PASS', label: 'SMTP Mail Password', group: 'email', isSecret: true },
      { key: 'EMAIL_FROM', label: 'Email Sender Address', group: 'email', isSecret: false },
      
      // ── App Settings ──
      { key: 'PORT', label: 'Backend Server Port', group: 'app', isSecret: false },
      { key: 'NODE_ENV', label: 'Environment (prod/dev)', group: 'app', isSecret: false },
      { key: 'FRONTEND_URL', label: 'Frontend Application URL', group: 'app', isSecret: false },
      { key: 'RATE_LIMIT_WINDOW_MS', label: 'Rate Limit Window (ms)', group: 'app', isSecret: false },
      { key: 'RATE_LIMIT_MAX_REQUESTS', label: 'Max Requests per Window', group: 'app', isSecret: false },
      
      // ── Database ──
      { key: 'MONGO_URI', label: 'MongoDB Connection String', group: 'database', isSecret: true }
    ];

    try {
      for (const config of defaultKeys) {
        const exists = await PlatformConfig.findOne({ key: config.key.toUpperCase() });
        
        if (!exists && process.env[config.key]) {
          const rawValue = process.env[config.key];
          const valueToSave = config.isSecret ? encrypt(rawValue) : rawValue;

          await PlatformConfig.create({
            key: config.key.toUpperCase(),
            value: valueToSave,
            label: config.label,
            group: config.group,
            isSecret: config.isSecret,
            updatedBy: null // System initialized
          });
          console.log(`✅ [ConfigService] Synced "${config.key}" from .env to Database`);
        }
      }

      await this.refreshCache();
      this.isInitialized = true;
      this.lastRefresh = new Date();
      console.log('✅ [ConfigService] System initialized and cache primed.');
    } catch (error) {
      console.error('❌ [ConfigService] Initialization failed:', error.message);
      this.isInitialized = false;
    }
  }

  /**
   * Returns stats for the admin dashboard.
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      loadedKeys: cache.keys().length,
      lastRefresh: this.lastRefresh,
      cacheStats: cache.getStats()
    };
  }

  /**
   * Alias for refreshCache for controller compatibility.
   */
  async refresh() {
    return await this.refreshCache();
  }

  /**
   * Manually set a config in the cache (used after DB updates).
   */
  setConfig(key, value) {
    const upperKey = key.toUpperCase();
    cache.set(upperKey, value);
    this.lastRefresh = new Date();
  }

  /**
   * Manually delete a config from the cache.
   */
  deleteConfig(key) {
    cache.del(key.toUpperCase());
    this.lastRefresh = new Date();
  }

  /**
   * Returns the value from cache (or DB if cache miss).
   * Automatically decrypts if marked as secret.
   * @param {string} key 
   */
  async get(key) {
    const upperKey = key.toUpperCase();
    let value = cache.get(upperKey);

    if (value === undefined) {
      const config = await PlatformConfig.findOne({ key: upperKey });
      if (config) {
        value = config.isSecret ? decrypt(config.value) : config.value;
        cache.set(upperKey, value);
      } else {
        // Fallback to process.env if not in DB at all
        value = process.env[upperKey];
      }
    }

    return value;
  }

  /**
   * Compatibility method for synchronous access in server setup.
   * Note: This might return null if the cache isn't primed yet.
   */
  getConfig(key, defaultValue = null) {
    const value = cache.get(key.toUpperCase());
    return value !== undefined ? value : (process.env[key] || defaultValue);
  }

  /**
   * Reloadall settings from DB to Cache.
   */
  async refreshCache() {
    try {
      const configs = await PlatformConfig.find({});
      cache.flushAll();

      configs.forEach(config => {
        const value = config.isSecret ? decrypt(config.value) : config.value;
        cache.set(config.key, value);
      });

      console.log(`♻️ [ConfigService] Cache refreshed. ${configs.length} items loaded.`);
      return true;
    } catch (error) {
      console.error('❌ [ConfigService] Cache refresh failed:', error.message);
      return false;
    }
  }
}

export default new ConfigService();
