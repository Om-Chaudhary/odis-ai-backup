---
sidebar_position: 3
title: tRPC Routes
description: Type-safe API routes for internal use
---

# tRPC Routes

ODIS AI uses tRPC for type-safe internal API communication between the frontend and backend.

:::info
This documentation is for developers working on the ODIS AI platform itself.
For external API access, see the [REST API](/api/overview).
:::

## Architecture

```
Frontend (React) → tRPC Client → tRPC Server → Database
```

## Available Routers

### Dashboard Router

Handles dashboard-related queries and mutations.

```typescript
// Get dashboard statistics
const stats = await trpc.dashboard.getStats.query({
  clinicId: "clinic_123",
  dateRange: { start: "2024-01-01", end: "2024-01-31" }
});

// Response
{
  totalCalls: 1500,
  completedCalls: 1420,
  averageDuration: 180,
  appointmentsScheduled: 320
}
```

### Cases Router

Manages patient cases and discharge workflows.

```typescript
// Create a new case
const newCase = await trpc.cases.create.mutate({
  patientId: "patient_456",
  visitType: "surgery",
  dischargeInstructions: "...",
  medications: [...]
});

// List cases with filters
const cases = await trpc.cases.list.query({
  status: "pending_discharge",
  limit: 20
});
```

### Calls Router

Query and manage call data.

```typescript
// Get call details with transcript
const call = await trpc.calls.getById.query({
  callId: "call_789",
});

// Initiate outbound call
const result = await trpc.calls.initiateOutbound.mutate({
  caseId: "case_123",
  phoneNumber: "+15551234567",
  agentType: "discharge",
});
```

## Authentication

All tRPC routes use protected procedures requiring authentication:

```typescript
// Server-side procedure definition
export const dashboardRouter = router({
  getStats: protectedProcedure
    .input(
      z.object({
        clinicId: z.string(),
        dateRange: dateRangeSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      // ctx.user is available from session
      return getDashboardStats(input);
    }),
});
```

## Error Handling

tRPC errors are typed and include:

```typescript
throw new TRPCError({
  code: "NOT_FOUND",
  message: "Case not found",
  cause: originalError,
});
```

Error codes:

- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Not authorized for this action
- `NOT_FOUND` - Resource doesn't exist
- `BAD_REQUEST` - Invalid input
- `INTERNAL_SERVER_ERROR` - Server error
