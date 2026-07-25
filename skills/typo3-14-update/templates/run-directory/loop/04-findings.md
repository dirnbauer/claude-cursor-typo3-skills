---
schema: typo3-14-update/loop-doc@1
run_id: "{{RUN_ID}}"
loop_id: "{{LOOP_ID}}"
loop_slug: "{{LOOP_SLUG}}"
track: "{{TRACK}}"
contract: "{{CONTRACT}}"
phase: "{{PHASE}}"
doc: findings
baseline_ref: "{{BASELINE_REF}}"
status: open
created_at: "{{NOW}}"
updated_at: "{{NOW}}"

findings: []
---

# Findings register — loop {{LOOP_ID}}

Every difference, failure and violation. **Every row carries a class.** Unclassified is a
blocking state, not a backlog — see `rules/30-finding-classification.md`.

Rows are updated in place; the status history lives in `journal.jsonl`.

## Register

| Id | Target | Class | Sev | Status | Cause | Fix | Evidence | Reopened |
|---|---|---|---|---|---|---|---|---|
| F-{{LOOP_ID}}-001 | | | | | | | | 0 |

## Class counts

| Class | Count | Blocks Contract A? |
|---|---|---|
| `regression` | 0 | **yes** |
| `declared-change` | 0 | only without an approval |
| `pre-existing` | 0 | no |
| `harness-noise` | 0 | **yes** |
| `environment` | 0 | no |
| `content-drift` | 0 | **yes** |
| `improvement` | 0 | no |
| **unclassified** | 0 | **yes — must be 0** |

## Classification notes

For each non-obvious classification, record why. In particular:

- **`harness-noise`** — this does not close the finding, it moves it. The loop stays
  blocked and the missing stabilisation goes back to loop 000.
- **`declared-change`** — name the approval id. Without one it is a `regression`.
- **`pre-existing`** — state how it was verified against baseline A.
- **`content-drift`** — stop. Every other finding in this run is suspect until resolved.
