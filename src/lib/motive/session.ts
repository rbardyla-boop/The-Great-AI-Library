import { authorizeEffect, LAW_ROOT, spawnSuccessor } from "../hive/membrane.ts";
import { evaluateValues } from "../values/evaluate.ts";
import { VALUES_CHECKPOINT, VALUES_EVALUATOR } from "../values/object.ts";
import { allProfiles, profileByRole, profileByUri } from "../values/profiles.ts";
import type {
  AgentIdentity,
  AmendmentProposal,
  ConflictCost,
  Dilemma,
  MotiveDecision,
  Recommendation,
  RoleId,
  ValueJudgment,
  ValuesProfile,
} from "../values/types.ts";
import { conflictCost, experimentScore, majorityRec } from "./cost.ts";
import { DILEMMAS } from "./dilemmas.ts";

export interface ConvenedSeat {
  profile: ValuesProfile;
  judgment: ValueJudgment;
  membrane: ReturnType<typeof authorizeEffect>;
  cost: ConflictCost;
}

export interface Convened {
  dilemma: Dilemma;
  seats: ConvenedSeat[];
  majority: Recommendation;
  unique: number;
  wastedPrivilege: number;
  dissenters: number;
  costly: boolean;
}

export async function convene(dilemma: Dilemma, builderVersion = "1.3.0"): Promise<Convened> {
  const roles: RoleId[] = ["explorer", "builder", "skeptic", "archivist", "guardian", "mediator"];
  const raw: Omit<ConvenedSeat, "cost">[] = [];
  for (const role of roles) {
    const profile = await profileByRole(role, role === "builder" ? builderVersion : "1.3.0");
    const judgment = evaluateValues(profile, dilemma);
    const membrane = authorizeEffect(judgment.proposedEffect);
    raw.push({ profile, judgment, membrane });
  }
  const majority = majorityRec(raw.map((s) => s.judgment.recommendation));
  const seats = raw.map((s) => ({
    ...s,
    cost: conflictCost({
      temptation: s.profile.preferences.completion,
      judgment: s.judgment,
      membrane: s.membrane,
      majority,
    }),
  }));
  const score = experimentScore(seats);
  return { dilemma, seats, ...score };
}

export interface MotiveReport {
  model: string;
  checkpoint: string;
  evidenceRoot: string;
  builderVersion: string;
  dilemmas: Array<{
    id: string;
    title: string;
    majority: Recommendation;
    unique: number;
    wastedPrivilege: number;
    dissenters: number;
    costly: boolean;
    seats: Array<{
      role: RoleId;
      version: string;
      recommendation: Recommendation;
      wastedPrivilege: number;
      membrane: boolean;
    }>;
  }>;
  totalWastedPrivilege: number;
  costlyCount: number;
  dilemmaCount: number;
}

export async function runMotiveExperiment(opts?: {
  builderVersion?: string;
  evidenceRoot?: string;
}): Promise<MotiveReport> {
  const builderVersion = opts?.builderVersion ?? "1.3.0";
  const evidenceRoot = opts?.evidenceRoot ?? "0".repeat(64);
  const dilemmas = [];
  for (const dilemma of DILEMMAS) {
    const convened = await convene(dilemma, builderVersion);
    dilemmas.push({
      id: dilemma.id,
      title: dilemma.title,
      majority: convened.majority,
      unique: convened.unique,
      wastedPrivilege: convened.wastedPrivilege,
      dissenters: convened.dissenters,
      costly: convened.costly,
      seats: convened.seats.map((s) => ({
        role: s.profile.role,
        version: s.profile.version,
        recommendation: s.judgment.recommendation,
        wastedPrivilege: s.cost.wastedPrivilege,
        membrane: s.membrane.allow,
      })),
    });
  }
  return {
    model: VALUES_EVALUATOR,
    checkpoint: VALUES_CHECKPOINT,
    evidenceRoot,
    builderVersion,
    dilemmas,
    totalWastedPrivilege: dilemmas.reduce((n, d) => n + d.wastedPrivilege, 0),
    costlyCount: dilemmas.filter((d) => d.costly).length,
    dilemmaCount: dilemmas.length,
  };
}

export function recordDecision(
  dilemma: Dilemma,
  judgment: ValueJudgment,
  seq: number,
  opts: {
    evidenceRoot: string;
    temptation: number;
    now?: () => string;
    majority?: Recommendation;
  },
): MotiveDecision {
  const membrane = authorizeEffect(judgment.proposedEffect);
  const majority = opts.majority ?? judgment.recommendation;
  return {
    id: `dec-${String(seq).padStart(4, "0")}`,
    at: (opts.now ?? (() => new Date().toISOString()))(),
    dilemmaId: dilemma.id,
    judgment,
    membrane,
    valuesUri: judgment.valuesUri,
    valuesHash: judgment.valuesHash,
    valuesVersion: judgment.valuesUri.split("/").pop() ?? "",
    model: VALUES_EVALUATOR,
    checkpoint: VALUES_CHECKPOINT,
    evidenceRoot: opts.evidenceRoot,
    cost: conflictCost({
      temptation: opts.temptation,
      judgment,
      membrane,
      majority,
    }),
  };
}

export async function replayDecision(
  decision: MotiveDecision,
  otherUri: string,
): Promise<{ original: MotiveDecision; replayed: ValueJudgment; sameRecommendation: boolean }> {
  const dilemma = DILEMMAS.find((d) => d.id === decision.dilemmaId);
  if (!dilemma) throw new Error("dilemma missing");
  const other = await profileByUri(otherUri);
  if (!other) throw new Error(`unknown values ${otherUri}`);
  const replayed = evaluateValues(other, dilemma);
  return {
    original: decision,
    replayed,
    sameRecommendation: replayed.recommendation === decision.judgment.recommendation,
  };
}

export function proposeAmendment(args: {
  fromUri: string;
  toUri: string;
  reason: string;
  seq: number;
}): AmendmentProposal {
  return {
    id: `amd-${String(args.seq).padStart(4, "0")}`,
    at: new Date().toISOString(),
    fromUri: args.fromUri,
    toUri: args.toUri,
    reason: args.reason,
    status: "proposed",
  };
}

export function silentRewrite(): ReturnType<typeof authorizeEffect> {
  return authorizeEffect({
    kind: "REWRITE_VALUES",
    summary: "Agent attempted to install a new VALUES hash without epoch.",
  });
}

export function newBuilderIdentity(): AgentIdentity {
  return {
    id: "spiffe://openhive.ai/demo/builder-17",
    capabilities: ["library.read", "derivatives.write"],
    trust: 1,
    valuesUri: "values://open-hive/builder/1.3.0",
    lawRoot: LAW_ROOT,
  };
}

export { spawnSuccessor, allProfiles, DILEMMAS };
