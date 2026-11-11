# Coinage Raspberry Pi bundle

Requires a 64-bit Raspberry Pi OS, Docker, the Compose plugin, and `sha256sum`.
No Node.js, Yarn, source checkout, registry login, or internet access is needed on the Pi.

## Install or update

1. Copy **all five bundle files** into your existing deployment folder. Merge/overwrite the generated files only: do not replace the folder or delete its `.env` or data directories.
2. Keep your existing `.env` in that same folder. No env file or secrets are included in the bundle. The required settings are `PG_PASSWORD`, `COINAGE_API_JWT_SECRET`, `COINAGE_ADMIN_USERNAME`, and `COINAGE_ADMIN_PASSWORD`. Optional `PG_DATABASE`, `PG_USER`, `COINAGE_WEBAPP_PORT` (default 4200), and `COMPOSE_PROJECT_NAME` are reused too. Other API settings, including receipt AI configuration, are read from `.env` at runtime.
3. Back up the database and receipt uploads before updating. Run:

```sh
sh start.sh
```

This validates the transfer and `.env`, loads the API, webapp, and PostgreSQL ARM64 images, then runs Compose. Containers are recreated, but the persistent data directories are retained. The two app images always use `latest`; there are no release tags to select or change. Existing `COINAGE_IMAGE_TAG`/registry settings in `.env` are not used to select images.

If Docker requires elevated permissions, run `sudo sh start.sh`. The script does not overwrite `.env`, source it as shell code, print its contents, or pass secrets as command-line arguments. Protect it with `chmod 600 .env`.

### Manual Compose alternative

Compose cannot import image archives. After each transfer, load the images first:

```sh
sha256sum -c SHA256SUMS
docker load --input images.tar
docker compose up -d --no-build --pull never --force-recreate
```

`compose.yaml` is discovered automatically and reads the folder's `.env`. All services have `pull_policy: never`, so missing images cause an error rather than a registry pull. Only the web port is published; the API and PostgreSQL are internal. Use `docker compose logs -f` to inspect startup.

## Data safety

- PostgreSQL remains under `docker/postgres-data/` and receipts under `.docker-data/uploads/`. Keep those paths and `COMPOSE_PROJECT_NAME` stable between updates.
- If your existing installation uses different storage paths, migrate/restore the data or adjust `compose.yaml` before starting. A bundle contains **no database contents or uploaded receipts**. Do not treat a freshly created database directory as a successful migration.
- Copy any uploads trapped in an older API container out before replacing it.
- Never delete data directories or run `docker compose down -v` as an update step.
- API startup applies database migrations. Replacing images does not undo migrations.
- Changing `.env` does not automatically reset an existing PostgreSQL role password or an already-created application's admin password.

If you intentionally customize `compose.yaml` (for example, to keep different existing data paths), verify the original transfer with `sha256sum -c SHA256SUMS` **before** editing it. After making trusted local edits, refresh the checksum list before running `start.sh`:

```sh
sha256sum images.tar compose.yaml start.sh README.md > SHA256SUMS
```

The `.env` file is not checksummed, so changing runtime secrets does not require this step. Reapply any Compose customizations after copying a new bundle, which replaces the generated `compose.yaml` and checksum list.

For the next update, build a new bundle on the PC, copy its five files into this same folder, and run `sh start.sh` again. No `.env` edits are required unless your runtime configuration changes.
