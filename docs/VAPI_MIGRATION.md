# VAPI Migration Guide

## Overview

This document describes the complete migration from Retell AI to VAPI for the OdisAI veterinary follow-up call system. The migration maintains all existing functionality while leveraging VAPI's enhanced features and knowledge base integration.

## What Was Done

### 1. Package Installation

**Added:**
- `@vapi-ai/server-sdk` (v0.10.2) - Server-side VAPI SDK for making phone calls

**Existing:**
- `@vapi-ai/web` (v2.5.0) - Already installed for browser-based test page
- `retell-sdk` (v4.56.0) - Can be removed if no longer needed

### 2. Database Schema

The `vapi_calls` table already existed with the correct structure. Key columns:

```sql
vapi_calls (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  vapi_call_id TEXT UNIQUE,
  assistant_id TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'queued',
  dynamic_variables JSONB NOT NULL,
  condition_category TEXT,
  knowledge_base_used TEXT,
  recording_url TEXT,
  transcript TEXT,
  transcript_messages JSONB,
  call_analysis JSONB,
  cost DECIMAL(10, 4),
  -- ... timestamps and metadata
)
```

### 3. New Files Created

#### [src/lib/vapi/client.ts](../src/lib/vapi/client.ts)
Server-side VAPI client wrapper providing:
- `getVapiClient()` - Initialized VAPI client with API key
- `createPhoneCall()` - Create outbound phone calls
- `getCall()` - Retrieve call details
- `listCalls()` - List calls with filters
- `mapVapiStatus()` - Map VAPI status to internal status
- `shouldMarkAsFailed()` - Determine if call failed
- `calculateTotalCost()` - Calculate total call cost

#### [src/app/api/vapi/schedule/route.ts](../src/app/api/vapi/schedule/route.ts)
New endpoint for scheduling VAPI calls:
- **URL**: `POST /api/vapi/schedule`
- **Authentication**: Bearer token or cookies
- **Authorization**: Admin role required
- **Features**:
  - Validates dynamic variables with knowledge base integration
  - Stores call in `vapi_calls` table
  - Enqueues execution in QStash
  - Supports both immediate and scheduled calls

#### [src/app/api/webhooks/vapi/route.ts](../src/app/api/webhooks/vapi/route.ts)
VAPI webhook handler for call events:
- **URL**: `POST /api/webhooks/vapi`
- **Events**: `status-update`, `end-of-call-report`, `hang`
- **Features**:
  - Signature verification (optional VAPI_WEBHOOK_SECRET)
  - Updates call status and metadata
  - Automatic retry logic for failed calls
  - Stores transcript, recording, and analysis

### 4. Modified Files

#### [src/app/api/webhooks/execute-call/route.ts](../src/app/api/webhooks/execute-call/route.ts)
Updated QStash execution webhook:
- Changed from `retell_calls` to `vapi_calls` table
- Changed from `createPhoneCall` (Retell) to `createPhoneCall` (VAPI)
- Updated status mapping to use `mapVapiStatus()`
- Changed field names:
  - `retell_call_id` → `vapi_call_id`
  - `phone_number` → `customer_phone`
  - `call_variables` → `dynamic_variables`

#### [.env.example](../.env.example)
Updated environment variables:
- Replaced Retell configuration with VAPI configuration
- Added comprehensive setup instructions

**Old (Retell):**
```bash
RETELL_API_KEY="key_xxx"
RETELL_FROM_NUMBER="+1234567890"
RETELL_AGENT_ID="agent_xxx"
```

**New (VAPI):**
```bash
VAPI_PRIVATE_KEY="your-vapi-private-api-key-here"
VAPI_ASSISTANT_ID="assistant-id-here"
VAPI_PHONE_NUMBER_ID="phone-number-id-here"
NEXT_PUBLIC_VAPI_PUBLIC_KEY="your-vapi-public-key-here"
VAPI_WEBHOOK_SECRET="your-webhook-secret-here"
```

## Environment Variables Required

### Server-Side (Required)
```bash
VAPI_PRIVATE_KEY="sk_xxx"              # Private API key for server calls
VAPI_ASSISTANT_ID="assistant_xxx"      # Your VAPI assistant ID
VAPI_PHONE_NUMBER_ID="phone_xxx"       # Your VAPI phone number ID
```

### Client-Side (Optional - for test page)
```bash
NEXT_PUBLIC_VAPI_PUBLIC_KEY="pk_xxx"   # Public key for browser calls
```

### Webhook Security (Recommended)
```bash
VAPI_WEBHOOK_SECRET="your_secret"      # For webhook signature verification
```

## API Endpoints

### Schedule a Call
```bash
POST /api/vapi/schedule

Headers:
  Authorization: Bearer <token>  # or cookie-based auth
  Content-Type: application/json

Body:
{
  "phoneNumber": "+1234567890",
  "petName": "Bella",
  "ownerName": "John Smith",
  "clinicName": "Alum Rock Pet Hospital",
  "agentName": "Sarah",
  "appointmentDate": "November eighth",
  "callType": "follow-up",
  "dischargeSummary": "...",
  "condition": "ear infection",
  "medications": "...",
  "scheduledFor": "2025-11-12T14:00:00Z"  // Optional
}

Response:
{
  "success": true,
  "data": {
    "callId": "uuid",
    "scheduledFor": "2025-11-12T14:00:00Z",
    "qstashMessageId": "msg_xxx",
    "warnings": []
  }
}
```

### Webhook (VAPI → Your Server)
```bash
POST /api/webhooks/vapi

Headers:
  x-vapi-signature: <signature>
  Content-Type: application/json

Body:
{
  "message": {
    "type": "end-of-call-report",
    "call": {
      "id": "call_xxx",
      "status": "ended",
      "endedReason": "customer-ended-call",
      "transcript": "...",
      "recordingUrl": "https://...",
      "analysis": {...},
      "costs": [...]
    }
  }
}
```

## VAPI Dashboard Setup

1. **Create Account**: https://dashboard.vapi.ai
2. **Get API Keys**:
   - Go to Settings → API Keys
   - Copy your Private Key (starts with `sk_`)
   - Copy your Public Key (starts with `pk_`)
3. **Create Assistant**:
   - Navigate to Assistants
   - Create a new assistant for veterinary follow-ups
   - Configure the system prompt and voice
   - Copy the Assistant ID
4. **Purchase Phone Number**:
   - Go to Phone Numbers
   - Purchase a number for outbound calls
   - Copy the Phone Number ID
5. **Configure Webhook**:
   - Go to Settings → Webhooks
   - Add webhook URL: `https://your-domain.com/api/webhooks/vapi`
   - Select events: `status-update`, `end-of-call-report`, `hang`
   - Generate and save webhook secret

## Migration Checklist

- [x] Install `@vapi-ai/server-sdk`
- [x] Create VAPI client wrapper
- [x] Create `/api/vapi/schedule` endpoint
- [x] Create `/api/webhooks/vapi` handler
- [x] Update `/api/webhooks/execute-call` to use VAPI
- [x] Update `.env.example` with VAPI configuration
- [ ] Remove Retell-specific code (optional if keeping as fallback)
- [ ] Remove `retell-sdk` package (optional)
- [ ] Update CLAUDE.md documentation
- [ ] Test scheduling and execution flow
- [ ] Configure VAPI webhook in dashboard
- [ ] Add environment variables to production

## Testing the Migration

### 1. Test Scheduling
```bash
curl -X POST http://localhost:3000/api/vapi/schedule \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "petName": "Test Pet",
    "ownerName": "Test Owner",
    "clinicName": "Test Clinic",
    "agentName": "Test Agent",
    "appointmentDate": "November fifteenth",
    "callType": "discharge",
    "dischargeSummary": "Test summary",
    "clinicPhone": "five five five, one two three, four five six seven",
    "emergencyPhone": "five five five, nine one one, one one one one"
  }'
```

### 2. Test Webhook (using ngrok for local testing)
```bash
# Install ngrok if needed
npm install -g ngrok

# Expose local server
ngrok http 3000

# Configure webhook in VAPI dashboard with ngrok URL:
# https://xxxx.ngrok.io/api/webhooks/vapi
```

### 3. Monitor Logs
```bash
# Watch server logs
pnpm dev

# Check Supabase logs
npx supabase logs

# Check VAPI dashboard logs
# https://dashboard.vapi.ai/calls
```

## Troubleshooting

### Call Not Created
- Verify `VAPI_PRIVATE_KEY` is correct
- Check `VAPI_ASSISTANT_ID` exists
- Verify `VAPI_PHONE_NUMBER_ID` is active
- Check phone number is in E.164 format (+1234567890)

### Webhook Not Receiving Events
- Verify webhook URL is publicly accessible
- Check `VAPI_WEBHOOK_SECRET` matches dashboard
- Verify webhook is configured in VAPI dashboard
- Check server logs for incoming requests

### Status Not Updating
- Verify webhook signature verification
- Check `vapi_calls` table RLS policies
- Ensure database connection is working
- Check Supabase service role key

## Key Differences: Retell vs VAPI

| Feature | Retell AI | VAPI |
|---------|-----------|------|
| Phone Number | `from_number` | `phoneNumberId` |
| Agent | `override_agent_id` | `assistantId` |
| Variables | `retell_llm_dynamic_variables` | `assistantOverrides.variableValues` |
| Webhook Events | `call_started`, `call_ended`, `call_analyzed` | `status-update`, `end-of-call-report`, `hang` |
| Status Values | `registered`, `ongoing`, `ended` | `queued`, `ringing`, `in-progress`, `ended` |
| Call ID | `call_id` | `id` |
| Timestamp | Unix timestamp (seconds) | ISO 8601 string |

## Benefits of VAPI Migration

1. **Better Knowledge Base Integration**: Built-in knowledge base system for condition-specific questions
2. **Enhanced Analytics**: More detailed call analysis and metrics
3. **Improved Webhook System**: More granular event updates
4. **Better Documentation**: Comprehensive API docs and examples
5. **Cost Tracking**: Built-in cost calculation per call
6. **Modern SDK**: TypeScript-first with better type safety

## Support Resources

- **VAPI Documentation**: https://docs.vapi.ai
- **VAPI Dashboard**: https://dashboard.vapi.ai
- **Server SDK**: https://docs.vapi.ai/server-sdks
- **Webhooks**: https://docs.vapi.ai/server_url
- **Phone Calls**: https://docs.vapi.ai/quickstart/phone

## Next Steps

1. Add environment variables to your `.env.local`
2. Configure VAPI dashboard (assistant, phone number, webhook)
3. Test the scheduling endpoint
4. Test webhook reception
5. Deploy to production
6. Update monitoring and alerting
7. Remove Retell code if no longer needed (optional)
