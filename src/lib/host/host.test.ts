import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregate, assertBeacon, classifyQuery, recordBeacon, sessionFor, type BeaconStore } from "./beacon.ts";

function mem(): BeaconStore {
  const m = new Map<string, string>();
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => {
      m.set(k, v);
    },
  };
}

describe("local host beacon", () => {
  it("accepts a boring library_open and stores no query", () => {
    const store = mem();
    const row = recordBeacon(store, {
      event: "library_open",
      route: "/library",
      session: "abcdef1234567890",
      day: "2026-09-24",
    });
    assert.equal(row.event, "library_open");
    assert.equal(JSON.stringify(row).includes("mercury"), false);
  });

  it("rejects query text, email, and document bodies", () => {
    const base = { event: "search_completed", route: "/library", session: "abcdef1234567890" };
    assert.throws(() => assertBeacon({ ...base, query: "secret question" }));
    assert.throws(() => assertBeacon({ ...base, email: "a@b.c" }));
    assert.throws(() => assertBeacon({ ...base, body: "original bytes" }));
    assert.throws(() => assertBeacon({ ...base, document: "memo" }));
    assert.throws(() => assertBeacon({ ...base, fingerprint: "canvas" }));
    assert.throws(() => assertBeacon({ ...base, route: "/library?q=mercury" }));
  });

  it("stores a category, never the question", () => {
    assert.equal(classifyQuery("How do I frame a PEI house slab?"), "construction");
    assert.equal(classifyQuery("taekwondo poomsae timing"), "taekwondo");
    assert.equal(classifyQuery("what is the GAL ledger"), "ai");
    assert.equal(classifyQuery("mercury budget evidence"), "research");
    assert.equal(classifyQuery("hello"), "unknown");
    const store = mem();
    recordBeacon(store, {
      event: "search_completed",
      route: "/library",
      session: "abcdef1234567890",
      day: "2026-09-24",
      queryCategory: classifyQuery("Did the mercury memo contradict the budget?"),
    });
    const counts = aggregate(JSON.parse(store.get("gal-host-beacon-v1")!));
    assert.equal(counts.categories.research, 1);
    assert.equal(store.get("gal-host-beacon-v1")!.includes("mercury"), false);
  });

  it("rotates the session id when the day changes", () => {
    const store = mem();
    let n = 0;
    const id = () => `session-${++n}-xxxxxxxx`;
    const a = sessionFor(store, Date.parse("2026-09-24T12:00:00Z"), id);
    const b = sessionFor(store, Date.parse("2026-09-24T18:00:00Z"), id);
    const c = sessionFor(store, Date.parse("2026-09-25T01:00:00Z"), id);
    assert.equal(a, b);
    assert.notEqual(a, c);
  });

  it("counts feedback without requiring an account", () => {
    const store = mem();
    recordBeacon(store, { event: "feedback_yes", route: "/library", session: "abcdef1234567890", day: "2026-09-24" });
    recordBeacon(store, { event: "feedback_no", route: "/library", session: "abcdef1234567890", day: "2026-09-24" });
    recordBeacon(store, {
      event: "feedback_text_submitted",
      route: "/library",
      session: "abcdef1234567890",
      day: "2026-09-24",
    });
    const counts = aggregate(JSON.parse(store.get("gal-host-beacon-v1")!));
    assert.equal(counts.events.feedback_yes, 1);
    assert.equal(counts.events.feedback_no, 1);
    assert.equal(counts.events.feedback_text_submitted, 1);
  });
});
