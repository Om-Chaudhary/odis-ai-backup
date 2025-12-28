# IDEXX Sync Service

> On-demand IDEXX Neo data synchronization service using internal API endpoints.

**Version**: 3.0.0  
**Full Documentation**: [`docs/integrations/IDEXX_SYNC_SERVICE.md`](../../docs/integrations/IDEXX_SYNC_SERVICE.md)

## Overview

`idexx-sync` is a standalone Node.js microservice that fetches veterinary appointment schedules and consultation data from IDEXX Neo's internal APIs and syncs them to Supabase. Uses Playwright for authentication, then makes direct API calls for reliable, fast data extraction.

### Key Features

- **API-Based Data Fetching** - Uses IDEXX Neo's internal REST APIs (not DOM scraping)
- **Schedule Sync** - Appointments with business hours and free slot calculation
- **Consultation Sync** - Clinical data including notes, vitals, and diagnoses
- **Single-Clinic Focus** - Syncs one clinic per request
- **Flexible Date Support** - Fetch any date (defaults to today)
- **Secure Credentials** - AES-256-GCM encrypted storage
- **Deep Data Fetching** - Automatically fetches detailed consultation notes when needed

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
# Schedule sync (includes appointments, business hours, and free slots)
curl -X POST http://localhost:5050/api/idexx/scrape \
  -H "Content-Type: application/json" \
  -d '{"type": "schedule", "clinicId": "your-clinic-uuid"}'

# Consultation sync with date (includes clinical notes, vitals, diagnoses)
curl -X POST http://localhost:5050/api/idexx/scrape \
  -H "Content-Type: application/json" \
  -d '{"type": "consultation", "clinicId": "your-clinic-uuid", "date": "2025-12-27"}'
```

**Response:**

```json
{
  "success": true,
  "sessionId": "uuid",
  "data": {
    "recordsScraped": 15,
    "recordsCreated": 12,
    "recordsUpdated": 3,
    "scrapedAt": "2025-12-27T12:00:00.000Z"
  }
}
```

## API Endpoints

| Endpoint            | Method | Description                        |
| ------------------- | ------ | ---------------------------------- |
| `/api/idexx/scrape` | POST   | Sync schedule or consultation data |
| `/api/idexx/status` | GET    | Last sync status by clinic         |
| `/health`           | GET    | Health check (uptime, memory)      |
| `/ready`            | GET    | Readiness probe (DB connection)    |

### IDEXX Neo API Endpoints Used

See [`docs/IDEXX_API_ENDPOINTS.md`](./docs/IDEXX_API_ENDPOINTS.md) for complete documentation.

**Schedule APIs:**

- `/appointments/getCalendarEventData` - Appointment data
- `/schedule/getScheduleConfigs` - Business hours, slot settings

**Consultation APIs:**

- `/consultations/search` - Search consultations by date
- `/consultations/view/{id}` - Detailed clinical notes

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
├── main.ts                    # Express entry point
├── config/                    # Zod env validation + constants
├── types/                     # TypeScript interfaces
├── lib/                       # Logger setup
├── routes/                    # HTTP endpoints
│   ├── scrape.route.ts        # POST /api/idexx/scrape
│   ├── status.route.ts        # GET /api/idexx/status
│   └── health.route.ts        # GET /health, /ready
├── services/                  # Business logic
│   ├── scrape.service.ts      # Orchestration layer
│   ├── auth.service.ts        # IDEXX Neo authentication
│   ├── browser.service.ts     # Playwright wrapper + API client
│   └── persistence.service.ts # Supabase write operations
├── scrapers/                  # API data fetchers
│   ├── schedule.scraper.ts    # Appointments + free slots
│   └── consultation.scraper.ts# Clinical data + notes
├── selectors/                 # DOM selectors (auth only)
│   └── login.selectors.ts     # Login form fields
├── utils/                     # Utilities
│   └── phone.ts               # Phone normalization
└── docs/                      # Documentation
    └── IDEXX_API_ENDPOINTS.md # API reference
```

### Architecture Flow

1. **Authentication** - Playwright navigates to IDEXX Neo and logs in via web UI
2. **Session Capture** - Authenticated cookies are captured from browser context
3. **API Calls** - Direct HTTP requests to IDEXX internal APIs using session cookies
4. **Transformation** - API responses transformed to Supabase schema
5. **Persistence** - Data saved to `idexx_scrapes` and `idexx_scrape_data` tables

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
┌─────────────┐     ┌──────────────────────────────────────────────────┐
│   Caller    │────▶│          IDEXX Sync Service (API-Based)          │
└─────────────┘     │                                                  │
                    │  ┌─────────┐  ┌──────────────────────────┐      │
                    │  │ Routes  │──▶│    ScrapeService         │      │
                    │  └─────────┘  │   (orchestration)         │      │
                    │               └─────────┬────────────────┘      │
                    │      ┌─────────────┬────┴────────┬──────────┐   │
                    │      ▼             ▼             ▼          ▼   │
                    │  AuthService  BrowserService  Scrapers  Persistence│
                    │   (login)     (API client)   (API fetch)   (DB)  │
                    │      │              │             │          │   │
                    └──────┼──────────────┼─────────────┼──────────┼───┘
                           │              │             │          │
                           ▼              ▼             ▼          ▼
                    ┌──────────────────────────┐  ┌──────────────────┐
                    │      IDEXX Neo           │  │    Supabase      │
                    │  ┌────────────────────┐  │  │                  │
                    │  │  Web UI (auth)     │◀─┘  │  ┌─────────────┐ │
                    │  └────────────────────┘     │  │ idexx_scrapes│ │
                    │  ┌────────────────────┐     │  │ (sessions)   │ │
                    │  │  Internal APIs:    │─────┼─▶│              │ │
                    │  │  - /appointments/  │     │  │ idexx_scrape_│ │
                    │  │  - /consultations/ │     │  │ _data        │ │
                    │  │  - /schedule/      │     │  │ (records)    │ │
                    │  └────────────────────┘     │  └─────────────┘ │
                    └──────────────────────────┘  └──────────────────┘

Flow:
1. Playwright authenticates via IDEXX Neo web UI
2. Session cookies captured from browser context
3. Authenticated API requests made to internal endpoints
4. JSON responses transformed to Supabase schema
5. Data persisted to database tables
```

## Why API-Based vs DOM Scraping?

**Previous Approach (v2.x):**

- ❌ DOM scraping with complex CSS selectors
- ❌ Breaks when IDEXX updates their UI
- ❌ Slower (waits for page loads, JS execution)
- ❌ Timeout issues with date pickers and modals

**Current Approach (v3.x):**

- ✅ Direct API calls to IDEXX internal endpoints
- ✅ Stable JSON contracts (less likely to change)
- ✅ 10x faster (no page loads, no UI interaction)
- ✅ Reliable data extraction with typed responses
- ✅ Supports pagination and detailed data fetching

## Data Capabilities

### Schedule Sync

- **Appointments**: Patient name, client name/phone, provider, type, status, times
- **Business Hours**: Clinic open/close times, days of week
- **Free Slots**: Calculated available appointment slots
- **Providers**: List of veterinarians
- **Rooms**: Exam room assignments

### Consultation Sync

- **Basic Info**: Patient, appointment link, consultation date
- **Clinical Notes**: Full SOAP notes and clinical observations
- **Vitals**: Temperature, pulse, respiration, weight, blood pressure
- **Diagnoses**: Structured diagnosis list
- **Deep Fetch**: Automatically retrieves detailed notes via `/consultations/view/{id}`

## Related

- [IDEXX API Endpoints Reference](./docs/IDEXX_API_ENDPOINTS.md) - Complete API documentation
- [Full Service Documentation](../../docs/integrations/IDEXX_SYNC_SERVICE.md)
- [IDEXX Integration Library](../../libs/integrations/idexx/README.md)
- [Database Schema](../../docs/architecture/DATABASE_CONTEXT.md)
