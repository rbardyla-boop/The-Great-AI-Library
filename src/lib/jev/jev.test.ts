import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { interpretAnswers, judgeLibrary } from "./client.ts";
import { policyDecision } from "./questions.ts";
import { publicReceipt } from "./receipts.ts";

const input = {
  query: "Did Project Mercury overrun its budget?",
  passages: [
    {
      recordId: "R1",
      claimId: "C1",
      title: "Helios memo",
      hash: "a".repeat(64),
      passage: "The 2024 budget note records a cost overrun.",
    },
  ],
};

describe("JEV adapter", () => {
  it("no key returns no_key and invents nothing", async () => {
    const attempt = await judgeLibrary(input, { apiKey: undefined, fetch: fetch });
    assert.equal(attempt.outcome, "no_key");
    assert.equal(attempt.judgments.length, 0);
    assert.equal(attempt.model, "none");
    const receipt = publicReceipt(attempt);
    assert.equal(receipt.authority, false);
    assert.equal(receipt.confidenceIsCorrectness, false);
    assert.equal(JSON.stringify(receipt).includes("TYPESAFE"), false);
  });

  it("429 is a service failure, not a judgment", async () => {
    const attempt = await judgeLibrary(input, {
      apiKey: "test-key",
      fetch: async () => new Response("slow", { status: 429 }),
    });
    assert.equal(attempt.outcome, "service_failure");
    assert.equal(attempt.httpStatus, 429);
    assert.equal(attempt.judgments.length, 0);
  });

  it("529 is a service failure", async () => {
    const attempt = await judgeLibrary(input, {
      apiKey: "test-key",
      fetch: async () => new Response("overloaded", { status: 529 }),
    });
    assert.equal(attempt.outcome, "service_failure");
    assert.equal(attempt.httpStatus, 529);
  });

  it("timeout is a service failure", async () => {
    const attempt = await judgeLibrary(input, {
      apiKey: "test-key",
      timeoutMs: 5,
      fetch: (_url, init) =>
        new Promise((_resolve, reject) => {
          const signal = init?.signal;
          signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    });
    assert.equal(attempt.outcome, "service_failure");
    assert.match(attempt.note, /timed out/);
  });

  it("keeps the full probability map and does not treat confidence as correctness", async () => {
    const attempt = await judgeLibrary(input, {
      apiKey: "test-key",
      fetch: async () =>
        new Response(
          JSON.stringify({
            model: "jev-1.13.0",
            answers: {
              relevance: {
                type: "choice",
                choice: "relevant",
                confidence: 0.4,
                probabilities: { relevant: 0.5, adjacent: 0.3, unrelated: 0.2 },
              },
              supports: { type: "noul", noul: 0.62 },
              contradicts: { type: "noul", noul: 0.2 },
              duplicate: { type: "noul", noul: 0.1 },
              review_needed: { type: "noul", noul: 0.9 },
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    });
    assert.equal(attempt.outcome, "success");
    assert.equal(attempt.model, "jev-1.13.0");
    const relevance = attempt.judgments.find((j) => j.id === "relevance");
    assert.deepEqual(relevance?.probabilities, { relevant: 0.5, adjacent: 0.3, unrelated: 0.2 });
    assert.equal(relevance?.confidence, 0.4);
    assert.match(attempt.note, /not the probability the judgment is correct/);
    const supports = attempt.judgments.find((j) => j.id === "supports");
    assert.equal(supports?.probabilities.yes, 0.62);
    assert.ok(Math.abs((supports?.probabilities.no ?? 0) - 0.38) < 0.001);
    const before = input.passages[0]!.hash;
    assert.equal(policyDecision().promoted, false);
    assert.equal(policyDecision().mutated, false);
    assert.equal(input.passages[0]!.hash, before);
  });

  it("does not send the key back and hashes the input", async () => {
    let auth = "";
    const attempt = await judgeLibrary(input, {
      apiKey: "super-secret-key",
      fetch: async (_url, init) => {
        auth = String(new Headers(init?.headers).get("authorization"));
        return new Response(JSON.stringify({ model: "jev-1.13.0", answers: {} }), { status: 200 });
      },
    });
    assert.equal(auth, "Bearer super-secret-key");
    assert.equal(JSON.stringify(publicReceipt(attempt)).includes("super-secret-key"), false);
    assert.equal(attempt.inputHash.length, 64);
    assert.equal(attempt.outcome, "service_failure");
  });

  it("interpreter keeps every returned probability", () => {
    const views = interpretAnswers({
      relevance: {
        type: "choice",
        choice: "adjacent",
        confidence: 0.2,
        probabilities: { relevant: 0.1, adjacent: 0.7, unrelated: 0.2 },
      },
    });
    assert.equal(views.length, 1);
    assert.equal(Object.keys(views[0]!.probabilities).length, 3);
  });
});
