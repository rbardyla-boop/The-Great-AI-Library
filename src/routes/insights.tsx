import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { pageHead } from "@/lib/seo";
import { localInsights } from "@/lib/host/browser";
import { readFeedback, type FeedbackNote } from "@/lib/host/feedback";

export const Route = createFileRoute("/insights")({
  head: () =>
    pageHead(
      "This device",
      "Counts from this browser only. Clove Insights on clovelearn.io is a separate system and is not read here.",
    ),
  component: Insights,
});

function Insights() {
  const [snap, setSnap] = useState<ReturnType<typeof localInsights> | null>(null);
  const [notes, setNotes] = useState<FeedbackNote[]>([]);
  useEffect(() => {
    setSnap(localInsights());
    setNotes(readFeedback());
  }, []);

  return (
    <div className="stagger-in space-y-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">This browser</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.03em]">What this device did</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          These numbers are stored on this device. They are not clovelearn.io traffic.
          The live site already has Clove Insights: aggregate counters in Cloudflare D1,
          read by the operator with the worker tools, not by a public page. This view
          does not connect to that database, and it does not start a second tracker.
        </p>
      </header>
      {!snap ? (
        <p className="text-sm text-muted">Reading local counts…</p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              ["Events", snap.total],
              ["Session-days", snap.sessionDays],
              ["Days", snap.distinctDays],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
                <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{k}</p>
                <p className="mt-2 font-display text-3xl tabular-nums">{v}</p>
              </div>
            ))}
          </section>
          <section className="grid gap-4 md:grid-cols-2">
            <CountList title="Events" rows={snap.events} />
            <CountList title="Interests" rows={snap.categories} />
          </section>
        </>
      )}
      <section className="rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
        <h2 className="font-display text-2xl">Notes on this device</h2>
        {notes.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No notes yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notes
              .slice(-8)
              .reverse()
              .map((n) => (
                <li key={n.at} className="text-sm">
                  <span className="font-mono text-[11px] text-faint">{n.useful}</span> {n.text || "—"}
                </li>
              ))}
          </ul>
        )}
      </section>
      <p className="text-sm text-muted">
        <Link to="/library">Back to the Library</Link>
      </p>
    </div>
  );
}

function CountList({ title, rows }: { title: string; rows: Record<string, number> }) {
  const entries = Object.entries(rows);
  return (
    <div className="rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <h2 className="font-display text-2xl">{title}</h2>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-muted">None yet.</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {entries.map(([k, v]) => (
            <li key={k} className="flex justify-between gap-3 text-sm">
              <span className="font-mono text-[12px]">{k}</span>
              <span className="tabular-nums">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
