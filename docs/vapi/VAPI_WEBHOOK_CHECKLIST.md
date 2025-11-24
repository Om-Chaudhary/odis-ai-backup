# VAPI Webhook Implementation Checklist

Quick reference checklist for implementing fixes and enhancements.

---

## Phase 1: Security Hardening (CRITICAL - Do Today)

### 1. Enable Webhook Signature Verification

- [ ] **File**: `/src/app/api/webhooks/vapi/route.ts`
- [ ] Uncomment lines 175-179 (signature verification code)
- [ ] Verify `verifySignature()` function is present (lines 44-92)
- [ ] Verify `timingSafeEqual()` function is present (lines 97-108)

### 2. Set Environment Variable

- [ ] Log into Vercel dashboard
- [ ] Navigate to project settings → Environment Variables
- [ ] Add `VAPI_WEBHOOK_SECRET` with value from VAPI dashboard
- [ ] Redeploy application

### 3. Configure VAPI Dashboard

- [ ] Log into https://dashboard.vapi.ai
- [ ] Navigate to Settings → Webhooks
- [ ] Set webhook URL: `https://odisai.net/api/webhooks/vapi`
- [ ] Enable signature verification:
  - [ ] Algorithm: SHA-256
  - [ ] Secret: Same as `VAPI_WEBHOOK_SECRET`
  - [ ] Header name: `x-vapi-signature`
- [ ] Enable events: `status-update`, `end-of-call-report`, `hang`

### 4. Test Signature Verification

- [ ] Test with valid signature (should return 200)
- [ ] Test with invalid signature (should return 401)
- [ ] Test without signature (should return 401)
- [ ] Check Vercel logs for verification attempts
- [ ] Verify webhook events still processing correctly

### 5. Monitor and Validate

- [ ] Set up alert for signature verification failures
- [ ] Monitor Vercel logs for 24 hours
- [ ] Test full call flow end-to-end
- [ ] Document any issues encountered

**Time Required**: 2 hours
**Assigned To**: **\*\***\_\_\_**\*\***
**Completed**: ☐ Date: **\*\***\_\_\_**\*\***

---

## Phase 2A: Implement assistant-request Handler (HIGH - Week 1)

### 1. Update Webhook Handler

- [ ] **File**: `/src/app/api/webhooks/vapi/route.ts`
- [ ] Add event handler in POST function (after line 201):
  ```typescript
  else if (message.type === "assistant-request") {
    return await handleAssistantRequest(supabase, message, request);
  }
  ```
- [ ] Update `VapiWebhookPayload` interface with new fields (line 28)
- [ ] Add `handleAssistantRequest()` function (before GET handler)

### 2. Implement Request Handlers

- [ ] Implement pet info query handler
- [ ] Implement clinic hours query handler
- [ ] Implement emergency instructions handler
- [ ] Add error handling for missing data
- [ ] Add comprehensive logging

### 3. Configure VAPI Assistant

- [ ] Log into VAPI dashboard
- [ ] Edit assistant configuration
- [ ] Add `serverUrl`: `https://odisai.net/api/webhooks/vapi`
- [ ] Add `serverUrlSecret`: Same as `VAPI_WEBHOOK_SECRET`
- [ ] Save and test

### 4. Test assistant-request

- [ ] Create test call with pet info request
- [ ] Verify data returned to VAPI
- [ ] Check database for call record
- [ ] Verify logs show request/response
- [ ] Test with missing call (should return 404)
- [ ] Test with missing data (should handle gracefully)

**Time Required**: 8 hours
**Assigned To**: **\*\***\_\_\_**\*\***
**Completed**: ☐ Date: **\*\***\_\_\_**\*\***

---

## Phase 2B: Implement function-call Handler (HIGH - Week 2)

### 1. Update Webhook Handler

- [ ] **File**: `/src/app/api/webhooks/vapi/route.ts`
- [ ] Add event handler in POST function (after assistant-request):
  ```typescript
  else if (message.type === "function-call") {
    return await handleFunctionCall(supabase, message, request);
  }
  ```
- [ ] Add `handleFunctionCall()` function
- [ ] Implement function execution switch case

### 2. Implement Function Executors

- [ ] Implement `executeSendSMS()` function
  - [ ] Integrate with SMS provider (Twilio)
  - [ ] Add error handling
  - [ ] Add logging
- [ ] Implement `executeScheduleAppointment()` function
  - [ ] Create appointments table if needed
  - [ ] Add database insert logic
  - [ ] Add error handling
- [ ] Implement `executeSendEmail()` function
  - [ ] Integrate with email provider (SendGrid)
  - [ ] Add error handling
  - [ ] Add logging
- [ ] Implement `executeLogCallback()` function
  - [ ] Create callback_requests table if needed
  - [ ] Add database insert logic
  - [ ] Add error handling

### 3. Configure VAPI Assistant Functions

- [ ] Log into VAPI dashboard
- [ ] Edit assistant → Model → Functions
- [ ] Add `send_sms` function definition
- [ ] Add `schedule_appointment` function definition
- [ ] Add `send_email` function definition
- [ ] Add `log_callback_request` function definition
- [ ] Save and test

### 4. Create Database Tables

- [ ] Create `appointments` table (if needed)
- [ ] Create `callback_requests` table (if needed)
- [ ] Add indexes for performance
- [ ] Update TypeScript types
- [ ] Run migration

### 5. Test function-call

- [ ] Test send_sms function
- [ ] Test schedule_appointment function
- [ ] Test send_email function
- [ ] Test log_callback_request function
- [ ] Verify database records created
- [ ] Check logs for execution traces
- [ ] Test error scenarios

**Time Required**: 8 hours
**Assigned To**: **\*\***\_\_\_**\*\***
**Completed**: ☐ Date: **\*\***\_\_\_**\*\***

---

## Phase 3: Database Cleanup (MEDIUM - Week 3)

### 1. Audit Unused Columns

- [ ] Check `condition_category` usage across codebase
- [ ] Check `knowledge_base_used` usage across codebase
- [ ] Decide: Remove or implement population logic
- [ ] Document decision in architecture docs

### 2. Create Migration (if removing columns)

- [ ] Create migration file:
  ```bash
  pnpm supabase migration new remove_unused_vapi_columns
  ```
- [ ] Add SQL to drop columns:
  ```sql
  ALTER TABLE vapi_calls
  DROP COLUMN IF EXISTS condition_category,
  DROP COLUMN IF EXISTS knowledge_base_used;
  ```
- [ ] Test migration locally

### 3. Update TypeScript Types

- [ ] **File**: Check Supabase types file
- [ ] Remove unused column types
- [ ] Update any interfaces referencing these columns
- [ ] Fix TypeScript errors

### 4. Deploy Migration

- [ ] Review migration SQL
- [ ] Deploy to staging (if available)
- [ ] Test thoroughly
- [ ] Deploy to production
- [ ] Verify no errors

### 5. Update Documentation

- [ ] Update schema documentation
- [ ] Update API documentation
- [ ] Update TypeScript type docs
- [ ] Update CLAUDE.md if needed

**Time Required**: 4 hours
**Assigned To**: **\*\***\_\_\_**\*\***
**Completed**: ☐ Date: **\*\***\_\_\_**\*\***

---

## Phase 4: Real-time Monitoring (OPTIONAL - Week 4)

### 1. Create Database Table

- [ ] Create migration:
  ```bash
  pnpm supabase migration new add_call_transcripts_live_table
  ```
- [ ] Add SQL from implementation guide
- [ ] Test migration locally
- [ ] Deploy to production

### 2. Implement speech-update Handler

- [ ] **File**: `/src/app/api/webhooks/vapi/route.ts`
- [ ] Add event handler in POST function:
  ```typescript
  else if (message.type === "speech-update") {
    await handleSpeechUpdate(supabase, message);
  }
  ```
- [ ] Implement `handleSpeechUpdate()` function
- [ ] Add database insert for live transcripts
- [ ] Add error handling and logging

### 3. Configure VAPI Dashboard

- [ ] Enable `speech-update` event in webhook settings
- [ ] Test event delivery
- [ ] Monitor logs for speech updates

### 4. Build Admin UI (Optional)

- [ ] Create real-time monitoring page
- [ ] Implement WebSocket or Server-Sent Events
- [ ] Add live transcript display
- [ ] Add call status indicators
- [ ] Test with multiple concurrent calls

### 5. Test Real-time Features

- [ ] Start test call
- [ ] Verify transcripts appearing in database
- [ ] Check admin UI updates in real-time
- [ ] Test with multiple calls
- [ ] Monitor performance impact

**Time Required**: 16 hours
**Assigned To**: **\*\***\_\_\_**\*\***
**Completed**: ☐ Date: **\*\***\_\_\_**\*\***

---

## Testing Checklist

### Security Testing

- [ ] Valid signature accepted (200 OK)
- [ ] Invalid signature rejected (401 Unauthorized)
- [ ] No signature rejected (401 Unauthorized)
- [ ] Logs show verification attempts
- [ ] No performance degradation

### Event Handler Testing

- [ ] status-update handler working
- [ ] end-of-call-report handler working
- [ ] hang handler working
- [ ] assistant-request handler working (if implemented)
- [ ] function-call handler working (if implemented)
- [ ] speech-update handler working (if implemented)

### Database Testing

- [ ] All columns properly populated
- [ ] JSONB columns storing correct data
- [ ] Foreign keys working
- [ ] Indexes improving query performance
- [ ] No unused columns remaining

### Integration Testing

- [ ] Schedule call → Execute call → Webhook → Database
- [ ] Dynamic variables flowing correctly
- [ ] Retry logic working for failed calls
- [ ] QStash scheduling working
- [ ] VAPI API calls successful

### Performance Testing

- [ ] Webhook processing < 500ms
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Handles concurrent webhooks
- [ ] Logs not excessive

---

## Deployment Checklist

### Pre-deployment

- [ ] Code reviewed by team
- [ ] Tests passing locally
- [ ] TypeScript compilation successful
- [ ] ESLint warnings resolved
- [ ] Documentation updated

### Deployment Steps

1. [ ] Create feature branch
2. [ ] Make code changes
3. [ ] Test locally
4. [ ] Commit and push
5. [ ] Create pull request
6. [ ] Code review
7. [ ] Merge to main
8. [ ] Verify auto-deploy to Vercel
9. [ ] Check deployment logs
10. [ ] Smoke test production

### Post-deployment

- [ ] Monitor Vercel logs for 1 hour
- [ ] Test webhook events
- [ ] Verify database updates
- [ ] Check error rates
- [ ] Validate metrics

### Rollback Plan

If issues occur:

1. [ ] Identify the issue
2. [ ] Check severity
3. [ ] Decide: Fix forward or rollback
4. [ ] If rollback:
   - [ ] `git revert HEAD`
   - [ ] `git push origin main`
   - [ ] Monitor deployment
   - [ ] Verify rollback successful
5. [ ] Document incident
6. [ ] Create post-mortem

---

## Monitoring Checklist

### Alerts to Set Up

- [ ] Webhook signature verification failures
- [ ] Webhook processing errors
- [ ] Database insert failures
- [ ] VAPI API call failures
- [ ] QStash scheduling failures
- [ ] Retry exhaustion
- [ ] Abnormal call volumes

### Metrics to Track

- [ ] Webhook events per hour
- [ ] Processing time per event
- [ ] Error rate by event type
- [ ] Signature verification success rate
- [ ] Database query performance
- [ ] VAPI API response times
- [ ] Retry success rate

### Logs to Monitor

- [ ] `[VAPI_WEBHOOK]` - Webhook events
- [ ] `[EXECUTE_CALL]` - Call execution
- [ ] `[SCHEDULE_CALL]` - Call scheduling
- [ ] `[VAPI_CLIENT]` - VAPI API calls
- [ ] `[FUNCTION]` - Function executions

---

## Documentation Checklist

### Files to Update

- [ ] `/CLAUDE.md` - Project documentation
- [ ] `/README.md` - If webhook info needed
- [ ] `/docs/VAPI_MIGRATION.md` - Migration guide
- [ ] API documentation
- [ ] Architecture diagrams

### Documentation to Create

- [ ] Webhook troubleshooting guide
- [ ] Operations runbook
- [ ] Incident response procedures
- [ ] Testing procedures
- [ ] Configuration guide

---

## Sign-off

### Phase 1: Security

**Completed By**: **\*\***\_\_\_**\*\*** **Date**: **\*\***\_\_\_**\*\***
**Verified By**: **\*\***\_\_\_**\*\*** **Date**: **\*\***\_\_\_**\*\***

### Phase 2A: assistant-request

**Completed By**: **\*\***\_\_\_**\*\*** **Date**: **\*\***\_\_\_**\*\***
**Verified By**: **\*\***\_\_\_**\*\*** **Date**: **\*\***\_\_\_**\*\***

### Phase 2B: function-call

**Completed By**: **\*\***\_\_\_**\*\*** **Date**: **\*\***\_\_\_**\*\***
**Verified By**: **\*\***\_\_\_**\*\*** **Date**: **\*\***\_\_\_**\*\***

### Phase 3: Database Cleanup

**Completed By**: **\*\***\_\_\_**\*\*** **Date**: **\*\***\_\_\_**\*\***
**Verified By**: **\*\***\_\_\_**\*\*** **Date**: **\*\***\_\_\_**\*\***

### Phase 4: Real-time Monitoring

**Completed By**: **\*\***\_\_\_**\*\*** **Date**: **\*\***\_\_\_**\*\***
**Verified By**: **\*\***\_\_\_**\*\*** **Date**: **\*\***\_\_\_**\*\***

---

**Last Updated**: 2025-11-12
**Version**: 1.0
