#!/bin/sh
set -eu

# Resolve everything against this deployment folder, not the caller's directory.
CDPATH= cd -- "$(dirname -- "$0")"

if [ ! -f .env ]; then
    echo "Missing .env in the deployment folder. Reuse your existing runtime secrets here; this bundle never supplies them." >&2
    exit 1
fi

sha256sum -c SHA256SUMS
docker compose --env-file ./.env -f ./compose.yaml config --quiet

# Never silently initialize new storage beside an older installation's data.
# Refuse even when data/ exists: choosing between two copies must be deliberate.
for legacy in ./docker/postgres-data ./.docker-data/postgres18 ./.docker-data/uploads ./uploads; do
    if [ -e "$legacy" ] || [ -L "$legacy" ]; then
        echo "Legacy data path found: $legacy. Stop the old stack and migrate to ./data/pg and ./data/uploads before starting; see README.md. Archive legacy paths outside this deployment folder after verifying the migration." >&2
        exit 1
    fi
done

docker image load --input ./images.tar
# Recreate services for latest images, refreshed nginx upstreams, and env changes.
# PostgreSQL and uploads persist under ./data/pg and ./data/uploads.
docker compose --env-file ./.env -f ./compose.yaml up -d --no-build --pull never --force-recreate
