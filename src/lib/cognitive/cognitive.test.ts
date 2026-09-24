import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LibraryKernel } from "../kernel/kernel.ts";
import { sha256Text } from "../kernel/crypto.ts";
import { judgeLibrary } from "../jev/client.ts";
import { libraryQuestions, policyDecision } from "../jev/questions.ts";
import { publicReceipt } from "../jev/receipts.ts";
import { prepareCloveSignal, INSIGHTS_TRANSMIT } from "../host/insights-contract.ts";
import { recordBeacon, type BeaconStore } from "../host/beacon.ts";
import { packetFromAttempt } from "./adapter.ts";
import { emptyCase } from "./eval-case.ts";
import { decide, POLICY_THRESHOLDS } from "./policy.ts";
import { deterministicBaselineProvider, typeSafeJevProvider } from "./provider.ts";
import { fileAttempt, ledgerBody, notRecorded } from "./receipts.ts";
import type { PolicyInput } from "./types.ts";
import type { JevAttempt } from "../jev/types.ts";

const passage = {
  recordId: "R1",
  claimId: "C1",
  title: "Helios memo",
  hash: "a".repeat(64),
  passage: "The 2024 budget note records a cost overrun.",
};

const input = { query: "Did Project Mercury overrun its budget?", passages: [passage] };

function accepted(overrides: Partial<JevAttempt> = {}): JevAttempt {
  return {
    attemptId: "jev_test_attempt",
    traceId: "tr_test",
    model: "jev-1.13.0",
    questionHash: "b".repeat(64),
    questionHashes: ["c".repeat(64)],
    inputHash: "d".repeat(64),
    outcome: "success",
    terminal: "ACCEPTED_RESPONSE",
    httpStatus: 200,
    latencyMs: 12,
    retryCount: 0,
    requestId: "req_1",
    judgments: [
      { id: "supports", primitive: "noul", confidence: null, probabilities: { yes: 0.9, no: 0.1 }, label: "yes" },
      { id: "contradicts", primitive: "noul", confidence: null, probabilities: { yes: 0.05, no: 0.95 }, label: "no" },
      { id: "insufficient", primitive: "noul", confidence: null, probabilities: { yes: 0.1, no: 0.9 }, label: "no" },
      { id: "relevance", primitive: "noul", confidence: null, probabilities: { yes: 0.9, no: 0.1 }, label: "yes" },
      { id: "duplicate", primitive: "noul", confidence: null, probabilities: { yes: 0.05, no: 0.95 }, label: "no" },
    ],
    note: "fixture",
    ...overrides,
  };
}

function policyInput(attempt: JevAttempt, live = passage.hash): PolicyInput {
  return {
    outcome: attempt.outcome,
    terminal: attempt.terminal,
    model: attempt.model,
    attemptId: attempt.attemptId,
    traceId: attempt.traceId,
    inputHash: attempt.inputHash,
    questionHashes: attempt.questionHashes,
    createdAt: "2026-09-24T00:00:00Z",
    sourceHashes: [passage.hash],
    recordIds: [passage.recordId],
    liveHashes: [live],
    judgments: attempt.judgments,
    engine: "typesafe_jev",
  };
}

describe("cognitive policy", () => {
  it("does not treat confidence 1 as authority", () => {
    const attempt = accepted({
      judgments: [
        {
          id: "supports",
          primitive: "choice",
          confidence: 1,
          probabilities: { yes: 0.9, no: 0.1 },
          label: "yes",
        },
        { id: "contradicts", primitive: "noul", confidence: 1, probabilities: { yes: 0.02, no: 0.98 }, label: "no" },
        { id: "insufficient", primitive: "noul", confidence: null, probabilities: { yes: 0.05, no: 0.95 }, label: "no" },
        { id: "relevance", primitive: "noul", confidence: 1, probabilities: { yes: 0.99, no: 0.01 }, label: "yes" },
        { id: "duplicate", primitive: "noul", confidence: null, probabilities: { yes: 0.01, no: 0.99 }, label: "no" },
      ],
    });
    const result = decide(policyInput(attempt));
    assert.equal(result.promoted, false);
    assert.equal(result.mutated, false);
    assert.notEqual(result.packet.epistemics.epistemic_license, "full_premise");
    assert.notEqual(result.packet.epistemics.epistemic_license, "weak_premise");
    assert.ok(result.packet.permissions.forbidden_use.includes("direct_action"));
    assert.ok(result.packet.permissions.forbidden_use.includes("evidence_promotion"));
    assert.ok(result.packet.permissions.forbidden_use.includes("source_mutation"));
    assert.equal(result.packet.epistemics.confidence, 1);
    assert.equal(result.packet.payload.disposition, "SUPPORT_CANDIDATE");
  });

  it("keeps a contradiction instead of averaging it", () => {
    const attempt = accepted({
      judgments: [
        { id: "supports", primitive: "noul", confidence: null, probabilities: { yes: 0.6, no: 0.4 }, label: "yes" },
        { id: "contradicts", primitive: "noul", confidence: null, probabilities: { yes: 0.7, no: 0.3 }, label: "yes" },
        { id: "insufficient", primitive: "noul", confidence: null, probabilities: { yes: 0.2, no: 0.8 }, label: "no" },
        { id: "relevance", primitive: "noul", confidence: null, probabilities: { yes: 0.8, no: 0.2 }, label: "yes" },
        { id: "duplicate", primitive: "noul", confidence: null, probabilities: { yes: 0.1, no: 0.9 }, label: "no" },
      ],
    });
    const result = decide(policyInput(attempt));
    assert.equal(result.packet.payload.disposition, "CONTRADICTION_CANDIDATE");
    assert.equal(result.packet.payload.human_review, true);
    assert.equal(result.packet.epistemics.epistemic_license, "hazard_only");
    assert.equal(result.packet.payload.distributions.supports?.yes, 0.6);
    assert.equal(result.packet.payload.distributions.contradicts?.yes, 0.7);
  });

  it("preserves insufficient evidence", () => {
    const attempt = accepted({
      judgments: [
        { id: "supports", primitive: "noul", confidence: null, probabilities: { yes: 0.2, no: 0.8 }, label: "no" },
        { id: "contradicts", primitive: "noul", confidence: null, probabilities: { yes: 0.2, no: 0.8 }, label: "no" },
        { id: "insufficient", primitive: "noul", confidence: null, probabilities: { yes: 0.8, no: 0.2 }, label: "yes" },
        { id: "relevance", primitive: "noul", confidence: null, probabilities: { yes: 0.7, no: 0.3 }, label: "yes" },
        { id: "duplicate", primitive: "noul", confidence: null, probabilities: { yes: 0.1, no: 0.9 }, label: "no" },
      ],
    });
    const result = decide(policyInput(attempt));
    assert.equal(result.packet.payload.disposition, "INSUFFICIENT_EVIDENCE");
    assert.equal(result.packet.payload.relation, "insufficient_evidence");
  });

  it("marks irrelevant evidence display-only", () => {
    const attempt = accepted({
      judgments: [
        { id: "supports", primitive: "noul", confidence: null, probabilities: { yes: 0.1, no: 0.9 }, label: "no" },
        { id: "contradicts", primitive: "noul", confidence: null, probabilities: { yes: 0.1, no: 0.9 }, label: "no" },
        { id: "insufficient", primitive: "noul", confidence: null, probabilities: { yes: 0.2, no: 0.8 }, label: "no" },
        { id: "relevance", primitive: "noul", confidence: null, probabilities: { yes: 0.1, no: 0.9 }, label: "no" },
        { id: "duplicate", primitive: "noul", confidence: null, probabilities: { yes: 0.1, no: 0.9 }, label: "no" },
      ],
    });
    assert.equal(decide(policyInput(attempt)).packet.payload.disposition, "DISPLAY_ONLY");
  });

  it("does not drop a duplicate candidate", () => {
    const attempt = accepted({
      judgments: accepted().judgments.map((j) =>
        j.id === "duplicate" ? { ...j, probabilities: { yes: 0.9, no: 0.1 }, label: "yes" } : j,
      ),
    });
    const result = decide(policyInput(attempt));
    assert.equal(result.packet.payload.duplicate, true);
    assert.equal(result.packet.payload.human_review, true);
    assert.equal(result.promoted, false);
    assert.ok(POLICY_THRESHOLDS.duplicateYes > 0.5);
  });

  it("rejects a stale source hash", () => {
    const result = decide(policyInput(accepted(), "f".repeat(64)));
    assert.equal(result.stale, true);
    assert.equal(result.packet.payload.disposition, "HUMAN_REVIEW");
    assert.equal(result.packet.epistemics.uncertainty_type, "stale_source");
    assert.equal(result.promoted, false);
  });

  it("rejects missing provenance", () => {
    const attempt = accepted();
    const result = decide({ ...policyInput(attempt), sourceHashes: [], recordIds: [] });
    assert.equal(result.provenanceMismatch, true);
    assert.equal(result.packet.payload.disposition, "HUMAN_REVIEW");
  });

  it("service failure is not a judgment", () => {
    const attempt = accepted({ terminal: "RATE_LIMITED", outcome: "service_failure", judgments: [] });
    const result = packetFromAttempt(attempt, {
      sourceHashes: [passage.hash],
      recordIds: [passage.recordId],
      liveHashes: [passage.hash],
    });
    assert.equal(result.packet.payload.disposition, "SERVICE_UNAVAILABLE");
    assert.equal(result.packet.payload.distributions.supports, undefined);
  });

  it("historical gaps stay NOT_RECORDED", () => {
    const gap = notRecorded("tr_missing");
    assert.equal(gap.terminal, "NOT_RECORDED");
    assert.equal(gap.retryCount, null);
    assert.match(gap.note, /not evidence of success/);
  });

  it("files an attempt without source text or a secret", async () => {
    const attempt = accepted();
    const decision = decide(policyInput(attempt));
    const kernel = new LibraryKernel();
    const before = kernel.ledger.length;
    const filed = await fileAttempt(
      kernel,
      ledgerBody(decision.packet, {
        terminal: attempt.terminal,
        httpStatus: 200,
        latencyMs: 12,
        retryCount: 0,
        requestId: "req_1",
      }),
    );
    assert.equal(kernel.ledger.length, before + 1);
    const ev = kernel.ledger.events.find((e) => e.event_hash === filed.eventHash)!;
    assert.equal(ev.command, "JEV_ATTEMPT");
    const payload = JSON.stringify(ev.payload);
    assert.equal(payload.includes(passage.passage), false);
    assert.equal(payload.includes("TYPESAFE"), false);
    assert.equal((ev.payload as { authority: boolean }).authority, false);
  });

  it("does not mutate a stored original", async () => {
    const kernel = new LibraryKernel();
    const bytes = new TextEncoder().encode(passage.passage);
    const put = await kernel.objects.put(bytes);
    const before = await sha256Text(passage.passage);
    assert.equal(put.hash, before);
    decide(policyInput(accepted()));
    const after = kernel.objects.get(put.hash);
    assert.ok(after);
    assert.equal(new TextDecoder().decode(after), passage.passage);
    assert.equal(policyDecision().mutated, false);
  });
});

describe("jev transport", () => {
  it("sends five bounded questions and no tools", async () => {
    let body = "";
    await judgeLibrary(input, {
      apiKey: "k",
      maxRetries: 0,
      fetch: async (_url, init) => {
        body = String(init?.body);
        return new Response(JSON.stringify({ model: "jev-1.13.0", answers: {} }), { status: 200 });
      },
    });
    const parsed = JSON.parse(body) as { questions: Record<string, { type: string }>; state: { passages: unknown[] } };
    assert.deepEqual(Object.keys(parsed.questions).sort(), Object.keys(libraryQuestions()).sort());
    for (const q of Object.values(parsed.questions)) assert.equal(q.type, "noul");
    assert.equal("tools" in parsed, false);
    assert.equal(parsed.state.passages.length, 1);
  });

  it("401 is an auth failure", async () => {
    const attempt = await judgeLibrary(input, {
      apiKey: "bad",
      fetch: async () => new Response("no", { status: 401, headers: { "x-request-id": "r1" } }),
    });
    assert.equal(attempt.terminal, "AUTH_FAILURE");
    assert.equal(attempt.requestId, "r1");
    assert.equal(attempt.judgments.length, 0);
  });

  it("429 stays rate limited after bounded retries", async () => {
    let calls = 0;
    const attempt = await judgeLibrary(input, {
      apiKey: "k",
      maxRetries: 2,
      sleep: async () => {},
      fetch: async () => {
        calls += 1;
        return new Response("slow", { status: 429 });
      },
    });
    assert.equal(calls, 3);
    assert.equal(attempt.terminal, "RATE_LIMITED");
    assert.equal(attempt.outcome, "service_failure");
    assert.equal(attempt.retryCount, 2);
    assert.equal(attempt.judgments.length, 0);
  });

  it("529 is overloaded and distinct from 429", async () => {
    const attempt = await judgeLibrary(input, {
      apiKey: "k",
      maxRetries: 0,
      fetch: async () => new Response("hot", { status: 529 }),
    });
    assert.equal(attempt.terminal, "OVERLOADED");
    assert.notEqual(attempt.terminal, "RATE_LIMITED");
  });

  it("malformed JSON is an invalid response", async () => {
    const attempt = await judgeLibrary(input, {
      apiKey: "k",
      fetch: async () => new Response("not-json", { status: 200 }),
    });
    assert.equal(attempt.terminal, "INVALID_RESPONSE");
    assert.equal(attempt.judgments.length, 0);
  });

  it("a thrown fetch is a network failure", async () => {
    const attempt = await judgeLibrary(input, {
      apiKey: "k",
      fetch: async () => {
        throw new TypeError("socket");
      },
    });
    assert.equal(attempt.terminal, "NETWORK_FAILURE");
  });

  it("provider id is the only production binding", async () => {
    const provider = typeSafeJevProvider({
      apiKey: undefined,
      fetch,
    });
    assert.equal(provider.id, "typesafe-jev");
    const attempt = await provider.judge(input);
    assert.equal(attempt.terminal, "NO_KEY");
    const baseline = await deterministicBaselineProvider().judge(input);
    assert.equal(baseline.model, "deterministic-baseline");
    const gated = packetFromAttempt(baseline, {
      sourceHashes: [passage.hash],
      recordIds: [passage.recordId],
      liveHashes: [passage.hash],
      engine: "deterministic_baseline",
    });
    assert.equal(gated.promoted, false);
    assert.equal(gated.packet.header.source_engine, "deterministic_baseline");
  });

  it("receipt has no key", async () => {
    const attempt = await judgeLibrary(input, { apiKey: undefined, fetch });
    const receipt = publicReceipt(attempt);
    assert.equal(JSON.stringify(receipt).includes("TYPESAFE"), false);
    assert.equal(receipt.authority, false);
  });
});

describe("insights and eval schema", () => {
  it("refuses claim text on the Clove signal", () => {
    assert.equal(INSIGHTS_TRANSMIT, false);
    const signal = prepareCloveSignal({ event: "library_open", device: "desktop" });
    assert.equal(signal.surface, "library");
    assert.throws(() => prepareCloveSignal({ event: "library_open", device: "desktop", query: "secret" }));
    assert.throws(() => prepareCloveSignal({ event: "jev_success", device: "desktop", probabilities: { yes: 1 } }));
  });

  it("device log does not store a Jev body", () => {
    const mem = new Map<string, string>();
    const store: BeaconStore = { get: (k) => mem.get(k) ?? null, set: (k, v) => void mem.set(k, v) };
    recordBeacon(store, {
      event: "jev_success",
      route: "/library",
      session: "abcdef1234567890",
      day: "2026-09-24",
    });
    assert.equal(mem.get("gal-host-beacon-v1")!.includes("overrun"), false);
  });

  it("frozen case starts unlabeled and forbids promotion", () => {
    const row = emptyCase("case-a", "The memo records an overrun.");
    assert.equal(row.expectedHumanLabel, "unlabeled");
    assert.equal(row.jevOutput, undefined);
    assert.ok(row.permissions.forbidden_use.includes("evidence_promotion"));
  });
});
