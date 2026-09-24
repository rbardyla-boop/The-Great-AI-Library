# Privacy beacon

## Production (do not replace)

clovelearn.io already runs Clove Insights.

- Script: `/clove-signals.js`
- Endpoints: `/__clove/signal`, `/__clove/feedback`, `/__clove/health`
- Store: Cloudflare D1, aggregate rows, 400-day expiry. Feedback notes, 90-day expiry.
- Honors Global Privacy Control, Do Not Track, and the local opt-out on `/privacy-signals.html`.
- Does not store IP-as-identity, cookies, accounts, full URLs, raw referrers, user agents, or wellbeing content.
- Operator read path is `wrangler d1 execute`, not a public `/insights` page.

`library_open` is not in the worker allowlist. Adding it is a Clove change plus a Worker deploy. That deploy was not made.

## This Reading Room slice

`/library` keeps a separate, local log in the browser (`gal-host-beacon-v1`). It is not sent to Clove, to a third party, or to a server.

Allowed events: `page_open`, `library_open`, `record_open`, `search_started`, `search_completed`, `lab_started`, `lab_completed`, `feedback_yes`, `feedback_no`, `feedback_text_submitted`.

Allowed extra field: `queryCategory` of `construction`, `taekwondo`, `ai`, `research`, or `unknown`. The question text is classified in the browser and then discarded. The beacon record must not contain `query`, `body`, `document`, `passage`, `email`, `name`, `ip`, or `fingerprint`.

Session id: random, rotated when the UTC day changes, stored only on the device.

`/insights` in the Reading Room shows that local log and any feedback notes saved on the same device. It is not an owner view of other people. It does not read D1. Publishing this app would still show each browser only its own counts.

Feedback notes (`gal-host-feedback-v1`) stay on the device, capped at 50. Copy shown after a vote: “Thanks. That's all I collect.”

No account is required.
