# Coinage App

Coinage is a personal project for keeping track of all expenses and incomes for multiple accounts.

## Core Libraries

- NX
- Angular
- NestJS
- TypeScript

### Supported toolchain

- Node.js 26.x, Yarn 4.18.1 (pinned in `package.json`)
- Nx 24.0.5 and Angular 22.2.x
- TypeScript 6.0.3: Angular 22 requires `>=6.0 <6.1`, so TypeScript 7 is not compatible yet.
- NestJS 11.2.8: `@nx/nest` 24.0.5 requires NestJS `>=10 <12`; upgrade to NestJS 12 only after Nx declares support.
- TypeORM stays on the latest 0.3.x release to satisfy `typeorm-naming-strategies`. Tailwind CSS 4.3.x uses its PostCSS integration; ESLint 9 and Stylelint 17 match their plugins' supported ranges.

Dependencies are selected for compatibility, not by blindly installing every package's latest major. The unused Angular-17-only `ngx-popperjs` and obsolete lint/format adapters have been removed.

Validate both applications with `yarn nx run-many --target=typecheck`, and build them with `yarn nx run-many --target=build --configuration=production`. Nx's Jest, ESLint, Cypress, and API webpack targets use the Nx 24 inference plugins rather than the removed executors. Angular's existing zone-based change detection is explicitly retained.

The webapp uses `@angular/build:application` and the Vite-based `@angular/build:dev-server`. Browser output remains directly in `dist/packages/coinage-webapp` (without a `browser/` subdirectory) for the nginx image. Development requests under `/api`, `/ws`, and `/socket.io` are proxied to port 3333, including nested paths and query strings.

Tailwind is configured in `packages/coinage-webapp/src/styles.css`: `@theme` defines the primary colors, `@plugin` enables form styling, and `@source` includes shared libraries alongside automatic app-source detection. Component styles using `@apply` are plain CSS with an `@reference` to that entry point; unrelated Sass styles remain supported. Tailwind 4 requires Chrome 111+, Safari 16.4+, or Firefox 128+.

## Features

Currently Coinage supports limited features:

- Run in dockerized environment (3 containers)
- Run in development mode (no docker)
- Possibility to add contractors
- Possibility to add categories
- Possibility to add transfers from and to contractors
- Possibility to add multiple accounts (currently only through database)
- Virtual accounts (currently only through database)
- Dashboard with all accounts and their balances for active user, with short summary of all recent transfers
- Overall monthly spendings and incomes
- Receipts for expenses that are not yet paid or partially paid
- Notifications
- Internal transfers between accounts

## Planned features

Features planned for the future (far or near):

- Possibility to add multiple currencies
- Possibility to add create transactions across multiple currencies
- Summarize all expenses and incomes for each contractor
- Notify users about upcoming payments
- Adding testing to every component

## Quick Start

For the hybrid development setup (Option A), Docker runs PostgreSQL and Node/Nx/Angular run natively for fast file watching. Install Node.js 26.x and run from the project root. Node 26 does not bundle Corepack; install it once if it is not already available:

```powershell
npm install --global corepack@0.36.0
corepack enable
```

Set `COINAGE_ADMIN_USERNAME` and a unique `COINAGE_ADMIN_PASSWORD` in `.env` before the first database migration. The migration creates/promotes that system user once; changing the password in `.env` later does not reset it. Passwords are stored as salted scrypt hashes.

```powershell
if (!(Test-Path .env)) { Copy-Item .env.template .env }
corepack yarn install --immutable
docker compose -p coinage-postgres-dev -f docker-compose.dev.yml up -d
corepack yarn dev
```

Open <http://localhost:4200>. The API is available at <http://localhost:3333/api>. Frontend and API edits are watched natively; no container rebuild/recreation is needed.

If you change `package.json` or `yarn.lock`, install the updated dependencies on the host, then restart `corepack yarn dev`:

```powershell
corepack yarn install --immutable
```

PostgreSQL 18 data is stored under the project-local `.docker-data/postgres18` directory (ignored by Git); receipt files are written under the project-local `uploads/` directory. The image-based stack requires `.env` before starting.

Stop `corepack yarn dev` with Ctrl+C, then stop PostgreSQL without deleting its data:

```powershell
  docker compose -p coinage-postgres-dev -f docker-compose.dev.yml down
```

PostgreSQL data remains in `.docker-data/postgres18` after stopping. Back it up before manually removing it to reset the database. The image-based stack remains available with `corepack yarn build` followed by `corepack yarn docker:up`.

## Development server

```bash
corepack yarn dev:api # Starts the API server
corepack yarn dev:webapp # Starts the web application
```

## Creating a migration for SQL

```bash
yarn migration:create <migration_name>
```

## Database backups

With Docker and PostgreSQL running, create a compressed, portable PostgreSQL custom-format archive:

```bash
yarn db:dump
```

The command detects the running `coinage-db` container for this checkout, reads `PG_USER`, `PG_DATABASE`, and `PG_PASSWORD` from the environment or `.env` (falling back to the container configuration), and writes `backups/<database>-<timestamp>.dump`. It works on Windows and Linux without a host PostgreSQL installation or binary shell redirection. Backups are Git-ignored, existing files are never overwritten, and failed dumps are removed.

Optional output and container selection:

```bash
yarn db:dump --output backups/pi-move.dump
yarn db:dump --container coinage-app-coinage-db-1
yarn db:dump --help
```

The archive includes schema, data, sequences, and migration history, but not PostgreSQL roles or receipt uploads. Copy uploads separately (`uploads/` for native development; `.docker-data/uploads/` for the image-based stack). For a final transfer, stop the source API before dumping and copying uploads. Restore into an empty PostgreSQL 18 database before starting the destination API; the dump is portable between PC and Raspberry Pi ARM64.

### Restoring on the same or another device

Copy the dump to the destination checkout's `backups/` directory. Start PostgreSQL 18, but keep the destination API stopped (Ctrl+C for native development, or stop the `coinage-api` service for the Docker stack). The destination database and PostgreSQL user must already exist; a fresh database is recommended.

Find the destination container with `docker ps --format "{{.Names}}"`. In these examples, replace the container name, `coinage-db-admin`, and `coinage-db` with the destination's container, `PG_USER`, and `PG_DATABASE` values:

```bash
docker cp backups/pi-move.dump coinage-app-coinage-db-1:/tmp/coinage-restore.dump
docker exec coinage-app-coinage-db-1 pg_restore --username=coinage-db-admin --dbname=coinage-db --no-owner --no-privileges --single-transaction --exit-on-error /tmp/coinage-restore.dump
docker exec coinage-app-coinage-db-1 rm /tmp/coinage-restore.dump
```

The restore uses the destination user rather than requiring source PostgreSQL roles. Only remove the temporary copy after `pg_restore` succeeds. To restore over an existing database, back it up first and add `--clean --if-exists` to `pg_restore`: **this drops and replaces objects covered by the dump**. Unrelated objects can remain, so use an empty database for a clean migration.

Copy receipt uploads separately, configure the API with the destination database credentials, and restart it. Application accounts and their password hashes are included in the dump.

## Formatting the codebase

```bash
yarn format
```
