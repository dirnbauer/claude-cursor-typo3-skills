# webconsulting Agent Skills

> ## 📦 This repository is archived
>
> **TYPO3 work has moved to [dirnbauer/typo3-skills](https://github.com/dirnbauer/typo3-skills)** — 26 owned + 11 vendored TYPO3 v14 skills with a measured eval harness and a single gate command. The TYPO3 updater there (`typo3-upgrade-run`) supersedes `typo3-14-update` in this repository: it proves the update changed nothing for visitors, with a sealed baseline, a determinism self-test, and a real exit-code contract.
>
> Everything here stays readable and installable — this repository is simply no longer updated. The ~105 non-TYPO3 skills (marketing, design, and general tooling) remain available at the state of the final commit.

> **TYPO3 skills:** Guidance here primarily targets **TYPO3 v14.x**. `typo3-translations` also covers TYPO3 13 compatibility where translation format choices affect upgrades. These skills **will change** as v14 evolves — **through and after** the v14 LTS release. Always verify third-party extensions on Packagist (`require.typo3/cms-core`) for your project.

A curated collection of **137 Agent Skills** from **webconsulting** for AI-augmented software development. Some skills are built in-house, others are carefully imported, adapted, and maintained from strong open-source foundations. Together they give your AI coding assistant a practical, production-focused toolkit for TYPO3, frontend work, security, legal compliance, video, documentation, and enterprise engineering.

> **Core installer:** Cursor, Claude Code, Gemini CLI, OpenAI Codex, and Windsurf. Other tools such as GitHub Copilot, Cline, Aider, and Kiro can be added with native instruction files or a manual skills-directory link.

> **Install script status:** The installer has been tested with Cursor, Claude Desktop, OpenAI Codex, and project-level mirrors for Gemini CLI and Windsurf.

### A Note from the Maintainer

This repository is meant to be useful on real projects: a technically solid collection of
agent skills from webconsulting that helps teams move faster without lowering engineering quality.
The goal is straightforward: one place for reusable skill knowledge that can be installed,
synced, and used across multiple AI coding clients.

Many of the TYPO3 and PHP skills in this collection build on the excellent open-source work by
**[Netresearch DTT GmbH](https://www.netresearch.de/)**. Their repositories have been an important
foundation for this collection, and their contribution to practical TYPO3 and PHP engineering
deserves clear credit. Thank you, Netresearch, and thank you as well to the engineers,
maintainers, and contributors behind that work. This collection is better because of the
care, clarity, and generosity you brought to the TYPO3 ecosystem.

Thank you also to **[ochorocho](https://github.com/ochorocho)** for the
[Camino: Camp Vienna "Lit it Up!"](https://dev.ochorocho.dev/camp-vienna#/) material and
[lit_demo](https://github.com/ochorocho/lit_demo) examples, which informed the practical
TYPO3 backend Lit guidance in the `typo3-webcomponents` skill.

## Skill Categories

This repository currently ships **138 top-level skills** (`skills/*/SKILL.md`) across **13 categories**.
Category-specific add-ons are not counted as top-level skills.

| Category | Skills | Description |
|----------|--------|-------------|
| **TYPO3 CMS** | 31 skills | Content Blocks (webconsulting), shadcn Content Elements (webconsulting), Desiderio Teach (Matt Pocock), Translations (webconsulting), Idea -> Extension -> Blog (webconsulting), News Tags (webconsulting), DataHandler (webconsulting), DDEV (Netresearch), Testing (Netresearch), Conformance (Netresearch), Docs (Netresearch), Core Contributions (Netresearch), Initial Release (webconsulting), Rector (webconsulting), Update (webconsulting), Extension Upgrade (Netresearch), Fractor (webconsulting), Icon14 (webconsulting), Security (webconsulting), SEO (webconsulting), Accessibility (webconsulting), WCAG 2.2 AA Agentic Accessibility (webconsulting), Simplify (Anthropic), Batch (webconsulting), Powermail (webconsulting), Records List Types (webconsulting), Workspaces (webconsulting), Visual Editor (webconsulting), Web Components (webconsulting), Vite (Netresearch), Solr (webconsulting) |
| **Video & Animation** | 9 skills | Remotion Best Practices (remotion-dev), HyperFrames (HeyGen), HyperFrames CLI (HeyGen), HyperFrames Registry (HeyGen), Website to HyperFrames (HeyGen), GSAP (HeyGen), Create Documentation (webconsulting), Micro-interactions (Dylan Tarre), Microinteractions (wondelai) |
| **Security & Enterprise** | 4 skills | Security Audit (Netresearch), Security Incident Reporting (webconsulting), Deepfake Detection (webconsulting), Enterprise Readiness (Netresearch) |
| **Database** | 1 skill | Postgres Best Practices (Supabase) |
| **Marketing** | 43 skills | Marketing Skills plus split growth, SEO, ads, lifecycle, research, prospecting, SMS, and sales enablement skills (Corey Haines) |
| **CRO & Growth** | 4 skills | CRO Funnel (AITYTech), Programmatic SEO (AITYTech), Launch Strategy (AITYTech), A/B Testing (AITYTech) |
| **Code Quality & Refactoring** | 20 skills | Architecture Decision Records (webconsulting), Auto Review (Peter Steinberger), Agent MD Refactor (Softaworks), Refactor (GitHub), Refactor Clean (sickn33), Find Skills (Vercel), Grill Me and engineering/productivity workflow skills (Matt Pocock) |
| **PHP & Tools** | 5 skills | PHP Modernization (Netresearch), CLI Tools (Netresearch), Context7 (Netresearch), Firecrawl (Firecrawl), Skill Creator (Anthropic) |
| **Frontend & Design** | 9 skills | Branding (webconsulting), UI Design Patterns (webconsulting), Frontend Design (Anthropic), Impeccable (pbakaus), Web Design Guidelines (Vercel), Excalidraw (ooiyeefei), OG Image (Stevy Smith), React Best Practices (Vercel), shadcn/ui (Giuseppe Trisciuoglio) |
| **Platform Design** | 8 skills | Android Design (ehmo), iOS Design (ehmo), iPadOS Design (ehmo), macOS Design (ehmo), tvOS Design (ehmo), visionOS Design (ehmo), watchOS Design (ehmo), Web Platform Design (ehmo) |
| **Documents & Office** | 1 skill | Document Processing (Anthropic) |
| **Legal & Compliance** | 1 skill | Legal Impressum (webconsulting) |
| **AI & SEO** | 2 skills | AI Search Optimization (webconsulting), Readiness Report (OpenHands) |
| **Total** | **137 skills** | Top-level skills in `skills/`; shared root guides and add-ons are not counted |

---

> ## 📢 A Quick Note
>
> These skills are here to be used. They can speed up research, implementation, and review,
> and a few ground rules are worth keeping in mind:
>
> - **Things change** — Anthropic, Cursor, and webconsulting continue to evolve their platforms. Updates and occasional breaking changes are normal.
> - **Review AI output** — Always check AI-generated code before committing or deploying. Human judgment still matters.
> - **Keep your local copy current** — Run `git pull && ./install.sh` regularly to pick up new skills, fixes, and compatibility updates.
>
> Questions, ideas, or feedback are always welcome.

---

## 🚀 Universal Agent Skills (5 Core Clients + Optional Tools)

Skills are installed as **symlinks** from the central `skills/` directory to the five core clients' discovery paths, plus a project-level `.agents/skills/` mirror for generic agent packages. The installer links whole skill directories, so `agents/`, `assets/`, `evals/`, `examples/`, `reference/`, `references/`, `rules/`, and `scripts/` stay available to clients that support them. One source of truth, many consumers.
To add a skill, create `skills/<slug>/SKILL.md` once. Do not add client-specific symlinks or duplicate per-client copies; `./install.sh` and `./update.sh` fan the canonical skill directory out automatically.

`SKILL.md` is the lightweight entry point. Keep routing metadata and the default workflow there, then move long examples, templates, troubleshooting matrices, and appendices into `references/` and link them from the skill body. This keeps skills compatible with Anthropic's current Agent Skills guidance while preserving full detail for clients that load bundled resources.

### Core Scripted Clients

| Client | Installation | Discovery |
|--------|-------------|-----------|
| **Cursor** | Symlinks to `~/.cursor/skills/` + `.cursor/skills/` + generated `.mdc` rule wrappers | Auto-discovery, `/skill-name` invocation |
| **Claude Code** | Symlinks to `~/.claude/skills/` | Auto-loaded from user skills |
| **Gemini CLI** | Symlinks to `~/.gemini/skills/` + `.gemini/skills/` + `gemini-extension.json` | Native extension manifest |
| **OpenAI Codex** | Symlinks to `~/.codex/skills/` + `.codex/skills/` | User and project-level discovery |
| **Windsurf** | Symlinks to `~/.codeium/windsurf/skills/` + `.windsurf/skills/` | User and project-level discovery |
| **Generic agents** | Symlinks to `.agents/skills/` | Project-level shared skill path |

### Native and Optional Clients

| Client Type | Setup | Notes |
|-------------|-------|-------|
| **GitHub Copilot, Cline, Aider** | Read `AGENTS.md` or their native instruction file | No separate skill-directory install needed |
| **Kiro and other skill-directory clients** | Add a manual symlink target once | Keep `skills/` as the only source of truth |

### Directory Structure After Install

```
~/.cursor/skills/          ← Cursor (user-level)
~/.claude/skills/          ← Claude Code (user-level)
~/.gemini/skills/          ← Gemini CLI (user-level)
~/.codex/skills/           ← OpenAI Codex (user-level)
~/.codeium/windsurf/skills/← Windsurf (user-level)

.cursor/
  ├── skills/              ← Cursor (project-level)
  └── rules/               ← Legacy .mdc files (backwards compat)
.agents/skills/            ← Generic agent skill path (project-level)
.gemini/skills/            ← Gemini CLI (project-level)
.codex/skills/             ← OpenAI Codex (project-level)
.windsurf/skills/          ← Windsurf (project-level)

gemini-extension.json      ← Gemini CLI extension manifest
catalog/skill-sources.json ← Skill source/provenance catalog
catalog/skill-audit.md     ← Skill structure/source audit
AGENTS.md                  ← Read natively by Copilot, Codex, Windsurf, Cline, Aider
CLAUDE.md                  ← Claude Code primary instructions (→ AGENTS.md)
GEMINI.md                  ← Gemini CLI primary instructions (→ AGENTS.md)
.github/copilot-instructions.md  ← GitHub Copilot instructions (→ AGENTS.md)
.windsurfrules             ← Windsurf project rules (→ AGENTS.md)
```

### Adding a Skill

1. Create `skills/<slug>/SKILL.md`.
2. Use YAML frontmatter with at least `name` and `description`; `description` should say what the skill does and when to use it.
3. Keep the main `SKILL.md` concise. Put optional deep guidance in `references/`, deterministic helpers in `scripts/`, reusable input/output material in `assets/`, and runnable examples in `examples/`.
4. If the skill is upstream-managed, add one entry to `.sync-config.json`.
5. Run `npx -y skills-ref validate skills/<slug>` and `./install.sh --generate-only` to refresh the catalog, README-derived manifest data, and client files. Run `./install.sh` when you also want to deploy symlinks.
6. For local skills such as `typo3-webcomponents`, do not add per-skill install/update rules. `install.sh`, `update.sh`, `scripts/audit_skills.py`, and `scripts/generate_gemini_manifest.py` discover top-level skill directories automatically once the README/AGENTS trigger tables are updated.

Do not create manual per-client symlinks, duplicate `SKILL.md` files, or client-specific install rules for an individual skill. The installer loops over `skills/*` and populates every core client location automatically.

### Adding Other Tools

If a client has its own skills directory and is not one of the five core scripted clients, wire it once with a simple loop:

```bash
TARGET_DIR="$HOME/.kiro/skills" # replace with the client's skill path
mkdir -p "$TARGET_DIR"

for skill_dir in "$PWD"/skills/*; do
  [ -f "$skill_dir/SKILL.md" ] || continue
  ln -sfn "$skill_dir" "$TARGET_DIR/$(basename "$skill_dir")"
done
```

If the client reads an instruction file instead of a skills directory, point it at `AGENTS.md` or the client's native equivalent. Keep `skills/` as the canonical source and avoid copying `SKILL.md` files into per-tool folders.

### Using Skills

**In Cursor:**
1. **Auto-applied**: Cursor decides when skills are relevant
2. **Manual invoke**: Type `/typo3-content-blocks` in Agent chat
3. **View all**: Go to `Cursor Settings → Rules` to see discovered skills

**In Claude Code:**
1. Skills are automatically loaded from `~/.claude/skills/`
2. Reference skills in your prompts or let Claude auto-detect

**In Gemini CLI:**
1. Skills are discovered via `gemini-extension.json` manifest
2. Trigger-based activation matches your prompt to relevant skills

**In native-instruction clients:**
1. Use `AGENTS.md` or the client's native instruction file
2. No separate skill-directory install is required

**In optional manual clients:**
1. Point the client at its own skills directory
2. Use the symlink loop above to mirror `skills/*` into that directory

> **Note:** Legacy `.mdc` rules are still generated in `.cursor/rules/` for backwards compatibility.

---

## Quick Start

### Option 1: Standalone Installation (Recommended)

```bash
# Clone the repository
git clone git@github.com:dirnbauer/webconsulting-skills.git
cd webconsulting-skills

# Install skills
chmod +x install.sh
./install.sh

# Restart Cursor IDE or Claude Code
```

### Option 2: Clone as Project Subdirectory

```bash
# From your project root
git clone git@github.com:dirnbauer/webconsulting-skills.git webconsulting-skills

# Install skills (auto-detects parent project)
cd webconsulting-skills
./install.sh

# Skills are installed to the supported core AI client directories
```

> The installer auto-detects if it's running from a vendor directory, project subdirectory, or standalone clone, and adjusts paths accordingly.

### Alternative: Composer from GitHub (VCS)

Install this skills package directly from GitHub without Packagist.

**1. Add the repository to your project's `composer.json`:**

```json
{
    "repositories": [
        {
            "type": "vcs",
            "url": "https://github.com/dirnbauer/webconsulting-skills"
        }
    ]
}
```

**2. Require the package:**

```bash
composer require --dev webconsulting/webconsulting-skills:dev-main
```

The Composer plugin will automatically run `install.sh` after installation to deploy skills to the supported core AI client directories.

## How to Use Agent Skills

### Skills for Dummies

**What are Agent Skills?** They're Markdown entry points (`SKILL.md`) plus optional bundled resources (`references/`, `scripts/`, `assets/`, `examples/`, and similar folders). Your AI coding assistant reads the entry point first and loads referenced material only when the task needs it. After running `./install.sh`, whole skill directories are symlinked to the supported core AI client directories and automatically discovered.

**How do they work?** 
- **Auto-applied**: Cursor's Agent decides when a skill is relevant based on your query
- **Manual invoke**: Type `/skill-name` in chat (e.g., `/remotion-best-practices`, `/security-audit`)
- **Trigger keywords**: Mentioning keywords like "video", "animation", "security audit", or "content-blocks" activates relevant skills

**Where do skills live?**
- Source directories: `skills/*/` (this repo)
- Entry points: `skills/*/SKILL.md`
- Bundled detail: `skills/*/references/`, `skills/*/scripts/`, `skills/*/assets/`, `skills/*/evals/`, `skills/*/examples/`, and other local support folders
- User-level: `~/.cursor/skills/`, `~/.claude/skills/`, `~/.gemini/skills/`, `~/.codex/skills/`, `~/.codeium/windsurf/skills/`
- Project-level: `.cursor/skills/`, `.gemini/skills/`, `.codex/skills/`, `.windsurf/skills/`
- Legacy rules: `.cursor/rules/*.mdc` wrappers point Cursor to the full skill directory (backwards compatibility)
- Cross-client: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.windsurfrules`, `.github/copilot-instructions.md`, `gemini-extension.json`
- Optional/manual clients: any tool-specific skills directory you wire to `skills/`
- Adding a skill only touches `skills/` and, for upstream-managed skills, `.sync-config.json`

### Skill Reference

| Skill | Trigger Keywords | Example Prompt |
|-------|------------------|----------------|
| `architecture-decision-records` | adr, architecture decision record, decision log, retrospective adr, superseded decision | "Reconstruct and validate ADRs from this repository's Git history" |
| `agent-md-refactor` | refactor agents.md, split instructions, organize claude.md | "Refactor my AGENTS.md - it's too long" or "Split my CLAUDE.md into focused files" |
| `autoreview` | autoreview, Codex review, Claude review, second-model review, closeout review | "Run autoreview before I commit" or "Run a Codex review on this branch" |
| `refactor` | refactor, clean up, code smell, improve code, extract method | "Refactor this function" or "Clean up this code and remove duplication" |
| `refactor-clean` | refactor, clean code, solid, maintainability | "Apply SOLID principles to this module" or "Find code smells and fix them" |
| `find-skills` | find skill, install skill, npx skills, skills.sh | "Find a skill for React performance" or "Search skills.sh for testing tools" |
| `caveman` | caveman mode, talk like caveman, use caveman, less tokens, be brief | "Use caveman mode for the rest of this debugging session" |
| `grill-me` | grill me, stress-test plan, stress-test design, challenge my plan | "Grill me on this implementation plan" or "Stress-test this architecture one question at a time" |
| `diagnose` | diagnose this, debug this, bug, broken, failing, performance regression | "Diagnose this failing checkout flow" or "Debug this performance regression" |
| `grill-with-docs` | grill with docs, stress-test with docs, context.md, adr, domain model | "Grill this plan against the codebase docs" or "Challenge this design and update ADRs" |
| `handoff` | handoff, hand off, continue later, another agent, summarize context | "Write a handoff for the next agent to continue this work" |
| `improve-codebase-architecture` | improve architecture, refactoring opportunities, testable codebase, deep modules | "Find architecture deepening opportunities in this codebase" |
| `prototype` | prototype, sanity-check, data model, state machine, mock up ui, try a few designs | "Prototype this state machine" or "Try a few UI designs before implementation" |
| `setup-matt-pocock-skills` | setup matt pocock skills, issue tracker, triage labels, domain docs, agent skills block | "Set up Matt Pocock's skills for this repository" |
| `tdd` | tdd, red-green-refactor, test-first, integration tests, failing test | "Build this feature using TDD" or "Write the failing test first" |
| `to-issues` | to issues, create issues, implementation tickets, break down work, vertical slices | "Turn this PRD into independently grabbable issues" |
| `to-prd` | to prd, create prd, product requirements, current context | "Turn this conversation into a PRD issue" |
| `triage` | triage, issue workflow, incoming bugs, feature requests, ready for agent | "Triage the open issues and prepare agent-ready tickets" |
| `write-a-skill` | write a skill, create skill, build a new skill, agent skill, bundled resources | "Write a new skill for our release workflow" |
| `zoom-out` | zoom out, broader context, high-level perspective, unfamiliar code | "Zoom out and map how this area fits into the system" |
| `shadcn-ui` | shadcn, radix, tailwind, components, form, dialog, button | "Set up shadcn/ui in my Next.js project" or "Build a form with Zod validation" |
| `typo3-accessibility` | accessibility, a11y, wcag, aria, screen reader, keyboard navigation | "Run WCAG 2.2 AA audit on my TYPO3 site" or "Add skip-to-content link" |
| `typo3-batch` | batch, migrate, bulk, mass refactor, codemod | "Batch migrate all hooks to PSR-14 events" or "Batch modernize all TCA files" |
| `typo3-content-blocks` | content-blocks, content-element, record-type, migrate tca | "Create a Content Block for a hero banner" or "Migrate my TCA to Content Blocks" |
| `typo3-shadcn-content-elements` | shadcn, content elements, Content Blocks, Fluid, backend previews, icons, seed script | "Overhaul EXT:desiderio content elements for shadcn preset b4hb38Fyj" or "Audit Content Blocks field coverage and seed data" |
| `desiderio-teach` | add topic to teach, create lesson content, Desiderio learning page, teach in TYPO3 | "Create a TYPO3 lesson page that teaches editors how to use schema markup with Desiderio content elements" |
| `typo3-translations` | xliff, translations, localization, labels.xlf, locallang.xlf, lll, icu messageformat, translation domains | "Audit my TYPO3 13/14 labels before upgrading to XLIFF 2.0" or "Convert v14-only Content Blocks labels to XLIFF 2.0 with German targets" |
| `typo3-idea-extension-blog` | idea to extension, product announcement, adapt to TYPO3, blog post pipeline, MDX blog | "Turn this product announcement into a TYPO3 extension and German blog post" or "Assess this article for TYPO3 and build the useful parts" |
| `typo3-news-tags` | news tags, EXT:news, thematic tags, bulk tagging, tx_news_domain_model_tag, b13/tag | "Generate thematic EXT:news tags for this corpus" or "Build a command to assign news tags in bulk" |
| `typo3-datahandler` | database, datahandler, records, tcemain | "Create a tt_content record using DataHandler" |
| `typo3-ddev` | ddev, local, docker, environment | "Set up DDEV for TYPO3 v14" |
| `typo3-testing` | testing, phpunit, e2e, coverage | "Write unit tests for my repository" |
| `typo3-conformance` | conformance, standards, quality | "Check if my extension meets TYPO3 standards" |
| `typo3-docs` | documentation, rst, docs | "Create RST documentation for my extension" |
| `typo3-core-contributions` | core, gerrit, forge, patch | "Submit a patch to TYPO3 Core" |
| `typo3-initial-release` | initial release, 1.0.0, release readiness, release tag, TER, Packagist | "Prepare this TYPO3 14.3+ extension for v1.0.0" or "Run final release readiness review before tagging" |
| `typo3-rector` | rector, refactoring, deprecation | "Use Rector to fix deprecations" |
| `typo3-update` | update, upgrade, v14, migration, TYPO3 core | "Follow TYPO3 v14 patterns for my extension" |
| `typo3-14-update` | complete v14 update, v14-only, production rollout, post-upgrade SEO, post-upgrade security, post-upgrade Solr | "Upgrade this project end-to-end to TYPO3 14.3 LTS and verify production readiness" |
| `typo3-extension-upgrade` | extension upgrade, fractor | "Upgrade my extension to TYPO3 v14" |
| `typo3-fractor` | fractor, flexform, typoscript migration, fluid migration | "Use Fractor to migrate FlexForms and TypoScript" |
| `typo3-icon14` | icons, module icons, plugin icons, record icons, action icons, icon migration, Configuration/Icons.php | "Design or migrate TYPO3 v14 extension icons with live Core references" |
| `typo3-security` | security, hardening, permissions | "Harden my TYPO3 installation" |
| `typo3-seo` | seo, sitemap, meta, opengraph | "Configure SEO with sitemaps and meta tags" |
| `typo3-simplify` | simplify, clean up, refine, code quality, reduce complexity | "Simplify my TYPO3 code" or "Replace GeneralUtility::makeInstance with DI" |
| `typo3-wcag22-aa-agentic` | wcag 2.2 aa, accessibility audit, axe-core, playwright, deque mcp, accessibility statement, eaa, bafg, bfsg | "Run an agentic WCAG 2.2 AA audit on this TYPO3 site" or "Scaffold accessibility tooling and statement drafts for a DACH TYPO3 project" |
| `typo3-powermail` | powermail, mailform, form extension, tx_powermail | "Create a contact form with custom finisher" or "Configure spam shield" |
| `typo3-workspaces` | workspace, versioning, staging, publishing, draft content | "Set up workspace workflow" or "Debug workspace overlay" |
| `typo3-visual-editor` | visual editor, inline editing, f:render.text, f:render.contentArea, f:mark.contentArea, PAGEVIEW, colPos | "Install and configure FriendsOfTYPO3 Visual Editor" or "Update my Fluid templates for f:render.contentArea and f:render.text" |
| `typo3-webcomponents` | web components, Lit, LitElement, backend JavaScript, JavaScriptModules.php, f:asset.module, @typo3 modules, backend module UI, Form Editor | "Create a TYPO3 v14 backend Web Component with Lit" or "Should I use TYPO3 backend Web Components in the frontend?" |
| `typo3-vite` | vite, vite-asset-collector, scss, bootstrap, svg, postcss, csp | "Set up Vite for my TYPO3 sitepackage" or "Configure vite-asset-collector with Bootstrap theming" |
| `typo3-records-list-types` | records list types, grid view backend, compact view, teaser view | "Set Grid View as default" or "Create custom Timeline view" |
| `typo3-solr` | solr, search, indexing, facets, suggest, autocomplete, vector search | "Set up EXT:solr with DDEV" or "Debug Solr indexing issues" |
| `ai-search-optimization` | aeo, geo, ai search, chatgpt, llms.txt | "Optimize for ChatGPT and Perplexity citations" |
| `security-audit` | security audit, owasp, vulnerabilities | "Audit my controller for security issues" |
| `security-incident-reporting` | incident report, post-mortem, ddos, forensics | "Create NIST/SANS-style incident report" or "Document DDoS attack timeline" |
| `enterprise-readiness` | enterprise, openssf, slsa | "Assess my project for enterprise readiness" |
| `php-modernization` | php, phpstan, dto, enum | "Modernize my PHP code to 8.3 patterns" |
| `cli-tools` | cli, tools, command not found | "Install missing CLI tools" |
| `context7` | documentation, api, libraries | "Look up current Symfony documentation" |
| `webconsulting-branding` | branding, no borders, project icons | "Apply the borderless webconsulting design system" |
| `ui-design-patterns` | ui, design, layout, typography | "Improve the visual hierarchy of my UI" |
| `remotion-best-practices` | remotion, video, react, animation, composition | "Create a video intro with fade-in text animation" |
| `hyperframes` | hyperframes, video composition, captions, subtitles, voiceover, audio reactive, transitions | "Create a 10-second HTML-based product intro with captions and scene transitions" |
| `hyperframes-cli` | hyperframes init, hyperframes lint, hyperframes preview, hyperframes render, hyperframes tts | "Scaffold a HyperFrames project, lint it, preview it, and render a draft" |
| `hyperframes-registry` | hyperframes add, hyperframes.json, block, component, registry | "Install the data-chart block with hyperframes add and wire it into index.html" |
| `website-to-hyperframes` | website to video, capture this site, turn this into a video, social ad, product tour | "Capture this marketing site and turn it into a 20-second launch video" |
| `gsap` | gsap, animation, timeline, easing, stagger, quickTo | "Write a GSAP timeline for a HyperFrames scene with staggered text" |
| `micro-interactions` | micro-interaction, hover state, button press, toggle, ripple, focus ring, badge update | "Design the press and hover animation for these buttons" or "Add a tasteful ripple to this toggle" |
| `microinteractions` | microinteraction, trigger design, feedback pattern, loops and modes, signature moment, form validation feedback | "Audit this toggle against Dan Saffer's microinteractions framework" or "Score this loading state 0-10 on triggers / rules / feedback / loops" |
| `webconsulting-create-documentation` | documentation, help page, product video, screenshots, tts, gsap | "Create product documentation with video tour" or "Build a help page" |
| `excalidraw` | excalidraw, architecture diagram, system diagram, png export, svg export | "Generate an architecture diagram for this project as an .excalidraw file" or "Create a system diagram and export it as SVG" |
| `react-best-practices` | react, next.js, performance, optimization, bundle size, waterfalls | "Optimize this React component" or "Eliminate request waterfalls" |
| `deepfake-detection` | deepfake, media forensics, fake detection, synthetic media, prnu | "Verify authenticity of this video" or "Detect AI-generated images" |
| `readiness-report` | /readiness-report, agent readiness, codebase maturity | "Run /readiness-report to evaluate this repository" |
| `postgres-best-practices` | postgres, sql, database, query, index, rls, supabase | "Optimize this slow Postgres query" or "Set up RLS for multi-tenant" |
| `marketing-skills` | marketing, cro, conversion, landing page, pricing | "Optimize this landing page" or "Write homepage copy" |
| `ad-creative` | ad creative, ad copy variations, rsa headlines, creative testing | "Generate 20 Google RSA headlines for this offer" |
| `ads` | ads, ppc, paid media, roas, cpa, retargeting | "Plan a LinkedIn ads campaign for this SaaS" |
| `ai-seo` | ai seo, aeo, geo, llmo, ai overviews, perplexity | "Optimize this article for AI Overviews and Perplexity" |
| `analytics` | analytics, ga4, gtm, event tracking, attribution | "Create a GA4 event tracking plan for signup" |
| `aso` | aso, app store optimization, app listing, google play | "Audit this App Store listing for ASO" |
| `churn-prevention` | churn, cancel flow, dunning, retention, win-back | "Improve this SaaS cancel flow" |
| `co-marketing` | co-marketing, partner marketing, joint campaign, partnership ideas | "Find co-marketing partners for this product" |
| `cold-email` | cold email, cold outreach, prospecting email, sales email | "Write a 4-step cold email sequence" |
| `community-marketing` | community marketing, discord community, slack community, community-led growth | "Design a community launch plan" |
| `competitor-profiling` | competitor profile, competitor research, competitive intelligence | "Profile these three competitors" |
| `competitors` | alternative page, vs page, competitor comparison, battlecard | "Create an alternative page outline" |
| `content-strategy` | content strategy, content plan, editorial calendar, topics | "Build a 90-day content strategy" |
| `copy-editing` | copy editing, edit copy, review copy, copy feedback | "Edit this landing page copy" |
| `copywriting` | copywriting, homepage copy, landing page copy, cta copy | "Write homepage copy for this SaaS" |
| `corey-ab-testing` | corey ab testing, growth experiments, ice score, statistical significance | "Build an experiment backlog for this funnel" |
| `corey-programmatic-seo` | corey programmatic seo, pseo, template pages, data-driven pages | "Plan 100 comparison pages using product data" |
| `cro` | cro, conversion optimization, landing page optimization, form cro | "Audit this landing page for conversion issues" |
| `customer-research` | customer research, icp research, user interviews, voice of customer | "Synthesize these customer interview notes" |
| `directory-submissions` | directory submissions, submit startup, saas directories, backlinks | "Find directories to submit this AI tool" |
| `emails` | email sequence, drip campaign, lifecycle email, onboarding email | "Write a trial onboarding email sequence" |
| `free-tools` | free tool, engineering as marketing, lead generation tool | "Brainstorm free tools for this SaaS" |
| `image` | marketing image, social graphic, product mockup, blog hero | "Create prompts for product launch images" |
| `launch` | launch, product hunt, feature release, announcement | "Plan this feature launch" |
| `lead-magnets` | lead magnet, gated content, checklist, ebook, template | "Create a lead magnet for this audience" |
| `marketing-ideas` | marketing ideas, growth ideas, how to market, acquisition ideas | "Give me marketing ideas for this product" |
| `marketing-psychology` | marketing psychology, mental models, cognitive bias, persuasion | "Apply psychology to improve this page" |
| `onboarding` | onboarding, activation, first-run experience, time to value | "Optimize this onboarding flow" |
| `paywalls` | paywall, upgrade screen, upsell, feature gate | "Improve this upgrade paywall" |
| `popups` | popup, modal, exit intent, slide-in, banner | "Design an exit-intent popup" |
| `pricing` | pricing, pricing tiers, freemium, packaging, monetization | "Review these pricing tiers" |
| `product-marketing` | product marketing, positioning, messaging, marketing context | "Create a product marketing context file" |
| `prospecting` | prospecting, build a prospect list, find prospects, find leads, lead gen list, target account list, qualified leads | "Build a qualified prospect list for this ICP" |
| `referrals` | referral, affiliate, ambassador, word of mouth, viral loop | "Design a referral program" |
| `revops` | revops, lead scoring, lead routing, mql, sql, crm automation | "Design a lead scoring model" |
| `sales-enablement` | sales enablement, sales deck, pitch deck, one-pager, demo script | "Create a sales one-pager outline" |
| `schema` | schema, structured data, json-ld, rich snippets, schema.org | "Add FAQ schema to this page" |
| `seo-audit` | seo audit, technical seo, indexing issues, core web vitals | "Audit this site for SEO issues" |
| `signup` | signup, registration, trial activation, signup abandonment | "Optimize this signup flow" |
| `site-architecture` | site architecture, sitemap, site structure, navigation, internal linking | "Plan the sitemap for this SaaS site" |
| `sms` | sms marketing, text message campaigns, sms sequence, sms automation, abandoned cart text, tcpa, a2p 10dlc, twilio | "Plan an abandoned cart SMS sequence with compliance notes" |
| `social` | social media, linkedin post, twitter thread, content calendar, reels | "Create a LinkedIn content calendar" |
| `video` | video, ai video, remotion, hyperframes, heygen, product demo video | "Plan a product demo video" |
| `og-image` | og-image, open graph, social preview, twitter card, meta tags | "Generate an OG image" or "Set up Twitter card meta tags" |
| `frontend-design` | frontend, design, creative, beautiful, distinctive, aesthetics | "Create a distinctive landing page" or "Design a dark tech hero section" |
| `impeccable` | impeccable, design, redesign, shape, critique, audit, polish, craft, live UI | "Use impeccable to polish this product UI" or "Run impeccable shape for this onboarding flow" |
| `web-design-guidelines` | web design, accessibility, a11y, wcag, aria, semantic html | "Review this component for accessibility issues" or "Audit my form for WCAG" |
| `document-processing` | pdf, docx, word, pptx, powerpoint, xlsx, excel | "Extract text from this PDF" or "Create an Excel model with formulas" |
| `firecrawl` | scrape, crawl, search web, research, fetch url | "Search the web for..." or "Scrape this page" |
| `skill-creator` | create skill, new skill, skill creator, package skill, SKILL.md | "Create a new skill for database migrations" or "Package my skill" |
| `android-design` | android, material design, jetpack compose, material you | "Review my Android app for Material Design" |
| `ios-design` | ios, iphone, swiftui, dynamic type, dark mode | "Review my iOS app for HIG compliance" |
| `ipados-design` | ipad, ipados, split view, stage manager, sidebar | "Add keyboard shortcuts to my iPad app" |
| `macos-design` | macos, mac app, appkit, menu bar, toolbar | "Create a Mac app with proper menu bar" |
| `tvos-design` | tvos, apple tv, siri remote, focus navigation | "Design 10-foot UI for Apple TV" |
| `visionos-design` | visionos, vision pro, spatial computing | "Design spatial UI for Vision Pro" |
| `watchos-design` | watchos, apple watch, complications, digital crown | "Create glanceable watchOS interface" |
| `web-platform-design` | wcag, web platform, responsive, accessibility, i18n | "Audit my web app for WCAG 2.2" |
| `ab-testing` | ab test, split test, experiment, hypothesis | "Design A/B test for my homepage" |
| `cro-funnel` | cro funnel, form cro, signup flow, onboarding, paywall | "Optimize my signup flow" |
| `programmatic-seo` | programmatic seo, template pages, directory, location pages | "Build [service] in [city] pages at scale" |
| `launch-strategy` | product launch, product hunt, gtm, beta launch | "Plan my Product Hunt launch" |
| `legal-impressum` | impressum, legal notice, austria, offenlegung, germany, DDG | "Create Austrian Impressum for a GmbH" or "German DDG-compliant legal notice" |

### Example Prompts (Copy & Paste)

#### 🔧 Code Refactoring

**Refactor Code (refactor, refactor-clean):**
```
This function is 200 lines long with deeply nested conditionals. Refactor it into smaller, focused functions with guard clauses.
```

```
Find all code smells in my UserService class: duplication, god object, long parameter lists, magic numbers.
```

```
Apply the Strategy pattern to replace this long switch statement for shipping calculation.
```

```
Create a refactoring plan for this legacy module. Identify risky hotspots, propose incremental steps, and keep behavior stable.
```

```
Remove dead code, extract duplicated logic into shared utilities, and add proper TypeScript types.
```

**Refactor Agent Instructions (agent-md-refactor):**
```
My AGENTS.md is 500 lines and hard to maintain. Refactor it using progressive disclosure: keep essentials at root, split the rest into linked topic files.
```

```
Find contradictions in my CLAUDE.md file and flag vague instructions for deletion.
```

```
Reorganize my agent config into: code-style.md, testing.md, architecture.md, and git-workflow.md
```

**Find and Install Skills (find-skills):**
```
Find a skill for React performance optimization on skills.sh
```

```
Search for available skills related to deployment automation
```

```
Install the refactor skill from github/awesome-copilot@refactor using npx skills
```

**shadcn/ui Components:**
```
Set up shadcn/ui in my Next.js project and create a login form with email/password validation using React Hook Form and Zod
```

```
Build a dashboard with shadcn/ui: Card grid for stats, data Table with pagination, and toast notifications for actions
```

```
Create a settings dialog using shadcn/ui Dialog with a form inside. Include text inputs, a select dropdown for role, and a checkbox for notifications.
```

```
Customize the shadcn/ui Button component with a new "gradient" variant and an "xl" size option
```

---

#### 🏗️ Project Setup & Environment

**New TYPO3 Project:**
```
Set up a new TYPO3 v14 project with DDEV, Redis caching, and Mailpit for email testing
```

**Multi-Site Configuration:**
```
Configure a multi-site setup with 3 domains sharing the same TYPO3 installation, each with German and English languages
```

**Database Operations:**
```
Export the database from production, sanitize sensitive data, and import it into my local DDEV environment
```

**Xdebug Setup:**
```
Configure Xdebug in DDEV for step debugging with Cursor/PhpStorm, including the correct IDE key settings
```

---

#### 📦 Content Blocks (Single Source of Truth)

**Hero Banner Content Element:**
```
Create a Content Block for a hero banner with: headline, subheadline, background image, CTA button link, and overlay color selection
```

**Team Members Record Type:**
```
Create a Content Block Record Type for team members with: name, position, email, phone, bio (richtext), photo, and social media links (Collection). Use Extbase-compatible table naming.
```

**Accordion Content Element:**
```
Create a Content Block for an accordion with unlimited items. Each item has a title, richtext content, and "initially open" checkbox. Include frontend.fluid.html and backend-preview.fluid.html templates.
```

**FAQ with Categories:**
```
Create a Record Type for FAQs with question, answer, and category relation. Then create a Content Element that displays FAQs filtered by selected categories.
```

**Image Slider with IRRE:**
```
Create a slider Content Block using a Collection field. Each slide has: image (required), title, description, and link. Limit to 10 slides max.
```

**shadcn Content Elements:**
```
Audit every ContentBlocks/ContentElements entry in EXT:desiderio. Fix field coverage, labels, backend previews, icons, and seed data so the elements follow shadcn preset b4hb38Fyj.
```

```
Apply a new shadcn/create preset to the TYPO3 Fluid component layer. Preserve preset tokens, shared atoms/molecules, borders, radius, spacing, and dark mode behavior.
```

```
Regenerate layout module previews for all custom Content Blocks. Show the headline, important repeatable items, CTA, thumbnails, chart summary, and warnings for empty data.
```

---

#### Visual Editor (Inline Editing)

**Install and configure Visual Editor:**
```
Install friendsoftypo3/visual-editor in my TYPO3 project. Show the Composer commands, required cache/database steps, editor permissions to check, and a rollback/removal plan.
```

**Migrate page columns:**
```
Update my page Fluid template for the new Visual Editor. Replace <f:cObject typoscriptObjectPath="lib.dynamicContent" data="{colPos: '3'}"/> with the correct f:render.contentArea usage and explain how colPos maps to backend layout identifiers.
```

**Make backend fields editable:**
```
Audit my content element Fluid templates and replace editable backend text fields like {record.header}, {record.subheader}, and richtext bodytext output with f:render.text where appropriate.
```

**Troubleshoot visual editing:**
```
The Visual Editor opens, but inline editing and drag-and-drop do not work for my custom sitepackage. Check content areas, record-transformation, f:render.text, f:mark.contentArea fallbacks, frontend CSS, and workspace/language edge cases.
```

---

#### 🔄 Content Blocks Migration (Classic → Modern)

**Migrate Content Element:**
```
Migrate my classic content element from TCA/SQL to Content Blocks. Here's my current TCA in Configuration/TCA/Overrides/tt_content.php: [paste TCA]
```

**Migrate Record Table:**
```
Convert my classic tx_myext_domain_model_product table (with TCA and ext_tables.sql) to a Content Blocks Record Type. Keep the same table name for data compatibility.
```

**Analyze TCA for Migration:**
```
Analyze this TCA configuration and show me the equivalent Content Blocks config.yaml with all field mappings: [paste TCA]
```

**Migrate IRRE Relations:**
```
My extension has inline (IRRE) child records. Show me how to migrate the parent-child relationship to Content Blocks Collection fields.
```

**Keep Column Names:**
```
Migrate my content element to Content Blocks but keep the existing database column names (tx_myext_*) to avoid data migration. Use prefixField: false.
```

**Data Migration Script:**
```
Create a CLI command that migrates existing content from CType 'myext_hero' to the new Content Blocks CType 'myvendor_hero', including column mapping.
```

**Full Extension Migration:**
```
I have a classic TYPO3 extension with 3 content elements and 2 record types. Create a complete migration plan to Content Blocks, including which files to delete afterward.
```

---

#### ⏪ Content Blocks Revert (Modern → Classic)

**Revert Content Element:**
```
Revert my Content Block hero element back to classic TCA/SQL format. Here's my config.yaml: [paste config.yaml]. Generate the complete TCA, SQL, and TypoScript files.
```

**Revert Record Type:**
```
Convert my Content Blocks Record Type back to a classic TCA configuration. Generate the full TCA file with ctrl section, columns, and types. Table: tx_myext_domain_model_product
```

**Generate TCA from YAML:**
```
Analyze this Content Blocks config.yaml and generate the equivalent classic TCA PHP configuration with all field mappings: [paste config.yaml]
```

**Revert IRRE Collection:**
```
My Content Block uses a Collection field with inline child records. Show me how to revert this to classic TCA inline configuration with a separate child table.
```

**Revert Data Migration:**
```
Create a CLI command that reverts content from Content Blocks CType 'myvendor_hero' back to classic CType 'myext_hero', including copying data between columns.
```

**Update Fluid Templates for Classic:**
```
Update my Content Blocks Fluid template to work with classic TCA. Replace {data.fieldname} with {data.tx_myext_fieldname} and add proper DataProcessors for file relations.
```

**Full Extension Revert:**
```
I need to completely remove Content Blocks from my extension with 2 content elements and 1 record type. Create all necessary TCA, SQL, TypoScript files and a data migration script.
```

**Remove Content Blocks Dependency:**
```
After reverting to classic TCA, how do I safely remove the friendsoftypo3/content-blocks dependency and clean up orphaned database columns?
```

**Compare Approaches:**
```
Show me a side-by-side comparison of the same content element in Content Blocks vs classic TCA format, highlighting the pros and cons of each approach.
```

---

#### 🔧 Extension Development

**DataHandler CRUD:**
```
I need to create, update, and delete records in tx_myext_domain_model_product programmatically using DataHandler. Show me the proper pattern with transaction handling and error checking.
```

**Repository with Custom Query:**
```
Create a repository for my Product model with methods: findByCategory(), findInPriceRange(), and findFeatured(). Use proper typing and QueryBuilder.
```

**Extbase Controller:**
```
Create an Extbase controller with list, show, and filter actions for my Event model. Include proper request handling for TYPO3 v14.
```

**PSR-14 Event Listener:**
```
Create a PSR-14 event listener that modifies page titles before rendering. Register it in Services.yaml with the AsEventListener attribute.
```

**Scheduler Task:**
```
Create a Scheduler task that imports products from an external API daily. Include progress reporting and proper error handling.
```

**Backend Module:**
```
Create a backend module for managing newsletter subscriptions with list view, export to CSV, and bulk delete functionality.
```

**Middleware:**
```
Create a PSR-15 middleware that adds security headers (CSP, X-Frame-Options, etc.) to all frontend responses.
```

---

#### 🔄 Upgrades & Migration

**Extension Upgrade v12 → v14:**
```
Upgrade my extension from TYPO3 v12 to support TYPO3 v14. Use Rector for automated refactoring and show me what needs manual attention.
```

**Fix Deprecations:**
```
Scan my extension for deprecated code and fix all deprecations for TYPO3 v14. Use typo3-rector rules.
```

**TYPO3 v14 patterns:**
```
My extension targets TYPO3 v14. Show me current core APIs and patterns for the v14 breaking changes.
```

**Fractor for Non-PHP Files:**
```
Use Fractor to update my TypoScript, Fluid templates, and YAML files for TYPO3 v14 compatibility.
```

---

#### 🧪 Testing

**Unit Tests:**
```
Write unit tests for my ProductService class. Mock the repository and test the calculateDiscount() method with various inputs.
```

**Functional Tests:**
```
Set up functional tests for my ProductRepository. Include database fixtures and test findByCategory() with actual database queries.
```

**E2E Tests with Playwright:**
```
Write Playwright E2E tests for my contact form: test form submission, validation errors, and success message.
```

**GitHub Actions CI:**
```
Create a GitHub Actions workflow that runs PHPUnit tests, PHPStan analysis, and PHP-CS-Fixer on PHP 8.2 and 8.3 with TYPO3 v14.
```

---

#### 🔒 Security & Hardening

**Security Audit:**
```
Perform a security audit on my AuthController and UserService. Check for XSS, CSRF, SQL injection, and insecure session handling.
```

**Production Hardening:**
```
Create a security hardening checklist for my TYPO3 installation before going live. Include file permissions, configuration, and server settings.
```

**OWASP Compliance:**
```
Review my extension against OWASP Top 10 vulnerabilities and suggest fixes for any issues found.
```

---

#### 📈 SEO & Performance

**Full SEO Setup:**
```
Configure complete SEO for my TYPO3 site: XML sitemap with custom entries, OpenGraph/Twitter cards, canonical URLs, robots.txt, and structured data for articles.
```

**Meta Tags Configuration:**
```
Set up proper meta tag configuration with fallbacks: use page-specific tags if set, otherwise fall back to site-wide defaults.
```

**Hreflang for Multi-Language:**
```
Configure hreflang tags for my multi-language site with German, English, and French. Handle default language and x-default correctly.
```

---

#### 🤖 AI Search Optimization (AEO/GEO)

**Schema Markup for AI Search (TYPO3):**
```
Add FAQPage, Article, and Organization schema to my TYPO3 site using EXT:schema. Make content more likely to be cited by ChatGPT and Perplexity.
```

**Robots.txt for AI Crawlers:**
```
Configure robots.txt to allow AI search bots (GPTBot, PerplexityBot, ClaudeBot) while blocking AI training crawlers (Google-Extended, CCBot). Use TYPO3 site config static routes.
```

**llms.txt for TYPO3:**
```
Implement llms.txt for my TYPO3 site using web-vision/ai-llms-txt extension. Configure which pages to include and how to structure the index.
```

**llms.txt for Next.js/Astro:**
```
Create a dynamic llms.txt endpoint for my Next.js documentation site. Generate the index from content collections and include llms-full.txt with complete docs.
```

**FAQ Content Element with Schema:**
```
Create a TYPO3 Content Block for FAQ accordion that automatically generates FAQPage schema. Each item has question, answer, and initially-open checkbox.
```

**Article Schema with Author (TYPO3):**
```
Add Article schema with author information to my TYPO3 pages using a PSR-14 event listener. Include author name, credentials, LinkedIn, and dates.
```

**MDX JSON-LD Component:**
```
Create a reusable Next.js MDX component that generates Article schema from frontmatter (title, description, date, author). Include proper TypeScript types.
```

**FAQ Schema Component (MDX):**
```
Create a React FAQ component for MDX that renders an accessible accordion AND generates FAQPage schema. Use details/summary for no-JS support.
```

**E-E-A-T Author Bios:**
```
Add author bio fields to my TYPO3 pages (name, credentials, LinkedIn, bio) via TCA extension. Generate Person schema automatically for each page.
```

**Content Freshness Signals:**
```
Configure visible last-modified dates on my TYPO3 pages using SYS_LASTCHANGED. Add HTTP headers and structured data for content freshness.
```

**AI Search Visibility Audit:**
```
Audit my website for AI search visibility: check schema markup quality, E-E-A-T signals, content structure, robots.txt configuration, and llms.txt presence.
```

**Monitor AI Citations:**
```
What tools can I use to monitor how often my brand is mentioned in ChatGPT, Perplexity, and Google AI Overviews? Set up tracking.
```

**Raw MDX View Endpoint:**
```
Add a .md URL suffix to my Next.js docs that shows raw MDX source instead of rendered content. Similar to how Vercel docs works.
```

**Optimize for Perplexity:**
```
Perplexity prefers fresh content. How do I optimize my content update frequency and visible timestamps to maximize Perplexity citations?
```

**Google AI Overviews Optimization:**
```
What specific schema types and content structures increase the chance of appearing in Google AI Overviews? Implement for my TYPO3 site.
```

---

#### 📚 Documentation

**Extension Documentation:**
```
Create RST documentation for my extension following docs.typo3.org standards. Include: introduction, installation, configuration, and usage sections.
```

**API Documentation:**
```
Document my public API methods using proper RST format with code examples and configuration references.
```

---

#### 🏢 Enterprise & Quality

**PHPStan Level 9:**
```
Configure PHPStan at level 9 for my extension. Fix all errors and add proper type hints to pass the analysis.
```

**Enterprise Readiness:**
```
Assess my extension for enterprise readiness: OpenSSF best practices, supply chain security, and quality gates for CI/CD.
```

**Code Quality Gates:**
```
Set up quality gates for my project: PHPStan level 8+, test coverage >80%, no critical security issues, and proper documentation.
```

---

#### 🎨 Frontend & UI

**Fluid Component:**
```
Create a reusable Fluid partial for a card component with image, title, description, link, and optional badge. Make it work with Content Blocks data.
```

**Accessible Form:**
```
Review my contact form for accessibility issues. Ensure proper labels, error messages, focus management, and ARIA attributes.
```

**Design System Integration:**
```
Apply the webconsulting design system to my TYPO3 templates: colors, typography, spacing, and component styles.
```

---

#### ✨ Creative Frontend Design (frontend-design)

The `frontend-design` skill helps you create **distinctive, memorable interfaces** that avoid generic "AI slop" aesthetics. It covers typography, color, motion, spatial composition, and component design.

**Distinctive Landing Pages:**

```
Create a landing page that looks nothing like a typical SaaS template. Use bold typography, asymmetric layout, and a unique color palette.
```

```
Design a dark-mode landing page with a gradient mesh background, floating elements, and glass morphism cards.
```

```
Build a brutalist-style landing page with raw aesthetics, monospace fonts, and intentional visual tension.
```

**Typography That Stands Out:**

```
Suggest distinctive font pairings for my tech startup. Avoid Inter, Roboto, and other overused fonts.
```

```
Create a typography system with a display font for headlines and a body font that pairs well. Show me the CSS variables.
```

```
Design a heading hierarchy with variable font weights, tight letter-spacing, and optical sizing.
```

**Color Palettes:**

```
Create a cohesive color palette for a fintech app. Use a dominant color for 60%, secondary for 30%, and accent for 10%.
```

```
Design a dark theme color system with proper contrast ratios, surface elevation colors, and accent states.
```

```
Generate a color palette inspired by [brand/concept]. Include semantic colors for success, warning, error states.
```

**Hero Sections:**

```
Create a hero section with a diagonal split layout, bold headline on the left, and product screenshot on the right.
```

```
Design a full-screen hero with animated gradient background, centered headline with letter-by-letter animation.
```

#### 🧭 Impeccable Frontend Craft (impeccable)

The `impeccable` skill adds a structured frontend design workflow for shaping, critique, audits, polish passes, live iteration, and end-to-end craft work. It is pinned to `skill-v3.0.7` from `pbakaus/impeccable`.

**Shape Before Build:**

```
Use impeccable shape for this onboarding flow before implementation. Resolve layout, tone, interaction states, and responsive behavior.
```

```
Run impeccable craft for this landing page and wait for the shape brief before editing files.
```

**Critique And Polish:**

```
Use impeccable critique on this dashboard. Prioritize visual hierarchy, cognitive load, accessibility, and interaction clarity.
```

```
Use impeccable polish on this settings UI before release. Tighten spacing, copy, empty states, errors, and mobile behavior.
```

**Live UI Iteration:**

```
Use impeccable live to inspect the current page in-browser and propose stronger variants for the selected UI elements.
```

```
Build a hero with parallax scrolling, floating UI elements, and a CTA that pulses subtly.
```

**Component Design:**

```
Create a pricing card with glass morphism effect, gradient border, and hover animation that lifts the card.
```

```
Design a testimonial carousel with asymmetric cards, large quotation marks, and smooth slide transitions.
```

```
Build a feature grid with icons that animate on hover, subtle shadows, and a staggered reveal animation.
```

**Motion & Animation:**

```
Add micro-interactions to my buttons: subtle scale on hover, satisfying click feedback, loading state animation.
```

```
Create a page transition effect with content that slides up and fades in as you scroll.
```

```
Design a navigation menu that morphs smoothly between mobile hamburger and desktop horizontal layout.
```

**Background Effects:**

```
Create a gradient mesh background using CSS that subtly animates and shifts colors.
```

```
Add a noise texture overlay to my dark sections for visual depth without looking dated.
```

```
Build an animated blob background that responds to mouse movement.
```

**Anti-AI-Slop Audit:**

```
Review my landing page for generic AI patterns. Check for: overused fonts, stock gradients, predictable layouts, bland copy.
```

```
Make this hero section more distinctive. It currently looks like every other SaaS landing page.
```

```
Audit my design for "AI slop" indicators and suggest specific improvements for each issue.
```

---

#### ♿ Web Accessibility Review & Implementation (web-design-guidelines + web-platform-design)

Use `web-design-guidelines` for review findings and compliance audits. Use `web-platform-design` when you want accessible patterns implemented in code.

**Color & Contrast (`web-design-guidelines`):**

```
Check all text colors in my CSS for WCAG AA contrast compliance (4.5:1 for normal text, 3:1 for large text).
```

```
My brand color is #3B82F6. What's the minimum darkness needed for text on white background to pass WCAG AA?
```

```
Review my color palette for colorblind accessibility. Suggest alternatives for red/green combinations.
```

**Focus States (`web-platform-design`):**

```
Audit my interactive elements for visible focus indicators. Show me how to add proper focus-visible styles.
```

```
My designer wants to remove focus outlines. Create accessible alternatives that still look good.
```

```
Add a skip link to my page header that becomes visible on focus.
```

**Form Accessibility (`web-platform-design`):**

```
Review my form for accessibility issues: labels, error messages, required field indicators, and field grouping.
```

```
Make this form accessible: add proper labels, aria-describedby for help text, and live error announcements.
```

```
Create an accessible date picker pattern with keyboard navigation and screen reader support.
```

**Semantic HTML (`web-design-guidelines`):**

```
Audit my page structure for semantic HTML issues. Check heading hierarchy, landmarks, and proper element usage.
```

```
Convert this div-soup navigation to proper semantic HTML with nav, ul, li, and a elements.
```

```
Review my table markup. Add proper headers, scope attributes, and caption for accessibility.
```

**ARIA Patterns (`web-platform-design`):**

```
Implement an accessible modal dialog with proper focus trapping, escape key handling, and aria attributes.
```

```
Create accessible tabs with proper ARIA roles, keyboard navigation (arrow keys), and focus management.
```

```
Build an accessible accordion using details/summary with enhanced keyboard support and animations.
```

```
Add ARIA live regions to my notification system so screen readers announce new messages.
```

**Keyboard Navigation (`web-design-guidelines` + `web-platform-design`):**

```
Audit my page for keyboard accessibility. Check tab order, focus traps, and interactive element reachability.
```

```
My dropdown menu isn't keyboard accessible. Fix the tab order and add arrow key navigation.
```

```
Create a keyboard-navigable image gallery with arrow keys, escape to close, and focus restoration.
```

**Screen Reader Testing (`web-design-guidelines`):**

```
What will a screen reader announce for this component? Check all interactive elements and dynamic content.
```

```
Add proper alt text to my images. Some are decorative, some are informational, some are functional.
```

```
Review my icon buttons. They need accessible names since they have no visible text.
```

**Responsive & Touch (`web-platform-design`):**

```
Audit my touch targets for mobile accessibility. Minimum 44x44px with adequate spacing.
```

```
Check my responsive design for accessibility issues at different breakpoints and zoom levels.
```

```
Add prefers-reduced-motion support to my animations for users with vestibular disorders.
```

**Quick Accessibility Checklist (`web-design-guidelines`):**

```
Run a full accessibility audit on my homepage. Check: color contrast, focus states, semantic HTML, ARIA, keyboard nav, and alt text.
```

```
Prepare my site for WCAG 2.2 AA compliance. Create a checklist of issues and fixes.
```

```
Review this component against WCAG success criteria and list all failures with fixes.
```

---

#### 📄 Document Processing (document-processing)

The `document-processing` skill handles **PDF, DOCX, PPTX, and XLSX** files — extraction, creation, editing, and analysis.

**PDF Text Extraction:**

```
Extract all text from this PDF while preserving structure (headings, paragraphs, lists).
```

```
Extract the table on page 3 of this PDF into a structured format I can use in code.
```

```
Extract text from this scanned PDF using OCR. The quality is poor, so maximize accuracy.
```

**PDF Creation:**

```
Create a PDF invoice with company header, line items table, and footer with payment terms.
```

```
Generate a PDF report from this data with charts, tables, and formatted sections.
```

```
Create a certificate PDF with a decorative border, centered text, and signature line.
```

**PDF Manipulation:**

```
Merge these 5 PDF files into one, maintaining bookmarks and page numbers.
```

```
Split this 100-page PDF into separate files, one per chapter (chapters start at pages 1, 23, 45, 67, 89).
```

```
Extract pages 10-25 from this PDF as a new file.
```

```
Rotate all landscape pages in this PDF to portrait orientation.
```

```
Add a watermark "CONFIDENTIAL" to every page of this PDF.
```

```
Password-protect this PDF with encryption.
```

**Word Document Processing:**

```
Extract all text from this DOCX file as plain markdown, preserving headings and lists.
```

```
Convert this Word document to clean markdown for use in my documentation site.
```

```
Create a Word document from this markdown content with proper heading styles.
```

```
Create a DOCX file with my report content, including a table of contents and page numbers.
```

**Word Document Editing:**

```
Find and replace all instances of "Company A" with "Company B" in this Word document.
```

```
Extract all tracked changes from this Word document and list them with authors and dates.
```

```
Accept all tracked changes in this document and save a clean version.
```

```
Add a comment to this Word document at the paragraph starting with "In conclusion..."
```

**PowerPoint Processing:**

```
Extract all text from this PowerPoint presentation, organized by slide.
```

```
Create a summary of this PPTX: slide titles, key bullet points, and speaker notes.
```

```
Convert this PowerPoint to a markdown outline for use in documentation.
```

**PowerPoint Creation:**

```
Create a PowerPoint presentation from this markdown outline. Use a clean, professional style.
```

```
Generate slides for my quarterly report: title slide, 4 content slides with charts, and summary slide.
```

```
Create a pitch deck with these sections: Problem, Solution, Market, Traction, Team, Ask.
```

**PowerPoint Editing:**

```
Replace all images in this PowerPoint with updated versions from this folder.
```

```
Update the footer on all slides to show "Q4 2026" instead of "Q3 2026".
```

```
Extract slide 5 as a high-resolution PNG image for use in marketing.
```

**Excel Data Analysis:**

```
Analyze this Excel file and summarize: row count, column names, data types, and any obvious issues.
```

```
Calculate summary statistics for the 'Revenue' column: sum, average, min, max, and standard deviation.
```

```
Find all duplicate rows in this Excel file based on the 'Email' column.
```

```
Create a pivot table summary: sales by region and product category.
```

**Excel Creation:**

```
Create an Excel file from this JSON data with proper column headers and formatting.
```

```
Generate an Excel report with these sheets: Summary, Details, Charts. Add formulas, not hardcoded values.
```

```
Create a budget spreadsheet with categories, monthly columns, and SUM formulas for totals.
```

**Excel Formulas & Formatting:**

```
Add formulas to this Excel file: column D should be C * B, and row 20 should sum each column.
```

```
Format this Excel file: header row bold with background color, currency format for money columns, alternating row colors.
```

```
Create a financial model with proper Excel standards: blue for inputs, black for formulas, green for outputs.
```

```
Add conditional formatting: highlight cells red if value is negative, green if above target.
```

**Excel Advanced:**

```
Create a dropdown list in column A that only allows values from the 'Categories' sheet.
```

```
Add data validation to the 'Date' column to only accept dates in 2026.
```

```
Create a chart from this data and embed it in the 'Dashboard' sheet.
```

```
Protect this worksheet but allow users to edit cells in the 'Input' range.
```

**Cross-Format Workflows:**

```
Convert this PDF report to an editable Word document, preserving formatting as much as possible.
```

```
Extract the tables from this PDF and save them as an Excel file.
```

```
Create a PowerPoint from the key findings in this Excel analysis.
```

```
Batch process all PDFs in this folder: extract text and save as individual markdown files.
```

---

#### 🔍 Solr Search (typo3-solr)

The `typo3-solr` skill provides expert guidance on **Apache Solr search integration for TYPO3**: installation, Index Queue, faceting, suggest/autocomplete, PSR-14 events, custom indexers, vector/semantic search, and deep debugging. Includes supplements for file indexing (`SKILL-SOLRFAL.md`) and custom vanilla JS frontends (`SKILL-FRONTEND.md`).

**Installation & Setup:**

```
Set up EXT:solr with DDEV using the ddev-typo3-solr addon. Configure the Solr connection for my TYPO3 v14 site with two languages (German and English).
```

```
Configure a production Docker setup for Solr with persistent data, custom configsets, and health checks.
```

```
Set up hosted-solr.com for my multi-language TYPO3 site. Configure per-environment connections using helhum/dotenv-connector.
```

**Indexing:**

```
Index EXT:news records into Solr with categories, tags, and author information. Configure the Index Queue via TypoScript.
```

```
Create a custom PSR-14 event listener that enriches Solr documents with data from related records during indexing.
```

```
My items are in the Index Queue but not appearing in search results. Debug the full pipeline from queue to search.
```

```
Index custom Extbase records from tx_myext_domain_model_product with price, categories, and images.
```

**Faceted Search:**

```
Configure faceted search with category filters, date range facets, and price range facets. Include proper TypoScript and Fluid templates.
```

```
Add a hierarchical category facet that shows parent > child categories with item counts.
```

**Suggest & Autocomplete:**

```
Add suggest/autocomplete to my search form. Show search suggestions as the user types with proper debouncing.
```

```
Replace the default jQuery-based suggest with vanilla JavaScript. Use the EXT:solr suggest API endpoint.
```

**Vector Search (LLM/Semantic):**

```
Set up Solr vector search with OpenAI embeddings for semantic search on my TYPO3 content. Use Solr's native dense vector support.
```

```
Configure Solr's text-to-vector transformer with a local model for embedding generation without external API calls.
```

**File Indexing (solrfal):**

```
Index PDF files from fileadmin into Solr using EXT:solrfal and Apache Tika. Configure the Tika server in Docker.
```

```
Set up file indexing for Word documents, Excel files, and PDFs with proper content extraction and metadata.
```

**Custom Frontend (Vanilla JS):**

```
Build a custom search interface with vanilla JavaScript: instant search results, facet filtering, and pagination without jQuery.
```

**Debugging & Troubleshooting:**

```
My search returns "Search is currently not available." Debug the connection, core status, and configuration.
```

```
Full debugging: walk through the complete pipeline from Solr connection to search results. Check Index Queue, schema, and query configuration.
```

```
Items show as "indexed" in the backend but search returns zero results. How do I debug the search query?
```

---

#### 🗂️ TCA & FlexForm

**TCA Select with Items:**
```
Create a TCA select field for tt_content with 5 layout options. Include icons, default value, and proper labeling.
```

**TCA Group Field:**
```
Add a TCA group field to my model for selecting multiple pages. Include proper MM relation and maxitems configuration.
```

**TCA Inline (IRRE):**
```
Configure TCA inline relations for a parent-child relationship between Event and Ticket models. Include sorting, expand/collapse, and appearance options.
```

**FlexForm Configuration:**
```
Create a FlexForm for my plugin with tabs: General (items per page, sort order), Display (template selection, show images), and Filter (category selection).
```

**FlexForm with Database Records:**
```
Add a FlexForm field that allows selecting multiple news categories from the database. Use itemsProcFunc or foreign_table.
```

---

#### 🔗 Routing & Site Configuration

**Custom Route Enhancers:**
```
Create a route enhancer for my events plugin that generates URLs like /events/2024/01/my-event-title instead of ?tx_events[event]=123
```

**Localized Routes:**
```
Configure site routing for a multi-language site with German (de), English (en), and French (fr). Include language fallbacks and proper base paths.
```

**Static Routes:**
```
Add static routes for /sitemap.xml, /robots.txt, and a custom /api/* route that bypasses TYPO3's page handling.
```

---

#### 📁 File Handling (FAL)

**File Upload Processing:**
```
Create a service that processes uploaded images: resize to max 2000px, convert to WebP, and store in a specific folder with proper FAL references.
```

**File Metadata Extraction:**
```
Extract and store EXIF data from uploaded images: camera model, date taken, GPS coordinates. Update the sys_file_metadata table.
```

**Custom File Processor:**
```
Create a custom image processor that adds a watermark to images on-the-fly when requested with a specific processing instruction.
```

---

#### 🌐 Localization & Translation

**Multi-Language Content:**
```
Set up proper translation handling for my custom model. Include language overlay configuration, fallback types, and translation workflow.
```

**XLIFF Translations:**
```
Create XLIFF translation files for German, English, and French. Include pluralization rules and context descriptions for translators.
```

**Translation Sync:**
```
Create a command that synchronizes translations from a translation management system (like Phrase or Lokalise) into TYPO3 XLIFF files.
```

---

#### 📧 Powermail Forms & Email (typo3-powermail)

**Powermail Contact Form:**
```
Create a Powermail contact form with firstname, lastname, email, company, message, and GDPR consent checkbox. Add a confirmation step and thank-you redirect.
```

**Custom Powermail Finisher:**
```
Create a custom Powermail finisher that sends submitted data to a CRM API after form submission. Include error handling, logging, and retry-safe behavior.
```

**Custom Powermail Validator:**
```
Create a custom Powermail validator that blocks disposable email domains and only accepts business email addresses from an allowed domain list.
```

**Powermail Spam Protection:**
```
Configure Powermail spam protection for a public contact form: honeypot, time checks, link limits, and sensible thresholds for false positives.
```

**Powermail Email Templates:**
```
Create styled Powermail receiver and sender email templates with Fluid. Keep them email-client friendly, use inline-safe markup, and provide a plain text fallback.
```

---

#### ⚡ Caching & Performance

**Custom Cache Configuration:**
```
Configure Redis caching for my extension with proper cache groups, lifetime settings, and cache tags for targeted invalidation.
```

**Cache Tags Strategy:**
```
Implement a caching strategy for my news listing that uses cache tags to invalidate only affected pages when a news item is updated.
```

**Performance Optimization:**
```
Analyze and optimize my TYPO3 site's performance: database queries, cache configuration, asset loading, and image optimization.
```

---

#### 🔐 Authentication & Permissions

**Frontend User Registration:**
```
Create a frontend user registration flow with email verification, password requirements, and custom fields. Handle fe_users and fe_groups.
```

**Backend User Permissions:**
```
Configure granular backend user permissions: restrict access to specific page trees, content types, and file mounts. Set up user groups properly.
```

**SSO Integration:**
```
Integrate SAML-based SSO for backend users using Azure AD or Okta. Include proper user provisioning and group mapping.
```

---

#### 🔌 API Development

**REST API Endpoint:**
```
Create a REST API endpoint for my Product model with GET (list/detail), POST (create), PUT (update), and DELETE operations. Include authentication.
```

**API Rate Limiting:**
```
Implement rate limiting for my API endpoints: 100 requests per minute per API key, with proper headers and error responses.
```

**Headless TYPO3:**
```
Configure TYPO3 for headless operation with JSON output. Set up content elements as JSON, configure CORS, and handle routing for a React/Vue frontend.
```

---

#### 🛠️ CLI Commands

**Custom CLI Command:**
```
Create a Symfony Console command for my extension that imports products from a CSV file. Include progress bar, dry-run mode, and validation.
```

**Scheduled Command:**
```
Create a CLI command that runs nightly to clean up expired records, send reminder emails, and generate reports. Include proper logging.
```

---

#### 📊 Logging & Debugging

**Custom Logger:**
```
Set up custom logging for my extension: separate log files, different log levels for dev/prod, and structured logging with context data.
```

**Debug Middleware:**
```
Create a debugging middleware that logs all requests with timing, memory usage, and database query counts in development mode.
```

**Error Handling:**
```
Implement proper error handling for my API: custom exceptions, error codes, meaningful messages, and integration with Sentry or similar.
```

---

#### 🎥 HyperFrames Video Production

**HTML-Based Product Intro:**
```
Using the hyperframes skill, create a 10-second product intro with a fade-in title, a background video, and background music.
```

**Website to Video:**
```
Capture https://example.com and turn it into a 25-second product launch video with a clear hook, voiceover, and scene transitions.
```

**Short-Form Social Video:**
```
Make a 9:16 TikTok-style hook video about this feature using HyperFrames, with bouncy captions synced to TTS narration.
```

**Registry Block Installation:**
```
Install the data-chart block with hyperframes add, then wire it into index.html and explain the required data-composition attributes.
```

**CLI Workflow:**
```
Scaffold a new HyperFrames project, lint it, preview it locally, and render a draft MP4. Call out any environment issues first.
```

**GSAP Scene Animation:**
```
Write a GSAP timeline for a HyperFrames scene where the headline, subtitle, and CTA animate in with staggered entrances and a clean transition to the next scene.
```

---

#### 🎬 Video Creation with Remotion

**Basic Video Composition:**
```
Create a Remotion composition with a 1920x1080 video at 30fps, 5 seconds duration. Add a centered title that fades in.
```

**Animated Text Intro:**
```
Build a YouTube-style intro: logo zooms in with spring animation, title types in letter-by-letter, then both fade out.
```

**Audio Visualization:**
```
Create an audio visualizer that reacts to music. Use waveform data to animate bars that pulse with the beat.
```

**TikTok-Style Captions:**
```
Add TikTok-style word-by-word captions to my video. Highlight the current word, use a bold font, and add a subtle shadow.
```

**Scene Transitions:**
```
Create a video with 3 scenes using slide and fade transitions. Each scene has different background colors and centered text.
```

**3D Product Showcase:**
```
Build a 3D product rotation video using React Three Fiber. The product rotates 360° with smooth easing over 4 seconds.
```

**Data Visualization Video:**
```
Create an animated bar chart that grows from zero. Each bar animates in sequence with a spring effect. Add value labels.
```

**Video with Dynamic Duration:**
```
Create a Remotion composition where the duration is calculated based on the audio file length using calculateMetadata.
```

**GIF Integration:**
```
Embed an animated GIF into my Remotion video, synchronized with the timeline. Loop it 3 times during a 6-second segment.
```

**Lottie Animation:**
```
Add a Lottie animation to my video intro. Synchronize the Lottie playback with Remotion's frame timing.
```

**Custom Fonts:**
```
Load a custom Google Font (Inter) and a local font file (.woff2) for my video. Apply different weights to title and subtitle.
```

**Video Trimming:**
```
Embed an external video file, trim the first 2 seconds, and play it at 1.5x speed. Add a fade-out at the end.
```

**Thumbnail Generation:**
```
Create a Still composition for video thumbnails. Include the video title, a background image, and a play button overlay.
```

**Sequenced Animations:**
```
Create a sequence of 5 elements that animate in one after another with 0.5s delays. Use useCurrentFrame and interpolate.
```

**Spring Physics:**
```
Animate a bouncing ball using spring physics. Configure tension, friction, and mass for a realistic bounce effect.
```

---

#### 📖 Product Documentation & Video Tours (webconsulting-create-documentation)

The `webconsulting-create-documentation` skill creates **complete product documentation**: help pages, AI-generated screenshots, narrated product tour videos (Remotion + ElevenLabs TTS + Suno AI music), and animated diagrams with GSAP.

**Help Pages:**

```
Create a help page for my Next.js app with collapsible FAQ sections, step-by-step instructions, and AI-generated placeholder illustrations.
```

```
Build a user guide with navigation sidebar, search, and dark/light mode support.
```

**Product Tour Videos:**

```
Create a 60-second product tour video with Remotion. Include title card, 3 feature scenes with narration, and an end card with QR codes.
```

```
Generate ElevenLabs TTS narration in a Jony Ive-inspired calm, deliberate style for my product walkthrough script.
```

```
Add Suno AI background music to my Remotion video with automatic volume ducking during narration.
```

**Remotion + GSAP Animations:**

```
Create an animated architecture diagram where SVG nodes pop in with elastic easing and connection lines draw themselves between components.
```

```
Build a 3D exploded screenshot view: separate my UI into layers (background, modal, buttons), tilt into isometric perspective, and pull layers apart on the Z-axis.
```

```
Animate a data dashboard with number odometers counting up, staggered table row reveals, and spring-loaded bar charts.
```

```
Create a code diff walkthrough animation: removed lines shrink and glow red, new lines expand and glow green, unchanged lines glide to new positions.
```

```
Animate a glass morph spotlight effect that zooms into a UI area using clip-path while blurring the rest of the screenshot.
```

**GitHub README Documentation:**

```
Create GitHub README documentation with dark/light theme screenshots using <picture> tags and an embedded product video.
```

---

#### 🗺️ Architecture Diagrams (excalidraw)

The `excalidraw` skill generates **real `.excalidraw` diagrams** from codebase analysis and can export them to PNG or SVG.

**Repository Architecture:**

```
Generate an architecture diagram for this project as an .excalidraw file. Show the main modules, external services, databases, and data flows.
```

**System Overview Export:**

```
Create a system diagram for my app in Excalidraw and export it as both .excalidraw and SVG.
```

**Workflow Visualization:**

```
Visualize my checkout flow as an Excalidraw diagram: frontend, backend, payment provider, webhooks, and confirmation emails.
```

---

#### 🖼️ OG Images & Social Sharing

**Generate OG Image:**
```
Create an OG image page for my Next.js app that matches my existing design system. Use my brand colors and fonts.
```

**Social Meta Tags:**
```
Configure all necessary Open Graph and Twitter card meta tags for my website. Include og:image at 1200x630.
```

**Screenshot OG Page:**
```
Navigate to my /og-image page, resize to 1200x630, and take a screenshot for use as og:image.
```

**Cache Busting:**
```
I've updated my OG image. How do I refresh the cache on Facebook, Twitter, and LinkedIn?
```

**Design Templates:**
```
Show me the different OG image design templates available: cosmic, editorial, brutalist, ethereal.
```

---

#### 🎯 Common Tasks & Fixes

**Fix Broken Relations:**
```
My database has orphaned records and broken relations. Create a command that finds and optionally fixes these issues safely.
```

**Bulk Content Update:**
```
I need to update all tt_content records of a certain type: change a field value, update relations, and clear cache. Use DataHandler properly.
```

**Site Migration:**
```
Migrate content from an old TYPO3 v10 installation to v14. Map old content types to new ones, handle file references, and preserve URLs.
```

**Extension Conflicts:**
```
Debug conflicts between two extensions that both modify the same TCA or hook into the same events. Find the issue and suggest resolution.
```

**Database Optimization:**
```
Analyze my database for performance issues: missing indexes, large tables, unused fields. Suggest optimizations and create migration scripts.
```

---

#### 🐘 Postgres & Supabase

**Optimize Slow Query:**
```
Optimize this slow Postgres query. Use EXPLAIN ANALYZE to identify bottlenecks and suggest proper indexes.
```

**Row Level Security Setup:**
```
Set up Row Level Security for my multi-tenant orders table. Users should only see their own orders. Use auth.uid() with proper caching.
```

**Connection Pooling:**
```
Configure PgBouncer connection pooling for my Supabase project. Recommend pool size based on 4GB RAM.
```

**Find Missing Indexes:**
```
Find all foreign key columns in my database that are missing indexes. Generate CREATE INDEX statements.
```

**Cursor Pagination:**
```
Convert my OFFSET-based pagination to cursor-based pagination for the products table. Handle multi-column sorting.
```

**Batch Operations:**
```
Optimize my bulk insert loop. Convert individual INSERTs to batched statements or COPY for better performance.
```

**RLS Performance:**
```
Review my RLS policies for performance issues. Wrap function calls in SELECT for caching and add proper indexes.
```

**JSONB Indexing:**
```
My JSONB queries on the products.attributes column are slow. Add the right index type (GIN vs expression index).
```

---

#### 📈 Marketing & Growth

**Landing Page CRO:**
```
Optimize this landing page for conversions. Analyze the value proposition, headline, CTAs, and social proof placement.
```

**Homepage Copywriting:**
```
Write homepage copy for my SaaS product that helps teams manage projects. Focus on clarity over cleverness.
```

**Headline Formulas:**
```
Generate 5 headline variations for my product using proven formulas. Product: email marketing tool for e-commerce.
```

**CTA Optimization:**
```
Improve these CTA buttons. Current: "Submit", "Learn More", "Sign Up". Make them value-focused.
```

**Pricing Strategy:**
```
Review my pricing page. I have 3 tiers at $29, $79, $199. Should the middle tier be recommended? How do I handle enterprise?
```

**Freemium vs Trial:**
```
Should I use freemium or free trial for my collaboration tool? What are the pros and cons of each?
```

**SEO Audit:**
```
Audit my site for SEO issues. Check technical SEO, on-page optimization, and content quality.
```

**Pricing Psychology:**
```
What psychological principles can I apply to my pricing page to increase conversions?
```

**Page Structure:**
```
Help me structure my landing page. What sections should I include and in what order?
```

**Objection Handling:**
```
What objections might visitors have on my pricing page and how should I address them?
```

**A/B Test Ideas:**
```
Suggest A/B test ideas for my homepage hero section. What should I test first?
```

**Social Proof Strategy:**
```
How should I incorporate social proof on my landing page? Where should logos, testimonials, and stats go?
```

---

#### ⚛️ React & Next.js Performance (Vercel Best Practices)

The `react-best-practices` skill contains **69 rules across 8 priority categories** from Vercel Engineering. It automatically detects performance anti-patterns and suggests fixes prioritized by impact.

**Why it's cool:** Instead of guessing what to optimize, you get Vercel's battle-tested rules applied automatically. The skill catches issues like request waterfalls, bundle bloat, and re-render storms that kill Core Web Vitals.

**Critical: Eliminate Waterfalls (Priority 1)**

```
I have this data fetching code that feels slow:

const user = await fetchUser(id);
const posts = await fetchPosts(userId);
const comments = await fetchComments(postId);

Why is it slow and how do I fix it?
```

```
Add Suspense boundaries to my Next.js page so the header shows immediately while data loads.
```

```
My API route awaits a database call early but only uses it in one branch. How do I defer the await?
```

**Critical: Bundle Size (Priority 2)**

```
My Next.js bundle is 2MB. Analyze my imports and find barrel file imports that pull in entire libraries.
```

```
I'm importing a heavy charting library. Show me how to use next/dynamic with a loading skeleton.
```

```
Move my analytics initialization to after hydration so it doesn't block the main bundle.
```

```
I have a feature flag that controls a heavy component. Only load the component when the flag is true.
```

**High: Server-Side Performance (Priority 3)**

```
I'm calling getUser() in multiple server components. Show me how to use React.cache() to deduplicate.
```

```
Restructure this server component to start fetches in the parent and await in children (parallel fetching).
```

```
I need to log analytics after responding. Use next/after() to make it non-blocking.
```

```
My server component passes a huge object to a client component. How do I minimize serialization?
```

**Medium-High: Client-Side Data Fetching (Priority 4)**

```
Convert my useEffect + useState data fetching to SWR for automatic deduplication and caching.
```

```
I'm adding scroll event listeners in multiple components. Show me how to deduplicate them.
```

```
Make my scroll listeners passive to improve scrolling performance.
```

**Medium: Re-render Optimization (Priority 5)**

```
This component re-renders every time state changes, but it only uses state in a callback. Fix it.
```

```
Extract my expensive list rendering into a memoized component.
```

```
My callback changes on every render because it references count. Use functional setState.
```

```
I'm computing derived state in useEffect. Show me how to derive it during render instead.
```

```
My search input lags because filtering is slow. Use startTransition for the non-urgent filter update.
```

```
I'm storing mouse position in state but I only use it in event handlers. Use a ref instead.
```

**Medium: Rendering Performance (Priority 6)**

```
I have a long list with 1000 items. Add content-visibility: auto for performance.
```

```
This static JSX is defined inside the component. Hoist it outside to avoid recreating.
```

```
I'm animating an SVG directly. Wrap it in a div and animate the wrapper instead.
```

```
I get hydration mismatch warnings for user-specific data. How do I handle client-only values?
```

**Low-Medium: JavaScript Performance (Priority 7)**

```
I'm setting multiple CSS properties in a loop. Batch them using cssText or a class.
```

```
I'm doing array.includes() in a loop. Build a Set for O(1) lookups.
```

```
I'm accessing object.nested.value repeatedly in a loop. Cache it in a variable.
```

```
I have filter().map().filter(). Combine into a single loop.
```

```
This function sorts an array just to find the max. Use a loop instead.
```

**Advanced Patterns (Priority 8)**

```
My event handler function changes every render. Store it in a ref for stable reference.
```

```
I need to initialize an SDK once per app load, not per render. Show me the init-once pattern.
```

---

#### 🔬 Media Forensics & Deepfake Detection

**Verify Media Authenticity:**
```
Verify authenticity of this video before publication. Check for temporal inconsistencies, face swap artifacts, and synthetic speech patterns.
```

**Detect AI-Generated Images:**
```
Is this image AI-generated? Check for diffusion model artifacts, GAN fingerprints, and semantic inconsistencies.
```

**PRNU Analysis:**
```
Analyze PRNU/PCE sensor fingerprints to match this image to its claimed camera source.
```

**Content Provenance:**
```
Verify C2PA/CAI content provenance and check the cryptographic chain of custody for this media file.
```

**Forensic Report:**
```
Create a forensic report with authenticity grade (1-6) and confidence intervals for this video.
```

---

#### 📊 Agent Readiness Assessment

**Run Readiness Report:**
```
Run /readiness-report to evaluate this repository for AI-assisted development readiness.
```

**Identify Gaps:**
```
What gaps are preventing effective autonomous development in this codebase?
```

**Maturity Level:**
```
Check which maturity level (L1-L5) this repo achieves across the 9 technical pillars.
```

---

#### 🚀 Deployment & DevOps

**Deployer Configuration:**
```
Create a Deployer configuration for deploying TYPO3 to staging and production servers. Include database sync, shared files, and rollback capability.
```

**GitHub Actions Deployment:**
```
Set up GitHub Actions for automated deployment: run tests on PR, deploy to staging on merge to develop, deploy to production on release tag.
```

**Docker Production Setup:**
```
Create a production-ready Docker setup for TYPO3: nginx, PHP-FPM, Redis, with proper health checks, logging, and security hardening.
```

### Discovery Commands

```bash
# List all installed skills (any client)
ls ~/.cursor/skills/
ls ~/.claude/skills/
ls ~/.gemini/skills/

# List project-level skills
ls .cursor/skills/

# View a specific skill's content
cat skills/typo3-ddev/SKILL.md

# Search for a keyword across all skills
grep -r "DataHandler" skills/

# Re-install after pulling updates
./install.sh
```

### Pro Tips

1. **Use `/` to invoke skills** - Type `/typo3-content-blocks` in Agent chat
2. **Use trigger keywords naturally** - Just mention "ddev" or "datahandler" in your prompt
3. **Be explicit for complex tasks** - Start with "Using the security-audit skill..."
4. **Combine skills** - "Using typo3-rector and typo3-testing, upgrade my extension and add tests"
5. **Check the skill source** - Read `~/.claude/skills/*/SKILL.md` first, then follow links into `references/` only when the skill asks for more detail
6. **View in settings** - Go to `Cursor Settings → Rules` to see all discovered skills

## What's Included

### Agent Skills

| Skill | Purpose | Origin |
|-------|---------|--------|
| **TYPO3 Development** | | |
| `typo3-content-blocks` | Content Elements & Record Types with single source of truth | webconsulting |
| `typo3-shadcn-content-elements` | Preset-driven shadcn/ui styling, previews, icons, and seed coverage for TYPO3 Content Blocks | webconsulting |
| `desiderio-teach` | Teaching workspaces and TYPO3 lesson pages built with Desiderio content elements | Matt Pocock |
| `typo3-translations` | TYPO3 13/14 labels, XLIFF 1.2 baseline, XLIFF 2.0 upgrades, ICU strings, paths, domains, and migration checklists | webconsulting |
| `typo3-idea-extension-blog` | Assess ideas for TYPO3, build an extension, and draft the companion German MDX post | webconsulting |
| `typo3-news-tags` | Bulk-generate and assign thematic tags for georgringer/news | webconsulting |
| `typo3-datahandler` | Transactional database operations via DataHandler | webconsulting |
| `typo3-ddev` | Local DDEV development environment | Netresearch |
| `typo3-testing` | Unit, functional, E2E, architecture testing | Netresearch |
| `typo3-conformance` | Extension standards compliance checker | Netresearch |
| `typo3-docs` | Documentation using docs.typo3.org standards | Netresearch |
| `typo3-core-contributions` | TYPO3 Core contribution workflow (Gerrit, Forge) | Netresearch |
| `typo3-initial-release` | First official TYPO3 14.3+ extension release workflow, final review, and tagging | webconsulting |
| **Upgrade & Migration** | | |
| `typo3-rector` | TYPO3 upgrade patterns with Rector | webconsulting |
| `typo3-update` | TYPO3 TYPO3 v14 migration guide (prefers v14) | webconsulting |
| `typo3-14-update` | End-to-end TYPO3 14.3 LTS project and extension updater with production-readiness gates | webconsulting |
| `typo3-extension-upgrade` | Systematic extension upgrades (Rector, Fractor) | Netresearch |
| `typo3-fractor` | Automated non-PHP migrations (FlexForm, TypoScript, Fluid, YAML) | webconsulting |
| `typo3-icon14` | Design and migrate TYPO3 v14 extension icons | webconsulting |
| **Security & Operations** | | |
| `typo3-security` | Security hardening checklist | webconsulting |
| `typo3-seo` | SEO configuration with EXT:seo | webconsulting |
| `typo3-accessibility` | WCAG 2.2 AA audit, Fluid/PHP/JS patterns, go-live checklist | webconsulting |
| `typo3-wcag22-aa-agentic` | Agentic WCAG 2.2 AA audits, Playwright/axe tooling, manual review helper, and accessibility statement drafts for TYPO3 | webconsulting |
| `typo3-simplify` | Simplify TYPO3 code for clarity and maintainability | Anthropic |
| `typo3-batch` | Batch operations for large-scale TYPO3 migrations | webconsulting |
| `typo3-powermail` | Powermail 13+ forms, finishers, validators, events | webconsulting |
| `typo3-records-list-types` | Grid, Compact, Teaser view modes for Records module | webconsulting |
| `typo3-workspaces` | Workspaces versioning, staging, publishing workflows | webconsulting |
| `typo3-visual-editor` | FriendsOfTYPO3 Visual Editor installation, Fluid template migration, inline editing, content areas, FAQ, and troubleshooting | webconsulting |
| `typo3-webcomponents` | TYPO3 v14 backend Web Components with Lit, import maps, backend modules, Form Editor, AJAX routes, and frontend usage decisions | webconsulting |
| `typo3-vite` | Vite build setup for TYPO3 with vite-asset-collector, SCSS, Bootstrap, SVG optimization, and CSP compliance | Netresearch |
| `typo3-solr` | Apache Solr search: indexing, facets, suggest, vector search | webconsulting |
| `security-audit` | Security audit patterns (OWASP, XXE, SQLi, XSS) | Netresearch |
| `security-incident-reporting` | NIST/SANS incident reports, DDoS post-mortem, CVE correlation | webconsulting |
| `deepfake-detection` | Multimodal media authentication, synthetic media forensics | webconsulting |
| `enterprise-readiness` | OpenSSF, SLSA, supply chain security | Netresearch |
| **AI & SEO** | | |
| `ai-search-optimization` | AEO/GEO for AI search (schema, llms.txt, TYPO3, MDX) | webconsulting |
| `readiness-report` | AI agent readiness assessment (9 pillars, 5 maturity levels) | OpenHands |
| **Code Quality & Refactoring** | | |
| `architecture-decision-records` | Create and review ADRs with verifiable evidence and lifecycle guidance | webconsulting |
| `agent-md-refactor` | Refactor bloated AGENTS.md/CLAUDE.md with progressive disclosure | Softaworks |
| `autoreview` | Structured closeout code review workflow with bundled helper scripts | Peter Steinberger |
| `refactor` | Code refactoring patterns, code smells, design patterns | GitHub |
| `refactor-clean` | Clean code principles, SOLID patterns, incremental refactoring | sickn33 |
| `find-skills` | Discover and install skills from skills.sh ecosystem | Vercel |
| `caveman` | Ultra-compressed communication mode for lower-token technical conversation | Matt Pocock |
| `grill-me` | Stress-test a plan or design through one-at-a-time interview questions | Matt Pocock |
| `diagnose` | Disciplined diagnosis loop for bugs and performance regressions | Matt Pocock |
| `grill-with-docs` | Stress-test plans against domain docs, `CONTEXT.md`, and ADRs | Matt Pocock |
| `handoff` | Compact the current conversation into a handoff document | Matt Pocock |
| `improve-codebase-architecture` | Find architecture deepening opportunities in a codebase | Matt Pocock |
| `prototype` | Build throwaway prototypes to explore logic, state, or UI choices | Matt Pocock |
| `setup-matt-pocock-skills` | Scaffold issue tracker, triage labels, and domain doc config | Matt Pocock |
| `tdd` | Test-driven development with a red-green-refactor loop | Matt Pocock |
| `to-issues` | Break plans and PRDs into independently grabbable issues | Matt Pocock |
| `to-prd` | Turn current context into a PRD issue | Matt Pocock |
| `triage` | Triage issues through a role-driven state machine | Matt Pocock |
| `write-a-skill` | Create new skills with progressive disclosure and bundled resources | Matt Pocock |
| `zoom-out` | Ask for broader system context around unfamiliar code | Matt Pocock |
| **PHP & Tools** | | |
| `php-modernization` | PHP 8.x patterns, PHPStan, DTOs, enums | Netresearch |
| `cli-tools` | CLI tool management and auto-installation | Netresearch |
| `context7` | Library documentation lookup via REST API | Netresearch |
| `firecrawl` | Firecrawl CLI for web scraping, search, and research | Firecrawl |
| `skill-creator` | Guide for creating and packaging Agent Skills | Anthropic |
| **Database** | | |
| `postgres-best-practices` | Postgres performance, RLS, indexes, pooling | Supabase |
| **Marketing** | | |
| `marketing-skills` | CRO, copywriting, SEO, pricing, psychology | Corey Haines |
| `ad-creative` | Ad creative generation and iteration for paid platforms | Corey Haines |
| `ads` | Paid ads campaign strategy, targeting, bidding, and optimization | Corey Haines |
| `ai-seo` | AI search visibility and LLM citation optimization | Corey Haines |
| `analytics` | Analytics tracking, measurement plans, events, and attribution | Corey Haines |
| `aso` | App Store and Google Play listing optimization | Corey Haines |
| `churn-prevention` | Churn reduction, cancel flows, dunning, and win-back strategy | Corey Haines |
| `co-marketing` | Partner identification and joint campaign planning | Corey Haines |
| `cold-email` | B2B cold outreach emails and follow-up sequences | Corey Haines |
| `community-marketing` | Community strategy, engagement, and community-led growth | Corey Haines |
| `competitor-profiling` | Competitor research and profile generation from URLs | Corey Haines |
| `competitors` | Competitor comparison and alternative pages for SEO and sales | Corey Haines |
| `content-strategy` | Content strategy, topic planning, and editorial roadmaps | Corey Haines |
| `copy-editing` | Marketing copy review, editing, and refresh guidance | Corey Haines |
| `copywriting` | Marketing copywriting for pages, CTAs, and positioning | Corey Haines |
| `corey-ab-testing` | Corey Haines A/B testing and experimentation program guidance | Corey Haines |
| `corey-programmatic-seo` | Corey Haines programmatic SEO pages at scale | Corey Haines |
| `cro` | Page and form conversion rate optimization | Corey Haines |
| `customer-research` | Customer research interviews, synthesis, and voice-of-customer analysis | Corey Haines |
| `directory-submissions` | Directory submission strategy for discovery and backlinks | Corey Haines |
| `emails` | Lifecycle email sequences, drip campaigns, and automated flows | Corey Haines |
| `free-tools` | Free tool strategy for SEO, leads, and brand awareness | Corey Haines |
| `image` | Marketing image generation and optimization workflows | Corey Haines |
| `launch` | Product launch, feature announcement, and release strategy | Corey Haines |
| `lead-magnets` | Lead magnet planning, gated content, and capture optimization | Corey Haines |
| `marketing-ideas` | Marketing ideas, growth inspiration, and channel brainstorming | Corey Haines |
| `marketing-psychology` | Behavioral science and mental models for marketing | Corey Haines |
| `onboarding` | Post-signup onboarding, activation, and time-to-value optimization | Corey Haines |
| `paywalls` | Paywall, upgrade screen, upsell, and feature gate optimization | Corey Haines |
| `popups` | Popup, modal, overlay, slide-in, and banner conversion optimization | Corey Haines |
| `pricing` | Pricing, packaging, value metrics, and monetization strategy | Corey Haines |
| `product-marketing` | Product marketing context, positioning, and messaging foundation | Corey Haines |
| `prospecting` | Prospect list building, qualification, and outbound lead research | Corey Haines |
| `referrals` | Referral, affiliate, ambassador, and word-of-mouth programs | Corey Haines |
| `revops` | Revenue operations, lead lifecycle, scoring, and handoff processes | Corey Haines |
| `sales-enablement` | Sales collateral, pitch decks, one-pagers, and demo scripts | Corey Haines |
| `schema` | Schema markup and structured data for rich results | Corey Haines |
| `seo-audit` | Technical SEO, on-page SEO, and content quality audits | Corey Haines |
| `signup` | Signup, registration, account creation, and trial activation optimization | Corey Haines |
| `site-architecture` | Website hierarchy, navigation, URL structure, and internal linking | Corey Haines |
| `sms` | SMS and MMS marketing flows, campaigns, compliance, and optimization | Corey Haines |
| `social` | Social media content, calendars, repurposing, and short-form scripts | Corey Haines |
| `video` | Marketing video production with AI and programmatic video tools | Corey Haines |
| **Frontend & Design** | | |
| `webconsulting-branding` | Borderless square surfaces, header-only notices, logo-first project identity | webconsulting |
| `ui-design-patterns` | Practical UI design patterns, accessibility | webconsulting |
| `frontend-design` | Distinctive UI aesthetics, anti-AI-slop patterns | Anthropic |
| `impeccable` | Production-grade frontend design, critique, polish, and live iteration | pbakaus |
| `web-design-guidelines` | Interface review, WCAG, ARIA, accessibility | Vercel |
| `excalidraw` | Architecture diagrams as `.excalidraw` with optional PNG/SVG export | ooiyeefei |
| `og-image` | Social preview images (Open Graph), meta tags, Twitter cards | Stevy Smith |
| `react-best-practices` | React/Next.js performance optimization (69 rules) | Vercel |
| `shadcn-ui` | shadcn/ui component patterns (Radix UI, Tailwind CSS, Zod) | Giuseppe Trisciuoglio |
| **Documents & Office** | | |
| `document-processing` | PDF, DOCX, PPTX, XLSX creation, editing, analysis | Anthropic |
| **Video & Animation** | | |
| `hyperframes` | HTML-based video compositions, captions, voiceovers, audio-reactive visuals, transitions | HeyGen |
| `hyperframes-cli` | CLI workflow for HyperFrames init, lint, preview, render, transcribe, and TTS | HeyGen |
| `hyperframes-registry` | Registry blocks/components via `hyperframes add` | HeyGen |
| `website-to-hyperframes` | Capture a website and turn it into a HyperFrames video workflow | HeyGen |
| `gsap` | GSAP animation reference for HyperFrames compositions | HeyGen |
| `remotion-best-practices` | Video creation in React with Remotion | remotion-dev |
| `webconsulting-create-documentation` | Product docs, help pages, video tours (Remotion + GSAP + TTS) | webconsulting |
| `micro-interactions` | Disney's 12 animation principles applied to UI feedback moments | Dylan Tarre |
| `microinteractions` | Dan Saffer's Microinteractions framework for triggers, rules, feedback, and loops | wondelai |
| **Legal & Compliance** | | |
| `legal-impressum` | Austrian Impressum base skill with `GERMANY`, `EU`, and `WORLD` supplements | webconsulting |
| **Platform Design** | | |
| `android-design` | Material Design 3, Jetpack Compose, dynamic color | ehmo |
| `ios-design` | Apple HIG for iPhone, SwiftUI, Dynamic Type | ehmo |
| `ipados-design` | Apple HIG for iPad, multitasking, pointer support | ehmo |
| `macos-design` | Apple HIG for Mac, menu bar, toolbars, shortcuts | ehmo |
| `tvos-design` | Apple HIG for Apple TV, focus navigation, 10-foot UI | ehmo |
| `visionos-design` | Apple HIG for Vision Pro, spatial UI, eye/hand input | ehmo |
| `watchos-design` | Apple HIG for Apple Watch, complications, glanceable UI | ehmo |
| `web-platform-design` | WCAG 2.2, responsive design, forms, typography, i18n | ehmo |
| **CRO & Growth** | | |
| `cro-funnel` | Full-funnel CRO: form, signup, onboarding, popup, paywall | AITYTech |
| `programmatic-seo` | SEO pages at scale with templates and data | AITYTech |
| `launch-strategy` | Product launches, Product Hunt, go-to-market | AITYTech |
| `ab-testing` | A/B test design, sample size, statistical significance | AITYTech |

### Category-Specific Add-ons

The repository keeps a small number of category-specific add-on files alongside the main skills:

| Supplement | Purpose |
|------------|---------|
| `skills/typo3-solr/SKILL-SOLRFAL.md` | File indexing with solrfal and Apache Tika |
| `skills/typo3-solr/SKILL-FRONTEND.md` | Custom vanilla JS for search, suggest, facets without jQuery |

**Add-on routing:**
- `skills/typo3-solr/SKILL-SOLRFAL.md` -> file indexing with solrfal and Apache Tika
- `skills/typo3-solr/SKILL-FRONTEND.md` -> custom vanilla JS search frontends

### IDE Integration

- **Cross-client skills**: Same `SKILL.md` files work across all supported AI coding assistants
- **Gemini CLI manifest**: `gemini-extension.json` with triggers for every top-level `skills/*/SKILL.md` directory
- **MCP Configuration**: Placeholder for DDEV, Hetzner, and MySQL servers

## Architecture

```
                        ┌──────────────────┐
                        │  skills/ (source) │
                        │  137 SKILL.md     │
                        └────────┬─────────┘
                                 │ symlinks
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
    ┌──────▼──────┐     ┌───────▼───────┐    ┌───────▼───────┐
    │  User-Level  │     │ Project-Level  │    │  Native Read   │
    ├──────────────┤     ├────────────────┤    ├────────────────┤
    │ ~/.cursor/   │     │ .cursor/skills │    │ AGENTS.md      │
    │ ~/.claude/   │     │ .cursor/rules  │    │ CLAUDE.md      │
    │ ~/.gemini/   │     │ .codex/skills  │    │ GEMINI.md      │
    │ ~/.codex/    │     │ .gemini/skills │    │ .windsurfrules │
    │ ~/.codeium/  │     │ .windsurf/...  │    │ .github/       │
    │             │     │                │    │  copilot-...md │
    └──────────────┘     └────────────────┘    └────────────────┘

    Cursor, Claude       Cursor, Gemini,        No install needed
    Code, Gemini CLI,    Codex, Windsurf        — each client reads
    Codex, Windsurf                             its native config file
```

## Configuration

### MCP Servers

Edit `.cursor/mcp.json` to add your MCP server configurations:

```json
{
  "mcpServers": {
    "ddev": {
      "command": "npx",
      "args": ["-y", "@codingsasi/ddev-mcp"]
    },
    "hetzner": {
      "command": "npx",
      "args": ["-y", "mcp-hetzner"],
      "env": {
        "HCLOUD_TOKEN": "${HCLOUD_TOKEN}"
      }
    }
  }
}
```

### Updating Skills

**Quick Update (recommended):**

```bash
# Update everything in one command
./update.sh --pull

# Or step by step:
git pull origin main
./update.sh
```

**Using Composer:**

```bash
# Update skills via composer
composer skills:update

# Sync external skills only (no reinstall)
composer skills:sync

# List all available skills
composer skills:list

# Full reinstall
composer skills:install
```

**Update Script Options:**

```bash
./update.sh              # Sync external skills and reinstall
./update.sh --pull       # Pull git changes first, then update
./update.sh --sync-only  # Sync external skills and generated catalog/files, don't reinstall
./update.sh --skill NAME # Sync one enabled external skill by name
./update.sh --force      # Stash local changes if needed
./update.sh --dry-run    # Show what would be done without making changes
./update.sh --help       # Show all options
```

### GitHub Push -> skills.sh Publish (Checklist)

Use this simple flow to keep publication deterministic:

```bash
# 1) Push skill changes
git push origin main

# 2) Refresh imported skills, catalogs, and extension manifests if needed
./update.sh --sync-only

# 3) Regenerate local mirrors
./install.sh

# 4) Commit generated files and push
git add -A && git commit -m "chore: refresh generated skill mirrors" && git push
```

Then run the GitHub workflow `skills-sh-publish-check.yml` (manual dispatch) and verify your skill on skills.sh by searching for repository + skill name.

**Syncing External Skills:**

The `.sync-config.json` file defines external skill sources that are automatically synchronized:

```json
{
  "skills": [
    {
      "name": "react-best-practices",
      "source": "https://github.com/vercel-labs/agent-skills.git",
      "branch": "main",
      "path": "skills/react-best-practices",
      "enabled": true
    }
  ]
}
```

To enable/disable external skill syncing, edit `.sync-config.json` and set `enabled: true/false`.
The importer copies `SKILL.md` plus any `agents/`, `assets/`, `examples/`, `references/`,
`rules/`, and `scripts/` folders from the upstream skill directory.
Keep local-only overlays in repo-owned skills, not inside synced upstream subfolders,
because those folders are replaced on the next import.

The curated `skills/marketing-skills/` wrapper remains repo-owned and keeps its
upstream thank-you/reference text, but it is not backed by a full mirrored copy
of Corey Haines' repository inside `external/`.

**GitHub Actions Auto-Sync:**

The `sync-skills.yml` workflow runs weekly (Mondays 06:00 UTC) and can be triggered manually. It syncs enabled skills from upstream repos and opens a PR on the `chore/sync-skills` branch.

The repository also enforces upstream attribution guardrails in CI via
`scripts/check_attribution_guardrails.py` and `.github/workflows/attribution-guardrails.yml`.
That check fails if an upstream-derived skill loses its `Credits & Attribution` block or thank-you
message, or if the README stops naming upstream sources and
their original repositories explicitly.

**Required repo setting:** Go to **Settings > Actions > General > Workflow permissions** and enable **"Allow GitHub Actions to create and approve pull requests"** for the workflow to create PRs automatically.

> **Note:** The installer removes and recreates symlinks on each run, so running `./install.sh` or `./update.sh` after pulling always ensures your skills are up to date.

## Technology Stack

Skills in this collection cover:

- **PHP 8.2+** with strict types and modernization guidance in `php-modernization`
- **TYPO3 v14.x** for CMS projects, with `typo3-translations` covering TYPO3 13/14 translation compatibility
- **React/Remotion** for video creation
- **DDEV** for local development
- **Next.js/Astro** for frontend (AI Search Optimization)
- **TailwindCSS** for styling

## External Skill Repositories

The following repositories are the source for skills in this collection:

<!-- EXTERNAL_REPOS:START -->
### Netresearch DTT GmbH (12 skills)
- `cli-tools`: https://github.com/netresearch/cli-tools-skill
- `context7`: https://github.com/netresearch/context7-skill
- `enterprise-readiness`: https://github.com/netresearch/enterprise-readiness-skill
- `php-modernization`: https://github.com/netresearch/php-modernization-skill
- `security-audit`: https://github.com/netresearch/security-audit-skill
- `typo3-conformance`: https://github.com/netresearch/typo3-conformance-skill
- `typo3-core-contributions`: https://github.com/netresearch/typo3-core-contributions-skill
- `typo3-ddev`: https://github.com/netresearch/typo3-ddev-skill
- `typo3-docs`: https://github.com/netresearch/typo3-docs-skill
- `typo3-extension-upgrade`: https://github.com/netresearch/typo3-extension-upgrade-skill
- `typo3-testing`: https://github.com/netresearch/typo3-testing-skill
- `typo3-vite`: https://github.com/netresearch/typo3-vite-skill

### Supabase (1 skill)
- `postgres-best-practices`: https://github.com/supabase/agent-skills

### Corey Haines (43 skills)
- `ad-creative`, `ads`, `ai-seo`, `analytics`, `aso`, `churn-prevention`, `co-marketing`, `cold-email`, `community-marketing`, `competitor-profiling`, `competitors`, `content-strategy`, `copy-editing`, `copywriting`, `corey-ab-testing`, `corey-programmatic-seo`, `cro`, `customer-research`, `directory-submissions`, `emails`, `free-tools`, `image`, `launch`, `lead-magnets`, `marketing-ideas`, `marketing-psychology`, `marketing-skills`, `onboarding`, `paywalls`, `popups`, `pricing`, `product-marketing`, `prospecting`, `referrals`, `revops`, `sales-enablement`, `schema`, `seo-audit`, `signup`, `site-architecture`, `sms`, `social`, and `video`: https://github.com/coreyhaines31/marketingskills

### ooiyeefei (1 skill)
- `excalidraw`: https://github.com/ooiyeefei/ccc/tree/main/skills/excalidraw

### Stevy Smith (1 skill)
- `og-image`: https://github.com/stevysmith/og-image-skill

### Vercel (3 skills)
- `react-best-practices` and `web-design-guidelines`: https://github.com/vercel-labs/agent-skills
- `find-skills`: https://github.com/vercel-labs/skills

### Giuseppe Trisciuoglio (1 skill)
- `shadcn-ui`: https://github.com/giuseppe-trisciuoglio/developer-kit

### Softaworks (1 skill)
- `agent-md-refactor`: https://github.com/softaworks/agent-toolkit

### HeyGen (5 skills)
- `gsap`, `hyperframes`, `hyperframes-cli`, `hyperframes-registry`, and `website-to-hyperframes`: https://github.com/heygen-com/hyperframes

### Matt Pocock (15 skills)
- `caveman`, `desiderio-teach`, `diagnose`, `grill-me`, `grill-with-docs`, `handoff`, `improve-codebase-architecture`, `prototype`, `setup-matt-pocock-skills`, `tdd`, `to-issues`, `to-prd`, `triage`, `write-a-skill`, and `zoom-out`: https://github.com/mattpocock/skills

### Peter Steinberger (1 skill)
- `autoreview`: https://github.com/openclaw/agent-skills

### GitHub (1 skill)
- `refactor`: https://github.com/github/awesome-copilot

### sickn33 (1 skill)
- `refactor-clean`: https://github.com/sickn33/antigravity-awesome-skills

### ehmo (8 skills)
- `android-design`, `ios-design`, `ipados-design`, `macos-design`, `tvos-design`, `visionos-design`, `watchos-design`, and `web-platform-design`: https://github.com/ehmo/platform-design-skills

### AITYTech (4 skills)
- `ab-testing`, `cro-funnel`, `launch-strategy`, and `programmatic-seo`: https://github.com/aitytech/agentkits-marketing

### Anthropic (4 skills)
- `typo3-simplify`: https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-simplifier
- `document-processing`: https://github.com/anthropics/skills/tree/main/skills/document-processing
- `frontend-design`: https://github.com/anthropics/skills/tree/main/skills/frontend-design
- `skill-creator`: https://github.com/anthropics/skills/tree/main/skills/skill-creator

### Firecrawl / Mendable, Inc. (1 skill)
- `firecrawl`: https://github.com/firecrawl/cli

### Remotion (1 skill)
- `remotion-best-practices`: https://github.com/remotion-dev/skills

### OpenHands (1 skill)
- `readiness-report`: https://github.com/OpenHands/skills

### pbakaus (1 skill)
- `impeccable`: https://github.com/pbakaus/impeccable/releases/tag/skill-v3.0.7

### Dylan Tarre (1 skill)
- `micro-interactions`: https://github.com/dylantarre/animation-principles

### wondelai (1 skill)
- `microinteractions`: https://github.com/wondelai/skills
<!-- EXTERNAL_REPOS:END -->

## Contributing

1. Create a skill in `skills/your-skill-name/SKILL.md`
2. Follow the Agent Skills format: `name` and `description` frontmatter are required; optional top-level fields should stay within the current validator-supported schema.
3. Keep `SKILL.md` as a concise entry point and move long detail into `references/` files with clear links.
4. If the skill is adapted from an upstream source, add a full `Credits & Attribution`
   block in `SKILL.md` with the upstream owner, original repository, thank-you message,
   and `Adapted by webconsulting.at for this skill collection`
5. Keep the Netresearch-specific thank-you wording for Netresearch-derived skills
6. Run `npx -y skills-ref validate skills/your-skill-name`, `python3 scripts/check_attribution_guardrails.py`, and `./install.sh --generate-only` to test generated catalogs/manifests
7. Submit a pull request

Most upstream-derived skills are auto-discovered from their `SKILL.md` attribution, so you do not
need to register every new upstream skill in `scripts/audit_skills.py`. Only add a manual override
there if the repo should display a different origin owner than the upstream repository itself.

## License

This project uses **split licensing**:

- **Code** (scripts, installers, configuration): [MIT License](LICENSE-MIT)
- **Content** (skill definitions, documentation, SKILL.md files): [CC-BY-SA-4.0](LICENSE-CC-BY-SA-4.0)

See [LICENSE](LICENSE) for details and third-party attribution.

This repository also contains skills adapted from upstream open-source projects.
Each retains its original copyright and license terms:

- **Netresearch DTT GmbH** — MIT (code) / CC-BY-SA-4.0 (content) for 11 adapted skills
- **Vercel, Inc.** — React/Next.js optimization, web design, skill discovery (MIT)
- **Anthropic** — `frontend-design`, `skill-creator` (Apache-2.0); `document-processing` (source-available)
- **Firecrawl / Mendable, Inc.** — `firecrawl` CLI (ISC); platform is AGPL-3.0
- **Remotion** — `remotion-best-practices` (custom license, see remotion.dev/license)
- **platform-design-skills** — Apple HIG and Material Design guidelines (MIT)
- **AITYTech** — AgentKits Marketing automation (MIT)
- **Matt Pocock** — Agent skills for real engineering workflows (MIT)
- **Peter Steinberger / openclaw** — `autoreview` structured review workflow and helper scripts (MIT)
- **Dylan Tarre** — `micro-interactions` Disney animation principles for UI feedback (MIT)
- **wondelai** — `microinteractions` Dan Saffer framework (Trigger / Rules / Feedback / Loops & Modes) (MIT)

See individual SKILL.md files for per-skill attribution and license details.

## Acknowledgements

Special thanks to **[ochorocho](https://github.com/ochorocho)** for
[Camino: Camp Vienna "Lit it Up!"](https://dev.ochorocho.dev/camp-vienna#/) and the
[ochorocho/lit_demo](https://github.com/ochorocho/lit_demo) examples. They provided the
practical TYPO3 backend Lit reference material behind the `typo3-webcomponents` skill.

<!-- ACKNOWLEDGEMENTS:START -->
We are deeply grateful to **[Netresearch DTT GmbH](https://www.netresearch.de/)** for their
foundational contributions to this skill collection. The majority of TYPO3-related skills and
several cross-domain skills are based on Netresearch's original open-source skill repositories.
Their deep expertise in TYPO3 development, enterprise PHP engineering, and AI-augmented workflows
has been instrumental in shaping the quality and depth of these guidelines.

Adapted skills: `cli-tools`, `context7`, `enterprise-readiness`, `php-modernization`, `security-audit`, `typo3-conformance`, `typo3-core-contributions`, `typo3-ddev`, `typo3-docs`, `typo3-extension-upgrade`, `typo3-testing`, and `typo3-vite`

Original repositories:
- `cli-tools`: https://github.com/netresearch/cli-tools-skill
- `context7`: https://github.com/netresearch/context7-skill
- `enterprise-readiness`: https://github.com/netresearch/enterprise-readiness-skill
- `php-modernization`: https://github.com/netresearch/php-modernization-skill
- `security-audit`: https://github.com/netresearch/security-audit-skill
- `typo3-conformance`: https://github.com/netresearch/typo3-conformance-skill
- `typo3-core-contributions`: https://github.com/netresearch/typo3-core-contributions-skill
- `typo3-ddev`: https://github.com/netresearch/typo3-ddev-skill
- `typo3-docs`: https://github.com/netresearch/typo3-docs-skill
- `typo3-extension-upgrade`: https://github.com/netresearch/typo3-extension-upgrade-skill
- `typo3-testing`: https://github.com/netresearch/typo3-testing-skill
- `typo3-vite`: https://github.com/netresearch/typo3-vite-skill

**Copyright (c) Netresearch DTT GmbH** — TYPO3 development methodology, PHP modernization, and enterprise best practices (MIT / CC-BY-SA-4.0)
See: [netresearch.de](https://www.netresearch.de/)

---

We also thank **[Supabase](https://supabase.com/)** for their excellent open-source work.
The `postgres-best-practices` skill in this collection builds on that contribution.

Adapted skill: `postgres-best-practices`

Original repositories:
- `postgres-best-practices`: https://github.com/supabase/agent-skills

**Copyright (c) Supabase** - Postgres performance optimization guidelines
See: [Postgres Best Practices for AI Agents](https://supabase.com/blog/postgres-best-practices-for-ai-agents)

---

We also thank **[Corey Haines](https://corey.co/)** for their excellent open-source work.
The `ad-creative`, `ads`, `ai-seo`, `analytics`, `aso`, `churn-prevention`, `co-marketing`, `cold-email`, `community-marketing`, `competitor-profiling`, `competitors`, `content-strategy`, `copy-editing`, `copywriting`, `corey-ab-testing`, `corey-programmatic-seo`, `cro`, `customer-research`, `directory-submissions`, `emails`, `free-tools`, `image`, `launch`, `lead-magnets`, `marketing-ideas`, `marketing-psychology`, `marketing-skills`, `onboarding`, `paywalls`, `popups`, `pricing`, `product-marketing`, `prospecting`, `referrals`, `revops`, `sales-enablement`, `schema`, `seo-audit`, `signup`, `site-architecture`, `sms`, `social`, and `video` skills in this collection build on that contribution.

Adapted skills: `ad-creative`, `ads`, `ai-seo`, `analytics`, `aso`, `churn-prevention`, `co-marketing`, `cold-email`, `community-marketing`, `competitor-profiling`, `competitors`, `content-strategy`, `copy-editing`, `copywriting`, `corey-ab-testing`, `corey-programmatic-seo`, `cro`, `customer-research`, `directory-submissions`, `emails`, `free-tools`, `image`, `launch`, `lead-magnets`, `marketing-ideas`, `marketing-psychology`, `marketing-skills`, `onboarding`, `paywalls`, `popups`, `pricing`, `product-marketing`, `prospecting`, `referrals`, `revops`, `sales-enablement`, `schema`, `seo-audit`, `signup`, `site-architecture`, `sms`, `social`, and `video`

Original repositories:
- `ad-creative`, `ads`, `ai-seo`, `analytics`, `aso`, `churn-prevention`, `co-marketing`, `cold-email`, `community-marketing`, `competitor-profiling`, `competitors`, `content-strategy`, `copy-editing`, `copywriting`, `corey-ab-testing`, `corey-programmatic-seo`, `cro`, `customer-research`, `directory-submissions`, `emails`, `free-tools`, `image`, `launch`, `lead-magnets`, `marketing-ideas`, `marketing-psychology`, `marketing-skills`, `onboarding`, `paywalls`, `popups`, `pricing`, `product-marketing`, `prospecting`, `referrals`, `revops`, `sales-enablement`, `schema`, `seo-audit`, `signup`, `site-architecture`, `sms`, `social`, and `video`: https://github.com/coreyhaines31/marketingskills

**Copyright (c) Corey Haines** - Marketing frameworks and best practices
See: [Conversion Factory](https://conversionfactory.co/) | [Swipe Files](https://swipefiles.com/)

---

We also thank **[ooiyeefei](https://github.com/ooiyeefei)** for their excellent open-source work.
The `excalidraw` skill in this collection builds on that contribution.

Adapted skill: `excalidraw`

Original repositories:
- `excalidraw`: https://github.com/ooiyeefei/ccc/tree/main/skills/excalidraw

**Copyright (c) ooiyeefei** - Excalidraw architecture diagram generation and export workflow (MIT License)

---

We also thank **[Stevy Smith](https://github.com/stevysmith)** for their excellent open-source work.
The `og-image` skill in this collection builds on that contribution.

Adapted skill: `og-image`

Original repositories:
- `og-image`: https://github.com/stevysmith/og-image-skill

**Copyright (c) Stevy Smith** - OG Image generation and social meta tag configuration

---

We also thank **[Vercel](https://vercel.com/)** for their excellent open-source work.
The `find-skills`, `react-best-practices`, and `web-design-guidelines` skills in this collection build on that contribution.

Adapted skills: `find-skills`, `react-best-practices`, and `web-design-guidelines`

Original repositories:
- `react-best-practices` and `web-design-guidelines`: https://github.com/vercel-labs/agent-skills
- `find-skills`: https://github.com/vercel-labs/skills

**Copyright (c) Vercel, Inc.** - React/Next.js optimization, web design guidelines, skill discovery (MIT License)

---

We also thank **[Giuseppe Trisciuoglio](https://github.com/giuseppe-trisciuoglio)** for their excellent open-source work.
The `shadcn-ui` skill in this collection builds on that contribution.

Adapted skill: `shadcn-ui`

Original repositories:
- `shadcn-ui`: https://github.com/giuseppe-trisciuoglio/developer-kit

**Copyright (c) Giuseppe Trisciuoglio** - shadcn/ui component patterns with Radix UI and Tailwind CSS

---

We also thank **[Softaworks](https://github.com/softaworks)** for their excellent open-source work.
The `agent-md-refactor` skill in this collection builds on that contribution.

Adapted skill: `agent-md-refactor`

Original repositories:
- `agent-md-refactor`: https://github.com/softaworks/agent-toolkit

**Copyright (c) Softaworks** - Agent instruction file refactoring with progressive disclosure

---

We also thank **[HeyGen](https://www.heygen.com/)** for their excellent open-source work.
The `gsap`, `hyperframes`, `hyperframes-cli`, `hyperframes-registry`, and `website-to-hyperframes` skills in this collection build on that contribution.

Adapted skills: `gsap`, `hyperframes`, `hyperframes-cli`, `hyperframes-registry`, and `website-to-hyperframes`

Original repositories:
- `gsap`, `hyperframes`, `hyperframes-cli`, `hyperframes-registry`, and `website-to-hyperframes`: https://github.com/heygen-com/hyperframes

**Copyright (c) HeyGen** - HyperFrames HTML-to-video composition, CLI, registry, and website-to-video workflows (Apache 2.0)

---

We also thank **[Matt Pocock](https://github.com/mattpocock)** for their excellent open-source work.
The `caveman`, `desiderio-teach`, `diagnose`, `grill-me`, `grill-with-docs`, `handoff`, `improve-codebase-architecture`, `prototype`, `setup-matt-pocock-skills`, `tdd`, `to-issues`, `to-prd`, `triage`, `write-a-skill`, and `zoom-out` skills in this collection build on that contribution.

Adapted skills: `caveman`, `desiderio-teach`, `diagnose`, `grill-me`, `grill-with-docs`, `handoff`, `improve-codebase-architecture`, `prototype`, `setup-matt-pocock-skills`, `tdd`, `to-issues`, `to-prd`, `triage`, `write-a-skill`, and `zoom-out`

Original repositories:
- `caveman`, `desiderio-teach`, `diagnose`, `grill-me`, `grill-with-docs`, `handoff`, `improve-codebase-architecture`, `prototype`, `setup-matt-pocock-skills`, `tdd`, `to-issues`, `to-prd`, `triage`, `write-a-skill`, and `zoom-out`: https://github.com/mattpocock/skills

**Copyright (c) Matt Pocock** - Agent skills for real engineering workflows (MIT License)

---

We also thank **[Peter Steinberger](https://github.com/steipete)** for their excellent open-source work.
The `autoreview` skill in this collection builds on that contribution.

Adapted skill: `autoreview`

Original repositories:
- `autoreview`: https://github.com/openclaw/agent-skills

**Copyright (c) 2026 openclaw** - Auto Review structured review workflow and helper scripts (MIT License)

---

We also thank **[GitHub](https://github.com/github)** for their excellent open-source work.
The `refactor` skill in this collection builds on that contribution.

Adapted skill: `refactor`

Original repositories:
- `refactor`: https://github.com/github/awesome-copilot

**Copyright (c) GitHub** - Code refactoring patterns and best practices

---

We also thank **[sickn33](https://github.com/sickn33)** for their excellent open-source work.
The `refactor-clean` skill in this collection builds on that contribution.

Adapted skill: `refactor-clean`

Original repositories:
- `refactor-clean`: https://github.com/sickn33/antigravity-awesome-skills

**Copyright (c) sickn33** - Clean code principles and SOLID design patterns

---

We also thank **[ehmo](https://github.com/ehmo)** for their excellent open-source work.
The `android-design`, `ios-design`, `ipados-design`, `macos-design`, `tvos-design`, `visionos-design`, `watchos-design`, and `web-platform-design` skills in this collection build on that contribution.

Adapted skills: `android-design`, `ios-design`, `ipados-design`, `macos-design`, `tvos-design`, `visionos-design`, `watchos-design`, and `web-platform-design`

Original repositories:
- `android-design`, `ios-design`, `ipados-design`, `macos-design`, `tvos-design`, `visionos-design`, `watchos-design`, and `web-platform-design`: https://github.com/ehmo/platform-design-skills

**Copyright (c) platform-design-skills** - Apple HIG and Material Design guidelines (MIT License)

---

We also thank **[AITYTech](https://github.com/aitytech)** for their excellent open-source work.
The `ab-testing`, `cro-funnel`, `launch-strategy`, and `programmatic-seo` skills in this collection build on that contribution.

Adapted skills: `ab-testing`, `cro-funnel`, `launch-strategy`, and `programmatic-seo`

Original repositories:
- `ab-testing`, `cro-funnel`, `launch-strategy`, and `programmatic-seo`: https://github.com/aitytech/agentkits-marketing

**Copyright (c) AITYTech** - Enterprise-grade AI marketing automation (MIT License)

---

We also thank **[Anthropic](https://anthropic.com/)** for their excellent open-source work.
The `document-processing`, `frontend-design`, `skill-creator`, and `typo3-simplify` skills in this collection build on that contribution.

Adapted skills: `document-processing`, `frontend-design`, `skill-creator`, and `typo3-simplify`

Original repositories:
- `typo3-simplify`: https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-simplifier
- `document-processing`: https://github.com/anthropics/skills/tree/main/skills/document-processing
- `frontend-design`: https://github.com/anthropics/skills/tree/main/skills/frontend-design
- `skill-creator`: https://github.com/anthropics/skills/tree/main/skills/skill-creator

**Copyright (c) Anthropic** — `frontend-design` and `skill-creator` (Apache-2.0 License);
`document-processing` (source-available, see Anthropic's README for terms)

---

We also thank **[Firecrawl / Mendable, Inc.](https://www.firecrawl.dev/)** for their excellent open-source work.
The `firecrawl` skill in this collection builds on that contribution.

Adapted skill: `firecrawl`

Original repositories:
- `firecrawl`: https://github.com/firecrawl/cli

**Copyright (c) Firecrawl / Mendable, Inc.** — CLI (ISC License)
Note: The Firecrawl platform is AGPL-3.0; this skill documents CLI usage patterns only.

---

We also thank **[Remotion](https://remotion.dev/)** for their excellent open-source work.
The `remotion-best-practices` skill in this collection builds on that contribution.

Adapted skill: `remotion-best-practices`

Original repositories:
- `remotion-best-practices`: https://github.com/remotion-dev/skills

Note: The Remotion library uses a custom license (free for individuals / small companies up to
3 employees; company license required for larger organizations). This skill documents usage
patterns only and does not include or redistribute Remotion source code.

---

We also thank **[OpenHands](https://github.com/OpenHands)** for their excellent open-source work.
The `readiness-report` skill in this collection builds on that contribution.

Adapted skill: `readiness-report`

Original repositories:
- `readiness-report`: https://github.com/OpenHands/skills


---

We also thank **[pbakaus](https://github.com/pbakaus)** for their excellent open-source work.
The `impeccable` skill in this collection builds on that contribution.

Adapted skill: `impeccable`

Original repositories:
- `impeccable`: https://github.com/pbakaus/impeccable/releases/tag/skill-v3.0.7


---

We also thank **[Dylan Tarre](https://github.com/dylantarre/animation-principles)** for their excellent open-source work.
The `micro-interactions` skill in this collection builds on that contribution.

Adapted skill: `micro-interactions`

Original repositories:
- `micro-interactions`: https://github.com/dylantarre/animation-principles


---

We also thank **[wondelai](https://github.com/wondelai/skills)** for their excellent open-source work.
The `microinteractions` skill in this collection builds on that contribution.

Adapted skill: `microinteractions`

Original repositories:
- `microinteractions`: https://github.com/wondelai/skills


<!-- ACKNOWLEDGEMENTS:END -->

---

We also thank **[Volker Kemeter](https://github.com/vkemeter)** for his contribution of the
Gemini CLI extension manifest (`gemini-extension.json`), which enables native skill discovery
and trigger-based activation across all webconsulting skills within Gemini CLI and Google
Antigravity. His work on a generic, standards-compliant integration approach directly informed
the multi-client installation strategy.
See: [vkemeter/webconsulting-skills@ed03ef0](https://github.com/vkemeter/webconsulting-skills/commit/ed03ef0)
