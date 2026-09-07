/**
 * AES-256-CBC token encryption using Node.js built-in `crypto` module.
 * Never logs keys or plaintext tokens.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

const SALT = "adv-mail-salt";
const KEY_LENGTH = 32;
const ALGORITHM = "aes-256-cbc";

function getDerivedKey(): Buffer {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is missing. Set it before using crypto utilities."
    );
  }
  return scryptSync(encryptionKey, SALT, KEY_LENGTH) as Buffer;
}

/**
 * Encrypts a plaintext string using AES-256-CBC.
 * Returns: iv_hex:ciphertext_hex
 */
export function encryptString(plaintext: string): string {
  const derivedKey = getDerivedKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, derivedKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * Decrypts a ciphertext string in the format iv_hex:ciphertext_hex.
 */
export function decryptString(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 2) {
    throw new Error("decryptString: invalid ciphertext format (expected iv:data)");
  }
  const [ivHex, encryptedHex] = parts;

  if (!isValidHex(ivHex) || !isValidHex(encryptedHex)) {
    throw new Error("decryptString: ciphertext contains non-hex characters");
  }

  let derivedKey: Buffer;
  try {
    derivedKey = getDerivedKey();
  } catch (err) {
    throw err;
  }

  try {
    const iv = Buffer.from(ivHex, "hex");
    const encryptedBuffer = Buffer.from(encryptedHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, derivedKey, iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    throw new Error(
      "decryptString: decryption failed - key mismatch or corrupted data"
    );
  }
}

function isValidHex(value: string): boolean {
  return /^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0;
}

/**
 * Checks if a string appears to be encrypted (contains ':' with valid hex on both sides).
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  if (parts.length !== 2) return false;
  return isValidHex(parts[0]) && isValidHex(parts[1]);
}
