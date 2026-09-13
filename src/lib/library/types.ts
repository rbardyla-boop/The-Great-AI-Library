export type SourceType =
  | "paper"
  | "article"
  | "note"
  | "transcript"
  | "policy"
  | "email"
  | "photograph"
  | "code"
  | "contract"
  | "scan"
  | "memo"
  | "summary";

export type ClaimStatus =
  | "current"
  | "superseded"
  | "disputed"
  | "retracted"
  | "stale"
  | "unsupported";

export type TemporalMode = "is_true" | "was_true" | "was_claimed" | "obsolete";

export type RecordKind = "original" | "derivative";

export interface LibraryRecord {
  id: string;
  contentHash: string;
  sourceType: SourceType;
  kind: RecordKind;
  title: string;
  originalUri: string;
  acquiredAt: string;
  createdAt: string;
  author: string;
  collectionIds: string[];
  body: string;
  pages?: number;
  accessPolicy: "open" | "restricted";
  duplicateOf?: string;
  injectionFlag?: boolean;
  integrityAlert?: boolean;
  brokenLinks?: string[];
  ocrErrors?: boolean;
  derivedFrom?: string[];
  processor?: string;
  tags: string[];
}

export interface Claim {
  id: string;
  recordId: string;
  text: string;
  passage: string;
  page?: number;
  assertedAt: string;
  validFrom: string;
  validTo?: string;
  status: ClaimStatus;
  temporal: TemporalMode;
  entities: string[];
  topics: string[];
  strength: "primary" | "secondary" | "single-source" | "derived" | "anonymous";
}

export interface Entity {
  id: string;
  name: string;
  kind: "person" | "org" | "project" | "place" | "concept" | "artifact";
  aliases: string[];
  uncertainMatch?: string;
  description: string;
}

export interface Relationship {
  id: string;
  fromId: string;
  toId: string;
  kind: string;
  recordId?: string;
  derived: boolean;
}

export interface Contradiction {
  id: string;
  claimIds: string[];
  title: string;
  summary: string;
  status: "open" | "accepted" | "rejected";
}

export interface Collection {
  id: string;
  name: string;
  description: string;
}

export interface DeskItem {
  id: string;
  kind:
    | "conflict"
    | "alias"
    | "integrity"
    | "injection"
    | "stale"
    | "duplicate"
    | "unsupported"
    | "changed";
  severity: "info" | "warn" | "alert";
  title: string;
  body: string;
  relatedIds: string[];
}

export interface LedgerEvent {
  id: string;
  at: string;
  actor: "archivist" | "human" | "librarian" | "policy";
  command: string;
  summary: string;
  receipt: string;
  relatedIds: string[];
}

export interface LibrarianPermissions {
  "library.read": boolean;
  "derivatives.write": boolean;
  "sources.write": boolean;
  network: boolean;
  shell: boolean;
}

export interface Librarian {
  id: string;
  name: string;
  publisher: string;
  version: string;
  source: "public" | "unsigned";
  build: "reproducible" | "opaque";
  signature: "verified" | "unverified";
  blurb: string;
  permissions: LibrarianPermissions;
  scopes: string[];
  tests: {
    retrieval: number;
    injection: number;
    permission: number;
    provenance: number;
  };
  malicious?: boolean;
}

export interface EvidencePassage {
  recordId: string;
  claimId?: string;
  title: string;
  hash: string;
  author: string;
  assertedAt: string;
  passage: string;
  channel: RetrievalChannel;
}

export type RetrievalChannel =
  | "lexical"
  | "semantic"
  | "graph"
  | "temporal"
  | "provenance";

export interface ChannelHits {
  lexical: number;
  semantic: number;
  graph: number;
  temporal: number;
  provenance: number;
}

export interface Brief {
  question: string;
  answer: string;
  citations: EvidencePassage[];
  contradictions: Contradiction[];
  absence: boolean;
  confidence: "high" | "split" | "weak" | "none";
  channels: ChannelHits;
  weakest?: string;
  model: "archivist-local" | "grok-4.5";
}

export interface AccessionJob {
  id: string;
  filename: string;
  stage: number;
  stages: string[];
  done: boolean;
  recordId?: string;
  receipts?: string[];
  failed?: number;
  error?: string;
}
