import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { HashStamp } from "@/components/library/hash-stamp";
import { StatusBadge } from "@/components/library/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  seed,
  selectClaims,
  selectContradictions,
  selectDesk,
  selectRecords,
  useLibrary,
} from "@/lib/library/store";

import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead("The Stacks", "Preserved sources. Originals are immutable. Everything else is a derivative with a receipt."),
  component: Stacks,
});

function Stacks() {
  const overlay = useLibrary();
  const records = selectRecords(overlay);
  const claims = selectClaims(overlay);
  const contradictions = selectContradictions(overlay).filter((c) => c.status === "open");
  const pending = selectDesk(overlay).filter((d) => d.decision === "pending").length;
  const originals = records.filter((r) => r.kind === "original");
  const derivatives = records.filter((r) => r.kind === "derivative");

  return (
    <div className="stagger-in space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">The Stacks</p>
          <h1 className="mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl">
            Preserved sources
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Originals are immutable. Everything the Archivist writes is a derivative with a
            receipt. Overnight: {originals.length} sources, {claims.length} claims,{" "}
            {contradictions.length} open conflicts.
          </p>
          <Link to="/library" className="mt-3 inline-block text-sm text-muted">
            Open the Library slice
          </Link>
        </div>
        <Link
          to="/desk"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-elevated px-4 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        >
          {pending} waiting at the desk
          <ArrowUpRight className="size-4" />
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { k: "Originals", v: originals.length },
          { k: "Derivatives", v: derivatives.length },
          { k: "Claims", v: claims.length },
          { k: "Open conflicts", v: contradictions.length },
        ].map((s) => (
          <div key={s.k} className="rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{s.k}</p>
            <p className="mt-2 font-display text-3xl tabular-nums">{s.v}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display text-2xl">Collections</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {seed.collections.map((c) => {
            const n = records.filter((r) => r.collectionIds.includes(c.id)).length;
            return (
              <div
                key={c.id}
                className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl">{c.name}</h3>
                  <span className="font-mono text-[11px] tabular-nums text-faint">{n}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{c.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl">Sources</h2>
          <p className="font-mono text-[11px] text-faint">click a title for provenance</p>
        </div>
        <ul className="mt-4 divide-y divide-border rounded-lg bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          {records.map((r) => (
            <li key={r.id}>
              <Link
                to="/record/$id"
                params={{ id: r.id }}
                className="flex flex-col gap-2 px-4 py-4 hover:bg-elevated md:flex-row md:items-center md:gap-6"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-fg">{r.title}</p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {r.author} · {r.createdAt}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={r.kind} />
                  <Badge>{r.sourceType}</Badge>
                  {r.injectionFlag ? <Badge tone="danger">injection</Badge> : null}
                  {r.integrityAlert ? <Badge tone="danger">integrity</Badge> : null}
                  {r.duplicateOf ? <Badge tone="info">duplicate</Badge> : null}
                  <HashStamp hash={r.contentHash} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
