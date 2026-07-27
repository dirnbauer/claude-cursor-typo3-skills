---
name: redmine-agent-ready-tickets
description: Turn queued, vague, mixed-scope, or underspecified Redmine issues into evidence-backed implementation contracts that Claude, ChatGPT, Codex, Hermes, or another coding agent can execute. Use when a user says "send to AI/KI", asks Hermes to prepare a Redmine ticket, audits an AI-preparation queue, rewrites or splits tickets, applies Wayfinder-style research/grilling/prototype/task planning, creates vertical child tickets and blocking relations, or reviews whether a ticket is ready for autonomous implementation.
license: MIT
compatibility: Requires Python 3, Redmine REST API access, and a filterable KI-Workflow issue custom field.
metadata:
  hermes:
    tags: [redmine, ai-preparation, wayfinder, tickets, automation]
    related_skills: [plan, spike, test-driven-development, requesting-code-review]
---

# Redmine Agent-Ready Tickets

Turn issue history and product intent into small, evidence-backed implementation contracts. Preserve why the work exists while removing ambiguity about what must be delivered and how completion will be verified.

This skill prepares work; it does not implement production code. A ticket reaches `Bereit zur KI-Umsetzung` only after the preparation gate passes.

## Required configuration

Provide these values through Hermes Keys, a protected environment file, or an equivalent secret manager:

- `REDMINE_URL`: Redmine base URL, for example `https://track.webconsulting.at`
- `REDMINE_API_KEY`: Redmine REST API key; never write it to a repository or ticket
- `REDMINE_AI_WORKFLOW_FIELD_ID`: numeric ID of the filterable `KI-Workflow` issue custom field
- `REDMINE_AI_PROJECTS`: optional comma-separated queue projects; defaults to `ideas,capexone`

## Load the supporting material

- Read [references/redmine-ai-workflow.md](references/redmine-ai-workflow.md) for queue states, manual and scheduled modes, Redmine operations, and failure recovery.
- Read [references/matt-pocock-preparation-flow.md](references/matt-pocock-preparation-flow.md) before deciding between direct preparation, Wayfinder, research, grilling, prototype, spec, and vertical tickets.
- Read [references/ticket-contract.md](references/ticket-contract.md) before drafting or rewriting any implementation ticket.
- Read [references/restructuring-patterns.md](references/restructuring-patterns.md) when a backlog contains duplicates, research mixed with implementation, independently releasable outcomes, or unclear parent/child relationships.
- Use `scripts/redmine_ai_queue.py` for deterministic Redmine reads and writes. Run `scripts/validate_ticket.py` against every final implementation draft.

## Operating modes

### Manual request

Examples:

- `Hermes, prepare the next Redmine ticket for AI.`
- `Hermes, prepare Redmine #10534 for AI implementation.`
- `Hermes, work through the Wayfinder map in #10531.`

Honor a named issue. Otherwise choose the oldest queued open issue so the queue is fair. When a human decision is required, ask one question at a time and wait for the answer. Do not publish a speculative decision on the user's behalf.

### Scheduled run

Process at most one root issue per run. Claim it before research so concurrent jobs skip it. Scheduled work is AFK: it may inspect repositories and primary sources, resolve factual research, and write an implementation contract. It may not simulate a stakeholder answer, approve a product tradeoff, or treat silence as consent.

When a material human decision remains, add one concise, high-leverage question to Redmine, set `KI-Workflow` to `Rückfrage erforderlich`, and stop. Return `[SILENT]` when no queued issue exists.

## Workflow

### 1. Establish scope and authority

Identify the Redmine project, ticket set, target language, and whether the user requested an audit, drafts, or live updates. Treat reading and drafting separately from changing Redmine.

Prefer the Redmine REST API. Use browser interaction only when the API is unavailable or the user explicitly requests UI work. Never copy an API key, OAuth token, or session cookie into a prompt, repository, log, ticket, or chat message.

Completion: the exact issue IDs, requested operation, and allowed mutation scope are known.

### 2. Claim the issue

For queued work, require `KI-Workflow = Vorbereitung angefordert`, then transition to `Vorbereitung läuft` before doing expensive work. If the value changed between selection and claim, skip the ticket rather than overwriting another worker.

Use:

```bash
python3 scripts/redmine_ai_queue.py claim ISSUE_ID
```

Completion: a fresh issue read shows `Vorbereitung läuft`.

### 3. Capture the source of truth

For the issue, record:

- ID, subject, tracker, delivery status, priority, assignee, parent, children, relations, and custom fields
- full description, comments, attachments, and relevant history
- linked repository, project wiki, deployment, design, ADR, or external dependency
- the original user outcome, even if the proposed implementation is weak

Inspect the target repository and its local instructions when available. Verify package names, versions, APIs, compatibility, and platform limits in primary sources. Distinguish verified facts, decisions already made, proposals, and open questions.

Completion: every requirement is traceable or explicitly marked as an unresolved decision.

### 4. Choose the preparation path

Use the decision model in [references/matt-pocock-preparation-flow.md](references/matt-pocock-preparation-flow.md):

- **Direct contract** when the outcome and route fit one agent session.
- **Research** for factual uncertainty that an AFK agent can resolve from primary sources or a repository.
- **Prototype** when a cheap artifact is needed to decide appearance or behavior; this is HITL and must be reviewed by a human.
- **Grilling** when stakeholder judgment is missing; ask one question at a time.
- **Wayfinder map** when the destination is known but the route spans multiple sessions or remains foggy.

Do not use Wayfinder as ceremony for a small, clear ticket. Wayfinder tickets resolve decisions; implementation tickets deliver vertical behavior.

Completion: the issue is classified as direct, research, prototype, grilling, or Wayfinder, with a written reason.

### 5. Resolve the preparation frontier

For direct work, continue to the contract.

For a Wayfinder issue:

1. Write a concise Destination, Notes, Decisions so far, Not yet specified, and Out of scope section on the parent.
2. Create only questions that are sharp enough to act on now as child issues.
3. Prefix child subjects with `[Research]`, `[Grilling]`, `[Prototype]`, or `[Task]` and state the question in the body.
4. Create children before adding native `blocks` relations because relations need real IDs.
5. Resolve bounded research children from primary sources. Leave HITL children open for the human.
6. Do not chart vague fog as fake tickets. Keep it under `Not yet specified` until an answer makes the question sharp.

Never resolve more than one non-research decision ticket in one session. Expect other sessions to edit the same map.

Completion: the current frontier is visible in Redmine and no open child is hidden in prose.

### 6. Produce the spec and vertical ticket plan

Once the route is clear, synthesize a spec with:

- Problem Statement and Solution
- numbered User Stories
- verified Implementation Decisions
- Testing Decisions and the highest practical test seam
- Out of Scope and Further Notes

For work that needs multiple implementation sessions, create tracer-bullet child tickets. Each child must deliver a narrow but complete path through all affected layers, fit one fresh agent session, be independently verifiable, and declare native blocking relations. Keep wide mechanical refactors as expand–migrate–contract sequences.

For work that fits one session, keep one ticket instead of fragmenting it.

Completion: every implementation session has one coherent outcome and visible blockers.

### 7. Draft and validate the implementation contract

Use [references/ticket-contract.md](references/ticket-contract.md). Adapt formatting to the Redmine text formatter; do not paste Markdown into a Textile project without conversion.

Requirements must describe observable behavior. Give the implementation agent autonomy inside explicit constraints. Use stable acceptance IDs (`AC-1`, `AC-2`, …) and exact repository validation commands only after verifying them.

Run:

```bash
python3 scripts/validate_ticket.py path/to/ticket.txt
```

Treat the validator as a floor. Require a readiness score of at least 85, no missing target, no hidden product decision, no mixed research/implementation scope, and no untestable acceptance criterion.

Completion: validation passes and every warning is resolved or deliberately accepted in the preparation note.

### 8. Publish and verify

Before replacing a description, preserve the original request under `Original request` or in an audit comment. Start AI-authored comments with:

```text
_Diese Vorbereitung wurde von KI erstellt und muss vor der Umsetzung menschlich geprüft werden._
```

Publish the authoritative contract in the description, not across scattered comments. Set the parent or directly executable issue to `Bereit zur KI-Umsetzung` only after the readiness gate passes. Keep a Wayfinder parent at `Rückfrage erforderlich` while HITL decisions remain.

Reopen every changed issue and verify its subject, tracker, description, hierarchy, relations, delivery status, and `KI-Workflow` value.

Completion: a fresh API read matches the intended state and the final response names every changed issue URL.

## Readiness gate

A ticket is ready only when all are true:

- one issue has one coherent implementation outcome
- the target repository or deterministic discovery rule is explicit
- scope and non-goals prevent predictable expansion
- dependencies and ordering are visible
- acceptance criteria describe externally observable completion
- tests cover success, failure, and regressions proportional to risk
- security, data, deployment, rollback, and observability are addressed or explicitly not applicable
- no blocking product decision is hidden inside an implementation note
- the ticket is understandable without private conversation context
- the work fits one fresh agent session

## Output

Return:

1. issue selected and preparation path chosen
2. verified facts, decisions, and remaining questions
3. parent/child and blocking structure created or proposed
4. readiness score and validator result
5. exact Redmine mutations and links
6. the next human action, or `[SILENT]` for an empty scheduled queue

---

## Credits & Attribution

This skill is based on the excellent work by
**[Matt Pocock](https://github.com/mattpocock)**.

Original repository: https://github.com/mattpocock/skills

**Copyright (c) Matt Pocock** - Agent skills for real engineering workflows (MIT License)

Special thanks to [Matt Pocock](https://github.com/mattpocock) for his generous open-source contributions, which helped shape this skill collection.
Adapted by webconsulting.at for this skill collection
