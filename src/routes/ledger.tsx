import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { selectLedger, useLibrary } from "@/lib/library/store";
import { formatGauntlet, runGauntlet, type GateResult } from "@/lib/kernel/gauntlet";

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
  const runFixity = useLibrary((s) => s.runFixity);
  const wiped = overlay.wipedDerivatives;
  const [gates, setGates] = useState<GateResult[] | null>(null);
  const [report, setReport] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const results = await runGauntlet();
    setGates(results);
    setReport(await formatGauntlet(results));
    setBusy(false);
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">The Ledger</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl">
          Commands, then receipts.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Hash-chained and append-only. Changing event #830 breaks #831 onward. Receipts are
          SHA-256 of the canonical event, not random tokens.
        </p>
      </header>

      <section className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-xl">GAL Gauntlet</p>
            <p className="mt-1 max-w-md text-sm text-muted">
              Twelve invariant gates on an isolated kernel. The preview is no longer the proof.
            </p>
          </div>
          <Button onClick={() => void run()} disabled={busy}>
            {busy ? "Running…" : "Run gauntlet"}
          </Button>
        </div>
        {gates ? (
          <ol className="mt-5 space-y-1 font-mono text-[12px]">
            {gates.map((g) => (
              <li key={g.name} className="flex justify-between gap-3">
                <span className="text-muted">{g.name}</span>
                <span className={g.pass ? "text-ok" : "text-danger"}>{g.pass ? "PASS" : "FAIL"}</span>
              </li>
            ))}
          </ol>
        ) : null}
        {report ? (
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-[11px] text-faint">
            {report}
          </pre>
        ) : null}
      </section>

      <section className="flex flex-col gap-3 rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-xl">Model-swap + fixity</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Delete every AI-generated summary and rebuild. Re-hash stored originals against
            SOURCE_ID.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {wiped ? (
            <Button onClick={() => void restore()}>Rebuild derivatives</Button>
          ) : (
            <Button variant="secondary" onClick={() => void wipe()}>
              Wipe derivatives
            </Button>
          )}
          <Button variant="secondary" onClick={() => void runFixity()}>
            Recheck fixity
          </Button>
          <Button variant="ghost" onClick={() => void reset()}>
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
            <p className="mt-1 break-all font-mono text-[11px] text-faint">receipt {ev.receipt}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
