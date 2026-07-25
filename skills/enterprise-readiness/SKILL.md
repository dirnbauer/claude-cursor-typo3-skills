---
name: "enterprise-readiness"
description: "Use when evaluating projects for production or enterprise readiness, implementing supply chain security (SLSA, cosign, SBOMs, pnpm), hardening CI/CD pipelines, establishing quality gates (TYPO3: CI matrix PHP 8.2-8.5 x TYPO3 12.4/13.4/14.3 LTS), pursuing OpenSSF Best Practices Badge (Passing/Silver/Gold) or OSPS Baseline levels, reviewing code quality, writing ADRs, or configuring Git hooks and CI pipelines."
---

# Enterprise Readiness Assessment

> Production/enterprise tier only — see `references/tier-framing.md`.

## When to Use

- Production/enterprise readiness evaluations
- Supply chain security: SLSA provenance, cosign signing, SBOMs
- CI/CD hardening, workflow permissions
- OpenSSF Best Practices (Passing/Silver/Gold), OSPS Baseline (L1/2/3)
- Scorecard optimization (Token-Permissions, Branch-Protection, Pinned-Deps)
- Code review, ADRs, changelogs, SECURITY.md

## Assessment Workflow

1. **Discovery**: Identify platform, languages, existing CI/CD, dependabot.yml
2. **Scoring**: Apply checklists; check Scorecard, badge criteria, coverage
3. **Gap Analysis**: List missing controls by severity
4. **Implementation**: Apply fixes (SHA-pin actions, harden permissions, add workflows)
5. **Verification**: Re-score and compare

## Mandatory Workflows & Badges

Required coverage: CI, CodeQL, Scorecard, dependency review, composer audit, SBOM — as dedicated workflows or jobs calling the netresearch reusable. Badges: CI, Codecov, Scorecard, Best Practices, Baseline. See `references/badges-and-workflows.md`.

## Key Hardening Patterns

- **Permissions**: Declare `permissions: contents: read` at workflow-level; grant write only per-job
- **SHA pinning**: Third-party actions pinned to SHA with version comment (`# v4.2.0`). Org-internal reusable workflows use `@main`
- **Harden-Runner**: `step-security/harden-runner` as first step in every job; prefer `egress-policy: block` with allowed-endpoints
- **Dependabot**: Configure `dependabot.yml` with all ecosystems (`composer`, `npm`, `github-actions`, `docker`); set up auto-merge workflow for dependency PRs using `pull_request_target`
- **Coverage**: Upload via `codecov-action`; configure `codecov.yml` with patch coverage threshold
- **Duplicate CI prevention**: Scope `push:` trigger to `branches: [main]` when `pull_request:` is also present
- **SLSA provenance**: Use `actions/attest-build-provenance` with `id-token: write` and `attestations: write` permissions; verify with `gh attestation verify`
- **Security policy**: Create `SECURITY.md` with vulnerability disclosure process and response SLA (Critical: 7 days, High: 30 days)

## Critical Rules

- **NEVER** interpolate `${{ github.event.* }}` or `${{ inputs.* }}` in `run:` blocks (script injection)
- **NEVER** guess action versions -- fetch from GitHub API and verify SHA against tags
- **ALWAYS** include `https://` URLs in badge justifications
- **ALWAYS** configure auto-merge for repos with Dependabot/Renovate

## References

| Reference | Use |
|-----------|-----|
| `references/general.md` | Always |
| `references/scorecard-playbook.md` | Scorecard optimization |
| `references/badges-and-workflows.md` | Badge URLs, workflows |
| `references/mandatory-requirements.md` | Checklist |
| `references/ci-patterns.md` | CI/CD, hooks |
| `references/code-review.md` | PR quality |
| `references/slsa-provenance.md` | SLSA Level 3 |
| `references/signed-releases.md` | Cosign/GPG |
| `references/openssf-badge-silver.md` | Silver |
| `references/openssf-badge-gold.md` | Gold |
| `references/openssf-badge-baseline.md` | OSPS Baseline |
| `references/harden-runner-guide.md` | Harden-Runner |
| `references/solo-maintainer-guide.md` | N/A criteria |
| `references/npm-pnpm-supply-chain.md` | pnpm |

Related skills: `go-development`, `github-project`, `security-audit`, `git-workflow`.

---

## Credits & Attribution

This skill is based on the excellent work by
**[Netresearch DTT GmbH](https://www.netresearch.de/)**.

Original repository: https://github.com/netresearch/enterprise-readiness-skill

**Copyright (c) Netresearch DTT GmbH** — Methodology and best practices (MIT / CC-BY-SA-4.0)

Special thanks to [Netresearch DTT GmbH](https://www.netresearch.de/) for their generous open-source contributions to the TYPO3 community, which helped shape this skill collection.
Adapted by webconsulting.at for this skill collection
