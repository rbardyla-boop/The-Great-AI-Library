import { cn } from "@/lib/cn";

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: "muted" | "ok" | "warn" | "danger" | "info" | "accent";
  className?: string;
}) {
  const tones: Record<string, string> = {
    muted: "text-muted bg-elevated",
    ok: "text-ok bg-ok/10",
    warn: "text-warn bg-warn/10",
    danger: "text-danger bg-danger/10",
    info: "text-info bg-info/10",
    accent: "text-accent-fg bg-accent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-mono text-[11px] tracking-wide uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
