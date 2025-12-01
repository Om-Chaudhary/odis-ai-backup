# Notion AI Prompt - IDEXX Schedule Sync Enhancement Documentation

Copy and paste this entire prompt into Notion AI to create all the documentation pages:

---

**Create a comprehensive documentation structure for "IDEXX Schedule Sync Enhancement" under the Engineering Hub page. Create a parent page and 6 child pages with the following content:**

## PARENT PAGE: "IDEXX Schedule Sync Enhancement"

Create this as a child page under Engineering Hub (💻 Engineering Hub).

**Content:**

# IDEXX Schedule Sync Enhancement

**Status:** Planning  
**Timeline:** 10 weeks (5 phases)  
**Priority:** High

**Related Jira Tickets:**

- [ODIS-48](https://odisai.atlassian.net/browse/ODIS-48) - Schedule sync API endpoint
- [ODIS-63](https://odisai.atlassian.net/browse/ODIS-63) - Migrate existing users to clinic schedule schema
- [ODIS-64](https://odisai.atlassian.net/browse/ODIS-64) - Add clinic lookup utilities and integrate with existing code

## Overview

This feature implements automated Playwright-based reconciliation for IDEXX Neo schedule sync, solving the "stale consultation notes" problem. The system autonomously syncs clinical notes written after appointments, eliminating manual intervention requirements.

## Key Outcomes

- ✅ **Zero-touch reconciliation**: Clinical notes automatically synced every 4 hours
- ✅ **Automated discharge calls**: Scheduled immediately when appointments complete
- ✅ **95%+ sync success rate**: Reliable autonomous operation
- ✅ **Full audit trail**: HIPAA-compliant logging of all operations
- ✅ **Multi-clinic scalability**: Support 100+ clinics with isolated data

## Problem Statement

**Current State:**

- Cases created from schedule sync (night before)
- Vets write notes during/after appointments
- Manual sync required to capture notes
- Often forgotten → stale data forever

**Future State:**

- Cases created from schedule sync
- Vets write notes normally
- Notes auto-sync every 4 hours
- Discharge calls auto-scheduled

**Evidence:**

- 96.5% of cases missing clinical data (252 cases with 0 SOAP notes)
- Only 0.8% have consultation_id available
- Manual sync rarely happens post-appointment

## Quick Navigation

- [Product Requirements Document](#) - Complete PRD
- [Architecture](#) - System design, data flow, components
- [Database Schema](#) - Schema, tables, migrations
- [API Specifications](#) - Endpoint specifications
- [Security & Compliance](#) - Encryption, compliance, credential lifecycle
- [Implementation Plan](#) - Phases, rollout plan, success metrics

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

- Database schema creation
- Encryption service implementation
- Credential management APIs
- Unit tests for encryption

### Phase 2: Automation Core (Week 3-4)

- Playwright sync service
- Consultation scraping logic
- Reconciliation engine
- Discharge call scheduling

### Phase 3: Infrastructure (Week 5-6)

- Docker containerization
- Railway deployment
- Cron job configuration
- Health monitoring

### Phase 4: User Experience (Week 7-8)

- Chrome extension credential UI
- Monitoring dashboard
- Manual sync triggers
- Error notifications

### Phase 5: Production Rollout (Week 9-10)

- Beta test with 5 clinics
- Performance optimization
- Full production deployment
- Documentation and training

## Success Criteria

### Primary KPIs

- **Sync Success Rate**: >95%
- **Notes Completeness**: >90% (currently 3.5%)
- **Discharge Call Rate**: >80% (currently <5%)
- **Sync Latency**: <4 hours (currently 24-48 hours)
- **User Adoption**: >75%

### Operational Metrics

- **MTBF**: >7 days
- **MTTR**: <30 minutes
- **Resource Usage**: <512MB RAM, 0.5 CPU per clinic
- **Cost per Clinic**: <$0.50/month

## Key Technologies

- **Playwright** - Browser automation for IDEXX Neo scraping
- **AES-256-GCM** - Credential encryption at rest
- **Supabase** - PostgreSQL database with RLS
- **QStash** - Scheduled task execution
- **VAPI** - Automated discharge calls
- **Railway** - Containerized cron jobs
- **PostHog** - Analytics and monitoring

## Related Documentation

- **VAPI Integration**: `docs/vapi/` - Voice call integration
- **Database Migrations**: `supabase/migrations/` - Schema migrations

---

**Last Updated:** 2025-01-27

---

## CHILD PAGE 1: "Architecture"

Create as a child page of "IDEXX Schedule Sync Enhancement"

**Content:**

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

---

## CHILD PAGE 2: "Database Schema"

Create as a child page of "IDEXX Schedule Sync Enhancement"

**Content:**

# Database Schema

**Related Jira Tickets:**

- [ODIS-63](https://odisai.atlassian.net/browse/ODIS-63) - Migrate existing users to clinic schedule schema
- [ODIS-64](https://odisai.atlassian.net/browse/ODIS-64) - Add clinic lookup utilities and integrate with existing code

## Tables

### `idexx_credentials`

Encrypted IDEXX Neo credentials per user.

```sql
CREATE TABLE idexx_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  encrypted_username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  encryption_key_id TEXT NOT NULL,
  last_validated_at TIMESTAMPTZ,
  validation_status TEXT CHECK (validation_status IN ('valid', 'invalid', 'unknown')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
```

### `idexx_sync_sessions`

Tracks each sync execution session.

```sql
CREATE TABLE idexx_sync_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id),
  status TEXT CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  consultations_synced INTEGER DEFAULT 0,
  consultations_failed INTEGER DEFAULT 0,
  discharge_calls_scheduled INTEGER DEFAULT 0,
  error_details JSONB,
  next_scheduled_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `consultation_sync_status`

Tracks reconciliation status for each consultation.

```sql
CREATE TABLE consultation_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id),
  sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'failed')),
  has_clinical_notes BOOLEAN DEFAULT false,
  notes_synced_at TIMESTAMPTZ,
  discharge_call_scheduled BOOLEAN DEFAULT false,
  discharge_call_id UUID REFERENCES scheduled_discharge_calls(id),
  last_sync_attempt TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(consultation_id, user_id)
);
```

### `idexx_sync_audit_log`

HIPAA-compliant audit log (6-year retention).

```sql
CREATE TABLE idexx_sync_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status TEXT,
  ip_address INET,
  session_id TEXT,
  error_details JSONB,
  metadata JSONB
);
```

## Row-Level Security

All tables have RLS enabled:

- Users can only access their own data
- Service role can access all data for automation
- Admins can access all data for monitoring

## Indexes

- `idexx_credentials`: `user_id`, `validation_status`
- `idexx_sync_sessions`: `user_id`, `status`, `started_at`
- `consultation_sync_status`: `user_id`, `case_id`, `consultation_id`, `sync_status`
- `idexx_sync_audit_log`: `user_id`, `timestamp`, `action`

## Related

- **[Architecture](./ARCHITECTURE.md)** - System design
- **[Security](./SECURITY.md)** - RLS policies
- **[Implementation](./IMPLEMENTATION.md)** - Migration steps

---

## CHILD PAGE 3: "API Specifications"

Create as a child page of "IDEXX Schedule Sync Enhancement"

**Content:**

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

---

## CHILD PAGE 4: "Security & Compliance"

Create as a child page of "IDEXX Schedule Sync Enhancement"

**Content:**

# Security & Compliance

## Security Architecture

### Layer 1: Transport Security

- HTTPS/TLS 1.3 for all API calls
- Certificate pinning for IDEXX connections

### Layer 2: Authentication & Authorization

- Supabase Auth for user authentication
- RLS policies for data isolation
- Service role for automated operations

### Layer 3: Credential Encryption

- AES-256-GCM encryption at rest
- PBKDF2 key derivation (100,000 iterations)
- Separate encryption keys per environment

### Layer 4: Audit & Compliance

- Comprehensive audit logging
- 6-year retention (HIPAA requirement)
- Tamper-proof audit trail

## Encryption Implementation

```typescript
// AES-256-GCM encryption
const algorithm = 'aes-256-gcm';
const keyDerivation = 'pbkdf2'; // 100,000 iterations

// Encrypt credentials before storage
async encrypt(text: string, keyId: string): Promise<EncryptedData> {
  const key = await deriveKey(keyId); // PBKDF2
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, key, iv);
  // ... encryption logic
  return { encrypted, iv, authTag, keyId };
}
```

## HIPAA Compliance Checklist

- ✅ **Encryption**: AES-256 for data at rest and in transit
- ✅ **Access Control**: RLS policies enforce user isolation
- ✅ **Audit Logs**: All access logged with timestamp and user
- ✅ **Data Retention**: 6-year retention policy
- ✅ **Breach Notification**: Alert system for unauthorized access
- ⚠️ **Business Associate Agreement**: Required with IDEXX

## Credential Lifecycle

```
[not_configured] → [configured] → [validated] → [active]
                                         ↓
                                    [suspended] (on validation failure)
                                         ↓
                                    [active] (on re-validation)
```

**States:**

- `not_configured` - No credentials stored
- `configured` - Credentials stored, not validated
- `validated` - Credentials tested and working
- `active` - Sync enabled
- `suspended` - Validation failed, sync disabled

## Access Control

### Row-Level Security (RLS)

- Users can only access their own credentials and sync data
- Service role can access all data for automation
- Admins can access all data for monitoring

### Session Management

- Automatic session timeout detection
- Re-authentication on timeout
- Session refresh every 25 minutes
- Secure session storage

## Related

- **[Architecture](./ARCHITECTURE.md)** - System design
- **[Database](./DATABASE.md)** - RLS policies
- **[API](./API.md)** - Authentication details

---

## CHILD PAGE 5: "Implementation Plan"

Create as a child page of "IDEXX Schedule Sync Enhancement"

**Content:**

# Implementation & Rollout

**Related Jira Tickets:**

- [ODIS-48](https://odisai.atlassian.net/browse/ODIS-48) - Schedule sync API endpoint
- [ODIS-63](https://odisai.atlassian.net/browse/ODIS-63) - Migrate existing users to clinic schedule schema
- [ODIS-64](https://odisai.atlassian.net/browse/ODIS-64) - Add clinic lookup utilities and integrate with existing code

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

- Database schema creation ([ODIS-63](https://odisai.atlassian.net/browse/ODIS-63))
- Encryption service implementation
- Credential management APIs ([ODIS-48](https://odisai.atlassian.net/browse/ODIS-48))
- Unit tests for encryption

### Phase 2: Automation Core (Week 3-4)

- Playwright sync service ([ODIS-48](https://odisai.atlassian.net/browse/ODIS-48))
- Consultation scraping logic
- Reconciliation engine
- Discharge call scheduling

### Phase 3: Infrastructure (Week 5-6)

- Docker containerization
- Railway deployment
- Cron job configuration (every 4 hours)
- Health monitoring

### Phase 4: User Experience (Week 7-8)

- Chrome extension credential UI
- Monitoring dashboard ([ODIS-64](https://odisai.atlassian.net/browse/ODIS-64))
- Manual sync triggers ([ODIS-48](https://odisai.atlassian.net/browse/ODIS-48))
- Error notifications

### Phase 5: Production Rollout (Week 9-10)

- Beta test with 5 clinics
- Performance optimization
- Full production deployment
- Documentation and training

## Success Metrics

### Primary KPIs

- **Sync Success Rate**: >95%
- **Notes Completeness**: >90% (currently 3.5%)
- **Discharge Call Rate**: >80% (currently <5%)
- **Sync Latency**: <4 hours (currently 24-48 hours)
- **User Adoption**: >75%

### Operational Metrics

- **MTBF**: >7 days
- **MTTR**: <30 minutes
- **Resource Usage**: <512MB RAM, 0.5 CPU per clinic
- **Cost per Clinic**: <$0.50/month

## Risk Mitigation

| Risk              | Probability | Impact   | Mitigation                                  |
| ----------------- | ----------- | -------- | ------------------------------------------- |
| IDEXX UI Changes  | Medium      | High     | Robust selectors, visual regression testing |
| Session Timeout   | High        | Low      | Auto re-authentication, 25min refresh       |
| Credential Breach | Low         | Critical | AES-256 encryption, audit logging           |
| Rate Limiting     | Medium      | Medium   | Request throttling, exponential backoff     |

## Monitoring & Alerting

### PostHog Events

- `sync.started` - Sync initiated
- `sync.completed` - Sync finished successfully
- `sync.failed` - Sync failed with error
- `discharge.scheduled` - Discharge call scheduled
- `credential.validated` - Credential validation result

### Alert Thresholds

- Sync failure rate >10%
- Sync duration >10 minutes
- 3 consecutive failures
- No sync in 24 hours

## Related

- **[Architecture](./ARCHITECTURE.md)** - System design
- **[Database](./DATABASE.md)** - Schema details
- **[API](./API.md)** - Endpoint specs
- **[Security](./SECURITY.md)** - Security details

---

## CHILD PAGE 6: "Product Requirements Document (PRD)"

Create as a child page of "IDEXX Schedule Sync Enhancement"

**Note:** The PRD is very long (997 lines). For this page, create it with a summary and link to the full document, or ask Notion AI to create a condensed version. The full PRD content is available in the repository at `docs/implementation/features/idexx-schedule-sync-enhancement/PRD.md`.

**Suggested Content:**

# Product Requirements Document (PRD)

**Version:** 2.0  
**Date:** November 29, 2024  
**Status:** Updated with Automation Strategy

**Related Jira Tickets:**

- [ODIS-48](https://odisai.atlassian.net/browse/ODIS-48) - Schedule sync API endpoint
- [ODIS-63](https://odisai.atlassian.net/browse/ODIS-63) - Migrate existing users to clinic schedule schema
- [ODIS-64](https://odisai.atlassian.net/browse/ODIS-64) - Add clinic lookup utilities and integrate with existing code

## Executive Summary

This PRD defines a comprehensive enhancement to the IDEXX Neo schedule sync system that solves the "stale consultation notes" problem through automated Playwright-based reconciliation. The system will autonomously sync clinical notes written after appointments, eliminating manual intervention requirements.

### Key Outcomes

- Zero-touch reconciliation: Clinical notes automatically synced every 4 hours
- Automated discharge calls: Scheduled immediately when appointments complete
- 95%+ sync success rate: Reliable autonomous operation
- Full audit trail: HIPAA-compliant logging of all operations
- Multi-clinic scalability: Support 100+ clinics with isolated data

## Scope

**In Scope:**

- Automated notes reconciliation via Playwright
- Secure credential storage with AES-256 encryption
- Containerized cron-based sync automation
- Automatic discharge call scheduling post-appointment
- Multi-clinic support with isolated data
- Comprehensive audit logging for HIPAA compliance
- Monitoring dashboard for sync operations
- Chrome extension credential configuration UI

**Out of Scope (Future Phases):**

- VAPI booking integration (Phase 3)
- Full PIMS migration for Cornerstone/ezyVet (Phase 4)
- OAuth integration with IDEXX (requires partnership)

## Problem Statement

**Current State:**

- Cases created from schedule sync (night before)
- Vets write notes during/after appointments
- Manual sync required to capture notes
- Often forgotten → stale data forever

**Evidence:**

- 96.5% of cases missing clinical data (252 cases with 0 SOAP notes)
- Only 0.8% have consultation_id available
- Manual sync rarely happens post-appointment

## Solution Architecture

The system uses Playwright automation to:

1. Automatically login to IDEXX Neo using stored encrypted credentials
2. Scrape consultations from the last 48 hours
3. Reconcile with existing cases in the database
4. Update case metadata with clinical notes
5. Schedule discharge calls via QStash
6. Log all operations for audit compliance

## Technical Implementation

- **Playwright**: Browser automation for IDEXX Neo scraping
- **AES-256-GCM**: Credential encryption at rest
- **Supabase**: PostgreSQL database with RLS
- **QStash**: Scheduled task execution
- **VAPI**: Automated discharge calls
- **Railway**: Containerized cron jobs

## Success Metrics

- **Sync Success Rate**: >95%
- **Notes Completeness**: >90% (currently 3.5%)
- **Discharge Call Rate**: >80% (currently <5%)
- **Sync Latency**: <4 hours (currently 24-48 hours)
- **User Adoption**: >75%

---

**Full PRD:** See repository file `docs/implementation/features/idexx-schedule-sync-enhancement/PRD.md` for complete details including functional requirements, non-functional requirements, risk analysis, and technical specifications.

---

## INSTRUCTIONS FOR NOTION AI:

1. Navigate to the Engineering Hub page (💻 Engineering Hub)
2. Create a new child page titled "IDEXX Schedule Sync Enhancement"
3. Add the parent page content above
4. Create 6 child pages under "IDEXX Schedule Sync Enhancement":
   - Architecture
   - Database Schema
   - API Specifications
   - Security & Compliance
   - Implementation Plan
   - Product Requirements Document (PRD)
5. Add the respective content to each child page as specified above
6. Format all code blocks, tables, and links properly
7. Ensure all pages are properly linked and organized

---

**End of Prompt**
