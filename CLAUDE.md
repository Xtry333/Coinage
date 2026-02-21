# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Coinage is a personal expense/income tracking application built as an Nx monorepo with two main packages:

- `coinage-api`: NestJS backend with TypeORM + MySQL
- `coinage-webapp`: Angular frontend with WebSocket support

## Essential Commands

Run from repository root:

### Development (Dev Mode)

Use these when working on any features and testing for any issues

- `yarn dev` - Start both API and webapp servers simultaneously (the default command when testing for issues)
- `yarn dev:api` - Start only the NestJS API server (port varies, see nx serve output)
- `yarn dev:webapp` - Start only the Angular webapp (port varies, see nx serve output)

### Building (Production Mode)

Use these when trying to build for production deployment (slow process and running with different optimizations, discouraged for testing)

- `yarn build` - Build both API and webapp for production
- `yarn build:api` - Build only the API
- `yarn build:webapp` - Build only the webapp

### Testing

- `yarn test` - Run tests for both packages
- `nx test coinage-api` - Run API tests only
- `nx test coinage-webapp` - Run webapp tests only

### Linting & Formatting

- `yarn lint` - Run workspace lint + Angular linting
- `yarn eslint` - Run ESLint on TypeScript files
- `yarn lint:styles` - Run stylelint on SCSS files
- `yarn format` - Format code using Nx formatter

### Database Migrations

- `yarn migration:create <name>` - Create new migration file
- `yarn migration:generate` - Auto-generate migration from entity changes
- `yarn migration:run` - Run pending migrations
- `yarn typeorm` - Direct TypeORM CLI access

### Docker

- `yarn docker:build-api` - Build API Docker image (docker/api.Dockerfile)
- `yarn docker:build-webapp` - Build webapp Docker image (docker/webapp.Dockerfile)
- `yarn docker:up` - Start docker-compose services
- `yarn docker:down` - Stop docker-compose services

## Architecture

### Monorepo Structure

- Uses Nx workspace with Yarn v3 workspaces
- Main applications in `packages/` directory
- Shared libraries in `libs/` directory:
    - `libs/interfaces` - DTOs and type definitions
    - `libs/common` - Shared constants and utilities
    - `libs/lang` - Language/localization support

### Backend (coinage-api)

- NestJS application with TypeORM
- Database: MySQL with custom SnakeNamingStrategy
- Configuration: `packages/coinage-api/src/app/typeorm.config.ts`
- Entities: `packages/coinage-api/src/app/entities/`
- Controllers: `packages/coinage-api/src/app/controllers/`
- Services/DAOs: `packages/coinage-api/src/app/daos/` and `packages/coinage-api/src/app/services/`
- WebSocket Gateway: `packages/coinage-api/src/app/events/events.gateway.ts` (path: `/ws/`)

### Frontend (coinage-webapp)

- Angular v20 application with standalone: false components
- WebSocket client using ngx-socket-io
- Styling: SCSS with Tailwind CSS v3 (migrated from Bootstrap)
- Charts: ng2-charts with Chart.js
- Proxy configuration: `packages/coinage-webapp/proxy.conf.json`

### Database

- TypeORM with `synchronize: false` - migrations are source of truth
- Custom naming strategy with prefixed constraints (FK*, UQ*, IDX\_)
- Migration files: `packages/coinage-api/src/database/migrations/`
- Environment variables required: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, COINAGE_MYSQL_PORT

### WebSocket Integration

- Server path: `/ws/` (configured in events.gateway.ts)
- Client configuration in app.module.ts
- Socket services in `packages/coinage-webapp/src/app/services/`

## Development Patterns

### Adding Features

1. Define DTOs in `libs/interfaces` if API changes are needed
2. Create/update entities and generate migrations for database changes
3. Implement backend controllers/services in `coinage-api`
4. Update frontend components in `coinage-webapp`
5. Update WebSocket contracts in both API gateway and frontend services if needed

### Database Schema Changes

1. Modify entities in `packages/coinage-api/src/app/entities/`
2. Generate migration: `yarn migration:generate`
3. Review and adjust generated migration if needed
4. Run migration: `yarn migration:run`

### Running Single Tests

- `nx test coinage-api --testNamePattern="specific test"` - Run specific API test
- `nx test coinage-webapp --testNamePattern="specific test"` - Run specific webapp test

## Key Configuration Files

- `package.json` - Workspace scripts and dependencies
- `nx.json` - Nx workspace configuration with custom generators
- `packages/coinage-api/src/app/typeorm.config.ts` - Database configuration
- `packages/coinage-webapp/proxy.conf.json` - Development proxy settings
- `.github/copilot-instructions.md` - Additional AI assistant guidance

## Project Planning & Roadmap

- `roadmap.md` - Detailed roadmap with planned features, UI improvements, and technical enhancements
  @roadmap.md

## Environment Setup

Required environment variables for API:

- `MYSQL_HOST` - Database host (default: localhost)
- `MYSQL_USER` - Database username
- `MYSQL_PASSWORD` - Database password
- `MYSQL_DATABASE` - Database name
- `COINAGE_MYSQL_PORT` - Database port (default: 3306)

## Dependencies & Versions

- **Node.js**: >=18.0.0 (current: v20.1.0)
- **Yarn**: >=3.3.1 (current: 3.3.1)
- **Angular**: v20.1.6
- **NestJS**: v10.4.1
- **TypeORM**: v0.3.20

## Maintenance

**IMPORTANT:** This file must be updated whenever you make changes that affect the development workflow or project structure, including:

- Adding/removing packages or applications in the monorepo
- Changing build, dev, test, or deployment scripts in `package.json`
- Modifying database configuration, migration workflows, or TypeORM setup
- Altering WebSocket/REST contracts, DTOs, or API endpoints
- Updating development environment requirements or dependencies
- Changing project structure in `packages/` or `libs/` directories
- Modifying Nx workspace configuration or generators
- Adding new essential commands or removing existing ones
- Updating environment variable requirements

Keep this documentation synchronized with the actual codebase so future Claude Code instances and contributors can be productive immediately.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
