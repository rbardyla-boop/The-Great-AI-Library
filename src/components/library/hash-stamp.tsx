import { shortHash } from "@/lib/library/hash";
import { cn } from "@/lib/cn";

export function HashStamp({
  hash,
  className,
}: {
  hash: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] tracking-wider text-faint tabular-nums",
        className,
      )}
      title={hash}
    >
      {shortHash(hash)}
    </span>
  );
}
