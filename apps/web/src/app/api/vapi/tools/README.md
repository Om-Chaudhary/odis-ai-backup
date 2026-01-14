# VAPI Tool Routes

Domain-grouped API routes for VAPI tool calls.

## Structure

```
tools/
├── appointments/                    # Appointment-related tools
│   ├── check-availability/route.ts  # Check slot availability
│   └── book/route.ts                # Book appointment
├── messaging/                       # Messaging-related tools
│   └── leave-message/route.ts       # Log callback request
├── triage/                          # Triage-related tools
│   └── log-emergency/route.ts       # Log emergency triage
└── README.md
```

## Endpoints

| Tool               | Endpoint                                          | Method |
| ------------------ | ------------------------------------------------- | ------ |
| Check Availability | `/api/vapi/tools/appointments/check-availability` | POST   |
| Book Appointment   | `/api/vapi/tools/appointments/book`               | POST   |
| Leave Message      | `/api/vapi/tools/messaging/leave-message`         | POST   |
| Log Emergency      | `/api/vapi/tools/triage/log-emergency`            | POST   |

## Route Pattern

All routes are thin wrappers using the `createToolHandler` factory:

```typescript
import { createToolHandler } from "@odis-ai/integrations/vapi/core";
import { BookAppointmentSchema } from "@odis-ai/integrations/vapi/schemas";
import { processBookAppointment } from "@odis-ai/integrations/vapi/processors";

const handler = createToolHandler({
  name: "book-appointment",
  schema: BookAppointmentSchema,
  processor: processBookAppointment,
});

export const { POST, OPTIONS } = handler;
```

## Adding New Tools

1. Create schema in `libs/integrations/vapi/src/schemas/`
2. Create processor in `libs/integrations/vapi/src/processors/`
3. Create route handler here following the pattern above
4. Update VAPI dashboard with new endpoint URL

## Health Checks

All tools support GET requests for health checks:

```bash
curl https://your-domain/api/vapi/tools/appointments/book
```

Returns tool metadata including required/optional fields.
