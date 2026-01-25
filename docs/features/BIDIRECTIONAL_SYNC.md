# Bidirectional Sync Feature

## Overview

The bidirectional sync feature provides a unified "Full Sync" operation that handles both backward-looking case ingestion (past 14 days) and forward-looking schedule sync (next 14 days) in a single operation.

## Architecture

### Sync Flow

```
Full Sync (Bidirectional):
├─ Phase 1: Backward Inbound Sync (today - 14d → today)
│  └─ Creates/updates cases from past appointments
│  └─ Captures historical cases that may have been missed
├─ Phase 2: Case Enrichment (past appointments only)
│  └─ Fetches consultation data (SOAP notes, discharge summaries)
│  └─ Only runs on backward range (consultation data available for completed visits)
├─ Phase 3: Forward Inbound Sync (today → today + 14d)
│  └─ Creates/updates appointments for VAPI scheduling
│  └─ Populates schedule slots for inbound assistant booking
└─ Phase 4: Reconciliation (7-day lookback)
   └─ Soft-deletes orphaned cases removed from PIMS
   └─ Updates case statuses if changed in PIMS
```

### Key Components

#### Backend Services

1. **SyncOrchestrator** (`libs/domain/sync/data-access/src/services/sync-orchestrator.ts`)
   - New method: `runBidirectionalSync(options)`
   - Coordinates all four sync phases
   - Handles errors gracefully (continues with remaining phases if one fails)

2. **PIMS Sync API** (`apps/pims-sync/src/routes/sync.route.ts`)
   - Updated `/api/sync/full` endpoint
   - Supports `bidirectional: true` flag (default)
   - Accepts `backwardDays` and `forwardDays` parameters

#### Frontend Components

1. **Admin Sync Router** (`apps/web/src/server/api/routers/admin/sync/router.ts`)
   - New procedure: `triggerFullSync`
   - Schema: `triggerFullSyncSchema` with `lookbackDays` and `forwardDays`

2. **Sync Trigger Panel** (`apps/web/src/components/admin/sync/sync-trigger-panel.tsx`)
   - Primary button: "Full Sync (Past 14d + Next 14d)"
   - Collapsible "Advanced" section with individual sync operations
   - Unified loading state across all buttons

3. **Sync History Table** (`apps/web/src/components/admin/sync/sync-history-table.tsx`)
   - Displays "Full Sync" type with purple badge
   - Shows error messages for failed syncs
   - Better visual hierarchy for sync results

## Usage

### Admin Dashboard

1. Navigate to `/dashboard/admin/sync`
2. Select a clinic from the dropdown (or view all clinics)
3. Click "Full Sync (Past 14d + Next 14d)" button
4. Monitor progress in "Active Sync Operations" section
5. View results in "Sync History" table

### Advanced: Individual Operations

1. Expand "Advanced: Individual Sync Operations"
2. Trigger specific operations:
   - **Inbound Only**: Forward-looking appointments only
   - **Cases Only**: Consultation enrichment only
   - **Reconcile Only**: Orphan cleanup only

### API Usage

```bash
# Trigger full bidirectional sync via PIMS Sync API
curl -X POST https://pims-sync-production.up.railway.app/api/sync/full \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PIMS_SYNC_API_KEY" \
  -d '{
    "clinicId": "uuid",
    "bidirectional": true,
    "backwardDays": 14,
    "forwardDays": 14
  }'

# Trigger via tRPC (from web app)
await trpc.admin.sync.triggerFullSync.mutate({
  clinicId: "uuid",
  lookbackDays: 14,
  forwardDays: 14
});
```

## Configuration

### Default Values

- **Backward lookback**: 14 days
- **Forward horizon**: 14 days
- **Reconciliation lookback**: 7 days
- **Parallel batch size** (case enrichment): 5 concurrent requests

### Customization

Modify defaults in:
- API requests: Pass `backwardDays`/`forwardDays` parameters
- Clinic config: Future enhancement to add per-clinic preferences

## Data Flow

### Backward Sync (Historical Cases)

1. **Date range**: `today - 14 days` → `today`
2. **Fetch appointments** from IDEXX Neo via Playwright
3. **Create/update cases** with `external_id` deduplication
4. **Enrich cases** with consultation data (SOAP notes, discharge summaries)
5. **Result**: Historical cases available for review and discharge call preparation

### Forward Sync (VAPI Scheduling)

1. **Date range**: `today` → `today + 14 days`
2. **Fetch appointments** from IDEXX Neo
3. **Create/update appointments** in `schedule_appointments` table
4. **Update slot counts** in `schedule_slots` table
5. **Result**: VAPI inbound assistant can query and book available slots

### Reconciliation (Cleanup)

1. **Date range**: Last 7 days
2. **Fetch appointments** from IDEXX Neo
3. **Compare** with local cases by `external_id`
4. **Soft-delete orphans**: Cases removed from PIMS
5. **Update statuses**: Cases with changed status in PIMS

## Database Schema

### Key Tables

- **`cases`**: Main case storage (discharge calls, historical cases)
  - `external_id`: PIMS appointment ID for deduplication
  - `metadata.pimsAppointment`: Original appointment data
  - `metadata.pimsConsultation`: Consultation enrichment data

- **`schedule_appointments`**: Individual appointments (VAPI scheduling)
  - `neo_appointment_id`: IDEXX Neo appointment ID
  - `slot_id`: Links to `schedule_slots`

- **`schedule_slots`**: Time slots with capacity tracking
  - `booked_count`: Updated from `schedule_appointments`
  - `capacity`: Max appointments per slot

- **`case_sync_audits`**: Sync operation audit trail
  - `sync_type`: `'inbound' | 'cases' | 'reconciliation' | 'full'`
  - `status`: `'in_progress' | 'completed' | 'failed'`
  - Statistics: `appointments_found`, `cases_created`, `cases_updated`, `cases_deleted`

## Testing

### Manual Testing

1. **Trigger full sync** for a test clinic
2. **Verify backward sync**:
   - Check `cases` table for cases from past 14 days
   - Verify `metadata.pimsAppointment` is populated
3. **Verify case enrichment**:
   - Check `metadata.pimsConsultation` for past cases
   - Confirm discharge summaries are present
4. **Verify forward sync**:
   - Check `schedule_appointments` for next 14 days
   - Verify `schedule_slots.booked_count` is updated
5. **Verify reconciliation**:
   - Check orphaned cases are soft-deleted (status = 'reviewed')
   - Verify `metadata.reconciliation` contains deletion metadata

### API Testing

```bash
# Check PIMS sync service health
curl https://pims-sync-production.up.railway.app/health

# View sync history
# (Use web dashboard at /dashboard/admin/sync)
```

### Monitoring

- **Active syncs**: `/dashboard/admin/sync` → "Active Sync Operations"
- **Sync history**: `/dashboard/admin/sync` → "Sync History" table
- **Logs**: Check PIMS Sync service logs for detailed operation logs

## Troubleshooting

### Sync Failed

1. **Check credentials**: Verify IDEXX credentials are active and valid
2. **Check service health**: Visit PIMS Sync `/health` endpoint
3. **Review error message**: Check "Error" column in sync history table
4. **Check logs**: Review PIMS Sync service logs for detailed errors

### Missing Cases

1. **Verify date range**: Ensure backward sync covers desired date range
2. **Check deduplication**: Cases with same `external_id` are updated, not duplicated
3. **Run reconciliation**: Soft-deleted cases may need to be restored

### Schedule Slots Not Updated

1. **Verify forward sync**: Check `schedule_appointments` table
2. **Check slot counts**: Run `update_slot_counts_bulk()` function manually
3. **Verify business hours**: Ensure clinic has valid schedule config

## Future Enhancements

1. **Per-clinic configuration**:
   - Add `backward_sync_days` to `clinic_schedule_config`
   - Add `forward_sync_days` to `clinic_schedule_config`

2. **Scheduled bidirectional sync**:
   - Add cron schedule for automatic full sync (e.g., daily at 2 AM)

3. **Sync type tracking**:
   - Add dedicated `sync_type` column for "full" vs individual syncs
   - Track phase-level results in `case_sync_audits`

4. **Performance optimizations**:
   - Parallel PIMS fetching for multiple date ranges
   - Incremental sync (only changed appointments)

## Related Documentation

- [PIMS Sync Architecture](../architecture/PIMS_SYNC.md)
- [VAPI Scheduling System](../architecture/VAPI_SCHEDULING.md)
- [Testing Strategy](../testing/TESTING_STRATEGY.md)
- [Admin Sync Dashboard Plan](../../.cursor/plans/admin_sync_enhancement_6ab2dc96.plan.md)
