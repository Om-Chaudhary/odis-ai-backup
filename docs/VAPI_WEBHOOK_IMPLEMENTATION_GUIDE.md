# VAPI Webhook Implementation Guide

Quick reference for implementing missing webhook handlers and security fixes.

---

## Phase 1: Enable Webhook Signature Verification (CRITICAL)

### Step 1: Uncomment Signature Verification

**File**: `/src/app/api/webhooks/vapi/route.ts`

**Change** (Lines 175-179):
```typescript
// BEFORE (Currently commented out):
// const isValid = await verifySignature(request, body);
// if (!isValid) {
//   console.error('[VAPI_WEBHOOK] Invalid webhook signature');
//   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
// }

// AFTER (Uncomment):
const isValid = await verifySignature(request, body);
if (!isValid) {
  console.error('[VAPI_WEBHOOK] Invalid webhook signature');
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### Step 2: Add Environment Variable

**Add to Vercel/Production**:
```bash
VAPI_WEBHOOK_SECRET="your_webhook_secret_from_vapi_dashboard"
```

### Step 3: Configure VAPI Dashboard

1. Go to: https://dashboard.vapi.ai/settings/webhooks
2. Add webhook URL: `https://odisai.net/api/webhooks/vapi`
3. Configure HMAC:
   - **Algorithm**: SHA-256
   - **Secret**: Same as `VAPI_WEBHOOK_SECRET`
   - **Header**: `x-vapi-signature`
4. Select events: `status-update`, `end-of-call-report`, `hang`

### Step 4: Test

```bash
# Test with valid signature
curl -X POST https://odisai.net/api/webhooks/vapi \
  -H "x-vapi-signature: <computed-hmac>" \
  -H "Content-Type: application/json" \
  -d '{"message":{"type":"status-update","call":{"id":"test"}}}'

# Should return 200 OK

# Test without signature
curl -X POST https://odisai.net/api/webhooks/vapi \
  -H "Content-Type: application/json" \
  -d '{"message":{"type":"status-update","call":{"id":"test"}}}'

# Should return 401 Invalid signature
```

---

## Phase 2: Implement assistant-request Handler

### Purpose
Allows VAPI assistant to request dynamic data during the call (e.g., fetch pet records, clinic hours, etc.)

### Implementation

**File**: `/src/app/api/webhooks/vapi/route.ts`

**Step 1: Add Event Handler**

Add after line 201:
```typescript
else if (message.type === "assistant-request") {
  return await handleAssistantRequest(supabase, message, request);
}
```

**Step 2: Implement Handler Function**

Add at the end of the file (before GET handler):
```typescript
/**
 * Handle assistant-request webhook
 * VAPI assistant requests dynamic data during the call
 */
async function handleAssistantRequest(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  message: VapiWebhookPayload["message"],
  request: NextRequest,
): Promise<NextResponse> {
  const call = message.call as VapiCallResponse;

  if (!call?.id) {
    console.warn("[VAPI_WEBHOOK] assistant-request missing call data");
    return NextResponse.json({ error: "Missing call data" }, { status: 400 });
  }

  // Extract request details
  const requestData = message as unknown as {
    call: VapiCallResponse;
    serverUrl: string;
    serverUrlParameters?: Record<string, unknown>;
  };

  const parameters = requestData.serverUrlParameters ?? {};

  console.log("[VAPI_WEBHOOK] Assistant request received", {
    callId: call.id,
    parameters,
  });

  // Find the call in our database
  const { data: existingCall, error: findError } = await supabase
    .from("vapi_calls")
    .select("id, dynamic_variables, metadata")
    .eq("vapi_call_id", call.id)
    .single();

  if (findError || !existingCall) {
    console.warn("[VAPI_WEBHOOK] Call not found for assistant request", {
      callId: call.id,
      error: findError,
    });
    return NextResponse.json(
      { error: "Call not found" },
      { status: 404 },
    );
  }

  // Prepare response data based on request parameters
  const responseData: Record<string, unknown> = {};

  // Example: Return pet information if requested
  if (parameters.request === "pet_info") {
    const dynamicVars = existingCall.dynamic_variables as Record<string, unknown>;
    responseData.pet_name = dynamicVars?.pet_name;
    responseData.owner_name = dynamicVars?.owner_name;
    responseData.clinic_name = dynamicVars?.clinic_name;
  }

  // Example: Return clinic hours if requested
  if (parameters.request === "clinic_hours") {
    responseData.clinic_hours = {
      monday: "8:00 AM - 6:00 PM",
      tuesday: "8:00 AM - 6:00 PM",
      wednesday: "8:00 AM - 6:00 PM",
      thursday: "8:00 AM - 6:00 PM",
      friday: "8:00 AM - 6:00 PM",
      saturday: "9:00 AM - 2:00 PM",
      sunday: "Closed",
    };
  }

  // Example: Return emergency instructions if requested
  if (parameters.request === "emergency_instructions") {
    const dynamicVars = existingCall.dynamic_variables as Record<string, unknown>;
    responseData.emergency_phone = dynamicVars?.emergency_phone;
    responseData.emergency_message =
      "If you notice any of the following, please call us immediately: " +
      "severe bleeding, difficulty breathing, seizures, or inability to stand.";
  }

  console.log("[VAPI_WEBHOOK] Returning assistant data", {
    callId: call.id,
    request: parameters.request,
    dataKeys: Object.keys(responseData),
  });

  // Return data to VAPI assistant
  return NextResponse.json(responseData);
}
```

### Step 3: Update Interface

Add to `VapiWebhookPayload` interface (around line 28):
```typescript
interface VapiWebhookPayload {
  message: {
    type: string;
    call?: VapiCallResponse;
    status?: string;
    endedReason?: string;
    phoneNumber?: string;
    timestamp?: string;
    serverUrl?: string;
    serverUrlParameters?: Record<string, unknown>;
    [key: string]: unknown;
  };
}
```

### Step 4: Configure in VAPI Assistant

In your VAPI assistant configuration:
```json
{
  "serverUrl": "https://odisai.net/api/webhooks/vapi",
  "serverUrlSecret": "your_webhook_secret"
}
```

---

## Phase 3: Implement function-call Handler

### Purpose
Allows VAPI assistant to execute functions (send SMS, create appointments, send emails, etc.)

### Implementation

**File**: `/src/app/api/webhooks/vapi/route.ts`

**Step 1: Add Event Handler**

Add after assistant-request handler:
```typescript
else if (message.type === "function-call") {
  return await handleFunctionCall(supabase, message, request);
}
```

**Step 2: Implement Handler Function**

```typescript
/**
 * Handle function-call webhook
 * VAPI assistant requests to execute a function
 */
async function handleFunctionCall(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  message: VapiWebhookPayload["message"],
  request: NextRequest,
): Promise<NextResponse> {
  const call = message.call as VapiCallResponse;

  if (!call?.id) {
    console.warn("[VAPI_WEBHOOK] function-call missing call data");
    return NextResponse.json({ error: "Missing call data" }, { status: 400 });
  }

  // Extract function call details
  const functionCallData = message as unknown as {
    call: VapiCallResponse;
    functionCall: {
      name: string;
      parameters: Record<string, unknown>;
    };
  };

  const { name: functionName, parameters } = functionCallData.functionCall;

  console.log("[VAPI_WEBHOOK] Function call received", {
    callId: call.id,
    functionName,
    parameters,
  });

  // Find the call in our database
  const { data: existingCall, error: findError } = await supabase
    .from("vapi_calls")
    .select("id, dynamic_variables, metadata")
    .eq("vapi_call_id", call.id)
    .single();

  if (findError || !existingCall) {
    console.warn("[VAPI_WEBHOOK] Call not found for function call", {
      callId: call.id,
      error: findError,
    });
    return NextResponse.json(
      {
        error: "Call not found",
        result: "Failed to execute function: Call not found"
      },
      { status: 404 },
    );
  }

  let result: unknown;
  let success = false;

  try {
    // Execute the requested function
    switch (functionName) {
      case "send_sms":
        result = await executeSendSMS(parameters, existingCall);
        success = true;
        break;

      case "schedule_appointment":
        result = await executeScheduleAppointment(parameters, existingCall, supabase);
        success = true;
        break;

      case "send_email":
        result = await executeSendEmail(parameters, existingCall);
        success = true;
        break;

      case "log_callback_request":
        result = await executeLogCallback(parameters, existingCall, supabase);
        success = true;
        break;

      default:
        console.error("[VAPI_WEBHOOK] Unknown function requested", {
          functionName,
          callId: call.id,
        });
        result = `Unknown function: ${functionName}`;
        success = false;
    }
  } catch (error) {
    console.error("[VAPI_WEBHOOK] Function execution failed", {
      functionName,
      callId: call.id,
      error: error instanceof Error ? error.message : String(error),
    });
    result = `Failed to execute ${functionName}: ${error instanceof Error ? error.message : String(error)}`;
    success = false;
  }

  console.log("[VAPI_WEBHOOK] Function execution result", {
    callId: call.id,
    functionName,
    success,
    result,
  });

  // Return result to VAPI assistant
  return NextResponse.json({
    result,
    success,
  });
}

/**
 * Execute SMS sending function
 */
async function executeSendSMS(
  parameters: Record<string, unknown>,
  call: { dynamic_variables: unknown },
): Promise<string> {
  const { phoneNumber, message } = parameters;

  // TODO: Integrate with Twilio or your SMS provider
  console.log("[FUNCTION] send_sms", { phoneNumber, message });

  // Placeholder implementation
  return `SMS would be sent to ${phoneNumber}: ${message}`;
}

/**
 * Execute appointment scheduling function
 */
async function executeScheduleAppointment(
  parameters: Record<string, unknown>,
  call: { id: string; dynamic_variables: unknown },
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
): Promise<string> {
  const { appointmentDate, appointmentType, notes } = parameters;

  // TODO: Integrate with your scheduling system
  console.log("[FUNCTION] schedule_appointment", {
    appointmentDate,
    appointmentType,
    notes,
  });

  // Store appointment in database
  await supabase.from("appointments").insert({
    call_id: call.id,
    appointment_date: appointmentDate,
    appointment_type: appointmentType,
    notes,
    status: "scheduled",
  });

  return `Appointment scheduled for ${appointmentDate} - ${appointmentType}`;
}

/**
 * Execute email sending function
 */
async function executeSendEmail(
  parameters: Record<string, unknown>,
  call: { dynamic_variables: unknown },
): Promise<string> {
  const { to, subject, body } = parameters;

  // TODO: Integrate with SendGrid or your email provider
  console.log("[FUNCTION] send_email", { to, subject, body });

  // Placeholder implementation
  return `Email would be sent to ${to} with subject: ${subject}`;
}

/**
 * Execute callback logging function
 */
async function executeLogCallback(
  parameters: Record<string, unknown>,
  call: { id: string },
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
): Promise<string> {
  const { reason, preferredTime, notes } = parameters;

  // Log callback request in database
  await supabase.from("callback_requests").insert({
    call_id: call.id,
    reason,
    preferred_time: preferredTime,
    notes,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  console.log("[FUNCTION] log_callback_request", {
    callId: call.id,
    reason,
    preferredTime,
  });

  return `Callback request logged for ${preferredTime}`;
}
```

### Step 3: Configure Functions in VAPI Assistant

In your VAPI assistant configuration, define available functions:

```json
{
  "model": {
    "functions": [
      {
        "name": "send_sms",
        "description": "Send an SMS message to the pet owner",
        "parameters": {
          "type": "object",
          "properties": {
            "phoneNumber": {
              "type": "string",
              "description": "The phone number to send SMS to"
            },
            "message": {
              "type": "string",
              "description": "The message content"
            }
          },
          "required": ["phoneNumber", "message"]
        }
      },
      {
        "name": "schedule_appointment",
        "description": "Schedule a follow-up appointment",
        "parameters": {
          "type": "object",
          "properties": {
            "appointmentDate": {
              "type": "string",
              "description": "ISO 8601 date/time for the appointment"
            },
            "appointmentType": {
              "type": "string",
              "enum": ["checkup", "recheck", "surgery", "vaccination"],
              "description": "Type of appointment"
            },
            "notes": {
              "type": "string",
              "description": "Additional notes"
            }
          },
          "required": ["appointmentDate", "appointmentType"]
        }
      },
      {
        "name": "log_callback_request",
        "description": "Log a request for the clinic to call back",
        "parameters": {
          "type": "object",
          "properties": {
            "reason": {
              "type": "string",
              "description": "Reason for callback"
            },
            "preferredTime": {
              "type": "string",
              "description": "Preferred callback time"
            },
            "notes": {
              "type": "string",
              "description": "Additional notes"
            }
          },
          "required": ["reason"]
        }
      }
    ]
  }
}
```

---

## Phase 4: Implement Real-time Transcription (Optional)

### Purpose
Display live transcription in admin dashboard during calls

### Implementation

**File**: `/src/app/api/webhooks/vapi/route.ts`

**Step 1: Add Event Handler**

```typescript
else if (message.type === "speech-update") {
  await handleSpeechUpdate(supabase, message);
}
```

**Step 2: Implement Handler Function**

```typescript
/**
 * Handle speech-update webhook
 * Real-time transcription updates during the call
 */
async function handleSpeechUpdate(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  message: VapiWebhookPayload["message"],
) {
  const call = message.call as VapiCallResponse;

  if (!call?.id) {
    console.warn("[VAPI_WEBHOOK] speech-update missing call data");
    return;
  }

  const speechData = message as unknown as {
    call: VapiCallResponse;
    transcript: string;
    role: "user" | "assistant";
    timestamp: string;
  };

  // Find the call in our database
  const { data: existingCall, error: findError } = await supabase
    .from("vapi_calls")
    .select("id, metadata")
    .eq("vapi_call_id", call.id)
    .single();

  if (findError || !existingCall) {
    console.warn("[VAPI_WEBHOOK] Call not found for speech update", {
      callId: call.id,
      error: findError,
    });
    return;
  }

  // Store real-time transcript in a separate table for live monitoring
  await supabase.from("call_transcripts_live").insert({
    call_id: existingCall.id,
    transcript: speechData.transcript,
    role: speechData.role,
    timestamp: speechData.timestamp,
  });

  console.log("[VAPI_WEBHOOK] Speech update stored", {
    callId: call.id,
    role: speechData.role,
    transcriptLength: speechData.transcript.length,
  });
}
```

**Step 3: Create Database Table**

```sql
CREATE TABLE call_transcripts_live (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES vapi_calls(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_transcripts_live_call_id ON call_transcripts_live(call_id);
CREATE INDEX idx_call_transcripts_live_timestamp ON call_transcripts_live(timestamp);
```

---

## Testing Checklist

### Phase 1: Security Testing
- [ ] Webhook signature verification enabled
- [ ] VAPI_WEBHOOK_SECRET set in production
- [ ] Test with valid signature (should succeed)
- [ ] Test with invalid signature (should fail with 401)
- [ ] Test without signature (should fail with 401)
- [ ] Monitor logs for signature verification attempts

### Phase 2: assistant-request Testing
- [ ] Configure server URL in VAPI assistant
- [ ] Trigger assistant request for pet info
- [ ] Verify data returned correctly
- [ ] Check logs for request/response
- [ ] Test with missing call (should return 404)

### Phase 3: function-call Testing
- [ ] Configure functions in VAPI assistant
- [ ] Test send_sms function
- [ ] Test schedule_appointment function
- [ ] Test log_callback_request function
- [ ] Verify function execution logged
- [ ] Verify database records created

### Phase 4: speech-update Testing
- [ ] Create call_transcripts_live table
- [ ] Start a test call
- [ ] Verify real-time transcripts stored
- [ ] Check transcript table populated
- [ ] Test with multiple concurrent calls

---

## Deployment Steps

1. **Code Changes**
   ```bash
   git checkout -b feature/vapi-webhook-improvements
   # Make changes as outlined above
   git add .
   git commit -m "feat: implement missing VAPI webhook handlers and enable signature verification"
   git push origin feature/vapi-webhook-improvements
   ```

2. **Environment Variables**
   - Add `VAPI_WEBHOOK_SECRET` in Vercel dashboard
   - Verify all other VAPI env vars are set

3. **VAPI Dashboard Configuration**
   - Update webhook URL if needed
   - Enable signature verification with HMAC-SHA256
   - Add new event types if implementing assistant-request or function-call

4. **Database Migrations**
   ```bash
   # If implementing real-time transcription
   pnpm supabase migration new add_call_transcripts_live_table
   # Add SQL from Phase 4
   pnpm supabase db push
   ```

5. **Deploy**
   ```bash
   git checkout main
   git merge feature/vapi-webhook-improvements
   git push origin main
   # Vercel auto-deploys
   ```

6. **Verify Deployment**
   - Check Vercel logs for webhook events
   - Test signature verification
   - Test new handlers
   - Monitor for errors

---

## Rollback Plan

If issues occur after deployment:

1. **Disable Signature Verification**
   ```typescript
   // Comment out lines 175-179 again temporarily
   // const isValid = await verifySignature(request, body);
   // if (!isValid) {
   //   console.error('[VAPI_WEBHOOK] Invalid webhook signature');
   //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
   // }
   ```

2. **Remove New Event Handlers**
   - Comment out new event type checks
   - Revert to previous version

3. **Git Revert**
   ```bash
   git revert HEAD
   git push origin main
   ```

4. **Monitor Logs**
   - Check Vercel logs for errors
   - Verify webhooks processing correctly
   - Test call flow end-to-end

---

## Support and Troubleshooting

### Common Issues

**Issue**: Signature verification failing
- **Cause**: Mismatched secret or wrong algorithm
- **Fix**: Verify `VAPI_WEBHOOK_SECRET` matches VAPI dashboard
- **Fix**: Verify VAPI using SHA-256 algorithm

**Issue**: assistant-request not receiving data
- **Cause**: Server URL not configured in VAPI assistant
- **Fix**: Add `serverUrl` to assistant configuration
- **Fix**: Verify webhook handler returning correct JSON structure

**Issue**: function-call not executing
- **Cause**: Function not defined in VAPI assistant
- **Fix**: Add function definition to assistant's model config
- **Fix**: Verify function name matches handler switch case

**Issue**: speech-update not storing transcripts
- **Cause**: Table doesn't exist or wrong column types
- **Fix**: Run migration to create `call_transcripts_live` table
- **Fix**: Verify foreign key constraint on `call_id`

### Debug Logging

Enable verbose logging by adding to webhook handler:

```typescript
console.log("[VAPI_WEBHOOK_DEBUG]", {
  headers: Object.fromEntries(request.headers.entries()),
  body: body.substring(0, 500), // First 500 chars
  messageType: message.type,
  callId: message.call?.id,
});
```

---

**Last Updated**: 2025-11-12
**Version**: 1.0
