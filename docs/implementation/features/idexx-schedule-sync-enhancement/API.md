# API Specifications

**Related Jira Ticket:** [ODIS-48](https://odisai.atlassian.net/browse/ODIS-48) - Schedule sync API endpoint

## Credential Management

### POST /api/idexx/configure-credentials

Store and validate IDEXX Neo credentials.

**Request:**

```typescript
{
  username: string;
  password: string;
}
```

**Response:**

```typescript
{
  success: boolean;
  validationStatus: "valid" | "invalid" | "unknown";
  lastValidated: string; // ISO timestamp
}
```

**Behavior:** Validates credentials with IDEXX, encrypts with AES-256-GCM, stores in database.

### GET /api/idexx/sync-status

Get current sync status for authenticated user.

**Response:**

```typescript
{
  lastSync: {
    timestamp: string;
    status: 'completed' | 'failed' | 'running';
    consultationsSynced: number;
    dischargeCallsScheduled: number;
  } | null;
  nextScheduledSync: string;
  syncEnabled: boolean;
  credentialStatus: 'valid' | 'invalid' | 'not_configured';
}
```

### POST /api/idexx/trigger-sync

Manually trigger sync operation.

**Request:**

```typescript
{
  dateRange?: { start: string; end: string; }; // ISO dates
}
```

**Response:**

```typescript
{
  syncId: string; // UUID
  status: "started" | "queued";
  estimatedCompletion: string; // ISO timestamp
}
```

## Monitoring (Admin)

### GET /api/admin/idexx-sync/metrics

System-wide metrics (requires service role key).

**Response:**

```typescript
{
  totalClinics: number;
  enabledClinics: number;
  successRate: number; // percentage
  averageSyncTime: number; // seconds
  last24Hours: {
    syncs: number;
    failures: number;
    consultationsSynced: number;
    dischargeCallsScheduled: number;
  }
  errorLog: Array<{
    timestamp: string;
    clinic: string;
    error: string;
  }>;
}
```

## Authentication

- User endpoints: Supabase Auth JWT
- Admin endpoints: Service role key

## Rate Limiting

- Credential operations: 10 requests/hour per user
- Sync triggers: 5 requests/hour per user
- Monitoring: 100 requests/hour per admin

## Related

- **[Architecture](./ARCHITECTURE.md)** - System design
- **[Security](./SECURITY.md)** - Security details
