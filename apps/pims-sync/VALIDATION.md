# Request Validation Setup

This document explains how to apply Zod validation middleware to pims-sync API routes.

## Overview

Phase 5 of the refactoring plan created:
- **Schemas**: `src/schemas/sync.schema.ts` and `src/schemas/appointments.schema.ts`
- **Middleware**: `src/middleware/validate.ts`

These are ready to be applied to route handlers for type-safe request validation.

## How to Apply Validation

### Sync Routes (`src/routes/sync.route.ts`)

Add validation middleware to each endpoint:

```typescript
import { validate } from "../middleware/validate";
import {
  inboundSyncSchema,
  caseSyncSchema,
  reconciliationSchema,
  fullSyncSchema,
} from "../schemas/sync.schema";

// Inbound sync
router.post("/inbound", validate(inboundSyncSchema), (req: Request, res: Response) => {
  void handleInboundSync(req as AuthenticatedRequest, res);
});

// Case sync
router.post("/cases", validate(caseSyncSchema), (req: Request, res: Response) => {
  void handleCaseSync(req as AuthenticatedRequest, res);
});

// Reconciliation
router.post("/reconcile", validate(reconciliationSchema), (req: Request, res: Response) => {
  void handleReconciliation(req as AuthenticatedRequest, res);
});

// Full sync
router.post("/full", validate(fullSyncSchema), (req: Request, res: Response) => {
  void handleFullSync(req as AuthenticatedRequest, res);
});
```

### Appointment Routes (`src/routes/appointments.route.ts`)

```typescript
import { validate } from "../middleware/validate";
import {
  searchPatientSchema,
  createAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
} from "../schemas/appointments.schema";

// Patient search
router.post("/search-patient", validate(searchPatientSchema), (req: Request, res: Response) => {
  void handleSearchPatient(req as AuthenticatedRequest, res);
});

// Create appointment
router.post("/create", validate(createAppointmentSchema), (req: Request, res: Response) => {
  void handleCreateAppointment(req as AuthenticatedRequest, res);
});

// Cancel appointment
router.post("/cancel", validate(cancelAppointmentSchema), (req: Request, res: Response) => {
  void handleCancelAppointment(req as AuthenticatedRequest, res);
});

// Reschedule appointment
router.post("/reschedule", validate(rescheduleAppointmentSchema), (req: Request, res: Response) => {
  void handleRescheduleAppointment(req as AuthenticatedRequest, res);
});
```

## Benefits

1. **Type Safety**: Request bodies are validated and typed
2. **Error Handling**: Consistent validation error responses (400 with detailed error messages)
3. **Documentation**: Schemas serve as API documentation
4. **Coercion**: Zod automatically coerces types (e.g., string numbers to actual numbers)

## Validation Error Response Format

When validation fails, the middleware returns:

```json
{
  "success": false,
  "error": "Validation failed",
  "validationErrors": [
    {
      "field": "date",
      "message": "Must be YYYY-MM-DD format"
    },
    {
      "field": "startTime",
      "message": "Must be HH:MM format"
    }
  ],
  "durationMs": 3,
  "timestamp": "2026-01-26T12:00:00.000Z"
}
```

## Handler Changes

After validation middleware is applied, you can remove manual validation in handlers:

### Before (Manual Validation)
```typescript
if (!body.date || !body.startTime || !body.reason) {
  res.status(400).json({
    success: false,
    error: "date, startTime, and reason are required",
    timestamp: new Date().toISOString(),
  });
  return;
}
```

### After (Validation Middleware Handles It)
```typescript
// No manual validation needed - middleware ensures valid data
const { date, startTime, reason } = req.body; // Typed and validated!
```

## Schema Customization

To add or modify validation rules, edit the schema files:

- **Sync schemas**: `src/schemas/sync.schema.ts`
- **Appointment schemas**: `src/schemas/appointments.schema.ts`

Schemas are fully typed and support:
- String patterns (regex)
- Number ranges (min/max)
- Enum values
- Optional vs required fields
- Custom refinements (cross-field validation)
- Default values
