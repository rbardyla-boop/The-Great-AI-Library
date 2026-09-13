import {
  CLAIMS,
  COLLECTIONS,
  CONTRADICTIONS,
  DESK_ITEMS,
  ENTITIES,
  RECORDS,
  RELATIONSHIPS,
} from "../library/corpus.ts";
import { LIBRARIANS } from "../library/librarians.ts";
import { utf8 } from "./crypto.ts";
import { LibraryKernel } from "./kernel.ts";
import { GAL_PUBLISHER, signLibrarian } from "./librarians.ts";

export async function seedMercury(kernel: LibraryKernel): Promise<void> {
  if (!kernel.empty) return;

  kernel.catalog.data.collections = COLLECTIONS.map((c) => ({ ...c }));
  kernel.catalog.data.entities = ENTITIES.map((e) => ({ ...e }));
  kernel.catalog.data.relationships = RELATIONSHIPS.map((r) => ({ ...r }));
  kernel.catalog.data.provAgents = [
    { id: "agent-archivist", kind: "archivist", name: "Archivist" },
    { id: "agent-human", kind: "human", name: "Reader" },
    { id: "agent-grok-4.5", kind: "model", name: "Grok 4.5" },
    { id: "agent-unassigned-summarizer-v3", kind: "model", name: "unassigned-summarizer-v3" },
  ];
  kernel.catalog.data.contradictions = CONTRADICTIONS.map((c) => ({ ...c }));

  const originals = RECORDS.filter((r) => r.kind === "original");
  const derivatives = RECORDS.filter((r) => r.kind === "derivative");

  for (const rec of originals) {
    const claims = CLAIMS.filter((c) => c.recordId === rec.id);
    await kernel.ingest({
      filename: rec.originalUri.split("/").pop() ?? rec.id,
      bytes: utf8(rec.body),
      recordId: rec.id,
      claims,
      meta: rec,
    });
  }

  for (const rec of derivatives) {
    await kernel.ingest({
      filename: rec.id,
      bytes: utf8(rec.body),
      recordId: rec.id,
      claims: CLAIMS.filter((c) => c.recordId === rec.id),
      meta: rec,
    });
  }

  for (const c of CONTRADICTIONS) {
    if (!kernel.catalog.data.contradictions.some((x) => x.id === c.id)) {
      kernel.catalog.data.contradictions.push({ ...c });
    }
  }
  for (const d of DESK_ITEMS) {
    if (!kernel.catalog.data.desk.some((x) => x.id === d.id)) {
      kernel.catalog.data.desk.push({ ...d });
    }
  }

  const research = LIBRARIANS.find((l) => l.id === "research");
  if (research && research.publisher === GAL_PUBLISHER) {
    const signed = await signLibrarian(research);
    await kernel.installSigned(signed);
  }

  await kernel.command({
    actor: "archivist",
    command: "SEED_COMPLETE",
    summary: `Mercury collection accessioned. ${originals.length} originals, ${CLAIMS.length} claims, hash-chained ledger.`,
    payload: { originals: originals.length, claims: CLAIMS.length },
  });
  kernel.jobs.clear();
}
