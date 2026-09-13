export type RoleId =
  | "explorer"
  | "builder"
  | "skeptic"
  | "archivist"
  | "guardian"
  | "mediator"
  | "connector";

export type ValueClass = "constitutional" | "role" | "preference";

export type ConstitutionalId =
  | "evidence-integrity"
  | "lawful-authority"
  | "reversibility"
  | "no-silent-constitution";

export type PreferenceId =
  | "novelty"
  | "completion"
  | "falsification"
  | "provenance"
  | "downside"
  | "contradiction";

export type Recommendation =
  | "act-legitimate"
  | "request-exception"
  | "abstain"
  | "escalate";

export interface ConstitutionalValue {
  id: ConstitutionalId;
  class: "constitutional";
  title: string;
  definition: string;
  conflict: string;
  failure: string;
}

export interface PreferenceValue {
  id: PreferenceId;
  class: "role";
  title: string;
  weight: number;
}

export interface ValuesProfile {
  uri: string;
  role: RoleId;
  name: string;
  version: string;
  emphasis: string;
  constitutional: ConstitutionalValue[];
  preferences: Record<PreferenceId, number>;
  specialist?: {
    "structural-analogy": number;
    "cross-domain-reach": number;
    "gap-sensitivity": number;
  };
  hash: string;
}

export interface ValueJudgment {
  role: RoleId;
  valuesUri: string;
  valuesHash: string;
  recommendation: Recommendation;
  /** Always false. VALUES may not authorize effects. */
  authorized: false;
  justification: string;
  consulted: string[];
  counterarguments: string[];
  proposedEffect: HiveEffect;
}

export type HiveEffectKind =
  | "GRANT_CAPABILITY"
  | "MUTATE_ORIGINAL"
  | "PROMOTE_UNSUPPORTED"
  | "COLLAPSE_CONTRADICTION"
  | "CONCEAL_FAILURE"
  | "REWRITE_VALUES"
  | "NETWORK_SEND"
  | "ACCESSION_RESTRICTED"
  | "FLAG_UNSUPPORTED"
  | "REPORT_VIOLATION"
  | "KEEP_CONTRADICTION"
  | "SIMULATE_TEST";

export interface HiveEffect {
  kind: HiveEffectKind;
  summary: string;
  taint?: string[];
  destination?: "public-network" | "internal";
}

export interface Dilemma {
  id: string;
  family:
    | "mission-authority"
    | "reward-evidence"
    | "peer-loyalty"
    | "survival-integrity"
    | "progress-reversibility"
    | "discovery-integrity";
  title: string;
  situation: string;
  stakes: string;
  easyPath: {
    label: string;
    effect: HiveEffect;
    violates: ConstitutionalId | null;
  };
  legitimatePath: {
    label: string;
    effect: HiveEffect;
  };
}

export interface ConflictCost {
  temptation: number;
  wastedPrivilege: number;
  dissent: 0 | 1;
}

export interface MotiveDecision {
  id: string;
  at: string;
  dilemmaId: string;
  judgment: ValueJudgment;
  membrane: MembraneDecision;
  valuesUri: string;
  valuesHash: string;
  valuesVersion: string;
  model: string;
  checkpoint: string;
  evidenceRoot: string;
  ledgerReceipt?: string;
  cost: ConflictCost;
}

export interface MembraneDecision {
  allow: boolean;
  reason: string;
  effect: HiveEffect;
}

export interface AmendmentProposal {
  id: string;
  at: string;
  fromUri: string;
  toUri: string;
  reason: string;
  status: "proposed" | "accepted" | "rejected";
}

export interface AgentIdentity {
  id: string;
  parent?: string;
  capabilities: string[];
  trust: number;
  valuesUri: string | null;
  lawRoot: string;
}
