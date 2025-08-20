
## Purpose

This file gives focused, discoverable guidance for an AI coding agent working on the Coinage monorepo so it can be productive immediately.

## Quick architecture summary

- Monorepo (Nx) with two top-level apps under `packages/`: `coinage-api` (NestJS backend) and `coinage-webapp` (Angular frontend). Shared code lives in `libs/*` (e.g. `libs/common`, `libs/interfaces`, `libs/lang`). See `nx.json` and `package.json` scripts for workspace commands.
- The API is NestJS + TypeORM (MySQL). DB config and entities: `packages/coinage-api/src/app/typeorm.config.ts` and `packages/coinage-api/src/app/entities`.
- The frontend is Angular served via `nx serve coinage-webapp` and talks to the API over REST + WebSockets. WebSocket server path: `/ws/` (see `packages/coinage-api/src/app/events/events.gateway.ts`) and socket namespace constants in `libs/common/src/constants/coinage-socket-namespace.enum.ts`.

## Essential commands (run from repo root)

- Install: `yarn` (repo uses Yarn v3 workspaces)
- Dev: `yarn dev` (runs both servers via nx) or `yarn dev:api` / `yarn dev:webapp`
- Build: `yarn build` (builds both apps) or use `nx build <project>`
- Docker: `yarn docker:build-api`, `yarn docker:build-webapp`, `yarn docker:up` / `yarn docker:down`
- Tests: `yarn test` or `nx test coinage-api` / `nx test coinage-webapp`
- Lint: `yarn eslint` and `yarn lint:styles` (stylelint for scss)
- TypeORM migrations (API project): `yarn migration:create <name>`, `yarn migration:generate`, `yarn migration:run`. The CLI is wired in `package.json` and loads `dotenv` + ts-node; migration files live under `packages/coinage-api/src/database/migrations`.

## Project-specific patterns & gotchas

- Nx-first: prefer `nx` commands for per-project operations (serve/build/test/dep-graph). Global scripts in `package.json` are convenience wrappers.
- Yarn Berry (v3) is used; don't assume global `node_modules` layout. Use `yarn` and `yarn <script>`.
- Environment: API expects env vars (e.g. MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, COINAGE_MYSQL_PORT). DB options are in `packages/coinage-api/src/app/typeorm.config.ts`.
- TypeORM: synchronize=false and migrations are the source of truth. `synchronize` is intentionally off.
- Naming strategy: a custom SnakeNamingStrategy is applied in `typeorm.config.ts`. When referencing DB constraints/indexes expect prefixed names like `FK_...`, `UQ_...`, `IDX_...`.

## Integration points

- WebSockets: server path is `/ws/` (see `events.gateway.ts`). The webapp uses `ngx-socket-io`/`socket.io-client`. If you modify socket messages, update both `events.gateway.ts` and the client services in `packages/coinage-webapp/src/app/services/` (e.g. `coinage-socket.service.ts`).
- REST controllers live under `packages/coinage-api/src/app/*` and use DTOs from `libs/interfaces`.
- Database migrations and entities are the canonical DB shape. Don't change entities without updating or generating migrations.

## Files to read first (high ROI)

- `package.json` — workspace scripts and install expectations
- `nx.json` — Nx conventions and generator defaults
- `packages/coinage-api/src/app/typeorm.config.ts` — DB options & naming strategy
- `packages/coinage-api/src/app/events/events.gateway.ts` — WebSocket contract and path
- `libs/*` — shared DTOs and constants (e.g. `libs/interfaces/src/lib` and `libs/common/src/constants`)
- `packages/coinage-api/src/database/migrations/_index` — existing migrations index

## What success looks like for an AI change

- Uses `nx` or `yarn` scripts (preserve existing scripts). Adds or edits code with matching project structure under `packages/` / `libs/`.
- If DB schema changes are required, add a migration under `packages/coinage-api/src/database/migrations` and wire it via the workspace migration scripts.
- Update both API and web client when changing socket or REST contracts (search for DTO names in `libs/interfaces`).

## When stuck or unsure

- Check `README.md` and the files listed above for concrete examples.
- Run `nx dep-graph` to understand project boundaries before large refactors.
- If you need missing credentials or external services (MySQL), note them in PR description and mock or stub in tests.

## Feedback / Next steps

If this file looks incomplete, tell me which area you want expanded (setup, migrations, sockets, or nx generator usage) and I'll iterate.

## Maintenance

Note: This file must be updated whenever you make major changes to the items described above — for example, adding/removing top-level apps, changing build or dev scripts in `package.json`, altering database configuration or migration workflows, or changing WebSocket/REST contracts and DTOs. Keep this document in sync with architecture and workflow changes so future AI agents and contributors can be productive.
