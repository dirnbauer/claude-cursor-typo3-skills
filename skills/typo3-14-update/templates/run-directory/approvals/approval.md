---
id: "APR-{{NNN}}"
requested_at: "{{NOW}}"
granted_at: null
granted_by: null
scope: ""
matrix_ref: null        # the row number in rules/40-approval-matrix.md
loops: []
baseline_ref: null
reversible: null
evidence_ref: null
---

# APR-{{NNN}} — {{SLUG}}

## What was asked

The question **exactly as it was put to the user**. Not a summary written afterwards —
an approval record that does not show what was actually asked is not evidence that the
user agreed to this.

## What the user was shown

Screenshots, diffs, command output, affected URL counts. Link the artifacts.

| Evidence | Path |
|---|---|
| | |

## Scope

What this approval covers, precisely. Rendering-change approvals are **per difference
class** — defined by cause, not appearance: one changed utility class, one changed
component default, one changed variable. "The button border radius changed on every page"
is one approval, not 87.

## What it does not cover

An approval covers the action it names, in the loop it names, once. It does not extend to
a similar action later, the same action in another loop, or a broader version of itself.

## Answer

> The user's answer, verbatim.

**Granted / declined**, at {{TIMESTAMP}}.

## Consequence

What happens now, and which findings this approval reclassifies from `regression` to
`declared-change`.
