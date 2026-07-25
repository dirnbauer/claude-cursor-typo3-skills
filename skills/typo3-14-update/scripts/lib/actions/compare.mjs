/**
 * The three comparison actions, plus the determinism self-test and baseline sealing.
 *
 * All of them refuse to run without a valid self-test lock (enforced in the command
 * wrapper), because a harness that has not proven zero against itself cannot distinguish a
 * regression from its own noise.
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { EXIT, PreconditionError, InvalidRunError } from '../cli/exit-codes.mjs';
import { compareRecords } from '../compare/http-meta.mjs';
import { compareDom } from '../compare/dom-normalize.mjs';
import {
  pairFiles, listShots, statusFor, quickIdentical,
  comparePairPixelmatch, runOdiff, resolveOdiffBin, STATUS,
} from '../compare/image.mjs';
import { classify, severityFor, countByClass, loopVerdict, Unclassifiable } from '../compare/classify.mjs';
import { envelope, writeReport } from '../report/write.mjs';
import { sealBaseline, verifyBaseline, renderSeal } from '../run/lockfile.mjs';
import { StateStore } from '../run/state.mjs';
import { intOpt } from '../cli/args.mjs';
import { sha256 } from '../run/paths.mjs';
import { readJson } from './core.mjs';

const nextId = (loopId, n) => `F-${String(loopId ?? '000').padStart(3, '0')}-${String(n).padStart(3, '0')}`;

/* ------------------------------------------------------------- stage 1 */

export async function compareHttp({ values, paths, log }) {
  const before = values.before ?? path.join(paths.root, 'captures', 'before', 'http');
  const after = values.after ?? path.join(paths.root, 'captures', 'after', 'http');
  const reportPath = values.report ?? path.join(paths.root, 'report.http.json');

  const { pairsChecked, findings, missing } = await compareRecordDirs(before, after, values.loop, log);

  const counts = { urls: pairsChecked, identical: pairsChecked - findings.length, different: findings.length, missing: missing.length };
  const verdict = findings.length || missing.length ? 'findings' : 'pass';

  const report = envelope({
    kind: 'http', run: { loopId: values.loop }, verdict, counts, findings,
    extra: { comparedFields: 'see lib/compare/http-meta.mjs COMPARED_FIELDS', missing },
  });
  const written = await writeReport(reportPath, report, { profile: values['redaction-profile'], dryRun: values['dry-run'] });

  log[verdict === 'pass' ? 'success' : 'finding'](
    `HTTP/metadata: ${counts.identical}/${counts.urls} identical, ${counts.different} different, ${counts.missing} missing`,
  );
  return {
    exitCode: verdict === 'pass' ? EXIT.PASS : EXIT.FINDINGS,
    verdict, counts, reports: [written.path],
    message: verdict === 'pass' ? 'HTTP and metadata identical' : `${counts.different + counts.missing} HTTP finding(s)`,
  };
}

async function compareRecordDirs(beforeDir, afterDir, loopId, log) {
  const [b, a] = await Promise.all([safeList(beforeDir, '.json'), safeList(afterDir, '.json')]);
  if (!b.length && !a.length) {
    throw new PreconditionError(`No HTTP records in ${beforeDir} or ${afterDir}. Capture first.`);
  }
  const bs = new Set(b);
  const as = new Set(a);
  const findings = [];
  const missing = [];
  let n = 0;
  let pairsChecked = 0;

  for (const file of [...bs].sort()) {
    if (!as.has(file)) { missing.push({ file, side: 'after' }); continue; }
    pairsChecked += 1;
    const before = JSON.parse(await readFile(path.join(beforeDir, file), 'utf8'));
    const after = JSON.parse(await readFile(path.join(afterDir, file), 'utf8'));
    const cmp = compareRecords(before, after);
    if (cmp.identical) continue;

    n += 1;
    findings.push({
      id: nextId(loopId, n),
      target: before.url ?? file,
      class: 'regression',
      severity: cmp.differences.some((d) => d.field === 'status') ? 'blocker' : 'major',
      status: 'open',
      stage: 'http',
      differences: cmp.differences.slice(0, 12),
    });
  }
  for (const file of [...as].sort()) if (!bs.has(file)) missing.push({ file, side: 'before' });
  if (missing.length) log.warn(`${missing.length} URL(s) present on only one side`);

  return { pairsChecked, findings, missing };
}

/* ------------------------------------------------------------- stage 2 */

export async function compareDomAction({ values, paths, log }) {
  const before = values.before ?? path.join(paths.root, 'captures', 'before', 'dom');
  const after = values.after ?? path.join(paths.root, 'captures', 'after', 'dom');
  const reportPath = values.report ?? path.join(paths.root, 'report.dom.json');

  const [b, a] = await Promise.all([safeList(before, '.html'), safeList(after, '.html')]);
  if (!b.length && !a.length) throw new PreconditionError(`No DOM snapshots in ${before} or ${after}.`);

  const bs = new Set(b);
  const as = new Set(a);
  const findings = [];
  const overreach = new Set();
  let n = 0;
  let checked = 0;

  for (const file of [...bs].sort()) {
    if (!as.has(file)) continue;
    checked += 1;
    const [bh, ah] = await Promise.all([
      readFile(path.join(before, file), 'utf8'),
      readFile(path.join(after, file), 'utf8'),
    ]);
    const cmp = compareDom(bh, ah);
    for (const o of cmp.overreach ?? []) overreach.add(o);
    if (cmp.identical) continue;

    n += 1;
    findings.push({
      id: nextId(values.loop, n),
      target: file,
      class: 'regression',
      severity: 'major',
      status: 'open',
      stage: 'dom',
      segments: cmp.segments,
    });
  }

  // An over-broad normaliser silently hides the regression it should expose. Report it.
  if (overreach.size) {
    findings.push({
      id: nextId(values.loop, ++n),
      target: 'dom-normalisation',
      class: 'harness-noise',
      severity: 'major',
      status: 'open',
      stage: 'dom',
      normalizationOverreach: [...overreach],
    });
    log.warn(`normalisation overreach: ${[...overreach].join(', ')} — a rule may be masking real differences`);
  }

  const counts = { urls: checked, identical: checked - findings.length, different: findings.length };
  const verdict = findings.length ? 'findings' : 'pass';
  const report = envelope({ kind: 'dom', run: { loopId: values.loop }, verdict, counts, findings });
  const written = await writeReport(reportPath, report, { profile: values['redaction-profile'], dryRun: values['dry-run'] });

  log[verdict === 'pass' ? 'success' : 'finding'](`DOM: ${counts.identical}/${counts.urls} identical`);
  return {
    exitCode: verdict === 'pass' ? EXIT.PASS : EXIT.FINDINGS,
    verdict, counts, reports: [written.path],
    message: verdict === 'pass' ? 'normalised DOM identical' : `${findings.length} DOM finding(s)`,
  };
}

/* ------------------------------------------------------------- stage 3 */

export async function compareVisual({ values, paths, log }) {
  const beforeDir = values['before-dir'] ?? path.join(paths.root, 'captures', 'before', 'shots');
  const afterDir = values['after-dir'] ?? path.join(paths.root, 'captures', 'after', 'shots');
  const diffDir = values['diff-dir'] ?? path.join(paths.root, 'captures', 'diff');
  const reportPath = values.report ?? path.join(paths.root, 'report.visual.json');

  const [bFiles, aFiles] = await Promise.all([listShots(beforeDir), listShots(afterDir)]);
  if (!bFiles.length && !aFiles.length) {
    throw new PreconditionError(`No screenshots in ${beforeDir} or ${afterDir}.`);
  }
  await mkdir(diffDir, { recursive: true });

  const { pairs, onlyInBefore, onlyInAfter } = pairFiles(bFiles, aFiles);
  const findings = [];
  const results = [];
  let n = 0;
  let match = 0;

  for (const p of pairs) {
    if (p.status !== 'pair') {
      n += 1;
      findings.push({
        id: nextId(values.loop, n), target: p.file,
        class: 'regression',
        severity: 'blocker',
        status: 'open', stage: 'visual', reason: p.status,
      });
      continue;
    }

    const bPath = path.join(beforeDir, p.file);
    const aPath = path.join(afterDir, p.file);

    if (await quickIdentical(bPath, aPath)) { match += 1; results.push({ file: p.file, status: STATUS.MATCH, diffPixels: 0 }); continue; }

    const cmp = await compareOne(bPath, aPath, path.join(diffDir, `diff_${p.file}`), log);
    const status = statusFor({ diffPixels: cmp.diffPixels ?? 1, error: !cmp.ok });
    results.push({ file: p.file, status, ...cmp });

    if (status === STATUS.MATCH) { match += 1; continue; }

    n += 1;
    findings.push({
      id: nextId(values.loop, n),
      target: p.file,
      class: cmp.ok ? 'regression' : 'harness-noise',
      severity: severityFor({ broken: !cmp.ok, primaryTemplate: true, visuallyApparent: true }),
      status: 'open',
      stage: 'visual',
      diff_pixels: cmp.diffPixels ?? null,
      diff_percent: cmp.diffPercent ?? null,
      documentHeightDelta: cmp.documentHeightDelta ?? null,
      artifact: path.join(diffDir, `diff_${p.file}`),
    });
  }

  const counts = {
    captures: pairs.length,
    match,
    different: findings.filter((f) => f.class === 'regression' && f.stage === 'visual').length,
    error: findings.filter((f) => f.class === 'harness-noise').length,
    onlyInBefore: onlyInBefore.length,
    onlyInAfter: onlyInAfter.length,
  };
  const verdict = findings.length ? 'findings' : 'pass';

  const report = envelope({
    kind: 'visual', run: { loopId: values.loop }, verdict, counts, findings,
    extra: {
      engine: { name: 'odiff|pixelmatch', threshold: 0 },
      policy: { zeroTolerance: true, minorBucket: false },
      unmatched: { onlyInBefore, onlyInAfter },
      results: results.slice(0, 500),
    },
  });
  const written = await writeReport(reportPath, report, { profile: values['redaction-profile'], dryRun: values['dry-run'] });

  if (onlyInAfter.length) {
    log.finding(`${onlyInAfter.length} capture(s) exist only AFTER — new content is a difference too`);
  }
  log[verdict === 'pass' ? 'success' : 'finding'](
    `Visual: ${match}/${pairs.length} identical, ${counts.different} different, ${counts.error} error(s)`,
  );

  return {
    exitCode: verdict === 'pass' ? EXIT.PASS : EXIT.FINDINGS,
    verdict, counts, reports: [written.path],
    message: verdict === 'pass' ? 'pixel-identical' : `${findings.length} visual finding(s)`,
  };
}

async function compareOne(bPath, aPath, diffPath, log) {
  const bin = resolveOdiffBin();
  const odiff = await runOdiff(bin, bPath, aPath, diffPath, { threshold: 0 });
  if (odiff.ok) return odiff;
  log.debug(`odiff unavailable (${odiff.error}); falling back to pixelmatch`);
  try { return await comparePairPixelmatch(bPath, aPath, diffPath, { threshold: 0 }); }
  catch (err) { return { ok: false, error: err.message }; }
}

/* ------------------------------------------------- determinism self-test */

export async function selftestDeterminism({ values, paths, log, journal }) {
  const manifest = await readJson(paths.urlManifest);
  if (!manifest) throw new PreconditionError('No URL manifest. Run "t3u discover-urls" first.');

  const env = await readJson(paths.envFingerprint);
  const content = await readJson(paths.contentFingerprint);
  if (!env) throw new PreconditionError('Seal the environment fingerprint first: t3u env-fingerprint --write-baseline');

  const { UrlGuard } = await import('../net/url-guard.mjs');
  const { captureAll } = await import('./capture.mjs');
  const guard = await UrlGuard.create({ allowedOrigins: manifest.allowedOrigins });
  const stages = new Set(['http', 'dom', 'visual']);

  const rootA = path.join(paths.root, 'captures', 'selftest-a');
  const rootB = path.join(paths.root, 'captures', 'selftest-b');

  log.step('self-test pass A');
  await captureAll({ manifest, guard, outRoot: rootA, stages, log, journal, warmup: true });
  log.step('self-test pass B (fresh browser)');
  await captureAll({ manifest, guard, outRoot: rootB, stages, log, journal, warmup: false });

  const unstable = [];

  const [aShots, bShots] = await Promise.all([listShots(path.join(rootA, 'shots')), listShots(path.join(rootB, 'shots'))]);
  const { pairs, onlyInBefore, onlyInAfter } = pairFiles(aShots, bShots);
  for (const p of pairs) {
    if (p.status !== 'pair') { unstable.push({ capture: p.file, reason: 'capture-set-differs' }); continue; }
    const bp = path.join(rootA, 'shots', p.file);
    const ap = path.join(rootB, 'shots', p.file);
    if (await quickIdentical(bp, ap)) continue;
    const cmp = await compareOne(bp, ap, null, log);
    if (!cmp.ok || (cmp.diffPixels ?? 1) > 0) {
      unstable.push({
        capture: p.file, reason: 'pixels-differ',
        diffPixels: cmp.diffPixels ?? null,
        suggestedStabilization: suggest(cmp),
      });
    }
  }
  for (const f of [...onlyInBefore, ...onlyInAfter]) unstable.push({ capture: f, reason: 'capture-set-differs' });

  // DOM must be identical too: a stable screenshot with an unstable DOM is luck, not determinism.
  const [aDom, bDom] = await Promise.all([safeList(path.join(rootA, 'dom'), '.html'), safeList(path.join(rootB, 'dom'), '.html')]);
  for (const f of aDom.filter((x) => bDom.includes(x))) {
    const [x, y] = await Promise.all([
      readFile(path.join(rootA, 'dom', f), 'utf8'),
      readFile(path.join(rootB, 'dom', f), 'utf8'),
    ]);
    if (sha256(x) !== sha256(y)) {
      unstable.push({ capture: f, reason: 'dom-differs', suggestedStabilization: ['clock', 'random', 'lazy-load'] });
    }
  }

  const passed = unstable.length === 0;
  const reportPath = path.join(paths.root, 'selftest.json');
  const report = envelope({
    kind: 'selftest', run: { loopId: values.loop ?? '000' },
    verdict: passed ? 'pass' : 'findings',
    counts: { captures: pairs.length, unstable: unstable.length },
    findings: unstable.map((u, i) => ({
      id: nextId('000', i + 1), target: u.capture,
      class: 'harness-noise', severity: 'major', status: 'open', ...u,
    })),
  });
  await writeReport(reportPath, report, { profile: values['redaction-profile'], dryRun: values['dry-run'] });

  if (!passed) {
    log.finding(`${unstable.length} unstable capture(s). This is a HARNESS defect, never a site defect.`);
    for (const u of unstable.slice(0, 10)) {
      log.finding(`  ${u.capture}: ${u.reason}${u.suggestedStabilization ? ` → try ${u.suggestedStabilization.join(', ')}` : ''}`);
    }
    log.error('Do NOT pass this by shrinking the sample or raising a threshold — see rules/20-baseline-integrity.md');
    return { exitCode: EXIT.FINDINGS, verdict: 'findings', unstable: unstable.length, reports: [reportPath], message: 'determinism self-test failed' };
  }

  const selftestHash = sha256([
    env?.fingerprintHash ?? '', content?.fingerprintHash ?? '', manifest.manifestHash ?? '',
  ].join('|'));

  const lock = {
    schema: 'typo3-14-update/selftest-lock@1',
    verdict: 'pass',
    passedAt: new Date().toISOString(),
    selftestHash,
    coverage: values.sample ?? 'all',
    repeats: intOpt(values, 'repeats', 2),
    captures: pairs.length,
    maxAgeMs: 24 * 60 * 60 * 1000,
    harnessVersion: '2.0.0',
  };
  await writeFile(paths.selftestLock, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
  await new StateStore(paths).update((s) => {
    s.selftest = { status: 'green', at: lock.passedAt, lock_hash: selftestHash, coverage: lock.coverage, quarantined_captures: [] };
    s.loops['000'] = 'green';
  });

  log.success(`Determinism proven over ${pairs.length} captures. Comparisons are now permitted.`);
  return { exitCode: EXIT.PASS, verdict: 'pass', captures: pairs.length, reports: [reportPath], message: 'determinism proven' };
}

function suggest(cmp) {
  const s = [];
  if (cmp.layout || cmp.documentHeightDelta) s.push('lazy-load', 'fonts');
  if ((cmp.diffPercent ?? 0) > 20) s.push('consent', 'carousel');
  if (!s.length) s.push('clock', 'random', 'image-processing');
  return s;
}

/* ---------------------------------------------------------- baselines */

export async function sealBaselineAction({ values, paths, log }) {
  const id = values.id ?? 'A-original';
  const dir = values.dir ?? paths.baseline(id);
  const [manifest, env, content] = await Promise.all([
    readJson(paths.urlManifest), readJson(paths.envFingerprint), readJson(paths.contentFingerprint),
  ]);

  const { lock, files } = await sealBaseline(dir, {
    id,
    manifestHash: manifest?.manifestHash ?? null,
    environmentFingerprintHash: env?.fingerprintHash ?? null,
    contentFingerprintHash: content?.fingerprintHash ?? null,
  });

  let sampleHash = null;
  try { sampleHash = `sha256:${sha256(await readFile(paths.samplePath, 'utf8'))}`; } catch { /* optional */ }

  await writeFile(paths.baselineSeal(id), renderSeal(lock, {
    sampleHash,
    urls: manifest?.coverage?.discovered ?? null,
    captures: manifest?.captures?.length ?? null,
    notes: content?.degraded ? ['Content fingerprint was DEGRADED at seal time (database unavailable).'] : [],
  }), 'utf8');

  await new StateStore(paths).update((s) => {
    s.baselines[id] = {
      sealed: true, sealed_at: lock.sealedAt, manifest: manifest?.manifestHash ?? null,
      urls: manifest?.coverage?.discovered ?? 0, captures: manifest?.captures?.length ?? 0,
    };
  });

  log.success(`Baseline ${id} sealed: ${files} files, SHA256SUMS ${lock.sha256sumsSha256.slice(0, 16)}…`);
  return { exitCode: EXIT.PASS, verdict: 'pass', id, files, message: `baseline ${id} sealed` };
}

export async function verifyBaselineAction({ values, paths, log }) {
  const id = values.id ?? 'A-original';
  const res = await verifyBaseline(paths.baseline(id), { id });
  log.success(`Baseline ${id} verified: ${res.fileCount} files unchanged since ${res.lock.sealedAt}`);
  return { exitCode: EXIT.PASS, verdict: 'pass', ...res, message: `baseline ${id} intact` };
}

/* ------------------------------------------------------------- gate */

export async function gate({ values, paths, log }) {
  const reports = [];
  for (const kind of ['http', 'dom', 'visual']) {
    const r = await readJson(path.join(paths.root, `report.${kind}.json`));
    if (r) reports.push(r);
  }
  if (!reports.length) throw new PreconditionError('No stage reports found. Run the comparisons first.');

  const findings = reports.flatMap((r) => r.findings ?? []);
  const verdict = loopVerdict(findings, { idempotenceDiff: intOpt(values, 'idempotence-diff', 0) });
  const counts = countByClass(findings);

  const reportPath = path.join(paths.root, 'loop-report.json');
  const report = envelope({
    kind: 'loop', run: { loopId: values.loop },
    verdict: verdict.verdict === 'green' ? 'pass' : 'findings',
    counts, findings,
    extra: {
      stages: reports.map((r) => ({ stage: r.kind, verdict: r.verdict, counts: r.counts })),
      findingsByClass: counts,
      blockingReasons: verdict.blockingReasons,
      residualFindings: verdict.residual,
    },
  });
  const written = await writeReport(reportPath, report, { profile: values['redaction-profile'], dryRun: values['dry-run'] });

  if (verdict.verdict === 'green') {
    log.success('Loop gate: green');
    return { exitCode: EXIT.PASS, verdict: 'pass', counts, reports: [written.path], message: 'loop gate green' };
  }
  for (const r of verdict.blockingReasons) log.finding(r);
  return {
    exitCode: EXIT.FINDINGS, verdict: 'findings', counts,
    blockingReasons: verdict.blockingReasons, reports: [written.path],
    message: `loop blocked by ${verdict.blockingReasons.length} reason(s)`,
  };
}

/* ----------------------------------------------------------- helpers */

async function safeList(dir, ext) {
  try { return (await readdir(dir)).filter((f) => f.endsWith(ext)).sort(); }
  catch (err) { if (err.code === 'ENOENT') return []; throw err; }
}

export { classify, Unclassifiable, InvalidRunError };
