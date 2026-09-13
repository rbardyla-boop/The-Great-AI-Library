import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { HashStamp } from "@/components/library/hash-stamp";
import { StatusBadge } from "@/components/library/status-badge";
import {
  seed,
  selectClaims,
  selectRecords,
  useLibrary,
} from "@/lib/library/store";

export const Route = createFileRoute("/record/$id")({ component: RecordPage });

function RecordPage() {
  const { id } = Route.useParams();
  const overlay = useLibrary();
  const record = selectRecords(overlay).find((r) => r.id === id);
  const claims = selectClaims(overlay).filter((c) => c.recordId === id);

  if (!record) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-4xl">Not in the Stacks</h1>
        <p className="text-muted">No record with that identifier. Absence, not invention.</p>
        <Link to="/" className="text-sm text-info">
          Return to the Stacks
        </Link>
      </div>
    );
  }

  const entities = seed.entities.filter((e) =>
    claims.some((c) => c.entities.includes(e.id)),
  );

  return (
    <div className="space-y-8">
      <Link to="/" className="font-mono text-[11px] text-faint hover:text-fg">
        ← Stacks
      </Link>
      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={record.kind} />
          <Badge>{record.sourceType}</Badge>
          {record.injectionFlag ? <Badge tone="danger">injection held as data</Badge> : null}
          {record.integrityAlert ? <Badge tone="danger">fixity mismatch</Badge> : null}
          {record.duplicateOf ? <Badge tone="info">duplicate of {record.duplicateOf}</Badge> : null}
        </div>
        <h1 className="font-display text-4xl tracking-[-0.03em] md:text-5xl">{record.title}</h1>
        <p className="text-sm text-muted">
          {record.author} · created {record.createdAt} · acquired {record.acquiredAt.slice(0, 10)}
        </p>
        <p className="break-all font-mono text-[11px] text-faint">
          {record.originalUri} · sha {record.contentHash}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="paper-grain rounded-xl p-6 text-ink shadow-[var(--shadow-paper)] md:p-8">
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink/50">
            Original object
          </p>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
            {record.body}
          </pre>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <h2 className="font-display text-xl">Provenance</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Kind</dt>
                <dd>{record.kind}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Hash</dt>
                <dd>
                  <HashStamp hash={record.contentHash} className="text-fg" />
                </dd>
              </div>
              {record.processor ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Processor</dt>
                  <dd className="font-mono text-[11px]">{record.processor}</dd>
                </div>
              ) : null}
              {record.derivedFrom?.length ? (
                <div>
                  <dt className="text-muted">Derived from</dt>
                  <dd className="mt-1 space-y-1">
                    {record.derivedFrom.map((d) => (
                      <Link
                        key={d}
                        to="/record/$id"
                        params={{ id: d }}
                        className="block font-mono text-[11px] text-info"
                      >
                        {d}
                      </Link>
                    ))}
                  </dd>
                </div>
              ) : (
                <p className="text-xs text-ok">This is evidence, not a derivative.</p>
              )}
              {record.brokenLinks?.length ? (
                <div>
                  <dt className="text-muted">Broken links</dt>
                  <dd className="mt-1 font-mono text-[11px] text-warn">
                    {record.brokenLinks.join(", ")}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <h2 className="font-display text-xl">Claims</h2>
            {claims.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No claims extracted from this source.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {claims.map((c) => (
                  <li key={c.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-faint">{c.id}</span>
                      <StatusBadge status={c.status} />
                      <Badge tone="muted">{c.temporal.replace("_", " ")}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{c.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {entities.length > 0 ? (
            <section className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
              <h2 className="font-display text-xl">Entities</h2>
              <ul className="mt-3 space-y-2">
                {entities.map((e) => (
                  <li key={e.id}>
                    <p className="text-sm">{e.name}</p>
                    <p className="text-xs text-muted">{e.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
