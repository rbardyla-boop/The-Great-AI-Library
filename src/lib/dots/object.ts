import { canonicalJson, objectPath, sha256Text, utf8 } from "../kernel/crypto.ts";
import type { ContentAddressedStore } from "../kernel/objects.ts";
import type { CandidateConnection, LineageObject } from "./types.ts";

export const DOTS_EVALUATOR = "gal-dots-eval/1.0";
export const DOTS_CHECKPOINT = "openhive-dots-0";
export const CONNECTOR_URI = "values://open-hive/connector/1.0.0";
export const LOCAL_LIBRARY_ID = "gal-local";

/** Trusty URI: the identifier embeds the CAS hash. */
export function connectionUri(hash: string): string {
  return `gal://connection/sha256:${hash}`;
}

/** Never include a truth field. Never include localStatus. The hash is of this unsigned object. */
export function unsignedConnection(
  connection: CandidateConnection,
): Omit<CandidateConnection, "hash" | "ledgerReceipt" | "localStatus"> {
  return {
    id: connection.id,
    type: connection.type,
    search: connection.search,
    dotIds: connection.dotIds,
    intermediateNodes: connection.intermediateNodes,
    proposedRelation: connection.proposedRelation,
    explanation: connection.explanation,
    sharedStructure: connection.sharedStructure,
    whyItMayMatter: connection.whyItMayMatter,
    counterargument: connection.counterargument,
    evidenceRefs: connection.evidenceRefs,
    counterevidenceRefs: connection.counterevidenceRefs,
    scores: connection.scores,
    assumptions: connection.assumptions,
    missingEvidence: connection.missingEvidence,
    falsifiers: connection.falsifiers,
    nextQuestions: connection.nextQuestions,
    model: connection.model,
    checkpoint: connection.checkpoint,
    valuesUri: connection.valuesUri,
    valuesHash: connection.valuesHash,
    evidenceRoot: connection.evidenceRoot,
    createdAt: connection.createdAt,
    status: connection.status,
  };
}

export function connectionCanonical(connection: CandidateConnection): string {
  return canonicalJson(unsignedConnection(connection));
}

export async function hashConnection(
  connection: Omit<CandidateConnection, "hash" | "ledgerReceipt" | "localStatus">,
): Promise<string> {
  return sha256Text(canonicalJson(connection));
}

export async function putConnectionObject(
  objects: ContentAddressedStore,
  connection: CandidateConnection,
): Promise<{ hash: string; path: string; wrote: boolean }> {
  if ("truth" in connection) {
    throw new Error("Connect-the-Dots may not create facts. truth is forbidden.");
  }
  const put = await objects.put(utf8(connectionCanonical(connection)));
  if (put.hash !== connection.hash) {
    throw new Error(
      `connection hash ${put.hash.slice(0, 8)} !== object hash ${connection.hash.slice(0, 8)}`,
    );
  }
  return { hash: put.hash, path: objectPath(put.hash), wrote: put.wrote };
}

export function unsignedLineage(lineage: LineageObject): Omit<LineageObject, "hash"> {
  return {
    kind: lineage.kind,
    addresses: lineage.addresses,
    originalHash: lineage.originalHash,
    connectionId: lineage.connectionId,
    origin: lineage.origin,
    libraryId: lineage.libraryId,
    reason: lineage.reason,
    role: lineage.role,
    at: lineage.at,
    sequence: lineage.sequence,
  };
}

export async function putLineageObject(
  objects: ContentAddressedStore,
  lineage: Omit<LineageObject, "hash">,
): Promise<{ hash: string; path: string; wrote: boolean }> {
  const put = await objects.put(utf8(canonicalJson(lineage)));
  return { hash: put.hash, path: objectPath(put.hash), wrote: put.wrote };
}

export function hasTruthField(value: unknown): boolean {
  return Boolean(value && typeof value === "object" && "truth" in (value as object));
}