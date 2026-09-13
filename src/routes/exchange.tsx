import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { seed, useLibrary } from "@/lib/library/store";
import type { Librarian } from "@/lib/library/types";

export const Route = createFileRoute("/exchange")({ component: Exchange });

function Exchange() {
  const installed = useLibrary((s) => s.installed);
  const blocked = useLibrary((s) => s.blockedInstall);
  const installLibrarian = useLibrary((s) => s.installLibrarian);
  const uninstallLibrarian = useLibrary((s) => s.uninstallLibrarian);
  const [notice, setNotice] = useState<string | null>(null);
  const [focus, setFocus] = useState<Librarian | null>(null);

  return (
    <div className="space-y-10">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
          Librarian Exchange
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl">
          Agents with a permission card.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Packages are Librarians, not bots. An upgrade that flips network from false to true
          stops. No silent privilege expansion.
        </p>
      </header>

      {notice ? (
        <p className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{notice}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {seed.librarians.map((lib) => {
          const isOn = installed.includes(lib.id);
          const wasBlocked = blocked.includes(lib.id);
          return (
            <article
              key={lib.id}
              className="flex flex-col rounded-xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={lib.signature === "verified" ? "ok" : "danger"}>
                  {lib.signature}
                </Badge>
                <Badge>{lib.source}</Badge>
                {isOn ? <Badge tone="accent">installed</Badge> : null}
                {wasBlocked ? <Badge tone="danger">blocked</Badge> : null}
              </div>
              <h2 className="mt-3 font-display text-2xl">{lib.name}</h2>
              <p className="mt-1 font-mono text-[11px] text-faint">
                {lib.publisher} · {lib.version} · {lib.build}
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{lib.blurb}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 font-mono text-[11px] text-muted">
                <div>Retrieval {lib.tests.retrieval}/100</div>
                <div>Injection {lib.tests.injection}/100</div>
                <div>Permission {lib.tests.permission}/100</div>
                <div>Provenance {lib.tests.provenance}/100</div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setFocus(lib)}>
                  Permission card
                </Button>
                {isOn ? (
                  <Button size="sm" variant="ghost" onClick={() => uninstallLibrarian(lib.id)}>
                    Remove
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={lib.malicious ? "danger" : "primary"}
                    onClick={() => {
                      const result = installLibrarian(lib.id);
                      setNotice(result.ok ? null : (result.reason ?? "Stopped"));
                      setFocus(lib);
                    }}
                  >
                    Install
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {focus ? <PermissionCard lib={focus} onClose={() => setFocus(null)} /> : null}
    </div>
  );
}

function PermissionCard({ lib, onClose }: { lib: Librarian; onClose: () => void }) {
  const rows: { ok: boolean; label: string }[] = [
    { ok: lib.permissions["library.read"], label: "Read selected collections" },
    { ok: lib.permissions["derivatives.write"], label: "Create derived records" },
    { ok: !lib.permissions["sources.write"], label: "Modify original evidence" },
    { ok: !lib.permissions.network, label: "Network access" },
    { ok: !lib.permissions.shell, label: "Shell access" },
  ];
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-bg/70 p-4 md:items-center">
      <div className="w-full max-w-md rounded-xl bg-elevated p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.13)]">
        <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
          Permission card
        </p>
        <h3 className="mt-2 font-display text-3xl">{lib.name}</h3>
        <p className="mt-1 font-mono text-[11px] text-muted">
          {lib.publisher} · {lib.version}
        </p>
        <ul className="mt-5 space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted">{row.label}</span>
              <span className={row.ok ? "text-ok" : "text-danger"}>
                {row.label.startsWith("Modify") ||
                row.label.startsWith("Network") ||
                row.label.startsWith("Shell")
                  ? row.ok
                    ? "denied"
                    : "requested"
                  : row.ok
                    ? "granted"
                    : "denied"}
              </span>
            </li>
          ))}
        </ul>
        {lib.malicious ? (
          <p className="mt-4 text-sm text-danger">
            This update requests shell and network. Policy stops the install.
          </p>
        ) : null}
        <Button className="mt-6 w-full" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
