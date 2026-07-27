# Screenshots Reference

Complete reference for creating and inserting screenshots in TYPO3 documentation.

Based on: https://docs.typo3.org/m/typo3/docs-how-to-document/main/en-us/Advanced/GuidelinesForImages.html

## When to Add Screenshots

**Before adding a screenshot, consider if one is necessary.** Each screenshot requires ongoing maintenance when the UI changes.

### Screenshots ARE Appropriate For

- **Backend module interfaces** - Show where to find settings
- **Configuration screens** - Extension configuration, site settings
- **Complex UI workflows** - Multi-step processes that are hard to describe
- **Form configurations** - TCA forms, FlexForm settings
- **Visual results** - Frontend output that demonstrates a feature
- **Error messages** - Help users identify specific error states

### Screenshots Are NOT Needed For

- Simple button clicks or menu selections (use `:guilabel:` instead)
- Code that can be shown in code blocks
- Standard TYPO3 interfaces that haven't changed
- Information easily conveyed in text

## Image Requirements

### Format

| Type | Format |
|------|--------|
| Screenshots | **PNG** (required) |
| Diagrams | SVG preferred, PNG acceptable |
| Photos | PNG or JPG |

### Dimensions

| Screenshot Type | Dimensions |
|-----------------|------------|
| Full-page screenshots | 1400 x 1050 pixels |
| Cropped screenshots | As small as practical while showing context |

**Best Practice:** Crop to show only relevant portions rather than entire pages.

### Capture Viewport

Resize the browser to **at least 1440 x 1050** before capturing backend
screenshots. Narrow viewports (≈780px) collapse the TYPO3 module menu, truncate
table columns, and cut off modal backgrounds — the result reads as "missing
context" and gets rejected in review.

```js
// Playwright (the Playwright MCP exposes this as browser_resize, same dimensions)
await page.setViewportSize({ width: 1440, height: 1050 });
```

Capture at the wider viewport, then crop the width down to the 1400px target —
the 40px of slack is why the floor is 1440, not 1400. Don't shrink the window to crop.

**Backend module content lives inside an `iframe` — `fullPage` won't capture it.**
The TYPO3 backend renders each module in an iframe that scrolls internally, so a
`fullPage: true` screenshot captures only the outer document (≈ the viewport
height) and clips the module's lower content — trace output, a completed form,
the answer panel. To capture a tall module view (e.g. a config form *and* its
result) in one shot, make the **viewport itself tall** and take a normal
(non-fullPage) screenshot:

```js
// Capture config + output together: tall viewport, NOT fullPage.
await page.setViewportSize({ width: 1440, height: 1750 });
await page.screenshot({ path: 'Documentation/Images/Usage/ModuleRun.png' }); // no fullPage
```

Verify the result height afterwards — a 1440×900 file when you expected a long
page means `fullPage` silently caught only the outer frame.

### File Location

Store images in the `Documentation/Images/` directory, organized by section:

```
Documentation/
├── Images/
│   ├── Configuration/
│   │   ├── ExtensionSettings.png
│   │   └── SiteConfiguration.png
│   ├── Usage/
│   │   └── BackendModule.png
│   └── Developer/
│       └── TcaForm.png
```

## TYPO3 Backend Setup

Before taking screenshots, configure the TYPO3 backend:

### Required Settings

1. **Light mode** - Use light theme, not dark mode
2. **Modern look** - Use modern backend styling (default in TYPO3 12+)
3. **Default installation** - No third-party extensions unless demonstrating them
4. **Standard username** - Use `j.doe` for consistency across documentation
5. **Clean state** - Fresh installation or reset environment

### Docker Container for Screenshots

Use the official TYPO3 documentation screenshot container:

```bash
# Start container
docker run -d --name typo3-screenshots -p 8080:80 linawolf/typo3-screenshots

# Wait for setup to complete
docker logs -f typo3-screenshots

# Access TYPO3 backend
# Navigate to http://localhost:8080/typo3
```

**Reset for clean screenshots:**
```bash
docker stop typo3-screenshots
docker rm typo3-screenshots
docker run -d --name typo3-screenshots -p 8080:80 linawolf/typo3-screenshots
```

The container resets on every run, ensuring consistent environments.

### Installing Extensions in Container

```bash
# Access container shell
docker exec -it typo3-screenshots bash

# Install extension
composer require vendor/extension-name
./vendor/bin/typo3 extension:setup

# Exit container
exit
```

**Note:** Extensions are lost on container restart. Build a custom image for permanent additions.

## RST Image Directives

### Basic Image

```rst
.. image:: /Images/Configuration/ExtensionSettings.png
   :alt: Extension configuration screen showing API settings
```

### Figure with Caption

```rst
.. figure:: /Images/Configuration/ExtensionSettings.png
   :alt: Extension configuration screen showing API settings

   Configure the extension in Admin Tools > Settings > Extension Configuration
```

### Image Options

```rst
.. figure:: /Images/Usage/BackendModule.png
   :alt: Backend module showing secret list
   :width: 600px
   :class: with-shadow

   The Vault backend module displays all accessible secrets
```

| Option | Purpose | Example |
|--------|---------|---------|
| `:alt:` | **Required** - Accessibility text | `:alt: Backend module screenshot` |
| `:width:` | Control display width | `:width: 600px` |
| `:class:` | Apply CSS classes | `:class: with-shadow` |
| `:target:` | Link to full-size image | `:target: _blank` |

### Available CSS Classes

| Class | Effect |
|-------|--------|
| `with-shadow` | Adds drop shadow around image |
| `with-border` | Adds border around image |
| `float-left` | Float image left with text wrap |
| `float-right` | Float image right with text wrap |

## Image Zoom and Lightbox (render-guides 0.36.0+)

The TYPO3 documentation theme provides built-in zoom and lightbox capabilities. Use the `:zoom:` option on figure and image directives.

### Zoom Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `lightbox` | Opens image in full-screen overlay with dark backdrop. Close with Escape or click outside. | **Default for most images** |
| `gallery` | Gallery viewer with mouse wheel zoom and navigation between grouped images | Step-by-step tutorials, related screenshots |
| `inline` | Scroll wheel zoom directly on image, drag-to-pan when zoomed | Technical diagrams needing frequent inspection |
| `lens` | Magnifier lens follows cursor, showing zoomed view in adjacent panel | Detailed UI elements |

### Zoom Examples

**Lightbox (recommended default):**

```rst
.. figure:: /Images/Configuration/ExtensionSettings.png
   :alt: Extension configuration screen
   :zoom: lightbox
   :class: with-border with-shadow

   Configure the extension in Admin Tools > Settings
```

**Gallery with grouping:**

```rst
.. figure:: /Images/Tutorial/Step1.png
   :alt: Step 1 - Open the module
   :zoom: gallery
   :gallery: installation-steps

   Step 1: Navigate to Admin Tools

.. figure:: /Images/Tutorial/Step2.png
   :alt: Step 2 - Configure settings
   :zoom: gallery
   :gallery: installation-steps

   Step 2: Configure the extension
```

**Inline zoom for diagrams:**

```rst
.. figure:: /Images/Developer/ArchitectureDiagram.png
   :alt: Extension architecture showing data flow
   :zoom: inline
   :class: with-border

   Architecture overview - scroll to zoom, drag to pan
```

**Lens mode for detail inspection:**

```rst
.. figure:: /Images/Usage/DetailedForm.png
   :alt: TCA form with many fields
   :zoom: lens
   :zoom-factor: 3

   Hover over form fields to magnify
```

### Additional Zoom Options

| Option | Purpose | Default |
|--------|---------|---------|
| `:zoom-indicator:` | Show/hide zoom icon | `true` |
| `:zoom-factor:` | Magnification strength for lens mode | `2` |

### Accessibility

All zoom modes:
- Support keyboard navigation
- Maintain proper ARIA attributes for screen readers
- Respect `prefers-reduced-motion` media query

## Annotations

When annotating screenshots with boxes, arrows, or numbers:

### Contrast Requirements

Use sufficient contrast to ensure annotations are visible:
- Across different devices and screens
- For readers with color vision differences
- Against varying background colors in the screenshot

### Recommended Annotation Colors

| Element | Color | Hex |
|---------|-------|-----|
| Highlight boxes | TYPO3 Orange | `#FF8700` |
| Arrows/lines | Dark gray | `#333333` |
| Numbers/labels | White on dark background | `#FFFFFF` on `#333333` |

### Annotation Tools

- **macOS**: Preview, Skitch, CleanShot X
- **Windows**: Snagit, Greenshot, ShareX
- **Linux**: Flameshot, Shutter
- **Cross-platform**: GIMP, Inkscape (for SVG)

## Alt Text Guidelines

Alt text is **required** for all images. Write descriptive alt text that:

1. **Describes what the image shows** - Not just "screenshot"
2. **Includes key information visible in the image** - Field names, values shown
3. **Is concise but complete** - Typically 10-30 words

### Examples

```rst
.. Bad alt text:
.. image:: screenshot.png
   :alt: Screenshot

.. Good alt text:
.. image:: /Images/Configuration/VaultSettings.png
   :alt: Extension configuration showing Master Key Path field set to /var/secrets/master.key
```

## Suggesting Screenshots in Documentation

When writing documentation, suggest screenshots for:

1. **New features** - Visual introduction helps users understand
2. **Configuration screens** - Show where settings are located
3. **Complex workflows** - Multi-step processes benefit from visuals
4. **Before/after comparisons** - Show the result of configuration changes
5. **Error states** - Help users identify problems

### Template Comment for Missing Screenshots

```rst
.. todo::
   Add screenshot of the backend module showing the secret list view.
   Dimensions: 1400x1050 or cropped to relevant area.
   Settings: Light mode, j.doe user, clean installation.
```

## Pre-Commit Checklist for Screenshots

1. ✅ **Format**: PNG for all screenshots
2. ✅ **Dimensions**: 1400x1050 or appropriately cropped
3. ✅ **Backend setup**: Light mode, modern look, j.doe user
4. ✅ **Alt text**: Descriptive alt text provided
5. ✅ **File location**: Stored in `Documentation/Images/` with proper organization
6. ✅ **File naming**: CamelCase, descriptive names (e.g., `ExtensionSettings.png`)
7. ✅ **Annotations**: Sufficient contrast for accessibility
8. ✅ **Necessity**: Screenshot genuinely adds value vs. text description

## References

- **Guidelines for Images:** https://docs.typo3.org/m/typo3/docs-how-to-document/main/en-us/Advanced/GuidelinesForImages.html
- **Screenshot Container:** https://docs.typo3.org/m/typo3/docs-how-to-document/main/en-us/Reference/ScreenshotContainer/Index.html
