# VAPI Webhook System - Comprehensive Audit Report

**Date**: 2025-11-12
**Audited By**: Multi-Agent Coordinator
**Scope**: VAPI webhook event handling, database column population, and integration flow

---

## Executive Summary

This audit reviewed the VAPI webhook integration system for proper event handling and database population. The system has been recently migrated from Retell AI to VAPI with significant improvements in webhook security and retry logic.

**Key Findings**:

- ✅ Core webhook events (status-update, end-of-call-report, hang) are properly handled
- ⚠️ Missing handlers for several VAPI webhook events
- ✅ Database schema is comprehensive with proper JSONB columns
- ✅ Retry logic with exponential backoff is implemented
- ⚠️ Webhook signature verification is currently disabled in production
- ✅ Dynamic variables flow is properly implemented with extensive logging

---

## 1. Current State Assessment

### 1.1 Webhook Events Currently Handled

The webhook handler at `/src/app/api/webhooks/vapi/route.ts` currently handles **3 event types**:

| Event Type           | Handler Function          | Database Updates                                                                                                                                          | Status         |
| -------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `status-update`      | `handleStatusUpdate()`    | status, started_at                                                                                                                                        | ✅ Implemented |
| `end-of-call-report` | `handleEndOfCallReport()` | status, ended_reason, started_at, ended_at, duration_seconds, recording_url, transcript, transcript_messages, call_analysis, cost, metadata (retry logic) | ✅ Implemented |
| `hang`               | `handleHangup()`          | ended_reason, ended_at                                                                                                                                    | ✅ Implemented |

### 1.2 VAPI Webhook Events NOT Currently Handled

According to VAPI documentation (https://docs.vapi.ai/server-url/events), the following events are **NOT** currently handled:

| Event Type            | Purpose                                 | Priority  | Recommendation                     |
| --------------------- | --------------------------------------- | --------- | ---------------------------------- |
| `assistant-request`   | Assistant needs information from server | 🔴 HIGH   | Required for dynamic data fetching |
| `function-call`       | Tool/function execution request         | 🔴 HIGH   | Required for custom actions        |
| `speech-update`       | Real-time transcription updates         | 🟡 MEDIUM | Optional for real-time monitoring  |
| `transcript`          | Final transcript available              | 🟡 MEDIUM | Redundant with end-of-call-report  |
| `conversation-update` | Conversation state changes              | 🟢 LOW    | Optional for detailed logging      |
| `tool-calls`          | Multiple tool calls requested           | 🔴 HIGH   | Required if using VAPI tools       |

### 1.3 Security Assessment

**Webhook Signature Verification**: Currently **DISABLED** in production

```typescript
// Lines 175-179 in src/app/api/webhooks/vapi/route.ts
// const isValid = await verifySignature(request, body);
// if (!isValid) {
//   console.error('[VAPI_WEBHOOK] Invalid webhook signature');
//   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
// }
```

**Security Implementation Status**:

- ✅ HMAC-SHA256 verification code is written and tested
- ✅ Timing-safe comparison implemented
- ❌ Currently commented out in production
- ⚠️ Development mode allows unsigned requests (if VAPI_WEBHOOK_SECRET not set)

**Risk Level**: 🔴 **HIGH** - Webhook endpoint is vulnerable to unauthorized requests

---

## 2. Database Column Analysis

### 2.1 vapi_calls Table Schema

Based on the code analysis, the `vapi_calls` table has the following columns:

| Column Name           | Type          | Populated By    | Webhook Event                     | Status               |
| --------------------- | ------------- | --------------- | --------------------------------- | -------------------- |
| `id`                  | UUID          | Schedule API    | -                                 | ✅ Primary key       |
| `user_id`             | UUID          | Schedule API    | -                                 | ✅ Required          |
| `vapi_call_id`        | TEXT          | Execute webhook | status-update                     | ✅ Unique identifier |
| `assistant_id`        | TEXT          | Schedule API    | -                                 | ✅ Required          |
| `phone_number_id`     | TEXT          | Schedule API    | -                                 | ✅ Required          |
| `customer_phone`      | TEXT          | Schedule API    | -                                 | ✅ Required          |
| `scheduled_for`       | TIMESTAMPTZ   | Schedule API    | -                                 | ✅ Required          |
| `status`              | TEXT          | Multiple        | status-update, end-of-call-report | ✅ Updated           |
| `ended_reason`        | TEXT          | JSONB           | end-of-call-report, hang          | ✅ Updated           |
| `started_at`          | TIMESTAMPTZ   | Execute webhook | status-update, end-of-call-report | ✅ Updated           |
| `ended_at`            | TIMESTAMPTZ   | Execute webhook | end-of-call-report, hang          | ✅ Updated           |
| `duration_seconds`    | INTEGER       | Calculated      | end-of-call-report                | ✅ Calculated        |
| `recording_url`       | TEXT          | VAPI API        | end-of-call-report                | ✅ Updated           |
| `transcript`          | TEXT          | VAPI API        | end-of-call-report                | ✅ Updated           |
| `transcript_messages` | JSONB         | VAPI API        | end-of-call-report                | ✅ Updated           |
| `call_analysis`       | JSONB         | VAPI API        | end-of-call-report                | ✅ Updated           |
| `dynamic_variables`   | JSONB         | Schedule API    | -                                 | ✅ Used for call     |
| `condition_category`  | TEXT          | Schedule API    | -                                 | ⚠️ Not used          |
| `knowledge_base_used` | TEXT          | -               | -                                 | ⚠️ Not populated     |
| `cost`                | NUMERIC(10,4) | Calculated      | end-of-call-report                | ✅ Calculated        |
| `metadata`            | JSONB         | Multiple        | All events                        | ✅ Flexible storage  |
| `created_at`          | TIMESTAMPTZ   | Auto            | -                                 | ✅ Timestamp         |
| `updated_at`          | TIMESTAMPTZ   | Auto            | -                                 | ✅ Timestamp         |

### 2.2 Column Population Issues

**Columns NOT Being Populated**:

1. `condition_category` - Defined in schema but never populated
2. `knowledge_base_used` - Defined but no code populates it

**Metadata Fields** (properly used):

- `retry_count` - Tracks retry attempts
- `max_retries` - Maximum retry limit
- `next_retry_at` - When next retry is scheduled
- `last_retry_reason` - Why the call failed
- `final_failure` - Flag for permanent failures
- `qstash_message_id` - QStash job identifier
- `executed_at` - When call was actually executed
- `timezone` - User's timezone
- `notes` - Optional notes

---

## 3. Integration Flow Analysis

### 3.1 Complete Call Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Schedule Call                                           │
│ POST /api/calls/schedule                                        │
│ - Validates input data                                          │
│ - Creates record in vapi_calls table (status: "queued")        │
│ - Schedules execution via QStash                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Execute Call (QStash triggers)                          │
│ POST /api/webhooks/execute-call                                 │
│ - Retrieves call from database                                  │
│ - Passes dynamic_variables to VAPI API                          │
│ - Creates call via VAPI SDK                                     │
│ - Updates vapi_call_id and status                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: VAPI Webhooks (Real-time updates)                       │
│                                                                  │
│ status-update → Updates status, started_at                      │
│                                                                  │
│ hang → Updates ended_reason, ended_at                           │
│                                                                  │
│ end-of-call-report → Updates all final data:                    │
│   - status, ended_reason                                         │
│   - started_at, ended_at, duration_seconds                       │
│   - recording_url, transcript, transcript_messages               │
│   - call_analysis, cost                                          │
│   - Retry logic (if failed and retryable)                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Retry Logic (if applicable)                             │
│ - Checks if failure is retryable (dial-busy, no-answer, etc.)   │
│ - Exponential backoff: 5min → 10min → 20min                     │
│ - Max 3 retries                                                  │
│ - Reschedules via QStash                                         │
│ - Returns to STEP 2                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Dynamic Variables Flow

The dynamic variables flow is **properly implemented** with extensive logging:

1. **Schedule Route** (`/api/calls/schedule`):
   - Receives data from browser extension or admin dashboard
   - Creates `callVariables` object with snake_case keys
   - Stores in `dynamic_variables` JSONB column
   - Logs variable count and keys

2. **Execute Route** (`/api/webhooks/execute-call`):
   - Retrieves `dynamic_variables` from database
   - Logs the retrieved variables (keys, count, content)
   - Passes to VAPI via `assistantOverrides.variableValues`
   - Logs the full payload sent to VAPI

3. **VAPI Client** (`/lib/vapi/client.ts`):
   - Receives parameters
   - Logs the complete payload including `assistantOverrides`
   - Calls VAPI SDK with proper structure

**Logging Coverage**: ✅ Excellent - Three checkpoint logs track variables through entire flow

---

## 4. Code Quality Assessment

### 4.1 Strengths

1. **Type Safety**: Proper TypeScript types throughout

   ```typescript
   supabase: Awaited<ReturnType<typeof createServiceClient>>;
   message: VapiWebhookPayload["message"];
   ```

2. **Error Handling**: Comprehensive try-catch blocks with detailed logging

   ```typescript
   console.error("[VAPI_WEBHOOK] Error", {
     error: error instanceof Error ? error.message : String(error),
     stack: error instanceof Error ? error.stack : undefined,
   });
   ```

3. **Retry Logic**: Intelligent exponential backoff

   ```typescript
   const retryableReasons = ["dial-busy", "dial-no-answer", "voicemail"];
   const delayMinutes = Math.pow(2, retryCount) * 5; // 5, 10, 20 minutes
   ```

4. **Status Mapping**: Proper mapping from VAPI statuses to internal statuses

   ```typescript
   const statusMap = {
     queued: "queued",
     ringing: "ringing",
     "in-progress": "in_progress",
     forwarding: "in_progress",
     ended: "completed",
   };
   ```

5. **Database Client Pattern**: Correct use of service client to bypass RLS
   ```typescript
   const supabase = await createServiceClient(); // Bypasses RLS for webhooks
   ```

### 4.2 Issues and Improvements Needed

1. **Webhook Signature Disabled**
   - **Issue**: Security verification is commented out
   - **Risk**: Unauthorized webhook calls possible
   - **Fix**: Enable signature verification in production

2. **Missing Event Handlers**
   - **Issue**: No handlers for `assistant-request`, `function-call`, `tool-calls`
   - **Impact**: Cannot support dynamic data fetching or tool execution
   - **Fix**: Implement handlers for interactive features

3. **Unused Database Columns**
   - **Issue**: `condition_category` and `knowledge_base_used` defined but not used
   - **Impact**: Schema bloat, confusion
   - **Fix**: Either populate these or remove from schema

4. **No Real-time Transcript Updates**
   - **Issue**: No `speech-update` handler
   - **Impact**: Cannot show real-time transcription in UI
   - **Fix**: Add handler for live transcription (optional)

5. **Limited Error Context**
   - **Issue**: Some errors don't include full context
   - **Fix**: Add more contextual information to error logs

---

## 5. VAPI API Compliance

### 5.1 Webhook Event Structure (from VAPI docs)

**Base Webhook Payload**:

```typescript
{
  message: {
    type: "status-update" | "assistant-request" | "end-of-call-report" | ...,
    call: { /* VapiCallResponse */ },
    // Event-specific fields
  }
}
```

### 5.2 Current Implementation vs. VAPI Spec

| VAPI Event            | Handler Exists | Implementation Quality | Notes                             |
| --------------------- | -------------- | ---------------------- | --------------------------------- |
| `status-update`       | ✅ Yes         | ✅ Correct             | Properly updates status           |
| `assistant-request`   | ❌ No          | N/A                    | Required for dynamic queries      |
| `function-call`       | ❌ No          | N/A                    | Required for tool execution       |
| `end-of-call-report`  | ✅ Yes         | ✅ Excellent           | Complete data population          |
| `hang`                | ✅ Yes         | ✅ Correct             | Properly handles hangup           |
| `speech-update`       | ❌ No          | N/A                    | Optional real-time feature        |
| `transcript`          | ❌ No          | N/A                    | Redundant with end-of-call        |
| `tool-calls`          | ❌ No          | N/A                    | Required for multi-tool scenarios |
| `conversation-update` | ❌ No          | N/A                    | Optional detailed logging         |

### 5.3 Dynamic Variables Structure

**Current Implementation** (✅ Correct):

```typescript
{
  assistantOverrides: {
    variableValues: {
      pet_name: "Fluffy",
      owner_name: "John Doe",
      clinic_name: "Pet Clinic",
      // ... more variables
    }
  }
}
```

**VAPI Expected Structure** (✅ Matches):

```typescript
{
  assistantOverrides: {
    variableValues: {
      [key: string]: any
    }
  }
}
```

---

## 6. Recommendations

### 6.1 Critical (Do Immediately)

1. **Enable Webhook Signature Verification**

   ```typescript
   // Uncomment lines 175-179 in src/app/api/webhooks/vapi/route.ts
   const isValid = await verifySignature(request, body);
   if (!isValid) {
     console.error("[VAPI_WEBHOOK] Invalid webhook signature");
     return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
   }
   ```

2. **Set VAPI_WEBHOOK_SECRET in Production**

   ```bash
   # Add to Vercel environment variables
   VAPI_WEBHOOK_SECRET="your-secret-from-vapi-dashboard"
   ```

3. **Test Webhook Signature Verification**
   - Configure webhook in VAPI dashboard with HMAC-SHA256
   - Test with valid and invalid signatures
   - Monitor logs for signature failures

### 6.2 High Priority (Do This Week)

1. **Implement assistant-request Handler**

   ```typescript
   async function handleAssistantRequest(
     supabase: Awaited<ReturnType<typeof createServiceClient>>,
     message: VapiWebhookPayload["message"],
   ) {
     // Return dynamic data to VAPI assistant
     // Example: Fetch pet records, clinic info, etc.
   }
   ```

2. **Implement function-call Handler**

   ```typescript
   async function handleFunctionCall(
     supabase: Awaited<ReturnType<typeof createServiceClient>>,
     message: VapiWebhookPayload["message"],
   ) {
     // Execute custom functions requested by VAPI
     // Example: Send SMS, create appointment, etc.
   }
   ```

3. **Add Health Monitoring**
   - Alert on signature verification failures
   - Alert on retry exhaustion
   - Track webhook processing time

### 6.3 Medium Priority (Do This Month)

1. **Implement speech-update Handler** (for real-time UI)

   ```typescript
   async function handleSpeechUpdate(
     supabase: Awaited<ReturnType<typeof createServiceClient>>,
     message: VapiWebhookPayload["message"],
   ) {
     // Store real-time transcription for live monitoring
   }
   ```

2. **Clean Up Database Schema**
   - Remove `condition_category` if not used
   - Remove `knowledge_base_used` if not used
   - Or implement population logic for these fields

3. **Add Webhook Event Metrics**
   - Track event types received
   - Track processing duration
   - Track failure rates by event type

### 6.4 Low Priority (Nice to Have)

1. **Implement tool-calls Handler**
   - For multi-tool scenarios
   - Batch execution of multiple tools

2. **Add Webhook Replay Functionality**
   - Store raw webhook payloads for debugging
   - Add admin UI to replay failed webhooks

3. **Enhanced Logging**
   - Structured logging with log levels
   - Integration with logging service (e.g., Datadog, Sentry)

---

## 7. Implementation Plan

### Phase 1: Security Hardening (Week 1)

**Priority**: 🔴 CRITICAL

- [ ] Enable webhook signature verification
- [ ] Set VAPI_WEBHOOK_SECRET in production
- [ ] Test signature verification end-to-end
- [ ] Add monitoring for signature failures
- [ ] Document runbook for security incidents

**Expected Outcome**: Secure webhook endpoint preventing unauthorized requests

### Phase 2: Event Coverage (Week 2-3)

**Priority**: 🟡 HIGH

- [ ] Implement `assistant-request` handler
  - Design data structure for dynamic queries
  - Implement database lookups
  - Add response formatting
  - Test with VAPI assistant

- [ ] Implement `function-call` handler
  - Define available functions (SMS, email, appointment booking)
  - Implement function execution logic
  - Add error handling and retries
  - Test with VAPI assistant

- [ ] Add handler for `tool-calls` (multi-tool batch execution)

**Expected Outcome**: Full VAPI feature support for interactive assistants

### Phase 3: Real-time Features (Week 4)

**Priority**: 🟢 MEDIUM

- [ ] Implement `speech-update` handler
  - Store real-time transcript updates
  - Expose via WebSocket or Server-Sent Events
  - Build admin UI for live call monitoring

**Expected Outcome**: Real-time call monitoring dashboard

### Phase 4: Database Cleanup (Week 5)

**Priority**: 🟢 MEDIUM

- [ ] Audit unused columns
- [ ] Remove or implement `condition_category`
- [ ] Remove or implement `knowledge_base_used`
- [ ] Add database migration
- [ ] Update TypeScript types

**Expected Outcome**: Clean, well-documented database schema

### Phase 5: Monitoring & Observability (Week 6)

**Priority**: 🟢 LOW

- [ ] Add webhook metrics
- [ ] Set up alerts for failures
- [ ] Create operations dashboard
- [ ] Document troubleshooting procedures

**Expected Outcome**: Proactive monitoring and alerting

---

## 8. Testing Strategy

### 8.1 Unit Tests Needed

```typescript
// tests/webhooks/vapi.test.ts
describe("VAPI Webhook Handler", () => {
  it("should verify valid HMAC signature", async () => {
    // Test signature verification
  });

  it("should reject invalid signature", async () => {
    // Test signature rejection
  });

  it("should handle status-update event", async () => {
    // Test status update logic
  });

  it("should handle end-of-call-report event", async () => {
    // Test full data population
  });

  it("should trigger retry for retryable failures", async () => {
    // Test retry logic
  });

  it("should mark as failed after max retries", async () => {
    // Test max retry limit
  });
});
```

### 8.2 Integration Tests Needed

```typescript
// tests/integration/vapi-flow.test.ts
describe("VAPI Call Flow", () => {
  it("should complete full call lifecycle", async () => {
    // 1. Schedule call
    // 2. Execute call (via QStash simulation)
    // 3. Receive status-update webhook
    // 4. Receive end-of-call-report webhook
    // 5. Verify database state
  });

  it("should retry failed calls with exponential backoff", async () => {
    // Test retry flow
  });

  it("should pass dynamic variables correctly", async () => {
    // Test dynamic variable propagation
  });
});
```

### 8.3 Manual Testing Checklist

- [ ] Schedule a call via API
- [ ] Verify database record created
- [ ] Wait for QStash execution
- [ ] Verify VAPI call created
- [ ] Check status-update webhook received
- [ ] Check end-of-call-report webhook received
- [ ] Verify all database columns populated
- [ ] Test retry logic with simulated failure
- [ ] Test signature verification with valid/invalid signatures

---

## 9. Environment Variables Checklist

### Required for Production

```bash
# VAPI Configuration
VAPI_PRIVATE_KEY="sk_xxx"                    # ✅ Required
VAPI_ASSISTANT_ID="assistant_xxx"            # ✅ Required
VAPI_PHONE_NUMBER_ID="phone_xxx"             # ✅ Required
VAPI_WEBHOOK_SECRET="your_secret_here"       # ⚠️ MISSING - Add immediately

# QStash Configuration
QSTASH_TOKEN="your_token"                    # ✅ Required
QSTASH_CURRENT_SIGNING_KEY="key1"            # ✅ Required
QSTASH_NEXT_SIGNING_KEY="key2"               # ✅ Required

# Site URL
NEXT_PUBLIC_SITE_URL="https://odisai.net"    # ✅ Required
```

---

## 10. Related Files Reference

### Core Webhook System

- `/src/app/api/webhooks/vapi/route.ts` - Main webhook handler (489 lines)
- `/src/app/api/webhooks/execute-call/route.ts` - QStash execution handler (185 lines)
- `/src/app/api/calls/schedule/route.ts` - Schedule API endpoint (279 lines)

### VAPI SDK Integration

- `/src/lib/vapi/client.ts` - VAPI SDK wrapper (264 lines)

### Supporting Infrastructure

- `/src/lib/qstash/client.ts` - QStash scheduling client
- `/src/lib/supabase/server.ts` - Supabase client setup
- `/src/lib/utils/business-hours.ts` - Time validation utilities

### Documentation

- `/VAPI_WEBHOOK_FIXES.md` - Previous fixes and migration notes
- `/VAPI_DYNAMIC_VARIABLES_ISSUE.md` - Dynamic variables debugging guide

---

## 11. Conclusion

The VAPI webhook system is **functionally operational** but requires **immediate security hardening** and **feature completion** for production readiness.

### Current Grade: B- (Good, but needs work)

**Strengths**:

- ✅ Core functionality working
- ✅ Retry logic implemented
- ✅ Dynamic variables properly flowing
- ✅ Comprehensive logging
- ✅ Proper error handling

**Critical Issues**:

- ❌ Webhook signature verification disabled
- ❌ Missing interactive event handlers
- ⚠️ Unused database columns

### Next Steps Priority Order

1. **Day 1**: Enable webhook signature verification (2 hours)
2. **Week 1**: Implement assistant-request handler (8 hours)
3. **Week 2**: Implement function-call handler (8 hours)
4. **Week 3**: Add real-time monitoring (16 hours)
5. **Week 4**: Database cleanup and documentation (8 hours)

**Total Estimated Effort**: ~42 hours over 4 weeks

---

## Appendix A: Vercel Logs Analysis Request

**Note**: The user mentioned providing Vercel logs but the image was not accessible in this session.

To complete the log analysis, please provide:

1. Screenshot or text export of recent Vercel logs
2. Specific errors or warnings observed
3. Timestamps of problematic webhook calls
4. VAPI dashboard logs for the same timeframe

With these logs, we can:

- Identify any webhook delivery failures
- Detect signature verification issues
- Trace dynamic variable propagation
- Diagnose any database update failures

---

## Appendix B: Database Schema Verification Query

Run this query in Supabase SQL Editor to verify schema:

```sql
-- Get column information for vapi_calls table
SELECT
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'vapi_calls'
ORDER BY ordinal_position;

-- Check for indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'vapi_calls';

-- Sample data from recent calls
SELECT
  id,
  status,
  vapi_call_id,
  customer_phone,
  dynamic_variables,
  metadata,
  created_at,
  started_at,
  ended_at
FROM vapi_calls
ORDER BY created_at DESC
LIMIT 5;
```

---

**Report Generated**: 2025-11-12
**Next Review**: After Phase 1 completion
**Contact**: Multi-Agent Coordinator
