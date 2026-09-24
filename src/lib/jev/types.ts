/** Semantic judgments only. None of these grant authority. */

export const JEV_MODEL_ALIAS = "jev-latest";
export const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";

export type JudgmentId = "supports" | "contradicts" | "insufficient" | "relevance" | "duplicate";

/** Coarse outcome kept so earlier receipts stay readable. */
export type AttemptOutcome = "success" | "rejected" | "service_failure" | "no_key";

export type TerminalOutcome =
  | "ACCEPTED_RESPONSE"
  | "REJECTED_RESPONSE"
  | "RATE_LIMITED"
  | "OVERLOADED"
  | "TIMEOUT"
  | "AUTH_FAILURE"
  | "NETWORK_FAILURE"
  | "INVALID_RESPONSE"
  | "CANCELLED"
  | "NO_KEY"
  | "NOT_RECORDED";

export interface BoundedPassage {
  recordId: string;
  claimId: string;
  title: string;
  hash: string;
  passage: string;
}

export interface JudgeInput {
  query: string;
  passages: BoundedPassage[];
}

export interface ProbabilityMap {
  [key: string]: number;
}

export interface JudgmentView {
  id: JudgmentId;
  primitive: "choice" | "noul" | "score";
  /** Distribution concentration. Not the probability that the judgment is correct. */
  confidence: number | null;
  probabilities: ProbabilityMap;
  label: string;
}

export interface JevAttempt {
  attemptId: string;
  traceId: string;
  model: string;
  questionHash: string;
  questionHashes: string[];
  inputHash: string;
  outcome: AttemptOutcome;
  terminal: TerminalOutcome;
  httpStatus: number | null;
  latencyMs: number;
  retryCount: number;
  requestId: string | null;
  judgments: JudgmentView[];
  note: string;
}
