# TYPO3 14.3 constraints, PHP target, and package metadata

Canonical source for this skill. Where `typo3-update` or any routed skill says something different,
this file wins.

## Core constraint: `^14.3`, never `^14.0`

14.3 is the supported LTS line. **14.0 through 14.2 no longer receive security updates**, so a
constraint that allows them allows an unsupported install.

```json
{ "require": { "typo3/cms-core": "^14.3", "php": "^8.4" } }
```

A reusable package that genuinely tests a broader range may widen it — and must then prove it in CI
rather than assert it.

## PHP: 8.4 standard, 8.5 preferred where it resolves

TYPO3 v14 Core runs from PHP 8.2, so a reusable package may declare `^8.2` when it tests it.
**Project and site work targets PHP 8.4 as the standard.**

**Try 8.5 first.** Run it explicitly and record the outcome — "we could not use 8.5" and "we never
checked" are different statements, and `state.target.php_85_evaluated` keeps them apart:

```bash
ddev composer why-not php 8.5
```

Empty → set the container and `config.platform.php` to 8.5. Otherwise record the blocking packages
in `state.target.php_85_blockers` and stay on 8.4. Gate A5 checks that the attempt happened.

`ddev composer why-not php 8.4` must name **no** blocker. Any extension that blocks the target goes
back through `references/extension-strategy.md` — upgraded, forked and patched in `packages/`, or
removed with approval.

### The platform pin moves with the container, not ahead of it

Set `php_version` in `.ddev/config.yaml` and `config.platform.php` **in step with the upgrade
ladder**: keep a version the currently installed core supports so the site boots, and raise both to
the target no later than the `^14.3` rung. `ddev restart` after each change.

A platform pin ahead of the container makes Composer select packages the runtime cannot boot — the
resulting failure looks like a code problem and is not.

## Feature #108345 — extension metadata in `composer.json`

`ext_emconf.php` is **deprecated in v14 and no longer evaluated in v15**.

- **Remove it** for project-local extensions in `packages/`.
- **Keep it** — exactly in sync with `composer.json` — only where a tool still requires it:
  TER/Tailor publishing, or a Classic-mode installation.

Required metadata, mandatory from v15 and already raising a cache-warmup deprecation in v14:

```json
{
  "type": "typo3-cms-extension",
  "extra": {
    "typo3/cms": {
      "extension-key": "my_extension",
      "version": "1.2.3",
      "Package": { "providesPackages": {} }
    }
  }
}
```

- `extra.typo3/cms.version` — or the top-level `version` field — matching the future Git tag. **Do
  not create the tag.**
- `extra.typo3/cms.Package.providesPackages` — an empty object when the extension provides no
  Composer packages. In Classic mode it may map a provided package to a relative Composer vendor
  directory whose `autoload.php` TYPO3 loads early. Packages shipped by TYPO3 or provided by other
  loaded extensions are not listed.
- Pre-stable state goes in the version suffix (`1.2.3-beta2`), not in a `state` key.
- `state = excludeFromUpdates` becomes `extra.typo3/cms.exclude-from-updates: true`.

Keep `type: typo3-cms-extension`, PSR-4 autoloading, and a valid `extension-key`. Remove obsolete
`replace` entries for `typo3-ter/*` or the extension key when `composer validate` flags them.

**Cache warm-up must not emit the #108345 deprecation.** When it does, fix the extension's
`composer.json` rather than ignoring the message — gate A5 checks for a clean deprecation log.

## The upgrade ladder

Core upgrade wizards ship per version, and TYPO3 documents major upgrades from the previous LTS.

- **v12 source with a real database**: require `^13.4` first, make the installation boot, run **all**
  13.4 wizards and schema updates, verify `ddev typo3 upgrade:list` is empty, and only then require
  `^14.3`. Save the code modernisation for the v14 rung.
- **v13 source, or a code-only package with no persisted data**: straight to `^14.3`.

`ddev typo3 upgrade:list` must be empty before leaving each rung.

## Asset pipeline

v14 removed core asset concatenation and compression, so an external build tool is mandatory.

This skill requires **plain Vite without a bridge extension**: compile SCSS/JS entrypoints to hashed
files with a manifest, and reference them directly from Fluid layouts or TypoScript. Use `typo3-vite`
for build configuration and **skip its `praetorius/vite-asset-collector` integration** — that is a
deliberate deviation, kept because one less extension in the critical rendering path is one less
thing to migrate at the next LTS.

## Commands that are Core, and one that is not

Core: `extension:setup` (performs the schema migrations), `upgrade:list`, `upgrade:run`,
`referenceindex:update`, `language:update`, `cache:flush`, `cache:warmup`.

**Not** Core: `database:updateschema` ships with `helhum/typo3-console`. Use the backend database
analyzer in Admin Tools, or that command only when the project already depends on the package.
