import { attemptId, hashEachQuestion, hashInput, hashQuestions, traceId } from "./receipts.ts";
import { JUDGMENT_ORDER, libraryQuestions } from "./questions.ts";
import {
  JEV_ENDPOINT,
  JEV_MODEL_ALIAS,
  type AttemptOutcome,
  type JevAttempt,
  type JudgeInput,
  type JudgmentId,
  type JudgmentView,
  type ProbabilityMap,
  type TerminalOutcome,
} from "./types.ts";

export interface JevDeps {
  apiKey: string | undefined;
  fetch: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
  /** Bounded. Docs say back off on 429 and 529. Default 2 extra tries. */
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
}

interface RawAnswer {
  type?: string;
  choice?: string;
  noul?: number;
  score?: number;
  confidence?: number;
  probabilities?: Record<string, number>;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function asMap(raw: RawAnswer): ProbabilityMap {
  if (raw.type === "noul" && typeof raw.noul === "number") {
    const yes = clamp01(raw.noul);
    return { yes, no: round4(1 - yes) };
  }
  const probs = raw.probabilities ?? {};
  const out: ProbabilityMap = {};
  for (const [k, v] of Object.entries(probs)) {
    if (typeof v === "number") out[k] = clamp01(v);
  }
  return out;
}

export function interpretAnswers(answers: Record<string, RawAnswer> | undefined): JudgmentView[] {
  const views: JudgmentView[] = [];
  for (const id of JUDGMENT_ORDER) {
    const raw = answers?.[id];
    if (!raw || typeof raw !== "object") continue;
    const probabilities = asMap(raw);
    if (Object.keys(probabilities).length === 0) continue;
    const primitive = raw.type === "choice" || raw.type === "score" || raw.type === "noul" ? raw.type : "noul";
    let label = "unparsed";
    if (primitive === "choice" && raw.choice) label = raw.choice;
    else if (primitive === "noul") label = (raw.noul ?? probabilities.yes ?? 0) >= 0.5 ? "yes" : "no";
    else if (primitive === "score" && typeof raw.score === "number") label = String(raw.score);
    views.push({
      id,
      primitive,
      confidence: typeof raw.confidence === "number" ? clamp01(raw.confidence) : null,
      probabilities,
      label,
    });
  }
  return views;
}

function coarse(terminal: TerminalOutcome): AttemptOutcome {
  if (terminal === "ACCEPTED_RESPONSE") return "success";
  if (terminal === "NO_KEY") return "no_key";
  if (terminal === "REJECTED_RESPONSE" || terminal === "AUTH_FAILURE") return "rejected";
  return "service_failure";
}

function terminalForStatus(status: number): TerminalOutcome {
  if (status === 401 || status === 403) return "AUTH_FAILURE";
  if (status === 400 || status === 422) return "REJECTED_RESPONSE";
  if (status === 429) return "RATE_LIMITED";
  if (status === 529) return "OVERLOADED";
  if (status >= 500) return "NETWORK_FAILURE";
  return "REJECTED_RESPONSE";
}

function noteFor(terminal: TerminalOutcome, status: number | null): string {
  if (terminal === "NO_KEY") return "No server key. Judgment was not invented.";
  if (terminal === "RATE_LIMITED") return "TypeSafe returned 429. No judgment was substituted.";
  if (terminal === "OVERLOADED") return "TypeSafe returned 529. No judgment was substituted.";
  if (terminal === "TIMEOUT") return "TypeSafe timed out. No judgment was substituted.";
  if (terminal === "AUTH_FAILURE") return "TypeSafe refused the key. No judgment was substituted.";
  if (terminal === "NETWORK_FAILURE") return "TypeSafe call failed. No judgment was substituted.";
  if (terminal === "INVALID_RESPONSE") return "Response had no usable answers.";
  if (terminal === "CANCELLED") return "The judgment was cancelled. No judgment was substituted.";
  if (terminal === "ACCEPTED_RESPONSE") {
    return "Confidence is how peaked the distribution is. It is not the probability the judgment is correct, and it is not permission to publish.";
  }
  return `TypeSafe rejected or failed the call${status ? ` (${status})` : ""}.`;
}

function requestIdOf(res: Response): string | null {
  return (
    res.headers.get("x-request-id") ||
    res.headers.get("request-id") ||
    res.headers.get("x-typesafe-request-id") ||
    null
  );
}

function backoff(tryIndex: number): number {
  return Math.min(2000, 200 * 2 ** Math.max(0, tryIndex - 1));
}

async function defaultSleep(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function judgeLibrary(input: JudgeInput, deps: JevDeps): Promise<JevAttempt> {
  const now = deps.now ?? Date.now;
  const started = now();
  const questions = libraryQuestions();
  const [inputHash, questionHash, questionHashes] = await Promise.all([
    hashInput(input),
    hashQuestions(questions),
    hashEachQuestion(questions),
  ]);
  const id = attemptId(inputHash, started);
  const trace = traceId(inputHash, started);
  const maxRetries = deps.maxRetries ?? 2;
  const sleep = deps.sleep ?? defaultSleep;

  const finish = (
    terminal: TerminalOutcome,
    extra: Partial<Pick<JevAttempt, "model" | "httpStatus" | "retryCount" | "requestId" | "judgments">> & {
      latencyMs?: number;
    } = {},
  ): JevAttempt => ({
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
    note: noteFor(terminal, extra.httpStatus ?? null),
  });

  if (!deps.apiKey) return finish("NO_KEY");

  const state = {
    query: input.query.slice(0, 500),
    passages: input.passages.slice(0, 6).map((p) => ({
      id: p.claimId || p.recordId,
      title: p.title.slice(0, 180),
      hash: p.hash.slice(0, 16),
      text: p.passage.slice(0, 700),
    })),
  };

  const timeoutMs = deps.timeoutMs ?? 12000;
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
          authorization: `Bearer ${deps.apiKey}`,
        },
        body: JSON.stringify({
          state,
          model: JEV_MODEL_ALIAS,
          questions,
        }),
        signal: controller.signal,
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
        return finish(terminal, { httpStatus: res.status, latencyMs, retryCount: retries, requestId: reqId });
      }
      let body: { model?: string; answers?: Record<string, RawAnswer> };
      try {
        body = (await res.json()) as { model?: string; answers?: Record<string, RawAnswer> };
      } catch {
        return finish("INVALID_RESPONSE", { httpStatus: res.status, latencyMs, retryCount: retries, requestId: reqId });
      }
      const judgments = interpretAnswers(body.answers);
      if (judgments.length === 0) {
        return finish("INVALID_RESPONSE", {
          model: body.model || JEV_MODEL_ALIAS,
          httpStatus: res.status,
          latencyMs,
          retryCount: retries,
          requestId: reqId,
        });
      }
      return finish("ACCEPTED_RESPONSE", {
        model: body.model || JEV_MODEL_ALIAS,
        httpStatus: res.status,
        latencyMs,
        retryCount: retries,
        requestId: reqId,
        judgments,
      });
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      const terminal: TerminalOutcome = aborted ? (timedOut ? "TIMEOUT" : "CANCELLED") : "NETWORK_FAILURE";
      return finish(terminal, { retryCount: retries });
    } finally {
      clearTimeout(timer);
    }
  }
}
