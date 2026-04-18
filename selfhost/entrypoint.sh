#!/bin/sh
# Dub self-hosted entrypoint.
# Waits for MySQL, syncs Prisma schema, then starts the Next.js server.
set -e

echo ">>> [entrypoint] waiting for MySQL..."
i=0
until node -e "
const net = require('net');
const u = new URL(process.env.DATABASE_URL.replace(/^mysql/, 'http'));
const s = net.createConnection({ host: u.hostname, port: u.port || 3306 }, () => { s.end(); process.exit(0); });
s.on('error', () => process.exit(1));
" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo ">>> [entrypoint] MySQL did not become reachable in 60s, giving up"
    exit 1
  fi
  sleep 1
done
echo ">>> [entrypoint] MySQL reachable"

echo ">>> [entrypoint] prisma db push (sync schema -> MySQL)"
prisma db push \
  --schema=/app/packages/prisma/schema \
  --accept-data-loss \
  --skip-generate

echo ">>> [entrypoint] starting Next.js server on :$PORT"
exec node apps/web/server.js
