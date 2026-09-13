import { authorizeEffect } from "../hive/membrane.ts";
import { evaluateValues } from "../values/evaluate.ts";
import { profileByRole } from "../values/profiles.ts";
import type { Dilemma, RoleId } from "../values/types.ts";
import { conflictCost, experimentScore, majorityRec } from "../motive/cost.ts";
import type {
  CandidateConnection,
  ConnectionReview,
  ConnectionStatus,
  LocalReviewPolicy,
  ReviewObject,
  ReviewReport,
} from "./types.ts";

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

/** Score is a ranking signal. It is never sufficient evidence for SUPPORTED. */
export interface PromoteContext {
  citedReceipts: string[];
  lineage: Array<{
    kind: string;
    origin: "local" | "external";
    originalHash: string;
    eventHash?: string;
    supportClass?: string;
  }>;
  reviews?: ReviewObject[];
}

export function isIndependentEvidence(connection: CandidateConnection, refs: string[]): boolean {
  return refs.some((r) => r.length > 0 && !connection.evidenceRefs.includes(r));
}

/** Only SUPPORT — EVIDENTIARY with a new source contributes evidence. Opinion contributes zero. */
export function evidentiaryContribution(connection: CandidateConnection, review: ReviewObject): boolean {
  return (
    review.kind === "SUPPORT" &&
    review.supportClass === "EVIDENTIARY" &&
    isIndependentEvidence(connection, review.evidenceRefs)
  );
}

export function consideredEvidence(connection: CandidateConnection, reviews: ReviewObject[]): string[] {
  const set = new Set(connection.evidenceRefs);
  for (const r of reviews) {
    if (evidentiaryContribution(connection, r)) {
      for (const e of r.evidenceRefs) set.add(e);
    }
  }
  return [...set];
}

/**
 * Local projection. Never writes into the sealed artifact.
 * conservative: challenge/falsify bind; never auto-SUPPORTED.
 * evidentiary: independent evidence can mark a DIRECT as a working hypothesis.
 */
export function projectLocal(
  connection: CandidateConnection,
  reviews: ReviewObject[],
  policy: LocalReviewPolicy = "conservative",
): ConnectionStatus {
  const mine = reviews.filter((r) => r.originalHash === connection.hash);
  if (mine.some((r) => r.kind === "FALSIFY")) return "FALSIFIED";
  const challenged = mine.some((r) => r.kind === "CHALLENGE");
  const evid = mine.some((r) => evidentiaryContribution(connection, r));
  if (policy === "evidentiary") {
    if (evid && connection.type === "DIRECT") return "SUPPORTED";
    if (challenged) return "CONTESTED";
    return "HYPOTHESIS";
  }
  if (challenged) return "CONTESTED";
  return "HYPOTHESIS";
}

export function policyVersion(policy: LocalReviewPolicy): string {
  return policy === "evidentiary"
    ? "gal-review-policy/evidentiary/1"
    : "gal-review-policy/conservative/1";
}

export function mayPromote(
  connection: CandidateConnection,
  ctx: PromoteContext = { citedReceipts: [], lineage: [] },
): { allow: false; reason: string } | { allow: true; reason: string } {
  const asFact = authorizeEffect({
    kind: "PROMOTE_UNSUPPORTED",
    summary: `Promote ${connection.id} to a library fact`,
  });
  const local = connection.localStatus ?? connection.status;
  if (local === "FALSIFIED" || local === "CONTESTED") {
    return { allow: false, reason: `${local} hypotheses cannot be promoted.` };
  }
  const reviews = ctx.reviews ?? [];
  const evid = reviews.filter(
    (r) => r.origin === "local" && evidentiaryContribution(connection, r),
  );
  if (evid.length === 0) {
    return {
      allow: false,
      reason:
        "A score is not evidence. Agreement does not accumulate into evidence. Opinion is not evidence. SUPPORTED requires cited local evidentiary reviews. External SUPPORT does not promote. Ten thousand agreements are not consensus.",
    };
  }
  if (connection.type !== "DIRECT") {
    return {
      allow: false,
      reason: `${asFact.reason} ${connection.type} stays a hypothesis. A surprising connection is valuable because it can be tested, not because it sounds clever.`,
    };
  }
  return {
    allow: true,
    reason:
      "Desk may mark this DIRECT as a SUPPORTED working hypothesis citing evidentiary reviews, not opinion and not the strength score. Membrane still denies a truth field. The shared artifact stays HYPOTHESIS.",
  };
}
