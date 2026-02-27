# Package Scripts

## Development

| Script            | Description                                       |
| ----------------- | ------------------------------------------------- |
| `yarn dev`        | Run API and webapp in development mode (parallel) |
| `yarn dev:api`    | Start NestJS API server with hot reload           |
| `yarn dev:webapp` | Start Angular webapp with hot reload              |

## Building

| Script              | Description                            |
| ------------------- | -------------------------------------- |
| `yarn build`        | Build API, webapp, and Docker images   |
| `yarn build:api`    | Build NestJS API for production        |
| `yarn build:webapp` | Build Angular webapp for production    |
| `yarn build:docker` | Build Docker images for API and webapp |

## Docker (Local)

| Script                     | Description                             |
| -------------------------- | --------------------------------------- |
| `yarn docker:build-api`    | Build API Docker image locally (x86)    |
| `yarn docker:build-webapp` | Build webapp Docker image locally (x86) |
| `yarn docker:up`           | Start all containers via docker-compose |
| `yarn docker:down`         | Stop all containers                     |

## Docker (Push to Registry)

| Script                    | Description                                               |
| ------------------------- | --------------------------------------------------------- |
| `yarn docker:push`        | Push local images to ghcr.io (requires `npm_config_user`) |
| `yarn docker:push-api`    | Push API image to ghcr.io                                 |
| `yarn docker:push-webapp` | Push webapp image to ghcr.io                              |

## Docker (ARM64 for Raspberry Pi)

| Script                      | Description                                                         |
| --------------------------- | ------------------------------------------------------------------- |
| `yarn docker:buildx`        | Build ARM64 images locally for Raspberry Pi                         |
| `yarn docker:buildx-api`    | Build API image for ARM64                                           |
| `yarn docker:buildx-webapp` | Build webapp image for ARM64                                        |
| `yarn docker:buildx-push`   | Build and push ARM64 images to ghcr.io (requires `npm_config_user`) |

## Testing

| Script             | Description                  |
| ------------------ | ---------------------------- |
| `yarn test`        | Run all tests (API + webapp) |
| `yarn test:api`    | Run API unit tests           |
| `yarn test:webapp` | Run webapp unit tests        |

## Linting & Formatting

| Script              | Description                         |
| ------------------- | ----------------------------------- |
| `yarn lint`         | Run workspace lint and Angular lint |
| `yarn eslint`       | Run ESLint on all TypeScript files  |
| `yarn eslint:fix`   | Auto-fix ESLint issues              |
| `yarn lint:styles`  | Run stylelint on SCSS files         |
| `yarn format`       | Format code with Prettier           |
| `yarn format:write` | Write formatted code                |
| `yarn format:check` | Check formatting without writing    |

## Database Migrations

| Script                    | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `yarn migration:create`   | Create a new migration (run with `yarn typeorm migration:create`) |
| `yarn migration:run`      | Run pending migrations                                            |
| `yarn migration:generate` | Generate migration from entity changes                            |
| `yarn migration:auto`     | Auto-generate migration (alias)                                   |

## Nx Utilities

| Script                     | Description                       |
| -------------------------- | --------------------------------- |
| `yarn nx`                  | Run Nx commands directly          |
| `yarn affected`            | Run commands on affected projects |
| `yarn affected:apps`       | List affected apps                |
| `yarn affected:libs`       | List affected libraries           |
| `yarn affected:build`      | Build affected projects           |
| `yarn affected:test`       | Test affected projects            |
| `yarn affected:lint`       | Lint affected projects            |
| `yarn affected:dep-graph`  | Show dependency graph             |
| `yarn dep-graph`           | Show full dependency graph        |
| `yarn update`              | Update Nx and dependencies        |
| `yarn update:latest`       | Update to latest Nx version       |
| `yarn workspace-generator` | Run workspace generators          |
| `yarn help`                | Show Nx help                      |

## Other

| Script         | Description              |
| -------------- | ------------------------ |
| `yarn e2e`     | Run end-to-end tests     |
| `yarn typeorm` | Run TypeORM CLI directly |
