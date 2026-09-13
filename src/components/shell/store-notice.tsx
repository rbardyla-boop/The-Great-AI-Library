import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const KEY = "gal-store-notice-v1";

export function StoreNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(localStorage.getItem(KEY) !== "ok");
  }, []);
  if (!show) return null;
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg bg-elevated px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs leading-relaxed text-muted">
        This Library keeps originals, the ledger, and VALUES decisions on this device. Nothing
        leaves except when you ask Grok.
      </p>
      <Button
        size="sm"
        variant="secondary"
        className="shrink-0"
        onClick={() => {
          localStorage.setItem(KEY, "ok");
          setShow(false);
        }}
      >
        Keep it here
      </Button>
    </div>
  );
}
