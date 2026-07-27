# ADR 0001: Default to Valkey with Redis Alternative

**Status:** Accepted

**Date:** 2025-10-22

**Decision Makers:** TYPO3 DDEV Skill Maintainers

**Tags:** #caching #infrastructure #licensing #future-proofing

---

## Decision

**Default to Valkey 8-alpine for new TYPO3 DDEV projects, with Redis 7-alpine as a documented alternative.**

Redis re-licensed from BSD-3-Clause to the non-OSI-approved RSALv2/SSPLv1 in March 2024. Valkey (Linux Foundation, backed by AWS/Google Cloud/Oracle Cloud/Ericsson/40+ others) is the BSD-3-Clause fork, wire-protocol compatible with Redis. TYPO3's Redis cache backend only uses `GET`/`SET`/`DEL`/`EXPIRE`/`FLUSHDB`/`KEYS` — identical in both — so the switch is a drop-in.

### Default Configuration

```yaml
# .ddev/docker-compose.services.yaml (new projects)
services:
  valkey:
    container_name: ddev-${DDEV_SITENAME}-valkey
    image: valkey/valkey:8-alpine
    restart: unless-stopped
    ports:
      - "6379"
    volumes:
      - valkey-data:/data
    environment:
      - VALKEY_MAXMEMORY=256mb
      - VALKEY_MAXMEMORY_POLICY=allkeys-lru
    command: valkey-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru

volumes:
  valkey-data:
    name: "${DDEV_SITENAME}-valkey-data"
```

### Alternative: Redis 7-alpine

```yaml
# Alternative for legacy production parity
services:
  redis:
    container_name: ddev-${DDEV_SITENAME}-redis
    image: redis:7-alpine
    # ... same configuration structure
```

### Auto-Detection Logic

For existing projects with `.ddev/docker-compose.services.yaml`: preserve whatever is already configured (Redis stays Redis, Valkey stays Valkey) and log which was detected. Only new projects default to Valkey.

---

## Consequences

### Positive

- **Future-proof**: matches the AWS/Google/Oracle production trajectory; AWS ElastiCache added Valkey 7.2 (Oct 2024) and 8.0 (Nov 2024) support, pricing 20% lower (node-based) / 33% lower (serverless) than Redis, with 230% higher throughput and 70% better latency (Valkey 8.0 vs 7.2).
- **True open source**: BSD-3-Clause, no commercial-use restrictions, Linux Foundation governance.
- **Smaller image**: Valkey 8-alpine is 69.7 MB vs Redis 8-alpine 100 MB (Redis 7-alpine: 60.6 MB) — faster `ddev start`.
- **Drop-in compatibility**: wire-protocol identical to Redis; TYPO3's PHP redis extension needs no changes; one-line rollback to Redis if needed.

### Negative

- **Newer codebase** (fork is from March 2024, less community content than Redis).
  Mitigation: based on the stable, battle-tested Redis 7.2.4 codebase; AWS/Google/Oracle production use validates stability; one-line rollback to Redis.
- **Naming confusion** (developers know "Redis", not "Valkey").
  Mitigation: this ADR plus inline docs explain the rationale.
- **Current production mismatch**: some TYPO3 hosting still runs Redis 7.x, so dev/prod parity is temporarily reduced for those projects.
  Mitigation: Redis 7-alpine is a documented one-line alternative; auto-detection preserves an existing project's choice either way.

### Risks and Mitigations

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Valkey compatibility issues with TYPO3 | Low | Very Low | Wire-protocol identical, PHP redis extension works transparently |
| Valkey bugs in production use | Medium | Low | AWS/Google production usage validates stability; easy rollback |
| Developer confusion/resistance | Low | Medium | Clear documentation, explain rationale, provide Redis alternative |

---

## Valkey 9.0 (October 2025) — Staying on Valkey 8

Valkey 9.0 GA released 2025-10-21 (`valkey/valkey:9-alpine`): 40% higher throughput than 8.1, hash-field TTL, atomic slot migration, plus SIMD BITCOUNT and Multipath TCP improvements. As of October 2025 none of AWS ElastiCache (latest: 8.1, July 2025), Google Cloud, or Oracle Cloud support it yet, and no TYPO3 hosting provider runs it.

**Decision: stay on Valkey 8** until a cloud provider (chiefly AWS ElastiCache) supports 9, or 3+ months of production stability reports appear, or a TYPO3 hosting provider adopts it. Upgrade is a one-line, wire-compatible image bump with no config or data migration:

```yaml
# Change from:
image: valkey/valkey:8-alpine
# To:
image: valkey/valkey:9-alpine
```

**Next review:** 2026-04-01, or sooner if a major TYPO3 host announces Redis-only support, a Valkey/TYPO3 compatibility issue surfaces, or Valkey loses a major sponsor.

---

**Approved By:** TYPO3 DDEV Skill Project
