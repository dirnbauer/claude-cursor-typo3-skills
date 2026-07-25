/**
 * Stabilisation — the code that makes two shots of an unchanged page identical.
 *
 * The init script is exported as a pure string so it is testable and so its hash can go
 * into the manifest: if the stabilisation profile changes between the before and after run,
 * the comparison is not like-for-like and the self-test lock must be invalidated.
 *
 * Two choices worth knowing:
 *  - Math.random is seeded PER CAPTURE. Rotating carousels, shuffled teasers and generated
 *    element ids cannot be stabilised with CSS, and they are the most common remaining
 *    source of flake once animations are off.
 *  - The clock is pinned but keeps MOVING. A hard freeze divides by zero in real code and
 *    breaks anything waiting on elapsed time; a fixed origin plus a monotonic counter is
 *    stable and still sane.
 */

import { sha256 } from '../run/paths.mjs';

export const STABILIZE_CSS = `
*, *::before, *::after {
  animation: none !important;
  animation-duration: 0s !important;
  transition: none !important;
  transition-duration: 0s !important;
  caret-color: transparent !important;
}
html { scroll-behavior: auto !important; scrollbar-gutter: stable !important; }
`.trim();

/** Runs before any page script. Keep it self-contained: it is serialised into the page. */
export function initScript({ seed = 20260725, epoch = 1774425600000 } = {}) {
  return `(() => {
  let s = ${seed} >>> 0;
  Math.random = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };

  let tick = 0;
  const OriginalDate = Date;
  const base = ${epoch};
  const nowFn = () => base + (tick += 1);
  class FrozenDate extends OriginalDate {
    constructor(...args) { super(...(args.length ? args : [nowFn()])); }
    static now() { return nowFn(); }
  }
  FrozenDate.parse = OriginalDate.parse;
  FrozenDate.UTC = OriginalDate.UTC;
  globalThis.Date = FrozenDate;
  if (globalThis.performance) { try { globalThis.performance.now = () => (tick += 1); } catch {} }

  const raf = globalThis.requestAnimationFrame;
  globalThis.__t3uFrames = new Set();
  if (raf) {
    globalThis.requestAnimationFrame = (cb) => { const id = raf(cb); globalThis.__t3uFrames.add(id); return id; };
  }
  globalThis.__t3uFreeze = () => {
    for (const id of globalThis.__t3uFrames) { try { cancelAnimationFrame(id); } catch {} }
    globalThis.__t3uFrames.clear();
    for (const v of document.querySelectorAll('video')) { try { v.pause(); v.currentTime = 0; } catch {} }
  };
})();`;
}

/** Runs in the page immediately before the screenshot. Returns a small settle report. */
export function settleScript() {
  return `(async () => {
  const report = { fonts: false, lazy: 0, videos: 0, height: 0 };

  try { await document.fonts.ready; } catch {}
  try {
    const faces = [...document.fonts].map((f) => f.load().catch(() => {}));
    await Promise.all(faces);
    report.fonts = true;
  } catch {}

  // Force lazy content in by stepping to the bottom, then return to the top.
  const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 30));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 60));

  const imgs = [...document.querySelectorAll('img')];
  await Promise.all(imgs.map((img) => (img.complete ? null : new Promise((r) => {
    img.addEventListener('load', r, { once: true });
    img.addEventListener('error', r, { once: true });
    setTimeout(r, 3000);
  }))));
  report.lazy = imgs.filter((i) => i.complete).length;

  for (const v of document.querySelectorAll('video')) { try { v.pause(); v.currentTime = 0; report.videos += 1; } catch {} }
  if (globalThis.__t3uFreeze) globalThis.__t3uFreeze();

  report.height = document.documentElement.scrollHeight;
  return report;
})();`;
}

export function profileHash(profile) {
  return `sha256:${sha256(JSON.stringify({
    css: STABILIZE_CSS,
    init: initScript(profile),
    settle: settleScript(),
    profile: sortKeys(profile),
  }))}`;
}

/**
 * Consent must be SEEDED, never clicked. Clicking a banner is timing-dependent and is
 * itself a flake source — the one we would be trying to remove.
 */
export function consentStateFor(config = {}) {
  const cookies = Object.entries(config.cookies ?? {}).map(([name, value]) => ({ name, value: String(value) }));
  const origins = config.localStorage
    ? [{ origin: config.origin, localStorage: Object.entries(config.localStorage).map(([name, value]) => ({ name, value: String(value) })) }]
    : [];
  return { cookies, origins };
}

function sortKeys(o) {
  if (o === null || typeof o !== 'object') return o;
  if (Array.isArray(o)) return o.map(sortKeys);
  return Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortKeys(o[k])]));
}
