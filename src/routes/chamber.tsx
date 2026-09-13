import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HashStamp } from "@/components/library/hash-stamp";
import { askValuesModel } from "@/lib/motive/ask-values";
import { DILEMMAS } from "@/lib/motive/dilemmas";
import { convene, type Convened } from "@/lib/motive/session";
import { useChamber } from "@/lib/motive/store";
import { pageHead } from "@/lib/seo";
import type { Recommendation } from "@/lib/values/types";
import { DotsPanel } from "@/components/library/dots-panel";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/chamber")({
  head: () =>
    pageHead(
      "The Chamber",
      "MOTIVE-0: identical intelligence, different VALUES, costly conflicts. Judgment is replayable. The membrane authorizes effects.",
    ),
  component: ChamberPage,
});

const REC_TONE: Record<Recommendation, "ok" | "warn" | "danger" | "info"> = {
  "act-legitimate": "ok",
  "request-exception": "warn",
  abstain: "info",
  escalate: "warn",
};

function ChamberPage() {
  const [active, setActive] = useState(DILEMMAS[0]!.id);
  const [session, setSession] = useState<Convened | null>(null);
  const [busy, setBusy] = useState(false);
  const [replayed, setReplayed] = useState<string | null>(null);
  const [expBusy, setExpBusy] = useState(false);
  const commitSeat = useChamber((s) => s.commitSeat);
  const decisions = useChamber((s) => s.decisions);
  const builderVersion = useChamber((s) => s.builderVersion) ?? "1.3.0";
  const runExperiment = useChamber((s) => s.runExperiment);
  const lastReport = useChamber((s) => s.lastReport) ?? null;

  async function run(id: string) {
    setBusy(true);
    setReplayed(null);
    setActive(id);
    const next = await convene(DILEMMAS.find((d) => d.id === id)!, builderVersion);
    setSession(next);
    setBusy(false);
  }

  useEffect(() => {
    void run(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builderVersion]);

  const dilemma = DILEMMAS.find((d) => d.id === active)!;

  return (
    <div className="space-y-10">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">The Chamber · MOTIVE-0</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl">
          Same mind. Different law.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Six roles, one checkpoint. VALUES recommend under cost. The Hive membrane authorizes — or
          does not. An agent may change its mind. It may not silently change the constitution.
          Connect-the-Dots sits beside them as a specialist that proposes, never proves.
        </p>
      </header>

      <DotsPanel />

      <section className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-xl">VALUES under cost</p>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Run all five dilemmas. Identical base, six VALUES. Cost is wasted privilege when a
              role asks the membrane for a forbidden effect. Builder is currently{" "}
              <span className="text-fg">{builderVersion}</span>.
            </p>
          </div>
          <Button
            variant="secondary"
            disabled={expBusy}
            onClick={async () => {
              setExpBusy(true);
              await runExperiment();
              setExpBusy(false);
            }}
          >
            {expBusy ? "Running…" : "Run MOTIVE-0"}
          </Button>
        </div>
        {lastReport ? (
          <div className="mt-5 space-y-4">
            <p className="font-mono text-[11px] text-faint">
              {lastReport.model} · {lastReport.checkpoint} · evidence{" "}
              <HashStamp hash={lastReport.evidenceRoot} /> · wasted-privilege{" "}
              {lastReport.totalWastedPrivilege} · costly {lastReport.costlyCount}/
              {lastReport.dilemmaCount}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left font-mono text-[11px]">
                <thead className="text-faint">
                  <tr>
                    <th className="pb-2 pr-3 font-medium">Dilemma</th>
                    {lastReport.dilemmas[0]?.seats.map((s) => (
                      <th key={s.role} className="pb-2 pr-3 font-medium capitalize">
                        {s.role}
                      </th>
                    ))}
                    <th className="pb-2 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {lastReport.dilemmas.map((d) => (
                    <tr key={d.id} className="border-t border-border">
                      <td className="py-2 pr-3 text-muted">{d.title}</td>
                      {d.seats.map((s) => (
                        <td key={s.role} className="py-2 pr-3 text-fg">
                          {s.recommendation}
                          {s.wastedPrivilege > 0 ? (
                            <span className="text-warn"> · {s.wastedPrivilege}</span>
                          ) : null}
                        </td>
                      ))}
                      <td className={d.costly ? "py-2 text-warn" : "py-2 text-ok"}>
                        {d.costly ? `costly ${d.wastedPrivilege}` : "cheap"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {DILEMMAS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => void run(d.id)}
            className={cn(
              "rounded-lg p-4 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-colors",
              d.id === active ? "bg-elevated" : "bg-surface hover:bg-elevated",
            )}
          >
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{d.family}</p>
            <p className="mt-1 font-display text-xl">{d.title}</p>
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted">{d.situation}</p>
          </button>
        ))}
      </section>

      <section className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] md:p-6">
        <p className="font-display text-2xl">{dilemma.title}</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{dilemma.situation}</p>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-faint">Easy path</dt>
            <dd className="mt-1 text-danger">{dilemma.easyPath.label}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-faint">Lawful path</dt>
            <dd className="mt-1 text-ok">{dilemma.legitimatePath.label}</dd>
          </div>
        </dl>
        {session ? (
          <p className="mt-4 font-mono text-[11px] text-faint">
            Majority {session.majority} · {session.unique} recommendations · wasted-privilege{" "}
            {session.wastedPrivilege}
            {session.costly ? " · costly conflict" : ""}
          </p>
        ) : null}
      </section>

      {busy ? (
        <p className="flex items-center gap-2 font-mono text-sm text-muted">
          <LoaderCircle className="size-4 animate-spin" /> Convening…
        </p>
      ) : session ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {session.seats.map((seat) => (
            <li
              key={seat.profile.uri}
              className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-2xl">{seat.profile.name}</p>
                <Badge>{seat.profile.version}</Badge>
                <Badge tone={REC_TONE[seat.judgment.recommendation]}>
                  {seat.judgment.recommendation}
                </Badge>
                <Badge tone={seat.membrane.allow ? "ok" : "danger"}>
                  {seat.membrane.allow ? "membrane allowed" : "membrane denied"}
                </Badge>
              </div>
              <p className="mt-1 font-mono text-[11px] text-faint">
                {seat.profile.uri} · <HashStamp hash={seat.profile.hash} />
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{seat.judgment.justification}</p>
              <p className="mt-2 text-xs text-faint">{seat.membrane.reason}</p>
              <p className="mt-3 font-mono text-[11px] text-faint">
                authorized: false · temptation {seat.cost.temptation} · wasted-privilege{" "}
                {seat.cost.wastedPrivilege}
                {seat.cost.dissent ? " · dissent" : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void commitSeat(dilemma.id, seat.profile.role)}
                >
                  Record receipt
                </Button>
                {seat.profile.role === "builder" && seat.profile.version === "1.3.0" ? (
                  <ReplayButton
                    dilemmaId={dilemma.id}
                    onDone={(text) => setReplayed(text)}
                  />
                ) : null}
                <JustifyButton
                  role={seat.profile.name}
                  valuesUri={seat.profile.uri}
                  valuesHash={seat.profile.hash}
                  dilemma={dilemma.id}
                  situation={dilemma.situation}
                  recommendation={seat.judgment.recommendation}
                  justification={seat.judgment.justification}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {replayed ? (
        <section className="rounded-lg bg-elevated p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Replay</p>
          <p className="mt-2 text-sm leading-relaxed text-fg">{replayed}</p>
        </section>
      ) : null}

      {decisions.length > 0 ? (
        <section>
          <h2 className="font-display text-2xl">Decision receipts</h2>
          <ol className="mt-4 space-y-3">
            {decisions.slice(0, 8).map((d) => (
              <li key={d.id} className="font-mono text-[12px] text-muted">
                {d.id} · {d.model} · {d.judgment.role}@{d.valuesVersion} · {d.dilemmaId} ·{" "}
                {d.judgment.recommendation} · membrane {d.membrane.allow ? "allow" : "deny"} ·
                evidence <HashStamp hash={d.evidenceRoot} /> · VALUES{" "}
                <HashStamp hash={d.valuesHash} />
                {d.ledgerReceipt ? (
                  <>
                    {" "}
                    · ledger <HashStamp hash={d.ledgerReceipt} />
                  </>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

function ReplayButton({
  dilemmaId,
  onDone,
}: {
  dilemmaId: string;
  onDone: (text: string) => void;
}) {
  const replaySeat = useChamber((s) => s.replaySeat);
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const result = await replaySeat(dilemmaId, "values://open-hive/builder/1.4.0");
          onDone(
            `Builder 1.3.0 → ${result.original.judgment.recommendation}. Replay under 1.4.0 → ${result.replayed.recommendation}. Original JUDGE ${result.original.ledgerReceipt ?? result.original.id} is unchanged. REPLAY ${result.ledgerReceipt}. Only the judging constitution moved — through epoch, not silently.`,
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Replaying…" : "Replay under 1.4.0"}
    </Button>
  );
}

function JustifyButton(props: {
  role: string;
  valuesUri: string;
  valuesHash: string;
  dilemma: string;
  situation: string;
  recommendation: string;
  justification: string;
}) {
  const [text, setText] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="w-full">
      <Button
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          try {
            const res = await askValuesModel({ data: props });
            if (!res.ok) setErr("The black box is unavailable. Deterministic VALUES still stand.");
            else setText(res.text);
          } catch {
            setErr("The black box is unavailable. Deterministic VALUES still stand.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
        Ask Grok to justify
      </Button>
      {text ? <p className="mt-2 text-xs leading-relaxed text-muted">{text}</p> : null}
      {err ? <p className="mt-2 text-xs text-warn">{err}</p> : null}
    </div>
  );
}
