# VAPI Dynamic Variables - Implementation Guide

## Current Status

### ✅ Variables Already Being Passed

Your code in `src/app/api/calls/schedule/route.ts:131-138` currently passes:

```typescript
const callVariables = {
  pet_name: validated.petName,
  owner_name: validated.ownerName,
  vet_name: validated.vetName ?? "",
  clinic_name: validated.clinicName ?? "",
  clinic_phone: validated.clinicPhone ?? "",
  discharge_summary_content: validated.dischargeSummary ?? "",
};
```

### ❌ Missing Variables Needed by Prompt

The following variables are referenced in your prompt but NOT being passed:

**Critical (Required for basic functionality):**

- `agent_name` - Name of AI assistant (e.g., "Sarah")
- `appointment_date` - When the appointment occurred
- `call_type` - "discharge" or "follow-up"
- `emergency_phone` - After-hours emergency number

**Important (Affects call flow):**

- `sub_type` - "wellness" or "vaccination" (for discharge calls)
- `condition` - Primary condition being treated (for follow-up calls)
- `next_steps` - Follow-up care instructions

**Optional (Enhanced functionality):**

- `medications` - List of prescribed medications
- `recheck_date` - Scheduled follow-up appointment date

## Recommended Implementation

### Step 1: Update Database Schema (if needed)

Check if your `vapi_calls` table has room for these fields in `dynamic_variables` or `metadata`. The JSON column should handle them fine.

### Step 2: Update Input Validation Schema

File: `src/lib/retell/validators.ts` (or wherever `scheduleCallSchema` is defined)

Add these fields to your Zod schema:

```typescript
export const scheduleCallSchema = z.object({
  // Existing fields
  phoneNumber: z.string(),
  petName: z.string(),
  ownerName: z.string(),
  vetName: z.string().optional(),
  clinicName: z.string().optional(),
  clinicPhone: z.string().optional(),
  dischargeSummary: z.string().optional(),
  notes: z.string().optional(),
  scheduledFor: z.coerce.date().optional(),

  // New required fields
  agentName: z.string().default("Sarah"),
  appointmentDate: z.string(), // Format: "January 15th, 2025"
  callType: z.enum(["discharge", "follow-up"]),
  emergencyPhone: z.string(),

  // Conditional fields
  subType: z.enum(["wellness", "vaccination"]).optional(), // For discharge calls
  condition: z.string().optional(), // For follow-up calls
  nextSteps: z.string().optional(),

  // Optional enhancement fields
  medications: z.string().optional(),
  recheckDate: z.string().optional(), // Format: "February 1st, 2025"
});
```

### Step 3: Update Call Scheduling Endpoint

File: `src/app/api/calls/schedule/route.ts`

Update the `callVariables` object (around line 131):

```typescript
// Prepare call variables from input data
const callVariables = {
  // Core identification
  pet_name: validated.petName,
  owner_name: validated.ownerName,
  vet_name: validated.vetName ?? "",

  // Clinic information
  clinic_name:
    validated.clinicName ?? process.env.DEFAULT_CLINIC_NAME ?? "our clinic",
  clinic_phone: validated.clinicPhone ?? process.env.DEFAULT_CLINIC_PHONE ?? "",
  emergency_phone:
    validated.emergencyPhone ?? process.env.DEFAULT_EMERGENCY_PHONE ?? "",

  // Agent information
  agent_name: validated.agentName ?? "Sarah",

  // Appointment context
  appointment_date: validated.appointmentDate,
  call_type: validated.callType,

  // Clinical details
  discharge_summary_content: validated.dischargeSummary ?? "",

  // Conditional fields based on call_type
  ...(validated.callType === "discharge" && {
    sub_type: validated.subType ?? "wellness",
  }),

  ...(validated.callType === "follow-up" && {
    condition: validated.condition ?? "",
  }),

  // Follow-up instructions
  next_steps: validated.nextSteps ?? "",

  // Optional fields
  ...(validated.medications && { medications: validated.medications }),
  ...(validated.recheckDate && { recheck_date: validated.recheckDate }),
};

console.log("[SCHEDULE_CALL] Dynamic variables prepared", {
  callVariables,
  variableCount: Object.keys(callVariables).length,
});
```

### Step 4: Update Environment Variables

Add defaults to `.env.local`:

```bash
# VAPI Configuration
VAPI_PRIVATE_KEY=your_key_here
VAPI_ASSISTANT_ID=0309c629-a3f2-43aa-b479-e2e783e564a7
VAPI_PHONE_NUMBER_ID=your_phone_number_id

# Default clinic information (used if not provided per-call)
DEFAULT_CLINIC_NAME="OdisAI Veterinary Clinic"
DEFAULT_CLINIC_PHONE="555-123-4567"
DEFAULT_EMERGENCY_PHONE="555-999-8888"
DEFAULT_AGENT_NAME="Sarah"
```

### Step 5: Update env.js Schema

File: `src/env.js`

Add the new environment variables:

```typescript
server: {
  // ... existing vars
  DEFAULT_CLINIC_NAME: z.string().optional(),
  DEFAULT_CLINIC_PHONE: z.string().optional(),
  DEFAULT_EMERGENCY_PHONE: z.string().optional(),
  DEFAULT_AGENT_NAME: z.string().optional(),
}
```

## Testing Checklist

### Minimum Viable Test (Discharge Call)

```json
{
  "phoneNumber": "+15551234567",
  "petName": "Max",
  "ownerName": "John Smith",
  "agentName": "Sarah",
  "appointmentDate": "January tenth, twenty twenty five",
  "callType": "discharge",
  "subType": "wellness",
  "clinicName": "Happy Paws Veterinary Clinic",
  "clinicPhone": "five five five, one two three, four five six seven",
  "emergencyPhone": "five five five, nine nine nine, eight eight eight eight",
  "dischargeSummary": "received rabies and DHPP vaccines and got a clean bill of health",
  "nextSteps": "Max's next wellness visit will be due in about a year",
  "scheduledFor": "2025-01-12T18:00:00Z"
}
```

### Enhanced Test (Follow-up Call)

```json
{
  "phoneNumber": "+15551234567",
  "petName": "Luna",
  "ownerName": "Sarah Johnson",
  "agentName": "Sarah",
  "appointmentDate": "January fifth, twenty twenty five",
  "callType": "follow-up",
  "condition": "ear infection",
  "clinicName": "Happy Paws Veterinary Clinic",
  "clinicPhone": "five five five, one two three, four five six seven",
  "emergencyPhone": "five five five, nine nine nine, eight eight eight eight",
  "dischargeSummary": "was prescribed Otomax ear drops for a bacterial ear infection",
  "medications": "Otomax ear drops, apply twice daily for seven days",
  "recheckDate": "January nineteenth, twenty twenty five",
  "nextSteps": "Continue the ear medication for the full seven days, even if Luna seems better. Her recheck appointment is scheduled for January nineteenth.",
  "scheduledFor": "2025-01-12T18:00:00Z"
}
```

## Deployment Steps

1. **Update Schema/Validators**

   ```bash
   # Edit src/lib/retell/validators.ts
   pnpm typecheck
   ```

2. **Update Scheduling Endpoint**

   ```bash
   # Edit src/app/api/calls/schedule/route.ts
   pnpm typecheck
   ```

3. **Update Environment Variables**

   ```bash
   # Add to .env.local
   # Update src/env.js
   ```

4. **Update VAPI Assistant Prompt**
   - Copy content from `VAPI_ASSISTANT_PROMPT.md`
   - Go to VAPI dashboard
   - Edit assistant ID `0309c629-a3f2-43aa-b479-e2e783e564a7`
   - Paste into "System Prompt" or "Instructions" field
   - Save

5. **Test with Sample Data**

   ```bash
   # Use the test JSON above to POST to /api/calls/schedule
   # Monitor logs to verify variables are being passed
   # Check actual call to verify variables are being spoken
   ```

6. **Verify in Production**
   - Schedule a test call
   - Check database: `dynamic_variables` should contain all fields
   - Check logs: Should show variables being passed to VAPI
   - Listen to call: Assistant should use actual values, not skip variables

## Variable Formatting Best Practices

### Phone Numbers

❌ Don't pass: `"+15551234567"` or `"555-123-4567"`
✅ Do pass: `"five five five, one two three, four five six seven"`

The assistant will read it naturally in voice.

### Dates

❌ Don't pass: `"2025-01-15"` or `"01/15/2025"`
✅ Do pass: `"January fifteenth, twenty twenty five"`

Use the `date` filter in prompts for auto-formatting if needed: `{{"now" | date: "%B %d, %Y"}}`

### Currency/Numbers

❌ Don't pass: `"$50.00"` or `"2-3"`
✅ Do pass: `"fifty dollars"` or `"two to three"`

VAPI reads text naturally, so spell things out for voice.

## Common Issues & Solutions

### Issue: Variables showing as undefined in call

**Solution**: Check that variable names in prompt exactly match what's being passed (snake_case, not camelCase)

### Issue: Assistant skips over variable placeholders

**Solution**: Verify the assistant prompt actually contains `{{variable_name}}` placeholders

### Issue: TypeScript errors after adding new fields

**Solution**: Update the Zod schema first, then TypeScript will infer types automatically

### Issue: Required fields not being sent from extension

**Solution**: Update the browser extension to include new required fields, or make them optional with defaults

## Next Steps

1. Review `VAPI_ASSISTANT_PROMPT.md` for the corrected prompt
2. Decide which variables are must-haves vs. nice-to-haves
3. Update validators and scheduling endpoint
4. Update VAPI assistant with corrected prompt
5. Test with sample data
6. Update browser extension (if applicable) to send new fields
