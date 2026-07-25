---
name: "typo3-initial-release"
description: "Prepare, verify, review, tag, and document the first official release of a TYPO3 14.3+ extension. Use when the user asks for an initial release, version 1.0.0, release readiness, final release review, TER/Packagist/GitHub release preparation, release tagging, PHP/TYPO3 CI matrix hardening, composer.json release metadata, or pre-release checks for a TYPO3 14.3+ extension."
metadata:
  version: "1.0.0"
  origin: "webconsulting"
license: "MIT / CC-BY-SA-4.0"
---
# TYPO3 Initial Extension Release

> Source: https://github.com/dirnbauer/webconsulting-skills

## Top-Level TYPO3 UI Rules

Apply these rules before any release implementation or review work:

- Use the TYPO3 Styleguide only for styling decisions. Backend UI colors, spacing, icons, tables, cards,
  buttons, form controls, module chrome, CSS variables, dark mode, and accessibility states should follow
  TYPO3's established styleguide patterns.
- Use TYPO3 APIs first. Prefer PHP and TYPO3 Core APIs for routing, configuration, data preparation, actions,
  permissions, persistence, and rendering setup whenever they can express the behavior.
- Prefer TYPO3 Fluid templates for output. Compose UI with layouts, templates, Partials, and ViewHelpers before introducing custom rendering code.
- Use JavaScript only when the interaction genuinely requires client-side behavior. If JavaScript is needed,
  use modern TYPO3-compatible Lit/Web Component or ES module patterns. Do not add DOM hacks, global event
  stunts, framework islands, hidden state machines, or clever JavaScript when PHP, Fluid, or a TYPO3 backend
  API is enough.
- Check every style change before release. List each required CSS/SCSS/Fluid markup change, explain why it is
  necessary, and remove or revise any styling that duplicates or contradicts TYPO3 Styleguide behavior.
- Use XLIFF 2.0 and ICU messages for all extension labels. Do not hardcode user-facing text in Fluid
  templates, PHP, JavaScript, or configuration when it should be translated. Provide English and German
  labels, then check whether both languages are easy to understand for editors and administrators.

## Top-Level TYPO3 Documentation Rules

Apply these rules before release tagging:

- Do a deep documentation review, not a version-string sweep. Read README, `Documentation/`, changelog,
  examples, screenshots, configuration references, and install snippets against the actual extension source.
- Use the TYPO3 documentation way: `Documentation/` with reStructuredText, `Index.rst`, TYPO3
  roles/directives, toctrees, anchors, `confval` for configuration, `literalinclude` for source-backed
  examples, and screenshots with meaningful alt text where backend workflows are documented.
- Keep README as the public entry point. It should explain the value proposition, supported TYPO3/PHP
  versions, installation, quick start, key features, and links into detailed TYPO3 docs. It must not become a
  second full manual that drifts from `Documentation/`.
- Update documentation when behavior, configuration, CLI commands, labels, screenshots, release metadata, or supported versions change.
- Delete dead documentation. Remove stale pages, orphaned toctree entries, obsolete screenshots, outdated
  examples, old install paths, dead references, and docs for features that no longer exist.
- Verify every code/configuration example against source. Do not publish examples for APIs, TSconfig keys, CLI
  options, Fluid variables, or Composer constraints that do not exist.

Use this skill to prepare a TYPO3 14.3+ extension for its first official release, especially `1.0.0`. The goal
is not just to update version strings. The release is ready only when code, Composer metadata, documentation,
CI, security posture, and final review all agree with the public promise.

## Scope

This skill is for TYPO3 14.3 and higher only. Do not use it for v12/v13/v14 dual-compatible releases or for
extensions that still support TYPO3 14.0-14.2. For upgrade or compatibility work, hand off to `typo3-update`,
`typo3-extension-upgrade`, `typo3-rector`, or `typo3-conformance`.

Do not require or create `ext_emconf.php` in this workflow. In TYPO3 14.3+, release metadata belongs in
`composer.json`. If an existing extension still has `ext_emconf.php`, treat it as legacy metadata: migrate the
relevant release information to `composer.json`, then remove the file unless the project explicitly requires a
temporary compatibility bridge.

## Pattern Sources

The TYPO3 Patterns used by this skill come from the repository instructions and Butu's GitHub reference. Thank
you to Butu for the TYPO3 Patterns guidance that informed these release checks. Thank you to Andrej Karpathy
for the local repository instructions pattern that informs the use of `AGENTS.md`.

- Local repository instructions: `AGENTS.md` (inspired by Andrej Karpathy: https://github.com/karpathy)
- Butu on GitHub: https://github.com/butu

## Release Principles

1. State assumptions before changing files.
   Identify the target version, confirm the TYPO3 Core floor is `^14.3`, supported PHP versions, package name,
   extension key, release channel, and whether the release is GitHub-only, Packagist, TER, or all three.
2. Prefer DDEV for project execution.
   Run Composer, TYPO3 CLI, PHPStan, PHPUnit, Rector, database, and migration commands in the project
   container when DDEV exists. Avoid mixing host PHP and container PHP for one release.
3. Stabilize the environment before debugging application code.
   If local tests fail because of DDEV, certificates, database state, dependency resolution, or PHP version drift, fix the environment first.
4. Debug before change.
   For unclear behavior, inspect the request path, entry points, runtime context, TypoScript/rendering
   context, backend parity, TCA, and logs before editing code.
5. Keep changes surgical.
   Touch only what the release requires. Remove only unused code created by your own changes. Mention unrelated cleanup instead of doing it.
6. Extend before inventing.
   Prefer extending existing Partials, services, models, DTOs, configuration, CI jobs, and docs structures over creating parallel replacements.
7. Use dedicated skills for specialized work.
   Use `typo3-update`, `typo3-extension-upgrade`, `typo3-rector`, and `typo3-conformance` for
   upgrade/conformance work. Use `typo3-testing` for test infrastructure, `typo3-security` for hardening, and
   `typo3-records-list-types` when releasing or reviewing that extension.

## Initial Triage

Read these files first if they exist:

- `composer.json`
- `README.md`
- `CHANGELOG.md`
- `Documentation/`
- `.github/workflows/`
- `Build/Scripts/runTests.sh`
- `phpstan.neon*`
- `.php-cs-fixer*.php`
- `phpunit*.xml*`
- `Tests/`
- `Configuration/`
- `Resources/Private/`
- `Resources/Public/`
- `Resources/Private/Language/`

Then summarize:

- Current branch, `origin/main` status, and uncommitted changes.
- Current version metadata in `composer.json`, docs, changelog, examples, and installation commands.
- Supported TYPO3 14.3+ and PHP constraints.
- Documentation structure, README scope, stale/dead documentation, screenshots, examples, and source-backed configuration references.
- XLIFF 2.0 language files, English/German label coverage, ICU usage, and any hardcoded user-facing strings.
- Available test suites and CI lanes.
- Known release blockers or assumptions.

## Scope Guard

Before implementation, define success criteria in verifiable terms:

1. Release metadata is consistent.
   Verify with file checks and, where available, Composer validation.
2. CI and local test suites cover the claimed PHP/TYPO3 support.
   Verify through `runTests.sh`, Composer scripts, or documented project commands.
3. Docs match implemented behavior.
   Verify TYPO3 documentation structure, release examples, install commands, feature lists, screenshots,
   configuration references, README scope, and changelog entries.
4. Labels are release-ready.
   Verify XLIFF 2.0 files, ICU messages where variables/plurals/selects are needed, English and German coverage, and no hardcoded user-facing template text.
5. Final review finds no Critical or Important blockers.
   Verify by reviewing the diff against `origin/main`.
6. The release tag is created only after checks pass.
   Verify `git tag -n` and `git status`.

If a requirement is ambiguous, ask before tagging. For non-tagging edits, make the smallest defensible assumption and state it.

## TYPO3 Architecture Checks

Use these checks when preparing or reviewing release changes:

- Extension boundaries: split extensions by bounded context, not convenience. A `1.0.0` release should not hide unrelated product areas inside one package.
- UI composition: compose frontend and backend output from existing Fluid Partials and established building
  blocks. Avoid duplicated markup for identical UI structures.
- View shaping: keep simple links, labels, download outputs, and display transformations close to Fluid templates. Keep business logic in services.
- Content Blocks relations: let Content Blocks own TCA and schema for `Select` or `Collection` relation
  fields. Use `ObjectStorage<T>` in Extbase models and iterate object relations directly. Do not add raw SQL
  relation sync methods in models.
- Repository queries: use Extbase `createQuery()` for normal filtering, sorting, and object-based access. Use
  Doctrine QueryBuilder only for requirements Extbase cannot express, such as `GROUP BY`/`HAVING`, aggregate
  functions, spatial queries, or bulk updates without object loading. Explain every QueryBuilder exception.
- Backend validation: reuse a known backend admin session or saved Playwright state for backend smoke tests
  when available, then verify the relevant module or user journey.

## Release Workflow

### 1. Prepare Metadata

Check and align:

- `composer.json`: package name, title/description, license, keywords, autoload, extension metadata, PHP
  constraint, TYPO3 Core `^14.3` constraint, required TYPO3 system extensions, dev tool constraints, and
  classic-mode metadata.
- Documentation metadata: version switcher files, examples, install snippets, badges, and docs root metadata.
- Localization metadata: XLIFF 2.0 files, English and German labels, ICU message syntax, label domains, and language file paths.
- `CHANGELOG.md`: date, version, public summary, breaking changes, upgrade notes, security notes, and contributors if applicable.
- README and GitHub About text: public value proposition, supported TYPO3/PHP versions, feature teaser, install command, and repository topics.

Prefer one source of truth for the extension version and update generated or repeated examples consistently.

For a TYPO3 14.3+ release without `ext_emconf.php`, `composer.json` must carry the extension metadata:

```json
{
  "name": "vendor/my-extension",
  "type": "typo3-cms-extension",
  "description": "My Extension - Short public description",
  "license": "GPL-2.0-or-later",
  "require": {
    "php": "^8.2",
    "typo3/cms-core": "^14.3"
  },
  "autoload": {
    "psr-4": {
      "Vendor\\MyExtension\\": "Classes/"
    }
  },
  "extra": {
    "typo3/cms": {
      "extension-key": "my_extension",
      "version": "1.0.0",
      "Package": {
        "providesPackages": {}
      }
    }
  }
}
```

Composer metadata rules:

- `name` uses the Composer package name, normally `<vendor>/<dashed-extension-key>`.
- `type` must be `typo3-cms-extension`.
- `description` replaces the old title/description metadata; use `Title - Description` when a separate extension title is useful.
- `license` should be a TYPO3-compatible GPL expression for public TYPO3 extensions.
- `require.php` must match **tested** support, not aspirational support. A reusable extension may
  legitimately declare `^8.2` — the TYPO3 v14 Core floor — and a wider tested range is a feature
  when publishing to TER or Packagist. Raise it only if the code uses newer PHP features, and only
  with a CI job that proves the claim.
- This differs from project and site work, which targets **PHP 8.4 as standard** (8.5 where the
  whole dependency set resolves). `typo3-14-update` owns that policy; do not copy a project's 8.4
  floor into a reusable package without a reason, and do not copy this `^8.2` into a project.
- `require.typo3/cms-core` must be `^14.3` or a later TYPO3 14-only range. Do not use `^14.0`, `^14.1`, or `^14.2` for this release workflow.
- Add direct TYPO3 system extension dependencies in `require`, for example `typo3/cms-backend`,
  `typo3/cms-extbase`, or `typo3/cms-fluid`, when the extension directly uses them.
- `extra.typo3/cms.extension-key` is required and must match the extension key.
- `extra.typo3/cms.version` must match the release tag for classic-mode installations, for example `1.0.0` for tag `v1.0.0`.
- `extra.typo3/cms.Package.providesPackages` must exist for classic-mode compatibility, even when it is an empty object.

### 2. Harden Tooling and CI

Check the project-supported commands first. Common gates:

```bash
ddev composer validate --strict
ddev composer normalize --dry-run
ddev Build/Scripts/runTests.sh -s unit
ddev Build/Scripts/runTests.sh -s functional
ddev Build/Scripts/runTests.sh -s phpstan
ddev Build/Scripts/runTests.sh -s cgl
```

Adapt commands to the project. Verify the CI matrix and local runner support the PHP versions promised by
`composer.json`. For PHP 8.5 claims, ensure PHPUnit, PHPStan, PHP-CS-Fixer, TYPO3 testing framework, and
Composer constraints are actually compatible rather than just adding a matrix entry.

Coverage and mutation checks are release signals, not decoration. If coverage reports are required, make the
coverage driver guard explicit so CI fails with a useful message when Xdebug/PCOV is missing.

### 3. Verify Behavior

Match tests to risk:

- Unit tests for pure PHP logic, validators, value objects, DTOs, and formatting.
- Functional tests for repositories, TCA, database behavior, Extbase persistence, DataHandler, and workspaces/language behavior.
- Architecture or conformance tests for dependency direction, forbidden APIs, and layer boundaries.
- Playwright or backend smoke tests for backend modules, custom Records views, accessibility-sensitive UI, and editor workflows.

Do not claim "verified" without command output or a clear statement that verification could not be run.

### 4. Verify Localization

Treat localization as part of release readiness:

- Use XLIFF 2.0 for TYPO3 14.3+ extension labels.
- Provide English source labels and German target labels.
- Use ICU messages for labels with variables, pluralization, select-like variants, or context-sensitive grammar.
- Check that English and German labels are easy to understand for editors and administrators. Prefer plain,
  task-oriented backend wording over internal implementation terms.
- Search Fluid templates, PHP classes, JavaScript modules, TSconfig, Page TSconfig, TypoScript, and YAML for hardcoded user-facing strings.
- Replace hardcoded template text with `LLL:` references or Fluid translation ViewHelpers.
- Keep purely technical identifiers, array keys, CSS classes, route names, and machine-readable values out of
  translation files unless they are displayed to users.
- Verify language files are loaded from stable extension paths such as `EXT:my_extension/Resources/Private/Language/`.

Common checks:

```bash
rg -n '>[A-Z][^<{]*<' Resources/Private --glob '*.html'
rg -n 'title|label|description|message|button|placeholder|aria-label' Classes Configuration Resources --glob '*.{php,html,typoscript,tsconfig,yaml,yml,js}'
rg -n 'version="1.2"|xliff version="1.2"' Resources/Private/Language
rg -n '\\{[^}]+,\\s*(plural|select),' Resources/Private/Language
```

### 5. Security and Conformance Pass

Review the diff and changed behavior for:

- No exposed secrets, tokens, synthetic secrets that trigger push protection, or local-only paths.
- No unsafe shell execution, remote code execution, unserialize risks, path traversal, XXE, SQL injection, or XSS in changed scope.
- TYPO3 CSRF/FormProtection and backend route access checks where write actions are involved.
- Correct escaping in Fluid and no unsafe `f:format.raw` unless justified.
- No hardcoded user-facing text in Fluid, PHP, JavaScript, or configuration when it should use XLIFF 2.0 labels.
- CSP-safe backend/frontend assets and ES module usage for TYPO3 14.3+.
- No deprecated or removed APIs for the supported Core versions.
- No release constraints that promise unsupported PHP/TYPO3 combinations.

### 6. Deep Documentation and Public Release Check

Treat documentation as a release artifact. Use `typo3-docs` for detailed documentation work and follow docs.typo3.org conventions.

Documentation structure checks:

- `Documentation/Index.rst` exists and is the main entry point.
- Every subdirectory has an `Index.rst` when it contains documentation pages.
- Toctrees link only live pages; no orphaned or unreachable docs remain.
- Section anchors exist for important pages and cross-references.
- Headings use sentence case and a consistent hierarchy.
- `.editorconfig` exists for `Documentation/` when the extension maintains rendered TYPO3 docs.
- `guides.xml` or equivalent docs configuration is current when the project publishes to docs.typo3.org.

TYPO3 documentation style checks:

- Use TYPO3 RST roles and directives instead of plain prose where structure matters.
- Use `confval` for TSconfig, TypoScript, YAML, Composer, or extension configuration references.
- Use `literalinclude` for longer examples that should stay tied to source files.
- Use `code-block` with captions only for short snippets.
- Use `note`, `tip`, `important`, or `warning` for release-relevant caveats.
- Use screenshots for backend modules and editor workflows, with `:alt:` text and lightbox-style figure directives where supported.

Content accuracy checks:

- Installation works for the release channel: tagged Composer package, VCS repository, Packagist, or TER.
- Composer commands, extension key, namespaces, paths, version numbers, and package names are current.
- Feature docs describe implemented behavior, not planned behavior.
- Configuration references match real TSconfig, TypoScript, YAML, PHP attributes, services, settings, and defaults.
- CLI command examples match the actual Symfony command names, options, defaults, and descriptions.
- Fluid examples use current variable names, ViewHelpers, Partials, and XLIFF labels.
- Screenshots reflect the current backend UI and TYPO3 Styleguide styling.
- Known limitations are explicit and still true.

Dead documentation cleanup:

- Delete stale pages for removed features instead of leaving "legacy" docs in the release manual.
- Remove old screenshots that no longer match the backend UI.
- Remove dead links, obsolete install methods, old TER/Packagist commands, and outdated version badges.
- Remove duplicated README/manual sections when one source can link to the other.
- Remove generated docs artifacts from source control unless the project intentionally tracks them.

README checks:

- README states the value proposition in the first screen.
- README lists supported TYPO3 `14.3+` and tested PHP versions.
- README installation commands match the tagged package name and release channel.
- README quick start is short and links into `Documentation/` for detailed configuration.
- README feature teaser matches implemented behavior.
- README does not contain stale roadmap, TODO, unreleased feature claims, or dead examples.
- README links to docs, changelog, issues, and release notes where appropriate.

Useful checks:

```bash
find Documentation -type f | sort
find Documentation -type f \( -name '*.rst' -o -name '*.md' \) -print0 | xargs -0 rg -n 'TODO|FIXME|WIP|coming soon|planned|deprecated|ext_emconf|14\.[012]'
rg -n 'v?0\.|dev-main|master|TODO|coming soon|planned' README.md Documentation CHANGELOG.md
rg -n 'composer require|typo3/cms-core|extension-key|Package|providesPackages' README.md Documentation composer.json
```

If docs tooling exists, run it:

```bash
scripts/validate_docs.sh .
scripts/render_docs.sh .
```

If those scripts do not exist, document the fallback checks that were actually run.

### 7. Final Review Before Tagging

Before creating or pushing a tag, perform a strict review against `origin/main`. If the
`requesting-code-review` skill from the Superpowers skill framework (obra/superpowers by Jesse Vincent) is
available, use it to request an independent reviewer. If no subagent is available, do the same review
yourself.

Use this reviewer brief:

```text
You are a Senior Code Reviewer with expertise in TYPO3 14.3+ extension architecture, PHP 8.4/8.5 compatibility, PHPUnit/PHPStan/PHP-CS-Fixer tooling, CI, security, accessibility, and release readiness.

Review completed work against requirements and identify issues before release. Do not edit files. Return findings only, with precise file:line references and severity.

Check:
- Plan alignment and problematic deviations.
- TYPO3 conformance: metadata, versioning, extension architecture, TYPO3 14.3+/PHP compatibility, deprecations, and behavior-specific docs.
- Testing/tooling: CI matrix, PHP version assumptions, runTests.sh suites, coverage guards, memory limits, PHPStan, PHP-CS-Fixer, and PHPUnit constraints.
- Security: unsafe shell, secrets, RCE, SQL injection, XSS, CSRF, exposed credentials, and unsafe Composer instability.
- Localization: XLIFF 2.0, ICU messages where needed, English/German label coverage and readability, and no hardcoded user-facing template text.
- Documentation: TYPO3 RST structure, README scope, source-backed examples, current screenshots, dead-doc removal, and rendered-doc validation when tooling exists.
- Release readiness: composer.json metadata, changelog, tag, README, docs, Packagist/TER/GitHub release consistency.

Output:
### Strengths
### Issues
#### Critical (Must Fix)
#### Important (Should Fix)
#### Minor (Nice to Have)
For each issue: file:line, what is wrong, why it matters, how to fix.
### Recommendations
### Assessment
Ready to merge? Yes | No | With fixes. Include concise reasoning.
```

Fix Critical issues immediately. Fix Important issues before tagging unless the user explicitly accepts the risk. Minor issues can be deferred if documented.

### 8. Tag Only After Verification

Use the project convention for release tags, usually:

```bash
git fetch origin
git diff --stat origin/main...HEAD
git status --short
git tag -a v1.0.0 -m "Release v1.0.0"
git tag -n v1.0.0
```

Do not create a tag if the review is unresolved, required tests failed, or release metadata is inconsistent.
If a tag was created too early, treat it as a release incident: stop, explain the state, and ask before
deleting or moving tags.

## Required Output

For release execution, end with:

- Version prepared.
- Files changed.
- Verification commands run and their result.
- Review outcome by severity.
- Tag status.
- Remaining risks or manual release steps.

For review-only requests, return findings first, ordered by severity, with exact `file:line` references. If no issues are found in a severity, say `None found`.
