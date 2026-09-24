import type { JudgmentId } from "./types.ts";

/**
 * Five independent questions over one bounded state.
 * Noul is P(yes), not an intensity and not a confidence score.
 * Choice and Score are unused: these are yes/no judgments.
 * Arithmetic, dates, counts, hashes, and permissions stay in GAL code.
 */
export function libraryQuestions() {
  return {
    supports: {
      type: "noul" as const,
      instructions: "Does the supplied evidence support the claim stated in the query?",
      criteria: {
        true: "At least one passage affirms the claim.",
        false: "No supplied passage affirms the claim.",
      },
    },
    contradicts: {
      type: "noul" as const,
      instructions: "Does the supplied evidence contradict the claim stated in the query?",
      criteria: {
        true: "At least one passage denies or conflicts with the claim.",
        false: "No supplied passage conflicts with the claim.",
      },
    },
    insufficient: {
      type: "noul" as const,
      instructions:
        "Is the supplied evidence insufficient to establish either support or contradiction?",
      criteria: {
        true: "The passages are missing, thin, or silent on the claim.",
        false: "The passages are enough to lean support or contradiction, even if a person should still look.",
      },
    },
    relevance: {
      type: "noul" as const,
      instructions: "Is this evidence relevant to the claim or query?",
      criteria: {
        true: "A passage is about the same claim the query asks.",
        false: "The passages do not address the query.",
      },
    },
    duplicate: {
      type: "noul" as const,
      instructions: "Does this candidate appear to substantially duplicate another supplied candidate?",
      criteria: {
        true: "Two or more passages restate one claim.",
        false: "The passages are distinct, or there is only one passage.",
      },
    },
  };
}

export const JUDGMENT_ORDER: JudgmentId[] = [
  "supports",
  "contradicts",
  "insufficient",
  "relevance",
  "duplicate",
];

/** Legacy closed gate. The Cognitive policy is the disposition. This never writes. */
export function policyDecision(): {
  action: "display_only";
  mutated: false;
  promoted: false;
  reason: string;
} {
  return {
    action: "display_only",
    mutated: false,
    promoted: false,
    reason: "Jev supplies semantic judgment only. GAL policy did not authorize a write.",
  };
}
