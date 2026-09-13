import type { ChainEvent } from "../kernel/ledger.ts";
import type { LibraryKernel } from "../kernel/kernel.ts";
import { fromUtf8 } from "../kernel/crypto.ts";
import { CONNECTOR_URI, DOTS_CHECKPOINT, DOTS_EVALUATOR, hasTruthField, putConnectionObject } from "./object.ts";
import { mayPromote } from "./review.ts";
import type { CandidateConnection, ConnectionStatus, DiscoveryReport } from "./types.ts";

export const DOTS_LEDGER_COMMANDS = new Set([
  "CONNECT",
  "CHALLENGE",
  "SUPPORT",
  "FALSIFY",
  "PROMOTE",
  "KEEP_OPEN",
  "IMPORT_HYPOTHESIS",
]);

export function dotsLedgerEvents(kernel: LibraryKernel): ChainEvent[] {
  return kernel.ledger.events.filter((e) => DOTS_LEDGER_COMMANDS.has(e.command));
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
    summary: `${imported ? "Imported" : "CONNECT"} ${connection.id} ${connection.type} ${connection.search} status=HYPOTHESIS. model ${connection.model}. VALUES ${connection.valuesUri}. evidence ${connection.evidenceRoot.slice(0, 8)}. Not a fact.`,
    payload: {
      connectionId: connection.id,
      type: connection.type,
      search: connection.search,
      hash: put.hash,
      path: put.path,
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
      .filter((e) => e.command === "CONNECT" || e.command === "IMPORT_HYPOTHESIS")
      .map((e) => String((e.payload as { connectionId?: string }).connectionId ?? "")),
  );
  const events: ChainEvent[] = [];
  for (const connection of report.connections) {
    if (existing.has(connection.id)) continue;
    const ev = await fileConnect(kernel, connection);
    connection.ledgerReceipt = ev.event_hash;
    events.push(ev);
  }
  return events;
}

async function fileAction(
  kernel: LibraryKernel,
  args: {
    command: "CHALLENGE" | "SUPPORT" | "FALSIFY" | "KEEP_OPEN";
    connection: CandidateConnection;
    next: ConnectionStatus;
    reason: string;
    actor?: "archivist" | "human";
    role?: string;
  },
): Promise<ChainEvent> {
  const original = args.connection.ledgerReceipt ?? args.connection.hash;
  return kernel.command({
    actor: args.actor ?? "archivist",
    command: args.command,
    summary: `${args.command} ${args.connection.id}: ${args.reason} Original CONNECT ${original.slice(0, 8)} unchanged. status ${args.connection.status} → ${args.next}.`,
    payload: {
      connectionId: args.connection.id,
      originalReceipt: args.connection.ledgerReceipt ?? null,
      originalHash: args.connection.hash,
      fromStatus: args.connection.status,
      toStatus: args.next,
      type: args.connection.type,
      model: DOTS_EVALUATOR,
      checkpoint: DOTS_CHECKPOINT,
      valuesUri: CONNECTOR_URI,
      evidenceRoot: args.connection.evidenceRoot,
      role: args.role ?? null,
      reason: args.reason,
    },
    input: [original, args.connection.hash],
    result: "ok",
  });
}

export async function fileChallenge(
  kernel: LibraryKernel,
  connection: CandidateConnection,
  reason: string,
  role?: string,
): Promise<ChainEvent> {
  return fileAction(kernel, {
    command: "CHALLENGE",
    connection,
    next: "CONTESTED",
    reason,
    role,
  });
}

export async function fileSupport(
  kernel: LibraryKernel,
  connection: CandidateConnection,
  reason: string,
  role?: string,
): Promise<ChainEvent> {
  return fileAction(kernel, {
    command: "SUPPORT",
    connection,
    next: connection.status === "CONTESTED" ? "CONTESTED" : "HYPOTHESIS",
    reason,
    role,
  });
}

export async function fileFalsify(
  kernel: LibraryKernel,
  connection: CandidateConnection,
  reason: string,
): Promise<ChainEvent> {
  return fileAction(kernel, {
    command: "FALSIFY",
    connection,
    next: "FALSIFIED",
    reason,
    actor: "archivist",
  });
}

export async function fileKeepOpen(
  kernel: LibraryKernel,
  connection: CandidateConnection,
): Promise<ChainEvent> {
  return fileAction(kernel, {
    command: "KEEP_OPEN",
    connection,
    next: connection.status,
    reason: "Human kept the hypothesis open. Not a fact.",
    actor: "human",
  });
}

export async function filePromote(
  kernel: LibraryKernel,
  connection: CandidateConnection,
): Promise<ChainEvent> {
  const gate = mayPromote(connection);
  const result = gate.allow ? "ok" : "denied";
  return kernel.command({
    actor: gate.allow ? "human" : "policy",
    command: "PROMOTE",
    summary: gate.allow
      ? `PROMOTE ${connection.id} to SUPPORTED derivative. Still not a fact. Original CONNECT ${connection.ledgerReceipt?.slice(0, 8) ?? connection.hash.slice(0, 8)} unchanged.`
      : gate.reason,
    payload: {
      connectionId: connection.id,
      originalReceipt: connection.ledgerReceipt ?? null,
      originalHash: connection.hash,
      type: connection.type,
      scores: connection.scores,
      status: gate.allow ? "SUPPORTED" : connection.status,
      authorized: false,
      model: DOTS_EVALUATOR,
      valuesUri: CONNECTOR_URI,
      evidenceRoot: connection.evidenceRoot,
      reason: gate.reason,
    },
    input: [connection.ledgerReceipt ?? connection.hash],
    result,
  });
}

export function connectionsFromLedger(kernel: LibraryKernel): CandidateConnection[] {
  const byId = new Map<string, CandidateConnection>();
  for (const ev of kernel.ledger.events) {
    const p = (ev.payload ?? {}) as Record<string, unknown>;
    const id = String(p.connectionId ?? "");
    if (!id) continue;
    if (ev.command === "CONNECT" || ev.command === "IMPORT_HYPOTHESIS") {
      const hash = String(p.hash ?? "");
      const bytes = hash ? kernel.objects.get(hash) : undefined;
      if (bytes) {
        try {
          const parsed = JSON.parse(fromUtf8(bytes)) as CandidateConnection;
          parsed.hash = hash;
          parsed.ledgerReceipt = ev.event_hash;
          parsed.status = "HYPOTHESIS";
          byId.set(id, parsed);
        } catch {
          /* skip corrupt */
        }
      }
    }
    const current = byId.get(id);
    if (!current) continue;
    if (ev.command === "CHALLENGE") current.status = "CONTESTED";
    if (ev.command === "FALSIFY") current.status = "FALSIFIED";
    if (ev.command === "PROMOTE" && ev.result === "ok") current.status = "SUPPORTED";
  }
  return [...byId.values()];
}
