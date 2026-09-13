import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { selectLedger, useLibrary } from "@/lib/library/store";

export const Route = createFileRoute("/ledger")({ component: LedgerPage });

const TONE: Record<string, "muted" | "ok" | "warn" | "danger" | "info" | "accent"> = {
  archivist: "info",
  human: "accent",
  librarian: "muted",
  policy: "warn",
};

function LedgerPage() {
  const overlay = useLibrary();
  const events = selectLedger(overlay);
  const wipe = useLibrary((s) => s.wipeDerivatives);
  const restore = useLibrary((s) => s.restoreDerivatives);
  const reset = useLibrary((s) => s.resetLibrary);
  const wiped = overlay.wipedDerivatives;

  return (
    <div className="space-y-10">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">The Ledger</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl">
          Commands, then receipts.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Models propose. Policy authorizes. The Archivist validates. Nothing is a silent table
          mutation. This log is append-only.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-xl">Model-swap gate</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Delete every AI-generated summary and rebuild. Original hashes stay put.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {wiped ? (
            <Button onClick={restore}>Rebuild derivatives</Button>
          ) : (
            <Button variant="secondary" onClick={wipe}>
              Wipe derivatives
            </Button>
          )}
          <Button variant="ghost" onClick={reset}>
            Restore seed
          </Button>
        </div>
      </section>

      <ol className="relative space-y-0 border-l border-border pl-6">
        {events.map((ev) => (
          <li key={ev.id} className="relative pb-8">
            <span className="absolute -left-[25px] top-1 size-2 rounded-full bg-accent" />
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={TONE[ev.actor] ?? "muted"}>{ev.actor}</Badge>
              <span className="font-mono text-[11px] text-faint">{ev.command}</span>
              <span className="font-mono text-[11px] tabular-nums text-faint">
                {ev.at.replace("T", " ").replace(".000Z", "Z")}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-fg">{ev.summary}</p>
            <p className="mt-1 font-mono text-[11px] text-faint">receipt {ev.receipt}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
