# GAL, Jev, and Cognitive policy

```
person
  ↓
Reading Room /library
  ↓
GAL bounded retrieval (at most six passages)
  ↓
SemanticDecisionProvider
  ↓
TypeSafe Jev (only implementation on this page)
  ↓
inert ClaimPacket (clove-cip/0.1)
  ↓
deterministic policy
  ↓
source, judgment, and disposition shown apart
  ↓
JEV_ATTEMPT receipt on the local ledger
  ↓
device-local counts, not Clove D1
```

GAL holds source identity, hashes, and the ledger. Jev returns distributions. Cognitive policy, in this repo, is the small gate in `src/lib/cognitive/policy.ts`. It is not the Cognitive OS runtime. The archived `rbardyla-boop/cognitive-os` tree (CIP 0.1, commit observed via GitHub `76a369fb`) supplied the packet shape and the license words. It was not modified.

## What Jev is asked

Five independent Noul questions, alias `jev-latest`, `POST https://api.typesafe.ai/v1/systemone`:

1. Does the supplied evidence support the claim?
2. Does the supplied evidence contradict the claim?
3. Is the supplied evidence insufficient to establish either?
4. Is this evidence relevant to the claim?
5. Does this candidate substantially duplicate another supplied candidate?

Noul is P(yes). It has no separate confidence. Choice and Score confidence, if a response includes one, is distribution concentration. It is not the probability the judgment is correct. Live docs checked 2026-09-24 still show example model strings `jev-1.13.0` and `jev-latest`. 429 and 529 are retried at most twice, with backoff, and stay distinct if they persist.

Jev is not given tools, the whole library, hashes to invent, or permission to write.

## What policy will say

`DISPLAY_ONLY`, `SUPPORT_CANDIDATE`, `CONTRADICTION_CANDIDATE`, `INSUFFICIENT_EVIDENCE`, `HUMAN_REVIEW`, `SERVICE_UNAVAILABLE`.

A support candidate is still `hypothesis_only`. Contradiction is `hazard_only`. Missing Jev, irrelevant evidence, a stale hash, or broken provenance is `do_not_use_for_action`. `full_premise` and `weak_premise` are never issued from this gate. Forbidden uses always include direct action, memory consolidation, rule revision, safety certification, evidence promotion, and source mutation.

Thresholds live in `POLICY_THRESHOLDS`. They were not fitted to a live smoke set.

## What was left out of Cognitive OS

The bus, attention manager, planner, toy-world action engine, memory mutation gateway, dream export, and LLAM bridges are not ported. A human review flag is a disposition, not a `HumanPromotionPacket`.

CALDEC is not on this path. `deterministicBaselineProvider` exists only so a later offline comparison can share `SemanticDecisionProvider`. Do not train CALDEC on Jev output.

The earlier note `GAL_JEV_ARCHITECTURE.md` describes the pre-policy slice. This file is the one to trust.
