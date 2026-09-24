# State

Updated: 2026-09-24.

## Where the key goes

Not on grok.me. Not in this chat. Not in a file.

Codex deploys `clove-cloudflare/` onto the existing clovelearn.io tree, then:

```
cd workers/library-jev
npx wrangler secret put TYPESAFE_API_KEY
```

Instructions: [clove-cloudflare/CODEX.md](../clove-cloudflare/CODEX.md).

## What is ready

- `clove-cloudflare/pages/library/index.html` — additive page. Does not replace the front door.
- `clove-cloudflare/workers/library-jev/` — Worker for `clovelearn.io/__clove/jev`. Secret name only.
- Insights allowlist patch. Not applied to production.

## What is not done

- Real Jev has not been called. No key is in this environment.
- clovelearn.io/library was 404. Nothing was uploaded.
- The eight Hello World share-card tests were not edited.

## Next command

Codex, on the existing Clove tree, follows `clove-cloudflare/CODEX.md`. Do not upload this Reading Room over Pages.
