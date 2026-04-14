import configService from '../services/configService.js';

/**
 * Get a configuration value via the centralized ConfigService.
 * 
 * Priority: In-memory cache (DB) → .env → null
 * 
 * This is a thin wrapper that delegates to configService.getConfig().
 * Business logic should use this instead of accessing process.env directly.
 * 
 * @param {string} key - The configuration key
 * @param {string} fallbackEnv - Optional alternate env var name to check
 * @returns {string|null}
 */
export const getConfig = (key, fallbackEnv = null) => {
  // Primary lookup through the config service
  const value = configService.getConfig(key);
  if (value !== null) {
    return value;
  }

  // If a different env key was specified as fallback, try that too
  if (fallbackEnv && fallbackEnv !== key) {
    const envValue = process.env[fallbackEnv];
    if (envValue !== undefined) return envValue;
  }

  return null;
};

/**
 * Clear config cache. Delegates to configService.
 * @param {string} [key] - Specific key to clear, or omit to clear all
 */
export const clearConfigCache = (key) => {
  if (key) {
    configService.deleteConfig(key);
  } else {
    // Full refresh is async — fire and forget
    configService.refresh().catch(err => {
      console.error('[configHelper] Cache refresh failed:', err.message);
    });
  }
};
