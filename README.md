# Coinage App

Coinage is a personal project for keeping track of all expenses and incomes for multiple accounts.

## Core Libraries

-   NX
-   Angular
-   NestJS
-   TypeScript

## Features

Currently Coinage supports limited features:

-   Run in dockerized environment (3 containers)
-   Run in development mode (no docker)
-   Possibility to add contractors
-   Possibility to add categories
-   Possibility to add transfers from and to contractors
-   Possibility to add multiple accounts (currently only through database)
-   Virtual accounts (currently only through database)
-   Dashboard with all accounts and their balances for active user, with short summary of all recent transfers
-   Overall monthly spendings and incomes
-   Receipts for expenses that are not yet paid or partially paid
-   Notifications
-   Internal transfers between accounts

## Planned features

Features planned for the future (far or near):

-   Possibility to add multiple currencies
-   Possibility to add create transactions across multiple currencies
-   Summarize all expenses and incomes for each contractor
-   Notify users about upcoming payments
-   Adding testing to every component

## Quick Start

For the hybrid development setup (Option A), Docker runs PostgreSQL and Node/Nx/Angular run natively for fast file watching. Install Node.js 22.18+ and run from the project root:

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

## Formatting the codebase

```bash
yarn format
```
