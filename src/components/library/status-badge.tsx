import { Badge } from "@/components/ui/badge";
import type { ClaimStatus } from "@/lib/library/types";

const TONE: Record<string, "muted" | "ok" | "warn" | "danger" | "info"> = {
  current: "ok",
  superseded: "info",
  disputed: "warn",
  retracted: "danger",
  stale: "warn",
  unsupported: "danger",
  original: "ok",
  derivative: "info",
};

export function StatusBadge({ status }: { status: ClaimStatus | string }) {
  return <Badge tone={TONE[status] ?? "muted"}>{status.replace("-", " ")}</Badge>;
}
