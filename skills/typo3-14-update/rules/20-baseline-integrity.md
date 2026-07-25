# Rule 20 — Baseline integrity and the visual contract

Normative. This file defines the contract the whole skill exists to prove.

## 20.1 The contract

> Same data + same configuration + same request + same browser environment
> must produce the same frontend output before and after the TYPO3 update.

Internally the site runs TYPO3 14.3 with modernised, secure code. To visitors it looks and behaves exactly as it did before. **The update is not finished until that has been proven** — not asserted, proven, with evidence that can be re-checked.

Every visible or structural deviation is treated as a regression until it has been explained and classified.

This covers layout, spacing, sizes, fonts, font sizes, line heights, colours, images, image crops, responsive behaviour, navigation, forms, content elements, plugin output, search results, detail pages, error pages, interactive states, content, content order, semantically relevant attributes, and page properties such as canonicals and hreflang.

## 20.2 The baseline is captured before anything changes

`baseline/A-original/` is captured **before the first change of any kind**. Specifically, before:

sitemap or routing fixes · the Vite pipeline change · the Bootstrap 5 update · accessibility corrections · the TYPO3 core update · extension updates · the PHP change · any image-processing change · the Solr update · the CKEditor migration · the Visual Editor migration · SEO adjustments · performance work · security-header changes that could reach the frontend.

The order is not negotiable, and it is the reverse of the intuitive one. Fixing the sitemaps first feels sensible — but a baseline captured after a fix cannot show what the fix broke. **A change made before the baseline exists is a change nobody can ever audit.**

Where the sitemaps are too broken to derive a sample from, record an ADR for degraded sampling, derive the sample from a page-tree crawl instead, and seal that. Seal first, remediate second — always.

## 20.3 The baseline is immutable

Once sealed, `baseline/A-original/` is read-only for the rest of the run.

Sealing writes `MANIFEST.sha256` over every artifact, plus `SEAL.md` recording who sealed it, when, the environment fingerprint, the content fingerprint, and the sample hash. `verify-baseline` recomputes and compares before every use.

**A baseline refresh must never be used to hide an update regression.**

Not grantable by any approval:

- Overwriting, editing, or deleting anything in `baseline/A-original/`
- Changing a visual threshold or the sample after sealing
- Excluding a page from the comparison to make it pass

URLs that did not exist at seal time go to `baseline/A-supplemental/`, which is append-only and **explicitly excluded from the invariance claim**. The closure certificate names every one of them.

## 20.4 The target is zero

Zero unexplained differences. Not "small", not "minor", not "a few pixels".

The previous harness classified anything under a percentage threshold as `minor` and passed. That is removed. On a full-page screenshot of a long page, a percentage covers a great many pixels — a missing button or a shifted component can hide comfortably inside "1%". A percentage threshold does not measure importance; it measures area.

`diffPercent` remains in the report as data. It never decides a verdict again.

Every difference must land in a class from `30-finding-classification.md`. Unclassified blocks the gate.

## 20.5 Reasons that are not reasons

None of the following justifies accepting a difference:

- "Bootstrap renders it differently now."
- "TYPO3 v14 produces different markup."
- "The browser draws the font slightly differently."
- "The new extension ships a more modern template."
- "The image is cropped a little differently now."
- "The spacing is only slightly off."
- "It is only a few pixels."
- "The page still looks the same overall."

Each of these describes a **cause**, and a cause is where the repair starts — not a reason to stop looking. If Bootstrap removed a utility class, map it or restore the rule in the sitepackage. The goal is never to preserve old Bootstrap internals; it is **new Bootstrap implementation, same rendered result**.

## 20.6 A redesign is a different job

If the user wants a redesign or a visible improvement alongside the update, that is a **separate change scope** with its own requirements, its own before/after documentation, its own explicit approval, its own baseline, and its own commit series.

The TYPO3 update itself stays visually neutral. Contract B exists precisely so that improvement work has a legitimate, documented home instead of being smuggled through as "the update changed it".

## 20.7 Accessibility and visible change

Most accessibility corrections are visually neutral: correct semantic elements, labels, `aria-expanded`, `aria-controls`, `aria-describedby`, `aria-current`, heading structure, alternative texts, landmarks, language attributes, keyboard operability, focus management.

Some are not. A new focus indicator changes the rendering of one interaction state. So states are captured and compared **separately**: default · hover · keyboard focus · expanded · collapsed · validation error · modal open · mobile navigation open.

When accessibility fixes are part of the update, the permitted visible changes must be named concretely, limited to specific states, documented separately from the core update, and explicitly approved. The default state of a page is never changed wholesale just because an accessibility audit is running.

**A green axe-core run is not proof of WCAG 2.2 AA conformance.** Automated testing reaches roughly a third of the criteria. Automated and manual evidence are reported separately and never merged into a single claim.

## 20.8 Environment equality is a precondition, not a detail

Pixel equality is only meaningful if the renderer is identical. Before and after must share: Chromium version, Playwright version, OS or container image, installed fonts, device scale factor, viewports, colour scheme, language, timezone, locale, cookie state, consent state, animation state, network access, database content, `fileadmin` contents, image-processing tool, and image-processing configuration.

These are recorded in the baseline manifest and asserted on every later run. **A Playwright or Chromium update between the before and after captures invalidates the comparison** — it does not produce findings, it produces noise that looks like findings.

Drift is reported as `INVALID`, never as `FINDINGS`. Naming it correctly is what stops someone spending a day hunting a regression that a browser patch invented.
