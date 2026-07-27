# DDEV Testing for TYPO3 Extensions

DDEV setup and local-environment mechanics are owned by the `typo3-ddev` skill, not this one. See its `references/`:

- `.ddev/config.yaml` setup and PHP/database version matrix -- [`quickstart.md`](https://github.com/netresearch/typo3-ddev-skill/blob/main/skills/typo3-ddev/references/quickstart.md), [`0003-php-version-management.md`](https://github.com/netresearch/typo3-ddev-skill/blob/main/skills/typo3-ddev/references/0003-php-version-management.md)
- Multi-version local testing, database snapshots, `runTests.sh` integration -- [`advanced-options.md`](https://github.com/netresearch/typo3-ddev-skill/blob/main/skills/typo3-ddev/references/advanced-options.md)
- Why not to run automated tests via `ddev exec` (masks CI-only failures) -- [`quickstart.md`](https://github.com/netresearch/typo3-ddev-skill/blob/main/skills/typo3-ddev/references/quickstart.md)
- DDEV troubleshooting -- [`troubleshooting.md`](https://github.com/netresearch/typo3-ddev-skill/blob/main/skills/typo3-ddev/references/troubleshooting.md)

For running Playwright E2E tests against a DDEV-hosted TYPO3 instance, see [`e2e-testing.md`](e2e-testing.md) in this skill (`runTests.sh` DDEV network integration, why CI uses GitHub Services instead of DDEV).
