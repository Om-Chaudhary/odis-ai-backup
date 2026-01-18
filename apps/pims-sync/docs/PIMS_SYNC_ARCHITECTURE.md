# PIMS Sync Architecture

> Architectural overview of the PIMS Sync Service v4.0

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Patterns](#architecture-patterns)
- [Component Layers](#component-layers)
- [Sync Pipeline](#sync-pipeline)
- [Provider Interface](#provider-interface)
- [Data Flow](#data-flow)
- [Security Model](#security-model)
- [Extensibility](#extensibility)

---

## System Overview

The PIMS Sync Service is a provider-agnostic microservice that synchronizes veterinary appointment and case data from Practice Information Management Systems (PIMS) to the Supabase database.

### Design Goals

1. **Provider Agnostic** - Support multiple PIMS vendors through a common interface
2. **Three-Phase Sync** - Inbound → Enrichment → Reconciliation pipeline
3. **Idempotent** - Safe to re-run syncs without data corruption
4. **Auditable** - Complete sync history and audit trail
5. **Secure** - API key authentication with granular permissions
6. **Maintainable** - Clean separation between app, domain, and integration layers

### Key Characteristics

- **Stateless** - No session state between requests
- **Asynchronous** - Long-running syncs use background jobs
- **Resilient** - Graceful degradation and error recovery
- **Observable** - Comprehensive logging and metrics

---

## Architecture Patterns

### Hexagonal Architecture (Ports & Adapters)

The system follows hexagonal architecture principles:

```
┌─────────────────────────────────────────────────────────┐
│                  Domain Core (Ports)                    │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  IPimsProvider (Port)                            │  │
│  │  • authenticate(credentials)                     │  │
│  │  • fetchAppointments(dateRange)                  │  │
│  │  • fetchConsultation(id)                         │  │
│  │  • close()                                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Sync Services                                   │  │
│  │  • InboundSyncService                            │  │
│  │  • CaseSyncService                               │  │
│  │  • CaseReconciler                                │  │
│  │  • SyncOrchestrator                              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
                    │                    │
    ┌───────────────┴────────┐  ┌────────┴────────────┐
    │                        │  │                     │
    ▼                        ▼  ▼                     ▼
┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐
│  IDEXX Provider │  │  Future Provider  │  │  REST API Layer   │
│  (Adapter)      │  │  (Adapter)        │  │  (Adapter)        │
│                 │  │                   │  │                   │
│  • IdexxProvider│  │  • VetspireProvider│ │  • Sync Routes    │
│  • BrowserSvc   │  │  • CornerProvider │  │  • API Key Auth   │
│  • Transforms   │  │  • ...            │  │  • Error Handling │
└─────────────────┘  └──────────────────┘  └───────────────────┘
```

### Dependency Injection

Services accept interfaces, not concrete implementations:

```typescript
// ✅ Good - Accepts interface
class InboundSyncService {
  constructor(
    private supabase: SupabaseClient,
    private provider: IPimsProvider, // Interface, not IdexxProvider
    private clinicId: string,
  ) {}
}

// ❌ Bad - Tight coupling
class InboundSyncService {
  constructor(
    private supabase: SupabaseClient,
    private provider: IdexxProvider, // Concrete implementation
    private clinicId: string,
  ) {}
}
```

### Three-Phase Pipeline

The sync process is decomposed into three independent phases:

```
┌─────────────┐    ┌──────────────┐    ┌──────────────────┐
│  Inbound    │───▶│  Case Sync   │───▶│  Reconciliation  │
│             │    │              │    │                  │
│ Appointments│    │ Consultation │    │  Orphan         │
│ → Cases     │    │ Enrichment   │    │  Cleanup        │
│             │    │              │    │                  │
│ Creates/    │    │ Fetches SOAP │    │  Soft-deletes   │
│ Updates     │    │ notes, vitals│    │  removed cases  │
└─────────────┘    └──────────────┘    └──────────────────┘
```

Each phase:

- Can run independently
- Is idempotent (safe to re-run)
- Has its own audit record
- Returns structured results

---

## Component Layers

### Layer 1: API Routes (`apps/pims-sync/src/routes`)

Thin HTTP handlers that:

- Validate request bodies
- Authenticate API keys
- Delegate to domain services
- Transform responses

**Responsibilities:**

- HTTP concerns only
- No business logic
- Middleware composition
- Error response formatting

**Example:**

```typescript
// apps/pims-sync/src/routes/sync.route.ts
syncRouter.post(
  "/inbound",
  async (req: AuthenticatedRequest, res: Response) => {
    const { clinic } = req;
    const body = req.body as InboundSyncRequest;

    // 1. Create provider
    const { provider, cleanup } = await createProviderForClinic(clinic.id);

    try {
      // 2. Authenticate with PIMS
      await provider.authenticate(credentials);

      // 3. Delegate to domain service
      const syncService = new InboundSyncService(supabase, provider, clinic.id);
      const result = await syncService.sync({ dateRange });

      // 4. Return result
      res.json(result);
    } finally {
      // 5. Cleanup
      await cleanup();
    }
  },
);
```

### Layer 2: Domain Services (`libs/domain/sync/data-access/src`)

Business logic layer that:

- Orchestrates sync operations
- Enforces business rules
- Manages transactions
- Logs audit trails

**Responsibilities:**

- Sync orchestration
- Data transformation
- Error recovery
- Audit logging

**Example:**

```typescript
// libs/domain/sync/data-access/src/services/inbound-sync.service.ts
export class InboundSyncService {
  async sync(options?: InboundSyncOptions): Promise<SyncResult> {
    // 1. Create audit record
    const auditId = await this.createAuditRecord("inbound");

    try {
      // 2. Fetch appointments from PIMS
      const appointments = await this.provider.fetchAppointments(dateRange);

      // 3. Transform to domain model
      const cases = appointments.map((apt) => this.transformToCaseInput(apt));

      // 4. Upsert to database
      const { created, updated } = await this.upsertCases(cases);

      // 5. Update audit record
      await this.completeAuditRecord(auditId, { created, updated });

      return { success: true, stats: { created, updated } };
    } catch (error) {
      await this.failAuditRecord(auditId, error);
      throw error;
    }
  }
}
```

### Layer 3: Provider Implementations (`libs/integrations/*/src`)

PIMS-specific integration code that:

- Implements `IPimsProvider` interface
- Handles authentication
- Makes API/scraping calls
- Transforms PIMS data to domain model

**Responsibilities:**

- PIMS authentication
- Data fetching
- Vendor-specific transforms
- Browser automation (if needed)

**Example:**

```typescript
// libs/integrations/idexx/src/providers/idexx-provider.ts
export class IdexxProvider implements IPimsProvider {
  async authenticate(credentials: PimsCredentials): Promise<boolean> {
    // Playwright login flow
    await this.browserService.navigate("/login");
    await this.browserService.fillForm(credentials);
    return this.browserService.isAuthenticated();
  }

  async fetchAppointments(dateRange: DateRange): Promise<PimsAppointment[]> {
    // Call IDEXX internal API
    const response = await this.browserService.apiCall("/appointments", {
      startDate: dateRange.start,
      endDate: dateRange.end,
    });

    // Transform IDEXX format to domain format
    return response.data.map((apt) => this.transformAppointment(apt));
  }
}
```

### Layer 4: Shared Infrastructure (`libs/shared/*`)

Cross-cutting concerns:

- Database client (`@odis-ai/data-access/db`)
- Logging (`@odis-ai/shared/logger`)
- Utilities (`@odis-ai/shared/util`)
- Types (`@odis-ai/shared/types`)

---

## Sync Pipeline

### Phase 1: Inbound Sync

**Goal**: Sync appointments from PIMS to cases table

```
PIMS Appointments ──▶ Transform ──▶ Upsert Cases
                         │
                         ├─ Map status (scheduled → draft)
                         ├─ Map type (exam → checkup)
                         ├─ Extract patient data
                         └─ Extract client data

Upsert Logic:
  - If case with pims_id exists → UPDATE
  - If no case with pims_id → INSERT
  - Use pims_id as unique constraint
```

**Key Decisions:**

1. **Upsert Strategy** - Use `pims_id` as deduplication key
2. **Status Mapping** - PIMS statuses → CaseStatus enum
3. **Type Mapping** - PIMS types → CaseType enum
4. **Visibility** - All synced cases set to `'private'`

### Phase 2: Case Enrichment

**Goal**: Fetch consultation data for cases

```
Find Cases Needing Enrichment
    │
    ├─ Cases without consultation metadata
    ├─ Cases where metadata.consultation is null
    └─ Cases in date range
    │
    ▼
Batch Fetch Consultations (parallel)
    │
    ├─ Use parallelBatchSize (default: 5)
    ├─ Fetch SOAP notes
    ├─ Fetch vitals
    └─ Fetch diagnoses
    │
    ▼
Update Case Metadata
    │
    └─ Merge consultation data into metadata.consultation
```

**Key Decisions:**

1. **Parallel Fetching** - Configurable batch size (default: 5 concurrent)
2. **Metadata Structure** - Store in `metadata.consultation` JSONB field
3. **Skip Logic** - Skip cases already enriched (idempotent)
4. **Error Handling** - Continue on individual fetch failures

### Phase 3: Reconciliation

**Goal**: Soft-delete cases removed from PIMS

```
Query Local Cases (last N days)
    │
    ▼
Fetch PIMS Appointments (same date range)
    │
    ▼
Compare pims_ids
    │
    ├─ Local cases NOT in PIMS → Orphans
    └─ Mark orphans for deletion
    │
    ▼
Soft-Delete Orphans
    │
    ├─ Set status = 'reviewed'
    └─ Add metadata.reconciliation = {
          softDeleted: true,
          reason: "...",
          deletedAt: "..."
        }
```

**Key Decisions:**

1. **Soft Delete** - Never physically delete, set status to `'reviewed'`
2. **Lookback Window** - Default 7 days (configurable)
3. **Reconciliation Metadata** - Track deletion reason and timestamp
4. **Audit Trail** - Log deleted case IDs

---

## Provider Interface

### IPimsProvider Contract

```typescript
export interface IPimsProvider {
  /**
   * Authenticate with the PIMS system
   * Returns true if authentication succeeded
   */
  authenticate(credentials: PimsCredentials): Promise<boolean>;

  /**
   * Fetch appointments within a date range
   * Returns array of standardized appointment objects
   */
  fetchAppointments(dateRange: DateRange): Promise<PimsAppointment[]>;

  /**
   * Fetch detailed consultation data for a specific appointment
   * Returns consultation with SOAP notes, vitals, diagnoses
   */
  fetchConsultation(appointmentId: string): Promise<PimsConsultation | null>;

  /**
   * Close browser/connections and cleanup resources
   */
  close(): Promise<void>;
}
```

### Domain Types

```typescript
export interface PimsAppointment {
  appointmentId: string;
  scheduledStart: string; // ISO 8601 timestamp
  scheduledEnd: string;
  status: string; // PIMS-specific status
  appointmentType: string | null;
  patient: {
    name: string;
    species: string;
    breed?: string;
  };
  client: {
    name: string;
    phone: string;
    email?: string;
  };
  provider?: string;
  room?: string;
  notes?: string;
}

export interface PimsConsultation {
  appointmentId: string;
  consultationDate: string;
  soapNotes?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  vitals?: {
    temperature?: number;
    weight?: number;
    pulse?: number;
    respiration?: number;
  };
  diagnoses?: string[];
  treatments?: string[];
  dischargeInstructions?: string;
}
```

---

## Data Flow

### Full Sync Flow

```
┌──────────────┐
│  POST /api/  │
│  sync/full   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  API Key Auth        │
│  (clinic context)    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Create Provider     │
│  • Get credentials   │
│  • Launch browser    │
│  • Create instance   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Authenticate PIMS   │
│  • Login via UI      │
│  • Capture session   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Phase 1: Inbound    │
│  • Fetch appointments│
│  • Transform         │
│  • Upsert cases      │
│  • Log audit         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Phase 2: Cases      │
│  • Find pending cases│
│  • Fetch consults    │
│  • Enrich metadata   │
│  • Log audit         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Phase 3: Reconcile  │
│  • Query local cases │
│  • Fetch PIMS data   │
│  • Find orphans      │
│  • Soft-delete       │
│  • Log audit         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Cleanup & Response  │
│  • Close browser     │
│  • Return results    │
└──────────────────────┘
```

### Database Tables

```
┌────────────────────┐
│  cases             │
│  ──────────────────│
│  id (uuid)         │
│  clinic_id         │
│  pims_id ◀─────────┼─── Unique per clinic
│  patient_name      │
│  client_name       │
│  scheduled_date    │
│  status            │ ◀─── Mapped from PIMS
│  case_type         │ ◀─── Mapped from PIMS
│  metadata (jsonb)  │ ◀─── Consultation data
│  visibility        │
│  created_at        │
│  updated_at        │
└────────────────────┘

┌────────────────────┐
│  case_sync_audits  │
│  ──────────────────│
│  id (uuid)         │
│  clinic_id         │
│  sync_type         │ ◀─── 'inbound' | 'cases' | 'reconciliation'
│  status            │ ◀─── 'in_progress' | 'completed' | 'failed'
│  appointments_found│
│  cases_created     │
│  cases_updated     │
│  cases_deleted     │
│  error_message     │
│  created_at        │
│  updated_at        │
└────────────────────┘

┌────────────────────┐
│  clinic_api_keys   │
│  ──────────────────│
│  id (uuid)         │
│  clinic_id         │
│  key_prefix        │ ◀─── First 8 chars (fast lookup)
│  key_hash          │ ◀─── SHA256 hash
│  permissions       │ ◀─── Array or NULL
│  is_active         │
│  expires_at        │
│  last_used_at      │
│  created_at        │
└────────────────────┘

┌────────────────────┐
│  pims_credentials  │
│  ──────────────────│
│  id (uuid)         │
│  clinic_id         │
│  provider_type     │ ◀─── 'idexx' | 'cornerstone' | ...
│  encrypted_data    │ ◀─── AES-256-GCM
│  created_at        │
│  updated_at        │
└────────────────────┘
```

---

## Security Model

### Authentication Chain

```
Client Request
    │
    ├─ X-API-Key header
    │
    ▼
┌────────────────────────┐
│  Extract API Key       │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Lookup by key_prefix  │ ◀─── Fast indexed query
│  (first 8 chars)       │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Verify SHA256 hash    │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Check is_active       │
│  Check expires_at      │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Check permissions     │
│  (if not NULL/empty)   │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Attach clinic context │
│  to request            │
└────────┬───────────────┘
         │
         ▼
    Route Handler
```

### PIMS Credential Security

1. **Encryption at Rest** - AES-256-GCM in `pims_credentials.encrypted_data`
2. **Encryption Key** - Stored in `ENCRYPTION_KEY` environment variable
3. **Access Control** - Only service role can decrypt credentials
4. **Audit Trail** - All credential access logged

### Permission Model

```typescript
// Null or empty array = full access
permissions: null | [];

// Specific permissions
permissions: ["sync:inbound", "sync:cases"];

// Wildcard
permissions: ["*"];
```

---

## Extensibility

### Adding a New PIMS Provider

**Step 1: Implement IPimsProvider**

```typescript
// libs/integrations/cornerstone/src/providers/cornerstone-provider.ts
export class CornerstoneProvider implements IPimsProvider {
  async authenticate(credentials: PimsCredentials): Promise<boolean> {
    // Cornerstone-specific auth
  }

  async fetchAppointments(dateRange: DateRange): Promise<PimsAppointment[]> {
    // Cornerstone-specific data fetching
  }

  async fetchConsultation(id: string): Promise<PimsConsultation | null> {
    // Cornerstone-specific consultation fetching
  }

  async close(): Promise<void> {
    // Cleanup
  }
}
```

**Step 2: Create Provider Factory**

```typescript
// apps/pims-sync/src/services/provider-factory.ts
export async function createProvider(
  providerType: string,
  credentials: PimsCredentials
): Promise<IPimsProvider> {
  switch (providerType) {
    case 'idexx':
      return new IdexxProvider({ ... });
    case 'cornerstone':
      return new CornerstoneProvider({ ... });
    default:
      throw new Error(`Unknown provider: ${providerType}`);
  }
}
```

**Step 3: Update Credentials Schema**

```sql
-- Add provider_type to pims_credentials
ALTER TABLE pims_credentials
ADD COLUMN provider_type TEXT NOT NULL DEFAULT 'idexx';

-- Add constraint
ALTER TABLE pims_credentials
ADD CONSTRAINT valid_provider_type
CHECK (provider_type IN ('idexx', 'cornerstone', 'ezyvet', 'avimark'));
```

### Extending Sync Phases

To add a new sync phase:

1. Create service class implementing sync logic
2. Add phase to `SyncOrchestrator.runFullSync()`
3. Add new `sync_type` to `case_sync_audits` constraint
4. Create new API endpoint (optional)

**Example: Adding "Invoice Sync" Phase**

```typescript
// libs/domain/sync/data-access/src/services/invoice-sync.service.ts
export class InvoiceSyncService {
  async sync(options: InvoiceSyncOptions): Promise<SyncResult> {
    // Fetch invoices from PIMS
    // Attach to cases
    // Log audit
  }
}

// Update orchestrator
export class SyncOrchestrator {
  async runFullSync(options: FullSyncOptions): Promise<FullSyncResult> {
    const inboundResult = await this.inboundSync.sync();
    const casesResult = await this.caseSync.sync();
    const invoiceResult = await this.invoiceSync.sync(); // New phase
    const reconcileResult = await this.reconciler.reconcile();

    return { inboundResult, casesResult, invoiceResult, reconcileResult };
  }
}
```

---

## Related Documentation

- [PIMS Sync API Reference](./PIMS_SYNC_API.md) - API endpoints
- [IDEXX Provider Implementation](../../../libs/integrations/idexx/README.md) - IDEXX details
- [Domain Sync Services](../../../libs/domain/sync/README.md) - Service layer
- [Database Schema](../../../docs/architecture/DATABASE_CONTEXT.md) - Table schemas

---

**Version**: 4.0.0
**Last Updated**: 2026-01-17
