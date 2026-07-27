# ADR 0003: PHP Version Management in DDEV

**Status:** Accepted

**Date:** 2025-12-31

**Decision Makers:** TYPO3 DDEV Skill Maintainers

**Tags:** #php #ddev #version-management #development-environment

---

## Problem

DDEV base images lag behind PHP patch releases — e.g. PHP 8.5.1 released 2025-12-18 while DDEV's base image still shipped 8.5.0RC3. TYPO3 v14 requires PHP 8.5+, and the version gap causes tests that pass locally to fail in CI (which uses the latest stable) and delays security patches.

## Decision

**Use `apt-get dist-upgrade` in the DDEV web container Dockerfile to pull the latest available PHP patch version**, rather than pinning an exact version or waiting for DDEV's base image to catch up.

`.ddev/web-build/Dockerfile`:

```dockerfile
# Upgrade PHP to latest patch version
# This runs after DDEV's base image is built, getting newer packages
RUN apt-get update && \
    apt-get dist-upgrade -y && \
    rm -rf /var/lib/apt/lists/*
```

Activate with `ddev restart`; verify with `ddev exec php -v` (expect the current patch, e.g. `PHP 8.5.1 (cli) ...`).

---

## Consequences

### Positive

- New PHP patches available within hours of release, no waiting for DDEV image rebuilds.
- Matches CI/CD (which runs latest stable) and typical production hosting — fewer "works on my machine" surprises.
- Security patches applied immediately.
- One line, no manual package-version pinning.

### Negative

- `ddev restart` takes ~10-30s longer on rebuild (Docker layer cache makes subsequent restarts fast if the Dockerfile is unchanged).
- A very new patch could carry a regression with no soak time.
  Mitigation: PHP patch releases are conservative; rollback is deleting the Dockerfile line; pin an exact version instead if needed (see below).
- Developers can end up on different patch versions depending on when they last rebuilt.
  Mitigation: document the expected version in the project README; treat CI as the source of truth; pin an exact version for strict reproducibility.

### Pin instead, when strict reproducibility is required

```dockerfile
RUN apt-get update && \
    apt-get install -y php8.5=8.5.1-1+deb.sury.org~bookworm+1 && \
    rm -rf /var/lib/apt/lists/*
```

Trade-off: exact reproducibility across developers, at the cost of a manual bump for every patch release.

---

## Additional Configurations

### Version verification script

```bash
#!/bin/bash
# scripts/check-php-version.sh
REQUIRED_VERSION="8.5"
CURRENT_VERSION=$(php -r 'echo PHP_MAJOR_VERSION . "." . PHP_MINOR_VERSION;')

if [[ "$CURRENT_VERSION" != "$REQUIRED_VERSION" ]]; then
    echo "ERROR: PHP $REQUIRED_VERSION required, found $CURRENT_VERSION"
    exit 1
fi
echo "PHP version: $(php -v | head -n1)"
```

### composer.json platform constraint

```json
{
    "config": {
        "platform": {
            "php": "8.5.1"
        }
    }
}
```

---

## Troubleshooting

**Package not found after `dist-upgrade`:**

```bash
ddev exec apt-cache policy php8.5   # check available versions
ddev exec apt-get update && ddev restart   # force repository refresh
```

**Rollback:** comment out the `RUN apt-get dist-upgrade` line in the Dockerfile, then `ddev restart`.

**Extension breaks after upgrade:**

```bash
ddev exec php -m | grep <extension>                          # check status
ddev exec apt-get install --reinstall php8.5-<extension>      # reinstall
```

---

**Approved By:** TYPO3 DDEV Skill Project
