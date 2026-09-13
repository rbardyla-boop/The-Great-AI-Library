import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConnectionCard } from "@/components/library/connection-card";
import { useDots } from "@/lib/dots/store";
import { connectionsFromLedger } from "@/lib/dots/registry";
import { kernel } from "@/lib/library/store";

export function DotsPanel({ query }: { query?: string }) {
  const lastReport = useDots((s) => s.lastReport);
  const reviews = useDots((s) => s.reviews);
  const notice = useDots((s) => s.notice);
  const runDiscovery = useDots((s) => s.runDiscovery);
  const review = useDots((s) => s.review);
  const challenge = useDots((s) => s.challenge);
  const promote = useDots((s) => s.promote);
  const keepOpen = useDots((s) => s.keepOpen);
  const importCard = useDots((s) => s.importCard);
  const [busy, setBusy] = useState(false);
  const [paste, setPaste] = useState("");
  const connections = (lastReport?.connections?.length
    ? lastReport.connections
    : connectionsFromLedger(kernel)
  )
    .slice()
    .sort((a, b) => {
      if (a.search !== b.search) return a.search === "FAR" ? -1 : 1;
      return b.scores.novelty - a.scores.novelty;
    });

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-xl">DOTS-0 — Discovery without contamination</p>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
            Connect-the-Dots may create hypotheses. It may not create facts. Near search finds
            neighbors. Far search finds the same structure in a different domain. Scores stay
            independent. A clever analogy is not a library claim.
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await runDiscovery(query);
            setBusy(false);
          }}
        >
          {busy ? "Searching…" : "Run Connect-the-Dots"}
        </Button>
      </div>
      {lastReport ? (
        <p className="font-mono text-[11px] text-faint">
          {lastReport.model} · {lastReport.checkpoint} · near {lastReport.nearCount} · far{" "}
          {lastReport.farCount} · {lastReport.connections.length} hypotheses · evidence{" "}
          {lastReport.evidenceRoot.slice(0, 8)}
        </p>
      ) : null}
      {notice ? <p className="text-sm text-warn">{notice}</p> : null}
      {connections.length > 0 ? (
        <ul className="space-y-4">
          {connections.map((c) => (
            <li key={c.id}>
              <ConnectionCard
                connection={c}
                reviews={reviews[c.id]?.seats}
                onReview={() => void review(c.id)}
                onChallenge={() =>
                  void challenge(
                    c.id,
                    c.counterargument || "Skeptic: the proposed relation is not distinguished by evidence.",
                    "Skeptic",
                  )
                }
                onPromote={() => void promote(c.id)}
                onKeepOpen={() => void keepOpen(c.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          No hypotheses on the ledger yet. Run Connect-the-Dots. Every visitor of this page gets
          the same local loop — not a live network.
        </p>
      )}
      <div className="rounded-lg bg-elevated p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
        <p className="font-display text-lg">Import a hypothesis card</p>
        <p className="mt-1 text-sm text-muted">
          HAVE/NEED of a hash. Import never makes a fact. A live agent mesh is not this page.
        </p>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={4}
          placeholder='{"protocol":"gal-dots/0","connection":{…}}'
          className="mt-3 w-full rounded-md bg-surface px-3 py-2 font-mono text-[11px] text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        />
        <Button
          className="mt-3"
          size="sm"
          variant="secondary"
          disabled={!paste.trim()}
          onClick={async () => {
            await importCard(paste);
            setPaste("");
          }}
        >
          Import as hypothesis
        </Button>
      </div>
    </section>
  );
}
