# Coinage Raspberry Pi bundle

Requires a 64-bit Raspberry Pi OS, Docker, the Compose plugin, and `sha256sum`.
No Node.js, Yarn, source checkout, registry login, or internet access is needed on the Pi.

## Install or update

1. Copy **all five bundle files** into your existing deployment folder. Merge/overwrite the generated files only: do not replace the folder or delete its `.env` or data directories.
2. Keep your existing `.env` in that same folder. No env file or secrets are included in the bundle. The required settings are `COINAGE_POSTGRES_PASSWORD`, `COINAGE_API_JWT_SECRET`, `COINAGE_ADMIN_USERNAME`, and `COINAGE_ADMIN_PASSWORD`. Optional `COINAGE_POSTGRES_DB`, `COINAGE_POSTGRES_USER`, and `COMPOSE_PROJECT_NAME` are reused too. Ports follow `COINAGE_WEBAPP_PORT` (default 4200), `COINAGE_API_PORT` (default 3333), and `COINAGE_POSTGRES_PORT` (default 5432); see below. Other API settings, including receipt AI configuration, are read from `.env` at runtime.
3. Back up the database and receipt uploads before updating. **If upgrading an older layout, follow the one-time storage migration below before starting.** Run:

```sh
sh start.sh
```

This validates the transfer and `.env`, loads the API, webapp, and PostgreSQL ARM64 images, then runs Compose. Containers are recreated, but the persistent data directories are retained. The two app images always use `latest`; there are no release tags to select or change.

If Docker requires elevated permissions, run `sudo sh start.sh`. The script does not overwrite `.env`, source it as shell code, print its contents, or pass secrets as command-line arguments. Protect it with `chmod 600 .env`.

### Manual Compose alternative

Compose cannot import image archives. After each transfer, load the images first:

```sh
sha256sum -c SHA256SUMS
docker load --input images.tar
docker compose up -d --no-build --pull never --force-recreate
```

`compose.yaml` is discovered automatically and reads the folder's `.env`. All services have `pull_policy: never`, so missing images cause an error rather than a registry pull. The web port and PostgreSQL are published; the API remains internal. PostgreSQL publishes on all host interfaces by default, using `COINAGE_POSTGRES_PORT` from `.env` (default 5432). Connect using the Pi's LAN IP and that port; the API still connects internally on port 5432. Restrict database access with Docker-aware firewall rules and do not forward the database port on your router. Use `docker compose logs -f` to inspect startup.

### Ports

`COINAGE_WEBAPP_PORT` sets the published web port; nginx still listens on port 80 inside its container. `COINAGE_API_PORT` sets the internal API listener and nginx's upstream port together; it does not expose the API on the host. nginx renders its upstream configuration at startup. `COINAGE_POSTGRES_PORT` changes only the published database port, not PostgreSQL's internal port 5432.

Missing or empty port settings retain the defaults above. Shell environment overrides take precedence over `.env`. After changing ports, rerun `sh start.sh`; port-only edits do not need new checksums or rebuilt images once this version of the bundle is installed.

## Data safety

- All persistent Docker data lives in `./data/`, relative to this deployment folder: PostgreSQL in `data/pg/` and receipts in `data/uploads/`. Keep that folder and `COMPOSE_PROJECT_NAME` stable between updates. Back up both subdirectories, not just the bundle files.
- `start.sh` refuses known legacy paths (`docker/postgres-data/`, `.docker-data/postgres18/`, `.docker-data/uploads/`, or `uploads/`), even if `data/` also exists. It never moves or merges data automatically. Direct Compose commands bypass this safety check.
- A bundle contains **no database contents or uploaded receipts**. Do not treat a freshly created database directory as a successful migration.
- Copy any uploads trapped in an older API container out before replacing it.
- Never delete data directories or run `docker compose down -v` as an update step.
- API startup applies database migrations. Replacing images does not undo migrations.
- Changing `.env` does not automatically reset an existing PostgreSQL role password or an already-created application's admin password.

### One-time storage migration

Before the first start with this layout:

1. Record the old containers' mount sources with `docker inspect`. Stop receipt writes (stop the API), back up the running database with `pg_dump`, and copy receipt uploads to a safe location **outside the deployment folder**. If uploads exist only inside an old API container, copy `/app/api/uploads` out before removing it.
2. Stop the **old** stack using its existing Compose file, project name, and env file. For an older bundle, run `docker compose down` from its deployment folder. Do not use `-v`. Never move a running PostgreSQL data directory.
3. On the **same device**, move the existing PostgreSQL 18 directory and uploads to the new locations. For the former Pi layout, with both old directories present and neither destination present:

    ```sh
    mkdir -p data
    test ! -e data/pg && sudo mv docker/postgres-data data/pg
    test ! -e data/uploads && sudo mv .docker-data/uploads data/uploads
    ```

    Check that **both moves succeeded** before continuing. Move the entire PostgreSQL mount directory, preserving ownership/permissions and its `18/` subdirectory; do not move just the nested `pgdata` directory. The old local/dev PostgreSQL source was `.docker-data/postgres18/` instead. Choose the actual source from the mounts recorded above; never merge database directories. If either destination already exists, stop and determine which copy is authoritative; archive the other outside the deployment folder. For another device or PostgreSQL major version, restore a logical dump instead of copying raw database files.

4. Ensure the active directories are `data/pg/` and `data/uploads/` (receipt files normally live in `data/uploads/receipts/`). Archive any remaining legacy paths outside the deployment folder, including empty directories, after checking their contents. Keep backups until the database and existing receipt images have been verified.
5. Copy the new bundle files if not already done, keep `.env`, and run `sh start.sh`.

The API still sees `/app/api/uploads` inside its container, and PostgreSQL still sees `/var/lib/postgresql`. Only host paths change; existing database receipt paths do not need rewriting.

If you intentionally customize `compose.yaml` (for example, to keep different existing data paths), verify the original transfer with `sha256sum -c SHA256SUMS` **before** editing it. After making trusted local edits, refresh the checksum list before running `start.sh`:

```sh
sha256sum images.tar compose.yaml start.sh README.md > SHA256SUMS
```

The `.env` file is not checksummed, so changing runtime secrets does not require this step. A legacy-path customization also requires reviewing the safety check in `start.sh`; prefer migrating to `data/`. Reapply any customizations after copying a new bundle, which replaces the generated files and checksum list.

For the next update, build a new bundle on the PC, copy its five files into this same folder, and run `sh start.sh` again. No `.env` edits are required unless your runtime configuration changes.
