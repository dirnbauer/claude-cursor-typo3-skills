---
schema: typo3-14-update/loop-doc@1
run_id: "{{RUN_ID}}"
loop_id: "{{LOOP_ID}}"
loop_slug: "{{LOOP_SLUG}}"
track: "{{TRACK}}"
contract: "{{CONTRACT}}"
phase: "{{PHASE}}"
doc: exit
baseline_ref: "{{BASELINE_REF}}"
snapshot: null
status: open
created_at: "{{NOW}}"
updated_at: "{{NOW}}"

exit_criteria: []
idempotence_rerun: { ran: false, diff_count: null }
verdict: open              # green | aborted | superseded | invalid
abort_condition: null
residual_findings: []
next_loop: null
---

# Exit — loop {{LOOP_ID}}

## Exit criteria

Boolean expressions over `report.json`, evaluated mechanically. Every criterion must also
be checkable by hand from `04-findings.md` and `05-evidence.md`.

| Id | Expression | Result |
|---|---|---|
| EX-01 | `findings.where(class == "regression" and status != "closed").count == 0` | |
| EX-02 | `findings.where(class == "declared-change" and approval_ref == null).count == 0` | |
| EX-03 | `findings.where(class == "harness-noise").count == 0` | |
| EX-04 | `findings.where(class == "content-drift").count == 0` | |
| EX-05 | `findings_by_class.unclassified == 0` | |
| EX-06 | `coverage.http_compared == coverage.discovered` | |

## Idempotence re-run

After all criteria pass, run the measurement once more **changing nothing**.

| Field | Value |
|---|---|
| Ran | |
| Diff count | |

`diff_count` must be `0`. A green loop that is not idempotent is not green — it is
`harness-noise`, and the noise is fixed before the loop closes.

## Budgets used

| Budget | Used | Limit |
|---|---|---|
| Iterations | | |
| No-progress streak | | 2 |
| Time (min) | | |

## Verdict

**green** / **aborted** / **superseded** / **invalid**

### If aborted

| Field | Value |
|---|---|
| Abort condition | |
| Snapshot restored | `loop-{{LOOP_ID}}-pre` |

**Escalation to the user** — what was attempted, what the evidence shows, what is
genuinely unresolved, and the specific decision being asked for. Aborting is a correct
outcome; a loop that stops after six iterations and says precisely what it could not
resolve is worth more than one that thrashes for twenty.

## Residual findings

Only `pre-existing`, `environment` and `improvement` may survive a green exit. Each is
carried into the final report.

| Id | Class | Why it is acceptable here | Carried to |
|---|---|---|---|

## Next

`next_loop:` — and anything the next loop needs to know.
