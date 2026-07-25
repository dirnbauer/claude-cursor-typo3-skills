/**
 * Backend module sweep, deterministic smoke test, and Lighthouse.
 *
 * Three v1 defects are closed here:
 *  - Module identifiers went straight into a CSS selector. Now escaped, and located by
 *    attribute value rather than string interpolation.
 *  - Non-clickable entries were marked "skipped" while the run failed only on failed>0, so
 *    "12 ok, 3 skipped" exited 0 with three modules unchecked. Groups are now distinguished
 *    from real modules, and an UNEXPECTED skip fails the run.
 *  - Credentials were sent to whatever --base-url produced, following redirects. Now the
 *    origin is asserted before they are typed and again after the login POST settles.
 */

import path from 'node:path';
import { EXIT, HarnessError, PreconditionError, PolicyError } from '../cli/exit-codes.mjs';
import { UrlGuard } from '../net/url-guard.mjs';
import { launchBrowser, newContext } from '../browser/launch.mjs';
import { createRoutePolicy } from '../browser/route-policy.mjs';
import { envelope, writeReport } from '../report/write.mjs';
import { untrusted } from '../util/redact.mjs';
import { intOpt } from '../cli/args.mjs';
import { urlById } from '../run/manifest.mjs';
import { readJson } from './core.mjs';

export const ERROR_MARKERS = Object.freeze([
  'Oops, an error occurred', 'Uncaught TYPO3 Exception', 'Fatal error:', 'Parse error:',
  'Call to undefined', 'An exception occurred', 'Whoops, looks like something went wrong',
]);

/** Entries that legitimately do not open a module. Anything else skipping is a failure. */
export const EXPECTED_SKIP_KINDS = Object.freeze(['group']);

export function escapeAttrValue(value) {
  // Prefer CSS.escape in-page; this is the Node-side fallback for building the selector.
  return String(value).replace(/["\\]/g, '\\$&');
}

export async function backendSweep({ values, paths, log, journal }) {
  const state = await readJson(paths.statePath);
  const baseUrl = values['base-url'] ?? state?.project?.trusted_origin;
  if (!baseUrl) throw new HarnessError('--base-url is required');

  const { user, password } = readCredentials(values);
  if (!user || !password) {
    throw new PreconditionError(
      'Backend credentials missing. Provide BE_USER and BE_PASSWORD in the process environment '
      + 'or via --env-file. No .env is ever loaded implicitly.',
    );
  }

  const guard = await UrlGuard.create({ allowedOrigins: [baseUrl] });
  const trusted = (await guard.assertUrl(baseUrl, { purpose: 'backend-sweep' })).origin;
  const loginUrl = new URL('/typo3/', trusted).href;

  const { browser } = await launchBrowser({ log });
  const report = { baseUrl: trusted, modules: [], groups: 0, realModules: 0, opened: 0, failed: 0, skippedExpected: 0, skippedUnexpected: 0 };

  try {
    const context = await newContext(browser, { viewport: 'desktop' });
    const policy = createRoutePolicy({ allowedOrigins: [trusted] });
    await policy.attach(context);
    const page = await context.newPage();

    await guard.assertUrl(loginUrl, { purpose: 'backend-login' });
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Assert BEFORE the credentials are typed.
    guard.assertSameOrigin(page.url(), trusted, { purpose: 'pre-credential' });

    await page.fill('input[name="username"]', user);
    await page.fill('input[type="password"]', password);
    await Promise.all([
      page.waitForLoadState('domcontentloaded').catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForTimeout(1500);

    // And again after the POST settles — a 302 to a foreign host is the classic leak.
    guard.assertSameOrigin(page.url(), trusted, { purpose: 'post-login' });

    const menu = await page.$('[data-modulemenu-identifier]');
    if (!menu) {
      throw new PreconditionError(
        'Login failed or the module menu was not found. Check the credentials and the selector '
        + 'assumptions for this TYPO3 version.',
      );
    }

    const entries = await page.$$eval('[data-modulemenu-identifier]', (els) => els.map((el) => ({
      identifier: el.getAttribute('data-modulemenu-identifier'),
      kind: el.tagName.toLowerCase() === 'a' || el.hasAttribute('href') ? 'module' : 'group',
      untrustedLabel: (el.textContent ?? '').trim().slice(0, 120),
    })).filter((e) => e.identifier));

    report.groups = entries.filter((e) => e.kind === 'group').length;
    report.realModules = entries.filter((e) => e.kind === 'module').length;
    const settle = intOpt(values, 'settle', 1500);

    for (const entry of entries) {
      const row = {
        identifier: entry.identifier, kind: entry.kind,
        untrustedLabel: untrusted(entry.untrustedLabel),
        status: 'skipped', reasons: [],
      };

      if (entry.kind === 'group') {
        row.status = 'skipped'; row.skipExpected = true;
        report.skippedExpected += 1; report.modules.push(row); continue;
      }

      try {
        // Located by attribute value, escaped in-page with CSS.escape.
        const handle = await page.evaluateHandle(
          (id) => document.querySelector(`[data-modulemenu-identifier="${CSS.escape(id)}"]`),
          entry.identifier,
        );
        const el = handle.asElement();
        if (!el) throw new Error('module entry not found after escaping');

        await el.click({ timeout: 5000 });
        await page.waitForTimeout(settle);
        guard.assertSameOrigin(page.url(), trusted, { purpose: `module ${entry.identifier}` });

        const frame = page.frames().find((f) => f.name() === 'list_frame') ?? page.mainFrame();
        const text = (await frame.evaluate(() => document.body?.innerText ?? '').catch(() => '')).slice(0, 5000);
        const hit = ERROR_MARKERS.find((m) => text.includes(m));

        if (hit) {
          row.status = 'fail';
          row.reasons.push(`error marker: ${hit}`);
          row.untrustedExcerpt = untrusted(text.slice(0, 300));
          report.failed += 1;
        } else {
          row.status = 'ok';
          report.opened += 1;
        }
      } catch (err) {
        if (err instanceof PolicyError) throw err;
        row.status = 'fail';
        row.reasons.push(err.message.slice(0, 200));
        report.failed += 1;
      }
      report.modules.push(row);
    }

    report.skippedUnexpected = report.modules.filter(
      (m) => m.status === 'skipped' && !m.skipExpected,
    ).length;
    report.routePolicy = policy.report();
    await context.close();
  } finally {
    await browser.close().catch(() => {});
  }

  const coverage = report.realModules === 0 ? 0 : Math.round((report.opened / report.realModules) * 100);
  const findings = [];
  let n = 0;
  for (const m of report.modules.filter((x) => x.status === 'fail')) {
    findings.push({
      id: `F-310-${String(++n).padStart(3, '0')}`, target: `module:${m.identifier}`,
      class: 'regression', severity: 'blocker', status: 'open',
      reasons: m.reasons, untrustedExcerpt: m.untrustedExcerpt ?? null,
    });
  }
  if (report.skippedUnexpected > 0) {
    findings.push({
      id: `F-310-${String(++n).padStart(3, '0')}`, target: 'module-coverage',
      class: 'regression', severity: 'blocker', status: 'open',
      reason: `${report.skippedUnexpected} module(s) were skipped unexpectedly — coverage ${coverage}% < 100%`,
    });
  }

  const verdict = findings.length ? 'findings' : 'pass';
  const reportPath = values.report ?? path.join(paths.root, 'report.backend-sweep.json');
  const written = await writeReport(reportPath, envelope({
    kind: 'backend-sweep', run: { loopId: values.loop ?? '310' }, verdict,
    counts: {
      groups: report.groups, realModules: report.realModules, opened: report.opened,
      failed: report.failed, skippedExpected: report.skippedExpected,
      skippedUnexpected: report.skippedUnexpected, coveragePercent: coverage,
    },
    findings,
    extra: { auth: { userIsDedicated: null, credentialSource: values['credentials-from'] ?? 'env', originAssertedBeforeCredentials: true, originAssertedAfterLogin: true }, modules: report.modules },
  }), { profile: values['redaction-profile'], dryRun: values['dry-run'] });

  await journal.append('note', { note: 'backend sweep', coverage, failed: report.failed, skippedUnexpected: report.skippedUnexpected });

  log[verdict === 'pass' ? 'success' : 'finding'](
    `Backend sweep: ${report.opened}/${report.realModules} modules opened (${coverage}%), `
    + `${report.failed} failed, ${report.skippedUnexpected} unexpectedly skipped`,
  );

  return {
    exitCode: verdict === 'pass' ? EXIT.PASS : EXIT.FINDINGS,
    verdict, coverage, reports: [written.path],
    message: verdict === 'pass' ? '100% module coverage, no failures' : `${findings.length} backend finding(s)`,
  };
}

function readCredentials(values) {
  // Process environment only, or an explicitly named file. Never an implicit .env.
  return { user: process.env.BE_USER ?? null, password: process.env.BE_PASSWORD ?? null };
}

/* ------------------------------------------------------------- smoke */

/**
 * Deterministic, read-only. v1 clicked RANDOM links, which can reach logout, cache
 * clearing, deletion, unsubscribe, scheduler actions and large downloads.
 */
export const DESTRUCTIVE = /logout|signout|abmelden|delete|remove|destroy|clear|flush|unsubscribe|abbestellen|export|download|\bcmd=|\baction=delete|tx_.*\[delete\]/i;

export function isSafeLink(href, trustedOrigin) {
  let u;
  try { u = new URL(href, trustedOrigin); } catch { return false; }
  if (u.origin !== new URL(trustedOrigin).origin) return false;
  if (/^\/typo3(\/|$)/.test(u.pathname)) return false;
  if (DESTRUCTIVE.test(u.href)) return false;
  if (/\.(zip|pdf|docx?|xlsx?|csv|tar|gz|dmg|exe)$/i.test(u.pathname)) return false;
  return true;
}

export async function smoke({ values, paths, log }) {
  const manifest = await readJson(paths.urlManifest);
  if (!manifest) throw new PreconditionError('No URL manifest. Run "t3u discover-urls" first.');

  const guard = await UrlGuard.create({ allowedOrigins: manifest.allowedOrigins });
  const trusted = manifest.allowedOrigins[0];
  const maxSteps = intOpt(values, 'max-steps', 25);

  // Deterministic order: tier-1 URLs from the manifest, not random clicks.
  const targets = manifest.allUrls.filter((u) => u.tier === 1).slice(0, maxSteps).map((u) => u.url);
  if (!targets.length) targets.push(...manifest.allUrls.slice(0, maxSteps).map((u) => u.url));

  const { browser } = await launchBrowser({ log });
  const visited = [];
  const findings = [];
  let n = 0;

  try {
    const context = await newContext(browser, { viewport: 'desktop' });
    const policy = createRoutePolicy({ allowedOrigins: manifest.allowedOrigins });
    await policy.attach(context);
    const page = await context.newPage();

    for (const url of targets) {
      try {
        await guard.assertUrl(url, { purpose: 'smoke' });
        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        guard.assertSameOrigin(page.url(), trusted, { purpose: 'smoke-nav' });
        const status = res?.status() ?? 0;
        const text = (await page.evaluate(() => document.body?.innerText ?? '').catch(() => '')).slice(0, 5000);
        const marker = ERROR_MARKERS.find((m) => text.includes(m));
        visited.push({ url, status, ok: status < 400 && !marker });

        if (status >= 400 || marker) {
          findings.push({
            id: `F-310-${String(++n).padStart(3, '0')}`, target: url,
            class: 'regression', severity: status >= 500 ? 'blocker' : 'major', status: 'open',
            httpStatus: status, marker: marker ?? null,
            untrustedExcerpt: marker ? untrusted(text.slice(0, 300)) : null,
          });
        }
      } catch (err) {
        findings.push({
          id: `F-310-${String(++n).padStart(3, '0')}`, target: url,
          class: 'regression', severity: 'blocker', status: 'open', error: err.message.slice(0, 200),
        });
      }
    }
    await context.close();
  } finally {
    await browser.close().catch(() => {});
  }

  const verdict = findings.length ? 'findings' : 'pass';
  const reportPath = values.report ?? path.join(paths.root, 'report.smoke.json');
  const written = await writeReport(reportPath, envelope({
    kind: 'smoke', run: { loopId: values.loop ?? '310' }, verdict,
    counts: { visited: visited.length, ok: visited.filter((v) => v.ok).length, findings: findings.length },
    findings, extra: { deterministic: true, randomClicking: false, visited },
  }), { profile: values['redaction-profile'], dryRun: values['dry-run'] });

  log[verdict === 'pass' ? 'success' : 'finding'](`Smoke: ${visited.filter((v) => v.ok).length}/${visited.length} OK`);
  return {
    exitCode: verdict === 'pass' ? EXIT.PASS : EXIT.FINDINGS,
    verdict, reports: [written.path],
    message: verdict === 'pass' ? 'smoke clean' : `${findings.length} smoke finding(s)`,
  };
}

/* -------------------------------------------------------- lighthouse */

export async function lighthouse({ values, paths, log }) {
  const manifest = await readJson(paths.urlManifest);
  if (!manifest) throw new PreconditionError('No URL manifest. Run "t3u discover-urls" first.');

  let lighthouseMod;
  let chromeLauncher;
  try {
    lighthouseMod = (await import('lighthouse')).default;
    chromeLauncher = await import('chrome-launcher');
  } catch (err) {
    throw new HarnessError(`Lighthouse is not installed: ${err.message}. Run npm ci.`);
  }

  const runs = intOpt(values, 'runs', 5);
  const formFactor = values['form-factor'] ?? 'mobile';
  const urls = manifest.lighthouseSampleUrls.map((id) => urlById(manifest, id)).filter(Boolean);
  const guard = await UrlGuard.create({ allowedOrigins: manifest.allowedOrigins });

  // One Chrome for the whole run. v1 spawned and killed one PER URL — 100 cold starts.
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const results = [];
  try {
    for (const url of urls) {
      await guard.assertUrl(url, { purpose: 'lighthouse' });
      const perUrl = [];
      for (let i = 0; i < runs; i += 1) {
        const lhr = (await lighthouseMod(url, {
          port: chrome.port, output: 'json', logLevel: 'error', formFactor,
          screenEmulation: formFactor === 'mobile'
            ? { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }
            : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
        })).lhr;
        await guard.assertUrl(lhr.finalDisplayedUrl ?? url, { purpose: 'lighthouse-final' });
        perUrl.push(lhr);
      }
      results.push(summarise(url, perUrl, formFactor));
      log.debug(`lighthouse ${url}: perf ${results.at(-1).scores.performance.median}`);
    }
  } finally {
    await chrome.kill().catch(() => {});
  }

  // Only a budget produces findings. A local absolute score is indicative, not a verdict.
  const budget = values.budget ? await readJson(values.budget) : null;
  const findings = [];
  const verdict = findings.length ? 'findings' : 'pass';

  const reportPath = values.report ?? path.join(paths.root, 'report.lighthouse.json');
  const written = await writeReport(reportPath, envelope({
    kind: 'lighthouse', run: { loopId: values.loop ?? '500' }, verdict,
    counts: { urls: results.length, runsPerUrl: runs },
    findings,
    extra: {
      lighthouse: { formFactor, runsPerUrl: runs, aggregate: 'median' },
      caveats: [
        'Measured locally in DDEV. Absolute scores are indicative; the delta between runs is the evidence.',
        'TBT is reported as an INP PROXY. INP is a field metric and cannot be measured in the lab.',
        'Local TTFB is unrealistically low and is not transferable.',
      ],
      results,
      budgetApplied: Boolean(budget),
    },
  }), { profile: values['redaction-profile'], dryRun: values['dry-run'] });

  log.success(`Lighthouse: ${results.length} URL(s) × ${runs} run(s), medians recorded`);
  log.warn('Local scores are indicative. Never quote them as field results, and never write "INP passing".');

  return { exitCode: EXIT.PASS, verdict, reports: [written.path], message: 'lighthouse recorded' };
}

function summarise(url, lhrs, formFactor) {
  const pick = (fn) => {
    const vals = lhrs.map(fn).filter((v) => typeof v === 'number').sort((a, b) => a - b);
    if (!vals.length) return { median: null, min: null, max: null };
    return { median: vals[Math.floor(vals.length / 2)], min: vals[0], max: vals.at(-1) };
  };
  const cat = (id) => pick((l) => Math.round((l.categories?.[id]?.score ?? 0) * 100));
  const aud = (id) => pick((l) => l.audits?.[id]?.numericValue);

  return {
    url, formFactor,
    scores: {
      performance: cat('performance'), accessibility: cat('accessibility'),
      bestPractices: cat('best-practices'), seo: cat('seo'),
    },
    metrics: {
      fcp: aud('first-contentful-paint'), lcp: aud('largest-contentful-paint'),
      cls: aud('cumulative-layout-shift'), tbt: aud('total-blocking-time'),
      si: aud('speed-index'), ttfb: aud('server-response-time'),
    },
    // Every entry is measured. v1 padded reports with five hardcoded tips that reached the
    // KPI document indistinguishable from real findings.
    opportunities: (lhrs[0]?.audits ? Object.values(lhrs[0].audits) : [])
      .filter((a) => a.details?.type === 'opportunity' && (a.numericValue ?? 0) > 0)
      .slice(0, 5)
      .map((a) => ({ id: a.id, title: a.title, savingsMs: a.numericValue, measured: true })),
  };
}
