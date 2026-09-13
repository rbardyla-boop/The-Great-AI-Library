import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { selectDesk, selectRecords, useLibrary } from "@/lib/library/store";
import type { DeskItem } from "@/lib/library/types";

export const Route = createFileRoute("/desk")({ component: Desk });

const TONE: Record<DeskItem["severity"], "info" | "warn" | "danger"> = {
  info: "info",
  warn: "warn",
  alert: "danger",
};

function Desk() {
  const overlay = useLibrary();
  const items = selectDesk(overlay);
  const pending = items.filter((i) => i.decision === "pending");
  const decided = items.filter((i) => i.decision !== "pending");
  const records = selectRecords(overlay);
  const decide = useLibrary((s) => s.decideDesk);

  const processed = records.length;
  const dupes = records.filter((r) => r.duplicateOf).length;
  const conflicts = pending.filter((i) => i.kind === "conflict").length;
  const aliases = pending.filter((i) => i.kind === "alias").length;
  const integrity = pending.filter((i) => i.kind === "integrity" || i.kind === "changed").length;

  return (
    <div className="space-y-10">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
          Archivist Desk
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl">
          Overnight report
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          The Archivist does not pester. It maintains. Accept or reject only what needs a human.
        </p>
      </header>

      <section className="rounded-xl bg-surface p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] md:p-8">
        <p className="font-display text-2xl">{processed} items processed overnight</p>
        <ul className="mt-5 space-y-2 font-mono text-sm text-muted">
          <li className="text-ok">✓ {records.filter((r) => r.kind === "original").length} sources catalogued</li>
          <li className="text-ok">✓ {dupes} duplicates linked</li>
          <li className="text-ok">✓ {overlay.wipedDerivatives ? "derivatives wiped on request" : "claims extracted with passage-level provenance"}</li>
          <li className="text-warn">△ {conflicts} conflicting claim sets</li>
          <li className="text-warn">△ {aliases} uncertain identity matches</li>
          <li className="text-danger">! {integrity} integrity / retraction events</li>
          <li className="text-danger">
            ! {pending.filter((i) => i.kind === "injection").length} injection attempt refused
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl">Review {pending.length} items</h2>
        <ul className="mt-4 space-y-3">
          {pending.map((item) => (
            <li
              key={item.id}
              className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={TONE[item.severity]}>{item.kind}</Badge>
                <span className="font-mono text-[11px] text-faint">{item.id}</span>
              </div>
              <h3 className="mt-3 text-base text-fg">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.relatedIds.slice(0, 6).map((id) =>
                  id.startsWith("doc-") || id.startsWith("user-") ? (
                    <Link
                      key={id}
                      to="/record/$id"
                      params={{ id }}
                      className="font-mono text-[11px] text-info hover:text-fg"
                    >
                      {id}
                    </Link>
                  ) : (
                    <span key={id} className="font-mono text-[11px] text-faint">
                      {id}
                    </span>
                  ),
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => decide(item.id, "accepted")}>
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => decide(item.id, "rejected")}
                >
                  Keep open
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {decided.length > 0 ? (
        <section>
          <h2 className="font-display text-2xl">Filed</h2>
          <ul className="mt-4 space-y-2">
            {decided.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md bg-surface px-4 py-3 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
              >
                <span className="text-muted">{item.title}</span>
                <Badge tone={item.decision === "accepted" ? "ok" : "muted"}>{item.decision}</Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
