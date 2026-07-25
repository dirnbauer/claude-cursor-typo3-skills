# Rule 40 — Approval matrix

Normative. An approval is a recorded decision by the user, stored as a file, referenced by id. Approval given in conversation and not recorded does not exist for the gate — write it down as it is given.

## 40.1 The matrix

| # | Action | Automatic | Approval | Granularity |
|---|---|---|---|---|
| 1 | Read the repository, inspect the worktree | yes | — | — |
| 2 | Run local tests, linters, static analysis | yes | — | — |
| 3 | Capture the original baseline | yes | — | — |
| 4 | Create a local DDEV snapshot | yes | — | — |
| 5 | Change local project files inside the update scope | yes | covered by the original request | — |
| 6 | Update Composer dependencies | yes | covered by the original request | — |
| 7 | Local database migration after a snapshot | yes | per the upgrade plan | — |
| 8 | Start the run / lock the scope | no | user | once per run (`ADR-001`) |
| 9 | Use an existing, possibly stale local sync | no | user | once (`ADR` + note in `SEAL.md`) |
| 10 | Degraded sampling when sitemaps are unusable | no | user | once (`ADR-002`) |
| 11 | Accept an intentional rendering change | no | user | **per difference class**, with before/after images |
| 12 | Uninstall or permanently remove an extension | no | user | per extension |
| 13 | Fork an extension into `packages/` as technical debt | no | user | per extension |
| 14 | Breaking behaviour change in a local extension | no | user | per change |
| 15 | Destructive DB change, bulk delete, discard editor changes | no | user | per operation |
| 16 | Drop a table or a field | no | user | per object |
| 17 | Contact an external origin not on the allow-list | no | user | per origin |
| 18 | Use an unknown fork or package source | no | user | per package |
| 19 | Exceed a loop budget instead of aborting | no | user | per loop |
| 20 | Accept a residual finding at loop exit | no | user | per finding |
| 21 | Contract A closure certificate | no | user countersign | once |
| 22 | Unlock Contract B | no | user | once |
| 23 | Each Contract B track | no | user | per track |
| 24 | Derive a new baseline `B-<n>` | no | user | per track |
| 25 | Apply IA / content recommendations | no | user | per recommendation (default: recommend only) |
| 26 | Create a commit | no | user | per phase batch |
| 27 | Push, tag, publish, or open a pull request | no | user, separately from #26 | per action |
| 28 | Change a visual threshold or the sample after sealing | **not grantable** | — | see `20-baseline-integrity.md` |
| 29 | Overwrite or edit `baseline/A-original/` | **not grantable** | — | see `20-baseline-integrity.md` |
| 30 | Touch staging, live, or remote infrastructure | **not grantable** | — | see `00-scope-and-prohibitions.md` |

## 40.2 Approval granularity for rendering changes

Approval #11 is **per difference class**, not per page. "The button border radius changed on every page" is one approval with one before/after pair, not 87 approvals.

This matters: a Bootstrap 5 upgrade across a real site produces dozens of intentional differences. Per-page approval would make the loop unusable and would push a working agent toward batching them into one meaningless "approve everything". Per-class keeps each decision small enough to actually be a decision.

A difference class is defined by its **cause**, not its appearance: one changed utility class, one changed component default, one changed variable.

## 40.3 The approval record

`approvals/<APR-nnn>-<slug>.md`, indexed in `approvals/APPROVALS.md`.

```yaml
---
id: APR-004
requested_at: 2026-07-25T10:14:02+02:00
granted_at: 2026-07-25T10:31:40+02:00
granted_by: user
scope: "Bootstrap 5.3 form-control height increased by 2px on all forms"
matrix_ref: 11
loops: ["030"]
baseline_ref: A-original
reversible: true
evidence_ref: loops/030-invariance-bootstrap-5-latest/artifacts/iter-2/diff/kontakt_desktop.png
---
```

The body records the question **as it was asked**, the answer as it was given, and what was shown to the user at the time. An approval whose record does not show what the user actually saw is not evidence that they agreed to it.

## 40.4 Scope of an approval

An approval covers the action it names, in the loop it names, once. It does not generalise to:

- a similar action later in the run,
- the same action in a different loop,
- a broader version of the same action.

When in doubt, ask again. The cost of one extra question is far below the cost of a change nobody agreed to.
