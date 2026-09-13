import { canonicalJson, sha256Text } from "../kernel/crypto.ts";
import { connectionCanonical, hasTruthField, hashConnection, unsignedConnection } from "./object.ts";
import type { CandidateConnection } from "./types.ts";

export interface HypothesisCard {
  protocol: "gal-dots/0";
  connection: Omit<CandidateConnection, "ledgerReceipt">;
}

export function exportCard(connection: CandidateConnection): string {
  const card: HypothesisCard = {
    protocol: "gal-dots/0",
    connection: { ...unsignedConnection(connection), hash: connection.hash },
  };
  return canonicalJson(card);
}

export async function parseCard(
  text: string,
): Promise<{ ok: true; connection: CandidateConnection } | { ok: false; reason: string }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "Not JSON. A hypothesis card is a canonical object, not a story." };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, reason: "Card is not an object." };
  }
  const root = parsed as Record<string, unknown>;
  const raw = (root.connection ?? parsed) as unknown;
  if (hasTruthField(raw) || hasTruthField(parsed)) {
    return { ok: false, reason: "Rejected. Connect-the-Dots may not create facts. truth is forbidden." };
  }
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "Missing connection object." };
  }
  const presented = raw as CandidateConnection;
  if (!presented.id || !presented.type || !presented.hash) {
    return { ok: false, reason: "Card missing id, type, or hash." };
  }
  const expected = await sha256Text(connectionCanonical(presented));
  if (expected !== presented.hash) {
    return { ok: false, reason: "Hash mismatch. The card was altered after it was sealed." };
  }
  const next = { ...unsignedConnection(presented), status: "HYPOTHESIS" as const };
  const hash = await hashConnection(next);
  return { ok: true, connection: { ...next, hash } };
}