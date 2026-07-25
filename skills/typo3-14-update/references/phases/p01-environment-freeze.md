# P01 — Environment capture and freeze

No loop. Everything measured later is measured against what this phase seals.

## Preconditions
P00 complete.

## Allowed
`ddev start` / `describe`; reading `composer.json|lock`, CI config, `.ddev/config.yaml`;
`ddev snapshot`; `ddev export-db`; extension inventory; running the existing lint/test suites.

## Steps
1. `ddev start`, then `ddev describe` — record PHP version, database engine and version, docroot,
   project type. Determine current TYPO3/PHP from `composer.json`, `composer.lock`, CI and
   `.ddev/config.yaml`. **Do not infer a version from a filename.**
2. Create the restore path **before changing anything**:
   `ddev snapshot --name pre-update` plus `ddev export-db > pre-update.sql.gz` stored outside the
   container.
3. Inventory: PHP, TCA, schema, Extbase, hooks and events, backend modules, commands, upgrade
   wizards, Fluid, TypoScript, FlexForms, YAML, JavaScript and import maps, translations, Content
   Blocks, DataHandler and FAL usage, workspaces, third-party dependencies. Classify every extension
   per `references/extension-strategy.md` into `manifests/extensions.json`.
4. Run the repository's existing install, lint, static analysis and tests on the current branch.
   **Record pre-existing failures separately from regressions** — a failure that was already there is
   a `pre-existing` finding, not something this update caused.
5. Seal the environment fingerprint and the content fingerprint.

## Evidence
`manifests/environment.json` · `content-fingerprint.json` · `extensions.json` · `tooling.json` ·
`snapshots.json`

## Exit
Both fingerprints sealed; snapshot and dump exist outside the container; pre-existing failures
recorded separately.

## Blocking
DDEV will not boot. The installed core cannot run on the container PHP version — fix the container
version first, keeping it one the current core supports.

