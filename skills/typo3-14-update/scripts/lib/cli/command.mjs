/**
 * The command wrapper. ONE place owns the exit code.
 *
 * This is the structural fix for the defect that voided the loop premise: in v1 each action
 * decided (or forgot) its own outcome and main() fell through to a success message. Here an
 * action returns {exitCode, ...} or throws a typed error, and this wrapper converts that to
 * a process exit — every time, for every command.
 *
 * It also enforces the gating rule: comparison and gate commands refuse without a valid
 * determinism self-test lock.
 */

import { readFile } from 'node:fs/promises';
import {
  EXIT, EXIT_NAME, EXIT_DESCRIPTION, HarnessError, PolicyError,
  InvalidRunError, PreconditionError, verdictFor,
} from './exit-codes.mjs';
import { createLogger } from './logger.mjs';
import { RunPaths } from '../run/paths.mjs';
import { Journal } from '../run/journal.mjs';
import { StateStore } from '../run/state.mjs';
import { redactStack } from '../util/redact.mjs';

/** Commands that may not run without a proven-deterministic harness. */
const REQUIRES_SELFTEST = new Set(['compare-http', 'compare-dom', 'compare-visual', 'gate']);

const SELFTEST_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function runCommand({ command, values, positionals, argv, actions, now = Date.now }) {
  const log = createLogger({ quiet: values.quiet, verbose: values.verbose });
  const paths = new RunPaths(values['run-dir'] ?? '.typo3-update');
  const journal = new Journal(paths.journalPath);
  const state = new StateStore(paths);
  const started = now();
  let exitCode = EXIT.PASS;
  let result = null;

  const ctx = { command, values, positionals, log, paths, journal, state, argv };

  try {
    await journal.commandStart({ argv, cwd: process.cwd(), loopId: values.loop, envFp: null })
      .catch(() => { /* the journal must never be the reason a command fails */ });

    if (REQUIRES_SELFTEST.has(command) && !values['dry-run']) {
      await assertSelftestValid(paths, now);
    }

    const action = actions[command];
    if (!action) throw new HarnessError(`No implementation registered for command: ${command}`);

    result = await action(ctx);
    exitCode = result?.exitCode ?? EXIT.PASS;

    if (values.json && result) log.json(result);

    if (exitCode === EXIT.PASS) {
      log.success(result?.message ?? `${command}: pass`);
    } else if (exitCode === EXIT.FINDINGS) {
      log.finding(result?.message ?? `${command}: findings — fix the site, then re-run`);
    } else {
      log.error(result?.message ?? `${command}: ${EXIT_NAME[exitCode]}`);
    }
  } catch (err) {
    exitCode = err?.exitCode ?? EXIT.HARNESS_ERROR;
    result = {
      exitCode,
      verdict: verdictFor(exitCode),
      error: err?.message ?? String(err),
      detail: err?.detail ?? null,
    };

    if (err instanceof PolicyError) {
      await journal.policyBlock({
        loopId: values.loop, reason: err.message,
        target: err.detail?.origin ?? err.detail?.host ?? null,
        purpose: err.detail?.purpose ?? null,
      }).catch(() => {});
      log.error(`BLOCKED BY POLICY: ${err.message}`);
      log.error('This is a security event, not a site regression. Investigate before retrying.');
    } else if (err instanceof InvalidRunError) {
      log.error(`INVALID: ${err.message}`);
      log.error('The run cannot be judged. Do NOT treat this as a site regression.');
    } else if (err instanceof PreconditionError) {
      log.error(`PRECONDITION: ${err.message}`);
    } else {
      log.error(`${command} failed: ${err?.message ?? err}`);
      if (values.verbose) log.debug(redactStack(err?.stack, { debug: true }) ?? '');
      else log.debug(redactStack(err?.stack) ?? '');
    }

    if (values.json) log.json(result);
  } finally {
    await journal.commandEnd({
      argv, loopId: values.loop, exitCode,
      durationMs: now() - started,
      verdict: result?.verdict ?? verdictFor(exitCode),
      reports: result?.reports ?? [],
    }).catch(() => {});
  }

  if (exitCode !== EXIT.PASS && !values.quiet) {
    process.stderr.write(`[t3u] exit ${exitCode} (${EXIT_NAME[exitCode]}): ${EXIT_DESCRIPTION[exitCode]}\n`);
  }
  return exitCode;
}

/**
 * "Only a harness that proves zero against itself may judge an update", made mechanical.
 * Missing lock -> PRECONDITION (run the self-test). Stale or drifted lock -> INVALID.
 */
export async function assertSelftestValid(paths, now = Date.now) {
  let lock;
  try {
    lock = JSON.parse(await readFile(paths.selftestLock, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new PreconditionError(
        'No determinism self-test lock. Run "t3u selftest-determinism" before any comparison.',
        { expected: paths.selftestLock },
      );
    }
    throw new InvalidRunError(`selftest.lock.json is unreadable: ${err.message}`);
  }

  if (lock.verdict !== 'pass') {
    throw new PreconditionError('The determinism self-test did not pass; comparisons are not trustworthy.');
  }

  const age = now() - Date.parse(lock.passedAt ?? 0);
  const maxAge = lock.maxAgeMs ?? SELFTEST_MAX_AGE_MS;
  if (!Number.isFinite(age) || age > maxAge) {
    throw new InvalidRunError(
      `The determinism self-test is older than ${Math.round(maxAge / 3.6e6)}h. Re-run it.`,
      { passedAt: lock.passedAt },
    );
  }

  // The lock binds to its inputs; if any changed, the proof no longer covers this run.
  const current = await currentSelftestInputs(paths).catch(() => null);
  if (current && lock.selftestHash && current.hash !== lock.selftestHash) {
    throw new InvalidRunError(
      'The determinism self-test lock does not match the current environment, content or manifest.',
      { lockHash: lock.selftestHash, currentHash: current.hash, drifted: current.drifted },
    );
  }
  return lock;
}

async function currentSelftestInputs(paths) {
  const { sha256 } = await import('../run/paths.mjs');
  const read = async (p) => { try { return JSON.parse(await readFile(p, 'utf8')); } catch { return null; } };
  const env = await read(paths.envFingerprint);
  const content = await read(paths.contentFingerprint);
  const manifest = await read(paths.urlManifest);
  const drifted = [];
  if (!env) drifted.push('environment');
  if (!content) drifted.push('content');
  if (!manifest) drifted.push('manifest');
  const parts = [
    env?.fingerprintHash ?? '',
    content?.fingerprintHash ?? '',
    manifest?.manifestHash ?? '',
  ].join('|');
  return { hash: sha256(parts), drifted };
}
