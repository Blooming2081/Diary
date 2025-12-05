import crypto from 'crypto';

// Server Secret for encrypting the user's key in the DB
// In production, this should be a long, random string in .env
const SERVER_SECRET = process.env.ENCRYPTION_SECRET || 'default-insecure-secret-change-me';

// Algorithm for key encryption (DB storage)
const KEY_ALGO = 'aes-256-cbc';

// Algorithm for image encryption (File storage)
const IMAGE_ALGO = 'aes-256-cbc';

/**
 * Encrypts the user's raw security key for storage in the DB.
 * Uses the SERVER_SECRET.
 */
export function encryptKey(rawKey: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(SERVER_SECRET, 'salt', 32); // Derive 32-byte key from secret
    const cipher = crypto.createCipheriv(KEY_ALGO, key, iv);
    let encrypted = cipher.update(rawKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts the user's security key from the DB.
 * Uses the SERVER_SECRET.
 */
export function decryptKey(encryptedKey: string): string {
    const textParts = encryptedKey.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = textParts.join(':');
    const key = crypto.scryptSync(SERVER_SECRET, 'salt', 32);
    const decipher = crypto.createDecipheriv(KEY_ALGO, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * Generates a new random 32-byte hex key for a user.
 */
export function generateUserKey(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Encrypts an image buffer using the user's security key.
 */
export function encryptImage(buffer: Buffer, userKey: string): Buffer {
    const iv = crypto.randomBytes(16);
    // User key is already 32 bytes hex (64 chars), but we need 32 bytes buffer.
    // However, generateUserKey returns 64 chars hex string.
    // Let's treat the userKey string as the passphrase and derive a 32-byte key from it,
    // OR if it's already a hex string of 32 bytes (64 chars), we can use it directly if we parse it.
    // For simplicity and robustness, let's derive a key from the userKey string.
    const key = crypto.scryptSync(userKey, 'image-salt', 32);

    const cipher = crypto.createCipheriv(IMAGE_ALGO, key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

    // Prepend IV to the encrypted data
    return Buffer.concat([iv, encrypted]);
}

/**
 * Decrypts an image buffer using the user's security key.
 */
export function decryptImage(buffer: Buffer, userKey: string): Buffer {
    // Extract IV (first 16 bytes)
    const iv = buffer.subarray(0, 16);
    const encryptedData = buffer.subarray(16);

    const key = crypto.scryptSync(userKey, 'image-salt', 32);
    const decipher = crypto.createDecipheriv(IMAGE_ALGO, key, iv);

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted;
}
