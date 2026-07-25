# P11 — Invariance closure (loop 300)

Track `invariance`. The loop the whole skill exists for.

## Preconditions
Loops 140 and 200–230 green where they applied. Both fingerprints unchanged since sealing.

## Allowed
**Repair only.** No new features, no improvements, no "while I am here".

## Steps
1. Re-run stage 1 (HTTP and metadata) across all URLs.
2. Re-run stage 2 (normalised DOM) across all URLs.
3. Re-shoot stage 3 with the identical sample file, viewport matrix and settings.
4. Compare against `A-original`.
5. For every difference: identify the cause, fix it, re-shoot the affected pages. One cause per
   iteration.
6. Finish with one full pass, then the idempotence re-run.

## Reading the stages
The stage that caught a difference already narrows the cause — this is what turns a long pixel hunt
into a short fix:

| HTTP | DOM | Pixels | Look at |
|---|---|---|---|
| differs | differs | differs | routing, redirects, site configuration |
| same | differs | differs | Fluid, TypoScript, extension markup |
| same | same | differs | CSS, Vite assets, fonts, image processing |

## Exit
0 open `regression` findings · 0 `declared-change` without an approval · 0 `harness-noise` ·
comparison coverage equals the sample · idempotence re-run diff count 0 · accessibility re-audit
still 0 serious/critical.

## Blocking
Re-baselining. Threshold changes. Sample reduction. Excluding a page. None of these is grantable —
see `rules/20-baseline-integrity.md`.

Budgets here are larger than elsewhere (8 iterations, 240 minutes) because this loop legitimately has
more to do. They are still budgets: exceeding one needs an approval, and aborting is a correct
outcome.

