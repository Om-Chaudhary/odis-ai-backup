# Notion Content - Ready to Copy/Paste

This file contains all the content formatted for Notion. You can copy each section directly into Notion pages.

## Parent Page: IDEXX Schedule Sync Enhancement

Copy the content below into a new page under Engineering Hub:

---

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

---

## Child Page 1: Product Requirements Document (PRD)

Create as a child page of "IDEXX Schedule Sync Enhancement"

[Full PRD content - see PRD.md file - too long to include here, copy from PRD.md]

---

## Child Page 2: Architecture

Create as a child page of "IDEXX Schedule Sync Enhancement"

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

---

## Child Page 3: Database Schema

Create as a child page of "IDEXX Schedule Sync Enhancement"

[Copy content from DATABASE.md]

---

## Child Page 4: API Specifications

Create as a child page of "IDEXX Schedule Sync Enhancement"

[Copy content from API.md]

---

## Child Page 5: Security & Compliance

Create as a child page of "IDEXX Schedule Sync Enhancement"

[Copy content from SECURITY.md]

---

## Child Page 6: Implementation Plan

Create as a child page of "IDEXX Schedule Sync Enhancement"

[Copy content from IMPLEMENTATION.md]

---

## Instructions

1. Go to Engineering Hub in Notion
2. Create a new page: "IDEXX Schedule Sync Enhancement"
3. Copy the parent page content above
4. Create child pages for each section
5. Copy content from the respective .md files
6. Link pages together using @ mentions
