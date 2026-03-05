import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_PREFIX = "scrypt";
const KEY_LEN = 64;
const DEFAULT_SALT_BYTES = 16;

function toBase64Url(value: Buffer): string {
  return value.toString("base64url");
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

export function hashPrelaunchPassword(password: string): string {
  const normalized = password.trim();
  const salt = randomBytes(DEFAULT_SALT_BYTES);
  const hash = scryptSync(normalized, salt, KEY_LEN);
  return `${HASH_PREFIX}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

export function verifyPrelaunchPassword(password: string, storedHash: string): boolean {
  const [prefix, saltB64, hashB64] = storedHash.split("$");
  if (prefix !== HASH_PREFIX || !saltB64 || !hashB64) {
    return false;
  }

  const salt = fromBase64Url(saltB64);
  const expectedHash = fromBase64Url(hashB64);
  const candidateHash = scryptSync(password.trim(), salt, expectedHash.length);

  if (candidateHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(candidateHash, expectedHash);
}
