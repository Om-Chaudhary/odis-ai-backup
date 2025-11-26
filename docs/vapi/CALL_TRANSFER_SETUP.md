# VAPI Call Transfer Configuration Guide

## Overview

The VAPI system prompt (`VAPI_SYSTEM_PROMPT.txt`) is designed to identify situations where pet owners need to speak directly with the clinic or emergency services. To enable seamless call transfers, you need to configure the `transferCall` function in your VAPI assistant.

## Current Behavior (Without Transfer)

Currently, the assistant can:

- Identify urgent/emergency situations
- Provide phone numbers for the clinic and emergency services
- Strongly encourage owners to call immediately
- End the call so the owner can make the necessary call

## Enhanced Behavior (With Transfer Configured)

Once configured, the assistant will be able to:

- Identify urgent/emergency situations
- **Offer to transfer the owner directly** to the clinic or emergency line
- Execute seamless transfers without requiring the owner to hang up and dial

---

## Configuration Steps

### Step 1: Access VAPI Dashboard

1. Go to [VAPI Dashboard](https://dashboard.vapi.ai)
2. Navigate to **Assistants**
3. Select your assistant (configured via `VAPI_ASSISTANT_ID`)

### Step 2: Add Transfer Function

1. In the assistant settings, find the **Functions** or **Tools** section
2. Add a new function with the following configuration:

```json
{
  "type": "function",
  "function": {
    "name": "transferCall",
    "description": "Transfer the call to the veterinary clinic or emergency services when the pet owner needs immediate assistance",
    "parameters": {
      "type": "object",
      "properties": {
        "destination": {
          "type": "string",
          "enum": ["clinic", "emergency"],
          "description": "Where to transfer the call: 'clinic' for regular clinic line, 'emergency' for 24/7 emergency services"
        },
        "reason": {
          "type": "string",
          "description": "Brief reason for the transfer (e.g., 'urgent symptoms', 'emergency situation')"
        }
      },
      "required": ["destination"]
    }
  }
}
```

### Step 3: Configure Transfer Destinations

Configure the function to use dynamic variables for phone numbers:

- **Clinic Destination**: `{{clinic_phone}}`
- **Emergency Destination**: `{{emergency_phone}}`

These variables are automatically populated from:

- User settings in the database (`users.clinic_phone`, `users.emergency_phone`)
- Call-specific overrides in `scheduled_discharge_calls.dynamic_variables`

### Step 4: Update System Prompt (Already Done)

The system prompt has been updated to handle transfer scenarios:

**Phase 6: Transfer Protocol** (lines 196-225 in VAPI_SYSTEM_PROMPT.txt)

- Identifies emergency vs. urgent situations
- Offers transfer option to the owner
- Provides fallback phone numbers if transfer is not configured

---

## How It Works in Practice

### Scenario 1: Emergency Situation

**Owner**: "My dog is having trouble breathing!"

**Assistant**: "What you're describing needs immediate attention. The emergency number is five five five nine nine nine eight eight eight eight, and they're available twenty-four seven. Can you get Max there right away?"

**With Transfer Configured**:
**Assistant**: "What you're describing needs immediate attention. Would you like me to connect you directly to our emergency line right now, or would you prefer to call them yourself?"

**Owner**: "Yes, please connect me!"

**Assistant**: _Executes `transferCall({ destination: "emergency", reason: "difficulty breathing" })`_

### Scenario 2: Urgent Situation

**Owner**: "Bella has been vomiting all morning and won't eat."

**Assistant**: "I'm concerned about what you're telling me. I think Bella should be seen by a veterinarian today. Can you call the clinic at five five five one two three four five six seven as soon as we hang up?"

**With Transfer Configured**:
**Assistant**: "I'm concerned about what you're telling me. I think Bella should be seen by a veterinarian today. Would you like me to connect you directly to the clinic, or would you prefer to call them yourself at five five five one two three four five six seven?"

**Owner**: "Can you connect me? That would be easier."

**Assistant**: _Executes `transferCall({ destination: "clinic", reason: "persistent vomiting" })`_

---

## Testing Call Transfers

### Test in VAPI Dashboard

1. Use VAPI's testing interface to simulate calls
2. Trigger urgent scenarios (e.g., "My pet is having trouble breathing")
3. Verify the assistant offers to transfer
4. Confirm the transfer executes correctly

### Test with Real Calls (Test Mode)

1. Enable test mode in your user settings
2. Configure your test contact phone number
3. Schedule a test call
4. During the call, report urgent symptoms
5. Accept the transfer offer
6. Verify you're connected to the correct number

---

## Fallback Behavior

If the `transferCall` function is **not configured** or **fails**:

1. The assistant will provide phone numbers verbally
2. Strongly encourage the owner to call immediately
3. End the call so the owner can make the necessary call

This ensures pet owners can always reach help, even if transfers are not configured.

---

## Variables Used for Transfers

The following variables are passed to the assistant and used for transfer destinations:

| Variable          | Source                     | Example        |
| ----------------- | -------------------------- | -------------- |
| `clinic_phone`    | User settings or case data | `+15551234567` |
| `emergency_phone` | User settings or case data | `+15559998888` |

These are automatically formatted for speech (with spaces between digits) in the system prompt but used in E.164 format for actual transfers.

---

## Code Changes Required

**None.** The code is already configured to work with call transfers:

- Variables (`clinic_phone`, `emergency_phone`) are passed to VAPI
- System prompt handles conversation flow for identifying transfer scenarios
- All logic is in place to support transfers

The only step required is configuring the `transferCall` function in the VAPI dashboard.

---

## Troubleshooting

### Transfer Not Offered During Call

**Possible Causes:**

1. `transferCall` function not configured in VAPI assistant
2. Function not properly linked to phone number variables
3. System prompt not updated (should be v3.0+)

**Solution:**

- Verify function is configured in VAPI dashboard
- Check function has access to `{{clinic_phone}}` and `{{emergency_phone}}` variables
- Confirm assistant is using the latest system prompt

### Transfer Fails Mid-Call

**Possible Causes:**

1. Invalid phone number format (must be E.164)
2. Phone number variables not populated
3. VAPI transfer service issue

**Solution:**

- Verify phone numbers in database are in E.164 format (e.g., `+15551234567`)
- Check `scheduled_discharge_calls.dynamic_variables` contains `clinic_phone` and `emergency_phone`
- Review VAPI logs for transfer errors

### Assistant Doesn't Identify Transfer Scenarios

**Possible Causes:**

1. System prompt not properly loaded
2. Assistant not following transfer protocol (Phase 6)

**Solution:**

- Verify assistant is using VAPI_SYSTEM_PROMPT.txt v3.0+
- Review Phase 5 (Warning Signs Check) and Phase 6 (Transfer Protocol) in the prompt
- Test with explicit phrases like "my pet can't breathe" or "my pet is bleeding badly"

---

## Additional Resources

- [VAPI Documentation](https://docs.vapi.ai/)
- [VAPI Dashboard](https://dashboard.vapi.ai)
- [System Prompt v3.0](./prompts/VAPI_SYSTEM_PROMPT.txt)
- [Call Flow Documentation](./VAPI_FINAL_SETUP.md)

---

## Summary

Call transfer is a powerful feature that:

- Improves user experience (no need to hang up and dial)
- Reduces friction in urgent situations
- Ensures faster connection to veterinary care

The implementation is **dashboard-only** (no code changes needed) and takes approximately 10 minutes to configure.
