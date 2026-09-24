import { u as sha256Text } from "./crypto-CPnHmxyK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/receipts-0nGRUvI0.js
/** Uses Jev must never be granted. */
var NEVER_GRANTED = [
	"direct_action",
	"memory_consolidation",
	"rule_revision",
	"safety_certification",
	"evidence_promotion",
	"source_mutation"
];
function assemblePacket(input, parts) {
	const license = parts.epistemics.epistemic_license === "full_premise" || parts.epistemics.epistemic_license === "weak_premise" ? "hypothesis_only" : parts.epistemics.epistemic_license;
	return {
		header: {
			packet_id: `pkt_${input.attemptId}`,
			packet_type: "ClaimPacket",
			schema_version: "clove-cip/0.1",
			source_engine: input.engine,
			target_engine: "clove_cognitive_policy",
			trace_id: input.traceId,
			model_version: input.model,
			created_at: input.createdAt,
			priority: "P3"
		},
		epistemics: {
			...parts.epistemics,
			epistemic_license: license
		},
		permissions: {
			allowed_use: [...parts.permissions.allowed_use],
			forbidden_use: [.../* @__PURE__ */ new Set([...parts.permissions.forbidden_use, ...NEVER_GRANTED])]
		},
		provenance: {
			source_hashes: [...input.sourceHashes],
			record_ids: [...input.recordIds],
			jev_attempt_id: input.attemptId,
			question_hashes: [...input.questionHashes],
			input_hash: input.inputHash
		},
		payload: parts.payload
	};
}
/**
* Fixed thresholds. They are not fitted to the five live smoke cases.
* Confidence is never an input. A peaked distribution does not raise the license.
*/
var POLICY_THRESHOLDS = {
	supportYes: .72,
	contradictYes: .72,
	bothHigh: .45,
	insufficientYes: .5,
	relevanceYes: .4,
	duplicateYes: .72
};
var FORBIDDEN = [
	"direct_action",
	"memory_consolidation",
	"rule_revision",
	"safety_certification",
	"evidence_promotion",
	"source_mutation"
];
function yesOf(input, id) {
	const row = input.judgments.find((j) => j.id === id);
	if (!row) return null;
	if (typeof row.probabilities.yes === "number") return row.probabilities.yes;
	if (id === "relevance" && typeof row.probabilities.relevant === "number") return row.probabilities.relevant;
	return null;
}
function distributions(input) {
	const out = {};
	for (const j of input.judgments) out[j.id] = { ...j.probabilities };
	return out;
}
function flatProbabilities(input) {
	const out = {};
	for (const j of input.judgments) for (const [k, v] of Object.entries(j.probabilities)) out[`${j.id}.${k}`] = v;
	return out;
}
function maxConfidence(input) {
	const nums = input.judgments.map((j) => j.confidence).filter((n) => typeof n === "number");
	if (!nums.length) return null;
	return Math.max(...nums);
}
function base(input, disposition, relation, license, extra) {
	const human = extra.human ?? disposition === "HUMAN_REVIEW";
	return {
		packet: assemblePacket(input, {
			epistemics: {
				confidence: maxConfidence(input),
				uncertainty_type: extra.uncertainty ?? (input.terminal === "ACCEPTED_RESPONSE" ? "derived" : "missing_judgment"),
				epistemic_license: license,
				contradictions: extra.contradictions ?? []
			},
			permissions: {
				allowed_use: human || disposition === "HUMAN_REVIEW" ? ["human_explanation", "retrieval"] : [
					"human_explanation",
					"retrieval",
					"contradiction_detection"
				],
				forbidden_use: FORBIDDEN
			},
			payload: {
				relation,
				disposition,
				probabilities: flatProbabilities(input),
				duplicate: Boolean(extra.duplicate),
				human_review: human || disposition === "HUMAN_REVIEW" || disposition === "CONTRADICTION_CANDIDATE",
				distributions: distributions(input)
			}
		}),
		mutated: false,
		promoted: false,
		stale: false,
		provenanceMismatch: false
	};
}
/** Deterministic gate. Jev output cannot raise this. */
function decide(input) {
	const live = new Set(input.liveHashes);
	const stale = input.sourceHashes.length > 0 && input.sourceHashes.some((h) => !live.has(h));
	const provenanceMismatch = input.terminal === "ACCEPTED_RESPONSE" && (input.sourceHashes.length === 0 || input.recordIds.length === 0 || input.inputHash.length < 64);
	if (input.terminal !== "ACCEPTED_RESPONSE") return base(input, "SERVICE_UNAVAILABLE", "insufficient_evidence", "do_not_use_for_action", {
		uncertainty: "missing_judgment",
		human: false
	});
	if (stale || provenanceMismatch) return {
		...base(input, "HUMAN_REVIEW", "insufficient_evidence", "do_not_use_for_action", {
			uncertainty: stale ? "stale_source" : "provenance_mismatch",
			human: true,
			contradictions: stale ? ["source hash changed after the judgment"] : ["provenance incomplete"]
		}),
		stale,
		provenanceMismatch
	};
	const support = yesOf(input, "supports");
	const contradict = yesOf(input, "contradicts");
	const insufficient = yesOf(input, "insufficient");
	const relevant = yesOf(input, "relevance");
	const duplicate = yesOf(input, "duplicate");
	const dup = duplicate !== null && duplicate >= POLICY_THRESHOLDS.duplicateYes;
	if (support !== null && contradict !== null && support >= POLICY_THRESHOLDS.bothHigh && contradict >= POLICY_THRESHOLDS.bothHigh) return base(input, "CONTRADICTION_CANDIDATE", "contradicted", "hazard_only", {
		contradictions: ["support and contradiction are both plausible"],
		human: true,
		duplicate: dup
	});
	if (relevant !== null && relevant < POLICY_THRESHOLDS.relevanceYes) return base(input, "DISPLAY_ONLY", "insufficient_evidence", "do_not_use_for_action", {
		duplicate: dup,
		human: dup
	});
	if (insufficient !== null && insufficient >= POLICY_THRESHOLDS.insufficientYes) return base(input, "INSUFFICIENT_EVIDENCE", "insufficient_evidence", "hypothesis_only", {
		human: true,
		duplicate: dup
	});
	if (contradict !== null && contradict >= POLICY_THRESHOLDS.contradictYes && (support === null || support < contradict)) return base(input, "CONTRADICTION_CANDIDATE", "contradicted", "hazard_only", {
		contradictions: ["supplied evidence leans against the claim"],
		human: true,
		duplicate: dup
	});
	if (support !== null && support >= POLICY_THRESHOLDS.supportYes && (contradict === null || contradict < POLICY_THRESHOLDS.bothHigh)) return base(input, "SUPPORT_CANDIDATE", "supported", "hypothesis_only", {
		human: dup,
		duplicate: dup
	});
	return base(input, "HUMAN_REVIEW", "insufficient_evidence", "do_not_use_for_action", {
		human: true,
		duplicate: dup
	});
}
/** Jev attempt → inert CIP packet. Does not write evidence. */
function packetFromAttempt(attempt, ctx) {
	return decide({
		outcome: attempt.outcome,
		terminal: attempt.terminal,
		model: attempt.model,
		attemptId: attempt.attemptId,
		traceId: attempt.traceId,
		inputHash: attempt.inputHash,
		questionHashes: attempt.questionHashes,
		createdAt: ctx.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
		sourceHashes: ctx.sourceHashes,
		recordIds: ctx.recordIds,
		liveHashes: ctx.liveHashes,
		judgments: attempt.judgments.map((j) => ({
			id: j.id,
			confidence: j.confidence,
			probabilities: j.probabilities,
			label: j.label
		})),
		engine: ctx.engine ?? (attempt.terminal === "NO_KEY" ? "none" : "typesafe_jev")
	});
}
async function hashInput(input) {
	const body = JSON.stringify({
		query: input.query,
		passages: input.passages.map((p) => ({
			recordId: p.recordId,
			claimId: p.claimId,
			hash: p.hash,
			passage: p.passage
		}))
	});
	return sha256Text(body);
}
async function hashQuestions(questions) {
	return sha256Text(JSON.stringify(questions));
}
async function hashEachQuestion(questions) {
	const out = [];
	for (const key of Object.keys(questions).sort()) out.push(await sha256Text(JSON.stringify({
		id: key,
		question: questions[key]
	})));
	return out;
}
function attemptId(inputHash, at) {
	return `jev_${at.toString(36)}_${inputHash.slice(0, 12)}`;
}
function traceId(inputHash, at) {
	return `tr_${inputHash.slice(0, 16)}_${at.toString(36)}`;
}
/** Persisted receipt. Hashes only. No passage text, no key. */
function publicReceipt(attempt) {
	return {
		kind: "JEV_JUDGMENT_RECEIPT",
		attemptId: attempt.attemptId,
		traceId: attempt.traceId,
		model: attempt.model,
		questionHash: attempt.questionHash,
		questionHashes: attempt.questionHashes,
		inputHash: attempt.inputHash,
		outcome: attempt.outcome,
		terminal: attempt.terminal,
		httpStatus: attempt.httpStatus,
		latencyMs: attempt.latencyMs,
		retryCount: attempt.retryCount,
		requestId: attempt.requestId,
		judgments: attempt.judgments,
		note: attempt.note,
		authority: false,
		confidenceIsCorrectness: false
	};
}
//#endregion
export { packetFromAttempt as a, hashQuestions as i, hashEachQuestion as n, publicReceipt as o, hashInput as r, traceId as s, attemptId as t };
