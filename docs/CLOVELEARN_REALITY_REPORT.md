# CloveLearn reality report

Date observed: 2026-09-24. This is a recovery note, not a redesign.

## What is actually live

https://clovelearn.io is a Cloudflare site (`server: cloudflare`). It is not a Vercel app. There is no `x-vercel-id` header. Content-Security-Policy allows Spotify, Hugging Face, and `wss://*.workers.dev`.

The homepage is the curated front door: wellbeing, games, research, about. The four choices are a quick reset, a local plan, Clove Research, and the free arcade. Title: “CloveLearn — practical tools, evidence-first research, and original games.”

`GET /__clove/health` returned `{"ok":true,"service":"clove-insights","privacy":"aggregate-only"}`.

`/library` and `/insights` both return 404.

## Which repository produces it

The live homepage text matches `rbardyla-boop/Clove` `index.html` on `main`, not `rbardyla-boop/clovelearn-build-lab`.

| Fact | Value |
| --- | --- |
| Production repo | `rbardyla-boop/Clove` (private, JavaScript) |
| Default branch | `main` |
| `main` HEAD | `da2abac7bb66dca612b7ab6ff96fd11b10d7bafd` |
| HEAD subject | Merge PR #186, paper-firm lowest-confidence UX, 2026-09-06 |
| Last GitHub activity seen | PR workflows on 2026-09-13 (`nodehopper-jumpman-care-20260913`) |
| Deploy path | Cloudflare Pages static tree plus a Worker on `/__clove/signal`, `/__clove/feedback`, `/__clove/health` |
| Auto-deploy of `main` | No. `Build Production Upload` runs only on three older release branches and `workflow_dispatch`. It builds a zip artifact. It does not upload that zip to Cloudflare. |

`clove-signals.js` on the live site is 10,794 bytes, the same size as `Clove` `main`. The live homepage is the same document as `main` `index.html`, plus Cloudflare’s challenge script.

The live `sitemap.xml` is **not** the file on `main`. Live sitemap is 1,481 bytes and lists 12 URLs. The repo sitemap is 12,492 bytes and lists the long tool museum. A search for the live sitemap’s `changefreq>yearly` string found nothing in `Clove`. So `main` at `da2abac` is the closest source for the front door, and it is **not proven** to be the exact tree Cloudflare is serving. Treat the uploaded production tree as drifted from git.

## The repo the prompt named first is not production

`rbardyla-boop/clovelearn-build-lab` is a private TanStack app.

| Fact | Value |
| --- | --- |
| Only branch | `v0.3-construction-depth` |
| That branch is the default | Yes |
| HEAD | `e6639a67507758cc27fc06d9e2499de997ad098e` |
| Pushed | 2026-09-10 |
| README / `KNOWN_FAILURES.md` | Says v0.2 on `main` is the public alpha and v0.3 must not be merged |
| Contradiction | There is no `main` branch. v0.3 is the only branch, and it is not what clovelearn.io serves. |
| Open defects | `ENVELOPE-OPENING-001`, `POOL-SPA-001` |
| Verify command | `npm run verify` (`npm test` + typecheck + build). `npm run test:clove` is the subset and is not the gate. |
| Analytics in that repo | No beacon, Insights, Plausible, or PostHog hits |

Do not host GAL on build-lab. Do not treat a green check there as a production deploy.

## Public routes

Live sitemap (all returned 200 when probed):

| Route | Class |
| --- | --- |
| `/` | KEEP |
| `/3am` | KEEP |
| `/whats-going-on` | KEEP |
| `/articles/` and article pages linked from it | KEEP |
| `/wellbeing/` | KEEP |
| `/games/` including Echo Bloom | KEEP |
| `/research/` and `/research/projects/` | KEEP |
| `/about-clovelearn.html` | KEEP |
| `/feedback.html` | KEEP |
| `/changelog.html` | KEEP |
| `/privacy-signals.html` | KEEP |

Also reachable, not on the live sitemap:

| Route | Class |
| --- | --- |
| `/arcade/creator/local-maker/` | KEEP (linked from the homepage) |
| `/tipp-drill-full`, `/onboarding/onboarding`, `/deck` | KEEP as reachable tools. HIDE from the front door. Do not delete. |
| Long-tail drills and ops HTML in the repo (VAC, FR, clinical, music, and the rest) | KEEP if already public. HIDE from the new front door. REMOVE is not authorized. UNKNOWN which of them are unlinked until a full product audit of the uploaded tree. |
| `/library`, `/library/` | UNKNOWN as a product (wanted). Currently 404. |
| `/insights`, `/insights/` | Do not add a public page. Operator view already exists as D1 queries. A public page would either leak aggregates or fake them. |

## Insights, beacon, feedback

Clove Insights already exists and is healthy.

- Browser: `clove-signals.js`. Opt-out, Global Privacy Control, and Do Not Track are honored.
- Events already allowed: `site_opened`, `returned`, onboarding, tool, game, research, `feedback_helpful`, `feedback_not_for_me`, `feedback_broken`, `client_error`, and related research events. `library_open` is **not** in the allowlist, so a new name would be dropped.
- Payload is coarse: event, surface, device class, return bucket, referrer group. No IP, cookie, account, full URL, raw query, or wellbeing content, per `workers/insights/README.md`.
- Storage: Cloudflare D1 database `clove-insights` (`4045c221-132d-4ad0-8e36-17fef769a99b` in `wrangler.jsonc`). Aggregates expire after 400 days. Feedback notes expire after 90 days.
- Feedback UI is already mounted by `clove-signals.js` on pages, plus `/feedback.html`.
- There is no web dashboard. The operator command is `wrangler d1 execute`.

Do not build a second analytics stack for clovelearn.io.

## Persistence, auth, deploy

- Public site: static files. No accounts. “No ads, accounts, paid tiers.”
- Tool state that must stay private is local to the browser (plans, mission store).
- Insights: D1 via the Worker. No end-user login.
- This environment has no Cloudflare or Wrangler credential. A git push to `Clove` `main` would not change clovelearn.io.
- `TYPESAFE_API_KEY` is not present. `XAI_API_KEY` is present for the Reading Room and was not used for this pass.

## Verification gate

Clove has no single `npm run verify`. The production gate is the GitHub workflow `Build Production Upload` (mission tests, Firefox, a whole-product Playwright audit, a 309-file upload boundary). It was **not** run here. It takes about 45 minutes, needs the production tree, and is not what publishes the site. That is an existing-process gap, not a new failure.

build-lab’s `npm run verify` was not run. That repo is not the deployment.

No existing test failure was reproduced, and none was cleared. Do not read this report as a green production gate.

## Decision

The live host can carry a `/library` page and a Worker route for Jev later. It already carries the beacon and feedback. It cannot be safely changed from this workspace: the uploaded tree has drifted from git, deploy is a manual Cloudflare upload, and there is no Worker credential.

GAL was not copied into `Clove`. The Reading Room shell was not edited. No working Clove page was deleted.

The Library slice in this Reading Room is a separate surface so the judgment loop can be tried. It is not clovelearn.io.
