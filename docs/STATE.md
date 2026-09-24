# State

Updated: 2026-09-24.

## Current commit

Workspace git HEAD `ab4aa07`. This session's Cognitive integration is in the working tree and is not a Clove production commit.

## Completed

- Reality pass preserved. See `CLOVELEARN_REALITY_REPORT.md`.
- Cognitive compatibility layer: `src/lib/cognitive/` (`types`, `envelope`, `policy`, `receipts`, `adapter`, `provider`, `eval-case`).
- Jev attempt terminals: accepted, rejected, 429, 529, timeout, auth, network, invalid, cancelled, no key. Historical gaps stay `NOT_RECORDED`.
- Library page shows observed source, model judgment, and policy disposition separately. Browser check passed on the no-key path.
- Attempt receipts append to the local GAL ledger as `JEV_ATTEMPT` without passage text.
- Clove Insights transmit flag is false. Signal shape is ready and refuses claim text.
- `npm run build` completed. That bundle is not a Cloudflare upload.

## Tests run

Typecheck: pass.

Unit files for kernel, motive, values, dots, app-data, auth, readiness, jev, host, cognitive, shell: 125 passed, 0 failed, 0 skipped.

`node scripts/jev-live-smoke.mjs` exited 2. Not a live pass.

Cloudflare token: absent. Production: not deployed.

Pre-existing: `scripts/grok-pwa-plugin.test.mjs` still expects Hello World. Not edited.

## Live Jev status

Not called. No key in this environment. Model version: unknown, because no response was received. Docs examples still say `jev-1.13.0` for pinned output and `jev-latest` as the alias this code sends.

## Deployment status

clovelearn.io/library was 404 on the reality pass and was not uploaded. This Reading Room is not that host.

## Exact next command

When a key exists, and only then:

`TYPESAFE_API_KEY=… node scripts/jev-live-smoke.mjs`

Do not upload this app over the Cloudflare Pages tree.
