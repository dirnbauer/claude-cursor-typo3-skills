---
name: "typo3-conformance"
description: "Use when assessing TYPO3 extension quality, conformance checking, standards compliance, modernization to v12/v13/v14 (v14.3 LTS is the default/gold standard), TER readiness, or best practices review. Also triggers on: extension audit, quality score, full assessment, fix all findings, conformance audit, Fluid 5 strict ViewHelpers, ext_tables.php removal, Extbase attributes (Authorize/RateLimit), HashService removal, Bootstrap 5 migration, CSP compliance, ViewHelper security, XLIFF hygiene, PHP 8.4/8.5 compat."
---

# TYPO3 Extension Conformance Checker

Evaluate TYPO3 extensions against TYPO3 coding standards, architecture patterns, and best practices.

## When to Use

- Extension quality / TER readiness
- Scored conformance reports
- Modernization to v12/v13/v14 (**v14.3 LTS is default/gold standard**)

## Delegation

Testing -> `typo3-testing` | Docs -> `typo3-docs` | OpenSSF -> `enterprise-readiness`

**Scope:** extensions only. **Site/project** repos (`type: project` + Compose) — score with the gold checker [`typo3-14-gold`](https://git.netresearch.de/typo3/typo3-14-gold)`/tools/conformance`.

## Workflow

### Step 0: Context

Read ext_emconf.php + composer.json for version, type, scope.

### Steps 1-11: Checks

1. **Metadata** -- key, TYPO3 version, type
2. **Structure** -- composer.json, ext_emconf.php, Classes/, Configuration/, Resources/
3. **Coding** -- strict_types, PSR-12, PHP 8.4 explicit nullable, PHP 8.5 float-to-int
4. **Prohibited** -- no `$GLOBALS`, no `GeneralUtility::makeInstance()` for services
5. **Architecture** -- constructor DI, Services.yaml, PSR-14 events (try/catch), PSR-3 logging (LoggerAware+NullLogger), factory fallback
6. **Backend** -- ES6, Modal API, CSRF, CSP (v13+)
7. **Testing** -- PHPUnit, Playwright E2E, coverage >70%
8. **Practices** -- DDEV, runTests.sh, CI/CD
9. **TER** -- publish workflow, upload comment
10. **Audit** -- PHPStan baseline, TCA searchFields, XLIFF, cache has()+get(), query properties, multi-version adapters
11. **v14 readiness** -- no `ext_tables.php`/`HashService`/magic finders; Fluid VHs strict; XLF 2-space. See `references/v14-deprecations.md`.

### Step 12: Verify

Re-run after fixes. Document score delta.

## Quick Grep Recipes

```bash
grep -rL 'strict_types' Classes/ --include='*.php'
grep -rn '\$GLOBALS' Classes/ --include='*.php'
grep -rn 'GeneralUtility::makeInstance' Classes/ --include='*.php'
grep -rPn '\(\s*[A-Za-z\\]+\s+\$\w+\s*=\s*null' Classes/ --include='*.php' | grep -v '?'  # PHP 8.4 implicit nullable
grep -rn '->has(' Classes/ --include='*.php'                          # cache has()+get() anti-pattern
grep -l 'strict_types' ext_emconf.php                                 # ext_emconf must NOT have strict_types
grep -rn '(int)\s*\$' Classes/ --include='*.php'                      # PHP 8.5 implicit float-to-int
grep -rn 'data-toggle\|data-dismiss\|data-ride' Resources/ --include='*.html'  # Bootstrap 4 in Fluid
grep -rn 'HashService\|GeneralUtility::hmac(\|->findBy[A-Z]\|->findOneBy[A-Z]\|->countBy[A-Z]' Classes/ --include='*.php'  # v14 removals
[ -f ext_tables.php ] && echo "WARN: ext_tables.php deprecated (#109438)"   # v14.3 deprecation
```

## Scoring

**Base (0-100):** Architecture(20) + Guidelines(20) + PHP(20) + Testing(20) + Practices(20). Excellence bonus up to 22. Critical issues block regardless.

| Range | Level | Action |
|-------|-------|--------|
| 90+ | Excellent | Production/TER ready |
| 80-89 | Good | Minor fixes |
| 70-79 | Acceptable | Fix before release |
| 50-69 | Needs Work | Significant effort |
| <50 | Critical | Block deployment |

## References

See `references/`:

- **Architecture & code:** `extension-architecture.md`, `directory-structure.md`, `php-architecture.md`, `coding-guidelines.md`, `best-practices.md`, `hooks-and-events.md`
- **Validation:** `composer-validation.md`, `ext-emconf-validation.md`, `ext-files-validation.md`, `runtests-validation.md`, `version-requirements.md`, `testing-standards.md`
- **Multi-version:** `dual-version-compatibility.md`, `v13-v14-dual-compatibility.md`, `multi-version-dependency-compatibility.md`, `v13-deprecations.md`, `v14-deprecations.md`
- **Practices & backend:** `development-environment.md`, `backend-module-v13.md`, `ter-publishing.md`, `report-template.md`, `excellence-indicators.md`, `localization-coverage.md`, `crowdin-integration.md`

Asset templates in `assets/Build/`: PHPStan, PHP-CS-Fixer, Rector, ESLint, Stylelint, TypoScript lint.

---

## Credits & Attribution

This skill is based on the excellent work by
**[Netresearch DTT GmbH](https://www.netresearch.de/)**.

Original repository: https://github.com/netresearch/typo3-conformance-skill

**Copyright (c) Netresearch DTT GmbH** — Methodology and best practices (MIT / CC-BY-SA-4.0)

Special thanks to [Netresearch DTT GmbH](https://www.netresearch.de/) for their generous open-source contributions to the TYPO3 community, which helped shape this skill collection.
Adapted by webconsulting.at for this skill collection
