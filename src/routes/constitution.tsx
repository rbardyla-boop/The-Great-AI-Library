import { createFileRoute, Link } from "@tanstack/react-router";
import { CONSTITUTION } from "@/lib/library/constitution";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/constitution")({
  head: () =>
    pageHead("Constitution", "Thirteen articles. Laws before chat. VALUES recommend. The membrane authorizes."),
  component: ConstitutionPage,
});

function ConstitutionPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
          {CONSTITUTION.title}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl">
          Laws before chat.
        </h1>
        <p className="mt-3 text-sm text-muted">
          Enacted {CONSTITUTION.enacted}. Articles XI–XIII amended {CONSTITUTION.amended}.
        </p>
      </header>
      <ol className="space-y-8">
        {CONSTITUTION.articles.map((a) => (
          <li key={a.id} className="border-t border-border pt-6">
            <p className="font-mono text-[11px] text-faint">Article {a.id}</p>
            <h2 className="mt-1 font-display text-2xl">{a.title}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{a.body}</p>
          </li>
        ))}
      </ol>
      <p className="border-t border-border pt-6 text-sm text-muted">
        <Link to="/privacy" className="text-info">
          Privacy
        </Link>
        {" · "}
        <Link to="/terms" className="text-info">
          Terms
        </Link>
      </p>
    </div>
  );
}
