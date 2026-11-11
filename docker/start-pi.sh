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
docker image load --input ./images.tar
# Recreate services for latest images, refreshed nginx upstreams, and env changes.
# PostgreSQL and uploads remain in their existing bind-mounted directories.
docker compose --env-file ./.env -f ./compose.yaml up -d --no-build --pull never --force-recreate
