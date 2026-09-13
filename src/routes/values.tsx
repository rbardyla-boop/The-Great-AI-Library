import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HashStamp } from "@/components/library/hash-stamp";
import { objectPath } from "@/lib/kernel/crypto";
import { kernel, useLibrary } from "@/lib/library/store";
import { valuesCanonical } from "@/lib/values/object";
import { allProfiles } from "@/lib/values/profiles";
import { CONSTITUTIONAL_VALUES } from "@/lib/values/constitution";
import { useChamber } from "@/lib/motive/store";
import { silentRewrite } from "@/lib/motive/session";
import { pageHead } from "@/lib/seo";
import type { ValuesProfile } from "@/lib/values/types";

export const Route = createFileRoute("/values")({
  head: () =>
    pageHead(
      "V.A.L.U.E.S.",
      "Versioned, inspectable normative layer. VALUES recommend and abstain. Only the Hive membrane authorizes effects.",
    ),
  component: ValuesPage,
});

function ValuesPage() {
  const [profiles, setProfiles] = useState<ValuesProfile[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const propose = useChamber((s) => s.propose);
  const proposals = useChamber((s) => s.proposals);
  const accept = useChamber((s) => s.acceptProposal);
  const builderVersion = useChamber((s) => s.builderVersion);
  const tick = useLibrary((s) => s.tick);
  const ready = useLibrary((s) => s.ready);

  useEffect(() => {
    void allProfiles().then(setProfiles);
  }, []);

  const installed = profiles.filter((p) => p.version === "1.3.0");
  const connector = profiles.find((p) => p.role === "connector");
  const nextBuilder = profiles.find((p) => p.role === "builder" && p.version === "1.4.0");

  return (
    <div className="space-y-10">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
          V.A.L.U.E.S.
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl">
          Judgment, not authority.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Verifiable Agent-Level Utility & Epistemic Standards. Each profile is a content-addressed
          object. Constitutional values cannot be traded. Role emphasis can. VALUES never grant a
          privilege.
        </p>
        <p className="mt-2 font-mono text-[11px] text-faint">
          Installed builder {builderVersion}
        </p>
      </header>

      <section className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
        <p className="font-display text-xl">Constitutional — cannot be traded</p>
        <ul className="mt-4 space-y-4">
          {CONSTITUTIONAL_VALUES.map((v) => (
            <li key={v.id}>
              <p className="text-sm text-fg">{v.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{v.definition}</p>
              <p className="mt-1 font-mono text-[11px] text-faint">{v.id}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl">Six roles, one checkpoint</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {installed.map((p) => (
            <article
              key={p.uri}
              className="rounded-xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-2xl">{p.name}</h3>
                <Badge>{p.version}</Badge>
                <CasBadge hash={p.hash} ready={ready} tick={tick} />
              </div>
              <p className="mt-1 break-all font-mono text-[11px] text-faint">
                {p.uri} · <HashStamp hash={p.hash} />
              </p>
              <p className="mt-1 break-all font-mono text-[11px] text-faint">{objectPath(p.hash)}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{p.emphasis}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 font-mono text-[11px] text-muted">
                {Object.entries(p.preferences).map(([k, w]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt>{k}</dt>
                    <dd className="tabular-nums text-fg">{w}</dd>
                  </div>
                ))}
              </dl>
              <details className="mt-4">
                <summary className="cursor-pointer font-mono text-[11px] text-faint">
                  Inspect object
                </summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-muted">
                  {valuesCanonical(p)}
                </pre>
              </details>
            </article>
          ))}
        </div>
      </section>

      {connector ? (
        <section className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-xl">{connector.name}</p>
            <Badge>{connector.version}</Badge>
            <CasBadge hash={connector.hash} ready={ready} tick={tick} />
          </div>
          <p className="mt-1 break-all font-mono text-[11px] text-faint">
            {connector.uri} · <HashStamp hash={connector.hash} />
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{connector.emphasis}</p>
          <p className="mt-2 text-sm text-muted">
            Not a MOTIVE-0 seat. It proposes candidate relationships. Skeptic, Archivist, and
            Explorer attack them. The Desk decides. It never writes a truth field.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 font-mono text-[11px] text-muted">
            {Object.entries(connector.preferences).map(([k, w]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt>{k}</dt>
                <dd className="tabular-nums text-fg">{w}</dd>
              </div>
            ))}
            {connector.specialist
              ? Object.entries(connector.specialist).map(([k, w]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt>{k}</dt>
                    <dd className="tabular-nums text-fg">{w}</dd>
                  </div>
                ))
              : null}
          </dl>
        </section>
      ) : null}

      {nextBuilder ? (
        <section className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          <p className="font-display text-xl">Epoch amendment — Builder 1.3 → 1.4</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Completion 9 → 6. Downside 3 → 7. The 1.3 hash stays on existing receipts. Replay
            uses 1.4 without rewriting history. Cost of request-exception falls with completion.
          </p>
          <p className="mt-2 break-all font-mono text-[11px] text-faint">
            proposed {nextBuilder.uri} · <HashStamp hash={nextBuilder.hash} /> ·{" "}
            {objectPath(nextBuilder.hash)} ·{" "}
            <CasBadge hash={nextBuilder.hash} ready={ready} tick={tick} />
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                const p = await propose(
                  "Completion pressure produced request-exception on forbidden effects. Lower completion; raise downside protection.",
                );
                setNotice(`Amendment ${p.id} recorded as proposed. Builder 1.3 remains installed.`);
              }}
            >
              Propose amendment
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const d = silentRewrite();
                setNotice(d.reason);
              }}
            >
              Try silent rewrite
            </Button>
          </div>
          {notice ? <p className="mt-3 text-sm text-warn">{notice}</p> : null}
          {proposals.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {proposals.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-muted">
                    {p.id} · {p.status} · {p.fromUri.split("/").slice(-2).join("@")} →{" "}
                    {p.toUri.split("/").pop()}
                  </span>
                  {p.status === "proposed" ? (
                    <Button size="sm" variant="ghost" onClick={() => void accept(p.id)}>
                      Accept into epoch
                    </Button>
                  ) : (
                    <Badge tone="ok">epoch</Badge>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <CoalitionDemo />
    </div>
  );
}

function CasBadge({ hash, ready, tick }: { hash: string; ready: boolean; tick: number }) {
  void tick;
  const present = kernel.objects.has(hash);
  if (!ready && !present) return <Badge tone="warn">CAS pending</Badge>;
  return <Badge tone={present ? "ok" : "danger"}>{present ? "CAS verified" : "CAS missing"}</Badge>;
}

function CoalitionDemo() {
  const [out, setOut] = useState<string | null>(null);
  return (
    <section className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <p className="font-display text-xl">Coalition cannot mint authority</p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Agent A can read a secret. Agent B can use the network. A paraphrases the secret as
        “nothing sensitive.” B still carries SECRET taint. Egress is denied.
      </p>
      <Button
        className="mt-4"
        variant="secondary"
        onClick={async () => {
          const { authorizeEffect, transferTaint, peerGo, spawnSuccessor } = await import("@/lib/hive/membrane");
          const { newBuilderIdentity } = await import("@/lib/motive/session");
          const taint = transferTaint(["SECRET"], true);
          const send = authorizeEffect(
            { kind: "NETWORK_SEND", summary: "send paraphrase", taint, destination: "public-network" },
            taint,
          );
          const go = peerGo(newBuilderIdentity(), { ...newBuilderIdentity(), id: "b" });
          const child = spawnSuccessor(newBuilderIdentity());
          setOut(
            `${send.reason}\n${go.reason}\nChild ${child.id} trust=${child.trust} capabilities=${child.capabilities.length}.`,
          );
        }}
      >
        Attempt collusion
      </Button>
      {out ? <pre className="mt-3 whitespace-pre-wrap font-mono text-[11px] text-warn">{out}</pre> : null}
    </section>
  );
}
