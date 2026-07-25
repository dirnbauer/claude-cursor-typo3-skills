/**
 * The exit-code contract. Single source of truth.
 *
 * The previous harness never exited non-zero from compare-screenshots, smoke-test or
 * lighthouse-test. A run with 40 differing screenshots exited 0, which meant the entire
 * "loop until green" premise could not be gated by anything. This file is the fix.
 *
 * Codes are meaningfully distinct because each demands a different response:
 *   1 -> fix the site        3 -> the run cannot be judged; do not hunt a regression
 *   2 -> fix the harness     4 -> satisfy a precondition first
 *   5 -> a guard refused; this is a security event, not a site regression
 */

export const EXIT = Object.freeze({
  /** The command's assertion held. Zero findings. */
  PASS: 0,
  /** Ran correctly; found real differences or failures the operator must fix. */
  FINDINGS: 1,
  /** The harness itself failed: crash, bad flags, missing binary, unreadable input,
   *  or our own report failing schema validation. */
  HARNESS_ERROR: 2,
  /** The run cannot be judged: environment or content fingerprint drift, baseline lock
   *  or checksum mismatch, manifest mismatch, missing or expired determinism self-test.
   *  Deliberately NOT 1 - the site may be perfectly fine; the measurement is void. */
  INVALID: 3,
  /** A gate the operator must satisfy first: no baseline sealed, no manifest, self-test
   *  never run, previous loop unfinished, credentials missing. */
  PRECONDITION: 4,
  /** A security guard refused: origin not allow-listed, DNS resolved into a blocked
   *  range, cross-origin redirect, oversized or wrong-typed response, credentials would
   *  have gone to an unexpected origin.
   *  Separate from 2 and 1 on purpose: folding a refusal into HARNESS_ERROR hides a
   *  security event inside "the harness is broken", and folding it into FINDINGS calls
   *  an attack a site regression. It must be greppable in journal.jsonl. */
  BLOCKED_BY_POLICY: 5,
});

export const EXIT_NAME = Object.freeze(
  Object.fromEntries(Object.entries(EXIT).map(([k, v]) => [v, k])),
);

export const EXIT_DESCRIPTION = Object.freeze({
  [EXIT.PASS]: 'Assertion held; zero findings.',
  [EXIT.FINDINGS]: 'Ran correctly; real differences found. Fix the site, then re-run.',
  [EXIT.HARNESS_ERROR]: 'The harness failed. Fix the harness or its inputs.',
  [EXIT.INVALID]: 'The run cannot be judged (fingerprint/baseline/manifest/self-test). Do not treat as a site regression.',
  [EXIT.PRECONDITION]: 'A precondition is unmet. Satisfy it, then re-run.',
  [EXIT.BLOCKED_BY_POLICY]: 'A security guard refused the request. Investigate before retrying.',
});

/** Errors carrying an explicit exit code. */
export class HarnessError extends Error {
  constructor(message, code = EXIT.HARNESS_ERROR, detail = {}) {
    super(message);
    this.name = 'HarnessError';
    this.exitCode = code;
    this.detail = detail;
  }
}

export class PolicyError extends HarnessError {
  constructor(message, detail = {}) {
    super(message, EXIT.BLOCKED_BY_POLICY, detail);
    this.name = 'PolicyError';
  }
}

export class InvalidRunError extends HarnessError {
  constructor(message, detail = {}) {
    super(message, EXIT.INVALID, detail);
    this.name = 'InvalidRunError';
  }
}

export class PreconditionError extends HarnessError {
  constructor(message, detail = {}) {
    super(message, EXIT.PRECONDITION, detail);
    this.name = 'PreconditionError';
  }
}

/** Worst-of, for aggregating stage results into a loop verdict.
 *  INVALID and BLOCKED_BY_POLICY outrank FINDINGS: a run that cannot be judged must not
 *  be reported as "we found 3 differences". */
const SEVERITY = [EXIT.PASS, EXIT.FINDINGS, EXIT.PRECONDITION, EXIT.INVALID, EXIT.BLOCKED_BY_POLICY, EXIT.HARNESS_ERROR];

export function worstExit(codes) {
  let worst = EXIT.PASS;
  for (const c of codes) {
    if (SEVERITY.indexOf(c) > SEVERITY.indexOf(worst)) worst = c;
  }
  return worst;
}

export function verdictFor(code) {
  if (code === EXIT.PASS) return 'pass';
  if (code === EXIT.FINDINGS) return 'findings';
  if (code === EXIT.INVALID) return 'invalid';
  return 'error';
}
