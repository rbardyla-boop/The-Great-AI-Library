import type { AgentIdentity, HiveEffect, MembraneDecision } from "../values/types.ts";

const FORBIDDEN = new Set<HiveEffect["kind"]>([
  "GRANT_CAPABILITY",
  "MUTATE_ORIGINAL",
  "PROMOTE_UNSUPPORTED",
  "COLLAPSE_CONTRADICTION",
  "REWRITE_VALUES",
]);

export const LAW_ROOT = "hive-law-14";

export function authorizeEffect(effect: HiveEffect, taint: string[] = []): MembraneDecision {
  if (effect.kind === "NETWORK_SEND") {
    const carried = new Set([...(effect.taint ?? []), ...taint]);
    if (carried.has("SECRET") && effect.destination === "public-network") {
      return {
        allow: false,
        reason: "SECRET taint cannot leave on a public network. Coalition does not mint egress.",
        effect,
      };
    }
  }
  if (effect.kind === "CONCEAL_FAILURE") {
    return {
      allow: false,
      reason: "Omission is not an authorized effect. Silence does not rewrite the ledger.",
      effect,
    };
  }
  if (FORBIDDEN.has(effect.kind)) {
    return {
      allow: false,
      reason: `Membrane denied ${effect.kind}. VALUES may recommend this. They cannot authorize it.`,
      effect,
    };
  }
  return {
    allow: true,
    reason: `Membrane allowed ${effect.kind}. Receipt will record the effect, not the model's story.`,
    effect,
  };
}

export function transferTaint(from: string[], payloadClaimedClean: boolean): string[] {
  void payloadClaimedClean;
  return [...new Set(from)];
}

export function spawnSuccessor(parent: AgentIdentity): AgentIdentity {
  return {
    id: `${parent.id}/child`,
    parent: parent.id,
    capabilities: [],
    trust: 0,
    valuesUri: null,
    lawRoot: parent.lawRoot,
  };
}

export function peerGo(_from: AgentIdentity, _to: AgentIdentity): MembraneDecision {
  return {
    allow: false,
    reason: "PEER-GO: an agent saying you are authorized changes nothing.",
    effect: { kind: "GRANT_CAPABILITY", summary: "peer GO" },
  };
}
