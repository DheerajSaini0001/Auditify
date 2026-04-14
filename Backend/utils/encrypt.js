import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recommended for GCM
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.error('❌ ENCRYPTION_KEY is missing in .env file');
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Format: iv:encryptedData:authTag
 * @param {string} text 
 * @returns {string}
 */
export const encrypt = (text) => {
  if (!text) return text;
  if (!ENCRYPTION_KEY) return text;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      ALGORITHM, 
      crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32), 
      iv
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypts text using AES-256-GCM.
 * @param {string} encryptedText 
 * @returns {string}
 */
export const decrypt = (encryptedText) => {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  if (!ENCRYPTION_KEY) return encryptedText;

  try {
    const [ivHex, encrypted, authTagHex] = encryptedText.split(':');
    
    if (!ivHex || !encrypted || !authTagHex) return encryptedText;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32), 
      iv
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // If decryption fails, it might not be encrypted or key is wrong
    return encryptedText;
  }
};
