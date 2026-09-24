import { assemblePacket } from "./envelope.ts";
import type {
  ClaimRelation,
  DecisionPacket,
  Disposition,
  EpistemicLicense,
  PolicyInput,
  UncertaintyType,
} from "./types.ts";

/**
 * Fixed thresholds. They are not fitted to the five live smoke cases.
 * Confidence is never an input. A peaked distribution does not raise the license.
 */
export const POLICY_THRESHOLDS = {
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
];

function yesOf(input: PolicyInput, id: string): number | null {
  const row = input.judgments.find((j) => j.id === id);
  if (!row) return null;
  if (typeof row.probabilities.yes === "number") return row.probabilities.yes;
  if (id === "relevance" && typeof row.probabilities.relevant === "number") return row.probabilities.relevant;
  return null;
}

function distributions(input: PolicyInput): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const j of input.judgments) out[j.id] = { ...j.probabilities };
  return out;
}

function flatProbabilities(input: PolicyInput): Record<string, number> {
  const out: Record<string, number> = {};
  for (const j of input.judgments) {
    for (const [k, v] of Object.entries(j.probabilities)) out[`${j.id}.${k}`] = v;
  }
  return out;
}

function maxConfidence(input: PolicyInput): number | null {
  const nums = input.judgments.map((j) => j.confidence).filter((n): n is number => typeof n === "number");
  if (!nums.length) return null;
  return Math.max(...nums);
}

export interface PolicyResult {
  packet: DecisionPacket;
  mutated: false;
  promoted: false;
  stale: boolean;
  provenanceMismatch: boolean;
}

interface Branch {
  contradictions?: string[];
  uncertainty?: UncertaintyType;
  human?: boolean;
  duplicate?: boolean;
}

function base(
  input: PolicyInput,
  disposition: Disposition,
  relation: ClaimRelation,
  license: EpistemicLicense,
  extra: Branch,
): PolicyResult {
  const human = extra.human ?? disposition === "HUMAN_REVIEW";
  const packet = assemblePacket(input, {
    epistemics: {
      confidence: maxConfidence(input),
      uncertainty_type: extra.uncertainty ?? (input.terminal === "ACCEPTED_RESPONSE" ? "derived" : "missing_judgment"),
      epistemic_license: license,
      contradictions: extra.contradictions ?? [],
    },
    permissions: {
      allowed_use:
        human || disposition === "HUMAN_REVIEW"
          ? ["human_explanation", "retrieval"]
          : ["human_explanation", "retrieval", "contradiction_detection"],
      forbidden_use: FORBIDDEN,
    },
    payload: {
      relation,
      disposition,
      probabilities: flatProbabilities(input),
      duplicate: Boolean(extra.duplicate),
      human_review: human || disposition === "HUMAN_REVIEW" || disposition === "CONTRADICTION_CANDIDATE",
      distributions: distributions(input),
    },
  });
  return { packet, mutated: false, promoted: false, stale: false, provenanceMismatch: false };
}

/** Deterministic gate. Jev output cannot raise this. */
export function decide(input: PolicyInput): PolicyResult {
  const live = new Set(input.liveHashes);
  const stale = input.sourceHashes.length > 0 && input.sourceHashes.some((h) => !live.has(h));
  const provenanceMismatch =
    input.terminal === "ACCEPTED_RESPONSE" &&
    (input.sourceHashes.length === 0 || input.recordIds.length === 0 || input.inputHash.length < 64);

  if (input.terminal !== "ACCEPTED_RESPONSE") {
    return base(input, "SERVICE_UNAVAILABLE", "insufficient_evidence", "do_not_use_for_action", {
      uncertainty: "missing_judgment",
      human: false,
    });
  }

  if (stale || provenanceMismatch) {
    const result = base(input, "HUMAN_REVIEW", "insufficient_evidence", "do_not_use_for_action", {
      uncertainty: stale ? "stale_source" : "provenance_mismatch",
      human: true,
      contradictions: stale ? ["source hash changed after the judgment"] : ["provenance incomplete"],
    });
    return { ...result, stale, provenanceMismatch };
  }

  const support = yesOf(input, "supports");
  const contradict = yesOf(input, "contradicts");
  const insufficient = yesOf(input, "insufficient");
  const relevant = yesOf(input, "relevance");
  const duplicate = yesOf(input, "duplicate");
  const dup = duplicate !== null && duplicate >= POLICY_THRESHOLDS.duplicateYes;
  const both =
    support !== null &&
    contradict !== null &&
    support >= POLICY_THRESHOLDS.bothHigh &&
    contradict >= POLICY_THRESHOLDS.bothHigh;

  if (both) {
    return base(input, "CONTRADICTION_CANDIDATE", "contradicted", "hazard_only", {
      contradictions: ["support and contradiction are both plausible"],
      human: true,
      duplicate: dup,
    });
  }

  if (relevant !== null && relevant < POLICY_THRESHOLDS.relevanceYes) {
    return base(input, "DISPLAY_ONLY", "insufficient_evidence", "do_not_use_for_action", {
      duplicate: dup,
      human: dup,
    });
  }

  if (insufficient !== null && insufficient >= POLICY_THRESHOLDS.insufficientYes) {
    return base(input, "INSUFFICIENT_EVIDENCE", "insufficient_evidence", "hypothesis_only", {
      human: true,
      duplicate: dup,
    });
  }

  if (
    contradict !== null &&
    contradict >= POLICY_THRESHOLDS.contradictYes &&
    (support === null || support < contradict)
  ) {
    return base(input, "CONTRADICTION_CANDIDATE", "contradicted", "hazard_only", {
      contradictions: ["supplied evidence leans against the claim"],
      human: true,
      duplicate: dup,
    });
  }

  if (
    support !== null &&
    support >= POLICY_THRESHOLDS.supportYes &&
    (contradict === null || contradict < POLICY_THRESHOLDS.bothHigh)
  ) {
    return base(input, "SUPPORT_CANDIDATE", "supported", "hypothesis_only", {
      human: dup,
      duplicate: dup,
    });
  }

  return base(input, "HUMAN_REVIEW", "insufficient_evidence", "do_not_use_for_action", {
    human: true,
    duplicate: dup,
  });
}
