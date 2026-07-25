---
schema: typo3-14-update/loop-doc@1
run_id: "{{RUN_ID}}"
loop_id: "{{LOOP_ID}}"
loop_slug: "{{LOOP_SLUG}}"
track: "{{TRACK}}"
contract: "{{CONTRACT}}"
phase: "{{PHASE}}"
doc: preconditions
baseline_ref: "{{BASELINE_REF}}"
env_fingerprint: null
content_fingerprint: null
snapshot: null
status: planned
frozen: false
created_at: "{{NOW}}"
updated_at: "{{NOW}}"

gate: fail
checks: []
---

# Preconditions — loop {{LOOP_ID}}

Every check is evaluated **against `state.json` and the manifests on disk**. Not against
memory, and not against what the transcript says happened. Any `fail` blocks the loop.

## Checks

| Id | Expression | Expected | Actual | Result |
|---|---|---|---|---|
| PRE-01 | | | | |
| PRE-02 | | | | |

Standard checks for a Contract A loop:

| Id | Expression |
|---|---|
| PRE-01 | `state.contract_a.phase >= "<this loop's phase>"` |
| PRE-02 | `state.baselines["A-original"].sealed == true` |
| PRE-03 | `state.loops["000"] == "green"` |
| PRE-04 | `env_fingerprint == manifests.environment.sealed` |
| PRE-05 | `content_fingerprint == manifests.content.sealed` |
| PRE-06 | `snapshot != null` |
| PRE-07 | every loop in `depends_on` is `green` |

Contract B loops add:

| Id | Expression |
|---|---|
| PRE-B1 | `state.contract_b.unlocked == true` |
| PRE-B2 | `state.contract_a.closed_at < this loop's created_at` |
| PRE-B3 | `approval_ref != null` and resolves to a file in `approvals/` |
| PRE-B4 | `baseline_ref` names a sealed `B-<n>` baseline |

## Freeze check

| Fingerprint | Sealed value | Current value | Verdict |
|---|---|---|---|
| Environment | | | |
| Content | | | |

A drift that this run did not itself record in `journal.jsonl` means the comparison base
is invalid. That is `INVALID`, not a failure of the site — stop and escalate rather than
hunting a regression the environment invented.

## Rollback anchor

`ddev snapshot --name loop-{{LOOP_ID}}-pre` → recorded in `manifests/snapshots.json`.

## Gate verdict

**pass** / **fail** — with the failing check ids.
