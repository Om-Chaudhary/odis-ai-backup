# ODIS AI Web - Comprehensive Testing Strategy

**Last Updated**: January 2026
**Current Status**: Tests passing across validator and domain libraries
**Coverage Target**: 70% lines/functions/branches/statements

## Test Infrastructure

### Test Coverage Summary

1. **Validator Library Tests** (`libs/shared/validators`) - 95%+ coverage
   - `assessment-questions.test.ts` - Assessment validation
   - `discharge-summary.test.ts` - Summary structure
   - `discharge.test.ts` - Discharge workflow validation
   - `orchestration.test.ts` - Multi-step orchestration
   - `schedule.test.ts` - Schedule & timing validation
   - `scribe.test.ts` - Clinical data validation

2. **Domain Layer Tests** (`libs/domain/discharge`)
   - `discharge-batch-stagger.test.ts` - Batch processing tests

3. **Infrastructure Ready for Testing**
   - Repository interfaces defined in `@odis-ai/data-access/repository-interfaces`
   - External API interfaces (`IScheduler`, `ICallClient`, `IEmailClient`)
   - Domain services split for testability (`domain/cases`, `domain/discharge`, `domain/shared`)

### Current Coverage

| Library                    | Coverage   | Status         |
| -------------------------- | ---------- | -------------- |
| `shared/validators`        | 95%+       | ✅ Complete    |
| `domain/discharge`         | Core paths | ✅ Partial     |
| `shared/hooks`             | Partial    | 🔄 In progress |

---

## Executive Summary

### What to Test Next (Priority Order)

1. **CRITICAL (Phase 1)**: VAPI webhook flow, authentication, call scheduling
2. **HIGH (Phase 2)**: Data transformers, validators, server actions, tRPC routers
3. **MEDIUM (Phase 3)**: UI components, utilities, remaining hooks

### Risk Assessment

| Area                 | Business Impact | Complexity | Current Coverage | Priority |
| -------------------- | --------------- | ---------- | ---------------- | -------- |
| VAPI Webhook Flow    | CRITICAL        | High       | 0%               | P0       |
| Authentication       | CRITICAL        | Medium     | 0%               | P0       |
| Call Scheduling      | CRITICAL        | High       | 0%               | P0       |
| IDEXX Transformer    | HIGH            | Medium     | 0%               | P1       |
| Validators (Zod)     | HIGH            | Low        | 0%               | P1       |
| tRPC Routers         | HIGH            | Medium     | 0%               | P1       |
| Server Actions       | HIGH            | Medium     | 0%               | P1       |
| VAPI Client          | HIGH            | Medium     | 0%               | P2       |
| Business Hours Utils | MEDIUM          | Low        | 0%               | P2       |
| UI Components        | MEDIUM          | Low        | 0%               | P2       |
| Phone Formatting     | LOW             | Low        | 0%               | P3       |

---

## Phase 1: Critical Path Testing (Immediate)

### 1.1 VAPI Webhook Handler (`src/app/api/webhooks/vapi/route.ts`)

**Why Critical**: Core revenue feature - failed calls = angry customers + lost money

**Test Categories**:

#### Unit Tests

```typescript
// src/app/api/webhooks/vapi/route.test.ts

describe("VAPI Webhook Handler", () => {
  describe("POST /api/webhooks/vapi", () => {
    // Signature verification
    it("rejects webhook with invalid signature");
    it("accepts webhook with valid HMAC signature");
    it("allows requests when VAPI_WEBHOOK_SECRET not set (dev mode)");

    // Status update events
    it("updates call status from queued to ringing");
    it("updates call status from ringing to in-progress");
    it("sets started_at timestamp on status update");
    it("handles status update for non-existent call gracefully");

    // End-of-call-report events
    it("calculates duration correctly from start/end times");
    it("calculates total cost from VAPI costs array");
    it("maps ended reason to correct status (completed/failed/cancelled)");
    it("stores transcript and recording URL");
    it("stores call analysis data");

    // Retry logic (CRITICAL BUSINESS LOGIC)
    it("schedules retry for dial-busy with 5 min backoff");
    it("schedules retry for dial-no-answer with exponential backoff");
    it("schedules retry for voicemail");
    it("does NOT retry for assistant-error");
    it("does NOT retry after max retries (3) reached");
    it("increments retry_count in metadata");
    it("stores next_retry_at in metadata");
    it("updates QStash message ID on retry");
    it("marks as permanently failed after max retries");

    // Hang events
    it("updates ended_at and ended_reason on hang");
    it("uses current time if endedAt not provided");
  });

  describe("Helper Functions", () => {
    it("mapEndedReasonToStatus: assistant-ended-call -> completed");
    it("mapEndedReasonToStatus: customer-ended-call -> completed");
    it("mapEndedReasonToStatus: dial-busy -> failed");
    it("mapEndedReasonToStatus: cancelled -> cancelled");

    it("shouldRetry: returns true for retryable reasons");
    it("shouldRetry: returns false for permanent failures");

    it("calculateRetryDelay: retry 0 -> 5 min");
    it("calculateRetryDelay: retry 1 -> 10 min");
    it("calculateRetryDelay: retry 2 -> 20 min");
  });

  describe("GET /api/webhooks/vapi", () => {
    it("returns health check response");
  });
});
```

**Estimated Effort**: 4-6 hours
**Success Metrics**:

- All webhook event types covered
- Retry logic thoroughly tested
- Edge cases handled (missing data, malformed payloads)

---

### 1.2 Authentication Flow (`src/server/actions/auth.ts`)

**Why Critical**: Security + data access control

**Test Categories**:

#### Integration Tests

```typescript
// src/server/actions/auth.test.ts

describe("Authentication Actions", () => {
  describe("signUp", () => {
    it("creates new user with valid credentials");
    it("sends email verification with correct redirect URL");
    it("rejects weak passwords");
    it("rejects duplicate email addresses");
    it("redirects to /signup on success");
    it("redirects to /error on failure");
  });

  describe("signIn", () => {
    it("authenticates user with correct credentials");
    it("rejects incorrect password");
    it("rejects non-existent email");
    it("redirects to /dashboard on success");
    it("redirects to /error on failure");
    it("revalidates layout after successful login");
  });

  describe("signOut", () => {
    it("clears Supabase session");
    it("redirects to / after logout");
    it("revalidates layout after logout");
  });

  describe("getUser", () => {
    it("returns user when authenticated");
    it("returns null when not authenticated");
    it("creates user profile if missing in users table");
    it("handles Supabase auth errors gracefully");
  });

  describe("getUserProfile", () => {
    it("fetches user profile by ID");
    it("returns null for non-existent user");
    it("handles database errors");
  });

  describe("updateUserProfile", () => {
    it("updates user profile fields");
    it("updates updated_at timestamp");
    it("validates role enum values");
    it("returns updated profile");
    it("returns null on error");
  });
});
```

**Estimated Effort**: 3-4 hours
**Success Metrics**:

- All auth flows covered
- Error handling tested
- Row Level Security respected

---

### 1.3 Call Scheduling (`src/app/api/calls/schedule/route.ts`)

**Why Critical**: Entry point for all VAPI calls - scheduling failures = no calls made

**Test Categories**:

#### Integration Tests

```typescript
// src/app/api/calls/schedule/route.test.ts

describe("Schedule Call API", () => {
  describe("POST /api/calls/schedule", () => {
    // Authentication
    it("rejects unauthenticated requests (no token/cookies)");
    it("accepts requests with valid Bearer token (extension)");
    it("accepts requests with valid session cookies (webapp)");
    it("rejects non-admin users");

    // Validation
    it("validates required fields (phoneNumber, petName, ownerName)");
    it("validates call type enum (discharge/follow-up)");
    it("requires condition for follow-up calls");
    it("validates phone number format (E.164)");
    it("rejects scheduled time in the past");

    // Database operations
    it("creates vapi_calls record with correct structure");
    it("stores dynamic variables in snake_case format");
    it("initializes retry metadata (retry_count=0, max_retries=3)");
    it("sets default timezone to America/Los_Angeles");

    // QStash integration
    it("schedules job in QStash with correct delay");
    it("stores QStash message ID in metadata");
    it("rolls back database insert if QStash fails");
    it("calculates delay correctly for future times");

    // Dynamic variables transformation
    it("formats appointment date for voice");
    it("formats clinic phone for voice");
    it("formats emergency phone for voice");
    it("includes conditional fields based on call type");
    it("excludes subType for follow-up calls");
    it("excludes condition for discharge calls");

    // Response format
    it("returns success response with call details");
    it("returns 400 for validation errors");
    it("returns 401 for auth errors");
    it("returns 403 for non-admin");
    it("returns 500 for database errors");
  });

  describe("GET /api/calls/schedule", () => {
    it("returns health check response");
  });
});
```

**Estimated Effort**: 5-7 hours
**Success Metrics**:

- Auth integration tested
- QStash rollback tested
- Variable transformation verified

---

## Phase 2: High-Impact Testing (Short-term)

### 2.1 IDEXX Data Transformer (`src/lib/idexx/transformer.ts`)

**Why Important**: Bridge between IDEXX Neo and VAPI - data corruption = bad calls

**Test Categories**:

#### Unit Tests

```typescript
// src/lib/idexx/transformer.test.ts

describe("IDEXX Data Transformer", () => {
  describe("transformIdexxToCallRequest", () => {
    it("extracts patient and client data correctly");
    it("selects first provider from array");
    it("formats consultation date for voice");
    it("formats phone numbers for voice output");
    it('defaults to "Sarah" for agent name');
    it('sets call type to "discharge"');
    it('sets sub type to "wellness"');
    it("uses discharge summary or consultation notes");
    it("generates default notes from consultation ID and reason");
    it("handles missing optional fields gracefully");
  });

  describe("formatDateForVoice", () => {
    it("formats January 1st correctly");
    it("formats December 31st correctly");
    it('spells out year with spaces (2025 -> "2 0 2 5")');
    it("handles ordinals correctly (1st-31st)");
  });

  describe("formatPhoneForVoice", () => {
    it('formats 10-digit US number: 5551234567 -> "five five five..."');
    it("removes formatting characters (dashes, parens)");
    it("handles 11-digit number with country code");
    it("uses last 10 digits for long numbers");
  });

  describe("formatPhoneNumber", () => {
    it("adds +1 to 10-digit numbers");
    it("preserves +1 for 11-digit numbers");
    it("adds + to numbers with country code");
    it("removes formatting characters");
  });

  describe("extractConsultationId", () => {
    it("extracts ID from IDEXX Neo URL");
    it("returns null for invalid URLs");
  });

  describe("validateIdexxData", () => {
    it("validates required patient name");
    it("validates required client name");
    it("validates required client phone");
    it("validates required clinic name");
    it("validates at least one provider exists");
    it("returns valid=true for complete data");
    it("returns errors array for missing fields");
  });
});
```

**Estimated Effort**: 3-4 hours
**Success Metrics**:

- All transformation logic covered
- Edge cases tested
- Voice formatting verified

---

### 2.2 Zod Validators ✅ **COMPLETED** (`libs/shared/validators`)

**Status**: ✅ **95%+ coverage**
**Location**: `libs/shared/validators/src/__tests__/`

**Test Coverage Summary**:

| Test Suite                     | Tests | Focus                         | Coverage |
| ------------------------------ | ----- | ----------------------------- | -------- |
| `assessment-questions.test.ts` | 40+   | Assessment validation         | 95%+     |
| `discharge-summary.test.ts`    | 35+   | Summary generation validation | 95%+     |
| `discharge.test.ts`            | 50+   | Discharge workflow validation | 95%+     |
| `orchestration.test.ts`        | 45+   | Multi-step orchestration      | 95%+     |
| `schedule.test.ts`             | 38+   | Schedule & timing validation  | 95%+     |
| `scribe.test.ts`               | 28+   | Clinical data validation      | 95%+     |

**What's Tested**:

```typescript
// All schemas have comprehensive coverage:
✅ dischargeSchema - Discharge data validation
✅ dischargeSummarySchema - Summary structure
✅ assessmentQuestionsSchema - Q&A validation
✅ orchestrationSchema - Workflow steps
✅ scheduleSchema - Call scheduling
✅ scribeSchema - Clinical data extraction

// Test categories covered:
✅ Valid input acceptance
✅ Invalid input rejection
✅ Edge cases (empty, null, undefined)
✅ Type coercion (strings to dates, etc.)
✅ Nested object validation
✅ Array validation (min/max items)
✅ Enum validation
✅ Conditional validation
✅ Error message clarity
```

**Success Metrics**: ✅ **ALL ACHIEVED**

- [x] All validation rules tested
- [x] Edge cases covered (236+ test scenarios)
- [x] Error messages verified
- [x] 95%+ code coverage
- [x] CI integration ready

---

### 2.3 tRPC Routers (`src/server/api/routers/cases.ts`)

**Why Important**: Admin dashboard data access - bugs = data corruption

**Test Categories**:

#### Integration Tests

```typescript
// src/server/api/routers/cases.test.ts

describe("Cases Router", () => {
  describe("listCases", () => {
    it("requires admin authentication");
    it("returns all cases without filters");
    it("filters by status");
    it("filters by type");
    it("filters by visibility");
    it("filters by userId");
    it("filters by date range");
    it("searches patient and owner names");
    it("orders by created_at descending");
    it("includes related user data");
    it("includes related patient data");
  });

  describe("getCase", () => {
    it("requires admin authentication");
    it("returns case with all relations");
    it("returns 404 for non-existent case");
    it("includes soap_notes");
    it("includes discharge_summaries");
    it("includes transcriptions");
  });

  describe("updateCase", () => {
    it("requires admin authentication");
    it("updates case fields");
    it("validates field types");
    it("returns updated case");
    it("returns 404 for non-existent case");
  });

  describe("deleteCase", () => {
    it("requires admin authentication");
    it("hard deletes case");
    it("returns success response");
    it("returns 404 for non-existent case");
  });

  describe("bulkCreateCases", () => {
    it("requires admin authentication");
    it("creates multiple cases with patients");
    it("verifies user exists before creating");
    it("links patient to case");
    it("rolls back on failure");
    it("returns successful and failed counts");
    it("handles partial failures gracefully");
  });

  describe("getCaseStats", () => {
    it("requires admin authentication");
    it("counts total cases");
    it("groups by status");
    it("groups by type");
  });

  describe("getTimeSeriesStats", () => {
    it("requires admin authentication");
    it("accepts days parameter (7-90)");
    it("returns daily counts");
    it("includes cases created");
    it("includes cases completed");
    it("includes soap notes");
    it("includes discharge summaries");
    it("calculates totals correctly");
  });
});
```

**Estimated Effort**: 6-8 hours
**Success Metrics**:

- All procedures tested
- Auth checks verified
- Data integrity maintained

---

### 2.4 VAPI Client (`src/lib/vapi/client.ts`)

**Why Important**: External API integration - errors = failed calls

**Test Categories**:

#### Unit + Integration Tests

```typescript
// src/lib/vapi/client.test.ts

describe("VAPI Client", () => {
  describe("getVapiClient", () => {
    it("creates client with private API key");
    it("throws if VAPI_PRIVATE_KEY not configured");
  });

  describe("createPhoneCall", () => {
    it("calls VAPI API with correct payload structure");
    it("includes phone number in customer object");
    it("includes assistantId and phoneNumberId");
    it("passes assistantOverrides with variableValues");
    it("logs call creation details");
    it("returns VapiCallResponse on success");
    it("throws and logs on API error");
  });

  describe("getCall", () => {
    it("fetches call by ID");
    it("throws on API error");
  });

  describe("listCalls", () => {
    it("fetches calls without filters");
    it("applies limit filter");
    it("applies date range filters");
    it("converts Date to ISO string for API");
  });

  describe("mapVapiStatus", () => {
    it("maps queued -> queued");
    it("maps ringing -> ringing");
    it("maps in-progress -> in_progress");
    it("maps forwarding -> in_progress");
    it("maps ended -> completed");
    it("defaults to queued for unknown status");
  });

  describe("shouldMarkAsFailed", () => {
    it("returns true for dial-busy");
    it("returns true for dial-no-answer");
    it("returns true for voicemail");
    it("returns true for assistant-error");
    it("returns false for successful end reasons");
    it("handles case-insensitive matching");
  });

  describe("calculateTotalCost", () => {
    it("sums all cost amounts");
    it("returns 0 for empty costs array");
    it("returns 0 for undefined costs");
  });
});
```

**Estimated Effort**: 3-4 hours
**Success Metrics**:

- API calls mocked correctly
- Error handling tested
- Helper functions verified

---

### 2.5 Business Hours Utilities (`src/lib/utils/business-hours.ts`)

**Why Important**: Call scheduling logic - bugs = calls at wrong times

**Test Categories**:

#### Unit Tests

```typescript
// src/lib/utils/business-hours.test.ts

describe("Business Hours Utilities", () => {
  describe("isWithinBusinessHours", () => {
    it("returns true for 9 AM on weekday");
    it("returns true for 4 PM on weekday");
    it("returns false for 8 AM (before start)");
    it("returns false for 5 PM (at end hour)");
    it("returns false for Saturday");
    it("returns false for Sunday");
    it("respects timezone conversions");
    it("uses custom config (startHour, endHour)");
    it("allows weekends when excludeWeekends=false");
  });

  describe("getNextBusinessHourSlot", () => {
    it("returns same time if within business hours");
    it("moves to 9 AM if before business hours");
    it("moves to next day 9 AM if after business hours");
    it("skips Saturday to Monday 9 AM");
    it("skips Sunday to Monday 9 AM");
    it("prevents infinite loops (max 14 iterations)");
    it("respects timezone for calculations");
  });

  describe("isFutureTime", () => {
    it("returns true for future timestamp");
    it("returns false for past timestamp");
    it("returns false for current time");
  });

  describe("calculateDelay", () => {
    it("calculates delay in seconds correctly");
    it("returns 0 for past timestamps");
    it("floors to nearest second");
  });
});
```

**Estimated Effort**: 2-3 hours
**Success Metrics**:

- Timezone handling verified
- Edge cases covered
- Weekend logic tested

---

## Phase 3: Medium Priority Testing (Long-term)

### 3.1 React Hooks

**Test Files**:

- `src/hooks/use-call-polling.test.ts` (already done - 12 tests)
- `src/hooks/use-toast.test.ts`
- `src/hooks/use-media-query.test.ts`
- `src/hooks/use-on-click-outside.test.ts`

**Estimated Effort**: 4-6 hours
**Success Metrics**: All custom hooks unit tested

---

### 3.2 UI Components

**Priority Components**:

- `src/components/dashboard/quick-call-dialog.tsx` (high user interaction)
- `src/components/admin/SoapTemplateForm.tsx`
- `src/components/admin/UserForm.tsx`
- `src/components/ui/data-table.tsx`

**Estimated Effort**: 8-10 hours
**Success Metrics**: User interactions tested, accessibility verified

---

### 3.3 Utility Functions

**Test Files**:

- `src/lib/utils.test.ts` (cn function)
- `src/lib/utils/phone-formatting.test.ts`
- `src/lib/utils/date-grouping.test.ts`

**Estimated Effort**: 2-3 hours
**Success Metrics**: All utility functions covered

---

## Integration Testing Strategy

### External API Integrations

**Mock Strategy**:

```typescript
// Mock VAPI SDK
vi.mock("@vapi-ai/server-sdk", () => ({
  VapiClient: vi.fn(() => ({
    calls: {
      create: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
    },
  })),
}));

// Mock QStash
vi.mock("@upstash/qstash", () => ({
  Client: vi.fn(() => ({
    publishJSON: vi.fn(),
  })),
}));

// Mock Supabase
vi.mock("@odis-ai/data-access/db", () => ({
  createServerClient: vi.fn(),
  createServiceClient: vi.fn(),
}));
```

### Database Testing

**Approach**: Use Supabase test instance or mock client

```typescript
// Test helper
export function createMockSupabaseClient(responses: Record<string, any>) {
  return {
    from: (table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(responses[table]),
        single: vi.fn().mockResolvedValue(responses[table]),
      }),
      insert: vi.fn().mockResolvedValue({ data: responses[table] }),
      update: vi.fn().mockResolvedValue({ data: responses[table] }),
      delete: vi.fn().mockResolvedValue({ error: null }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: responses.user } }),
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  };
}
```

---

## Test Organization

### Directory Structure

Tests are colocated within each library:

```
libs/
├── shared/
│   ├── validators/src/__tests__/     # Validator tests (95%+ coverage)
│   ├── util/src/__tests__/           # Utility function tests
│   └── testing/src/                  # Shared test utilities & mocks
│       ├── mocks/
│       ├── fixtures/
│       └── setup/
├── domain/
│   └── discharge/data-access/src/__tests__/  # Service layer tests
├── integrations/
│   ├── vapi/src/__tests__/           # VAPI client tests
│   └── qstash/src/__tests__/         # QStash client tests
└── data-access/
    └── api/src/__tests__/            # API helper tests

apps/web/src/
├── server/
│   ├── actions/__tests__/            # Server action tests
│   └── api/routers/                  # tRPC router tests (colocated)
```

---

## Success Metrics

### Coverage Targets (Current → Goal)

| Metric      | Original | Current  | Phase 2 Target | Phase 3 Target |
| ----------- | -------- | -------- | -------------- | -------------- |
| Lines       | ~5%      | ~35%     | 60%            | 70%            |
| Functions   | ~5%      | ~35%     | 60%            | 70%            |
| Branches    | ~5%      | ~30%     | 55%            | 70%            |
| Statements  | ~5%      | ~35%     | 60%            | 70%            |
| Total Tests | 55       | **290+** | 400+           | 500+           |

**Progress**: ✅ Phase 1 exceeded (236+ validator tests alone)

### Critical Path Coverage

- [ ] VAPI webhook flow (all events): 0% → **Priority P0**
- [ ] Call scheduling end-to-end: 0% → **Priority P0**
- [ ] Authentication flows: 0% → **Priority P0**
- [ ] Retry logic: 0% → **Priority P0**
- [ ] Data transformers: 0% → **Priority P1**
- [x] **Validators (`libs/shared/validators`): 95%+ ✅ COMPLETE**
- [x] **Discharge batch processing (`libs/domain/discharge`): ✅ COMPLETE**

**Next Priority**: VAPI webhook handler tests and authentication flow tests

---

## Staging Environment Testing

### Manual Test Scenarios

**Before deploying to production**:

1. **VAPI Integration**
   - Schedule test call → verify QStash job created
   - Execute test call → verify VAPI call initiated
   - Receive webhook → verify database updated
   - Simulate failed call → verify retry scheduled
   - Reach max retries → verify marked as failed

2. **IDEXX Integration** (if browser extension deployed)
   - Import IDEXX data → verify transformation
   - Schedule call from extension → verify variables correct
   - Execute call → verify voice formatting sounds natural

3. **Admin Dashboard**
   - Bulk create cases → verify rollback on error
   - Filter cases → verify queries correct
   - View stats → verify calculations accurate

4. **Authentication**
   - Sign up → verify email sent
   - Sign in → verify session created
   - Sign out → verify session cleared
   - Access protected route → verify redirect

---

## Testing Commands

### Run Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage

# UI mode (interactive)
pnpm test:ui

# Specific file
pnpm test src/app/api/webhooks/vapi/route.test.ts

# Specific test
pnpm test -t "schedules retry for dial-busy"
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Testing Priorities

### Phase 1 (Critical)

- VAPI webhook handler tests
- Authentication flow tests
- Call scheduling integration tests

### Phase 2 (High Priority)

- IDEXX transformer tests
- tRPC router tests
- VAPI client tests
- Business hours utility tests

### Phase 3 (Medium Priority)

- React hook tests
- UI component tests
- Utility function tests

---

## Recommendations

### Immediate Actions (This Week)

1. **Create test fixtures** for IDEXX data and VAPI responses
2. **Set up mock helpers** for Supabase, VAPI, QStash
3. **Write webhook handler tests** (highest risk area)
4. **Add CI/CD workflow** for automated testing

### Best Practices

1. **Test behavior, not implementation**
   - Focus on "what" not "how"
   - Mock external dependencies
   - Test user-facing outcomes

2. **Follow AAA pattern**
   - Arrange: Set up test data
   - Act: Execute function
   - Assert: Verify outcome

3. **Use descriptive test names**
   - ✅ "schedules retry for dial-busy with 5 min backoff"
   - ❌ "test retry logic"

4. **Avoid test interdependence**
   - Each test should run independently
   - Use beforeEach for setup
   - Clean up after each test

5. **Mock at the boundary**
   - Mock external APIs (VAPI, Supabase)
   - Don't mock internal utilities
   - Test real integration where possible

---

## Risk Mitigation

### High-Risk Areas Without Tests

1. **VAPI webhook retry logic**
   - Risk: Failed calls not retried → lost revenue
   - Mitigation: Comprehensive retry tests in Phase 1

2. **Call scheduling race conditions**
   - Risk: Duplicate calls or missed calls
   - Mitigation: Integration tests with concurrency

3. **IDEXX data transformation**
   - Risk: Malformed data → bad calls → angry customers
   - Mitigation: Extensive validation + edge case testing

4. **Authentication bypass**
   - Risk: Non-admins accessing admin endpoints
   - Mitigation: Auth tests on every protected endpoint

### Monitoring in Production

Even with 70% coverage, monitor:

- Webhook failure rates (should be <1%)
- Call retry success rates (should be >80%)
- QStash delivery failures
- Supabase RLS violations
- VAPI API errors

---

## Conclusion

This strategy prioritizes **business-critical paths first**, focusing on:

1. Revenue-generating features (VAPI calls)
2. Security (authentication)
3. Data integrity (validators, transformers)
4. User experience (UI components)

By following this phased approach, you'll achieve **70% coverage in ~8 days** while ensuring the most critical features are thoroughly tested first.

**Next Step**: Start with Phase 1, Test 1.1 (VAPI Webhook Handler) - the highest risk area with the most complex business logic.
