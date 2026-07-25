/**
 * init, doctor, status, and the fingerprint actions.
 */

import { mkdir, writeFile, readFile, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, HarnessError, InvalidRunError, PreconditionError } from '../cli/exit-codes.mjs';
import { emptyState, StateStore } from '../run/state.mjs';
import { UrlGuard, assertPlausibleBaseUrl } from '../net/url-guard.mjs';
import { collectEnvironment, compareEnvironment } from '../fingerprint/environment.mjs';
import { collectContent, compareContent } from '../fingerprint/content.mjs';
import { listOpt } from '../cli/args.mjs';
import { renderStatus } from '../run/status.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES = path.resolve(HERE, '../../../templates/run-directory');

export async function init({ values, paths, log, journal }) {
  const baseUrl = values['base-url'];
  if (!baseUrl) throw new HarnessError('--base-url is required for init');

  const exists = await new StateStore(paths).exists();
  if (exists && !values.force) {
    throw new PreconditionError(
      `A run already exists at ${paths.root}. Use --force to reinitialise (this does not delete baselines).`,
    );
  }

  // The base URL is operator input and becomes the allowlist, so it must be checked on its
  // own terms first — otherwise a metadata endpoint would simply allow-list itself.
  await assertPlausibleBaseUrl(baseUrl);
  const guard = await UrlGuard.create({ allowedOrigins: [baseUrl] });
  const { url } = await guard.assertUrl(baseUrl, { purpose: 'init' });

  const projectName = values['project-name'] ?? url.hostname.split('.')[0];
  const runId = `${new Date().toISOString().slice(0, 10)}-${slug(projectName)}`;

  for (const dir of [paths.root, paths.configDir, paths.manifestsDir, paths.baselineDir,
                     paths.loopsDir, paths.approvalsDir, paths.decisionsDir, paths.reportDir]) {
    await mkdir(dir, { recursive: true });
  }

  await copyTemplate('config/run.yml', paths.runConfig);
  await copyTemplate('config/thresholds.yml', paths.thresholds);
  await copyTemplate('gitignore', path.join(paths.root, '.gitignore'));

  const state = emptyState({ runId, now: new Date().toISOString() });
  state.project = {
    name: projectName,
    trusted_origin: url.origin,
    ddev_project: values['ddev-project'] ?? '',
    languages: listOpt(values, 'languages', []),
    run_dir: values['run-dir'] ?? '.typo3-update',
  };
  await new StateStore(paths).write(state);
  await journal.append('transition', { from: null, to: 'P00', note: 'run initialised' });

  log.success(`Initialised ${paths.root} (run ${runId}, origin ${url.origin})`);
  log.info('Next: t3u env-fingerprint --write-baseline, then t3u selftest-determinism');

  return { exitCode: EXIT.PASS, verdict: 'pass', runId, trustedOrigin: url.origin, message: `run ${runId} initialised` };
}

export async function doctor({ values, paths, log }) {
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok, detail });

  const [major] = process.versions.node.split('.').map(Number);
  add('node >= 20.11', major >= 20, process.version);

  for (const dep of ['playwright', 'pixelmatch', 'pngjs']) {
    try { await import(dep); add(`dependency ${dep}`, true, 'resolved'); }
    catch { add(`dependency ${dep}`, false, 'missing — run npm ci'); }
  }

  try {
    const { chromium } = await import('playwright');
    const b = await chromium.launch({ args: ['--headless=new'] });
    add('chromium launch', true, b.version());
    await b.close();
  } catch (err) {
    add('chromium launch', false, err.message.slice(0, 120));
  }

  if (process.env.T3U_ALLOW_NO_SANDBOX === '1') {
    add('sandbox', false, 'T3U_ALLOW_NO_SANDBOX=1 — the browser is weakened and every report will say so');
  } else {
    add('sandbox', true, 'enabled');
  }

  const baseUrl = values['base-url'];
  if (baseUrl) {
    try {
      const guard = await UrlGuard.create({ allowedOrigins: [baseUrl] });
      const r = await guard.assertUrl(baseUrl, { purpose: 'doctor' });
      add('base URL guard', true, `${r.origin} -> ${r.addresses.join(', ')} (pinned: ${r.pinned})`);
    } catch (err) {
      add('base URL guard', false, err.message);
    }
  }

  for (const c of checks) (c.ok ? log.success : log.warn)(`${c.name}: ${c.detail}`);
  const failed = checks.filter((c) => !c.ok);
  return {
    exitCode: failed.length ? EXIT.FINDINGS : EXIT.PASS,
    verdict: failed.length ? 'findings' : 'pass',
    checks,
    message: failed.length ? `${failed.length} environment check(s) need attention` : 'environment ready',
  };
}

export async function status({ paths, log, values }) {
  const state = await new StateStore(paths).read();
  const md = renderStatus(state);
  await writeFile(paths.statusPath, md, 'utf8');
  if (!values.json) process.stdout.write(`${md}\n`);
  log.debug(`STATUS.md regenerated at ${paths.statusPath}`);
  return { exitCode: EXIT.PASS, verdict: 'pass', state, message: 'status written' };
}

export async function envFingerprint({ values, paths, log, journal }) {
  const store = new StateStore(paths);
  const current = await collectEnvironment({ launchArgs: (await import('../browser/launch.mjs')).browserArgs() });

  if (values['write-baseline']) {
    await mkdir(paths.manifestsDir, { recursive: true });
    await writeFile(paths.envFingerprint, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
    await store.update((s) => {
      s.fingerprints.environment = current.fingerprintHash;
      s.fingerprints.sealed_at = new Date().toISOString();
    });
    log.success(`Environment fingerprint sealed: ${current.fingerprintHash}`);
    return { exitCode: EXIT.PASS, verdict: 'pass', fingerprint: current.fingerprintHash, message: 'environment sealed' };
  }

  const sealed = await readJson(paths.envFingerprint);
  if (!sealed) {
    throw new PreconditionError('No sealed environment fingerprint. Run with --write-baseline first.');
  }
  const cmp = compareEnvironment(sealed, current);
  if (!cmp.match) {
    await journal.append('drift', { kind: 'environment', drifted: cmp.drifted.map((d) => d.key) });
    for (const d of cmp.drifted) log.error(`drift ${d.key}: ${JSON.stringify(d.before)} -> ${JSON.stringify(d.after)}`);
    throw new InvalidRunError(
      `Environment drifted in ${cmp.drifted.length} hashed component(s). The run cannot be judged.`,
      { drifted: cmp.drifted },
    );
  }
  log.success('Environment fingerprint matches the sealed value.');
  return { exitCode: EXIT.PASS, verdict: 'pass', message: 'environment matches' };
}

export async function contentFingerprint({ values, paths, log, journal }) {
  const store = new StateStore(paths);
  const current = await collectContent({
    ddevProject: values['ddev-project'] ?? null,
    fileadmin: values.fileadmin ?? 'fileadmin',
    allowMissing: values['allow-missing'] ?? false,
  });

  if (values['write-baseline']) {
    await mkdir(paths.manifestsDir, { recursive: true });
    await writeFile(paths.contentFingerprint, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
    await store.update((s) => { s.fingerprints.content = current.fingerprintHash; });
    if (current.degraded) log.warn('Content fingerprint is DEGRADED (database unavailable) — recorded in the report.');
    log.success(`Content fingerprint sealed: ${current.fingerprintHash}`);
    return { exitCode: EXIT.PASS, verdict: 'pass', fingerprint: current.fingerprintHash, degraded: current.degraded, message: 'content sealed' };
  }

  const sealed = await readJson(paths.contentFingerprint);
  if (!sealed) throw new PreconditionError('No sealed content fingerprint. Run with --write-baseline first.');

  const cmp = compareContent(sealed, current);
  if (!cmp.match) {
    await journal.append('drift', { kind: 'content', drifted: cmp.drifted.map((d) => d.key) });
    for (const d of cmp.drifted) log.error(`content drift ${d.key}`);
    throw new InvalidRunError(
      'Content changed during the run. Every comparison against this baseline is void until resolved — '
      + 'this is content-drift, not a regression.',
      { drifted: cmp.drifted },
    );
  }
  log.success('Content fingerprint matches the sealed value.');
  return { exitCode: EXIT.PASS, verdict: 'pass', message: 'content matches' };
}

/* --------------------------------------------------------------- helpers */

async function copyTemplate(rel, dest) {
  try { await cp(path.join(TEMPLATES, rel), dest, { force: false, errorOnExist: false }); }
  catch { /* templates are a convenience, not a precondition */ }
}

export async function readJson(p) {
  try { return JSON.parse(await readFile(p, 'utf8')); }
  catch (err) { if (err.code === 'ENOENT') return null; throw err; }
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
}
