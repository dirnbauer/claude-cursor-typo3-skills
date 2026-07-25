---
name: "context7"
description: "Use when looking up library documentation, API references, framework patterns, or code examples for ANY library (React, Next.js, Vue, Django, Laravel, etc.) and the Context7 MCP server is unavailable or not configured. Fetches the same current docs directly via the Context7 REST API as a fallback. Triggers on: how to use library, API docs, framework pattern, import usage, library example."
---

# Context7 Documentation Lookup Skill

Fetch current library documentation, API references, and code examples via the Context7 REST API.

## When to Use

Use this skill when the user asks about library APIs, framework patterns, or version-specific behavior. Trigger on:

- Library questions: "How do I use [library]?", "[library] API docs", "[library] patterns"
- Import statements: `import`, `require`, `from` followed by a library name
- Framework-specific topics: hooks, routing, middleware, ORM queries, schema definitions

## When NOT to Use

Do NOT use this skill for:

- General programming concepts (closures, recursion, design patterns)
- Code review or refactoring tasks
- Debugging business logic
- Writing scripts from scratch without library-specific questions

## Core Workflow

1. **Search** for the library ID:
   ```bash
   scripts/context7.sh search "library-name"
   ```

2. **Pick the best result**: Choose the ID with the highest score and most relevant description. Prefer official sources (e.g., `/vercel/next.js` over community forks).

3. **Fetch documentation** with a focused topic:
   ```bash
   scripts/context7.sh docs "<library-id>" "<topic>" "<mode>"
   ```

Always extract a specific topic from the user's question. For "How does React Suspense work with server components?", use topic `suspense server components`.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `library-id` | Yes | From search results, format `/vendor/library` |
| `topic` | No | Focus area extracted from user query (e.g., `hooks`, `routing`, `validation`) |
| `mode` | No | `code` (default) for API references; `info` for conceptual guides |

## Examples

```bash
# React hooks API
scripts/context7.sh search "react"
scripts/context7.sh docs "/facebook/react" "hooks" "code"

# Next.js App Router conceptual guide
scripts/context7.sh search "nextjs"
scripts/context7.sh docs "/vercel/next.js" "app router" "info"

# Django ORM queries
scripts/context7.sh search "django"
scripts/context7.sh docs "/django/django" "queryset filter" "code"

# Laravel Eloquent relationships
scripts/context7.sh search "laravel"
scripts/context7.sh docs "/laravel/framework" "eloquent relationships" "code"
```

## Environment Configuration

Set `CONTEXT7_API_KEY` for higher rate limits (optional):

```bash
export CONTEXT7_API_KEY="your-api-key"
```

---

> **Contributing:** https://github.com/netresearch/context7-skill

---

## Credits & Attribution

This skill is based on the excellent work by
**[Netresearch DTT GmbH](https://www.netresearch.de/)**.

Original repository: https://github.com/netresearch/context7-skill

**Copyright (c) Netresearch DTT GmbH** — Methodology and best practices (MIT / CC-BY-SA-4.0)

Special thanks to [Netresearch DTT GmbH](https://www.netresearch.de/) for their generous open-source contributions to the TYPO3 community, which helped shape this skill collection.
Adapted by webconsulting.at for this skill collection
