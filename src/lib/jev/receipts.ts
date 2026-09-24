import { sha256Text } from "../kernel/crypto.ts";
import type { JevAttempt, JudgeInput } from "./types.ts";

export async function hashInput(input: JudgeInput): Promise<string> {
  const body = JSON.stringify({
    query: input.query,
    passages: input.passages.map((p) => ({
      recordId: p.recordId,
      claimId: p.claimId,
      hash: p.hash,
      passage: p.passage,
    })),
  });
  return sha256Text(body);
}

export async function hashQuestions(questions: unknown): Promise<string> {
  return sha256Text(JSON.stringify(questions));
}

export async function hashEachQuestion(questions: Record<string, unknown>): Promise<string[]> {
  const out: string[] = [];
  for (const key of Object.keys(questions).sort()) {
    out.push(await sha256Text(JSON.stringify({ id: key, question: questions[key] })));
  }
  return out;
}

export function attemptId(inputHash: string, at: number): string {
  return `jev_${at.toString(36)}_${inputHash.slice(0, 12)}`;
}

export function traceId(inputHash: string, at: number): string {
  return `tr_${inputHash.slice(0, 16)}_${at.toString(36)}`;
}

/** Persisted receipt. Hashes only. No passage text, no key. */
export function publicReceipt(attempt: JevAttempt) {
  return {
    kind: "JEV_JUDGMENT_RECEIPT" as const,
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
    authority: false as const,
    confidenceIsCorrectness: false as const,
  };
}
