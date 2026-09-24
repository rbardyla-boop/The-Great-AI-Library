# Deployment report

## Live

| URL | Status |
| --- | --- |
| https://clovelearn.io/ | 200, Cloudflare, curated front door |
| https://clovelearn.io/__clove/health | 200, Clove Insights aggregate-only |
| https://clovelearn.io/library | 404 |
| https://clovelearn.io/insights | 404 |

Nothing in this pass was uploaded to Cloudflare. `main` of `rbardyla-boop/Clove` is not an automatic production deploy. There is no Wrangler token in this environment.

## Not live, and why

The Reading Room preview gained `/library` and a this-device `/insights`. That preview is The Great AI Library. It is not clovelearn.io, and it must not be described as the public host.

`clovelearn-build-lab` was not deployed. Its only branch is the experimental v0.3 line with open visual defects, and the live site is not that app.

## Next action that would make `/library` real on clovelearn.io

1. Diff the Cloudflare Pages tree against `Clove` `main` and record the real upload SHA. The live sitemap already disagrees with git.
2. Add a thin `/library` page to that tree that links to the hosted Reading Room, or embed it, without copying the GAL kernel into the static site.
3. Extend `clove-signals.js` and the Insights worker allowlist with `library_open` only if the operator wants that event in D1. Reuse the worker. Do not add Plausible, PostHog, or a second database.
4. Put `TYPESAFE_API_KEY` on a Worker, not in the browser. Jev returns judgments. GAL policy still refuses promotion.
5. Run `Build Production Upload` (or the current equivalent) and upload the verified zip by hand, which is how this site actually ships.

Until that upload exists, clovelearn.io is unchanged.
