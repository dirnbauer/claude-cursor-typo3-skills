# Rule 50 — Evidence and determinism

Normative. Determinism is not a quality goal of the test harness. It is the **precondition** that makes any comparison mean anything at all.

## 50.1 What counts as evidence

Evidence is an artifact on disk, produced by a recorded command, with a recorded exit code, reproducible by re-running that command in the same environment.

| Counts | Does not count |
|---|---|
| A JSON report with its schema version and input hashes | "The tests passed" |
| A screenshot with its capture key and SHA-256 | "It looks the same" |
| A command in `journal.jsonl` with its exit code | "I ran the wizards" |
| A diff image with a classified finding | "The difference was minor" |
| An approval record showing what the user saw | "The user agreed" |

Every command this skill runs is appended to `journal.jsonl` with its redacted argv, working directory, duration, exit code, and the environment fingerprint hash under which it ran. The journal is append-only. It is the audit trail behind every claim in the final report.

**The final report is assembled from evidence, never written from memory.** Markdown summaries are generated from the JSON reports. A number that appears in the KPI document and nowhere in `state.json` is a fabrication, however plausible.

## 50.2 The environment fingerprint

Hashed inputs: Node version and platform · OS type, release, container image · Playwright version · browser name, version, revision, channel, launch-args hash · installed font list · device scale factor, colour scheme, reduced-motion, forced-colors, locale, timezone · image processor and version, plus the TYPO3 `GFX` configuration (processor, path, effects, jpg/webp/avif quality, allowed extensions, upscaling) · PHP version and extension list · TYPO3 version and context · DDEV version, project type, database engine · harness version and dependency lockfile hash.

Recorded but **not** hashed: CPU count, memory, hostname, uptime. These vary legitimately between runs and hashing them would make every run invalid.

Sealed in phase P01. Asserted at step 4 of every loop. **Drift produces `INVALID` (exit 3), never `FINDINGS` (exit 1)** — the run cannot be judged, which is a different statement from the site being wrong, and conflating the two is how a browser patch gets mistaken for a regression.

A Playwright or Chromium update between the before and after captures is the classic case. It must not happen mid-run, and if it does, the fingerprint says so instead of the diff quietly lying.

## 50.3 The content fingerprint

Proves the *inputs* did not change while the run was in progress.

Database: row count, max `tstamp`, and max `uid` per table for `pages`, `tt_content`, `sys_file`, `sys_file_reference`, `sys_file_metadata`, `sys_redirect`, `sys_template`, `sys_category*`. Excluded because they change on their own: `cf_*`, `sys_log`, `be_sessions`, `fe_sessions`, `sys_lockedrecords`, `tx_scheduler_task`.

Files: `fileadmin/` tree hash over sorted `(relative path, size, mtime@1s, content SHA-256 for files under 8 MiB)`. `_processed_` and `_temp_` are excluded from the **input** fingerprint — they are rendering results, not inputs — but their warm/cold state is recorded separately because it changes timing.

Without this, an editor saving one content element in the local backend mid-run looks exactly like an update regression. This is a common and expensive failure mode; the fingerprint turns a day of hunting into one clear message.

## 50.4 Stabilisation

Before every capture, identically before and after:

- Context: `reducedMotion: 'reduce'`, fixed `colorScheme`, `forcedColors: 'none'`, explicit `locale` and `timezoneId`, `deviceScaleFactor: 1`.
- Init script: **seed `Math.random` per capture** — this is what actually makes randomised carousels, shuffled teasers and generated element ids deterministic, and it is the single highest-leverage stabilisation. Pin `Date.now()` and `new Date()` to a fixed epoch plus a monotonic counter; a hard freeze divides by zero in real code. Patch `requestAnimationFrame` so pending frames can be cancelled before the shot.
- CSS: `animation: none`, `transition: none`, `caret-color: transparent`, `scroll-behavior: auto`, `scrollbar-gutter: stable`.
- Then: `document.fonts.ready` plus an explicit load of each declared face; pause and rewind every `<video>`; force lazy-load completion by stepped scroll to the bottom, wait until every `img[loading=lazy]` reports `complete`, scroll back to 0; seed the consent state from configuration as cookies or localStorage — **never by clicking the banner**, which is timing-dependent; warm image processing before the first capture.
- Do **not** use `networkidle`. Use `domcontentloaded` plus fonts plus an in-flight-request quiet-period detector fed by the route handler, with a hard cap.

## 50.5 Third-party requests are blocked by default

External origins are aborted unless explicitly allow-listed. Google Fonts, analytics, tag managers, videos, social embeds, maps, external scripts, tracking pixels and APIs each break reproducibility, and each one also sends data about the run somewhere it does not belong.

Anything genuinely required must be explicitly allowed or mirrored locally, and the allow-list is recorded in the manifest.

## 50.6 Flake quarantine

A difference must **reproduce on an immediate re-shoot** of the same capture before it becomes a finding. One that does not reproduce is classified `harness-noise` and sends work back to loop 000.

Captures found unstable during loop 000 are marked `quarantined` in the manifest. Their later differences are pre-classified `harness-noise` — still blocking, but honestly labelled rather than presented as a site regression.

## 50.7 Reproducible sampling

Sampling uses a **seeded Fisher-Yates shuffle**, with the seed recorded in the manifest. `sort(() => Math.random() - 0.5)` is forbidden: it is unseeded, so it is not reproducible, and it is statistically biased, so it does not even sample uniformly.

The manifest records seed, algorithm, source sitemaps, the full URL list, the visual set, the Lighthouse sample, browser name and version, the viewport matrix, the stabilisation profile hash, and `createdAt`. Its own hash is asserted before every use — a manifest is a file on disk and can be edited, so it is verified, not trusted.

## 50.8 Coverage is declared, never implied

Where full pixel coverage is not achieved, the manifest records `coverage.notCaptured[]` with **the actual URL ids and the reason** — never only a count. Reasons are drawn from a fixed set: `tier3-budget`, `cluster-represented`, `excluded-by-config`, `guard-blocked`, `fetch-failed`.

When a capture budget was exhausted, the loop report carries `coverageDegraded: true` and the generated summary says so **in its first paragraph**.

Silent truncation is the failure this rule exists to prevent: a report that covered 60% of a site and reads exactly like one that covered all of it is worse than no report, because it produces false confidence.
