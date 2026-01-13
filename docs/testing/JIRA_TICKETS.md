# Jira Tickets - Testing Infrastructure

> Ready-to-import tickets for testing engineer assignment.
> Copy each ticket section into Jira.

---

## Epic: Testing Infrastructure Overhaul

**Description:** Comprehensive testing coverage for ODIS AI critical paths, API endpoints, and business logic. Covers cleanup of existing tests, creation of 34 new test files, and achievement of 70%+ coverage on critical components.

**Labels:** `testing`, `infrastructure`, `quality`

---

## Story: Cleanup Existing Tests

### CLEANUP-001: Fix phone-formatting.test.ts

**Type:** Task
**Priority:** Highest
**Story Points:** 1
**Labels:** `cleanup`, `testing`

**Description:**
The phone-formatting.test.ts file contains ~30% placeholder/TODO tests and is marked as a "practice test file to learn Vitest". Clean up this file before building new tests.

**File:** `libs/shared/util/src/__tests__/phone-formatting.test.ts`

**Acceptance Criteria:**

- [ ] Remove empty test bodies (lines 56, 66, 76, 88-99)
- [ ] Remove no-op placeholder tests (lines 103-106, 122-126, 139-142)
- [ ] Complete or delete TODO tests (lines 251-258, 273-326, 334-357, 400-413)
- [ ] Remove "learning file" comments from file header
- [ ] All remaining tests pass: `nx test shared-util`
- [ ] No `it.todo()` or empty `it()` blocks remain

---

### CLEANUP-002: Review discharge-batch-stagger.test.ts

**Type:** Task
**Priority:** High
**Story Points:** 1
**Labels:** `cleanup`, `testing`

**Description:**
This test file only verifies simple arithmetic (index × 20 × 1000), not actual business logic from DischargeBatchProcessor. Determine if it provides value or should be deleted/consolidated.

**File:** `libs/domain/discharge/data-access/src/__tests__/discharge-batch-stagger.test.ts`

**Acceptance Criteria:**

- [ ] Compare test math with actual `DischargeBatchProcessor` implementation
- [ ] If redundant: delete file entirely
- [ ] If valid: rename to clarify purpose, add reference to source implementation
- [ ] Document decision in PR description

---

### CLEANUP-003: Fix auth.test.ts Redirect Pattern

**Type:** Task
**Priority:** Medium
**Story Points:** 1
**Labels:** `cleanup`, `testing`

**Description:**
The auth.test.ts file uses a fragile NEXT_REDIRECT error throwing pattern for testing server action redirects. Update to use more robust patterns.

**File:** `apps/web/src/server/actions/__tests__/auth.test.ts`

**Acceptance Criteria:**

- [ ] Research Next.js 15 testing utilities for server actions
- [ ] Update redirect testing to use recommended patterns
- [ ] All existing test scenarios still covered
- [ ] Tests pass: `nx test web`

---

## Story: Critical Path Testing (Tier 1)

### TIER1-001: Test DischargeOrchestrator

**Type:** Story
**Priority:** Highest
**Story Points:** 8
**Labels:** `testing`, `critical`, `tier-1`

**Description:**
Create comprehensive unit tests for DischargeOrchestrator - the core workflow engine for all discharge calls and emails. Currently has 0% test coverage despite being mission-critical.

**New File:** `libs/domain/discharge/data-access/src/__tests__/discharge-orchestrator.test.ts`

**Test Scenarios to Cover:**

**Sequential Execution Mode:**

- executes steps in correct order
- respects step dependencies
- handles step failure gracefully
- skips dependent steps on failure
- collects timing metrics accurately
- builds correct result object

**Parallel Execution Mode:**

- runs independent steps concurrently
- handles stopOnError=true correctly
- handles stopOnError=false correctly
- manages Promise.allSettled results
- correctly identifies parallel batches
- skips dependents when parent fails

**Edge Cases:**

- empty step list
- single step execution
- circular dependency detection
- all steps fail
- timeout handling

**Dependencies to Mock:**

- CasesRepository
- CallRepository
- EmailRepository
- QStash scheduler
- VAPI client

**Acceptance Criteria:**

- [ ] Test file created at specified path
- [ ] 90%+ line coverage on discharge-orchestrator.ts
- [ ] All execution modes tested (sequential, parallel)
- [ ] Error propagation verified
- [ ] Timing metrics validated
- [ ] Tests pass: `nx test domain-discharge-data-access`

---

### TIER1-002: Test CallExecutor

**Type:** Story
**Priority:** Highest
**Story Points:** 5
**Labels:** `testing`, `critical`, `tier-1`

**Description:**
Create unit tests for CallExecutor which handles variable enrichment for VAPI calls. Critical because stale data means wrong pet/owner names spoken during calls.

**New File:** `libs/domain/discharge/data-access/src/__tests__/call-executor.test.ts`

**Test Scenarios to Cover:**

**enrichCallVariables():**

- merges stored variables with fresh case data
- prioritizes most recent values
- handles missing stored variables
- handles missing case data
- preserves all required VAPI fields
- transforms data types correctly

**executeCall():**

- creates VAPI call with correct config
- handles VAPI API errors
- updates call status on success
- updates call status on failure
- logs appropriate audit trail
- handles timeout scenarios

**Acceptance Criteria:**

- [ ] Test file created at specified path
- [ ] 85%+ coverage on call-executor.ts
- [ ] Variable merging logic fully tested
- [ ] VAPI client mocked and verified
- [ ] Tests pass: `nx test domain-discharge-data-access`

---

### TIER1-003: Test CasesService.ingest()

**Type:** Story
**Priority:** Highest
**Story Points:** 8
**Labels:** `testing`, `critical`, `tier-1`

**Description:**
Create tests for CasesService.ingest() - the main data entry point for all case data. Corrupted ingestion breaks the entire discharge flow.

**New File:** `libs/domain/cases/data-access/src/__tests__/cases-service.test.ts`

**Test Scenarios to Cover:**

**ingest() - Text Input Path:**

- extracts entities from raw text
- handles AI extraction failure with fallback
- maps IDEXX fields correctly
- creates case record in database
- triggers auto-scheduling when enabled
- handles euthanasia detection

**ingest() - Structured Input Path:**

- accepts pre-structured data
- validates against schema
- merges with existing case data
- detects duplicate cases
- handles partial data gracefully

**Entity Extraction:**

- extractEntitiesWithRetry success
- extractEntitiesWithRetry failure + fallback
- mapIdexxToEntities transformation
- entity enrichment from patient data

**Error Handling:**

- invalid input schema
- database write failure
- AI service unavailable
- duplicate case detection

**Dependencies to Mock:**

- CasesRepository
- LlamaIndex AI extraction
- IDEXX transformer
- QStash scheduler

**Acceptance Criteria:**

- [ ] Test file created at specified path
- [ ] 85%+ coverage on cases-service.ts
- [ ] Both input paths (text/structured) tested
- [ ] Error scenarios covered
- [ ] Tests pass: `nx test domain-cases-data-access`

---

### TIER1-004: Test VAPI Webhook Handlers

**Type:** Story
**Priority:** Highest
**Story Points:** 10
**Labels:** `testing`, `critical`, `tier-1`

**Description:**
Create tests for all VAPI webhook handlers. These process all call events - missing events means lost data and broken analytics.

**New File:** `libs/integrations/vapi/src/__tests__/webhooks/handlers.test.ts`

**Handlers to Test:**

**end-of-call-report.ts:**

- parses report payload correctly
- extracts call outcome
- updates call record with duration
- stores transcript
- handles missing fields
- idempotency (duplicate webhook)

**function-call.ts:**

- routes to correct tool handler
- returns tool response to VAPI
- handles unknown function
- logs function execution

**tool-calls.ts:**

- processes multiple tools in sequence
- handles partial tool success
- returns aggregated results

**status-update.ts:**

- updates call status in DB
- handles all status types
- triggers appropriate side effects
- handles out-of-order updates

**conversation-update.ts:**

- appends to conversation log
- handles speaker identification
- processes interim results

**transfer-update.ts:**

- handles successful transfer
- handles failed transfer
- updates transfer destination

**Acceptance Criteria:**

- [ ] All 6 webhook handlers tested
- [ ] Signature verification tested
- [ ] Idempotency verified
- [ ] Error recovery tested
- [ ] Tests pass: `nx test integrations-vapi`

---

### TIER1-005: Test Repository CRUD Operations

**Type:** Story
**Priority:** Highest
**Story Points:** 5
**Labels:** `testing`, `critical`, `tier-1`

**Description:**
Create tests for CallRepository and EmailRepository CRUD operations. These are the data access layer for all call and email scheduling.

**New Files:**

- `libs/data-access/repository-impl/src/__tests__/call-repository.test.ts`
- `libs/data-access/repository-impl/src/__tests__/email-repository.test.ts`

**CallRepository Tests:**

- createScheduledCall() - creates with all fields
- createScheduledCall() - handles DB error
- updateCallStatus() - valid transitions
- updateCallStatus() - invalid transitions
- getCallById() - found
- getCallById() - not found
- getCallsInDateRange() - pagination
- cancelScheduledCall() - success
- cancelScheduledCall() - already executed

**EmailRepository Tests:**

- createScheduledEmail() - creates with template
- updateEmailStatus() - delivery tracking
- getEmailsForBatch() - batch retrieval
- markEmailAsSent() - success path
- trackDeliveryMetrics() - analytics

**Acceptance Criteria:**

- [ ] Both test files created
- [ ] 80%+ coverage on both repositories
- [ ] All CRUD operations tested
- [ ] Error handling verified
- [ ] Tests pass: `nx test data-access-repository-impl`

---

## Story: API Route Testing (Tier 2)

### TIER2-001a: Test VAPI Main Webhook Route

**Type:** Story
**Priority:** High
**Story Points:** 5
**Labels:** `testing`, `api`, `tier-2`

**Description:**
Create integration tests for the main VAPI webhook route handler.

**File to Test:** `apps/web/src/app/api/webhooks/vapi/route.ts`
**New Test File:** `apps/web/src/app/api/webhooks/vapi/__tests__/route.test.ts`

**Test Scenarios:**

- rejects invalid signature
- processes status-update event
- processes end-of-call-report event
- handles unknown event type gracefully
- returns 200 for duplicate webhooks (idempotent)
- handles malformed JSON payload
- logs webhook processing metrics

**Acceptance Criteria:**

- [ ] Test file created
- [ ] All scenarios covered
- [ ] Signature verification tested
- [ ] Tests pass: `nx test web`

---

### TIER2-001b: Test VAPI Backfill Webhook Route

**Type:** Story
**Priority:** High
**Story Points:** 2
**Labels:** `testing`, `api`, `tier-2`

**Description:**
Create tests for VAPI backfill outcome webhook.

**File to Test:** `apps/web/src/app/api/webhooks/vapi/backfill-outcome/route.ts`

**Acceptance Criteria:**

- [ ] Test file created
- [ ] Backfill logic tested
- [ ] Error handling tested
- [ ] Tests pass

---

### TIER2-001c: Test QStash Execute Call Webhook

**Type:** Story
**Priority:** High
**Story Points:** 3
**Labels:** `testing`, `api`, `tier-2`

**Description:**
Create tests for QStash execute call webhook.

**File to Test:** `apps/web/src/app/api/webhooks/execute-call/route.ts`

**Test Scenarios:**

- verifies QStash signature
- executes scheduled call
- handles call not found
- handles call already executed
- handles VAPI API failure
- returns appropriate status codes

**Acceptance Criteria:**

- [ ] Test file created
- [ ] QStash signature verification tested
- [ ] All error scenarios covered
- [ ] Tests pass

---

### TIER2-001d: Test QStash Execute Email Webhook

**Type:** Story
**Priority:** High
**Story Points:** 3
**Labels:** `testing`, `api`, `tier-2`

**Description:**
Create tests for QStash execute email webhook.

**File to Test:** `apps/web/src/app/api/webhooks/execute-discharge-email/route.ts`

**Acceptance Criteria:**

- [ ] Test file created
- [ ] Email execution logic tested
- [ ] Error handling tested
- [ ] Tests pass

---

### TIER2-002: Test Case Ingestion Route

**Type:** Story
**Priority:** High
**Story Points:** 5
**Labels:** `testing`, `api`, `tier-2`

**Description:**
Create integration tests for case ingestion API routes.

**Files to Test:**

- `apps/web/src/app/api/cases/ingest/route.ts`
- `apps/web/src/app/api/cases/find-by-patient/route.ts`

**Test Scenarios for POST /api/cases/ingest:**

- accepts IDEXX format data
- accepts legacy format data
- validates Bearer token auth
- validates cookie auth
- rejects invalid schema
- detects euthanasia cases
- handles duplicate ingestion
- returns case ID on success

**Test Scenarios for DELETE /api/cases/ingest:**

- marks case as no-show
- requires valid case ID
- requires authentication

**Acceptance Criteria:**

- [ ] Test files created
- [ ] Both auth methods tested
- [ ] Schema validation tested
- [ ] Tests pass

---

### TIER2-003a: Test Check Availability Tool

**Type:** Story
**Priority:** High
**Story Points:** 5
**Labels:** `testing`, `api`, `vapi-tool`, `tier-2`

**Description:**
Create tests for VAPI check-availability tool endpoint.

**File to Test:** `apps/web/src/app/api/vapi/tools/check-availability/route.ts`

**Test Scenarios:**

- parses VAPI tool call format correctly
- returns available slots for valid date
- handles timezone conversion
- returns empty for no availability
- handles invalid date format
- handles past date rejection
- returns VAPI-formatted response

**Acceptance Criteria:**

- [ ] Test file created
- [ ] Timezone handling verified
- [ ] VAPI response format validated
- [ ] Tests pass

---

### TIER2-003b: Test Check Availability Range Tool

**Type:** Story
**Priority:** High
**Story Points:** 3
**Labels:** `testing`, `api`, `vapi-tool`, `tier-2`

**Description:**
Create tests for VAPI check-availability-range tool endpoint.

**File to Test:** `apps/web/src/app/api/vapi/tools/check-availability-range/route.ts`

**Acceptance Criteria:**

- [ ] Test file created
- [ ] Multi-day range queries tested
- [ ] Tests pass

---

### TIER2-003c: Test Book Appointment Tool

**Type:** Story
**Priority:** High
**Story Points:** 8
**Labels:** `testing`, `api`, `vapi-tool`, `tier-2`

**Description:**
Create comprehensive tests for the book-appointment VAPI tool - the most complex tool endpoint.

**File to Test:** `apps/web/src/app/api/vapi/tools/book-appointment/route.ts`

**Test Scenarios:**

- parses VAPI tool call format
- extracts date/time from various formats ("tomorrow at 2pm", "January 15th")
- checks slot availability before booking
- creates 5-minute hold on slot
- confirms booking atomically
- handles timezone correctly (clinic timezone)
- rejects past dates
- handles slot already taken (race condition)
- handles concurrent booking attempts
- returns VAPI-formatted success response
- returns VAPI-formatted error response

**Acceptance Criteria:**

- [ ] Test file created
- [ ] All date parsing formats tested
- [ ] Atomic booking verified
- [ ] Race condition handling tested
- [ ] Tests pass

---

### TIER2-004a: Test Dashboard tRPC Router

**Type:** Story
**Priority:** High
**Story Points:** 5
**Labels:** `testing`, `trpc`, `tier-2`

**Description:**
Create tests for all 14 dashboard tRPC procedures.

**Router:** `apps/web/src/server/api/routers/dashboard/`

**Procedures to Test:**

- getOverview
- getLastActivity
- getStats
- getCaseStats
- getRecentActivity
- getDailyActivityAggregates
- getWeeklyActivity
- getEmailPerformance
- getCallPerformance
- getUpcomingScheduled
- getCasesNeedingAttention
- getAllCases
- getCallHistory
- getEmailHistory

**Acceptance Criteria:**

- [ ] All 14 procedures tested
- [ ] Authentication enforced
- [ ] Multi-clinic support tested
- [ ] Timezone handling tested
- [ ] Tests pass

---

### TIER2-004b: Test Cases tRPC Router

**Type:** Story
**Priority:** High
**Story Points:** 5
**Labels:** `testing`, `trpc`, `tier-2`

**Description:**
Create tests for all 13 cases tRPC procedures.

**Router:** `apps/web/src/server/api/routers/cases/`

**Acceptance Criteria:**

- [ ] All procedures tested
- [ ] CRUD operations verified
- [ ] Batch operations tested
- [ ] Tests pass

---

### TIER2-004c: Test Outbound tRPC Router

**Type:** Story
**Priority:** High
**Story Points:** 5
**Labels:** `testing`, `trpc`, `tier-2`

**Description:**
Create tests for all 12 outbound tRPC procedures.

**Router:** `apps/web/src/server/api/routers/outbound/`

**Critical Procedures:**

- approveAndSchedule (VAPI integration)
- scheduleRemainingOutreach (batch operation)
- batchSchedule / batchCancel

**Acceptance Criteria:**

- [ ] All procedures tested
- [ ] External service mocking verified
- [ ] Tests pass

---

### TIER2-004d: Test Inbound tRPC Router

**Type:** Story
**Priority:** High
**Story Points:** 3
**Labels:** `testing`, `trpc`, `tier-2`

**Description:**
Create tests for all 6 inbound tRPC procedures.

**Router:** `apps/web/src/server/api/routers/inbound/`

**Acceptance Criteria:**

- [ ] All procedures tested
- [ ] Appointment management verified
- [ ] Tests pass

---

### TIER2-004e: Test Admin tRPC Router

**Type:** Story
**Priority:** High
**Story Points:** 3
**Labels:** `testing`, `trpc`, `tier-2`

**Description:**
Create tests for all 5 admin tRPC procedures with strict role enforcement.

**Router:** `apps/web/src/server/api/routers/admin/`

**Critical Tests:**

- Admin middleware enforcement
- Role-based access control
- getClinicScheduledItems (multi-user)
- triggerImmediateExecution

**Acceptance Criteria:**

- [ ] All procedures tested
- [ ] Admin-only access enforced
- [ ] Non-admin rejection tested
- [ ] Tests pass

---

## Story: Integration Testing (Tier 3)

### TIER3-001: Test IDEXX Integration

**Type:** Story
**Priority:** Medium
**Story Points:** 5
**Labels:** `testing`, `integration`, `tier-3`

**Description:**
Create tests for IDEXX credential management and data transformation.

**New Files:**

- `libs/integrations/idexx/src/__tests__/credential-manager.test.ts`
- `libs/integrations/idexx/src/__tests__/transformer.test.ts`

**Credential Manager Tests:**

- storeCredentials() - encrypts with AES-256-GCM
- retrieveCredentials() - decrypts correctly
- validateCredentials() - tests against IDEXX API (mocked)
- handles special characters in password
- handles corrupted data gracefully

**Transformer Tests:**

- transformIdexxToEntities() - full data mapping
- handles missing fields
- handles unexpected field types
- preserves all required data

**Acceptance Criteria:**

- [ ] Both test files created
- [ ] Encryption round-trip verified
- [ ] Data mapping completeness tested
- [ ] Tests pass

---

### TIER3-002: Expand QStash Integration Tests

**Type:** Story
**Priority:** Medium
**Story Points:** 3
**Labels:** `testing`, `integration`, `tier-3`

**Description:**
Expand existing QStash tests with retry logic and edge cases.

**File:** `libs/integrations/qstash/src/__tests__/client.test.ts`

**Additional Scenarios:**

- retries on transient failure
- respects backoff configuration
- cancels pending job correctly
- handles already-executed job
- handles very large payload
- handles scheduling at exact midnight

**Acceptance Criteria:**

- [ ] Additional scenarios added
- [ ] Retry logic verified
- [ ] Edge cases covered
- [ ] Tests pass

---

### TIER3-003: Test Discharge Batch Processor

**Type:** Story
**Priority:** Medium
**Story Points:** 8
**Labels:** `testing`, `integration`, `tier-3`

**Description:**
Create comprehensive tests for DischargeBatchProcessor including chunk processing and stagger calculation integration.

**New File:** `libs/domain/discharge/data-access/src/__tests__/discharge-batch-processor.test.ts`

**Test Scenarios:**

- processes 10-item chunks correctly
- applies email stagger (index × 20s)
- applies call stagger (index × 2min)
- handles chunk boundary correctly (case 10 vs 11)
- aggregates results across chunks
- handles partial chunk failure
- respects business hours for calls

**Acceptance Criteria:**

- [ ] Test file created
- [ ] Chunking verified
- [ ] Stagger calculation tested across boundaries
- [ ] Tests pass

---

## Story: Coverage Expansion (Tier 4)

### TIER4-001: Test Shared Utilities

**Type:** Story
**Priority:** Low
**Story Points:** 3
**Labels:** `testing`, `coverage`, `tier-4`

**Description:**
Add tests for remaining shared utility functions.

**Files to Test:**

- `libs/shared/util/src/transforms.ts`
- `libs/shared/util/src/dates.ts`
- `libs/shared/util/src/strings.ts`

**Acceptance Criteria:**

- [ ] Test files created
- [ ] 80%+ coverage achieved
- [ ] Tests pass

---

### TIER4-002: Test Email Generator

**Type:** Story
**Priority:** Low
**Story Points:** 3
**Labels:** `testing`, `coverage`, `tier-4`

**Description:**
Create tests for email content generation.

**New File:** `libs/domain/discharge/data-access/src/__tests__/email-generator.test.ts`

**Acceptance Criteria:**

- [ ] Test file created
- [ ] Template rendering tested
- [ ] Variable substitution tested
- [ ] Tests pass

---

### TIER4-003: Test Entity Utilities

**Type:** Story
**Priority:** Low
**Story Points:** 3
**Labels:** `testing`, `coverage`, `tier-4`

**Description:**
Create tests for entity manipulation utilities.

**New File:** `libs/domain/cases/data-access/src/__tests__/entity-utils.test.ts`

**Acceptance Criteria:**

- [ ] Test file created
- [ ] Entity merging tested
- [ ] Entity enrichment tested
- [ ] Tests pass

---

## Labels Reference

| Label         | Description                    |
| ------------- | ------------------------------ |
| `testing`     | All testing-related work       |
| `cleanup`     | Fixing/removing existing tests |
| `critical`    | Blocks production confidence   |
| `tier-1`      | Highest priority tier          |
| `tier-2`      | High priority tier             |
| `tier-3`      | Medium priority tier           |
| `tier-4`      | Low priority tier              |
| `api`         | API route testing              |
| `trpc`        | tRPC procedure testing         |
| `integration` | Integration testing            |
| `vapi-tool`   | VAPI tool endpoint             |
| `coverage`    | Coverage expansion             |

---

## Sprint Planning Suggestion

**Sprint 1 (Week 1-2):** Cleanup + TIER1-001, TIER1-002
**Sprint 2 (Week 3-4):** TIER1-003, TIER1-004
**Sprint 3 (Week 5-6):** TIER1-005 + TIER2-001a through TIER2-001d
**Sprint 4 (Week 7-8):** TIER2-002, TIER2-003a through TIER2-003c
**Sprint 5 (Week 9-10):** TIER2-004a through TIER2-004e
**Sprint 6 (Week 11-12):** TIER3-_ and TIER4-_
