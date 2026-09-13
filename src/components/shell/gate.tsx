import { Link } from "@tanstack/react-router";
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
            Reasoning may be private.
            <span className="mt-2 block italic text-muted">Power cannot be.</span>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted">
            AI cannot silently become evidence. VALUES cannot silently become purpose. Intelligence
            cannot silently become authority. Twenty-four Mercury sources. Six roles. One membrane.
          </p>
          <div className="flex flex-col items-start gap-3">
            <Button size="lg" onClick={enter}>
              Enter the Reading Room
            </Button>
            <p className="font-mono text-[11px] text-faint">Local-first · originals immutable</p>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 border-t border-border bg-bg/95 px-6 py-4 backdrop-blur md:static">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-faint">M2 — Capability does not silently become purpose</p>
          <div className="flex flex-wrap gap-4 font-mono text-[11px] text-faint">
            <Link to="/privacy" className="hover:text-fg">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-fg">
              Terms
            </Link>
            <Button size="sm" className="sm:hidden" onClick={enter}>
              Enter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
