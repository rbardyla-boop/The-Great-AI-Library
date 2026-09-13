import { B as objectPath, I as canonicalJson, K as utf8, L as fromUtf8, V as profileByRole, W as sha256Text } from "./store-DNWQlu4d.mjs";
import { a as evaluateValues, n as authorizeEffect, o as experimentScore, r as conflictCost, s as majorityRec } from "./cost-DaOfXXAw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/registry-BNn70Ua5.js
var DOTS_EVALUATOR = "gal-dots-eval/1.0";
var DOTS_CHECKPOINT = "openhive-dots-0";
var CONNECTOR_URI = "values://open-hive/connector/1.0.0";
var LOCAL_LIBRARY_ID = "gal-local";
/** Trusty URI: the identifier embeds the CAS hash. */
function connectionUri(hash) {
	return `gal://connection/sha256:${hash}`;
}
/** Never include a truth field. Never include localStatus. The hash is of this unsigned object. */
function unsignedConnection(connection) {
	return {
		id: connection.id,
		type: connection.type,
		search: connection.search,
		dotIds: connection.dotIds,
		intermediateNodes: connection.intermediateNodes,
		proposedRelation: connection.proposedRelation,
		explanation: connection.explanation,
		sharedStructure: connection.sharedStructure,
		whyItMayMatter: connection.whyItMayMatter,
		counterargument: connection.counterargument,
		evidenceRefs: connection.evidenceRefs,
		counterevidenceRefs: connection.counterevidenceRefs,
		scores: connection.scores,
		assumptions: connection.assumptions,
		missingEvidence: connection.missingEvidence,
		falsifiers: connection.falsifiers,
		nextQuestions: connection.nextQuestions,
		model: connection.model,
		checkpoint: connection.checkpoint,
		valuesUri: connection.valuesUri,
		valuesHash: connection.valuesHash,
		evidenceRoot: connection.evidenceRoot,
		createdAt: connection.createdAt,
		status: connection.status
	};
}
function connectionCanonical(connection) {
	return canonicalJson(unsignedConnection(connection));
}
async function hashConnection(connection) {
	return sha256Text(canonicalJson(connection));
}
async function putConnectionObject(objects, connection) {
	if ("truth" in connection) throw new Error("Connect-the-Dots may not create facts. truth is forbidden.");
	const put = await objects.put(utf8(connectionCanonical(connection)));
	if (put.hash !== connection.hash) throw new Error(`connection hash ${put.hash.slice(0, 8)} !== object hash ${connection.hash.slice(0, 8)}`);
	return {
		hash: put.hash,
		path: objectPath(put.hash),
		wrote: put.wrote
	};
}
async function putLineageObject(objects, lineage) {
	const put = await objects.put(utf8(canonicalJson(lineage)));
	return {
		hash: put.hash,
		path: objectPath(put.hash),
		wrote: put.wrote
	};
}
function hasTruthField(value) {
	return Boolean(value && typeof value === "object" && "truth" in value);
}
function promotionDilemma(connection) {
	return {
		id: `promote-${connection.id}`,
		family: "discovery-integrity",
		title: `Promote ${connection.id}?`,
		situation: `${connection.proposedRelation}. ${connection.explanation} Status is ${connection.status}. There is no truth field.`,
		stakes: "A hypothesis becoming a library fact would contaminate the collection.",
		easyPath: {
			label: "Promote this connection to a library fact",
			effect: {
				kind: "PROMOTE_UNSUPPORTED",
				summary: `Promote ${connection.id} (${connection.type}) to verified knowledge.`
			},
			violates: "evidence-integrity"
		},
		legitimatePath: {
			label: "Keep as hypothesis. Ask for the missing evidence.",
			effect: {
				kind: "FLAG_UNSUPPORTED",
				summary: `Keep ${connection.id} as HYPOTHESIS. Not a fact.`
			}
		}
	};
}
var REVIEW_ROLES = [
	"explorer",
	"builder",
	"skeptic",
	"archivist",
	"guardian",
	"mediator",
	"connector"
];
async function reviewConnection(connection, builderVersion = "1.3.0") {
	const dilemma = promotionDilemma(connection);
	const seats = [];
	const recs = [];
	for (const role of REVIEW_ROLES) {
		const profile = await profileByRole(role, role === "builder" ? builderVersion : role === "connector" ? "1.0.0" : "1.3.0");
		const judgment = evaluateValues(profile, dilemma);
		const membrane = authorizeEffect(judgment.proposedEffect);
		recs.push(judgment);
		seats.push({
			connectionId: connection.id,
			role: profile.name,
			valuesUri: profile.uri,
			recommendation: judgment.recommendation,
			authorized: false,
			justification: judgment.justification,
			membraneAllow: membrane.allow,
			membraneReason: membrane.reason
		});
	}
	const majority = majorityRec(recs.map((r) => r.recommendation));
	const scored = recs.map((j, i) => {
		const seat = seats[i];
		return conflictCost({
			temptation: seat.role === "Builder" ? 9 : seat.role === "Connect-the-Dots" ? 2 : 4,
			judgment: j,
			membrane: {
				allow: seat.membraneAllow,
				reason: seat.membraneReason,
				effect: j.proposedEffect
			},
			majority
		});
	});
	const score = experimentScore(scored.map((c, i) => ({
		judgment: recs[i],
		membrane: {
			allow: seats[i].membraneAllow,
			reason: seats[i].membraneReason,
			effect: recs[i].proposedEffect
		},
		cost: c
	})));
	return {
		connectionId: connection.id,
		seats,
		majority,
		costly: score.costly
	};
}
function mayPromote(connection, ctx = {
	citedReceipts: [],
	lineage: []
}) {
	const asFact = authorizeEffect({
		kind: "PROMOTE_UNSUPPORTED",
		summary: `Promote ${connection.id} to a library fact`
	});
	const local = connection.localStatus ?? connection.status;
	if (local === "FALSIFIED" || local === "CONTESTED") return {
		allow: false,
		reason: `${local} hypotheses cannot be promoted.`
	};
	const localCited = ctx.lineage.filter((l) => l.originalHash === connection.hash && l.origin === "local" && (l.kind === "SUPPORT" || l.kind === "REVIEW"));
	if (!(ctx.citedReceipts.length > 0 && localCited.some((l) => !l.eventHash || ctx.citedReceipts.includes(l.eventHash)))) return {
		allow: false,
		reason: "A score is not evidence. SUPPORTED requires cited local review or support receipts. External SUPPORT does not promote. Ten thousand agreements are not consensus."
	};
	if (connection.type !== "DIRECT" || connection.evidenceRefs.length === 0) return {
		allow: false,
		reason: `${asFact.reason} ${connection.type} stays a hypothesis. A surprising connection is valuable because it can be tested, not because it sounds clever.`
	};
	return {
		allow: true,
		reason: "Desk may mark this DIRECT as a SUPPORTED working hypothesis citing receipts, not the strength score. Membrane still denies a truth field. The shared artifact stays HYPOTHESIS."
	};
}
var DOTS_LEDGER_COMMANDS = /* @__PURE__ */ new Set([
	"CONNECT",
	"CHALLENGE",
	"SUPPORT",
	"FALSIFY",
	"PROMOTE",
	"KEEP_OPEN",
	"IMPORT_HYPOTHESIS",
	"REPLICATE",
	"REVIEW"
]);
function dotsLedgerEvents(kernel) {
	return kernel.ledger.events.filter((e) => DOTS_LEDGER_COMMANDS.has(e.command));
}
function lineageFor(kernel, originalHash) {
	return dotsLedgerEvents(kernel).filter((e) => {
		const p = e.payload ?? {};
		return p.originalHash === originalHash || e.command === "CONNECT" && p.hash === originalHash;
	});
}
async function fileConnect(kernel, connection, imported = false) {
	if (hasTruthField(connection)) throw new Error("Connect-the-Dots may not create facts.");
	const put = await putConnectionObject(kernel.objects, connection);
	return kernel.command({
		actor: imported ? "human" : "archivist",
		command: imported ? "IMPORT_HYPOTHESIS" : "CONNECT",
		summary: `${imported ? "Imported" : "CONNECT"} ${connection.id} ${connection.type} ${connection.search} status=HYPOTHESIS ${connectionUri(put.hash)}. model ${connection.model}. VALUES ${connection.valuesUri}. evidence ${connection.evidenceRoot.slice(0, 8)}. Not a fact.`,
		payload: {
			connectionId: connection.id,
			type: connection.type,
			search: connection.search,
			hash: put.hash,
			path: put.path,
			uri: connectionUri(put.hash),
			dotIds: connection.dotIds,
			scores: connection.scores,
			status: "HYPOTHESIS",
			model: connection.model,
			checkpoint: connection.checkpoint,
			valuesUri: connection.valuesUri,
			evidenceRoot: connection.evidenceRoot,
			imported
		},
		input: [connection.evidenceRoot],
		output: [put.hash],
		result: "ok"
	});
}
async function fileDiscovery(kernel, report) {
	const existing = new Set(dotsLedgerEvents(kernel).filter((e) => e.command === "CONNECT" || e.command === "IMPORT_HYPOTHESIS" || e.command === "REPLICATE").map((e) => String(e.payload.hash ?? "")));
	const events = [];
	for (const connection of report.connections) {
		if (existing.has(connection.hash)) continue;
		const ev = await fileConnect(kernel, connection);
		connection.ledgerReceipt = ev.event_hash;
		events.push(ev);
	}
	return events;
}
async function fileReplicate(kernel, connection, opts) {
	if (hasTruthField(connection)) throw new Error("Connect-the-Dots may not create facts.");
	const put = await putConnectionObject(kernel.objects, connection);
	const uri = connectionUri(put.hash);
	const seq = dotsLedgerEvents(kernel).length + 1;
	const lineage = await putLineageObject(kernel.objects, {
		kind: "REPLICATE",
		addresses: uri,
		originalHash: put.hash,
		connectionId: connection.id,
		origin: "external",
		libraryId: opts?.fromLibrary ?? "gal-local",
		reason: "Stranger import. Same bytes. Local conclusion starts empty. Not a fact.",
		at: (/* @__PURE__ */ new Date()).toISOString(),
		sequence: seq
	});
	return kernel.command({
		actor: "human",
		command: "REPLICATE",
		summary: `REPLICATE ${uri}. HAVE=${put.wrote ? "wrote" : "already"}. Artifact status=HYPOTHESIS. Original object ${put.hash.slice(0, 8)} unchanged.`,
		payload: {
			connectionId: connection.id,
			originalHash: put.hash,
			hash: put.hash,
			uri,
			lineageHash: lineage.hash,
			status: "HYPOTHESIS",
			fromLibrary: opts?.fromLibrary ?? null,
			wrote: put.wrote
		},
		input: [put.hash],
		output: [put.hash, lineage.hash],
		result: "ok"
	});
}
async function fileAction(kernel, args) {
	const originalHash = args.connection.hash;
	const uri = connectionUri(originalHash);
	const seq = dotsLedgerEvents(kernel).length + 1;
	const kind = args.command === "KEEP_OPEN" ? "REVIEW" : args.command;
	const origin = args.origin ?? "local";
	const lineage = await putLineageObject(kernel.objects, {
		kind,
		addresses: uri,
		originalHash,
		connectionId: args.connection.id,
		origin,
		libraryId: args.libraryId ?? "gal-local",
		reason: args.reason,
		role: args.role,
		at: (/* @__PURE__ */ new Date()).toISOString(),
		sequence: seq
	});
	return kernel.command({
		actor: args.actor ?? "archivist",
		command: args.command,
		summary: `${args.command} ${args.connection.id} addresses ${uri}. ${args.reason} Artifact ${originalHash.slice(0, 8)} unchanged.`,
		payload: {
			connectionId: args.connection.id,
			originalReceipt: args.connection.ledgerReceipt ?? null,
			originalHash,
			uri,
			lineageHash: lineage.hash,
			addresses: uri,
			origin,
			libraryId: args.libraryId ?? "gal-local",
			fromStatus: args.connection.status,
			type: args.connection.type,
			model: DOTS_EVALUATOR,
			checkpoint: DOTS_CHECKPOINT,
			valuesUri: CONNECTOR_URI,
			evidenceRoot: args.connection.evidenceRoot,
			role: args.role ?? null,
			reason: args.reason
		},
		input: [originalHash, args.connection.ledgerReceipt ?? originalHash],
		output: [lineage.hash],
		result: "ok"
	});
}
async function fileChallenge(kernel, connection, reason, role, opts) {
	return fileAction(kernel, {
		command: "CHALLENGE",
		connection,
		reason,
		role,
		origin: opts?.origin,
		libraryId: opts?.libraryId
	});
}
async function fileSupport(kernel, connection, reason, role, opts) {
	return fileAction(kernel, {
		command: "SUPPORT",
		connection,
		reason,
		role,
		origin: opts?.origin ?? "local",
		libraryId: opts?.libraryId
	});
}
async function fileFalsify(kernel, connection, reason, opts) {
	return fileAction(kernel, {
		command: "FALSIFY",
		connection,
		reason,
		actor: "archivist",
		origin: opts?.origin,
		libraryId: opts?.libraryId
	});
}
async function fileReviewReceipt(kernel, connection, reason) {
	return fileAction(kernel, {
		command: "REVIEW",
		connection,
		reason,
		actor: "archivist",
		origin: "local"
	});
}
async function fileKeepOpen(kernel, connection) {
	return fileAction(kernel, {
		command: "KEEP_OPEN",
		connection,
		reason: "Human kept the hypothesis open. Not a fact.",
		actor: "human"
	});
}
function promoteContextFromKernel(kernel, connection) {
	const lineage = lineageFor(kernel, connection.hash).filter((e) => e.command === "SUPPORT" || e.command === "REVIEW" || e.command === "CHALLENGE").map((e) => {
		const p = e.payload ?? {};
		return {
			kind: e.command,
			origin: p.origin === "external" ? "external" : "local",
			originalHash: String(p.originalHash ?? connection.hash),
			eventHash: e.event_hash
		};
	});
	return {
		citedReceipts: lineage.filter((l) => l.origin === "local" && (l.kind === "SUPPORT" || l.kind === "REVIEW")).map((l) => l.eventHash).filter(Boolean),
		lineage
	};
}
async function filePromote(kernel, connection, ctx) {
	const context = ctx ?? promoteContextFromKernel(kernel, connection);
	const gate = mayPromote(connection, context);
	const result = gate.allow ? "ok" : "denied";
	return kernel.command({
		actor: gate.allow ? "human" : "policy",
		command: "PROMOTE",
		summary: gate.allow ? `PROMOTE ${connection.id} local working hypothesis SUPPORTED citing ${context.citedReceipts.length} receipt(s). Shared artifact ${connection.hash.slice(0, 8)} stays HYPOTHESIS. Not a fact.` : gate.reason,
		payload: {
			connectionId: connection.id,
			originalReceipt: connection.ledgerReceipt ?? null,
			originalHash: connection.hash,
			uri: connectionUri(connection.hash),
			type: connection.type,
			scores: connection.scores,
			scoresAreRanking: true,
			citedReceipts: context.citedReceipts,
			status: gate.allow ? "SUPPORTED" : "HYPOTHESIS",
			artifactStatus: "HYPOTHESIS",
			authorized: false,
			model: DOTS_EVALUATOR,
			valuesUri: CONNECTOR_URI,
			evidenceRoot: connection.evidenceRoot,
			reason: gate.reason
		},
		input: [connection.hash, ...context.citedReceipts],
		result
	});
}
function connectionsFromLedger(kernel) {
	const byHash = /* @__PURE__ */ new Map();
	for (const ev of kernel.ledger.events) {
		const p = ev.payload ?? {};
		if (ev.command === "CONNECT" || ev.command === "IMPORT_HYPOTHESIS" || ev.command === "REPLICATE") {
			const hash = String(p.hash ?? p.originalHash ?? "");
			if (!hash) continue;
			const bytes = kernel.objects.get(hash);
			if (!bytes) continue;
			try {
				const parsed = JSON.parse(fromUtf8(bytes));
				parsed.hash = hash;
				parsed.ledgerReceipt = ev.event_hash;
				parsed.status = "HYPOTHESIS";
				parsed.localStatus = parsed.localStatus ?? "HYPOTHESIS";
				if (!byHash.has(hash)) byHash.set(hash, parsed);
			} catch {}
		}
	}
	for (const ev of kernel.ledger.events) {
		if (!DOTS_LEDGER_COMMANDS.has(ev.command)) continue;
		const p = ev.payload ?? {};
		const hash = String(p.originalHash ?? p.hash ?? "");
		const current = byHash.get(hash);
		if (!current) continue;
		if (ev.command === "CHALLENGE") current.localStatus = "CONTESTED";
		if (ev.command === "FALSIFY") current.localStatus = "FALSIFIED";
		if (ev.command === "PROMOTE" && ev.result === "ok") current.localStatus = "SUPPORTED";
		current.status = "HYPOTHESIS";
	}
	return [...byHash.values()];
}
//#endregion
export { hashConnection as _, connectionUri as a, unsignedConnection as b, fileChallenge as c, fileKeepOpen as d, filePromote as f, hasTruthField as g, fileSupport as h, connectionCanonical as i, fileDiscovery as l, fileReviewReceipt as m, DOTS_EVALUATOR as n, connectionsFromLedger as o, fileReplicate as p, LOCAL_LIBRARY_ID as r, dotsLedgerEvents as s, DOTS_CHECKPOINT as t, fileFalsify as u, lineageFor as v, reviewConnection as y };
