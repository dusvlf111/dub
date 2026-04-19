# syntax=docker/dockerfile:1.7

# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN apk add --no-cache libc6-compat openssl

# pnpm store & turbo cache live outside /app so they can be reused by cache mounts
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV TURBO_TELEMETRY_DISABLED=1
ENV NEXT_TELEMETRY_DISABLED=1
# Streaming output so Coolify / docker logs show progress live
ENV FORCE_COLOR=0
ENV CI=1

WORKDIR /app

# ---- Install ----
FROM base AS installer

RUN echo ">>> [install] copy workspace manifests"
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/prisma/package.json packages/prisma/package.json
COPY packages/email/package.json packages/email/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/utils/package.json packages/utils/package.json
COPY packages/cli/package.json packages/cli/package.json
COPY packages/embeds/core/package.json packages/embeds/core/package.json
COPY packages/embeds/react/package.json packages/embeds/react/package.json
COPY packages/tailwind-config/package.json packages/tailwind-config/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
COPY packages/stripe-app/package.json packages/stripe-app/package.json
COPY packages/hubspot-app/package.json packages/hubspot-app/package.json

# BuildKit cache mount: pnpm store is reused across builds -> no re-download
# --prefer-offline + --network-concurrency 16: faster and gentler on RAM
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    echo ">>> [install] pnpm install (cached store)" && \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --prefer-offline --network-concurrency=16 && \
    echo ">>> [install] done"

# ---- Build ----
FROM base AS builder

WORKDIR /app

# Copy node_modules from installer
COPY --from=installer /app/ ./
# Copy source (node_modules excluded by .dockerignore, so nothing is clobbered)
COPY . .

RUN echo ">>> [build] prisma generate"
RUN cd packages/prisma && ./node_modules/.bin/prisma generate --schema=./schema

# Self-hosted: Edge Runtime can't load ioredis / mysql2 (Node-only native modules).
# Our self-hosted Redis/MySQL compat layers require Node.js, so downgrade every
# Edge route to the Node.js runtime before building.
RUN echo ">>> [build] rewriting edge routes -> nodejs (self-hosted only)" && \
    find apps/web/app -type f \( -name "*.ts" -o -name "*.tsx" \) \
      -exec grep -lE 'runtime[[:space:]]*=[[:space:]]*["'\'']edge["'\'']' {} + \
    | tee /tmp/edge-routes.txt && \
    if [ -s /tmp/edge-routes.txt ]; then \
      xargs sed -i -E 's/(runtime[[:space:]]*=[[:space:]]*)["'\'']edge["'\'']/\1"nodejs"/g' < /tmp/edge-routes.txt; \
    fi && \
    echo ">>> [build] edge->nodejs rewrite done"

# Build-time env (placeholders so module-level SDK init does not crash)
ENV SELF_HOSTED=true
ENV NEXTAUTH_SECRET=build-placeholder
ENV NEXTAUTH_URL=http://localhost:3000
ENV DATABASE_URL=mysql://root:root@localhost:3306/dub
ENV NEXT_PUBLIC_APP_NAME=Dub
ENV NEXT_PUBLIC_APP_DOMAIN=localhost:3000
ENV NEXT_PUBLIC_APP_SHORT_DOMAIN=localhost:3000
ENV PLAIN_API_KEY=build-placeholder
ENV VERIFF_API_KEY=build-placeholder
ENV AXIOM_TOKEN=build-placeholder
ENV AXIOM_DATASET=build-placeholder
# Stripe SDK v18 validates the key format — use a plausible-looking dummy
ENV STRIPE_SECRET_KEY=sk_test_build_placeholder_00000000000000000000
ENV STRIPE_APP_SECRET_KEY=sk_test_build_placeholder_00000000000000000000
# Dub SDK reads this on construction
ENV DUB_API_KEY=dub_build_placeholder

# Prevent OOM during Next.js build (this is the #1 cause of Coolify build crashes)
ENV NODE_OPTIONS=--max-old-space-size=4096

# Cap turbo parallelism so we don't fan out to N CPU cores.
# On a 64-thread host this was launching way too many node workers and
# pegging all RAM/CPU, which knocked the server's network stack offline.
# 2 parallel tasks × 4GB heap ≈ 8GB peak — safe on small/medium VPS.
RUN echo ">>> [build] turbo build --filter=web (streaming, concurrency=2)" && \
    pnpm turbo build --filter=web --concurrency=2 --log-order=stream --output-logs=new-only && \
    echo ">>> [build] done" && \
    ls -la apps/web/.next/standalone apps/web/.next/static 2>&1 | head -30

# ---- Runner ----
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SELF_HOSTED=true

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Prisma schema for runtime `prisma db push`. Install prisma CLI globally so
# we don't have to untangle pnpm's symlinked store at runtime.
COPY --from=builder /app/packages/prisma/schema ./packages/prisma/schema
RUN npm install -g prisma@6.19.1 --no-audit --no-fund && \
    prisma --version

# Self-hosted entrypoint: waits for MySQL, runs `prisma db push`, starts Next.
COPY --from=builder /app/selfhost/entrypoint.sh /usr/local/bin/dub-entrypoint.sh
RUN chmod +x /usr/local/bin/dub-entrypoint.sh

# Ensure nextjs user can read the schema dir we just copied as root.
RUN chown -R nextjs:nodejs /app/packages /app/apps

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/usr/local/bin/dub-entrypoint.sh"]
