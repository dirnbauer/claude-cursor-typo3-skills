---
name: "typo3-ddev"
description: "Use when providing DDEV URLs, accessing TYPO3 backend in browser, performing any ddev command (e.g. start, stop, restart, describe, exec), setting up DDEV for TYPO3 extension development, or testing across multiple TYPO3 versions. Triggers on: ddev URLs, backend URLs, local development, docker environment, PHP version management, multi-version testing."
---

# TYPO3 DDEV Setup Skill

## CRITICAL: URL Scheme

**NEVER guess URLs. Read `name:` from `.ddev/config.yaml`, then apply subdomain pattern:**

`https://v{VERSION}.{sitename}.ddev.site/typo3/` — e.g., `https://v14.my-ext.ddev.site/typo3/`

Landing: `https://{sitename}.ddev.site/` · Docs: `https://docs.{sitename}.ddev.site/`

Each version has an Apache vhost (`/var/www/html/v{VERSION}`) via `additional_hostnames`. **Never infer URLs from directory listings.**

**Credentials**: admin / Joh316!!

## Container Priority

1. `.ddev/` exists → `ddev exec`
2. `docker-compose.yml` → `docker compose exec`
3. System tools only if no container. Use project's configured PHP.

**In-container file edits:** `docker cp` in, `ddev exec` — not heredocs/`php -r`. See `references/container-file-editing.md`.

## Quick Start

```bash
ddev start && ddev install-all    # All versions (11/12/13/14)
ddev install-v14                  # v14.3 LTS (default / gold standard)
ddev install-v13                  # v13.4 LTS
```

## Database Selection

**MariaDB 10.11** (default) · SQLite (simple, no SQL) · PostgreSQL 16 (GIS) · MySQL 8.0 (Oracle parity). See `references/advanced-options.md` `references/0002-mariadb-default-with-database-alternatives.md`.

## PHP Management

`php_version: "8.3"` in config.yaml. Upgrade via `.ddev/web-build/Dockerfile` (`apt-get dist-upgrade`). Custom settings: `.ddev/php/custom.ini`. See `references/0003-php-version-management.md`.

## TYPO3 Version Differences

| | v12 | v13 | v14.3 LTS |
|---|---|---|---|
| Setup | `install:setup --use-existing-database` | `setup` | `setup` |
| Activation | Auto (Composer) | `extension:setup` | `extension:setup` |
| `composer.json` | optional | optional | **required** (classic mode, #108310) |
| Default theme | bootstrap-package | bootstrap-package | **Camino** (#108539) |
| Fluid | 2.x | 4.x | 5.x strict (#108148) |
| CKEditor | 41–42 | 41–42 | 47 |

See `references/typo3-12-cli-changes.md`.

## Post-Setup Verification

`ddev status`, `ddev describe`, `ddev exec -d /var/www/html/v13 vendor/bin/typo3 extension:list --active`. See `references/post-setup-verification.md`.

## Optional Services & Commands

- **Valkey 8** (default) or Redis 7: `references/0001-valkey-default-with-redis-alternative.md`
- **Ofelia** scheduler: TYPO3 scheduler automation
- `ddev generate-makefile` / `ddev generate-index` / `ddev docs`
- `ddev xdebug on` · cache flush: see Troubleshooting

## Extension Naming

Hyphens for composer (`nr-llm`), underscores for TYPO3 key (`nr_llm`). Source: composer.json `name`.

## Troubleshooting

| Issue | Solution |
|---|---|
| Port conflict | `router_http_port: "8080"` / `router_https_port: "8443"` |
| Database exists | `ddev mysql -e "DROP DATABASE v13; CREATE DATABASE v13;"` |
| Extension not found | `ddev exec -d /var/www/html/v13 vendor/bin/typo3 cache:flush` |
| Windows health check | Add `/phpstatus` endpoint with `php-fpm.sock` |
| PCOV/pecl fails | `apt-get install php${PHP_VERSION}-pcov` |
| PHP settings ignored | Place in `.ddev/php/custom.ini` |
| Full cleanup | `ddev delete --omit-snapshot --yes` then remove Docker volumes |

## References

| Topic | File |
|---|---|
| Prerequisites | `references/prerequisites-validation.md` |
| Quick start | `references/quickstart.md` |
| Advanced options | `references/advanced-options.md` |
| Post-setup | `references/post-setup-verification.md` |
| Branding/landing page | `references/index-page-generation.md` |
| ADR References | `references/{0001,0002,0003}-*.md` |
| Windows | `references/windows-fixes.md`, `references/windows-optimizations.md` |
| Docs rendering | `references/documentation-rendering.md` |
| Troubleshooting | `references/troubleshooting.md` |

---

## Credits & Attribution

This skill is based on the excellent work by
**[Netresearch DTT GmbH](https://www.netresearch.de/)**.

Original repository: https://github.com/netresearch/typo3-ddev-skill

**Copyright (c) Netresearch DTT GmbH** — Methodology and best practices (MIT / CC-BY-SA-4.0)

Special thanks to [Netresearch DTT GmbH](https://www.netresearch.de/) for their generous open-source contributions to the TYPO3 community, which helped shape this skill collection.
Adapted by webconsulting.at for this skill collection
