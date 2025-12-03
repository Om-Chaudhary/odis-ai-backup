# VAPI Call Transfer Configuration Guide

## Overview

The VAPI system is configured to support **warm transfers** - allowing the AI assistant to connect pet owners directly to the clinic front desk when urgent concerns arise. This uses VAPI's `warm-transfer-experimental` mode with a dedicated transfer assistant that briefs the front desk before connecting the parties.

## Current Behavior (Automatic)

The system **automatically configures warm transfers** when:

- The user has a `clinic_phone` set in their profile (E.164 format: `+15551234567`)
- A scheduled discharge call is executed

No manual VAPI dashboard configuration is required.

## How Warm Transfers Work

1. **Pet owner reports urgent symptoms** during the follow-up call
2. **AI offers to connect them** to the clinic directly
3. **Owner accepts** → AI says "I'll connect you to our clinic right now. Please hold."
4. **Transfer assistant calls the clinic** and briefly informs the front desk:
   - "Hi, I have [Owner Name] on the line regarding [Pet Name]. They have a concern about [condition]. Are you available?"
5. **Front desk accepts** → Parties are connected, AI exits
6. **If transfer fails** → Owner is returned to the AI with the clinic phone number

## Configuration

### Required: Clinic Phone Number

Users must have their clinic phone number set in E.164 format:

- **Database field**: `users.clinic_phone`
- **Format**: `+15551234567` (with country code)
- **Set via**: User settings page or admin panel

### Automatic Tool Configuration

The `transferToClinic` tool is automatically added to calls when `clinic_phone` is available.

**Tool Configuration** (see `src/lib/vapi/warm-transfer.ts`):

```typescript
{
  type: "transferCall",
  function: {
    name: "transferToClinic",
    description: "Transfer the call to the clinic front desk when the pet owner requests to speak with staff or has urgent concerns"
  },
  destinations: [{
    type: "number",
    number: "+15551234567", // From users.clinic_phone
    transferPlan: {
      mode: "warm-transfer-experimental",
      transferAssistant: {
        firstMessage: "Hi, I have [Owner] on the line regarding [Pet]. They have a concern about [condition]. Are you available?",
        maxDurationSeconds: 60,
        silenceTimeoutSeconds: 20,
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: "..." }]
        }
      }
    }
  }],
  messages: [
    { type: "request-start", content: "I'll connect you to our clinic right now. Please hold." },
    { type: "request-failed", content: "I'm sorry, I wasn't able to connect you..." }
  ]
}
```

### System Prompt Integration

The system prompts have been updated to use the transfer tool:

**Phase 6/9: Transfer Protocol**

- Identifies emergency vs. urgent situations
- Offers to connect the owner directly to the clinic
- Uses `transferToClinic` tool when owner accepts
- Provides fallback phone number if transfer fails

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
