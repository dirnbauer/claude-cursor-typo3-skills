# P00 — Intake and scope lock

No loop. This phase decides what is being updated and creates the run directory.

## Preconditions
- The repository is present and readable.
- No run directory yet, or one whose `run_id` the user confirms resuming.

## Allowed
Read-only inspection. Creating `.typo3-update/` from `templates/run-directory/`. Asking questions.

## Steps
1. Determine the target: **project**, **sitepackage**, or **extension**. For a standalone extension
   with no host project, create a disposable TYPO3 14.3 DDEV installation to prove installation and
   behaviour.
2. For a full site, confirm a current local sync of live exists — database and `fileadmin` imported
   into DDEV. **Creating that sync is outside this skill.** When it is missing or stale, ask for a
   fresh dump; never connect to production to fetch it.
3. Record the sync freshness decision. A stale sync is usable, but the invariance claim is only as
   current as the content it was measured against, and that must be visible later.
4. Create the run directory and fill `config/run.yml`: trusted origin (scheme included), languages
   as the site's real prefixes, golden paths, budgets.
5. Ask once whether the run directory should be committed, and record the answer.
6. Write `ADR-001-scope.md`.

## Evidence
`state.json` initialised · `config/run.yml` · `decisions/ADR-001-scope.md`

## Exit
Target kind, source version, DDEV project and sync-freshness decision are all recorded in
`state.json`.

## Blocking
No local sync, or one the user cannot vouch for. Ask; do not improvise one.

