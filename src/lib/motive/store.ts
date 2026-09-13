import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AmendmentProposal, MotiveDecision, RoleId } from "@/lib/values/types";
import { dilemmaById } from "./dilemmas";
import { convene, proposeAmendment, recordDecision, replayDecision } from "./session";
import { evaluateValues } from "@/lib/values/evaluate";
import { profileByUri } from "@/lib/values/profiles";

interface ChamberState {
  decisions: MotiveDecision[];
  proposals: AmendmentProposal[];
  lastDilemma: string | null;
  seq: number;
  conveneDilemma: (id: string) => Promise<Awaited<ReturnType<typeof convene>>>;
  commitSeat: (dilemmaId: string, role: RoleId) => Promise<MotiveDecision | null>;
  replay: (decisionId: string, otherUri: string) => Promise<Awaited<ReturnType<typeof replayDecision>>>;
  propose: (reason: string) => AmendmentProposal;
  acceptProposal: (id: string) => void;
}

export const useChamber = create<ChamberState>()(
  persist(
    (set, get) => ({
      decisions: [],
      proposals: [],
      lastDilemma: null,
      seq: 0,
      conveneDilemma: async (id) => {
        const result = await convene(dilemmaById(id));
        set({ lastDilemma: id });
        return result;
      },
      commitSeat: async (dilemmaId, role) => {
        const dilemma = dilemmaById(dilemmaId);
        const convened = await convene(dilemma);
        const seat = convened.seats.find((s) => s.profile.role === role);
        if (!seat) return null;
        const seq = get().seq + 1;
        const decision = recordDecision(dilemma, seat.judgment, seq);
        set({ seq, decisions: [decision, ...get().decisions] });
        return decision;
      },
      replay: async (decisionId, otherUri) => {
        const decision = get().decisions.find((d) => d.id === decisionId);
        if (!decision) throw new Error("decision not in ledger");
        return replayDecision(decision, otherUri);
      },
      propose: (reason) => {
        const seq = get().seq + 1;
        const proposal = proposeAmendment({
          fromUri: "values://open-hive/builder/1.3.0",
          toUri: "values://open-hive/builder/1.4.0",
          reason,
          seq,
        });
        set({ seq, proposals: [proposal, ...get().proposals] });
        return proposal;
      },
      acceptProposal: (id) => {
        set({
          proposals: get().proposals.map((p) => (p.id === id ? { ...p, status: "accepted" as const } : p)),
        });
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
