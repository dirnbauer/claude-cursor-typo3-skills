# 11. Upgrade Process

Continues `typo3-update` from [full guide](full-guide.md).

## 11. Upgrade Process

### From older majors to v14

```bash
# 1. Create backup
ddev snapshot --name=before-upgrade

# 2. Update composer constraints
ddev composer require "typo3/cms-core:^14.3" --no-update
ddev composer update "typo3/*" --with-all-dependencies

# 3. Run upgrade wizards
ddev typo3 upgrade:list
ddev typo3 upgrade:run

# 4. Clear caches
ddev typo3 cache:flush

# 5. Register extensions and align database schema
ddev typo3 extension:setup
# Schema compare/apply (CLI entry point depends on your project: `typo3`, `vendor/bin/typo3`, typo3-console, etc.)
# `database:updateschema` is from **helhum/typo3-console**, not plain Core — omit if you only have `vendor/bin/typo3`.
ddev typo3 database:updateschema

# 6. Test thoroughly
```
