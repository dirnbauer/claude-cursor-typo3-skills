# Development Environment Conformance

**Purpose:** How this skill scores an extension's local dev-environment setup during a conformance audit. For how to set up or use DDEV itself, see the `typo3-ddev` skill — it is the single owner of DDEV setup/config mechanics, this file does not duplicate it.

## DDEV Setup — See `typo3-ddev`

- `.ddev/config.yaml` fields, PHP/database version matrix — `quickstart.md`, `0003-php-version-management.md`
- Custom DDEV commands, multi-version local testing, database snapshots — `advanced-options.md`
- DDEV troubleshooting (empty `.devcontainer/`, missing `.ddev/.gitignore`, wrong project type) — `troubleshooting.md`

## Detecting the Environment Type

```bash
if [ -f ".ddev/config.yaml" ]; then
    DEV_ENV="ddev"; SCORE=20
elif [ -f "docker-compose.yml" ]; then
    DEV_ENV="docker-compose"; SCORE=15
elif [ -f ".devcontainer/devcontainer.json" ]; then
    DEV_ENV="devcontainer"; SCORE=10
else
    DEV_ENV="none"; SCORE=0
fi
```

## Validating Configuration Against the Extension

For DDEV, cross-check `.ddev/config.yaml` against `composer.json` rather than trusting either file in isolation — mismatches are the actual finding, not the presence of a config file:

```bash
MIN_PHP=$(jq -r '.require.php' composer.json | grep -oE '[0-9]+\.[0-9]+' | head -1)
WEB_DIR=$(jq -r '.extra.typo3.cms."web-dir"' composer.json)

DDEV_PHP=$(grep 'php_version:' .ddev/config.yaml | awk '{print $2}' | tr -d '"')
DDEV_DOCROOT=$(grep 'docroot:' .ddev/config.yaml | awk '{print $2}')
DDEV_TYPE=$(grep 'type:' .ddev/config.yaml | awk '{print $2}')

[ "${DDEV_PHP}" != "${MIN_PHP}" ] && echo "⚠️  PHP version mismatch: DDEV ${DDEV_PHP} vs required ${MIN_PHP}"
[ "${DDEV_DOCROOT}" != "${WEB_DIR}" ] && echo "⚠️  Docroot mismatch: DDEV ${DDEV_DOCROOT} vs composer ${WEB_DIR}"
[ "${DDEV_TYPE}" != "typo3" ] && echo "❌ DDEV type should be 'typo3', found '${DDEV_TYPE}'"
```

## Scoring (Best Practices component, out of 20)

| Component | Max Points | DDEV | Docker Compose | None |
|-----------|-----------|------|----------------|------|
| Dev environment exists | 6 | 6 | 4 | 0 |
| Configuration correct (type/docroot/PHP match composer.json) | 4 | 4 | 3 | 0 |
| Version matching (PHP, database) | 3 | 3 | 2 | 0 |
| Documentation (README mentions setup) | 2 | 2 | 1 | 0 |
| Custom commands / enhancements | 2 | 2 | 0 | 0 |
| Other best practices | 3 | 3 | 3 | 3 |
| **Total** | **20** | **20** | **13** | **3** |

**Deductions:** no dev environment (High, -6), PHP version mismatch (High, -3), docroot mismatch (High, -3), wrong `type` (Medium, -2), missing custom commands (Low, -1), no documentation (Low, -1).

## Report Findings Template

```markdown
- ❌ No development environment configuration
  - Missing: .ddev/config.yaml, docker-compose.yml
  - Severity: Medium
  - Recommendation: add DDEV configuration (see typo3-ddev skill)

- ⚠️  DDEV PHP version mismatch
  - Current: php_version: "7.4"  Expected: "8.2" (from composer.json)
  - Severity: High
```
