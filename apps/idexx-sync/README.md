# IDEXX Scrape Service

> On-demand IDEXX Neo data scraping service using Playwright browser automation.

**Version**: 2.0.0  
**Full Documentation**: [`docs/integrations/IDEXX_SYNC_SERVICE.md`](../../docs/integrations/IDEXX_SYNC_SERVICE.md)

## Overview

`idexx-sync` is a standalone Node.js microservice for on-demand scraping of veterinary appointment schedules and consultation data from IDEXX Neo into Supabase.

### Key Features

- **Schedule Scraping** - Fetches appointment schedules for change detection
- **Consultation Scraping** - Pulls clinical data (notes, vitals, diagnoses)
- **Single-Clinic Focus** - Scrapes one clinic per request
- **Flexible Date Support** - Scrape any date (defaults to today)
- **Secure Credentials** - AES-256-GCM encrypted storage

## Quick Start

### Build & Run

```bash
# Build
nx build idexx-sync

# Run (headless)
pnpm --filter idexx-sync start

# Run (visible browser for debugging)
pnpm --filter idexx-sync start:visible
```

### Make a Request

```bash
# Schedule scrape
curl -X POST http://localhost:5050/api/idexx/scrape \
  -H "Content-Type: application/json" \
  -d '{"type": "schedule", "clinicId": "your-clinic-uuid"}'

# Consultation scrape with date
curl -X POST http://localhost:5050/api/idexx/scrape \
  -H "Content-Type: application/json" \
  -d '{"type": "consultation", "clinicId": "your-clinic-uuid", "date": "2025-12-27"}'
```

## API Endpoints

| Endpoint            | Method | Description        |
| ------------------- | ------ | ------------------ |
| `/api/idexx/scrape` | POST   | On-demand scraping |
| `/api/idexx/status` | GET    | Last scrape status |
| `/health`           | GET    | Health check       |
| `/ready`            | GET    | Readiness probe    |

## Environment Variables

| Variable                    | Required | Default   | Description                     |
| --------------------------- | -------- | --------- | ------------------------------- |
| `SUPABASE_URL`              | ✅       | -         | Supabase project URL            |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅       | -         | Service role key                |
| `ENCRYPTION_KEY`            | ✅       | -         | AES encryption key (32+ chars)  |
| `PORT`                      | ❌       | `3001`    | Server port                     |
| `HOST`                      | ❌       | `0.0.0.0` | Server host                     |
| `HEADLESS`                  | ❌       | `true`    | Set `false` for visible browser |

## Project Structure

```
src/
├── main.ts                 # Express entry point
├── config/                 # Zod env validation + constants
├── types/                  # TypeScript interfaces
├── lib/                    # Logger setup
├── routes/                 # HTTP endpoints
│   ├── scrape.route.ts
│   ├── status.route.ts
│   └── health.route.ts
├── services/               # Business logic
│   ├── scrape.service.ts   # Orchestration
│   ├── auth.service.ts     # IDEXX login
│   ├── browser.service.ts  # Playwright wrapper
│   └── persistence.service.ts
├── scrapers/               # Page scraping
│   ├── schedule.scraper.ts
│   └── consultation.scraper.ts
├── selectors/              # DOM selectors
└── utils/                  # Phone normalization
```

## Nx Commands

```bash
nx build idexx-sync       # Build
nx serve idexx-sync       # Dev server
nx lint idexx-sync        # Lint
nx typecheck idexx-sync   # Type check
nx test idexx-sync        # Test
```

## Docker

```bash
# Build
nx build idexx-sync
docker build -t idexx-sync -f Dockerfile ../..

# Run
docker run -p 5050:3001 \
  -e SUPABASE_URL=xxx \
  -e SUPABASE_SERVICE_ROLE_KEY=xxx \
  -e ENCRYPTION_KEY=xxx \
  idexx-sync
```

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────┐
│   Caller    │────▶│           IDEXX Scrape Service           │
└─────────────┘     │                                          │
                    │  ┌─────────┐  ┌─────────────────────┐   │
                    │  │ Routes  │──▶│   ScrapeService     │   │
                    │  └─────────┘  │  (orchestration)     │   │
                    │               └──────────┬──────────┘   │
                    │      ┌───────────┬───────┴───────┐      │
                    │      ▼           ▼               ▼      │
                    │  AuthService  BrowserService  Persistence│
                    │      │           │               │      │
                    │      └─────┬─────┘               │      │
                    │            ▼                     │      │
                    │    ┌───────────────┐            │      │
                    │    │   Scrapers    │            │      │
                    │    │ (Schedule/    │            │      │
                    │    │  Consultation)│            │      │
                    │    └───────┬───────┘            │      │
                    └────────────│─────────────────────│──────┘
                                 ▼                     ▼
                          ┌──────────┐          ┌──────────┐
                          │ IDEXX Neo│          │ Supabase │
                          └──────────┘          └──────────┘
```

## Related

- [Full Documentation](../../docs/integrations/IDEXX_SYNC_SERVICE.md)
- [IDEXX Integration Library](../../libs/integrations/idexx/README.md)
- [Database Schema](../../docs/architecture/DATABASE_CONTEXT.md)
