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

> Note: Emergency situations are routed to the emergency line verbally (no warm transfer) because speed is critical.

### Scenario 2: Urgent Situation (Warm Transfer)

**Owner**: "Bella has been vomiting all morning and won't eat."

**Assistant**: "I'm concerned about what you're telling me. I think Bella should be seen by a veterinarian today. Would you like me to connect you directly to the clinic right now, or would you prefer to call them yourself?"

**Owner**: "Can you connect me? That would be easier."

**Assistant**: "I'll connect you to our clinic right now. Please hold for just a moment."
→ _Uses `transferToClinic` tool_

**Transfer Assistant** (to front desk): "Hi, I have Sarah on the line regarding Bella. They have a concern about persistent vomiting. Are you available?"

**Front Desk**: "Yes, put them through."

**Transfer Assistant**: _Calls `transferSuccessful`_ → Owner connected to front desk

---

## Testing Call Transfers

### Test with Real Calls

1. Ensure user has `clinic_phone` set in E.164 format
2. Schedule a test call to yourself
3. During the call, report urgent symptoms (e.g., "My pet has been vomiting all day")
4. Accept the transfer offer ("Yes, please connect me")
5. Verify:
   - You hear "I'll connect you to our clinic right now"
   - Hold music/ringing plays
   - Clinic phone rings
   - Transfer assistant briefs the front desk
   - Parties are connected

### Checking Logs

Look for these log entries in your deployment:

```
[EXECUTE_CALL] Warm transfer tool configured { clinicPhone: "+1...", destinationType: "warm-transfer-experimental" }
[EXECUTE_CALL] Calling VAPI API with parameters { toolsConfigured: ["voicemail", "transferCall"], ... }
```

---

## Fallback Behavior

If the transfer **fails** or **clinic phone is not configured**:

1. Owner is returned to the AI assistant
2. AI provides the clinic phone number verbally
3. Encourages owner to call immediately

**Example fallback**:
"I'm sorry, I wasn't able to connect you directly. Please call the clinic at five five five one two three four five six seven as soon as possible and let them know about Bella's symptoms."

---

## Variables Used for Transfers

| Variable          | Source                  | Format               | Usage                    |
| ----------------- | ----------------------- | -------------------- | ------------------------ |
| `clinic_phone`    | `users.clinic_phone`    | E.164 (+15551234567) | Transfer destination     |
| `clinic_phone`    | dynamic_variables       | Spelled out          | Verbal fallback          |
| `emergency_phone` | `users.emergency_phone` | E.164                | Emergency verbal routing |

---

## Code Implementation

The warm transfer is implemented in:

- **`src/lib/vapi/warm-transfer.ts`** - Transfer tool builder
- **`src/lib/vapi/client.ts`** - TypeScript types for transfer tools
- **`src/app/api/webhooks/execute-call/route.ts`** - Tool configuration at call time

### Key Files

```
src/lib/vapi/
├── warm-transfer.ts    # buildWarmTransferTool() function
├── client.ts           # TransferCallTool, TransferDestination types
└── simple-types.ts     # Dynamic variables types
```

### Adding the Tool

The transfer tool is automatically added in `execute-call/route.ts`:

```typescript
if (userClinicPhone) {
  const warmTransferTool = buildWarmTransferTool(userClinicPhone, {
    petName: normalizedVariables.pet_name,
    ownerName: normalizedVariables.owner_name,
    primaryDiagnosis: normalizedVariables.primary_diagnosis,
    condition: normalizedVariables.condition,
    callType: normalizedVariables.call_type,
    clinicName: normalizedVariables.clinic_name,
  });
  if (warmTransferTool) {
    tools.push(warmTransferTool);
  }
}
```

---

## Troubleshooting

### Transfer Not Offered During Call

**Possible Causes:**

1. `clinic_phone` not set in user profile
2. `clinic_phone` not in E.164 format
3. System prompt not updated

**Solution:**

- Check `users.clinic_phone` in database has value like `+15551234567`
- Verify logs show "Warm transfer tool configured"
- Confirm assistant is using latest system prompt

### Transfer Fails Mid-Call

**Possible Causes:**

1. Invalid phone number format
2. Clinic doesn't answer within 60 seconds
3. Voicemail detected at clinic

**Solution:**

- Verify `clinic_phone` is in E.164 format (`+15551234567`)
- Check VAPI call logs for `transferCancel` events
- Review transfer assistant behavior in logs

### Transfer Assistant Doesn't Brief Front Desk Correctly

**Possible Causes:**

1. Missing patient context in dynamic variables
2. Transfer assistant prompt issue

**Solution:**

- Check that `pet_name`, `owner_name`, `condition`/`primary_diagnosis` are in call variables
- Review `buildWarmTransferTool()` in `src/lib/vapi/warm-transfer.ts`

### Front Desk Hears Nothing

**Possible Causes:**

1. `firstMessageMode` set incorrectly
2. Transfer assistant waiting for front desk to speak first

**Solution:**

- Verify `firstMessageMode: "assistant-speaks-first"` in transfer config
- The transfer assistant should speak immediately when front desk answers

---

## Limitations

- **Twilio only**: Warm transfers require Twilio phone numbers in VAPI
- **Experimental mode**: Uses `warm-transfer-experimental` which may have VAPI updates
- **60 second timeout**: Transfer assistant has 60 seconds to complete handoff
- **No emergency transfers**: Emergency situations use verbal routing (faster)

---

## Additional Resources

- [VAPI Warm Transfer Docs](https://docs.vapi.ai/calls/assistant-based-warm-transfer)
- [VAPI Dashboard](https://dashboard.vapi.ai)
- [System Prompt](./prompts/VAPI_SYSTEM_PROMPT.txt)
- [System Prompt V4](./prompts/VAPI_SYSTEM_PROMPT_V4.txt)

---

## Summary

Warm transfer is **automatically configured** when users have a clinic phone number:

| Requirement      | Value                                |
| ---------------- | ------------------------------------ |
| User field       | `users.clinic_phone` in E.164 format |
| Code changes     | None (automatic)                     |
| Dashboard config | None (automatic)                     |
| Transfer mode    | `warm-transfer-experimental`         |
| Max duration     | 60 seconds                           |

**Benefits:**

- Seamless handoff (owner stays on the line)
- Front desk gets patient context before connection
- Fallback to verbal phone number if transfer fails
- No manual VAPI configuration required
