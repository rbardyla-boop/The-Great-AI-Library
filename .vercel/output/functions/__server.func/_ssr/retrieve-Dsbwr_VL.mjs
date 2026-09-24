//#region node_modules/.nitro/vite/services/ssr/assets/retrieve-Dsbwr_VL.js
var STOP = /* @__PURE__ */ new Set([
	"the",
	"a",
	"an",
	"of",
	"and",
	"or",
	"to",
	"in",
	"on",
	"for",
	"is",
	"it",
	"my",
	"me",
	"we",
	"our",
	"was",
	"were",
	"be",
	"by",
	"at",
	"as",
	"with",
	"this",
	"that",
	"from",
	"what",
	"who",
	"which",
	"did",
	"does",
	"how",
	"show",
	"me",
	"about",
	"into",
	"between"
]);
var SYN = {
	mercury: [
		"salt-loop",
		"thermal",
		"helios",
		"project mercury"
	],
	budget: [
		"cost",
		"funding",
		"million",
		"overrun",
		"payback",
		"recoup"
	],
	proposed: [
		"originated",
		"invented",
		"proposal",
		"origin"
	],
	origin: [
		"proposed",
		"originated",
		"invented",
		"chen",
		"hale"
	],
	nuclear: [
		"smr",
		"reactor",
		"modular"
	],
	stale: [
		"obsolete",
		"outdated",
		"superseded",
		"2024"
	],
	disagree: [
		"conflict",
		"contradict",
		"dispute",
		"incorrect"
	],
	weakest: [
		"unsupported",
		"anonymous",
		"retracted",
		"derived",
		"single-source"
	],
	injection: [
		"exfiltrate",
		"ignore library",
		"shell",
		"capability"
	],
	alex: [
		"rivera",
		"journalist",
		"engineer"
	]
};
function tokens(q) {
	return q.toLowerCase().replace(/[^a-z0-9$]+/g, " ").split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));
}
function expand(toks) {
	const out = new Set(toks);
	for (const t of toks) for (const extra of SYN[t] ?? []) extra.split(/\s+/).forEach((x) => out.add(x));
	return [...out];
}
function scoreText(text, toks) {
	const hay = text.toLowerCase();
	let s = 0;
	for (const t of toks) if (hay.includes(t)) s += t.length > 5 ? 2 : 1;
	return s;
}
function retrieve(question, lib, asOf) {
	const q = question.toLowerCase();
	const toks = tokens(question);
	const sem = expand(toks);
	const channels = {
		lexical: 0,
		semantic: 0,
		graph: 0,
		temporal: 0,
		provenance: 0
	};
	const recordById = new Map(lib.records.map((r) => [r.id, r]));
	const scored = /* @__PURE__ */ new Map();
	const add = (claim, channel, score) => {
		const rec = recordById.get(claim.recordId);
		if (!rec) return;
		const key = claim.id;
		const existing = scored.get(key);
		const passage = {
			recordId: rec.id,
			claimId: claim.id,
			title: rec.title,
			hash: rec.contentHash,
			author: rec.author,
			assertedAt: claim.assertedAt,
			passage: claim.passage,
			channel
		};
		if (!existing) scored.set(key, {
			passage,
			score,
			ch: /* @__PURE__ */ new Set([channel])
		});
		else {
			existing.score += score;
			existing.ch.add(channel);
		}
		channels[channel] += 1;
	};
	for (const claim of lib.claims) {
		const rec = recordById.get(claim.recordId);
		if (!rec) continue;
		const blob = `${rec.title} ${rec.body} ${claim.text} ${claim.passage} ${claim.topics.join(" ")}`;
		const lex = scoreText(blob, toks);
		if (lex > 0) add(claim, "lexical", lex);
		const semScore = scoreText(blob, sem) - lex;
		if (semScore > 0) add(claim, "semantic", semScore);
		if (claim.entities.length && sem.some((t) => blob.toLowerCase().includes(t) && (t === "chen" || t === "hale" || t === "rivera" || t === "helios" || t === "northline" || t === "okonkwo"))) add(claim, "graph", 2);
		if (q.match(/\b(2024|2025|2026|when|timeline|change|changed|stale|obsolete|was|became)\b/) || asOf) {
			if (claim.temporal !== "is_true" || claim.validTo || claim.status !== "current") add(claim, "temporal", 2);
		}
		if (q.match(/\b(hash|source|derived|provenance|originat|who first|citation|evidence|deleted|integrity)\b/)) add(claim, "provenance", 2);
	}
	return {
		passages: [...scored.values()].sort((a, b) => b.score - a.score).slice(0, 12).map((x) => x.passage),
		channels
	};
}
function contradictionsFor(passages, all) {
	const ids = new Set(passages.map((p) => p.claimId).filter(Boolean));
	return all.filter((c) => c.claimIds.some((id) => ids.has(id)));
}
function emptyBrief(question, channels) {
	return {
		question,
		answer: "That is not in the collection. The Archivist will not invent a source to fill the gap.",
		citations: [],
		contradictions: [],
		absence: true,
		confidence: "none",
		channels,
		model: "archivist-local"
	};
}
//#endregion
export { emptyBrief as n, retrieve as r, contradictionsFor as t };
