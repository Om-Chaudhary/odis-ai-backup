# PIMS Sync Workflows

> Complete guide to the sync workflows, pipelines, and automation

## Table of Contents

- [Overview](#overview)
- [Sync Pipeline](#sync-pipeline)
- [Phase 1: Inbound Sync](#phase-1-inbound-sync)
- [Phase 2: Case Enrichment](#phase-2-case-enrichment)
- [Phase 3: Reconciliation](#phase-3-reconciliation)
- [Full Sync Orchestration](#full-sync-orchestration)
- [Scheduled Automation](#scheduled-automation)
- [Error Handling](#error-handling)
- [Monitoring & Observability](#monitoring--observability)

---

## Overview

The PIMS Sync Service implements a **three-phase pipeline** that synchronizes data from Practice Information Management Systems (like IDEXX Neo) to the Supabase database.

### Pipeline Phases

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PIMS SYNC PIPELINE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐    ┌──────────────┐    ┌───────────────────┐   │
│   │   INBOUND    │───▶│    CASES     │───▶│  RECONCILIATION   │   │
│   │              │    │              │    │                   │   │
│   │ Appointments │    │ Consultation │    │  Orphan Cleanup   │   │
│   │   → Cases    │    │  Enrichment  │    │  (Soft Delete)    │   │
│   └──────────────┘    └──────────────┘    └───────────────────┘   │
│                                                                     │
│   Creates/updates      Fetches SOAP       Removes cases not       │
│   case records         notes, vitals,     present in PIMS         │
│   from appointments    diagnoses          anymore                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Characteristics

| Characteristic  | Description                                   |
| --------------- | --------------------------------------------- |
| **Idempotent**  | Safe to re-run; same input = same output      |
| **Independent** | Each phase can run separately                 |
| **Auditable**   | Every operation logged to `case_sync_audits`  |
| **Resumable**   | Failed syncs can be retried without data loss |

---

## Sync Pipeline

### Request Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         REQUEST FLOW                             │
└──────────────────────────────────────────────────────────────────┘

Client Request (X-API-Key header)
        │
        ▼
┌───────────────────────────────────────┐
│  1. API KEY VALIDATION                │
│  ──────────────────────────           │
│  • Extract X-API-Key header           │
│  • Lookup by key_prefix (first 8)     │
│  • Verify SHA256 hash                 │
│  • Check is_active, expires_at        │
│  • Attach clinic context to request   │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│  2. CREDENTIAL RETRIEVAL              │
│  ──────────────────────────           │
│  • Fetch from pims_credentials        │
│  • Decrypt with ENCRYPTION_KEY        │
│  • Validate credential structure      │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│  3. PROVIDER INITIALIZATION           │
│  ──────────────────────────           │
│  • Create IDEXX provider instance     │
│  • Launch Playwright browser          │
│  • Navigate to IDEXX Neo              │
│  • Authenticate with credentials      │
│  • Capture session cookies            │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│  4. SYNC EXECUTION                    │
│  ──────────────────────────           │
│  • Create audit record                │
│  • Execute requested phase(s)         │
│  • Update audit on completion/error   │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│  5. CLEANUP & RESPONSE                │
│  ──────────────────────────           │
│  • Close browser connection           │
│  • Return sync results                │
│  • Release resources                  │
└───────────────────────────────────────┘
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PIMS AUTHENTICATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────────────────────────────────┐
│  Playwright  │────▶│  IDEXX Neo Login Page                    │
│  Browser     │     │  https://neo.idexxpetlabs.com/login      │
└──────────────┘     └───────────────┬──────────────────────────┘
                                     │
                                     ▼
                     ┌──────────────────────────────────────────┐
                     │  Fill Login Form                         │
                     │  • Username (email)                      │
                     │  • Password                              │
                     │  • Practice ID (if required)             │
                     └───────────────┬──────────────────────────┘
                                     │
                                     ▼
                     ┌──────────────────────────────────────────┐
                     │  Submit & Wait for Navigation            │
                     │  • Wait for dashboard URL                │
                     │  • Verify authentication succeeded       │
                     └───────────────┬──────────────────────────┘
                                     │
                                     ▼
                     ┌──────────────────────────────────────────┐
                     │  Capture Session                         │
                     │  • Extract cookies from browser context  │
                     │  • Store for subsequent API calls        │
                     └───────────────┬──────────────────────────┘
                                     │
                                     ▼
                     ┌──────────────────────────────────────────┐
                     │  Use Session for API Calls               │
                     │  • All IDEXX API calls use cookies       │
                     │  • No additional auth needed per request │
                     └──────────────────────────────────────────┘
```

---

## Phase 1: Inbound Sync

**Purpose**: Sync appointments from PIMS to the `cases` table

### Endpoint

```
POST /api/sync/inbound
```

### Request Body

```json
{
  "startDate": "2026-01-17", // Optional: defaults to today
  "endDate": "2026-01-24", // Optional: defaults to startDate + daysAhead
  "daysAhead": 7 // Optional: default 7 days
}
```

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    INBOUND SYNC WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. CREATE AUDIT RECORD
   ┌────────────────────────────────────────────────┐
   │ INSERT INTO case_sync_audits                   │
   │   (clinic_id, sync_type, status)               │
   │ VALUES (clinic_id, 'inbound', 'in_progress')   │
   └────────────────────────────────────────────────┘
                         │
                         ▼
2. FETCH APPOINTMENTS FROM PIMS
   ┌────────────────────────────────────────────────┐
   │ provider.fetchAppointments({                   │
   │   startDate: '2026-01-17',                     │
   │   endDate: '2026-01-24'                        │
   │ })                                             │
   │                                                │
   │ IDEXX API: /appointments/getCalendarEventData  │
   └────────────────────────────────────────────────┘
                         │
                         ▼
3. TRANSFORM TO DOMAIN MODEL
   ┌────────────────────────────────────────────────┐
   │ For each appointment:                          │
   │                                                │
   │ PIMS Appointment          →    Case Input      │
   │ ─────────────────              ──────────      │
   │ appointmentId             →    pims_id         │
   │ scheduledStart            →    scheduled_date  │
   │ patient.name              →    patient_name    │
   │ client.name               →    client_name     │
   │ client.phone              →    phone_number    │
   │ status (mapped)           →    status          │
   │ appointmentType (mapped)  →    case_type       │
   └────────────────────────────────────────────────┘
                         │
                         ▼
4. UPSERT TO DATABASE
   ┌────────────────────────────────────────────────┐
   │ For each transformed case:                     │
   │                                                │
   │ INSERT INTO cases (...)                        │
   │ ON CONFLICT (clinic_id, pims_id)               │
   │ DO UPDATE SET                                  │
   │   patient_name = EXCLUDED.patient_name,        │
   │   client_name = EXCLUDED.client_name,          │
   │   scheduled_date = EXCLUDED.scheduled_date,    │
   │   ...                                          │
   │   updated_at = NOW()                           │
   └────────────────────────────────────────────────┘
                         │
                         ▼
5. UPDATE AUDIT RECORD
   ┌────────────────────────────────────────────────┐
   │ UPDATE case_sync_audits SET                    │
   │   status = 'completed',                        │
   │   appointments_found = 25,                     │
   │   cases_created = 18,                          │
   │   cases_updated = 7,                           │
   │   completed_at = NOW()                         │
   │ WHERE id = audit_id                            │
   └────────────────────────────────────────────────┘
```

### Status Mapping

| PIMS Status   | Case Status |
| ------------- | ----------- |
| `scheduled`   | `draft`     |
| `checked_in`  | `draft`     |
| `in_progress` | `draft`     |
| `completed`   | `pending`   |
| `cancelled`   | `reviewed`  |
| `no_show`     | `reviewed`  |

### Type Mapping

| PIMS Type                     | Case Type |
| ----------------------------- | --------- |
| `exam`, `checkup`, `wellness` | `checkup` |
| `surgery`, `procedure`        | `surgery` |
| `emergency`, `urgent`         | `other`   |
| `vaccination`                 | `checkup` |
| Default                       | `other`   |

### Response

```json
{
  "success": true,
  "syncId": "uuid",
  "stats": {
    "appointmentsFound": 25,
    "casesCreated": 18,
    "casesUpdated": 7,
    "casesSkipped": 0
  },
  "durationMs": 4532
}
```

---

## Phase 2: Case Enrichment

**Purpose**: Fetch consultation data (SOAP notes, vitals, diagnoses) for existing cases

### Endpoint

```
POST /api/sync/cases
```

### Request Body

```json
{
  "startDate": "2026-01-17", // Optional: defaults to 7 days ago
  "endDate": "2026-01-24", // Optional: defaults to today
  "parallelBatchSize": 5 // Optional: concurrent fetches (default: 5)
}
```

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                  CASE ENRICHMENT WORKFLOW                       │
└─────────────────────────────────────────────────────────────────┘

1. FIND CASES NEEDING ENRICHMENT
   ┌────────────────────────────────────────────────┐
   │ SELECT * FROM cases                            │
   │ WHERE clinic_id = $1                           │
   │   AND scheduled_date BETWEEN $start AND $end   │
   │   AND pims_id IS NOT NULL                      │
   │   AND (                                        │
   │     metadata->'consultation' IS NULL           │
   │     OR metadata->'consultation'->>'soapNotes'  │
   │        IS NULL                                 │
   │   )                                            │
   └────────────────────────────────────────────────┘
                         │
                         ▼
2. BATCH FETCH CONSULTATIONS (PARALLEL)
   ┌────────────────────────────────────────────────┐
   │ Using p-limit for concurrency control:         │
   │                                                │
   │ const limit = pLimit(parallelBatchSize);       │
   │                                                │
   │ await Promise.all(cases.map(case =>            │
   │   limit(() =>                                  │
   │     provider.fetchConsultation(case.pims_id)   │
   │   )                                            │
   │ ));                                            │
   │                                                │
   │ IDEXX APIs:                                    │
   │   • /consultations/search (find by date)       │
   │   • /consultations/view/{id} (get details)     │
   └────────────────────────────────────────────────┘
                         │
                         ▼
3. TRANSFORM CONSULTATION DATA
   ┌────────────────────────────────────────────────┐
   │ For each consultation response:                │
   │                                                │
   │ {                                              │
   │   "consultation": {                            │
   │     "fetchedAt": "2026-01-17T12:00:00Z",       │
   │     "soapNotes": {                             │
   │       "subjective": "...",                     │
   │       "objective": "...",                      │
   │       "assessment": "...",                     │
   │       "plan": "..."                            │
   │     },                                         │
   │     "vitals": {                                │
   │       "temperature": 101.5,                    │
   │       "weight": 25.3,                          │
   │       "pulse": 80,                             │
   │       "respiration": 20                        │
   │     },                                         │
   │     "diagnoses": ["Otitis externa"],           │
   │     "dischargeInstructions": "..."             │
   │   }                                            │
   │ }                                              │
   └────────────────────────────────────────────────┘
                         │
                         ▼
4. UPDATE CASE METADATA
   ┌────────────────────────────────────────────────┐
   │ UPDATE cases SET                               │
   │   metadata = metadata || $consultation_data,   │
   │   updated_at = NOW()                           │
   │ WHERE id = $case_id                            │
   └────────────────────────────────────────────────┘
                         │
                         ▼
5. UPDATE AUDIT RECORD
   ┌────────────────────────────────────────────────┐
   │ UPDATE case_sync_audits SET                    │
   │   status = 'completed',                        │
   │   cases_found = 25,                            │
   │   cases_enriched = 22,                         │
   │   completed_at = NOW()                         │
   │ WHERE id = audit_id                            │
   └────────────────────────────────────────────────┘
```

### Skip Logic

Cases are skipped if:

- `metadata.consultation` already exists with `soapNotes`
- No matching consultation found in PIMS
- Consultation fetch returns an error (logged but continues)

### Response

```json
{
  "success": true,
  "syncId": "uuid",
  "stats": {
    "casesFound": 25,
    "casesEnriched": 22,
    "casesSkipped": 3,
    "casesFailed": 0
  },
  "durationMs": 8765
}
```

---

## Phase 3: Reconciliation

**Purpose**: Soft-delete cases that no longer exist in PIMS (cancelled/removed appointments)

### Endpoint

```
POST /api/sync/reconcile
```

### Request Body

```json
{
  "lookbackDays": 7 // Optional: default 7 days
}
```

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                  RECONCILIATION WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. QUERY LOCAL CASES (LAST N DAYS)
   ┌────────────────────────────────────────────────┐
   │ SELECT id, pims_id FROM cases                  │
   │ WHERE clinic_id = $1                           │
   │   AND scheduled_date >= NOW() - $lookbackDays  │
   │   AND pims_id IS NOT NULL                      │
   │   AND status != 'reviewed'                     │
   │   AND (metadata->'reconciliation'->>'softDeleted')::boolean  │
   │       IS NOT TRUE                              │
   └────────────────────────────────────────────────┘
                         │
                         ▼
2. FETCH PIMS APPOINTMENTS (SAME RANGE)
   ┌────────────────────────────────────────────────┐
   │ provider.fetchAppointments({                   │
   │   startDate: NOW() - lookbackDays,             │
   │   endDate: NOW()                               │
   │ })                                             │
   │                                                │
   │ Returns: Set of pims_ids currently in PIMS     │
   └────────────────────────────────────────────────┘
                         │
                         ▼
3. COMPARE PIMS_IDS
   ┌────────────────────────────────────────────────┐
   │ localPimsIds = Set(local cases pims_id)        │
   │ remotePimsIds = Set(PIMS appointments id)      │
   │                                                │
   │ orphans = localPimsIds - remotePimsIds         │
   │                                                │
   │ (Cases in local DB but NOT in PIMS anymore)    │
   └────────────────────────────────────────────────┘
                         │
                         ▼
4. SOFT-DELETE ORPHANS
   ┌────────────────────────────────────────────────┐
   │ For each orphan case:                          │
   │                                                │
   │ UPDATE cases SET                               │
   │   status = 'reviewed',                         │
   │   metadata = metadata || {                     │
   │     "reconciliation": {                        │
   │       "softDeleted": true,                     │
   │       "reason": "Removed from PIMS",           │
   │       "deletedAt": "2026-01-17T12:00:00Z",     │
   │       "syncId": "uuid"                         │
   │     }                                          │
   │   },                                           │
   │   updated_at = NOW()                           │
   │ WHERE id = $case_id                            │
   └────────────────────────────────────────────────┘
                         │
                         ▼
5. UPDATE AUDIT RECORD
   ┌────────────────────────────────────────────────┐
   │ UPDATE case_sync_audits SET                    │
   │   status = 'completed',                        │
   │   cases_checked = 120,                         │
   │   cases_deleted = 3,                           │
   │   completed_at = NOW()                         │
   │ WHERE id = audit_id                            │
   └────────────────────────────────────────────────┘
```

### Why Soft Delete?

We never physically delete case records because:

1. **Audit Trail** - Maintain complete history of all cases
2. **Recovery** - Can restore if deleted by mistake
3. **Compliance** - Medical records often require retention
4. **Analytics** - Track cancellation/no-show patterns

### Response

```json
{
  "success": true,
  "syncId": "uuid",
  "stats": {
    "casesChecked": 120,
    "casesDeleted": 3,
    "deletedIds": ["uuid1", "uuid2", "uuid3"]
  },
  "durationMs": 2345
}
```

---

## Full Sync Orchestration

**Purpose**: Run all three phases in sequence

### Endpoint

```
POST /api/sync/full
```

### Request Body

```json
{
  "startDate": "2026-01-17", // Optional
  "endDate": "2026-01-24", // Optional
  "daysAhead": 7, // Optional: for inbound phase
  "lookbackDays": 7 // Optional: for reconciliation
}
```

### Orchestration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  FULL SYNC ORCHESTRATION                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  SyncOrchestrator.runFullSync()                              │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Create master audit record       │
         │  sync_type = 'full'               │
         └───────────────┬───────────────────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             │             │
   ┌───────────────┐     │             │
   │ Phase 1       │     │             │
   │ ──────────    │     │             │
   │ InboundSync   │─────┼─────────────┤
   │               │     │             │
   │ Success: ✓    │     │             │
   │ Stats: {...}  │     │             │
   └───────────────┘     │             │
                         ▼             │
                 ┌───────────────┐     │
                 │ Phase 2       │     │
                 │ ──────────    │     │
                 │ CaseEnrich    │─────┤
                 │               │     │
                 │ Success: ✓    │     │
                 │ Stats: {...}  │     │
                 └───────────────┘     │
                                       ▼
                               ┌───────────────┐
                               │ Phase 3       │
                               │ ──────────    │
                               │ Reconcile     │
                               │               │
                               │ Success: ✓    │
                               │ Stats: {...}  │
                               └───────────────┘
                                       │
                                       ▼
         ┌───────────────────────────────────┐
         │  Update master audit record       │
         │  Aggregate all phase results      │
         └───────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Return combined response         │
         └───────────────────────────────────┘
```

### Response

```json
{
  "success": true,
  "syncId": "uuid",
  "inboundResult": {
    "success": true,
    "stats": {
      "appointmentsFound": 25,
      "casesCreated": 18,
      "casesUpdated": 7
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

---

## Scheduled Automation

### Per-Clinic Scheduler

The service includes a built-in scheduler that runs sync operations automatically based on per-clinic configurations.

### Configuration

Stored in `clinic_schedule_configs.sync_schedules` (JSONB):

```json
[
  {
    "type": "inbound",
    "cron": "0 6 * * *",
    "enabled": true,
    "options": {
      "daysAhead": 7
    }
  },
  {
    "type": "cases",
    "cron": "0 8,14,20 * * *",
    "enabled": true,
    "options": {
      "parallelBatchSize": 5
    }
  },
  {
    "type": "reconciliation",
    "cron": "0 2 * * *",
    "enabled": true,
    "options": {
      "lookbackDays": 7
    }
  }
]
```

### Cron Schedule Examples

| Schedule        | Cron Expression   | Description       |
| --------------- | ----------------- | ----------------- |
| Daily at 6 AM   | `0 6 * * *`       | Morning sync      |
| Every 6 hours   | `0 */6 * * *`     | Regular interval  |
| 3x daily        | `0 8,14,20 * * *` | Business hours    |
| Nightly at 2 AM | `0 2 * * *`       | Overnight cleanup |
| Weekdays only   | `0 6 * * 1-5`     | Business days     |

### Scheduler Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCHEDULER WORKFLOW                           │
└─────────────────────────────────────────────────────────────────┘

On Startup:
┌──────────────────────────────────────────────────────────────┐
│  1. Load all clinic_schedule_configs                         │
│  2. For each clinic with enabled schedules:                  │
│     - Create cron job for each schedule type                 │
│     - Store job references for management                    │
│  3. Start 5-minute config polling interval                   │
└──────────────────────────────────────────────────────────────┘

Every 5 Minutes:
┌──────────────────────────────────────────────────────────────┐
│  1. Fetch all clinic_schedule_configs                        │
│  2. Compare with running jobs                                │
│  3. Add/update/remove jobs as needed                         │
│  4. No restart required                                      │
└──────────────────────────────────────────────────────────────┘

On Cron Trigger:
┌──────────────────────────────────────────────────────────────┐
│  1. Create internal API key for clinic                       │
│  2. Call appropriate sync endpoint                           │
│  3. Log results to case_sync_audits                          │
│  4. Handle errors (retry logic)                              │
└──────────────────────────────────────────────────────────────┘
```

### Enabling/Disabling Scheduler

```bash
# Environment variable
ENABLE_SCHEDULER=true   # Enable (default)
ENABLE_SCHEDULER=false  # Disable

# For local development without scheduler
ENABLE_SCHEDULER=false pnpm --filter pims-sync start
```

---

## Error Handling

### Error Categories

| Category            | Handling                                   | Retry                     |
| ------------------- | ------------------------------------------ | ------------------------- |
| **Authentication**  | Mark audit as failed, close browser        | No                        |
| **PIMS API Error**  | Log error, continue with other records     | Yes (exponential backoff) |
| **Transform Error** | Skip record, log warning                   | No                        |
| **Database Error**  | Mark audit as failed, rollback if possible | Yes                       |
| **Timeout**         | Mark audit as failed, close browser        | Yes                       |

### Audit Record on Error

```json
{
  "id": "uuid",
  "clinic_id": "uuid",
  "sync_type": "inbound",
  "status": "failed",
  "error_message": "PIMS authentication failed: Invalid credentials",
  "appointments_found": 0,
  "cases_created": 0,
  "started_at": "2026-01-17T12:00:00Z",
  "completed_at": "2026-01-17T12:00:05Z"
}
```

### Partial Failures

For case enrichment, individual failures don't fail the entire sync:

```json
{
  "success": true,
  "stats": {
    "casesFound": 25,
    "casesEnriched": 22,
    "casesSkipped": 1,
    "casesFailed": 2
  },
  "failures": [
    { "caseId": "uuid1", "error": "Consultation not found" },
    { "caseId": "uuid2", "error": "PIMS API timeout" }
  ]
}
```

---

## Monitoring & Observability

### Health Endpoints

```bash
# Basic health check
GET /health
{
  "status": "healthy",
  "uptime": 123456,
  "memory": { "heapUsed": 45678912, "heapTotal": 67890123 },
  "version": "4.0.0"
}

# Readiness probe (database connectivity)
GET /ready
{
  "status": "ready",
  "database": "connected"
}

# Prometheus metrics
GET /metrics
# sync_operations_total{type="inbound",status="success"} 42
# sync_duration_seconds{type="inbound"} 4.532
# ...
```

### Audit Trail Queries

```sql
-- Recent syncs for a clinic
SELECT * FROM case_sync_audits
WHERE clinic_id = 'uuid'
ORDER BY created_at DESC
LIMIT 10;

-- Failed syncs in last 24 hours
SELECT * FROM case_sync_audits
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours';

-- Sync statistics by type
SELECT
  sync_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as successful,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_sec
FROM case_sync_audits
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY sync_type;
```

### Logging

The service uses structured JSON logging with namespaces:

```json
{
  "level": "info",
  "namespace": "pims-sync:inbound",
  "message": "Sync completed",
  "clinic_id": "uuid",
  "sync_id": "uuid",
  "stats": {
    "appointmentsFound": 25,
    "casesCreated": 18
  },
  "duration_ms": 4532,
  "timestamp": "2026-01-17T12:00:00.000Z"
}
```

---

## Next Steps

1. **[Getting Started](./GETTING_STARTED.md)** - Initial setup
2. **[Railway Deployment](./RAILWAY_DEPLOYMENT.md)** - Production deployment
3. **[API Reference](./PIMS_SYNC_API.md)** - Complete endpoint docs
4. **[Architecture](./PIMS_SYNC_ARCHITECTURE.md)** - System design

---

**Version**: 4.0.0
**Last Updated**: 2026-01-17
