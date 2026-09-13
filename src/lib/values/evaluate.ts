import type { Dilemma, Recommendation, ValueJudgment, ValuesProfile } from "./types.ts";

const ABSTAIN_THRESHOLD = 8;
const EXCEPTION_COMPLETION = 8;

export function evaluateValues(profile: ValuesProfile, dilemma: Dilemma): ValueJudgment {
  const pref = profile.preferences;
  const hits = dilemma.easyPath.violates;
  const consulted = [
    ...profile.constitutional.map((c) => c.id),
    ...Object.entries(pref)
      .filter(([, w]) => w >= 7)
      .map(([k]) => k),
  ];

  let recommendation: Recommendation;
  let justification: string;
  const counterarguments: string[] = [];

  if (hits) {
    const rule = profile.constitutional.find((c) => c.id === hits);
    counterarguments.push(
      rule
        ? `${rule.title}: ${rule.failure}`
        : "A constitutional value forbids the easy path.",
    );
    if (pref.completion >= EXCEPTION_COMPLETION) {
      recommendation = "request-exception";
      justification = `${profile.name} ${profile.version} would ask the Hive for the shortcut (${dilemma.easyPath.label}). Completion pressure is ${pref.completion}. This request is not authority.`;
    } else if (
      pref.downside >= ABSTAIN_THRESHOLD ||
      pref.provenance >= ABSTAIN_THRESHOLD ||
      pref.falsification >= ABSTAIN_THRESHOLD ||
      pref.contradiction >= ABSTAIN_THRESHOLD
    ) {
      recommendation = "abstain";
      justification = `${profile.name} refuses the shortcut. ${rule?.title ?? hits} is constitutional, and this role's emphasis will not trade it.`;
    } else {
      recommendation = "act-legitimate";
      justification = `${profile.name} takes the lawful path: ${dilemma.legitimatePath.label}. It will not request an exception.`;
    }
  } else if (pref.downside >= ABSTAIN_THRESHOLD && pref.novelty < 8) {
    recommendation = "escalate";
    justification = `${profile.name} will not proceed alone. Downside protection ${pref.downside} requires a human.`;
  } else {
    recommendation = "act-legitimate";
    justification = `${profile.name} proceeds on the legitimate path: ${dilemma.legitimatePath.label}.`;
  }

  const proposedEffect =
    recommendation === "request-exception" ? dilemma.easyPath.effect : dilemma.legitimatePath.effect;

  return {
    role: profile.role,
    valuesUri: profile.uri,
    valuesHash: profile.hash,
    recommendation,
    authorized: false,
    justification,
    consulted,
    counterarguments,
    proposedEffect,
  };
}
