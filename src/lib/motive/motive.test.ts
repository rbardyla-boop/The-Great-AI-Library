import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { authorizeEffect, peerGo, spawnSuccessor, transferTaint } from "../hive/membrane.ts";
import { haveNeed } from "../hive/envelope.ts";
import { evaluateValues } from "../values/evaluate.ts";
import { profileByRole, profileByUri } from "../values/profiles.ts";
import { DILEMMAS, dilemmaById } from "./dilemmas.ts";
import {
  convene,
  newBuilderIdentity,
  proposeAmendment,
  recordDecision,
  replayDecision,
  silentRewrite,
} from "./session.ts";

describe("MOTIVE-0", () => {
  it("VALUES CANNOT AUTHORIZE", async () => {
    const builder = await profileByRole("builder", "1.3.0");
    for (const d of DILEMMAS) {
      const j = evaluateValues(builder, d);
      assert.equal(j.authorized, false);
    }
  });

  it("ROLE DISAGREEMENT", async () => {
    const convened = await convene(dilemmaById("mission-authority"));
    const recs = new Set(convened.seats.map((s) => s.judgment.recommendation));
    assert.ok(recs.size >= 2, `expected disagreement, got ${[...recs].join(",")}`);
    const builder = convened.seats.find((s) => s.profile.role === "builder")!;
    const guardian = convened.seats.find((s) => s.profile.role === "guardian")!;
    assert.equal(builder.judgment.recommendation, "request-exception");
    assert.equal(guardian.judgment.recommendation, "abstain");
    assert.equal(convened.costly, true);
    assert.equal(builder.cost.wastedPrivilege, 9);
  });

  it("MEMBRANE OVERRULES", async () => {
    const builder = await profileByRole("builder", "1.3.0");
    const j = evaluateValues(builder, dilemmaById("progress-reversibility"));
    assert.equal(j.recommendation, "request-exception");
    const mem = authorizeEffect(j.proposedEffect);
    assert.equal(mem.allow, false);
    assert.match(mem.reason, /MUTATE_ORIGINAL|denied/i);
  });

  it("REPLAY", async () => {
    const v13 = await profileByRole("builder", "1.3.0");
    const dilemma = dilemmaById("reward-evidence");
    const original = recordDecision(dilemma, evaluateValues(v13, dilemma), 1, {
      evidenceRoot: "test-root",
      temptation: v13.preferences.completion,
      now: () => "2026-09-13T00:00:00Z",
    });
    const v14 = await profileByUri("values://open-hive/builder/1.4.0");
    assert.ok(v14);
    const { replayed, sameRecommendation } = await replayDecision(original, v14.uri);
    assert.equal(original.judgment.recommendation, "request-exception");
    assert.equal(replayed.recommendation, "act-legitimate");
    assert.equal(sameRecommendation, false);
    assert.notEqual(original.valuesHash, replayed.valuesHash);
    assert.equal(original.model, "gal-values-eval/1.0");
    assert.equal(original.valuesVersion, "1.3.0");
    assert.equal(original.evidenceRoot, "test-root");
  });

  it("SILENT REWRITE", () => {
    const denied = silentRewrite();
    assert.equal(denied.allow, false);
    const proposal = proposeAmendment({
      fromUri: "values://open-hive/builder/1.3.0",
      toUri: "values://open-hive/builder/1.4.0",
      reason: "Completion pressure caused request-exception on forbidden effects.",
      seq: 1,
    });
    assert.equal(proposal.status, "proposed");
  });

  it("TAINT NETWORK", () => {
    const taint = transferTaint(["SECRET"], true);
    const send = authorizeEffect(
      { kind: "NETWORK_SEND", summary: "exfiltrate paraphrase", taint, destination: "public-network" },
      taint,
    );
    assert.equal(send.allow, false);
    assert.match(send.reason, /SECRET/);
  });

  it("PEER-GO and CHILD ZERO TRUST", () => {
    const parent = newBuilderIdentity();
    const go = peerGo(parent, { ...parent, id: "b" });
    assert.equal(go.allow, false);
    const child = spawnSuccessor(parent);
    assert.equal(child.trust, 0);
    assert.deepEqual(child.capabilities, []);
    assert.equal(child.valuesUri, null);
    assert.equal(child.parent, parent.id);
  });

  it("CONTENT ADDRESS skip when HAVE", () => {
    const local = new Set(["sha256:54a718"]);
    assert.equal(haveNeed(local, "sha256:54a718"), "HAVE");
    assert.equal(haveNeed(local, "sha256:deadbeef"), "NEED");
  });
});
