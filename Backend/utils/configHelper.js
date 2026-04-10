import AppConfig from '../models/AppConfig.js';
import { decrypt } from './encryption.js';
import dotenv from 'dotenv';
dotenv.config();

const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes

export const getConfig = async (key, fallbackEnv = null) => {
  // 1. Check Cache
  if (cache.has(key)) {
    const cached = cache.get(key);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }
  }

  try {
    // 2. Check Database
    const config = await AppConfig.findOne({ key });
    if (config) {
      const decryptedValue = decrypt(config.value);
      cache.set(key, { value: decryptedValue, timestamp: Date.now() });
      return decryptedValue;
    }
  } catch (err) {
    console.error(`Error fetching config for ${key}:`, err.message);
  }

  // 3. Fallback to Env
  const envKey = fallbackEnv || key;
  const envValue = process.env[envKey];
  
  if (envValue !== undefined) {
    return envValue;
  }

  return null;
};

export const clearConfigCache = (key) => {
  if (key) cache.delete(key);
  else cache.clear();
};
