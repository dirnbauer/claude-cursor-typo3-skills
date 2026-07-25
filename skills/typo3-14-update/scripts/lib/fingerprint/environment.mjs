/**
 * The environment fingerprint.
 *
 * Pixel equality is only meaningful if the renderer is identical. This records what must
 * match, hashes the parts that legitimately must not change, and records but does NOT hash
 * the parts that vary innocently (CPU count, memory, hostname, uptime) — hashing those
 * would make every run invalid and teach everyone to ignore the check.
 *
 * Drift produces INVALID, never FINDINGS. That distinction is the entire value: it stops a
 * Chromium patch from being mistaken for a site regression and costing someone a day.
 */

import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { sha256 } from '../run/paths.mjs';

const exec = promisify(execFile);

/** Keys that participate in the hash. Everything else is recorded only. */
export const HASH_RELEVANT = Object.freeze([
  'node.version', 'os.type', 'os.release', 'os.arch', 'os.containerImage',
  'playwright.version', 'browser.name', 'browser.version', 'browser.channel', 'browser.launchArgsHash',
  'fonts.listHash',
  'rendering.deviceScaleFactor', 'rendering.colorScheme', 'rendering.reducedMotion',
  'rendering.forcedColors', 'rendering.locale', 'rendering.timezone',
  'imageProcessing.processor', 'imageProcessing.version', 'imageProcessing.gfxHash',
  'php.version', 'php.extensionsHash',
  'typo3.version', 'ddev.version', 'ddev.dbEngine',
  'harness.version', 'harness.depsLockHash',
]);

export const RECORDED_ONLY = Object.freeze(['os.cpus', 'os.totalmem', 'os.hostname', 'os.uptime']);

export async function collectEnvironment({
  runner = safeRun,
  harnessVersion = '2.0.0',
  depsLockHash = null,
  rendering = {},
  launchArgs = [],
} = {}) {
  const [playwrightVersion, browser, fonts, php, typo3, ddev, imaging] = await Promise.all([
    detectPlaywright(),
    detectBrowser(runner),
    detectFonts(runner),
    detectPhp(runner),
    detectTypo3(runner),
    detectDdev(runner),
    detectImaging(runner),
  ]);

  const components = {
    node: { version: process.version, platform: process.platform, arch: process.arch },
    os: {
      type: os.type(), release: os.release(), arch: os.arch(),
      containerImage: process.env.DDEV_SITENAME ? 'ddev-web' : (process.env.container ?? null),
      cpus: os.cpus()?.length ?? null, totalmem: os.totalmem(),
      hostname: os.hostname(), uptime: Math.round(os.uptime()),
    },
    playwright: { version: playwrightVersion },
    browser: { ...browser, launchArgsHash: sha256(JSON.stringify([...launchArgs].sort())) },
    fonts,
    rendering: {
      deviceScaleFactor: rendering.deviceScaleFactor ?? 1,
      colorScheme: rendering.colorScheme ?? 'light',
      reducedMotion: rendering.reducedMotion ?? 'reduce',
      forcedColors: rendering.forcedColors ?? 'none',
      locale: rendering.locale ?? 'de-AT',
      timezone: rendering.timezone ?? 'Europe/Vienna',
    },
    imageProcessing: imaging,
    php,
    typo3,
    ddev,
    harness: { version: harnessVersion, depsLockHash },
  };

  return {
    kind: 'environment-fingerprint',
    fingerprintHash: hashComponents(components),
    hashRelevantKeys: [...HASH_RELEVANT],
    recordedOnly: [...RECORDED_ONLY],
    components,
    capturedAt: new Date().toISOString(),
  };
}

export function hashComponents(components) {
  const parts = HASH_RELEVANT.map((key) => `${key}=${String(get(components, key) ?? '')}`);
  return `sha256:${sha256(parts.join('\n'))}`;
}

/** @returns {{match:boolean, drifted:Array<{key:string,before:*,after:*}>}} */
export function compareEnvironment(sealed, current) {
  const drifted = [];
  for (const key of HASH_RELEVANT) {
    const b = get(sealed.components, key) ?? null;
    const a = get(current.components, key) ?? null;
    if (JSON.stringify(b) !== JSON.stringify(a)) drifted.push({ key, before: b, after: a });
  }
  return { match: drifted.length === 0, drifted };
}

function get(obj, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

async function safeRun(cmd, args) {
  try {
    const { stdout } = await exec(cmd, args, { timeout: 15000 });
    return String(stdout).trim();
  } catch {
    return null;
  }
}

async function detectPlaywright() {
  try {
    const mod = await import('playwright/package.json', { with: { type: 'json' } });
    return mod.default?.version ?? null;
  } catch {
    return null;
  }
}

async function detectBrowser(runner) {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ args: ['--headless=new'] });
    const version = browser.version();
    await browser.close();
    return { name: 'chromium', version, channel: process.env.PLAYWRIGHT_CHANNEL ?? null };
  } catch {
    const raw = await runner('google-chrome', ['--version']);
    return { name: 'chromium', version: raw, channel: process.env.PLAYWRIGHT_CHANNEL ?? null };
  }
}

async function detectFonts(runner) {
  const raw = await runner('fc-list', [':', 'family']);
  if (!raw) return { count: null, listHash: null, list: [] };
  const list = [...new Set(raw.split('\n').flatMap((l) => l.split(',')).map((s) => s.trim()).filter(Boolean))].sort();
  return { count: list.length, listHash: sha256(list.join('\n')), list };
}

async function detectPhp(runner) {
  const version = await runner('php', ['-r', 'echo PHP_VERSION;']);
  const exts = await runner('php', ['-r', 'echo implode(",", get_loaded_extensions());']);
  const list = exts ? exts.split(',').map((s) => s.trim()).sort() : [];
  return { version, extensions: list, extensionsHash: list.length ? sha256(list.join(',')) : null };
}

async function detectTypo3(runner) {
  const raw = await runner('composer', ['show', '--locked', 'typo3/cms-core', '--format=json']);
  if (!raw) return { version: null, context: process.env.TYPO3_CONTEXT ?? null };
  try {
    const parsed = JSON.parse(raw);
    return { version: parsed?.versions?.[0] ?? parsed?.version ?? null, context: process.env.TYPO3_CONTEXT ?? null };
  } catch {
    return { version: null, context: process.env.TYPO3_CONTEXT ?? null };
  }
}

async function detectDdev(runner) {
  const raw = await runner('ddev', ['describe', '-j']);
  if (!raw) return { version: null, projectType: null, dbEngine: null };
  try {
    const d = JSON.parse(raw)?.raw ?? {};
    return {
      version: d.router ?? null,
      projectType: d.type ?? null,
      dbEngine: d.dbinfo ? `${d.dbinfo.database_type}:${d.dbinfo.database_version}` : null,
    };
  } catch {
    return { version: null, projectType: null, dbEngine: null };
  }
}

/** GFX config decides how TYPO3 renders images; a change there moves pixels. */
async function detectImaging(runner) {
  const version = await runner('convert', ['-version']);
  const processor = version?.includes('GraphicsMagick') ? 'GraphicsMagick'
    : version?.includes('ImageMagick') ? 'ImageMagick' : null;
  const gfx = await runner('php', ['-r',
    'echo json_encode($GLOBALS["TYPO3_CONF_VARS"]["GFX"] ?? []);']);
  let gfxObj = {};
  try { gfxObj = gfx ? JSON.parse(gfx) : {}; } catch { gfxObj = {}; }
  return {
    processor,
    version: version ? version.split('\n')[0] : null,
    typo3Gfx: gfxObj,
    gfxHash: sha256(JSON.stringify(sortKeys(gfxObj))),
  };
}

function sortKeys(o) {
  if (o === null || typeof o !== 'object') return o;
  if (Array.isArray(o)) return o.map(sortKeys);
  return Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortKeys(o[k])]));
}
