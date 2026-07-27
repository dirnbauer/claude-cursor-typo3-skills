# SonarCloud for TYPO3 Extensions

> Continuous code quality and security analysis for PHP/TYPO3 projects

## Overview

SonarCloud provides automated code analysis for TYPO3 extensions:
- **200+ PHP rules** for bugs, vulnerabilities, and code smells
- **Coverage tracking** with visual reports
- **PR decoration** for immediate feedback
- **Quality gates** to enforce standards
- **Free for open-source** projects

## Two Analysis Modes — Pick the Right Config File

SonarCloud runs in one of **two mutually exclusive modes**, and they read **different
config files**. Editing the wrong one is a silent no-op:

| Mode | How it runs | Config file |
|------|-------------|-------------|
| **CI-based analysis** | You run the scanner (the GitHub Action below) | `sonar-project.properties` |
| **Automatic Analysis** | SonarCloud analyses the repo itself on push/PR — no Action, no scanner | **`.sonarcloud.properties`** |

Automatic Analysis is the **zero-config default** when you import a repo and never add
a scanner step. If your project uses it (no `SonarSource/*` action in the workflows),
then **`sonar-project.properties` is ignored** — all the CI-based config in this
document does nothing. Use the section below instead.

## Automatic Analysis (`.sonarcloud.properties`)

Put a `.sonarcloud.properties` at the **repo root**. It honours `sonar.exclusions`,
`sonar.cpd.exclusions`, and friends:

```properties
# .sonarcloud.properties  (Automatic Analysis ONLY — NOT sonar-project.properties)

# Exclude vendored/minified assets and Fluid templates from analysis entirely.
# Fluid partials are HTML *fragments*, not documents — SonarCloud's Web/HTML rules
# raise false positives (missing DOCTYPE / <html lang> / <title>) that can drag the
# Reliability rating to C on otherwise-clean code.
sonar.exclusions=Resources/Public/JavaScript/Vendor/**,Resources/Private/Templates/**,Resources/Private/Partials/**,Resources/Private/Layouts/**

# Copy-paste detection: exclude things that are repetitive by nature.
# Fix duplication in *real source* by refactoring (DRY) — do NOT blanket-exclude it.
sonar.cpd.exclusions=Resources/Public/JavaScript/Vendor/**,Resources/Private/Templates/**,Resources/Private/Language/**,Tests/**
```

### TYPO3 gotchas

- **Duplication on new code → DRY, not exclusion.** A 5%+ duplication finding from
  near-identical controller loops or repeated query blocks is fixed by extracting a
  shared helper, not by adding the source path to `cpd.exclusions`. Reserve exclusions
  for generated/vendored code, XLIFF, and tests.
- **Fluid templates** belong in `sonar.exclusions` (see above) — the Web/HTML ruleset
  does not understand partials.
- **XLIFF** (`Resources/Private/Language/**`) and **`Tests/**`** belong in
  `cpd.exclusions` — both are legitimately repetitive.

### Verify from the CLI (public projects need no auth)

For a **public** project, SonarCloud's web API is open — check the gate and issues for
a PR without a token (useful for confirming a fix before relying on the PR decoration):

```bash
# Unresolved issues on a PR (severity + rule + file)
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=ORG_PROJECT&pullRequest=PR&resolved=false&ps=50"

# Quality Gate status for a PR
curl -s "https://sonarcloud.io/api/qualitygates/project_status?projectKey=ORG_PROJECT&pullRequest=PR"
```

### Annotations are not the gate

Automatic Analysis surfaces **every** issue — including CRITICAL-severity code smells
(e.g. `php:S1192` duplicated literals, `php:S3011` `setAccessible()` in tests) — as a
GitHub Checks **annotation**, *regardless* of whether the Quality Gate passes. A
`failure`-level annotation is **not** the same as a failed gate. The **Quality Gate**
(its configured new-code conditions) is the merge bar; non-gate code-smell annotations
do not block a merge. Don't treat a passing-gate-with-annotations PR as "broken".

## Don't SAST-edit template-synced files (exclude them instead)

`Build/Scripts/runTests.sh` — and the other files an extension syncs from this
`typo3-testing` skill's `assets/` (the test-runner template, `Build/playwright/**`,
PHPUnit/PHPStan/rector configs) — are **upstream-owned template files**. A downstream
extension should **never** apply cosmetic SonarCloud/static-analysis fixes to them in
place (e.g. `php:S100`/shell-naming renames, `S7684`, variable-style tweaks). Such edits
diverge the local copy from this template and cause drift and merge conflicts on the next
template sync — for a finding that was never the downstream repo's to fix.

Instead, **exclude template-synced paths from analysis** so the findings never reach the
PR in the first place:

```properties
# Automatic Analysis → .sonarcloud.properties
# CI-based analysis  → sonar-project.properties
sonar.exclusions=**/Build/Scripts/runTests.sh,**/Build/playwright/**

# Or scope-suppress specific rules on the synced file rather than rewriting it:
sonar.issue.ignore.multicriteria=e1
sonar.issue.ignore.multicriteria.e1.ruleKey=php:S100
sonar.issue.ignore.multicriteria.e1.resourceKey=**/Build/Scripts/runTests.sh
```

Fix the finding **upstream** in this skill's `assets/` template if it is genuinely worth
fixing, then re-sync — that keeps every downstream copy identical. (Real instance: a
2026-06-27 SonarCloud sweep renamed shell functions in a downstream `runTests.sh`,
diverging it from this template.)

## Quick Start

### 1. Sign Up

1. Go to [sonarcloud.io](https://sonarcloud.io)
2. Sign in with GitHub
3. Create/join organization
4. Import your TYPO3 extension repository

### 2. Create Configuration

Add `sonar-project.properties` to your extension root:

```properties
sonar.projectKey=your-org_your-extension
sonar.organization=your-org

# TYPO3 Extension Structure
sonar.sources=Classes
sonar.tests=Tests
sonar.exclusions=**/vendor/**,.Build/**,var/**

# PHP Settings
sonar.php.version=8.2
sonar.php.coverage.reportPaths=var/log/coverage.xml
sonar.php.phpstan.reportPaths=var/log/phpstan.json

# Quality Gate
sonar.qualitygate.wait=true
```

### 3. Add GitHub Action

Create `.github/workflows/sonarcloud.yml`:

```yaml
name: SonarCloud

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  sonarcloud:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          coverage: xdebug
          extensions: intl, pdo_sqlite

      - name: Install dependencies
        run: |
          composer require --dev typo3/testing-framework
          composer install --no-progress

      - name: Run tests with coverage
        run: |
          vendor/bin/phpunit \
            -c Build/phpunit/UnitTests.xml \
            --coverage-clover var/log/coverage.xml

      - name: Export PHPStan results
        run: |
          vendor/bin/phpstan analyze \
            --configuration Build/phpstan.neon \
            --error-format=json \
            --no-progress \
            > var/log/phpstan.json || true

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### 4. Add Secret

1. Go to repository Settings → Secrets → Actions
2. Add `SONAR_TOKEN` from SonarCloud (Account → Security)

## TYPO3-Specific Configuration

### Full Configuration Example

```properties
sonar.projectKey=netresearch_my-typo3-extension
sonar.organization=netresearch
sonar.projectName=My TYPO3 Extension
sonar.projectVersion=1.0.0

# Source directories (TYPO3 extension structure)
sonar.sources=Classes,Configuration,Resources
sonar.tests=Tests

# Exclusions
sonar.exclusions=\
  **/vendor/**,\
  .Build/**,\
  var/**,\
  Resources/Public/JavaScript/Libs/**,\
  **/*.min.js,\
  **/*.min.css

# Test exclusions (don't analyze test code for coverage)
sonar.test.exclusions=Tests/**

# Coverage exclusions (files not to measure coverage for)
sonar.coverage.exclusions=\
  Configuration/**,\
  Resources/**,\
  ext_emconf.php,\
  ext_localconf.php,\
  ext_tables.php

# PHP configuration
sonar.php.version=8.2
sonar.php.coverage.reportPaths=var/log/coverage.xml
sonar.php.phpstan.reportPaths=var/log/phpstan.json
sonar.php.tests.reportPath=var/log/junit.xml

# Encoding
sonar.sourceEncoding=UTF-8

# Quality gate
sonar.qualitygate.wait=true
```

### Integration with runTests.sh

If using TYPO3's standard test runner:

```yaml
- name: Run tests with coverage
  run: |
    Build/Scripts/runTests.sh -s unit -x
    mv .Build/var/log/phpunit/coverage.xml var/log/coverage.xml
```

### Multi-TYPO3-Version Testing

```yaml
strategy:
  matrix:
    typo3: ['12.4', '13.0']
    php: ['8.2', '8.3']

steps:
  - name: Install TYPO3 ${{ matrix.typo3 }}
    run: |
      composer require "typo3/cms-core:^${{ matrix.typo3 }}" --no-update
      composer update --no-progress

  - name: Run tests
    run: vendor/bin/phpunit -c Build/phpunit/UnitTests.xml --coverage-clover coverage.xml

  # Only upload to SonarCloud once (main combination)
  - name: SonarCloud Scan
    if: matrix.typo3 == '13.0' && matrix.php == '8.2'
    uses: SonarSource/sonarcloud-github-action@master
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## PHPStan Integration

### Export PHPStan Results

```bash
# Generate JSON report for SonarCloud
vendor/bin/phpstan analyze \
  --configuration Build/phpstan.neon \
  --error-format=json \
  --no-progress \
  > var/log/phpstan.json
```

### Configuration

```properties
# sonar-project.properties
sonar.php.phpstan.reportPaths=var/log/phpstan.json
```

SonarCloud imports PHPStan issues and displays them alongside its own analysis.

## Coverage Configuration

### PHPUnit Coverage

```xml
<!-- Build/phpunit/UnitTests.xml -->
<phpunit>
    <coverage>
        <report>
            <clover outputFile="var/log/coverage.xml"/>
        </report>
    </coverage>
    <source>
        <include>
            <directory>Classes</directory>
        </include>
        <exclude>
            <directory>Classes/ViewHelpers</directory>
        </exclude>
    </source>
</phpunit>
```

### Functional Test Coverage

```yaml
- name: Run functional tests with coverage
  run: |
    export typo3DatabaseDriver=pdo_sqlite
    vendor/bin/phpunit \
      -c Build/phpunit/FunctionalTests.xml \
      --coverage-clover var/log/coverage-functional.xml

- name: Merge coverage reports
  run: |
    # Use phpcov or merge manually
    vendor/bin/phpcov merge var/log/ --clover var/log/coverage.xml
```

## Quality Gates

### Recommended Gate for TYPO3 Extensions

| Condition | Threshold | Rationale |
|-----------|-----------|-----------|
| New bugs | 0 | No new bugs in PRs |
| New vulnerabilities | 0 | Security first |
| Coverage on new code | ≥80% | TYPO3 best practice |
| Duplicated lines | ≤3% | DRY principle |
| Maintainability rating | A | Clean code |

### Custom Gate Setup

1. Go to SonarCloud → Your Project → Project Settings → Quality Gates
2. Create new gate or copy "Sonar Way"
3. Adjust thresholds for TYPO3 requirements

### Gotchas: new-code duplication and coverage pull against each other

- **"New-code duplication" counts pre-existing duplication on lines you touch.**
  A mechanical sweep that edits many lines (e.g. converting `createMock()` → `createStub()`
  across the test suite) makes SonarCloud attribute the *surrounding* duplicated test
  scaffolding to the PR as "new code", so a green project can suddenly fail
  `new_duplicated_lines_density`. Fix it by factoring the repeated setup (mock wiring,
  fixtures) into private helpers — not by reverting the original change.
- **De-duplicating tests can drop the coverage gate — but only when it removes exercised
  paths.** *Pure* extraction of shared mock setup into helpers/traits does NOT change
  coverage: test files are excluded from coverage metrics and the same production lines
  still run. Coverage drops when the consolidation also *merges distinct scenarios* (so a
  production branch is no longer exercised in any test) or *deletes* redundant test cases.
  The local gate is usually *unit*-only (`phpunit -c Build/phpunit/UnitTests.xml`), so
  re-check it after a dedup sweep and recover by adding unit tests for methods previously
  only *functionally* covered (e.g. thin repository wrappers) — don't lower the gate.
- **Locate the duplicated blocks instead of guessing.** The gate reports a percentage, not
  a location. Ask the API which line ranges are duplicated, then dedupe exactly those:

  ```bash
  curl -s "https://sonarcloud.io/api/duplications/show?key=ORG_PROJECT%3Apath/to/File.php&pullRequest=PR" \
    | jq '.duplications[].blocks | map("\(.from)-\(.from + .size - 1)")'
  ```

  Blocks repeated 6–10× across a test family are common; the few lines you added inside one
  of them are what the gate attributes to your PR.
- **Fixing the gate once does not keep it fixed.** As long as the surrounding blocks stay
  duplicated, the *next* commit that adds a line inside them trips the gate again — the
  percentage is recomputed per push against the new code of that push. Dedupe the region
  rather than trimming your addition, and re-read the gate after every subsequent push
  instead of assuming the earlier fix still holds.
- **The dedup fix trades duplication for other smells — check for them in the same pass.**
  Collapsing 6–10 repeated arrangements into one helper concentrates every varying value
  into its signature, which reliably produces `php:S107` (more than 7 parameters) and
  `php:S3776` (cognitive complexity above 15). Both are MAJOR code smells that pass the
  gate but ship in the diff. Keep the helper at ≤7 parameters — group rarely-used trailing
  arguments into one options array, and drop any parameter another already determines —
  and move branching out of the helper body into small private methods.

## PR Decoration

SonarCloud automatically comments on PRs:

```
┌──────────────────────────────────────────────┐
│ Quality Gate passed                          │
├──────────────────────────────────────────────┤
│ Coverage: 85.2% (+3.1%)                     │
│                                              │
│ 0 Bugs                                       │
│ 0 Vulnerabilities                            │
│ 3 Code Smells (1 new)                       │
│ 0.8% Duplication                            │
└──────────────────────────────────────────────┘
```

## Badges

Add to your extension's README:

```markdown
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=your-org_your-extension&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=your-org_your-extension)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=your-org_your-extension&metric=coverage)](https://sonarcloud.io/summary/new_code?id=your-org_your-extension)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=your-org_your-extension&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=your-org_your-extension)
```

## Common PHP Rules

SonarCloud catches TYPO3-relevant issues:

| Rule | Example | Severity |
|------|---------|----------|
| SQL Injection | Raw SQL without prepared statements | 🔴 Critical |
| XSS | Unescaped output in templates | 🔴 Critical |
| Hardcoded credentials | Passwords in code | 🔴 Critical |
| Deprecated API | `$GLOBALS['TYPO3_DB']` usage | 🟡 Major |
| Unused code | Dead methods, variables | 🟢 Minor |
| Complexity | Methods >20 cyclomatic complexity | 🟡 Major |
| Duplication | Copy-pasted code blocks | 🟢 Minor |

## Comparison with PHPStan

| Feature | SonarCloud | PHPStan |
|---------|------------|---------|
| Type analysis | Basic | ⭐⭐⭐⭐⭐ |
| Security rules | ⭐⭐⭐⭐⭐ | Basic |
| Coverage tracking | ✅ | ❌ |
| PR decoration | ✅ | ❌ |
| Quality gates | ✅ | ❌ |
| TYPO3-specific | Basic | ⭐⭐⭐⭐⭐ (with phpstan-typo3) |
| Code smells | ⭐⭐⭐⭐⭐ | ❌ |
| Duplication | ✅ | ❌ |

**Recommendation**: Use **both** - PHPStan for deep type analysis, SonarCloud for holistic quality view.

## Troubleshooting

### Coverage Not Showing

1. Verify coverage file exists and has content:
   ```bash
   cat var/log/coverage.xml | head -20
   ```

2. Check path in sonar-project.properties matches actual location

3. Ensure source files in coverage match `sonar.sources` paths

### PHPStan Results Not Imported

1. Verify JSON format:
   ```bash
   cat var/log/phpstan.json | jq .
   ```

2. Check file path in configuration

3. Run PHPStan with `|| true` to not fail on errors

### Quality Gate Failing

1. Check SonarCloud dashboard for specific failures
2. Review new code metrics (not overall)
3. Fix issues or adjust gate thresholds

### Scan Taking Too Long

Add exclusions for generated/vendor code:
```properties
sonar.exclusions=**/vendor/**,.Build/**,var/**,node_modules/**
```

## Best Practices

1. **Run locally first**: Test configuration before CI
   ```bash
   docker run --rm -v $(pwd):/usr/src sonarsource/sonar-scanner-cli
   ```

2. **Focus on new code**: Use quality gates on new code, not legacy

3. **Integrate PHPStan**: Import PHPStan results for comprehensive analysis

4. **Regular reviews**: Check security hotspots weekly

5. **Team onboarding**: Share SonarCloud access with all developers

## Resources

- [SonarCloud PHP Documentation](https://docs.sonarcloud.io/advanced-setup/languages/php/)
- [PHP Rules](https://rules.sonarsource.com/php/)
- [GitHub Actions Integration](https://docs.sonarcloud.io/advanced-setup/ci-based-analysis/github-actions-for-sonarcloud/)
- [TYPO3 Testing Best Practices](https://docs.typo3.org/m/typo3/reference-coreapi/main/en-us/Testing/Index.html)
