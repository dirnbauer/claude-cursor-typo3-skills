#!/usr/bin/env python3
"""Submit OpenSSF Best Practices Badge data for multiple projects.

This script automates submitting badge criteria data to bestpractices.dev
using session cookie authentication and CSRF-protected form submissions.

Key features:
- Multi-project support with per-level badge data files
- Proper session cookie handling via CookieJar (rotation-safe)
- Lock version extraction with dual attribute-order regex
- NoRedirectHandler to preserve cookie rotation on 302
- Rate limiting between submissions

Usage:
    # Single project/level
    python3 submit-badges.py PROJECT_ID [LEVEL] [DATA_FILE]

    # All configured projects
    python3 submit-badges.py --all

Authentication:
    Set BADGE_COOKIE env var (preferred) or put cookie in ~/.badge-cookie.txt
    Cookie value is the _BadgeApp_session from browser DevTools.
    Write to file recommended (avoids shell quoting issues with +/=/chars).

    SECURITY WARNING: Session cookies are sensitive credentials.
    - NEVER hardcode cookies in source code or commit them to version control.
    - ALWAYS use the BADGE_COOKIE environment variable for automation.
    - The cookie file (~/.badge-cookie.txt) should have restrictive permissions (0600).
    - Cookies are ephemeral and rotate on each server response; treat as secrets.

Verification (use /projects/ NOT /en/projects/ for fresh data):
    curl -s "https://www.bestpractices.dev/projects/ID.json?_=$(date +%s)" | \\
      jq '{badge_level, badge_percentage_0, badge_percentage_1, badge_percentage_2}'
"""

import http.cookiejar
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

COOKIE_NAME = "_BadgeApp_session"
BASE_URL = "https://www.bestpractices.dev"

AUTH_TOKEN_PATTERN = re.compile(
    r'<input type="hidden" name="authenticity_token" value="([^"]+)"'
)
CSRF_TOKEN_PATTERN = re.compile(r'<meta name="csrf-token" content="([^"]+)"')
# Handle both attribute orderings: name before value AND value before name
LOCK_VERSION_PATTERN = re.compile(
    r'(?:name="project\[lock_version\]"[^>]*value="([^"]*)"|'
    r'value="(\d+)"[^>]*name="project\[lock_version\]")'
)

# Fields that are auto-detected and CANNOT be submitted
AUTO_DETECTED_FIELDS = {
    "homepage_url_status",
    "homepage_url_justification",
    "report_url_status",
    "report_url_justification",
}


class NoRedirectHandler(urllib.request.HTTPErrorProcessor):
    """Prevents following redirects so we can capture Set-Cookie from 302 responses."""

    def http_response(self, request, response):
        return response

    https_response = http_response


def make_opener(cookie):
    """Create urllib opener with cookie jar and no-redirect handling."""
    cj = http.cookiejar.CookieJar()
    c = http.cookiejar.Cookie(
        version=0,
        name=COOKIE_NAME,
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
    return urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(cj),
        NoRedirectHandler,
    ), cj


def get_edit_page(opener, project_id, level="passing"):
    """Fetch the edit page and extract CSRF tokens + lock version.

    IMPORTANT: Level is required in the URL path for ALL levels including passing.
    Use /en/projects/{id}/passing/edit, NOT /en/projects/{id}/edit.
    """
    url = f"{BASE_URL}/en/projects/{project_id}/{level}/edit"

    req = urllib.request.Request(url, method="GET")
    resp = opener.open(req)
    code = resp.getcode()

    if code in (301, 302, 303):
        print(f"  WARNING: Got redirect {code} on edit page - cookie may be expired")
        return None, None, None

    html = resp.read().decode("utf-8", errors="replace")

    auth_match = AUTH_TOKEN_PATTERN.search(html)
    csrf_match = CSRF_TOKEN_PATTERN.search(html)
    lock_match = LOCK_VERSION_PATTERN.search(html)

    auth_token = auth_match.group(1) if auth_match else None
    csrf_token = csrf_match.group(1) if csrf_match else None
    # Handle both regex groups (one for each attribute ordering)
    lock_version = (lock_match.group(1) or lock_match.group(2)) if lock_match else None

    return auth_token, csrf_token, lock_version


def check_insufficient_criteria(opener, project_id, level="silver"):
    """Check which criteria the platform considers insufficient for the badge.

    Uses the _enough img indicators on the edit page.
    Returns list of (criterion_name, alt_text) tuples that are NOT sufficient.
    """
    url = f"{BASE_URL}/en/projects/{project_id}/{level}/edit"
    req = urllib.request.Request(url, method="GET")
    resp = opener.open(req)

    if resp.getcode() in (301, 302, 303):
        return []

    html = resp.read().decode("utf-8", errors="replace")
    all_enough = re.findall(r'<img[^>]*id="(\w+)_enough"[^>]*alt="([^"]+)"', html)
    return [
        (name, alt) for name, alt in all_enough if "not" in alt.lower() or "Not" in alt
    ]


def submit_data(opener, project_id, level, data, auth_token, lock_version):
    """Submit badge data via PATCH."""
    url = f"{BASE_URL}/en/projects/{project_id}/{level}"

    # Build form data
    form_data = {"_method": "patch", "authenticity_token": auth_token}
    if lock_version:
        form_data["project[lock_version]"] = lock_version

    for key, value in data.items():
        if key in AUTO_DETECTED_FIELDS:
            continue
        form_data[f"project[{key}]"] = value

    encoded = urllib.parse.urlencode(form_data).encode("utf-8")
    req = urllib.request.Request(url, data=encoded, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")

    resp = opener.open(req)
    code = resp.getcode()

    body = resp.read().decode("utf-8", errors="replace")

    if code in (200,):
        if "form contains" in body.lower() and "error" in body.lower():
            errors = re.findall(r"<li>(.*?)</li>", body)
            print(f"  FORM ERRORS: {errors[:5]}")
            return False
        print(f"  Status: {code} (form re-rendered, may have validation issues)")
        return True
    elif code in (301, 302, 303):
        print(f"  Status: {code} (redirect = success)")
        return True
    else:
        print(f"  Status: {code} (unexpected)")
        return False


def submit_level(opener, project_id, level, data_file):
    """Submit a single level's badge data."""
    print(f"\n{'=' * 60}")
    print(f"Project {project_id} - Level: {level}")
    print(f"Data file: {data_file}")
    print(f"{'=' * 60}")

    if not os.path.exists(data_file):
        print("  SKIP: Data file not found")
        return False

    with open(data_file) as f:
        data = json.load(f)

    print(f"  Criteria count: {len(data)}")

    # Step 1: Get edit page for CSRF tokens + lock version
    print("  Fetching edit page...")
    auth_token, _csrf_token, lock_version = get_edit_page(opener, project_id, level)

    if not auth_token:
        print("  ERROR: Could not get auth token - cookie expired?")
        return False

    print(f"  Auth token: {auth_token[:20]}...")
    print(f"  Lock version: {lock_version}")

    if not lock_version:
        print("  WARNING: No lock_version found - submission may silently fail!")

    # Step 2: Submit data
    print(f"  Submitting {len(data)} criteria...")
    result = submit_data(opener, project_id, level, data, auth_token, lock_version)

    return result


# Example project configurations (customize for your projects)
PROJECTS = {
    # 'project-name': {
    #     'id': 12345,
    #     'levels': {
    #         'passing': '/path/to/badge-data-passing.json',
    #         'silver': '/path/to/badge-data-silver.json',
    #         'gold': '/path/to/badge-data-gold.json',
    #     }
    # },
}


def main():
    # SECURITY: Prefer environment variable for cookie to avoid file-based risks.
    cookie = os.environ.get("BADGE_COOKIE", "")
    if not cookie:
        cookie_file = os.path.expanduser("~/.badge-cookie.txt")
        if os.path.exists(cookie_file):
            # Warn if cookie file has overly permissive permissions
            file_mode = oct(os.stat(cookie_file).st_mode & 0o777)
            if file_mode != "0o600":
                print(
                    f"WARNING: {cookie_file} has permissions {file_mode} "
                    f"(expected 0o600). Run: chmod 600 {cookie_file}"
                )
            with open(cookie_file) as f:
                cookie = f.read().strip()
        if not cookie:
            print(
                "ERROR: Set BADGE_COOKIE env var or put cookie in ~/.badge-cookie.txt"
            )
            sys.exit(1)

    opener, _cj = make_opener(cookie)

    if len(sys.argv) >= 2 and sys.argv[1] == "--all":
        for name, config in PROJECTS.items():
            for level, data_file in config["levels"].items():
                if os.path.exists(data_file):
                    submit_level(opener, config["id"], level, data_file)
                    time.sleep(3)  # Rate limiting
    elif len(sys.argv) >= 2 and sys.argv[1] == "--check":
        # Check insufficient criteria for all projects
        for name, config in PROJECTS.items():
            for level in config["levels"]:
                blockers = check_insufficient_criteria(opener, config["id"], level)
                if blockers:
                    print(f"{name} ({config['id']}) {level}: {len(blockers)} blockers")
                    for n, a in blockers:
                        print(f"  {n}: {a}")
                else:
                    print(f"{name} ({config['id']}) {level}: OK")
    elif len(sys.argv) >= 2:
        project_id = int(sys.argv[1])
        level = sys.argv[2] if len(sys.argv) > 2 else "passing"
        data_file = sys.argv[3] if len(sys.argv) > 3 else None

        if data_file:
            submit_level(opener, project_id, level, data_file)
        else:
            for name, config in PROJECTS.items():
                if config["id"] == project_id:
                    if level in config["levels"]:
                        submit_level(opener, project_id, level, config["levels"][level])
                    break
    else:
        print("Usage:")
        print("  python3 submit-badges.py PROJECT_ID [LEVEL] [DATA_FILE]")
        print("  python3 submit-badges.py --all")
        print("  python3 submit-badges.py --check  (verify criteria sufficiency)")
        sys.exit(1)


if __name__ == "__main__":
    main()
