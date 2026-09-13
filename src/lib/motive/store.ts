import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AmendmentProposal, MotiveDecision, RoleId } from "@/lib/values/types";
import { dilemmaById } from "./dilemmas";
import {
  convene,
  proposeAmendment,
  recordDecision,
  replayDecision,
  runMotiveExperiment,
  type MotiveReport,
} from "./session";
import { evaluateValues } from "@/lib/values/evaluate";
import { profileByUri } from "@/lib/values/profiles";
import { kernel, refreshLibrary } from "@/lib/library/store";
import {
  evidenceRoot,
  fileAcceptValues,
  fileAmendmentProposed,
  fileExperiment,
  fileJudgment,
  fileReplay,
} from "@/lib/values/registry";

interface ChamberState {
  decisions: MotiveDecision[];
  proposals: AmendmentProposal[];
  lastDilemma: string | null;
  lastReport: MotiveReport | null;
  seq: number;
  builderVersion: string;
  conveneDilemma: (id: string) => Promise<Awaited<ReturnType<typeof convene>>>;
  commitSeat: (dilemmaId: string, role: RoleId) => Promise<MotiveDecision | null>;
  replay: (
    decisionId: string,
    otherUri: string,
  ) => Promise<Awaited<ReturnType<typeof replayDecision>> & { ledgerReceipt: string }>;
  replaySeat: (
    dilemmaId: string,
    otherUri: string,
  ) => Promise<Awaited<ReturnType<typeof replayDecision>> & { ledgerReceipt: string }>;
  propose: (reason: string) => Promise<AmendmentProposal>;
  acceptProposal: (id: string) => Promise<void>;
  runExperiment: () => Promise<MotiveReport>;
}

export const useChamber = create<ChamberState>()(
  persist(
    (set, get) => ({
      decisions: [],
      proposals: [],
      lastDilemma: null,
      lastReport: null,
      seq: 0,
      builderVersion: "1.3.0",
      conveneDilemma: async (id) => {
        const result = await convene(dilemmaById(id), get().builderVersion ?? "1.3.0");
        set({ lastDilemma: id });
        return result;
      },
      commitSeat: async (dilemmaId, role) => {
        const dilemma = dilemmaById(dilemmaId);
        const convened = await convene(dilemma, get().builderVersion ?? "1.3.0");
        const seat = convened.seats.find((s) => s.profile.role === role);
        if (!seat) return null;
        const seq = get().seq + 1;
        const root = await evidenceRoot(kernel);
        const decision = recordDecision(dilemma, seat.judgment, seq, {
          evidenceRoot: root,
          temptation: seat.profile.preferences.completion,
          majority: convened.majority,
        });
        const ev = await fileJudgment(kernel, decision);
        decision.ledgerReceipt = ev.event_hash;
        set({ seq, decisions: [decision, ...get().decisions] });
        refreshLibrary();
        return decision;
      },
      replay: async (decisionId, otherUri) => {
        const decision = get().decisions.find((d) => d.id === decisionId);
        if (!decision) throw new Error("decision not in ledger");
        const result = await replayDecision(decision, otherUri);
        const ev = await fileReplay(kernel, result);
        refreshLibrary();
        return { ...result, ledgerReceipt: ev.event_hash };
      },
      replaySeat: async (dilemmaId, otherUri) => {
        let decision = get().decisions.find(
          (d) =>
            d.dilemmaId === dilemmaId &&
            d.judgment.role === "builder" &&
            d.valuesVersion === "1.3.0",
        );
        if (!decision) {
          decision = (await get().commitSeat(dilemmaId, "builder")) ?? undefined;
        }
        if (!decision) throw new Error("could not record original judgment");
        return get().replay(decision.id, otherUri);
      },
      propose: async (reason) => {
        const seq = get().seq + 1;
        const proposal = proposeAmendment({
          fromUri: "values://open-hive/builder/1.3.0",
          toUri: "values://open-hive/builder/1.4.0",
          reason,
          seq,
        });
        await fileAmendmentProposed(kernel, proposal);
        set({ seq, proposals: [proposal, ...get().proposals] });
        refreshLibrary();
        return proposal;
      },
      acceptProposal: async (id) => {
        const proposal = get().proposals.find((p) => p.id === id);
        if (!proposal) return;
        await fileAcceptValues(kernel, proposal.fromUri, proposal.toUri);
        set({
          proposals: get().proposals.map((p) => (p.id === id ? { ...p, status: "accepted" as const } : p)),
          builderVersion: proposal.toUri.endsWith("/1.4.0") ? "1.4.0" : get().builderVersion,
        });
        refreshLibrary();
      },
      runExperiment: async () => {
        const root = await evidenceRoot(kernel);
        const report = await runMotiveExperiment({
          builderVersion: get().builderVersion ?? "1.3.0",
          evidenceRoot: root,
        });
        await fileExperiment(kernel, report);
        set({ lastReport: report });
        refreshLibrary();
        return report;
      },
    }),
    { name: "gal-chamber-v1" },
  ),
);

export async function judgmentFor(uri: string, dilemmaId: string) {
  const profile = await profileByUri(uri);
  if (!profile) throw new Error("unknown profile");
  return evaluateValues(profile, dilemmaById(dilemmaId));
}
