#!/usr/bin/env node
/**
 * t3u — TYPO3 update equality prover.
 *
 * One entrypoint, subcommands, and exactly one place that decides the exit code
 * (lib/cli/command.mjs). That structure is the fix for the v1 defect where three actions
 * could report forty differing screenshots and still exit 0.
 *
 *   0 pass · 1 findings · 2 harness error · 3 invalid · 4 precondition · 5 blocked by policy
 */

import { parse, helpText } from './lib/cli/args.mjs';
import { runCommand } from './lib/cli/command.mjs';
import { EXIT } from './lib/cli/exit-codes.mjs';
import { init, doctor, status, envFingerprint, contentFingerprint } from './lib/actions/core.mjs';
import { discoverUrls } from './lib/actions/discover.mjs';
import { capture } from './lib/actions/capture.mjs';
import {
  compareHttp, compareDomAction, compareVisual,
  selftestDeterminism, sealBaselineAction, verifyBaselineAction, gate,
} from './lib/actions/compare.mjs';
import { backendSweep, smoke, lighthouse } from './lib/actions/sweep.mjs';
import { report } from './lib/actions/report.mjs';

const ACTIONS = {
  init,
  doctor,
  status,
  'env-fingerprint': envFingerprint,
  'content-fingerprint': contentFingerprint,
  'discover-urls': discoverUrls,
  capture,
  'selftest-determinism': selftestDeterminism,
  'seal-baseline': sealBaselineAction,
  'verify-baseline': verifyBaselineAction,
  'compare-http': compareHttp,
  'compare-dom': compareDomAction,
  'compare-visual': compareVisual,
  'backend-sweep': backendSweep,
  smoke,
  lighthouse,
  gate,
  report,
};

async function main(argv) {
  let parsed;
  try {
    parsed = parse(argv);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    return err.exitCode ?? EXIT.HARNESS_ERROR;
  }

  if (parsed.command === 'help' || parsed.values?.help) {
    process.stdout.write(helpText(parsed.positionals?.[0] ?? parsed.command === 'help' ? parsed.positionals?.[0] : parsed.command));
    return EXIT.PASS;
  }

  return runCommand({ ...parsed, argv, actions: ACTIONS });
}

const exitCode = await main(process.argv.slice(2));
process.exitCode = exitCode;
