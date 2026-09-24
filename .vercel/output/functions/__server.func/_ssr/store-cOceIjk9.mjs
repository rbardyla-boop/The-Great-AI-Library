import { i as __toESM } from "../_runtime.mjs";
import { i as canonicalJson, o as hmacSha256, s as hmacSha256Verify, u as sha256Text } from "./crypto-CPnHmxyK.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { A as RECORDS, D as CLAIMS, O as CONTRADICTIONS, P as cn, T as GAL_PUBLISHER_KEY, a as refreshLibrary, i as kernel, j as RELATIONSHIPS, k as ENTITIES, p as evidenceRoot, r as Button, z as profileByRole } from "./router-lsvE-Cg6.mjs";
import { t as Badge } from "./badge-DGoUUdzQ.mjs";
import { t as HashStamp } from "./hash-stamp-CDt47k5x.mjs";
import { C as reviewsFromLedger, S as reviewUri, T as unsignedReview, _ as fileSupport, a as connectionUri, b as hashReview, c as evidentiaryContribution, d as fileFalsify, f as fileKeepOpen, g as fileReviewReceipt, h as fileReplicateReview, i as connectionCanonical, l as fileChallenge, m as fileReplicate, n as DOTS_EVALUATOR, o as connectionsFromLedger, p as filePromote, r as LOCAL_LIBRARY_ID, t as DOTS_CHECKPOINT, u as fileDiscovery, v as hasTruthField, w as unsignedConnection, x as reviewConnection, y as hashConnection } from "./registry-BLlwdRIE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-cOceIjk9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function sealedNative(connection) {
	return {
		...unsignedConnection(connection),
		hash: connection.hash,
		status: "HYPOTHESIS"
	};
}
async function exportEnvelope(connection, creator = LOCAL_LIBRARY_ID) {
	const native = sealedNative(connection);
	const objectHash = connection.hash;
	const uri = connectionUri(objectHash);
	const assertion = {
		relation: native.proposedRelation,
		type: native.type,
		search: native.search,
		dots: native.dotIds,
		structure: native.sharedStructure,
		statement: `${native.proposedRelation} (${native.type}, ${native.search}). Not a fact.`
	};
	const provenance = {
		evidenceRoot: native.evidenceRoot,
		model: native.model,
		checkpoint: native.checkpoint,
		valuesUri: native.valuesUri,
		valuesHash: native.valuesHash,
		method: native.search,
		dotIds: native.dotIds,
		scoresAreRanking: true,
		scores: native.scores
	};
	const publication = {
		creator,
		createdAt: native.createdAt,
		objectHash,
		uri,
		status: "HYPOTHESIS",
		protocol: "gal-dots/1"
	};
	const envelope = {
		protocol: "gal-dots/1",
		uri,
		assertion,
		provenance,
		publication,
		signature: await hmacSha256(GAL_PUBLISHER_KEY, canonicalJson({
			assertion,
			provenance,
			publication
		})),
		native: {
			...unsignedConnection(native),
			hash: objectHash
		}
	};
	return canonicalJson(envelope);
}
async function parseCard(text) {
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		return {
			ok: false,
			reason: "Not JSON. A hypothesis card is a canonical object, not a story."
		};
	}
	if (!parsed || typeof parsed !== "object") return {
		ok: false,
		reason: "Card is not an object."
	};
	const root = parsed;
	if (hasTruthField(root) || hasTruthField(root.native) || hasTruthField(root.connection) || hasTruthField(root.assertion)) return {
		ok: false,
		reason: "Rejected. Connect-the-Dots may not create facts. truth is forbidden."
	};
	if (root.protocol === "gal-dots/1" && root.native && root.assertion && root.publication) {
		const envelope = root;
		const pub = envelope.publication;
		if (!await hmacSha256Verify("a63bed2ca4456577bc5406561d3ec7f849fe294749d7e96997bad6143835f859", canonicalJson({
			assertion: envelope.assertion,
			provenance: envelope.provenance,
			publication: envelope.publication
		}), envelope.signature)) return {
			ok: false,
			reason: "Signature mismatch. The envelope was altered after it was sealed."
		};
		if (pub.status !== "HYPOTHESIS") return {
			ok: false,
			reason: "Portable objects must travel as HYPOTHESIS. Status is not consensus."
		};
		const presented = envelope.native;
		if (hasTruthField(presented)) return {
			ok: false,
			reason: "Rejected. Connect-the-Dots may not create facts. truth is forbidden."
		};
		if (await sha256Text(connectionCanonical(presented)) !== presented.hash || presented.hash !== pub.objectHash) return {
			ok: false,
			reason: "Hash mismatch. The card was altered after it was sealed."
		};
		if (envelope.uri !== connectionUri(presented.hash)) return {
			ok: false,
			reason: "Trusty URI does not match the object hash."
		};
		const next = {
			...unsignedConnection(presented),
			status: "HYPOTHESIS"
		};
		const hash = await hashConnection(next);
		if (hash !== presented.hash) return {
			ok: false,
			reason: "Native hash drifted. Import would contaminate the artifact."
		};
		return {
			ok: true,
			connection: {
				...next,
				hash
			},
			envelope
		};
	}
	const raw = root.connection ?? parsed;
	if (hasTruthField(raw)) return {
		ok: false,
		reason: "Rejected. Connect-the-Dots may not create facts. truth is forbidden."
	};
	if (!raw || typeof raw !== "object") return {
		ok: false,
		reason: "Missing connection object."
	};
	const presented = raw;
	if (!presented.id || !presented.type || !presented.hash) return {
		ok: false,
		reason: "Card missing id, type, or hash."
	};
	if (await sha256Text(connectionCanonical(presented)) !== presented.hash) return {
		ok: false,
		reason: "Hash mismatch. The card was altered after it was sealed."
	};
	const next = {
		...unsignedConnection(presented),
		status: "HYPOTHESIS"
	};
	const hash = await hashConnection(next);
	return {
		ok: true,
		connection: {
			...next,
			hash
		}
	};
}
async function exportReviewEnvelope(review, creator = LOCAL_LIBRARY_ID) {
	const objectHash = review.hash;
	const uri = reviewUri(objectHash);
	const assertion = {
		subject: review.subject,
		kind: review.kind,
		supportClass: review.supportClass,
		reason: review.reason,
		evidenceRefs: review.evidenceRefs,
		counterevidenceRefs: review.counterevidenceRefs,
		statement: review.kind === "SUPPORT" && review.supportClass === "OPINION" ? "SUPPORT — OPINION. I think this is compelling. Not evidence." : review.kind === "SUPPORT" && review.supportClass === "EVIDENTIARY" ? "SUPPORT — EVIDENTIARY. Independent evidence, not a vote." : `Review ${review.kind}. Evidence about a review. Not a fact.`
	};
	const provenance = {
		reviewer: review.reviewer,
		reviewerValuesUri: review.reviewerValuesUri,
		origin: review.origin,
		libraryId: review.libraryId,
		createdAt: review.createdAt,
		originalHash: review.originalHash
	};
	const publication = {
		creator,
		objectHash,
		uri,
		signatureScheme: "hmac-sha256-demo",
		protocol: "gal-dots/2",
		integrityNotTrust: true
	};
	const envelope = {
		protocol: "gal-dots/2",
		uri,
		assertion,
		provenance,
		publication,
		signature: await hmacSha256(GAL_PUBLISHER_KEY, canonicalJson({
			assertion,
			provenance,
			publication
		})),
		native: {
			...unsignedReview(review),
			hash: objectHash
		}
	};
	return canonicalJson(envelope);
}
async function parseReview(text) {
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		return {
			ok: false,
			reason: "Not JSON. A review is a canonical object, not a vote count."
		};
	}
	if (!parsed || typeof parsed !== "object") return {
		ok: false,
		reason: "Review is not an object."
	};
	const root = parsed;
	if (hasTruthField(root) || hasTruthField(root.native) || hasTruthField(root.assertion)) return {
		ok: false,
		reason: "Rejected. A review may not create facts. truth is forbidden."
	};
	if (root.protocol !== "gal-dots/2" || !root.native || !root.assertion || !root.publication) return {
		ok: false,
		reason: "Not a gal-dots/2 review envelope."
	};
	const envelope = root;
	if (!await hmacSha256Verify("a63bed2ca4456577bc5406561d3ec7f849fe294749d7e96997bad6143835f859", canonicalJson({
		assertion: envelope.assertion,
		provenance: envelope.provenance,
		publication: envelope.publication
	}), envelope.signature)) return {
		ok: false,
		reason: "Signature mismatch. HMAC is integrity, not trust — and this object was altered."
	};
	if (envelope.publication.signatureScheme !== "hmac-sha256-demo") return {
		ok: false,
		reason: "Unknown signature scheme. Demo publisher HMAC only."
	};
	const presented = envelope.native;
	if (await hashReview(unsignedReview(presented)) !== presented.hash || presented.hash !== envelope.publication.objectHash) return {
		ok: false,
		reason: "Hash mismatch. The review was altered after it was sealed."
	};
	if (envelope.uri !== reviewUri(presented.hash)) return {
		ok: false,
		reason: "Trusty URI does not match the review hash."
	};
	const next = unsignedReview(presented);
	const hash = await hashReview(next);
	if (hash !== presented.hash) return {
		ok: false,
		reason: "Native hash drifted. Import would contaminate the artifact."
	};
	return {
		ok: true,
		review: {
			...next,
			hash
		},
		envelope
	};
}
async function parseEnvelope(text) {
	let protocol;
	try {
		protocol = JSON.parse(text).protocol;
	} catch {
		return {
			ok: false,
			reason: "Not JSON."
		};
	}
	if (protocol === "gal-dots/2") {
		const parsed = await parseReview(text);
		if (!parsed.ok) return parsed;
		return {
			ok: true,
			type: "review",
			review: parsed.review,
			envelope: parsed.envelope
		};
	}
	const parsed = await parseCard(text);
	if (!parsed.ok) return parsed;
	return {
		ok: true,
		type: "connection",
		connection: parsed.connection,
		envelope: parsed.envelope
	};
}
var STATUS_TONE = {
	HYPOTHESIS: "warn",
	SUPPORTED: "ok",
	CONTESTED: "info",
	FALSIFIED: "danger"
};
function Score({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between gap-2 font-mono text-[11px] text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "tabular-nums text-fg",
			children: value.toFixed(2)
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 h-1 overflow-hidden rounded-full bg-elevated",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-full rounded-full bg-accent",
			style: { width: `${Math.max(4, value * 100)}%` }
		})
	})] });
}
function ConnectionCard({ connection, reviews, onReview, onChallenge, onPromote, onKeepOpen, onSupport, onFalsify, onEvidence }) {
	const [copied, setCopied] = (0, import_react.useState)(null);
	const scores = connection.scores;
	const sealed = connection.status;
	const local = connection.localStatus ?? connection.status;
	const uri = connectionUri(connection.hash);
	const filed = reviewsFromLedger(kernel, connection.hash);
	const opinions = filed.filter((r) => r.kind === "SUPPORT" && r.supportClass !== "EVIDENTIARY");
	const evid = filed.filter((r) => evidentiaryContribution(connection, r));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[11px] text-faint",
						children: connection.id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: connection.type.replace("_", " ") }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: connection.search === "FAR" ? "accent" : "muted",
						children: connection.search
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						tone: STATUS_TONE[sealed],
						children: ["artifact ", sealed]
					}),
					local !== sealed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						tone: STATUS_TONE[local],
						children: ["this library ", local]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 font-display text-2xl leading-tight",
				children: connection.proposedRelation
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-mono text-[11px] uppercase tracking-wider text-warn",
				children: local === "SUPPORTED" ? "This library: supported working hypothesis — shared artifact is not a fact" : "Hypothesis — not library fact"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 break-all font-mono text-[11px] text-faint",
				children: uri
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-4 space-y-3 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "font-mono text-[11px] uppercase tracking-wider text-faint",
						children: "Dots"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-1 font-mono text-[11px] text-muted",
						children: connection.dotIds.join(" · ")
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "font-mono text-[11px] uppercase tracking-wider text-faint",
						children: "Shared structure"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-1 leading-relaxed text-fg",
						children: connection.sharedStructure
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "font-mono text-[11px] uppercase tracking-wider text-faint",
						children: "Why this may matter"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-1 leading-relaxed text-muted",
						children: connection.whyItMayMatter
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "font-mono text-[11px] uppercase tracking-wider text-faint",
						children: "Counterargument"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-1 leading-relaxed text-muted",
						children: connection.counterargument
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Score, {
						label: "Strength",
						value: scores.strength
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Score, {
						label: "Novelty",
						value: scores.novelty
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Score, {
						label: "Relevance",
						value: scores.relevance
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Score, {
						label: "Independence",
						value: scores.independence
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Score, {
						label: "Falsifiability",
						value: scores.falsifiability
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-mono text-[11px] text-faint",
				children: "Scores rank. They are not evidence. Opinion is not evidence. SUPPORTED cites evidentiary reviews."
			}),
			filed.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 font-mono text-[11px] text-muted",
				children: [
					opinions.length,
					" opinion",
					opinions.length === 1 ? "" : "s",
					" · ",
					evid.length,
					" new evidence ·",
					" ",
					filed.length,
					" review object",
					filed.length === 1 ? "" : "s",
					" cite this hash. Nobody edited it."
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-[11px] uppercase tracking-wider text-faint",
					children: "Would strengthen · "
				}), connection.missingEvidence[0] ?? "More independent sources."]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-[11px] uppercase tracking-wider text-faint",
					children: "Would falsify · "
				}), connection.falsifiers[0]]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 break-all font-mono text-[11px] text-faint",
				children: [
					connection.model,
					" · ",
					connection.search,
					" · VALUES ",
					connection.valuesUri,
					" · evidence",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashStamp, { hash: connection.evidenceRoot }),
					" · object ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashStamp, { hash: connection.hash }),
					connection.ledgerReceipt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						" ",
						"· ledger ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashStamp, { hash: connection.ledgerReceipt })
					] }) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap gap-2",
				children: [
					onReview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "secondary",
						onClick: onReview,
						children: "Convene review"
					}) : null,
					onChallenge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: onChallenge,
						children: "Skeptic challenge"
					}) : null,
					onSupport ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: onSupport,
						children: "File opinion"
					}) : null,
					onEvidence ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: onEvidence,
						children: "File evidence"
					}) : null,
					onFalsify ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: onFalsify,
						children: "File falsify"
					}) : null,
					onKeepOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: onKeepOpen,
						children: "Keep open"
					}) : null,
					onPromote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "danger",
						onClick: onPromote,
						children: "Promote to fact"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: async () => {
							const text = await exportEnvelope(connection);
							await navigator.clipboard.writeText(text);
							setCopied("envelope");
							setTimeout(() => setCopied(null), 1500);
						},
						children: copied === "envelope" ? "Envelope copied" : "Export envelope"
					}),
					filed[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: async () => {
							const text = await exportReviewEnvelope(filed[0]);
							await navigator.clipboard.writeText(text);
							setCopied("review");
							setTimeout(() => setCopied(null), 1500);
						},
						children: copied === "review" ? "Review copied" : "Export review"
					}) : null
				]
			}),
			filed.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2 border-t border-border pt-4",
				children: filed.slice(0, 8).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "font-mono text-[11px] text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg",
							children: r.kind
						}),
						r.supportClass ? ` · ${r.supportClass}` : "",
						" · contribution",
						" ",
						evidentiaryContribution(connection, r) ? "1" : "0",
						" · ",
						reviewUri(r.hash),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 block text-[11px] leading-relaxed text-faint",
							children: r.reason
						})
					]
				}, r.hash))
			}) : null,
			reviews && reviews.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2 border-t border-border pt-4",
				children: reviews.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "font-mono text-[11px] text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg",
							children: r.role
						}),
						" · ",
						r.recommendation,
						" · membrane",
						" ",
						r.membraneAllow ? "allow" : "deny",
						" · authorized:false",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("mt-1 block text-[11px] leading-relaxed", "text-faint"),
							children: r.justification
						})
					]
				}, r.valuesUri))
			}) : null
		]
	});
}
function mercuryView() {
	return {
		records: RECORDS,
		claims: CLAIMS,
		entities: ENTITIES,
		relationships: RELATIONSHIPS,
		contradictions: CONTRADICTIONS
	};
}
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
	"this",
	"that",
	"from",
	"with",
	"not",
	"as",
	"by",
	"at",
	"be",
	"are",
	"was"
]);
function tokens(text) {
	return new Set(text.toLowerCase().replace(/[^a-z0-9$]+/g, " ").split(/\s+/).filter((t) => t.length > 2 && !STOP.has(t)));
}
/** Jaccard overlap. FAR search requires this to stay low. */
function lexicalOverlap(a, b) {
	const A = tokens(a);
	const B = tokens(b);
	if (!A.size || !B.size) return 0;
	let inter = 0;
	for (const t of A) if (B.has(t)) inter += 1;
	return inter / (A.size + B.size - inter);
}
function unit(n) {
	return Math.max(0, Math.min(1, Math.round(n * 100) / 100));
}
var STRENGTH_W = {
	primary: .92,
	secondary: .62,
	"single-source": .4,
	derived: .22,
	anonymous: .15
};
function claimById(view, id) {
	return view.claims.find((c) => c.id === id);
}
function recById(view, id) {
	return view.records.find((r) => r.id === id);
}
function scoresFor(args) {
	const strengths = args.claims.map((c) => STRENGTH_W[c.strength]);
	const strength = strengths.length ? strengths.reduce((a, b) => a + b, 0) / strengths.length : .3;
	const recordIds = new Set(args.claims.map((c) => c.recordId));
	const authors = new Set(args.records.map((r) => r.author).filter(Boolean));
	const independence = .35 * Math.min(1, recordIds.size / Math.max(2, args.claims.length)) + .45 * Math.min(1, authors.size / Math.max(2, args.claims.length)) + .2 * (authors.size >= 2 ? 1 : .3);
	const falsifiability = .25 + .2 * Math.min(3, args.falsifiers.length) + .12 * Math.min(2, args.missing.length);
	return {
		strength: unit(strength),
		novelty: unit(args.novelty),
		relevance: unit(args.relevance),
		independence: unit(independence),
		falsifiability: unit(falsifiability)
	};
}
function relevanceTo(query, blob) {
	if (!query.trim()) return .72;
	return unit(.35 + .65 * lexicalOverlap(query, blob));
}
function directs(view) {
	const out = [];
	for (const rel of view.relationships.filter((r) => !r.derived)) {
		const from = view.entities.find((e) => e.id === rel.fromId);
		const to = view.entities.find((e) => e.id === rel.toId);
		if (!from || !to) continue;
		const claims = view.claims.filter((c) => c.entities.includes(rel.fromId) && c.entities.includes(rel.toId));
		const used = claims.length ? claims.slice(0, 2) : [];
		out.push({
			type: "DIRECT",
			search: "NEAR",
			dotIds: [
				rel.fromId,
				rel.toId,
				...used.map((c) => c.id)
			].slice(0, 4),
			intermediateNodes: [],
			proposedRelation: `${from.name} ${rel.kind} ${to.name}`,
			explanation: `The catalog already records ${from.name} —${rel.kind}→ ${to.name}. This is established context, not a discovery.`,
			sharedStructure: "Explicit catalog edge.",
			whyItMayMatter: "Low-novelty directs are the floor. They must not crowd out far search.",
			counterargument: "Restating a catalog edge is not a hypothesis.",
			evidenceRefs: used.map((c) => c.id),
			counterevidenceRefs: [],
			claims: used,
			novelty: .04,
			assumptions: ["The catalog edge is complete."],
			missingEvidence: [],
			falsifiers: [`A primary source that ${from.name} did not ${rel.kind} ${to.name}.`],
			nextQuestions: ["Is this edge independently sourced, or a single record?"]
		});
	}
	return out;
}
function multiHops(view) {
	const out = [];
	const rels = view.relationships.filter((r) => !r.derived);
	const direct = new Set(rels.map((r) => `${r.fromId}>${r.toId}`));
	for (const a of rels) for (const b of rels) {
		if (a.id === b.id) continue;
		if (a.toId !== b.fromId) continue;
		if (a.fromId === b.toId) continue;
		if (direct.has(`${a.fromId}>${b.toId}`)) continue;
		const from = view.entities.find((e) => e.id === a.fromId);
		const mid = view.entities.find((e) => e.id === a.toId);
		const to = view.entities.find((e) => e.id === b.toId);
		if (!from || !mid || !to) continue;
		const claims = view.claims.filter((c) => c.entities.includes(a.fromId) || c.entities.includes(a.toId) || c.entities.includes(b.toId));
		out.push({
			type: "MULTI_HOP",
			search: "NEAR",
			dotIds: [
				a.fromId,
				a.toId,
				b.toId
			],
			intermediateNodes: [a.toId],
			proposedRelation: `${from.name} reaches ${to.name} through ${mid.name}`,
			explanation: `${from.name} ${a.kind} ${mid.name}, which ${b.kind} ${to.name}. No direct edge ${from.name} → ${to.name} exists.`,
			sharedStructure: "A → C → B.",
			whyItMayMatter: "Multi-hop is how a vendor, a program, and an originator become one story without being merged.",
			counterargument: "A path is not a relation. The hop may be incidental.",
			evidenceRefs: claims.slice(0, 3).map((c) => c.id),
			counterevidenceRefs: [],
			claims: claims.slice(0, 3),
			novelty: .55,
			assumptions: ["Transitivity is meaningful for these kinds."],
			missingEvidence: [`A source that names ${from.name} and ${to.name} together.`],
			falsifiers: [`Evidence that ${mid.name} does not actually connect the two.`],
			nextQuestions: ["Does the intermediate node do causal work, or only naming?"]
		});
	}
	const chain = [
		"C16001",
		"C10040",
		"C9821"
	].map((id) => claimById(view, id)).filter((c) => Boolean(c));
	if (chain.length === 3) out.push({
		type: "MULTI_HOP",
		search: "NEAR",
		dotIds: chain.map((c) => c.id),
		intermediateNodes: ["C10040"],
		proposedRelation: "Northline's $12M sits inside the $72M that superseded $48M",
		explanation: "The Northline vessel contract is part of the May 2025 addendum. That addendum is the document that retired the March 2024 $48 million figure. The vendor is two hops from the obsolete ask.",
		sharedStructure: "A → C → B through a superseding budget instrument.",
		whyItMayMatter: "Vendor pressure reads differently once you see it attached to the current, not the retired, number.",
		counterargument: "Line-item membership is not endorsement of the whole addendum narrative.",
		evidenceRefs: chain.map((c) => c.id),
		counterevidenceRefs: [],
		claims: chain,
		novelty: .48,
		assumptions: ["The contract line is inside the addendum, not beside it."],
		missingEvidence: ["The addendum schedule that lists the Northline line explicitly."],
		falsifiers: ["A source placing the Northline $12M outside the $72M authorization."],
		nextQuestions: ["Does Northline correspondence cite $48M, $72M, or $90M?"]
	});
	return out;
}
function temporals(view) {
	const out = [];
	const byEntity = /* @__PURE__ */ new Map();
	for (const c of view.claims) for (const e of c.entities) {
		const list = byEntity.get(e) ?? [];
		list.push(c);
		byEntity.set(e, list);
	}
	const seen = /* @__PURE__ */ new Set();
	for (const [entity, list] of byEntity) {
		const ordered = [...list].sort((a, b) => a.assertedAt.localeCompare(b.assertedAt));
		for (let i = 0; i < ordered.length - 1; i++) {
			const a = ordered[i];
			const b = ordered[i + 1];
			if (a.status !== "superseded" && a.status !== "stale" && a.status !== "retracted") continue;
			if (a.topics.join() === b.topics.join() || a.topics.some((t) => b.topics.includes(t))) {
				const key = `${a.id}:${b.id}`;
				if (seen.has(key)) continue;
				seen.add(key);
				const ent = view.entities.find((e) => e.id === entity);
				out.push({
					type: "TEMPORAL",
					search: "NEAR",
					dotIds: [
						a.id,
						b.id,
						entity
					],
					intermediateNodes: [],
					proposedRelation: `${a.assertedAt} ${a.status} claim preceded ${b.assertedAt} ${b.status} claim about ${ent?.name ?? entity}`,
					explanation: `Under conditions recorded in ${a.recordId}, “${a.text}” was later succeeded by “${b.text}”. Time is the relation.`,
					sharedStructure: "A preceded B under a recorded condition; A is no longer current.",
					whyItMayMatter: "A 2024 assertion is not a 2026 fact. Retrieval that ignores validTo will hallucinate currency.",
					counterargument: "Succession is not causation. The later claim may be wrong.",
					evidenceRefs: [a.id, b.id],
					counterevidenceRefs: [],
					claims: [a, b],
					novelty: .33,
					assumptions: ["assertedAt order matches historical order."],
					missingEvidence: ["The authorizing instrument that performed the succession."],
					falsifiers: ["Evidence the earlier claim remained current alongside the later one."],
					nextQuestions: ["What exactly expired: the number, the method, or the authority?"]
				});
			}
		}
	}
	return out;
}
function contradictions(view) {
	return view.contradictions.map((x) => {
		const claims = x.claimIds.map((id) => claimById(view, id)).filter((c) => Boolean(c));
		return {
			type: "CONTRADICTION",
			search: "NEAR",
			dotIds: x.claimIds,
			intermediateNodes: [],
			proposedRelation: x.title,
			explanation: `${x.summary} Connect-the-Dots does not collapse this. It names the incompatibility.`,
			sharedStructure: "A and B cannot both be true as currently stated.",
			whyItMayMatter: "Averaging incompatible figures is a lie. The Library keeps the split.",
			counterargument: "One of the claims may be a reporting error rather than a rival fact.",
			evidenceRefs: x.claimIds,
			counterevidenceRefs: [],
			claims,
			novelty: .28,
			assumptions: ["Each cited claim still means what it said."],
			missingEvidence: ["A single instrument that adjudicates the split."],
			falsifiers: ["A primary source that makes the figures commensurate (same scope, same date)."],
			nextQuestions: ["Which figure is current, which was claimed, which is advocacy?"]
		};
	});
}
function clusters(view) {
	const origin = [
		"C9822",
		"C9901",
		"C13002"
	].map((id) => claimById(view, id)).filter((c) => Boolean(c));
	const drafts = [];
	if (origin.length >= 2) drafts.push({
		type: "CLUSTER",
		search: "NEAR",
		dotIds: origin.map((c) => c.id),
		intermediateNodes: [],
		proposedRelation: "Origin cluster: primary agreement vs derived rewrite",
		explanation: "Chen's proposal and Hale's notes agree that Chen originated the architecture. A derived executive summary clusters onto the same people and rewrites the year and the authorship.",
		sharedStructure: "A, B, C repeatedly occur around the same latent theme (origin), with one node contaminated.",
		whyItMayMatter: "Clusters show where a derivative is trying to become the evidence.",
		counterargument: "The summary may have used a source not in this collection.",
		evidenceRefs: ["C9822", "C9901"],
		counterevidenceRefs: ["C13002"],
		claims: origin,
		novelty: .41,
		assumptions: ["The derived summary had access only to this collection."],
		missingEvidence: ["The prompt and sources of unassigned-summarizer-v3."],
		falsifiers: ["A 2023 primary source in which Chen and Hale jointly invent the loop."],
		nextQuestions: ["Was the rewrite a model error or an upstream note we do not have?"]
	});
	return drafts;
}
function gaps(view) {
	const drafts = [];
	const payback = claimById(view, "C13001");
	const forbid = claimById(view, "C10041");
	if (payback && forbid) drafts.push({
		type: "GAP",
		search: "FAR",
		dotIds: [payback.id, forbid.id],
		intermediateNodes: [],
		proposedRelation: "Expected finance authorization for 11-month recoupment is absent",
		explanation: "A derived summary asserts 11-month recoupment. The addendum forbids payback as a program commitment. The connection that would make the summary a fact — a primary finance source authorizing recoupment — is conspicuously missing.",
		sharedStructure: "The expected edge between claim and authorizing instrument does not exist.",
		whyItMayMatter: "Gaps are discoveries too. Absence is evidence of contamination, not of payback.",
		counterargument: "The authorizing instrument may exist outside this collection.",
		evidenceRefs: [forbid.id],
		counterevidenceRefs: [payback.id],
		claims: [payback, forbid],
		novelty: .77,
		assumptions: ["The collection is the relevant finance record."],
		missingEvidence: ["Any primary source that commits to recoupment."],
		falsifiers: ["A signed finance instrument stating 11-month payback."],
		nextQuestions: ["Who prompted the summary to invent a number finance forbade?"]
	});
	const joint = claimById(view, "C13002");
	const chen = claimById(view, "C9822");
	if (joint && chen) drafts.push({
		type: "GAP",
		search: "FAR",
		dotIds: [
			joint.id,
			chen.id,
			"C9901"
		],
		intermediateNodes: [],
		proposedRelation: "No 2023 primary for joint invention",
		explanation: "The derived summary claims Chen and Hale jointly invented the architecture in 2023. Primary 2024 sources say Chen originated, Hale requested. The 2023 joint-invention source is not here.",
		sharedStructure: "Expected supporting original for a derived claim is absent.",
		whyItMayMatter: "A missing year is not a small error. It is how a derivative becomes origin.",
		counterargument: "A 2023 lab notebook might exist and not have been accessionsed.",
		evidenceRefs: [chen.id, "C9901"],
		counterevidenceRefs: [joint.id],
		claims: [
			joint,
			chen,
			claimById(view, "C9901")
		].filter((c) => Boolean(c)),
		novelty: .74,
		assumptions: ["Kickoff notes are complete as to origin."],
		missingEvidence: ["Any 2023 document naming joint invention."],
		falsifiers: ["A 2023 primary in which Hale originates the thermal-loop idea."],
		nextQuestions: ["Should the derived summary be wiped and rebuilt under a new processor?"]
	});
	return drafts;
}
function analogies(view) {
	const expired = view.claims.filter((c) => [
		"retracted",
		"superseded",
		"stale"
	].includes(c.status));
	const picks = [
		expired.find((c) => c.topics.includes("materials")),
		expired.find((c) => c.topics.includes("nuclear") || c.topics.includes("smr")),
		expired.find((c) => c.topics.includes("policy")),
		expired.find((c) => c.topics.includes("budget"))
	].filter((c) => Boolean(c));
	if (picks.length < 3) return [];
	const overlap = lexicalOverlap(`${picks[0].text} ${picks[0].passage}`, `${picks[1].text} ${picks[1].passage}`);
	return [{
		type: "ANALOGY",
		search: "FAR",
		dotIds: picks.map((c) => c.id),
		intermediateNodes: [],
		proposedRelation: "Temporary authority must expire unless renewed",
		explanation: "A retracted materials paper, a stale SMR timeline, a superseded contractor policy, and an obsolete budget figure do not discuss the same domain. They share a relation: standing that was not re-validated and so must not keep its privileges.",
		sharedStructure: "All four solve (or fail) the problem: temporary authority must expire unless renewed.",
		whyItMayMatter: "Agent privileges, vendor access, and library claims might be safer if renewal depends on fresh evidence rather than persistent reputation. That is a hypothesis, not a policy.",
		counterargument: "Biological, budgetary, and legal expiration are not the same enforcement. The analogy may fail at the semantics of who is allowed to revoke.",
		evidenceRefs: picks.map((c) => c.id),
		counterevidenceRefs: [],
		claims: picks,
		novelty: overlap < .25 ? .88 : .55,
		assumptions: ["Expiration of standing is the shared relation, not the surface vocabulary.", `Lexical overlap of the first two domains is ${unit(overlap)} (FAR requires it stay low).`],
		missingEvidence: ["Evidence that expiring privileges reduce exploit persistence.", "A case where stale claims were re-validated and kept."],
		falsifiers: ["Persistent capabilities perform equally safely under adversarial tests.", "A domain in this set where un-renewed standing remained correct."],
		nextQuestions: ["Should VALUES and librarian privileges use the same TTL-and-renew pattern?", "Is the nuclear 2024 note a fair analogue, or only a stale belief?"]
	}];
}
function possibleCauses(view) {
	const drafts = [];
	const mercury = view.entities.filter((e) => [
		"ent-mercury",
		"ent-hg",
		"ent-cat"
	].includes(e.id));
	if (mercury.length === 3) {
		const claims = view.claims.filter((c) => c.entities.some((id) => mercury.some((e) => e.id === id)));
		drafts.push({
			type: "POSSIBLE_CAUSE",
			search: "FAR",
			dotIds: mercury.map((e) => e.id),
			intermediateNodes: [],
			proposedRelation: "The name Mercury is a common cause of identity collisions",
			explanation: "A thermal program, the element Hg, and a cat share a name. Lab vapour logs and program briefs will retrieve each other under ordinary semantic search. The collisions are not evidence that the things are the same.",
			sharedStructure: "A and B may both descend from C — here C is a homonym, not a cause in nature.",
			whyItMayMatter: "Far search must be able to say: these look related because of a word, not because of a world.",
			counterargument: "Some mercury-the-element readings really are about the program's lab.",
			evidenceRefs: claims.filter((c) => c.topics.includes("homonym") || c.id === "C9823").map((c) => c.id),
			counterevidenceRefs: [],
			claims: claims.slice(0, 4),
			novelty: .62,
			assumptions: ["The three records are not secretly the same referent."],
			missingEvidence: ["A style guide that forbids unqualified 'Mercury' in lab notes."],
			falsifiers: ["Evidence the cat record is a program code-name, not a pet."],
			nextQuestions: ["Should homonyms be a first-class retrieval channel, inverse of FAR?"]
		});
	}
	const rivera = view.entities.filter((e) => e.uncertainMatch);
	if (rivera.length >= 2) drafts.push({
		type: "POSSIBLE_CAUSE",
		search: "FAR",
		dotIds: rivera.map((e) => e.id),
		intermediateNodes: [],
		proposedRelation: "Two people named Alex Rivera; auto-merge would contaminate both",
		explanation: "A journalist reported a $90 million figure. An engineer logged elemental mercury. Shared display name, separate records. The Archivist will not auto-merge. Connect-the-Dots records the temptation as a hypothesis about why retrieval fails.",
		sharedStructure: "A and B share a label; the label is not identity.",
		whyItMayMatter: "Identity collapse is how a leaky vapour log becomes a budget source.",
		counterargument: "They could be the same person with two jobs. That would need evidence.",
		evidenceRefs: ["C11090", "C17001"],
		counterevidenceRefs: [],
		claims: ["C11090", "C17001"].map((id) => claimById(view, id)).filter((c) => Boolean(c)),
		novelty: .58,
		assumptions: ["Employee #4419 is not the Valley Ledger reporter."],
		missingEvidence: ["HR and masthead identifiers that distinguish the two."],
		falsifiers: ["A source in which the journalist is also Helios engineer #4419."],
		nextQuestions: ["What merge rule would have joined them, and who would that have served?"]
	});
	return drafts;
}
function pickBest(drafts, type, n) {
	const of = drafts.filter((d) => d.type === type);
	of.sort((a, b) => b.novelty - a.novelty);
	return of.slice(0, n);
}
async function discoverConnections(opts) {
	const view = opts.view ?? mercuryView();
	const createdAt = (opts.now ?? (() => (/* @__PURE__ */ new Date()).toISOString()))();
	const query = opts.query ?? "";
	const pool = [
		...directs(view),
		...multiHops(view),
		...temporals(view),
		...contradictions(view),
		...clusters(view),
		...gaps(view),
		...analogies(view),
		...possibleCauses(view)
	];
	const selected = [
		...pickBest(pool, "DIRECT", 1),
		...pickBest(pool, "MULTI_HOP", 1),
		...pickBest(pool, "TEMPORAL", 1),
		...pickBest(pool, "ANALOGY", 1),
		...pickBest(pool, "POSSIBLE_CAUSE", 1),
		...pickBest(pool, "CONTRADICTION", 1),
		...pickBest(pool, "CLUSTER", 1),
		...pickBest(pool, "GAP", 1)
	];
	const connections = [];
	for (const draft of selected) {
		const records = draft.claims.map((c) => recById(view, c.recordId)).filter((r) => Boolean(r));
		const blob = `${draft.proposedRelation} ${draft.explanation} ${draft.claims.map((c) => c.text).join(" ")}`;
		const scores = scoresFor({
			claims: draft.claims,
			records,
			novelty: draft.novelty,
			relevance: relevanceTo(query, blob),
			falsifiers: draft.falsifiers,
			missing: draft.missingEvidence
		});
		const slugSrc = canonicalSlug(draft);
		const unsignedBase = {
			id: "",
			type: draft.type,
			search: draft.search,
			dotIds: draft.dotIds,
			intermediateNodes: draft.intermediateNodes,
			proposedRelation: draft.proposedRelation,
			explanation: draft.explanation,
			sharedStructure: draft.sharedStructure,
			whyItMayMatter: draft.whyItMayMatter,
			counterargument: draft.counterargument,
			evidenceRefs: draft.evidenceRefs,
			counterevidenceRefs: draft.counterevidenceRefs,
			scores,
			assumptions: draft.assumptions,
			missingEvidence: draft.missingEvidence,
			falsifiers: draft.falsifiers,
			nextQuestions: draft.nextQuestions,
			model: DOTS_EVALUATOR,
			checkpoint: DOTS_CHECKPOINT,
			valuesUri: opts.profile.uri,
			valuesHash: opts.profile.hash,
			evidenceRoot: opts.evidenceRoot,
			createdAt,
			status: "HYPOTHESIS"
		};
		const id = `CDT-${draft.type.slice(0, 3)}-${slugSrc}`;
		const withId = {
			...unsignedBase,
			id
		};
		const hash = await hashConnection(withId);
		connections.push({
			...withId,
			hash
		});
	}
	return {
		model: DOTS_EVALUATOR,
		checkpoint: DOTS_CHECKPOINT,
		valuesUri: opts.profile.uri,
		evidenceRoot: opts.evidenceRoot,
		nearCount: connections.filter((c) => c.search === "NEAR").length,
		farCount: connections.filter((c) => c.search === "FAR").length,
		connections
	};
}
function canonicalSlug(draft) {
	const key = `${draft.type}:${[...draft.dotIds].sort().join("+")}`;
	let h = 0;
	for (let i = 0; i < key.length; i++) h = h * 33 + key.charCodeAt(i) >>> 0;
	return h.toString(16).slice(0, 6);
}
function listed() {
	const fromLedger = connectionsFromLedger(kernel, useDots.getState().policy);
	if (fromLedger.length) return fromLedger;
	return useDots.getState().lastReport?.connections ?? [];
}
function byId(id) {
	return listed().find((c) => c.id === id);
}
var useDots = create()(persist((set, get) => ({
	lastReport: null,
	reviews: {},
	notice: null,
	policy: "conservative",
	setPolicy: (policy) => {
		set({
			policy,
			notice: policy === "evidentiary" ? "This library: evidentiary policy. Independent evidence can mark a DIRECT as a local working hypothesis. HMAC is not trust." : "This library: conservative policy. Challenge binds. Opinion never promotes. HMAC is not trust."
		});
		refreshLibrary();
	},
	runDiscovery: async (query) => {
		const root = await evidenceRoot(kernel);
		const profile = await profileByRole("connector", "1.0.0");
		const report = await discoverConnections({
			view: {
				records: kernel.catalog.data.records.length ? kernel.catalog.data.records : mercuryView().records,
				claims: kernel.catalog.data.claims.length ? kernel.catalog.data.claims : mercuryView().claims,
				entities: kernel.catalog.data.entities.length ? kernel.catalog.data.entities : mercuryView().entities,
				relationships: kernel.catalog.data.relationships.length ? kernel.catalog.data.relationships : mercuryView().relationships,
				contradictions: kernel.catalog.data.contradictions.length ? kernel.catalog.data.contradictions : mercuryView().contradictions
			},
			query,
			evidenceRoot: root,
			profile
		});
		await fileDiscovery(kernel, report);
		set({
			lastReport: report,
			notice: null
		});
		refreshLibrary();
		return report;
	},
	review: async (id) => {
		const connection = byId(id);
		if (!connection) return null;
		const report = await reviewConnection(connection);
		report.originalReceipt = connection.ledgerReceipt;
		await fileReviewReceipt(kernel, connection, `Seven-seat review. Majority ${report.majority}. authorized:false. Costly=${report.costly}.`);
		set({ reviews: {
			...get().reviews,
			[id]: report
		} });
		refreshLibrary();
		return report;
	},
	challenge: async (id, reason, role) => {
		const connection = byId(id);
		if (!connection) return;
		await fileChallenge(kernel, connection, reason, role);
		if (get().lastReport) set({
			lastReport: {
				...get().lastReport,
				connections: get().lastReport.connections.map((c) => c.id === id ? {
					...c,
					localStatus: "CONTESTED"
				} : c)
			},
			notice: `CHALLENGE filed against ${connectionUri(connection.hash)}. Artifact unchanged.`
		});
		refreshLibrary();
	},
	support: async (id, reason, role, opts) => {
		const connection = byId(id);
		if (!connection) return;
		const ev = await fileSupport(kernel, connection, reason, role, opts);
		set({ notice: (opts?.supportClass ?? "OPINION") === "EVIDENTIARY" ? `SUPPORT — EVIDENTIARY filed. Independent evidence, not a vote. Artifact unchanged. ${ev.payload.reviewUri ?? ""}` : `SUPPORT — OPINION filed. Agreement does not accumulate into evidence. Artifact unchanged.` });
		refreshLibrary();
	},
	falsify: async (id, reason) => {
		const connection = byId(id);
		if (!connection) return;
		await fileFalsify(kernel, connection, reason);
		if (get().lastReport) set({
			lastReport: {
				...get().lastReport,
				connections: get().lastReport.connections.map((c) => c.id === id ? {
					...c,
					localStatus: "FALSIFIED"
				} : c)
			},
			notice: `FALSIFY filed against ${connectionUri(connection.hash)}. Artifact unchanged.`
		});
		refreshLibrary();
	},
	keepOpen: async (id) => {
		const connection = byId(id);
		if (!connection) return;
		await fileKeepOpen(kernel, connection);
		refreshLibrary();
	},
	promote: async (id) => {
		const connection = byId(id);
		if (!connection) return {
			ok: false,
			reason: "Unknown connection."
		};
		const ev = await filePromote(kernel, connection, void 0, get().policy);
		const ok = ev.result === "ok";
		if (ok && get().lastReport) set({
			lastReport: {
				...get().lastReport,
				connections: get().lastReport.connections.map((c) => c.id === id ? {
					...c,
					localStatus: "SUPPORTED"
				} : c)
			},
			notice: "This library: SUPPORTED working hypothesis. Shared artifact stays HYPOTHESIS. Not a fact."
		});
		else set({ notice: ev.summary });
		refreshLibrary();
		return {
			ok,
			reason: ev.summary
		};
	},
	importCard: async (text) => {
		const parsed = await parseEnvelope(text);
		if (!parsed.ok) return parsed;
		if (parsed.type === "review") {
			const ev = await fileReplicateReview(kernel, parsed.review);
			set({ notice: ev.summary });
			refreshLibrary();
			return {
				ok: true,
				reason: ev.summary
			};
		}
		const ev = await fileReplicate(kernel, parsed.connection);
		const report = get().lastReport;
		set({
			lastReport: report ? {
				...report,
				connections: [parsed.connection, ...report.connections]
			} : {
				model: parsed.connection.model,
				checkpoint: parsed.connection.checkpoint,
				valuesUri: parsed.connection.valuesUri,
				evidenceRoot: parsed.connection.evidenceRoot,
				nearCount: parsed.connection.search === "NEAR" ? 1 : 0,
				farCount: parsed.connection.search === "FAR" ? 1 : 0,
				connections: [parsed.connection]
			},
			notice: ev.summary
		});
		refreshLibrary();
		return {
			ok: true,
			reason: ev.summary
		};
	},
	hydrate: () => listed()
}), { name: "gal-dots-v2" }));
//#endregion
export { useDots as n, ConnectionCard as t };
