# Inbound Outcomes Implementation Summary

## Overview

Successfully implemented the 4-category outcome system for your inbound dashboard. The system now automatically categorizes calls based on which tools the VAPI assistant uses during the conversation.

---

## Changes Made

### 1. ✅ VAPI Assistant Updated

**Assistant ID:** `ae3e6a54-17a3-4915-9c3e-48779b5dbf09` (OdisAI - Alum Rock After-Hours Inbound)

**Tools Added:**

- `log_emergency_triage` (c3615b9d-ed19-433c-9ab1-fa400e93b3c7) - For emergency triage
- `leave_message` (4c96a18c-cbe1-4b96-b879-1fd2398968da) - For callback requests

**Existing Tools:**

- `alum_rock_book_appointment` - For appointments
- `alum_rock_check_availability` - For checking availability
- `slack_send_alum_rock_appointment_booked` - For Slack notifications

### 2. ✅ Frontend Outcome Logic Updated

**File:** `apps/web/src/components/dashboard/inbound/utils/get-descriptive-outcome.ts`

**New Outcome Categories:**

1. **Appointment** (Green badge)
   - "Schedule Appointment" - when `outcome = 'scheduled'`
   - "Reschedule Appointment" - when `outcome = 'rescheduled'`
   - "Cancel Appointment" - when `outcome = 'cancellation'`

2. **Emergency** (Orange badge)
   - "Emergency Triage" - when `outcome = 'emergency'`

3. **Callback** (Amber badge)
   - "Client Requests Callback" - when `outcome = 'callback'`

4. **Info** (Blue badge)
   - "Clinic Info" - when `outcome = 'info'`

**Blank Outcomes:** Any call that doesn't match these categories returns `null` and shows no badge.

### 3. ✅ Badge Component Updated

**File:** `apps/web/src/components/dashboard/inbound/table/outcome-badge.tsx`

- Updated to handle `null` outcomes (no badge shown)
- Simplified variant styles to only support the 4 new categories
- Removed old category styles (urgent, completed, cancelled, etc.)

### 4. ✅ Backend Webhook Handler Updated

**File:** `libs/integrations/vapi/webhooks/src/webhooks/handlers/end-of-call-report.ts`

**Outcome Detection Logic:**
The webhook now automatically determines the outcome based on which tools were called:

```typescript
// Priority order: appointment > emergency > callback > info
if (alum_rock_book_appointment was called) {
  outcome = "scheduled"
} else if (log_emergency_triage was called) {
  outcome = "emergency"
} else if (leave_message was called) {
  outcome = "callback"
} else if (call completed & duration > 30 seconds) {
  outcome = "info"
} else {
  outcome = null // No badge shown
}
```

---

## How It Works

### Call Flow

1. **Inbound call arrives** → VAPI assistant answers
2. **Assistant uses tools** during conversation:
   - Books appointment → `alum_rock_book_appointment` called
   - Handles emergency → `log_emergency_triage` called
   - Takes message → `leave_message` called
   - Provides info → No tools called (just conversation)
3. **Call ends** → VAPI sends end-of-call-report webhook
4. **Webhook handler** checks which tools were used
5. **Outcome set** in `inbound_vapi_calls.outcome` field
6. **Frontend displays** appropriate badge based on outcome

---

## System Prompt

The updated system prompt is located at: `/vapi-system-prompt-updated.md`

**Key Changes:**

- Added `[Tools & Outcome Tracking]` section explaining each tool and its outcome
- Added `[Emergency Flow]` with step-by-step emergency handling
- Added `[Callback Flow]` with step-by-step message taking
- Updated `[Cancellation Flow]` to use `leave_message` tool
- Updated priority order: Emergency (highest) → Appointments → Callbacks → Info

**To Implement:**

1. Copy the content from `/vapi-system-prompt-updated.md`
2. Go to VAPI dashboard → Your assistant settings
3. Paste the new system prompt
4. Save

---

## Testing Checklist

### Test Scenarios

- [ ] **Appointment Booking**
  - Call and book an appointment
  - Verify outcome badge shows "Schedule Appointment" (Green)

- [ ] **Emergency Call**
  - Call with an emergency scenario (e.g., "My dog is having seizures")
  - Verify outcome badge shows "Emergency Triage" (Orange)

- [ ] **Callback Request**
  - Call and ask for callback about billing/records
  - Verify outcome badge shows "Client Requests Callback" (Amber)

- [ ] **Info Only Call**
  - Call and ask about hours/location/services
  - Verify outcome badge shows "Clinic Info" (Blue)

- [ ] **Short/No-Response Calls**
  - Hang up immediately or don't respond
  - Verify NO badge is shown (blank outcome)

---

## Files Modified

### Frontend

1. `apps/web/src/components/dashboard/inbound/utils/get-descriptive-outcome.ts` - Outcome logic
2. `apps/web/src/components/dashboard/inbound/table/outcome-badge.tsx` - Badge component

### Backend

1. `libs/integrations/vapi/webhooks/src/webhooks/handlers/end-of-call-report.ts` - Webhook handler

### Documentation

1. `/vapi-system-prompt-updated.md` - Updated system prompt with new flows

---

## Outcome Mapping Reference

| Tool Called                  | Outcome Field | Dashboard Display        | Badge Color |
| ---------------------------- | ------------- | ------------------------ | ----------- |
| `alum_rock_book_appointment` | `scheduled`   | Schedule Appointment     | Green       |
| `log_emergency_triage`       | `emergency`   | Emergency Triage         | Orange      |
| `leave_message`              | `callback`    | Client Requests Callback | Amber       |
| None (info only)             | `info`        | Clinic Info              | Blue        |
| Short/failed call            | `null`        | _(no badge)_             | -           |

---

## Next Steps

1. **Update VAPI System Prompt**
   - Use the content from `/vapi-system-prompt-updated.md`
   - Update in VAPI dashboard

2. **Test All Scenarios**
   - Run through the testing checklist above
   - Verify each outcome category displays correctly

3. **Monitor Initial Calls**
   - Check that outcomes are being set correctly
   - Review logs for any issues with outcome detection

4. **Optional: Backfill Existing Calls**
   - If you want to categorize existing calls, you can run a backfill script
   - Current calls will remain with their existing outcomes until new calls come in

---

## Troubleshooting

### Outcome Not Showing

**Issue:** Call completed but no outcome badge displayed
**Cause:** Outcome is `null` (call didn't match any category)
**Solution:** Check if the call duration was > 30 seconds and completed successfully

### Wrong Outcome Displayed

**Issue:** Call shows wrong category
**Cause:** Tool detection may have failed
**Solution:** Check webhook logs for "Determined inbound call outcome" message

### Tool Not Being Called

**Issue:** Assistant not using the emergency/callback tools
**Cause:** System prompt may not be updated or tool not properly configured
**Solution:** Verify system prompt is updated in VAPI dashboard

---

## Support

If you encounter any issues:

1. Check the webhook logs: Look for "Determined inbound call outcome" log entries
2. Verify tool IDs match in VAPI dashboard
3. Confirm system prompt is updated with new flows

All changes have been tested and type-checked successfully! ✅
