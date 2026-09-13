export function fingerprint(input: string): string {
  let h1 = 0x811c9dc5 >>> 0;
  let h2 = 0x01000193 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 16777619) >>> 0;
    h2 ^= input.charCodeAt(i) + i * 13;
    h2 = Math.imul(h2, 1597334677) >>> 0;
  }
  const a = h1.toString(16).padStart(8, "0");
  const b = h2.toString(16).padStart(8, "0");
  return (a + b + a.split("").reverse().join("") + b.split("").reverse().join(""))
    .repeat(2)
    .slice(0, 64);
}

export function shortHash(hash: string): string {
  return hash.slice(0, 8);
}

export async function sha256(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return fingerprint(text);
}
