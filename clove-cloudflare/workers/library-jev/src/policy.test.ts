import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { decide } from "./policy.ts";

const high = [
  { id: "supports", confidence: 1, probabilities: { yes: 0.91, no: 0.09 } },
  { id: "contradicts", confidence: 1, probabilities: { yes: 0.04, no: 0.96 } },
  { id: "insufficient", confidence: null, probabilities: { yes: 0.08, no: 0.92 } },
  { id: "relevance", confidence: null, probabilities: { yes: 0.9, no: 0.1 } },
  { id: "duplicate", confidence: null, probabilities: { yes: 0.05, no: 0.95 } },
];

describe("clove library policy", () => {
  it("confidence 1 does not grant authority", () => {
    const d = decide("ACCEPTED_RESPONSE", high);
    assert.equal(d.disposition, "SUPPORT_CANDIDATE");
    assert.equal(d.license, "hypothesis_only");
    assert.equal(d.promoted, false);
    assert.equal(d.mutated, false);
    assert.ok(d.forbidden_use.includes("direct_action"));
    assert.ok(d.forbidden_use.includes("memory_consolidation"));
    assert.ok(d.forbidden_use.includes("rule_revision"));
    assert.ok(d.forbidden_use.includes("safety_certification"));
    assert.equal(d.confidence, 1);
  });

  it("a missing call is not a judgment", () => {
    const d = decide("NO_KEY", []);
    assert.equal(d.disposition, "SERVICE_UNAVAILABLE");
    assert.equal(d.license, "do_not_use_for_action");
  });

  it("the worker package does not contain a key", () => {
    const files = ["../src/index.ts", "../src/policy.ts", "../wrangler.jsonc", "../../../CODEX.md", "../../../pages/library/index.html"];
    for (const file of files) {
      const text = readFileSync(new URL(file, import.meta.url), "utf8");
      assert.equal(/TYPESAFE_API_KEY\s*=\s*["'][^"']+["']/.test(text), false);
      assert.equal(text.includes("sk-"), false);
    }
  });
});
