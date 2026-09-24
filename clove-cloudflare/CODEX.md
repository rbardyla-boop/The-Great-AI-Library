# Codex: add /library to the existing clovelearn.io tree

Do not upload this folder as the site root. That would delete the front door, the arcade, research, and wellbeing.

The live site is the Cloudflare Pages tree for `rbardyla-boop/Clove`. Git `main` (`da2abac7`) is not proven equal to that tree. Diff before you write.

## What to copy

From this folder into the existing Clove tree:

| This path | Place it in Clove at |
| --- | --- |
| `pages/library/index.html` | `library/index.html` |
| `workers/library-jev/` | `workers/library-jev/` |
| `patches/insights-contracts.md` | apply by hand to `workers/insights/src/contracts.ts` |

Do not replace `index.html`, `clove-signals.js`, `hub.css`, or `workers/insights/` except for the allowlist lines in the patch.

Optional, one line, so the page is findable. Inside the existing homepage `plain-links` section, add:

```html
<a href="/library/"><b>Library</b><span>A preserved source, a judgment, and what the site will allow →</span></a>
```

## Key

Do not put the TypeSafe key in any file.

After the worker is deployed:

```
cd workers/library-jev
npx wrangler secret put TYPESAFE_API_KEY
```

Paste the key when Wrangler asks. The name must be exactly `TYPESAFE_API_KEY`.

Local only, not committed:

```
# workers/library-jev/.dev.vars
TYPESAFE_API_KEY=paste-here
```

`.dev.vars` is gitignored.

## Deploy order

1. Download or open the Pages project that is actually serving clovelearn.io.
2. Confirm `/`, `/wellbeing/`, `/games/`, `/research/`, `/feedback.html`, and `/__clove/health` are still there.
3. Add `library/index.html`.
4. Apply the Insights allowlist patch and deploy the existing `clove-insights` worker (`npx wrangler deploy` from `workers/insights`). That worker already owns `/__clove/signal`, `/__clove/feedback`, and `/__clove/health`. Do not give those routes to the new worker.
5. From `workers/library-jev`: `npx wrangler deploy`, then `npx wrangler secret put TYPESAFE_API_KEY`.
6. Check:
   - `https://clovelearn.io/` is still 200 and still the front door
   - `https://clovelearn.io/__clove/health` is still `{"ok":true,"service":"clove-insights","privacy":"aggregate-only"}`
   - `https://clovelearn.io/library/` is 200
   - `GET https://clovelearn.io/__clove/jev` returns `{"ok":true,"service":"clove-library-jev","key":"present"}` and does not contain the key
   - One Retrieve on `/library/` shows the source, the Jev distributions, and the disposition as three separate blocks

If the secret is missing, Retrieve must still show the source and say the judgment was not invented.
