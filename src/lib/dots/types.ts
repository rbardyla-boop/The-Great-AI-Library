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
