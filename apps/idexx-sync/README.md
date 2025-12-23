# IDEXX Neo Sync Service

Automated IDEXX Neo synchronization service using Playwright browser automation, triggered via QStash HTTP endpoints.

## Overview

This service automates the synchronization of appointment schedules and consultation data from IDEXX Neo to Supabase. It runs as a Docker container on Railway and is triggered by QStash cron schedules.

## Architecture

```
QStash Cron Schedules
        │
        ▼
┌─────────────────────┐
│  Express HTTP API   │
│  POST /api/idexx/sync │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Sync Engine       │
│   - Pre-open sync   │
│   - EOD sync        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Playwright        │
│   Browser Automation│
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
IDEXX Neo     Supabase
```

## Sync Types

### Pre-Open Sync (6:00 AM)

- Fetches today's appointment schedule
- Creates appointment records in Supabase
- Ensures vets have appointments to record against

### End-of-Day Sync (6:30 PM)

- Pulls consultation data from completed appointments
- Extracts clinical notes, vitals, and diagnoses
- Updates case records with IDEXX data
- Runs before 7:30 PM discharge batch

## Endpoints

| Endpoint                        | Method | Description                      |
| ------------------------------- | ------ | -------------------------------- |
| `/api/idexx/sync?type=pre-open` | POST   | Run pre-open schedule sync       |
| `/api/idexx/sync?type=eod`      | POST   | Run end-of-day consultation sync |
| `/api/idexx/sync-status`        | GET    | Get last sync status             |
| `/health`                       | GET    | Health check for Railway         |
| `/ready`                        | GET    | Readiness probe                  |

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Encryption
ENCRYPTION_KEY=xxx

# QStash
QSTASH_CURRENT_SIGNING_KEY=xxx

# Monitoring (optional)
POSTHOG_API_KEY=xxx

# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
```

## Development

### Local Development

```bash
# Build the application
nx build idexx-sync

# Run in development mode
nx serve idexx-sync

# Run with watch mode
nx serve idexx-sync --configuration=development
```

### Testing

```bash
# Run tests
nx test idexx-sync

# Run with coverage
nx test idexx-sync --coverage
```

### Type Checking

```bash
nx typecheck idexx-sync
```

### Linting

```bash
nx lint idexx-sync
```

## Docker

### Build

```bash
# Build the application first
nx build idexx-sync

# Build Docker image
nx docker:build idexx-sync

# Or manually
docker build -t idexx-sync -f apps/idexx-sync/Dockerfile .
```

### Run Locally

```bash
docker run -p 3001:3001 \
  -e SUPABASE_URL=xxx \
  -e SUPABASE_SERVICE_ROLE_KEY=xxx \
  -e ENCRYPTION_KEY=xxx \
  -e QSTASH_CURRENT_SIGNING_KEY=xxx \
  idexx-sync
```

## QStash Configuration

Create two QStash schedules:

### Pre-Open Sync

- **Cron**: `0 6 * * *` (6:00 AM daily)
- **URL**: `https://your-railway-url/api/idexx/sync?type=pre-open`
- **Retries**: 3 with exponential backoff

### EOD Sync

- **Cron**: `30 18 * * *` (6:30 PM daily)
- **URL**: `https://your-railway-url/api/idexx/sync?type=eod`
- **Retries**: 3 with exponential backoff

### Failure Callback

- **URL**: `https://your-railway-url/api/idexx/sync-failed`

## Railway Deployment

1. Connect your GitHub repository to Railway
2. Set the root directory to the workspace root
3. Set build command: `pnpm nx build idexx-sync`
4. Set start command: `node dist/apps/idexx-sync/main.js`
5. Configure environment variables
6. Deploy

## Monitoring

The service logs to stdout and includes:

- Request/response logging
- Sync progress updates
- Error tracking with stack traces

For production monitoring, configure PostHog events.

## Troubleshooting

### Login Failures

- Verify IDEXX credentials are correct
- Check for 2FA requirements (not supported)
- Review screenshots in `/tmp/idexx-sync-*.png`

### Selector Errors

- IDEXX UI may have changed
- Check selector fallbacks in `src/utils/selectors.ts`
- Take screenshots to debug

### Memory Issues

- Ensure container has at least 1GB RAM
- Browser automation is memory-intensive
