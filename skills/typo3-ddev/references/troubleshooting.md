## Error Handling

### Common Issues and Solutions

**1. Prerequisites Not Met**
```
❌ Prerequisites validation failed.

One or more requirements are not met:
  - Docker daemon not running
  - Docker CLI outdated (need >= 20.10)
  - Docker Compose outdated (need >= 2.0)
  - DDEV not installed

See "Prerequisites Validation" section above for detailed:
  - Platform-specific installation instructions
  - Version requirement details
  - Validation script you can run

Run the validation script to identify which prerequisite is failing.
```

**2. Docker Daemon Not Running (Most Common)**
```
❌ Docker daemon is not running.

Quick fix for your platform:

🐧 Linux/WSL2:
   sudo service docker start

🍎 macOS:
   Open Docker Desktop application

🪟 Windows:
   Open Docker Desktop application

For detailed instructions, see Prerequisites Validation section.
After starting Docker, run: docker info
```

**3. Not a TYPO3 Extension**
```
❌ This doesn't appear to be a TYPO3 extension project.

Requirements:
  - ext_emconf.php file present
  OR
  - composer.json with "type": "typo3-cms-extension"

Current directory: /path/to/project
```

**4. Port Conflicts**
```
❌ DDEV failed to start (port 80/443 conflict)

Solutions:
  - Stop other local web servers (Apache, Nginx, MAMP)
  - Or use different ports in .ddev/config.yaml:
    router_http_port: "8080"
    router_https_port: "8443"
```

**5. Installation Failures**
```
❌ TYPO3 installation failed

Troubleshooting:
  1. Check logs: ddev logs
  2. SSH into container: ddev ssh
  3. Check Composer: ddev composer diagnose
  4. Try reinstalling: rm -rf /var/www/html/v13/* && ddev install-v13
```

**5a. Admin Password Security Requirements**
```
❌ Password does not match the requirements.
   Password must have at least 8 characters,
   contain at least one uppercase letter,
   one digit, and one special character.

The TYPO3_SETUP_ADMIN_PASSWORD environment variable must meet TYPO3's
password policy requirements introduced in TYPO3 12.4:

Required:
  - Minimum 8 characters
  - At least one uppercase letter (A-Z)
  - At least one digit (0-9)
  - At least one special character (!@#$%^&*...)

Examples:
  ✅ Joh316!!  (default, meets all requirements)
  ✅ Password123!
  ✅ MySecure#Pass1
  ❌ password         (no uppercase, no digit, no special char)
  ❌ Password123      (no special char)
  ❌ password!        (no uppercase, no digit)

Fix in docker-compose.web.yaml:
  environment:
    - TYPO3_SETUP_ADMIN_PASSWORD=Password123!
```

**5b. Database Already Exists**
```
❌ Database "v12" or "v13" already exists

This occurs when reinstalling without cleanup. Solutions:

1. Let the install script handle it (recommended):
   The install-v12 and install-v13 commands automatically
   DROP and recreate the database before setup.

2. Manual cleanup if needed:
   ddev mysql -uroot -proot -e "DROP DATABASE v12;"
   ddev mysql -uroot -proot -e "DROP DATABASE v13;"
```

**6. Documentation Site Issues**
```
❌ docs.{sitename}.ddev.site shows directory listing or 404

Causes and solutions:
  - Apache not finding Index.html (capital I)
    Add to VirtualHost: DirectoryIndex Index.html index.html

  - Wrong output directory
    Use: Documentation-GENERATED-temp (TYPO3 standard)
    NOT: docs/, Documentation-rendered/, etc.

  - Docker volume not syncing
    Don't use Docker volumes for docs
    Use project bind mount instead

  - Root-owned files from Docker
    Clean with: sudo rm -rf Documentation-GENERATED-temp/*
```

**7. Root-Owned Docker Files**
```
❌ Permission denied when deleting files

Docker creates files as root. Solutions:
  1. Use sudo: sudo rm -rf Documentation-GENERATED-temp/
  2. Fix ownership: sudo chown -R $(id -u):$(id -g) Documentation-GENERATED-temp/
  3. Prevent in future: Run Docker with --user "$(id -u):$(id -g)"
```

**8. PCOV Installation Fails**
```
❌ pecl: command not found
   OR
❌ pecl install pcov fails

DDEV containers don't include pecl. Use apt-get instead:

# In .ddev/web-build/Dockerfile
RUN apt-get update && apt-get install -y php${PHP_VERSION}-pcov

NOT:
RUN pecl install pcov && docker-php-ext-enable pcov  # ❌ Won't work
```

**9. PHP Version Outdated**
```
❌ PHP 8.5.0RC3 instead of PHP 8.5.1 (or similar)

DDEV ships with specific PHP versions. When a new patch release is
available but DDEV hasn't updated yet, use Dockerfile.apt:

# Create .ddev/web-build/Dockerfile.apt
RUN apt-get update
RUN apt-get install --only-upgrade -y php${PHP_VERSION}-*

Then run: ddev restart

Note: This upgrades all PHP packages to latest available in DDEV's
apt repository. The new version takes effect after restart.
```

**10. PHP Configuration Path Confusion**
```
❌ Custom PHP settings not applied

Wrong location:
  /usr/local/etc/php/conf.d/custom.ini  ❌ (DDEV-managed path)

Correct location:
  .ddev/php/custom.ini                   ✅

Example .ddev/php/custom.ini:
  memory_limit = 512M
  max_execution_time = 300
  upload_max_filesize = 50M

After creating/modifying, run: ddev restart
```

**11. Extension Naming Confusion**
```
❌ Inconsistent extension naming (underscores vs hyphens)

TYPO3 uses different naming conventions in different contexts:

Extension key (internal, underscores):
  nr_llm                          ← ext_emconf.php, ext_tables.php

Composer package name (hyphens):
  netresearch/nr-llm              ← composer.json "name" field

Display name (human readable):
  NR LLM                          ← Title case, spaces

For landing pages and documentation, use the composer package
name format (hyphens) as the authoritative display name:
  ✅ nr-llm
  ✅ t3x-nr-llm
  ❌ nr_llm (only for internal TYPO3 references)
```

**12. Landing Page Missing Branding**
```
❌ Landing page has generic styling instead of Netresearch branding

Symptoms:
  - Generic blue/grey colors instead of Netresearch turquoise
  - Missing Netresearch logo
  - System fonts instead of Raleway/Open Sans
  - Extension name shows underscores instead of hyphens

Causes:
  1. Branding skill not consulted before generating page
  2. Logo SVG not embedded (relying on external URL)
  3. Extension name taken from ext_emconf instead of composer.json

Solutions:
  1. For Netresearch projects, ALWAYS check composer.json vendor:
     grep '"netresearch/' composer.json

  2. Invoke the `netresearch-branding` skill for colors, fonts, and the
     logo SVG — don't hardcode brand facts here. Embed the logo inline,
     never link it externally.

  3. Get extension name from composer.json "name" field:
     jq -r '.name' composer.json  # Returns: netresearch/nr-llm

See: references/index-page-generation.md (Branding section)
```

**13. Backend 500 over HTTPS but 200 over HTTP (trusted hosts)**
```
❌ The TYPO3 backend returns HTTP 500 only over https://, while http:// works.
   Exception #1396795884: "The current host header value does not match the
   configured trusted hosts pattern!"

Cause: trustedHostsPattern is unset or too narrow. Behind the DDEV router an
   https:// request reaches TYPO3 with a host header (e.g. v14.<project>.ddev.site)
   that TYPO3's default SERVER_NAME check rejects — http:// happens to pass.

Fix: the install-v{12,13,14} templates already write a permissive default
   ($GLOBALS['TYPO3_CONF_VARS']['SYS']['trustedHostsPattern'] = '.*') into
   config/system/additional.php — verify it landed if you customised them.
   Narrow it to '.*\.ddev\.site' if you prefer a stricter pattern, then flush
   caches from the version's docroot (vendor/bin/typo3 lives there, not in
   /var/www/html):

   ddev exec -d /var/www/html/vXX vendor/bin/typo3 cache:flush
```

**14. Writing a multi-line file into the container**
```
❌ ddev exec "cat > /path/file <<'EOF' ... EOF"  fails with a shell syntax error.

Cause: the nested heredoc is swallowed by the outer double-quotes of
   ddev exec "...".

Fix: pipe the host file through base64 into ddev exec's stdin. This is portable
   across GNU and BSD/macOS hosts (no GNU-only `base64 -w0`) and avoids
   word-splitting (no intermediate variable):

   base64 < local-file | ddev exec "base64 -d > /var/www/html/path/file"
```


## Setup gotchas (from live extension verification)

### `ddev start` panics: "assignment to entry in nil map"

A Go panic in DDEV's remote-config state manager (`pkg/config/state/state_manager.go`) on `ddev start`
means the global state file is empty/corrupt — common after a DDEV version bump (when
`~/.ddev/global_config.yaml` `last_started_version` differs from the running binary). Fix by
initialising it to an empty map:

```bash
cp ~/.ddev/.state.yaml ~/.ddev/.state.yaml.bak 2>/dev/null || true  # back up first, in case the diagnosis is wrong
echo '{}' > ~/.ddev/.state.yaml
ddev start
```

DDEV repopulates the file on the next successful start.

### `typo3 setup --no-interaction` fails: "The value must not be empty."

With `--no-interaction`, the documented DB defaults (`--host=db`, `--dbname=db`, `--username=db`) are
NOT auto-applied — pass them ALL explicitly, including `--password`:

```bash
ddev exec -d /var/www/html/v{VERSION} vendor/bin/typo3 setup --driver=mysqli --host=db --port=3306 --dbname=db \
  --username=db --password=db --admin-username=admin --admin-user-password='Joh316!!' \
  --admin-email=admin@example.com --project-name='My Project' \
  --create-site='https://my-ext.ddev.site/' --server-type=other --no-interaction --force
```

`--create-site` is optional; v13 and v14 share the same `setup` command.

### `ddev composer require <vendor>/<pkg>:dev-main` fails to clone (SSH auth)

Requiring a dev branch makes Composer prefer the *source* (git clone), which fails inside the web
container without SSH auth — even for public repos. Force the dist (zip) install:

```bash
# Target the version's docroot; --prefer-dist alone usually suffices.
ddev exec -d /var/www/html/v{VERSION} composer require <vendor>/<pkg>:dev-main --prefer-dist -W
# If Composer still clones source, set it persistently (writes to that composer.json):
# ddev exec -d /var/www/html/v{VERSION} composer config preferred-install dist
# alternative: `ddev auth ssh` to forward your host SSH agent into the container
```
### Stale caches after a branch switch or extension-code change

Because the extension is mounted via a Composer path repo (symlink), its source can change
underneath caches TYPO3 built earlier. Two non-obvious failure modes:

- **Stale compiled DI container** (`var/cache/code/`) → backend 500 with
  `ArgumentCountError: Too few arguments to ...::__construct()` (a service gained a
  constructor dependency since the install).
- **Stale language (l10n) cache** → pages render with EMPTY `f:translate` output (blank
  labels, or only the non-translated literals around a label) after switching the worktree
  to a branch with different XLF files and back without re-flushing.

A plain `cache:flush` misses the compiled DI container most often — clear it explicitly:

```bash
ddev exec -d /var/www/html/v{VERSION} bash -c 'rm -rf var/cache/code/* && \
  vendor/bin/typo3 cache:flush && vendor/bin/typo3 extension:setup'
# extension:setup only if DI/schema changed
```

Flush BEFORE trusting (or screenshotting) the rendered backend after a branch switch, or
when the extension's PHP/templates/XLF changed — "it rendered before the switch" is not
evidence about the current state.

## Backend JS/CSS change not visible after edit

TYPO3 serves backend ES modules (and CSS) at a **content-stable `_assets/<hash>/…`
URL** — the hash is of the package path, not the file content. So after you edit
a backend `.js`/`.css`, `vendor/bin/typo3 cache:flush` regenerates the importmap
but the URL is unchanged, and the browser's HTTP cache keeps serving the **old**
module on a normal reload — which reads as "not deployed" when the server is fine.

Fixes:

- **Hard-reload** (`Ctrl/Cmd+Shift+R`) or clear the browser HTTP cache.
- **Playwright:** a plain `navigate` isn't enough — clear the cache via CDP:
  `await page.context().newCDPSession(page); cdp.send('Network.clearBrowserCache')`.
- **Confirm what's actually served** (independent of any browser) before
  concluding "not deployed":
  `curl -sk https://…/_assets/<hash>/JavaScript/…/Foo.js | head`.
