import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-danger" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={1.6} />
      </span>
      <h1 className="font-display text-3xl">The Archivist stopped.</h1>
      <p className="max-w-md text-sm break-words text-muted">{errorMessage(error)}</p>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Absence</p>
      <h1 className="font-display text-4xl">Not in the Stacks</h1>
      <p className="max-w-sm text-sm text-muted">
        No route with that name. The Library will not invent a page to fill the gap.
      </p>
      <a href="/" className="mt-2 text-sm text-info">
        Return to the Reading Room
      </a>
    </main>
  );
}
