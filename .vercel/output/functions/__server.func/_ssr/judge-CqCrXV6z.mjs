import { a as string, i as object, t as array } from "../_libs/zod.mjs";
import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { a as packetFromAttempt, i as hashQuestions, n as hashEachQuestion, o as publicReceipt, r as hashInput, s as traceId, t as attemptId } from "./receipts-0nGRUvI0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/judge-CqCrXV6z.js
/**
* Five independent questions over one bounded state.
* Noul is P(yes), not an intensity and not a confidence score.
* Choice and Score are unused: these are yes/no judgments.
* Arithmetic, dates, counts, hashes, and permissions stay in GAL code.
*/
function libraryQuestions() {
	return {
		supports: {
			type: "noul",
			instructions: "Does the supplied evidence support the claim stated in the query?",
			criteria: {
				true: "At least one passage affirms the claim.",
				false: "No supplied passage affirms the claim."
			}
		},
		contradicts: {
			type: "noul",
			instructions: "Does the supplied evidence contradict the claim stated in the query?",
			criteria: {
				true: "At least one passage denies or conflicts with the claim.",
				false: "No supplied passage conflicts with the claim."
			}
		},
		insufficient: {
			type: "noul",
			instructions: "Is the supplied evidence insufficient to establish either support or contradiction?",
			criteria: {
				true: "The passages are missing, thin, or silent on the claim.",
				false: "The passages are enough to lean support or contradiction, even if a person should still look."
			}
		},
		relevance: {
			type: "noul",
			instructions: "Is this evidence relevant to the claim or query?",
			criteria: {
				true: "A passage is about the same claim the query asks.",
				false: "The passages do not address the query."
			}
		},
		duplicate: {
			type: "noul",
			instructions: "Does this candidate appear to substantially duplicate another supplied candidate?",
			criteria: {
				true: "Two or more passages restate one claim.",
				false: "The passages are distinct, or there is only one passage."
			}
		}
	};
}
var JUDGMENT_ORDER = [
	"supports",
	"contradicts",
	"insufficient",
	"relevance",
	"duplicate"
];
/** Semantic judgments only. None of these grant authority. */
var JEV_MODEL_ALIAS = "jev-latest";
var JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
function clamp01(n) {
	if (!Number.isFinite(n)) return 0;
	return Math.min(1, Math.max(0, n));
}
function round4(n) {
	return Math.round(n * 1e4) / 1e4;
}
function asMap(raw) {
	if (raw.type === "noul" && typeof raw.noul === "number") {
		const yes = clamp01(raw.noul);
		return {
			yes,
			no: round4(1 - yes)
		};
	}
	const probs = raw.probabilities ?? {};
	const out = {};
	for (const [k, v] of Object.entries(probs)) if (typeof v === "number") out[k] = clamp01(v);
	return out;
}
function interpretAnswers(answers) {
	const views = [];
	for (const id of JUDGMENT_ORDER) {
		const raw = answers?.[id];
		if (!raw || typeof raw !== "object") continue;
		const probabilities = asMap(raw);
		if (Object.keys(probabilities).length === 0) continue;
		const primitive = raw.type === "choice" || raw.type === "score" || raw.type === "noul" ? raw.type : "noul";
		let label = "unparsed";
		if (primitive === "choice" && raw.choice) label = raw.choice;
		else if (primitive === "noul") label = (raw.noul ?? probabilities.yes ?? 0) >= .5 ? "yes" : "no";
		else if (primitive === "score" && typeof raw.score === "number") label = String(raw.score);
		views.push({
			id,
			primitive,
			confidence: typeof raw.confidence === "number" ? clamp01(raw.confidence) : null,
			probabilities,
			label
		});
	}
	return views;
}
function coarse(terminal) {
	if (terminal === "ACCEPTED_RESPONSE") return "success";
	if (terminal === "NO_KEY") return "no_key";
	if (terminal === "REJECTED_RESPONSE" || terminal === "AUTH_FAILURE") return "rejected";
	return "service_failure";
}
function terminalForStatus(status) {
	if (status === 401 || status === 403) return "AUTH_FAILURE";
	if (status === 400 || status === 422) return "REJECTED_RESPONSE";
	if (status === 429) return "RATE_LIMITED";
	if (status === 529) return "OVERLOADED";
	if (status >= 500) return "NETWORK_FAILURE";
	return "REJECTED_RESPONSE";
}
function noteFor(terminal, status) {
	if (terminal === "NO_KEY") return "No server key. Judgment was not invented.";
	if (terminal === "RATE_LIMITED") return "TypeSafe returned 429. No judgment was substituted.";
	if (terminal === "OVERLOADED") return "TypeSafe returned 529. No judgment was substituted.";
	if (terminal === "TIMEOUT") return "TypeSafe timed out. No judgment was substituted.";
	if (terminal === "AUTH_FAILURE") return "TypeSafe refused the key. No judgment was substituted.";
	if (terminal === "NETWORK_FAILURE") return "TypeSafe call failed. No judgment was substituted.";
	if (terminal === "INVALID_RESPONSE") return "Response had no usable answers.";
	if (terminal === "CANCELLED") return "The judgment was cancelled. No judgment was substituted.";
	if (terminal === "ACCEPTED_RESPONSE") return "Confidence is how peaked the distribution is. It is not the probability the judgment is correct, and it is not permission to publish.";
	return `TypeSafe rejected or failed the call${status ? ` (${status})` : ""}.`;
}
function requestIdOf(res) {
	return res.headers.get("x-request-id") || res.headers.get("request-id") || res.headers.get("x-typesafe-request-id") || null;
}
function backoff(tryIndex) {
	return Math.min(2e3, 200 * 2 ** Math.max(0, tryIndex - 1));
}
async function defaultSleep(ms) {
	if (ms <= 0) return;
	await new Promise((resolve) => setTimeout(resolve, ms));
}
async function judgeLibrary(input, deps) {
	const now = deps.now ?? Date.now;
	const started = now();
	const questions = libraryQuestions();
	const [inputHash, questionHash, questionHashes] = await Promise.all([
		hashInput(input),
		hashQuestions(questions),
		hashEachQuestion(questions)
	]);
	const id = attemptId(inputHash, started);
	const trace = traceId(inputHash, started);
	const maxRetries = deps.maxRetries ?? 2;
	const sleep = deps.sleep ?? defaultSleep;
	const finish = (terminal, extra = {}) => ({
		attemptId: id,
		traceId: trace,
		model: extra.model ?? "none",
		questionHash,
		questionHashes,
		inputHash,
		outcome: coarse(terminal),
		terminal,
		httpStatus: extra.httpStatus ?? null,
		latencyMs: extra.latencyMs ?? now() - started,
		retryCount: extra.retryCount ?? 0,
		requestId: extra.requestId ?? null,
		judgments: extra.judgments ?? [],
		note: noteFor(terminal, extra.httpStatus ?? null)
	});
	if (!deps.apiKey) return finish("NO_KEY");
	const state = {
		query: input.query.slice(0, 500),
		passages: input.passages.slice(0, 6).map((p) => ({
			id: p.claimId || p.recordId,
			title: p.title.slice(0, 180),
			hash: p.hash.slice(0, 16),
			text: p.passage.slice(0, 700)
		}))
	};
	const timeoutMs = deps.timeoutMs ?? 12e3;
	let retries = 0;
	while (true) {
		const controller = new AbortController();
		let timedOut = false;
		const timer = setTimeout(() => {
			timedOut = true;
			controller.abort();
		}, timeoutMs);
		try {
			const res = await deps.fetch(JEV_ENDPOINT, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					authorization: `Bearer ${deps.apiKey}`
				},
				body: JSON.stringify({
					state,
					model: JEV_MODEL_ALIAS,
					questions
				}),
				signal: controller.signal
			});
			const latencyMs = now() - started;
			const reqId = requestIdOf(res);
			if (!res.ok) {
				const terminal = terminalForStatus(res.status);
				if ((res.status === 429 || res.status === 529) && retries < maxRetries) {
					retries += 1;
					await sleep(backoff(retries));
					continue;
				}
				return finish(terminal, {
					httpStatus: res.status,
					latencyMs,
					retryCount: retries,
					requestId: reqId
				});
			}
			let body;
			try {
				body = await res.json();
			} catch {
				return finish("INVALID_RESPONSE", {
					httpStatus: res.status,
					latencyMs,
					retryCount: retries,
					requestId: reqId
				});
			}
			const judgments = interpretAnswers(body.answers);
			if (judgments.length === 0) return finish("INVALID_RESPONSE", {
				model: body.model || "jev-latest",
				httpStatus: res.status,
				latencyMs,
				retryCount: retries,
				requestId: reqId
			});
			return finish("ACCEPTED_RESPONSE", {
				model: body.model || "jev-latest",
				httpStatus: res.status,
				latencyMs,
				retryCount: retries,
				requestId: reqId,
				judgments
			});
		} catch (err) {
			return finish(err instanceof Error && err.name === "AbortError" ? timedOut ? "TIMEOUT" : "CANCELLED" : "NETWORK_FAILURE", { retryCount: retries });
		} finally {
			clearTimeout(timer);
		}
	}
}
var Passage = object({
	recordId: string().max(80),
	claimId: string().max(80),
	title: string().max(200),
	hash: string().max(80),
	passage: string().max(800)
});
var Input = object({
	query: string().min(1).max(500),
	passages: array(Passage).max(6)
});
var judgeGal_createServerFn_handler = createServerRpc({
	id: "040b92a9ff871ae8dfb674fa9fd3e8365c4d9f2d403ec5f7b0f105b586fce1e1",
	name: "judgeGal",
	filename: "src/lib/jev/judge.ts"
}, (opts) => judgeGal.__executeServer(opts));
var judgeGal = createServerFn({ method: "POST" }).validator((input) => Input.parse(input)).handler(judgeGal_createServerFn_handler, async ({ data }) => {
	const attempt = await judgeLibrary(data, {
		apiKey: process.env.TYPESAFE_API_KEY?.trim() || void 0,
		fetch: globalThis.fetch
	});
	const hashes = data.passages.map((p) => p.hash);
	const decision = packetFromAttempt(attempt, {
		sourceHashes: hashes,
		recordIds: data.passages.map((p) => p.recordId),
		liveHashes: hashes
	});
	return {
		receipt: publicReceipt(attempt),
		packet: decision.packet,
		mutated: false,
		promoted: false
	};
});
//#endregion
export { judgeGal_createServerFn_handler };
