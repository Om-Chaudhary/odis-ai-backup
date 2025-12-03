# VAPI Voicemail Detection

This document explains how voicemail detection works in the ODIS AI VAPI integration and how to configure it.

## Overview

VAPI can detect when a call reaches a voicemail system and either:

1. **Leave a message** - Play a pre-configured voicemail message
2. **Hang up** - Immediately end the call and retry later

This is controlled by two database flags per user:

- `voicemail_detection_enabled` - Whether to detect voicemail at all
- `voicemail_hangup_on_detection` - Whether to hang up (true) or leave message (false)

## Configuration Options

### Option 1: Voicemail Detection Disabled

```sql
voicemail_detection_enabled = false
voicemail_hangup_on_detection = false (ignored)
```

**Behavior**: No voicemail detection. Call proceeds normally and VAPI will talk to the voicemail recording as if it were a person.

**Use case**: When you don't want any special voicemail handling.

### Option 2: Voicemail Detection + Leave Message

```sql
voicemail_detection_enabled = true
voicemail_hangup_on_detection = false
```

**Behavior**: When voicemail is detected, VAPI leaves a pre-configured message and marks the call as `completed`.

**Voicemail message**:

```
Hi {{owner_name}}, this is {{agent_name}} from {{clinic_name}}.
I'm checking in on {{pet_name}} after the appointment on {{appointment_date}}.
Everything looked great from our end. If you have any questions or concerns
about {{pet_name}}, please give us a call at {{clinic_phone}}. For emergencies,
you can reach {{emergency_phone}} anytime. Take care!
```

**Use case**: When you want to leave a voicemail message for owners who don't answer.

### Option 3: Voicemail Detection + Hang Up (NEW)

```sql
voicemail_detection_enabled = true
voicemail_hangup_on_detection = true
```

**Behavior**: When voicemail is detected, VAPI immediately hangs up without leaving a message. The call is marked as `failed` and will be automatically retried.

**Retry logic**:

- Max retries: 3 attempts
- Backoff: 5, 10, 20 minutes
- Goal: Reach a live person instead of leaving voicemail

**Use case**: When you want to ensure a live conversation and prefer not to leave voicemail messages.

## Implementation Details

### Database Schema

The `users` table contains two boolean columns:

```sql
-- Enable/disable voicemail detection
ALTER TABLE users ADD COLUMN voicemail_detection_enabled BOOLEAN NOT NULL DEFAULT false;

-- When true and detection is enabled, hang up instead of leaving message
ALTER TABLE users ADD COLUMN voicemail_hangup_on_detection BOOLEAN NOT NULL DEFAULT false;
```

### VAPI Configuration

When `voicemail_hangup_on_detection` is enabled, the voicemail tool is configured with an **empty message**:

```typescript
const voicemailTool = {
  type: "voicemail",
  function: {
    name: "leave_voicemail",
    description: "Hang up when voicemail is detected",
  },
  messages: [
    {
      type: "request-start",
      content: "", // Empty message = hang up
    },
  ],
};
```

According to [VAPI documentation](https://discord.com/channels/1197796334288109608/1197796334288109611/1284932947156836425), setting `voicemailMessage` to an empty string makes VAPI hang up without saying anything.

### Call Status Mapping

The webhook handler determines call status based on voicemail settings:

| Ended Reason | Detection Enabled | Hangup Enabled | Status      | Will Retry            |
| ------------ | ----------------- | -------------- | ----------- | --------------------- |
| `voicemail`  | `false`           | N/A            | `failed`    | Yes                   |
| `voicemail`  | `true`            | `false`        | `completed` | No (message left)     |
| `voicemail`  | `true`            | `true`         | `failed`    | Yes (no message left) |

### Retry Logic

Calls are retried when:

1. `ended_reason` is `dial-busy`, `dial-no-answer`, or `voicemail`
2. AND either:
   - Voicemail detection is disabled, OR
   - Voicemail detection is enabled AND hangup is enabled

Retry schedule (exponential backoff):

- Attempt 1: 5 minutes
- Attempt 2: 10 minutes
- Attempt 3: 20 minutes
- Max attempts: 3

### Metadata Tracking

Each call stores voicemail settings in metadata for webhook handler reference:

```typescript
{
  executed_at: "2024-12-03T10:00:00Z",
  voicemail_detection_enabled: true,
  voicemail_hangup_on_detection: true,
}
```

## Files Modified

### Backend Logic

- `/src/app/api/webhooks/execute-call/route.ts` - Creates VAPI calls with voicemail tool
- `/src/app/api/webhooks/vapi/route.ts` - Handles voicemail webhook events and retry logic
- `/src/lib/vapi/client.ts` - Helper function to determine if call should be marked as failed

### Database

- `/supabase/migrations/20251203000000_add_voicemail_hangup_flag.sql` - Migration
- `/src/database.types.ts` - TypeScript types for database

### API Routes

- `/src/server/api/routers/cases.ts` - tRPC endpoints for settings CRUD

## Testing

### Test Voicemail Detection

1. **Setup test user**:

```sql
UPDATE users
SET voicemail_detection_enabled = true,
    voicemail_hangup_on_detection = true
WHERE id = 'user-uuid';
```

2. **Schedule a test call** to a phone number that goes to voicemail

3. **Check database** after call:

```sql
SELECT
  id,
  status,
  ended_reason,
  metadata,
  retry_count
FROM scheduled_discharge_calls
WHERE id = 'call-id';
```

4. **Expected results**:
   - Status: `failed`
   - Ended reason: `voicemail`
   - Metadata includes `voicemail_hangup_on_detection: true`
   - Retry count: increments on each voicemail
   - Next retry scheduled with exponential backoff

### Test Message Leaving

1. **Setup test user**:

```sql
UPDATE users
SET voicemail_detection_enabled = true,
    voicemail_hangup_on_detection = false
WHERE id = 'user-uuid';
```

2. **Schedule a test call** to voicemail

3. **Expected results**:
   - Status: `completed`
   - Voicemail message left
   - No retry scheduled

## UI Integration

To add UI controls for this feature:

1. **Settings Page** - Add toggle for "Hang up on voicemail"
2. **Call Dashboard** - Show voicemail retry status
3. **Call Details** - Display voicemail detection settings for each call

Example React component:

```tsx
<Switch
  checked={settings.voicemailHangupOnDetection}
  onCheckedChange={(checked) => {
    updateSettings({ voicemailHangupOnDetection: checked });
  }}
  disabled={!settings.voicemailDetectionEnabled}
/>
```

## References

- [VAPI Discord Discussion](https://discord.com/channels/1197796334288109608/1197796334288109611/1284932947156836425) - Original voicemail hangup feature request
- [VAPI Assistants API Reference](https://docs.vapi.ai/api-reference/assistants/create) - API documentation
