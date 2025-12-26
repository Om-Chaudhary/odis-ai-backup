# Cleaned Transcript Display Implementation

## Overview

Both the inbound and outbound dashboards now consistently display AI-cleaned transcripts when available from the database, with automatic fallback to raw transcripts.

## Database Schema

Both call tables include the `cleaned_transcript` column:

- `inbound_vapi_calls.cleaned_transcript` - AI-cleaned version of inbound call transcripts
- `scheduled_discharge_calls.cleaned_transcript` - AI-cleaned version of outbound call transcripts

Transcripts are cleaned automatically by the webhook handler when calls complete, using Claude to fix transcription errors, typos, and improve readability while preserving the original meaning.

## Implementation Status

### ✅ Inbound Dashboard

**Components:**

- `InboundCallRecording` component (used in appointments and messages)
  - Fetches `cleaned_transcript` via `getInboundCallByVapiId` tRPC query
  - Uses cleaned transcript from DB if available
  - Falls back to on-demand cleaning for older calls
  - Priority: displayTranscript (user override) > translated > cleaned > raw

**Database Queries:**

- `inboundCalls.getInboundCallByVapiId` - Already includes `cleaned_transcript`
- Returns both `transcript` and `cleanedTranscript` to client

### ✅ Outbound Dashboard

**Components:**

1. **CallRecordingPlayer** (shared component)
   - Used in workflow modal, call tab content, and case details
   - Logic: `displayTranscript = showRawTranscript ? transcript : (cleanedTranscript ?? transcript)`
   - Shows "Enhanced" badge when cleaned version differs from raw
   - Toggle button to switch between enhanced and original

2. **Case Detail Client** (`case-detail-client.tsx`)
   - Uses accordion to display transcript
   - Shows "Enhanced" badge for cleaned transcripts
   - Toggle to view original vs enhanced
   - Logic: `showRawTranscript ? transcript : (cleaned_transcript ?? transcript)`

3. **Workflow Modal** (`workflow-modal.tsx`)
   - Passes `cleanedTranscript` prop to `CallRecordingPlayer`

4. **Call Tab Content** (`call-tab-content.tsx`)
   - Passes `cleanedTranscript` prop to `CallRecordingPlayer`

**Database Queries:**

- `outbound.listCases` - Already includes `cleaned_transcript` (line 363)
- `outbound.getCaseById` - **FIXED**: Now includes `cleaned_transcript` in query and response

## Changes Made (Dec 25, 2024)

### Fixed Missing Field

**File:** `apps/web/src/server/api/routers/outbound/procedures/get-case-by-id.ts`

1. Added `cleaned_transcript: string | null;` to `ScheduledCallData` interface
2. Added `cleaned_transcript` to the SQL SELECT query for `scheduled_discharge_calls`
3. Added `cleanedTranscript: call.cleaned_transcript` to the returned `scheduledCall` object

This ensures that the outbound case detail view receives the cleaned transcript from the database.

## User Experience

### Default Behavior

- **Always shows cleaned transcript** if available in database
- Fallback to raw transcript if no cleaned version exists
- "Enhanced" badge indicates AI-cleaned transcript is being shown

### Manual Override

- Users can toggle to view "Original" transcript using the toggle button
- State is maintained per component instance (not persisted)
- Useful for comparing or verifying transcript accuracy

### Cleaning Process

1. **Automatic (Webhook)**: New calls are cleaned automatically when webhook receives end-of-call report
2. **On-Demand (Inbound Only)**: Older inbound calls without cleaned_transcript are cleaned when viewed
3. **Backfill Scripts**:
   - `scripts/backfill-inbound-transcripts.ts` - Clean historical inbound calls
   - `scripts/backfill-outbound-transcripts.ts` - Clean historical outbound calls

## Technical Details

### Cleaning Logic (Claude AI)

The cleaning process:

- Fixes transcription errors and typos
- Corrects speaker labels
- Preserves original meaning
- Maintains conversation flow
- Handles clinic-specific terminology
- Does NOT modify if transcript is already high quality

### Performance Considerations

- Cleaned transcripts are stored in database (not computed on-demand)
- No performance impact on query times
- UI shows enhanced version by default without additional API calls

## Testing

To verify implementation:

1. **Inbound Calls:**
   - Navigate to inbound appointment/message with recording
   - Verify transcript shows "Enhanced" badge if cleaned version exists
   - Toggle to "Show Original" and verify raw transcript displays
   - Check that older calls trigger on-demand cleaning

2. **Outbound Calls:**
   - Navigate to outbound case detail with completed call
   - Verify transcript shows "Enhanced" badge if cleaned version exists
   - Toggle to "Show Original" and verify raw transcript displays
   - Check workflow modal transcript display
   - Check communication tabs transcript display

3. **Database Verification:**

   ```sql
   -- Check cleaned transcript coverage
   SELECT
     COUNT(*) as total,
     COUNT(cleaned_transcript) as cleaned,
     ROUND(COUNT(cleaned_transcript) * 100.0 / COUNT(*), 2) as coverage_pct
   FROM inbound_vapi_calls
   WHERE transcript IS NOT NULL;

   SELECT
     COUNT(*) as total,
     COUNT(cleaned_transcript) as cleaned,
     ROUND(COUNT(cleaned_transcript) * 100.0 / COUNT(*), 2) as coverage_pct
   FROM scheduled_discharge_calls
   WHERE transcript IS NOT NULL;
   ```

## Future Enhancements

Potential improvements:

- [ ] Persist user preference for showing enhanced vs original
- [ ] Add diff view to highlight changes between raw and cleaned
- [ ] Support bulk cleaning of historical transcripts via admin UI
- [ ] Add quality metrics for cleaned transcripts
- [ ] Show confidence score for cleaning accuracy
