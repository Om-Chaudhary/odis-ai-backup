# Staggered Batch Discharge Scheduling

## Overview

Implemented staggered scheduling for batch discharge emails and calls to prevent overwhelming systems and provide better delivery spacing.

## Implementation Date

December 9, 2025

## Changes Made

### 1. Updated `DischargeBatchProcessor.processSingleCase()` Method

**File**: `libs/services/src/discharge-batch-processor.ts`

Modified the method signature to accept staggered schedule times as parameters:

```typescript
private async processSingleCase(
  caseData: EligibleCase,
  options: BatchProcessingOptions,
  staggeredEmailTime: Date,      // ← New parameter
  staggeredCallTime: Date,        // ← New parameter
): Promise<{...}>
```

The method now uses the provided staggered times instead of the base schedule times from options.

### 2. Added Stagger Calculation Logic

**File**: `libs/services/src/discharge-batch-processor.ts`

Updated the `processBatch()` method to calculate staggered times for each case based on its index:

**Staggering Rules:**

- **Emails**: Base time + (index × 20 seconds)
- **Calls**: Base time + (index × 2 minutes)

```typescript
chunk.map((caseData, chunkIndex) => {
  const globalIndex = i + chunkIndex;

  // Calculate staggered times
  const emailStagger = globalIndex * 20 * 1000; // 20 seconds in ms
  const callStagger = globalIndex * 2 * 60 * 1000; // 2 minutes in ms

  const staggeredEmailTime = new Date(
    options.emailScheduleTime.getTime() + emailStagger,
  );
  const staggeredCallTime = new Date(
    options.callScheduleTime.getTime() + callStagger,
  );

  return this.processSingleCase(
    caseData,
    options,
    staggeredEmailTime,
    staggeredCallTime,
  );
});
```

### 3. Added Logging

Added detailed logging for each case to track stagger times:

```typescript
console.log(
  `[BatchProcessor] Staggering case ${globalIndex + 1}/${cases.length}`,
  {
    caseId: caseData.id,
    patientName: caseData.patient_name,
    emailStagger: `+${globalIndex * 20}s`,
    callStagger: `+${globalIndex * 2}min`,
    staggeredEmailTime: staggeredEmailTime.toISOString(),
    staggeredCallTime: staggeredCallTime.toISOString(),
  },
);
```

## Staggering Examples

For a batch of 5 cases starting at:

- Email base time: 10:00:00 AM
- Call base time: 2:00:00 PM

### Email Schedule Times:

- Case 1: 10:00:00 AM (base time + 0 seconds)
- Case 2: 10:00:20 AM (base time + 20 seconds)
- Case 3: 10:00:40 AM (base time + 40 seconds)
- Case 4: 10:01:00 AM (base time + 60 seconds)
- Case 5: 10:01:20 AM (base time + 80 seconds)

### Call Schedule Times:

- Case 1: 2:00:00 PM (base time + 0 minutes)
- Case 2: 2:02:00 PM (base time + 2 minutes)
- Case 3: 2:04:00 PM (base time + 4 minutes)
- Case 4: 2:06:00 PM (base time + 6 minutes)
- Case 5: 2:08:00 PM (base time + 8 minutes)

## Testing

Created comprehensive unit tests in `libs/services/src/__tests__/discharge-batch-stagger.test.ts` to verify:

1. ✅ Email stagger calculation (20 seconds per case)
2. ✅ Call stagger calculation (2 minutes per case)
3. ✅ Stagger consistency across chunk boundaries
4. ✅ Correct time intervals between consecutive cases

All tests pass successfully.

## Benefits

1. **System Load Management**: Staggers email sending to avoid rate limits
2. **Call Quality**: Spaces out calls to ensure agents have sufficient time
3. **Scalability**: Works correctly for batches of any size (tested up to 25+ cases)
4. **Chunk Processing**: Maintains correct stagger across chunk boundaries

## Technical Notes

- Staggering is calculated using milliseconds for precision
- Global index is used across chunks to maintain consistent spacing
- The first case (index 0) uses the base schedule time with no stagger
- Logging provides visibility into scheduled times for debugging

## tRPC Batch Schedule Procedure

The tRPC `batchSchedule` procedure (called from the dashboard via "Send All Discharges" button) also implements staggering:

**File**: `apps/web/src/server/api/routers/outbound/procedures/batch-schedule.ts`

### Staggering Rules:

- **Immediate Mode**: Uses `staggerIntervalSeconds` input parameter (default 60 seconds) for both emails and calls
- **Scheduled Mode**:
  - Emails are staggered by 3 seconds each to avoid Resend rate limits
  - **Calls are staggered by 2 minutes each** to avoid VAPI 10-call concurrency limit

### Why 3 Seconds for Email Staggering?

Resend's free tier has a rate limit of 2 emails/second. With 3-second staggering:

- We stay well under the rate limit
- Provides buffer for any processing delays
- Prevents rate limit errors when scheduling 10+ cases at once

### Why 2 Minutes for Call Staggering?

VAPI has a 10-call concurrency limit. Calls that exceed this limit fail with "Over Concurrency Limit" error. With 2-minute staggering:

- Calls are spread out so concurrent execution stays under the 10-call limit
- Average call duration is ~2-3 minutes, so 2-minute spacing prevents overlap
- Matches the stagger interval used in `DischargeBatchProcessor`

### Example (Scheduled Mode, 5 cases):

**Emails** scheduled for 10:00:00 AM base time:

- Case 1: 10:00:00 AM
- Case 2: 10:00:03 AM (+3 seconds)
- Case 3: 10:00:06 AM (+6 seconds)
- Case 4: 10:00:09 AM (+9 seconds)
- Case 5: 10:00:12 AM (+12 seconds)

**Calls** scheduled for 4:00:00 PM base time:

- Case 1: 4:00:00 PM
- Case 2: 4:02:00 PM (+2 minutes)
- Case 3: 4:04:00 PM (+4 minutes)
- Case 4: 4:06:00 PM (+6 minutes)
- Case 5: 4:08:00 PM (+8 minutes)

## Migration History

### December 19, 2025 - Fix Call Staggering in Batch Schedule

**Problem**: The `batchSchedule` tRPC procedure was not staggering calls in scheduled mode. All calls were scheduled for the exact same time, causing VAPI "Over Concurrency Limit" errors.

**Solution**:

1. Applied migration `stagger_dec20_scheduled_calls` to fix 31 existing calls scheduled for `2025-12-20 01:57:45.934+00`
2. Updated `batch-schedule.ts` to stagger calls by 2 minutes in scheduled mode

### December 17, 2025 - Stagger Dec 17/18 Scheduled Calls

**Migration**: `20251217000000_stagger_dec18_scheduled_calls.sql`

Fixed 37+ calls that were scheduled for exactly `2025-12-18 22:00:00 UTC` by spreading them out with 2-minute intervals.

## Future Enhancements

Potential improvements for future consideration:

1. Make stagger intervals configurable per batch
2. Add support for different stagger strategies (exponential, custom)
3. Add UI indicators showing staggered schedule times in batch preview
4. Add metrics tracking for stagger effectiveness
