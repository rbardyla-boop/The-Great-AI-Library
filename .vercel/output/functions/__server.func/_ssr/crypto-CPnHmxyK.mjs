//#region node_modules/.nitro/vite/services/ssr/assets/crypto-CPnHmxyK.js
var ZERO_HASH = "0".repeat(64);
var POLICY_VERSION = "gal-policy-1";
function utf8(text) {
	return new TextEncoder().encode(text);
}
function fromUtf8(bytes) {
	return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}
function bytesEqual(a, b) {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
}
function hexFromBytes(bytes) {
	const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let out = "";
	for (let i = 0; i < view.length; i++) out += view[i].toString(16).padStart(2, "0");
	return out;
}
function bytesFromHex(hex) {
	const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
	const out = new Uint8Array(clean.length / 2);
	for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
	return out;
}
async function sha256Bytes(bytes) {
	return hexFromBytes(await crypto.subtle.digest("SHA-256", bytes));
}
async function sha256Text(text) {
	return sha256Bytes(utf8(text));
}
function shortHash(hash) {
	return hash.slice(0, 8);
}
function canonicalJson(value) {
	return JSON.stringify(sortValue(value));
}
function sortValue(value) {
	if (value === null || typeof value !== "object") return value;
	if (Array.isArray(value)) return value.map(sortValue);
	const obj = value;
	const out = {};
	for (const key of Object.keys(obj).sort()) {
		const v = obj[key];
		if (v === void 0) continue;
		out[key] = sortValue(v);
	}
	return out;
}
async function hmacSha256(keyHex, message) {
	const key = await crypto.subtle.importKey("raw", bytesFromHex(keyHex), {
		name: "HMAC",
		hash: "SHA-256"
	}, false, ["sign"]);
	return hexFromBytes(await crypto.subtle.sign("HMAC", key, utf8(message)));
}
async function hmacSha256Verify(keyHex, message, signatureHex) {
	try {
		return await hmacSha256(keyHex, message) === signatureHex.toLowerCase();
	} catch {
		return false;
	}
}
function objectPath(hash) {
	return `objects/sha256/${hash.slice(0, 2)}/${hash.slice(2)}`;
}
//#endregion
export { fromUtf8 as a, objectPath as c, shortHash as d, utf8 as f, canonicalJson as i, sha256Bytes as l, ZERO_HASH as n, hmacSha256 as o, bytesEqual as r, hmacSha256Verify as s, POLICY_VERSION as t, sha256Text as u };
