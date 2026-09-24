# Insights allowlist

Edit `workers/insights/src/contracts.ts` on the existing Clove tree. Add names. Do not remove any current name.

In `EVENTS`, add:

```
'library_open',
'library_query_started',
'library_query_completed',
'jev_success',
'jev_service_failure',
'human_review_required',
'feedback_yes',
'feedback_no',
```

In `SURFACES`, add:

```
'library',
```

Nothing else changes. The payload is still the existing signal shape: event, surface, device, return bucket, referrer group, build, variant, detail, diagnostic. No query, passage, or Jev body.

Deploy that worker from `workers/insights` before expecting those events to count. `/library/` still works if this patch is late. Unknown events are rejected and the page ignores that failure.
