---
schema: typo3-14-update/loop-doc@1
run_id: "{{RUN_ID}}"
loop_id: "{{LOOP_ID}}"
loop_slug: "{{LOOP_SLUG}}"
track: "{{TRACK}}"            # harness | invariance | elevation | report
contract: "{{CONTRACT}}"      # A | B | none
phase: "{{PHASE}}"
doc: charter
baseline_ref: "{{BASELINE_REF}}"   # A-original for every Contract A loop
snapshot: null                # filled at protocol step 5
approval_ref: null            # REQUIRED for declared-change and all Contract B loops
status: planned
frozen: false                 # set true once written; this document does not change afterwards
created_at: "{{NOW}}"
updated_at: "{{NOW}}"

objective: ""
in_scope: []
out_of_scope: []
depends_on: []
max_iterations: 6             # 8 for loop 300, 3 for harness loops
change_budget: { files: 10, lines: 400 }
time_budget_min: 90           # 240 for loop 300
abort_conditions:
  - max_iterations
  - no_progress_2
  - oscillation
  - fingerprint_drift
  - time_budget
  - budget_breach
  - unclassifiable
---

# Loop {{LOOP_ID}} — {{LOOP_SLUG}}

## Objective

One sentence. What must be true when this loop closes.

## Contract

Which contract governs this loop, and what that means here. A Contract A loop must
produce no unexplained difference against `A-original`. A Contract B loop measures
against its own derived baseline and needs an approval before it may start.

## In scope

- 

## Out of scope

Name what this loop will *not* touch. This is the sentence that keeps Contract B
work from leaking into Contract A — an improvement noticed here is logged as an
`improvement` finding, not fixed here.

- 

## Depends on

Loops that must be green first, and why.

## Authorisation

| Field | Value |
|---|---|
| Approval | `{{APPROVAL_REF}}` (or "not required — automatic per rules/40") |
| Baseline | `{{BASELINE_REF}}` |
| Snapshot | filled at step 5 |

## Budgets

| Budget | Value |
|---|---|
| Max iterations | |
| Change budget | ≤ files / ≤ lines per iteration |
| Time budget | min |

Exceeding a budget requires an approval recorded in `06-exit.md`. Aborting is the
default and is a correct outcome.
