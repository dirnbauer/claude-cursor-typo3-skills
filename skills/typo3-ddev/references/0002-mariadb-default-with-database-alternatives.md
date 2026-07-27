# ADR 0002: Tiered Database Selection for TYPO3 Extension Development

**Status:** Accepted (Revised 2025-01-22)

**Date:** 2024-12-22 (Original), 2025-01-22 (Revision 1)

**Decision Makers:** TYPO3 DDEV Skill Maintainers

**Tags:** #database #mariadb #postgresql #mysql #sqlite #tiered-selection #development-optimization

---

## Decision

**Use tiered database selection based on extension complexity for TYPO3 DDEV development environments.** This ADR addresses DDEV extension-development environments, not production hosting — development and production have different requirements, and production-parity that matters for complex extensions is overkill for extensions using only TYPO3 Core APIs.

TYPO3 13 officially supports four database systems: MariaDB >= 10.4.3 <= 11.0.0, MySQL >= 8.0.17, PostgreSQL >= 10.0, SQLite >= 3.8.3. The tiers below pick among these per extension complexity.

### Tier 1: SQLite (default for simple extensions)

For extensions with no custom database tables (`ext_tables.sql` absent/empty), no raw SQL, category `plugin`/`fe`/`be`/`misc`, file size < 1 MB:

```bash
vendor/bin/typo3 setup \
  --driver=pdo_sqlite \
  --path=/var/www/html/v13/database.sqlite \
  --admin-username=admin \
  --admin-password='Joh316!!' \
  --project-name="Extension Dev v13"
```

No `.ddev/config.yaml` database block needed. Startup is 5-10s faster and ~900 MB RAM / 744 MB disk lighter than a MariaDB container, with perfect per-version isolation (`v11`/`v12`/`v13` each get their own `.sqlite` file). SQLite is **development only** — switch to MariaDB if the extension gains custom SQL or tables, and run a final compatibility pass on MariaDB before release.

### Tier 2: MariaDB 10.11 (default for complex extensions)

For extensions with custom tables, raw SQL, performance-critical operations, or category `services`/`module`:

```yaml
# .ddev/config.yaml
database:
  type: mariadb
  version: "10.11"
```

Installer uses `--driver=mysqli --host=db --dbname=v13`. This is also the fallback when extension complexity is unknown: 95%+ of TYPO3 hosting runs MariaDB and 99%+ of extensions are tested against it, so it is the production-realistic, ecosystem-standard default.

### Tier 3: PostgreSQL 16 — explicit requirement only

For GIS/spatial (PostGIS), advanced analytics, or when the extension or its `composer.json` (`typo3/cms-pgsql`) explicitly requires it.

### Tier 4: MySQL 8.0 — corporate/Oracle ecosystem only

For corporate environments requiring Oracle-ecosystem integration or matching an existing MySQL 8 production target.

Detection (extension-metadata analysis, then user confirmation before applying) uses these same criteria: absence/presence of `ext_tables.sql`, raw-SQL patterns (`executeQuery`, `$GLOBALS['TYPO3_DB']`), file size, category, and `composer.json` requirements/name/description keywords.

---

## Consequences

### Positive

- **Production parity for complex extensions**: MariaDB matches 95%+ of TYPO3 hosting and 99%+ of extension test coverage, minimizing raw-SQL incompatibility risk.
- **Development efficiency for simple extensions**: SQLite Tier 1 is 5-10s faster per `ddev start`, saves ~900 MB RAM and 744 MB disk versus a MariaDB container, with clean per-version isolation.
- **Ecosystem alignment**: TYPO3 docs/tutorials assume MariaDB; DDEV itself defaults to MariaDB for TYPO3 projects.
- **CMS-workload performance**: MariaDB is 13-36% faster than MySQL 8 in transactional (CRUD) benchmarks, which is TYPO3's actual workload — PostgreSQL's analytical-query advantage (84% more OLTP orders in some HammerDB tests) does not apply.

### Negative

- **PostgreSQL advantages unused by default** (smaller image at 394 MB vs DDEV's 744 MB MariaDB image, better JSONB/full-text/PostGIS). Counter-argument: TYPO3 extensions rarely need these, and production runs MariaDB anyway.
- **MySQL 8 users must opt in explicitly** despite official TYPO3 support, since MariaDB benchmarks faster and has less CPU overhead.
- **Low PostgreSQL exposure** in the TYPO3 ecosystem is reinforced rather than challenged by this default — a deliberate trade-off: dev-tool defaults follow production reality rather than trying to shift it.

### Risks and Mitigations

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| PostgreSQL-specific extension not detected | Medium | Low | Explicit naming conventions documented; manual override available |
| Extension breaks on PostgreSQL in production | High | Very Low | Production hosting uses MariaDB (95%+); PostgreSQL hosting rare |
| MariaDB 10.x deprecated before TYPO3 14 | Low | Low | MariaDB 11 alternative documented; DDEV migration is a one-command `ddev debug migrate-database` for MySQL↔MariaDB (PostgreSQL requires manual export/import either direction — choose upfront) |

### Revision 1 (2025-01-22): SQLite reconsidered

The original ADR rejected SQLite for development on production-oriented grounds ("no concurrent writes", "security risk", "not representative of production"). Re-analysis after a maintainer challenge showed these concerns were over-applied to a single-developer localhost context: DDEV usage is sequential (seconds/minutes between actions, not concurrent users), SQLite's WAL mode handles concurrent reads during writes, and `127.0.0.1` isn't exposed to the security concerns that apply to a shared production database. SQLite was promoted to the Tier 1 default for simple extensions, with explicit "development only" warnings and a documented migration path to MariaDB. Lesson: don't apply production-hosting constraints to a single-developer local-dev tool without checking whether they actually hold there.

---

## Database Selection Matrix

| Use Case | Recommended Database | Rationale |
|----------|---------------------|-----------|
| Simple plugin/frontend extension (Core APIs only) | **SQLite** (Tier 1) | Fast dev, resource-efficient, perfect isolation |
| Simple backend module (no custom SQL) | **SQLite** (Tier 1) | TYPO3 core tables only |
| RTE/CKEditor plugin | **SQLite** (Tier 1) | File ops via FAL, no DB complexity |
| Complex extension (custom tables / raw SQL) | **MariaDB 10.11** (Tier 2) | Production parity, custom schema |
| Performance-critical extension | **MariaDB 10.11** (Tier 2) | Production-realistic benchmarking |
| General extension (unknown complexity) | **MariaDB 10.11** (Tier 2) | Safe default, ecosystem standard |
| GIS/mapping, analytics, full-text search | **PostgreSQL 16** (Tier 3) | PostGIS, complex queries, parallel execution |
| Corporate/Oracle ecosystem | **MySQL 8.0** (Tier 4) | Oracle integration |
| Production uses PostgreSQL/MySQL | matching Tier 3/4 | Development-production parity |

---

**Approved By:** TYPO3 DDEV Skill Project
