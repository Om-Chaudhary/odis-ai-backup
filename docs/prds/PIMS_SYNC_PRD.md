## Overview

Refactor the pims-sync service into a modular, provider-agnostic sync server supporting multiple PIMS systems (IDEXX Neo, future: Cornerstone, ezyVet). Features proper logging (Axiom), external API triggers, and per-clinic scheduling for Railway deployment.

---

## Decisions Made

### Decision: API Authentication

**Choice:** X-API-Key header (hashed keys stored in clinic_api_keys table)

### Decision: Reconciliation Lookback

**Choice:** 7 days

### Decision: Extension Quick Sync

**Choice:** Keep permanently (coexist with server sync)

### Decision: Scheduling

**Choice:** Per-clinic configurable (stored in clinic_schedule_configs.sync_schedules)

---

## Current State Summary

### pims-sync app (apps/pims-sync)

- Express server on port 3001 with Playwright automation
- Inbound schedule sync (2-week calendar availability) - only Alum Rock
- CLI runner with rich TUI
- Docker configuration exists (Playwright base image)
- Browser pool + sync queue management
- No external API authentication
- Logging via @odis-ai/shared/logger (console only, no Axiom)

### Chrome Extension Quick Sync (odis-ai-extension)

- 3-phase sync: fetch appointments → check existing cases → sync remaining
- Calls /api/cases/ingest endpoint on web backend
- Consultation/client/patient fetchers
- Status-based filtering (only finalized appointments)
- Reconciliation with deduplication by external_id

---

## Target Architecture (Nx Best Practices)

Following Nx monorepo patterns: extract reusable code into libs, keep app thin.

### New/Extended Libs

```
libs/
├── integrations/
│   ├── idexx/                       # EXTEND EXISTING
│   │   └── src/
│   │       ├── index.ts             # Re-exports
│   │       ├── credential-manager.ts # (existing)
│   │       ├── transformer.ts        # (existing)
│   │       ├── types.ts              # (existing) + PimsAppointment, PimsConsultation
│   │       ├── validation.ts         # (existing)
│   │       ├── provider/             # NEW: PIMS provider implementation
│   │       │   ├── index.ts
│   │       │   ├── idexx-neo.provider.ts  # IPimsProvider implementation
│   │       │   ├── auth.service.ts        # Playwright auth (move from app)
│   │       │   ├── schedule.client.ts     # /appointments/getCalendarEventData
│   │       │   ├── consultation.client.ts # /consultations/{id}/page-data
│   │       │   └── selectors.ts           # DOM selectors
│   │       └── browser/              # NEW: Browser management
│   │           ├── browser.service.ts
│   │           └── browser-pool.service.ts
│   │
│   └── axiom/                        # NEW LIB
│       ├── project.json              # tags: type:integration, scope:server
│       └── src/
│           ├── index.ts
│           ├── axiom.transport.ts    # Axiom log transport
│           └── types.ts
│
├── domain/
│   └── sync/                         # NEW LIB
│       └── data-access/
│           ├── project.json          # tags: type:service, scope:server
│           └── src/
│               ├── index.ts
│               ├── types.ts          # IPimsProvider interface, sync types
│               ├── inbound-sync.service.ts    # Schedule/slot sync
│               ├── case-sync.service.ts       # Case ingestion orchestrator
│               ├── case-reconciler.service.ts # 7-day lookback
│               └── transformers/
│                   └── appointment-to-ingest.ts
│
└── shared/
    └── logger/                       # EXTEND EXISTING
        └── src/
            ├── index.ts              # Add Axiom-aware logger factory
            └── transports/           # NEW
                └── axiom.transport.ts
```

### App Structure (Thin Orchestration Layer)

```
apps/pims-sync/src/
├── main.ts                          # Express app entry
├── config/
│   ├── index.ts                     # Env config (AXIOM_*, API_KEY, etc.)
│   └── constants.ts                 # URLs, defaults
│
├── middleware/
│   └── api-auth.middleware.ts       # X-API-Key authentication
│
├── routes/
│   ├── index.ts                     # Route aggregator
│   ├── health.route.ts              # Health checks (existing)
│   ├── inbound-sync.route.ts        # Inbound sync endpoints
│   ├── case-sync.route.ts           # Case ingestion endpoints
│   └── reconciliation.route.ts      # Reconciliation endpoints
│
├── scheduler/                       # Per-clinic cron scheduling
│   ├── index.ts
│   ├── sync-scheduler.ts
│   └── config-loader.ts             # Load schedules from clinic_schedule_configs
│
├── services/
│   ├── sync-queue.service.ts        # Concurrency control (existing)
│   └── clinic-config.service.ts     # Per-clinic config loading
│
├── cli/                             # CLI runner (existing)
│   └── cli-runner.mjs
│
└── types/
    └── index.ts
```

### Import Paths (following project conventions)

```tsx
// From libs/integrations/idexx
import { IdexxNeoProvider, IPimsProvider } from "@odis-ai/integrations/idexx";
import {
  BrowserService,
  BrowserPool,
} from "@odis-ai/integrations/idexx/browser";
import { credentialManager } from "@odis-ai/integrations/idexx";

// From libs/integrations/axiom (new)
import { AxiomTransport } from "@odis-ai/integrations/axiom";

// From libs/domain/sync (new)
import {
  InboundSyncService,
  CaseSyncService,
  CaseReconciler,
} from "@odis-ai/domain/sync";
import type { SyncResult, ReconciliationResult } from "@odis-ai/domain/sync";

// From libs/shared/logger (extended)
import { createLogger, createAxiomLogger } from "@odis-ai/shared/logger";
```

---

## API Endpoints

### Authentication

All sync endpoints require **X-API-Key** header with hashed key stored in `clinic_api_keys` table.

### Inbound Sync Module

**POST** `/api/sync/inbound`

- Headers: `X-API-Key: <key>`
- Body: `{ dateRange?: { start, end }, forceFullSync?: boolean }`
- Response: `{ success, syncId, stats, durationMs }`

**GET** `/api/sync/inbound/:syncId`

- Headers: `X-API-Key: <key>`
- Response: `{ syncId, status, progress, stats }`

**GET** `/api/sync/inbound/:syncId/stream`

- Response: SSE event stream (existing)

### Case Ingestion Module

**POST** `/api/sync/cases`

- Headers: `X-API-Key: <key>`
- Body: `{ startDate: string, endDate: string, parallelBatchSize?: number }`
- Response: `{ success, syncId, stats: { total, created, updated, skipped, failed, deleted }, durationMs }`

**GET** `/api/sync/cases/:syncId`

- Headers: `X-API-Key: <key>`
- Response: `{ syncId, status, progress, stats }`

### Reconciliation

**POST** `/api/sync/reconciliation`

- Headers: `X-API-Key: <key>`
- Body: `{ lookbackDays?: number }` (defaults to 7)
- Response: `{ success, syncId, stats, durationMs }`

### Health & Metrics (no auth)

- **GET** `/health` - Health check (uptime, memory, version)
- **GET** `/ready` - Readiness probe (DB + browser pool)
- **GET** `/metrics` - Prometheus metrics

---

## Database Schema Additions

### 1. Clinic API Keys Table

```sql
CREATE TABLE clinic_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,                    -- e.g., "IDEXX Sync Server"
  key_hash text NOT NULL UNIQUE,         -- SHA-256 hash
  key_prefix text NOT NULL,              -- First 8 chars (e.g., "odis_sk_")
  permissions text[] DEFAULT ARRAY['sync:inbound', 'sync:cases'],
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2. Add sync_schedules to clinic_schedule_configs

```sql
ALTER TABLE clinic_schedule_configs
ADD COLUMN sync_schedules jsonb DEFAULT '[]'::jsonb;
-- Format: [{ "type": "inbound"|"cases", "cron": "0 6 * * *", "enabled": true }]
```

### 3. Case Sync Audits Table

```sql
CREATE TABLE case_sync_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  sync_id uuid NOT NULL REFERENCES schedule_syncs(id),
  sync_type text CHECK (sync_type IN ('quick', 'full', 'reconciliation')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  appointments_found int DEFAULT 0,
  cases_created int DEFAULT 0,
  cases_updated int DEFAULT 0,
  cases_skipped int DEFAULT 0,
  cases_deleted int DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms int
);
```

---

## Scheduling (Per-Clinic)

### Configuration (stored in clinic_schedule_configs.sync_schedules)

```json
[
  { "type": "inbound", "cron": "0 6 * * *", "enabled": true },
  { "type": "cases", "cron": "0 8,14,20 * * *", "enabled": true },
  { "type": "reconciliation", "cron": "0 2 * * *", "enabled": true }
]
```

### Scheduler Service

- On startup: load all clinic configs, create cron jobs
- Watch for config changes (polling every 5 minutes)
- Each cron job calls internal sync service with clinic context

---

## Logging (Axiom Integration)

### Logger with Axiom Transport

```tsx
// lib/logger.ts - wraps @odis-ai/shared/logger with Axiom
class AxiomTransport {
  private buffer: LogEntry[] = [];

  log(entry: LogEntry) {
    this.buffer.push({ ...entry, _time: new Date().toISOString() });
    if (this.buffer.length >= 100) this.flush();
  }

  async flush() {
    await fetch(`https://api.axiom.co/v1/datasets/${dataset}/ingest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(this.buffer),
    });
    this.buffer = [];
  }
}
```

### Namespaced Loggers

```tsx
export const logger = new EnhancedLogger("pims-sync");
export const browserLogger = logger.child("browser");
export const authLogger = logger.child("auth");
export const scheduleLogger = logger.child("schedule");
export const caseLogger = logger.child("case-sync");
export const reconciliationLogger = logger.child("reconciliation");
```

---

## PIMS Provider Interface

**Location:** `libs/domain/sync/data-access/src/types.ts`

```tsx
// Interface for all PIMS providers (IDEXX Neo, future: Avimark, Cornerstone)
export interface IPimsProvider {
  readonly name: string; // 'idexx-neo', 'ezyvet', etc.

  // Authentication
  authenticate(credentials: PimsCredentials): Promise<boolean>;
  isAuthenticated(): boolean;

  // Schedule operations (Inbound Module)
  fetchScheduleConfig(): Promise<PimsScheduleConfig | null>;
  fetchAppointments(startDate: Date, endDate: Date): Promise<PimsAppointment[]>;

  // Consultation operations (Case Ingestion Module)
  fetchConsultation(consultationId: string): Promise<PimsConsultation | null>;

  // Cleanup
  close(): Promise<void>;
}

export interface PimsAppointment {
  id: string;
  consultationId: string | null;
  date: string; // YYYY-MM-DD
  startTime: Date | null;
  duration: number | null; // minutes
  status: string;
  patient: {
    id: string | null;
    name: string | null;
    species: string | null;
    breed: string | null;
  };
  client: {
    id: string | null;
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  provider: { id: string | null; name: string | null };
  type: string | null;
  reason: string | null;
}

export interface PimsConsultation {
  id: string;
  notes: string | null;
  productsServices: string | null;
  declinedProductsServices: string | null;
  status: string;
}
```

---

## Migration: Extension → Libs

### Files to Port

| Extension File           | Target Lib                                                  |
| ------------------------ | ----------------------------------------------------------- |
| schedule-sync-service.ts | libs/domain/sync/data-access/src/case-sync.service.ts       |
| consultation-fetcher.ts  | libs/integrations/idexx/src/provider/consultation.client.ts |
| idexx-api-client.ts      | libs/integrations/idexx/src/provider/schedule.client.ts     |
| appointment-to-ingest.ts | libs/domain/sync/data-access/src/transformers/              |

### Files to Move from App → Libs

| App File                          | Target Lib                                               |
| --------------------------------- | -------------------------------------------------------- |
| services/browser.service.ts       | libs/integrations/idexx/src/browser/                     |
| services/browser-pool.service.ts  | libs/integrations/idexx/src/browser/                     |
| services/auth.service.ts          | libs/integrations/idexx/src/provider/                    |
| services/schedule-sync.service.ts | libs/domain/sync/data-access/src/inbound-sync.service.ts |

### Key Changes

- Remove DOM extraction (API-only via Playwright authenticated session)
- Call Supabase directly via repository pattern (not web API)
- Add Axiom logging via @odis-ai/integrations/axiom
- Implement IPimsProvider interface in IDEXX Neo provider

---

## Railway Deployment

### Environment Variables (additions)

| Variable         | Required | Description                           |
| ---------------- | -------- | ------------------------------------- |
| AXIOM_API_TOKEN  | No       | Axiom API token                       |
| AXIOM_DATASET    | No       | Dataset name (default: pims-sync)     |
| ENABLE_SCHEDULER | No       | Enable cron scheduler (default: true) |

### Docker Updates

- Add Axiom env vars to Dockerfile
- Existing Playwright base image works for Railway

---

## Implementation Phases

### Phase 1: Foundation & Nx Libs Setup

- Create database migrations (clinic_api_keys, sync_schedules, case_sync_audits)
- Create libs/integrations/axiom lib (nx g @nx/node:lib)
  - tags: type:integration, scope:server, platform:node
  - Implement AxiomTransport class
- Extend libs/shared/logger with Axiom transport support
- Create libs/domain/sync/data-access lib (nx g @nx/node:lib)
  - tags: type:service, scope:server, platform:node
  - Add IPimsProvider interface and sync types
- Update tsconfig.base.json with new path mappings

### Phase 2: Extend libs/integrations/idexx

- Add provider/ directory with:
  - idexx-neo.provider.ts (implements IPimsProvider)
  - auth.service.ts (move from app)
  - schedule.client.ts (port from extension)
  - consultation.client.ts (port from extension)
  - selectors.ts (move from app)
- Add browser/ directory with:
  - browser.service.ts (move from app)
  - browser-pool.service.ts (move from app)
- Update index.ts exports
- Update project.json implicit dependencies

### Phase 3: Implement libs/domain/sync Services

- Create inbound-sync.service.ts (refactor from app's schedule-sync)
- Create case-sync.service.ts (port from extension)
- Create case-reconciler.service.ts (7-day lookback)
- Create transformers/appointment-to-ingest.ts
- Add comprehensive tests

### Phase 4: Refactor apps/pims-sync (Thin App)

- Create middleware/api-auth.middleware.ts
- Create routes/inbound-sync.route.ts with API key auth
- Create routes/case-sync.route.ts with API key auth
- Create routes/reconciliation.route.ts
- Update main.ts to use lib services
- Remove code moved to libs

### Phase 5: Per-Clinic Scheduler

- Create scheduler/config-loader.ts (load from sync_schedules)
- Create scheduler/sync-scheduler.ts (node-cron per clinic)
- Add health monitoring for scheduled jobs

### Phase 6: Deployment & Testing

- Update apps/pims-sync/project.json implicitDependencies
- Update Docker configuration with Axiom env vars
- Create railway.toml config
- Run nx affected -t lint,test,typecheck
- Integration test with Alum Rock clinic
- Run pnpm docs:nx to regenerate inventory

---

## New Nx Projects to Create

### libs/integrations/axiom

```json
{
  "name": "integrations-axiom",
  "projectType": "library",
  "tags": ["type:integration", "scope:server", "platform:node"],
  "sourceRoot": "libs/integrations/axiom/src"
}
```

### libs/domain/sync/data-access

```json
{
  "name": "domain-sync-data-access",
  "projectType": "library",
  "tags": ["type:service", "scope:server", "platform:node"],
  "sourceRoot": "libs/domain/sync/data-access/src"
}
```

### tsconfig.base.json Path Additions

```json
{
  "@odis-ai/integrations/axiom": ["libs/integrations/axiom/src/index.ts"],
  "@odis-ai/integrations/idexx/provider": [
    "libs/integrations/idexx/src/provider/index.ts"
  ],
  "@odis-ai/integrations/idexx/browser": [
    "libs/integrations/idexx/src/browser/index.ts"
  ],
  "@odis-ai/domain/sync": ["libs/domain/sync/data-access/src/index.ts"]
}
```

---

## Critical Files

### Move to libs/integrations/idexx

| Purpose               | Path                                                 |
| --------------------- | ---------------------------------------------------- |
| Schedule sync service | apps/pims-sync/src/services/schedule-sync.service.ts |
| Browser service       | apps/pims-sync/src/services/browser.service.ts       |
| Browser pool          | apps/pims-sync/src/services/browser-pool.service.ts  |
| Auth service          | apps/pims-sync/src/services/auth.service.ts          |

### Port from extension

| Purpose              | Path                                           |
| -------------------- | ---------------------------------------------- |
| Case sync logic      | odis-ai-extension/.../schedule-sync-service.ts |
| Consultation fetcher | odis-ai-extension/.../consultation-fetcher.ts  |
| IDEXX API client     | odis-ai-extension/.../idexx-api-client.ts      |

### Reference (existing)

| Purpose            | Path                                              |
| ------------------ | ------------------------------------------------- |
| Credential manager | libs/integrations/idexx/src/credential-manager.ts |
| Ingest API         | apps/web/src/app/api/cases/ingest/route.ts        |
| Shared logger      | libs/shared/logger/src/index.ts                   |

---

## Verification Plan

1. **Nx Graph:** `nx graph` - verify no circular dependencies
2. **Affected Tests:** `nx affected -t lint,test,typecheck`
3. **Unit Tests:** Mock Supabase + IDEXX API in each lib
4. **Integration Test:** Full sync flow with Alum Rock clinic
5. **E2E Test:** API trigger → verify data in Supabase
6. **Axiom Dashboard:** Create dashboard for sync metrics
7. **Railway Deploy:** Test /health and /ready endpoints
8. **Docs:** Run `pnpm docs:nx` to update NX\_[PROJECTS.md](http://PROJECTS.md)
