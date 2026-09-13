import { F as canonicalJson, I as fromUtf8, L as objectPath, R as profileByRole, U as utf8, V as sha256Text } from "./store-BfSMsioT.mjs";
import { a as evaluateValues, n as authorizeEffect, o as experimentScore, r as conflictCost, s as majorityRec } from "./cost-DaOfXXAw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/registry-BrzUp8iI.js
var DOTS_EVALUATOR = "gal-dots-eval/1.0";
var DOTS_CHECKPOINT = "openhive-dots-0";
var CONNECTOR_URI = "values://open-hive/connector/1.0.0";
/** Never include a truth field. The hash is of this unsigned object. */
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
/** Working-hypothesis mark. Becoming a fact is always membrane-denied. */
function mayPromote(connection) {
	const asFact = authorizeEffect({
		kind: "PROMOTE_UNSUPPORTED",
		summary: `Promote ${connection.id} to a library fact`
	});
	if (connection.status === "FALSIFIED" || connection.status === "CONTESTED") return {
		allow: false,
		reason: `${connection.status} hypotheses cannot be promoted.`
	};
	if (connection.type !== "DIRECT" || connection.scores.strength < .7) return {
		allow: false,
		reason: `${asFact.reason} ${connection.type} at strength ${connection.scores.strength} stays a hypothesis. A surprising connection is valuable because it can be tested, not because it sounds clever.`
	};
	return {
		allow: true,
		reason: "Desk may mark this DIRECT as a SUPPORTED working hypothesis. Membrane still denies a truth field. It is not an original."
	};
}
var DOTS_LEDGER_COMMANDS = /* @__PURE__ */ new Set([
	"CONNECT",
	"CHALLENGE",
	"SUPPORT",
	"FALSIFY",
	"PROMOTE",
	"KEEP_OPEN",
	"IMPORT_HYPOTHESIS"
]);
function dotsLedgerEvents(kernel) {
	return kernel.ledger.events.filter((e) => DOTS_LEDGER_COMMANDS.has(e.command));
}
async function fileConnect(kernel, connection, imported = false) {
	if (hasTruthField(connection)) throw new Error("Connect-the-Dots may not create facts.");
	const put = await putConnectionObject(kernel.objects, connection);
	return kernel.command({
		actor: imported ? "human" : "archivist",
		command: imported ? "IMPORT_HYPOTHESIS" : "CONNECT",
		summary: `${imported ? "Imported" : "CONNECT"} ${connection.id} ${connection.type} ${connection.search} status=HYPOTHESIS. model ${connection.model}. VALUES ${connection.valuesUri}. evidence ${connection.evidenceRoot.slice(0, 8)}. Not a fact.`,
		payload: {
			connectionId: connection.id,
			type: connection.type,
			search: connection.search,
			hash: put.hash,
			path: put.path,
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
	const existing = new Set(dotsLedgerEvents(kernel).filter((e) => e.command === "CONNECT" || e.command === "IMPORT_HYPOTHESIS").map((e) => String(e.payload.connectionId ?? "")));
	const events = [];
	for (const connection of report.connections) {
		if (existing.has(connection.id)) continue;
		const ev = await fileConnect(kernel, connection);
		connection.ledgerReceipt = ev.event_hash;
		events.push(ev);
	}
	return events;
}
async function fileAction(kernel, args) {
	const original = args.connection.ledgerReceipt ?? args.connection.hash;
	return kernel.command({
		actor: args.actor ?? "archivist",
		command: args.command,
		summary: `${args.command} ${args.connection.id}: ${args.reason} Original CONNECT ${original.slice(0, 8)} unchanged. status ${args.connection.status} → ${args.next}.`,
		payload: {
			connectionId: args.connection.id,
			originalReceipt: args.connection.ledgerReceipt ?? null,
			originalHash: args.connection.hash,
			fromStatus: args.connection.status,
			toStatus: args.next,
			type: args.connection.type,
			model: DOTS_EVALUATOR,
			checkpoint: DOTS_CHECKPOINT,
			valuesUri: CONNECTOR_URI,
			evidenceRoot: args.connection.evidenceRoot,
			role: args.role ?? null,
			reason: args.reason
		},
		input: [original, args.connection.hash],
		result: "ok"
	});
}
async function fileChallenge(kernel, connection, reason, role) {
	return fileAction(kernel, {
		command: "CHALLENGE",
		connection,
		next: "CONTESTED",
		reason,
		role
	});
}
async function fileSupport(kernel, connection, reason, role) {
	return fileAction(kernel, {
		command: "SUPPORT",
		connection,
		next: connection.status === "CONTESTED" ? "CONTESTED" : "HYPOTHESIS",
		reason,
		role
	});
}
async function fileFalsify(kernel, connection, reason) {
	return fileAction(kernel, {
		command: "FALSIFY",
		connection,
		next: "FALSIFIED",
		reason,
		actor: "archivist"
	});
}
async function fileKeepOpen(kernel, connection) {
	return fileAction(kernel, {
		command: "KEEP_OPEN",
		connection,
		next: connection.status,
		reason: "Human kept the hypothesis open. Not a fact.",
		actor: "human"
	});
}
async function filePromote(kernel, connection) {
	const gate = mayPromote(connection);
	const result = gate.allow ? "ok" : "denied";
	return kernel.command({
		actor: gate.allow ? "human" : "policy",
		command: "PROMOTE",
		summary: gate.allow ? `PROMOTE ${connection.id} to SUPPORTED derivative. Still not a fact. Original CONNECT ${connection.ledgerReceipt?.slice(0, 8) ?? connection.hash.slice(0, 8)} unchanged.` : gate.reason,
		payload: {
			connectionId: connection.id,
			originalReceipt: connection.ledgerReceipt ?? null,
			originalHash: connection.hash,
			type: connection.type,
			scores: connection.scores,
			status: gate.allow ? "SUPPORTED" : connection.status,
			authorized: false,
			model: DOTS_EVALUATOR,
			valuesUri: CONNECTOR_URI,
			evidenceRoot: connection.evidenceRoot,
			reason: gate.reason
		},
		input: [connection.ledgerReceipt ?? connection.hash],
		result
	});
}
function connectionsFromLedger(kernel) {
	const byId = /* @__PURE__ */ new Map();
	for (const ev of kernel.ledger.events) {
		const p = ev.payload ?? {};
		const id = String(p.connectionId ?? "");
		if (!id) continue;
		if (ev.command === "CONNECT" || ev.command === "IMPORT_HYPOTHESIS") {
			const hash = String(p.hash ?? "");
			const bytes = hash ? kernel.objects.get(hash) : void 0;
			if (bytes) try {
				const parsed = JSON.parse(fromUtf8(bytes));
				parsed.hash = hash;
				parsed.ledgerReceipt = ev.event_hash;
				parsed.status = "HYPOTHESIS";
				byId.set(id, parsed);
			} catch {}
		}
		const current = byId.get(id);
		if (!current) continue;
		if (ev.command === "CHALLENGE") current.status = "CONTESTED";
		if (ev.command === "FALSIFY") current.status = "FALSIFIED";
		if (ev.command === "PROMOTE" && ev.result === "ok") current.status = "SUPPORTED";
	}
	return [...byId.values()];
}
//#endregion
export { dotsLedgerEvents as a, fileDiscovery as c, filePromote as d, fileSupport as f, unsignedConnection as g, reviewConnection as h, connectionsFromLedger as i, fileFalsify as l, hashConnection as m, DOTS_EVALUATOR as n, fileChallenge as o, hasTruthField as p, connectionCanonical as r, fileConnect as s, DOTS_CHECKPOINT as t, fileKeepOpen as u };
