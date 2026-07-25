# Visual regression harness

`scripts/t3u.mjs` — one entrypoint, subcommands, and exactly one place that decides the exit
code. See [`harness-contract.md`](harness-contract.md) for the full contract.

```bash
cd skills/typo3-14-update/scripts
npm ci
npm test        # 138 tests, no network, no DDEV, no browser required
```

Run inside the DDEV web container so browsers, DNS and the site share one environment.
In-container browsers come from the public `codingsasi/ddev-playwright` add-on:

```bash
ddev add-on get codingsasi/ddev-playwright && ddev restart && ddev install-playwright
```

## The order that matters

```bash
t3u init --base-url "https://acme.ddev.site" --languages de,en
t3u env-fingerprint --write-baseline
t3u content-fingerprint --write-baseline
t3u discover-urls --seed "acme-2026"

t3u selftest-determinism          # loop 000 — MUST reach zero before anything else
t3u capture --label before
t3u seal-baseline --id A-original # immutable from here

# … the update …

t3u capture --label after
t3u compare-http && t3u compare-dom && t3u compare-visual
t3u backend-sweep --base-url "https://acme.ddev.site"
t3u gate --loop 300-invariance-closure
t3u report --loop 300-invariance-closure
```

`selftest-determinism` is not optional. Every `compare-*` command and `gate` refuse with
exit 4 without a valid self-test lock, and with exit 3 if the lock's inputs have drifted.

## Exit codes

| Code | Meaning | What to do |
|---|---|---|
| 0 | pass | continue |
| 1 | findings | **fix the site** |
| 2 | harness error | **fix the harness** |
| 3 | invalid | **stop** — fingerprint, baseline or manifest drift; the run cannot be judged |
| 4 | precondition | satisfy it first |
| 5 | blocked by policy | **investigate** — a security guard refused |

3 and 5 are separate from 1 and 2 deliberately: a Chromium patch between captures is not a
site regression, and a guard refusal is not a broken tool.

## Commands

| Command | Purpose |
|---|---|
| `init` | Create the run directory; validates the base URL on its own terms first |
| `doctor` | Node version, dependencies, browser launch, sandbox state, guard check |
| `env-fingerprint` / `content-fingerprint` | `--write-baseline` to seal, bare to assert |
| `discover-urls` | Guarded sitemap walk → URL manifest with tiered coverage |
| `capture --label <l>` | Stage 1 (HTTP), stage 2 (DOM), stage 3 (screenshots) |
| `selftest-determinism` | Double-shoot the untouched site; require zero |
| `seal-baseline` / `verify-baseline` | `SHA256SUMS` + `LOCK.json`; there is no unseal |
| `compare-http` / `compare-dom` / `compare-visual` | The three stages |
| `backend-sweep` | Every module opened; 100% coverage required |
| `smoke` | Deterministic read-only navigation |
| `lighthouse` | Manifest sample, median of N runs |
| `gate` | Aggregate a loop verdict |
| `report` | Generate `SUMMARY.md`, `FINDINGS.md`, `EVIDENCE.md` from the JSON |

## Coverage

Stage 1 and stage 2 cover **100% of discovered URLs, always**. If they cannot, the run is
`INVALID` rather than "sampled".

Stage 3 is tiered within a capture budget:

- **Tier 1**, always: homepage per language, golden paths, 404, search, empty search, login,
  password reset, forms — plus every URL a stage 1 or 2 finding touched.
- **Tier 2**: two representatives per template cluster. The cluster signature is the
  normalised DOM skeleton with text removed, which stage 2 produces anyway, so 4,198 news
  detail pages collapse to two captures while all 4,198 stay proven at stages 1 and 2.
- **Tier 3**: seeded remainder, within `--visual-budget`.

**Coverage is declared, never implied.** The manifest records `coverage.notCaptured[]` with
the actual URL ids and a reason from a fixed set. When a budget is exhausted, the generated
summary says so in its first paragraph.

## Determinism

Sampling uses a seeded sfc32 + Fisher-Yates shuffle. The seed is recorded in the manifest,
and the manifest verifies its own hash before use.

Stabilisation, applied identically before and after: `reducedMotion`, fixed colour scheme,
explicit locale and timezone, device scale factor 1, animations and transitions off,
`caret-color: transparent`, `scrollbar-gutter: stable`, `document.fonts.ready` plus explicit
per-face loading, lazy-load forced by stepped scroll, videos paused and rewound, consent
**seeded** as cookies/localStorage rather than clicked.

Two that carry most of the weight and are easy to miss:

- **`Math.random` is seeded per capture.** Rotating carousels, shuffled teasers and generated
  element ids cannot be stabilised with CSS, and they are the most common remaining flake
  once animations are off.
- **The clock is pinned but keeps moving.** A hard freeze divides by zero in real code; a
  fixed origin plus a monotonic counter is stable and still lets timing code run.

`networkidle` is not used. A quiet-period detector counts in-flight requests, so a page that
never settles reports what it was waiting for.

## Security

Every URL passes the guard at nine call sites, including immediately before each `page.goto`
re-read from the manifest, on every redirect hop, and on `framenavigated`.

The guard uses **pinned-origin allow-listing**: each allowed origin is resolved once and its
addresses frozen, so a private address is permitted only when it is pinned *and* its origin
is allow-listed. `acme.ddev.site → 127.0.0.1` works; `169.254.169.254`, `redis:6379`,
`host.docker.internal`, a different host on the same IP, and a host that later rebinds are
all refused.

Third-party requests are blocked by default and counted. `--disable-web-security` is gone;
`--no-sandbox` needs `T3U_ALLOW_NO_SANDBOX=1` and is recorded in the fingerprint.

Backend credentials come from the process environment or an explicit `--env-file` outside the
repository — never an implicit `.env`. The origin is asserted before they are typed and again
after the login POST settles.

## Reports

Every report goes through one write door: validate → redact → atomic write. A report that
fails its own schema is exit 2 — the harness must not emit malformed evidence. A `pass`
verdict carrying open blocking findings is refused as internally inconsistent.

Page titles, console messages and module labels are stored under `untrusted*` keys, capped,
escaped and fenced, and **no verdict-producing path reads a string field**. The test for this
mutates the injected text and asserts the verdict is byte-identical.

Markdown summaries are generated from the JSON. A number in a summary that appears in no
report is a fabrication.

## Tuning

| Variable / flag | Default | Purpose |
|---|---|---|
| `--seed` | run id | Sampling seed; recorded in the manifest |
| `--visual-budget` | `1500` | Screenshot capture budget |
| `--lighthouse-sample` | `25` | URLs for Lighthouse |
| `--runs` | `5` | Lighthouse runs per URL, median reported |
| `--reshoots` | `1` | Flake quarantine re-shoots |
| `--redaction-profile` | `local` | `local` or `share` (for the KPI document) |
| `--allow-origin` | — | Additional allowed origin, repeatable |
| `--env-file` | — | Explicit secret file; no implicit `.env` |
| `ODIFF_BIN` | auto | Explicit odiff binary |
| `PLAYWRIGHT_CHANNEL` | — | Use a branded Chrome channel |
| `T3U_ALLOW_NO_SANDBOX` | unset | Opt into a weakened browser; recorded |
| `BE_USER` / `BE_PASSWORD` | — | Backend credentials for the sweep |

macOS: Playwright's `chromium-headless-shell` can crash on recent versions; the harness
detects Darwin and launches full Chromium with `--headless=new`.

## Tests

`npm test` runs 138 tests with no network, no DDEV and no browser: unit tests over the guard,
sitemap walker, normaliser, classifier, manifest, write door, state machine and lockfile, and
e2e tests against a local fixture server that serves a hostile sitemap, a before/after site
pair with seeded regressions, and injected page content.

## Fallback

An `.mdc`-only client has the skill body but **not** `scripts/`, so it must scaffold
Playwright `toHaveScreenshot` tests instead, with animations disabled and dynamic regions
masked. The closure certificate records the lower evidence bar.
