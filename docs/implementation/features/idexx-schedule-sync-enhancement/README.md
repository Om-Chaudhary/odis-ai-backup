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

## Documentation Structure

```
idexx-schedule-sync-enhancement/
├── README.md (this file - overview)
├── PRD.md (complete product requirements)
├── ARCHITECTURE.md (system design & data flow)
├── DATABASE.md (schema & tables)
├── API.md (endpoint specifications)
├── SECURITY.md (encryption & compliance)
└── IMPLEMENTATION.md (phases & rollout)
```

## Quick Navigation

- **[PRD](./PRD.md)** - Complete product requirements document
- **[Architecture](./ARCHITECTURE.md)** - System design, data flow, components
- **[Database](./DATABASE.md)** - Schema, tables, migrations
- **[API](./API.md)** - Endpoint specifications
- **[Security](./SECURITY.md)** - Encryption, compliance, credential lifecycle
- **[Implementation](./IMPLEMENTATION.md)** - Phases, rollout plan, success metrics

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
