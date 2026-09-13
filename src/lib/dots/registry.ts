import type { ChainEvent } from "../kernel/ledger.ts";
import type { LibraryKernel } from "../kernel/kernel.ts";
import { fromUtf8 } from "../kernel/crypto.ts";
import {
  CONNECTOR_URI,
  DOTS_CHECKPOINT,
  DOTS_EVALUATOR,
  LOCAL_LIBRARY_ID,
  connectionUri,
  hasTruthField,
  putConnectionObject,
  putLineageObject,
} from "./object.ts";
import { mayPromote, type PromoteContext } from "./review.ts";
import type {
  CandidateConnection,
  ConnectionStatus,
  DiscoveryReport,
  LineageKind,
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
  command: Exclude<LineageKind, "REPLICATE"> | "KEEP_OPEN";
  connection: CandidateConnection;
  reason: string;
  actor?: "archivist" | "human";
  role?: string;
  origin?: "local" | "external";
  libraryId?: string;
}

async function fileAction(kernel: LibraryKernel, args: ActionOpts): Promise<ChainEvent> {
  const originalHash = args.connection.hash;
  const uri = connectionUri(originalHash);
  const seq = dotsLedgerEvents(kernel).length + 1;
  const kind = (args.command === "KEEP_OPEN" ? "REVIEW" : args.command) as LineageKind;
  const origin = args.origin ?? "local";
  const lineage = await putLineageObject(kernel.objects, {
    kind,
    addresses: uri,
    originalHash,
    connectionId: args.connection.id,
    origin,
    libraryId: args.libraryId ?? LOCAL_LIBRARY_ID,
    reason: args.reason,
    role: args.role,
    at: new Date().toISOString(),
    sequence: seq,
  });
  return kernel.command({
    actor: args.actor ?? "archivist",
    command: args.command,
    summary: `${args.command} ${args.connection.id} addresses ${uri}. ${args.reason} Artifact ${originalHash.slice(0, 8)} unchanged.`,
    payload: {
      connectionId: args.connection.id,
      originalReceipt: args.connection.ledgerReceipt ?? null,
      originalHash,
      uri,
      lineageHash: lineage.hash,
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
    },
    input: [originalHash, args.connection.ledgerReceipt ?? originalHash],
    output: [lineage.hash],
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
  opts?: { origin?: "local" | "external"; libraryId?: string },
): Promise<ChainEvent> {
  return fileAction(kernel, {
    command: "SUPPORT",
    connection,
    reason,
    role,
    origin: opts?.origin ?? "local",
    libraryId: opts?.libraryId,
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
    reason: "Human kept the hypothesis open. Not a fact.",
    actor: "human",
  });
}

export function promoteContextFromKernel(
  kernel: LibraryKernel,
  connection: CandidateConnection,
): PromoteContext {
  const events = lineageFor(kernel, connection.hash);
  const lineage = events
    .filter((e) => e.command === "SUPPORT" || e.command === "REVIEW" || e.command === "CHALLENGE")
    .map((e) => {
      const p = (e.payload ?? {}) as { origin?: string; originalHash?: string };
      return {
        kind: e.command,
        origin: p.origin === "external" ? ("external" as const) : ("local" as const),
        originalHash: String(p.originalHash ?? connection.hash),
        eventHash: e.event_hash,
      };
    });
  const citedReceipts = lineage
    .filter((l) => l.origin === "local" && (l.kind === "SUPPORT" || l.kind === "REVIEW"))
    .map((l) => l.eventHash!)
    .filter(Boolean);
  return { citedReceipts, lineage };
}

export async function filePromote(
  kernel: LibraryKernel,
  connection: CandidateConnection,
  ctx?: PromoteContext,
): Promise<ChainEvent> {
  const context = ctx ?? promoteContextFromKernel(kernel, connection);
  const gate = mayPromote(connection, context);
  const result = gate.allow ? "ok" : "denied";
  return kernel.command({
    actor: gate.allow ? "human" : "policy",
    command: "PROMOTE",
    summary: gate.allow
      ? `PROMOTE ${connection.id} local working hypothesis SUPPORTED citing ${context.citedReceipts.length} receipt(s). Shared artifact ${connection.hash.slice(0, 8)} stays HYPOTHESIS. Not a fact.`
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

export function connectionsFromLedger(kernel: LibraryKernel): CandidateConnection[] {
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
        parsed.localStatus = parsed.localStatus ?? "HYPOTHESIS";
        if (!byHash.has(hash)) byHash.set(hash, parsed);
      } catch {
        /* skip corrupt */
      }
    }
  }
  for (const ev of kernel.ledger.events) {
    if (!DOTS_LEDGER_COMMANDS.has(ev.command)) continue;
    const p = (ev.payload ?? {}) as { originalHash?: string; hash?: string };
    const hash = String(p.originalHash ?? p.hash ?? "");
    const current = byHash.get(hash);
    if (!current) continue;
    if (ev.command === "CHALLENGE") current.localStatus = "CONTESTED";
    if (ev.command === "FALSIFY") current.localStatus = "FALSIFIED";
    if (ev.command === "PROMOTE" && ev.result === "ok") current.localStatus = "SUPPORTED";
    current.status = "HYPOTHESIS";
  }
  return [...byHash.values()];
}

export function localConclusion(connection: CandidateConnection): ConnectionStatus {
  return connection.localStatus ?? connection.status;
}
