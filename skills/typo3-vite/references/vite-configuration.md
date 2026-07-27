# Vite Configuration

## Overview

Vite is the standard build tool, integrated with TYPO3 via `praetorius/vite-asset-collector`. The configuration handles:

- TypeScript compilation
- SCSS processing with PostCSS (autoprefixer + cssnano)
- Per-content-element code splitting via entrypoints
- SVG optimization via custom plugin
- Image optimization
- Gzip + Brotli compression (production)
- HMR for development

## vite.config.ts

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { compression } from 'vite-plugin-compression2';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import autoOrigin from 'vite-plugin-auto-origin';
import { SvgCopyOptimizePlugin } from './vite.helpers';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
    publicDir: false,
    build: {
        manifest: true,
        rollupOptions: {
            input: {
                'main': resolve(__dirname, 'Resources/Private/Entrypoints/main.entry.ts'),
                'accordion': resolve(__dirname, 'Resources/Private/Entrypoints/accordion.entry.ts'),
                // ... one entry per content element / page feature
                'rte': resolve(__dirname, 'Resources/Private/Scss/rte.scss'),
            },
            output: {
                entryFileNames: 'js/[name]-[hash].js',
                chunkFileNames: 'js/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.endsWith('.css')) return 'css/[name]-[hash][extname]';
                    if (assetInfo.name?.match(/\.(woff2?|ttf|eot)$/)) return 'fonts/[name]-[hash][extname]';
                    if (assetInfo.name?.match(/\.(png|jpe?g|gif|svg|webp|avif)$/)) return 'images/[name]-[hash][extname]';
                    return 'assets/[name]-[hash][extname]';
                },
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        return id.split('node_modules/').pop()?.split('/')[0];
                    }
                },
            },
        },
        outDir: resolve(__dirname, 'Resources/Public/Build'),
        emptyOutDir: true,
        cssCodeSplit: true,
        assetsInlineLimit: 100, // Prevents SVG inlining (needed for SvgIconProvider)
        minify: isProduction ? 'terser' : false,
    },
    css: {
        postcss: {
            plugins: [
                autoprefixer(),
                ...(isProduction ? [cssnano()] : []),
            ],
        },
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
                additionalData: `$mode: "${isProduction ? 'production' : 'development'}";`,
            },
        },
    },
    plugins: [
        autoOrigin(),
        SvgCopyOptimizePlugin(),
        ...(isProduction ? [
            ViteImageOptimizer({
                png: { quality: 80 },
                jpeg: { quality: 80 },
                webp: { quality: 80 },
            }),
            compression({ algorithm: 'gzip' }),
            compression({ algorithm: 'brotliCompress' }),
        ] : []),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        origin: 'http://localhost:5173',
        // Required (all Vite 7.x/8.x) when accessed via reverse proxy (Traefik etc.)
        // Without these, the dev server returns HTTP 403 "Blocked request" for any
        // host header other than 'localhost' — even if the host appears to be
        // routed correctly. true = allow all hosts (use array for narrower scope).
        allowedHosts: true,
        cors: true,
    },
});
```

> **Anti-pattern: duplicate `server:` blocks.** Define `server:` exactly once in
> `defineConfig({ ... })`. JavaScript object literals **silently overwrite**
> earlier keys with later ones, so two `server: { ... }` blocks lose the first
> one's options without warning. If you add `allowedHosts`, put it inside the
> existing `server` block — do not create a second one.
>
> **Not a version-specific quirk.** Host-header enforcement isn't a 7.x
> cutoff -- it's been the default since the fix for
> [GHSA-vg6x-rcgg-rjx6](https://github.com/vitejs/vite/security/advisories/GHSA-vg6x-rcgg-rjx6)
> (CVE-2025-24010), which landed in Vite 4.5.6, 5.4.12, and 6.0.9. Every
> Vite 7.x/8.x release inherits it, so `allowedHosts` is required on any
> supported version once you're accessed via a non-`localhost` host.

## Entrypoints

Each content element or page feature gets its own entrypoint in `Resources/Private/Entrypoints/`:

```
main.entry.ts          # Main entrypoint (always loaded)
accordion.entry.ts     # Only loaded on pages with accordions
slider.entry.ts        # Only loaded on pages with sliders
lightbox.entry.ts      # Only loaded on pages with lightboxes
solr.entry.ts          # Only loaded on search pages
```

### Entrypoint Pattern

```typescript
// main.entry.ts
import '../Scss/main.scss';
import { Collapse, Dropdown } from 'bootstrap';
import { initStickyHeader } from '../TypeScript/Plugins/stickyheader';
import { initNavHelper } from '../TypeScript/Plugins/navhelper';

document.addEventListener('DOMContentLoaded', () => {
    initStickyHeader();
    initNavHelper();
});
```

```typescript
// accordion.entry.ts
import '../Scss/ContentElements/_accordion.scss';
import { initAccordionStacked } from '../TypeScript/Plugins/accordion-stacked';

document.addEventListener('DOMContentLoaded', () => {
    const accordions = document.querySelectorAll('.ce-accordion');
    if (accordions.length > 0) {
        initAccordionStacked();
    }
});
```

### Fluid Integration

Include entrypoints in content element templates:

```html
<vite:asset entry="EXT:my_sitepackage/Resources/Private/Entrypoints/accordion.entry.ts" />
```

The `main.entry.ts` is included in the page layout (loaded on every page).

## SVG Optimization Plugin

The custom `SvgCopyOptimizePlugin` processes SVGs from `Resources/Private/Svg/` to `Resources/Public/Svg/`:

- Reads SVGs from `Resources/Private/Svg/`
- Optimizes with SVGO (using `svgo.config.js` if present)
- Slugifies filenames (lowercase, hyphens)
- Writes optimized files to `Resources/Public/Svg/`
- Watches for changes in dev mode (add/change/delete)
- Tracks processed files to avoid redundant work
- Skips re-optimization when the output file is newer than its source (see below)
- Logs optimization stats (original size vs optimized)

The plugin source lives in `vite.helpers.ts` and is imported in `vite.config.ts`.

### Skipping unchanged sources between builds

The in-memory `processedFiles` map only protects against duplicate work
*within* a single Vite process. Between builds (`vite build` re-runs, fresh
container starts, CI), the map is empty, so without an additional check every
SVG would be re-optimized on every build.

Compute the output path **before** reading the source, then short-circuit when
`output.mtime >= source.mtime`:

```js
const parsed = resolve(rel).split('/').pop().replace('.svg', '');
const outName = slugify(parsed) + '.svg';
const outPath = resolve(outDir, outName);

// Skip re-optimization if the existing output is newer than the source.
// Saves the read + SVGO call entirely on subsequent builds.
if (!changedFile && existsSync(outPath)) {
    const outStats = statSync(outPath);
    if (outStats.mtime.getTime() >= lastModified) {
        processedFiles.set(srcPath, Date.now());
        skippedFiles.push(`Public/Svg/${outName}`);
        continue;
    }
}

// only reached when the output is missing or older than the source:
const raw = await fs.readFile(srcPath, 'utf8');
const result = optimize(raw, { path: srcPath, ...svgoConfig });
await fs.writeFile(outPath, result.data, 'utf8');
```

Two important orderings:

1. `outPath` must be computed **before** the `existsSync` check (and therefore
   before `fs.readFile`/`optimize()`). Otherwise the skip block has nothing to
   compare against and the savings disappear.
2. The `!changedFile` guard ensures explicit dev-server `change`/`add` events
   always re-optimize. The skip only triggers in full-build runs.

Caveat: this relies on filesystem mtimes. On CI runners that wipe
`Resources/Public/Svg/` between jobs, the skip cannot fire — either commit the
optimized output, cache the directory between pipeline runs, or layer a
content-hash manifest on top.

### svgo.config.js

```javascript
export default {
    plugins: [
        {
            name: 'preset-default',
            params: {
                overrides: {
                    removeViewBox: false,
                    cleanupIds: false,
                },
            },
        },
        'removeDimensions',
    ],
};
```

## HMR (Hot Module Replacement)

For local development:

1. Run the Vite dev server (e.g. `npm run hmr`) on port 5173
2. The `vite-asset-collector` extension detects the dev server and serves assets from it
3. CSS changes are injected without page reload
4. TypeScript changes trigger a page reload

## Manifest Mode (No Dev Server)

Not every workflow runs an HMR server. If assets are built at install or
image-build time (`vite build`) and only the manifest is ever served, force
manifest mode — the extension default `useDevServer = auto` resolves to
`Environment::getContext()->isDevelopment()`, so any `Development/*` context
makes `<vite:asset>` chase a dev server that is not running:

```php
<?php
// config/system/settings.php
return [
    'EXTENSIONS' => [
        'vite_asset_collector' => [
            'useDevServer' => '0',
            'devServerUri' => 'auto',
            'defaultManifest' => '_assets/vite/.vite/manifest.json',
        ],
    ],
];
```

Two non-obvious rules apply:

- **Pre-populate the complete key set** (`useDevServer`, `devServerUri`,
  `defaultManifest`) — not just the key you override. On sites that keep
  `settings.php` read-only (e.g. sealed `chmod 0444`, secret-free managed
  config), `ExtensionConfiguration::get()` with a path missing from
  `settings.php` triggers a synchronize that **writes** the file; on the sealed
  file that throws core exception `#1346323822` ("settings.php is not
  writable") and the frontend returns HTTP 500. A complete block keeps every
  read path valid, so no write is ever attempted.
- **The defaults align by design**: `vite-plugin-typo3` project mode outputs to
  `<web-dir>/_assets/vite/` with the manifest at
  `_assets/vite/.vite/manifest.json` — exactly the extension's
  `defaultManifest`. `<vite:asset entry="EXT:..." />` therefore needs no
  `manifest` argument.

For Docker/deployment images that `COPY` extension or package directories,
keep `package.json` and `vite.config.js` at the Composer project root (not
inside an extension): `node_modules` then never sits inside a copied path, and
only the built `_assets/vite/` output ships.

## CSP Compliance

The `vite-asset-collector` supports nonce-based asset inclusion for Content Security Policy:

- Assets loaded via `<vite:asset>` automatically get the correct nonce
- No inline `<script>` or `<style>` tags needed
- Configure CSP headers in TYPO3's Content-Security-Policy API or web server config
- The `autoOrigin` plugin ensures HMR works with CSP in development

## package.json Scripts

Configure build and lint scripts in your project's `package.json` as needed.
