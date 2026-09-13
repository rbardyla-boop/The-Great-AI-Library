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

export type ReviewKind = "SUPPORT" | "CHALLENGE" | "FALSIFY" | "REPLICATE" | "REQUEST_EVIDENCE";

export type SupportClass = "OPINION" | "EVIDENTIARY";

export type LocalReviewPolicy = "conservative" | "evidentiary";

/** A review is evidence about a review. It is not evidence that the hypothesis is true. */
export interface ReviewObject {
  subject: string;
  kind: ReviewKind;
  supportClass?: SupportClass;
  reviewer: string;
  reviewerValuesUri: string;
  reason: string;
  evidenceRefs: string[];
  counterevidenceRefs: string[];
  createdAt: string;
  publisherIdentity: string;
  signatureScheme: "hmac-sha256-demo";
  origin: "local" | "external";
  libraryId: string;
  originalHash: string;
  connectionId: string;
  hash: string;
}

export interface ReviewEnvelope {
  protocol: "gal-dots/2";
  uri: string;
  assertion: {
    subject: string;
    kind: ReviewKind;
    supportClass?: SupportClass;
    reason: string;
    evidenceRefs: string[];
    counterevidenceRefs: string[];
    statement: string;
  };
  provenance: {
    reviewer: string;
    reviewerValuesUri: string;
    origin: "local" | "external";
    libraryId: string;
    createdAt: string;
    originalHash: string;
  };
  publication: {
    creator: string;
    objectHash: string;
    uri: string;
    signatureScheme: "hmac-sha256-demo";
    protocol: "gal-dots/2";
    integrityNotTrust: true;
  };
  signature: string;
  native: Omit<ReviewObject, "hash"> & { hash: string };
}

/** Exact answer to “why did this Library mark H17 CONTESTED?” */
export interface ReviewSetReceipt {
  kind: "REVIEW_SET_RECEIPT";
  subjectHash: string;
  subjectUri: string;
  reviewHashes: string[];
  evidenceHashes: string[];
  valuesVersion: string;
  policyVersion: string;
  decision: ConnectionStatus | "DENIED";
  reason: string;
  timestamp: string;
  libraryId: string;
  hash: string;
}

