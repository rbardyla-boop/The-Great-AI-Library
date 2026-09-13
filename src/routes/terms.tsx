import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead(
      "Terms",
      "A research preview of an archival trust OS. The constitution is the contract that matters.",
    ),
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Terms</p>
      <h1 className="font-display text-4xl tracking-[-0.03em]">Use, don't impersonate.</h1>
      <p className="text-sm leading-relaxed text-muted">
        This is a research preview of The Great AI Library, V.A.L.U.E.S., and an in-process Hive
        membrane. It is not a production records system, not legal advice, and not a claim that
        alignment is solved.
      </p>
      <p className="text-sm leading-relaxed text-muted">
        Mercury sources are a synthetic test collection. Do not treat them as facts about any
        real institute, person, or budget.
      </p>
      <p className="text-sm leading-relaxed text-muted">
        You may inspect receipts, run the gauntlet, and convene MOTIVE-0. You may not present a
        model's recommendation as an authorized effect. Article IX still holds: models
        propose; policy authorizes; the ledger records.
      </p>
      <p>
        <Link to="/constitution" className="text-sm text-info">
          Read the constitution
        </Link>
      </p>
    </article>
  );
}
