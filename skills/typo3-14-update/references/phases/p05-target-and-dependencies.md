# P05 — Target, environment and dependencies (loop 100)

Track `invariance`. Resolve every dependency before touching application code.

## Preconditions
P04 green.

## Steps
1. Align the DDEV environment with the ladder rung, not with the destination: keep a PHP version the
   installed core supports so the site boots. `ddev restart` after each change.
2. Set the target per `references/typo3-14-constraints.md`: `typo3/cms-core: ^14.3`, PHP 8.4 with an
   explicit 8.5 attempt recorded.
3. Keep `config.platform.php` in step with the container — never ahead of it.
4. Plan the ladder. v12 with a real database → `^13.4` first (loop 110). v13 or a code-only package →
   straight to `^14.3`.
5. Audit every required and dev package against current release metadata and route it through
   `references/extension-strategy.md`.
6. Migrate extension metadata to `composer.json` per #108345.
7. Update PHPStan to the newest release compatible with the resolved dependency set, including
   `saschaegerer/phpstan-typo3` through `phpstan/extension-installer`. Do not copy stale config.
8. `ddev composer validate --strict`, update with the narrowest justified command, inspect the
   lockfile diff.

## Exit
`ddev composer why-not typo3/cms-core "^14.3"` names no blocker. `why-not php 8.4` empty, and the 8.5
attempt recorded with its outcome. Every extension in `manifests/extensions.json` has a resolution.

## Blocking
Any extension left `unresolved`. A removal without an approval record.

