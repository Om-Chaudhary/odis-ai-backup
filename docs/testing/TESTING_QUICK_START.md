# Testing Quick Start Guide

**Get started testing the ODIS AI Web platform in 30 minutes**

---

## Step 1: Create Test Fixtures (10 minutes)

### Create `src/test/fixtures/vapi-responses.ts`

```typescript
import type { VapiCallResponse } from "~/lib/vapi/client";

export const mockVapiCallQueued: VapiCallResponse = {
  id: "call_123",
  orgId: "org_456",
  type: "outboundPhoneCall",
  status: "queued",
  phoneNumber: { number: "+12137774445", id: "phone_789" },
  customer: { number: "+15551234567" },
  assistantId: "asst_123",
  createdAt: "2025-11-14T10:00:00Z",
  updatedAt: "2025-11-14T10:00:00Z",
};

export const mockVapiCallInProgress: VapiCallResponse = {
  ...mockVapiCallQueued,
  status: "in-progress",
  startedAt: "2025-11-14T10:01:00Z",
  updatedAt: "2025-11-14T10:01:00Z",
};

export const mockVapiCallCompleted: VapiCallResponse = {
  ...mockVapiCallInProgress,
  status: "ended",
  endedReason: "assistant-ended-call",
  endedAt: "2025-11-14T10:05:00Z",
  transcript: "Mock transcript",
  recordingUrl: "https://example.com/recording.mp3",
  costs: [{ amount: 0.15, description: "Call cost" }],
  updatedAt: "2025-11-14T10:05:00Z",
};

export const mockVapiCallFailed: VapiCallResponse = {
  ...mockVapiCallQueued,
  status: "ended",
  endedReason: "dial-busy",
  endedAt: "2025-11-14T10:01:00Z",
  updatedAt: "2025-11-14T10:01:00Z",
};

export const mockVapiWebhookStatusUpdate = {
  message: {
    type: "status-update",
    call: mockVapiCallInProgress,
  },
};

export const mockVapiWebhookEndOfCall = {
  message: {
    type: "end-of-call-report",
    call: mockVapiCallCompleted,
  },
};
```

---

### Create `src/test/fixtures/idexx-data.ts`

```typescript
import type { IdexxPageData } from "~/lib/idexx/types";

export const mockIdexxData: IdexxPageData = {
  pageData: {
    patient: {
      name: "Max",
      species: "Dog",
      breed: "Golden Retriever",
    },
    client: {
      name: "John Smith",
      phone: "555-123-4567",
      email: "john@example.com",
    },
    clinic: {
      name: "Happy Paws Veterinary",
      phone: "555-987-6543",
      address: "123 Main St, Anytown, CA 12345",
    },
    providers: [
      {
        name: "Dr. Sarah Johnson",
        role: "Veterinarian",
      },
    ],
    consultation: {
      id: "12345",
      date: "2025-11-14",
      reason: "Annual checkup",
      notes: "Patient is healthy, all vitals normal.",
      dischargeSummary:
        "Max is doing great! Continue current diet and exercise routine.",
    },
  },
};
```

---

### Create `src/test/utils/supabase-mocks.ts`

```typescript
import { vi } from "vitest";

export function createMockSupabaseClient(mockData: Record<string, any> = {}) {
  const mockSelect = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockGte = vi.fn().mockReturnThis();
  const mockLte = vi.fn().mockReturnThis();
  const mockNot = vi.fn().mockReturnThis();

  return {
    from: vi.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      order: mockOrder,
      gte: mockGte,
      lte: mockLte,
      not: mockNot,
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockData.user || null },
        error: null,
      }),
      signIn: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

export function createMockServiceClient(mockData: Record<string, any> = {}) {
  return createMockSupabaseClient(mockData);
}
```

---

## Step 2: Write Your First Critical Test (20 minutes)

### Create `src/app/api/webhooks/vapi/route.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "./route";
import { createMockServiceClient } from "~/test/utils/supabase-mocks";
import {
  mockVapiWebhookStatusUpdate,
  mockVapiWebhookEndOfCall,
  mockVapiCallFailed,
} from "~/test/fixtures/vapi-responses";

// Mock Supabase
vi.mock("~/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));

// Mock QStash
vi.mock("~/lib/qstash/client", () => ({
  scheduleCallExecution: vi.fn().mockResolvedValue("msg_123"),
}));

describe("VAPI Webhook Handler", () => {
  let mockSupabase: ReturnType<typeof createMockServiceClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockServiceClient({
      id: "db_call_123",
      vapi_call_id: "call_123",
      metadata: {},
    });

    // @ts-expect-error - mock implementation
    const { createServiceClient } = await import("~/lib/supabase/server");
    vi.mocked(createServiceClient).mockResolvedValue(mockSupabase);
  });

  describe("POST /api/webhooks/vapi", () => {
    it("handles status-update webhook", async () => {
      const request = new NextRequest("http://localhost/api/webhooks/vapi", {
        method: "POST",
        body: JSON.stringify(mockVapiWebhookStatusUpdate),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("vapi_calls");
    });

    it("handles end-of-call-report webhook", async () => {
      const request = new NextRequest("http://localhost/api/webhooks/vapi", {
        method: "POST",
        body: JSON.stringify(mockVapiWebhookEndOfCall),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("schedules retry for dial-busy", async () => {
      const webhookPayload = {
        message: {
          type: "end-of-call-report",
          call: mockVapiCallFailed,
        },
      };

      const request = new NextRequest("http://localhost/api/webhooks/vapi", {
        method: "POST",
        body: JSON.stringify(webhookPayload),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify retry was scheduled
      const { scheduleCallExecution } = await import("~/lib/qstash/client");
      expect(scheduleCallExecution).toHaveBeenCalled();
    });

    it("does not retry after max retries", async () => {
      // Update mock to have retry_count = 3
      mockSupabase = createMockServiceClient({
        id: "db_call_123",
        vapi_call_id: "call_123",
        metadata: { retry_count: 3, max_retries: 3 },
      });

      const webhookPayload = {
        message: {
          type: "end-of-call-report",
          call: mockVapiCallFailed,
        },
      };

      const request = new NextRequest("http://localhost/api/webhooks/vapi", {
        method: "POST",
        body: JSON.stringify(webhookPayload),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify retry was NOT scheduled
      const { scheduleCallExecution } = await import("~/lib/qstash/client");
      expect(scheduleCallExecution).not.toHaveBeenCalled();
    });
  });
});
```

---

## Step 3: Run Your Tests

```bash
# Run in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run specific file
pnpm test src/app/api/webhooks/vapi/route.test.ts
```

---

## Common Testing Patterns

### 1. Testing API Routes

```typescript
import { NextRequest } from "next/server";

const request = new NextRequest("http://localhost/api/endpoint", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer token_123",
  },
  body: JSON.stringify({ data: "value" }),
});

const response = await POST(request);
const data = await response.json();

expect(response.status).toBe(200);
expect(data).toEqual({ success: true });
```

### 2. Testing Server Actions

```typescript
import { signIn } from "~/server/actions/auth";

// Mock FormData
const formData = new FormData();
formData.append("email", "test@example.com");
formData.append("password", "password123");

// Note: Server actions use redirect(), so we need to catch it
await expect(signIn(formData)).rejects.toThrow("NEXT_REDIRECT");
```

### 3. Testing tRPC Procedures

```typescript
import { createCaller } from "~/server/api/root";
import { createMockSupabaseClient } from "~/test/utils/supabase-mocks";

const mockSupabase = createMockSupabaseClient({ user: { id: "user_123" } });

const caller = createCaller({
  user: { id: "user_123", email: "test@example.com" },
  supabase: mockSupabase,
  headers: new Headers(),
});

const result = await caller.cases.listCases({ status: "completed" });

expect(result).toHaveLength(3);
```

### 4. Testing Validators

```typescript
import { scheduleCallSchema } from "~/lib/retell/validators";

it("accepts valid discharge call", () => {
  const result = scheduleCallSchema.safeParse({
    phoneNumber: "+12137774445",
    petName: "Max",
    ownerName: "John",
    appointmentDate: "November fourteenth",
    callType: "discharge",
    clinicName: "Happy Paws",
    clinicPhone: "five five five...",
    emergencyPhone: "five five five...",
    dischargeSummary: "Patient is healthy",
    subType: "wellness",
  });

  expect(result.success).toBe(true);
});

it("requires condition for follow-up calls", () => {
  const result = scheduleCallSchema.safeParse({
    phoneNumber: "+12137774445",
    petName: "Max",
    ownerName: "John",
    appointmentDate: "November fourteenth",
    callType: "follow-up",
    clinicName: "Happy Paws",
    clinicPhone: "five five five...",
    emergencyPhone: "five five five...",
    dischargeSummary: "Patient is healthy",
    // Missing: condition
  });

  expect(result.success).toBe(false);
  expect(result.error?.issues[0]?.path).toContain("condition");
});
```

### 5. Testing Data Transformers

```typescript
import { transformIdexxToCallRequest } from "~/lib/idexx/transformer";
import { mockIdexxData } from "~/test/fixtures/idexx-data";

it("transforms IDEXX data correctly", () => {
  const result = transformIdexxToCallRequest(
    mockIdexxData,
    new Date("2025-11-14T10:00:00Z"),
    "Test notes",
  );

  expect(result.petName).toBe("Max");
  expect(result.ownerName).toBe("John Smith");
  expect(result.phoneNumber).toBe("+15551234567");
  expect(result.callType).toBe("discharge");
  expect(result.subType).toBe("wellness");
});

it("formats dates for voice", () => {
  const result = transformIdexxToCallRequest(
    mockIdexxData,
    new Date("2025-11-14T10:00:00Z"),
  );

  // Should be "November fourteenth, 2 0 2 5"
  expect(result.appointmentDate).toContain("November");
  expect(result.appointmentDate).toContain("fourteenth");
});
```

---

## Next Steps

1. **Run existing tests**: `pnpm test` (should see 55 passing)
2. **Create fixtures**: Copy the code from Step 1 above
3. **Write webhook tests**: Copy the code from Step 2 above
4. **Run new tests**: `pnpm test:watch`
5. **Check coverage**: `pnpm test:coverage`

---

## Troubleshooting

### Common Issues

**Issue**: "Cannot find module '~/lib/supabase/server'"
**Fix**: Make sure you're mocking the module before importing it:

```typescript
vi.mock("~/lib/supabase/server", () => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));
```

**Issue**: "NEXT_REDIRECT thrown"
**Fix**: Server actions use redirect() which throws. Catch it:

```typescript
await expect(signIn(formData)).rejects.toThrow("NEXT_REDIRECT");
```

**Issue**: "Request body already read"
**Fix**: Use `request.text()` or `request.json()` only once per test

**Issue**: Tests timing out
**Fix**: Increase timeout in test:

```typescript
it(
  "long test",
  async () => {
    // test code
  },
  { timeout: 10000 },
); // 10 seconds
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Next.js Apps](https://nextjs.org/docs/app/building-your-application/testing)
- [Full Testing Strategy](./TESTING_STRATEGY.md)

---

**Ready to start?** Run `pnpm test:watch` and start writing tests!
