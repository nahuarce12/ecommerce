const TOKEN_PAYLOAD_PREFIX = "prelaunch";
export const PRELAUNCH_ACCESS_COOKIE = "sw_prelaunch_access";

function getTokenSecret(): string {
  return (
    process.env.PRELAUNCH_TOKEN_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ""
  );
}

function toBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64url");
  }

  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(input, "base64url"));
  }

  const padded = input.padEnd(Math.ceil(input.length / 4) * 4, "=");
  const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }

  return diff === 0;
}

async function signPayload(payload: string, secret: string): Promise<Uint8Array> {
  const keyData = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return new Uint8Array(signature);
}

export async function createPrelaunchAccessToken(passwordVersion: number): Promise<string | null> {
  const secret = getTokenSecret();
  if (!secret || !Number.isFinite(passwordVersion) || passwordVersion <= 0) {
    return null;
  }

  const payload = `${TOKEN_PAYLOAD_PREFIX}:${passwordVersion}`;
  const signature = await signPayload(payload, secret);
  return `${passwordVersion}.${toBase64Url(signature)}`;
}

export async function verifyPrelaunchAccessToken(
  token: string | undefined,
  passwordVersion: number,
): Promise<boolean> {
  const secret = getTokenSecret();
  if (!secret || !token || !Number.isFinite(passwordVersion) || passwordVersion <= 0) {
    return false;
  }

  const [versionRaw, signatureRaw] = token.split(".");
  if (!versionRaw || !signatureRaw) {
    return false;
  }

  const parsedVersion = Number(versionRaw);
  if (!Number.isInteger(parsedVersion) || parsedVersion !== passwordVersion) {
    return false;
  }

  const payload = `${TOKEN_PAYLOAD_PREFIX}:${parsedVersion}`;
  const expected = await signPayload(payload, secret);
  const provided = fromBase64Url(signatureRaw);
  return constantTimeEqual(provided, expected);
}
