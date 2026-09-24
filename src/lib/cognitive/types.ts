/** Minimum CIP-compatible contract. Not the Cognitive OS runtime. */

export type EpistemicLicense =
  | "full_premise"
  | "weak_premise"
  | "hypothesis_only"
  | "hazard_only"
  | "do_not_use_for_action";

export type Disposition =
  | "DISPLAY_ONLY"
  | "SUPPORT_CANDIDATE"
  | "CONTRADICTION_CANDIDATE"
  | "INSUFFICIENT_EVIDENCE"
  | "HUMAN_REVIEW"
  | "SERVICE_UNAVAILABLE";

export type ClaimRelation = "supported" | "contradicted" | "insufficient_evidence";

export type UncertaintyType = "derived" | "missing_judgment" | "stale_source" | "provenance_mismatch";

/** Uses Jev must never be granted. */
export const NEVER_GRANTED = [
  "direct_action",
  "memory_consolidation",
  "rule_revision",
  "safety_certification",
  "evidence_promotion",
  "source_mutation",
] as const;

export interface DecisionHeader {
  packet_id: string;
  packet_type: "ClaimPacket";
  schema_version: "clove-cip/0.1";
  source_engine: "typesafe_jev" | "deterministic_baseline" | "none";
  target_engine: "clove_cognitive_policy";
  trace_id: string;
  model_version: string;
  created_at: string;
  priority: "P3";
}

export interface DecisionEpistemics {
  /** Distributional summary copied from Jev. Not permission. */
  confidence: number | null;
  uncertainty_type: UncertaintyType;
  epistemic_license: EpistemicLicense;
  contradictions: string[];
}

export interface DecisionPermissions {
  allowed_use: string[];
  forbidden_use: string[];
}

export interface DecisionProvenance {
  source_hashes: string[];
  record_ids: string[];
  jev_attempt_id: string;
  question_hashes: string[];
  input_hash: string;
}

export interface DecisionPayload {
  relation: ClaimRelation;
  disposition: Disposition;
  probabilities: Record<string, number>;
  duplicate: boolean;
  human_review: boolean;
  /** Raw primitive distributions. Not collapsed into one prose answer. */
  distributions: Record<string, Record<string, number>>;
}

export interface DecisionPacket {
  header: DecisionHeader;
  epistemics: DecisionEpistemics;
  permissions: DecisionPermissions;
  provenance: DecisionProvenance;
  payload: DecisionPayload;
}

export interface PolicyInput {
  /** Coarse attempt outcome kept for the earlier receipt contract. */
  outcome: string;
  terminal: string;
  model: string;
  attemptId: string;
  traceId: string;
  inputHash: string;
  questionHashes: string[];
  createdAt: string;
  sourceHashes: string[];
  recordIds: string[];
  /** Hashes of the sources as they stand now. Mismatch is stale. */
  liveHashes: string[];
  judgments: Array<{
    id: string;
    confidence: number | null;
    probabilities: Record<string, number>;
    label: string;
  }>;
  engine: DecisionHeader["source_engine"];
}
