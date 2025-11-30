# Voicemail Detection Implementation Summary

## Changes Made

This document summarizes the implementation changes to properly handle voicemail detection when the feature flag is enabled.

### 1. Store Voicemail Detection Flag in Call Metadata

**File**: `src/app/api/webhooks/execute-call/route.ts`

When a call is executed, the voicemail detection flag is now stored in the call metadata so the webhook handler can reference it later:

```typescript
metadata: {
  ...metadata,
  executed_at: new Date().toISOString(),
  // Store voicemail detection flag for webhook handler reference
  voicemail_detection_enabled: voicemailEnabled,
}
```

This allows the webhook handler to determine if voicemail detection was enabled when processing call end events.

### 2. Updated Status Mapping to Handle Voicemail

**File**: `src/app/api/webhooks/vapi/route.ts`

The `mapEndedReasonToStatus` function now:
- Accepts optional metadata parameter
- Checks if voicemail detection was enabled when voicemail is detected
- Marks voicemail calls as **"completed"** (not "failed") when detection is enabled

```typescript
function mapEndedReasonToStatus(
  endedReason?: string,
  metadata?: Record<string, unknown>,
): "completed" | "failed" | "cancelled" {
  // ...
  
  // Voicemail handling: if voicemail detection was enabled and voicemail was detected,
  // mark as completed (message was successfully left)
  if (
    endedReason.toLowerCase().includes("voicemail") &&
    metadata?.voicemail_detection_enabled === true
  ) {
    return "completed";
  }
  
  // ...
}
```

### 3. Updated Retry Logic to Exclude Voicemail

**File**: `src/app/api/webhooks/vapi/route.ts`

The `shouldRetry` function now:
- Accepts optional metadata parameter
- Excludes voicemail from retry when voicemail detection is enabled
- Prevents retrying successful voicemail messages

```typescript
function shouldRetry(
  endedReason?: string,
  metadata?: Record<string, unknown>,
): boolean {
  // If voicemail was detected and voicemail detection was enabled, don't retry
  // (the message was successfully left, so call is complete)
  if (
    endedReason?.toLowerCase().includes("voicemail") &&
    metadata?.voicemail_detection_enabled === true
  ) {
    return false;
  }
  
  // ...
}
```

### 4. Updated Failed Status Detection

**File**: `src/lib/vapi/client.ts`

The `shouldMarkAsFailed` function now:
- Accepts optional metadata parameter
- Excludes voicemail from failed status when voicemail detection is enabled
- Ensures voicemail calls are not marked as failed when message is successfully left

```typescript
export function shouldMarkAsFailed(
  endedReason?: string,
  metadata?: Record<string, unknown>,
): boolean {
  // If voicemail was detected and voicemail detection was enabled, don't mark as failed
  if (
    endedReason.toLowerCase().includes("voicemail") &&
    metadata?.voicemail_detection_enabled === true
  ) {
    return false;
  }
  
  // ...
}
```

## Behavior Changes

### Before

- Voicemail calls were always marked as "failed"
- Voicemail calls were included in retry logic
- No distinction between voicemail detection enabled/disabled

### After

- **When voicemail detection is enabled**:
  - Voicemail calls are marked as **"completed"** ✅
  - Voicemail calls are **NOT retried** ✅
  - Call metadata stores the voicemail detection flag

- **When voicemail detection is disabled**:
  - Voicemail calls may be marked as "failed" (existing behavior)
  - Voicemail calls may be retried (existing behavior)

## Testing Recommendations

1. **Enable voicemail detection** for a test user
2. **Schedule a call** to a phone number with voicemail
3. **Let the call go to voicemail** (don't answer)
4. **Verify**:
   - Call status is "completed" (not "failed")
   - Call is not retried
   - Voicemail message was left
   - Call metadata contains `voicemail_detection_enabled: true`

## Related Documentation

- [Voicemail Detection Setup Guide](./VOICEMAIL_DETECTION_SETUP.md) - Complete setup checklist
- [VAPI Webhook Implementation](./VAPI_WEBHOOK_IMPLEMENTATION_GUIDE.md) - Webhook handler details
- [Feature Flags Guide](../FEATURE_FLAGS.md) - Feature flag management

---

**Last Updated**: 2025-01-16  
**Version**: 1.0
