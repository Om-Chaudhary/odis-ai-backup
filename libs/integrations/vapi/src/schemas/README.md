# VAPI Tool Schemas

Domain-grouped Zod schemas for all VAPI tool inputs.

## Structure

```
schemas/
├── appointments.ts   # check-availability, book, cancel, reschedule
├── messaging.ts      # leave-message
├── triage.ts         # log-emergency-triage, get-er-info
├── clinical.ts       # refills, lab inquiries
├── records.ts        # medical records requests
├── billing.ts        # billing inquiries
├── info.ts           # clinic information
└── index.ts          # barrel exports
```

## Usage

```typescript
import {
  BookAppointmentSchema,
  LeaveMessageSchema,
  type BookAppointmentInput,
} from "@odis-ai/integrations/vapi/schemas";

// Validate input
const result = BookAppointmentSchema.safeParse(input);
if (!result.success) {
  // Handle validation error
}
```

## Adding New Schemas

1. Add schema to the appropriate domain file (or create a new one)
2. Export from `index.ts`
3. Create corresponding processor in `../processors/`
4. Create route handler in `apps/web/src/app/api/vapi/tools/`

## Schema Conventions

- All schemas include optional `assistant_id`, `clinic_id`, `vapi_call_id` for VAPI context
- Required fields use `.min(1, "field_name is required")` for clear error messages
- Enums are exported separately for reuse
- Types are inferred and exported: `type FooInput = z.infer<typeof FooSchema>`
