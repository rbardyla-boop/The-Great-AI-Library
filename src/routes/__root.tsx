import { createRootRoute, HeadContent, Link, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppShell } from "@/components/shell/app-shell";
import { Gate } from "@/components/shell/gate";
import { NotFoundPage } from "@/lib/error-component";
import { useLibrary } from "@/lib/library/store";
import appCss from "../styles.css?url";

const APP_NAME = "The Great AI Library";
const PUBLIC = new Set(["/privacy", "/terms"]);

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "A local-first archival operating system. Evidence, provenance, V.A.L.U.E.S., and a membrane that will not let intelligence become authority.",
      },
      { name: "theme-color", content: "#0c0c0b" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Instrument+Serif:ital@0;1&display=swap",
      },
    ],
  }),
  notFoundComponent: NotFoundPage,
  component: Root,
});

function Root() {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <ShellGate />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function ShellGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const entered = useLibrary((s) => s.entered);
  const ready = useLibrary((s) => s.ready);
  const boot = useLibrary((s) => s.boot);

  useEffect(() => {
    void boot();
  }, [boot]);

  if (!entered) {
    if (PUBLIC.has(pathname)) {
      return (
        <div className="min-h-dvh bg-bg text-fg">
          <header className="border-b border-border px-6 py-4">
            <Link to="/" className="font-display text-xl">
              The Great AI Library
            </Link>
          </header>
          <main className="px-6 py-10">
            <Outlet />
          </main>
        </div>
      );
    }
    return <Gate />;
  }
  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        <p className="font-mono text-sm">Opening the Stacks…</p>
      </div>
    );
  }
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
