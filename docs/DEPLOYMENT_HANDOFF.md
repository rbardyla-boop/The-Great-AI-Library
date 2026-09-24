# Deployment handoff

Do not deploy this Reading Room build to clovelearn.io.

Production is a manual Cloudflare upload of `rbardyla-boop/Clove`. Git push does not publish it. This environment has no Wrangler token and no `TYPESAFE_API_KEY`.

## Before any upload

1. Download or reconstruct the Pages tree that is actually live.
2. Diff it against the candidate. Confirm `index.html`, games, research, wellbeing, `clove-signals.js`, and `/__clove/health` remain.
3. Record the live tree's identity in `CLOUDFLARE_DEPLOY_DIFF.md`. The git SHA `da2abac7` is not that proof.

## Worker binding, when a token exists

On the existing Insights worker, or a sibling worker on the same zone, not a new vendor:

```
npx wrangler secret put TYPESAFE_API_KEY
```

The value is the TypeSafe key. It must not be written into git, into a Pages asset, or into a `VITE_` variable.

The worker should accept a bounded JSON body (query plus at most six passages), call `POST https://api.typesafe.ai/v1/systemone` with `Authorization: Bearer $TYPESAFE_API_KEY` and model `jev-latest`, and return the attempt receipt plus the decision packet. It should not log the key or the passage text.

## Insights allowlist

Extend the existing worker allowlist, do not add a database:

`library_open`, `library_query_started`, `library_query_completed`, `jev_success`, `jev_service_failure`, `human_review_required`, `feedback_yes`, `feedback_no`.

Payload: event, surface `library`, device class. Nothing else.

## After upload, someone with access must observe

- `https://clovelearn.io/` still the front door
- `https://clovelearn.io/__clove/health` still aggregate-only
- `https://clovelearn.io/library` the new page
- a real Jev call from that page, with the key absent from the browser
- the other public routes from the reality report still 200

Until those observations exist, production status is: not deployed.
