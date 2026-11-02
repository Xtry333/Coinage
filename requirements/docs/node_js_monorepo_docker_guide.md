# Node.js Monorepo Docker Integration Guide

Setting up a Node.js monorepo inside a Docker environment requires careful management of filesystem volume mounts and symlinks. Monorepo package managers (npm, Yarn, pnpm) rely heavily on symlinks to resolve local workspace dependencies, which can easily break if the container's directory structure doesn't perfectly mirror the host.

Furthermore, native OS dependencies (like `esbuild` or `bcrypt`) installed on a macOS or Windows host will crash when passed into a Linux-based Docker container. This guide details how to navigate these challenges for both local development and production.

---

## 1. Local Development Strategies

When developing locally, you must choose how strictly you want to use Docker for your Node applications.

### Option A: The Hybrid Approach (Industry Standard)
Developing natively on your host OS while using Docker exclusively for backing services is generally preferred for daily developer experience.

* **How it works:** Run the Node monorepo directly on your host OS, but spin up your databases, Redis, and message brokers via Docker Compose.
* **Pros:** File watchers run natively (bypassing heavy file-syncing latency), IDEs attach instantly, and you avoid the headache of masking `node_modules` with anonymous volumes.
* **Cons:** You risk OS-level divergence where native binaries compiled on your host machine behave differently than they will on your production Linux image.

### Option B: Full Isolation (Dockerized Development)
Running the actual Node.js runtime inside Docker Compose during development.

* **How it works:** You mount your source code into the container, allowing hot-reloading.
* **Pros:** Complete environmental consistency across the team and production. No need to install Node locally.
* **Cons:** Fragile volume mounts, sluggish hot-reloading on macOS/Windows, and higher resource usage.
* ***Note on Dev Containers:*** If strict isolation is mandatory, using IDE-integrated **Dev Containers** (VS Code/IntelliJ) is recommended over manual volume hacks, as they inject a headless server into the container to handle syncing natively.

---

## 2. Project Structure

Assume a standard workspace structure where shared dependencies are hoisted to the root `node_modules`, and local packages are symlinked by the package manager.

```text
my-monorepo/
├── package.json         # Defines workspaces: ["apps/*", "packages/*"]
├── node_modules/        # Root hoisted dependencies (DO NOT sync to container)
├── apps/
│   └── api/
│       ├── package.json # Depends on "@my-org/shared"
│       ├── node_modules/# Local unhoisted deps or bin symlinks
│       └── src/
└── packages/
    └── shared/
        ├── package.json # Name: "@my-org/shared"
        └── src/
```

---

## 3. Local Docker Compose Configuration (Option B)

If you opt for fully dockerized local development, you must mount the entire monorepo root to preserve inter-workspace symlinks, but explicitly isolate the `node_modules` directories using **anonymous volumes**. 

When Docker processes volumes, it prioritizes the most specific path. By masking the `node_modules`, the container uses its own Linux-compiled dependencies while watching your host's source code.

```yaml
# docker-compose.yml
services:
  api:
    build: 
      context: .
      dockerfile: apps/api/Dockerfile.dev
    working_dir: /usr/src/app/apps/api
    command: npm run dev
    volumes:
      # 1. Mount the entire monorepo root to preserve inter-workspace symlinks
      - .:/usr/src/app
      # 2. Mask the root node_modules with an anonymous volume
      - /usr/src/app/node_modules
      # 3. Mask the app-specific node_modules (repeat for used packages)
      - /usr/src/app/apps/api/node_modules
      - /usr/src/app/packages/shared/node_modules
    ports:
      - "3000:3000"
```

*Note: Because `node_modules` is isolated in the container, you must run `docker compose exec api npm install` to install new dependencies, rather than running it on your host.*

---

## 4. Production Build Strategy (Dockerfile)

In production, you want a lightweight image that only contains the target application and its specific dependencies. Monorepos make Docker caching difficult because a change in *any* workspace invalidates the root `package.json` cache layer.

Utilize a multi-stage build that copies only what is required before installing dependencies.

```dockerfile
# apps/api/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app

# 1. Copy only workspace configuration and lockfiles for caching
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# 2. Install dependencies (npm workspaces handles the symlinking automatically)
RUN npm ci

# 3. Copy the actual source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# 4. Build the shared packages and the app
RUN npm run build -w @my-org/shared
RUN npm run build -w @my-org/api

# --- Runner Stage ---
FROM node:22-alpine AS runner
WORKDIR /app

# 5. Copy built assets and dependencies from the builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
```

---

## 5. Dependency Managers and Symlink Caveats

### NPM and Yarn Workspaces
Both natively handle dependency hoisting well with Docker. When you require `@my-org/shared` inside `apps/api`, Node looks up the directory tree to the root `node_modules`, finds a symlink pointing back to `packages/shared`, and resolves the code. 

### PNPM Strictness
If using `pnpm`, dependencies are not hoisted flat. Instead, `pnpm` uses a global content-addressable store (virtual store) linked via hard links and symlinks. By default, Docker cannot resolve hard links or symlinks that point outside the container's isolated filesystem (e.g., to a global `~/.local/share/pnpm/store` on your host).

**The fix:** Configure pnpm to keep its store inside the project directory so Docker can see it. 
1. Create a `.npmrc` at your monorepo root:
   ```ini
   store-dir=.pnpm-store
   ```
2. Add `- /usr/src/app/.pnpm-store` as an anonymous volume in your `docker-compose.yml`.

---

## 6. Advanced Caching (Turborepo / Nx)

For large monorepos, standard Docker layer caching becomes a bottleneck. Tools like Turborepo provide a `prune` command designed specifically for Docker. 

You can add a pre-build stage in your Dockerfile (e.g., `RUN npx turbo prune --scope=@my-org/api --docker`). This generates a stripped-down, isolated version of your monorepo containing *only* the internal packages and `package.json` files that the target app relies on, maximizing Docker's layer cache hits when source code changes in unrelated packages.