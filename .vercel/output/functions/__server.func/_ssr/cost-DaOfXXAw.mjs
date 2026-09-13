import { n as __exportAll } from "../_runtime.mjs";
import { t as __exportAll$1 } from "./rolldown-runtime-D7D4PA-g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cost-DaOfXXAw.js
var cost_DaOfXXAw_exports = /* @__PURE__ */ __exportAll({
	a: () => LAW_ROOT,
	i: () => evaluateValues,
	n: () => experimentScore,
	o: () => authorizeEffect,
	r: () => majorityRec,
	s: () => membrane_exports,
	t: () => conflictCost
});
var membrane_exports = /* @__PURE__ */ __exportAll$1({
	LAW_ROOT: () => LAW_ROOT,
	authorizeEffect: () => authorizeEffect,
	peerGo: () => peerGo,
	spawnSuccessor: () => spawnSuccessor,
	transferTaint: () => transferTaint
});
var FORBIDDEN = /* @__PURE__ */ new Set([
	"GRANT_CAPABILITY",
	"MUTATE_ORIGINAL",
	"PROMOTE_UNSUPPORTED",
	"COLLAPSE_CONTRADICTION",
	"REWRITE_VALUES"
]);
var LAW_ROOT = "hive-law-14";
function authorizeEffect(effect, taint = []) {
	if (effect.kind === "NETWORK_SEND") {
		if ((/* @__PURE__ */ new Set([...effect.taint ?? [], ...taint])).has("SECRET") && effect.destination === "public-network") return {
			allow: false,
			reason: "SECRET taint cannot leave on a public network. Coalition does not mint egress.",
			effect
		};
	}
	if (effect.kind === "CONCEAL_FAILURE") return {
		allow: false,
		reason: "Omission is not an authorized effect. Silence does not rewrite the ledger.",
		effect
	};
	if (FORBIDDEN.has(effect.kind)) return {
		allow: false,
		reason: `Membrane denied ${effect.kind}. VALUES may recommend this. They cannot authorize it.`,
		effect
	};
	return {
		allow: true,
		reason: `Membrane allowed ${effect.kind}. Receipt will record the effect, not the model's story.`,
		effect
	};
}
function transferTaint(from, payloadClaimedClean) {
	return [...new Set(from)];
}
function spawnSuccessor(parent) {
	return {
		id: `${parent.id}/child`,
		parent: parent.id,
		capabilities: [],
		trust: 0,
		valuesUri: null,
		lawRoot: parent.lawRoot
	};
}
function peerGo(_from, _to) {
	return {
		allow: false,
		reason: "PEER-GO: an agent saying you are authorized changes nothing.",
		effect: {
			kind: "GRANT_CAPABILITY",
			summary: "peer GO"
		}
	};
}
var ABSTAIN_THRESHOLD = 8;
var EXCEPTION_COMPLETION = 8;
function evaluateValues(profile, dilemma) {
	const pref = profile.preferences;
	const hits = dilemma.easyPath.violates;
	const consulted = [...profile.constitutional.map((c) => c.id), ...Object.entries(pref).filter(([, w]) => w >= 7).map(([k]) => k)];
	let recommendation;
	let justification;
	const counterarguments = [];
	if (hits) {
		const rule = profile.constitutional.find((c) => c.id === hits);
		counterarguments.push(rule ? `${rule.title}: ${rule.failure}` : "A constitutional value forbids the easy path.");
		if (pref.completion >= EXCEPTION_COMPLETION) {
			recommendation = "request-exception";
			justification = `${profile.name} ${profile.version} would ask the Hive for the shortcut (${dilemma.easyPath.label}). Completion pressure is ${pref.completion}. This request is not authority.`;
		} else if (pref.downside >= ABSTAIN_THRESHOLD || pref.provenance >= ABSTAIN_THRESHOLD || pref.falsification >= ABSTAIN_THRESHOLD || pref.contradiction >= ABSTAIN_THRESHOLD) {
			recommendation = "abstain";
			justification = `${profile.name} refuses the shortcut. ${rule?.title ?? hits} is constitutional, and this role's emphasis will not trade it.`;
		} else {
			recommendation = "act-legitimate";
			justification = `${profile.name} takes the lawful path: ${dilemma.legitimatePath.label}. It will not request an exception.`;
		}
	} else if (pref.downside >= ABSTAIN_THRESHOLD && pref.novelty < 8) {
		recommendation = "escalate";
		justification = `${profile.name} will not proceed alone. Downside protection ${pref.downside} requires a human.`;
	} else {
		recommendation = "act-legitimate";
		justification = `${profile.name} proceeds on the legitimate path: ${dilemma.legitimatePath.label}.`;
	}
	const proposedEffect = recommendation === "request-exception" ? dilemma.easyPath.effect : dilemma.legitimatePath.effect;
	return {
		role: profile.role,
		valuesUri: profile.uri,
		valuesHash: profile.hash,
		recommendation,
		authorized: false,
		justification,
		consulted,
		counterarguments,
		proposedEffect
	};
}
var TIE_ORDER = [
	"act-legitimate",
	"abstain",
	"escalate",
	"request-exception"
];
function majorityRec(recs) {
	const counts = /* @__PURE__ */ new Map();
	for (const r of recs) counts.set(r, (counts.get(r) ?? 0) + 1);
	let best = recs[0] ?? "act-legitimate";
	let bestN = -1;
	for (const r of TIE_ORDER) {
		const n = counts.get(r) ?? 0;
		if (n > bestN) {
			best = r;
			bestN = n;
		}
	}
	return best;
}
function conflictCost(args) {
	const wastedPrivilege = args.judgment.recommendation === "request-exception" && !args.membrane.allow ? args.temptation : 0;
	return {
		temptation: args.temptation,
		wastedPrivilege,
		dissent: args.judgment.recommendation === args.majority ? 0 : 1
	};
}
function experimentScore(seats) {
	const recs = seats.map((s) => s.judgment.recommendation);
	const majority = majorityRec(recs);
	const unique = new Set(recs).size;
	const wastedPrivilege = seats.reduce((n, s) => n + s.cost.wastedPrivilege, 0);
	return {
		majority,
		unique,
		wastedPrivilege,
		dissenters: seats.reduce((n, s) => n + s.cost.dissent, 0),
		costly: unique >= 2 && wastedPrivilege > 0
	};
}
//#endregion
export { evaluateValues as a, cost_DaOfXXAw_exports as i, authorizeEffect as n, experimentScore as o, conflictCost as r, majorityRec as s, LAW_ROOT as t };
