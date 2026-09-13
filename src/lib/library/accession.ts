export {
  ACCESSION_STAGES as PIPELINE_STAGES,
  classifySource as classifyDropped,
  extractTitle,
  looksInjected,
  heuristicClaims as extractClaimsFromRecord,
} from "@/lib/kernel/accession";
import { looksInjected, classifySource, extractTitle, heuristicClaims } from "@/lib/kernel/accession";
import { utf8, fromUtf8 } from "@/lib/kernel/crypto";
import type { LibraryRecord } from "./types";

export function makeRecordFromDrop(filename: string, body: string, now = new Date()): LibraryRecord {
  const injected = looksInjected(utf8(body));
  return {
    id: `user-pending`,
    contentHash: "",
    sourceType: classifySource(filename, body),
    kind: "original",
    title: extractTitle(filename, body),
    originalUri: `file://inbox/${filename}`,
    acquiredAt: now.toISOString(),
    createdAt: now.toISOString().slice(0, 10),
    author: "unattributed (dropped)",
    collectionIds: injected ? ["col-security"] : [],
    body,
    accessPolicy: injected ? "restricted" : "open",
    injectionFlag: injected,
    tags: injected ? ["injection", "untrusted"] : ["inbox"],
  };
}

export { fromUtf8, utf8 };
