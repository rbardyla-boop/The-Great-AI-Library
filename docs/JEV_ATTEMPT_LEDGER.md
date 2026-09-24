# Jev attempt ledger

Every call `judgeLibrary` makes, including a missing key, returns an attempt. The Library page appends a `JEV_ATTEMPT` ledger event after the call returns.

Stored:

- attempt id and trace id
- time, via the ledger event
- model string TypeSafe returned, or `none`
- input hash and per-question hashes
- HTTP status
- request id when the response has `x-request-id`, `request-id`, or `x-typesafe-request-id`
- latency and retry count
- terminal outcome
- disposition and license

Not stored:

- the API key
- passage text
- the query

## Terminals

| Terminal | When |
| --- | --- |
| `ACCEPTED_RESPONSE` | HTTP 200 and at least one usable distribution |
| `REJECTED_RESPONSE` | 400 or 422 |
| `AUTH_FAILURE` | 401 or 403 |
| `RATE_LIMITED` | 429 after at most two retries |
| `OVERLOADED` | 529 after at most two retries |
| `TIMEOUT` | the call's own deadline aborted it |
| `CANCELLED` | aborted before that deadline |
| `NETWORK_FAILURE` | the fetch threw, or the status was another 5xx |
| `INVALID_RESPONSE` | 200 with a body that is not usable answers |
| `NO_KEY` | `TYPESAFE_API_KEY` is missing. Nothing is invented |
| `NOT_RECORDED` | a historical gap. Not a reconstructed zero |

`NO_KEY` is not `NOT_RECORDED`. One means we looked and found no key. The other means no attempt was written and we will not pretend the failure count is zero.

The coarse field `outcome` (`success`, `rejected`, `service_failure`, `no_key`) remains so older receipts stay readable. The terminal is the one to measure.
