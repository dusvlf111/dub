# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# ---- Install ----
FROM base AS installer

# Copy everything needed for pnpm install
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

RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM base AS builder

WORKDIR /app

# Copy installed node_modules + full source
COPY --from=installer /app/ ./
COPY . .

# Generate Prisma client using the LOCAL prisma (not npx which grabs v7)
RUN cd packages/prisma && ./node_modules/.bin/prisma generate --schema=./schema

# Self-hosted build env
ENV SELF_HOSTED=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTAUTH_SECRET=build-placeholder
ENV NEXTAUTH_URL=http://localhost:3000
ENV DATABASE_URL=mysql://root:root@localhost:3306/dub
ENV NEXT_PUBLIC_APP_NAME=Dub
ENV NEXT_PUBLIC_APP_DOMAIN=localhost:3000
ENV NEXT_PUBLIC_APP_SHORT_DOMAIN=localhost:3000
# Dummy values for third-party SDKs that initialize at module level
ENV PLAIN_API_KEY=build-placeholder
ENV VERIFF_API_KEY=build-placeholder
ENV AXIOM_TOKEN=build-placeholder
ENV AXIOM_DATASET=build-placeholder

# Use turbo to build web + all its workspace dependencies (ui, utils, email, etc.)
RUN npx turbo build --filter=web

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

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
