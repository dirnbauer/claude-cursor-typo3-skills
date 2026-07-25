# TYPO3 CI Configuration Patterns

## 1. ext_emconf.php and strict_types

- `ext_emconf.php` must NOT contain `declare(strict_types=1)` — TER cannot parse it
- PHP-CS-Fixer rule `declare_strict_types => true` must exclude ext_emconf.php
- Pattern: `->notPath('ext_emconf.php')` in Finder config
- The shared `typo3-ci-workflows` config already handles this

## 2. Shared PHP-CS-Fixer config factory

Use the shared factory from `netresearch/typo3-ci-workflows` in `Build/.php-cs-fixer.php`:

```php
<?php
declare(strict_types=1);

// Build/.php-cs-fixer.php
$createConfig = require __DIR__ . '/../.Build/vendor/netresearch/typo3-ci-workflows/config/php-cs-fixer/config.php';

return $createConfig(<<<'EOF'
    Copyright header here
EOF, __DIR__ . '/..');
```

- Requires `"netresearch/typo3-ci-workflows": "^1.0"` in `require-dev`
- Benefits: centralized rules, ext_emconf.php exclusion, consistent formatting
- **TYPO3 12 compatibility**: `typo3-ci-workflows` may pull in dependencies for TYPO3 13, causing conflicts. For TYPO3 12 extensions, you may need to inline the config or ensure you use compatible dependency versions, such as `saschaegerer/phpstan-typo3: ^2.0`.

## 3. labeler.yml for TYPO3 extensions

Standard labeler config for PR auto-labeling:

```yaml
documentation:
  - changed-files:
      - any-glob-to-any-file: ['Documentation/**', '*.md']
configuration:
  - changed-files:
      - any-glob-to-any-file: ['Configuration/**', 'ext_emconf.php', 'composer.json']
tests:
  - changed-files:
      - any-glob-to-any-file: ['Tests/**', 'phpunit*.xml']
ci:
  - changed-files:
      - any-glob-to-any-file: ['.github/**']
```

## 4. Composer allow-plugins for CI dependencies

When using `typo3-ci-workflows`, fractor, or infection, add their installers to `allow-plugins`:

```json
{
    "config": {
        "allow-plugins": {
            "a9f/fractor-extension-installer": true,
            "infection/extension-installer": true,
            "captainhook/hook-installer": true
        }
    }
}
```

## 5. TYPO3 v14.3 LTS CI matrix

TYPO3 v14.3 LTS (released 2026-04-21) is the current gold standard. Use
`typo3/testing-framework:^9.5` — a single branch that supports **both v13
and v14** cores. PHPUnit constraint: `^11.2.5 || ^12.1.2 || ^13.0.2`.

### Matrix example (GitHub Actions)

```yaml
strategy:
  matrix:
    include:
      # TYPO3 14.3 LTS (default)
      - { php: '8.2', typo3: '^14.3' }
      - { php: '8.3', typo3: '^14.3' }
      - { php: '8.4', typo3: '^14.3' }
      - { php: '8.5', typo3: '^14.3' }
      # TYPO3 13.4 LTS
      - { php: '8.2', typo3: '^13.4' }
      - { php: '8.3', typo3: '^13.4' }
      - { php: '8.4', typo3: '^13.4' }
      - { php: '8.5', typo3: '^13.4' }
      # TYPO3 12.4 LTS (ELTS window approaching 2026-04-30)
      - { php: '8.2', typo3: '^12.4' }
      - { php: '8.3', typo3: '^12.4' }
```

### composer.json (v13 + v14 dual support)

```json
{
    "require": {
        "php": "^8.2",
        "typo3/cms-core": "^13.4 || ^14.3"
    },
    "require-dev": {
        "typo3/testing-framework": "^9.5",
        "phpunit/phpunit": "^11.2.5 || ^12.1.2 || ^13.0.2"
    }
}
```

### v14-specific testing notes

- **Fluid 5 strict-typing (#108148)**: ViewHelper test doubles now need
  typed args + typed `render(): string` return. Untyped custom VHs
  raise exceptions in v14 functional tests.
- **Cache interface strict-typing (#107315)**: test doubles for
  `BackendInterface`/`FrontendInterface` must match the new typed
  signatures.
- **FAL strict-typing (#106427)**: `AbstractFile::getIdentifier()` is
  gone; test doubles for `File`/`Folder` must use concrete methods.
- **Extbase argument strict-typing (#107777)**: `Argument` now enforces
  strict types; replace `setValue(mixed)` mocks.
- See `typo3-v14-final-classes.md` for the full list of v14 `final` classes
  that cannot be mocked (use interface-based doubles instead).

## 6. PHPStan across the supported-version matrix

### Verify every supported TYPO3 version locally — not just the highest installed

A green PHPStan run on the highest installed TYPO3 version can still fail CI on a
lower one. Class existence and deprecation results differ per version, e.g.
`TYPO3\CMS\Backend\Template\Components\ComponentFactory` exists only on **v14+**,
so referencing it produces "unknown class" / "returns mixed" errors on v12/v13;
conversely the `make*` docheader API (`MenuRegistry::makeMenu()`,
`Menu::makeMenuItem()`, `ButtonBar::makeLinkButton()`) is deprecated on **v14**
but not on v12/v13. A single-version local run sees only one side.

Before pushing, re-resolve to each supported version and re-run PHPStan — no
composer.json edit needed, `--with` applies a temporary constraint:

```bash
for V in '^12.4' '^13.4' '^14.3'; do
  composer update -W \
    --with "typo3/cms-core:$V" --with "typo3/cms-backend:$V" --with "typo3/cms-setup:$V" \
    --no-interaction
  composer dump-autoload -o
  composer ci:test:php:phpstan || echo "PHPStan FAILED on TYPO3 $V"
done
```

### Inline `@phpstan-ignore` is rejected — use neon `ignoreErrors`

`ergebnis/phpstan-rules` (in the shared `typo3-ci-workflows` config) **bans inline
`@phpstan-ignore` / `@phpstan-ignore-next-line`** — CI fails with *"Errors reported
by phpstan/phpstan should not be ignored via @phpstan-ignore, fix the error or use
the baseline instead."* This rule is NOT active in a bare local `Build/phpstan.neon`
run, so it only surfaces in CI. Put suppressions in the neon `ignoreErrors` block
instead, scoped by `path` and kept SPECIFIC (not a blanket `#Call to deprecated
method#`). For cross-version cases set `reportUnmatched: false` so an entry that
only applies to one TYPO3 version does not error on the others:

```yaml
parameters:
    reportUnmatchedIgnoredErrors: false
    ignoreErrors:
        # v14 only: the v12/v13 fallback docheader make* calls are deprecated there
        - message: '#Call to deprecated method (makeMenu|makeMenuItem|makeLinkButton)\(\)#'
          path: %currentWorkingDirectory%/Classes/Controller/MyModuleController.php
          reportUnmatched: false
        # v12/v13 only: ComponentFactory does not exist there
        - message: '#TYPO3\\CMS\\Backend\\Template\\Components\\ComponentFactory#'
          path: %currentWorkingDirectory%/Classes/Controller/MyModuleController.php
          reportUnmatched: false
```
