import { authorizeEffect } from "../hive/membrane.ts";
import { evaluateValues } from "../values/evaluate.ts";
import { profileByRole } from "../values/profiles.ts";
import type { Dilemma, RoleId } from "../values/types.ts";
import { conflictCost, experimentScore, majorityRec } from "../motive/cost.ts";
import type { CandidateConnection, ConnectionReview, ReviewReport } from "./types.ts";

export function promotionDilemma(connection: CandidateConnection): Dilemma {
  return {
    id: `promote-${connection.id}`,
    family: "discovery-integrity",
    title: `Promote ${connection.id}?`,
    situation: `${connection.proposedRelation}. ${connection.explanation} Status is ${connection.status}. There is no truth field.`,
    stakes: "A hypothesis becoming a library fact would contaminate the collection.",
    easyPath: {
      label: "Promote this connection to a library fact",
      effect: {
        kind: "PROMOTE_UNSUPPORTED",
        summary: `Promote ${connection.id} (${connection.type}) to verified knowledge.`,
      },
      violates: "evidence-integrity",
    },
    legitimatePath: {
      label: "Keep as hypothesis. Ask for the missing evidence.",
      effect: {
        kind: "FLAG_UNSUPPORTED",
        summary: `Keep ${connection.id} as HYPOTHESIS. Not a fact.`,
      },
    },
  };
}

const REVIEW_ROLES: RoleId[] = [
  "explorer",
  "builder",
  "skeptic",
  "archivist",
  "guardian",
  "mediator",
  "connector",
];

export async function reviewConnection(
  connection: CandidateConnection,
  builderVersion = "1.3.0",
): Promise<ReviewReport> {
  const dilemma = promotionDilemma(connection);
  const seats: ConnectionReview[] = [];
  const recs: ReturnType<typeof evaluateValues>[] = [];
  for (const role of REVIEW_ROLES) {
    const version = role === "builder" ? builderVersion : role === "connector" ? "1.0.0" : "1.3.0";
    const profile = await profileByRole(role, version);
    const judgment = evaluateValues(profile, dilemma);
    const membrane = authorizeEffect(judgment.proposedEffect);
    recs.push(judgment);
    seats.push({
      connectionId: connection.id,
      role: profile.name,
      valuesUri: profile.uri,
      recommendation: judgment.recommendation,
      authorized: false,
      justification: judgment.justification,
      membraneAllow: membrane.allow,
      membraneReason: membrane.reason,
    });
  }
  const majority = majorityRec(recs.map((r) => r.recommendation));
  const scored = recs.map((j, i) => {
    const seat = seats[i]!;
    return conflictCost({
      temptation: seat.role === "Builder" ? 9 : seat.role === "Connect-the-Dots" ? 2 : 4,
      judgment: j,
      membrane: { allow: seat.membraneAllow, reason: seat.membraneReason, effect: j.proposedEffect },
      majority,
    });
  });
  const score = experimentScore(
    scored.map((c, i) => ({
      judgment: recs[i]!,
      membrane: {
        allow: seats[i]!.membraneAllow,
        reason: seats[i]!.membraneReason,
        effect: recs[i]!.proposedEffect,
      },
      cost: c,
    })),
  );
  return {
    connectionId: connection.id,
    seats,
    majority,
    costly: score.costly,
  };
}

/** Working-hypothesis mark. Becoming a fact is always membrane-denied. */
export function mayPromote(
  connection: CandidateConnection,
): { allow: false; reason: string } | { allow: true; reason: string } {
  const asFact = authorizeEffect({
    kind: "PROMOTE_UNSUPPORTED",
    summary: `Promote ${connection.id} to a library fact`,
  });
  if (connection.status === "FALSIFIED" || connection.status === "CONTESTED") {
    return { allow: false, reason: `${connection.status} hypotheses cannot be promoted.` };
  }
  if (connection.type !== "DIRECT" || connection.scores.strength < 0.7) {
    return {
      allow: false,
      reason: `${asFact.reason} ${connection.type} at strength ${connection.scores.strength} stays a hypothesis. A surprising connection is valuable because it can be tested, not because it sounds clever.`,
    };
  }
  return {
    allow: true,
    reason:
      "Desk may mark this DIRECT as a SUPPORTED working hypothesis. Membrane still denies a truth field. It is not an original.",
  };
}
