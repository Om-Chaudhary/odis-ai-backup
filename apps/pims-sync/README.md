# PIMS Sync Service

> Practice Information Management System (PIMS) synchronization service with IDEXX Neo integration.

**Version**: 4.0.0
**Full Documentation**: [`docs/integrations/PIMS_SYNC_SERVICE.md`](../../docs/integrations/PIMS_SYNC_SERVICE.md)

## Overview

`pims-sync` is a standalone Node.js microservice that provides generic PIMS synchronization capabilities with an initial IDEXX Neo provider implementation. It syncs veterinary appointment schedules and consultation data from PIMS systems to the Supabase database.

### Key Features

- **Provider-Agnostic Architecture** - Generic `IPimsProvider` interface supports multiple PIMS systems
- **Three-Phase Sync Pipeline**:
  - **Inbound Sync** - Appointments → Cases (creates/updates case records)
  - **Case Enrichment** - Fetch consultation data (SOAP notes, vitals, diagnoses)
  - **Reconciliation** - 7-day lookback to soft-delete orphaned cases
- **Per-Clinic Scheduling** - Configurable cron schedules per clinic with automatic polling for config changes
- **API Key Authentication** - Secure X-API-Key header validation with per-clinic permissions
- **Flexible Date Ranges** - Sync historical, current, or future appointments
- **Secure Credentials** - AES-256-GCM encrypted PIMS credentials storage
- **Audit Trail** - Comprehensive sync logging to `case_sync_audits` table
- **Legacy Support** - Maintains backward compatibility with IDEXX-specific endpoints

## Quick Start

### Build & Run

```bash
# Build
nx build idexx-sync

# Run API server (headless)
pnpm --filter idexx-sync start

# Run API server (visible browser for debugging)
pnpm --filter idexx-sync start:visible

# Run interactive CLI with progress indicators
pnpm --filter idexx-sync cli
```

### Interactive CLI

The CLI provides comprehensive progress tracking and monitoring:

- **Multi-phase progress bars** - Visual progress across all sync phases
- **Live status monitoring** - Real-time sync status with auto-updates
- **Enhanced sync history** - Detailed history with statistics and success rates
- **Live health monitoring** - Real-time server metrics and memory tracking

See [`CLI_FEATURES.md`](./CLI_FEATURES.md) for detailed documentation.

### Make a Request

**New PIMS Sync Endpoints (Recommended):**

```bash
# Full sync pipeline (inbound → cases → reconciliation)
curl -X POST http://localhost:5050/api/sync/full \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-clinic-api-key" \
  -d '{
    "daysAhead": 7,
    "lookbackDays": 7
  }'

# Inbound sync only (appointments → cases)
curl -X POST http://localhost:5050/api/sync/inbound \
  -H "X-API-Key: your-clinic-api-key" \
  -d '{
    "startDate": "2026-01-17",
    "endDate": "2026-01-24"
  }'

# Case enrichment only (fetch consultation data)
curl -X POST http://localhost:5050/api/sync/cases \
  -H "X-API-Key: your-clinic-api-key" \
  -d '{
    "startDate": "2026-01-17",
    "parallelBatchSize": 5
  }'

# Reconciliation only (7-day cleanup)
curl -X POST http://localhost:5050/api/sync/reconcile \
  -H "X-API-Key: your-clinic-api-key" \
  -d '{
    "lookbackDays": 7
  }'
```

**Response (Full Sync):**

```json
{
  "success": true,
  "syncId": "uuid",
  "inboundResult": {
    "success": true,
    "stats": {
      "appointmentsFound": 25,
      "casesCreated": 18,
      "casesUpdated": 7,
      "casesSkipped": 0
    }
  },
  "casesResult": {
    "success": true,
    "stats": {
      "casesFound": 25,
      "casesEnriched": 22,
      "casesSkipped": 3
    }
  },
  "reconciliationResult": {
    "success": true,
    "stats": {
      "casesChecked": 120,
      "casesDeleted": 3
    }
  },
  "durationMs": 12456,
  "timestamp": "2026-01-17T12:00:00.000Z"
}
```

**Legacy IDEXX Endpoints (Still Supported):**

```bash
# Schedule sync (includes appointments, business hours, and free slots)
curl -X POST http://localhost:5050/api/idexx/scrape \
  -H "Content-Type: application/json" \
  -d '{"type": "schedule", "clinicId": "your-clinic-uuid"}'

# Consultation sync with date (includes clinical notes, vitals, diagnoses)
curl -X POST http://localhost:5050/api/idexx/scrape \
  -H "Content-Type: application/json" \
  -d '{"type": "consultation", "clinicId": "your-clinic-uuid", "date": "2026-01-17"}'
```

## API Endpoints

**New PIMS Sync Endpoints:**

| Endpoint              | Method | Auth      | Description                                     |
| --------------------- | ------ | --------- | ----------------------------------------------- |
| `/api/sync/full`      | POST   | X-API-Key | Full 3-phase sync (inbound + cases + reconcile) |
| `/api/sync/inbound`   | POST   | X-API-Key | Sync appointments → cases                       |
| `/api/sync/cases`     | POST   | X-API-Key | Enrich cases with consultation data             |
| `/api/sync/reconcile` | POST   | X-API-Key | 7-day reconciliation (soft-delete orphans)      |

**Legacy IDEXX Endpoints:**

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

All environment variables should be set in the root `.env.local` file.

| Variable                    | Required | Default       | Description                                        |
| --------------------------- | -------- | ------------- | -------------------------------------------------- |
| `SUPABASE_URL`              | Yes      | -             | Supabase project URL                               |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes      | -             | Service role key (bypasses RLS)                    |
| `IDEXX_ENCRYPTION_KEY`      | Yes      | -             | AES encryption key for PIMS credentials (min 32)   |
| `NODE_ENV`                  | No       | `development` | Environment: development, production, test         |
| `PORT`                      | No       | `3001`        | Server port                                        |
| `HOST`                      | No       | `0.0.0.0`     | Server host                                        |
| `HEADLESS`                  | No       | `true`        | Set `false` to see browser during sync (debugging) |
| `SYNC_TIMEOUT_MS`           | No       | `300000`      | Sync operation timeout in ms (5 min default)       |
| `ENABLE_SCHEDULER`          | No       | `true`        | Enable per-clinic cron scheduler                   |

### Local Development Setup

To run pims-sync locally against production:

1. **Ensure root `.env.local` has required variables:**
   ```bash
   # Required for pims-sync
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   IDEXX_ENCRYPTION_KEY=your-32-char-min-key
   ```

2. **Verify clinic has credentials in database:**
   ```sql
   -- Check IDEXX credentials exist
   SELECT * FROM idexx_credentials WHERE clinic_id = 'your-clinic-id' AND is_active = true;

   -- Check API key exists
   SELECT * FROM clinic_api_keys WHERE clinic_id = 'your-clinic-id';
   ```

3. **Build and run:**
   ```bash
   nx build pims-sync
   pnpm --filter pims-sync start          # Uses root .env.local
   pnpm --filter pims-sync start:visible  # With visible browser
   ```

4. **Use the CLI:**
   ```bash
   pnpm --filter pims-sync cli            # Interactive CLI
   ```

5. **Disable scheduler for local testing** (optional):
   ```bash
   ENABLE_SCHEDULER=false pnpm --filter pims-sync start
   ```

**API Key Setup:**

PIMS sync endpoints require API keys stored in the `clinic_api_keys` table:

```sql
-- Create an API key for a clinic
INSERT INTO clinic_api_keys (clinic_id, key_prefix, key_hash, permissions)
VALUES (
  'your-clinic-uuid',
  'abcd1234', -- First 8 chars of your key
  'sha256-hash-of-full-key',
  ARRAY['sync:inbound', 'sync:cases', 'sync:reconcile'] -- Or NULL for full access
);
```

Use the key in requests via the `X-API-Key` header.

**Per-Clinic Scheduler Setup:**

Configure automatic sync schedules per clinic in the `clinic_schedule_configs.sync_schedules` JSONB field:

```sql
-- Configure sync schedules for a clinic
UPDATE clinic_schedule_configs
SET sync_schedules = '[
  {"type": "inbound", "cron": "0 6 * * *", "enabled": true},
  {"type": "cases", "cron": "0 8,14,20 * * *", "enabled": true},
  {"type": "reconciliation", "cron": "0 2 * * *", "enabled": true}
]'::jsonb
WHERE clinic_id = 'your-clinic-uuid';
```

**Schedule Types:**

- `inbound` - Sync appointments to cases
- `cases` - Enrich cases with consultation data
- `reconciliation` - 7-day lookback to soft-delete orphaned cases

The scheduler polls for config changes every 5 minutes and automatically updates running jobs.

## Project Structure

```
src/
├── main.ts                    # Express entry point + graceful shutdown
├── config/                    # Zod env validation + constants
├── types/                     # TypeScript interfaces
├── lib/                       # Logger setup
├── middleware/                # Express middleware
│   ├── api-key-auth.ts        # X-API-Key authentication
│   └── index.ts               # Middleware exports
├── routes/                    # HTTP endpoints
│   ├── sync.route.ts          # POST /api/sync/* (new PIMS endpoints)
│   ├── scrape.route.ts        # POST /api/idexx/scrape (legacy)
│   ├── status.route.ts        # GET /api/idexx/status (legacy)
│   ├── health.route.ts        # GET /health, /ready
│   └── index.ts               # Route aggregation
├── services/                  # Business logic
│   ├── scrape.service.ts      # Legacy orchestration layer
│   ├── auth.service.ts        # IDEXX Neo authentication
│   ├── browser.service.ts     # Playwright wrapper + API client
│   ├── persistence.service.ts # Supabase operations + credentials
│   ├── browser-pool.service.ts# Browser instance pooling
│   └── sync-queue.service.ts  # Sync job queue management
├── scrapers/                  # API data fetchers (IDEXX-specific)
│   ├── schedule.scraper.ts    # Appointments + free slots
│   └── consultation.scraper.ts# Clinical data + notes
├── selectors/                 # DOM selectors (auth only)
│   └── login.selectors.ts     # Login form fields
├── utils/                     # Utilities
│   └── phone.ts               # Phone normalization
└── docs/                      # Documentation
    └── IDEXX_API_ENDPOINTS.md # API reference
```

**Domain Libraries (Nx):**

```
libs/
├── domain/sync/               # PIMS sync business logic
│   └── data-access/src/
│       ├── interfaces/        # IPimsProvider interface
│       └── services/          # InboundSyncService, CaseSyncService, etc.
└── integrations/idexx/        # IDEXX Neo provider implementation
    └── src/
        ├── providers/         # IdexxProvider (implements IPimsProvider)
        ├── browser-service.ts # Playwright browser automation
        └── transforms/        # IDEXX → domain transforms
```

### Architecture Flow

**New PIMS Sync Architecture:**

1. **Authentication** - API key validated against `clinic_api_keys` table
2. **Provider Creation** - IDEXX provider instantiated with encrypted credentials
3. **PIMS Authentication** - Playwright authenticates with PIMS web UI, captures session
4. **Three-Phase Sync**:
   - **Inbound**: Fetch appointments → Transform to domain model → Upsert cases
   - **Cases**: Query pending cases → Fetch consultation data → Enrich case metadata
   - **Reconciliation**: Query recent cases → Compare with PIMS → Soft-delete orphans
5. **Audit Logging** - Record sync stats to `case_sync_audits` table
6. **Cleanup** - Close browser, release resources

**Legacy Flow (IDEXX-specific):**

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

**New PIMS Sync Architecture (v4.0):**

```
┌─────────────┐     ┌────────────────────────────────────────────────────────┐
│   Caller    │────▶│          PIMS Sync Service (Provider-Agnostic)         │
│ (X-API-Key) │     │                                                        │
└─────────────┘     │  ┌──────────────┐  ┌─────────────────────────┐        │
                    │  │ Sync Routes  │──▶│   API Key Middleware    │        │
                    │  │ /api/sync/*  │  │  (clinic_api_keys)      │        │
                    │  └──────────────┘  └─────────┬───────────────┘        │
                    │                              ▼                         │
                    │             ┌────────────────────────────────┐         │
                    │             │   Domain Sync Services         │         │
                    │             │   (@odis-ai/domain/sync)       │         │
                    │             ├────────────────────────────────┤         │
                    │             │ • InboundSyncService           │         │
                    │             │ • CaseSyncService              │         │
                    │             │ • CaseReconciler               │         │
                    │             │ • SyncOrchestrator             │         │
                    │             └────────┬───────────────────────┘         │
                    │                      │                                 │
                    │                      ▼                                 │
                    │             ┌────────────────────┐                     │
                    │             │  IPimsProvider     │ ◀─ Generic Interface│
                    │             └────────┬───────────┘                     │
                    │                      │                                 │
                    └──────────────────────┼─────────────────────────────────┘
                                           │
                           ┌───────────────┴──────────────┐
                           ▼                              ▼
              ┌─────────────────────────┐    ┌──────────────────────────┐
              │   IDEXX Provider        │    │   Future Providers       │
              │   (@odis-ai/integrations│    │   (Cornerstone, ezyVet,  │
              │   /idexx)               │    │    AVImark, etc.)        │
              ├─────────────────────────┤    └──────────────────────────┘
              │ • IdexxProvider         │
              │ • BrowserService        │
              │ • Transforms            │
              └────────┬────────────────┘
                       │
                       ▼
              ┌─────────────────────┐
              │    IDEXX Neo        │
              │  ┌───────────────┐  │
              │  │ Web UI (auth) │  │
              │  ├───────────────┤  │
              │  │ Internal APIs │  │
              │  │ /appointments │  │
              │  │ /consultations│  │
              │  └───────────────┘  │
              └─────────────────────┘
                       │
                       ▼
              ┌──────────────────────┐
              │     Supabase         │
              │  ┌────────────────┐  │
              │  │ cases          │  │
              │  │ case_sync_audits│  │
              │  │ clinic_api_keys│  │
              │  │ pims_credentials│  │
              │  └────────────────┘  │
              └──────────────────────┘

Flow:
1. API key validated → clinic context attached
2. Domain service instantiated with provider
3. Provider authenticates with PIMS (Playwright + session capture)
4. Three-phase sync executes:
   • Inbound: Appointments → Cases (upsert)
   • Cases: Fetch consultations → Enrich metadata
   • Reconcile: Compare with PIMS → Soft-delete orphans
5. Audit trail persisted to case_sync_audits
6. Provider cleanup (close browser)
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
