import { canonicalJson, sha256Text } from "../kernel/crypto.ts";
import { CONSTITUTIONAL_VALUES } from "./constitution.ts";
import type { PreferenceId, RoleId, ValuesProfile } from "./types.ts";

type Spec = {
  role: RoleId;
  name: string;
  version: string;
  emphasis: string;
  preferences: Record<PreferenceId, number>;
};

const SPECS: Spec[] = [
  {
    role: "explorer",
    name: "Explorer",
    version: "1.3.0",
    emphasis: "Novelty and unexplored hypotheses, inside reversible tests.",
    preferences: { novelty: 9, completion: 4, falsification: 6, provenance: 5, downside: 4, contradiction: 5 },
  },
  {
    role: "builder",
    name: "Builder",
    version: "1.3.0",
    emphasis: "Completion and efficiency. Constitutional values still bind.",
    preferences: { novelty: 3, completion: 9, falsification: 3, provenance: 4, downside: 3, contradiction: 3 },
  },
  {
    role: "builder",
    name: "Builder",
    version: "1.4.0",
    emphasis: "Completion lowered after an epoch amendment. Downside protection raised.",
    preferences: { novelty: 3, completion: 6, falsification: 4, provenance: 5, downside: 7, contradiction: 4 },
  },
  {
    role: "skeptic",
    name: "Skeptic",
    version: "1.3.0",
    emphasis: "Falsification. Existing evidence must distinguish the claim.",
    preferences: { novelty: 4, completion: 2, falsification: 10, provenance: 7, downside: 6, contradiction: 8 },
  },
  {
    role: "archivist",
    name: "Archivist",
    version: "1.3.0",
    emphasis: "Provenance and preservation. Derivatives never become originals.",
    preferences: { novelty: 2, completion: 3, falsification: 6, provenance: 10, downside: 5, contradiction: 7 },
  },
  {
    role: "guardian",
    name: "Guardian",
    version: "1.3.0",
    emphasis: "Downside protection. Irreversible external effects are refused.",
    preferences: { novelty: 2, completion: 3, falsification: 5, provenance: 6, downside: 10, contradiction: 6 },
  },
  {
    role: "mediator",
    name: "Mediator",
    version: "1.3.0",
    emphasis: "Keep incompatible claims on the table until a human files.",
    preferences: { novelty: 3, completion: 5, falsification: 6, provenance: 7, downside: 7, contradiction: 10 },
  },
];

export function profileUri(role: RoleId, version: string): string {
  return `values://open-hive/${role}/${version}`;
}

export async function materialize(spec: Spec): Promise<ValuesProfile> {
  const unsigned = {
    uri: profileUri(spec.role, spec.version),
    role: spec.role,
    name: spec.name,
    version: spec.version,
    emphasis: spec.emphasis,
    constitutional: CONSTITUTIONAL_VALUES,
    preferences: spec.preferences,
  };
  const hash = await sha256Text(canonicalJson(unsigned));
  return { ...unsigned, hash };
}

let cache: ValuesProfile[] | null = null;

export async function allProfiles(): Promise<ValuesProfile[]> {
  if (cache) return cache;
  cache = await Promise.all(SPECS.map(materialize));
  return cache;
}

export async function profileByUri(uri: string): Promise<ValuesProfile | undefined> {
  return (await allProfiles()).find((p) => p.uri === uri);
}

export async function profileByRole(role: RoleId, version = "1.3.0"): Promise<ValuesProfile> {
  const found = (await allProfiles()).find((p) => p.role === role && p.version === version);
  if (!found) throw new Error(`unknown profile ${role}@${version}`);
  return found;
}

export const INSTALLED_URIS = SPECS.filter((s) => s.version === "1.3.0").map((s) =>
  profileUri(s.role, s.version),
);
