# Voicemail Detection Setup Guide

Complete checklist and verification guide for enabling voicemail detection in VAPI calls.

## Overview

When voicemail detection is enabled:

- VAPI automatically detects voicemail systems
- Leaves a personalized message using dynamic variables
- Ends the call after leaving the message
- Call is marked as **completed** (not failed)
- Call is **NOT retried** (voicemail left successfully)

## Prerequisites

- [ ] VAPI account configured with assistant ID
- [ ] VAPI phone number configured for outbound calls
- [ ] Database migration run: `20250115000000_add_voicemail_detection_flag.sql`
- [ ] User account exists in database with `voicemail_detection_enabled` column

## Setup Checklist

### 1. Database Configuration

- [ ] Verify migration has been applied:

  ```sql
  SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name = 'users'
  AND column_name = 'voicemail_detection_enabled';
  ```

  Should return: `boolean DEFAULT false`

- [ ] Enable voicemail detection for your user:

  ```sql
  UPDATE users
  SET voicemail_detection_enabled = true
  WHERE id = 'your-user-id';
  ```

- [ ] Verify setting:
  ```sql
  SELECT id, voicemail_detection_enabled
  FROM users
  WHERE id = 'your-user-id';
  ```

### 2. Code Configuration

- [ ] **Execute Call Route** (`src/app/api/webhooks/execute-call/route.ts`):
  - ✅ Fetches `voicemail_detection_enabled` from users table (lines 276-283)
  - ✅ Configures voicemail tool when enabled (lines 291-309)
  - ✅ Stores voicemail flag in call metadata (for webhook reference)
  - ✅ Passes voicemail tool to VAPI API call

- [ ] **Webhook Handler** (`src/app/api/webhooks/vapi/route.ts`):
  - ✅ Checks voicemail detection flag from call metadata
  - ✅ Marks voicemail calls as "completed" when detection is enabled
  - ✅ Excludes voicemail from retry logic when detection is enabled

- [ ] **VAPI Client** (`src/lib/vapi/client.ts`):
  - ✅ Type definitions include voicemail tool configuration
  - ✅ Properly formatted voicemail tool structure

### 3. VAPI Assistant Configuration

**IMPORTANT**: The voicemail tool is configured dynamically via API call. However, ensure your VAPI assistant is set up correctly:

- [ ] VAPI Assistant exists and is accessible via `VAPI_ASSISTANT_ID`
- [ ] Assistant is configured to handle tools passed via `assistantOverrides`
- [ ] Assistant can use dynamic variables in tool messages

**No manual configuration needed in VAPI dashboard** - the voicemail tool is injected per-call via the API.

### 4. Voicemail Message Configuration

The voicemail message template is defined in `src/app/api/webhooks/execute-call/route.ts` (lines 301-305):

```
Hi {{owner_name}}, this is {{agent_name}} from {{clinic_name}}.
I'm checking in on {{pet_name}} after the appointment on {{appointment_date}}.
Everything looked great from our end.
If you have any questions or concerns about {{pet_name}},
please give us a call at {{clinic_phone}}.
For emergencies, you can reach {{emergency_phone}} anytime.
Take care!
```

**Required Variables** (must be provided in dynamic variables):

- `{{owner_name}}` - Pet owner's name
- `{{agent_name}}` - Agent/technician name
- `{{clinic_name}}` - Clinic name
- `{{pet_name}}` - Pet's name
- `{{appointment_date}}` - Appointment date (spelled out)
- `{{clinic_phone}}` - Clinic phone number (spelled out)
- `{{emergency_phone}}` - Emergency phone number (spelled out)

### 5. Testing Checklist

#### Test 1: Verify Flag is Stored in Metadata

1. Schedule a call with voicemail detection enabled
2. Check the call record in `scheduled_discharge_calls`:
   ```sql
   SELECT id, metadata, vapi_call_id
   FROM scheduled_discharge_calls
   WHERE id = 'your-call-id';
   ```
3. Verify `metadata.voicemail_detection_enabled` is `true`

#### Test 2: Verify Tool is Sent to VAPI

1. Check logs for `[EXECUTE_CALL]` entries
2. Look for log entry: `"Voicemail detection setting"` with `voicemailEnabled: true`
3. Look for log entry: `"Calling VAPI API with parameters"`
4. Verify `voicemailTool` is included in the payload

#### Test 3: Test Voicemail Detection

1. Schedule a call to a phone number with voicemail enabled
2. Let the call go to voicemail (don't answer)
3. Verify:
   - [ ] Voicemail message is left
   - [ ] Call ends after leaving message
   - [ ] Webhook receives `endedReason: "voicemail"`
   - [ ] Call status is marked as **"completed"** (not "failed")
   - [ ] Call is **NOT retried**

#### Test 4: Test Without Voicemail Detection

1. Disable voicemail detection for your user
2. Schedule a call to a phone number with voicemail
3. Verify:
   - [ ] No voicemail tool is sent to VAPI
   - [ ] Call behavior follows assistant prompt only
   - [ ] If voicemail is reached, call may be marked as failed (expected behavior)

## Troubleshooting

### Issue: Voicemail tool not being sent to VAPI

**Symptoms**: Logs show `voicemailEnabled: false` or no `voicemailTool` in VAPI payload

**Solutions**:

1. Check user setting:
   ```sql
   SELECT voicemail_detection_enabled FROM users WHERE id = 'your-user-id';
   ```
2. Verify the execute-call route is reading the correct user ID
3. Check logs for: `[EXECUTE_CALL] Voicemail detection setting`

### Issue: Voicemail calls marked as failed

**Symptoms**: Calls ending with voicemail are marked as "failed" and retried

**Solutions**:

1. Verify voicemail detection flag is stored in call metadata
2. Check webhook handler logs for voicemail processing
3. Ensure webhook handler checks `metadata.voicemail_detection_enabled`
4. Verify `mapEndedReasonToStatus` function handles voicemail correctly when enabled

### Issue: Voicemail message uses literal variable names

**Symptoms**: Message says "{{owner_name}}" instead of actual name

**Solutions**:

1. Verify dynamic variables are being passed correctly
2. Check variable names use snake_case (e.g., `owner_name`, not `ownerName`)
3. Verify variables are in `assistantOverrides.variableValues`
4. Check VAPI logs for variable substitution

### Issue: Voicemail tool not detecting voicemail

**Symptoms**: Call doesn't leave voicemail when it should

**Solutions**:

1. Verify voicemail tool is included in `assistantOverrides.tools`
2. Check VAPI assistant supports voicemail tool
3. Review VAPI documentation for voicemail detection requirements
4. Test with different voicemail systems (some may not be detected)

## Code Verification

### Verify Execute Call Route

Check `src/app/api/webhooks/execute-call/route.ts`:

- [ ] Lines 276-283: Fetches voicemail detection flag from database
- [ ] Lines 291-309: Configures voicemail tool when enabled
- [ ] Lines 374-377: Stores voicemail flag in metadata
- [ ] Lines 318-329: Includes voicemail tool in assistantOverrides

### Verify Webhook Handler

Check `src/app/api/webhooks/vapi/route.ts`:

- [ ] `handleOutboundCallEnd` checks metadata for voicemail flag
- [ ] `mapEndedReasonToStatus` marks voicemail as completed when enabled
- [ ] `shouldRetry` excludes voicemail when detection is enabled

### Verify VAPI Client Types

Check `src/lib/vapi/client.ts`:

- [ ] `CreatePhoneCallParams` interface includes voicemail tool type
- [ ] Voicemail tool structure matches VAPI API requirements

## Expected Behavior

### When Voicemail Detection is Enabled

1. **Call Execution**:
   - Voicemail tool is added to `assistantOverrides.tools`
   - Tool includes personalized message template
   - Message template includes all required variables

2. **During Call**:
   - VAPI detects voicemail system automatically
   - Leaves personalized message with variable substitution
   - Ends call after leaving message

3. **Webhook Processing**:
   - Receives `endedReason: "voicemail"`
   - Checks `metadata.voicemail_detection_enabled` flag
   - Marks call as **"completed"** (not "failed")
   - Skips retry logic

### When Voicemail Detection is Disabled

1. **Call Execution**:
   - No voicemail tool is added
   - Call proceeds normally with assistant prompt

2. **If Voicemail is Reached**:
   - Behavior depends on assistant prompt
   - May end call or attempt conversation
   - May be marked as "failed" if not handled

3. **Webhook Processing**:
   - Voicemail calls may be marked as failed
   - Retry logic may apply (depending on configuration)

## Related Documentation

- [VAPI Integration Overview](../vapi/README.md)
- [VAPI Variables Implementation](./VAPI_VARIABLES_IMPLEMENTATION.md)
- [VAPI Webhook Implementation](./VAPI_WEBHOOK_IMPLEMENTATION_GUIDE.md)
- [Feature Flags Guide](../FEATURE_FLAGS.md)

## Support

If you encounter issues:

1. Check application logs for `[EXECUTE_CALL]` and `[VAPI_WEBHOOK]` entries
2. Verify database configuration (migration applied, flag set)
3. Test with voicemail detection disabled to isolate the issue
4. Review VAPI dashboard logs for call details
5. Check VAPI documentation for voicemail tool requirements

---

**Last Updated**: 2025-01-16  
**Version**: 1.0
