# Dub Self-Hosting Guide

Self-host Dub using Docker Compose with **zero external dependencies**.

## Architecture

| Service | Role | Port |
|---------|------|------|
| **web** | Next.js app | 3000 |
| **mysql** | Database | 3306 |
| **redis** | Cache & rate limiting | 6379 |
| **clickhouse** | Analytics (replaces Tinybird) | 8123 |
| **minio** | Object storage (S3-compatible) | 9000/9001 |
| **mailhog** | SMTP testing | 1025/8025 |

## Quick Start

```bash
# 1. Copy and edit environment file
cp .env.selfhost .env.selfhost.local
# Edit .env.selfhost.local - at minimum change NEXTAUTH_SECRET

# 2. Start all services
docker compose -f docker-compose.selfhost.yml up -d

# 3. Wait for services to be healthy (~30s)
docker compose -f docker-compose.selfhost.yml ps

# 4. Run database migrations
docker compose -f docker-compose.selfhost.yml exec web \
  npx prisma db push --schema=./packages/prisma/schema/schema.prisma

# 5. Open the app
open http://localhost:3000
```

## Coolify Deployment

1. Create a new project in Coolify
2. Select "Docker Compose" as the deployment method
3. Point to your repository
4. Set the compose file path to `docker-compose.selfhost.yml`
5. Configure environment variables in Coolify's UI
6. Deploy

## Environment Variables

See `.env.selfhost` for all available configuration options.

### Required
- `NEXTAUTH_SECRET` - Random secret for authentication (generate with `openssl rand -base64 32`)
- `DATABASE_URL` - MySQL connection string
- `REDIS_URL` - Redis connection string

### Optional
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth login
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth login
- `STRIPE_SECRET_KEY` - Stripe payments (for billing features)

## What's Different from SaaS

| Feature | SaaS (dub.co) | Self-Hosted |
|---------|---------------|-------------|
| Analytics | Tinybird | ClickHouse |
| Redis | Upstash REST | Redis TCP |
| Job Queue | QStash | Direct HTTP |
| Storage | Cloudflare R2 | MinIO |
| Email | Resend | SMTP |
| Edge Config | Vercel | Redis |
| Vector Search | Upstash Vector | Disabled |
| Domains API | Vercel | Disabled |
| Feature Flags | Edge Config | All enabled |
| Blacklists | Edge Config | Disabled |

## Production Notes

- Change all default passwords in `.env.selfhost`
- Use HTTPS in production (configure reverse proxy)
- Set up backups for MySQL, ClickHouse, and MinIO volumes
- For MinIO in production, configure a proper domain with HTTPS for presigned URLs
- Consider using external managed MySQL/Redis if you need HA
