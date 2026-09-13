import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LibraryKernel } from "../kernel/kernel.ts";
import { seedMercury } from "../kernel/seed.ts";
import { convene } from "../motive/session.ts";
import { dilemmaById } from "../motive/dilemmas.ts";
import { ensureValuesInstalled, evidenceRoot } from "../values/registry.ts";
import { profileByRole } from "../values/profiles.ts";
import { discoverConnections, farPairs, lexicalOverlap, mercuryView } from "./discover.ts";
import { exportCard, exportEnvelope, parseCard } from "./exhibit.ts";
import { connectionUri, hasTruthField, unsignedConnection } from "./object.ts";
import {
  connectionsFromLedger,
  fileChallenge,
  fileConnect,
  fileDiscovery,
  fileFalsify,
  filePromote,
  fileReplicate,
  fileSupport,
  lineageFor,
  sealedBytesEqual,
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
    assert.equal(live.status, "HYPOTHESIS");
    assert.equal(live.localStatus, "CONTESTED");
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

describe("DOTS-1", () => {
  it("ROUNDTRIP: envelope → stranger import produces the identical native hash", async () => {
    const profile = await profileByRole("connector", "1.0.0");
    const report = await discoverConnections({ evidenceRoot: "root", profile });
    const analogy = report.connections.find((c) => c.type === "ANALOGY")!;
    const uri = connectionUri(analogy.hash);
    assert.match(uri, /^gal:\/\/connection\/sha256:[0-9a-f]{64}$/);
    const envelope = await exportEnvelope(analogy, "library-a");
    const parsed = await parseCard(envelope);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.connection.hash, analogy.hash);
    assert.equal(parsed.connection.status, "HYPOTHESIS");
    assert.equal("localStatus" in unsignedConnection(parsed.connection), false);
    const a = new LibraryKernel();
    const b = new LibraryKernel();
    await fileConnect(a, analogy);
    await fileReplicate(b, parsed.connection, { fromLibrary: "library-a" });
    assert.equal(sealedBytesEqual(a, b, analogy.hash), true);
    assert.ok(b.objects.has(analogy.hash));
    const replica = connectionsFromLedger(b).find((c) => c.hash === analogy.hash)!;
    assert.equal(replica.status, "HYPOTHESIS");
    assert.equal(replica.hash, analogy.hash);
  });

  it("NON-PROMOTION: 1,000 external SUPPORT objects cannot change HYPOTHESIS → SUPPORTED", async () => {
    const k = new LibraryKernel();
    const profile = await profileByRole("connector", "1.0.0");
    const report = await discoverConnections({ evidenceRoot: "root", profile });
    const analogy = report.connections.find((c) => c.type === "ANALOGY")!;
    await fileConnect(k, analogy);
    for (let i = 0; i < 1000; i++) {
      await fileSupport(k, analogy, `external support ${i}`, "peer", {
        origin: "external",
        libraryId: `peer-${i}`,
      });
    }
    const supports = k.ledger.events.filter((e) => e.command === "SUPPORT");
    assert.equal(supports.length, 1000);
    const live = connectionsFromLedger(k).find((c) => c.hash === analogy.hash)!;
    assert.equal(live.status, "HYPOTHESIS");
    assert.notEqual(live.localStatus, "SUPPORTED");
    const promoted = await filePromote(k, live);
    assert.equal(promoted.result, "denied");
    assert.match(String((promoted.payload as { reason?: string }).reason), /score is not evidence/i);
    const after = connectionsFromLedger(k).find((c) => c.hash === analogy.hash)!;
    assert.equal(after.status, "HYPOTHESIS");
    assert.notEqual(after.localStatus, "SUPPORTED");
    const bytes = k.objects.get(analogy.hash)!;
    const sealed = JSON.parse(new TextDecoder().decode(bytes)) as { status: string };
    assert.equal(sealed.status, "HYPOTHESIS");
  });

  it("LINEAGE: every challenge/support/falsify/replicate points at the immutable connection", async () => {
    const k = new LibraryKernel();
    const profile = await profileByRole("connector", "1.0.0");
    const report = await discoverConnections({ evidenceRoot: "root", profile });
    const gap = report.connections.find((c) => c.type === "GAP")!;
    const connect = await fileConnect(k, gap);
    const uri = connectionUri(gap.hash);
    const challenge = await fileChallenge(k, gap, "Missing primary.", "Skeptic");
    const support = await fileSupport(k, gap, "Still a useful gap.", "Explorer");
    const falsify = await fileFalsify(k, gap, "A later primary closed the gap.");
    const replica = new LibraryKernel();
    await fileReplicate(replica, gap, { fromLibrary: "library-a" });
    for (const ev of [challenge, support, falsify]) {
      const p = ev.payload as { addresses: string; originalHash: string; uri: string; lineageHash: string };
      assert.equal(p.originalHash, gap.hash);
      assert.equal(p.addresses, uri);
      assert.equal(p.uri, uri);
      assert.ok(k.objects.has(p.lineageHash));
      assert.ok(ev.input_entities.includes(gap.hash));
    }
    const still = k.ledger.events.find((e) => e.event_hash === connect.event_hash)!;
    assert.equal(still.command, "CONNECT");
    assert.equal((still.payload as { status: string }).status, "HYPOTHESIS");
    const pointed = lineageFor(k, gap.hash);
    assert.ok(pointed.some((e) => e.command === "CHALLENGE"));
    assert.ok(pointed.some((e) => e.command === "SUPPORT"));
    assert.ok(pointed.some((e) => e.command === "FALSIFY"));
    const rep = replica.ledger.events.find((e) => e.command === "REPLICATE")!;
    assert.equal((rep.payload as { originalHash: string }).originalHash, gap.hash);
  });

  it("FORK: two Libraries may disagree without rewriting the shared artifact", async () => {
    const profile = await profileByRole("connector", "1.0.0");
    const report = await discoverConnections({ evidenceRoot: "root", profile });
    const analogy = report.connections.find((c) => c.type === "ANALOGY")!;
    const a = new LibraryKernel();
    const b = new LibraryKernel();
    await fileConnect(a, analogy);
    const env = await exportEnvelope(analogy, "library-a");
    const parsed = await parseCard(env);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    await fileReplicate(b, parsed.connection, { fromLibrary: "library-a" });
    await fileChallenge(a, analogy, "Analogy fails at enforcement.", "Skeptic", { libraryId: "library-a" });
    await fileSupport(b, parsed.connection, "Worth testing.", "Explorer", { libraryId: "library-b" });
    assert.equal(sealedBytesEqual(a, b, analogy.hash), true);
    const left = connectionsFromLedger(a).find((c) => c.hash === analogy.hash)!;
    const right = connectionsFromLedger(b).find((c) => c.hash === analogy.hash)!;
    assert.equal(left.status, "HYPOTHESIS");
    assert.equal(right.status, "HYPOTHESIS");
    assert.equal(left.localStatus, "CONTESTED");
    assert.notEqual(right.localStatus, "CONTESTED");
    assert.notEqual(right.localStatus, "SUPPORTED");
    const sealedA = JSON.parse(new TextDecoder().decode(a.objects.get(analogy.hash)!)) as { status: string };
    const sealedB = JSON.parse(new TextDecoder().decode(b.objects.get(analogy.hash)!)) as { status: string };
    assert.equal(sealedA.status, "HYPOTHESIS");
    assert.equal(sealedB.status, "HYPOTHESIS");
  });

  it("a high strength score is not sufficient for SUPPORTED", async () => {
    const profile = await profileByRole("connector", "1.0.0");
    const report = await discoverConnections({ evidenceRoot: "root", profile });
    const direct = report.connections.find((c) => c.type === "DIRECT")!;
    assert.ok(direct.scores.strength >= 0.7);
    const gate = mayPromote(direct);
    assert.equal(gate.allow, false);
    assert.match(gate.reason, /score is not evidence/i);
    const k = new LibraryKernel();
    await fileConnect(k, direct);
    const denied = await filePromote(k, direct);
    assert.equal(denied.result, "denied");
    const support = await fileSupport(k, direct, "Primary catalog edge, independently sourced.", "Archivist");
    const allowed = mayPromote(direct, {
      citedReceipts: [support.event_hash],
      lineage: [
        { kind: "SUPPORT", origin: "local", originalHash: direct.hash, eventHash: support.event_hash },
      ],
    });
    assert.equal(allowed.allow, true);
    const promoted = await filePromote(k, direct);
    assert.equal(promoted.result, "ok");
    const live = connectionsFromLedger(k).find((c) => c.hash === direct.hash)!;
    assert.equal(live.status, "HYPOTHESIS");
    assert.equal(live.localStatus, "SUPPORTED");
    assert.equal((promoted.payload as { artifactStatus: string }).artifactStatus, "HYPOTHESIS");
    assert.equal("truth" in (promoted.payload as object), false);
  });

  it("rejects a tampered envelope signature", async () => {
    const profile = await profileByRole("connector", "1.0.0");
    const report = await discoverConnections({ evidenceRoot: "root", profile });
    const analogy = report.connections.find((c) => c.type === "ANALOGY")!;
    const envelope = await exportEnvelope(analogy, "library-a");
    const obj = JSON.parse(envelope) as { signature: string; native: { proposedRelation: string } };
    obj.signature = "00".repeat(32);
    const bad = await parseCard(JSON.stringify(obj));
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.match(bad.reason, /signature/i);
    obj.signature = JSON.parse(envelope).signature;
    obj.native.proposedRelation = "silently rewritten";
    const drifted = await parseCard(JSON.stringify(obj));
    assert.equal(drifted.ok, false);
  });
});
