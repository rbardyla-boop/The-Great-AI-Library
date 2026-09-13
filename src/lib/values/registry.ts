import { canonicalJson, sha256Text } from "../kernel/crypto.ts";
import type { ChainEvent } from "../kernel/ledger.ts";
import type { LibraryKernel } from "../kernel/kernel.ts";
import type { MotiveReport } from "../motive/session.ts";
import type { AmendmentProposal, MotiveDecision, ValueJudgment } from "./types.ts";
import { allProfiles } from "./profiles.ts";
import { putValuesObject, VALUES_CHECKPOINT, VALUES_EVALUATOR } from "./object.ts";

export async function evidenceRoot(kernel: LibraryKernel): Promise<string> {
  const hashes = kernel.catalog.data.records
    .filter((r) => r.kind === "original")
    .map((r) => r.contentHash)
    .sort();
  return sha256Text(canonicalJson(hashes));
}

export function valuesInstalled(kernel: LibraryKernel): boolean {
  return kernel.ledger.events.some((e) => e.command === "INSTALL_VALUES");
}

export async function ensureValuesInstalled(kernel: LibraryKernel): Promise<void> {
  if (valuesInstalled(kernel)) return;
  const profiles = await allProfiles();
  for (const profile of profiles) {
    const put = await putValuesObject(kernel.objects, profile);
    const installed = profile.version === "1.3.0";
    await kernel.command({
      actor: "archivist",
      command: installed ? "INSTALL_VALUES" : "PROPOSE_VALUES",
      summary: installed
        ? `Installed VALUES ${profile.uri} as inspectable object ${put.hash.slice(0, 8)}…`
        : `Proposed VALUES ${profile.uri} (${put.hash.slice(0, 8)}…). Not installed law.`,
      payload: {
        uri: profile.uri,
        hash: put.hash,
        path: put.path,
        role: profile.role,
        version: profile.version,
        model: VALUES_EVALUATOR,
        checkpoint: VALUES_CHECKPOINT,
        installed,
      },
      output: [put.hash],
    });
  }
}

export async function fileJudgment(
  kernel: LibraryKernel,
  decision: MotiveDecision,
): Promise<ChainEvent> {
  return kernel.command({
    actor: "archivist",
    command: "JUDGE",
    summary: `${decision.judgment.role} @ ${decision.valuesUri} judged ${decision.dilemmaId} as ${decision.judgment.recommendation}. model ${decision.model}. VALUES ${decision.valuesVersion}. evidence ${decision.evidenceRoot.slice(0, 8)}. authorized:false.`,
    payload: {
      model: decision.model,
      checkpoint: decision.checkpoint,
      role: decision.judgment.role,
      valuesUri: decision.valuesUri,
      valuesVersion: decision.valuesVersion,
      valuesHash: decision.valuesHash,
      evidenceRoot: decision.evidenceRoot,
      dilemmaId: decision.dilemmaId,
      recommendation: decision.judgment.recommendation,
      authorized: false,
      membrane: decision.membrane.allow,
      cost: decision.cost,
    },
    input: [decision.evidenceRoot],
    output: [decision.valuesHash],
    result: "ok",
  });
}

export async function fileExperiment(
  kernel: LibraryKernel,
  report: MotiveReport,
): Promise<ChainEvent> {
  const seatCount = report.dilemmas.reduce((n, d) => n + d.seats.length, 0);
  return kernel.command({
    actor: "archivist",
    command: "MOTIVE_EXPERIMENT",
    summary: `MOTIVE-0: ${report.dilemmaCount} dilemmas, ${seatCount} seats, ${report.costlyCount} costly conflicts, wasted-privilege ${report.totalWastedPrivilege}. model ${report.model}. builder ${report.builderVersion}. evidence ${report.evidenceRoot.slice(0, 8)}.`,
    payload: report,
    input: [report.evidenceRoot],
    result: "ok",
  });
}

export async function fileReplay(
  kernel: LibraryKernel,
  args: {
    original: MotiveDecision;
    replayed: ValueJudgment;
    sameRecommendation: boolean;
  },
): Promise<ChainEvent> {
  const originalReceipt = args.original.ledgerReceipt ?? null;
  const replayVersion = args.replayed.valuesUri.split("/").pop() ?? "";
  return kernel.command({
    actor: "archivist",
    command: "REPLAY",
    summary: `Replay ${args.original.id} under ${args.replayed.valuesUri}: ${args.original.judgment.recommendation} → ${args.replayed.recommendation}. Original JUDGE ${originalReceipt ? originalReceipt.slice(0, 8) : args.original.id} unchanged. authorized:false.`,
    payload: {
      originalDecisionId: args.original.id,
      originalReceipt,
      dilemmaId: args.original.dilemmaId,
      role: args.original.judgment.role,
      model: args.original.model,
      checkpoint: args.original.checkpoint,
      evidenceRoot: args.original.evidenceRoot,
      originalValuesUri: args.original.valuesUri,
      originalValuesVersion: args.original.valuesVersion,
      originalValuesHash: args.original.valuesHash,
      originalRecommendation: args.original.judgment.recommendation,
      replayValuesUri: args.replayed.valuesUri,
      replayValuesVersion: replayVersion,
      replayValuesHash: args.replayed.valuesHash,
      replayRecommendation: args.replayed.recommendation,
      sameRecommendation: args.sameRecommendation,
      authorized: false,
    },
    input: [originalReceipt ?? args.original.id, args.original.valuesHash],
    output: [args.replayed.valuesHash],
    result: "ok",
  });
}

export async function fileAmendmentProposed(
  kernel: LibraryKernel,
  proposal: AmendmentProposal,
): Promise<ChainEvent> {
  return kernel.command({
    actor: "human",
    command: "AMENDMENT_PROPOSED",
    summary: `Epoch amendment proposed ${proposal.fromUri} → ${proposal.toUri}. Existing receipts stay on ${proposal.fromUri}.`,
    payload: {
      id: proposal.id,
      fromUri: proposal.fromUri,
      toUri: proposal.toUri,
      reason: proposal.reason,
      status: proposal.status,
      model: VALUES_EVALUATOR,
      checkpoint: VALUES_CHECKPOINT,
    },
    result: "ok",
  });
}

export async function fileAcceptValues(
  kernel: LibraryKernel,
  fromUri: string,
  toUri: string,
): Promise<ChainEvent> {
  return kernel.command({
    actor: "human",
    command: "ACCEPT_VALUES",
    summary: `Epoch accepted ${toUri}. Existing receipts keep ${fromUri}. Replay is not rewrite.`,
    payload: { fromUri, toUri, model: VALUES_EVALUATOR, checkpoint: VALUES_CHECKPOINT },
    result: "ok",
  });
}

export const VALUES_LEDGER_COMMANDS = new Set([
  "INSTALL_VALUES",
  "PROPOSE_VALUES",
  "AMENDMENT_PROPOSED",
  "ACCEPT_VALUES",
  "JUDGE",
  "MOTIVE_EXPERIMENT",
  "REPLAY",
]);

export function valuesLedgerEvents(kernel: LibraryKernel): ChainEvent[] {
  return kernel.ledger.events.filter((e) => VALUES_LEDGER_COMMANDS.has(e.command));
}
