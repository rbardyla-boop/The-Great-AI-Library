/** Frozen-case schema for a later study. Not a study, and not a production path. */

export interface FrozenEvalEvidence {
  recordId: string;
  hash: string;
  passage: string;
}

export type HumanLabel = "support" | "contradict" | "insufficient" | "irrelevant" | "conflict" | "unlabeled";

export interface FrozenEvalCase {
  id: string;
  evidence: FrozenEvalEvidence[];
  claim: string;
  expectedHumanLabel: HumanLabel;
  sourceGroup: string;
  provenance: { sourceHashes: string[]; recordIds: string[] };
  permissions: { allowed_use: string[]; forbidden_use: string[] };
  /** Filled by an offline run. Never used to train another model in this repo. */
  jevOutput?: unknown;
  cognitiveDisposition?: string;
  finalHumanAdjudication?: string;
}

export function emptyCase(id: string, claim: string): FrozenEvalCase {
  return {
    id,
    evidence: [],
    claim,
    expectedHumanLabel: "unlabeled",
    sourceGroup: "unassigned",
    provenance: { sourceHashes: [], recordIds: [] },
    permissions: {
      allowed_use: ["human_explanation"],
      forbidden_use: ["direct_action", "memory_consolidation", "evidence_promotion", "source_mutation"],
    },
  };
}
