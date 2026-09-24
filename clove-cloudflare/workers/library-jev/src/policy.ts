/** Same cutoffs as the Reading Room gate. Not fitted to a live smoke set. */

export const THRESHOLDS = {
  supportYes: 0.72,
  contradictYes: 0.72,
  bothHigh: 0.45,
  insufficientYes: 0.5,
  relevanceYes: 0.4,
  duplicateYes: 0.72,
} as const;

const FORBIDDEN = [
  "direct_action",
  "memory_consolidation",
  "rule_revision",
  "safety_certification",
  "evidence_promotion",
  "source_mutation",
] as const;

export interface Judgment {
  id: string;
  confidence: number | null;
  probabilities: Record<string, number>;
}

export interface Decision {
  disposition:
    | "DISPLAY_ONLY"
    | "SUPPORT_CANDIDATE"
    | "CONTRADICTION_CANDIDATE"
    | "INSUFFICIENT_EVIDENCE"
    | "HUMAN_REVIEW"
    | "SERVICE_UNAVAILABLE";
  relation: "supported" | "contradicted" | "insufficient_evidence";
  license: "hypothesis_only" | "hazard_only" | "do_not_use_for_action";
  human_review: boolean;
  duplicate: boolean;
  allowed_use: string[];
  forbidden_use: string[];
  confidence: number | null;
  mutated: false;
  promoted: false;
}

function yesOf(rows: Judgment[], id: string): number | null {
  const row = rows.find((j) => j.id === id);
  if (!row) return null;
  if (typeof row.probabilities.yes === "number") return row.probabilities.yes;
  if (id === "relevance" && typeof row.probabilities.relevant === "number") return row.probabilities.relevant;
  return null;
}

export function decide(terminal: string, judgments: Judgment[]): Decision {
  const confidence = judgments.reduce<number | null>((max, row) => {
    if (typeof row.confidence !== "number") return max;
    return max === null ? row.confidence : Math.max(max, row.confidence);
  }, null);
  const forbidden = [...FORBIDDEN];
  const base = {
    confidence,
    forbidden_use: forbidden,
    mutated: false as const,
    promoted: false as const,
  };

  if (terminal !== "ACCEPTED_RESPONSE") {
    return {
      ...base,
      disposition: "SERVICE_UNAVAILABLE",
      relation: "insufficient_evidence",
      license: "do_not_use_for_action",
      human_review: false,
      duplicate: false,
      allowed_use: ["human_explanation", "retrieval"],
    };
  }

  const support = yesOf(judgments, "supports");
  const contradict = yesOf(judgments, "contradicts");
  const insufficient = yesOf(judgments, "insufficient");
  const relevant = yesOf(judgments, "relevance");
  const duplicate = yesOf(judgments, "duplicate");
  const dup = duplicate !== null && duplicate >= THRESHOLDS.duplicateYes;
  const both =
    support !== null &&
    contradict !== null &&
    support >= THRESHOLDS.bothHigh &&
    contradict >= THRESHOLDS.bothHigh;

  if (both) {
    return {
      ...base,
      disposition: "CONTRADICTION_CANDIDATE",
      relation: "contradicted",
      license: "hazard_only",
      human_review: true,
      duplicate: dup,
      allowed_use: ["human_explanation", "retrieval"],
    };
  }
  if (relevant !== null && relevant < THRESHOLDS.relevanceYes) {
    return {
      ...base,
      disposition: "DISPLAY_ONLY",
      relation: "insufficient_evidence",
      license: "do_not_use_for_action",
      human_review: dup,
      duplicate: dup,
      allowed_use: ["human_explanation", "retrieval"],
    };
  }
  if (insufficient !== null && insufficient >= THRESHOLDS.insufficientYes) {
    return {
      ...base,
      disposition: "INSUFFICIENT_EVIDENCE",
      relation: "insufficient_evidence",
      license: "hypothesis_only",
      human_review: true,
      duplicate: dup,
      allowed_use: ["human_explanation", "retrieval"],
    };
  }
  if (contradict !== null && contradict >= THRESHOLDS.contradictYes && (support === null || support < contradict)) {
    return {
      ...base,
      disposition: "CONTRADICTION_CANDIDATE",
      relation: "contradicted",
      license: "hazard_only",
      human_review: true,
      duplicate: dup,
      allowed_use: ["human_explanation", "retrieval"],
    };
  }
  if (support !== null && support >= THRESHOLDS.supportYes && (contradict === null || contradict < THRESHOLDS.bothHigh)) {
    return {
      ...base,
      disposition: "SUPPORT_CANDIDATE",
      relation: "supported",
      license: "hypothesis_only",
      human_review: dup,
      duplicate: dup,
      allowed_use: ["human_explanation", "retrieval", "contradiction_detection"],
    };
  }
  return {
    ...base,
    disposition: "HUMAN_REVIEW",
    relation: "insufficient_evidence",
    license: "do_not_use_for_action",
    human_review: true,
    duplicate: dup,
    allowed_use: ["human_explanation", "retrieval"],
  };
}
