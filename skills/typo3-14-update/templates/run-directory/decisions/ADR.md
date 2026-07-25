---
id: "ADR-{{NNN}}"
run_id: "{{RUN_ID}}"
loops: []
supersedes: null
superseded_by: null
---

# ADR-{{NNN}}: {{TITLE}}

> Validate with the `architecture-decision-records` skill before closing the loop:
> `python3 <skills>/architecture-decision-records/scripts/validate_adrs.py .typo3-update/decisions`

## Status

Proposed

<!-- Proposed | Accepted | Rejected | Deprecated | Superseded by ADR-NNN.
     Preserve accepted and rejected records; supersede rather than rewrite. -->

## Date

{{DATE}}

## Context

What forced a decision, stated as forces and constraints — not as a disguised solution.
Include the evidence, not just the conclusion: the measurement, the command output, the
count of affected URLs.

## Decision

The chosen approach, stated assertively and precisely.

## Alternatives

Credible options only; no straw men.

| Option | Consequence | Rejected because |
|---|---|---|
| | | |

## Consequences

### Positive

-

### Negative

-

### Effect on the invariance claim

**Required for any ADR taken during Contract A.** If this decision weakens the claim —
degraded sampling, a URL excluded from comparison, an exhausted capture budget — say so
here in plain terms **and** name it in `report/contract-a-closure.md`.

A weakened claim that is documented is honest. One that is only implied is not.

- Weakens the invariance claim: **yes / no**
- URLs excluded from the claim:
- Recorded in the closure certificate: **yes / no**
