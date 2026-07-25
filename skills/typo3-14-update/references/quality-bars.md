# Contract B quality bars

The measurable definition of "a top-10 TYPO3 project". Machine copy in
`config/thresholds.yml`; commands in `references/measurement-recipes.md`.

**Every number here is measured locally in DDEV.** That is why every row carries a caveat, and why
`references/kpi-report.md` forbids quoting an absolute local score without it. A local Lighthouse
score is a *relative* signal — the improvement between two runs is the evidence, not the number.

Contract B cannot start before the Contract A closure certificate exists.

## Loop 500 — Performance and Core Web Vitals

| Bar | Target | Local caveat |
|---|---|---|
| LCP | ≤2.5 s mobile, ≤1.8 s desktop, 5-run median | Local network is not the user's network. Treat the delta between runs as the evidence. |
| CLS | ≤0.05 (hard fail >0.1) | The most transferable of the three — a local CLS regression is a real regression. |
| INP proxy | TBT ≤200 ms; scripted interaction latency ≤200 ms p95 | TBT is a **proxy**. Never write "INP passing" from lab data; INP is a field metric. |
| FCP / Speed Index / TTFB | ≤1.8 s / ≤3.4 s / ≤600 ms | Local TTFB is unrealistically low — no network, warm caches. Record it, flag it as non-transferable. |
| Lighthouse Performance | ≥90 mobile, ≥95 desktop | Indicative only. Act on the concrete audits, not the score. |
| Critical-path payload | ≤170 KB compressed JS, ≤60 KB CSS per template | Unaffected by locality — a real bar. |

Levers, in the order they usually pay: give the measured LCP image `fetchpriority="high"` and eager
loading; preload **only** resources critical to the measured LCP, with exactly matching URLs; enable
AVIF via `GFX/imageFileConversionFormats` and `avif_quality` when the processor reports AVIF write
support; keep minification in the Vite build — v14 removed the core equivalents.

## Loop 510 — SEO and structured data

| Bar | Target | Local caveat |
|---|---|---|
| Lighthouse SEO | 100 on every sampled page | Excludes off-site signals entirely. |
| Canonical | 100% self-referential, absolute, one per page | URLs will be `*.ddev.site` — assert *structure*, flag base-URL config for the handover. |
| hreflang | reciprocal for every pair, `x-default` present, 0 orphans | Same URL caveat. |
| Sitemap | 100% of entries 200, 0 redirects, 0 `noindex`, no excluded doktypes leaking | Content parity with live depends on the sync freshness recorded in P01. |
| Titles / descriptions | 100% unique; 30–60 and 70–160 characters | — |
| `<html lang>` | matches the page language everywhere | — |
| JSON-LD | valid on every page type; `Organization` + `WebSite` + `BreadcrumbList` sitewide | Validate **offline** against the schema.org vocabulary. Google's Rich Results Test is a remote service needing a public URL and explicit approval — say plainly that only syntax and vocabulary were checked. |
| OG / X cards | complete; image ≥1200×630 | Absolute image URLs are local. |

## Loop 520 — Accessibility beyond automated-green

Automated and manual results are reported **separately** and never merged into one conformance claim.

| Bar | Target | Local caveat |
|---|---|---|
| axe-core | 0 serious/critical across sample × 3 viewports × all languages; minor/moderate triaged with a written decision | Automation reaches roughly a third of WCAG criteria. This alone is never conformance. |
| Lighthouse Accessibility | 100 | A subset of axe — not independent evidence. |
| Keyboard | 5 primary journeys completable keyboard-only, visible focus throughout, 0 traps, working skip link | Needs a human. The skill produces the checklist and the evidence slots, not the verdict. |
| 1.4.10 Reflow | no horizontal scroll or content loss at 320 px and at 400% zoom on 1280 px | Screenshot evidence per page. |
| 2.4.11 Focus Not Obscured | 0 pages where a sticky header, footer or cookie bar covers the focused element | Structurally automatable; the judgement stays manual. |
| 2.5.7 Dragging / 2.5.8 Target Size | every drag has a single-pointer alternative; no target under 24×24 CSS px without an exception | Exceptions need judgement. |
| 3.2.6 / 3.3.7 / 3.3.8 | documented pass with evidence per criterion | Judgement-based. |
| Alt text quality | every content image reviewed; decorative images have `alt=""` | Automation detects *presence*, never *quality*. |
| Contrast | 0 failures at 4.5:1 body / 3:1 large text and UI | axe misses states not rendered at scan time; sweep hover, focus and disabled too. |

## Loop 530 — Security posture

| Bar | Target | Local caveat |
|---|---|---|
| HSTS | `max-age=31536000; includeSubDomains` configured | DDEV terminates its own TLS — present locally, meaningful only in production. Handover item. |
| `X-Content-Type-Options` | `nosniff` | — |
| `Referrer-Policy` | `strict-origin-when-cross-origin` or stricter | — |
| `Permissions-Policy` | camera, microphone, geolocation, payment, usb all `()` unless needed | — |
| CSP | enforce mode; `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'`; **0** `unsafe-inline`/`unsafe-eval` in `script-src`; 0 violations during a sample walk plus the module sweep | Third-party embeds present only on live can hide violations. Enumerate them in the handover. |
| Header layering | exactly one layer emits each header, 0 duplicates | Proxy and CDN layers exist only on live. |
| Composite grade | Mozilla-Observatory-A equivalent | Computed **offline** from the header set. Never submit the site to a remote scanner. |
| Cookies | 0 `Set-Cookie` on anonymous cacheable pages; all `Secure`, `HttpOnly` where applicable, `SameSite=Lax`+ | `Secure` behaves differently behind a production proxy. |
| Advisories | `composer audit` reports 0 | — |

## Loop 540 — Media and cache

| Bar | Target | Local caveat |
|---|---|---|
| LCP image | not lazy-loaded, `fetchpriority="high"`, preloaded only when it is the measured LCP with an exactly matching URL | The LCP element differs per viewport — check all three. |
| Dimensions | width/height or `aspect-ratio` on every content image; 0 image-caused shift | — |
| Modern formats | ≥80% of image bytes AVIF or WebP, where the processor supports it | Depends on the local ImageMagick/GraphicsMagick build. If production differs, this is a handover item, not a claim. |
| Oversizing | 0 images delivered above 1.5× rendered CSS size at DPR 1 | — |
| Responsive images | `srcset` + `sizes` on every responsive image | — |
| Page cache | 100% of cacheable sampled pages hit on the second request | Local cache warms differently. Measure the hit *rate*, not the timing. |
| Uncached fragments | 0 unjustified `USER_INT`/`COA_INT` on primary templates | — |
| Static assets | hashed Vite filenames, `Cache-Control: public, max-age=31536000, immutable` | Often set at the web-server layer — verify locally, note the production layer. |

## Loop 550 — Code quality

| Bar | Target | Local caveat |
|---|---|---|
| PHPStan | level 9 project, 10 for `packages/`; 0 new baseline entries; baseline strictly below the pre-update count; `phpVersion` set to the target | Fully local by nature — no caveat. |
| Deprecations | **0** entries after flush + warmup + a full sample walk + module sweep + scheduler run | Only paths exercised locally are covered. State which were walked. |
| PHP notices | 0 at `error_reporting=E_ALL` during the same sequence | Same coverage caveat. |
| Extension scanner | 0 strong matches | — |
| Test coverage | no decrease against the pre-update measurement; new code covered | — |

## Loop 560 — Information architecture and content

**Recommendation-only by default** (approval matrix #25). Bars are stated as finding *counts*, not
changes: orphan pages · click depth >3 to any primary conversion · duplicate or near-duplicate
titles · thin pages under 300 words on indexable doktypes · navigation labels that do not match page
titles.

Broken internal links are already a Contract A gate via linkvalidator, and 0 is required there.
