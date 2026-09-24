# GAL + Jev

Superseded for the policy layer by `GAL_JEV_COGNITIVE_ARCHITECTURE.md`. The facts below still hold: the key stays on the server, and a missing key invents nothing.

Jev decides meaning. GAL decides authority. The host only observes.

```
source bytes (immutable)
        ↓
bounded retrieval in GAL code
        ↓
Jev: relevance, supports, contradicts, duplicate, review-needed
        ↓
display + receipt
        ↓
no accept, quarantine, promote, or publish
```

## Where this lives

- Production host to aim at: `clovelearn.io/library`, inside `rbardyla-boop/Clove`, not inside `clovelearn-build-lab`.
- That route is not deployed. See `CLOVELEARN_REALITY_REPORT.md`.
- The slice that can be tried now is the Reading Room route `/library`. It uses the existing kernel and `retrieve()`. It does not replace originals.

## Jev

Server function: `src/lib/jev/judge.ts`. The key is `TYPESAFE_API_KEY`, read only on the server. The browser never receives it.

Call: `POST https://api.typesafe.ai/v1/systemone` with model alias `jev-latest`.

| Question | Primitive | Why |
| --- | --- | --- |
| relevance | Choice | one of relevant / adjacent / unrelated |
| supports | Noul | P(yes). Not an intensity. |
| contradicts | Noul | independent of supports. Both can be high. Do not collapse them. |
| duplicate | Noul | repeated claim vs independent evidence |
| review-needed | Noul | a person should look |

Choice/Score confidence is distribution concentration. It is not the probability the judgment is correct and it is not permission to act. Noul has no separate confidence. A value near 0.5 means yes and no are similarly likely.

If the key is missing, or the call returns 429, 529, a timeout, or an empty body, the outcome is `no_key`, `rejected`, or `service_failure`. No probabilities are invented.

Each attempt records attempt id, the model string TypeSafe returned, question hash, input hash, outcome, latency, and the full probability map. Passage text is not stored on the receipt. The receipt’s `authority` flag is false.

`policyDecision()` is fixed: `display_only`, `mutated: false`, `promoted: false`.

## What was not built

No x402, token, marketplace, swarm, or Jev write into the ledger. No live TypeSafe call was made: the key is absent. Hashes, permissions, and persistence stay in GAL code.
