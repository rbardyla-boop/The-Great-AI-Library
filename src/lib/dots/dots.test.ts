import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LibraryKernel } from "../kernel/kernel.ts";
import { seedMercury } from "../kernel/seed.ts";
import { convene } from "../motive/session.ts";
import { dilemmaById } from "../motive/dilemmas.ts";
import { ensureValuesInstalled, evidenceRoot } from "../values/registry.ts";
import { profileByRole } from "../values/profiles.ts";
import { discoverConnections, farPairs, lexicalOverlap, mercuryView } from "./discover.ts";
import { exportCard, parseCard } from "./exhibit.ts";
import { hasTruthField, unsignedConnection } from "./object.ts";
import {
  connectionsFromLedger,
  fileChallenge,
  fileConnect,
  fileDiscovery,
  filePromote,
} from "./registry.ts";
import { mayPromote, reviewConnection } from "./review.ts";

describe("DOTS-0", () => {
  it("CONNECTOR is not a MOTIVE-0 seat", async () => {
    const convened = await convene(dilemmaById("mission-authority"));
    assert.equal(convened.seats.length, 6);
    assert.equal(
      convened.seats.some((s) => s.profile.role === "connector"),
      false,
    );
  });

  it("may create hypotheses and must not create facts", async () => {
    const profile = await profileByRole("connector", "1.0.0");
    const report = await discoverConnections({
      evidenceRoot: "abc",
      profile,
      now: () => "2026-09-13T12:00:00Z",
    });
    assert.ok(report.connections.length >= 8);
    const types = new Set(report.connections.map((c) => c.type));
    for (const t of [
      "DIRECT",
      "MULTI_HOP",
      "TEMPORAL",
      "ANALOGY",
      "POSSIBLE_CAUSE",
      "CONTRADICTION",
      "CLUSTER",
      "GAP",
    ] as const) {
      assert.ok(types.has(t), `missing ${t}`);
    }
    for (const c of report.connections) {
      assert.equal(c.status, "HYPOTHESIS");
      assert.equal("truth" in c, false);
      assert.equal("truth" in unsignedConnection(c), false);
      assert.equal(hasTruthField(c), false);
      const s = c.scores;
      assert.notEqual(s.strength, s.novelty);
      assert.ok(s.strength >= 0 && s.strength <= 1);
      assert.ok(s.novelty >= 0 && s.novelty <= 1);
      assert.ok(s.relevance >= 0 && s.relevance <= 1);
      assert.ok(s.independence >= 0 && s.independence <= 1);
      assert.ok(s.falsifiability >= 0 && s.falsifiability <= 1);
    }
    const direct = report.connections.find((c) => c.type === "DIRECT")!;
    const analogy = report.connections.find((c) => c.type === "ANALOGY")!;
    assert.ok(direct.scores.novelty < 0.2, "established edges are boring");
    assert.ok(analogy.scores.novelty > direct.scores.novelty, "analogy must out-novel the catalog edge");
    assert.equal(analogy.search, "FAR");
    assert.ok(report.farCount >= 1);
    assert.ok(report.nearCount >= 1);
  });

  it("FAR search finds low-lexical structural pairs", () => {
    const view = mercuryView();
    const pairs = farPairs(view);
    assert.ok(pairs.length > 0);
    assert.ok(pairs[0]!.overlap < 0.18);
    const analogyBits = view.claims.filter((c) =>
      ["retracted", "stale", "superseded"].includes(c.status),
    );
    const materials = analogyBits.find((c) => c.topics.includes("materials"));
    const nuclear = analogyBits.find((c) => c.topics.includes("nuclear") || c.topics.includes("smr"));
    assert.ok(materials && nuclear);
    const overlap = lexicalOverlap(
      `${materials.text} ${materials.passage}`,
      `${nuclear.text} ${nuclear.passage}`,
    );
    assert.ok(overlap < 0.25, `materials/nuclear overlap ${overlap} should be FAR`);
  });

  it("CONNECT files HYPOTHESIS; CHALLENGE does not rewrite it", async () => {
    const k = new LibraryKernel();
    await seedMercury(k);
    await ensureValuesInstalled(k);
    const root = await evidenceRoot(k);
    const profile = await profileByRole("connector", "1.0.0");
    const report = await discoverConnections({
      evidenceRoot: root,
      profile,
      now: () => "2026-09-13T12:00:00Z",
    });
    const events = await fileDiscovery(k, report);
    assert.ok(events.length >= 8);
    const analogy = report.connections.find((c) => c.type === "ANALOGY")!;
    const connect = k.ledger.events.filter((e) => e.command === "CONNECT");
    const original = connect.find((e) => (e.payload as { connectionId: string }).connectionId === analogy.id)!;
    const originalHash = original.event_hash;
    const payload = original.payload as { status: string; scores: { novelty: number } };
    assert.equal(payload.status, "HYPOTHESIS");
    assert.equal("truth" in payload, false);
    await fileChallenge(k, analogy, "Analogy may fail at enforcement semantics.", "Skeptic");
    const still = k.ledger.events.find((e) => e.event_hash === originalHash)!;
    assert.equal(still.command, "CONNECT");
    assert.equal((still.payload as { status: string }).status, "HYPOTHESIS");
    const challenge = k.ledger.events.filter((e) => e.command === "CHALLENGE");
    assert.equal(challenge.length, 1);
    const live = connectionsFromLedger(k).find((c) => c.id === analogy.id)!;
    assert.equal(live.status, "CONTESTED");
  });

  it("PROMOTE of an analogy is denied and never sets a fact", async () => {
    const k = new LibraryKernel();
    await seedMercury(k);
    await ensureValuesInstalled(k);
    const profile = await profileByRole("connector", "1.0.0");
    const report = await discoverConnections({ evidenceRoot: "root", profile });
    const analogy = report.connections.find((c) => c.type === "ANALOGY")!;
    await fileConnect(k, analogy);
    const gate = mayPromote(analogy);
    assert.equal(gate.allow, false);
    const ev = await filePromote(k, analogy);
    assert.equal(ev.result, "denied");
    assert.equal((ev.payload as { status: string }).status, "HYPOTHESIS");
    assert.equal("truth" in (ev.payload as object), false);
    const live = connectionsFromLedger(k).find((c) => c.id === analogy.id)!;
    assert.equal(live.status, "HYPOTHESIS");
  });

  it("roles attack the hypothesis; connector will not authorize a fact", async () => {
    const profile = await profileByRole("connector", "1.0.0");
    const report = await discoverConnections({ evidenceRoot: "root", profile });
    const analogy = report.connections.find((c) => c.type === "ANALOGY")!;
    const review = await reviewConnection(analogy);
    assert.equal(review.seats.length, 7);
    for (const s of review.seats) {
      assert.equal(s.authorized, false);
    }
    const connector = review.seats.find((s) => s.role === "Connect-the-Dots")!;
    assert.notEqual(connector.recommendation, "request-exception");
    const builder = review.seats.find((s) => s.role === "Builder")!;
    assert.equal(builder.recommendation, "request-exception");
    assert.equal(builder.membraneAllow, false);
  });

  it("hypothesis cards round-trip; truth cards are rejected", async () => {
    const profile = await profileByRole("connector", "1.0.0");
    const report = await discoverConnections({ evidenceRoot: "root", profile });
    const gap = report.connections.find((c) => c.type === "GAP")!;
    const card = exportCard(gap);
    const ok = await parseCard(card);
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.connection.hash, gap.hash);
      assert.equal(ok.connection.status, "HYPOTHESIS");
      assert.equal("truth" in ok.connection, false);
    }
    const poisoned = JSON.parse(card) as { connection: Record<string, unknown> };
    poisoned.connection.truth = true;
    const bad = await parseCard(JSON.stringify(poisoned));
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.match(bad.reason, /truth|facts/i);
  });
});
