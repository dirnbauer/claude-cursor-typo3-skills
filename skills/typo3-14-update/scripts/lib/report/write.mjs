/**
 * The single write door for every report.
 *
 * Order is fixed and non-negotiable: build -> validate -> redact -> atomic write.
 *
 * No other module may write a report. A unit test greps lib/actions/** for direct
 * filesystem writes, because "everyone remembers to redact" is not a control.
 *
 * A report that fails its own schema is exit 2. The harness must not emit malformed
 * evidence — a broken report is worse than none, because it still looks like data.
 */

import { writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { HarnessError } from '../cli/exit-codes.mjs';
import { redactUrl, redactHeaders, redactStack, untrusted } from '../util/redact.mjs';
import { sha256 } from '../run/paths.mjs';

export const HARNESS_VERSION = '2.0.0';
export const REPORT_SCHEMA_VERSION = '1.0.0';

/** Keys whose string values are page/console/package text: contained, never trusted. */
const UNTRUSTED_KEY = /^untrusted/;

export function envelope({ kind, run, inputs = {}, verdict, counts = {}, findings = [], extra = {} }) {
  return {
    $schema: `typo3-14-update/${kind}/v1`,
    schemaVersion: REPORT_SCHEMA_VERSION,
    kind,
    harness: { name: 't3u', version: HARNESS_VERSION },
    run: {
      runId: run?.runId ?? null,
      loopId: run?.loopId ?? null,
      track: run?.track ?? null,
      createdAt: run?.createdAt ?? new Date().toISOString(),
    },
    inputs: {
      manifestHash: inputs.manifestHash ?? null,
      environmentFingerprintHash: inputs.environmentFingerprintHash ?? null,
      contentFingerprintHash: inputs.contentFingerprintHash ?? null,
      selftestLockHash: inputs.selftestLockHash ?? null,
    },
    verdict,
    counts,
    findings,
    ...extra,
    redaction: { applied: false, profile: 'local', rules: [] },
  };
}

/** Minimal structural validation. Deliberately dependency-free: the harness must not need
 *  a package install to refuse malformed evidence. */
export function validateReport(report) {
  const errors = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };

  need(typeof report === 'object' && report !== null, 'report is not an object');
  if (errors.length) return errors;

  need(typeof report.kind === 'string' && report.kind.length > 0, 'kind missing');
  need(report.schemaVersion === REPORT_SCHEMA_VERSION, `schemaVersion must be ${REPORT_SCHEMA_VERSION}`);
  need(report.harness?.name === 't3u', 'harness.name must be t3u');
  need(['pass', 'findings', 'invalid', 'error'].includes(report.verdict), `bad verdict: ${report.verdict}`);
  need(typeof report.counts === 'object' && report.counts !== null, 'counts missing');
  need(Array.isArray(report.findings), 'findings must be an array');

  for (const [i, f] of (report.findings ?? []).entries()) {
    need(typeof f.id === 'string', `findings[${i}].id missing`);
    need(typeof f.target === 'string', `findings[${i}].target missing`);
    need(CLASSES.includes(f.class), `findings[${i}].class invalid: ${f.class}`);
    need(['blocker', 'major', 'minor', 'info'].includes(f.severity), `findings[${i}].severity invalid`);
    need(['open', 'closed'].includes(f.status), `findings[${i}].status invalid`);
    if (f.class === 'declared-change') {
      need(typeof f.approval_ref === 'string' && f.approval_ref,
        `findings[${i}] is declared-change without an approval_ref`);
    }
  }
  // A verdict of pass with blocking findings is internally inconsistent; catch it here
  // rather than letting it reach a report someone trusts.
  if (report.verdict === 'pass') {
    const blocking = (report.findings ?? []).filter(
      (f) => BLOCKING_CLASSES.includes(f.class) && f.status !== 'closed',
    );
    need(blocking.length === 0, `verdict is pass but ${blocking.length} blocking finding(s) are open`);
  }
  return errors;
}

const CLASSES = ['regression', 'declared-change', 'pre-existing', 'harness-noise', 'environment', 'content-drift', 'improvement'];
const BLOCKING_CLASSES = ['regression', 'harness-noise', 'content-drift'];

/** Recursive redaction. `local` keeps paths and non-secret query names; `share` also
 *  hashes hostnames and path segments for a document that leaves the building. */
export function redactReport(report, profile = 'local') {
  const rules = new Set();

  const walk = (value, key) => {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return value.map((v) => walk(v, key));
    if (typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = walk(v, k);
      return out;
    }
    if (typeof value !== 'string') return value;

    if (key && UNTRUSTED_KEY.test(key)) { rules.add('untrusted-contained'); return untrusted(value); }
    if (key && /stack|trace/i.test(key)) { rules.add('stack-frames'); return redactStack(value); }
    if (/^https?:\/\//.test(value)) { rules.add('query-values'); return redactUrl(value, { profile }); }
    return value;
  };

  const out = walk(report);
  if (out.headers) { out.headers = redactHeaders(out.headers, { profile }); rules.add('credentials'); }
  out.redaction = { applied: true, profile, rules: [...rules].sort() };
  return out;
}

/**
 * Validate, redact, write atomically. Returns the path and the content hash so the caller
 * can record it in 05-evidence.md.
 */
export async function writeReport(filePath, report, { profile = 'local', dryRun = false } = {}) {
  const errors = validateReport(report);
  if (errors.length) {
    throw new HarnessError(
      `Refusing to write a malformed ${report?.kind ?? 'unknown'} report:\n  - ${errors.join('\n  - ')}`,
      2, { errors },
    );
  }
  const redacted = redactReport(report, profile);
  const body = `${JSON.stringify(redacted, null, 2)}\n`;
  const hash = sha256(body);

  if (dryRun) return { path: filePath, sha256: hash, written: false };

  await mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  await writeFile(tmp, body, 'utf8');
  await rename(tmp, filePath);
  return { path: filePath, sha256: hash, written: true };
}
