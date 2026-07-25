# The KPI report

A Word document in the webconsulting corporate design, produced in phase P15 using
`webconsulting-branding` and the available docx-generation skill. Written in the language recorded in
`config/run.yml` (`reporting.language`, default German).

## The single rule

**Every figure comes from `state.json` or a loop `report.json`.** The document is *assembled* from
evidence, never written from memory.

A number that appears in the KPI report and nowhere in the run directory is a fabrication, however
plausible it looks and however confident the sentence around it sounds. If a figure is wanted and no
measurement produced it, either measure it or leave it out and say why.

Use the `share` redaction profile: hostnames and path segments hashed, query values removed.

## Structure

### 1. Before and after the update

| Row | Source |
|---|---|
| TYPO3 version | `state.target.typo3_from` → `typo3_to` |
| PHP version | `state.target.php_from` → `php_to`, plus the recorded 8.5 attempt and its blockers |
| Extension set changes | `manifests/extensions.json`, grouped by resolution |
| Visual differences | loop 300 `findings_by_class`, ending at zero |
| Backend module sweep | loop 310 coverage and result |
| Accessibility | loop 040 and the loop 300 re-audit, automated and manual **shown separately** |
| Lighthouse and Core Web Vitals | loop 500, medians with min/max |

### 2. Data

Sitemap coverage per language · the persisted sample lists · response codes · **coverage actually
achieved**, including every URL not pixel-compared and why · image formats and modern-format share ·
PHPStan level and baseline delta · test and audit results · every URL excluded from the invariance
claim with its ADR.

### 3. Recommendations

Information architecture with concrete examples and the reasoning behind each · design improvements
shown as before/after pairs from the regression screenshots · easy wins such as correct
ImageMagick/GraphicsMagick `GFX` configuration · anything else worth flagging: caching, security
headers, SEO, content quality.

**Recommendations are proposals for the user, not changes this skill made.** Keep observations,
assumptions and recommendations visually separate — a reader must be able to tell what was measured
from what is suggested.

## Local measurement caveats are mandatory

Every absolute score from a DDEV run carries its caveat **next to the number**, not in a footnote
nobody reads. The wording matters because these documents get forwarded:

- Lighthouse scores: indicative; local network and warm caches. The *improvement* is the evidence.
- TBT presented as an INP **proxy** — never "INP passing".
- TTFB: unrealistically low locally; not transferable.
- HSTS: present locally, meaningful only on the production layer.
- Observatory-equivalent grade: computed offline from the header set, not issued by Mozilla.
- JSON-LD: syntax and vocabulary validated offline; rich-result eligibility not checked.
- AVIF share: depends on the local image processor; production may differ.

## What the report must not do

- Claim WCAG 2.2 AA conformance from a green axe run. Automation reaches roughly a third of the
  criteria; automated and manual evidence stay separate.
- Present a local score as a field measurement.
- Report full coverage when a capture budget was exhausted. When `coverageDegraded` is true, the
  document says so **in the summary**, not only in an appendix.
- Include a generic recommendation that no measurement produced. The previous harness padded its
  reports with five hardcoded tips that reached the KPI document indistinguishable from measured
  findings — every recommendation now carries the evidence it came from.
