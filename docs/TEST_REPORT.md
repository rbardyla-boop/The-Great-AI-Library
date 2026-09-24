# Test report

Date: 2026-09-24. No test was skipped. A skip is not a pass. A mock is not a live Jev call.

## New tests (first Jev slice)

`node --experimental-strip-types --test src/lib/jev/jev.test.ts src/lib/host/host.test.ts`

12 passed, 0 failed.

| Check | Result |
| --- | --- |
| No `TYPESAFE_API_KEY` | `no_key`, empty judgments, nothing invented |
| HTTP 429 and 529 | `service_failure`, no substitute judgment |
| Timeout | `service_failure` |
| Fixture success | model string kept, full probability map kept, confidence described as concentration |
| Secret | key is sent only on the outbound Authorization header and is absent from the receipt |
| Policy | `promoted: false`, `mutated: false`, source hash unchanged |
| Beacon | rejects query, email, body, document, fingerprint, and query strings in the route |
| Category | construction / taekwondo / ai / research / unknown. The question text is not stored |
| Session | same id within a UTC day, new id the next day |
| Feedback | yes / no / text events count with no account |

## Existing Reading Room suites (first slice)

The TypeScript gate (gauntlet, motive, values, shell, dots, app-data, auth, plus the two new files): **103 passed, 0 failed.**

Shell file remains 151 lines. Shell gate passed.

`npm test` runs the script suite first and stops on failure, so it did not reach the TypeScript gate in that one command. The script suite: **188 passed, 8 failed.** All 8 are in `scripts/grok-pwa-plugin.test.mjs`. They expect `og:title` to stay `Hello World`. The injector writes the existing product name, The Great AI Library. Those tests were not edited. They are pre-existing and are not new Jev or beacon failures.

## Cognitive slice (later the same day)

Typecheck passed.

A second pass ran kernel, motive, values, dots (including DOTS-2), app-data, auth, readiness, jev, host, cognitive, and shell. **125 passed, 0 failed, 0 skipped** across those files (85 + 37 + 3 readiness). No file was counted twice.

| Check | Result |
| --- | --- |
| Confidence 1.0 | license is not `full_premise`. Promotion false |
| 401 | `AUTH_FAILURE` |
| 429 after two retries | `RATE_LIMITED`, still `service_failure`, no invented distribution |
| 529 | `OVERLOADED`, distinct from 429 |
| Timeout | `service_failure`, note says timed out |
| Malformed body | `INVALID_RESPONSE` |
| Network throw | `NETWORK_FAILURE` |
| Stale hash | `HUMAN_REVIEW` |
| Empty provenance | `HUMAN_REVIEW` |
| Contradiction | both probabilities kept |
| Duplicate | flag set, passage not dropped |
| Attempt ledger | `JEV_ATTEMPT`, no passage text, no key |
| Original bytes | unchanged after policy |
| Insights shape | transmit false; query and probabilities rejected |
| Shell | still 151 lines |

`node scripts/jev-live-smoke.mjs` printed `pass: false` and exited 2. `TYPESAFE_API_KEY` is absent. That is not a live pass.

The eight Hello World share-card failures were not edited. They remain the pre-existing defect.

## Live Jev

Not exercised. `TYPESAFE_API_KEY` is not in this environment. The browser flow is expected to show “No server key. Judgment was not invented.” That is the no-key path, not a live model call.

## Not run

`npm run build` completed after the cognitive slice. The bundle was not uploaded.
