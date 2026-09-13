export type ConnectionType =
  | "DIRECT"
  | "MULTI_HOP"
  | "TEMPORAL"
  | "ANALOGY"
  | "POSSIBLE_CAUSE"
  | "CONTRADICTION"
  | "CLUSTER"
  | "GAP";

export type ConnectionStatus = "HYPOTHESIS" | "SUPPORTED" | "CONTESTED" | "FALSIFIED";

export type SearchKind = "NEAR" | "FAR";

export interface ConnectionScores {
  strength: number;
  novelty: number;
  relevance: number;
  independence: number;
  falsifiability: number;
}

export interface CandidateConnection {
  id: string;
  type: ConnectionType;
  search: SearchKind;
  dotIds: string[];
  intermediateNodes: string[];
  proposedRelation: string;
  explanation: string;
  sharedStructure: string;
  whyItMayMatter: string;
  counterargument: string;
  evidenceRefs: string[];
  counterevidenceRefs: string[];
  scores: ConnectionScores;
  assumptions: string[];
  missingEvidence: string[];
  falsifiers: string[];
  nextQuestions: string[];
  model: string;
  checkpoint: string;
  valuesUri: string;
  valuesHash: string;
  evidenceRoot: string;
  createdAt: string;
  status: ConnectionStatus;
  hash: string;
  ledgerReceipt?: string;
  /** This Library's conclusion. Not part of the sealed artifact. */
  localStatus?: ConnectionStatus;
}

export interface DiscoveryReport {
  model: string;
  checkpoint: string;
  valuesUri: string;
  evidenceRoot: string;
  nearCount: number;
  farCount: number;
  connections: CandidateConnection[];
}

export interface ConnectionReview {
  connectionId: string;
  role: string;
  valuesUri: string;
  recommendation: string;
  authorized: false;
  justification: string;
  membraneAllow: boolean;
  membraneReason: string;
}

export interface ReviewReport {
  connectionId: string;
  originalReceipt?: string;
  seats: ConnectionReview[];
  majority: string;
  costly: boolean;
}

export type LineageKind = "CHALLENGE" | "SUPPORT" | "FALSIFY" | "REPLICATE" | "REVIEW";

export interface LineageObject {
  kind: LineageKind;
  addresses: string;
  originalHash: string;
  connectionId: string;
  origin: "local" | "external";
  libraryId: string;
  reason: string;
  role?: string;
  at: string;
  sequence: number;
  hash: string;
}

export interface NanopubAssertion {
  relation: string;
  type: ConnectionType;
  search: SearchKind;
  dots: string[];
  structure: string;
  statement: string;
}

export interface NanopubProvenance {
  evidenceRoot: string;
  model: string;
  checkpoint: string;
  valuesUri: string;
  valuesHash: string;
  method: SearchKind;
  dotIds: string[];
  scoresAreRanking: true;
  scores: ConnectionScores;
}

export interface NanopubPublication {
  creator: string;
  createdAt: string;
  objectHash: string;
  uri: string;
  status: "HYPOTHESIS";
  protocol: "gal-dots/1";
}

export interface HypothesisEnvelope {
  protocol: "gal-dots/1";
  uri: string;
  assertion: NanopubAssertion;
  provenance: NanopubProvenance;
  publication: NanopubPublication;
  signature: string;
  native: Omit<CandidateConnection, "hash" | "ledgerReceipt" | "localStatus"> & { hash: string };
}
