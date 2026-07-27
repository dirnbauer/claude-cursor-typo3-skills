# Available Agent Skills

A curated collection of Agent Skills for AI-augmented software development. Skills cover web development, video creation, security auditing, legal compliance, and enterprise software engineering.

> **📢 A Quick Note:** These skills are here to be used. Expect updates and occasional changes as
> Anthropic, Cursor, and webconsulting evolve their platforms. Always review AI-generated code
> before committing or deploying.
> See [README](README.md) for details.

> **A note from the maintainer:** This collection is here for the community — practical agent skills
> you can drop into your workflow, no strings attached. A big thank you to
> **[Netresearch DTT GmbH](https://www.netresearch.de/)** whose open-source skill repositories
> taught me a lot about structuring effective agent skills and whose work forms the foundation
> for many of the TYPO3 and PHP skills in this collection.
> Thank you also to **[ochorocho](https://github.com/ochorocho)** for the
> [Camino: Camp Vienna "Lit it Up!"](https://dev.ochorocho.dev/camp-vienna#/) material and
> [lit_demo](https://github.com/ochorocho/lit_demo) examples that informed the
> `typo3-webcomponents` skill.

> **TYPO3 Skills:** TYPO3-related skills primarily target **TYPO3 v14.x**. `typo3-translations` also covers TYPO3 13 compatibility where XLIFF format choices affect upgrades. Third-party extensions may lag Core — always verify `require.typo3/cms-core` on Packagist for your project.

---

## Acknowledgements

We are deeply grateful to **[Netresearch DTT GmbH](https://www.netresearch.de/)** for their
foundational contributions to this skill collection. The majority of TYPO3-related skills and
several cross-domain skills are based on Netresearch's original open-source skill repositories.
Their deep expertise in TYPO3 development, enterprise PHP engineering, and AI-augmented workflows
has been instrumental in shaping the quality and depth of these guidelines.

The following 12 skills are adapted from Netresearch's work:
`php-modernization`, `enterprise-readiness`, `security-audit`, `cli-tools`, `context7`,
`typo3-ddev`, `typo3-testing`, `typo3-conformance`, `typo3-docs`,
`typo3-core-contributions`, `typo3-extension-upgrade`, `typo3-vite`

Original repositories: https://github.com/netresearch

**Copyright (c) Netresearch DTT GmbH** — TYPO3 development methodology, PHP modernization,
and enterprise best practices (MIT / CC-BY-SA-4.0)
See: [netresearch.de](https://www.netresearch.de/)

---

We also thank **[Supabase](https://supabase.com/)** for their excellent Postgres best practices
and AI agent skills. The `postgres-best-practices` skill is adapted from their open-source
repository: https://github.com/supabase/agent-skills

**Copyright (c) Supabase** - Postgres performance optimization guidelines  
See: [Postgres Best Practices for AI Agents](https://supabase.com/blog/postgres-best-practices-for-ai-agents)

---

We also thank **[Corey Haines](https://coreyhaines.com/)** for his excellent marketing skills
collection. The `marketing-skills` wrapper and the split marketing skills are adapted from his open-source repository:
https://github.com/coreyhaines31/marketingskills

**Copyright (c) Corey Haines** - Marketing frameworks and best practices  
See: [Conversion Factory](https://conversionfactory.co/) | [Swipe Files](https://swipefiles.com/)

---

We also thank **[Stevy Smith](https://github.com/stevysmith)** for the excellent OG Image skill.
The `og-image` skill is adapted from their open-source repository:
https://github.com/stevysmith/og-image-skill

**Copyright (c) Stevy Smith** - OG Image generation and social meta tag configuration

---

We also thank **[Vercel Engineering](https://vercel.com)** for their excellent React and Next.js 
performance optimization guidelines. The `react-best-practices` and `web-design-guidelines` skills 
are adapted from their open-source repository:
https://github.com/vercel-labs/agent-skills

**Copyright (c) Vercel, Inc.** - React and Next.js performance optimization (MIT License)

---

We also thank **[Anthropic](https://anthropic.com)** for their excellent document processing, 
frontend design, and skill creator skills. The `document-processing`, `frontend-design`, and 
`skill-creator` skills are adapted from their repository:
https://github.com/anthropics/skills

**Copyright (c) Anthropic** — `frontend-design` and `skill-creator` (Apache-2.0 License);
`document-processing` (source-available, see Anthropic's README for terms)

---

We also thank **[Firecrawl / Mendable, Inc.](https://www.firecrawl.dev/)** for their excellent web 
scraping CLI. The `firecrawl` skill is adapted from their open-source repository:
https://github.com/firecrawl/cli

**Copyright (c) Firecrawl / Mendable, Inc.** — CLI (ISC License)
Note: The Firecrawl platform is AGPL-3.0; this skill documents CLI usage patterns only.

---

We also thank **[ooiyeefei](https://github.com/ooiyeefei)** for the excellent Excalidraw
architecture diagram skill. The `excalidraw` skill is adapted from the repository:
https://github.com/ooiyeefei/ccc/tree/main/skills/excalidraw

**Copyright (c) ooiyeefei** - Excalidraw architecture diagram generation and export workflow (MIT License)

---

We also thank **[Remotion](https://remotion.dev/)** for their excellent video creation framework.
The `remotion-best-practices` skill is adapted from their skills repository:
https://github.com/remotion-dev/skills

Note: The Remotion library uses a custom license (free for individuals / small companies up to
3 employees; company license required for larger organizations). This skill documents usage
patterns only and does not include or redistribute Remotion source code.

---

We also thank **[ehmo](https://github.com/ehmo)** for the excellent platform design skills collection.
The platform design skills (Android, iOS, iPadOS, macOS, tvOS, visionOS, watchOS, Web) are adapted 
from their open-source repository:
https://github.com/ehmo/platform-design-skills

**Copyright (c) platform-design-skills** - Apple HIG and Material Design guidelines (MIT License)

---

We also thank **[AITYTech](https://github.com/aitytech)** for their excellent AgentKits Marketing 
skills collection. The `cro-funnel`, `programmatic-seo`, `launch-strategy`, and `ab-testing` skills 
are adapted from their open-source repository:
https://github.com/aitytech/agentkits-marketing

**Copyright (c) AITYTech** - Enterprise-grade AI marketing automation (MIT License)  
See: [AgentKits Marketing](https://github.com/aitytech/agentkits-marketing)

---

We also thank **[Giuseppe Trisciuoglio](https://github.com/giuseppe-trisciuoglio)** for the excellent
shadcn/ui component patterns skill. The `shadcn-ui` skill is adapted from their open-source repository:
https://github.com/giuseppe-trisciuoglio/developer-kit

**Copyright (c) Giuseppe Trisciuoglio** - shadcn/ui component patterns with Radix UI and Tailwind CSS

---

We also thank **[Softaworks](https://github.com/softaworks)** for the excellent agent-md-refactor skill.
The `agent-md-refactor` skill is adapted from their open-source repository:
https://github.com/softaworks/agent-toolkit

**Copyright (c) Softaworks** - Agent instruction file refactoring with progressive disclosure

---

We also thank **[Matt Pocock](https://github.com/mattpocock)** for the excellent real engineering
skills collection. The `caveman`, `desiderio-teach`, `diagnose`, `grill-me`, `grill-with-docs`, `handoff`,
`improve-codebase-architecture`, `prototype`, `setup-matt-pocock-skills`, `tdd`, `to-issues`,
`to-prd`, `triage`, `write-a-skill`, and `zoom-out` skills are adapted from his open-source repository:
https://github.com/mattpocock/skills

**Copyright (c) Matt Pocock** - Agent skills for real engineering workflows (MIT License)

---

We also thank **[Peter Steinberger](https://github.com/steipete)** for the excellent `autoreview` skill.
The `autoreview` skill is adapted from the OpenClaw agent skills repository:
https://github.com/openclaw/agent-skills

**Copyright (c) 2026 openclaw** - Auto Review structured review workflow and helper scripts (MIT License)

---

We also thank **[GitHub](https://github.com/github)** for the excellent refactoring skill from their
awesome-copilot collection. The `refactor` skill is adapted from their open-source repository:
https://github.com/github/awesome-copilot

**Copyright (c) GitHub** - Code refactoring patterns and best practices

---

We also thank **[sickn33](https://github.com/sickn33)** for the excellent clean code refactoring skill.
The `refactor-clean` skill is adapted from their open-source repository:
https://github.com/sickn33/antigravity-awesome-skills

**Copyright (c) sickn33** - Clean code principles and SOLID design patterns

---

We also thank **[Vercel](https://vercel.com)** for the find-skills discovery skill.
The `find-skills` skill is adapted from their open-source repository:
https://github.com/vercel-labs/skills

**Copyright (c) Vercel, Inc.** - Skill discovery and installation (MIT License)

---

We also thank **[Dylan Tarre](https://github.com/dylantarre)** for the excellent `micro-interactions` skill.
The `micro-interactions` skill is adapted from their open-source repository:
https://github.com/dylantarre/animation-principles

**Copyright (c) 2024 Dylan Tarre** - Disney's 12 Animation Principles applied to UI micro-interactions (MIT License)

---

We also thank **[wondelai](https://github.com/wondelai)** for the excellent `microinteractions` framework skill.
The `microinteractions` skill is adapted from their open-source repository:
https://github.com/wondelai/skills

**Copyright (c) wondelai** - Microinteractions framework adaptation of Dan Saffer's *Microinteractions: Designing with Details* (MIT License)

---

We also thank **[Volker Kemeter](https://github.com/vkemeter)** for his contribution of the
Gemini CLI extension manifest (`gemini-extension.json`), which enables native skill discovery
and trigger-based activation across all webconsulting skills within Gemini CLI and Google
Antigravity. His work on a generic, standards-compliant integration approach directly informed
the multi-client installation strategy.
See: https://github.com/vkemeter/webconsulting-skills/commit/ed03ef0

---

We also thank **[ochorocho](https://github.com/ochorocho)** for
[Camino: Camp Vienna "Lit it Up!"](https://dev.ochorocho.dev/camp-vienna#/) and the
[ochorocho/lit_demo](https://github.com/ochorocho/lit_demo) examples. They provided practical
TYPO3 backend Lit reference material for the `typo3-webcomponents` skill.

---

## Skills Overview

| Skill | Description | Version | Triggers |
|-------|-------------|---------|----------|
| **Code Quality & Refactoring** | | | |
| `agent-md-refactor` | Refactor bloated AGENTS.md/CLAUDE.md with progressive disclosure | 1.0.0 | refactor agents.md, split instructions, organize claude.md |
| `autoreview` | Structured closeout code review workflow with bundled helper scripts (OpenClaw) | 1.0.0 | autoreview, Codex review, Claude review, second-model review, closeout review |
| `refactor` | Code refactoring patterns, code smells, design patterns (GitHub) | 1.0.0 | refactor, clean up, code smell, improve code, extract method |
| `refactor-clean` | Clean code principles, SOLID patterns, incremental refactoring | 1.0.0 | refactor, clean code, solid, maintainability, testability |
| `find-skills` | Discover and install skills from skills.sh ecosystem (Vercel) | 1.0.0 | find skill, install skill, npx skills, skills.sh, skill search |
| `caveman` | Ultra-compressed communication mode for lower-token technical conversation | 1.0.0 | caveman mode, talk like caveman, use caveman, less tokens, be brief |
| `grill-me` | Stress-test a plan or design through relentless one-at-a-time interview questions | 1.0.0 | grill me, stress-test plan, stress-test design, challenge my plan |
| `diagnose` | Disciplined diagnosis loop for hard bugs and performance regressions | 1.0.0 | diagnose this, debug this, bug, broken, failing, performance regression |
| `grill-with-docs` | Challenge plans against domain docs, CONTEXT.md, and ADRs | 1.0.0 | grill with docs, stress-test with docs, context.md, adr, domain model |
| `handoff` | Compact the current conversation into a handoff document | 1.0.0 | handoff, hand off, continue later, another agent, summarize context |
| `improve-codebase-architecture` | Find architecture deepening opportunities in a codebase | 1.0.0 | improve architecture, refactoring opportunities, testable codebase, deep modules |
| `prototype` | Build throwaway prototypes for logic, state, or UI questions | 1.0.0 | prototype, sanity-check, data model, state machine, mock up ui, try a few designs |
| `setup-matt-pocock-skills` | Scaffold issue tracker, triage labels, and domain doc config | 1.0.0 | setup matt pocock skills, issue tracker, triage labels, domain docs, agent skills block |
| `tdd` | Test-driven development with a red-green-refactor loop | 1.0.0 | tdd, red-green-refactor, test-first, integration tests, failing test |
| `to-issues` | Break plans and PRDs into independently grabbable issues | 1.0.0 | to issues, create issues, implementation tickets, break down work, vertical slices |
| `to-prd` | Turn current context into a PRD issue | 1.0.0 | to prd, create prd, product requirements, current context |
| `triage` | Triage issues through a role-driven state machine | 1.0.0 | triage, issue workflow, incoming bugs, feature requests, ready for agent |
| `write-a-skill` | Create new skills with progressive disclosure and bundled resources | 1.0.0 | write a skill, create skill, build a new skill, agent skill, bundled resources |
| `zoom-out` | Ask for broader system context around unfamiliar code | 1.0.0 | zoom out, broader context, high-level perspective, unfamiliar code |
| **Video & Animation** | | | |
| `remotion-best-practices` | Video creation in React with Remotion | 1.0.0 | remotion, video, react, animation, composition |
| `hyperframes` | HTML-based video compositions, captions, voiceovers, audio-reactive visuals, transitions | 1.0.0 | hyperframes, video composition, captions, subtitles, tts, audio reactive |
| `hyperframes-cli` | CLI workflow for HyperFrames init, lint, preview, render, transcribe, tts | 1.0.0 | hyperframes init, hyperframes lint, hyperframes preview, hyperframes render, hyperframes tts |
| `hyperframes-registry` | Install registry blocks/components and wire them into HyperFrames | 1.0.0 | hyperframes add, hyperframes.json, block, component, registry |
| `website-to-hyperframes` | Capture a website and turn it into a HyperFrames video | 1.0.0 | website to video, capture this site, turn this into a video, social ad, product tour |
| `gsap` | GSAP animation reference for HyperFrames compositions | 1.0.0 | gsap, animation, timeline, easing, stagger, quickTo |
| `micro-interactions` | Disney's 12 animation principles applied to UI feedback moments (hover, press, toggles, ripples, badges) | 1.0.0 | micro-interaction, hover state, button press, toggle, ripple, focus ring, badge update |
| `microinteractions` | Dan Saffer's Microinteractions framework: triggers, rules, feedback, loops & modes, signature moments | 1.1.0 | microinteraction, trigger design, feedback pattern, loops and modes, signature moment, form validation feedback |
| `webconsulting-create-documentation` | Product docs, help pages, video tours (Remotion + GSAP + TTS) | 1.1.0 | documentation, help page, product video, screenshots, tts, gsap |
| **Security & Enterprise** | | | |
| `security-audit` | Security audit patterns (OWASP, XXE, SQLi, XSS, CVSS) | 1.0.0 | security, audit, owasp, vulnerabilities |
| `security-incident-reporting` | NIST/SANS incident reports, DDoS post-mortem, CVE correlation | 1.0.0 | incident report, post-mortem, ddos, forensics |
| `security-incident-reporting/TYPO3` | TYPO3 forensics, Security Team communication, PGP templates | 1.0.0 | typo3 incident, typo3 hack, security team |
| `deepfake-detection` | Multimodal media authentication, PRNU/IGH/DQ forensics, GAN detection | 1.0.0 | deepfake, media forensics, fake detection, synthetic media |
| `enterprise-readiness` | OpenSSF, SLSA, supply chain security, quality gates | 1.0.0 | enterprise, openssf, slsa, security |
| `readiness-report` | AI agent readiness assessment (9 pillars, 5 maturity levels) | 1.0.0 | /readiness-report, agent readiness, codebase maturity |
| `ai-search-optimization` | AEO/GEO for AI search visibility with TYPO3, MD/MDX, and llms.txt | 1.0.0 | aeo, geo, ai search, chatgpt, perplexity, llms.txt |
| **Database** | | | |
| `postgres-best-practices` | Postgres performance, RLS, indexes, connection pooling (Supabase) | 1.0.0 | postgres, sql, database, query, index, rls |
| `postgres-best-practices/SUPABASE` | Supabase auth.uid(), RLS patterns, Edge Functions, MCP | 1.0.0 | supabase, auth.uid, edge-functions, supabase-mcp |
| **Marketing** | | | |
| `marketing-skills` | CRO, copywriting, SEO, pricing, psychology (Corey Haines) | 1.0.0 | marketing, cro, conversion, landing page, funnel |
| `marketing-skills/CRO` | Page conversion rate optimization framework | 1.0.0 | cro, optimize page, page not converting |
| `marketing-skills/COPYWRITING` | Headlines, CTAs, page structure, copy formulas | 1.0.0 | copywriting, headline, rewrite, cta |
| `marketing-skills/SEO` | Technical SEO, on-page SEO, content quality audit | 1.0.0 | seo audit, not ranking, technical seo |
| `marketing-skills/PSYCHOLOGY` | 70+ mental models for marketing and persuasion | 1.0.0 | psychology, mental model, persuasion, bias |
| `marketing-skills/PRICING` | Pricing tiers, value metrics, freemium vs trial | 1.0.0 | pricing, tiers, freemium, monetization |
| `ad-creative` | Ad creative generation and iteration for paid platforms | 2.0.0 | ad creative, ad copy variations, rsa headlines, creative testing |
| `ads` | Paid ads campaign strategy, targeting, bidding, and optimization | 2.0.0 | ads, ppc, paid media, roas, cpa, retargeting |
| `ai-seo` | AI search visibility and LLM citation optimization | 2.0.1 | ai seo, aeo, geo, llmo, ai overviews, perplexity |
| `analytics` | Analytics tracking, measurement plans, events, and attribution | 2.0.0 | analytics, ga4, gtm, event tracking, attribution |
| `aso` | App Store and Google Play listing optimization | 2.0.0 | aso, app store optimization, app listing, google play |
| `churn-prevention` | Churn reduction, cancel flows, dunning, and win-back strategy | 2.0.0 | churn, cancel flow, dunning, retention, win-back |
| `co-marketing` | Partner identification and joint campaign planning | 2.0.0 | co-marketing, partner marketing, joint campaign, partnership ideas |
| `cold-email` | B2B cold outreach emails and follow-up sequences | 2.0.0 | cold email, cold outreach, prospecting email, sales email |
| `community-marketing` | Community strategy, engagement, and community-led growth | 2.0.0 | community marketing, discord community, slack community, community-led growth |
| `competitor-profiling` | Competitor research and profile generation from URLs | 2.0.0 | competitor profile, competitor research, competitive intelligence |
| `competitors` | Competitor comparison and alternative pages for SEO and sales | 2.0.0 | alternative page, vs page, competitor comparison, battlecard |
| `content-strategy` | Content strategy, topic planning, and editorial roadmaps | 2.0.0 | content strategy, content plan, editorial calendar, topics |
| `copy-editing` | Marketing copy review, editing, and refresh guidance | 2.0.0 | copy editing, edit copy, review copy, copy feedback |
| `copywriting` | Marketing copywriting for pages, CTAs, and positioning | 2.0.0 | copywriting, homepage copy, landing page copy, cta copy |
| `corey-ab-testing` | Corey Haines A/B testing and experimentation program guidance | 2.0.0 | corey ab testing, growth experiments, ice score, statistical significance |
| `corey-programmatic-seo` | Corey Haines programmatic SEO pages at scale | 2.0.0 | corey programmatic seo, pseo, template pages, data-driven pages |
| `cro` | Page and form conversion rate optimization | 2.0.0 | cro, conversion optimization, landing page optimization, form cro |
| `customer-research` | Customer research interviews, synthesis, and voice-of-customer analysis | 2.0.0 | customer research, icp research, user interviews, voice of customer |
| `directory-submissions` | Directory submission strategy for discovery and backlinks | 2.0.0 | directory submissions, submit startup, saas directories, backlinks |
| `emails` | Lifecycle email sequences, drip campaigns, and automated flows | 2.0.0 | email sequence, drip campaign, lifecycle email, onboarding email |
| `free-tools` | Free tool strategy for SEO, leads, and brand awareness | 2.0.0 | free tool, engineering as marketing, lead generation tool |
| `image` | Marketing image generation and optimization workflows | 2.0.0 | marketing image, social graphic, product mockup, blog hero |
| `launch` | Product launch, feature announcement, and release strategy | 2.0.0 | launch, product hunt, feature release, announcement |
| `lead-magnets` | Lead magnet planning, gated content, and capture optimization | 2.0.0 | lead magnet, gated content, checklist, ebook, template |
| `marketing-ideas` | Marketing ideas, growth inspiration, and channel brainstorming | 2.0.0 | marketing ideas, growth ideas, how to market, acquisition ideas |
| `marketing-psychology` | Behavioral science and mental models for marketing | 2.0.0 | marketing psychology, mental models, cognitive bias, persuasion |
| `onboarding` | Post-signup onboarding, activation, and time-to-value optimization | 2.0.0 | onboarding, activation, first-run experience, time to value |
| `paywalls` | Paywall, upgrade screen, upsell, and feature gate optimization | 2.0.0 | paywall, upgrade screen, upsell, feature gate |
| `popups` | Popup, modal, overlay, slide-in, and banner conversion optimization | 2.0.0 | popup, modal, exit intent, slide-in, banner |
| `pricing` | Pricing, packaging, value metrics, and monetization strategy | 2.0.0 | pricing, pricing tiers, freemium, packaging, monetization |
| `product-marketing` | Product marketing context, positioning, and messaging foundation | 2.0.0 | product marketing, positioning, messaging, marketing context |
| `prospecting` | Prospect list building, qualification, and outbound lead research | 1.0.0 | prospecting, build a prospect list, find prospects, find leads, target account list, qualified leads |
| `referrals` | Referral, affiliate, ambassador, and word-of-mouth programs | 2.0.0 | referral, affiliate, ambassador, word of mouth, viral loop |
| `revops` | Revenue operations, lead lifecycle, scoring, and handoff processes | 2.0.0 | revops, lead scoring, lead routing, mql, sql, crm automation |
| `sales-enablement` | Sales collateral, pitch decks, one-pagers, and demo scripts | 2.0.0 | sales enablement, sales deck, pitch deck, one-pager, demo script |
| `schema` | Schema markup and structured data for rich results | 2.0.0 | schema, structured data, json-ld, rich snippets, schema.org |
| `seo-audit` | Technical SEO, on-page SEO, and content quality audits | 2.0.0 | seo audit, technical seo, indexing issues, core web vitals |
| `signup` | Signup, registration, account creation, and trial activation optimization | 2.0.0 | signup, registration, trial activation, signup abandonment |
| `site-architecture` | Website hierarchy, navigation, URL structure, and internal linking | 2.0.0 | site architecture, sitemap, site structure, navigation, internal linking |
| `sms` | SMS and MMS marketing flows, campaigns, compliance, and optimization | 1.0.0 | sms marketing, text message campaigns, sms sequence, sms automation, abandoned cart text, tcpa, a2p 10dlc |
| `social` | Social media content, calendars, repurposing, and short-form scripts | 2.0.0 | social media, linkedin post, twitter thread, content calendar, reels |
| `video` | Marketing video production with AI and programmatic video tools | 2.0.1 | video, ai video, remotion, hyperframes, heygen, product demo video |
| **CRO & Growth (AgentKits)** | | | |
| `cro-funnel` | Full-funnel CRO: form, signup, onboarding, popup, paywall | 1.0.0 | cro funnel, form cro, signup flow, onboarding, paywall |
| `programmatic-seo` | SEO pages at scale with templates and data | 1.0.0 | programmatic seo, template pages, directory, location pages |
| `launch-strategy` | Product launches, Product Hunt, go-to-market | 1.0.0 | product launch, product hunt, gtm, beta launch |
| `ab-testing` | A/B test design, sample size, statistical significance | 1.0.0 | ab test, split test, experiment, hypothesis |
| **Code Quality & Refactoring** | | | |
| `agent-md-refactor` | Refactor bloated AGENTS.md/CLAUDE.md with progressive disclosure | 1.0.0 | refactor agents.md, split instructions, organize claude.md |
| `autoreview` | Structured closeout code review workflow with bundled helper scripts (OpenClaw) | 1.0.0 | autoreview, Codex review, Claude review, second-model review, closeout review |
| `refactor` | Code refactoring patterns, code smells, design patterns (GitHub) | 1.0.0 | refactor, clean up, code smell, improve code, extract method |
| `refactor-clean` | Clean code principles, SOLID patterns, incremental refactoring | 1.0.0 | refactor, clean code, solid, maintainability, testability |
| `find-skills` | Discover and install skills from skills.sh ecosystem (Vercel) | 1.0.0 | find skill, install skill, npx skills, skills.sh, skill search |
| `caveman` | Ultra-compressed communication mode for lower-token technical conversation | 1.0.0 | caveman mode, talk like caveman, use caveman, less tokens, be brief |
| `grill-me` | Stress-test a plan or design through relentless one-at-a-time interview questions | 1.0.0 | grill me, stress-test plan, stress-test design, challenge my plan |
| `diagnose` | Disciplined diagnosis loop for hard bugs and performance regressions | 1.0.0 | diagnose this, debug this, bug, broken, failing, performance regression |
| `grill-with-docs` | Challenge plans against domain docs, CONTEXT.md, and ADRs | 1.0.0 | grill with docs, stress-test with docs, context.md, adr, domain model |
| `handoff` | Compact the current conversation into a handoff document | 1.0.0 | handoff, hand off, continue later, another agent, summarize context |
| `improve-codebase-architecture` | Find architecture deepening opportunities in a codebase | 1.0.0 | improve architecture, refactoring opportunities, testable codebase, deep modules |
| `prototype` | Build throwaway prototypes for logic, state, or UI questions | 1.0.0 | prototype, sanity-check, data model, state machine, mock up ui, try a few designs |
| `setup-matt-pocock-skills` | Scaffold issue tracker, triage labels, and domain doc config | 1.0.0 | setup matt pocock skills, issue tracker, triage labels, domain docs, agent skills block |
| `tdd` | Test-driven development with a red-green-refactor loop | 1.0.0 | tdd, red-green-refactor, test-first, integration tests, failing test |
| `to-issues` | Break plans and PRDs into independently grabbable issues | 1.0.0 | to issues, create issues, implementation tickets, break down work, vertical slices |
| `to-prd` | Turn current context into a PRD issue | 1.0.0 | to prd, create prd, product requirements, current context |
| `triage` | Triage issues through a role-driven state machine | 1.0.0 | triage, issue workflow, incoming bugs, feature requests, ready for agent |
| `write-a-skill` | Create new skills with progressive disclosure and bundled resources | 1.0.0 | write a skill, create skill, build a new skill, agent skill, bundled resources |
| `zoom-out` | Ask for broader system context around unfamiliar code | 1.0.0 | zoom out, broader context, high-level perspective, unfamiliar code |
| **PHP & Tools** | | | |
| `php-modernization` | PHP 8.x patterns, PHPStan level 10, DTOs, enums | 1.0.0 | php, modernization, phpstan, rector |
| `cli-tools` | CLI tool management and auto-installation | 1.0.0 | cli, tools, installation |
| `context7` | Library documentation lookup via REST API | 1.0.0 | documentation, api, libraries |
| `firecrawl` | Firecrawl CLI for LLM-optimized web scraping, search, and research | 1.0.0 | scrape, crawl, search web, research, fetch url |
| `skill-creator` | Guide for creating and packaging effective Agent Skills (Anthropic) | 1.0.0 | create skill, new skill, skill creator, package skill, SKILL.md |
| **Frontend & Design** | | | |
| `webconsulting-branding` | Borderless square webconsulting design, header-only notices, logo-first project identity | 3.0.0 | frontend, design, branding, no borders, project icons |
| `ui-design-patterns` | Practical UI design patterns, accessibility, usability | 1.1.0 | ui, design, accessibility, usability |
| `frontend-design` | Distinctive UI aesthetics, anti-AI-slop patterns, creative interfaces | 1.0.0 | frontend, design, creative, beautiful, distinctive, aesthetics |
| `impeccable` | Production-grade frontend design, critique, polish, shaping, and live UI iteration | 3.0.7 | impeccable, design, redesign, shape, critique, audit, polish, craft, live UI |
| `web-design-guidelines` | Interface review, accessibility audit, WCAG, ARIA, semantic HTML | 1.0.0 | web design, accessibility, a11y, wcag, aria, semantic html |
| `excalidraw` | Generate architecture diagrams as .excalidraw files with optional PNG/SVG export | 1.0.0 | excalidraw, architecture diagram, system diagram, visualize codebase, png export, svg export |
| `og-image` | Social preview images (Open Graph), meta tags, Twitter cards | 1.0.0 | og-image, open graph, social preview, twitter card, meta tags |
| `react-best-practices` | React/Next.js performance optimization from Vercel (57 rules) | 1.0.0 | react, next.js, performance, optimization, bundle, waterfalls |
| `shadcn-ui` | shadcn/ui component patterns with Radix UI, Tailwind CSS, Zod forms | 1.0.0 | shadcn, radix, tailwind, components, form, dialog, button, card |
| **Platform Design** | | | |
| `android-design` | Material Design 3, Jetpack Compose, dynamic color, navigation | 1.0.0 | android, material design, jetpack compose, material you |
| `ios-design` | Apple HIG for iPhone, SwiftUI, Dynamic Type, Dark Mode | 1.0.0 | ios, iphone, swiftui, uikit, dynamic type |
| `ipados-design` | Apple HIG for iPad, multitasking, keyboard, pointer support | 1.0.0 | ipad, ipados, split view, stage manager, sidebar |
| `macos-design` | Apple HIG for Mac, menu bar, toolbars, keyboard shortcuts | 1.0.0 | macos, mac app, appkit, menu bar, toolbar |
| `tvos-design` | Apple HIG for Apple TV, focus navigation, 10-foot UI | 1.0.0 | tvos, apple tv, siri remote, focus navigation |
| `visionos-design` | Apple HIG for Vision Pro, spatial UI, eye/hand input | 1.0.0 | visionos, vision pro, spatial computing, realitykit |
| `watchos-design` | Apple HIG for Apple Watch, complications, glanceable UI | 1.0.0 | watchos, apple watch, complications, digital crown |
| `web-platform-design` | WCAG 2.2, responsive design, forms, typography, i18n | 1.0.0 | wcag, web platform, responsive, accessibility, i18n |
| **Documents & Office** | | | |
| `document-processing` | PDF, DOCX, PPTX, XLSX creation, editing, and analysis | 1.0.0 | pdf, docx, word, pptx, powerpoint, xlsx, excel, document |
| **Legal & Compliance** | | | |
| `legal-impressum` | Austrian Impressum for all Gesellschaftsformen (ECG, MedienG) | 1.0.0 | impressum, legal notice, austria, offenlegung |
| `legal-impressum/GERMANY` | German Impressum (DDG, MStV) for all Rechtsformen | 1.0.0 | impressum, germany, DDG |
| `legal-impressum/EU` | EU eCommerce Directive compliance | 1.0.0 | impressum, eu, ecommerce directive |
| `legal-impressum/WORLD` | International requirements (UK, CH, US) | 1.0.0 | impressum, international, uk, switzerland |
| **TYPO3 CMS** | | | |
| `typo3-content-blocks` | Content Elements & Record Types with single source of truth config | 1.0.0 | content-blocks, content-element, record-type, irre |
| `typo3-shadcn-content-elements` | Preset-driven shadcn/ui styling, Fluid atoms/molecules, backend previews, icons, and seed data for TYPO3 Content Blocks | 1.0.0 | shadcn, content elements, Content Blocks, Fluid, backend previews, icons, seed script |
| `desiderio-teach` | Teaching workspaces and TYPO3 lesson pages built with Desiderio content elements | 1.0.0 | add topic to teach, create lesson content, Desiderio learning page, teach in TYPO3 |
| `typo3-translations` | TYPO3 13/14 labels, XLIFF 1.2 baseline, XLIFF 2.0 upgrades, ICU strings, paths, domains, and migration checklists | 2.1.0 | xliff, translations, localization, labels.xlf, locallang.xlf, lll, icu messageformat, translation domains |
| `typo3-idea-extension-blog` | Assess ideas for TYPO3, build an extension, and draft the companion German MDX post | 1.0.0 | idea to extension, product announcement, adapt to TYPO3, blog post pipeline, MDX blog |
| `typo3-news-tags` | Bulk-generate and assign thematic tags for georgringer/news (EXT:news) | 1.0.0 | news tags, EXT:news, thematic tags, bulk tagging, tx_news_domain_model_tag, b13/tag |
| `typo3-datahandler` | Expert guidance on DataHandler for transactional database operations | 2.0.0 | database, datahandler, tcemain, records |
| `typo3-ddev` | TYPO3 local development with DDEV, multi-version testing | 2.0.0 | ddev, local, development, docker |
| `typo3-testing` | Unit, functional, E2E, architecture, mutation testing | 1.0.0 | testing, phpunit, playwright, phpat |
| `typo3-conformance` | Extension standards compliance checker | 1.0.0 | conformance, standards, quality |
| `typo3-docs` | Documentation using docs.typo3.org standards | 1.0.0 | documentation, rst, docs |
| `typo3-core-contributions` | TYPO3 Core contribution workflow (Gerrit, Forge) | 1.0.0 | core, contributions, gerrit, forge |
| `typo3-initial-release` | First official TYPO3 14.3+ extension release workflow, final review, CI/tooling verification, and tagging | 1.0.0 | initial release, 1.0.0, release readiness, release tag, TER, Packagist |
| `typo3-rector` | TYPO3 v14 upgrade patterns using Rector (typo3-rector 3.14, Rector 2.5) | 2.2.0 | rector, upgrade, migration, refactoring |
| `typo3-update` | TYPO3 v14 development guide (constraints, APIs, upgrades) | 2.0.0 | update, upgrade, v14, migration |
| `typo3-14-update` | v12/v13 to TYPO3 14.3 LTS updater around a visual regression main loop, finishing as a verified local DDEV site; never deploys to live | 2.0.0 | complete v14 update, v14-only, ddev update, local upgrade run, visual regression, accessibility loop, sitemap check, bootstrap 5 update, update all extensions, local packages, php 8.4, upgrade wizards, solr update, visual editor, rte ckeditor, security headers, lighthouse, KPI report |
| `typo3-extension-upgrade` | Systematic extension upgrades with Rector, Fractor, PHPStan | 1.0.0 | extension, upgrade, fractor |
| `typo3-fractor` | Automated non-PHP migrations (FlexForm, TypoScript, Fluid, YAML, XLIFF) with Fractor 1.0 | 1.2.0 | fractor, flexform, typoscript migration, fluid migration, xliff |
| `typo3-icon14` | Migrate extension icons to TYPO3 v14 line-art style | 1.0.0 | icons, backend module icons, icon migration, SVG icons, icon registry |
| `typo3-security` | Security hardening checklist and best practices | 2.0.0 | security, hardening, permissions |
| `typo3-seo` | SEO configuration with EXT:seo, sitemaps, meta tags | 2.0.0 | seo, sitemap, meta, robots |
| `typo3-accessibility` | WCAG 2.2 AA audit, Fluid/PHP/JS patterns, go-live checklist | 1.0.0 | accessibility, a11y, wcag, aria, screen reader, keyboard |
| `typo3-wcag22-aa-agentic` | Agentic WCAG 2.2 AA audits for TYPO3 with Playwright, axe-core, optional Deque MCP, manual review helper, CI baselines, and DACH/EAA-aware accessibility statement drafts | 1.0.0 | wcag 2.2 aa, accessibility audit, axe-core, playwright, deque mcp, accessibility statement, eaa, bafg, bfsg |
| `typo3-simplify` | Simplify TYPO3 code: API reuse, quality, efficiency (Boris Cherny) | 1.0.0 | simplify, clean up, refine, code quality, reduce complexity |
| `typo3-batch` | Batch TYPO3 migrations: hooks→events, TCA, DI, namespaces (Boris Cherny) | 1.0.0 | batch, migrate, bulk, mass refactor, codemod, upgrade all |
| `typo3-powermail` | Powermail 13+ forms, finishers, validators, events, spam shield | 1.0.0 | powermail, mailform, form extension, tx_powermail |
| `typo3-powermail/CONDITIONS` | Conditional field/page visibility with powermail_cond 13+ | 1.0.0 | powermail_cond, conditional fields, show hide fields |
| `typo3-records-list-types` | Grid, Compact, Teaser, custom view modes for TYPO3 v14 Records module | 1.0.0 | records list types, grid view backend, compact view, teaser view, custom view type, backend record cards |
| `typo3-records-list-types/CUSTOM-VIEWS` | Custom view types with TSconfig + Fluid (zero PHP) | 1.0.0 | custom view type, records list template, kanban view, timeline view |
| `typo3-workspaces` | Workspaces versioning, staging, publishing workflows, debugging | 2.0.0 | workspace, versioning, staging, publishing, review, draft content |
| `typo3-visual-editor` | FriendsOfTYPO3 Visual Editor installation, configuration, removal, Fluid template migration, inline editing, content areas, FAQ, and troubleshooting | 1.0.0 | visual editor, inline editing, f:render.text, f:render.contentArea, f:mark.contentArea, PAGEVIEW, colPos |
| `typo3-webcomponents` | TYPO3 v14 backend Web Components with Lit, import maps, backend modules, Form Editor, AJAX routes, reusable backend components, frontend usage decisions, examples, how-tos, dos and donts, and speed guidance | 1.0.0 | web components, Lit, LitElement, backend JavaScript, JavaScriptModules.php, f:asset.module, @typo3 modules, backend module UI, Form Editor, Camp Vienna |
| `typo3-vite` | Vite build setup for TYPO3 v13+ with vite-asset-collector, SCSS architecture, Bootstrap 5 theming, SVG optimization, code splitting, and CSP compliance | 1.0.0 | vite, vite-asset-collector, scss, bootstrap, svg, postcss, csp |
| `typo3-solr` | Apache Solr search: indexing, facets, suggest, vector search, debugging | 1.0.0 | solr, search, indexing, facets, suggest, autocomplete, vector search |
| `typo3-solr/SOLRFAL` | File indexing with solrfal and Apache Tika | 1.0.0 | solrfal, file indexing, tika, pdf search, file search |
| `typo3-solr/FRONTEND` | Custom JS for search, suggest, facets without jQuery | 1.0.0 | solr javascript, vanilla js search, solr ajax |

## Skill Categories

### Video & Animation
- **remotion-best-practices**: Video creation in React with Remotion, animations, transitions, audio
- **hyperframes**: HTML-as-source-of-truth video authoring with GSAP timelines, captions, TTS, audio-reactive visuals, and scene transitions
- **hyperframes-cli**: `npx hyperframes` workflow for init, lint, preview, render, transcribe, TTS, and environment troubleshooting
- **hyperframes-registry**: Install and wire reusable registry blocks and components into HyperFrames compositions
- **website-to-hyperframes**: Capture a website, derive design/story/script artifacts, and turn it into a promo, tour, or social video
- **gsap**: GSAP tween, timeline, easing, and performance reference used inside HyperFrames compositions
- **micro-interactions**: Disney's 12 animation principles applied to UI feedback (button states, toggles, focus rings, ripples, badges) with timing and easing guidance
- **microinteractions**: Dan Saffer's Microinteractions framework — triggers, rules, feedback, loops & modes, signature moments — with case studies and 0-10 scoring rubric
- **webconsulting-create-documentation**: Product documentation with help pages, AI screenshots, narrated video tours (Remotion + GSAP + ElevenLabs TTS + Suno AI music), GitHub README visual docs

### Security & Enterprise
- **security-audit**: Deep security audits aligned with OWASP Top 10
- **security-incident-reporting**: Post-incident documentation drawing from NIST/SANS, DDoS post-mortem, CVE correlation
  - `SKILL-TYPO3.md`: TYPO3 forensics, Security Team communication, PGP-encrypted vulnerability reports
- **deepfake-detection**: Multimodal media authentication, synthetic media forensics (PRNU, IGH, DQ, GAN fingerprints)
- **enterprise-readiness**: OpenSSF Scorecard, SLSA, supply chain security
- **readiness-report**: AI agent readiness assessment across 9 technical pillars and 5 maturity levels
- **ai-search-optimization**: AEO/GEO for AI search (schema.org, robots.txt, llms.txt, TYPO3, MD/MDX)

### Database
- **postgres-best-practices**: Postgres performance optimization from Supabase
  - Query performance, indexes, connection pooling
  - Row Level Security (RLS) patterns
  - Schema design, data types, partitioning
  - Concurrency, locking, queue processing
  - `SKILL-SUPABASE.md`: auth.uid(), Edge Functions, MCP server, Realtime

### Marketing
- **marketing-skills**: Marketing skills from Corey Haines
  - `SKILL-CRO.md`: Page conversion rate optimization
  - `SKILL-COPYWRITING.md`: Headlines, CTAs, page structure
  - `SKILL-SEO.md`: Technical and on-page SEO audit
  - `SKILL-PSYCHOLOGY.md`: 70+ mental models for marketing
  - `SKILL-PRICING.md`: Pricing strategy, tiers, value metrics

- **Corey Haines split skills**: Ads, lifecycle, SEO, research, social, sales enablement, and growth execution
  - `ad-creative`, `ads`, `ai-seo`, `analytics`, `aso`, `churn-prevention`, `co-marketing`, `cold-email`, `community-marketing`
  - `competitor-profiling`, `competitors`, `content-strategy`, `copy-editing`, `copywriting`, `cro`, `customer-research`, `directory-submissions`
  - `emails`, `free-tools`, `image`, `launch`, `lead-magnets`, `marketing-ideas`, `marketing-psychology`, `onboarding`, `paywalls`, `popups`
  - `pricing`, `product-marketing`, `prospecting`, `referrals`, `revops`, `sales-enablement`, `schema`, `seo-audit`, `signup`, `site-architecture`, `sms`, `social`, `video`
  - Collision-safe imports: `corey-ab-testing` and `corey-programmatic-seo` preserve existing AITYTech `ab-testing` and `programmatic-seo`

### CRO & Growth (AgentKits Marketing)
- **cro-funnel**: Full-funnel Conversion Rate Optimization from AgentKits
  - Form CRO: Lead capture, contact forms, demo requests
  - Signup Flow CRO: Registration, account creation, trial activation
  - Onboarding CRO: Post-signup activation, time-to-value, aha moment
  - Popup CRO: Modals, exit intent, slide-ins, email capture
  - Paywall CRO: In-app paywalls, upgrade screens, freemium conversion
- **programmatic-seo**: Build SEO pages at scale with templates and data
  - 12 playbooks: Templates, Curation, Comparisons, Locations, Personas, Integrations, Glossary
  - URL structure best practices (subfolders > subdomains)
  - Unique value per page, avoid thin content penalties
- **launch-strategy**: Product launches and go-to-market strategies
  - ORB Framework: Owned, Rented, Borrowed channels
  - Five-phase launch: Internal → Alpha → Beta → Early Access → Full
  - Product Hunt launch strategy and checklist
  - Post-launch product marketing
- **ab-testing**: A/B test design and experimentation
  - Hypothesis framework and documentation
  - Sample size calculation and duration planning
  - Metrics selection: primary, secondary, guardrail
  - Statistical analysis and result interpretation

### Code Quality & Refactoring
- **agent-md-refactor**: Refactor bloated agent instruction files (AGENTS.md, CLAUDE.md, COPILOT.md)
  - Progressive disclosure: keep essentials at root, organize rest into linked files
  - 5-phase process: Find contradictions → Extract essentials → Categorize → Structure → Prune
  - Templates for root file and linked category files
- **autoreview**: Structured closeout code review workflow
  - Run the bundled helper against local, branch, PR, or commit diffs before commit or ship
  - Treat review output as advisory; verify every accepted finding in the code path before fixing
- **caveman**: Ultra-compressed communication mode
  - Drop filler while keeping technical terms and code exact
  - Stays active until the user asks for normal mode
- **grill-me**: Stress-test plans and designs through one-question-at-a-time interviews
  - Walk the decision tree branch by branch until the design is resolved
  - Ask only one question at a time and provide a recommended answer
  - Explore the codebase directly when the answer can be discovered locally
- **diagnose**: Disciplined debugging loop for hard bugs and performance regressions
  - Reproduce, minimize, hypothesize, instrument, fix, and regression-test
  - Keep diagnosis evidence-driven instead of jumping to likely fixes
- **grill-with-docs**: Stress-test plans against the codebase language and decisions
  - Use `CONTEXT.md` and ADRs while resolving design branches
  - Update project documentation as terminology and decisions crystallize
- **handoff**: Compact the current conversation into a continuation document
  - Save the handoff outside the workspace and reference existing artifacts instead of duplicating them
  - Include suggested skills for the next agent
- **improve-codebase-architecture**: Find architecture deepening opportunities
  - Use domain language and ADRs to identify shallow modules and coupling
  - Propose refactors that improve testability and agent navigation
- **prototype**: Build throwaway prototypes to answer design questions
  - Choose terminal prototypes for logic/state questions
  - Choose toggleable UI variations for interface exploration
- **setup-matt-pocock-skills**: Configure project context for Matt Pocock's engineering skills
  - Scaffold issue tracker, triage labels, and domain documentation locations
- **tdd**: Test-driven development with red-green-refactor
  - Write failing behavioral tests first, then implement the smallest slice
- **to-issues**: Break plans or PRDs into independently grabbable issues
  - Use vertical slices that an agent can pick up without hidden dependencies
- **to-prd**: Turn current context into a PRD issue
  - Synthesize known requirements without restarting the interview
- **triage**: Move issues through a role-driven triage state machine
  - Prepare bugs and feature requests for agent-ready implementation
- **write-a-skill**: Create new skills with progressive disclosure
  - Draft concise `SKILL.md` entry points plus references, scripts, and assets as needed
- **zoom-out**: Ask for broader system context around unfamiliar code
  - Map relevant modules and callers before diving back into details
- **refactor**: Code refactoring patterns and best practices from GitHub
  - 10 common code smells with before/after fixes
  - Safe refactoring process (prepare → identify → refactor → verify → clean up)
  - Design patterns: Strategy, Chain of Responsibility
  - Type safety improvements, extract method techniques
- **refactor-clean**: Clean code expert with SOLID design patterns
  - Incremental refactoring steps with stable behavior
  - Code smell assessment, dependency analysis, risky hotspot identification
  - Refactor plan with ordered steps and expected impact
- **find-skills**: Discover and install skills from the open agent skills ecosystem
  - Skills CLI (`npx skills`) for searching, installing, updating skills
  - Browse at skills.sh, install from GitHub repositories
  - Common skill categories and search tips

### PHP & Tools
- **php-modernization**: PHP 8.x features, type safety, PHPStan level 10
  - PHP 8.4 property hooks, asymmetric visibility, and modernization sequencing are covered directly in this skill
- **cli-tools**: CLI tool management, auto-installation on "command not found"
- **context7**: Library documentation lookup via Context7 REST API
- **firecrawl**: Firecrawl CLI for LLM-optimized web scraping, search, and research
- **skill-creator**: Guide for creating effective Agent Skills (from Anthropic)
  - `scripts/init_skill.py`: Initialize new skill from template
  - `scripts/package_skill.py`: Package and validate skill for distribution
  - `references/workflows.md`: Sequential and conditional workflow patterns
  - `references/output-patterns.md`: Template and example output patterns

### Frontend & Design
- **webconsulting-branding**: Borderless square surfaces, header-only notices, typography, tokens, and logo-first project identity
- **ui-design-patterns**: Visual hierarchy, spacing, color, typography, accessibility
- **frontend-design**: Distinctive UI aesthetics that avoid generic "AI slop"
  - Bold aesthetic directions: brutalist, maximalist, luxury, editorial
  - Creative typography pairings (avoid Inter/Roboto/Arial)
  - Color palettes with dominant + accent approach
  - Motion design for high-impact moments
  - Anti-patterns checklist
- **impeccable**: Production-grade frontend design workflow for shaping, critique, polish, audits, craft passes, and live UI iteration
- **web-design-guidelines**: Interface review for accessibility and usability
  - WCAG 2.1 AA compliance checking
  - Semantic HTML validation
  - ARIA patterns and keyboard navigation
  - Responsive design and touch targets
  - Focus states and color contrast
- **excalidraw**: Architecture diagrams as `.excalidraw` files with optional PNG/SVG export
  - Generate system and codebase diagrams directly from source analysis
  - Uses proper Excalidraw bindings, elbow arrows, and component color palettes
  - Can export diagrams to PNG and SVG via Playwright
- **og-image**: Social media preview images (Open Graph) and meta tag configuration
  - Creates `/og-image` route matching project design system
  - Screenshots at 1200x630 dimensions
  - Configures og:image, twitter:card, theme-color meta tags
  - Supports Next.js, Vite, Astro, Remix, plain HTML
- **react-best-practices**: React and Next.js performance optimization from Vercel
  - 57 rules across 8 categories, prioritized by impact
  - Eliminating waterfalls (async/await, Promise.all, Suspense)
  - Bundle size optimization (barrel imports, dynamic imports)
  - Server-side performance (React.cache, parallel fetching)
  - Re-render optimization (memo, useTransition, refs)
- **shadcn-ui**: shadcn/ui component patterns with Radix UI and Tailwind CSS
  - Core components: Button, Input, Form, Card, Dialog, Select, Sheet, Table, Toast, Charts
  - Forms with React Hook Form + Zod validation
  - Theming with CSS variables, dark mode support
  - Next.js App Router integration, Server Components patterns
  - Customization with class-variance-authority (cva)

### Platform Design
- **android-design**: Material Design 3 and Android platform guidelines
  - Dynamic color (Material You) with static fallback
  - Navigation Bar, Navigation Rail, Navigation Drawer
  - Window size classes, edge-to-edge display
  - Accessibility: 48dp touch targets, TalkBack support
- **ios-design**: Apple Human Interface Guidelines for iPhone
  - 44pt touch targets, safe areas, thumb zone placement
  - Tab bar navigation, NavigationStack, large titles
  - Dynamic Type, semantic system colors, Dark Mode
  - VoiceOver, Bold Text, Reduce Motion support
- **ipados-design**: Apple Human Interface Guidelines for iPad
  - Adaptive layouts, Split View, Slide Over, Stage Manager
  - Sidebar navigation, keyboard shortcuts (Cmd+key)
  - Pointer/trackpad support, hover effects, right-click menus
  - Drag and drop between apps, Apple Pencil support
- **macos-design**: Apple Human Interface Guidelines for Mac
  - Complete menu bar with keyboard shortcuts
  - Resizable windows, fullscreen, multiple windows
  - Toolbars, sidebars, source list style
  - Full keyboard navigation, vibrancy, Dark Mode
- **tvos-design**: Apple Human Interface Guidelines for Apple TV
  - Focus-based navigation with parallax effects
  - 10-foot UI: 29pt minimum text, high contrast
  - Siri Remote: swipe, click, Menu, Play/Pause
  - Top Shelf content, media playback controls
- **visionos-design**: Apple Human Interface Guidelines for Vision Pro
  - Spatial layout: content at 1-2m, never behind user
  - Look-and-pinch interaction, 60pt minimum targets
  - Windows with glass material, volumes, immersive spaces
  - Progressive immersion, world-anchored UI
- **watchos-design**: Apple Human Interface Guidelines for Apple Watch
  - Glanceable design: 2-second comprehension
  - Digital Crown scrolling with haptic detents
  - Complications: multiple families, fresh data
  - Always On display, workout features
- **web-platform-design**: Comprehensive web platform design guidelines
  - WCAG 2.2 accessibility, semantic HTML, ARIA patterns
  - Responsive design, container queries, touch targets
  - Forms, typography, performance optimization
  - Dark mode, animations, internationalization (RTL)

### Documents & Office
- **document-processing**: PDF, DOCX, PPTX, XLSX creation, editing, and analysis
  - PDF: text extraction, merge/split, OCR, watermarks, forms
  - DOCX: pandoc conversion, docx-js creation, tracked changes
  - PPTX: markitdown extraction, PptxGenJS creation, thumbnails
  - XLSX: pandas analysis, openpyxl formulas, financial models

### Legal & Compliance
- **legal-impressum**: Austrian Impressum for all company types (Gesellschaftsformen)
  - `SKILL-GERMANY.md`: German DDG/MStV requirements
  - `SKILL-EU.md`: EU eCommerce Directive compliance
  - `SKILL-WORLD.md`: International (UK, Switzerland, USA)

### TYPO3 CMS
- **typo3-content-blocks**: Content Elements & Record Types with single YAML config (no duplicate TCA/SQL)
- **typo3-shadcn-content-elements**: Preset-driven shadcn/ui content element overhauls for Content Blocks, Fluid templates, backend previews, icons, and seed data
- **desiderio-teach**: Add a teaching topic, create mission-grounded lesson content, and publish it as a TYPO3 page using Desiderio content elements
- **typo3-translations**: TYPO3 13/14 labels, XLIFF 1.2 compatibility, XLIFF 2.0 migration, localization keys, ICU strings, paths, translation domains, and `LLL:` reference hygiene
- **typo3-idea-extension-blog**: Turn a link or concept into TYPO3 analysis, a GitHub-ready extension, and a German MDX article
- **typo3-news-tags**: Bulk-generate thematic tags for EXT:news and assign them to existing news records by corpus analysis and keyword matching
- **typo3-datahandler**: Safe database operations via DataHandler API with PSR-14 events
- **typo3-ddev**: Local development environment setup with multi-version testing
- **typo3-testing**: Comprehensive testing (unit, functional, E2E, architecture, mutation)
- **typo3-conformance**: Extension quality assessment and standards compliance
- **typo3-docs**: Official documentation standards with RST and TYPO3 directives
- **typo3-core-contributions**: Contributing to TYPO3 Core via Gerrit and Forge
- **typo3-initial-release**: First official TYPO3 14.3+ extension release workflow with Composer metadata, CI/tooling, final review, and tagging gates
- **typo3-rector**: Automated code refactoring with Rector for TYPO3 v14
- **typo3-update**: Version migration and compatibility strategies for TYPO3 v14
- **typo3-14-update**: End-to-end v14.3-only upgrade orchestration inside local DDEV — visual regression main loop with pre-update sitemap, Bootstrap 5 and accessibility gates, strategy for all extensions (Packagist, local packages/, forks, uninstall checks), upgrade wizards, workspaces, plain Vite build, Solr/Visual Editor/RTE/security-header feature upgrades, Lighthouse sampling, webconsulting-CI Word KPI report; never deploys to live
- **typo3-extension-upgrade**: Systematic extension upgrades with Rector, Fractor, PHPStan
- **typo3-fractor**: Automated non-PHP migrations (FlexForm, TypoScript, Fluid, YAML, XLIFF, Htaccess)
- **typo3-icon14**: Migrate extension icons from solid-background to v14 line-art style (currentColor, CSS custom properties)
- **typo3-security**: Production hardening checklist for TYPO3 v14
- **typo3-seo**: Search engine optimization with EXT:seo
- **typo3-accessibility**: WCAG 2.2 AA accessibility audit, Fluid/PHP/JS patterns, go-live checklist
- **typo3-wcag22-aa-agentic**: Agentic WCAG 2.2 AA audits with Playwright/axe, optional Deque MCP, manual review helper, CI baselines, and DACH/EAA-aware statement drafts
- **typo3-simplify**: Simplify TYPO3 code for clarity and maintainability (adapted from Boris Cherny/Anthropic)
- **typo3-batch**: Batch operations for large-scale TYPO3 migrations and refactoring (adapted from Boris Cherny/Anthropic)
- **typo3-powermail**: Powermail 13+ form extension (finishers, validators, events, spam shield, emails)
  - `SKILL-CONDITIONS.md`: Conditional field/page visibility with powermail_cond
  - PHP 8.4 patterns for finishers, validators, and conditions are covered directly in the main skill
  - `SKILL-EXAMPLES.md`: Multi-step shop form with Austrian legal types, conditions, translations, DDEV SQL + DataHandler CLI
- **typo3-records-list-types**: Grid, Compact, Teaser, and custom view modes for TYPO3 v14 Records module
  - `SKILL-CUSTOM-VIEWS.md`: Custom view types (zero PHP), template variables, real-world examples, PSR-14 registration
- **typo3-workspaces**: Workspaces versioning, staging, publishing workflows, and debugging
- **typo3-visual-editor**: FriendsOfTYPO3 Visual Editor install/config/remove workflow, Fluid template migration to `f:render.text` and `f:render.contentArea`, `f:mark.contentArea` fallbacks, FAQ, do/don'ts, and troubleshooting
- **typo3-webcomponents**: TYPO3 v14 backend Web Components with Lit, import maps, backend modules, Form Editor, AJAX routes, examples, frontend decisions, and speed guidance
- **typo3-vite**: Vite build setup for TYPO3 sitepackages with `praetorius/vite-asset-collector`, SCSS architecture, Bootstrap theming, SVG optimization, and CSP-safe asset loading
- **typo3-solr**: Apache Solr search integration (Index Queue, facets, suggest, vector search, debugging)
  - `SKILL-SOLRFAL.md`: File indexing with solrfal and Apache Tika
  - `SKILL-FRONTEND.md`: Custom vanilla JS for search, suggest, facets (no jQuery)

## Usage

Skills are automatically loaded by Claude when relevant keywords are detected in your query. You can also explicitly request a skill:

> "Using the typo3-datahandler skill, help me create a content element programmatically."

### Quick Examples by Category

**🏗️ Project Setup (typo3-ddev)**
- "Set up TYPO3 v14 with DDEV, Redis, and Xdebug"
- "Configure multi-site with shared codebase"
- "Import production database and sanitize sensitive data"
- "Docker production setup with nginx and PHP-FPM"

**📦 Content Blocks (typo3-content-blocks)**
- "Create a hero banner Content Element with CTA button"
- "Create a team members Record Type with Extbase naming"
- "Build an accordion with Collection items"
- "FAQ with categories using Record Type relations"
- "Image slider with IRRE and max 10 slides"
- "Migrate my classic TCA/SQL extension to Content Blocks"
- "Convert this TCA config to Content Blocks YAML"
- "Keep existing column names during migration"
- "Revert Content Block to classic TCA/SQL format"
- "Generate TCA PHP from Content Blocks config.yaml"
- "Remove Content Blocks dependency safely"

**🎛️ shadcn Content Elements (typo3-shadcn-content-elements)**
- "Audit EXT:desiderio content elements for shadcn preset b4hb38Fyj, missing fields, previews, icons, and seed coverage"
- "Apply a new shadcn/create preset to the TYPO3 Fluid component layer and keep tokens scoped by preset id"
- "Regenerate backend previews so editors see headings, repeatable items, CTAs, thumbnails, and chart summaries"
- "Update the seed script so every top-level and repeatable field has useful text, links, images, alt text, and chart JSON"

**📚 Desiderio Teaching Pages (desiderio-teach)**
- "Add a topic to teach and create a TYPO3 lesson page with Desiderio content elements"
- "Create teaching content for schema markup, choose the matching Desiderio elements by description, and fill the page content"
- "Turn this learning topic into a mission, resources, a reference sheet, and a Desiderio page"

**💡 Idea -> Extension -> Blog (typo3-idea-extension-blog)**
- "Read this product announcement and tell me if it is genuinely useful for TYPO3"
- "Turn this startup idea into a TYPO3 extension and a German webconsulting.at article"
- "Assess this paper for TYPO3, build the meaningful parts, and prepare the MDX draft"

**🔧 Extension Development (typo3-datahandler, typo3-update)**
- "CRUD operations with DataHandler and transactions"
- "Extbase controller with list/show actions for TYPO3 v14"
- "PSR-14 event listener with AsEventListener attribute"
- "Custom repository with QueryBuilder methods"
- "Scheduler task with progress reporting"
- "Backend module with list view and bulk actions"
- "REST API with authentication and rate limiting"
- "CLI command with progress bar and dry-run mode"

**🗂️ TCA & FlexForm (typo3-datahandler)**
- "TCA select field with icons and default value"
- "TCA inline (IRRE) with sorting and appearance"
- "FlexForm with tabs and database record selection"
- "Custom route enhancers for SEO-friendly URLs"

**📁 Files & Media (typo3-datahandler)**
- "Process uploaded images: resize, convert to WebP"
- "Extract and store EXIF metadata from images"
- "Custom image processor with watermark"

**🌐 Localization (typo3-update)**
- "Multi-language setup with fallback types"
- "XLIFF translations with pluralization"
- "Sync translations from Phrase/Lokalise"

**🎥 HyperFrames Video Production (hyperframes, hyperframes-cli, hyperframes-registry, website-to-hyperframes, gsap)**
- "Create a 10-second product intro in HyperFrames with a fade-in title, background video, and music"
- "Capture https://example.com and turn it into a 25-second product launch video"
- "Make a 9:16 TikTok-style hook video with bouncy captions synced to TTS narration"
- "Install the data-chart block with `hyperframes add` and wire it into index.html"
- "Scaffold a HyperFrames project, lint it, preview it, and render a draft MP4"

**📧 Forms & Email (typo3-datahandler)**
- "EXT:form custom finisher for CRM integration"
- "Custom validator for email domain whitelist"
- "Styled HTML email template with Fluid"

**⚡ Performance (typo3-ddev, typo3-security)**
- "Redis caching with cache groups and tags"
- "Cache invalidation strategy with tags"
- "Database query optimization and indexing"

**🔐 Auth & Permissions (typo3-security)**
- "Frontend user registration with email verification"
- "Backend user groups with granular permissions"
- "SAML SSO integration with Azure AD"

**🔄 Fractor Non-PHP Migrations (typo3-fractor)**
- "Set up Fractor for TYPO3 TYPO3 v14 non-PHP migrations"
- "Migrate FlexForm eval=required to required=1"
- "Migrate TypoScript INCLUDE_TYPOSCRIPT to @import syntax"
- "Migrate FlexForm indexed items to label/value format"
- "Configure TypoScript code style formatting in Fractor"
- "Run Fractor dry-run to preview non-PHP migrations"
- "Migrate fe_login logout handling in Fluid templates"
- "Remove deprecated TypoScript config options for v14"
- "Write a custom Fractor rule for FlexForm migration"
- "Configure Fractor file extension filtering"

**🔄 Upgrades (typo3-rector, typo3-extension-upgrade)**
- "Upgrade extension from v12 to TYPO3 v14 with Rector"
- "Fix all deprecations for TYPO3 v14"
- "Fractor for TypoScript and Fluid migrations"
- "Site migration from v10 to v14 with URL preservation"

**🎨 Icon Modernization (typo3-icon14)**
- "Migrate extension icons to TYPO3 v14 line-art style"
- "Convert solid-background SVG icons to currentColor"
- "Scan extension for legacy icon SVGs and create v14 replacements"
- "Update Configuration/Icons.php registration for v14"
- "Create backend module icon with CSS custom properties"
- "Audit extension icons against TYPO3 v14 design language"

**🧪 Testing (typo3-testing)**
- "Unit tests with mocked repositories"
- "Functional tests with database fixtures"
- "E2E tests with Playwright for contact form"
- "GitHub Actions CI for PHP 8.2/8.3 + TYPO3 v14"

**🔒 Security Hardening (typo3-security, security-audit)**
- "Security audit for XSS, CSRF, SQL injection"
- "Production hardening checklist"
- "OWASP Top 10 compliance review"
- "PSR-15 middleware for security headers"
- "CVSS scoring for discovered vulnerabilities"

**📊 Agent Readiness (readiness-report)**
- "Run /readiness-report to evaluate this repository"
- "Assess codebase maturity for AI-assisted development"
- "Identify gaps preventing effective autonomous development"
- "Check which maturity level (L1-L5) this repo achieves"
- "Generate prioritized recommendations for agent readiness"
- "Evaluate the 9 technical pillars: Style, Build, Testing, Docs, DevEnv, Debugging, Security, Tasks, Analytics"

**🚨 Incident Response (security-incident-reporting)**
- "Create NIST/SANS-style incident report for executive summary"
- "Document DDoS attack with timeline, peak bandwidth, and attack vectors"
- "Build post-mortem report with blameless root cause analysis (5-Whys)"
- "Generate IoC list with MITRE ATT&CK TTPs for threat intelligence"
- "Correlate UDP amplification attack with CVE-2023-29552 (SLP)"
- "Calculate incident severity using NCISS and DRS scoring"
- "Create chronological timeline with detection, containment, recovery phases"
- "Assess financial impact: lost revenue, scrubbing costs, response hours"
- "Multi-vector DDoS analysis: volumetric + application layer"
- "Executive summary for C-level stakeholders (max 200 words)"

**🔬 TYPO3 Forensics (security-incident-reporting/TYPO3)**
- "Verify TYPO3 Core integrity after suspected compromise"
- "Analyze sys_log for suspicious backend logins and failed attempts"
- "Search fileadmin for PHP webshells and malicious uploads"
- "Check tt_content bodytext for injected scripts or spam"
- "Audit be_users for unauthorized admin accounts"
- "Create PGP-encrypted vulnerability report for security@typo3.org"
- "Document TYPO3 system inventory: version, PHP, extensions"
- "Classify vulnerability: Deserialization, XSS, SQLi, IDOR"
- "Generate forensic checklist: logs, filesystem, database analysis"
- "Responsible disclosure: follow embargo rules until advisory release"

**📈 SEO (typo3-seo)**
- "XML sitemap with custom entries"
- "OpenGraph/Twitter cards with fallbacks"
- "Hreflang for multi-language sites"
- "Structured data for articles (JSON-LD)"

**♿ Accessibility (typo3-accessibility)**
- "Run WCAG 2.2 AA accessibility audit on my TYPO3 site"
- "Run an agentic WCAG 2.2 AA audit with Playwright, axe-core, and manual review exports"
- "Scaffold TYPO3 accessibility tooling with CI baselines and an accessibility statement draft"
- "Use Deque axe MCP guidance to remediate this rendered TYPO3 page state"
- "Add skip-to-content link and landmark elements to my Fluid layout"
- "Create accessible accordion with keyboard navigation"
- "Create accessible tabs component for TYPO3"
- "Add aria-current to active navigation items in Fluid"
- "Make alt text required in TCA for all images"
- "Add focus-visible styles to my site package"
- "Create PSR-15 middleware for html lang attribute"
- "Audit my Fluid templates for accessibility anti-patterns"
- "Set up pa11y for automated WCAG testing in CI"
- "Make EXT:form fields accessible with autocomplete and inputmode"
- "Create screen-reader-only ViewHelper for hidden labels"
- "Add aria-live announcer for dynamic content updates"
- "Create accessible modal/dialog with focus trapping"
- "Check my content elements for proper heading hierarchy"
- "Configure reduced motion support in CSS and JavaScript"
- "Check color contrast ratios in my TYPO3 site CSS"
- "Add proper touch targets (44x44px) to all interactive elements"
- "Create accessible breadcrumb navigation with aria-label"
- "Ensure my EXT:news templates meet WCAG standards"
- "Add fieldset and legend to grouped form inputs"
- "Make my Content Block templates accessible"
- "Create accessible image gallery with keyboard navigation"
- "Add language attribute to multilingual content sections"
- "Audit my TYPO3 backend for missing image alt texts"
- "Create accessible data tables with scope and caption"

**🧹 Simplify (typo3-simplify)**
- "Simplify my recently changed TYPO3 code"
- "Replace GeneralUtility::makeInstance with constructor injection"
- "Find deprecated hooks and replace with PSR-14 events"
- "Clean up my TCA: use v14 field types and required/nullable"
- "Remove unnecessary code from ext_localconf.php"
- "Replace $GLOBALS['TSFE'] with request attributes"
- "Simplify my Extbase controller for v14 patterns"
- "Review my Fluid templates for hardcoded strings"
- "Clean up Services.yaml: remove redundant definitions"
- "Reduce complexity in my repository queries"
- "Replace GeneralUtility::_GP() with PSR-7 request"
- "Find custom code that TYPO3 core already provides"
- "Replace $GLOBALS['BE_USER'] with Context injection"
- "Add constructor promotion and readonly to my service classes"
- "Replace manual JSON response with PSR-7 JsonResponse"
- "Simplify my middleware: remove unnecessary global state"
- "Replace ObjectManager::get() with proper DI"
- "Add declare(strict_types=1) and return types to my classes"
- "Replace addPageTSConfig in ext_localconf with Configuration/page.tsconfig"
- "Simplify TCA palettes: merge single-field palettes"
- "Replace manual file path resolution with PathUtility"
- "Remove unused use-imports and suppress annotations from PHP files"
- "Replace custom caching with TYPO3 CacheManager"
- "Simplify nested if-statements with guard clauses and early returns"
- "Replace array typehints with typed arrays or DTO classes"
- "Move icon registrations from ext_localconf to Configuration/Icons.php"

**⚡ Batch (typo3-batch)**
- "Batch migrate all hooks to PSR-14 events in my extension"
- "Batch modernize all TCA files to v14 format"
- "Batch convert all GeneralUtility::makeInstance to DI"
- "Batch extract all hardcoded strings to XLIFF"
- "Batch add missing return types to all PHP classes"
- "Batch refactor Fluid templates: replace <a> with <f:link.page>"
- "Batch move ext_localconf content to Configuration/ files"
- "Batch rename extension namespace from Vendor\\Old to Vendor\\New"
- "Batch migrate classic content elements to Content Blocks"
- "Batch add declare(strict_types=1) to all PHP files"
- "Batch convert TCA items arrays to label/value format"
- "Batch set up unit tests for all service classes"
- "Batch migrate to PHP 8.4: property hooks, array_find, #[Deprecated]"
- "Batch add accessibility attributes to all Fluid templates"
- "Batch replace all <img> tags with <f:image> in Fluid templates"
- "Batch add constructor promotion to all Extbase classes"
- "Batch move backend module registration to Configuration/Backend/Modules.php"
- "Batch replace Signal/Slot with PSR-14 events across extension"
- "Batch add readonly to all injected service properties"
- "Batch replace 'eval' => 'required' with 'required' => true in all TCA"
- "Batch create German XLIFF translations for all locallang files"
- "Batch replace renderType inputDateTime with type datetime in TCA"
- "Batch add final keyword to all non-inherited classes"
- "Batch replace switchableControllerActions with separate plugins"
- "Batch add functional tests for all repository classes"
- "Batch replace manual link generation with UriBuilder across extension"

**🔍 Solr Search (typo3-solr)**
- "Set up EXT:solr with DDEV and ddev-typo3-solr addon"
- "Index EXT:news records into Solr with categories and tags"
- "Configure faceted search with category and date filters"
- "Add suggest/autocomplete to the search form"
- "Debug: items in Index Queue but not appearing in search results"
- "Set up Solr vector search with OpenAI embeddings (LLM module)"
- "Custom PSR-14 event listener to enrich Solr documents"
- "Docker production setup with persistent Solr data"
- "Configure hosted-solr.com for a multi-language TYPO3 site"
- "Index PDF files into Solr with EXT:solrfal and Tika"
- "Replace jQuery-based suggest with vanilla JavaScript"
- "Troubleshoot: Search is currently not available"
- "Use helhum/dotenv-connector for per-environment Solr config"
- "Test with EXT:solr v14 dev branch (task/14LTS_compatibility)"
- "Full debugging: flowchart from connection to search results"

**📬 Powermail Forms (typo3-powermail)**
- "Create a simple contact form with name, email, subject, message"
- "Build a multi-step order form with product selection and GDPR checkboxes"
- "Create a registration form with company details and VAT number"
- "Build a job application form with file upload and cover letter"
- "Create an event registration form with date picker and attendee count"
- "Build a feedback/survey form with radio buttons and rating scale"
- "Create a newsletter signup form with double opt-in"
- "Build a support ticket form that routes to departments via select"
- "Create a booking request form with date range and room type"
- "Build a callback request form with preferred time slot selection"
- "Create a custom finisher that sends form data to a CRM API"
- "Custom finisher that creates fe_users from registration form"
- "Write a finisher that posts form data to Slack/Teams webhook"
- "SaveToAnyTable: write form answers to a custom database table"
- "Create a SendParametersFinisher to forward data to external service"
- "Custom validator for Austrian VAT number (ATU format)"
- "Custom validator for IBAN fields"
- "Custom validator for Austrian ZIP codes (4 digits)"
- "Validate that at least one checkbox in a group is selected"
- "PSR-14 event: route receiver email based on department select field"
- "PSR-14 event: modify sender name from multiple form fields"
- "PSR-14 event: prevent DB save for specific forms"
- "PSR-14 event: add custom data to mail object for use in finishers"
- "PSR-14 event: modify email body before sending"
- "Configure spam shield with honeypot, rate limiting, and blacklists"
- "Custom spam shield method with external API (Akismet, reCAPTCHA)"
- "Configure double opt-in for newsletter signups with custom email template"
- "AJAX form submission without page reload"
- "Override receiver and sender email templates with custom Fluid partials"
- "Prefill form fields from logged-in frontend user data"
- "Prefill form fields from GET/POST parameters"
- "Add form to page via TypoScript without backend plugin"
- "Configure route enhancer for SEO-friendly opt-in URLs"
- "Export submitted mails to CSV/Excel via backend module"
- "Create a multi-language form (English + German) with translated labels"
- "Translate select/radio options for multi-language forms"
- "Create form structure via DataHandler CLI command"
- "Insert form with all fields via DDEV SQL for local testing"
- "Show the database structure of all powermail tables"

**📬 Powermail Conditions (typo3-powermail/CONDITIONS)**
- "Show/hide fields based on select dropdown value"
- "Hide an entire page/fieldset unless a checkbox is checked"
- "Show extra fields when user selects 'Other' in a dropdown"
- "Field-to-field comparison: warn when email fields don't match"
- "Build conditional form for Austrian legal types (Gesellschaftsformen)"
- "Show Firmenbuchnummer only for GmbH, AG, OG, KG, e.U."
- "Show Stammkapital and Geschäftsführer only for GmbH"
- "Show ZVR-Zahl and Obmann only for Verein"
- "Create condition container with multiple rules and AND/OR conjunction"
- "Reduce flickering with server-side prerendered conditions ViewHelper"
- "Configure route enhancer for condition AJAX endpoint (TypeNum 3132)"
- "Exclude file upload fields from condition AJAX payload"
- "Create conditions via DDEV SQL for local testing"
- "Create conditions via DataHandler CLI command"
- "Show the database structure of all powermail_cond tables"
- "Numeric comparison: show discount field when quantity > 10"
- "Multi-step shop form with conditional fields per legal type (full example)"
- "Create powermail form as workspace draft (not live)"
- "Set up DataHandler CLI with --workspace option for draft forms"
- "Publish workspace form via CLI: workspace:publish"
- "Ensure conditions are in the same workspace as the form"
- "Check which workspace a powermail form lives in (t3ver_wsid)"

**📋 Records List Types (typo3-records-list-types)**
- "Set Grid View as default for the Records module"
- "Configure per-table fields for News cards (title, teaser, image)"
- "Switch between Grid, Compact, and Teaser views in the backend"
- "Create a custom Timeline view type with TSconfig and Fluid template"
- "Add an Address Book view using CompactView with fixed columns"
- "Restrict view modes to specific pages via TSconfig conditions"
- "Register a custom view type via PSR-14 RegisterViewModesEvent"
- "Configure pagination: items per page, per-type override"
- "Create a Photo Gallery view (GridView, 48 items, no description)"
- "Add a Product Catalog view with custom template and large thumbnails"
- "Reuse built-in TeaserView for event calendar page"
- "Set up drag-and-drop reordering in Grid View"
- "Add custom CSS for dark mode support using TYPO3 CSS variables"
- "Add custom JavaScript module to a view type"
- "Configure grid column count for media folder pages"
- "Force Grid View for a specific backend user group"
- "Show workspace state indicators (new, modified, moved, deleted)"
- "Disable extension for specific page trees"
- "Create a custom view with no pagination (itemsPerPage = 0)"
- "Install the companion records-list-examples extension"

**Initial Release (typo3-initial-release)**
- "Prepare this TYPO3 14.3+ extension for the first official v1.0.0 release"
- "Run final release readiness review against origin/main before tagging"
- "Align composer.json, README, docs, and changelog for v1.0.0"
- "Remove legacy ext_emconf.php and move release metadata into composer.json"
- "Verify PHP 8.4/8.5 CI matrix, PHPStan, PHPUnit, PHP-CS-Fixer, and coverage guards before release"
- "Create the annotated v1.0.0 tag only after final TYPO3 conformance, testing, security, and docs checks"

**🤖 AI Search (ai-search-optimization)**
- "Optimize content for ChatGPT and Perplexity citations"
- "Schema markup for Google AI Overviews (FAQPage, Article, HowTo)"
- "Configure robots.txt for AI crawlers (GPTBot, PerplexityBot, ClaudeBot)"
- "E-E-A-T signals and author bios for AI trust"
- "Implement llms.txt for LLM site discovery"
- "TYPO3 EXT:schema for structured data"
- "TYPO3 EXT:ai_llms_txt for llms.txt generation"
- "MDX JSON-LD components for Next.js/Astro"
- "Raw MDX view with .md suffix or ?raw=true"
- "FAQ Content Block with FAQPage schema"
- "Content freshness with visible timestamps"
- "Monitor brand mentions in AI search platforms"
- "Audit website for AI search visibility"

**🔍 Deepfake Detection & Media Forensics (deepfake-detection)**
- "What are deepfakes and how do they work technically?"
- "Verify authenticity of this video before publication"
- "Is this image AI-generated? Check for diffusion model or GAN artifacts"
- "Analyze PRNU/PCE sensor fingerprints to match claimed camera source"
- "Generate DQ probability map to detect image splicing and compositing"
- "Detect face-swap deepfakes via temporal consistency and blink analysis"
- "Check this audio for voice cloning artifacts and synthetic speech patterns"
- "Verify C2PA/CAI content provenance and cryptographic chain of custody"
- "Analyze shadow physics and reflection consistency for semantic forensics"
- "Build automated media authentication pipeline with ffmpeg and exiftool"
- "Create forensic report with authenticity grade (1-6) and confidence intervals"
- "What tools do I need for deepfake detection? Install ffmpeg, exiftool, c2patool"
- "Explain the Liar's Dividend and 4D disinformation tactics"
- "How do I defend against CEO voice clone fraud attacks?"

**🔀 Workspaces (typo3-workspaces)**
- "Create a workspace for content staging and review"
- "Publish workspace changes to live via CLI"
- "Debug workspace overlay queries that return wrong records"
- "Configure workspace-aware Extbase repository queries"
- "Create content as draft in workspace, preview before publishing"
- "Set up workspace notification emails for reviewers"
- "Swap workspace versions for pages and content elements"
- "Check t3ver_wsid and t3ver_state for versioned records"
- "Handle file references in workspace (limitations and workarounds)"
- "Discard workspace changes and revert to live version"

**🔍 Conformance (typo3-conformance)**
- "Run conformance check on my TYPO3 extension"
- "Evaluate extension quality for TYPO3 v14 standards"
- "Generate conformance report with recommendations"
- "Check extension for deprecated API usage"
- "Assess code quality metrics for TYPO3 extension"

**🤝 Core Contributions (typo3-core-contributions)**
- "Submit a patch to TYPO3 Core via Gerrit"
- "Set up Gerrit for TYPO3 Core development"
- "Create a Forge issue for a bug report"
- "Cherry-pick a Core fix to another branch"
- "Write a commit message following TYPO3 conventions"
- "Review an existing Gerrit patch"

**🎬 Video Creation (remotion-best-practices)**
- "Create a product demo video with React and Remotion"
- "Build animated text reveal with spring physics"
- "Add background music with volume ducking during narration"
- "Create a code walkthrough video with syntax highlighting"
- "Build an SVG animation composition with staggered entrance"
- "Render Remotion video to MP4 with custom FPS and resolution"
- "Create a data-driven chart animation from JSON"
- "Add captions and subtitles to a Remotion video"

**🖌️ UI Design Patterns (ui-design-patterns)**
- "Improve visual hierarchy on this page"
- "Add proper spacing and rhythm to my layout"
- "Choose a color palette with primary, secondary, and accent"
- "Create a consistent typography scale"
- "Design card components with proper visual weight"
- "Improve contrast and readability of my text"
- "Add visual depth with shadows and elevation"
- "Create a responsive grid system with proper gaps"

**🎨 Branding (webconsulting-branding)**
- "Apply webconsulting.at design system to my components"
- "Use the correct brand colors and typography"
- "Create MDX components following webconsulting style"
- "Set up CSS variables for the webconsulting design tokens"

**⚖️ Legal Impressum (legal-impressum)**
- "Create an Impressum for an Austrian GmbH"
- "Generate Impressum for Austrian Einzelunternehmen (e.U.)"
- "Create Offenlegung for an Austrian media website (MedienG)"
- "Generate Impressum for a German UG (haftungsbeschränkt)"
- "Create EU-compliant eCommerce legal notice"
- "Impressum for Austrian Verein (ZVR-Zahl, Obmann)"
- "Create Impressum for Austrian OG or KG"
- "What legal information is required for a Swiss website?"

**🔧 CLI Tools (cli-tools)**
- "Install missing CLI tools for this project"
- "Audit project environment for required tools"
- "Auto-install ripgrep, fd, bat, eza on macOS"
- "Set up PHP development tools (phpstan, rector, php-cs-fixer)"
- "Detect project type and install required CLI tools"

**📚 Context7 Documentation (context7)**
- "Look up the latest API docs for this library"
- "Find code examples for a specific framework method"
- "Get current documentation for a npm/composer package"
- "Check if this API method is still supported in the latest version"

**🔥 Firecrawl (firecrawl)**
- "Scrape this URL and return clean markdown"
- "Search the web for information about a topic"
- "Crawl an entire documentation site"
- "Extract content from a page with JavaScript rendering"
- "Get a sitemap of all URLs on a domain"

**🐘 PHP 8.4 (php-modernization)**
- "Migrate class to PHP 8.4 property hooks"
- "Use asymmetric visibility for DTOs"
- "Replace array functions with new PHP 8.4 equivalents"
- "Add #[\\Deprecated] attribute to legacy methods"
- "Convert constructor to promoted properties with hooks"

**📚 Documentation (typo3-docs)**
- "RST documentation following docs.typo3.org"
- "API documentation with code examples"
- "Configuration reference with confval directive"

**🏢 Quality (enterprise-readiness, php-modernization)**
- "PHPStan level 9 configuration"
- "Enterprise readiness assessment"
- "Quality gates for CI/CD"
- "Custom logging with Sentry integration"

**🚀 Deployment (typo3-ddev)**
- "Deployer config with staging and production"
- "GitHub Actions automated deployment"
- "Docker production with health checks"

**🛠️ Common Fixes (typo3-datahandler)**
- "Fix broken relations and orphaned records"
- "Bulk content update with DataHandler"
- "Debug extension conflicts in TCA/hooks"
- "Database optimization and missing indexes"

**🐘 Postgres & Supabase (postgres-best-practices)**
- "Optimize this slow Postgres query"
- "Add proper indexes for WHERE and JOIN columns"
- "Review my schema for performance issues"
- "Set up Row Level Security for multi-tenant app"
- "Configure connection pooling with PgBouncer"
- "Find missing indexes on foreign keys"
- "Use cursor-based pagination instead of OFFSET"
- "Batch INSERT statements for bulk data"
- "UPSERT pattern for insert-or-update"
- "Use SKIP LOCKED for job queue processing"
- "Partition large time-series table"
- "Enable pg_stat_statements for query analysis"
- "Choose right index type: B-tree vs GIN vs BRIN"
- "Optimize RLS policies for performance"
- "Fix N+1 queries with batch loading"

**📖 Product Documentation & Video Tours (webconsulting-create-documentation)**
- "Create product documentation with help pages and video tour"
- "Build a help page with collapsible FAQ sections and step-by-step instructions"
- "Create a 60-second product tour video with Remotion, TTS narration, and background music"
- "Generate ElevenLabs TTS narration in a calm Jony Ive style"
- "Animate an SVG architecture diagram with GSAP: nodes pop in, lines draw themselves"
- "Build a 3D exploded screenshot view separating UI into layers"
- "Create number odometer animations for dashboard infographics"
- "Code diff walkthrough: removed lines glow red, new lines glow green"
- "Add Suno AI background music with volume ducking during narration"
- "GitHub README with dark/light theme screenshots and embedded video"

**🖼️ OG Images & Social Sharing (og-image)**
- "Generate an OG image for my Next.js app"
- "Create social preview image matching my design system"
- "Set up Twitter card meta tags"
- "Configure Open Graph meta tags for LinkedIn sharing"
- "Screenshot my /og-image page at 1200x630"
- "Add og:image, og:title, og:description meta tags"
- "Create OG image with cosmic/ethereal/brutalist/editorial style"
- "Audit my site's social sharing meta tags"
- "Set up metadataBase for absolute OG image URLs"
- "Cache bust my OG image on Facebook/Twitter/LinkedIn"

**📈 Marketing & Growth (marketing-skills)**
- "Optimize this landing page for conversions"
- "Review my pricing page CRO"
- "Write homepage copy for my SaaS product"
- "Create headlines for this feature page"
- "Improve this CTA copy"
- "Audit my site for SEO issues"
- "Why isn't my page ranking?"
- "Review my pricing tiers and packaging"
- "Should I use freemium or free trial?"
- "Apply psychology to increase conversions"
- "What mental models apply to this marketing challenge?"
- "Help me structure this landing page"
- "Write copy for my demo request page"
- "Optimize my signup flow"
- "Create an A/B test plan for my pricing page"
- "Add social proof and trust signals"
- "Handle objections on my sales page"
- "Write a value proposition for my product"

**🎯 CRO Funnel Optimization (cro-funnel)**
- "Optimize my lead capture form (reduce fields)"
- "Review my contact form for CRO issues"
- "Audit my demo request form for friction"
- "Improve my signup flow conversion rate"
- "Add social auth to reduce signup friction"
- "Design multi-step registration flow"
- "Create onboarding checklist for new users"
- "Define and optimize for the aha moment"
- "Design empty states that drive first action"
- "Create re-engagement flow for stalled users"
- "Design email capture popup with exit intent"
- "Create scroll-triggered newsletter popup"
- "Build announcement banner for new feature"
- "Design paywall screen for freemium upgrade"
- "Create trial expiration modal"
- "Optimize feature gate for paid conversion"
- "Full-funnel CRO audit from page to payment"

**📊 Programmatic SEO (programmatic-seo)**
- "Build [service] in [city] pages at scale"
- "Create comparison pages ([X] vs [Y])"
- "Design directory pages for my category"
- "Build integration pages for partner tools"
- "Create persona pages ([product] for [audience])"
- "Design template gallery for SEO"
- "Build glossary pages for industry terms"
- "Plan programmatic SEO strategy for my SaaS"
- "Avoid thin content penalties at scale"
- "Design URL structure for programmatic pages"
- "Create hub and spoke internal linking"
- "Choose between the 12 pSEO playbooks"

**🚀 Product Launch (launch-strategy)**
- "Plan my Product Hunt launch strategy"
- "Create pre-launch waitlist campaign"
- "Design 5-phase launch from alpha to GA"
- "Build ORB channel strategy (owned/rented/borrowed)"
- "Create Product Hunt listing and assets"
- "Plan post-launch momentum strategy"
- "Design feature announcement campaign"
- "Create beta program with early access"
- "Build launch checklist for new product"
- "Plan ongoing launch for feature releases"

**🧪 A/B Testing (ab-testing)**
- "Design A/B test for my homepage hero"
- "Create hypothesis for pricing page test"
- "Calculate sample size for my experiment"
- "How long should I run this A/B test?"
- "Choose primary and guardrail metrics"
- "Analyze A/B test results"
- "Document test learnings and next steps"
- "Plan multivariate test for checkout flow"
- "Avoid common A/B testing mistakes"
- "Set up experiment tracking"

**🧩 shadcn/ui Components (shadcn-ui)**
- "Set up shadcn/ui in my Next.js project"
- "Create a login form with email and password validation using shadcn/ui"
- "Build a settings dialog with shadcn/ui Dialog component"
- "Add a data table with sorting and pagination using shadcn/ui Table"
- "Create a sidebar navigation with Sheet component"
- "Build a dashboard card layout with shadcn/ui Card"
- "Add toast notifications to my Next.js app"
- "Create a multi-field form with Zod validation and shadcn/ui Form"
- "Customize shadcn/ui Button with a new gradient variant"
- "Set up dark mode theming with shadcn/ui CSS variables"
- "Build a chart dashboard with shadcn/ui Charts and Recharts"
- "Create a command palette / search dialog with shadcn/ui"

**⚛️ React & Next.js Performance (react-best-practices)**
- "Review this React component for performance issues"
- "Optimize this Next.js page"
- "Eliminate request waterfalls in my data fetching"
- "Use Promise.all for parallel fetches"
- "Add Suspense boundaries for streaming"
- "Reduce bundle size with dynamic imports"
- "Avoid barrel file imports"
- "Use React.cache() for request deduplication"
- "Optimize re-renders with memo and useTransition"
- "Defer third-party scripts after hydration"
- "Use SWR for client-side data fetching"
- "Parallelize server component fetches"

**🔧 Code Refactoring (refactor, refactor-clean)**
- "Refactor this function - it's too long and hard to follow"
- "Clean up this code and remove duplication"
- "This class has too many responsibilities, split it up"
- "Replace these nested if-statements with guard clauses"
- "Extract a reusable method from this repeated logic"
- "Apply SOLID principles to this module"
- "Remove dead code and magic numbers from this file"
- "Improve type safety in these functions"
- "Find code smells in this service class"
- "Create a refactoring plan for this legacy module"

**📝 Agent Instructions Refactoring (agent-md-refactor)**
- "Refactor my AGENTS.md - it's 500 lines and hard to maintain"
- "Split my CLAUDE.md into focused topic files"
- "Organize my agent instructions with progressive disclosure"
- "Find contradictions in my agent config files"
- "My COPILOT.md is bloated, clean it up"
- "Create a minimal root file with links to detailed guidelines"

**🔍 Skill Discovery (find-skills)**
- "Find a skill for React performance optimization"
- "Is there a skill for writing changelogs?"
- "Search for testing skills on skills.sh"
- "Install the react-best-practices skill from Vercel"
- "What skills are available for deployment automation?"
- "Help me find a skill for code review"

**🧠 Plan Stress Testing (grill-me)**
- "Grill me on this rollout plan until we have no open decisions left"
- "Stress-test this architecture design one question at a time"
- "Challenge my migration plan and recommend the best answer for each tradeoff"
- "Grill me on this feature spec before I start coding"

**🛠️ Skill Creation (skill-creator)**
- "Create a new skill for database migrations"
- "Initialize a skill template for my custom workflow"
- "Package my skill for distribution"
- "Validate my SKILL.md frontmatter"
- "Help me structure a skill with references and scripts"
- "What's the best pattern for organizing a multi-domain skill?"

**🎨 Frontend Design & Creative UI (frontend-design)**
- "Create a distinctive landing page that doesn't look AI-generated"
- "Design a dark tech hero section with gradient mesh backgrounds"
- "Build a pricing card with glass morphism effects"
- "Create an editorial-style testimonial section"
- "Design a brutalist navigation menu"
- "Build a retro-futuristic dashboard interface"
- "Create animated cards with staggered reveal on scroll"
- "Design a luxury product page with serif typography"
- "Build a SaaS hero with neon accents and glow effects"
- "Create a minimalist portfolio with bold typography"
- "Design feature cards with creative hover states"
- "Build a dark mode interface with proper contrast"
- "Suggest distinctive font pairings, avoid Inter/Roboto"
- "Create a color palette with dominant, secondary, and accent colors"
- "Add micro-interactions to my buttons (hover, click, loading)"
- "Build a page transition with slide-up fade-in animations"
- "Create a gradient mesh background with subtle animation"
- "Add noise texture overlay for visual depth"
- "Design a navigation that morphs between mobile and desktop"
- "Audit my design for 'AI slop' patterns and fix them"
- "Create CSS variables for a complete design system"
- "Build a hero with parallax scrolling and floating elements"
- "Design an asymmetric layout with intentional visual tension"
- "Create a diagonal split layout for my hero section"

**🧭 Impeccable Frontend Craft (impeccable)**
- "Use impeccable shape for this onboarding flow before implementation"
- "Run impeccable craft for this landing page and wait for the shape brief"
- "Use impeccable critique on this dashboard"
- "Use impeccable polish on this settings UI before release"
- "Use impeccable live to inspect the current page and propose stronger UI variants"

**✅ Accessibility & Interface Review (web-design-guidelines)**
- "Review this component for accessibility issues"
- "Audit my form for WCAG 2.1 AA compliance"
- "Check color contrast ratios in my design"
- "Add proper ARIA labels to my navigation"
- "Fix keyboard navigation in my modal"
- "Add focus indicators to all interactive elements"
- "Review semantic HTML structure"
- "Check touch target sizes for mobile"
- "Add skip links for keyboard users"
- "Audit my site for screen reader compatibility"
- "Fix heading hierarchy issues"
- "Add alt text to all images"
- "Create an accessible modal with focus trapping and escape key"
- "Build accessible tabs with ARIA roles and arrow key navigation"
- "Add ARIA live regions for dynamic notifications"
- "Check my color palette for colorblind accessibility"
- "Create accessible date picker with keyboard support"
- "Implement prefers-reduced-motion for my animations"
- "Convert this div-soup navigation to semantic HTML"
- "Add scope attributes and captions to my data tables"
- "Create keyboard-navigable image gallery"
- "What will a screen reader announce for this component?"
- "Run a full WCAG 2.1 AA audit with issue list and fixes"
- "Add focus-visible styles that look good without outlines"

**📱 Platform Design (android-design, ios-design, ipados-design, macos-design, tvos-design, visionos-design, watchos-design, web-platform-design)**
- "Review my Android app for Material Design 3 compliance"
- "Implement dynamic color theming in Jetpack Compose"
- "Create a Navigation Bar with 4 destinations"
- "Review my iOS app for Human Interface Guidelines"
- "Implement Dark Mode with semantic system colors"
- "Add Dynamic Type support to my SwiftUI app"
- "Create a tab bar with 5 sections using SF Symbols"
- "Adapt my iPhone app layout for iPad Split View"
- "Add keyboard shortcuts to my iPad app"
- "Implement sidebar navigation for iPad"
- "Support trackpad hover effects and right-click menus"
- "Create a Mac app with proper menu bar and shortcuts"
- "Implement toolbar and sidebar for my macOS app"
- "Review my tvOS app for focus navigation issues"
- "Design a 10-foot UI with proper text sizes for Apple TV"
- "Create Top Shelf content with deep links"
- "Design a visionOS window with glass material"
- "Implement look-and-pinch interaction for Vision Pro"
- "Create glanceable watchOS interface for Apple Watch"
- "Add complications to my watchOS app"
- "Audit my web app for WCAG 2.2 compliance"
- "Make my forms accessible with proper labels and error states"
- "Add RTL support with CSS logical properties"

**📄 Document Processing (document-processing)**
- "Extract text from this PDF while preserving structure"
- "Merge these 5 PDFs into one with bookmarks"
- "Split this 100-page PDF into chapters"
- "OCR this scanned PDF with poor quality"
- "Add 'CONFIDENTIAL' watermark to all pages"
- "Create a PDF invoice with header, line items, and footer"
- "Rotate all landscape pages to portrait"
- "Password-protect this PDF with encryption"
- "Extract pages 10-25 as a new PDF"
- "Convert this Word document to clean markdown"
- "Create a DOCX with table of contents and page numbers"
- "Find and replace text across this Word document"
- "Extract all tracked changes with authors and dates"
- "Accept all tracked changes and save clean version"
- "Extract all text from this PowerPoint by slide"
- "Create a pitch deck: Problem, Solution, Market, Traction, Team, Ask"
- "Replace all images in this PowerPoint with new versions"
- "Export slide 5 as high-resolution PNG"
- "Analyze this Excel: row count, columns, data types, issues"
- "Calculate summary statistics for the Revenue column"
- "Find duplicate rows based on Email column"
- "Create an Excel budget with SUM formulas for totals"
- "Add formulas: column D = C * B, row 20 sums each column"
- "Format Excel: bold headers, currency format, alternating rows"
- "Create financial model: blue inputs, black formulas, green outputs"
- "Add conditional formatting: red if negative, green if above target"
- "Create dropdown list from values in another sheet"
- "Convert PDF tables to Excel file"
- "Batch process all PDFs: extract text to markdown files"

## Session Profiles

For optimal performance, limit active skills per session:

### Frontend Session
Active: `webconsulting-branding`, `ui-design-patterns`, `frontend-design`, `og-image`, `react-best-practices`, `shadcn-ui`  
Use case: UI development, styling, component creation, visual design, social sharing, React/Next.js optimization

### Creative Design Session
Active: `frontend-design`, `ui-design-patterns`, `webconsulting-branding`, `og-image`  
Use case: Distinctive UI design, creative interfaces, anti-AI-slop aesthetics, memorable user experiences

### Accessibility Audit Session
Active: `web-design-guidelines`, `ui-design-patterns`, `react-best-practices`, `typo3-accessibility`, `typo3-wcag22-aa-agentic`
Use case: WCAG compliance, accessibility audits, semantic HTML, ARIA patterns, keyboard navigation, automated/manual evidence

### TYPO3 Accessibility Session
Active: `typo3-accessibility`, `typo3-wcag22-aa-agentic`, `typo3-content-blocks`, `typo3-seo`, `web-design-guidelines`
Use case: TYPO3 WCAG 2.2 AA compliance, accessible Fluid templates, keyboard navigation, form a11y, DACH/EAA statement drafts

### Document Processing Session
Active: `document-processing`, `enterprise-readiness`  
Use case: PDF manipulation, Word document creation, PowerPoint presentations, Excel analysis

### Backend Session
Active: `typo3-content-blocks`, `typo3-shadcn-content-elements`, `desiderio-teach`, `typo3-translations`, `typo3-news-tags`, `typo3-datahandler`, `typo3-powermail`, `typo3-records-list-types`, `typo3-visual-editor`, `typo3-webcomponents`, `typo3-solr`, `typo3-ddev`, `typo3-update`, `typo3-testing`
Use case: Extension development, Content Blocks, Desiderio teaching pages, localization, news tagging, database operations, forms, search, backend views, visual editing, TYPO3 v14 code

### Release Session
Active: `typo3-initial-release`, `typo3-conformance`, `typo3-testing`, `typo3-security`, `typo3-docs`, `typo3-ddev`
Use case: First official TYPO3 14.3+ extension releases, release readiness reviews, CI/tooling verification, Composer metadata alignment, changelog/docs checks, and safe tagging

### Ops Session
Active: `typo3-security`, `security-audit`, `security-incident-reporting`, `enterprise-readiness`, `typo3-ddev`  
Use case: Server configuration, deployment, hardening, security audits, incident response

### Upgrade Session
Active: `typo3-14-update`, `typo3-rector`, `typo3-fractor`, `typo3-update`, `typo3-extension-upgrade`, `typo3-batch`, `typo3-icon14`, `typo3-visual-editor`, `php-modernization`
Use case: TYPO3 version migrations, PHP upgrades, non-PHP migrations, Fluid template migrations, icon modernization, TYPO3 v14 upgrades, batch migrations

### Code Quality Session
Active: `typo3-simplify`, `typo3-batch`, `refactor`, `refactor-clean`, `php-modernization`
Use case: TYPO3 code simplification, batch modernization, API reuse, deprecated pattern removal

### PHP 8.4 Migration Session
Active: `php-modernization`, `typo3-rector`, `typo3-update`, `typo3-powermail`  
Use case: Migrating to PHP 8.4, using new language features, fixing deprecations

### Content Blocks Migration Session
Active: `typo3-content-blocks`, `typo3-shadcn-content-elements`, `typo3-datahandler`, `typo3-extension-upgrade`
Use case: Converting classic TCA/SQL extensions to Content Blocks and refining custom content element rendering

### Documentation Session
Active: `typo3-docs`, `typo3-conformance`, `webconsulting-create-documentation`  
Use case: Extension documentation, quality assessment, product documentation, video tours

### Core Contribution Session
Active: `typo3-core-contributions`, `typo3-testing`, `typo3-conformance`  
Use case: Contributing patches to TYPO3 Core via Gerrit

### Marketing & SEO Session
Active: `typo3-seo`, `ai-search-optimization`, `webconsulting-branding`  
Use case: SEO optimization, AI search visibility, content marketing, structured data

### Media Forensics Session
Active: `deepfake-detection`, `security-audit`, `security-incident-reporting`  
Use case: Media authentication, deepfake detection, disinformation defense, content provenance verification

### Database Session
Active: `postgres-best-practices`, `typo3-datahandler`, `typo3-solr`, `security-audit`  
Use case: Database optimization, Postgres queries, RLS policies, connection pooling, schema design, Solr search

### Marketing Session
Active: `marketing-skills`, `ai-search-optimization`, `ui-design-patterns`  
Use case: Landing page optimization, copywriting, pricing strategy, SEO audits, conversion optimization

### CRO & Growth Session
Active: `cro-funnel`, `ab-testing`, `marketing-skills`, `programmatic-seo`  
Use case: Full-funnel conversion optimization, A/B testing, signup flows, onboarding, paywall optimization

### Product Launch Session
Active: `launch-strategy`, `marketing-skills`, `og-image`, `programmatic-seo`  
Use case: Product launches, Product Hunt campaigns, go-to-market strategy, feature announcements

### React & Next.js Session
Active: `react-best-practices`, `shadcn-ui`, `ui-design-patterns`, `og-image`  
Use case: React/Next.js performance optimization, shadcn/ui components, bundle size reduction, data fetching patterns

### Research & Documentation Session
Active: `firecrawl`, `context7`, `ai-search-optimization`  
Use case: Web research, API documentation lookup, competitor analysis, content extraction, documentation crawling

### Android Development Session
Active: `android-design`, `ui-design-patterns`, `react-best-practices`  
Use case: Material Design 3, Jetpack Compose, dynamic color, Android navigation, accessibility

### Apple Platform Session
Active: `ios-design`, `ipados-design`, `macos-design`, `watchos-design`, `tvos-design`, `visionos-design`  
Use case: SwiftUI/UIKit development, Human Interface Guidelines, Apple platform-specific patterns

### Code Refactoring Session
Active: `refactor`, `refactor-clean`, `agent-md-refactor`, `php-modernization`  
Use case: Code quality improvement, removing code smells, SOLID refactoring, agent instruction restructuring

### Skill Management Session
Active: `find-skills`, `skill-creator`  
Use case: Discovering new skills, installing skills from skills.sh, creating custom skills

### Cross-Platform Design Session
Active: `android-design`, `ios-design`, `web-platform-design`, `ui-design-patterns`  
Use case: Designing for multiple platforms, ensuring platform-appropriate patterns, accessibility across platforms

## Version Compatibility Matrix

| Skill | TYPO3 v14.x | PHP 8.2 | PHP 8.3 | PHP 8.4 |
|-------|-------------|---------|---------|---------|
| typo3-content-blocks | ✓ | ✓ | ✓ | ✓ |
| typo3-shadcn-content-elements | ✓ | ✓ | ✓ | ✓ |
| desiderio-teach | ✓ | ✓ | ✓ | ✓ |
| typo3-translations | ✓ | ✓ | ✓ | ✓ |
| typo3-idea-extension-blog | ✓ | ✓ | ✓ | ✓ |
| typo3-news-tags | ✓ | ✓ | ✓ | ✓ |
| typo3-datahandler | ✓ | ✓ | ✓ | ✓ |
| typo3-ddev | ✓ | ✓ | ✓ | ✓ |
| typo3-testing | ✓ | ✓ | ✓ | ✓ |
| typo3-conformance | ✓ | ✓ | ✓ | ✓ |
| typo3-docs | ✓ | ✓ | ✓ | ✓ |
| typo3-core-contributions | ✓ | ✓ | ✓ | ✓ |
| typo3-initial-release | ✓ | ✓ | ✓ | ✓ |
| typo3-rector | ✓ | ✓ | ✓ | ✓ |
| typo3-update | ✓ | ✓ | ✓ | ✓ |
| typo3-14-update | ✓ | ✓ | ✓ | ✓ |
| typo3-extension-upgrade | ✓ | ✓ | ✓ | ✓ |
| typo3-fractor | ✓ | ✓ | ✓ | ✓ |
| typo3-icon14 | ✓ | ✓ | ✓ | ✓ |
| typo3-security | ✓ | ✓ | ✓ | ✓ |
| typo3-seo | ✓ | ✓ | ✓ | ✓ |
| typo3-accessibility | ✓ | ✓ | ✓ | ✓ |
| typo3-wcag22-aa-agentic | ✓ | ✓ | ✓ | ✓ |
| typo3-simplify | ✓ | ✓ | ✓ | ✓ |
| typo3-batch | ✓ | ✓ | ✓ | ✓ |
| typo3-powermail | ✓ | ✓ | ✓ | ✓ |
| typo3-records-list-types | ✓ | ✓ | ✓ | ✓ |
| typo3-workspaces | ✓ | ✓ | ✓ | ✓ |
| typo3-visual-editor | ✓ | ✓ | ✓ | ✓ |
| typo3-webcomponents | ✓ | ✓ | ✓ | ✓ |
| typo3-vite | ✓ | ✓ | ✓ | ✓ |
| typo3-solr | ✓ | ✓ | ✓ | ✓ |
| ai-search-optimization | ✓ | ✓ | ✓ | ✓ |
| security-audit | ✓ | ✓ | ✓ | ✓ |
| security-incident-reporting | ✓ | ✓ | ✓ | ✓ |
| deepfake-detection | ✓ | ✓ | ✓ | ✓ |
| enterprise-readiness | ✓ | ✓ | ✓ | ✓ |
| readiness-report | ✓ | ✓ | ✓ | ✓ |
| php-modernization | ✓ | ✓ | ✓ | ✓ |
| cli-tools | ✓ | ✓ | ✓ | ✓ |
| context7 | ✓ | ✓ | ✓ | ✓ |
| webconsulting-branding | ✓ | ✓ | ✓ | ✓ |
| ui-design-patterns | ✓ | ✓ | ✓ | ✓ |
| postgres-best-practices | ✓ | ✓ | ✓ | ✓ |
| marketing-skills | ✓ | ✓ | ✓ | ✓ |
| og-image | ✓ | ✓ | ✓ | ✓ |
| react-best-practices | ✓ | ✓ | ✓ | ✓ |
| frontend-design | ✓ | ✓ | ✓ | ✓ |
| web-design-guidelines | ✓ | ✓ | ✓ | ✓ |
| document-processing | ✓ | ✓ | ✓ | ✓ |
| firecrawl | ✓ | ✓ | ✓ | ✓ |
| skill-creator | ✓ | ✓ | ✓ | ✓ |
| android-design | ✓ | ✓ | ✓ | ✓ |
| ios-design | ✓ | ✓ | ✓ | ✓ |
| ipados-design | ✓ | ✓ | ✓ | ✓ |
| macos-design | ✓ | ✓ | ✓ | ✓ |
| tvos-design | ✓ | ✓ | ✓ | ✓ |
| visionos-design | ✓ | ✓ | ✓ | ✓ |
| watchos-design | ✓ | ✓ | ✓ | ✓ |
| web-platform-design | ✓ | ✓ | ✓ | ✓ |
| cro-funnel | ✓ | ✓ | ✓ | ✓ |
| programmatic-seo | ✓ | ✓ | ✓ | ✓ |
| launch-strategy | ✓ | ✓ | ✓ | ✓ |
| ab-testing | ✓ | ✓ | ✓ | ✓ |
| agent-md-refactor | ✓ | ✓ | ✓ | ✓ |
| refactor | ✓ | ✓ | ✓ | ✓ |
| refactor-clean | ✓ | ✓ | ✓ | ✓ |
| find-skills | ✓ | ✓ | ✓ | ✓ |
| shadcn-ui | ✓ | ✓ | ✓ | ✓ |
| webconsulting-create-documentation | ✓ | ✓ | ✓ | ✓ |

## Adding New Skills

1. Create directory: `skills/my-new-skill/`
2. Add `SKILL.md` with YAML frontmatter containing at least `name` and `description`
3. Write the description as routing metadata: what the skill does and when to use it
4. Keep `SKILL.md` concise; move long examples, appendices, and troubleshooting into linked `references/` files
5. For TYPO3 skills, describe compatibility in prose or the supported `compatibility` field; do not invent unsupported frontmatter keys
6. Run `npx -y skills-ref validate skills/my-new-skill` and `./install.sh --generate-only` to refresh catalogs, manifests, and client files
7. Run `./install.sh` when you also want to deploy symlinks

---
*Generated by webconsulting Agent Skills*
