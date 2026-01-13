# Testing Walkthrough Guide

> Use this guide to walk a new testing engineer through the codebase.
> Estimated time: 1-2 hours

---

## Part 1: Quick Orientation (10 min)

### Run the Tests First

```bash
# Clone and install (if not already done)
pnpm install

# Run all tests - this should take ~30 seconds
pnpm test:all
```

**Expected output:** 17 projects tested, ~400+ tests pass, no failures.

### Project Structure Overview

```
odis-ai-web/
├── apps/
│   ├── web/                    # Next.js dashboard (main app)
│   ├── chrome-extension/       # IDEXX Neo browser extension
│   └── idexx-sync/             # Headless sync service
│
├── libs/
│   ├── shared/                 # Cross-cutting concerns
│   │   ├── validators/         # ⭐ Well-tested (229 tests)
│   │   ├── util/               # ⭐ Well-tested (165 tests)
│   │   ├── testing/            # 🔧 Test utilities (use these!)
│   │   └── ...
│   │
│   ├── domain/                 # Business logic
│   │   ├── cases/              # ❌ Needs tests
│   │   ├── discharge/          # ❌ Needs tests (critical!)
│   │   └── shared/             # ⚠️ Partial tests
│   │
│   ├── data-access/            # Database layer
│   │   ├── repository-impl/    # ❌ Needs tests
│   │   └── ...
│   │
│   └── integrations/           # External services
│       ├── vapi/               # ⚠️ Partial tests
│       ├── qstash/             # ⚠️ Partial tests
│       └── idexx/              # ❌ Needs tests
│
└── docs/testing/               # 📚 Testing documentation (you are here)
```

---

## Part 2: Tour of Existing Tests (30 min)

### Stop 1: The Best Example Test

**File:** `libs/domain/shared/util/src/__tests__/execution-plan.test.ts`

```bash
# Open this file
code libs/domain/shared/util/src/__tests__/execution-plan.test.ts
```

**What it demonstrates:**

- Clean test organization with `describe` blocks
- Helper functions for consistent test setup
- Section comments grouping related tests
- Testing both success and error paths
- Integration-style tests for workflows

**Run just this test:**

```bash
nx test domain-shared-util
```

**Key patterns to notice:**

```typescript
// 1. Helper functions at the top for consistency
const createStep = (id: string, deps: string[] = []): ExecutionStep => ({...});

// 2. Clear describe blocks for organization
describe("ExecutionPlan", () => {
  describe("building plans", () => {...});
  describe("execution control", () => {...});
  describe("parallel execution", () => {...});
});

// 3. Descriptive test names
it("should mark step as completed and track timing", () => {...});

// 4. Both success and error cases
it("should handle circular dependencies gracefully", () => {...});
```

---

### Stop 2: Validator Tests (High Coverage Example)

**Directory:** `libs/shared/validators/src/__tests__/`

```bash
# List all validator tests
ls libs/shared/validators/src/__tests__/
```

**Files:**

- `discharge.test.ts` - Email/summary schema validation
- `discharge-summary.test.ts` - Structured summary validation
- `assessment-questions.test.ts` - AI assessment validation
- `orchestration.test.ts` - Workflow request validation
- `schedule.test.ts` - Appointment scheduling validation
- `scribe.test.ts` - Transcript parsing validation

**Run with coverage:**

```bash
nx test shared-validators --coverage
```

**What makes these good:**

```typescript
// 1. Organized by input validity
describe("sendEmailSchema", () => {
  describe("valid inputs", () => {...});
  describe("invalid inputs", () => {...});
  describe("edge cases", () => {...});
});

// 2. Use safeParse for validation testing
const result = schema.safeParse(input);
expect(result.success).toBe(true);

// 3. Test error messages
if (!result.success) {
  expect(result.error.issues[0]?.message).toContain("Invalid");
}

// 4. Edge cases covered
it("accepts very long HTML content", () => {...});
it("handles unicode characters", () => {...});
```

---

### Stop 3: Utility Tests

**Directory:** `libs/shared/util/src/__tests__/`

**Files:**

- `business-hours.test.ts` - Timezone-aware business hours
- `cn.test.ts` - Tailwind class merging
- `schedule-time.test.ts` - Date/time calculations
- `phone-formatting.test.ts` - ⚠️ Has TODOs to clean up

**Key pattern - Testing with timezones:**

```typescript
// From business-hours.test.ts
describe("isWithinBusinessHours", () => {
  it("returns true during business hours in PST", () => {
    // Use fake timers for deterministic testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00-08:00"));

    expect(isWithinBusinessHours("America/Los_Angeles")).toBe(true);

    vi.useRealTimers();
  });
});
```

---

### Stop 4: Integration Tests (External Services)

**Directory:** `libs/integrations/vapi/src/__tests__/`

**Files:**

- `utils.test.ts` - String/text utilities
- `validators.test.ts` - VAPI payload validation

**What's tested vs what's missing:**

| Component         | Tested | Missing                       |
| ----------------- | ------ | ----------------------------- |
| Text extraction   | ✅     | -                             |
| Schema validation | ✅     | -                             |
| VAPI client       | ❌     | Call creation, status updates |
| Webhook handlers  | ❌     | All 6 handlers!               |

**Directory:** `libs/integrations/qstash/src/__tests__/`

**File:** `client.test.ts` - Job scheduling

**Key pattern - Mocking external services:**

```typescript
// Mock before importing
vi.mock("@upstash/qstash", () => ({
  Client: class MockClient {
    publishJSON = vi.fn().mockResolvedValue({ messageId: "msg-123" });
    messages = { delete: vi.fn() };
  },
}));

// Reset between tests
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});
```

---

### Stop 5: Server Action Tests

**File:** `apps/web/src/server/actions/__tests__/auth.test.ts`

```bash
nx test web
```

**What it demonstrates:**

- Testing Next.js server actions
- Mocking Supabase client
- Testing redirect behavior
- Chained mock returns for query builders

**Key pattern - Mocking Supabase queries:**

```typescript
// Mock the chainable query builder
mockFrom.mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      }),
    }),
  }),
});
```

---

## Part 3: Testing Utilities Library (20 min)

### Location

```bash
# The shared testing library
ls libs/shared/testing/src/
```

**Structure:**

```
libs/shared/testing/src/
├── index.ts              # Main exports
├── mocks/
│   ├── supabase.ts       # Supabase client mock
│   ├── vapi.ts           # VAPI client mock
│   └── next.tsx          # Next.js mocks
├── fixtures/
│   ├── users.ts          # User/clinic factories
│   ├── cases.ts          # Case/patient factories
│   └── calls.ts          # Call record factories
├── setup/
│   ├── node.ts           # Node.js test setup
│   └── react.ts          # React test setup
└── utils/
    ├── api.ts            # API request helpers
    └── assertions.ts     # Custom assertions
```

### How to Use

```typescript
// Import what you need
import {
  // Mocks
  createMockSupabaseClient,
  createMockVapiClient,

  // Fixtures
  createMockCase,
  createMockUser,
  createMockCallRecord,

  // Utilities
  createMockRequest,
  expectCalledWith,
} from "@odis-ai/shared/testing";
```

### Mock Examples

**Supabase:**

```typescript
const { client, auth, from } = createMockSupabaseClient({
  user: createMockUser({ email: "test@example.com" }),
});

// Use in tests
from.mockReturnValue(
  createMockQueryBuilder({
    data: [createMockCase()],
  }),
);
```

**VAPI:**

```typescript
const vapiClient = createMockVapiClient();
vapiClient.calls.create.mockResolvedValue(
  createMockVapiCall({ status: "completed" }),
);
```

### Fixture Factories

All factories accept `overrides` parameter:

```typescript
// Default case
const case1 = createMockCase();

// Customized case
const case2 = createMockCase({
  id: "specific-id",
  status: "completed",
  procedure_type: "Dental cleaning",
});

// Multiple cases
const cases = createMockCaseList(10, {
  clinicId: "clinic-1",
  statuses: ["completed", "scheduled"],
});
```

---

## Part 4: What Needs Testing (20 min)

### Critical Gaps (Show These Files)

**1. DischargeOrchestrator - Zero Tests**

```bash
# The most critical untested file
code libs/domain/discharge/data-access/src/lib/discharge-orchestrator.ts
```

- 400 lines of workflow orchestration
- Controls all discharge calls and emails
- Sequential and parallel execution modes

**2. CasesService - Zero Tests**

```bash
code libs/domain/cases/data-access/src/lib/cases-service.ts
```

- Main data entry point
- Case ingestion from IDEXX
- AI entity extraction

**3. VAPI Webhooks - Zero Tests**

```bash
ls libs/integrations/vapi/src/webhooks/handlers/
```

- 6 webhook handlers
- Process all call events
- Missing events = lost data

**4. All API Routes - Zero Tests**

```bash
ls apps/web/src/app/api/
```

- 30+ API routes
- Webhooks, tools, CRUD operations

**5. All tRPC Routers - Zero Tests**

```bash
ls apps/web/src/server/api/routers/
```

- 55+ procedures
- Dashboard, cases, outbound, admin

---

## Part 5: Running Tests (10 min)

### Basic Commands

```bash
# Run single project
nx test shared-validators

# Run with pattern match
nx test shared-util -t "business-hours"

# Run with coverage
nx test shared-validators --coverage

# Run all
pnpm test:all

# Watch mode (re-run on changes)
nx test shared-validators --watch
```

### Coverage Reports

```bash
# Generate coverage for a project
nx test shared-validators --coverage

# View HTML report
open libs/shared/validators/coverage/index.html
```

### Debugging Failing Tests

```bash
# Verbose output
nx test shared-validators --reporter=verbose

# Run single file
nx test shared-validators --testNamePattern="discharge"
```

---

## Part 6: Writing Your First Test (Hands-On)

### Exercise: Add a Test to validators

1. Open `libs/shared/validators/src/__tests__/discharge.test.ts`

2. Find a schema that could use more edge case testing

3. Add a test:

```typescript
it("handles empty string subject", () => {
  const result = sendEmailSchema.safeParse({
    subject: "",
    htmlContent: "<p>Test</p>",
  });
  expect(result.success).toBe(false);
});
```

4. Run and verify:

```bash
nx test shared-validators -t "empty string"
```

---

## Part 7: Quick Reference Card

### File Locations

| What            | Where                                                          |
| --------------- | -------------------------------------------------------------- |
| Test utilities  | `libs/shared/testing/src/`                                     |
| Validator tests | `libs/shared/validators/src/__tests__/`                        |
| Utility tests   | `libs/shared/util/src/__tests__/`                              |
| Web app tests   | `apps/web/src/**/__tests__/`                                   |
| Best example    | `libs/domain/shared/util/src/__tests__/execution-plan.test.ts` |

### Import Patterns

```typescript
// Testing utilities
import { createMockSupabaseClient } from "@odis-ai/shared/testing";

// Vitest
import { describe, it, expect, vi, beforeEach } from "vitest";

// Source code (relative)
import { myFunction } from "../my-module";
```

### Mock Patterns

```typescript
// Module mock (before imports)
vi.mock("@some/package", () => ({...}));

// Spy on function
const spy = vi.spyOn(object, "method");

// Reset between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

### Commands Cheat Sheet

```bash
nx test <project>                    # Run project tests
nx test <project> --coverage         # With coverage
nx test <project> -t "pattern"       # Filter by name
nx test <project> --watch            # Watch mode
pnpm test:all                        # All projects
nx affected -t test                  # Only changed
```

---

## Checklist: Engineer Ready to Start

After this walkthrough, the engineer should be able to:

- [ ] Run `pnpm test:all` successfully
- [ ] Navigate to test directories
- [ ] Understand the testing utilities library
- [ ] Read and understand existing test patterns
- [ ] Identify the critical testing gaps
- [ ] Write a simple test using existing patterns
- [ ] Run tests with coverage
- [ ] Know where to find documentation

**Next step:** Start with `CLEANUP-001` from the onboarding plan (fixing phone-formatting.test.ts).
