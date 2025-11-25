# Task 9 Test Failure Analysis

## Executive Summary

Two test suites are failing in Task 9:

1. **discharge-orchestrator.test.ts** - Environment variable access error
2. **llamaindex-integration.test.ts** - Mock setup issues (10 failing tests)

## Issue 1: Discharge Orchestrator Test Suite Failure

### Error

```
Error: ❌ Attempted to access a server-side environment variable on the client
 ❯ node_modules/@t3-oss/env-core/dist/index.js:64:15
 ❯ Object.get node_modules/@t3-oss/env-core/dist/index.js:87:52
 ❯ src/lib/resend/client.ts:8:38
      8| export const resend = new Resend(env.RESEND_API_KEY);
```

### Root Cause

The `discharge-orchestrator.ts` file imports utility functions from `~/lib/resend/client.ts`:

```typescript
import { htmlToPlainText, isValidEmail } from "~/lib/resend/client";
```

The `resend/client.ts` file has a **top-level side effect** that executes when the module is imported:

```typescript
import { Resend } from "resend";
import { env } from "~/env";

export const resend = new Resend(env.RESEND_API_KEY); // ← Executes at import time
```

When Vitest runs tests with the `happy-dom` environment, it's considered a "client" context. The `@t3-oss/env-nextjs` library (`env.js`) validates that server-side environment variables (like `RESEND_API_KEY`) cannot be accessed in client contexts, and throws an error.

### Why This Happens

1. **Module Import Chain**:
   - Test imports `DischargeOrchestrator`
   - `DischargeOrchestrator` imports from `resend/client.ts`
   - `resend/client.ts` executes `new Resend(env.RESEND_API_KEY)` at module load time
   - `env.RESEND_API_KEY` triggers validation in `@t3-oss/env-nextjs`
   - Validation fails because Vitest's test environment is considered "client-side"

2. **Environment Detection**:
   - `@t3-oss/env-nextjs` uses runtime checks to determine if code is running in a client context
   - Vitest's `happy-dom` environment is detected as client-side
   - Server-side env vars are blocked in client contexts for security

### Solution Options

#### Option 1: Mock the resend/client module (Recommended)

Mock the entire `resend/client` module in the test file to prevent the side effect:

```typescript
vi.mock("~/lib/resend/client", () => ({
  htmlToPlainText: vi.fn((html: string) => html.replace(/<[^>]+>/g, "")),
  isValidEmail: vi.fn((email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  ),
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
}));
```

#### Option 2: Refactor resend/client.ts to lazy initialization

Move the `Resend` instance creation to a function that's only called when needed:

```typescript
let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(env.RESEND_API_KEY);
  }
  return resendInstance;
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return getResendClient()[prop as keyof Resend];
  },
});
```

#### Option 3: Configure Vitest to skip env validation

Add to `vitest.config.ts`:

```typescript
process.env.SKIP_ENV_VALIDATION = "true";
```

**Note**: This is less safe as it disables validation entirely.

### Recommended Fix

**Option 1** is recommended because:

- It's the least invasive change
- It properly isolates the test from external dependencies
- It follows testing best practices (mock external services)
- It doesn't require changes to production code

---

## Issue 2: LlamaIndex Integration Test Suite Failures

### Error Pattern

```
Error: [vitest] No "extractTextFromResponse" export is defined on the "~/lib/llamaindex/utils" mock.
Did you forget to return it from "vi.mock"?
```

### Affected Tests (10 failures)

1. `should extract entities from veterinary text`
2. `should handle LlamaIndex response format (string)` (entity extraction)
3. `should handle LlamaIndex response format (array)` (entity extraction)
4. `should validate extracted entities against schema`
5. `should generate discharge summary from entities`
6. `should handle SOAP content input`
7. `should handle LlamaIndex response format (string)` (discharge summary)
8. `should handle LlamaIndex response format (array)` (discharge summary)
9. `should trim whitespace from summary`
10. `should handle both string and array response formats`

### Root Cause

The mock setup for `~/lib/llamaindex/utils` is incorrect:

```typescript
vi.mock("~/lib/llamaindex/utils", () => {
  const actual = vi.importActual("~/lib/llamaindex/utils");
  return {
    ...actual,
    extractApiErrorStatus: vi.fn(),
    // Use actual implementation for extractTextFromResponse to test real behavior
  };
});
```

**Problems:**

1. **`vi.importActual()` is async**: The mock factory function doesn't await the import, so `actual` is a Promise, not the actual module
2. **Spread operator on Promise**: Spreading a Promise doesn't work as expected
3. **Missing export**: Even if the spread worked, `extractTextFromResponse` might not be properly exposed
4. **Mocking attempt**: Later in tests, code tries to mock `extractTextFromResponse`:
   ```typescript
   vi.mocked(extractTextFromResponse).mockReturnValue(...)
   ```
   But since it's not properly exposed from the mock, this fails

### Additional Issues

Some tests also fail with:

```
Error: Input too short for entity extraction (minimum 50 characters)
```

This is because test inputs like `"Patient: Max"` are too short. The `extractEntities` function has a validation that requires at least 50 characters.

### Solution

#### Fix 1: Properly mock the utils module with async import

```typescript
vi.mock("~/lib/llamaindex/utils", async () => {
  const actual = await vi.importActual<typeof import("~/lib/llamaindex/utils")>(
    "~/lib/llamaindex/utils",
  );
  return {
    ...actual,
    extractApiErrorStatus: vi.fn(),
    extractTextFromResponse: vi.fn((response) => {
      // Default implementation - can be overridden in tests
      const content = response.message.content;
      if (typeof content === "string") {
        return content;
      }
      if (Array.isArray(content)) {
        const textContent = content.find(
          (item): item is { type: "text"; text: string } =>
            typeof item === "object" &&
            item !== null &&
            "type" in item &&
            item.type === "text" &&
            "text" in item &&
            typeof (item as { text: unknown }).text === "string",
        );
        if (!textContent) {
          throw new Error("No text content found");
        }
        return textContent.text;
      }
      throw new Error("Unexpected format");
    }),
  };
});
```

#### Fix 2: Fix test inputs that are too short

Update tests to use inputs that meet the 50-character minimum:

```typescript
// ❌ Too short
const result = await extractEntities("Patient: Max", "transcript");

// ✅ Meets minimum
const result = await extractEntities(
  "Patient: Max, a 5-year-old Labrador Retriever. Owner: John Smith. Diagnosis: Ear infection.",
  "transcript",
);
```

#### Fix 3: Alternative - Use actual implementation when not mocking

If you want to use the actual `extractTextFromResponse` implementation in most tests and only mock it when needed:

```typescript
vi.mock("~/lib/llamaindex/utils", async () => {
  const actual = await vi.importActual<typeof import("~/lib/llamaindex/utils")>(
    "~/lib/llamaindex/utils",
  );
  return {
    ...actual,
    extractApiErrorStatus: vi.fn(),
    // Don't mock extractTextFromResponse - use actual implementation
  };
});

// Then in tests where you need to mock it:
beforeEach(() => {
  vi.mocked(extractTextFromResponse).mockImplementation((response) => {
    // Custom implementation for this test
    return "mocked response";
  });
});
```

### Recommended Fix

**Use Fix 1 + Fix 2**:

- Properly await the `importActual` call
- Provide a default mock implementation for `extractTextFromResponse` that can be overridden
- Fix test inputs to meet validation requirements

---

## Summary of Required Changes

### 1. discharge-orchestrator.test.ts

- Add mock for `~/lib/resend/client` module at the top of the test file
- Mock `htmlToPlainText` and `isValidEmail` functions
- Mock the `resend` client instance

### 2. llamaindex-integration.test.ts

- Fix the `vi.mock("~/lib/llamaindex/utils")` to properly await `importActual`
- Ensure `extractTextFromResponse` is properly exported from the mock
- Update test inputs to meet the 50-character minimum requirement
- Consider whether to use actual implementation or mock for `extractTextFromResponse`

### 3. Test Input Validation

- Review all test inputs in `llamaindex-integration.test.ts` to ensure they meet the 50-character minimum
- Update short inputs to be more realistic and meet validation requirements

---

## Testing Strategy Recommendations

1. **Isolation**: Mock external dependencies (Resend, LlamaIndex) to isolate unit tests
2. **Real Implementation**: Use actual implementations when testing integration behavior
3. **Validation**: Ensure test inputs meet all validation requirements
4. **Async Mocks**: Always await `vi.importActual()` when using it in mocks

---

## Next Steps

1. Fix `discharge-orchestrator.test.ts` by adding the Resend client mock
2. Fix `llamaindex-integration.test.ts` mock setup
3. Update test inputs to meet validation requirements
4. Run tests to verify all failures are resolved
5. Ensure no regressions in other test suites
