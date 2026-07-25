# P07 — Mechanical migration (loop 120)

Track `invariance`. Rector and Fractor.

## Preconditions
The correct rung reached; loop 110 green where it applied.

## Steps
1. Configure TYPO3 Rector for the actual source-to-v14 path. Dry-run → **read the diff** → apply →
   second dry-run.
2. Configure Fractor for the same path. Dry-run → review the non-PHP changes → apply → second
   dry-run.
3. Run code style and syntax checks immediately after each tool, not once at the end — a style pass
   over a broken transformation just hides it.
4. **Never accept a bulk transformation blindly.** Split ambiguous DBAL, Extbase, TCA, Fluid or
   dependency changes into independently verifiable units.

## Why the second dry-run
A tool that still has work to do after applying has either failed on something or found new work its
own change created. Both are worth knowing before the next phase builds on it.

## Exit
Second dry-run empty for both tools; lint and code style clean.

## Blocking
A bulk transformation accepted without reading the diff. An iteration over the change budget — split
it instead.

