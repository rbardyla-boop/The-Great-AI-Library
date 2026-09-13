import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HashStamp } from "@/components/library/hash-stamp";
import { composeLocal, SUGGESTED_QUERIES } from "@/lib/library/compose";
import { retrieve } from "@/lib/library/retrieve";
import {
  selectClaims,
  selectContradictions,
  selectRecords,
  useLibrary,
} from "@/lib/library/store";
import { askArchivist } from "@/lib/ask";
import { auditAnswer } from "@/lib/kernel/auditor";
import type { Brief, RetrievalChannel } from "@/lib/library/types";
import { DotsPanel } from "@/components/library/dots-panel";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ask")({
  head: () =>
    pageHead(
      "Ask",
      "Investigate, do not chat. Strict answers cite retrieved evidence. The Answer Auditor refuses uncited library claims.",
    ),
  component: Ask,
});

const CHANNELS: { id: RetrievalChannel; label: string; hint: string }[] = [
  { id: "lexical", label: "Lexical", hint: "What literally contains this?" },
  { id: "semantic", label: "Semantic", hint: "What discusses the concept?" },
  { id: "graph", label: "Graph", hint: "People, projects, claims" },
  { id: "temporal", label: "Temporal", hint: "What was believed when?" },
  { id: "provenance", label: "Provenance", hint: "Where did this originate?" },
];

function Ask() {
  const overlay = useLibrary();
  const lib = useMemo(
    () => ({
      records: selectRecords(overlay),
      claims: selectClaims(overlay),
      contradictions: selectContradictions(overlay),
    }),
    [overlay],
  );
  const [question, setQuestion] = useState("");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [grokBusy, setGrokBusy] = useState(false);
  const [grokError, setGrokError] = useState<string | null>(null);

  function run(q: string) {
    const next = q.trim();
    if (!next) return;
    setQuestion(next);
    setGrokError(null);
    setBrief(composeLocal(next, lib));
  }

  async function withGrok() {
    if (!brief) return;
    setGrokBusy(true);
    setGrokError(null);
    try {
      const { passages } = retrieve(brief.question, lib);
      const res = await askArchivist({
        data: {
          question: brief.question,
          evidence: passages.slice(0, 10),
        },
      });
      if (!res.ok) {
        setGrokError(
          res.error === "unavailable"
            ? "The grounded model is unavailable here. Local citations still stand."
            : "The model declined. Local brief is unchanged.",
        );
        return;
      }
      const audited = auditAnswer(res.text, passages.slice(0, 10));
      if (audited.refused) {
        setGrokError("Answer Auditor refused the brief. Uncited library claims were not admitted.");
        setBrief({
          ...brief,
          answer: audited.text,
          model: "grok-4.5",
        });
        return;
      }
      setBrief({
        ...brief,
        answer:
          audited.redacted > 0
            ? `${audited.text}\n\n— Auditor redacted ${audited.redacted} unsupported sentence(s).`
            : audited.text,
        model: "grok-4.5",
      });
    } catch {
      setGrokError("The model could not be reached. Local brief is unchanged.");
    } finally {
      setGrokBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="stagger-in">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Ask</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl">
          Investigate, do not chat.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Strict mode. Every sentence must be retrievable. Contradictions stay contradictions.
          If it is not in the collection, the Archivist says so.
        </p>
      </header>

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          run(question);
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask the collection…"
          className="h-12 flex-1 rounded-md bg-elevated px-4 text-base text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        />
        <Button type="submit" size="lg" className="sm:w-32">
          Retrieve
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUERIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => run(q)}
            className="rounded-sm bg-surface px-3 py-2 text-left text-xs text-muted shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-colors hover:text-fg"
          >
            {q}
          </button>
        ))}
      </div>

      {brief ? (
        <article className="space-y-6">
          <section className="rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
              Retrieval planner
            </p>
            <div className="mt-3 space-y-2">
              {CHANNELS.map((ch) => {
                const n = brief.channels[ch.id];
                const max = Math.max(1, ...Object.values(brief.channels));
                return (
                  <div key={ch.id} className="grid grid-cols-[88px_1fr_32px] items-center gap-3">
                    <span className="font-mono text-[11px] text-muted">{ch.label}</span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                      <div
                        className="h-full origin-left rounded-full bg-accent"
                        style={{
                          width: `${n ? Math.max(8, (n / max) * 100) : 0}%`,
                          animation: "channel-fill 400ms var(--ease-smooth-out) both",
                        }}
                      />
                    </div>
                    <span className="text-right font-mono text-[11px] tabular-nums text-faint">
                      {n}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="paper-grain rounded-xl p-6 text-ink shadow-[var(--shadow-paper)] md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={brief.absence ? "warn" : brief.confidence === "split" ? "warn" : "ok"}>
                {brief.absence ? "absence" : brief.confidence}
              </Badge>
              <Badge tone="muted">{brief.model}</Badge>
            </div>
            <pre className="mt-5 whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
              {brief.answer}
            </pre>
            {brief.weakest ? (
              <p className="mt-5 border-t border-ink/10 pt-4 text-sm text-ink/70">
                Weakest link: {brief.weakest}
              </p>
            ) : null}
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              variant="secondary"
              onClick={withGrok}
              disabled={grokBusy || brief.absence}
            >
              {grokBusy ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Re-ask with Grok, grounded
            </Button>
            <p className="text-xs text-faint">
              The model only sees retrieved passages. It cannot acquire tools from a document.
            </p>
          </div>
          {grokError ? <p className="text-sm text-warn">{grokError}</p> : null}

          {brief.contradictions.length > 0 ? (
            <section>
              <h2 className="font-display text-2xl">Held in contradiction</h2>
              <ul className="mt-3 space-y-3">
                {brief.contradictions.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                  >
                    <p className="text-sm text-fg">{c.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{c.summary}</p>
                    <p className="mt-2 font-mono text-[11px] text-faint">
                      {c.claimIds.join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {brief.citations.length > 0 ? (
            <section>
              <h2 className="font-display text-2xl">Evidence</h2>
              <ul className="mt-3 space-y-2">
                {brief.citations.map((c) => (
                  <li key={`${c.recordId}-${c.claimId}`}>
                    <Link
                      to="/record/$id"
                      params={{ id: c.recordId }}
                      className="block rounded-lg bg-surface px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-elevated"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm">{c.title}</p>
                        <ArrowUpRight className="size-4 shrink-0 text-faint" />
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-faint">
                        {c.claimId} · {c.author} · {c.assertedAt} · <HashStamp hash={c.hash} />
                      </p>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted">
                        {c.passage}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      ) : null}

      <DotsPanel query={question} />
    </div>
  );
}
