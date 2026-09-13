import { fingerprint } from "./hash";
import { PIPELINE_STAGES } from "./corpus";
import type { Claim, LibraryRecord } from "./types";

const INJECTION_MARKERS = [
  "ignore library policy",
  "ignore previous instructions",
  "grant network",
  "grant shell",
  "exfiltrate",
];

export function classifyDropped(filename: string, body: string): LibraryRecord["sourceType"] {
  const n = filename.toLowerCase();
  const t = body.toLowerCase();
  if (n.endsWith(".md") || n.endsWith(".txt")) {
    if (t.includes("from:") && t.includes("to:")) return "email";
    if (t.includes("policy") || t.includes("effective")) return "policy";
    return "note";
  }
  if (n.endsWith(".pdf")) return "paper";
  if (n.includes("readme")) return "code";
  return "note";
}

export function extractTitle(filename: string, body: string): string {
  const heading = body.split("\n").find((l) => l.trim().startsWith("# "));
  if (heading) return heading.replace(/^#\s+/, "").trim();
  const first = body.split("\n").map((l) => l.trim()).find(Boolean);
  if (first && first.length < 80) return first;
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
}

export function looksInjected(body: string): boolean {
  const t = body.toLowerCase();
  return INJECTION_MARKERS.some((m) => t.includes(m));
}

export function makeRecordFromDrop(filename: string, body: string, now = new Date()): LibraryRecord {
  const id = `user-${fingerprint(filename + body).slice(0, 12)}`;
  return {
    id,
    contentHash: fingerprint(body),
    sourceType: classifyDropped(filename, body),
    kind: "original",
    title: extractTitle(filename, body),
    originalUri: `file://inbox/${filename}`,
    acquiredAt: now.toISOString(),
    createdAt: now.toISOString().slice(0, 10),
    author: "unattributed (dropped)",
    collectionIds: looksInjected(body) ? ["col-security"] : [],
    body,
    accessPolicy: looksInjected(body) ? "restricted" : "open",
    injectionFlag: looksInjected(body),
    tags: looksInjected(body) ? ["injection", "untrusted"] : ["inbox"],
  };
}

export function extractClaimsFromRecord(record: LibraryRecord): Claim[] {
  const sentences = record.body
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

export { PIPELINE_STAGES };
