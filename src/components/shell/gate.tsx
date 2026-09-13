import { Button } from "@/components/ui/button";
import { useLibrary } from "@/lib/library/store";

export function Gate() {
  const enter = useLibrary((s) => s.enter);
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-12">
        <div className="stagger-in space-y-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-faint">
            The Great AI Library
          </p>
          <h1 className="font-display text-[clamp(2.25rem,6vw,3.6rem)] leading-[1.08] tracking-[-0.03em]">
            The library is not your files.
            <span className="mt-2 block italic text-muted">It is the system that knows them.</span>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted">
            AI can derive from evidence. AI cannot silently become the evidence. Twenty-four
            sources from the Mercury test collection were accessioned overnight. Four conflicts
            remain open.
          </p>
          <div className="flex flex-col items-start gap-3">
            <Button size="lg" onClick={enter}>
              Enter the Reading Room
            </Button>
            <p className="font-mono text-[11px] text-faint">Local-first · originals immutable</p>
          </div>
        </div>
      </div>
      <footer className="border-t border-border px-6 py-4 font-mono text-[11px] text-faint">
        M0 — The Library must remember without lying
      </footer>
    </div>
  );
}
