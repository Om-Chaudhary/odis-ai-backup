# Deploying PIMS Sync to Railway

> Complete guide to deploying the PIMS Sync Service on Railway

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Deploy](#quick-deploy)
- [Step-by-Step Guide](#step-by-step-guide)
- [Environment Variables](#environment-variables)
- [Railway Configuration](#railway-configuration)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Scaling & Performance](#scaling--performance)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

---

## Overview

Railway is a platform-as-a-service (PaaS) that makes deploying containerized applications simple. The PIMS Sync service is pre-configured with:

- **Dockerfile** - Multi-stage build with Playwright base image
- **railway.toml** - Railway-specific deployment configuration
- **Health checks** - Automatic health monitoring

### Architecture on Railway

```
┌─────────────────────────────────────────────────────────────────┐
│                       RAILWAY PLATFORM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐      ┌─────────────────────────────────┐ │
│   │  PIMS Sync      │      │  Environment Variables          │ │
│   │  Container      │◀────▶│  (Railway Secrets)              │ │
│   │                 │      │  • SUPABASE_URL                 │ │
│   │  • Node.js      │      │  • SUPABASE_SERVICE_ROLE_KEY    │ │
│   │  • Playwright   │      │  • ENCRYPTION_KEY               │ │
│   │  • Chromium     │      └─────────────────────────────────┘ │
│   └────────┬────────┘                                          │
│            │                                                    │
│            │ Health Check: /health                             │
│            │ Ready Check: /ready                               │
│            │                                                    │
│   ┌────────▼────────┐                                          │
│   │  Railway        │                                          │
│   │  Proxy          │                                          │
│   │  (HTTPS/TLS)    │                                          │
│   └────────┬────────┘                                          │
│            │                                                    │
└────────────┼────────────────────────────────────────────────────┘
             │
             ▼
    ┌─────────────────┐
    │  Public URL     │
    │  your-app.up.   │
    │  railway.app    │
    └─────────────────┘
```

---

## Prerequisites

Before deploying, ensure you have:

1. **Railway Account** - Sign up at [railway.app](https://railway.app)
2. **Railway CLI** (optional) - `npm install -g @railway/cli`
3. **GitHub Repository** - Connected to Railway for auto-deploy
4. **Supabase Project** - With required tables set up
5. **Encryption Key** - 32+ character key for credentials

### Local Testing

Verify the service runs locally before deploying:

```bash
# Build
nx build pims-sync

# Test locally
pnpm --filter pims-sync start

# Verify health
curl http://localhost:3001/health
```

---

## Quick Deploy

### Option 1: Railway Dashboard (Recommended for first deploy)

1. Go to [railway.app/new](https://railway.app/new)
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects the Dockerfile
5. Configure environment variables
6. Click "Deploy"

### Option 2: Railway CLI

```bash
# Login to Railway
railway login

# Create new project
railway init

# Link to existing project (if already created)
railway link

# Deploy
railway up

# Open dashboard
railway open
```

### Option 3: One-Click Deploy Button

Add this to your README for one-click deploys:

```markdown
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)
```

---

## Step-by-Step Guide

### Step 1: Create Railway Project

1. Log in to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your repository
5. Select the repository containing your monorepo

### Step 2: Configure Build Settings

Railway should auto-detect the Dockerfile, but verify:

1. Go to **Settings** > **Build**
2. Ensure **Builder** is set to `Dockerfile`
3. Set **Dockerfile Path** to `apps/pims-sync/Dockerfile`
4. Set **Watch Paths** (optional, for selective rebuilds):
   ```
   apps/pims-sync/**
   libs/domain/sync/**
   libs/integrations/idexx/**
   libs/data-access/**
   libs/shared/**
   ```

### Step 3: Configure Environment Variables

Go to **Variables** tab and add:

| Variable                    | Value                     | Notes                |
| --------------------------- | ------------------------- | -------------------- |
| `SUPABASE_URL`              | `https://xxx.supabase.co` | Your Supabase URL    |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...`               | Service role key     |
| `ENCRYPTION_KEY`            | `K7gN+xR2mQ...`           | 32+ chars            |
| `PORT`                      | `3001`                    | Railway auto-exposes |
| `NODE_ENV`                  | `production`              | Production mode      |
| `ENABLE_SCHEDULER`          | `true`                    | Enable cron jobs     |
| `HEADLESS`                  | `true`                    | No browser UI        |

**Setting Variables via CLI:**

```bash
# Set individual variables
railway variables set SUPABASE_URL="https://xxx.supabase.co"
railway variables set SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
railway variables set ENCRYPTION_KEY="your-32-char-key"
railway variables set NODE_ENV="production"
railway variables set ENABLE_SCHEDULER="true"

# Or use .env file
railway variables set < .env.production
```

### Step 4: Configure Networking

1. Go to **Settings** > **Networking**
2. Click **"Generate Domain"** to get a public URL
3. (Optional) Add custom domain

Your service will be available at:

```
https://your-project.up.railway.app
```

### Step 5: Deploy

**Via Dashboard:**

1. Click **"Deploy"** or push to your main branch
2. Watch the build logs
3. Verify deployment status

**Via CLI:**

```bash
railway up
```

### Step 6: Verify Deployment

```bash
# Health check
curl https://your-project.up.railway.app/health

# Readiness check
curl https://your-project.up.railway.app/ready

# Test sync endpoint (with API key)
curl -X POST https://your-project.up.railway.app/api/sync/inbound \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"daysAhead": 1}'
```

---

## Environment Variables

### Required Variables

| Variable                    | Description                     | Example                   |
| --------------------------- | ------------------------------- | ------------------------- |
| `SUPABASE_URL`              | Supabase project URL            | `https://abc.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) | `eyJhbGciOi...`           |
| `ENCRYPTION_KEY`            | AES encryption key (32+ chars)  | `K7gN+xR2mQ9pL3w...`      |

### Optional Variables

| Variable           | Default      | Description                     |
| ------------------ | ------------ | ------------------------------- |
| `PORT`             | `3001`       | Server port (Railway sets this) |
| `HOST`             | `0.0.0.0`    | Server host                     |
| `NODE_ENV`         | `production` | Environment mode                |
| `HEADLESS`         | `true`       | Hide browser window             |
| `ENABLE_SCHEDULER` | `true`       | Enable per-clinic cron          |
| `SYNC_TIMEOUT_MS`  | `300000`     | Sync operation timeout          |

### Security Best Practices

1. **Never commit secrets** - Use Railway's variable management
2. **Use separate keys** - Different encryption keys per environment
3. **Rotate keys periodically** - Update ENCRYPTION_KEY as needed
4. **Limit service role key exposure** - Only used server-side

---

## Railway Configuration

### railway.toml

The repository includes a pre-configured `railway.toml`:

```toml
# apps/pims-sync/railway.toml

[build]
# Use Docker for deployment
builder = "dockerfile"
dockerfilePath = "apps/pims-sync/Dockerfile"

# Watch patterns for selective rebuilds
watchPatterns = [
  "apps/pims-sync/**",
  "libs/domain/sync/**",
  "libs/integrations/idexx/**",
  "libs/integrations/axiom/**",
  "libs/data-access/**",
  "libs/shared/**"
]

[deploy]
# Health check configuration
healthcheckPath = "/health"
healthcheckTimeout = 30
startCommand = "node main.js"
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 3

# Resource limits (Railway auto-scales)
numReplicas = 1
```

### Dockerfile

The multi-stage Dockerfile optimizes for production:

```dockerfile
# apps/pims-sync/Dockerfile

# Base image with Playwright + Chromium pre-installed
FROM mcr.microsoft.com/playwright:v1.49.1-noble

# Environment
ENV HOST=0.0.0.0
ENV PORT=3001
ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm@10.23.0

WORKDIR /app

# Non-root user for security
RUN groupadd --system pims-sync && \
    useradd --system --gid pims-sync pims-sync

# Copy built application
COPY dist/apps/pims-sync/main.js ./
COPY dist/apps/pims-sync/package.json ./

# Install production dependencies
RUN pnpm install --prod

# Set ownership
RUN chown -R pims-sync:pims-sync /app

# Switch to non-root user
USER pims-sync

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

EXPOSE 3001

CMD ["node", "main.js"]
```

### Build Prerequisites

Before Railway builds, ensure these Nx commands have run:

```bash
# Build the application (bundles to single file)
nx build pims-sync

# The build outputs to:
# dist/apps/pims-sync/main.js
# dist/apps/pims-sync/package.json
```

---

## Monitoring & Health Checks

### Health Endpoint

Railway automatically monitors `/health`:

```bash
GET /health

# Response:
{
  "status": "healthy",
  "uptime": 123456,
  "memory": {
    "heapUsed": 45678912,
    "heapTotal": 67890123,
    "rss": 89012345
  },
  "version": "4.0.0",
  "scheduler": {
    "enabled": true,
    "activeJobs": 3
  }
}
```

### Readiness Endpoint

Used for deployment readiness:

```bash
GET /ready

# Response:
{
  "status": "ready",
  "database": "connected",
  "timestamp": "2026-01-17T12:00:00.000Z"
}
```

### Railway Metrics

View metrics in Railway dashboard:

1. Go to your project
2. Click **"Metrics"** tab
3. Monitor:
   - CPU usage
   - Memory usage
   - Network I/O
   - Request latency

### Logging

View logs in Railway:

```bash
# Via CLI
railway logs

# Or in dashboard: Click "Logs" tab
```

The service outputs structured JSON logs:

```json
{
  "level": "info",
  "namespace": "pims-sync:server",
  "message": "Server started",
  "port": 3001,
  "env": "production",
  "timestamp": "2026-01-17T12:00:00.000Z"
}
```

---

## Scaling & Performance

### Resource Allocation

Railway auto-scales based on usage. For optimal performance:

| Resource     | Recommendation                              |
| ------------ | ------------------------------------------- |
| **Memory**   | 1-2 GB (Playwright + Chromium needs ~500MB) |
| **CPU**      | 1-2 vCPU                                    |
| **Replicas** | 1 (scheduler runs on single instance)       |

### Performance Tips

1. **Use efficient date ranges** - Smaller ranges = faster syncs
2. **Adjust parallelBatchSize** - Balance speed vs PIMS rate limits
3. **Schedule off-peak** - Run heavy syncs during low-traffic hours
4. **Monitor memory** - Playwright can leak if not properly closed

### Horizontal Scaling Considerations

⚠️ **Important**: The scheduler is designed for single-instance deployment.

If you need multiple replicas:

1. Disable scheduler on replicas (`ENABLE_SCHEDULER=false`)
2. Run scheduler on dedicated instance
3. Use external job scheduler (e.g., QStash, Cloud Scheduler)

---

## Troubleshooting

### Common Issues

#### Build Fails: "Cannot find module"

```
Error: Cannot find module '@odis-ai/shared/crypto'
```

**Solution**: Ensure Nx build completes before Docker build:

```bash
nx build pims-sync
```

#### Container Crashes: "ENCRYPTION_KEY required"

**Solution**: Set the environment variable in Railway:

```bash
railway variables set ENCRYPTION_KEY="your-32-char-key"
```

#### Health Check Fails

```
Deployment failed: Health check timed out
```

**Solutions**:

1. Increase `healthcheckTimeout` in `railway.toml`
2. Check logs for startup errors
3. Verify `PORT` environment variable matches

#### Browser Launch Fails

```
Error: Failed to launch browser
```

**Solutions**:

1. Verify using Playwright base image
2. Ensure `HEADLESS=true`
3. Check memory allocation (needs ~500MB for Chromium)

#### Database Connection Errors

```
Error: Database connection failed
```

**Solutions**:

1. Verify `SUPABASE_URL` is correct
2. Check `SUPABASE_SERVICE_ROLE_KEY` is valid
3. Ensure Supabase project is active

### Debug Mode

For debugging, you can:

1. **Check logs**: `railway logs -f`
2. **SSH into container**: Railway doesn't support SSH, use logs
3. **Test locally**: Run with production env vars locally

```bash
# Test with production variables locally
SUPABASE_URL=xxx \
SUPABASE_SERVICE_ROLE_KEY=xxx \
ENCRYPTION_KEY=xxx \
pnpm --filter pims-sync start
```

### Rollback Deployment

If a deployment fails:

1. Go to **Deployments** tab
2. Find the last working deployment
3. Click **"Redeploy"**

Or via CLI:

```bash
# List deployments
railway deployment list

# Rollback to specific deployment
railway deployment rollback <deployment-id>
```

---

## CI/CD Integration

### GitHub Actions

Example workflow for auto-deploy on main:

```yaml
# .github/workflows/deploy-pims-sync.yml

name: Deploy PIMS Sync

on:
  push:
    branches: [main]
    paths:
      - "apps/pims-sync/**"
      - "libs/domain/sync/**"
      - "libs/integrations/idexx/**"
      - "libs/data-access/**"
      - "libs/shared/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: nx build pims-sync

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@v1.0.0
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: pims-sync
```

### Required Secrets

Add to GitHub repository secrets:

| Secret          | Description                                |
| --------------- | ------------------------------------------ |
| `RAILWAY_TOKEN` | Railway API token (from Railway dashboard) |

### Getting Railway Token

1. Go to Railway dashboard
2. Click on your account menu
3. Select **"Account Settings"**
4. Go to **"Tokens"** tab
5. Create a new token

---

## Quick Reference

### Useful Commands

```bash
# Deploy
railway up

# View logs
railway logs -f

# Check status
railway status

# Open dashboard
railway open

# Set variable
railway variables set KEY=value

# List variables
railway variables

# SSH-like shell (inspect container)
railway shell
```

### Endpoints

| Endpoint              | Method | Description        |
| --------------------- | ------ | ------------------ |
| `/health`             | GET    | Health check       |
| `/ready`              | GET    | Readiness probe    |
| `/metrics`            | GET    | Prometheus metrics |
| `/api/sync/inbound`   | POST   | Inbound sync       |
| `/api/sync/cases`     | POST   | Case enrichment    |
| `/api/sync/reconcile` | POST   | Reconciliation     |
| `/api/sync/full`      | POST   | Full pipeline      |

### Support Links

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Playwright Docker Images](https://playwright.dev/docs/docker)

---

**Version**: 4.0.0
**Last Updated**: 2026-01-17
