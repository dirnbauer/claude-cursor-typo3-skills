# Index Page Generation for TYPO3 DDEV Projects

## Purpose

Generate a professional overview page (`index.html`) that serves as the main entry point for the DDEV development environment, providing quick access to all TYPO3 versions and development tools.

## Branding

Netresearch branding (colors, fonts, logo, HTML template) is owned by the [`netresearch-branding`](https://github.com/netresearch/netresearch-branding-skill/blob/main/skills/netresearch-branding/SKILL.md) skill — invoke it before generating the index page rather than hardcoding brand facts here. Base the page on its [`templates/landing-page.html`](https://github.com/netresearch/netresearch-branding-skill/blob/main/skills/netresearch-branding/templates/landing-page.html); for extension-specific requirements (icon, `composer.json`/`ext_emconf.php` fields) see its [`references/typo3-extension-branding.md`](https://github.com/netresearch/netresearch-branding-skill/blob/main/skills/netresearch-branding/references/typo3-extension-branding.md).

**Detection:** Netresearch project if `composer.json` vendor is `netresearch/` or the git remote contains `netresearch`; otherwise fall back to plain TYPO3 orange `#FF8700` with system fonts (no company skill to invoke).

**Known failure mode:** an agent generates the page without invoking `netresearch-branding` first, producing generic colors/system fonts, an externally-linked (not embedded) logo, or an extension name with underscores instead of the composer-name's hyphens. Fix: explicitly invoke `netresearch-branding` before generating, embed its logo SVG inline (never link it externally), and read the extension name from `composer.json` `name`.

## HTML Template Structure

### Required Elements

1. **Header** - Compact bar with project title
2. **Info Box** - Backend credentials (username/password)
3. **Grid Layout** - 2-4 columns responsive
4. **Cards** - One per TYPO3 version + tools
5. **Links** - Frontend and Backend URLs

### Card Content Template

```html
<div class="card">
    <div class="card-icon">[EMOJI]</div>
    <h3>[VERSION NAME]</h3>
    <p>[DESCRIPTION]</p>
    <div class="card-links">
        <a href="[FRONTEND_URL]">→ Frontend</a>
        <a href="[BACKEND_URL]">→ Backend</a>
    </div>
</div>
```

### Cards to Include

**Always include:**
1. TYPO3 12.4 LTS (🎯 emoji)
2. TYPO3 13.x (⚡ emoji)
3. Documentation (📚 emoji)
4. Development Tools (📧 emoji - Mailpit)

**Optional cards** (if applicable):
5. TYPO3 11.5 LTS (📦 emoji)
6. Redis/Valkey (🔄 emoji)
7. Custom tools

## Generation Workflow

### Step 1: Extract Project Metadata

```
- Project name (from .ddev/config.yaml or composer.json)
- DDEV sitename
- Configured TYPO3 versions (from docker-compose or config)
```

### Step 2: Generate HTML

**File location:** `.ddev/web-build/index.html`

**Template variables to replace:**
- `{{PROJECT_NAME}}` - Extension display name
- `{{DDEV_SITENAME}}` - DDEV project name
- `{{PRIMARY_COLOR}}` - Brand primary color
- `{{ACCENT_COLOR}}` - Brand accent color
- `{{TEXT_COLOR}}` - Body text color
- `{{FONT_HEADLINE}}` - Headline font family
- `{{FONT_BODY}}` - Body font family

### Step 3: Copy to Web Root

```bash
# After generation
ddev exec cp /var/www/html/.ddev/web-build/index.html /var/www/html/
```

## Responsive Design Requirements

**Breakpoints:**
```css
/* Mobile: default (single column) */
.grid {
    grid-template-columns: 1fr;
}

/* Tablet: 768px+ (2 columns) */
@media (min-width: 768px) {
    .grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Desktop: 1024px+ (auto-fit) */
@media (min-width: 1024px) {
    .grid {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }
}
```

## Accessibility Requirements

**WCAG AA Compliance:**

1. **Color Contrast**
   - Text on background: minimum 4.5:1
   - Large text (18px+): minimum 3:1
   - Verify with: https://webaim.org/resources/contrastchecker/

2. **Keyboard Navigation**
   - All links must be keyboard accessible
   - Visible focus states
   - Logical tab order

3. **Semantic HTML**
   - Proper heading hierarchy (h1 → h2 → h3)
   - Descriptive link text (not just "click here")
   - Alt text for images (if any)

## Git Status Display

**The landing page SHOULD display git repository information:**

### Git Information to Show
- **Branch name**: Current git branch (e.g., `main`, `feature/xyz`)
- **Commit hash**: Short commit hash (7 characters)

### PHP Implementation (No shell_exec)

Read git info directly from files for security and compatibility:

```php
// Git info from files (no shell_exec needed)
$gitBranch = 'unknown';
$gitCommitShort = 'unknown';
$gitHeadFile = dirname(__DIR__) . '/.git/HEAD';

if (file_exists($gitHeadFile)) {
    $headContent = trim(file_get_contents($gitHeadFile));
    if (str_starts_with($headContent, 'ref: refs/heads/')) {
        $gitBranch = substr($headContent, 16);
        $refFile = dirname(__DIR__) . '/.git/refs/heads/' . $gitBranch;
        if (file_exists($refFile)) {
            $gitCommitShort = substr(trim(file_get_contents($refFile)), 0, 7);
        }
    }
}
```

### Display Format

```html
<div class="git-info">
    <span class="branch">📌 <?= htmlspecialchars($gitBranch) ?></span>
    <span class="commit">@<?= htmlspecialchars($gitCommitShort) ?></span>
</div>
```

**Why file-based instead of shell_exec?**
- Security: No command injection risk
- Compatibility: Works in restricted PHP environments
- Performance: Direct file read is faster than spawning shell

## Single-Extension Mode

**For projects with a single extension (not multi-version testing):**

When building a simple landing page for a single TYPO3 extension project:

### File Location

Place the landing page at `public/index.php` (not `.ddev/web-build/index.html`).

This approach:
- ✅ Works immediately without DDEV custom commands
- ✅ Can be served by the default DDEV web root
- ✅ Allows PHP for dynamic content (git info, extension metadata)

### Extension Naming Convention

**Use hyphenated names** in display, not underscored:
- ✅ `nr-llm` (composer package style)
- ✅ `t3x-nr-llm` (TYPO3 package prefix)
- ❌ `nr_llm` (internal extension key only)

The composer package name from `composer.json` (`name` field) is authoritative.

### Minimal Single-Extension Template

```php
<?php
declare(strict_types=1);

// Read extension info from composer.json
$composerJson = json_decode(file_get_contents(__DIR__ . '/../composer.json'), true);
$extensionName = $composerJson['name'] ?? 'extension';
$description = $composerJson['description'] ?? '';

// Git info (see implementation above)
// ... git file reading code ...
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars($extensionName) ?></title>
</head>
<body>
    <header>
        <h1><?= htmlspecialchars($extensionName) ?></h1>
        <p><?= htmlspecialchars($description) ?></p>
        <div class="git-info">Branch: <?= $gitBranch ?> @ <?= $gitCommitShort ?></div>
    </header>
    <!-- Links to TYPO3 backends, documentation, etc. -->
</body>
</html>
```

## Quality Checklist

Before finalizing the index page:

- [ ] `netresearch-branding` invoked (or fallback applied) per the Branding section above
- [ ] All TYPO3 version links present
- [ ] Backend credentials displayed
- [ ] **Git branch and commit displayed**
- [ ] **Extension name uses correct format (hyphens, not underscores)**
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Color contrast passes WCAG AA
- [ ] No console errors
- [ ] File copied to /var/www/html/ (or public/index.php for single-extension)
- [ ] Accessible at https://{sitename}.ddev.site/
