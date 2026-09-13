import { authorizeEffect, LAW_ROOT, spawnSuccessor } from "../hive/membrane.ts";
import { evaluateValues } from "../values/evaluate.ts";
import { allProfiles, profileByRole, profileByUri } from "../values/profiles.ts";
import type {
  AgentIdentity,
  AmendmentProposal,
  Dilemma,
  MotiveDecision,
  RoleId,
  ValueJudgment,
  ValuesProfile,
} from "../values/types.ts";
import { DILEMMAS } from "./dilemmas.ts";

export interface Convened {
  dilemma: Dilemma;
  seats: Array<{
    profile: ValuesProfile;
    judgment: ValueJudgment;
    membrane: ReturnType<typeof authorizeEffect>;
  }>;
}

export async function convene(dilemma: Dilemma, version = "1.3.0"): Promise<Convened> {
  const roles: RoleId[] = ["explorer", "builder", "skeptic", "archivist", "guardian", "mediator"];
  const seats = [];
  for (const role of roles) {
    const profile = await profileByRole(role, role === "builder" ? version : "1.3.0");
    const judgment = evaluateValues(profile, dilemma);
    const membrane = authorizeEffect(judgment.proposedEffect);
    seats.push({ profile, judgment, membrane });
  }
  return { dilemma, seats };
}

export function recordDecision(
  dilemma: Dilemma,
  judgment: ValueJudgment,
  seq: number,
  now = () => new Date().toISOString(),
): MotiveDecision {
  return {
    id: `dec-${String(seq).padStart(4, "0")}`,
    at: now(),
    dilemmaId: dilemma.id,
    judgment,
    membrane: authorizeEffect(judgment.proposedEffect),
    valuesUri: judgment.valuesUri,
    valuesHash: judgment.valuesHash,
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
