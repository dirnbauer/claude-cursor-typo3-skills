# Update run — {{PROJECT_NAME}}

> Regenerated from `state.json` after every loop. Do not hand-edit; edits are overwritten
> and, worse, a hand-edited dashboard stops matching the evidence it claims to summarise.

| | |
|---|---|
| Run id | `{{RUN_ID}}` |
| Target | TYPO3 {{TYPO3_FROM}} → {{TYPO3_TO}}, PHP {{PHP_FROM}} → {{PHP_TO}} |
| Phase | {{PHASE}} |
| Contract A | {{CONTRACT_A_STATUS}} |
| Contract B | {{CONTRACT_B_STATUS}} |
| Open findings | {{OPEN_FINDINGS}} |
| Blocked | {{BLOCKED}} |
| Updated | {{UPDATED_AT}} |

## Integrity

| Check | Value |
|---|---|
| Baseline `A-original` | {{BASELINE_SEALED}} |
| Environment fingerprint | {{ENV_FP}} |
| Content fingerprint | {{CONTENT_FP}} |
| Determinism self-test | {{SELFTEST}} |
| URL manifest | {{MANIFEST}} |

## Loops

| Loop | Track | Contract | Verdict | Iter | Open | Idempotent |
|---|---|---|---|---|---|---|
{{LOOP_ROWS}}

## Coverage

| Metric | Value |
|---|---|
| URLs discovered | {{DISCOVERED}} |
| HTTP compared | {{HTTP_COMPARED}} |
| DOM compared | {{DOM_COMPARED}} |
| Visually captured | {{VISUAL_CAPTURED}} |
| Coverage degraded | {{COVERAGE_DEGRADED}} |

{{COVERAGE_NOTE}}

## Approvals

{{APPROVALS}}

## Decisions

{{DECISIONS}}

## Next

{{NEXT}}
