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

## Docker builds and Raspberry Pi deployment

### Build locally

```bash
yarn build:apps  # Production API/webapp artifacts only; no Docker required
yarn build       # Production app builds, then native-platform images loaded into Docker
yarn docker:up   # Run the local image-based stack using .env
```

Docker targets depend on the corresponding Nx production builds. A build failure stops the Docker step; valid cached app outputs are restored before packaging. `libs/common` and `libs/interfaces` are registered Nx projects, and source dependency analysis is enabled, so shared-library changes invalidate app caches and participate in affected builds. The existing `@app/common-units` entry point is a separate, non-Angular Nx project within `libs/common`, keeping Angular dependencies out of the API's deployment manifest. Build hashes also include installed dependency versions.

The API build emits a production `package.json` and pruned `yarn.lock`. Its multi-stage Dockerfile installs those dependencies on the target Linux architecture, then copies them into a slim runtime image. Host `node_modules`, frontend tooling, and the dependency-install stage are not shipped as part of the runtime. The web image serves the compiled Angular files through nginx. The Dockerfiles package prebuilt artifacts; use the Yarn/Nx targets rather than building Dockerfiles against an old `dist/` directory.

### Build a transfer bundle for your Pi (no registry or release tags)

Run one command on the PC:

```bash
yarn build:pi
```

This builds both apps in production mode, builds their `linux/arm64` Docker images, pulls the ARM64 PostgreSQL image, and exports everything into **`dist/coinage-pi/`**:

```text
coinage-pi/
  images.tar       # API, webapp, and PostgreSQL images
  compose.yaml     # Standalone Compose configuration
  start.sh         # Check transfer, import images, and start Compose
  SHA256SUMS       # Transfer integrity checks
  README.md
```

Manually transfer these five files into your Pi's deployment folder. **Keep the `.env` already present there**, along with the database and uploads. Merge the files into the folder; do not replace/delete the entire deployment directory. No `.env`, database contents, receipts, source checkout, or production secrets are included in the bundle. Only the build machine needs internet access; the Pi gets all three images from the archive.

On the Pi, run from the deployment folder:

```sh
sh start.sh
```

The script validates the transfer and existing `.env`, imports `images.tar`, and runs Compose with local images only. It recreates the containers so the latest images and runtime settings are used; it does not delete persistent storage or overwrite `.env`. Docker's fixed `latest` name is used for both apps: **there is no tag/version argument to provide**, no GHCR login, and no registry environment variable needed. The bundle does not read/copy the build machine's env files; secrets enter the containers only from the target `.env` at runtime. Other API settings in that file (including receipt AI configuration) are reused too.

Compose cannot load archives itself. If you prefer to run Compose directly, first run `docker load --input images.tar`, then `docker compose up -d --no-build --pull never --force-recreate`. The shipped `compose.yaml` is discovered automatically, reads `.env`, and never attempts to build or pull images. `start.sh` also checks `SHA256SUMS` before importing.

The target `.env` must contain `PG_PASSWORD`, `COINAGE_API_JWT_SECRET`, `COINAGE_ADMIN_USERNAME`, and `COINAGE_ADMIN_PASSWORD`; optional database/user, project-name, and web-port settings are reused. PostgreSQL remains at `docker/postgres-data/` and uploads at `.docker-data/uploads/`, matching the production Compose paths. If your existing installation uses different paths, migrate/restore its data or adjust the generated Compose file before starting. Intentional edits to bundled files require refreshing their checksums after verifying the original transfer; see the bundle's `README.md`. Edits to `.env` do not require new checksums. Back up data before updates; API startup applies migrations. Copy any uploads trapped in an older API container out before replacing it.

Prerequisites on the PC: Docker with Buildx and ARM64 build support, and Docker 28+ for platform-specific image export. The Pi needs a 64-bit OS, Docker with Compose, and `sha256sum`—no Node.js or Yarn. `yarn build:pi --dry-run` runs the app builds but only prints the Docker/export plan. The bundle command overwrites only its own generated files and refuses an output folder containing unexpected files such as `.env` or user data.

### Publish a release from your PC or CI (optional registry mode)

Use a new release/commit tag for each deployment, and authenticate to GHCR with permission to push packages:

```bash
docker login ghcr.io -u xtry333
yarn docker:publish --tag 2026.11.10-1
```

Publishing defaults to `linux/arm64` for a **64-bit Raspberry Pi OS**. It builds fresh production app artifacts, then builds and pushes both `ghcr.io/xtry333/coinage-api:2026.11.10-1` and `ghcr.io/xtry333/coinage-webapp:2026.11.10-1`. It never pushes an unrelated native-platform image from your local Docker store. Do not deploy the tag until both images have published successfully.

Set `COINAGE_REGISTRY_USER` in the shell/CI environment to use another **lowercase** GitHub username or organization. `COINAGE_IMAGE_TAG` is an alternative to `--tag`; CLI arguments take precedence. Publishing requires a tag and rejects `latest`/`dev`. Build commands do not load production secrets or `.env.production`.

```bash
yarn docker:publish --tag 2026.11.10-1 --platform "linux/arm64,linux/amd64"
yarn docker:publish --tag 2026.11.10-1 --dry-run
yarn docker:buildx --tag arm64-test
```

Multi-platform publishing is optional and requires a Buildx builder that supports the requested platforms. Cross-building ARM64 on an AMD64 machine requires emulation or a native ARM64 builder. `--dry-run` still runs the Nx app builds, but only prints Docker commands: it does not build or push images. `docker:buildx` builds/loads ARM64 images locally without publishing. Local builds also tag `coinage-api:latest` and `coinage-webapp:latest` for `docker-compose.yml`; their registry-qualified tag defaults to `dev`.

The existing `docker:push`, `docker:buildx-push`, and individual image build/push scripts remain aliases for the same guarded Nx workflow. Push aliases now **build and publish**, rather than pushing an arbitrary existing image. Regression tests run with `yarn nx test coinage-tools`. `yarn test:docker` additionally validates production Compose configuration, secret requirements, and storage paths using the Docker CLI (no daemon or containers required).

### Deploy from the registry without a checkout (optional registry mode)

The Pi only needs Docker with the Compose plugin, `docker-compose.prod.yml`, a private env file, and persistent data directories. No Node.js, Yarn, Nx, source code, or Dockerfiles are required there.

1. Copy `docker-compose.prod.yml` and `.env.production.example` into a deployment directory.
2. Copy the example to `.env.production` and fill in the release tag, a strong database password, a random JWT secret, and a unique initial admin password. For example, generate the JWT secret with `openssl rand -hex 32`. Restrict the env file to its owner (`chmod 600 .env.production`). This file is Git-ignored; never put real secrets in the example.
3. If the GHCR packages are private, run `docker login ghcr.io` on the Pi with permission to read them.
4. Validate, pull, and start the stack from that directory:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet
docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --no-build
```

Compose does **not** automatically load `.env.production`; always pass `--env-file`. The equivalent checkout-only shortcuts are `yarn docker:prod:pull`, `yarn docker:prod:up`, and `yarn docker:prod:down`. Missing/empty release tags or required secrets stop Compose before deployment.

Only nginx's web port is published (4200 by default). PostgreSQL and the API stay on the internal Compose network; API and WebSocket requests go through nginx. Use `docker compose --env-file .env.production -f docker-compose.prod.yml exec coinage-db psql -U postgres -d coinage-db` for database maintenance, adjusting the database/user to your configuration. Add HTTPS at a reverse proxy before exposing the app publicly.

Production PostgreSQL storage remains at `docker/postgres-data/`; receipt uploads persist at `.docker-data/uploads/`. Keep the deployment directory and `COMPOSE_PROJECT_NAME` stable between updates, and back up **both** the database and uploads. The production database path is intentionally unchanged; switching Compose files does not automatically migrate a local database from `.docker-data/postgres18/`. Restore a dump when moving data between installations. If an older production API contains uploads only inside its container, copy `/app/api/uploads` out **before** replacing that container and place the files in `.docker-data/uploads/`.

To update, back up data, publish a new tag, change `COINAGE_IMAGE_TAG` in the Pi's env file, and repeat pull/up. Do not delete persistent directories or run `down -v` as an update step. The API runs database migrations on startup; selecting an older image tag does not undo migrations, so database rollback may require a compatible backup. Changing `PG_PASSWORD` does not change an existing PostgreSQL role's password, and changing bootstrap admin settings does not reset an already-created application account.

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
