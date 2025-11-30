/**
 * AES-256-GCM Encryption Utility
 *
 * Provides secure encryption/decryption for sensitive data using AES-256-GCM.
 * Supports key rotation via encryption_key_id parameter.
 *
 * Security features:
 * - Authenticated encryption (GCM mode prevents tampering)
 * - Unique IV per encryption
 * - Key derivation from environment variables
 * - Support for multiple key versions
 */

import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "crypto";
import { env } from "~/env";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM (recommended)
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum

/**
 * Derive encryption key from environment variable
 *
 * @param keyId - Key identifier (e.g., 'default', 'v1', 'v2')
 * @returns 32-byte encryption key
 * @throws Error if key not found in environment
 */
function deriveKey(keyId: string): Buffer {
  // Try versioned key first (IDEXX_ENCRYPTION_KEY_V1, etc.)
  const versionedKey = process.env[`IDEXX_ENCRYPTION_KEY_${keyId.toUpperCase()}`];
  if (versionedKey) {
    return deriveKeyFromString(versionedKey, keyId);
  }

  // Fall back to default key
  if (keyId === "default" || keyId === "v1") {
    const defaultKey = env.IDEXX_ENCRYPTION_KEY;
    if (!defaultKey) {
      throw new Error(
        `IDEXX_ENCRYPTION_KEY not configured. Set IDEXX_ENCRYPTION_KEY or IDEXX_ENCRYPTION_KEY_${keyId.toUpperCase()} environment variable.`,
      );
    }
    return deriveKeyFromString(defaultKey, keyId);
  }

  // Try base key with keyId as salt
  const baseKey = process.env.IDEXX_ENCRYPTION_KEY;
  if (!baseKey) {
    throw new Error(
      `Encryption key not found for keyId: ${keyId}. Set IDEXX_ENCRYPTION_KEY or IDEXX_ENCRYPTION_KEY_${keyId.toUpperCase()} environment variable.`,
    );
  }

  return deriveKeyFromString(baseKey, keyId);
}

/**
 * Derive a 32-byte key from a string using PBKDF2
 *
 * @param keyString - Base key string from environment
 * @param salt - Salt for key derivation (keyId or fixed value)
 * @returns 32-byte derived key
 */
function deriveKeyFromString(keyString: string, salt: string): Buffer {
  // Use keyId as salt to ensure different keys for different keyIds
  const saltBuffer = Buffer.from(salt, "utf8");
  return pbkdf2Sync(keyString, saltBuffer, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Encrypt plaintext using AES-256-GCM
 *
 * @param plaintext - Text to encrypt
 * @param keyId - Encryption key identifier (default: 'default')
 * @returns Encrypted data with IV and auth tag prepended
 * @throws Error if encryption fails or key not found
 */
export function encrypt(
  plaintext: string,
  keyId?: string,
): { encrypted: Buffer; keyId: string } {
  const actualKeyId = keyId ?? "default";
  if (!plaintext) {
    throw new Error("Plaintext cannot be empty");
  }

  try {
    const key = deriveKey(actualKeyId);
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    // Encrypt the plaintext
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine: IV (12 bytes) + authTag (16 bytes) + encrypted data
    const result = Buffer.concat([iv, authTag, encrypted]);

    return {
      encrypted: result,
      keyId: actualKeyId,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("not configured")) {
      throw error;
    }
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`);
}

/**
 * Decrypt ciphertext using AES-256-GCM
 *
 * @param encrypted - Encrypted buffer (IV + authTag + data)
 * @param keyId - Encryption key identifier used for encryption
 * @returns Decrypted plaintext
 * @throws Error if decryption fails, key not found, or authentication fails
 */
export function decrypt(encrypted: Buffer, keyId: string): string {
  if (!encrypted || encrypted.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Invalid encrypted data: too short");
  }

  try {
    const key = deriveKey(keyId);

    // Extract components
    const iv = encrypted.subarray(0, IV_LENGTH);
    const authTag = encrypted.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = encrypted.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt and verify authentication tag
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    if (error instanceof Error) {
      // Authentication failure (tampered data or wrong key)
      if (error.message.includes("Unsupported state") || error.message.includes("bad decrypt")) {
        throw new Error("Decryption failed: Authentication tag verification failed. Data may be corrupted or key is incorrect.");
      }
      if (error.message.includes("not configured")) {
        throw error;
      }
      throw new Error(`Decryption failed: ${error.message}`);
    }
    throw new Error("Decryption failed: Unknown error");
  }
}

