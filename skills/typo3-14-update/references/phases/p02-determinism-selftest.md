# P02 — Determinism self-test (loop 000)

Track `harness`. The gate that makes every later comparison meaningful.

## Preconditions
P01 sealed. Harness dependencies installed (`npm ci`). Browsers available in the container.

## Allowed
Harness configuration, stabilisation settings, masking. **No site code changes at all.**

## Procedure
Shoot the untouched site twice — same sample, same viewports, same settings, browser fully closed
between passes — and require **zero** differences.

Assertions, all of which must hold:
1. Pixel-identical at threshold 0 for every capture.
2. Identical image dimensions and document height.
3. Identical normalised-DOM hash per capture.
4. Identical HTTP/metadata record.
5. Identical capture set — nothing succeeded in one pass and failed in the other.
6. Content fingerprint after pass B equals the one before pass A, proving the act of shooting did
   not mutate the site (hit counters, `sys_log`, indexes).
7. Environment fingerprint unchanged.

## When it fails
It is **always** a harness or stabilisation defect — nothing changed between the passes. Work through
`references/determinism-stabilization.md`, which is organised by failure shape.

**Forbidden ways to pass:** reducing the sample, raising a threshold, excluding a page without an
ADR, accepting "close enough". Each destroys the harness's ability to tell a real regression from its
own noise, which is the only thing it is for.

## Exit
Two consecutive double-shoots at zero. Writes `selftest.lock.json`; every `compare-*` command refuses
without it.

## Blocking
Three iterations without reaching zero — abort and escalate with the unstable captures named.

