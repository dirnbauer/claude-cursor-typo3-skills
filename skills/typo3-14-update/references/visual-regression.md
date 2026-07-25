# Visual regression harness

**Current state, stated plainly.** The harness is mid-migration from v1 (`run-tests.cjs`,
`backend-module-sweep.cjs`) to v2 (`lib/`, ESM, guarded). Read this before trusting a result.

| Component | State |
|---|---|
| `lib/cli/exit-codes.mjs` | **v2** — the 0–5 contract |
| `lib/net/url-guard.mjs` | **v2** — pinned-origin allow-listing, 22 unit tests |
| `lib/net/safe-fetch.mjs` | **v2** — manual redirects, credentials dropped on origin change |
| `lib/net/sitemap.mjs` | **v2** — bounded walker, entity-declaration refusal, 11 unit tests |
| `lib/util/rng.mjs`, `lib/util/redact.mjs` | **v2** — seeded Fisher-Yates, redaction, untrusted containment |
| `run-tests.cjs` | **v1 with the critical defects patched** — see below |
| `backend-module-sweep.cjs` | **v1** — known defects listed below, not yet fixed |

`npm ci && npm test` runs the v2 unit suite (53 tests).

## What was fixed in v1 while v2 is built

Three defects made the shipping harness silently pass, so they were patched in place rather than
left waiting for the rewrite:

1. **Exit codes.** `compare-screenshots`, `smoke-test` and `lighthouse-test` never exited non-zero.
   A run with forty differing screenshots exited 0, so nothing could gate on it and "loop until
   green" was unenforceable. Now: `0` pass, `1` findings, `2` harness error.
2. **`BROKEN_PAGE_STRINGS`** was documented as having a "(built-in list)" default that did not
   exist, so the smoke test detected nothing unless the caller knew to set it. A real default list
   now ships.
3. **After-only files** were invisible: comparison walked only the *before* directory, so a page
   that started rendering *more* content was never reported. `onlyInAfter` is now a report field and
   counts toward findings.

Also changed: `minor` differences now count as findings. Under the zero-tolerance policy a
percentage threshold measures area, not importance — a missing button hides comfortably inside "1%".

## Known defects still in v1

Do not rely on these being safe; they are why v2 exists.

- `getSitemapTargets` hard-codes `https://` after stripping the caller's scheme, so an `http://`
  DDEV project discovers zero URLs — and the fetch failure is downgraded to a warning, so
  `get-urls` can "succeed" with only golden paths.
- Sitemap recursion has no visited set, depth cap, document cap, size cap or origin check.
- `GOLDEN_PATH_URLS` accepts absolute URLs without an origin check.
- Browser args include `--no-sandbox`, `--disable-setuid-sandbox` and `--disable-web-security`.
- `.env` and `.env.local` are auto-loaded from the **skill** directory, sharing credentials across
  every project that uses the skill.
- Sampling uses `sort(() => Math.random() - 0.5)` — unseeded and statistically biased.
- Third-party requests are not blocked.
- The smoke test clicks **random** links, which can reach logout, cache clearing, deletion,
  unsubscribe, scheduler actions or large downloads.
- `backend-module-sweep.cjs` interpolates the module identifier straight into a CSS selector, and
  marks non-clickable entries `skipped` while failing only on `failed > 0` — so a run can look green
  with modules unchecked.
- Reports carry raw URLs, query parameters, page titles, console messages and stack traces with no
  redaction.
- No `package-lock.json` is committed, so a Playwright or odiff bump between the before and after
  run can itself manufacture differences.

Until v2 lands, treat a v1 green as *necessary but not sufficient*, and keep the environment
completely still between the two captures.

## v1 usage

```bash
cd skills/typo3-14-update/scripts
npm ci
```

Run inside the DDEV web container so browsers, DNS and the site share one environment. In-container
browsers come from the public `codingsasi/ddev-playwright` add-on:

```bash
ddev add-on get codingsasi/ddev-playwright && ddev restart && ddev install-playwright
```

```bash
node run-tests.cjs --action=get-urls --domain="https://site.ddev.site" --output="urls.txt"
node run-tests.cjs --action=take-screenshots --url-file="urls.txt" --output="shots/before/"
# ... update ...
node run-tests.cjs --action=take-screenshots --url-file="urls.txt" --output="shots/after/"
node run-tests.cjs --action=compare-screenshots --before-dir="shots/before/" --after-dir="shots/after/" \
  --output-dir="shots/diff/" --json-output="visual-report.json"
node run-tests.cjs --action=smoke-test --domain="https://site.ddev.site" --json-output="smoke.json"
node run-tests.cjs --action=lighthouse-test --domain="https://site.ddev.site" --json-output="lh.json"
node backend-module-sweep.cjs --base-url="https://site.ddev.site" --output="sweep.json"
```

`lighthouse-test` picks its own small sample (homepage plus three random pages) and does **not** read
`--url-file`. For the full audit, loop Lighthouse over the persisted list yourself.

Backend credentials come from `BE_USER` / `BE_PASSWORD`. Use a dedicated local admin created for the
test, never a reused production login, and never commit them.

## Sampling and devices

- Discovery reads `/sitemap.xml` plus `/<lang>/sitemap.xml` for every entry in `LANGUAGE_LIST`
  (default `en,de` — set it to the site's real prefixes). Validate the sitemaps first, or discovery
  inherits their gaps.
- `GOLDEN_PATH_URLS` adds must-test pages to every sample.
- Defaults: 10 random URLs per sitemap (`RANDOM_URLS_PER_SITEMAP`), capped at 100 (`MAX_URLS`).
- Matrix: Chromium at desktop 1920×1080, tablet 820×1180, phone 390×844, device scale factor 1,
  full-page, after a 2 s stabilisation wait.

Persist `urls.txt`. **The identical sample must run before and after** — that is the whole point.

## Comparison

`odiff` by default with an automatic `pixelmatch` fallback; `VISUAL_COMPARE_ENGINE=pixelmatch`
forces it. `VISUAL_THRESHOLD` (default `0.1`) is per-pixel colour sensitivity.

**Never raise a threshold or re-baseline to make a difference disappear** — see
`rules/20-baseline-integrity.md`.

## Tuning

| Variable | Default | Purpose |
|---|---|---|
| `LANGUAGE_LIST` | `en,de` | language prefixes for per-language sitemaps |
| `GOLDEN_PATH_URLS` | (empty) | must-test URLs |
| `RANDOM_URLS_PER_SITEMAP` | `10` | random sample per sitemap |
| `MAX_URLS` | `100` | overall cap |
| `SITEMAP_CONCURRENCY` | `4` | parallel sitemap fetches |
| `SCREENSHOT_CONCURRENCY` | CPU-based, ≤6 | parallel screenshot workers |
| `SCREENSHOT_RETRIES` | `1` | retry failed jobs |
| `SCREENSHOT_STABILIZE_MS` | `2000` | wait after DOMContentLoaded |
| `COMPARE_CONCURRENCY` | CPU-based, ≤4 | parallel comparison workers |
| `COMPARE_WORKER_TIMEOUT_MS` | `120000` | per-image timeout |
| `VISUAL_COMPARE_ENGINE` | `odiff` | `odiff` or `pixelmatch` |
| `ODIFF_BIN` | auto-detected | explicit binary path |
| `BROKEN_PAGE_STRINGS` | built-in list | error markers for page checks |
| `BE_USER` / `BE_PASSWORD` | (none) | backend credentials for the sweep |

macOS: Playwright's `chromium-headless-shell` can crash on recent versions; both scripts detect
Darwin and launch full Chromium with `--headless=new` (`PLAYWRIGHT_CHANNEL=chrome` overrides).

## Fallback

When the bundled harness cannot run, scaffold Playwright `toHaveScreenshot` tests instead, with
animations disabled and dynamic regions masked or stabilised. An `.mdc`-only client has the skill
body but **not** `scripts/`, so it must use this fallback — and the closure certificate records the
lower evidence bar.
