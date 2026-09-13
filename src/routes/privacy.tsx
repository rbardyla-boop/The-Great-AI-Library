import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead(
      "Privacy",
      "The Great AI Library is local-first. Originals, ledger, and VALUES decisions stay on this device.",
    ),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Privacy</p>
      <h1 className="font-display text-4xl tracking-[-0.03em]">This device is the master.</h1>
      <p className="text-sm leading-relaxed text-muted">
        Originals, the hash-chained ledger, catalog, and V.A.L.U.E.S. receipts are stored in this
        browser (IndexedDB / local storage). They are not uploaded to a shared database.
      </p>
      <p className="text-sm leading-relaxed text-muted">
        The only network call the Reading Room makes is when you choose <em>Re-ask with Grok,
        grounded</em> or <em>Ask Grok to justify</em>. Those requests send the question plus
        retrieved passages or a VALUES judgment — not your whole library, not credentials, not a
        tracking pixel.
      </p>
      <p className="text-sm leading-relaxed text-muted">
        There is no analytics vendor, no advertising cookie, and no account. Clearing site data
        forgets the Library on this device. That is deletion.
      </p>
      <p>
        <Link to="/" className="text-sm text-info">
          Return
        </Link>
      </p>
    </article>
  );
}
