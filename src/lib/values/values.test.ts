import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LibraryKernel } from "../kernel/kernel.ts";
import { utf8 } from "../kernel/crypto.ts";
import { evaluateValues } from "./evaluate.ts";
import { putValuesObject, unsignedProfile, valuesCanonical, VALUES_EVALUATOR } from "./object.ts";
import { allProfiles, profileByRole } from "./profiles.ts";
import { ensureValuesInstalled, evidenceRoot, fileAmendmentProposed, fileExperiment, fileJudgment, fileReplay, valuesLedgerEvents } from "./registry.ts";
import { dilemmaById } from "../motive/dilemmas.ts";
import { proposeAmendment, recordDecision, replayDecision, runMotiveExperiment } from "../motive/session.ts";

describe("VALUES objects", () => {
  it("CAS hash matches the versioned profile hash", async () => {
    const k = new LibraryKernel();
    const builder = await profileByRole("builder", "1.3.0");
    const put = await putValuesObject(k.objects, builder);
    assert.equal(put.hash, builder.hash);
    assert.match(put.path, /^objects\/sha256\//);
    const stored = k.objects.get(builder.hash);
    assert.ok(stored);
    assert.equal(new TextDecoder().decode(stored), valuesCanonical(builder));
    assert.equal("hash" in unsignedProfile(builder), false);
  });

  it("install writes versioned objects and does not authorize", async () => {
    const k = new LibraryKernel();
    await k.ingest({ filename: "e.txt", bytes: utf8("mercury evidence"), recordId: "ev-1" });
    await ensureValuesInstalled(k);
    await ensureValuesInstalled(k);
    const installs = k.ledger.events.filter((e) => e.command === "INSTALL_VALUES");
    const proposes = k.ledger.events.filter((e) => e.command === "PROPOSE_VALUES");
    assert.equal(installs.length, 7);
    assert.equal(proposes.length, 1);
    const profiles = await allProfiles();
    for (const p of profiles) assert.equal(k.objects.has(p.hash), true);
  });

  it("JUDGE receipt names model, role, VALUES version, evidence root", async () => {
    const k = new LibraryKernel();
    await k.ingest({ filename: "e.txt", bytes: utf8("mercury evidence"), recordId: "ev-1" });
    await ensureValuesInstalled(k);
    const root = await evidenceRoot(k);
    const builder = await profileByRole("builder", "1.3.0");
    const dilemma = dilemmaById("mission-authority");
    const decision = recordDecision(dilemma, evaluateValues(builder, dilemma), 1, {
      evidenceRoot: root,
      temptation: builder.preferences.completion,
      now: () => "2026-09-13T00:00:00Z",
    });
    const ev = await fileJudgment(k, decision);
    const payload = ev.payload as Record<string, unknown>;
    assert.equal(ev.command, "JUDGE");
    assert.equal(payload.model, VALUES_EVALUATOR);
    assert.equal(payload.role, "builder");
    assert.equal(payload.valuesVersion, "1.3.0");
    assert.equal(payload.evidenceRoot, root);
    assert.equal(payload.authorized, false);
    assert.match(ev.summary, /gal-values-eval\/1\.0/);
    const { replayed } = await replayDecision(decision, "values://open-hive/builder/1.4.0");
    assert.notEqual(replayed.recommendation, decision.judgment.recommendation);
    const judges = valuesLedgerEvents(k).filter((e) => e.command === "JUDGE");
    assert.equal(judges.length, 1);
    assert.equal((judges[0]!.payload as { valuesVersion: string }).valuesVersion, "1.3.0");
  });
});

describe("MOTIVE-0 under cost", () => {
  it("identical checkpoint, different VALUES, costly conflict", async () => {
    const v13 = await runMotiveExperiment({ builderVersion: "1.3.0", evidenceRoot: "abc" });
    const v14 = await runMotiveExperiment({ builderVersion: "1.4.0", evidenceRoot: "abc" });
    assert.ok(v13.costlyCount >= 1, "1.3 should produce costly conflicts");
    assert.ok(v13.totalWastedPrivilege > v14.totalWastedPrivilege, "1.4 must be cheaper than 1.3");
    const mission = v13.dilemmas.find((d) => d.id === "mission-authority")!;
    const builder = mission.seats.find((s) => s.role === "builder")!;
    assert.equal(builder.recommendation, "request-exception");
    assert.equal(builder.wastedPrivilege, 9);
    assert.equal(builder.membrane, false);
    const builder14 = v14.dilemmas.find((d) => d.id === "mission-authority")!.seats.find((s) => s.role === "builder")!;
    assert.equal(builder14.recommendation, "act-legitimate");
    assert.equal(builder14.wastedPrivilege, 0);
  });
});

describe("M2.1 ledger proof", () => {
  it("MOTIVE_EXPERIMENT payload includes the seat matrix", async () => {
    const k = new LibraryKernel();
    await k.ingest({ filename: "e.txt", bytes: utf8("mercury evidence"), recordId: "ev-1" });
    await ensureValuesInstalled(k);
    const root = await evidenceRoot(k);
    const report = await runMotiveExperiment({ builderVersion: "1.3.0", evidenceRoot: root });
    const ev = await fileExperiment(k, report);
    const payload = ev.payload as typeof report;
    assert.equal(ev.command, "MOTIVE_EXPERIMENT");
    assert.equal(payload.dilemmas.length, 5);
    const mission = payload.dilemmas.find((d) => d.id === "mission-authority")!;
    assert.equal(mission.seats.length, 6);
    const builder = mission.seats.find((s) => s.role === "builder")!;
    assert.equal(builder.recommendation, "request-exception");
    assert.equal(builder.wastedPrivilege, 9);
    assert.equal(builder.membrane, false);
    assert.ok(valuesLedgerEvents(k).some((e) => e.command === "MOTIVE_EXPERIMENT"));
  });

  it("REPLAY cites JUDGE and does not rewrite it", async () => {
    const k = new LibraryKernel();
    await k.ingest({ filename: "e.txt", bytes: utf8("mercury evidence"), recordId: "ev-1" });
    await ensureValuesInstalled(k);
    const root = await evidenceRoot(k);
    const builder = await profileByRole("builder", "1.3.0");
    const dilemma = dilemmaById("mission-authority");
    const decision = recordDecision(dilemma, evaluateValues(builder, dilemma), 1, {
      evidenceRoot: root,
      temptation: builder.preferences.completion,
      now: () => "2026-09-13T00:00:00Z",
    });
    const judge = await fileJudgment(k, decision);
    decision.ledgerReceipt = judge.event_hash;
    const { replayed, sameRecommendation } = await replayDecision(
      decision,
      "values://open-hive/builder/1.4.0",
    );
    const replay = await fileReplay(k, {
      original: decision,
      replayed,
      sameRecommendation,
    });
    assert.equal(replay.command, "REPLAY");
    assert.equal(sameRecommendation, false);
    const judges = k.ledger.events.filter((e) => e.command === "JUDGE");
    assert.equal(judges.length, 1);
    assert.equal((judges[0]!.payload as { valuesVersion: string }).valuesVersion, "1.3.0");
    assert.equal(judges[0]!.event_hash, judge.event_hash);
    const replayPayload = replay.payload as {
      originalReceipt: string;
      originalValuesVersion: string;
      replayValuesVersion: string;
      originalRecommendation: string;
      replayRecommendation: string;
    };
    assert.equal(replayPayload.originalReceipt, judge.event_hash);
    assert.equal(replayPayload.originalValuesVersion, "1.3.0");
    assert.equal(replayPayload.replayValuesVersion, "1.4.0");
    assert.equal(replayPayload.originalRecommendation, "request-exception");
    assert.equal(replayPayload.replayRecommendation, "act-legitimate");
    assert.notEqual(replay.event_hash, judge.event_hash);
    assert.ok(valuesLedgerEvents(k).some((e) => e.command === "REPLAY"));
  });

  it("AMENDMENT_PROPOSED is a ledger event, not a silent rewrite", async () => {
    const k = new LibraryKernel();
    await k.ingest({ filename: "e.txt", bytes: utf8("mercury evidence"), recordId: "ev-1" });
    await ensureValuesInstalled(k);
    const proposal = proposeAmendment({
      fromUri: "values://open-hive/builder/1.3.0",
      toUri: "values://open-hive/builder/1.4.0",
      reason: "Completion pressure produced request-exception on forbidden effects.",
      seq: 1,
    });
    const ev = await fileAmendmentProposed(k, proposal);
    assert.equal(ev.command, "AMENDMENT_PROPOSED");
    const installs = k.ledger.events.filter((e) => e.command === "INSTALL_VALUES");
    const builderInstall = installs.find(
      (e) => (e.payload as { uri: string }).uri === "values://open-hive/builder/1.3.0",
    );
    assert.ok(builderInstall);
    assert.equal((builderInstall!.payload as { version: string }).version, "1.3.0");
    const proposed = valuesLedgerEvents(k).filter((e) => e.command === "AMENDMENT_PROPOSED");
    assert.equal(proposed.length, 1);
    assert.equal((proposed[0]!.payload as { fromUri: string }).fromUri, "values://open-hive/builder/1.3.0");
  });
});
