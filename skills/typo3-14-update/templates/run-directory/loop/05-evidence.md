---
schema: typo3-14-update/loop-doc@1
run_id: "{{RUN_ID}}"
loop_id: "{{LOOP_ID}}"
loop_slug: "{{LOOP_SLUG}}"
track: "{{TRACK}}"
contract: "{{CONTRACT}}"
phase: "{{PHASE}}"
doc: evidence
baseline_ref: "{{BASELINE_REF}}"
sample_ref: null
env_fingerprint: null
content_fingerprint: null
status: open
append_only: true
created_at: "{{NOW}}"
updated_at: "{{NOW}}"

tool_versions: {}
commands: []
artifacts: []
viewport_matrix: []
---

# Evidence — loop {{LOOP_ID}}

**Append-only.** Evidence is an artifact on disk, produced by a recorded command, with a
recorded exit code, reproducible by re-running that command in the same environment.

## Tool versions

Identical before and after, or the comparison is `INVALID` rather than informative.

| Tool | Version |
|---|---|
| Node | |
| Playwright | |
| Chromium | |
| odiff | |
| PHP | |
| TYPO3 | |
| Image processor | |

## Environment

| Field | Value |
|---|---|
| Environment fingerprint | `sha256:…` |
| Content fingerprint | `sha256:…` |
| Sample | `config/sample.txt@sha256:…` |
| Manifest | `manifests/url-manifest.json@sha256:…` |
| Self-test lock | valid / expired / missing |

## Viewport matrix

| Name | Width | Height | DSF |
|---|---|---|---|
| desktop | 1920 | 1080 | 1 |
| tablet | 820 | 1180 | 1 |
| mobile | 390 | 844 | 1 |

## Commands

Every command, verbatim, with its exit code. Also appended to `journal.jsonl`.

| # | Command | Exit | Duration |
|---|---|---|---|
| 1 | | | |

## Artifacts

| Path | SHA-256 | Produced by |
|---|---|---|
| | | |

## Coverage

| Metric | Value |
|---|---|
| URLs discovered | |
| HTTP compared | |
| DOM compared | |
| Visually captured | |
| Coverage degraded | no |

When coverage is degraded, list the actual URL ids not captured and the reason — never
only a count. A report that covered part of a site and reads like one that covered all of
it is worse than no report.
