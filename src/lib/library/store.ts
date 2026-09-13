import { create } from "zustand";
import { persist } from "zustand/middleware";
import { COLLECTIONS, ENTITIES, RELATIONSHIPS } from "./corpus";
import { LIBRARIANS } from "./librarians";
import { LibraryKernel } from "@/lib/kernel/kernel";
import { bootKernel, clearKernelStore, saveKernel } from "@/lib/kernel/persist";
import { seedMercury } from "@/lib/kernel/seed";
import { signLibrarian } from "@/lib/kernel/librarians";
import { utf8 } from "@/lib/kernel/crypto";
import type {
  AccessionJob,
  Claim,
  Collection,
  Contradiction,
  DeskItem,
  Entity,
  LedgerEvent,
  Librarian,
  LibraryRecord,
  Relationship,
} from "./types";

export type DeskDecision = "pending" | "accepted" | "rejected";

export const kernel = new LibraryKernel();

export interface Overlay {
  entered: boolean;
  ready: boolean;
  tick: number;
  blockedInstall: string[];
  deskDecisions: Record<string, DeskDecision>;
  jobs: AccessionJob[];
  wipedDerivatives: boolean;
  installed: string[];
}

interface LibraryState extends Overlay {
  enter: () => void;
  boot: () => Promise<void>;
  decideDesk: (id: string, decision: Exclude<DeskDecision, "pending">) => void;
  installLibrarian: (id: string) => Promise<{ ok: boolean; reason?: string }>;
  uninstallLibrarian: (id: string) => void;
  accessionText: (filename: string, body: string) => Promise<string>;
  wipeDerivatives: () => Promise<void>;
  restoreDerivatives: () => Promise<void>;
  resetLibrary: () => Promise<void>;
  advanceJob: (id: string, stage: number, done?: boolean, recordId?: string) => void;
  runFixity: () => Promise<{ ok: boolean; mismatches: string[] }>;
}

function snap(s: Overlay): Overlay {
  const shot = kernel.snapshot();
  return {
    ...s,
    tick: s.tick + 1,
    jobs: shot.jobs,
    wipedDerivatives: shot.wipedDerivatives,
    installed: shot.installed.map((i) => i.id),
  };
}

async function persistNow() {
  await saveKernel(kernel);
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      entered: false,
      ready: false,
      tick: 0,
      blockedInstall: [],
      deskDecisions: {},
      jobs: [],
      wipedDerivatives: false,
      installed: [],
      enter: () => set({ entered: true }),
      boot: async () => {
        if (get().ready) return;
        await bootKernel(kernel);
        set({ ...snap(get()), ready: true });
      },
      decideDesk: (id, decision) => {
        kernel.decideDesk(id, decision);
        set({
          ...snap(get()),
          deskDecisions: { ...get().deskDecisions, [id]: decision },
        });
        void persistNow();
      },
      installLibrarian: async (id) => {
        const lib = LIBRARIANS.find((l) => l.id === id);
        if (!lib) return { ok: false, reason: "Unknown librarian" };
        const signed = await signLibrarian(lib);
        const previous = kernel.catalog.data.installed.find((i) => i.id === id);
        const result = await kernel.installSigned(signed, previous ? { ...signed, librarian: { ...lib, version: previous.version }, manifest: { ...signed.manifest, version: previous.version, permissions: previous.permissions } } : null);
        if (!result.ok) {
          set({ ...snap(get()), blockedInstall: [...new Set([...get().blockedInstall, id])] });
          void persistNow();
          return { ok: false, reason: result.reason };
        }
        set(snap(get()));
        void persistNow();
        return { ok: true };
      },
      uninstallLibrarian: (id) => {
        kernel.catalog.data.installed = kernel.catalog.data.installed.filter((i) => i.id !== id);
        set(snap(get()));
        void persistNow();
      },
      accessionText: async (filename, body) => {
        const job = kernel.startJob({ filename, bytes: utf8(body) });
        set(snap(get()));
        for (let i = 0; i < 12; i++) {
          await kernel.advanceJob(job.id);
          set(snap(get()));
        }
        void persistNow();
        return job.recordId ?? job.id;
      },
      wipeDerivatives: async () => {
        await kernel.wipeDerivatives();
        set(snap(get()));
        void persistNow();
      },
      restoreDerivatives: async () => {
        const summary = RECORDS_DERIVATIVE();
        if (summary) {
          await kernel.rebuildDerivative({
            id: summary.id,
            title: summary.title,
            body: summary.body,
            derivedFrom: summary.derivedFrom ?? [],
            processor: "grok-4.5",
          });
        }
        set(snap(get()));
        void persistNow();
      },
      resetLibrary: async () => {
        kernel.catalog.reset();
        for (const hash of kernel.objects.hashes()) kernel.objects.delete(hash);
        kernel.ledger.load([]);
        kernel.jobs.clear();
        await clearKernelStore();
        await seedMercury(kernel);
        await persistNow();
        set({
          ...snap(get()),
          entered: true,
          ready: true,
          blockedInstall: [],
          deskDecisions: {},
        });
      },
      advanceJob: () => {
        /* pipeline advances inside accessionText */
      },
      runFixity: async () => {
        const result = await kernel.recheckFixity();
        set(snap(get()));
        void persistNow();
        return result;
      },
    }),
    {
      name: "great-ai-library-overlay",
      partialize: (s) => ({ entered: s.entered }),
    },
  ),
);

function RECORDS_DERIVATIVE() {
  return kernel.catalog.data.records.find((r) => r.id === "doc-ai-summary") ?? {
    id: "doc-ai-summary",
    title: "Executive summary of Project Mercury (model draft)",
    body: "Project Mercury originated with Dr. Naomi Chen in January 2024. Authorized budget is $72 million as of May 2025. Payback is not a program commitment.",
    derivedFrom: ["doc-proposal", "doc-addendum"],
  };
}

export function selectRecords(_s: Overlay): LibraryRecord[] {
  return kernel.catalog.data.records;
}

export function selectClaims(_s: Overlay): Claim[] {
  return kernel.catalog.data.claims;
}

export function selectContradictions(_s: Overlay): Contradiction[] {
  return kernel.catalog.data.contradictions;
}

export function selectDesk(s: Overlay): (DeskItem & { decision: DeskDecision })[] {
  return kernel.catalog.data.desk.map((d) => ({
    ...d,
    decision: s.deskDecisions[d.id] ?? "pending",
  }));
}

export function selectLedger(_s: Overlay): LedgerEvent[] {
  return kernel.uiLedger();
}

export const seed = {
  collections: COLLECTIONS,
  entities: ENTITIES,
  relationships: RELATIONSHIPS,
  librarians: LIBRARIANS,
};

export type { Collection, Entity, Librarian, Relationship };
