/**
 * Stage 3: screenshot comparison.
 *
 * Two changes from v1 that matter more than the engine choice:
 *
 *  - The pairing walks the UNION of both directories. v1 iterated the before directory
 *    only, so a page that started rendering more content produced a file nobody looked at.
 *    onlyInAfter is now a first-class result, not an absence.
 *
 *  - There is no "minor" bucket. diffPercent stays as data; it never decides a verdict.
 *    On a long full-page screenshot a percentage measures area, not importance.
 *
 * odiff is preferred (native, fast, --fail-on-layout); pixelmatch is the fallback. Both are
 * imported lazily so the pure logic here is testable without an install.
 */

import { execFile } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { sha256 } from '../run/paths.mjs';

export const STATUS = Object.freeze({
  MATCH: 'match',
  DIFFERENT: 'different',
  MISSING_BEFORE: 'missing-before',
  MISSING_AFTER: 'missing-after',
  ERROR: 'error',
});

/**
 * Pair files from both directories by name. Pure and directory-listing driven so the
 * union behaviour is unit-testable without images.
 */
export function pairFiles(beforeFiles, afterFiles) {
  const isShot = (f) => f.endsWith('.png') && !f.startsWith('diff_');
  const b = new Set(beforeFiles.filter(isShot));
  const a = new Set(afterFiles.filter(isShot));
  const pairs = [];
  for (const f of [...b].sort()) {
    pairs.push({ file: f, status: a.has(f) ? 'pair' : STATUS.MISSING_AFTER });
  }
  for (const f of [...a].sort()) {
    if (!b.has(f)) pairs.push({ file: f, status: STATUS.MISSING_BEFORE });
  }
  return {
    pairs,
    onlyInBefore: [...b].filter((f) => !a.has(f)).sort(),
    onlyInAfter: [...a].filter((f) => !b.has(f)).sort(),
  };
}

/** Zero tolerance: anything above zero differing pixels is a difference. */
export function statusFor({ diffPixels, error }) {
  if (error) return STATUS.ERROR;
  return diffPixels === 0 ? STATUS.MATCH : STATUS.DIFFERENT;
}

/** odiff exit codes: 0 identical, 21 layout difference, 22 pixel difference. */
export function parseOdiff(stdout, code) {
  const text = String(stdout ?? '');
  const m = text.match(/Different pixels:\s*(\d+)\s*\(([\d.]+)%\)/i);
  if (m) return { diffPixels: Number(m[1]), diffPercent: Number(m[2]), layout: code === 21 };
  if (code === 0) return { diffPixels: 0, diffPercent: 0, layout: false };
  if (code === 21) return { diffPixels: null, diffPercent: null, layout: true };
  return null;
}

export function runOdiff(bin, beforePath, afterPath, diffPath, { threshold = 0, timeoutMs = 120000 } = {}) {
  return new Promise((resolve) => {
    execFile(
      bin,
      [beforePath, afterPath, diffPath,
       `--threshold=${threshold}`, '--antialiasing', '--fail-on-layout', '--parsable-stdout'],
      { timeout: timeoutMs },
      (err, stdout) => {
        const code = err?.code ?? 0;
        const parsed = parseOdiff(stdout, code);
        if (parsed) resolve({ ok: true, ...parsed });
        else resolve({ ok: false, error: err?.message ?? `odiff exited ${code}` });
      },
    );
  });
}

export async function comparePairPixelmatch(beforePath, afterPath, diffPath, { threshold = 0 } = {}) {
  const [{ default: pixelmatch }, { PNG }, fs] = await Promise.all([
    import('pixelmatch'), import('pngjs'), import('node:fs/promises'),
  ]);
  const [bBuf, aBuf] = await Promise.all([fs.readFile(beforePath), fs.readFile(afterPath)]);
  const b = PNG.sync.read(bBuf);
  const a = PNG.sync.read(aBuf);

  if (b.width !== a.width || b.height !== a.height) {
    // Different dimensions cannot be diffed pixelwise, and the height delta is the more
    // useful evidence anyway — one shifted element changes the whole page height.
    return {
      ok: true, diffPixels: null, diffPercent: null, layout: true,
      beforeSize: { w: b.width, h: b.height }, afterSize: { w: a.width, h: a.height },
      documentHeightDelta: a.height - b.height,
    };
  }

  const diff = new PNG({ width: b.width, height: b.height });
  const diffPixels = pixelmatch(b.data, a.data, diff.data, b.width, b.height, { threshold, includeAA: false });
  if (diffPath && diffPixels > 0) await fs.writeFile(diffPath, PNG.sync.write(diff));

  return {
    ok: true, diffPixels,
    diffPercent: Number(((diffPixels / (b.width * b.height)) * 100).toFixed(4)),
    layout: false,
    beforeSize: { w: b.width, h: b.height }, afterSize: { w: a.width, h: a.height },
    documentHeightDelta: 0,
  };
}

/** Content-addressed short circuit: identical bytes cannot differ, so skip the engine. */
export async function quickIdentical(beforePath, afterPath) {
  const fs = await import('node:fs/promises');
  const [b, a] = await Promise.all([fs.readFile(beforePath), fs.readFile(afterPath)]);
  if (b.length !== a.length) return false;
  return sha256(b) === sha256(a);
}

export async function listShots(dir) {
  try {
    const entries = await readdir(dir);
    const out = [];
    for (const e of entries) {
      if (!e.endsWith('.png') || e.startsWith('diff_')) continue;
      const s = await stat(path.join(dir, e));
      if (s.isFile()) out.push(e);
    }
    return out.sort();
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export function resolveOdiffBin(env = process.env) {
  return env.ODIFF_BIN || 'odiff';
}
