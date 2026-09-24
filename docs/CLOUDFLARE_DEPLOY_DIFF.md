# Cloudflare deploy diff

Observed 2026-09-24. No upload was performed. There is no Cloudflare token in this environment.

## What is proven

| Route | Last observed |
| --- | --- |
| `https://clovelearn.io/` | 200, Cloudflare, curated front door |
| `https://clovelearn.io/__clove/health` | 200, Clove Insights, aggregate-only |
| `https://clovelearn.io/library` | 404 |
| `https://clovelearn.io/insights` | 404 |

`Clove` `main` is `da2abac7bb66dca612b7ab6ff96fd11b10d7bafd`. That commit is not proven equal to the uploaded tree. The live sitemap and the git sitemap differ. See `CLOVELEARN_REALITY_REPORT.md`.

## What this workspace is not

This workspace is the Reading Room. Uploading its build over Cloudflare Pages would remove the public front door, the arcade, research, and wellbeing. That upload is forbidden.

`clovelearn-build-lab` is not the production host.

## Diff status

The current Cloudflare artifact was not available here, so a file-level diff against the intended upload cannot be produced. Until that tree is in hand, the safe statement is:

- Keep every public route listed in the reality report.
- Add nothing that replaces `index.html`, `clove-signals.js`, or the Insights worker.
- `/library` is still absent in production.

## Intended addition, not yet diffed

A later upload may add only:

- a Worker route that calls System One with `TYPESAFE_API_KEY` bound in the Worker, not in the page
- a `/library` document that talks to that route
- allowlist entries on the existing Insights worker

No such files were uploaded.
