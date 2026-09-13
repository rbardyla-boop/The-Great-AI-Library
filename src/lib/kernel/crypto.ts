export const ZERO_HASH = "0".repeat(64);
export const POLICY_VERSION = "gal-policy-1";

export function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function fromUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export function hexFromBytes(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = "";
  for (let i = 0; i < view.length; i++) out += view[i]!.toString(16).padStart(2, "0");
  return out;
}

export function bytesFromHex(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return hexFromBytes(buf);
}

export async function sha256Text(text: string): Promise<string> {
  return sha256Bytes(utf8(text));
}

export function shortHash(hash: string): string {
  return hash.slice(0, 8);
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortValue);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    const v = obj[key];
    if (v === undefined) continue;
    out[key] = sortValue(v);
  }
  return out;
}

export async function hmacSha256(keyHex: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    bytesFromHex(keyHex) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, utf8(message) as BufferSource);
  return hexFromBytes(sig);
}

export async function hmacSha256Verify(
  keyHex: string,
  message: string,
  signatureHex: string,
): Promise<boolean> {
  try {
    const expected = await hmacSha256(keyHex, message);
    return expected === signatureHex.toLowerCase();
  } catch {
    return false;
  }
}

export function objectPath(hash: string): string {
  return `objects/sha256/${hash.slice(0, 2)}/${hash.slice(2)}`;
}
