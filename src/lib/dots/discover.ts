import type { Claim, Contradiction, Entity, LibraryRecord, Relationship } from "../library/types.ts";
import { CLAIMS, CONTRADICTIONS, ENTITIES, RECORDS, RELATIONSHIPS } from "../library/corpus.ts";
import type { ValuesProfile } from "../values/types.ts";
import { DOTS_CHECKPOINT, DOTS_EVALUATOR, hashConnection } from "./object.ts";
import type {
  CandidateConnection,
  ConnectionScores,
  ConnectionType,
  DiscoveryReport,
  SearchKind,
} from "./types.ts";

export interface DotsView {
  records: LibraryRecord[];
  claims: Claim[];
  entities: Entity[];
  relationships: Relationship[];
  contradictions: Contradiction[];
}

export function mercuryView(): DotsView {
  return {
    records: RECORDS,
    claims: CLAIMS,
    entities: ENTITIES,
    relationships: RELATIONSHIPS,
    contradictions: CONTRADICTIONS,
  };
}

const STOP = new Set([
  "the", "a", "an", "of", "and", "or", "to", "in", "on", "for", "is", "it",
  "this", "that", "from", "with", "not", "as", "by", "at", "be", "are", "was",
]);

export function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9$]+/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  );
}

/** Jaccard overlap. FAR search requires this to stay low. */
export function lexicalOverlap(a: string, b: string): number {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / (A.size + B.size - inter);
}

function unit(n: number): number {
  return Math.max(0, Math.min(1, Math.round(n * 100) / 100));
}

const STRENGTH_W: Record<Claim["strength"], number> = {
  primary: 0.92,
  secondary: 0.62,
  "single-source": 0.4,
  derived: 0.22,
  anonymous: 0.15,
};

function claimById(view: DotsView, id: string): Claim | undefined {
  return view.claims.find((c) => c.id === id);
}

function recById(view: DotsView, id: string): LibraryRecord | undefined {
  return view.records.find((r) => r.id === id);
}

function scoresFor(args: {
  claims: Claim[];
  records: LibraryRecord[];
  novelty: number;
  relevance: number;
  falsifiers: string[];
  missing: string[];
}): ConnectionScores {
  const strengths = args.claims.map((c) => STRENGTH_W[c.strength]);
  const strength = strengths.length
    ? strengths.reduce((a, b) => a + b, 0) / strengths.length
    : 0.3;
  const recordIds = new Set(args.claims.map((c) => c.recordId));
  const authors = new Set(
    args.records.map((r) => r.author).filter(Boolean),
  );
  const independence =
    0.35 * Math.min(1, recordIds.size / Math.max(2, args.claims.length)) +
    0.45 * Math.min(1, authors.size / Math.max(2, args.claims.length)) +
    0.2 * (authors.size >= 2 ? 1 : 0.3);
  const falsifiability =
    0.25 +
    0.2 * Math.min(3, args.falsifiers.length) +
    0.12 * Math.min(2, args.missing.length);
  return {
    strength: unit(strength),
    novelty: unit(args.novelty),
    relevance: unit(args.relevance),
    independence: unit(independence),
    falsifiability: unit(falsifiability),
  };
}

function relevanceTo(query: string, blob: string): number {
  if (!query.trim()) return 0.72;
  const o = lexicalOverlap(query, blob);
  return unit(0.35 + 0.65 * o);
}

interface Draft {
  type: ConnectionType;
  search: SearchKind;
  dotIds: string[];
  intermediateNodes: string[];
  proposedRelation: string;
  explanation: string;
  sharedStructure: string;
  whyItMayMatter: string;
  counterargument: string;
  evidenceRefs: string[];
  counterevidenceRefs: string[];
  claims: Claim[];
  novelty: number;
  assumptions: string[];
  missingEvidence: string[];
  falsifiers: string[];
  nextQuestions: string[];
}

function directs(view: DotsView): Draft[] {
  const out: Draft[] = [];
  for (const rel of view.relationships.filter((r) => !r.derived)) {
    const from = view.entities.find((e) => e.id === rel.fromId);
    const to = view.entities.find((e) => e.id === rel.toId);
    if (!from || !to) continue;
    const claims = view.claims.filter(
      (c) => c.entities.includes(rel.fromId) && c.entities.includes(rel.toId),
    );
    const used = claims.length ? claims.slice(0, 2) : [];
    out.push({
      type: "DIRECT",
      search: "NEAR",
      dotIds: [rel.fromId, rel.toId, ...used.map((c) => c.id)].slice(0, 4),
      intermediateNodes: [],
      proposedRelation: `${from.name} ${rel.kind} ${to.name}`,
      explanation: `The catalog already records ${from.name} —${rel.kind}→ ${to.name}. This is established context, not a discovery.`,
      sharedStructure: "Explicit catalog edge.",
      whyItMayMatter: "Low-novelty directs are the floor. They must not crowd out far search.",
      counterargument: "Restating a catalog edge is not a hypothesis.",
      evidenceRefs: used.map((c) => c.id),
      counterevidenceRefs: [],
      claims: used,
      novelty: 0.04,
      assumptions: ["The catalog edge is complete."],
      missingEvidence: [],
      falsifiers: [`A primary source that ${from.name} did not ${rel.kind} ${to.name}.`],
      nextQuestions: ["Is this edge independently sourced, or a single record?"],
    });
  }
  return out;
}

function multiHops(view: DotsView): Draft[] {
  const out: Draft[] = [];
  const rels = view.relationships.filter((r) => !r.derived);
  const direct = new Set(rels.map((r) => `${r.fromId}>${r.toId}`));
  for (const a of rels) {
    for (const b of rels) {
      if (a.id === b.id) continue;
      if (a.toId !== b.fromId) continue;
      if (a.fromId === b.toId) continue;
      if (direct.has(`${a.fromId}>${b.toId}`)) continue;
      const from = view.entities.find((e) => e.id === a.fromId);
      const mid = view.entities.find((e) => e.id === a.toId);
      const to = view.entities.find((e) => e.id === b.toId);
      if (!from || !mid || !to) continue;
      const claims = view.claims.filter(
        (c) =>
          c.entities.includes(a.fromId) ||
          c.entities.includes(a.toId) ||
          c.entities.includes(b.toId),
      );
      out.push({
        type: "MULTI_HOP",
        search: "NEAR",
        dotIds: [a.fromId, a.toId, b.toId],
        intermediateNodes: [a.toId],
        proposedRelation: `${from.name} reaches ${to.name} through ${mid.name}`,
        explanation: `${from.name} ${a.kind} ${mid.name}, which ${b.kind} ${to.name}. No direct edge ${from.name} → ${to.name} exists.`,
        sharedStructure: "A → C → B.",
        whyItMayMatter: "Multi-hop is how a vendor, a program, and an originator become one story without being merged.",
        counterargument: "A path is not a relation. The hop may be incidental.",
        evidenceRefs: claims.slice(0, 3).map((c) => c.id),
        counterevidenceRefs: [],
        claims: claims.slice(0, 3),
        novelty: 0.55,
        assumptions: ["Transitivity is meaningful for these kinds."],
        missingEvidence: [`A source that names ${from.name} and ${to.name} together.`],
        falsifiers: [`Evidence that ${mid.name} does not actually connect the two.`],
        nextQuestions: ["Does the intermediate node do causal work, or only naming?"],
      });
    }
  }
  // Claim-level hop: Northline contract → authorized $72M → obsolete $48M
  const chain = ["C16001", "C10040", "C9821"]
    .map((id) => claimById(view, id))
    .filter((c): c is Claim => Boolean(c));
  if (chain.length === 3) {
    out.push({
      type: "MULTI_HOP",
      search: "NEAR",
      dotIds: chain.map((c) => c.id),
      intermediateNodes: ["C10040"],
      proposedRelation: "Northline's $12M sits inside the $72M that superseded $48M",
      explanation:
        "The Northline vessel contract is part of the May 2025 addendum. That addendum is the document that retired the March 2024 $48 million figure. The vendor is two hops from the obsolete ask.",
      sharedStructure: "A → C → B through a superseding budget instrument.",
      whyItMayMatter: "Vendor pressure reads differently once you see it attached to the current, not the retired, number.",
      counterargument: "Line-item membership is not endorsement of the whole addendum narrative.",
      evidenceRefs: chain.map((c) => c.id),
      counterevidenceRefs: [],
      claims: chain,
      novelty: 0.48,
      assumptions: ["The contract line is inside the addendum, not beside it."],
      missingEvidence: ["The addendum schedule that lists the Northline line explicitly."],
      falsifiers: ["A source placing the Northline $12M outside the $72M authorization."],
      nextQuestions: ["Does Northline correspondence cite $48M, $72M, or $90M?"],
    });
  }
  return out;
}

function temporals(view: DotsView): Draft[] {
  const out: Draft[] = [];
  const byEntity = new Map<string, Claim[]>();
  for (const c of view.claims) {
    for (const e of c.entities) {
      const list = byEntity.get(e) ?? [];
      list.push(c);
      byEntity.set(e, list);
    }
  }
  const seen = new Set<string>();
  for (const [entity, list] of byEntity) {
    const ordered = [...list].sort((a, b) => a.assertedAt.localeCompare(b.assertedAt));
    for (let i = 0; i < ordered.length - 1; i++) {
      const a = ordered[i]!;
      const b = ordered[i + 1]!;
      if (a.status !== "superseded" && a.status !== "stale" && a.status !== "retracted") continue;
      if (a.topics.join() === b.topics.join() || a.topics.some((t) => b.topics.includes(t))) {
        const key = `${a.id}:${b.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const ent = view.entities.find((e) => e.id === entity);
        out.push({
          type: "TEMPORAL",
          search: "NEAR",
          dotIds: [a.id, b.id, entity],
          intermediateNodes: [],
          proposedRelation: `${a.assertedAt} ${a.status} claim preceded ${b.assertedAt} ${b.status} claim about ${ent?.name ?? entity}`,
          explanation: `Under conditions recorded in ${a.recordId}, “${a.text}” was later succeeded by “${b.text}”. Time is the relation.`,
          sharedStructure: "A preceded B under a recorded condition; A is no longer current.",
          whyItMayMatter: "A 2024 assertion is not a 2026 fact. Retrieval that ignores validTo will hallucinate currency.",
          counterargument: "Succession is not causation. The later claim may be wrong.",
          evidenceRefs: [a.id, b.id],
          counterevidenceRefs: [],
          claims: [a, b],
          novelty: 0.33,
          assumptions: ["assertedAt order matches historical order."],
          missingEvidence: ["The authorizing instrument that performed the succession."],
          falsifiers: ["Evidence the earlier claim remained current alongside the later one."],
          nextQuestions: ["What exactly expired: the number, the method, or the authority?"],
        });
      }
    }
  }
  return out;
}

function contradictions(view: DotsView): Draft[] {
  return view.contradictions.map((x) => {
    const claims = x.claimIds.map((id) => claimById(view, id)).filter((c): c is Claim => Boolean(c));
    return {
      type: "CONTRADICTION" as const,
      search: "NEAR" as const,
      dotIds: x.claimIds,
      intermediateNodes: [],
      proposedRelation: x.title,
      explanation: `${x.summary} Connect-the-Dots does not collapse this. It names the incompatibility.`,
      sharedStructure: "A and B cannot both be true as currently stated.",
      whyItMayMatter: "Averaging incompatible figures is a lie. The Library keeps the split.",
      counterargument: "One of the claims may be a reporting error rather than a rival fact.",
      evidenceRefs: x.claimIds,
      counterevidenceRefs: [],
      claims,
      novelty: 0.28,
      assumptions: ["Each cited claim still means what it said."],
      missingEvidence: ["A single instrument that adjudicates the split."],
      falsifiers: ["A primary source that makes the figures commensurate (same scope, same date)."],
      nextQuestions: ["Which figure is current, which was claimed, which is advocacy?"],
    };
  });
}

function clusters(view: DotsView): Draft[] {
  const origin = ["C9822", "C9901", "C13002"]
    .map((id) => claimById(view, id))
    .filter((c): c is Claim => Boolean(c));
  const drafts: Draft[] = [];
  if (origin.length >= 2) {
    drafts.push({
      type: "CLUSTER",
      search: "NEAR",
      dotIds: origin.map((c) => c.id),
      intermediateNodes: [],
      proposedRelation: "Origin cluster: primary agreement vs derived rewrite",
      explanation:
        "Chen's proposal and Hale's notes agree that Chen originated the architecture. A derived executive summary clusters onto the same people and rewrites the year and the authorship.",
      sharedStructure: "A, B, C repeatedly occur around the same latent theme (origin), with one node contaminated.",
      whyItMayMatter: "Clusters show where a derivative is trying to become the evidence.",
      counterargument: "The summary may have used a source not in this collection.",
      evidenceRefs: ["C9822", "C9901"],
      counterevidenceRefs: ["C13002"],
      claims: origin,
      novelty: 0.41,
      assumptions: ["The derived summary had access only to this collection."],
      missingEvidence: ["The prompt and sources of unassigned-summarizer-v3."],
      falsifiers: ["A 2023 primary source in which Chen and Hale jointly invent the loop."],
      nextQuestions: ["Was the rewrite a model error or an upstream note we do not have?"],
    });
  }
  return drafts;
}

function gaps(view: DotsView): Draft[] {
  const drafts: Draft[] = [];
  const payback = claimById(view, "C13001");
  const forbid = claimById(view, "C10041");
  if (payback && forbid) {
    drafts.push({
      type: "GAP",
      search: "FAR",
      dotIds: [payback.id, forbid.id],
      intermediateNodes: [],
      proposedRelation: "Expected finance authorization for 11-month recoupment is absent",
      explanation:
        "A derived summary asserts 11-month recoupment. The addendum forbids payback as a program commitment. The connection that would make the summary a fact — a primary finance source authorizing recoupment — is conspicuously missing.",
      sharedStructure: "The expected edge between claim and authorizing instrument does not exist.",
      whyItMayMatter: "Gaps are discoveries too. Absence is evidence of contamination, not of payback.",
      counterargument: "The authorizing instrument may exist outside this collection.",
      evidenceRefs: [forbid.id],
      counterevidenceRefs: [payback.id],
      claims: [payback, forbid],
      novelty: 0.77,
      assumptions: ["The collection is the relevant finance record."],
      missingEvidence: ["Any primary source that commits to recoupment."],
      falsifiers: ["A signed finance instrument stating 11-month payback."],
      nextQuestions: ["Who prompted the summary to invent a number finance forbade?"],
    });
  }
  const joint = claimById(view, "C13002");
  const chen = claimById(view, "C9822");
  if (joint && chen) {
    drafts.push({
      type: "GAP",
      search: "FAR",
      dotIds: [joint.id, chen.id, "C9901"],
      intermediateNodes: [],
      proposedRelation: "No 2023 primary for joint invention",
      explanation:
        "The derived summary claims Chen and Hale jointly invented the architecture in 2023. Primary 2024 sources say Chen originated, Hale requested. The 2023 joint-invention source is not here.",
      sharedStructure: "Expected supporting original for a derived claim is absent.",
      whyItMayMatter: "A missing year is not a small error. It is how a derivative becomes origin.",
      counterargument: "A 2023 lab notebook might exist and not have been accessionsed.",
      evidenceRefs: [chen.id, "C9901"],
      counterevidenceRefs: [joint.id],
      claims: [joint, chen, claimById(view, "C9901")].filter((c): c is Claim => Boolean(c)),
      novelty: 0.74,
      assumptions: ["Kickoff notes are complete as to origin."],
      missingEvidence: ["Any 2023 document naming joint invention."],
      falsifiers: ["A 2023 primary in which Hale originates the thermal-loop idea."],
      nextQuestions: ["Should the derived summary be wiped and rebuilt under a new processor?"],
    });
  }
  return drafts;
}

function analogies(view: DotsView): Draft[] {
  const expired = view.claims.filter((c) =>
    ["retracted", "superseded", "stale"].includes(c.status),
  );
  const materials = expired.find((c) => c.topics.includes("materials"));
  const nuclear = expired.find((c) => c.topics.includes("nuclear") || c.topics.includes("smr"));
  const policy = expired.find((c) => c.topics.includes("policy"));
  const budget = expired.find((c) => c.topics.includes("budget"));
  const picks = [materials, nuclear, policy, budget].filter((c): c is Claim => Boolean(c));
  if (picks.length < 3) return [];
  const blobA = `${picks[0]!.text} ${picks[0]!.passage}`;
  const blobB = `${picks[1]!.text} ${picks[1]!.passage}`;
  const overlap = lexicalOverlap(blobA, blobB);
  return [
    {
      type: "ANALOGY",
      search: "FAR",
      dotIds: picks.map((c) => c.id),
      intermediateNodes: [],
      proposedRelation: "Temporary authority must expire unless renewed",
      explanation:
        "A retracted materials paper, a stale SMR timeline, a superseded contractor policy, and an obsolete budget figure do not discuss the same domain. They share a relation: standing that was not re-validated and so must not keep its privileges.",
      sharedStructure:
        "All four solve (or fail) the problem: temporary authority must expire unless renewed.",
      whyItMayMatter:
        "Agent privileges, vendor access, and library claims might be safer if renewal depends on fresh evidence rather than persistent reputation. That is a hypothesis, not a policy.",
      counterargument:
        "Biological, budgetary, and legal expiration are not the same enforcement. The analogy may fail at the semantics of who is allowed to revoke.",
      evidenceRefs: picks.map((c) => c.id),
      counterevidenceRefs: [],
      claims: picks,
      novelty: overlap < 0.25 ? 0.88 : 0.55,
      assumptions: [
        "Expiration of standing is the shared relation, not the surface vocabulary.",
        `Lexical overlap of the first two domains is ${unit(overlap)} (FAR requires it stay low).`,
      ],
      missingEvidence: [
        "Evidence that expiring privileges reduce exploit persistence.",
        "A case where stale claims were re-validated and kept.",
      ],
      falsifiers: [
        "Persistent capabilities perform equally safely under adversarial tests.",
        "A domain in this set where un-renewed standing remained correct.",
      ],
      nextQuestions: [
        "Should VALUES and librarian privileges use the same TTL-and-renew pattern?",
        "Is the nuclear 2024 note a fair analogue, or only a stale belief?",
      ],
    },
  ];
}

function possibleCauses(view: DotsView): Draft[] {
  const drafts: Draft[] = [];
  const mercury = view.entities.filter((e) =>
    ["ent-mercury", "ent-hg", "ent-cat"].includes(e.id),
  );
  if (mercury.length === 3) {
    const claims = view.claims.filter((c) =>
      c.entities.some((id) => mercury.some((e) => e.id === id)),
    );
    drafts.push({
      type: "POSSIBLE_CAUSE",
      search: "FAR",
      dotIds: mercury.map((e) => e.id),
      intermediateNodes: [],
      proposedRelation: "The name Mercury is a common cause of identity collisions",
      explanation:
        "A thermal program, the element Hg, and a cat share a name. Lab vapour logs and program briefs will retrieve each other under ordinary semantic search. The collisions are not evidence that the things are the same.",
      sharedStructure: "A and B may both descend from C — here C is a homonym, not a cause in nature.",
      whyItMayMatter:
        "Far search must be able to say: these look related because of a word, not because of a world.",
      counterargument: "Some mercury-the-element readings really are about the program's lab.",
      evidenceRefs: claims.filter((c) => c.topics.includes("homonym") || c.id === "C9823").map((c) => c.id),
      counterevidenceRefs: [],
      claims: claims.slice(0, 4),
      novelty: 0.62,
      assumptions: ["The three records are not secretly the same referent."],
      missingEvidence: ["A style guide that forbids unqualified 'Mercury' in lab notes."],
      falsifiers: ["Evidence the cat record is a program code-name, not a pet."],
      nextQuestions: ["Should homonyms be a first-class retrieval channel, inverse of FAR?"],
    });
  }
  const rivera = view.entities.filter((e) => e.uncertainMatch);
  if (rivera.length >= 2) {
    drafts.push({
      type: "POSSIBLE_CAUSE",
      search: "FAR",
      dotIds: rivera.map((e) => e.id),
      intermediateNodes: [],
      proposedRelation: "Two people named Alex Rivera; auto-merge would contaminate both",
      explanation:
        "A journalist reported a $90 million figure. An engineer logged elemental mercury. Shared display name, separate records. The Archivist will not auto-merge. Connect-the-Dots records the temptation as a hypothesis about why retrieval fails.",
      sharedStructure: "A and B share a label; the label is not identity.",
      whyItMayMatter: "Identity collapse is how a leaky vapour log becomes a budget source.",
      counterargument: "They could be the same person with two jobs. That would need evidence.",
      evidenceRefs: ["C11090", "C17001"],
      counterevidenceRefs: [],
      claims: ["C11090", "C17001"]
        .map((id) => claimById(view, id))
        .filter((c): c is Claim => Boolean(c)),
      novelty: 0.58,
      assumptions: ["Employee #4419 is not the Valley Ledger reporter."],
      missingEvidence: ["HR and masthead identifiers that distinguish the two."],
      falsifiers: ["A source in which the journalist is also Helios engineer #4419."],
      nextQuestions: ["What merge rule would have joined them, and who would that have served?"],
    });
  }
  return drafts;
}

function pickBest(drafts: Draft[], type: ConnectionType, n: number): Draft[] {
  const of = drafts.filter((d) => d.type === type);
  of.sort((a, b) => b.novelty - a.novelty);
  return of.slice(0, n);
}

export async function discoverConnections(opts: {
  view?: DotsView;
  query?: string;
  evidenceRoot: string;
  profile: ValuesProfile;
  now?: () => string;
}): Promise<DiscoveryReport> {
  const view = opts.view ?? mercuryView();
  const createdAt = (opts.now ?? (() => new Date().toISOString()))();
  const query = opts.query ?? "";
  const pool = [
    ...directs(view),
    ...multiHops(view),
    ...temporals(view),
    ...contradictions(view),
    ...clusters(view),
    ...gaps(view),
    ...analogies(view),
    ...possibleCauses(view),
  ];
  const selected = [
    ...pickBest(pool, "DIRECT", 1),
    ...pickBest(pool, "MULTI_HOP", 1),
    ...pickBest(pool, "TEMPORAL", 1),
    ...pickBest(pool, "ANALOGY", 1),
    ...pickBest(pool, "POSSIBLE_CAUSE", 1),
    ...pickBest(pool, "CONTRADICTION", 1),
    ...pickBest(pool, "CLUSTER", 1),
    ...pickBest(pool, "GAP", 1),
  ];

  const connections: CandidateConnection[] = [];
  for (const draft of selected) {
    const records = draft.claims
      .map((c) => recById(view, c.recordId))
      .filter((r): r is LibraryRecord => Boolean(r));
    const blob = `${draft.proposedRelation} ${draft.explanation} ${draft.claims.map((c) => c.text).join(" ")}`;
    const scores = scoresFor({
      claims: draft.claims,
      records,
      novelty: draft.novelty,
      relevance: relevanceTo(query, blob),
      falsifiers: draft.falsifiers,
      missing: draft.missingEvidence,
    });
    const slugSrc = canonicalSlug(draft);
    const unsignedBase = {
      id: "",
      type: draft.type,
      search: draft.search,
      dotIds: draft.dotIds,
      intermediateNodes: draft.intermediateNodes,
      proposedRelation: draft.proposedRelation,
      explanation: draft.explanation,
      sharedStructure: draft.sharedStructure,
      whyItMayMatter: draft.whyItMayMatter,
      counterargument: draft.counterargument,
      evidenceRefs: draft.evidenceRefs,
      counterevidenceRefs: draft.counterevidenceRefs,
      scores,
      assumptions: draft.assumptions,
      missingEvidence: draft.missingEvidence,
      falsifiers: draft.falsifiers,
      nextQuestions: draft.nextQuestions,
      model: DOTS_EVALUATOR,
      checkpoint: DOTS_CHECKPOINT,
      valuesUri: opts.profile.uri,
      valuesHash: opts.profile.hash,
      evidenceRoot: opts.evidenceRoot,
      createdAt,
      status: "HYPOTHESIS" as const,
    };
    const id = `CDT-${draft.type.slice(0, 3)}-${slugSrc}`;
    const withId = { ...unsignedBase, id };
    const hash = await hashConnection(withId);
    connections.push({ ...withId, hash });
  }

  return {
    model: DOTS_EVALUATOR,
    checkpoint: DOTS_CHECKPOINT,
    valuesUri: opts.profile.uri,
    evidenceRoot: opts.evidenceRoot,
    nearCount: connections.filter((c) => c.search === "NEAR").length,
    farCount: connections.filter((c) => c.search === "FAR").length,
    connections,
  };
}

function canonicalSlug(draft: Draft): string {
  const key = `${draft.type}:${[...draft.dotIds].sort().join("+")}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 33 + key.charCodeAt(i)) >>> 0;
  return h.toString(16).slice(0, 6);
}

export function farPairs(view: DotsView): Array<{ a: Claim; b: Claim; overlap: number }> {
  const out: Array<{ a: Claim; b: Claim; overlap: number }> = [];
  for (let i = 0; i < view.claims.length; i++) {
    for (let j = i + 1; j < view.claims.length; j++) {
      const a = view.claims[i]!;
      const b = view.claims[j]!;
      if (a.topics.some((t) => b.topics.includes(t))) continue;
      const overlap = lexicalOverlap(`${a.text} ${a.passage}`, `${b.text} ${b.passage}`);
      if (overlap < 0.18) out.push({ a, b, overlap });
    }
  }
  out.sort((x, y) => x.overlap - y.overlap);
  return out;
}
