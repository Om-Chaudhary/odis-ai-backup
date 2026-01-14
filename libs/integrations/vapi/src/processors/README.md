# VAPI Tool Processors

Pure business logic functions for VAPI tools. These processors are:

- Framework-agnostic (no Next.js dependencies)
- Easy to test with mock context
- Reusable across different entry points

## Structure

```
processors/
├── appointments/           # Appointment-related processors
│   ├── check-availability.ts
│   ├── book-appointment.ts
│   └── index.ts
├── messaging/              # Messaging-related processors
│   ├── leave-message.ts
│   └── index.ts
├── triage/                 # Triage-related processors
│   ├── log-emergency.ts
│   └── index.ts
└── index.ts                # Barrel exports
```

## Usage

```typescript
import { processBookAppointment } from "@odis-ai/integrations/vapi/processors";
import type { ToolContext } from "@odis-ai/integrations/vapi/core";

// In route handler
const result = await processBookAppointment(input, context);
```

## Processor Signature

All processors follow the same signature:

```typescript
type Processor<TInput> = (
  input: TInput, // Validated input from schema
  ctx: ToolContext, // { clinic, supabase, logger, callId, ... }
) => Promise<ToolResult>;
```

## ToolContext

```typescript
interface ToolContext {
  callId?: string; // VAPI call ID
  toolCallId?: string; // Tool call ID for response
  assistantId?: string; // VAPI assistant ID
  clinic: ClinicWithConfig | null; // Resolved clinic
  supabase: SupabaseClient; // Database client
  logger: Logger; // Structured logger
}
```

## ToolResult

```typescript
interface ToolResult<T = Record<string, unknown>> {
  success: boolean;
  message: string; // Human-readable response for voice
  data?: T; // Structured data
  error?: string; // Error code (if !success)
}
```

## Testing

Processors are easy to test:

```typescript
import { processLeaveMessage } from "./leave-message";
import { createMockToolContext } from "@odis-ai/shared/testing";

describe("processLeaveMessage", () => {
  it("should log message successfully", async () => {
    const ctx = createMockToolContext({
      clinic: { id: "123", name: "Test Clinic" },
    });

    const result = await processLeaveMessage(
      { client_name: "John", client_phone: "555-1234", message: "Call back" },
      ctx,
    );

    expect(result.success).toBe(true);
  });
});
```

## Adding New Processors

1. Create processor file in appropriate domain folder
2. Export from domain's `index.ts`
3. Export from main `index.ts`
4. Create corresponding schema in `../schemas/`
5. Create thin route handler in `apps/web/src/app/api/vapi/tools/`
