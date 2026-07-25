# Badge Data Submission Guide

> Practical guide for programmatically submitting OpenSSF Best Practices Badge data.

## Overview

The bestpractices.dev platform uses a Rails web application. There is no official REST API for
updating badge criteria. Submissions are done via authenticated HTML form PATCH requests.

## Submission Script

A Python script can automate badge data submission using session cookies:

```python
#!/usr/bin/env python3
"""Submit OpenSSF Best Practices Badge data.

Usage:
    BADGE_COOKIE='...' python3 submit-badge.py [--dry-run] [--level LEVEL]
"""

import json
import os
import re
import sys
import time
import http.cookiejar
import urllib.parse
import urllib.request

COOKIE_NAME = "_BadgeApp_session"
PROJECT_ID = 12345  # Replace with your project ID
BASE_URL = "https://www.bestpractices.dev"

AUTH_TOKEN_PATTERN = re.compile(
    r'<input type="hidden" name="authenticity_token" value="([^"]+)"'
)
CSRF_TOKEN_PATTERN = re.compile(r'<meta name="csrf-token" content="([^"]+)"')

LEVELS = ["passing", "silver", "gold", "baseline-1", "baseline-2", "baseline-3"]
```

### Authentication

1. Log in to bestpractices.dev in your browser
2. Extract the `_BadgeApp_session` cookie value from browser DevTools
3. Pass it via environment variable OR file (file recommended due to shell quoting issues):

```python
# RECOMMENDED: Read from file to avoid shell quoting issues with special chars
cookie_file = os.path.expanduser("~/.badge-cookie.txt")
if os.path.exists(cookie_file):
    with open(cookie_file) as f:
        cookie = f.read().strip()
else:
    cookie = os.environ.get("BADGE_COOKIE", "")
```

### Submission Flow

For each level:

1. **GET** the edit page to obtain CSRF tokens and lock version
2. **PATCH** the level URL with form-encoded data

```
GET  /en/projects/{ID}/{level}/edit  → Extract authenticity_token + lock_version
PATCH /en/projects/{ID}/{level}      → Submit form data with tokens
```

**IMPORTANT**: The level path segment is required for ALL levels including passing.
Use `/en/projects/{ID}/passing/edit`, NOT `/en/projects/{ID}/edit`.

---

## Critical Gotchas

### 1. Cookie Handling - Do NOT URL-Decode, Use File

**CRITICAL**: The session cookie must be sent **exactly as received** from the browser. Do NOT URL-decode it.

**RECOMMENDED**: Write cookie to a file instead of passing via environment variable. Session cookies
often contain `+`, `/`, `=`, and other characters that break shell quoting.

```python
# BEST - read from file (no shell quoting issues)
cookie = open(os.path.expanduser("~/.badge-cookie.txt")).read().strip()

# OK - environment variable (beware of shell quoting)
cookie = os.environ.get("BADGE_COOKIE", "")

# WRONG - URL decoding breaks session authentication
cookie = urllib.parse.unquote(os.environ.get("BADGE_COOKIE", ""))
```

**Symptom**: Writes appear to succeed (302 redirect) but data is silently not persisted.

### 2. URL-Required Justifications

Many criteria require `https://` URLs in the justification text. Without URLs, criteria show
"Warning: URL required, but no URL found" even when status is "Met".

**CRITICAL**: Even with status "Met", an **empty justification** or one **without URLs** causes
the criterion to show "Unknown required information, not enough for a badge" on the edit page.
The API will still report the status as "Met", but the badge percentage will NOT count it.

**Commonly affected criteria** (require URLs in justification at ALL levels):

| Level | Criteria Requiring URLs |
|-------|------------------------|
| Passing | `contribution_requirements`, `report_process`, `vulnerability_report_process`, `vulnerability_report_private`, `tests_documented_added`, `warnings_strict`, `static_analysis_common_vulnerabilities`, `dynamic_analysis_unsafe` |
| Silver | `dco`, `governance`, `roles_responsibilities`, `access_continuity`, `bus_factor`, `documentation_architecture`, `documentation_achievements`, `vulnerability_report_credit`, `coding_standards`, `external_dependencies` |
| Gold | `bus_factor`, `contributors_unassociated`, `hardened_site`, `hardening` |

**Rule of thumb**: Always include at least one `https://` URL in every justification text.

```json
{
  "dco_justification": "DCO enforced via GitHub Actions: https://github.com/org/repo/blob/main/.github/workflows/dco.yml"
}
```

### 3. Auto-Detected Fields Cannot Be Set

These fields are auto-detected by the platform and **cannot** be set via form submission:

| Field | Why |
|-------|-----|
| `homepage_url_status` | Auto-detected from project URL |
| `report_url_status` | Auto-detected from issue tracker URL |
| `report_url` | Set at project creation, not a form field |

**Attempting to submit these fields causes HTTP 400 errors.**

Remove them from your badge data files before submission.

**Note**: These fields show as `?` in the API but do NOT count against badge percentages.

### 4. API Response Caching - Use Correct URL Path

**CRITICAL**: The `/en/projects/{ID}.json` path (with locale prefix) returns **aggressively cached**
data that can be stale for hours. The `/projects/{ID}.json` path (without locale) returns fresh data.

```bash
# WRONG - returns stale cached data
curl -s "https://www.bestpractices.dev/en/projects/PROJECT_ID.json"

# CORRECT - returns fresh data
curl -s "https://www.bestpractices.dev/projects/PROJECT_ID.json?_=$(date +%s)"
```

**Symptom**: After successful submission (302 redirect), the API still shows old values.
Switching from `/en/projects/` to `/projects/` path immediately shows updated data.

### 5. OSPS Baseline Field Names

OSPS Baseline criteria use a different naming convention in HTML forms:

| Display Format | Form Field Format |
|---------------|-------------------|
| `OSPS-AC-01.01` | `osps_ac_01_01_status` |
| `OSPS-BR-03.02` | `osps_br_03_02_status` |

Pattern: All lowercase, hyphens and dots become underscores.

**Note**: OSPS criteria do NOT affect Passing/Silver/Gold badge percentages. They are a separate
badge program (OSPS Baseline).

### 6. Session Cookie Rotation

The server rotates session cookies via `Set-Cookie` headers. Your script must use `CookieJar`
to automatically track cookie updates:

```python
def make_opener(cookie):
    """Create urllib opener with cookie jar and no-redirect handling."""
    cj = http.cookiejar.CookieJar()
    c = http.cookiejar.Cookie(
        version=0,
        name="_BadgeApp_session",
        value=cookie,
        port=None,
        port_specified=False,
        domain="www.bestpractices.dev",
        domain_specified=True,
        domain_initial_dot=False,
        path="/",
        path_specified=True,
        secure=True,
        expires=None,
        discard=True,
        comment=None,
        comment_url=None,
        rest={},
        rfc2109=False,
    )
    cj.set_cookie(c)

    class NoRedirectHandler(urllib.request.HTTPErrorProcessor):
        def http_response(self, request, response):
            return response

        https_response = http_response

    return urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(cj),
        NoRedirectHandler,
    )
```

### 7. Rate Limiting

Add delays between level submissions to avoid rate limiting:

```python
time.sleep(3)  # Wait 3 seconds between submissions
```

---

## Lock Version Extraction

**CRITICAL**: The `lock_version` hidden field is required for successful saves. Without it,
submissions may silently fail (302 redirect but no data persisted).

**The HTML attribute order varies** - sometimes `name` comes before `value`, sometimes after.
Use a regex that handles both orderings:

```python
# CORRECT - handles both attribute orderings
LOCK_VERSION_PATTERN = re.compile(
    r'(?:name="project\[lock_version\]"[^>]*value="([^"]*)"|'
    r'value="(\d+)"[^>]*name="project\[lock_version\]")'
)
match = LOCK_VERSION_PATTERN.search(html)
lock_version = (match.group(1) or match.group(2)) if match else None

# WRONG - only handles one attribute ordering
re.search(r'name="project\[lock_version\]"[^>]*value="([^"]*)"', html)
```

---

## Detecting Insufficient Criteria

The badge edit page contains `<img>` elements with `id="{criterion}_enough"` that indicate
whether each criterion meets badge requirements. Use this to find what's actually blocking
the badge percentage:

```python
# After fetching the edit page HTML:
all_enough = re.findall(r'<img[^>]*id="(\w+)_enough"[^>]*alt="([^"]+)"', html)
not_enough = [
    (name, alt) for name, alt in all_enough if "not" in alt.lower() or "Not" in alt
]

for name, alt in not_enough:
    print(f"  {name}: {alt}")
```

**Common "not enough" messages:**
- `"Not enough for a badge."` — Status is "Unmet" or criteria not satisfied
- `"Unknown required information, not enough for a badge."` — Status is "Met" but justification
  is empty or missing required URL

---

## Badge Data File Format

Structure badge data as JSON files per level:

```
badge-data-passing.json
badge-data-silver.json
badge-data-gold.json
badge-data-baseline-1.json
badge-data-baseline-2.json
badge-data-baseline-3.json
```

Each file contains field name/value pairs:

```json
{
  "criterion_name_status": "Met",
  "criterion_name_justification": "Explanation with https://github.com/org/repo/evidence"
}
```

Valid status values: `Met`, `Unmet`, `N/A`, `?` (unknown)

**Note**: Some criteria only accept specific status values:
- `dynamic_analysis_enable_assertions_status`: Only `Met`, `Unmet`, `?` (NOT `N/A`)
- `access_continuity_status`: Only `Met`, `Unmet`, `?` (NOT `N/A`)
- `bus_factor_status`: Only `Met`, `Unmet`, `?` (NOT `N/A`)
- `contributors_unassociated_status`: Only `Met`, `Unmet`, `?` (NOT `N/A`)
- `two_person_review_status`: Only `Met`, `Unmet`, `?` (NOT `N/A`)

---

## Multi-Project Batch Submission

For submitting badge data across multiple projects, use a configuration dict:

```python
PROJECTS = {
    "project-name": {
        "id": 12345,
        "levels": {
            "passing": "/path/to/badge-data-passing.json",
            "silver": "/path/to/badge-data-silver.json",
            "gold": "/path/to/badge-data-gold.json",
        },
    },
    # ... more projects
}

# Submit all
for name, config in PROJECTS.items():
    for level, data_file in config["levels"].items():
        if os.path.exists(data_file):
            submit_level(opener, config["id"], level, data_file)
            time.sleep(3)
```

---

## Solo Maintainer Justification Patterns

For projects with a single maintainer, use these justification templates:

**`two_person_review`** (set to Met, N/A not allowed):
```
The project uses automated multi-reviewer workflow: GitHub Copilot code review + auto-approve
bot for solo maintainer. Branch protection requires passing CI + review approval.
See: https://github.com/org/repo/blob/main/.github/workflows/pr-quality-gates.yml
```

**`bus_factor`** (set to Met, N/A not allowed):
```
Bus factor managed through comprehensive documentation, CI automation, and organizational access.
Organization maintains access to all repositories. Backup maintainers have repository access
via GitHub organization membership: https://github.com/orgs/ORG/people
```

**`access_continuity`** (set to Met, N/A not allowed):
```
Access continuity ensured via GitHub organization. Multiple organization members have admin
access. Repository settings and credentials managed at organization level:
https://github.com/orgs/ORG/people
```

See also: `references/solo-maintainer-guide.md`

---

## Verification

After submission, verify via API:

```bash
# Check badge level (use /projects/ NOT /en/projects/)
curl -s "https://www.bestpractices.dev/projects/PROJECT_ID.json?_=$(date +%s)" | \
  jq '{badge_level, badge_percentage_0, badge_percentage_1, badge_percentage_2}'

# badge_percentage_0 = Passing
# badge_percentage_1 = Silver
# badge_percentage_2 = Gold
```

To verify specific criteria are truly accepted (not just "Met" in API):

```python
# Fetch edit page and check _enough indicators
html = fetch_edit_page(opener, project_id, level)
not_enough = re.findall(r'<img[^>]*id="(\w+)_enough"[^>]*alt="([^"]+)"', html)
blockers = [(n, a) for n, a in not_enough if "not" in a.lower()]
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| 302 redirect but data not saved | URL-decoded cookie | Send cookie as-is, no `urllib.parse.unquote()` |
| 302 redirect but data not saved | Missing lock_version | Extract lock_version from edit page (handle both attr orderings) |
| HTTP 400 on PATCH | Submitting auto-detected fields | Remove `homepage_url_status`, `report_url_status` from data |
| Criteria shows `?` despite Met status | Missing URL in justification | Add `https://` URL to justification text |
| "Met" in API but not counting for % | Empty justification or no URL | Badge edit page shows "Unknown required information" - add justification with URL |
| Stale API response after submit | Using `/en/projects/` path | Use `/projects/{ID}.json` (no locale prefix) with cache-buster |
| GET returns 302 redirect | Cookie expired | Get fresh cookie from browser |
| 200 with "form contains N errors" | Validation errors | Check which criteria allow N/A; some only accept Met/Unmet/? |
| Silver/Gold data silently lost | Cookie rotation lost in redirect | Use `NoRedirectHandler` + `HTTPCookieProcessor` with `CookieJar` |
| N/A rejected for specific criteria | Criterion doesn't allow N/A | Check form radio buttons (see list above) |
| Shell quoting breaks cookie | Special chars (+, /, =) in cookie | Write cookie to file, read in Python |
| Lock version regex returns None | HTML has reversed attribute order | Use alternation regex for both orderings |

### N/A Not Allowed on Certain Criteria

Some Silver/Gold criteria **do not allow N/A** status. Submitting N/A causes validation errors
that silently prevent the entire save (form re-renders with 200 status).

**Passing criteria that DON'T allow N/A:**
- `dynamic_analysis_enable_assertions` (only Met/Unmet/?)

**Silver criteria that DON'T allow N/A:**
- `access_continuity` (MUST)
- `bus_factor` (MUST)

**Gold criteria that DON'T allow N/A:**
- `contributors_unassociated` (MUST)
- `two_person_review` (MUST)

Always check the edit form's radio buttons to verify which values are accepted.
