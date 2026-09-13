import type { ChainEvent } from "../kernel/ledger.ts";
import type { LibraryKernel } from "../kernel/kernel.ts";
import { fromUtf8 } from "../kernel/crypto.ts";
import {
  CONNECTOR_URI,
  DOTS_CHECKPOINT,
  DOTS_EVALUATOR,
  LOCAL_LIBRARY_ID,
  SIGNATURE_SCHEME,
  connectionUri,
  hasTruthField,
  putConnectionObject,
  putLineageObject,
  putReviewObject,
  putReviewSetReceipt,
  reviewUri,
  unsignedReview,
} from "./object.ts";
import {
  consideredEvidence,
  evidentiaryContribution,
  mayPromote,
  policyVersion,
  projectLocal,
  type PromoteContext,
} from "./review.ts";
import type {
  CandidateConnection,
  ConnectionStatus,
  DiscoveryReport,
  LocalReviewPolicy,
  ReviewKind,
  ReviewObject,
  SupportClass,
} from "./types.ts";

export const DOTS_LEDGER_COMMANDS = new Set([
  "CONNECT",
  "CHALLENGE",
  "SUPPORT",
  "FALSIFY",
  "PROMOTE",
  "KEEP_OPEN",
  "IMPORT_HYPOTHESIS",
  "REPLICATE",
  "REVIEW",
  "REVIEW_SET",
  "IMPORT_REVIEW",
]);

export function dotsLedgerEvents(kernel: LibraryKernel): ChainEvent[] {
  return kernel.ledger.events.filter((e) => DOTS_LEDGER_COMMANDS.has(e.command));
}

export function lineageFor(kernel: LibraryKernel, originalHash: string): ChainEvent[] {
  return dotsLedgerEvents(kernel).filter((e) => {
    const p = (e.payload ?? {}) as { originalHash?: string; hash?: string };
    return p.originalHash === originalHash || (e.command === "CONNECT" && p.hash === originalHash);
  });
}

export async function fileConnect(
  kernel: LibraryKernel,
  connection: CandidateConnection,
  imported = false,
): Promise<ChainEvent> {
  if (hasTruthField(connection)) {
    throw new Error("Connect-the-Dots may not create facts.");
  }
  const put = await putConnectionObject(kernel.objects, connection);
  return kernel.command({
    actor: imported ? "human" : "archivist",
    command: imported ? "IMPORT_HYPOTHESIS" : "CONNECT",
    summary: `${imported ? "Imported" : "CONNECT"} ${connection.id} ${connection.type} ${connection.search} status=HYPOTHESIS ${connectionUri(put.hash)}. model ${connection.model}. VALUES ${connection.valuesUri}. evidence ${connection.evidenceRoot.slice(0, 8)}. Not a fact.`,
    payload: {
      connectionId: connection.id,
      type: connection.type,
      search: connection.search,
      hash: put.hash,
      path: put.path,
      uri: connectionUri(put.hash),
      dotIds: connection.dotIds,
      scores: connection.scores,
      status: "HYPOTHESIS",
      model: connection.model,
      checkpoint: connection.checkpoint,
      valuesUri: connection.valuesUri,
      evidenceRoot: connection.evidenceRoot,
      imported,
    },
    input: [connection.evidenceRoot],
    output: [put.hash],
    result: "ok",
  });
}

export async function fileDiscovery(
  kernel: LibraryKernel,
  report: DiscoveryReport,
): Promise<ChainEvent[]> {
  const existing = new Set(
    dotsLedgerEvents(kernel)
      .filter((e) => e.command === "CONNECT" || e.command === "IMPORT_HYPOTHESIS" || e.command === "REPLICATE")
      .map((e) => String((e.payload as { hash?: string }).hash ?? "")),
  );
  const events: ChainEvent[] = [];
  for (const connection of report.connections) {
    if (existing.has(connection.hash)) continue;
    const ev = await fileConnect(kernel, connection);
    connection.ledgerReceipt = ev.event_hash;
    events.push(ev);
  }
  return events;
}

export async function fileReplicate(
  kernel: LibraryKernel,
  connection: CandidateConnection,
  opts?: { fromLibrary?: string },
): Promise<ChainEvent> {
  if (hasTruthField(connection)) {
    throw new Error("Connect-the-Dots may not create facts.");
  }
  const put = await putConnectionObject(kernel.objects, connection);
  const uri = connectionUri(put.hash);
  const seq = dotsLedgerEvents(kernel).length + 1;
  const lineage = await putLineageObject(kernel.objects, {
    kind: "REPLICATE",
    addresses: uri,
    originalHash: put.hash,
    connectionId: connection.id,
    origin: "external",
    libraryId: opts?.fromLibrary ?? LOCAL_LIBRARY_ID,
    reason: "Stranger import. Same bytes. Local conclusion starts empty. Not a fact.",
    at: new Date().toISOString(),
    sequence: seq,
  });
  return kernel.command({
    actor: "human",
    command: "REPLICATE",
    summary: `REPLICATE ${uri}. HAVE=${put.wrote ? "wrote" : "already"}. Artifact status=HYPOTHESIS. Original object ${put.hash.slice(0, 8)} unchanged.`,
    payload: {
      connectionId: connection.id,
      originalHash: put.hash,
      hash: put.hash,
      uri,
      lineageHash: lineage.hash,
      status: "HYPOTHESIS",
      fromLibrary: opts?.fromLibrary ?? null,
      wrote: put.wrote,
    },
    input: [put.hash],
    output: [put.hash, lineage.hash],
    result: "ok",
  });
}

interface ActionOpts {
  command: "CHALLENGE" | "SUPPORT" | "FALSIFY" | "REVIEW" | "KEEP_OPEN";
  connection: CandidateConnection;
  reason: string;
  actor?: "archivist" | "human";
  role?: string;
  origin?: "local" | "external";
  libraryId?: string;
  supportClass?: SupportClass;
  evidenceRefs?: string[];
  counterevidenceRefs?: string[];
}

function reviewKindFor(command: ActionOpts["command"]): ReviewKind {
  if (command === "KEEP_OPEN" || command === "REVIEW") return "REQUEST_EVIDENCE";
  return command;
}

async function fileAction(kernel: LibraryKernel, args: ActionOpts): Promise<ChainEvent> {
  const originalHash = args.connection.hash;
  const uri = connectionUri(originalHash);
  const origin = args.origin ?? "local";
  const kind = reviewKindFor(args.command);
  const supportClass =
    kind === "SUPPORT" ? (args.supportClass ?? "OPINION") : args.supportClass;
  const evidenceRefs = args.evidenceRefs ?? [];
  const unsigned: Omit<ReviewObject, "hash"> = {
    subject: uri,
    kind,
    supportClass,
    reviewer: args.role ?? args.actor ?? "archivist",
    reviewerValuesUri: CONNECTOR_URI,
    reason: args.reason,
    evidenceRefs,
    counterevidenceRefs: args.counterevidenceRefs ?? [],
    createdAt: new Date().toISOString(),
    publisherIdentity: args.libraryId ?? LOCAL_LIBRARY_ID,
    signatureScheme: SIGNATURE_SCHEME,
    origin,
    libraryId: args.libraryId ?? LOCAL_LIBRARY_ID,
    originalHash,
    connectionId: args.connection.id,
  };
  const review = await putReviewObject(kernel.objects, unsigned);
  const contributes =
    kind === "SUPPORT" &&
    supportClass === "EVIDENTIARY" &&
    evidenceRefs.some((e) => !args.connection.evidenceRefs.includes(e));
  return kernel.command({
    actor: args.actor ?? "archivist",
    command: args.command,
    summary: `${args.command} ${args.connection.id} addresses ${uri} as ${reviewUri(review.hash)}${kind === "SUPPORT" ? ` class=${supportClass}` : ""}. evidentiaryContribution=${contributes ? 1 : 0}. ${args.reason} Artifact ${originalHash.slice(0, 8)} unchanged. HMAC is integrity, not trust.`,
    payload: {
      connectionId: args.connection.id,
      originalReceipt: args.connection.ledgerReceipt ?? null,
      originalHash,
      uri,
      reviewHash: review.hash,
      reviewUri: reviewUri(review.hash),
      lineageHash: review.hash,
      addresses: uri,
      origin,
      libraryId: args.libraryId ?? LOCAL_LIBRARY_ID,
      fromStatus: args.connection.status,
      type: args.connection.type,
      model: DOTS_EVALUATOR,
      checkpoint: DOTS_CHECKPOINT,
      valuesUri: CONNECTOR_URI,
      evidenceRoot: args.connection.evidenceRoot,
      role: args.role ?? null,
      reason: args.reason,
      supportClass: supportClass ?? null,
      evidenceRefs,
      evidentiaryContribution: contributes ? 1 : 0,
      signatureScheme: SIGNATURE_SCHEME,
    },
    input: [originalHash, args.connection.ledgerReceipt ?? originalHash],
    output: [review.hash],
    result: "ok",
  });
}

export async function fileChallenge(
  kernel: LibraryKernel,
  connection: CandidateConnection,
  reason: string,
  role?: string,
  opts?: { origin?: "local" | "external"; libraryId?: string },
): Promise<ChainEvent> {
  return fileAction(kernel, {
    command: "CHALLENGE",
    connection,
    reason,
    role,
    origin: opts?.origin,
    libraryId: opts?.libraryId,
  });
}

export async function fileSupport(
  kernel: LibraryKernel,
  connection: CandidateConnection,
  reason: string,
  role?: string,
  opts?: {
    origin?: "local" | "external";
    libraryId?: string;
    supportClass?: SupportClass;
    evidenceRefs?: string[];
  },
): Promise<ChainEvent> {
  return fileAction(kernel, {
    command: "SUPPORT",
    connection,
    reason,
    role,
    origin: opts?.origin ?? "local",
    libraryId: opts?.libraryId,
    supportClass: opts?.supportClass ?? "OPINION",
    evidenceRefs: opts?.evidenceRefs ?? [],
  });
}

export async function fileFalsify(
  kernel: LibraryKernel,
  connection: CandidateConnection,
  reason: string,
  opts?: { origin?: "local" | "external"; libraryId?: string },
): Promise<ChainEvent> {
  return fileAction(kernel, {
    command: "FALSIFY",
    connection,
    reason,
    actor: "archivist",
    origin: opts?.origin,
    libraryId: opts?.libraryId,
  });
}

export async function fileReviewReceipt(
  kernel: LibraryKernel,
  connection: CandidateConnection,
  reason: string,
): Promise<ChainEvent> {
  return fileAction(kernel, {
    command: "REVIEW",
    connection,
    reason,
    actor: "archivist",
    origin: "local",
  });
}

export async function fileKeepOpen(
  kernel: LibraryKernel,
  connection: CandidateConnection,
): Promise<ChainEvent> {
  return fileAction(kernel, {
    command: "KEEP_OPEN",
    connection,
    reason: "Human kept the hypothesis open. Request evidence. Not a fact.",
    actor: "human",
  });
}

export function parseReviewBytes(bytes: Uint8Array): ReviewObject | null {
  try {
    const parsed = JSON.parse(fromUtf8(bytes)) as ReviewObject;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.subject || !parsed.kind || !parsed.originalHash) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function reviewsFromLedger(kernel: LibraryKernel, originalHash?: string): ReviewObject[] {
  const out: ReviewObject[] = [];
  const seen = new Set<string>();
  for (const ev of kernel.ledger.events) {
    if (!DOTS_LEDGER_COMMANDS.has(ev.command)) continue;
    const p = (ev.payload ?? {}) as { reviewHash?: string; lineageHash?: string; originalHash?: string };
    const hash = String(p.reviewHash ?? p.lineageHash ?? "");
    if (!hash || seen.has(hash)) continue;
    const bytes = kernel.objects.get(hash);
    if (!bytes) continue;
    const review = parseReviewBytes(bytes);
    if (!review) continue;
    review.hash = hash;
    if (originalHash && review.originalHash !== originalHash) continue;
    seen.add(hash);
    out.push(review);
  }
  return out;
}

export async function fileReplicateReview(
  kernel: LibraryKernel,
  review: ReviewObject,
  opts?: { fromLibrary?: string },
): Promise<ChainEvent> {
  if (hasTruthField(review)) {
    throw new Error("A review may not create facts.");
  }
  const unsigned = unsignedReview(review);
  const put = await putReviewObject(kernel.objects, unsigned);
  if (review.hash && put.hash !== review.hash) {
    throw new Error(
      `review hash ${put.hash.slice(0, 8)} !== object hash ${review.hash.slice(0, 8)}`,
    );
  }
  return kernel.command({
    actor: "human",
    command: "IMPORT_REVIEW",
    summary: `IMPORT_REVIEW ${reviewUri(put.hash)} addresses ${review.subject}. HAVE=${put.wrote ? "wrote" : "already"}. A review is not a fact. HMAC is integrity, not trust.`,
    payload: {
      reviewHash: put.hash,
      reviewUri: reviewUri(put.hash),
      lineageHash: put.hash,
      originalHash: review.originalHash,
      uri: review.subject,
      kind: review.kind,
      supportClass: review.supportClass ?? null,
      evidentiaryContribution: 0,
      fromLibrary: opts?.fromLibrary ?? null,
      wrote: put.wrote,
      signatureScheme: SIGNATURE_SCHEME,
    },
    input: [review.originalHash],
    output: [put.hash],
    result: "ok",
  });
}

export function promoteContextFromKernel(
  kernel: LibraryKernel,
  connection: CandidateConnection,
): PromoteContext {
  const reviews = reviewsFromLedger(kernel, connection.hash);
  const events = lineageFor(kernel, connection.hash);
  const lineage = events
    .filter((e) => e.command === "SUPPORT" || e.command === "REVIEW" || e.command === "CHALLENGE")
    .map((e) => {
      const p = (e.payload ?? {}) as { origin?: string; originalHash?: string; supportClass?: string };
      return {
        kind: e.command,
        origin: p.origin === "external" ? ("external" as const) : ("local" as const),
        originalHash: String(p.originalHash ?? connection.hash),
        eventHash: e.event_hash,
        supportClass: p.supportClass,
      };
    });
  const evid = reviews.filter((r) => r.origin === "local" && evidentiaryContribution(connection, r));
  const citedReceipts = evid.map((r) => r.hash);
  return { citedReceipts, lineage, reviews };
}

export async function fileReviewSetReceipt(
  kernel: LibraryKernel,
  connection: CandidateConnection,
  args: {
    policy: LocalReviewPolicy;
    decision: ConnectionStatus | "DENIED";
    reason: string;
    valuesVersion?: string;
  },
): Promise<ChainEvent> {
  const reviews = reviewsFromLedger(kernel, connection.hash);
  const evidence = consideredEvidence(connection, reviews);
  const unsigned = {
    kind: "REVIEW_SET_RECEIPT" as const,
    subjectHash: connection.hash,
    subjectUri: connectionUri(connection.hash),
    reviewHashes: reviews.map((r) => r.hash),
    evidenceHashes: evidence,
    valuesVersion: args.valuesVersion ?? CONNECTOR_URI,
    policyVersion: policyVersion(args.policy),
    decision: args.decision,
    reason: args.reason,
    timestamp: new Date().toISOString(),
    libraryId: LOCAL_LIBRARY_ID,
  };
  const put = await putReviewSetReceipt(kernel.objects, unsigned);
  return kernel.command({
    actor: "archivist",
    command: "REVIEW_SET",
    summary: `REVIEW_SET ${connectionUri(connection.hash)} decision=${args.decision} policy=${policyVersion(args.policy)} reviews=${reviews.length} evidence=${evidence.length}. Why this Library concluded. Not a fact.`,
    payload: {
      receiptHash: put.hash,
      originalHash: connection.hash,
      uri: connectionUri(connection.hash),
      reviewHashes: unsigned.reviewHashes,
      evidenceHashes: evidence,
      policyVersion: unsigned.policyVersion,
      valuesVersion: unsigned.valuesVersion,
      decision: args.decision,
      reason: args.reason,
    },
    input: [connection.hash, ...unsigned.reviewHashes],
    output: [put.hash],
    result: "ok",
  });
}

export async function filePromote(
  kernel: LibraryKernel,
  connection: CandidateConnection,
  ctx?: PromoteContext,
  policy: LocalReviewPolicy = "conservative",
): Promise<ChainEvent> {
  const context = ctx ?? promoteContextFromKernel(kernel, connection);
  const gate = mayPromote(connection, context);
  const result = gate.allow ? "ok" : "denied";
  await fileReviewSetReceipt(kernel, connection, {
    policy,
    decision: gate.allow ? "SUPPORTED" : "DENIED",
    reason: gate.reason,
  });
  return kernel.command({
    actor: gate.allow ? "human" : "policy",
    command: "PROMOTE",
    summary: gate.allow
      ? `PROMOTE ${connection.id} local working hypothesis SUPPORTED citing ${context.citedReceipts.length} evidentiary review(s). Shared artifact ${connection.hash.slice(0, 8)} stays HYPOTHESIS. Not a fact.`
      : gate.reason,
    payload: {
      connectionId: connection.id,
      originalReceipt: connection.ledgerReceipt ?? null,
      originalHash: connection.hash,
      uri: connectionUri(connection.hash),
      type: connection.type,
      scores: connection.scores,
      scoresAreRanking: true,
      citedReceipts: context.citedReceipts,
      status: gate.allow ? "SUPPORTED" : "HYPOTHESIS",
      artifactStatus: "HYPOTHESIS",
      authorized: false,
      model: DOTS_EVALUATOR,
      valuesUri: CONNECTOR_URI,
      evidenceRoot: connection.evidenceRoot,
      reason: gate.reason,
      policyVersion: policyVersion(policy),
    },
    input: [connection.hash, ...context.citedReceipts],
    result,
  });
}

export function sealedBytesEqual(a: LibraryKernel, b: LibraryKernel, hash: string): boolean {
  const left = a.objects.get(hash);
  const right = b.objects.get(hash);
  if (!left || !right) return false;
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return false;
  return true;
}

export function connectionsFromLedger(
  kernel: LibraryKernel,
  policy: LocalReviewPolicy = "conservative",
): CandidateConnection[] {
  const byHash = new Map<string, CandidateConnection>();
  for (const ev of kernel.ledger.events) {
    const p = (ev.payload ?? {}) as Record<string, unknown>;
    if (ev.command === "CONNECT" || ev.command === "IMPORT_HYPOTHESIS" || ev.command === "REPLICATE") {
      const hash = String(p.hash ?? p.originalHash ?? "");
      if (!hash) continue;
      const bytes = kernel.objects.get(hash);
      if (!bytes) continue;
      try {
        const parsed = JSON.parse(fromUtf8(bytes)) as CandidateConnection;
        parsed.hash = hash;
        parsed.ledgerReceipt = ev.event_hash;
        parsed.status = "HYPOTHESIS";
        parsed.localStatus = "HYPOTHESIS";
        if (!byHash.has(hash)) byHash.set(hash, parsed);
      } catch {
        /* skip corrupt */
      }
    }
  }
  for (const connection of byHash.values()) {
    const reviews = reviewsFromLedger(kernel, connection.hash);
    let local = projectLocal(connection, reviews, policy);
    if (policy === "conservative") {
      const promoted = kernel.ledger.events.some(
        (e) =>
          e.command === "PROMOTE" &&
          e.result === "ok" &&
          String((e.payload as { originalHash?: string }).originalHash ?? "") === connection.hash,
      );
      if (promoted && local === "HYPOTHESIS") local = "SUPPORTED";
    }
    connection.localStatus = local;
    connection.status = "HYPOTHESIS";
  }
  return [...byHash.values()];
}

export function localConclusion(connection: CandidateConnection): ConnectionStatus {
  return connection.localStatus ?? connection.status;
}
