# C-1 - PostgreSQL Migration (dockerized)

## Title
Migrate the database layer from MySQL to PostgreSQL, running PostgreSQL in Docker (dev + prod), and update the API (TypeORM) to target Postgres.

## Description
Coinage currently runs on MySQL (Community Server). The goal of this ticket is to switch the database system to PostgreSQL, containerized with Docker, for both local development and production. The API is built on NestJS + TypeORM, which already has the `pg` client installed as a dependency, so the ORM-side switch is straightforward; the bulk of the work lies in the raw-SQL migrations, entity column types that are MySQL-specific, Docker Compose configuration, and environment variables.

## Motivation
- Align the stack with a single open-source relational database that is fully supported by TypeORM/NestJS (`pg` is already a direct dependency).
- Simplify local dev setup (one `docker-compose` for DB + API + webapp).
- Avoid MySQL-specific SQL dialect in migrations and entity definitions.

## Current State (MySQL)

| Area | Detail |
|------|--------|
| ORM / Driver | TypeORM `0.3.20`, `@nestjs/typeorm` `10.0.2`, `mysql2` `3.11.0` |
| TypeORM config | `packages/coinage-api/src/app/typeorm.config.ts` — `type: 'mysql'`, host `MYSQL_HOST`, port `COINAGE_MYSQL_PORT` (default 3306) |
| Docker | `docker-compose.yml` / `docker-compose.prod.yml` — service `coinage-db` uses `image: mysql`, port 3306, healthcheck via `mysqladmin ping` |
| Env vars | `.env.template`, `.env.production` — `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `COINAGE_MYSQL_PORT` |
| Schema dump | `coinage.sql` — MySQL 8.0.23 syntax (`ENGINE=InnoDB`, `COLLATE utf8mb4_0900_ai_ci`, `AUTO_INCREMENT`, backticks) |
| Migrations | Raw MySQL SQL in `packages/coinage-api/src/database/migrations/` (e.g. `1000000000000-CreateTables.ts`) using `AUTO_INCREMENT`, `ENGINE=InnoDB`, `COLLATE`, `BIT(1)`, `ENUM(...)`, `json_object()`, `ON UPDATE CURRENT_TIMESTAMP`, backtick identifiers |
| Entities | MySQL-specific column types: `type: 'bit'` (Account, Contractor, Transfer, User), `type: 'enum'` (Category, Receipt, Schedule, Transfer), `type: 'json'` with `default: 'json_object()'` (Transfer.metadata), `Bit` constant (`b'0'` / `b'1'`) |
| TypeORM CLI | `package.json` scripts `typeorm`, `migration:create`, `migration:run`, `migration:generate`, `migration:auto` point at `typeorm.config.ts` |

## Target State (PostgreSQL, dockerized)

| Area | Detail |
|------|--------|
| ORM / Driver | TypeORM `type: 'postgres'`, `pg` client (already installed) |
| TypeORM config | `type: 'postgres'`, host `PG_HOST` (or keep `MYSQL_HOST` alias), port `COINAGE_PG_PORT` (default 5432), user/pass/database env vars |
| Docker | `coinage-db` service uses `image: postgres` (aligned version, e.g. `postgres:15-alpine`), port 5432, healthcheck via `pg_isready`, `POSTGRES_PASSWORD` / `POSTGRES_USER` / `POSTGRES_DB` |
| Env vars | `PG_DATABASE`, `PG_USER`, `PG_PASSWORD`, `PG_ROOT_PASSWORD` (or `POSTGRES_*`), `COINAGE_PG_PORT=5432` |
| Migrations | Rewritten to PostgreSQL syntax (`SERIAL` / `GENERATED ALWAYS AS IDENTITY`, no `ENGINE=InnoDB`, no `COLLATE`, `BOOLEAN` instead of `BIT(1)`, PostgreSQL enum or text+check, `'{}'::jsonb`, timestamp triggers instead of `ON UPDATE CURRENT_TIMESTAMP`, double-quoted identifiers) |
| Entities | `type: 'bit'` → `type: 'boolean'`; `type: 'json'` default `'{}'` instead of `json_object()`; `BooleanTransformer` no longer needs Buffer handling; `Bit` constant removed or repurposed |
| Schema dump | `coinage.sql` regenerated as PostgreSQL dump or retired |

## Scope of Changes

### 1. `packages/coinage-api/src/app/typeorm.config.ts`
- Change `type: 'mysql'` → `'postgres'`
- Rename/alias env vars (`MYSQL_HOST` → `PG_HOST`, `COINAGE_MYSQL_PORT` → `COINAGE_PG_PORT`, `MYSQL_USER`/`PASSWORD`/`DATABASE` → `PG_*` or `POSTGRES_*`)
- Default port 3306 → 5432
- Review `timezone: 'Z'` (keep, valid for Postgres)

### 2. `docker-compose.yml` and `docker-compose.prod.yml`
- `coinage-db` image `mysql` → `postgres:<version>`
- Env: `MYSQL_ROOT_PASSWORD` → `POSTGRES_PASSWORD`, `MYSQL_DATABASE` → `POSTGRES_DB`, `MYSQL_USER` → `POSTGRES_USER`, `MYSQL_PASSWORD` → `POSTGRES_PASSWORD`
- Port `3306` → `5432` (and `COINAGE_MYSQL_PORT` → `COINAGE_PG_PORT`)
- Healthcheck: `mysqladmin ping ...` → `pg_isready -U $POSTGRES_USER -d $POSTGRES_DB` (or `pg_isready`)
- API env: `MYSQL_HOST` → `PG_HOST`, `COINAGE_MYSQL_PORT` → `COINAGE_PG_PORT`
- Add named volume for Postgres data (`postgres-db` or keep `coinage-db`)

### 3. Environment files
- `.env.template`: replace `MYSQL_*` / `COINAGE_MYSQL_PORT` with `PG_*` / `COINAGE_PG_PORT`
- `.env.production`: same replacement

### 4. Entities (`packages/coinage-api/src/app/entities/`)
- `Account.entity.ts`: `type: 'bit'` → `type: 'boolean'` (2 columns)
- `Contractor.entity.ts`: `type: 'bit'` → `type: 'boolean'`
- `Transfer.entity.ts`: `type: 'bit'` → `type: 'boolean'` (2 columns); `type: 'json'` default `'json_object()'` → `'{}'`; enum stays but Postgres handles differently
- `User.entity.ts`: `type: 'bit'` → `type: 'boolean'`
- `Category.entity.ts`, `Receipt.entity.ts`, `Schedule.entity.ts`: enum columns — verify TypeORM Postgres enum mapping (may need `type: 'enum'` with enum values, or switch to text + check constraint)
- Remove/replace `Bit` constant (`booleanBuffer.const.ts`) and `BooleanTransformer` Buffer branch if no longer needed

### 5. Migrations (`packages/coinage-api/src/database/migrations/`)
Rewrite raw SQL to PostgreSQL syntax, per migration:
- `1000000000000-CreateTables.ts` — full schema rewrite (biggest one)
- `1654876993290-ReforgeForeignKeys.ts`
- `1657578654226-FuelMigration.ts`
- `1678465646320-CurrencyTable.ts`
- `1678482345509-CurrencyInTransfer.ts`
- `1678491536904-NonNullTargetTransfer.ts`
- `1708475125634-AddSchedule.ts` (uses `timestamp(6)`, `enum(...)`, `json`, `ON UPDATE CURRENT_TIMESTAMP(6)`)
- `1708476166410-AddScheduleCounts.ts`
- `1708644980026-AddPasswords.ts`
- `1741305600000-AddReceiptImageProcessing.ts`
- `1745336625326-AddContainerTable.ts` (`ENGINE=InnoDB`)
- `1745754622461-AddItemsWithContainersView.ts`
- `1751894045445-AddItemCount.ts`
- `1754863716132-migration.ts`
- `1755864881273-UpdateContainersView.ts`
- `1756400000000-AddTagTable.ts` (`ENGINE=InnoDB`)
- `1756500000000-AddReceiptExtractedStatus.ts`
- `1756600000000-AddRawAiResponseColumn.ts`
- `1773784743746-VerifyMigrations.ts`

Typical MySQL → Postgres conversions:
| MySQL | PostgreSQL |
|-------|------------|
| `INT NOT NULL AUTO_INCREMENT` | `SERIAL PRIMARY KEY` or `INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| `ENGINE=InnoDB` | (omit) |
| `COLLATE 'utf8mb4_0900_ai_ci'` | (omit; DB-level encoding handles it) |
| Backtick `` `ident` `` | Double quote `"ident"` or omit |
| `BIT(1)` | `BOOLEAN` |
| `b'0'` / `b'1'` | `false` / `true` |
| `ENUM('a','b')` | PostgreSQL ENUM type (`CREATE TYPE ... AS ENUM`) or `TEXT` + `CHECK` constraint |
| `json_object()` | `'{}'::jsonb` |
| `ON UPDATE CURRENT_TIMESTAMP` | Trigger function + trigger (Postgres has no auto `ON UPDATE`) |
| `now()` | `now()` / `CURRENT_TIMESTAMP` (supported) |

### 6. `package.json`
- `mysql2` can remain (unused) or be removed; `pg` stays
- TypeORM CLI scripts remain valid (point at same `typeorm.config.ts`)

### 7. `coinage.sql`
- Regenerate as a PostgreSQL schema dump, or archive the MySQL dump for reference and remove

### 8. Tests (`packages/coinage-api`)
- Any test that spins up a DB or asserts MySQL-specific SQL must be updated to Postgres
- Check `jest.config.ts` / `jest.preset.js` for DB-dependent test setup

### 9. CI/CD / deployment
- `heroku.yml` references docker files — no DB change needed there (Heroku Postgres add-on could be considered separately)
- GitHub Actions (`.github/`) — check for MySQL service containers; replace with Postgres

## Risks & Considerations

1. **Data migration**: Existing MySQL data cannot be dropped in place. A dump/restore path (or ETL) is needed for production data. This ticket focuses on the codebase + docker config; a separate data-migration ticket should handle production cutover.
2. **`ON UPDATE CURRENT_TIMESTAMP`**: Postgres does not support this natively. Edited-date columns need trigger functions (or handle `updatedAt` in the NestJS service layer).
3. **Enum handling**: TypeORM's Postgres enum support differs from MySQL's. Decide between native Postgres ENUM types vs. text + check constraint; native enums are harder to alter later.
4. **`timestamp(6)` precision**: Postgres supports `timestamp(6)` but migration SQL must be valid.
5. **`Bit` / `BooleanTransformer`**: The transformer reads from `Buffer` (MySQL `BIT(1)` returns a Buffer). With Postgres `BOOLEAN`, this branch is dead code and can be simplified.
6. **Port collision**: If MySQL and Postgres both run locally during transition, use different ports (3306 vs 5432).
7. **`migrationsTransactionMode: 'each'`** — supported by Postgres driver; keep.

## Decision Analysis — Why PostgreSQL, and why not

### Baseline migration strategy (one big migration)

Given there are 18 existing MySQL-specific migrations (going back to 2022) that use `ENGINE=InnoDB`, `COLLATE`, `BIT(1)`, `json_object()`, `ON UPDATE CURRENT_TIMESTAMP`, backticks, and MySQL `AUTO_INCREMENT`, porting them one-by-one to PostgreSQL is error-prone and offers little value. The recommended approach is a **single baseline migration**:

- Write one baseline migration (e.g. `20261015000000-BaselinePostgres.ts`) that creates the entire final schema in native PostgreSQL syntax (`SERIAL`/`IDENTITY`, `BOOLEAN`, `'{}'::jsonb`, triggers for `edited_date`, double-quoted or unquoted identifiers).
- Mark the 18 legacy MySQL migrations as already applied (baseline entry in the `migrations` table), or skip them entirely on fresh databases.
- Continue with incremental Postgres migrations on top of the baseline going forward.

**Can it be reverted? Practically, no — not without data loss.**
- A baseline migration's `down()` would `DROP TABLE`/`DROP SCHEMA` everything, destroying all data.
- Once you cut over to Postgres and start writing data, "reverting" to MySQL means building a new MySQL baseline and migrating data back — it is not a clean `git revert`.
- Treat the baseline as a **one-way door** for that database instance. Keep the existing MySQL dump (`coinage.sql`) as your rollback artifact for production cutover, not as a live revert path.
- Validate the baseline on a **fresh** Postgres database first; production data cutover is a separate follow-up ticket.

### Why PostgreSQL (pros)

| Factor | Detail |
|--------|--------|
| TypeORM / NestJS support | `type: 'postgres'` is fully supported; `pg` (8.13.0) is already a direct dependency, so no new driver install needed. |
| JSONB | Coinage uses a `metadata` JSON column on `Transfer`. Postgres JSONB is binary, indexable (`GIN`), and queryable (`@>`, `?`, `#>>`) — far superior to MySQL JSON. |
| Concurrency | MVCC: readers don't block writers and vice versa. Important for a finance/ledger app with concurrent transfers. |
| SQL standards | Native arrays, UUIDs, ranges, CTEs, window functions; better standards compliance than MySQL. |
| Licensing | Community-driven (PostgreSQL License); MySQL is Oracle-owned. |
| Docker | Official `postgres:15-alpine` image, `pg_isready` healthcheck, mature tooling (`pg_dump`, `psql`). |

### Why not PostgreSQL (cons / trade-offs)

| Factor | Detail |
|--------|--------|
| Migration effort | 18 raw-SQL migrations + entity column changes (`bit`→`boolean`, enum audit, JSON defaults, timestamps) must be rewritten. One-time cost. |
| `ON UPDATE CURRENT_TIMESTAMP` | Postgres has no declarative equivalent. Needs a trigger function + trigger for auto-updating `edited_date` columns (or handle `updatedAt` in the NestJS service layer). |
| Connection model | One process per connection → more RAM under many short-lived connections. Mitigated by TypeORM/`pg` connection pooling or PgBouncer; fine for a single Dockerized API instance. |
| Enum handling | TypeORM Postgres enums are stricter than MySQL's. Prefer `TEXT` + `CHECK` constraint over native Postgres `ENUM` types (native enums are harder to alter later). |
| Team familiarity | If the team knows MySQL deeply, there's a modest learning curve. |

### Other candidates considered

| Candidate | Fit for Coinage | Verdict |
|-----------|-----------------|---------|
| **MariaDB** | MySQL fork, near drop-in. Minimal migration from existing MySQL. | **Not recommended** — doesn't move away from the MySQL/Oracle ecosystem; solves hosting, not architecture. |
| **SQLite** | File-based, zero-config, great for local dev/tests. | **Not production-fit** — no client/server, weak concurrency, single-writer, unsuitable for multiple API instances. |
| **MongoDB** (document/NoSQL) | Flexible schema, JSON-native. | **Poor fit** — Coinage is relational (foreign keys, ACID transactions, ledger integrity). Would require rewriting entities/repositories and loses relational guarantees. |
| **CockroachDB** | Postgres wire protocol, distributed, horizontally scalable. | **Overkill** — single-node Docker setup doesn't need distributed SQL; more operational complexity. |
| **PlanetScale (MySQL/Vitess)** | Serverless MySQL. | **Poor fit** — proprietary, no foreign keys, vendor lock-in, doesn't match self-hosted Docker goal. |
| **PostgreSQL** | Relational, ACID, JSONB, TypeORM-ready, Docker-native. | **Best fit** — aligns with the existing NestJS/TypeORM stack and the relational nature of a finance/ledger app. |

### Bottom line

**PostgreSQL is the right candidate.** It's relational (matches the ledger/finance data model), has first-class TypeORM support, the `pg` driver is already installed, and runs cleanly in Docker. The main cost is the one-time migration of 18 MySQL migrations plus entity changes.

## Migration Path (suggested order)

1. Add `pg`-based TypeORM config branch in `typeorm.config.ts` (keep `mysql` behind a flag/env for rollback).
2. Update `docker-compose.yml` + `docker-compose.prod.yml` to use `postgres` image and `POSTGRES_*` env vars.
3. Update `.env.template` and `.env.production`.
4. Rewrite entities (`bit` → `boolean`, `json` default, enum audit).
5. Rewrite all raw-SQL migrations to Postgres syntax.
6. Remove/archive `coinage.sql` MySQL dump or regenerate.
7. Update `package.json` scripts if needed (drop `mysql2` if desired).
8. Spin up `docker compose up` locally and run `migration:run` against fresh Postgres.
9. Run API + webapp tests; fix failures.
10. (Follow-up ticket) Production data dump/restore cutover and MySQL decommission.

## Acceptance Criteria
- [ ] `docker compose up` starts a healthy `coinage-db` Postgres container (port 5432) and the API connects to it.
- [ ] TypeORM connects with `type: 'postgres'` and `migrationsRun: true` applies migrations against Postgres without errors.
- [ ] All entity definitions work with Postgres column types (`boolean`, `jsonb`/`json`, enum/text).
- [ ] Baseline migration applies cleanly against a **fresh** (empty) Postgres database via `yarn migration:run`.
- [ ] API test suite (`nx test coinage-api`) passes against Postgres.
- [ ] Decision log recorded: baseline migration is treated as irreversible (destructive `down()`); MySQL dump (`coinage.sql`) retained as rollback artifact.
- [ ] `.env.template` / `.env.production` use Postgres variable names (no `MYSQL_*`).
- [ ] `docker-compose.prod.yml` deploys Postgres instead of MySQL.
- [ ] `coinage.sql` no longer contains MySQL-only syntax (or is archived/regenerated).

## Related
- None yet — this is the foundational database ticket. Future data-migration ticket will handle MySQL → Postgres production cutover.
