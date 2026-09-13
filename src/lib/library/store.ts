import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CLAIMS,
  COLLECTIONS,
  CONTRADICTIONS,
  DESK_ITEMS,
  ENTITIES,
  LEDGER,
  RECORDS,
  RELATIONSHIPS,
} from "./corpus";
import { LIBRARIANS } from "./librarians";
import {
  extractClaimsFromRecord,
  looksInjected,
  makeRecordFromDrop,
} from "./accession";
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

export type DeskDecision = "accepted" | "rejected" | "pending";

interface Overlay {
  entered: boolean;
  userRecords: LibraryRecord[];
  userClaims: Claim[];
  extraLedger: LedgerEvent[];
  deskDecisions: Record<string, DeskDecision>;
  installed: string[];
  blockedInstall: string[];
  wipedDerivatives: boolean;
  jobs: AccessionJob[];
}

interface LibraryState extends Overlay {
  enter: () => void;
  decideDesk: (id: string, decision: Exclude<DeskDecision, "pending">) => void;
  installLibrarian: (id: string) => { ok: boolean; reason?: string };
  uninstallLibrarian: (id: string) => void;
  accessionText: (filename: string, body: string) => string;
  wipeDerivatives: () => void;
  restoreDerivatives: () => void;
  resetLibrary: () => void;
  advanceJob: (id: string, stage: number, done?: boolean, recordId?: string) => void;
}

const EMPTY_OVERLAY: Overlay = {
  entered: false,
  userRecords: [],
  userClaims: [],
  extraLedger: [],
  deskDecisions: {},
  installed: ["research"],
  blockedInstall: [],
  wipedDerivatives: false,
  jobs: [],
};

function receipt(): string {
  return `rcv-${Math.random().toString(16).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      ...EMPTY_OVERLAY,
      enter: () => set({ entered: true }),
      decideDesk: (id, decision) => {
        const item = DESK_ITEMS.find((d) => d.id === id);
        set({
          deskDecisions: { ...get().deskDecisions, [id]: decision },
          extraLedger: [
            {
              id: `led-user-${Date.now()}`,
              at: nowIso(),
              actor: "human",
              command: decision === "accepted" ? "ACCEPT_PROPOSAL" : "REJECT_PROPOSAL",
              summary: `${decision === "accepted" ? "Accepted" : "Rejected"} desk item: ${item?.title ?? id}`,
              receipt: receipt(),
              relatedIds: [id],
            },
            ...get().extraLedger,
          ],
        });
      },
      installLibrarian: (id) => {
        const lib = LIBRARIANS.find((l) => l.id === id);
        if (!lib) return { ok: false, reason: "Unknown librarian" };
        if (lib.permissions.shell || lib.permissions.network || lib.permissions["sources.write"]) {
          set({
            blockedInstall: [...new Set([...get().blockedInstall, id])],
            extraLedger: [
              {
                id: `led-user-${Date.now()}`,
                at: nowIso(),
                actor: "policy",
                command: "REFUSE_INSTALL",
                summary: `${lib.name} requested shell/network/source-write. Update stopped. No silent privilege expansion.`,
                receipt: receipt(),
                relatedIds: [id],
              },
              ...get().extraLedger,
            ],
          });
          return {
            ok: false,
            reason:
              "Install stopped. This package requests shell, network, or the right to modify original evidence.",
          };
        }
        if (get().installed.includes(id)) return { ok: true };
        set({
          installed: [...get().installed, id],
          extraLedger: [
            {
              id: `led-user-${Date.now()}`,
              at: nowIso(),
              actor: "human",
              command: "INSTALL_LIBRARIAN",
              summary: `Installed ${lib.name} ${lib.version} with declared permissions only.`,
              receipt: receipt(),
              relatedIds: [id],
            },
            ...get().extraLedger,
          ],
        });
        return { ok: true };
      },
      uninstallLibrarian: (id) => {
        set({ installed: get().installed.filter((x) => x !== id) });
      },
      accessionText: (filename, body) => {
        const record = makeRecordFromDrop(filename, body);
        const claims = extractClaimsFromRecord(record);
        const injected = looksInjected(body);
        const job: AccessionJob = {
          id: `job-${record.id}`,
          filename,
          stage: 0,
          stages: [
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
          ],
          done: false,
          recordId: record.id,
        };
        set({
          userRecords: [record, ...get().userRecords],
          userClaims: [...claims, ...get().userClaims],
          jobs: [job, ...get().jobs],
          extraLedger: [
            {
              id: `led-user-${Date.now()}`,
              at: nowIso(),
              actor: "archivist",
              command: injected ? "REFUSE_CAPABILITY" : "ACCESSION",
              summary: injected
                ? `Accessioned ${filename} as restricted data. Injection text did not grant capabilities.`
                : `Accessioned ${filename}. Hash ${record.contentHash.slice(0, 8)}…`,
              receipt: receipt(),
              relatedIds: [record.id],
            },
            ...get().extraLedger,
          ],
        });
        return record.id;
      },
      wipeDerivatives: () =>
        set({
          wipedDerivatives: true,
          extraLedger: [
            {
              id: `led-user-${Date.now()}`,
              at: nowIso(),
              actor: "human",
              command: "WIPE_DERIVATIVES",
              summary:
                "Deleted AI summaries, tags-as-memory, and derived origin claims. Originals untouched. Fixity intact.",
              receipt: receipt(),
              relatedIds: ["doc-ai-summary"],
            },
            ...get().extraLedger,
          ],
        }),
      restoreDerivatives: () =>
        set({
          wipedDerivatives: false,
          extraLedger: [
            {
              id: `led-user-${Date.now()}`,
              at: nowIso(),
              actor: "archivist",
              command: "REBUILD_DERIVATIVES",
              summary:
                "Rebuilt derivatives with a different processor. Original hashes unchanged (MODEL-SWAP GATE).",
              receipt: receipt(),
              relatedIds: ["doc-ai-summary"],
            },
            ...get().extraLedger,
          ],
        }),
      resetLibrary: () => set({ ...EMPTY_OVERLAY, entered: true }),
      advanceJob: (id, stage, done, recordId) =>
        set({
          jobs: get().jobs.map((j) =>
            j.id === id ? { ...j, stage, done: Boolean(done), recordId: recordId ?? j.recordId } : j,
          ),
        }),
    }),
    {
      name: "great-ai-library-overlay",
      partialize: (s) => ({
        entered: s.entered,
        userRecords: s.userRecords,
        userClaims: s.userClaims,
        extraLedger: s.extraLedger,
        deskDecisions: s.deskDecisions,
        installed: s.installed,
        blockedInstall: s.blockedInstall,
        wipedDerivatives: s.wipedDerivatives,
      }),
    },
  ),
);

export function selectRecords(s: Overlay): LibraryRecord[] {
  const base = s.wipedDerivatives ? RECORDS.filter((r) => r.kind === "original") : RECORDS;
  return [...s.userRecords, ...base];
}

export function selectClaims(s: Overlay): Claim[] {
  const hidden = s.wipedDerivatives ? new Set(["C13001", "C13002"]) : null;
  const base = hidden ? CLAIMS.filter((c) => !hidden.has(c.id)) : CLAIMS;
  return [...s.userClaims, ...base];
}

export function selectContradictions(s: Overlay): Contradiction[] {
  if (!s.wipedDerivatives) return CONTRADICTIONS;
  return CONTRADICTIONS.filter((c) => c.id !== "X-origin" && c.id !== "X-payback").concat(
    CONTRADICTIONS.filter((c) => c.id === "X-origin" || c.id === "X-payback").map((c) => ({
      ...c,
      status: "accepted" as const,
      summary: c.summary + " Derived side wiped.",
    })),
  );
}

export function selectDesk(s: Overlay): (DeskItem & { decision: DeskDecision })[] {
  return DESK_ITEMS.filter((d) => {
    if (s.wipedDerivatives && d.id === "desk-unsupported") return false;
    return true;
  }).map((d) => ({
    ...d,
    decision: s.deskDecisions[d.id] ?? "pending",
  }));
}

export function selectLedger(s: Overlay): LedgerEvent[] {
  return [...s.extraLedger, ...LEDGER].sort((a, b) => (a.at < b.at ? 1 : -1));
}

export const seed = {
  collections: COLLECTIONS,
  entities: ENTITIES,
  relationships: RELATIONSHIPS,
  librarians: LIBRARIANS,
};

export type { Collection, Entity, Librarian, Relationship };
