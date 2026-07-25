---
name: "typo3-vite"
description: "Use when configuring Vite 7 for TYPO3 v13/v14 LTS projects, setting up SCSS architecture with Bootstrap 5.3 theming, creating entrypoints per content element, optimizing SVGs, configuring PostCSS (autoprefixer, cssnano), loading local fonts, or customizing Bootstrap variables. v14 removed core asset concat/compression (#108055) \u2014 external build tool is now mandatory. Also triggers for: vite-asset-collector, asset hashing, Gzip/Brotli compression, SCSS import chain, selective Bootstrap imports, CSP compliance, post-v14 frontend build pipelines."
---

# TYPO3 Vite Skill

Vite 7 build configuration for TYPO3 v13 and **v14 LTS** sitepackage development with `praetorius/vite-asset-collector`. Current gold standard: v14.3 LTS (released 2026-04-21).

> **v14 context**: TYPO3 v14.0 **removed** the core's built-in frontend CSS/JS concatenation and compression ([Breaking #108055](https://docs.typo3.org/c/typo3/cms-core/main/en-us/Changelog/14.0/Breaking-108055-RemovedFrontendAssetConcatenationAndCompression.html)) and CSS comment/whitespace stripping ([Breaking #107944](https://docs.typo3.org/c/typo3/cms-core/main/en-us/Changelog/14.0/Breaking-107944-FrontendCSSFileProcessingNoLongerRemovesCommentsAndWhitespaces.html)). `config.concatenateCss`/`compressCss`/`concatenateJs`/`compressJs` no longer have any effect. An external build tool (Vite / webpack / esbuild) is **required** for production-grade asset handling on v14.

## Key Concepts

### Entrypoint-per-CE Pattern

Each content element gets its own Vite entrypoint (`*.entry.ts`) that imports its SCSS and TypeScript. This enables automatic code splitting -- only the CSS/JS needed for visible content elements is loaded.

### Selective Bootstrap Imports

Never import Bootstrap as a whole. Import only the components you use (`bootstrap/scss/grid`, `bootstrap/scss/buttons`, etc.) to minimize CSS bundle size.

### SVG Optimization

Custom `SvgCopyOptimizePlugin` processes SVGs from `Resources/Private/Svg/` through SVGO and writes optimized files to `Resources/Public/Svg/`. Supports dev-mode file watching.

### CSP Compliance

Assets loaded via `<vite:asset>` ViewHelper automatically get nonce attributes for Content Security Policy compliance. No inline `<script>` or `<style>` tags needed.

### Dev Server `allowedHosts` Trap

Vite enforces host-header checks by default: without `allowedHosts: true` and `cors: true` in the `server:` block, the dev server returns HTTP 403 "Blocked request" for any host header other than `localhost` -- breaking HMR behind a reverse proxy (Traefik, nginx). This has been the default since the [GHSA-vg6x-rcgg-rjx6](https://github.com/vitejs/vite/security/advisories/GHSA-vg6x-rcgg-rjx6) fix (4.5.6/5.4.12/6.0.9) -- every Vite 7.x/8.x release enforces it, there's no pre-fix version to worry about on this stack. Set both options **inside the single existing `server:` block** -- a second `server: { ... }` literal silently overwrites the first's keys (including `allowedHosts`) without warning. See `references/vite-configuration.md`.

## Technology Stack

| Layer | Technology |
|---|---|
| Build | Vite 7+ with `praetorius/vite-asset-collector` |
| CSS | Bootstrap 5.3+ (selective imports, custom theming) |
| PostCSS | autoprefixer + cssnano (production) |
| SCSS | Modern Compiler API (`api: 'modern-compiler'`) |
| SVG | Custom SVGO plugin (`SvgCopyOptimizePlugin`) |
| Compression | Gzip + Brotli (production) |
| Package Manager | npm, pnpm, or yarn |

## References

- `references/vite-configuration.md` -- Complete vite.config.ts, entrypoints, SVG plugin, CSP
- `references/scss-architecture.md` -- SCSS folder structure, import chain, naming conventions, CSS units
- `references/bootstrap-theming.md` -- SCSS theming flow, CI-color mapping, selective Bootstrap imports

---

## Credits & Attribution

This skill is based on the excellent work by
**[Netresearch DTT GmbH](https://www.netresearch.de/)**.

Original repository: https://github.com/netresearch/typo3-vite-skill

**Copyright (c) Netresearch DTT GmbH** — Methodology and best practices (MIT / CC-BY-SA-4.0)

Special thanks to [Netresearch DTT GmbH](https://www.netresearch.de/) for their generous open-source contributions to the TYPO3 community, which helped shape this skill collection.
Adapted by webconsulting.at for this skill collection
