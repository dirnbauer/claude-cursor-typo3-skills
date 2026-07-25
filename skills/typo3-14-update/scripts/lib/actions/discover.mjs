/**
 * Guarded URL discovery -> the URL manifest.
 *
 * Two v1 defects are structurally impossible here: the base URL's scheme is preserved (the
 * old code stripped it and hard-coded https://, so an http:// project discovered nothing),
 * and a sitemap that fails to fetch is RECORDED rather than downgraded to a warning that
 * let discovery "succeed" with only golden paths.
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { EXIT, HarnessError, PreconditionError } from '../cli/exit-codes.mjs';
import { UrlGuard, assertPlausibleBaseUrl } from '../net/url-guard.mjs';
import { walkSitemaps } from '../net/sitemap.mjs';
import { StateStore } from '../run/state.mjs';
import { buildManifest } from '../run/manifest.mjs';
import { profileHash } from '../browser/stabilize.mjs';
import { intOpt, listOpt } from '../cli/args.mjs';
import { readJson } from './core.mjs';

export async function discoverUrls({ values, paths, log, journal }) {
  const store = new StateStore(paths);
  const state = await store.read();

  const baseUrl = values['base-url'] ?? state.project?.trusted_origin;
  if (!baseUrl) throw new HarnessError('--base-url is required (or set project.trusted_origin via init)');

  const languages = listOpt(values, 'languages', state.project?.languages ?? []);
  const seed = values.seed ?? state.manifest?.seed ?? `${state.run_id}-visual`;
  const extraOrigins = values['allow-origin'] ?? [];

  await assertPlausibleBaseUrl(baseUrl);
  const guard = await UrlGuard.create({ allowedOrigins: [baseUrl, ...extraOrigins] });
  const base = (await guard.assertUrl(baseUrl, { purpose: 'discovery' })).url;

  // Scheme and port are taken from the validated base URL, never reconstructed.
  const entryPoints = [new URL('/sitemap.xml', base).href];
  for (const lang of languages) {
    entryPoints.push(new URL(`/${lang}/sitemap.xml`, base).href);
  }

  log.step(`Discovering from ${entryPoints.length} sitemap entry point(s) on ${base.origin}`);
  const { urls, documents, truncated } = await walkSitemaps(guard, entryPoints, {
    onDocument: (d) => log.debug(`${d.status} ${d.url} (${d.urlCount} urls)`),
  });

  const failed = documents.filter((d) => d.status === 'failed' || d.status === 'guard-blocked');
  for (const f of failed) log.warn(`sitemap ${f.status}: ${f.url} — ${f.error}`);

  const goldenPaths = await loadGolden(values['golden-file'], base, guard, log);
  const all = [...new Set([...urls, ...goldenPaths])];

  if (!all.length) {
    throw new PreconditionError(
      'Discovery found zero URLs. Check the sitemaps and the base URL scheme before continuing — '
      + 'a run with no URLs proves nothing.',
      { entryPoints, documents },
    );
  }

  const manifest = buildManifest({
    baseUrl: base.href,
    allowedOrigins: [base.origin, ...extraOrigins],
    languages, seed,
    sourceSitemaps: documents,
    urls: all,
    goldenPaths,
    visualBudget: intOpt(values, 'visual-budget', 1500),
    lighthouseSample: intOpt(values, 'lighthouse-sample', 25),
    stabilizationProfileHash: profileHash({}),
  });

  await mkdir(paths.manifestsDir, { recursive: true });
  await writeFile(paths.urlManifest, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await mkdir(paths.configDir, { recursive: true });
  await writeFile(paths.samplePath, `${manifest.visualRegressionUrls.join('\n')}\n`, 'utf8');

  await store.update((s) => {
    s.manifest = { path: 'manifests/url-manifest.json', hash: manifest.manifestHash, seed };
  });

  const cov = manifest.coverage;
  log.success(
    `${cov.discovered} URLs · HTTP+DOM 100% · pixels ${cov.visualCaptured} URLs `
    + `(${manifest.captures.length} captures) · Lighthouse ${cov.lighthouseSampled}`,
  );
  if (cov.degraded) {
    log.warn(`COVERAGE DEGRADED: ${cov.notCaptured.reduce((a, n) => a + n.count, 0)} URLs not pixel-compared.`);
    for (const n of cov.notCaptured) log.warn(`  ${n.reason}: ${n.count}`);
  }

  await journal.append('note', {
    note: 'discovery complete', urls: cov.discovered,
    visual: cov.visualCaptured, degraded: cov.degraded, truncated,
  });

  // Sitemap failures are findings: they are gaps in the evidence, not warnings.
  const exitCode = failed.length ? EXIT.FINDINGS : EXIT.PASS;
  return {
    exitCode,
    verdict: exitCode === EXIT.PASS ? 'pass' : 'findings',
    manifestHash: manifest.manifestHash,
    coverage: cov,
    failedSitemaps: failed.length,
    reports: [paths.urlManifest],
    message: failed.length
      ? `${failed.length} sitemap document(s) failed — discovery is incomplete`
      : `${cov.discovered} URLs discovered`,
  };
}

async function loadGolden(file, base, guard, log) {
  if (!file) return [new URL('/', base).href];
  let raw;
  try { raw = await readFile(file, 'utf8'); }
  catch (err) { throw new HarnessError(`Cannot read --golden-file ${file}: ${err.message}`); }

  const out = [];
  for (const line of raw.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))) {
    // Relative by default. An absolute golden path must pass the same guard as anything else.
    const candidate = line.startsWith('http') ? line : new URL(line, base).href;
    try {
      out.push((await guard.assertUrl(candidate, { purpose: 'golden-path' })).url.href);
    } catch (err) {
      log.warn(`golden path rejected: ${line} — ${err.message}`);
    }
  }
  return out.length ? out : [new URL('/', base).href];
}

export { readJson };
