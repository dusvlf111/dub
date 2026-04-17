# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# ---- Dependencies ----
FROM base AS deps

# Copy workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# Copy all package.json files for workspace resolution
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

# Copy all installed node_modules from deps
COPY --from=deps /app/ ./

# Copy full source code
COPY . .

# Generate Prisma client using the project-local prisma binary (not npx)
RUN cd packages/prisma && \
    ./node_modules/.bin/prisma generate --schema=./schema

# Set self-hosted env for build
ENV SELF_HOSTED=true
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy values for build-time env vars that Next.js needs
ENV NEXTAUTH_SECRET=build-secret-placeholder
ENV NEXTAUTH_URL=http://localhost:3000
ENV DATABASE_URL=mysql://root:root@localhost:3306/dub
ENV NEXT_PUBLIC_APP_NAME=Dub
ENV NEXT_PUBLIC_APP_DOMAIN=localhost:3000
ENV NEXT_PUBLIC_APP_SHORT_DOMAIN=localhost:3000

# Build the Next.js app (using the project-level next, not npx)
RUN pnpm --filter=web exec next build

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
