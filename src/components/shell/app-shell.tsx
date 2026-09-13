import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Inbox,
  Library,
  MessageSquareText,
  Scale,
  ScrollText,
  Store,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { selectDesk, useLibrary } from "@/lib/library/store";

const NAV: {
  to: "/" | "/ask" | "/desk" | "/inbox" | "/exchange";
  label: string;
  icon: typeof Library;
  end?: boolean;
  desk?: boolean;
}[] = [
  { to: "/", label: "Stacks", icon: Library, end: true },
  { to: "/ask", label: "Ask", icon: MessageSquareText },
  { to: "/desk", label: "Desk", icon: Scale, desk: true },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/exchange", label: "Exchange", icon: Store },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const deskPending = useLibrary((s) => selectDesk(s).filter((d) => d.decision === "pending").length);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex min-h-dvh max-w-[1400px]">
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border px-4 py-6 md:flex">
          <Link to="/" className="group px-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
              Reading Room
            </p>
            <p className="mt-1 font-display text-2xl leading-tight text-fg group-hover:text-accent">
              The Library
            </p>
          </Link>
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active = item.end ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
                    active ? "bg-elevated text-fg" : "text-muted hover:bg-surface hover:text-fg",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.6} />
                  <span className="flex-1">{item.label}</span>
                  {"desk" in item && deskPending > 0 ? (
                    <span className="font-mono text-[11px] tabular-nums text-warn">{deskPending}</span>
                  ) : null}
                </Link>
              );
            })}
            <div className="mt-auto space-y-1 border-t border-border pt-4">
              <Link
                to="/ledger"
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                  pathname === "/ledger" ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                )}
              >
                <ScrollText className="size-4" strokeWidth={1.6} />
                Ledger
              </Link>
              <Link
                to="/constitution"
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                  pathname === "/constitution" ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                )}
              >
                <Landmark className="size-4" strokeWidth={1.6} />
                Constitution
              </Link>
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
            <Link to="/" className="font-display text-xl">
              The Library
            </Link>
            <Link to="/constitution" className="text-muted">
              <BookOpen className="size-5" />
            </Link>
          </header>
          <main className="flex-1 px-4 pb-24 pt-6 md:px-10 md:pb-12 md:pt-8">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((item) => {
            const active = item.end ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-fg" : "text-faint",
                )}
              >
                <Icon className="size-5" strokeWidth={1.6} />
                {item.label}
                {"desk" in item && deskPending > 0 ? (
                  <span className="absolute top-2 right-[calc(50%-18px)] size-1.5 rounded-full bg-warn" />
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
