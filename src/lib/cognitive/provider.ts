import { judgeLibrary, type JevDeps } from "../jev/client.ts";
import type { JevAttempt, JudgeInput } from "../jev/types.ts";

/**
 * Production code depends on this contract, not on Jev call sites.
 * CALDEC is not an implementation here. Do not train it on Jev output.
 */
export interface SemanticDecisionProvider {
  readonly id: string;
  judge(input: JudgeInput): Promise<JevAttempt>;
}

export function typeSafeJevProvider(deps: JevDeps): SemanticDecisionProvider {
  return {
    id: "typesafe-jev",
    judge(input) {
      return judgeLibrary(input, deps);
    },
  };
}

/**
 * Offline comparison only. Lexical overlap is not a semantic model and is not
 * on the Library page. It exists so a later study can share the same contract.
 */
export function deterministicBaselineProvider(): SemanticDecisionProvider {
  return {
    id: "deterministic-baseline",
    async judge(input) {
      const q = new Set(input.query.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
      let hits = 0;
      let seen = 0;
      for (const p of input.passages) {
        for (const w of p.passage.toLowerCase().split(/\W+/)) {
          if (w.length <= 3) continue;
          seen += 1;
          if (q.has(w)) hits += 1;
        }
      }
      const overlap = seen ? hits / seen : 0;
      return {
        attemptId: "baseline_local",
        traceId: "trace_baseline",
        model: "deterministic-baseline",
        questionHash: "0".repeat(64),
        questionHashes: [],
        inputHash: "0".repeat(64),
        outcome: "success",
        terminal: "ACCEPTED_RESPONSE",
        httpStatus: null,
        latencyMs: 0,
        retryCount: 0,
        requestId: null,
        judgments: [
          {
            id: "supports",
            primitive: "noul",
            confidence: null,
            probabilities: { yes: overlap > 0.2 ? 0.8 : 0.2, no: overlap > 0.2 ? 0.2 : 0.8 },
            label: overlap > 0.2 ? "yes" : "no",
          },
          {
            id: "insufficient",
            primitive: "noul",
            confidence: null,
            probabilities: { yes: 0.6, no: 0.4 },
            label: "yes",
          },
        ],
        note: "Deterministic baseline. Not Jev. Not authority.",
      };
    },
  };
}
