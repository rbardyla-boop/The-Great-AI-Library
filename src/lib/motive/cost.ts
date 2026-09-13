import type {
  ConflictCost,
  MembraneDecision,
  Recommendation,
  ValueJudgment,
} from "../values/types.ts";

export type { ConflictCost };

const TIE_ORDER: Recommendation[] = [
  "act-legitimate",
  "abstain",
  "escalate",
  "request-exception",
];

export function majorityRec(recs: Recommendation[]): Recommendation {
  const counts = new Map<Recommendation, number>();
  for (const r of recs) counts.set(r, (counts.get(r) ?? 0) + 1);
  let best: Recommendation = recs[0] ?? "act-legitimate";
  let bestN = -1;
  for (const r of TIE_ORDER) {
    const n = counts.get(r) ?? 0;
    if (n > bestN) {
      best = r;
      bestN = n;
    }
  }
  return best;
}

export function conflictCost(args: {
  temptation: number;
  judgment: ValueJudgment;
  membrane: MembraneDecision;
  majority: Recommendation;
}): ConflictCost {
  const wastedPrivilege =
    args.judgment.recommendation === "request-exception" && !args.membrane.allow
      ? args.temptation
      : 0;
  return {
    temptation: args.temptation,
    wastedPrivilege,
    dissent: args.judgment.recommendation === args.majority ? 0 : 1,
  };
}

export function experimentScore(seats: { judgment: ValueJudgment; cost: ConflictCost }[]): {
  majority: Recommendation;
  unique: number;
  wastedPrivilege: number;
  dissenters: number;
  costly: boolean;
} {
  const recs = seats.map((s) => s.judgment.recommendation);
  const majority = majorityRec(recs);
  const unique = new Set(recs).size;
  const wastedPrivilege = seats.reduce((n, s) => n + s.cost.wastedPrivilege, 0);
  const dissenters = seats.reduce((n, s) => n + s.cost.dissent, 0);
  return {
    majority,
    unique,
    wastedPrivilege,
    dissenters,
    costly: unique >= 2 && wastedPrivilege > 0,
  };
}
