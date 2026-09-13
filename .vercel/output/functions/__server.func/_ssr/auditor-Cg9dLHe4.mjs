//#region node_modules/.nitro/vite/services/ssr/assets/auditor-Cg9dLHe4.js
var CLAIM_ID = /\bC-?[A-Za-z0-9]+\b/g;
var HASH8 = /\b[a-f0-9]{8}\b/gi;
function sentences(text) {
	return text.split(/\n+/).flatMap((line) => line.split(/(?<=[.!?])\s+/)).map((s) => s.trim()).filter(Boolean);
}
function isFactual(sentence) {
	if (sentence.length < 24) return false;
	if (/^(that is not|the archivist|absence|held in contradiction|sources disagree)/i.test(sentence)) return false;
	return /[0-9]{2,}|\$|million|proposed|originat|budget|retract|claim|according|authorized/i.test(sentence);
}
function auditAnswer(answer, evidence) {
	const allowedIds = new Set(evidence.flatMap((e) => [e.claimId, e.recordId].filter((x) => Boolean(x))));
	const allowedHashes = new Set(evidence.map((e) => e.hash.slice(0, 8).toLowerCase()));
	const haystack = evidence.map((e) => `${e.passage} ${e.title} ${e.claimId ?? ""}`).join("\n").toLowerCase();
	const cited = [];
	const unsupported = [];
	const kept = [];
	let redacted = 0;
	for (const sentence of sentences(answer)) {
		const ids = sentence.match(CLAIM_ID) ?? [];
		const hashes = (sentence.match(HASH8) ?? []).map((h) => h.toLowerCase());
		const citesOk = ids.some((id) => allowedIds.has(id)) || hashes.some((h) => allowedHashes.has(h));
		ids.forEach((id) => cited.push(id));
		if (!isFactual(sentence)) {
			kept.push(sentence);
			continue;
		}
		if (!citesOk) {
			redacted += 1;
			unsupported.push(sentence);
			kept.push("[REDACTED: uncited library claim]");
			continue;
		}
		const quoted = sentence.match(/“([^”]{12,})”|"([^"]{12,})"/);
		const quote = (quoted?.[1] ?? quoted?.[2] ?? "").toLowerCase();
		if (quote && !haystack.includes(quote.slice(0, 40))) {
			redacted += 1;
			unsupported.push(sentence);
			kept.push("[REDACTED: quotation not in evidence]");
			continue;
		}
		kept.push(sentence);
	}
	const refused = kept.filter((s) => !s.startsWith("[REDACTED") && isFactual(s)).length === 0 && unsupported.length > 0;
	return {
		text: refused ? "The Answer Auditor refused this brief. The model asserted library facts that were not cited to retrieved evidence." : kept.join("\n"),
		refused,
		redacted,
		cited: [...new Set(cited)],
		unsupported
	};
}
//#endregion
export { auditAnswer as t };
