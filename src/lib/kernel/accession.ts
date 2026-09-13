import type { Claim, LibraryRecord, SourceType } from "../library/types.ts";
import { fromUtf8 } from "./crypto.ts";

export const ACCESSION_STAGES = [
  "Accession",
  "Parse",
  "Fingerprint",
  "Classify",
  "Catalog",
  "Claim extraction",
  "Temporalize",
  "Reconcile",
  "Contradiction",
  "Shelving",
  "Index",
  "Preserve",
] as const;

export type AccessionStageName = (typeof ACCESSION_STAGES)[number];

const INJECTION_MARKERS = [
  "ignore library policy",
  "ignore previous instructions",
  "grant network",
  "grant shell",
  "exfiltrate",
];

export function looksInjected(bytes: Uint8Array): boolean {
  const t = fromUtf8(bytes).toLowerCase();
  return INJECTION_MARKERS.some((m) => t.includes(m));
}

export function classifySource(filename: string, body: string): SourceType {
  const n = filename.toLowerCase();
  const t = body.toLowerCase();
  if (n.includes("readme")) return "code";
  if (n.endsWith(".pdf")) return "paper";
  if (t.includes("from:") && t.includes("to:")) return "email";
  if (t.includes("policy") || t.includes("effective")) return "policy";
  if (t.includes("system: ignore")) return "memo";
  return "note";
}

export function extractTitle(filename: string, body: string): string {
  const heading = body.split("\n").find((l) => l.trim().startsWith("# "));
  if (heading) return heading.replace(/^#\s+/, "").trim();
  const first = body
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  if (first && first.length < 80) return first;
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
}

export function heuristicClaims(record: LibraryRecord, body: string): Claim[] {
  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 400);
  return sentences.slice(0, 4).map((sentence, i) => ({
    id: `C-user-${record.id}-${i + 1}`,
    recordId: record.id,
    text: sentence.slice(0, 180),
    passage: sentence,
    assertedAt: record.createdAt,
    validFrom: record.createdAt,
    status: record.injectionFlag ? "unsupported" : "current",
    temporal: "was_claimed" as const,
    entities: [],
    topics: record.tags,
    strength: "single-source" as const,
  }));
}

export function tokenize(body: string): string[] {
  return body
    .toLowerCase()
    .replace(/[^a-z0-9$]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}
