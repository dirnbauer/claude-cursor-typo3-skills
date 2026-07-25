# Stabilisation — making loop 000 reach zero

Loop 000 shoots the untouched site twice and requires zero differences. Nothing changed between the
passes, so **every** difference is a property of the measurement. This file is the catalogue of what
to fix, roughly in the order the causes appear in practice.

Passing loop 000 by shrinking the sample, raising a threshold, or excluding a page without an ADR is
forbidden — it makes every later comparison meaningless, because the harness can then no longer tell
a real regression from its own noise.

## The context

```js
const context = await browser.newContext({
  viewport, deviceScaleFactor: 1,
  locale: 'de-AT', timezoneId: 'Europe/Vienna',
  colorScheme: 'light', reducedMotion: 'reduce', forcedColors: 'none',
});
```

## The init script — run before any page code

```js
await context.addInitScript(({ seed, epoch }) => {
  // 1. Seed Math.random per capture.
  //    This is the single highest-leverage stabilisation: randomised carousels, shuffled
  //    teasers and generated element ids all become deterministic, and none of them can be
  //    fixed with CSS.
  let s = seed >>> 0;
  Math.random = () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  };

  // 2. Pin the clock, but keep it MOVING.
  //    A hard freeze divides by zero in real code and breaks animation libraries that wait
  //    for elapsed time. A fixed origin plus a monotonic counter is stable and still sane.
  let tick = 0;
  const OriginalDate = Date;
  Date.now = () => epoch + (tick += 1);
  globalThis.Date = class extends OriginalDate {
    constructor(...args) { super(...(args.length ? args : [epoch])); }
    static now() { return epoch + (tick += 1); }
  };

  // 3. Track rAF ids so pending frames can be cancelled before the shot.
  const raf = globalThis.requestAnimationFrame;
  globalThis.__t3uFrames = new Set();
  globalThis.requestAnimationFrame = (cb) => {
    const id = raf(cb); globalThis.__t3uFrames.add(id); return id;
  };
  globalThis.__t3uFreeze = () => {
    for (const id of globalThis.__t3uFrames) cancelAnimationFrame(id);
    globalThis.__t3uFrames.clear();
  };
}, { seed: config.pageRandomSeed, epoch: config.frozenClockEpoch });
```

## The style patch

```css
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}
html { scroll-behavior: auto !important; scrollbar-gutter: stable !important; }
```

`scrollbar-gutter: stable` matters more than it looks: a scrollbar appearing on one pass and not the
other shifts the entire layout horizontally and reads as a site-wide regression.

## Before every shot

| Step | Why |
|---|---|
| `await page.evaluate(() => document.fonts.ready)` **plus** an explicit `document.fonts.load()` per declared face | `fonts.ready` resolves for fonts already requested; a face used further down the page may still be pending |
| Pause and rewind every `<video>`, and prefer posters | A frame difference of one is still a difference |
| Force lazy-load completion: stepped scroll to the bottom, wait until every `img[loading=lazy]` reports `complete`, scroll back to 0 | Full-page screenshots do not trigger lazy loading reliably |
| Seed the consent state from configuration as cookies or localStorage | **Never dismiss the banner by clicking** — clicking is timing-dependent and is itself a source of flake |
| Warm image processing before the first capture | TYPO3 generates `_processed_` files on demand; the first request pays for it and may capture a placeholder |
| `__t3uFreeze()` | cancel pending animation frames |
| Wait for a network quiet period fed by the route handler | **Do not use `networkidle`** — it is unreliable and it hides which requests were in flight |

## Diagnosing by failure shape

| What differs | Almost always |
|---|---|
| Text that looks like a date, time, or "x minutes ago" | clock not pinned |
| Teaser or slide order | `Math.random` not seeded |
| Whole layout shifted horizontally | scrollbar gutter |
| First fold correct, lower page blank or shifted | lazy loading not completed |
| Letterforms subtly different | fonts not fully loaded, or a font missing in one environment |
| One image differs, others fine | `_processed_` generated during the capture |
| A banner present in one pass | consent state not seeded |
| Random small regions | animation or transition not suppressed |
| Everything differs slightly | device scale factor, colour scheme, or a browser version change → check the environment fingerprint first; this is `INVALID`, not a stabilisation problem |

## When a page genuinely cannot be stabilised

A live feed, a third-party embed that cannot be mocked, or genuinely random editorial content.

Record it in `config/run.yml` under `unstable_urls`, write an ADR explaining why, and accept that
the URL is **excluded from the invariance claim** and named in the closure certificate.

This is an escape hatch with a cost, and the cost must stay visible. It is not a way to silence an
inconvenient regression: the test is whether the instability reproduces on the *untouched* site,
which is exactly what loop 000 measures.
