import { createHmac, timingSafeEqual } from "crypto";

type ReplayEntry = {
  expiresAt: number;
};

const replayCache = new Map<string, ReplayEntry>();
const MAX_SKEW_SECONDS = 300;
const REPLAY_TTL_MS = 10 * 60 * 1000;

function parseSignatureHeader(signatureHeader: string | null) {
  if (!signatureHeader) return null;

  const parts = signatureHeader.split(",").map((part) => part.trim());
  const values = new Map<string, string>();

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) values.set(key.trim(), value.trim());
  }

  const ts = values.get("ts");
  const v1 = values.get("v1");
  if (!ts || !v1) return null;

  return { ts, v1 };
}

function cleanExpiredReplayEntries(now: number) {
  for (const [key, entry] of replayCache.entries()) {
    if (entry.expiresAt <= now) replayCache.delete(key);
  }
}

function isFreshTimestamp(ts: string, nowMs: number): boolean {
  const timestamp = Number(ts);
  if (!Number.isFinite(timestamp)) return false;

  const nowSeconds = Math.floor(nowMs / 1000);
  return Math.abs(nowSeconds - timestamp) <= MAX_SKEW_SECONDS;
}

export function verifyMercadoPagoWebhookSecurity(params: {
  signatureHeader: string | null;
  requestIdHeader: string | null;
  dataId: string | number | undefined;
  secret: string;
}) {
  const now = Date.now();
  cleanExpiredReplayEntries(now);

  const signature = parseSignatureHeader(params.signatureHeader);
  if (!signature || !params.requestIdHeader || !params.dataId) {
    return { valid: false, reason: "MISSING_HEADERS" as const };
  }

  if (!isFreshTimestamp(signature.ts, now)) {
    return { valid: false, reason: "STALE_TIMESTAMP" as const };
  }

  const manifest = `id:${params.dataId};request-id:${params.requestIdHeader};ts:${signature.ts};`;
  const expected = createHmac("sha256", params.secret).update(manifest).digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature.v1);

  if (expectedBuffer.length !== providedBuffer.length) {
    return { valid: false, reason: "INVALID_SIGNATURE" as const };
  }

  if (!timingSafeEqual(expectedBuffer, providedBuffer)) {
    return { valid: false, reason: "INVALID_SIGNATURE" as const };
  }

  const replayKey = `${params.requestIdHeader}:${params.dataId}:${signature.ts}`;
  if (replayCache.has(replayKey)) {
    return { valid: false, reason: "REPLAY_DETECTED" as const };
  }

  replayCache.set(replayKey, { expiresAt: now + REPLAY_TTL_MS });
  return { valid: true as const };
}
