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
 * What encrypt() above actually emits: `iv:data:tag` in hex, with a 12-byte IV
 * (24 hex chars) and a 16-byte GCM tag (32 hex chars).
 *
 * Matched BEFORE attempting anything, because callers now run plaintext through
 * here too — ConfigService decrypts every stored value rather than only the ones
 * flagged secret, so that a row written encrypted-but-unflagged still comes back
 * readable. Merely containing a colon is not ciphertext: without this test,
 * "http://localhost:5173" and every mongodb:// URI hit the cipher, threw, and
 * printed a stack trace on every single boot.
 */
const CIPHERTEXT_RE = /^[0-9a-f]{24}:[0-9a-f]+:[0-9a-f]{32}$/i;

/**
 * Decrypts text using AES-256-GCM. Anything that isn't this scheme's ciphertext is
 * returned untouched, so it is safe to call on a value of unknown provenance.
 * @param {string} encryptedText
 * @returns {string}
 */
export const decrypt = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
  if (!CIPHERTEXT_RE.test(encryptedText)) return encryptedText;
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
    // The shape check above already ruled out "this was never encrypted", so
    // reaching here means real ciphertext this process cannot open — almost always
    // an ENCRYPTION_KEY that differs from the one it was written with. Returning
    // the ciphertext keeps the caller alive, and this line is the only warning that
    // whatever asked for the value is now holding garbage.
    console.error(`Decryption failed — ENCRYPTION_KEY likely does not match the key this value was encrypted with: ${error.message}`);
    return encryptedText;
  }
};
