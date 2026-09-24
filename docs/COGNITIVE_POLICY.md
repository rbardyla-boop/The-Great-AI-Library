# Cognitive policy

Authority stays in this repository. A Jev distribution is an input to `decide()`, not a decision.

Order, first match wins:

1. Terminal is not `ACCEPTED_RESPONSE` → `SERVICE_UNAVAILABLE`, license `do_not_use_for_action`.
2. A source hash is no longer the live hash, or provenance is empty → `HUMAN_REVIEW`.
3. Support and contradiction are both at least 0.45 → `CONTRADICTION_CANDIDATE`, license `hazard_only`. Both distributions are kept.
4. Relevance P(yes) under 0.40 → `DISPLAY_ONLY`.
5. Insufficient P(yes) at least 0.50 → `INSUFFICIENT_EVIDENCE`, license `hypothesis_only`.
6. Contradiction P(yes) at least 0.72 and above support → `CONTRADICTION_CANDIDATE`.
7. Support P(yes) at least 0.72 and contradiction under 0.45 → `SUPPORT_CANDIDATE`, license `hypothesis_only`.
8. Anything else accepted → `HUMAN_REVIEW`.

Duplicate P(yes) at least 0.72 sets `duplicate` and asks for a person. It does not delete a passage.

Confidence is copied onto the packet and then ignored. A value of 1 does not change the license.

`full_premise` and `weak_premise` are in the type so the CIP vocabulary is intact. The assembler rewrites both to `hypothesis_only`. This slice does not plan and does not act.

Allowed uses are explanation, retrieval, and sometimes contradiction detection. Forbidden uses are fixed: direct action, memory consolidation, rule revision, safety certification, evidence promotion, source mutation.

These cutoffs are conservative defaults. They are not a validation study.
