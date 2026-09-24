# Library privacy

## What the Reading Room stores on this device

- Beacon events in `gal-host-beacon-v1`. Names only, plus a coarse category. No query text, passage, or Jev body.
- Feedback notes in `gal-host-feedback-v1`, including an optional receipt id of the form `jev_…`. The note stays on the device. It is not posted.
- Ledger event `JEV_ATTEMPT`: hashes, model, terminal, disposition. Not the passage and not the key.

New event names on this device: `library_query_started`, `library_query_completed`, `jev_success`, `jev_service_failure`, `human_review_required`, plus the older `library_open`, `feedback_yes`, and `feedback_no`.

## What is not Clove Insights

`INSIGHTS_TRANSMIT` is false. This page does not call `/__clove/signal`. Production Clove Insights remains the existing worker and D1 database. Its allowlist does not yet include the library event names, so posting them today would either drop them or widen a store we did not inspect.

`prepareCloveSignal` builds `{ event, surface: "library", device }` and rejects query, passage, probabilities, and keys. That is the shape to add to the worker later. It is not a second analytics system.

## Key handling

`TYPESAFE_API_KEY` is read only in the server function `judgeGal`. It is not a Vite public variable. Receipts and ledger payloads are checked for the key. The browser bundle must not contain it.

Optional feedback text remains device-local, which is the rule already stated in `PRIVACY_BEACON.md`.
