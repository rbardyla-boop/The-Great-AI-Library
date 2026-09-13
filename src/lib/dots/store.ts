import { create } from "zustand";
import { persist } from "zustand/middleware";
import { kernel, refreshLibrary } from "@/lib/library/store";
import { evidenceRoot } from "@/lib/values/registry";
import { profileByRole } from "@/lib/values/profiles";
import { discoverConnections, mercuryView } from "./discover";
import { parseCard } from "./exhibit";
import { connectionUri } from "./object";
import {
  connectionsFromLedger,
  fileChallenge,
  fileDiscovery,
  fileFalsify,
  fileKeepOpen,
  filePromote,
  fileReplicate,
  fileReviewReceipt,
  fileSupport,
} from "./registry";
import { reviewConnection } from "./review";
import type { CandidateConnection, DiscoveryReport, ReviewReport } from "./types";

interface DotsState {
  lastReport: DiscoveryReport | null;
  reviews: Record<string, ReviewReport>;
  notice: string | null;
  runDiscovery: (query?: string) => Promise<DiscoveryReport>;
  review: (id: string) => Promise<ReviewReport | null>;
  challenge: (id: string, reason: string, role?: string) => Promise<void>;
  support: (id: string, reason: string, role?: string) => Promise<void>;
  falsify: (id: string, reason: string) => Promise<void>;
  keepOpen: (id: string) => Promise<void>;
  promote: (id: string) => Promise<{ ok: boolean; reason: string }>;
  importCard: (text: string) => Promise<{ ok: boolean; reason: string }>;
  hydrate: () => CandidateConnection[];
}

function listed(): CandidateConnection[] {
  const fromLedger = connectionsFromLedger(kernel);
  if (fromLedger.length) return fromLedger;
  return useDots.getState().lastReport?.connections ?? [];
}

function byId(id: string): CandidateConnection | undefined {
  return listed().find((c) => c.id === id);
}

export const useDots = create<DotsState>()(
  persist(
    (set, get) => ({
      lastReport: null,
      reviews: {},
      notice: null,
      runDiscovery: async (query) => {
        const root = await evidenceRoot(kernel);
        const profile = await profileByRole("connector", "1.0.0");
        const view = {
          records: kernel.catalog.data.records.length ? kernel.catalog.data.records : mercuryView().records,
          claims: kernel.catalog.data.claims.length ? kernel.catalog.data.claims : mercuryView().claims,
          entities: kernel.catalog.data.entities.length
            ? kernel.catalog.data.entities
            : mercuryView().entities,
          relationships: kernel.catalog.data.relationships.length
            ? kernel.catalog.data.relationships
            : mercuryView().relationships,
          contradictions: kernel.catalog.data.contradictions.length
            ? kernel.catalog.data.contradictions
            : mercuryView().contradictions,
        };
        const report = await discoverConnections({ view, query, evidenceRoot: root, profile });
        await fileDiscovery(kernel, report);
        set({ lastReport: report, notice: null });
        refreshLibrary();
        return report;
      },
      review: async (id) => {
        const connection = byId(id);
        if (!connection) return null;
        const report = await reviewConnection(connection);
        report.originalReceipt = connection.ledgerReceipt;
        await fileReviewReceipt(
          kernel,
          connection,
          `Seven-seat review. Majority ${report.majority}. authorized:false. Costly=${report.costly}.`,
        );
        set({ reviews: { ...get().reviews, [id]: report } });
        refreshLibrary();
        return report;
      },
      challenge: async (id, reason, role) => {
        const connection = byId(id);
        if (!connection) return;
        await fileChallenge(kernel, connection, reason, role);
        if (get().lastReport) {
          set({
            lastReport: {
              ...get().lastReport!,
              connections: get().lastReport!.connections.map((c) =>
                c.id === id ? { ...c, localStatus: "CONTESTED" as const } : c,
              ),
            },
            notice: `CHALLENGE filed against ${connectionUri(connection.hash)}. Artifact unchanged.`,
          });
        }
        refreshLibrary();
      },
      support: async (id, reason, role) => {
        const connection = byId(id);
        if (!connection) return;
        await fileSupport(kernel, connection, reason, role);
        set({
          notice: `SUPPORT filed against ${connectionUri(connection.hash)}. Artifact unchanged. Not consensus.`,
        });
        refreshLibrary();
      },
      falsify: async (id, reason) => {
        const connection = byId(id);
        if (!connection) return;
        await fileFalsify(kernel, connection, reason);
        if (get().lastReport) {
          set({
            lastReport: {
              ...get().lastReport!,
              connections: get().lastReport!.connections.map((c) =>
                c.id === id ? { ...c, localStatus: "FALSIFIED" as const } : c,
              ),
            },
            notice: `FALSIFY filed against ${connectionUri(connection.hash)}. Artifact unchanged.`,
          });
        }
        refreshLibrary();
      },
      keepOpen: async (id) => {
        const connection = byId(id);
        if (!connection) return;
        await fileKeepOpen(kernel, connection);
        refreshLibrary();
      },
      promote: async (id) => {
        const connection = byId(id);
        if (!connection) return { ok: false, reason: "Unknown connection." };
        const ev = await filePromote(kernel, connection);
        const ok = ev.result === "ok";
        if (ok && get().lastReport) {
          set({
            lastReport: {
              ...get().lastReport!,
              connections: get().lastReport!.connections.map((c) =>
                c.id === id ? { ...c, localStatus: "SUPPORTED" as const } : c,
              ),
            },
            notice: "This library: SUPPORTED working hypothesis. Shared artifact stays HYPOTHESIS. Not a fact.",
          });
        } else {
          set({ notice: ev.summary });
        }
        refreshLibrary();
        return { ok, reason: ev.summary };
      },
      importCard: async (text) => {
        const parsed = await parseCard(text);
        if (!parsed.ok) return parsed;
        const ev = await fileReplicate(kernel, parsed.connection);
        const report = get().lastReport;
        set({
          lastReport: report
            ? { ...report, connections: [parsed.connection, ...report.connections] }
            : {
                model: parsed.connection.model,
                checkpoint: parsed.connection.checkpoint,
                valuesUri: parsed.connection.valuesUri,
                evidenceRoot: parsed.connection.evidenceRoot,
                nearCount: parsed.connection.search === "NEAR" ? 1 : 0,
                farCount: parsed.connection.search === "FAR" ? 1 : 0,
                connections: [parsed.connection],
              },
          notice: ev.summary,
        });
        refreshLibrary();
        return { ok: true, reason: ev.summary };
      },
      hydrate: () => listed(),
    }),
    { name: "gal-dots-v1" },
  ),
);
