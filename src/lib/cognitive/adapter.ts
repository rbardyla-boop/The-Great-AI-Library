import type { JevAttempt } from "../jev/types.ts";
import { decide, type PolicyResult } from "./policy.ts";
import type { PolicyInput } from "./types.ts";

/** Jev attempt → inert CIP packet. Does not write evidence. */
export function packetFromAttempt(
  attempt: JevAttempt,
  ctx: {
    sourceHashes: string[];
    recordIds: string[];
    liveHashes: string[];
    createdAt?: string;
    engine?: PolicyInput["engine"];
  },
): PolicyResult {
  const input: PolicyInput = {
    outcome: attempt.outcome,
    terminal: attempt.terminal,
    model: attempt.model,
    attemptId: attempt.attemptId,
    traceId: attempt.traceId,
    inputHash: attempt.inputHash,
    questionHashes: attempt.questionHashes,
    createdAt: ctx.createdAt ?? new Date().toISOString(),
    sourceHashes: ctx.sourceHashes,
    recordIds: ctx.recordIds,
    liveHashes: ctx.liveHashes,
    judgments: attempt.judgments.map((j) => ({
      id: j.id,
      confidence: j.confidence,
      probabilities: j.probabilities,
      label: j.label,
    })),
    engine: ctx.engine ?? (attempt.terminal === "NO_KEY" ? "none" : "typesafe_jev"),
  };
  return decide(input);
}
