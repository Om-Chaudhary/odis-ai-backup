# PIMS Sync API Reference

> Complete API documentation for the PIMS Sync Service v4.0

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Full Sync](#post-apisyncfull)
  - [Inbound Sync](#post-apisyncinbound)
  - [Case Sync](#post-apisynccases)
  - [Reconciliation](#post-apisyncreconcile)
- [Request/Response Schemas](#requestresponse-schemas)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Authentication

All PIMS sync endpoints require API key authentication via the `X-API-Key` header.

### Obtaining an API Key

API keys are stored in the `clinic_api_keys` table and associated with a specific clinic:

```sql
-- Create a new API key
INSERT INTO clinic_api_keys (
  clinic_id,
  key_prefix,
  key_hash,
  permissions,
  expires_at
)
VALUES (
  'your-clinic-uuid',
  SUBSTRING('your-api-key' FROM 1 FOR 8),
  encode(digest('your-api-key', 'sha256'), 'hex'),
  ARRAY['sync:inbound', 'sync:cases', 'sync:reconcile'], -- Or NULL for all permissions
  NOW() + INTERVAL '1 year' -- Optional expiration
);
```

### Using an API Key

Include the API key in the `X-API-Key` header:

```bash
curl -X POST https://your-service.com/api/sync/full \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{"daysAhead": 7}'
```

### Permissions

API keys support granular permissions. If `permissions` is `NULL` or empty, the key has full access.

Available permissions:

- `sync:inbound` - Inbound sync endpoint
- `sync:cases` - Case enrichment endpoint
- `sync:reconcile` - Reconciliation endpoint
- `*` - Wildcard (all permissions)

---

## Endpoints

### POST /api/sync/full

Run the complete 3-phase sync pipeline: inbound → cases → reconciliation.

**Request Body:**

```json
{
  "startDate": "2026-01-17", // Optional: YYYY-MM-DD (default: today)
  "endDate": "2026-01-24", // Optional: YYYY-MM-DD (overrides daysAhead)
  "daysAhead": 7, // Optional: Number of days forward (default: 7)
  "lookbackDays": 7 // Optional: Reconciliation lookback (default: 7)
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "syncId": "uuid",
  "inboundResult": {
    "success": true,
    "syncId": "uuid",
    "stats": {
      "appointmentsFound": 45,
      "casesCreated": 32,
      "casesUpdated": 13,
      "casesSkipped": 0
    },
    "durationMs": 3456
  },
  "casesResult": {
    "success": true,
    "syncId": "uuid",
    "stats": {
      "casesFound": 45,
      "casesEnriched": 42,
      "casesSkipped": 3,
      "casesErrored": 0
    },
    "durationMs": 8123
  },
  "reconciliationResult": {
    "success": true,
    "syncId": "uuid",
    "stats": {
      "casesChecked": 156,
      "casesDeleted": 4
    },
    "deletedCases": ["uuid1", "uuid2", "uuid3", "uuid4"],
    "durationMs": 1234
  },
  "durationMs": 12813,
  "timestamp": "2026-01-17T15:30:00.000Z"
}
```

**Use Cases:**

- Scheduled nightly sync
- Initial clinic onboarding
- Full data refresh

---

### POST /api/sync/inbound

Sync appointments from PIMS to the database. Creates or updates case records.

**Request Body:**

```json
{
  "startDate": "2026-01-17", // Optional: YYYY-MM-DD (default: today)
  "endDate": "2026-01-24", // Optional: YYYY-MM-DD
  "daysAhead": 7 // Optional: Days forward (default: 7)
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "syncId": "uuid",
  "stats": {
    "appointmentsFound": 45,
    "casesCreated": 32,
    "casesUpdated": 13,
    "casesSkipped": 0
  },
  "dateRange": {
    "start": "2026-01-17T00:00:00.000Z",
    "end": "2026-01-24T23:59:59.999Z"
  },
  "durationMs": 3456,
  "timestamp": "2026-01-17T15:30:00.000Z"
}
```

**Appointment → Case Mapping:**

| PIMS Field        | Case Field                        | Transform                                              |
| ----------------- | --------------------------------- | ------------------------------------------------------ |
| `appointmentId`   | `pims_id`                         | Direct                                                 |
| `scheduledStart`  | `scheduled_date`                  | ISO timestamp                                          |
| `status`          | `status`                          | Mapped to enum (see [Status Mapping](#status-mapping)) |
| `appointmentType` | `case_type`                       | Mapped to enum (see [Type Mapping](#type-mapping))     |
| `patient`         | `patient_name`, `patient_species` | Extracted                                              |
| `client`          | `client_name`, `client_phone`     | Extracted                                              |

**Use Cases:**

- Quick appointment refresh
- Scheduled hourly sync
- Import future appointments

---

### POST /api/sync/cases

Enrich existing cases with detailed consultation data from PIMS.

**Request Body:**

```json
{
  "startDate": "2026-01-17", // Optional: YYYY-MM-DD (default: today)
  "endDate": "2026-01-17", // Optional: YYYY-MM-DD (default: startDate)
  "parallelBatchSize": 5 // Optional: Concurrent fetches (default: 5)
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "syncId": "uuid",
  "stats": {
    "casesFound": 32,
    "casesEnriched": 30,
    "casesSkipped": 2,
    "casesErrored": 0
  },
  "durationMs": 8123,
  "timestamp": "2026-01-17T15:30:00.000Z"
}
```

**Enrichment Data:**

Cases are enriched with consultation metadata:

- **SOAP Notes** - Subjective, Objective, Assessment, Plan
- **Vitals** - Temperature, weight, pulse, respiration
- **Diagnoses** - Structured diagnosis list
- **Treatment Plans** - Medications, procedures
- **Discharge Instructions** - Client education

**Use Cases:**

- Enrich cases after discharge
- Backfill consultation data
- Pre-call data loading

---

### POST /api/sync/reconcile

Compare local cases with PIMS source of truth. Soft-deletes cases that no longer exist in PIMS.

**Request Body:**

```json
{
  "lookbackDays": 7 // Optional: Days to check (default: 7)
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "syncId": "uuid",
  "stats": {
    "casesChecked": 156,
    "casesDeleted": 4
  },
  "deletedCases": ["uuid1", "uuid2", "uuid3", "uuid4"],
  "durationMs": 1234,
  "timestamp": "2026-01-17T15:30:00.000Z"
}
```

**Soft Delete Behavior:**

Cases are not physically deleted. Instead:

1. `status` set to `'reviewed'` (archived state)
2. `metadata.reconciliation` added:
   ```json
   {
     "softDeleted": true,
     "reason": "Appointment no longer exists in PIMS",
     "deletedAt": "2026-01-17T15:30:00.000Z"
   }
   ```

**Use Cases:**

- Daily cleanup job
- Remove cancelled appointments
- Maintain data accuracy

---

## Request/Response Schemas

### Status Mapping

PIMS appointment statuses are mapped to the `CaseStatus` enum:

| PIMS Status   | Case Status | Description            |
| ------------- | ----------- | ---------------------- |
| `scheduled`   | `draft`     | Appointment booked     |
| `confirmed`   | `draft`     | Client confirmed       |
| `checked-in`  | `ongoing`   | Patient arrived        |
| `in-progress` | `ongoing`   | Actively being treated |
| `completed`   | `completed` | Treatment finished     |
| `discharged`  | `completed` | Patient released       |
| `cancelled`   | `reviewed`  | Appointment cancelled  |
| `no-show`     | `reviewed`  | Patient didn't arrive  |

### Type Mapping

PIMS appointment types are mapped to the `CaseType` enum:

| PIMS Type      | Case Type   | Description          |
| -------------- | ----------- | -------------------- |
| `exam`         | `checkup`   | General examination  |
| `checkup`      | `checkup`   | Wellness visit       |
| `wellness`     | `checkup`   | Annual checkup       |
| `vaccination`  | `checkup`   | Vaccine appointment  |
| `surgery`      | `surgery`   | Surgical procedure   |
| `dental`       | `surgery`   | Dental procedure     |
| `emergency`    | `emergency` | Emergency visit      |
| `follow-up`    | `follow_up` | Post-treatment check |
| `consultation` | `checkup`   | General consultation |

### Error Responses

All endpoints return consistent error responses:

**401 Unauthorized:**

```json
{
  "success": false,
  "error": "Missing X-API-Key header",
  "timestamp": "2026-01-17T15:30:00.000Z"
}
```

```json
{
  "success": false,
  "error": "Invalid API key",
  "timestamp": "2026-01-17T15:30:00.000Z"
}
```

```json
{
  "success": false,
  "error": "API key has expired",
  "timestamp": "2026-01-17T15:30:00.000Z"
}
```

**403 Forbidden:**

```json
{
  "success": false,
  "error": "Permission denied: sync:inbound",
  "timestamp": "2026-01-17T15:30:00.000Z"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "error": "PIMS authentication failed",
  "durationMs": 1234,
  "timestamp": "2026-01-17T15:30:00.000Z"
}
```

```json
{
  "success": false,
  "error": "No credentials found for clinic {clinic_id}",
  "durationMs": 123,
  "timestamp": "2026-01-17T15:30:00.000Z"
}
```

---

## Error Handling

### Retry Logic

The service does **not** automatically retry failed syncs. Callers should implement their own retry logic with exponential backoff.

**Recommended Retry Strategy:**

```typescript
async function syncWithRetry(maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch("/api/sync/full", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({ daysAhead: 7 }),
      });

      if (response.ok) {
        return await response.json();
      }

      // Don't retry on auth errors
      if (response.status === 401 || response.status === 403) {
        throw new Error("Authentication failed");
      }
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // Exponential backoff: 2^attempt seconds
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000),
      );
    }
  }
}
```

### Partial Failures

The `/api/sync/full` endpoint continues execution even if individual phases fail. Check each phase's `success` field:

```json
{
  "success": false,  // Overall failure if any phase failed
  "inboundResult": {
    "success": true,
    "stats": { ... }
  },
  "casesResult": {
    "success": false,  // This phase failed
    "error": "PIMS connection timeout",
    "stats": { ... }
  },
  "reconciliationResult": {
    "success": true,
    "stats": { ... }
  }
}
```

---

## Best Practices

### Sync Scheduling

**Recommended Schedule:**

```yaml
# Daily full sync at 2 AM (low traffic)
full-sync:
  schedule: "0 2 * * *"
  endpoint: /api/sync/full
  params:
    daysAhead: 7
    lookbackDays: 7

# Hourly inbound sync during business hours
inbound-sync:
  schedule: "0 9-17 * * *"
  endpoint: /api/sync/inbound
  params:
    daysAhead: 1

# Case enrichment after business hours
case-sync:
  schedule: "0 18 * * *"
  endpoint: /api/sync/cases
  params:
    startDate: "today"
```

### Date Range Optimization

**Good:**

```json
// Sync only what's needed
{
  "startDate": "2026-01-17",
  "endDate": "2026-01-24"
}
```

**Avoid:**

```json
// Don't sync unnecessarily large ranges
{
  "startDate": "2020-01-01",
  "endDate": "2026-12-31" // ❌ 7 years of data!
}
```

### Parallel Batch Size

The `parallelBatchSize` parameter controls concurrent PIMS fetches. Tune based on PIMS system capacity:

- **IDEXX Neo**: 5-10 concurrent requests (default: 5)
- **Slower PIMS**: 1-3 concurrent requests
- **High-performance PIMS**: 10-20 concurrent requests

### API Key Rotation

Rotate API keys regularly for security:

```sql
-- Disable old key
UPDATE clinic_api_keys
SET is_active = false
WHERE id = 'old-key-uuid';

-- Create new key
INSERT INTO clinic_api_keys (clinic_id, key_prefix, key_hash, permissions)
VALUES ('clinic-uuid', 'new-prefix', 'new-hash', ARRAY['sync:*']);
```

### Monitoring

Track sync health using the `case_sync_audits` table:

```sql
-- Recent sync history
SELECT
  sync_type,
  status,
  cases_created,
  cases_updated,
  cases_deleted,
  error_message,
  created_at
FROM case_sync_audits
WHERE clinic_id = 'your-clinic-uuid'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Sync success rate
SELECT
  sync_type,
  COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as success_rate
FROM case_sync_audits
WHERE clinic_id = 'your-clinic-uuid'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY sync_type;
```

---

## Related Documentation

- [PIMS Sync Service README](../README.md) - Service overview
- [IDEXX Provider](../../../libs/integrations/idexx/README.md) - IDEXX Neo integration
- [Domain Sync Services](../../../libs/domain/sync/README.md) - Business logic layer
- [Database Schema](../../../docs/architecture/DATABASE_CONTEXT.md) - Table schemas

---

**Version**: 4.0.0
**Last Updated**: 2026-01-17
