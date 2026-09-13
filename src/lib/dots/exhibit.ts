import { canonicalJson, hmacSha256, hmacSha256Verify, sha256Text } from "../kernel/crypto.ts";
import { GAL_PUBLISHER_KEY } from "../kernel/librarians.ts";
import {
  connectionCanonical,
  connectionUri,
  hasTruthField,
  hashConnection,
  LOCAL_LIBRARY_ID,
  unsignedConnection,
} from "./object.ts";
import type { CandidateConnection, HypothesisEnvelope } from "./types.ts";

export interface HypothesisCard {
  protocol: "gal-dots/0" | "gal-dots/1";
  connection: Omit<CandidateConnection, "ledgerReceipt" | "localStatus">;
}

export function sealedNative(connection: CandidateConnection): CandidateConnection {
  return {
    ...unsignedConnection(connection),
    hash: connection.hash,
    status: "HYPOTHESIS",
  };
}

export async function exportEnvelope(
  connection: CandidateConnection,
  creator = LOCAL_LIBRARY_ID,
): Promise<string> {
  const native = sealedNative(connection);
  const objectHash = connection.hash;
  const uri = connectionUri(objectHash);
  const assertion = {
    relation: native.proposedRelation,
    type: native.type,
    search: native.search,
    dots: native.dotIds,
    structure: native.sharedStructure,
    statement: `${native.proposedRelation} (${native.type}, ${native.search}). Not a fact.`,
  };
  const provenance = {
    evidenceRoot: native.evidenceRoot,
    model: native.model,
    checkpoint: native.checkpoint,
    valuesUri: native.valuesUri,
    valuesHash: native.valuesHash,
    method: native.search,
    dotIds: native.dotIds,
    scoresAreRanking: true as const,
    scores: native.scores,
  };
  const publication = {
    creator,
    createdAt: native.createdAt,
    objectHash,
    uri,
    status: "HYPOTHESIS" as const,
    protocol: "gal-dots/1" as const,
  };
  const signature = await hmacSha256(
    GAL_PUBLISHER_KEY,
    canonicalJson({ assertion, provenance, publication }),
  );
  const envelope: HypothesisEnvelope = {
    protocol: "gal-dots/1",
    uri,
    assertion,
    provenance,
    publication,
    signature,
    native: { ...unsignedConnection(native), hash: objectHash },
  };
  return canonicalJson(envelope);
}

/** Prefer the signed envelope. gal-dots/0 cards still parse. */
export function exportCard(connection: CandidateConnection): string {
  const card: HypothesisCard = {
    protocol: "gal-dots/0",
    connection: { ...unsignedConnection(sealedNative(connection)), hash: connection.hash },
  };
  return canonicalJson(card);
}

export async function parseCard(
  text: string,
): Promise<
  { ok: true; connection: CandidateConnection; envelope?: HypothesisEnvelope } | { ok: false; reason: string }
> {
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
  if (
    hasTruthField(root) ||
    hasTruthField(root.native) ||
    hasTruthField(root.connection) ||
    hasTruthField(root.assertion)
  ) {
    return { ok: false, reason: "Rejected. Connect-the-Dots may not create facts. truth is forbidden." };
  }

  if (root.protocol === "gal-dots/1" && root.native && root.assertion && root.publication) {
    const envelope = root as unknown as HypothesisEnvelope;
    const pub = envelope.publication;
    const signed = await hmacSha256Verify(
      GAL_PUBLISHER_KEY,
      canonicalJson({
        assertion: envelope.assertion,
        provenance: envelope.provenance,
        publication: envelope.publication,
      }),
      envelope.signature,
    );
    if (!signed) {
      return { ok: false, reason: "Signature mismatch. The envelope was altered after it was sealed." };
    }
    if (pub.status !== "HYPOTHESIS") {
      return { ok: false, reason: "Portable objects must travel as HYPOTHESIS. Status is not consensus." };
    }
    const presented = envelope.native as CandidateConnection;
    if (hasTruthField(presented)) {
      return { ok: false, reason: "Rejected. Connect-the-Dots may not create facts. truth is forbidden." };
    }
    const expected = await sha256Text(connectionCanonical(presented));
    if (expected !== presented.hash || presented.hash !== pub.objectHash) {
      return { ok: false, reason: "Hash mismatch. The card was altered after it was sealed." };
    }
    if (envelope.uri !== connectionUri(presented.hash)) {
      return { ok: false, reason: "Trusty URI does not match the object hash." };
    }
    const next = { ...unsignedConnection(presented), status: "HYPOTHESIS" as const };
    const hash = await hashConnection(next);
    if (hash !== presented.hash) {
      return { ok: false, reason: "Native hash drifted. Import would contaminate the artifact." };
    }
    return { ok: true, connection: { ...next, hash }, envelope };
  }

  const raw = (root.connection ?? parsed) as unknown;
  if (hasTruthField(raw)) {
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
