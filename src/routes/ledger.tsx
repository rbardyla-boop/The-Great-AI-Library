import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HashStamp } from "@/components/library/hash-stamp";
import { kernel, selectLedger, useLibrary } from "@/lib/library/store";
import { formatGauntlet, runGauntlet, type GateResult } from "@/lib/kernel/gauntlet";
import { valuesLedgerEvents } from "@/lib/values/registry";
import { dotsLedgerEvents } from "@/lib/dots/registry";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ledger")({
  head: () => pageHead("The Ledger", "Hash-chained commands and receipts. Run the GAL gauntlet."),
  component: LedgerPage,
});

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
  const valuesEvents = valuesLedgerEvents(kernel).slice().reverse();
  const dotsEvents = dotsLedgerEvents(kernel).slice().reverse();

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

      {dotsEvents.length > 0 ? (
        <section className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          <p className="font-display text-xl">Discovery receipts</p>
          <p className="mt-1 max-w-xl text-sm text-muted">
            CONNECT files a hypothesis. Reviews travel as gal://review objects. SUPPORT splits
            into OPINION and EVIDENTIARY. Opinion contributes zero. A REVIEW_SET receipt records
            exactly what this Library considered. HMAC is integrity, not trust.
          </p>
          <ol className="mt-4 space-y-3">
            {dotsEvents.slice(0, 24).map((ev) => {
              const p = asPayload(ev.payload);
              return (
                <li key={ev.event_id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={TONE[ev.actor] ?? "muted"}>{ev.actor}</Badge>
                    <span className="font-mono text-[11px] text-faint">{ev.command}</span>
                    <span className="font-mono text-[11px] tabular-nums text-faint">
                      {ev.timestamp.replace("T", " ").replace(".000Z", "Z")}
                    </span>
                    {ev.result === "denied" ? <Badge tone="danger">denied</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-fg">{ev.summary}</p>
                  <PayloadLine command={ev.command} payload={p} />
                  <p className="mt-1 break-all font-mono text-[11px] text-faint">
                    receipt {ev.event_hash}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {valuesEvents.length > 0 ? (
        <section className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          <p className="font-display text-xl">VALUES receipts</p>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Each judgment names the model, the role, the VALUES version, and the evidence root.
            Replay does not rewrite these events.
          </p>
          <ol className="mt-4 space-y-3">
            {valuesEvents.slice(0, 24).map((ev) => {
              const p = asPayload(ev.payload);
              const model = str(p.model);
              const role = str(p.role);
              const valuesVersion = str(p.valuesVersion);
              const evidenceRoot = str(p.evidenceRoot);
              return (
                <li key={ev.event_id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={TONE[ev.actor] ?? "muted"}>{ev.actor}</Badge>
                    <span className="font-mono text-[11px] text-faint">{ev.command}</span>
                    <span className="font-mono text-[11px] tabular-nums text-faint">
                      {ev.timestamp.replace("T", " ").replace(".000Z", "Z")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-fg">{ev.summary}</p>
                  <PayloadLine command={ev.command} payload={p} />
                  {model || role || valuesVersion || evidenceRoot ? (
                    <p className="mt-1 font-mono text-[11px] text-faint">
                      {model ? `${model} · ` : ""}
                      {role ? `${role} · ` : ""}
                      {valuesVersion ? `VALUES ${valuesVersion} · ` : ""}
                      {evidenceRoot ? (
                        <>
                          evidence <HashStamp hash={evidenceRoot} />
                        </>
                      ) : null}
                    </p>
                  ) : null}
                  <p className="mt-1 break-all font-mono text-[11px] text-faint">
                    receipt {ev.event_hash}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

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

function asPayload(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function PayloadLine({ command, payload }: { command: string; payload: Record<string, unknown> }) {
  if (command === "REPLAY") {
    return (
      <p className="mt-1 font-mono text-[11px] text-faint">
        {str(payload.originalValuesVersion)} → {str(payload.replayValuesVersion)} ·{" "}
        {str(payload.originalRecommendation)} → {str(payload.replayRecommendation)} · original{" "}
        <HashStamp hash={str(payload.originalReceipt) || str(payload.originalDecisionId)} />
      </p>
    );
  }
  if (command === "AMENDMENT_PROPOSED") {
    return (
      <p className="mt-1 font-mono text-[11px] text-faint">
        {str(payload.fromUri)} → {str(payload.toUri)}
      </p>
    );
  }
  if (command === "MOTIVE_EXPERIMENT") {
    const dilemmas = Array.isArray(payload.dilemmas) ? payload.dilemmas : [];
    return (
      <div className="mt-1">
        <p className="font-mono text-[11px] text-faint">
          builder {str(payload.builderVersion)} · {String(payload.dilemmaCount ?? dilemmas.length)}{" "}
          dilemmas · {String(payload.costlyCount ?? 0)} costly · wasted{" "}
          {String(payload.totalWastedPrivilege ?? 0)}
        </p>
        {dilemmas.length > 0 ? (
          <details className="mt-2">
            <summary className="cursor-pointer font-mono text-[11px] text-faint">Seat matrix</summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-muted">
              {JSON.stringify(dilemmas, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    );
  }
  if (command === "CONNECT" || command === "IMPORT_HYPOTHESIS" || command === "REPLICATE") {
    return (
      <p className="mt-1 break-all font-mono text-[11px] text-faint">
        {str(payload.uri)} · {str(payload.connectionId)} · {str(payload.type) || "REPLICATE"} ·
        artifact {str(payload.artifactStatus) || str(payload.status) || "HYPOTHESIS"}
      </p>
    );
  }
  if (command === "REVIEW_SET" || command === "IMPORT_REVIEW") {
    return (
      <p className="mt-1 break-all font-mono text-[11px] text-faint">
        {str(payload.reviewUri) || str(payload.uri)} · policy {str(payload.policyVersion)} ·
        decision {str(payload.decision)} · reviews {String((payload.reviewHashes as unknown[] | undefined)?.length ?? "")}{" "}
        · {str(payload.kind) || str(payload.supportClass)}
      </p>
    );
  }
  if (
    command === "CHALLENGE" ||
    command === "SUPPORT" ||
    command === "FALSIFY" ||
    command === "PROMOTE" ||
    command === "KEEP_OPEN" ||
    command === "REVIEW"
  ) {
    return (
      <p className="mt-1 break-all font-mono text-[11px] text-faint">
        {str(payload.reviewUri) || str(payload.uri) || str(payload.addresses)} ·{" "}
        {str(payload.supportClass) || "—"} · contribution {String(payload.evidentiaryContribution ?? 0)} ·
        original <HashStamp hash={str(payload.originalHash) || str(payload.originalReceipt)} />
      </p>
    );
  }
  return null;
}
