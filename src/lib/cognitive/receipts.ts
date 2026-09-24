import type { LibraryKernel } from "../kernel/kernel.ts";
import type { DecisionPacket } from "./types.ts";

export type TerminalOutcome =
  | "ACCEPTED_RESPONSE"
  | "REJECTED_RESPONSE"
  | "RATE_LIMITED"
  | "OVERLOADED"
  | "TIMEOUT"
  | "AUTH_FAILURE"
  | "NETWORK_FAILURE"
  | "INVALID_RESPONSE"
  | "CANCELLED"
  | "NO_KEY"
  | "NOT_RECORDED";

/** A historical gap. Not a reconstructed zero. */
export function notRecorded(traceId: string) {
  return {
    terminal: "NOT_RECORDED" as const,
    traceId,
    attemptId: null,
    httpStatus: null,
    retryCount: null,
    note: "No attempt was stored. Absence is not evidence of success or of zero failures.",
  };
}

export interface AttemptLedgerBody {
  attemptId: string;
  traceId: string;
  terminal: string;
  model: string;
  inputHash: string;
  questionHashes: string[];
  httpStatus: number | null;
  latencyMs: number;
  retryCount: number;
  requestId: string | null;
  disposition: string;
  license: string;
  sourceHashes: string[];
}

/** Append-only. Hashes and dispositions only. No passage text and no API key. */
export async function fileAttempt(
  kernel: LibraryKernel,
  body: AttemptLedgerBody,
): Promise<{ eventHash: string }> {
  const blob = JSON.stringify(body);
  if (/bearer\s|TYPESAFE_API_KEY|sk-|super-secret/i.test(blob)) {
    throw new Error("attempt ledger refused a secret");
  }
  if (/"passage"|"query"|"text"/.test(blob)) {
    throw new Error("attempt ledger refused source text");
  }
  const ev = await kernel.command({
    actor: "archivist",
    command: "JEV_ATTEMPT",
    summary: `JEV ${body.terminal} ${body.attemptId}. Authority false. Disposition ${body.disposition}.`,
    payload: { ...body, authority: false },
    input: body.sourceHashes,
    result: body.terminal === "ACCEPTED_RESPONSE" ? "ok" : "failed",
  });
  return { eventHash: ev.event_hash };
}

export function ledgerBody(packet: DecisionPacket, extra: Omit<AttemptLedgerBody, "attemptId" | "traceId" | "model" | "inputHash" | "questionHashes" | "disposition" | "license" | "sourceHashes"> & {
  latencyMs: number;
  httpStatus: number | null;
  retryCount: number;
  requestId: string | null;
  terminal: string;
}): AttemptLedgerBody {
  return {
    attemptId: packet.provenance.jev_attempt_id,
    traceId: packet.header.trace_id,
    terminal: extra.terminal,
    model: packet.header.model_version,
    inputHash: packet.provenance.input_hash,
    questionHashes: packet.provenance.question_hashes,
    httpStatus: extra.httpStatus,
    latencyMs: extra.latencyMs,
    retryCount: extra.retryCount,
    requestId: extra.requestId,
    disposition: packet.payload.disposition,
    license: packet.epistemics.epistemic_license,
    sourceHashes: packet.provenance.source_hashes,
  };
}
