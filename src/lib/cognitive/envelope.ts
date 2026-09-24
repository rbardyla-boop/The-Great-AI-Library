import { NEVER_GRANTED, type DecisionPacket, type PolicyInput } from "./types.ts";

export function assemblePacket(
  input: PolicyInput,
  parts: Pick<DecisionPacket, "epistemics" | "permissions" | "payload">,
): DecisionPacket {
  const license =
    parts.epistemics.epistemic_license === "full_premise" ||
    parts.epistemics.epistemic_license === "weak_premise"
      ? "hypothesis_only"
      : parts.epistemics.epistemic_license;
  return {
    header: {
      packet_id: `pkt_${input.attemptId}`,
      packet_type: "ClaimPacket",
      schema_version: "clove-cip/0.1",
      source_engine: input.engine,
      target_engine: "clove_cognitive_policy",
      trace_id: input.traceId,
      model_version: input.model,
      created_at: input.createdAt,
      priority: "P3",
    },
    epistemics: { ...parts.epistemics, epistemic_license: license },
    permissions: {
      allowed_use: [...parts.permissions.allowed_use],
      forbidden_use: [...new Set([...parts.permissions.forbidden_use, ...NEVER_GRANTED])],
    },
    provenance: {
      source_hashes: [...input.sourceHashes],
      record_ids: [...input.recordIds],
      jev_attempt_id: input.attemptId,
      question_hashes: [...input.questionHashes],
      input_hash: input.inputHash,
    },
    payload: parts.payload,
  };
}
