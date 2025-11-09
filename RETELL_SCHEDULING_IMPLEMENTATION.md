# Retell AI Scheduled Calls - Implementation Summary

## Overview

This document provides a summary of the implementation of the Retell AI scheduled calls system. For complete architecture details, see `docs/RETELL_SCHEDULING_ARCHITECTURE.md`.

## Implementation Status: COMPLETE

All core components have been implemented and are ready for testing.

## Components Implemented

### 1. Package Dependencies

**File**: `package.json`

Added dependencies:

- `@upstash/qstash@^2.7.29` - Job queue for delayed execution
- `date-fns-tz@^3.2.0` - Timezone handling for business hours

**Installation**: Run `pnpm install` to install new dependencies.

### 2. Business Hours Utilities

**File**: `src/lib/utils/business-hours.ts`

Functions:

- `isWithinBusinessHours()` - Check if timestamp is within business hours
- `getNextBusinessHourSlot()` - Find next available business hour
- `isFutureTime()` - Validate scheduled time is in future
- `calculateDelay()` - Calculate delay in seconds

Configuration:

- Default hours: 9 AM - 5 PM
- Default timezone: America/Los_Angeles
- Weekend exclusion: Enabled by default

### 3. QStash Integration

**File**: `src/lib/qstash/client.ts`

Functions:

- `scheduleCallExecution()` - Schedule call for delayed execution
- `cancelScheduledExecution()` - Cancel scheduled job (placeholder)

Features:

- Automatic retry on webhook failure (3 attempts)
- Comprehensive logging
- Error handling

### 4. IDEXX Data Types

**File**: `src/lib/idexx/types.ts`

TypeScript interfaces for IDEXX Neo API:

- `IdexxPageData` - Complete page data structure
- `IdexxProvider` - Veterinarian information
- `IdexxPatient` - Pet information
- `IdexxClient` - Owner information
- `IdexxConsultation` - Consultation details
- `IdexxClinic` - Clinic information

### 5. IDEXX Data Transformer

**File**: `src/lib/idexx/transformer.ts`

Functions:

- `transformIdexxToCallRequest()` - Convert IDEXX data to call request
- `formatPhoneNumber()` - Format phone to E.164 format
- `extractConsultationId()` - Extract ID from IDEXX URL
- `validateIdexxData()` - Validate required fields

### 6. Schedule Call API Route

**File**: `src/app/api/calls/schedule/route.ts`

Endpoint: `POST /api/calls/schedule`

Features:

- Admin authentication required
- Input validation via Zod schema
- Future time validation
- Business hours validation with auto-rescheduling
- Database record creation
- QStash job enqueueing
- Comprehensive error handling

Request body:

```json
{
  "phoneNumber": "+12137774445",
  "petName": "Luna",
  "ownerName": "Sarah Johnson",
  "vetName": "Dr. Smith",
  "clinicName": "Paws & Claws Veterinary",
  "clinicPhone": "+14155551234",
  "dischargeSummary": "Post-op instructions...",
  "scheduledFor": "2025-11-10T14:00:00Z",
  "notes": "Follow-up on surgery recovery"
}
```

### 7. Execute Call Webhook

**File**: `src/app/api/webhooks/execute-call/route.ts`

Endpoint: `POST /api/webhooks/execute-call`

Features:

- QStash signature verification (CRITICAL for security)
- Business hours check at execution time
- Automatic rescheduling if outside hours
- Retell API call execution
- Database status updates
- Idempotency (prevents double execution)

Triggered by: QStash at scheduled time

### 8. Enhanced Retell Webhook

**File**: `src/app/api/webhooks/retell/route.ts` (UPDATED)

New features added:

- Automatic retry logic for failed calls
- Exponential backoff (5, 10, 20 minutes)
- Max retry limit (3 attempts)
- Retry status tracking in metadata
- QStash re-enqueueing for retries

Retryable errors:

- `dial_no_answer`
- `dial_busy`
- `error_inbound_webhook`

Non-retryable errors:

- `dial_failed`
- `user_hangup` (marked as completed, not failed)

### 9. Environment Variables

**File**: `.env.example` (UPDATED)

New variables required:

```bash
# QStash Configuration
QSTASH_TOKEN="your-qstash-token-here"
QSTASH_CURRENT_SIGNING_KEY="your-current-signing-key"
QSTASH_NEXT_SIGNING_KEY="your-next-signing-key"

# Retell AI (existing, now documented)
RETELL_API_KEY="key_your_retell_api_key_here"
RETELL_FROM_NUMBER="+12137774445"
RETELL_AGENT_ID="agent_your_agent_id_here"

# Site URL (critical for webhooks)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Add QStash credentials:
   - Sign up at https://console.upstash.com
   - Navigate to QStash
   - Copy token and signing keys
   - Add to `.env.local`

3. Verify Retell AI credentials:
   - Ensure `RETELL_API_KEY` is set
   - Ensure `RETELL_FROM_NUMBER` is set
   - Ensure `RETELL_AGENT_ID` is set

4. Set site URL:
   - Development: `http://localhost:3000`
   - Production: Your actual domain

### 3. Configure Retell Webhook

In Retell AI dashboard:

- URL: `https://your-domain.com/api/webhooks/retell`
- Events: `call_started`, `call_ended`, `call_analyzed`

### 4. Test the System

#### Test 1: Schedule a call for 2 minutes from now

```bash
curl -X POST http://localhost:3000/api/calls/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "phoneNumber": "+12137774445",
    "petName": "Test Pet",
    "ownerName": "Test Owner",
    "scheduledFor": "'$(date -u -d '+2 minutes' +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

#### Test 2: Verify database record

```sql
SELECT id, phone_number, status, metadata->>'scheduled_for' as scheduled_for
FROM retell_calls
WHERE status = 'scheduled'
ORDER BY created_at DESC
LIMIT 1;
```

#### Test 3: Monitor QStash dashboard

- Visit https://console.upstash.com/qstash
- Check "Messages" tab
- Verify your scheduled job appears

#### Test 4: Wait for execution

After 2 minutes:

- Check database: status should change from `scheduled` to `initiated`
- Check Retell dashboard: call should appear
- Check logs for `[EXECUTE_CALL]` entries

## Data Flow

### Scheduling Flow

```
User/Extension → POST /api/calls/schedule
                 ↓
              Validate input
                 ↓
          Check business hours
                 ↓
         Create DB record (status: scheduled)
                 ↓
         Enqueue in QStash
                 ↓
         Return confirmation
```

### Execution Flow

```
QStash Timer → POST /api/webhooks/execute-call
               ↓
           Verify signature
               ↓
       Fetch scheduled call
               ↓
   Check business hours NOW
               ↓
     ┌─────────┴─────────┐
     │                   │
 Outside hours       Within hours
     │                   │
 Reschedule          Execute call
     │                   │
 Update DB           Update DB
     │                   │
 Return 200          Return 200
```

### Retry Flow

```
Retell Call Fails → POST /api/webhooks/retell
                    ↓
              Check retry count
                    ↓
            ┌───────┴───────┐
            │               │
      < Max retries    >= Max retries
            │               │
    Schedule retry    Mark failed
            │               │
    Exponential      Update metadata
     backoff              │
            │          Return 200
    Re-enqueue
            │
       Return 200
```

## Metadata Structure

Calls store metadata in JSONB format:

```typescript
{
  // Scheduling
  scheduled_for: "2025-11-10T14:00:00Z",
  timezone: "America/Los_Angeles",
  notes: "Follow-up on surgery",

  // QStash tracking
  qstash_message_id: "msg_abc123xyz",

  // Retry tracking
  retry_count: 0,
  max_retries: 3,
  next_retry_at: "2025-11-10T14:05:00Z",
  last_retry_reason: "dial_no_answer",

  // Execution tracking
  executed_at: "2025-11-10T14:00:05Z",

  // Rescheduling tracking
  rescheduled_reason: "outside_business_hours",
  rescheduled_count: 1,

  // Final failure tracking
  final_failure: true,
  final_failure_reason: "dial_failed"
}
```

## Security Considerations

### 1. QStash Signature Verification

**CRITICAL**: The execute-call webhook MUST verify QStash signatures.

Implementation:

```typescript
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";

async function handler(req: NextRequest) {
  // Your logic here
}

export const POST = verifySignatureAppRouter(handler);
```

### 2. Admin-Only Access

The schedule API route requires:

1. Valid authentication token
2. User role = "admin"

### 3. Retell Webhook Signature

Currently disabled but should be re-enabled in production:

```typescript
if (!verifySignature(request)) {
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
}
```

## Monitoring & Debugging

### Structured Logging

All components use structured logging with prefixes:

- `[SCHEDULE_CALL]` - Schedule API route
- `[EXECUTE_CALL]` - Execute webhook
- `[RETELL_WEBHOOK]` - Retell event webhook
- `[QSTASH_CLIENT]` - QStash client operations

### Key Metrics to Track

1. **Scheduling success rate**
   - Successful schedules / Total attempts

2. **Execution success rate**
   - Successful executions / Total scheduled

3. **Retry statistics**
   - Average retry count
   - Success rate after retries

4. **Business hours rescheduling**
   - Percentage of calls rescheduled
   - Average reschedule count

### Common Issues

#### Issue: Calls not executing at scheduled time

**Diagnosis**:

1. Check QStash dashboard for failed messages
2. Check `NEXT_PUBLIC_SITE_URL` is set correctly
3. Verify webhook is publicly accessible
4. Check QStash signature verification

#### Issue: Business hours always failing

**Diagnosis**:

1. Verify timezone in metadata
2. Check `isWithinBusinessHours()` logic
3. Verify date-fns-tz is installed

#### Issue: Retries not working

**Diagnosis**:

1. Check `metadata.retry_count` and `metadata.max_retries`
2. Verify `shouldRetry()` includes disconnection reason
3. Check QStash re-enqueueing succeeded

## Next Steps

### Phase 1: Testing (This Week)

- [ ] Run `pnpm install` to install dependencies
- [ ] Configure environment variables
- [ ] Test schedule API with immediate call
- [ ] Test schedule API with future call
- [ ] Verify QStash execution
- [ ] Test business hours rescheduling
- [ ] Test retry logic

### Phase 2: Browser Extension (Next Week)

- [ ] Build Chrome extension
- [ ] Implement IDEXX data capture
- [ ] Add date/time picker UI
- [ ] Test with IDEXX Neo sandbox
- [ ] Deploy to Chrome Web Store (unlisted)

### Phase 3: Production Deployment

- [ ] Add environment variables to Vercel
- [ ] Enable Retell webhook signature verification
- [ ] Configure production webhook URLs
- [ ] Test end-to-end in staging
- [ ] Deploy to production
- [ ] Monitor logs and metrics

## Additional Resources

- **Complete Architecture**: `docs/RETELL_SCHEDULING_ARCHITECTURE.md`
- **Retell API Docs**: https://docs.retellai.com
- **QStash Docs**: https://upstash.com/docs/qstash
- **date-fns-tz Docs**: https://github.com/marnusw/date-fns-tz

## Support

For questions or issues:

1. Check architecture documentation
2. Review structured logs
3. Check QStash dashboard
4. Verify environment variables
5. Test with cURL commands

---

**Implementation Date**: 2025-11-08
**Status**: Ready for Testing
**Version**: 1.0
