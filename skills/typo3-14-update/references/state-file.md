# `state.json` and `journal.jsonl`

`state.json` is the **only** source a loop may read its preconditions from. `journal.jsonl` is the append-only history behind it. Together they are what makes an update run resumable across sessions and auditable afterwards.

Schema: `assets/schemas/state.schema.json`.

## Why the state file exists

A TYPO3 update runs over hours or days and across more than one agent session. Without persisted state, six things go wrong, and every one of them has a familiar shape:

- a phase is skipped because it "was already done"
- two snapshots get confused and the wrong one is restored
- a test is assumed to have passed because it passed last time
- an approval is lost and a change ships nobody agreed to
- a new baseline is silently used and the invariance claim quietly becomes meaningless
- a destructive step is repeated

Each is a memory failure, and none of them is fixed by remembering harder. They are fixed by not relying on memory: `state.json` is read from disk, and it is the authority.

**The transcript is not the state.** A conversation records what was intended; `state.json` records what happened. When they disagree, the file is right.

## The shape

```json
{
  "schema": "typo3-14-update/state@1",
  "run_id": "2026-07-25-acme",
  "project": { "name": "acme", "trusted_origin": "https://acme.ddev.site", "languages": ["de","en"] },
  "target": { "kind": "project", "typo3_from": "12.4.31", "typo3_to": "14.3",
              "php_from": "8.1", "php_to": "8.4", "php_85_evaluated": true, "php_85_blockers": [] },
  "contract_a": { "phase": "P11", "status": "open", "closed_at": null, "closure_ref": null },
  "contract_b": { "unlocked": false, "unlocked_at": null, "tracks": [] },
  "baselines": { "A-original": { "sealed": true, "sealed_at": "…", "manifest": "sha256:…", "urls": 87 } },
  "fingerprints": { "environment": "sha256:…", "content": "sha256:…", "sealed_at": "…" },
  "selftest": { "status": "green", "at": "…", "lock_hash": "…", "coverage": "all" },
  "loops": { "000": "green", "001": "green", "010": "green", "300": "open" },
  "approvals": ["APR-001"], "decisions": ["ADR-001"],
  "snapshots": ["pre-update", "loop-300-pre"],
  "open_findings": 4, "blocked": null, "updated_at": "…"
}
```

## Load-bearing fields

| Field | Why it matters |
|---|---|
| `project.trusted_origin` | The one origin credentials and navigation may reach. Scheme included and never rewritten — rewriting the scheme is how an `http://` DDEV project silently discovers zero URLs. |
| `target.php_to` / `php_85_evaluated` | 8.4 is the standard target. `php_85_evaluated` is `null` until `composer why-not php 8.5` has actually run, so "we could not use 8.5" is never confused with "we never checked". |
| `contract_a.closed_at` | Gate B1.1 compares this timestamp against every elevation loop's `created_at`. It is the mechanical answer to "did improvement work leak into the migration?" |
| `contract_b.unlocked` | Set only by the closure certificate. No elevation loop may start while it is false. |
| `baselines.A-original.sealed` | Until true, no comparison means anything. |
| `fingerprints.*` | Asserted at step 4 of every loop. A drift is `INVALID`, not `FINDINGS`. |
| `selftest.lock_hash` | Every `compare-*` command refuses without a valid lock. This is the mechanical form of "only a harness that proves zero against itself may judge an update". |
| `blocked` | Non-null means the run has stopped and is waiting on a person. A run that is blocked and does not say so is the worst state to resume into. |

## Writing

Atomically — write to a temp file, `rename` over the target, under a `state.lock`. A half-written state file is worse than none, because it looks authoritative.

Every write is paired with a `journal.jsonl` append. The state says where things stand; the journal says how they got there.

## `journal.jsonl`

One JSON object per line, append-only, never rewritten:

```jsonl
{"ts":"2026-07-25T09:02:11+02:00","event":"command","loop_id":"300","argv":["t3u","compare-visual","--before-dir","…"],"cwd":"/var/www/html","exit_code":1,"duration_ms":184203,"env_fp":"sha256:9ab3…"}
{"ts":"2026-07-25T09:06:44+02:00","event":"finding","loop_id":"300","id":"F-300-001","class":"regression","status":"open"}
{"ts":"2026-07-25T10:31:40+02:00","event":"approval","loop_id":"030","id":"APR-004","granted_by":"user"}
{"ts":"2026-07-25T11:02:03+02:00","event":"transition","loop_id":"300","from":"open","to":"green"}
{"ts":"2026-07-25T11:04:19+02:00","event":"policy-block","loop_id":"300","reason":"cross-origin-redirect","target":"[redacted]"}
```

Events: `command` · `finding` · `approval` · `decision` · `transition` · `snapshot` · `policy-block` · `drift` · `abort`.

`policy-block` is deliberately its own event so security refusals are greppable rather than buried inside generic errors. Every command carries the environment fingerprint hash it ran under, so a later reader can tell which results are comparable.

Redaction is applied before writing. Argv is redacted, not omitted — knowing *that* a command ran with a secret argument is useful; the value is not.

## `STATUS.md`

Regenerated from `state.json` after every loop. Never hand-edited: an edited dashboard stops matching the evidence it summarises, and it is the first thing a person reads.

## Legal transitions

- `contract_a.phase` only moves forward, one phase at a time.
- A loop goes `planned → open → green | aborted`. `green → open` is not a transition; a loop that must run again is a **new loop id** with `depends_on` pointing at the old one.
- `contract_b.unlocked` may only be set by the closure certificate, and only once.
- A baseline goes `unsealed → sealed`, once. There is no unseal.

A tool that cannot make a transition legally must refuse and say why, rather than writing the state it wishes were true.
