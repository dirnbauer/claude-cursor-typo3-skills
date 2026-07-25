# The run directory

Every update run writes into one project-local directory: `.typo3-update/`. It is the run's memory, its evidence chain, and the thing that lets a fresh agent session resume exactly where the last one stopped.

Nothing in this skill is "remembered". It is written down, and the gates read what was written.

## Layout

```
.typo3-update/
├── STATUS.md                       human dashboard, regenerated from state.json
├── state.json                      the machine state — the ONLY precondition source
├── journal.jsonl                   append-only: every command, argv, cwd, exit code, duration
├── .gitignore                      ignores artifacts and shots; keeps every .md and .json
├── config/
│   ├── run.yml                     domain, languages, golden paths, budgets, contract-B opt-ins
│   ├── sample.txt                  S_A — the frozen URL sample; never edited after sealing
│   └── thresholds.yml              visual thresholds, loop budgets, contract-B targets
├── manifests/
│   ├── url-manifest.json           seed, all URLs, tiers, clusters, viewports, coverage
│   ├── environment.json            versions + fonts + GFX config, hashed
│   ├── content-fingerprint.json    row counts, max tstamp, fileadmin tree hash
│   ├── extensions.json             every installed extension + classification + resolution
│   ├── tooling.json                pinned harness/browser/Lighthouse/axe versions
│   └── snapshots.json              every ddev snapshot, with its loop and reason
├── baseline/
│   ├── A-original/                 IMMUTABLE after sealing
│   │   ├── SEAL.md                 who, when, both fingerprints, sample hash
│   │   ├── MANIFEST.sha256         hash of every captured artifact
│   │   ├── LOCK.json               seal metadata + hash of MANIFEST.sha256
│   │   ├── shots/<viewport>/       screenshots
│   │   ├── dom/                    normalized DOM snapshots
│   │   └── http/                   status, headers, metadata per URL
│   ├── A-supplemental/             append-only; EXCLUDED from the invariance claim
│   └── B-00n-<track>/              one per approved elevation track
├── loops/
│   └── <NNN>-<track>-<slug>/
│       ├── 00-charter.md           frozen after writing
│       ├── 01-preconditions.md     frozen after writing
│       ├── 02-plan.md
│       ├── 03-iterations.md        append-only
│       ├── 04-findings.md          the register; rows updated in place
│       ├── 05-evidence.md          append-only
│       ├── 06-exit.md
│       ├── report.json             schema-validated machine mirror
│       └── artifacts/              shots, diffs, JSON reports, logs
├── approvals/
│   ├── APPROVALS.md                index
│   └── APR-nnn-<slug>.md           one record per approval
├── decisions/
│   └── ADR-nnn-<slug>.md
└── report/
    ├── contract-a-closure.md
    ├── contract-b-summary.md
    ├── kpi-report.md  kpi-report.docx
    └── handover-deployment.md
```

## One directory per loop, seven documents per directory

Every loop directory contains **exactly the same seven markdown documents, always all seven**, even when a document is nearly empty. Fixed names mean the agent never invents a path and a gate never parses prose to find out what happened.

| File | Holds | Written at protocol step | Mutability |
|---|---|---|---|
| `00-charter.md` | Objective, contract, track, in/out of scope, `depends_on`, budgets, authorising approval, the baseline it measures against | 2 | frozen after writing |
| `01-preconditions.md` | The `checks[]` table evaluated against `state.json`, both fingerprints, and the snapshot id; gate verdict | 3–5 | frozen after writing |
| `02-plan.md` | Ranked hypotheses, the ordered cause list, the measurement command, the loop-000 result it relies on | 6–7 | extended between iterations |
| `03-iterations.md` | One section per iteration: cause, change set, files/lines, measurement ref, `open_before`/`open_after`, `progress` | 9–10 | **append-only** |
| `04-findings.md` | The findings register: id, target, class, severity, status, cause, fix ref, evidence ref, `reopened_count` | 8 onward | rows updated in place |
| `05-evidence.md` | Tool versions, exact commands, artifacts with SHA-256, sample ref, viewport matrix | 7 onward | **append-only** |
| `06-exit.md` | `exit_criteria[]` with results, the idempotence re-run, verdict, residual findings, next loop; on abort the condition and the escalation text | 12 | written once |

Plus `report.json` — the machine mirror, validated against `assets/schemas/loop-report.schema.json` — and `artifacts/`.

Why exactly seven, and why these mutability rules:

- **One document per protocol stage** means a gate reads one file rather than scanning a wall of text for a sentence that may not be there.
- **Append-only** `03` and `05` mean a rewritten history shows up as a diff in git. Evidence you can quietly edit is not evidence.
- **Frozen** `00` and `01` mean "the loop relaxed its own preconditions when it got stuck" is detectable rather than invisible — which is exactly the failure mode a loop under pressure drifts toward.

## Front matter

Every loop document carries YAML front matter validated against `assets/schemas/loop-doc-frontmatter.schema.json`:

```yaml
---
schema: typo3-14-update/loop-doc@1
run_id: 2026-07-25-acme
loop_id: "300"
loop_slug: invariance-closure
track: invariance
contract: A
phase: P11
doc: exit
baseline_ref: A-original
sample_ref: config/sample.txt@sha256:1f0c…
env_fingerprint: sha256:9ab3…
content_fingerprint: sha256:4d71…
snapshot: loop-300-pre
status: green
frozen: false
created_at: 2026-07-25T09:02:11+02:00
updated_at: 2026-07-25T13:47:05+02:00
---
```

The schema enforces two rules mechanically rather than by convention: a Contract A invariance document **must** name `A-original` as its baseline, and a Contract B document **must** carry a non-null `approval_ref`.

## Naming

`loops/<NNN>-<track>-<slug>/` — zero-padded id, track, kebab-case slug. The id sorts chronologically and the band says what kind of loop it is:

| Band | Purpose |
|---|---|
| `000–009` | harness (determinism self-test, baseline sealing) |
| `010–099` | pre-update stabilisation |
| `100–199` | migration |
| `200–299` | feature parity |
| `300–399` | closure |
| `500–899` | elevation (Contract B) |
| `900–999` | reporting |

Ids are never reused. A superseded loop keeps its directory with `verdict: superseded` — deleting it would remove the record of an attempt that was made.

## What goes in git

`.typo3-update/.gitignore` ignores `**/artifacts/` and `baseline/**/shots/`, and keeps every `.md` and `.json`.

The reasoning: the documents, reports, manifests and checksums are the audit trail and are small; the PNGs are large, numerous, and reproducible from a sealed baseline plus a recorded command. `MANIFEST.sha256` still proves what the images were, so the evidence chain survives even where the images themselves are not committed.

Whether the run directory is committed at all is the user's call — ask once, at phase P00, and record the answer.

## Resuming

A new session resumes by reading `state.json`, then `STATUS.md` for orientation, then the `06-exit.md` of the last loop with `verdict: green` and the `00-charter.md` of the first one that is not.

It must not resume by reading the conversation. A transcript records what was intended; `state.json` records what actually happened, and only the second one is safe to act on.
