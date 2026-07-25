---
schema: typo3-14-update/loop-doc@1
run_id: "{{RUN_ID}}"
loop_id: "{{LOOP_ID}}"
loop_slug: "{{LOOP_SLUG}}"
track: "{{TRACK}}"
contract: "{{CONTRACT}}"
phase: "{{PHASE}}"
doc: iterations
baseline_ref: "{{BASELINE_REF}}"
status: open
append_only: true
created_at: "{{NOW}}"
updated_at: "{{NOW}}"

iterations: []
---

# Iterations — loop {{LOOP_ID}}

**Append-only.** Add a section per iteration; never edit or delete an earlier one. A
rewritten iteration log hides exactly the information that makes a stuck loop diagnosable.

Each iteration addresses **one** cause and stays inside the change budget. Fixing two
causes at once destroys the attribution that makes the next measurement meaningful.

## Progress ledger

| # | Cause | Files | Lines | open_before | open_after | Progress |
|---|---|---|---|---|---|---|
| 1 | | | | | | |

`progress` is `open_after < open_before`. Two consecutive `false` values abort the loop.

---

## Iteration 1

**Cause:** C1 — 

**Change:**

**Files touched:** · **Lines changed:** · **Budget breach:** no

**Measurement:** `artifacts/iter-1/…`

**Result:** open_before → open_after

**Findings closed:** · **Findings opened:**

**Assessment:** did this confirm or refute the hypothesis? If it refuted it, say so — a
refuted hypothesis is information, and recording it stops the next iteration retrying it.

---
