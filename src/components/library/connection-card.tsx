import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HashStamp } from "@/components/library/hash-stamp";
import { exportCard } from "@/lib/dots/exhibit";
import type { CandidateConnection, ConnectionReview } from "@/lib/dots/types";
import { cn } from "@/lib/cn";

const STATUS_TONE: Record<CandidateConnection["status"], "warn" | "ok" | "danger" | "info"> = {
  HYPOTHESIS: "warn",
  SUPPORTED: "ok",
  CONTESTED: "info",
  FALSIFIED: "danger",
};

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between gap-2 font-mono text-[11px] text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value.toFixed(2)}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.max(4, value * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function ConnectionCard({
  connection,
  reviews,
  onReview,
  onChallenge,
  onPromote,
  onKeepOpen,
}: {
  connection: CandidateConnection;
  reviews?: ConnectionReview[];
  onReview?: () => void;
  onChallenge?: () => void;
  onPromote?: () => void;
  onKeepOpen?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const scores = connection.scores;

  return (
    <article className="rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-[11px] text-faint">{connection.id}</p>
        <Badge>{connection.type.replace("_", " ")}</Badge>
        <Badge tone={connection.search === "FAR" ? "accent" : "muted"}>{connection.search}</Badge>
        <Badge tone={STATUS_TONE[connection.status]}>{connection.status}</Badge>
      </div>
      <p className="mt-3 font-display text-2xl leading-tight">{connection.proposedRelation}</p>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-warn">
        {connection.status === "SUPPORTED"
          ? "Supported hypothesis — not library fact"
          : "Hypothesis — not library fact"}
      </p>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-faint">Dots</dt>
          <dd className="mt-1 font-mono text-[11px] text-muted">{connection.dotIds.join(" · ")}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-faint">Shared structure</dt>
          <dd className="mt-1 leading-relaxed text-fg">{connection.sharedStructure}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-faint">Why this may matter</dt>
          <dd className="mt-1 leading-relaxed text-muted">{connection.whyItMayMatter}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-faint">Counterargument</dt>
          <dd className="mt-1 leading-relaxed text-muted">{connection.counterargument}</dd>
        </div>
      </dl>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Score label="Strength" value={scores.strength} />
        <Score label="Novelty" value={scores.novelty} />
        <Score label="Relevance" value={scores.relevance} />
        <Score label="Independence" value={scores.independence} />
        <Score label="Falsifiability" value={scores.falsifiability} />
      </div>
      <p className="mt-4 text-sm text-muted">
        <span className="font-mono text-[11px] uppercase tracking-wider text-faint">Would strengthen · </span>
        {connection.missingEvidence[0] ?? "More independent sources."}
      </p>
      <p className="mt-2 text-sm text-muted">
        <span className="font-mono text-[11px] uppercase tracking-wider text-faint">Would falsify · </span>
        {connection.falsifiers[0]}
      </p>
      <p className="mt-4 break-all font-mono text-[11px] text-faint">
        {connection.model} · {connection.search} · VALUES {connection.valuesUri} · evidence{" "}
        <HashStamp hash={connection.evidenceRoot} /> · object <HashStamp hash={connection.hash} />
        {connection.ledgerReceipt ? (
          <>
            {" "}
            · ledger <HashStamp hash={connection.ledgerReceipt} />
          </>
        ) : null}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {onReview ? (
          <Button size="sm" variant="secondary" onClick={onReview}>
            Convene review
          </Button>
        ) : null}
        {onChallenge ? (
          <Button size="sm" variant="ghost" onClick={onChallenge}>
            Skeptic challenge
          </Button>
        ) : null}
        {onKeepOpen ? (
          <Button size="sm" variant="ghost" onClick={onKeepOpen}>
            Keep open
          </Button>
        ) : null}
        {onPromote ? (
          <Button size="sm" variant="danger" onClick={onPromote}>
            Promote to fact
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            await navigator.clipboard.writeText(exportCard(connection));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Card copied" : "Export card"}
        </Button>
      </div>
      {reviews && reviews.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-border pt-4">
          {reviews.map((r) => (
            <li key={r.valuesUri} className="font-mono text-[11px] text-muted">
              <span className="text-fg">{r.role}</span> · {r.recommendation} · membrane{" "}
              {r.membraneAllow ? "allow" : "deny"} · authorized:false
              <span className={cn("mt-1 block text-[11px] leading-relaxed", "text-faint")}>
                {r.justification}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
