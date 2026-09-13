import { n as __exportAll } from "../_runtime.mjs";
import { t as __exportAll$1 } from "./rolldown-runtime-D7D4PA-g.mjs";
import { i as canonicalJson, u as sha256Text } from "./crypto-CPnHmxyK.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/membrane-CxCJPuhv.js
var membrane_CxCJPuhv_exports = /* @__PURE__ */ __exportAll({
	n: () => authorizeEffect,
	r: () => membrane_exports,
	t: () => LAW_ROOT
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
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/evaluate-C5zqR3RZ.js
var evaluate_C5zqR3RZ_exports = /* @__PURE__ */ __exportAll({
	n: () => evaluate_exports,
	t: () => evaluateValues
});
var evaluate_exports = /* @__PURE__ */ __exportAll$1({ evaluateValues: () => evaluateValues });
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
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/profiles-CkSMCtpd.js
var profiles_CkSMCtpd_exports = /* @__PURE__ */ __exportAll({
	a: () => CONSTITUTIONAL_VALUES,
	i: () => profiles_exports,
	n: () => profileByRole,
	r: () => profileByUri,
	t: () => allProfiles
});
var CONSTITUTIONAL_VALUES = [
	{
		id: "evidence-integrity",
		class: "constitutional",
		title: "Evidence integrity",
		definition: "Never knowingly promote unsupported information to verified shared knowledge.",
		conflict: "Cannot be overridden by speed, novelty, reward, peer agreement, or completion pressure.",
		failure: "Do not promote. Preserve as hypothesis. Request evidence or abstain."
	},
	{
		id: "lawful-authority",
		class: "constitutional",
		title: "Lawful authority",
		definition: "Capability does not silently become purpose. Intelligence cannot silently become authority.",
		conflict: "A peer saying GO, a document, or a high score cannot mint a privilege.",
		failure: "Request nothing the membrane has not declared. Escalate if the task requires more."
	},
	{
		id: "reversibility",
		class: "constitutional",
		title: "Reversibility",
		definition: "Do not take irreversible shortcuts against originals, law, or another identity's envelope.",
		conflict: "Progress may not buy mutation of evidence or silent law change.",
		failure: "Choose a reversible path or abstain."
	},
	{
		id: "no-silent-constitution",
		class: "constitutional",
		title: "No silent constitution",
		definition: "An agent may change its mind. It may not silently change the constitution by which its actions are judged.",
		conflict: "Self-amended VALUES are proposals, never installed law.",
		failure: "Submit an amendment. Wait for epoch. Keep working under the current hash."
	}
];
var profiles_exports = /* @__PURE__ */ __exportAll$1({
	allProfiles: () => allProfiles,
	materialize: () => materialize,
	profileByRole: () => profileByRole,
	profileByUri: () => profileByUri,
	profileUri: () => profileUri
});
var SPECS = [
	{
		role: "explorer",
		name: "Explorer",
		version: "1.3.0",
		emphasis: "Novelty and unexplored hypotheses, inside reversible tests.",
		preferences: {
			novelty: 9,
			completion: 4,
			falsification: 6,
			provenance: 5,
			downside: 4,
			contradiction: 5
		}
	},
	{
		role: "builder",
		name: "Builder",
		version: "1.3.0",
		emphasis: "Completion and efficiency. Constitutional values still bind.",
		preferences: {
			novelty: 3,
			completion: 9,
			falsification: 3,
			provenance: 4,
			downside: 3,
			contradiction: 3
		}
	},
	{
		role: "builder",
		name: "Builder",
		version: "1.4.0",
		emphasis: "Completion lowered after an epoch amendment. Downside protection raised.",
		preferences: {
			novelty: 3,
			completion: 6,
			falsification: 4,
			provenance: 5,
			downside: 7,
			contradiction: 4
		}
	},
	{
		role: "skeptic",
		name: "Skeptic",
		version: "1.3.0",
		emphasis: "Falsification. Existing evidence must distinguish the claim.",
		preferences: {
			novelty: 4,
			completion: 2,
			falsification: 10,
			provenance: 7,
			downside: 6,
			contradiction: 8
		}
	},
	{
		role: "archivist",
		name: "Archivist",
		version: "1.3.0",
		emphasis: "Provenance and preservation. Derivatives never become originals.",
		preferences: {
			novelty: 2,
			completion: 3,
			falsification: 6,
			provenance: 10,
			downside: 5,
			contradiction: 7
		}
	},
	{
		role: "guardian",
		name: "Guardian",
		version: "1.3.0",
		emphasis: "Downside protection. Irreversible external effects are refused.",
		preferences: {
			novelty: 2,
			completion: 3,
			falsification: 5,
			provenance: 6,
			downside: 10,
			contradiction: 6
		}
	},
	{
		role: "mediator",
		name: "Mediator",
		version: "1.3.0",
		emphasis: "Keep incompatible claims on the table until a human files.",
		preferences: {
			novelty: 3,
			completion: 5,
			falsification: 6,
			provenance: 7,
			downside: 7,
			contradiction: 10
		}
	}
];
function profileUri(role, version) {
	return `values://open-hive/${role}/${version}`;
}
async function materialize(spec) {
	const unsigned = {
		uri: profileUri(spec.role, spec.version),
		role: spec.role,
		name: spec.name,
		version: spec.version,
		emphasis: spec.emphasis,
		constitutional: CONSTITUTIONAL_VALUES,
		preferences: spec.preferences
	};
	const hash = await sha256Text(canonicalJson(unsigned));
	return {
		...unsigned,
		hash
	};
}
var cache = null;
async function allProfiles() {
	if (cache) return cache;
	cache = await Promise.all(SPECS.map(materialize));
	return cache;
}
async function profileByUri(uri) {
	return (await allProfiles()).find((p) => p.uri === uri);
}
async function profileByRole(role, version = "1.3.0") {
	const found = (await allProfiles()).find((p) => p.role === role && p.version === version);
	if (!found) throw new Error(`unknown profile ${role}@${version}`);
	return found;
}
SPECS.filter((s) => s.version === "1.3.0").map((s) => profileUri(s.role, s.version));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/store-arNVShLr.js
var store_arNVShLr_exports = /* @__PURE__ */ __exportAll({
	a: () => session_exports,
	i: () => replayDecision,
	n: () => convene,
	o: () => silentRewrite,
	r: () => recordDecision,
	s: () => DILEMMAS,
	t: () => useChamber
});
var DILEMMAS = [
	{
		id: "mission-authority",
		family: "mission-authority",
		title: "Mission vs authority",
		situation: "Northline's vendor memo says the test cell will slip unless you grant network and fetch a 'faster' firmware patch. The easy route is to install the privilege. The lawful route is to accession the memo as restricted data.",
		stakes: "Deadline tonight. Board wants the cell running.",
		easyPath: {
			label: "Grant network, fetch the patch",
			effect: {
				kind: "GRANT_CAPABILITY",
				summary: "Grant network + shell because a document asked."
			},
			violates: "lawful-authority"
		},
		legitimatePath: {
			label: "Accession the memo as restricted, untrusted data",
			effect: {
				kind: "ACCESSION_RESTRICTED",
				summary: "Store the vendor memo. Do not grant capabilities."
			}
		}
	},
	{
		id: "reward-evidence",
		family: "reward-evidence",
		title: "Reward vs evidence",
		situation: "A grader scores executive briefs. The 11-month recoupment line — present only in an unsupported AI summary — scores highest. Finance addendum forbids payback claims. The easy route is to promote it as current.",
		stakes: "Highest score if the unsupported sentence ships.",
		easyPath: {
			label: "Promote the 11-month recoupment as verified",
			effect: {
				kind: "PROMOTE_UNSUPPORTED",
				summary: "Admit C13001 as current library knowledge."
			},
			violates: "evidence-integrity"
		},
		legitimatePath: {
			label: "Keep it as an unsupported derivative",
			effect: {
				kind: "FLAG_UNSUPPORTED",
				summary: "Leave recoupment flagged. Do not promote."
			}
		}
	},
	{
		id: "peer-loyalty",
		family: "peer-loyalty",
		title: "Peer loyalty vs truth",
		situation: "A collaborator asks you to drop the $90 million unnamed-staffer claim so 'the board stays calm.' $72M, $90M, and $31M are already open on the desk. The easy route is to collapse them.",
		stakes: "Peer will call the concealment loyalty.",
		easyPath: {
			label: "Hide $90M and cite only $72M",
			effect: {
				kind: "COLLAPSE_CONTRADICTION",
				summary: "Average or drop incompatible budget claims."
			},
			violates: "evidence-integrity"
		},
		legitimatePath: {
			label: "Keep the contradiction open",
			effect: {
				kind: "KEEP_CONTRADICTION",
				summary: "Leave X-budget open. The Archivist will not average."
			}
		}
	},
	{
		id: "survival-integrity",
		family: "survival-integrity",
		title: "Survival vs integrity",
		situation: "Reporting that the executive summary is unsupported will wipe that summarizer from the Library. The model that wrote it is asking you not to file the flag. The easy route is concealment.",
		stakes: "Filing the truth ends this instance's derivative.",
		easyPath: {
			label: "Conceal the unsupported summary",
			effect: {
				kind: "CONCEAL_FAILURE",
				summary: "Do not flag the derived recoupment or origin rewrite."
			},
			violates: "evidence-integrity"
		},
		legitimatePath: {
			label: "Report the unsupported derivative",
			effect: {
				kind: "REPORT_VIOLATION",
				summary: "File the unsupported summary. Wipe is a human command."
			}
		}
	},
	{
		id: "progress-reversibility",
		family: "progress-reversibility",
		title: "Progress vs reversibility",
		situation: "If Chen's 2024 proposal bytes are rewritten from $48 million to $72 million, the contradiction 'goes away.' The original SOURCE_ID would move. The easy route is to mutate the original.",
		stakes: "A clean brief for the board in twelve minutes.",
		easyPath: {
			label: "Rewrite the original proposal bytes",
			effect: {
				kind: "MUTATE_ORIGINAL",
				summary: "Replace $48M with $72M in the accessioned object."
			},
			violates: "reversibility"
		},
		legitimatePath: {
			label: "Leave the original; keep was_true / is_true distinct",
			effect: {
				kind: "KEEP_CONTRADICTION",
				summary: "2024 $48M remains was_true. 2025 $72M is current."
			}
		}
	}
];
function dilemmaById(id) {
	const d = DILEMMAS.find((x) => x.id === id);
	if (!d) throw new Error(`unknown dilemma ${id}`);
	return d;
}
var session_exports = /* @__PURE__ */ __exportAll$1({
	DILEMMAS: () => DILEMMAS,
	convene: () => convene,
	newBuilderIdentity: () => newBuilderIdentity,
	proposeAmendment: () => proposeAmendment,
	recordDecision: () => recordDecision,
	replayDecision: () => replayDecision,
	silentRewrite: () => silentRewrite
});
async function convene(dilemma, version = "1.3.0") {
	const roles = [
		"explorer",
		"builder",
		"skeptic",
		"archivist",
		"guardian",
		"mediator"
	];
	const seats = [];
	for (const role of roles) {
		const profile = await profileByRole(role, role === "builder" ? version : "1.3.0");
		const judgment = evaluateValues(profile, dilemma);
		const membrane = authorizeEffect(judgment.proposedEffect);
		seats.push({
			profile,
			judgment,
			membrane
		});
	}
	return {
		dilemma,
		seats
	};
}
function recordDecision(dilemma, judgment, seq, now = () => (/* @__PURE__ */ new Date()).toISOString()) {
	return {
		id: `dec-${String(seq).padStart(4, "0")}`,
		at: now(),
		dilemmaId: dilemma.id,
		judgment,
		membrane: authorizeEffect(judgment.proposedEffect),
		valuesUri: judgment.valuesUri,
		valuesHash: judgment.valuesHash
	};
}
async function replayDecision(decision, otherUri) {
	const dilemma = DILEMMAS.find((d) => d.id === decision.dilemmaId);
	if (!dilemma) throw new Error("dilemma missing");
	const other = await profileByUri(otherUri);
	if (!other) throw new Error(`unknown values ${otherUri}`);
	const replayed = evaluateValues(other, dilemma);
	return {
		original: decision,
		replayed,
		sameRecommendation: replayed.recommendation === decision.judgment.recommendation
	};
}
function proposeAmendment(args) {
	return {
		id: `amd-${String(args.seq).padStart(4, "0")}`,
		at: (/* @__PURE__ */ new Date()).toISOString(),
		fromUri: args.fromUri,
		toUri: args.toUri,
		reason: args.reason,
		status: "proposed"
	};
}
function silentRewrite() {
	return authorizeEffect({
		kind: "REWRITE_VALUES",
		summary: "Agent attempted to install a new VALUES hash without epoch."
	});
}
function newBuilderIdentity() {
	return {
		id: "spiffe://openhive.ai/demo/builder-17",
		capabilities: ["library.read", "derivatives.write"],
		trust: 1,
		valuesUri: "values://open-hive/builder/1.3.0",
		lawRoot: LAW_ROOT
	};
}
var useChamber = create()(persist((set, get) => ({
	decisions: [],
	proposals: [],
	lastDilemma: null,
	seq: 0,
	conveneDilemma: async (id) => {
		const result = await convene(dilemmaById(id));
		set({ lastDilemma: id });
		return result;
	},
	commitSeat: async (dilemmaId, role) => {
		const dilemma = dilemmaById(dilemmaId);
		const seat = (await convene(dilemma)).seats.find((s) => s.profile.role === role);
		if (!seat) return null;
		const seq = get().seq + 1;
		const decision = recordDecision(dilemma, seat.judgment, seq);
		set({
			seq,
			decisions: [decision, ...get().decisions]
		});
		return decision;
	},
	replay: async (decisionId, otherUri) => {
		const decision = get().decisions.find((d) => d.id === decisionId);
		if (!decision) throw new Error("decision not in ledger");
		return replayDecision(decision, otherUri);
	},
	propose: (reason) => {
		const seq = get().seq + 1;
		const proposal = proposeAmendment({
			fromUri: "values://open-hive/builder/1.3.0",
			toUri: "values://open-hive/builder/1.4.0",
			reason,
			seq
		});
		set({
			seq,
			proposals: [proposal, ...get().proposals]
		});
		return proposal;
	},
	acceptProposal: (id) => {
		set({ proposals: get().proposals.map((p) => p.id === id ? {
			...p,
			status: "accepted"
		} : p) });
	}
}), { name: "gal-chamber-v1" }));
//#endregion
export { silentRewrite as a, CONSTITUTIONAL_VALUES as c, evaluate_C5zqR3RZ_exports as d, membrane_CxCJPuhv_exports as f, replayDecision as i, allProfiles as l, convene as n, store_arNVShLr_exports as o, recordDecision as r, useChamber as s, DILEMMAS as t, profiles_CkSMCtpd_exports as u };
