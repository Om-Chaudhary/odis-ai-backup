# Testing Engineer Onboarding Plan

> Comprehensive testing strategy and work assignment plan for ODIS AI monorepo.
> Generated: 2025-01-12

---

## Executive Summary

**Current State:**

- 18 test files (~8,258 lines of test code)
- 95+ untested API endpoints and tRPC procedures
- Critical business logic (DischargeOrchestrator, CasesService) has 0% test coverage
- Validators well-tested (95%+), everything else severely undertested

**Recommended Actions:**

1. Delete/fix 2 low-quality test files
2. Create 45+ new test files across 4 priority tiers
3. Target: 70% coverage on critical paths, 85% on business logic

**Estimated Work:** 150-200 Jira tickets across 8-12 weeks

---

## Part 1: Cleanup Tasks (Delete/Fix First)

### CLEANUP-001: Delete phone-formatting.test.ts TODO Tests

**Priority:** P0 - Do First
**Effort:** 2 hours
**File:** `libs/shared/util/src/__tests__/phone-formatting.test.ts`

**Issue:** File is marked as "practice test file to learn Vitest" with ~30% placeholder/TODO tests.

**Action Items:**

- [ ] Remove empty test bodies (lines 56, 66, 76, 88-99)
- [ ] Remove no-op placeholder tests (lines 103-106, 122-126, 139-142)
- [ ] Complete or delete TODO tests (lines 251-258, 273-326, 334-357, 400-413)
- [ ] Remove "learning file" comments
- [ ] Ensure remaining tests pass: `nx test shared-util`

---

### CLEANUP-002: Review discharge-batch-stagger.test.ts

**Priority:** P1
**Effort:** 1 hour
**File:** `libs/domain/discharge/data-access/src/__tests__/discharge-batch-stagger.test.ts`

**Issue:** Tests only verify simple arithmetic (index × 20 × 1000), not actual business logic.

**Action Items:**

- [ ] Verify if math matches actual `DischargeBatchProcessor` implementation
- [ ] If redundant, delete file
- [ ] If valid, rename to clarify purpose and add integration with actual processor

---

### CLEANUP-003: Audit auth.test.ts Redirect Pattern

**Priority:** P2
**Effort:** 2 hours
**File:** `apps/web/src/server/actions/__tests__/auth.test.ts`

**Issue:** Uses fragile NEXT_REDIRECT error throwing pattern for testing redirects.

**Action Items:**

- [ ] Research Next.js 15 testing utilities for server actions
- [ ] Update redirect testing to use more robust patterns
- [ ] Verify all auth flows still covered after refactor

---

## Part 2: Critical Path Testing (Tier 1 - P0)

These tests block production confidence. Must be completed first.

### TIER1-001: DischargeOrchestrator Unit Tests

**Priority:** P0 - Critical
**Effort:** 16 hours (2 days)
**New File:** `libs/domain/discharge/data-access/src/__tests__/discharge-orchestrator.test.ts`

**Why Critical:** Core workflow engine for all discharge calls/emails. Zero tests currently.

**Test Scenarios:**

```
Sequential Execution Mode
├── executes steps in correct order
├── respects step dependencies
├── handles step failure gracefully
├── skips dependent steps on failure
├── collects timing metrics accurately
└── builds correct result object

Parallel Execution Mode
├── runs independent steps concurrently
├── handles stopOnError=true correctly
├── handles stopOnError=false correctly
├── manages Promise.allSettled results
├── correctly identifies parallel batches
└── skips dependents when parent fails

Edge Cases
├── empty step list
├── single step execution
├── circular dependency detection
├── all steps fail
├── timeout handling
└── partial success scenarios
```

**Dependencies to Mock:**

- `CasesRepository` - case data retrieval
- `CallRepository` - call scheduling
- `EmailRepository` - email scheduling
- `QStash` - job scheduling
- `VAPI` - call creation

**Acceptance Criteria:**

- [ ] 90%+ line coverage on discharge-orchestrator.ts
- [ ] All execution modes tested (sequential, parallel)
- [ ] Error propagation verified
- [ ] Timing metrics validated

---

### TIER1-002: CallExecutor Unit Tests

**Priority:** P0 - Critical
**Effort:** 12 hours
**New File:** `libs/domain/discharge/data-access/src/__tests__/call-executor.test.ts`

**Why Critical:** Handles variable enrichment for VAPI calls. Stale data = wrong pet names spoken.

**Test Scenarios:**

```
enrichCallVariables()
├── merges stored variables with fresh case data
├── prioritizes most recent values
├── handles missing stored variables
├── handles missing case data
├── preserves all required VAPI fields
└── transforms data types correctly

executeCall()
├── creates VAPI call with correct config
├── handles VAPI API errors
├── updates call status on success
├── updates call status on failure
├── logs appropriate audit trail
└── handles timeout scenarios
```

**Acceptance Criteria:**

- [ ] 85%+ coverage on call-executor.ts
- [ ] Variable merging logic fully tested
- [ ] VAPI client mocked and verified

---

### TIER1-003: CasesService.ingest() Tests

**Priority:** P0 - Critical
**Effort:** 16 hours
**New File:** `libs/domain/cases/data-access/src/__tests__/cases-service.test.ts`

**Why Critical:** Main data entry point. Corrupted ingestion = broken discharge flow.

**Test Scenarios:**

```
ingest() - Text Input Path
├── extracts entities from raw text
├── handles AI extraction failure with fallback
├── maps IDEXX fields correctly
├── creates case record in database
├── triggers auto-scheduling when enabled
└── handles euthanasia detection

ingest() - Structured Input Path
├── accepts pre-structured data
├── validates against schema
├── merges with existing case data
├── detects duplicate cases
└── handles partial data gracefully

Entity Extraction
├── extractEntitiesWithRetry success
├── extractEntitiesWithRetry failure + fallback
├── mapIdexxToEntities transformation
├── entity enrichment from patient data
└── confidence scoring validation

Error Handling
├── invalid input schema
├── database write failure
├── AI service unavailable
├── duplicate case detection
└── missing required fields
```

**Dependencies to Mock:**

- `CasesRepository`
- `LlamaIndex` AI extraction
- `IDEXX transformer`
- `QStash scheduler`

**Acceptance Criteria:**

- [ ] 85%+ coverage on cases-service.ts
- [ ] Both input paths tested
- [ ] Error scenarios covered

---

### TIER1-004: VAPI Webhook Handler Tests

**Priority:** P0 - Critical
**Effort:** 20 hours (2.5 days)
**New File:** `libs/integrations/vapi/src/__tests__/webhooks/handlers.test.ts`

**Why Critical:** Processes all call events. Missing events = lost data, broken analytics.

**Test Scenarios per Handler:**

```
end-of-call-report.ts
├── parses report payload correctly
├── extracts call outcome
├── updates call record with duration
├── stores transcript
├── handles missing fields
└── idempotency (duplicate webhook)

function-call.ts
├── routes to correct tool handler
├── returns tool response to VAPI
├── handles unknown function
├── logs function execution
└── handles tool timeout

tool-calls.ts
├── processes multiple tools in sequence
├── handles partial tool success
├── returns aggregated results
└── handles tool execution errors

status-update.ts
├── updates call status in DB
├── handles all status types (ringing, in-progress, ended)
├── triggers appropriate side effects
└── handles out-of-order updates

conversation-update.ts
├── appends to conversation log
├── handles speaker identification
├── processes interim results
└── handles malformed updates

transfer-update.ts
├── handles successful transfer
├── handles failed transfer
├── updates transfer destination
└── logs transfer metrics
```

**Acceptance Criteria:**

- [ ] All 6 webhook handlers tested
- [ ] Signature verification tested
- [ ] Idempotency verified
- [ ] Error recovery tested

---

### TIER1-005: Repository CRUD Tests

**Priority:** P0 - Critical
**Effort:** 12 hours
**New Files:**

- `libs/data-access/repository-impl/src/__tests__/call-repository.test.ts`
- `libs/data-access/repository-impl/src/__tests__/email-repository.test.ts`

**Test Scenarios:**

```
CallRepository
├── createScheduledCall() - creates with all fields
├── createScheduledCall() - handles DB error
├── updateCallStatus() - valid transitions
├── updateCallStatus() - invalid transitions
├── getCallById() - found
├── getCallById() - not found
├── getCallsInDateRange() - pagination
├── cancelScheduledCall() - success
└── cancelScheduledCall() - already executed

EmailRepository
├── createScheduledEmail() - creates with template
├── updateEmailStatus() - delivery tracking
├── getEmailsForBatch() - batch retrieval
├── markEmailAsSent() - success path
└── trackDeliveryMetrics() - analytics
```

**Acceptance Criteria:**

- [ ] 80%+ coverage on both repositories
- [ ] All CRUD operations tested
- [ ] Error handling verified

---

## Part 3: API Route Testing (Tier 2 - P1)

### TIER2-001: Webhook Route Tests

**Priority:** P1 - High
**Effort:** 8 hours per webhook

**Webhooks to Test:**

| Webhook              | File                                                             | Effort | Ticket     |
| -------------------- | ---------------------------------------------------------------- | ------ | ---------- |
| VAPI Main            | `apps/web/src/app/api/webhooks/vapi/route.ts`                    | 8h     | TIER2-001a |
| VAPI Backfill        | `apps/web/src/app/api/webhooks/vapi/backfill-outcome/route.ts`   | 4h     | TIER2-001b |
| QStash Execute Call  | `apps/web/src/app/api/webhooks/execute-call/route.ts`            | 6h     | TIER2-001c |
| QStash Execute Email | `apps/web/src/app/api/webhooks/execute-discharge-email/route.ts` | 6h     | TIER2-001d |

**Test Pattern:**

```typescript
describe("POST /api/webhooks/vapi", () => {
  it("rejects invalid signature", async () => {});
  it("processes status-update event", async () => {});
  it("processes end-of-call-report event", async () => {});
  it("handles unknown event type gracefully", async () => {});
  it("returns 200 for duplicate webhooks (idempotent)", async () => {});
});
```

---

### TIER2-002: Case Management Route Tests

**Priority:** P1 - High
**Effort:** 12 hours
**New File:** `apps/web/src/app/api/cases/__tests__/ingest.test.ts`

**Endpoints:**

- POST `/api/cases/ingest` - Case ingestion
- DELETE `/api/cases/ingest` - No-show marking
- GET `/api/cases/find-by-patient` - Patient lookup

**Test Scenarios:**

```
POST /api/cases/ingest
├── accepts IDEXX format data
├── accepts legacy format data
├── validates Bearer token auth
├── validates cookie auth
├── rejects invalid schema
├── detects euthanasia cases
├── handles duplicate ingestion
└── returns case ID on success

DELETE /api/cases/ingest
├── marks case as no-show
├── requires valid case ID
├── requires authentication
└── handles non-existent case
```

---

### TIER2-003: VAPI Tool Endpoint Tests

**Priority:** P1 - High
**Effort:** 16 hours

**Tools to Test:**

| Tool                     | File                                                                | Complexity | Ticket     |
| ------------------------ | ------------------------------------------------------------------- | ---------- | ---------- |
| Check Availability       | `apps/web/src/app/api/vapi/tools/check-availability/route.ts`       | High       | TIER2-003a |
| Check Availability Range | `apps/web/src/app/api/vapi/tools/check-availability-range/route.ts` | High       | TIER2-003b |
| Book Appointment         | `apps/web/src/app/api/vapi/tools/book-appointment/route.ts`         | Very High  | TIER2-003c |

**Book Appointment Test Scenarios:**

```
POST /api/vapi/tools/book-appointment
├── parses VAPI tool call format
├── extracts date/time from various formats
├── checks slot availability
├── creates 5-minute hold
├── confirms booking atomically
├── handles timezone correctly
├── rejects past dates
├── handles slot already taken
└── returns VAPI-formatted response
```

---

### TIER2-004: tRPC Router Tests

**Priority:** P1 - High
**Effort:** 40 hours (1 week)

**Routers to Test:**

| Router    | Procedures    | Effort | Ticket     |
| --------- | ------------- | ------ | ---------- |
| Dashboard | 14 procedures | 12h    | TIER2-004a |
| Cases     | 13 procedures | 12h    | TIER2-004b |
| Outbound  | 12 procedures | 10h    | TIER2-004c |
| Inbound   | 6 procedures  | 6h     | TIER2-004d |
| Admin     | 5 procedures  | 8h     | TIER2-004e |

**Test Pattern for tRPC:**

```typescript
describe("dashboard.getStats", () => {
  it("returns stats for authenticated user", async () => {
    const caller = createCaller({ user: mockUser, db: mockDb });
    const result = await caller.dashboard.getStats({ clinicId: "clinic-1" });
    expect(result).toMatchObject({
      totalCases: expect.any(Number),
      completedCalls: expect.any(Number),
    });
  });

  it("throws UNAUTHORIZED for unauthenticated request", async () => {
    const caller = createCaller({ user: null });
    await expect(caller.dashboard.getStats({})).rejects.toThrow("UNAUTHORIZED");
  });

  it("handles multi-clinic user correctly", async () => {});
  it("applies date range filter", async () => {});
  it("handles timezone correctly", async () => {});
});
```

---

## Part 4: Integration Testing (Tier 3 - P2)

### TIER3-001: IDEXX Integration Tests

**Priority:** P2 - Medium
**Effort:** 12 hours
**New Files:**

- `libs/integrations/idexx/src/__tests__/credential-manager.test.ts`
- `libs/integrations/idexx/src/__tests__/transformer.test.ts`

**Credential Manager Tests:**

```
storeCredentials()
├── encrypts with AES-256-GCM
├── stores IV and auth tag
├── handles special characters in password
└── rejects weak credentials

retrieveCredentials()
├── decrypts correctly
├── handles missing credentials
├── handles corrupted data
└── validates decrypted format

validateCredentials()
├── tests against IDEXX API (mocked)
├── handles invalid credentials
├── handles API timeout
└── logs validation attempts
```

---

### TIER3-002: QStash Integration Tests

**Priority:** P2 - Medium
**Effort:** 8 hours
**Expand:** `libs/integrations/qstash/src/__tests__/client.test.ts`

**Additional Scenarios:**

```
Retry Logic
├── retries on transient failure
├── respects backoff configuration
├── gives up after max retries
└── logs retry attempts

Cancellation
├── cancels pending job
├── handles already-executed job
├── handles non-existent job
└── bulk cancellation

Edge Cases
├── very large payload
├── special characters in payload
├── scheduling at exact midnight
├── scheduling years in future
└── concurrent scheduling race
```

---

### TIER3-003: Discharge Batch Processor Tests

**Priority:** P2 - Medium
**Effort:** 16 hours
**New File:** `libs/domain/discharge/data-access/src/__tests__/discharge-batch-processor.test.ts`

**Test Scenarios:**

```
Batch Processing
├── processes 10-item chunks correctly
├── applies email stagger (index × 20s)
├── applies call stagger (index × 2min)
├── handles chunk boundary correctly
├── aggregates results across chunks
└── handles partial chunk failure

Stagger Calculation (Integration)
├── case 0: email=0s, call=0min
├── case 14: email=280s, call=28min
├── case 25: email=500s, call=50min
├── verifies stagger survives chunk boundaries
└── respects business hours for calls
```

---

## Part 5: Coverage Expansion (Tier 4 - P3)

### TIER4-001: Shared Utility Tests

**Priority:** P3 - Low
**Effort:** 8 hours

**Files Needing Tests:**

- `libs/shared/util/src/transforms.ts`
- `libs/shared/util/src/dates.ts`
- `libs/shared/util/src/strings.ts`

---

### TIER4-002: Email Generator Tests

**Priority:** P3 - Low
**Effort:** 6 hours
**New File:** `libs/domain/discharge/data-access/src/__tests__/email-generator.test.ts`

---

### TIER4-003: Entity Utilities Tests

**Priority:** P3 - Low
**Effort:** 6 hours
**New File:** `libs/domain/cases/data-access/src/__tests__/entity-utils.test.ts`

---

## Part 6: Jira Ticket Templates

### Epic Structure

```
EPIC: Testing Infrastructure Overhaul
├── STORY: Cleanup Existing Tests (3 tickets)
├── STORY: Critical Path Testing - Tier 1 (5 tickets)
├── STORY: API Route Testing - Tier 2 (12 tickets)
├── STORY: Integration Testing - Tier 3 (6 tickets)
└── STORY: Coverage Expansion - Tier 4 (8 tickets)
```

### Ticket Template

```markdown
## Title

[TIER-XXX] Test {Component Name} - {Specific Feature}

## Description

Write comprehensive unit tests for {component} covering {scope}.

## Acceptance Criteria

- [ ] Test file created at {path}
- [ ] {X}% line coverage achieved
- [ ] All scenarios from plan covered
- [ ] Tests pass in CI: `nx test {project}`
- [ ] No skipped or TODO tests

## Technical Notes

- Mock dependencies: {list}
- Use fixtures from: @odis-ai/shared/testing
- Follow patterns in: execution-plan.test.ts

## Effort Estimate

{X} hours

## Dependencies

{list any blocking tickets}
```

---

## Part 7: Onboarding Checklist

### Week 1: Environment & Patterns

- [ ] Clone repo and run `pnpm install`
- [ ] Run all tests: `pnpm test:all`
- [ ] Review testing utilities: `libs/shared/testing/src/`
- [ ] Study exemplary test: `libs/domain/shared/util/src/__tests__/execution-plan.test.ts`
- [ ] Complete CLEANUP-001 (phone-formatting.test.ts)
- [ ] Complete CLEANUP-002 (discharge-batch-stagger.test.ts)

### Week 2-3: Tier 1 Critical Tests

- [ ] TIER1-001: DischargeOrchestrator
- [ ] TIER1-002: CallExecutor
- [ ] TIER1-003: CasesService.ingest()

### Week 4-5: Tier 1 Continued + Tier 2 Start

- [ ] TIER1-004: VAPI Webhook Handlers
- [ ] TIER1-005: Repository CRUD
- [ ] Begin TIER2-001: Webhook Routes

### Week 6-8: Tier 2 API Routes

- [ ] TIER2-002: Case Management Routes
- [ ] TIER2-003: VAPI Tool Endpoints
- [ ] TIER2-004: tRPC Routers

### Week 9-12: Tier 3-4 Integration & Coverage

- [ ] TIER3-001: IDEXX Integration
- [ ] TIER3-002: QStash Integration
- [ ] TIER3-003: Batch Processor
- [ ] TIER4-\*: Coverage expansion

---

## Part 8: Quick Reference

### Commands

```bash
# Run specific project tests
nx test shared-validators
nx test domain-discharge-data-access

# Run with coverage
nx test shared-validators --coverage

# Run specific test file
nx test shared-util -t "business-hours"

# Run all tests
pnpm test:all

# Watch mode
pnpm test:watch
```

### Import Patterns

```typescript
// Fixtures
import { createMockCase, createMockUser } from "@odis-ai/shared/testing";

// Mocks
import {
  createMockSupabaseClient,
  createMockVapiClient,
} from "@odis-ai/shared/testing";

// Assertions
import { expectCalledWith, waitForCondition } from "@odis-ai/shared/testing";
```

### File Locations

| Purpose           | Path                                                           |
| ----------------- | -------------------------------------------------------------- |
| Test utilities    | `libs/shared/testing/src/`                                     |
| Supabase mock     | `libs/shared/testing/src/mocks/supabase.ts`                    |
| VAPI mock         | `libs/shared/testing/src/mocks/vapi.ts`                        |
| Case fixtures     | `libs/shared/testing/src/fixtures/cases.ts`                    |
| Best example test | `libs/domain/shared/util/src/__tests__/execution-plan.test.ts` |

---

## Summary Statistics

| Category    | Count  | Hours   | Tickets |
| ----------- | ------ | ------- | ------- |
| Cleanup     | 3      | 5       | 3       |
| Tier 1 (P0) | 5      | 76      | 5       |
| Tier 2 (P1) | 12     | 90      | 12      |
| Tier 3 (P2) | 6      | 52      | 6       |
| Tier 4 (P3) | 8      | 32      | 8       |
| **TOTAL**   | **34** | **255** | **34**  |

**Timeline:** 8-12 weeks for full coverage (1 engineer full-time)

---

## Appendix: Full Test File Inventory

### Existing Tests (Keep/Fix)

1. `libs/shared/validators/src/__tests__/discharge.test.ts` ✓
2. `libs/shared/validators/src/__tests__/discharge-summary.test.ts` ✓
3. `libs/shared/validators/src/__tests__/assessment-questions.test.ts` ✓
4. `libs/shared/validators/src/__tests__/orchestration.test.ts` ✓
5. `libs/shared/validators/src/__tests__/schedule.test.ts` ✓
6. `libs/shared/validators/src/__tests__/scribe.test.ts` ✓
7. `libs/shared/util/src/__tests__/business-hours.test.ts` ✓
8. `libs/shared/util/src/__tests__/cn.test.ts` ✓
9. `libs/shared/util/src/__tests__/schedule-time.test.ts` ✓
10. `libs/domain/shared/util/src/__tests__/execution-plan.test.ts` ✓
11. `libs/integrations/vapi/src/__tests__/utils.test.ts` ✓
12. `libs/integrations/vapi/src/__tests__/validators.test.ts` ✓
13. `libs/integrations/qstash/src/__tests__/client.test.ts` ✓
14. `libs/integrations/ai/src/__tests__/llamaindex-integration.test.ts` ✓
15. `libs/data-access/api/src/__tests__/cors.test.ts` ✓
16. `apps/web/src/server/actions/__tests__/auth.test.ts` ⚠️ (fix redirect pattern)

### Tests to Delete/Rewrite

17. `libs/shared/util/src/__tests__/phone-formatting.test.ts` ❌ (cleanup TODOs)
18. `libs/domain/discharge/data-access/src/__tests__/discharge-batch-stagger.test.ts` ❌ (review value)

### New Tests to Create (34 files)

See Tier 1-4 sections above for complete list.
