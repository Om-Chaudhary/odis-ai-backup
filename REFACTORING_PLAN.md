# IDEXX-Sync Service Refactoring Plan

## Overview

Transform idexx-sync from a monolithic Express app into a modular, library-driven sync server following Nx best practices.

## Status: IN PROGRESS

Started: 2026-01-17

---

## Phase 1: Foundation (Weeks 1-2)

### 1.1 Create Nx Libraries

#### libs/integrations/axiom

- **Purpose**: Axiom logging transport for structured observability
- **Status**: PENDING
- **Files to create**:
  - `libs/integrations/axiom/project.json`
  - `libs/integrations/axiom/src/index.ts`
  - `libs/integrations/axiom/src/client.ts` - AxiomClient wrapper
  - `libs/integrations/axiom/src/transport.ts` - Winston/Pino transport
  - `libs/integrations/axiom/src/__tests__/client.test.ts`

#### libs/domain/sync/data-access

- **Purpose**: Core sync orchestration services
- **Status**: PENDING
- **Files to create**:
  - `libs/domain/sync/data-access/project.json`
  - `libs/domain/sync/data-access/src/index.ts`
  - `libs/domain/sync/data-access/src/interfaces/i-pims-provider.ts`
  - `libs/domain/sync/data-access/src/services/inbound-sync.service.ts`
  - `libs/domain/sync/data-access/src/services/case-sync.service.ts`
  - `libs/domain/sync/data-access/src/services/case-reconciler.service.ts`
  - `libs/domain/sync/data-access/src/__tests__/`

#### Extend libs/integrations/idexx

- **Purpose**: Add provider and browser automation modules
- **Status**: PENDING
- **New modules**:
  - `libs/integrations/idexx/src/provider/` - IdexxNeoProvider
  - `libs/integrations/idexx/src/browser/` - Browser automation services
  - `libs/integrations/idexx/src/auth/` - Authentication service

### 1.2 Database Migrations

#### Migration 001: clinic_api_keys

```sql
CREATE TABLE clinic_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL UNIQUE,
  key_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  UNIQUE(clinic_id, api_key)
);

CREATE INDEX idx_clinic_api_keys_clinic_id ON clinic_api_keys(clinic_id);
CREATE INDEX idx_clinic_api_keys_api_key ON clinic_api_keys(api_key) WHERE is_active = true;
```

#### Migration 002: sync_schedules column

```sql
ALTER TABLE clinic_schedule_configs
ADD COLUMN sync_schedules JSONB DEFAULT '{
  "inbound": "*/15 * * * *",
  "cases": "0 */2 * * *",
  "reconciliation": "0 2 * * *"
}'::jsonb;

COMMENT ON COLUMN clinic_schedule_configs.sync_schedules IS 'Cron schedules per sync type';
```

#### Migration 003: case_sync_audits

```sql
CREATE TABLE case_sync_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('create', 'update', 'reconcile')),
  external_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT now(),
  duration_ms INTEGER
);

CREATE INDEX idx_case_sync_audits_clinic_id ON case_sync_audits(clinic_id);
CREATE INDEX idx_case_sync_audits_case_id ON case_sync_audits(case_id);
CREATE INDEX idx_case_sync_audits_synced_at ON case_sync_audits(synced_at DESC);
```

### 1.3 TypeScript Configuration

Update `tsconfig.base.json` paths:

```json
{
  "@odis-ai/integrations/axiom": ["libs/integrations/axiom/src/index.ts"],
  "@odis-ai/integrations/axiom/*": ["libs/integrations/axiom/src/*"],
  "@odis-ai/domain/sync": ["libs/domain/sync/data-access/src/index.ts"],
  "@odis-ai/domain/sync/*": ["libs/domain/sync/data-access/src/*"]
}
```

---

## Phase 2: Extend IDEXX Integration (Weeks 2-3)

### 2.1 Browser Automation Module

**Files to create/move**:

- `libs/integrations/idexx/src/browser/browser-pool.service.ts`
- `libs/integrations/idexx/src/browser/browser-context.service.ts`
- `libs/integrations/idexx/src/browser/browser-config.ts`
- `libs/integrations/idexx/src/browser/page-actions.ts`

**Migrate from**: `apps/idexx-sync/src/services/browser-pool.service.ts`

### 2.2 Authentication Module

**Files to create/move**:

- `libs/integrations/idexx/src/auth/auth.service.ts`
- `libs/integrations/idexx/src/auth/credential-store.ts`
- `libs/integrations/idexx/src/auth/session-manager.ts`

**Migrate from**: Extension auth logic + app auth

### 2.3 Provider Module (IPimsProvider Implementation)

**Files to create**:

- `libs/integrations/idexx/src/provider/idexx-neo-provider.ts`
- `libs/integrations/idexx/src/provider/schedule-scraper.ts`
- `libs/integrations/idexx/src/provider/case-scraper.ts`
- `libs/integrations/idexx/src/provider/mappers.ts`

**Interface contract**:

```typescript
export interface IPimsProvider {
  syncInboundSchedule(clinicId: string, date: Date): Promise<SyncResult>;
  syncCases(clinicId: string, options: CaseSyncOptions): Promise<SyncResult>;
  reconcileCases(
    clinicId: string,
    lookbackDays: number,
  ): Promise<ReconciliationResult>;
}
```

---

## Phase 3: Implement Sync Services (Weeks 3-4)

### 3.1 InboundSyncService

**File**: `libs/domain/sync/data-access/src/services/inbound-sync.service.ts`

**Responsibilities**:

- Orchestrate schedule/slot synchronization
- Coordinate with IPimsProvider
- Update database via repository pattern
- Log to Axiom

**Dependencies**:

- `IScheduleRepository` (data-access)
- `IPimsProvider` (injected)
- `AxiomClient` (integrations/axiom)

### 3.2 CaseSyncService

**File**: `libs/domain/sync/data-access/src/services/case-sync.service.ts`

**Responsibilities**:

- Orchestrate case ingestion
- Transform external data → ODIS format
- Create/update cases via CasesService
- Audit trail via case_sync_audits

**Dependencies**:

- `CasesService` (domain/cases)
- `IPimsProvider` (injected)
- `ICaseSyncAuditRepository`

### 3.3 CaseReconciler

**File**: `libs/domain/sync/data-access/src/services/case-reconciler.service.ts`

**Responsibilities**:

- 7-day lookback reconciliation
- Detect discrepancies
- Report + auto-fix or alert

**Dependencies**:

- `CasesRepository`
- `IPimsProvider`
- `SlackClient` (notifications)

---

## Phase 4: Refactor App Layer (Weeks 4-5)

### 4.1 API Layer Restructure

**New structure**:

```
apps/idexx-sync/src/
  main.ts                    # Express server bootstrap
  config/
    env.config.ts           # Environment validation
  middleware/
    api-key-auth.ts         # X-API-Key authentication
    error-handler.ts        # Global error handling
    request-logger.ts       # Axiom request logging
  routes/
    sync.routes.ts          # Sync endpoints
    health.routes.ts        # Health/ready/metrics
  controllers/
    inbound-sync.controller.ts
    case-sync.controller.ts
    reconciliation.controller.ts
```

### 4.2 API Endpoints

#### POST /api/sync/inbound

- Authenticate via X-API-Key
- Validate request body
- Call `InboundSyncService.execute()`
- Return sync result + job ID

#### POST /api/sync/cases

- Authenticate via X-API-Key
- Validate request body
- Call `CaseSyncService.execute()`
- Return sync result

#### POST /api/sync/reconciliation

- Admin/internal only
- Trigger reconciliation job
- Return job status

#### GET /health, /ready, /metrics

- Health: Service alive
- Ready: DB + dependencies healthy
- Metrics: Queue depth, sync stats

### 4.3 Dependency Injection Setup

**File**: `apps/idexx-sync/src/di/container.ts`

```typescript
export function createContainer() {
  const supabase = createServiceClient();

  // Repositories
  const casesRepo = new CasesRepository(supabase);
  const scheduleRepo = new ScheduleRepository(supabase);
  const auditRepo = new CaseSyncAuditRepository(supabase);

  // Providers
  const idexxProvider = new IdexxNeoProvider(browserPool, authService);

  // Services
  const casesService = new CasesService(casesRepo);
  const inboundSyncService = new InboundSyncService(
    scheduleRepo,
    idexxProvider,
  );
  const caseSyncService = new CaseSyncService(
    casesService,
    idexxProvider,
    auditRepo,
  );
  const reconciler = new CaseReconciler(casesRepo, idexxProvider);

  return {
    inboundSyncService,
    caseSyncService,
    reconciler,
  };
}
```

---

## Phase 5: Scheduler Implementation (Week 5)

### 5.1 Cron Scheduler

**File**: `apps/idexx-sync/src/scheduler/cron-scheduler.ts`

**Responsibilities**:

- Load per-clinic schedules from `clinic_schedule_configs.sync_schedules`
- Register cron jobs dynamically
- Trigger sync services on schedule
- Handle errors + retries

**Example**:

```typescript
export class CronScheduler {
  async initialize() {
    const clinics = await this.loadClinicSchedules();

    for (const clinic of clinics) {
      const { inbound, cases, reconciliation } = clinic.sync_schedules;

      // Inbound sync
      cron.schedule(inbound, () => this.runInboundSync(clinic.id));

      // Case sync
      cron.schedule(cases, () => this.runCaseSync(clinic.id));

      // Reconciliation
      cron.schedule(reconciliation, () => this.runReconciliation(clinic.id));
    }
  }
}
```

### 5.2 Schedule Configuration

**Database-driven**:

- Fetch from `clinic_schedule_configs.sync_schedules`
- Hot-reload on config change
- Per-clinic customization

---

## Phase 6: Deployment & Verification (Week 6)

### 6.1 Docker Configuration

Update `apps/idexx-sync/Dockerfile`:

- Multi-stage build with Playwright
- Bundle new libs
- Environment validation

### 6.2 Verification Checklist

- [ ] All tests pass (`nx test idexx-sync`)
- [ ] All libs have tests (`nx run-many -t test --projects=tag:scope:sync`)
- [ ] TypeScript compiles (`nx typecheck:all`)
- [ ] Lint passes (`nx lint:all`)
- [ ] Docker builds successfully
- [ ] Health endpoints respond
- [ ] API key auth works
- [ ] Scheduler triggers jobs
- [ ] Axiom receives logs
- [ ] Sync audits populate

### 6.3 Migration Strategy

**Staged rollout**:

1. Deploy side-by-side with old service
2. Test with single clinic (canary)
3. Gradually migrate clinics
4. Monitor Axiom dashboards
5. Decommission old service

---

## Testing Strategy

### Unit Tests (70%+ coverage)

- `libs/integrations/axiom`: Client + transport
- `libs/integrations/idexx/provider`: IdexxNeoProvider
- `libs/domain/sync`: All services
- `apps/idexx-sync/middleware`: API key auth

### Integration Tests

- Full sync flow (schedule → DB)
- Case ingestion (IDEXX → ODIS)
- Reconciliation with discrepancies
- Scheduler job execution

### E2E Tests

- API endpoint contracts
- Authentication flows
- Error handling
- Graceful shutdown

---

## Dependencies Graph

```
apps/idexx-sync
├── libs/domain/sync/data-access
│   ├── libs/domain/cases/data-access
│   ├── libs/data-access/repository-impl
│   └── libs/integrations/idexx/provider
├── libs/integrations/axiom
└── libs/integrations/idexx
    ├── libs/integrations/idexx/browser
    ├── libs/integrations/idexx/auth
    └── libs/integrations/idexx/provider
```

---

## Risks & Mitigations

| Risk                   | Mitigation                                  |
| ---------------------- | ------------------------------------------- |
| Breaking existing sync | Side-by-side deployment, gradual migration  |
| Performance regression | Load testing, Axiom metrics monitoring      |
| Browser pool stability | Enhanced error handling, connection pooling |
| Scheduler reliability  | Dead letter queue, alerting via Slack       |
| Auth migration         | Comprehensive credential migration script   |

---

## Success Metrics

- Sync success rate > 95%
- Average sync duration < 2 minutes
- Zero data loss during migration
- Test coverage > 70%
- Zero critical bugs in first week
- Scheduler uptime > 99.9%

---

## Timeline

| Phase                    | Duration | Completion Date |
| ------------------------ | -------- | --------------- |
| Phase 1: Foundation      | 2 weeks  | Week 2          |
| Phase 2: IDEXX Extension | 1 week   | Week 3          |
| Phase 3: Sync Services   | 1 week   | Week 4          |
| Phase 4: App Refactor    | 1 week   | Week 5          |
| Phase 5: Scheduler       | 1 week   | Week 5          |
| Phase 6: Deployment      | 1 week   | Week 6          |

**Total: 6 weeks**

---

## Next Actions

1. Create libs/integrations/axiom library
2. Create libs/domain/sync/data-access library
3. Run database migrations (clinic_api_keys, sync_schedules, case_sync_audits)
4. Update tsconfig.base.json paths
5. Begin browser module migration
