# Voicemail Hangup Implementation Summary

**Date**: December 3, 2024  
**Feature**: Configure VAPI to hang up on voicemail detection

## Problem

The existing voicemail detection feature would leave a message when voicemail was detected. Some users wanted the ability to hang up immediately instead, allowing the system to retry later and reach a live person.

## Solution

Added a new configuration flag `voicemail_hangup_on_detection` that controls whether VAPI hangs up or leaves a message when voicemail is detected.

### Key Insight from VAPI Discord

According to the VAPI Discord channel, to make the agent hang up on voicemail:

> Simply leave the voicemailMessage field empty in your assistant configuration:
>
> ```json
> {
>   "voicemailMessage": ""
> }
> ```

## Changes Made

### 1. Database Migration

**File**: `/supabase/migrations/20251203000000_add_voicemail_hangup_flag.sql`

```sql
ALTER TABLE users
ADD COLUMN voicemail_hangup_on_detection BOOLEAN NOT NULL DEFAULT false;
```

### 2. Call Execution Logic

**File**: `/src/app/api/webhooks/execute-call/route.ts`

- Fetch both `voicemail_detection_enabled` and `voicemail_hangup_on_detection` from database
- Configure voicemail tool with empty message when hangup is enabled:
  ```typescript
  messages: voicemailHangup
    ? [{ type: "request-start", content: "" }] // Empty = hang up
    : [{ type: "request-start", content: "Hi {{owner_name}}..." }];
  ```
- Store both flags in call metadata for webhook handler reference

### 3. Webhook Handler

**File**: `/src/app/api/webhooks/vapi/route.ts`

Updated `mapEndedReasonToStatus()`:

```typescript
// If hangup enabled: mark as FAILED (needs retry)
// If hangup disabled: mark as COMPLETED (message left)
return hangupOnVoicemail ? "failed" : "completed";
```

Updated `shouldRetry()`:

```typescript
// Only retry voicemail if hangup is enabled
return hangupOnVoicemail;
```

### 4. Client Helper

**File**: `/src/lib/vapi/client.ts`

Updated `shouldMarkAsFailed()`:

```typescript
// Failed only if we hung up without leaving message
return hangupOnVoicemail;
```

### 5. Database Types

**File**: `/src/database.types.ts`

Added `voicemail_hangup_on_detection: boolean` to:

- `users` Row type
- `users` Insert type
- `users` Update type

### 6. tRPC API

**File**: `/src/server/api/routers/cases.ts`

**Query**: `getDischargeSettings`

- Added `voicemail_hangup_on_detection` to SELECT
- Added to return type: `voicemailHangupOnDetection: boolean`

**Mutation**: `updateDischargeSettings`

- Added `voicemailHangupOnDetection: z.boolean().optional()` to input schema
- Added update logic for the field

### 7. Documentation

Created comprehensive documentation:

- `/docs/vapi/VOICEMAIL_DETECTION.md` - Full feature guide
- `/docs/vapi/VOICEMAIL_HANGUP_IMPLEMENTATION.md` - This file

## Behavior Matrix

| Detection Enabled | Hangup Enabled | Voicemail Result         | Status      | Retry |
| ----------------- | -------------- | ------------------------ | ----------- | ----- |
| `false`           | N/A            | Agent talks to voicemail | `failed`    | Yes   |
| `true`            | `false`        | Message left             | `completed` | No    |
| `true`            | `true`         | Hang up immediately      | `failed`    | Yes   |

## Testing Steps

1. **Run migration**:

   ```bash
   # Apply migration to add column
   supabase db push
   ```

2. **Enable feature for test user**:

   ```sql
   UPDATE users
   SET voicemail_detection_enabled = true,
       voicemail_hangup_on_detection = true
   WHERE id = 'test-user-uuid';
   ```

3. **Schedule test call** to a voicemail-enabled number

4. **Verify behavior**:
   - Check logs for "Hung up on voicemail" message
   - Verify call marked as `failed`
   - Verify retry scheduled
   - Check metadata includes both flags

## Future Enhancements

### UI Controls

Add settings UI to dashboard:

```tsx
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <Label>Voicemail Detection</Label>
    <Switch checked={voicemailDetectionEnabled} />
  </div>

  {voicemailDetectionEnabled && (
    <div className="flex items-center justify-between pl-6">
      <div>
        <Label>Hang up on voicemail</Label>
        <p className="text-muted-foreground text-sm">
          When enabled, calls will hang up and retry instead of leaving a
          message
        </p>
      </div>
      <Switch checked={voicemailHangupOnDetection} />
    </div>
  )}
</div>
```

### Analytics

Track voicemail metrics:

- Voicemail detection rate
- Success rate after retries
- Average retries before reaching live person
- Time to first live conversation

### Smart Retry

Consider time-of-day patterns:

- Don't retry voicemail during business hours (likely to get voicemail again)
- Retry during evenings/weekends when owner more likely to answer

## Migration Commands

```bash
# Development
supabase db push

# Production
# The migration will auto-apply on next deployment
# Or manually apply:
supabase db push --project-ref your-project-ref
```

## Rollback Plan

If issues arise:

```sql
-- Disable feature for all users
UPDATE users SET voicemail_hangup_on_detection = false;

-- Or rollback migration
ALTER TABLE users DROP COLUMN voicemail_hangup_on_detection;
```

## References

- VAPI Discord: https://discord.com/channels/1197796334288109608/1197796334288109611/1284932947156836425
- VAPI Docs: https://docs.vapi.ai/api-reference/assistants/create
