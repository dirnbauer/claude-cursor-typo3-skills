# Measurement recipes

Exact, reproducible commands per Contract B metric. Every one runs inside DDEV against the DDEV URL.
Targets live in `references/quality-bars.md`; thresholds in `config/thresholds.yml`.

Record each command and its exit code in `05-evidence.md` and `journal.jsonl`. A metric without a
recorded command is not evidence.

## Ground rules

- **Warm first, then measure.** Crawl the sample once and discard the result, so caches, processed
  images and lazy assets are in the same state for every run. A cold first request measures the
  cache, not the site.
- **Aggregate over runs.** Single Lighthouse runs are noisy. Use the configured `runs_per_url`
  (default 5) and take the **median**, and record min and max so the spread is visible.
- **Pin the browser.** The Lighthouse Chrome must be the version recorded in the environment
  fingerprint. A browser change between the before and after measurement makes the delta meaningless.
- **Never submit the site to a remote scanner.** Mozilla Observatory, Google Rich Results and
  PageSpeed Insights all require a public URL and would publish the customer's pre-launch state.
  Compute the equivalents offline and say so.

## Performance and Core Web Vitals

```bash
node scripts/t3u.mjs lighthouse \
  --manifest .typo3-update/manifests/url-manifest.json \
  --report .typo3-update/loops/500-elevation-performance-cwv/report.lighthouse.json \
  --runs 5 --form-factor mobile --budget .typo3-update/config/thresholds.yml
```

Mobile preset throttling is recorded in the report (`rttMs`, `throughputKbps`,
`cpuSlowdownMultiplier`) so a later reader can tell whether two runs are comparable.

CLS deserves a second measurement, because the Lighthouse run does not exercise lazy content the way
a real scroll does: walk the sample with a `LayoutShift` PerformanceObserver, forcing lazy content in,
and attribute each shift to its element.

INP has no lab equivalent. Time the five primary interactions — nav open, search submit, accordion,
form field focus, cookie dismiss — with `performance.measure`, report p95, and label it a **proxy**.

## SEO and structured data

Canonical, hreflang, titles, descriptions and `html lang` all come from the stage 1 HTTP/metadata
records that already exist — no new crawl needed. Compare against the bars rather than re-fetching.

JSON-LD: extract every `application/ld+json` block, parse it, and validate the types and required
properties against a **local copy** of the schema.org vocabulary. State explicitly in the report that
only syntax and vocabulary were checked, and that rich-result eligibility was not.

Sitemap health is a stage 1 sweep over every per-language sitemap: every entry 200, no redirects, no
`noindex`, no excluded doktypes.

## Accessibility

```bash
node scripts/t3u.mjs axe \
  --manifest .typo3-update/manifests/url-manifest.json \
  --viewports desktop,tablet,mobile --languages de,en \
  --report .typo3-update/loops/520-elevation-accessibility-manual-aa/report.axe.json
```

Record the axe-core version — rule sets change between releases, and a "new" violation is sometimes a
new rule rather than a new defect.

Reflow: capture at 320×256 and at 1280×1024 with a 4× zoom, and assert no horizontal scroll and no
content loss.

Focus-not-obscured: tab through the page, and for each focused element compare its bounding box
against every `position: fixed` or `sticky` element. Overlap is a finding.

Target size: measure every interactive element's rendered box; anything under 24×24 CSS px without a
documented exception is a finding.

Contrast: axe plus a computed-style sweep that also renders hover, focus and disabled states — axe
only sees what is on screen at scan time.

The manual criteria produce a **checklist with evidence slots**, not a verdict. A human fills the
verdict in; the skill supplies the evidence and says plainly which criteria automation cannot decide.

## Security

Header capture is a stage 1 sweep; compare the header set against the bars.

CSP violations: collect `SecurityPolicyViolationEvent` during a full sample walk **and** during the
backend module sweep. Backend violations are the ones most often missed, and CSP in the backend is
where a bad policy breaks editing rather than viewing.

Observatory-equivalent grade: score the captured header set offline using the documented rubric and
label the result as locally computed.

```bash
ddev composer audit --format=json
```

## Media and cache

Image inventory: for every image in the sample record intrinsic size, rendered CSS size, DPR, format
and transfer size. Oversizing is `intrinsic > 1.5 × rendered` at DPR 1.

AVIF support is a property of the installed processor, not a setting:

```bash
ddev exec convert -list format | grep -i avif
```

If the local processor supports AVIF but production's may not, that is a handover item, not a claim.

Page cache: request each cacheable sampled URL twice and compare. Measure the **hit rate**, not the
timing — local timing is not transferable.

## Code quality

```bash
ddev exec vendor/bin/phpstan analyse --level 9 --error-format=json
ddev exec vendor/bin/typo3 cache:flush && ddev exec vendor/bin/typo3 cache:warmup
# then walk the sample, run the module sweep, run due scheduler tasks
ddev exec cat var/log/typo3_deprecations*.log
```

The deprecation log is only meaningful for code paths actually exercised. **State which paths were
walked** — "clean deprecation log" after visiting three pages means very little.
