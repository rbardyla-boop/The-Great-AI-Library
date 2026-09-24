import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { pageHead } from "@/lib/seo";
import { retrieve } from "@/lib/library/retrieve";
import { kernel, refreshLibrary, selectClaims, selectContradictions, selectRecords, useLibrary } from "@/lib/library/store";
import { judgeGal } from "@/lib/jev/judge";
import type { JevAttempt } from "@/lib/jev/types";
import { publicReceipt } from "@/lib/jev/receipts";
import { packetFromAttempt } from "@/lib/cognitive/adapter";
import { fileAttempt, ledgerBody } from "@/lib/cognitive/receipts";
import type { DecisionPacket } from "@/lib/cognitive/types";
import { trackLocal, trackSearch } from "@/lib/host/browser";
import { saveFeedback } from "@/lib/host/feedback";

export const Route = createFileRoute("/library")({
  head: () =>
    pageHead(
      "Library",
      "Observed source, a Jev judgment, and a policy disposition. Nothing here is promoted.",
    ),
  component: LibraryHost,
});

type Receipt = ReturnType<typeof publicReceipt>;

function LibraryHost() {
  const overlay = useLibrary();
  const [query, setQuery] = useState("Did Project Mercury overrun its budget?");
  const [passages, setPassages] = useState<ReturnType<typeof retrieve>["passages"]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [packet, setPacket] = useState<DecisionPacket | null>(null);
  const [ledgerId, setLedgerId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [thanks, setThanks] = useState("");

  useEffect(() => {
    trackLocal("library_open", "/library");
  }, []);

  async function search() {
    trackSearch("/library", query, "search_started");
    trackSearch("/library", query, "library_query_started");
    const found = retrieve(query, {
      records: selectRecords(overlay),
      claims: selectClaims(overlay),
      contradictions: selectContradictions(overlay),
    }).passages.slice(0, 6);
    setPassages(found);
    trackSearch("/library", query, "search_completed");
    trackSearch("/library", query, "library_query_completed");
    setBusy(true);
    setThanks("");
    setLedgerId(null);
    try {
      const bundle = await judgeGal({
        data: {
          query,
          passages: found.map((p) => ({
            recordId: p.recordId,
            claimId: p.claimId ?? "",
            title: p.title,
            hash: p.hash,
            passage: p.passage,
          })),
        },
      });
      const attempt = bundle.receipt as JevAttempt;
      const live = found.map((p) => p.hash);
      const decision = packetFromAttempt(attempt, {
        sourceHashes: live,
        recordIds: found.map((p) => p.recordId),
        liveHashes: live,
      });
      setReceipt(bundle.receipt);
      setPacket(decision.packet);
      if (attempt.terminal === "ACCEPTED_RESPONSE") trackLocal("jev_success", "/library");
      else trackLocal("jev_service_failure", "/library");
      if (decision.packet.payload.human_review) trackLocal("human_review_required", "/library");
      const filed = await fileAttempt(
        kernel,
        ledgerBody(decision.packet, {
          terminal: attempt.terminal,
          httpStatus: attempt.httpStatus,
          latencyMs: attempt.latencyMs,
          retryCount: attempt.retryCount,
          requestId: attempt.requestId,
        }),
      );
      setLedgerId(filed.eventHash);
      refreshLibrary();
    } catch {
      const failed: JevAttempt = {
        attemptId: "local_failure",
        traceId: "tr_local_failure",
        model: "none",
        questionHash: "",
        questionHashes: [],
        inputHash: "",
        outcome: "service_failure",
        terminal: "NETWORK_FAILURE",
        httpStatus: null,
        latencyMs: 0,
        retryCount: 0,
        requestId: null,
        judgments: [],
        note: "The judgment call did not return.",
      };
      setReceipt(publicReceipt(failed));
      setPacket(
        packetFromAttempt(failed, { sourceHashes: [], recordIds: [], liveHashes: [] }).packet,
      );
      trackLocal("jev_service_failure", "/library");
    } finally {
      setBusy(false);
    }
  }

  const receiptId = receipt?.attemptId;

  return (
    <div className="stagger-in space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Reading Room · Library</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl">Library</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Three layers, kept apart. The source is what was preserved. Jev may judge that
          bounded excerpt. Policy decides what the judgment is allowed to mean. None of
          this promotes a claim or edits an original.
        </p>
      </header>

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={500}
          aria-label="Library query"
          className="h-11 flex-1 rounded-md bg-surface px-3 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        />
        <button
          type="submit"
          disabled={busy || query.trim().length === 0}
          className="h-11 rounded-md bg-elevated px-4 text-sm disabled:opacity-50"
        >
          {busy ? "Judging…" : "Retrieve"}
        </button>
      </form>

      <section className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">Observed source</p>
        <h2 className="font-display text-2xl">What the Library preserved</h2>
        {passages.length === 0 ? (
          <p className="text-sm text-muted">Nothing retrieved yet.</p>
        ) : (
          passages.map((p) => (
            <article
              key={p.claimId ?? p.recordId}
              className="rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-xl">{p.title}</h3>
                <button
                  type="button"
                  className="font-mono text-[11px] text-faint"
                  onClick={() => trackLocal("record_open", "/library")}
                >
                  {p.hash.slice(0, 8)}
                </button>
              </div>
              <p className="mt-2 text-sm leading-relaxed">{p.passage}</p>
              <p className="mt-2 font-mono text-[11px] text-faint">{p.recordId}</p>
              <Link to="/record/$id" params={{ id: p.recordId }} className="mt-3 inline-block text-sm text-muted">
                Open record
              </Link>
            </article>
          ))
        )}
      </section>

      <section className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">Model judgment</p>
        <h2 className="font-display text-2xl">What Jev returned</h2>
        {!receipt ? (
          <p className="text-sm text-muted">No judgment yet. Retrieval still works if Jev is absent.</p>
        ) : (
          <div className="rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <p className="font-mono text-[11px] text-faint">
              {receipt.terminal} · {receipt.model} · {receipt.latencyMs} ms · retries {receipt.retryCount}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{receipt.note}</p>
            {receipt.judgments.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No distribution was returned. Nothing was invented.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {receipt.judgments.map((j) => (
                  <li key={j.id} className="text-sm">
                    <span className="font-mono text-[11px] uppercase text-faint">{j.id}</span> {j.label}
                    {j.confidence !== null ? (
                      <span className="text-muted"> · concentration {j.confidence.toFixed(2)}</span>
                    ) : null}
                    <span className="mt-1 block font-mono text-[11px] text-faint">
                      {Object.entries(j.probabilities)
                        .map(([k, v]) => `${k} ${v.toFixed(2)}`)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 break-all font-mono text-[11px] text-faint">
              receipt {receipt.attemptId}
              {receipt.requestId ? ` · request ${receipt.requestId}` : ""}
            </p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">Policy disposition</p>
        <h2 className="font-display text-2xl">What the Library will allow</h2>
        {!packet ? (
          <p className="text-sm text-muted">No disposition yet.</p>
        ) : (
          <div className="rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <p className="font-display text-3xl">{packet.payload.disposition.replaceAll("_", " ")}</p>
            <p className="mt-2 text-sm text-muted">
              Relation {packet.payload.relation.replaceAll("_", " ")}. License{" "}
              {packet.epistemics.epistemic_license.replaceAll("_", " ")}.
              {packet.payload.human_review ? " A person should look." : ""}
            </p>
            <p className="mt-3 font-mono text-[11px] text-faint">
              allowed {packet.permissions.allowed_use.join(", ")}
            </p>
            <p className="mt-1 font-mono text-[11px] text-faint">
              forbidden {packet.permissions.forbidden_use.join(", ")}
            </p>
            <p className="mt-3 break-all font-mono text-[11px] text-faint">
              trace {packet.header.trace_id}
              {ledgerId ? ` · ledger ${ledgerId.slice(0, 16)}` : ""}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
        <h2 className="font-display text-2xl">Was this useful?</h2>
        {receiptId ? (
          <p className="mt-1 font-mono text-[11px] text-faint">Tied to receipt {receiptId}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="h-10 rounded-md bg-elevated px-4 text-sm"
            onClick={() => {
              trackLocal("feedback_yes", "/library");
              saveFeedback("yes", "", receiptId);
              setThanks("Thanks. That's all I collect. It stays on this device.");
            }}
          >
            Yes
          </button>
          <button
            type="button"
            className="h-10 rounded-md bg-elevated px-4 text-sm"
            onClick={() => {
              trackLocal("feedback_no", "/library");
              saveFeedback("no", "", receiptId);
              setThanks("Thanks. That's all I collect. It stays on this device.");
            }}
          >
            No
          </button>
        </div>
        <label className="mt-3 block text-sm text-muted">
          Tell me what was missing.
          <textarea
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2 min-h-20 w-full rounded-md bg-bg px-3 py-2 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
          />
        </label>
        <button
          type="button"
          className="mt-2 h-10 rounded-md bg-elevated px-4 text-sm disabled:opacity-50"
          disabled={note.trim().length < 3}
          onClick={() => {
            trackLocal("feedback_text_submitted", "/library");
            saveFeedback("text", note, receiptId);
            setNote("");
            setThanks("Thanks. That's all I collect. The note stays on this device.");
          }}
        >
          Send note
        </button>
        {thanks ? <p className="mt-3 text-sm">{thanks}</p> : null}
        <p className="mt-3 text-sm text-muted">
          <Link to="/insights">This device's counts</Link>
          {" · "}
          no account, no document bodies, no question text. Clove Insights on the public site is a
          separate system and is not written from here.
        </p>
      </section>
    </div>
  );
}
