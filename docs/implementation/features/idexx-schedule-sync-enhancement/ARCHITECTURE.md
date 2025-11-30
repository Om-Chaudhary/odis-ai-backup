# Architecture

**Related Jira Tickets:**

- [ODIS-48](https://odisai.atlassian.net/browse/ODIS-48) - Schedule sync API endpoint
- [ODIS-63](https://odisai.atlassian.net/browse/ODIS-63) - Migrate existing users to clinic schedule schema
- [ODIS-64](https://odisai.atlassian.net/browse/ODIS-64) - Add clinic lookup utilities and integrate with existing code

## System Design

```
User Layer (Chrome Extension | Web Dashboard | iOS App)
    ↓
API & Security (Credential Encryption | Authentication | RLS)
    ↓
Data Persistence (Supabase PostgreSQL with Encrypted Storage)
    ↓
Automation Orchestration (Railway Container - Playwright + Cron)
    ↓
External Services (IDEXX Neo | QStash | VAPI | PostHog)
```

## Key Components

### Playwright Sync Service

- Automated browser-based scraping of IDEXX Neo
- Session management with auto-reauthentication
- Consultation data extraction (last 48 hours)

### Encryption Service

- AES-256-GCM encryption for credentials
- PBKDF2 key derivation
- Separate keys per environment

### Reconciliation Engine

- Matches IDEXX consultations with existing cases
- Updates case metadata with clinical notes
- Schedules discharge calls via QStash

## Data Flow

### Sync Process

1. Cron triggers sync (every 4 hours)
2. Fetch enabled clinics from database
3. For each clinic:
   - Decrypt credentials
   - Login to IDEXX Neo via Playwright
   - Scrape consultations (last 48h)
   - Reconcile with database cases
   - Update case metadata if notes found
   - Schedule discharge calls via QStash
   - Log sync session

### Credential Management

1. User submits credentials via UI
2. API validates with IDEXX
3. Credentials encrypted (AES-256-GCM)
4. Stored in database with validation status

## Database Tables

- `idexx_credentials` - Encrypted credentials per user
- `idexx_sync_sessions` - Sync execution tracking
- `consultation_sync_status` - Reconciliation status
- `idexx_sync_audit_log` - HIPAA-compliant audit trail

## Design Principles

1. **Security First**: All credentials encrypted, RLS enforced
2. **Resilience**: Automatic retry, session recovery
3. **Scalability**: Support 100+ clinics concurrently
4. **Observability**: Comprehensive logging and monitoring
5. **Compliance**: HIPAA-compliant audit trail (6-year retention)

## Related

- **[Database Schema](./DATABASE.md)** - Table definitions
- **[Security](./SECURITY.md)** - Security architecture
- **[Implementation](./IMPLEMENTATION.md)** - Implementation details
