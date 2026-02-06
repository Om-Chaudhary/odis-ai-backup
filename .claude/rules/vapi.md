---
paths:
  - "libs/integrations/vapi/**"
  - "apps/web/src/app/api/webhooks/vapi/**"
  - "apps/web/src/app/api/calls/**"
  - "apps/web/src/app/api/vapi/**"
---

# VAPI Voice AI Integration

## Library Structure (`libs/integrations/vapi/src/`)

- `client.ts` + `client/` -- VapiClient wrapper, phone call creation
- `extract-variables.ts` -- Dynamic variable extraction from case data
- `assistant-manager/` -- Assistant configuration management
- `inbound-calls.ts` + `inbound-tools/` -- Inbound call handling and tools
- `knowledge-base/` -- Knowledge base integration
- `prompts/` -- Prompt templates by call type
- `schemas/` -- Zod schemas by domain (appointments, triage, etc.)
- `processors/` -- Tool call processors by domain
- `webhooks/` -- Webhook handlers, tools (registry + executor), background-jobs, utils (status-mapper, retry-scheduler, cost-calculator, call-enricher)
- `request-queue.ts` -- Rate-limited request queuing

## Call Flow

1. Schedule: `POST /api/calls/schedule`
2. Execute: QStash triggers execution via VAPI SDK
3. Track: Webhook events at `/api/webhooks/vapi`

## Dynamic Variables

Passed via `assistantOverrides.variableValues`: pet_name, owner_name, clinic_name, clinic_phone, call_type (`"discharge"` | `"follow-up"`), discharge_summary_content.

## Retry Logic

Failed calls retry with exponential backoff. Conditions: dial-busy, dial-no-answer, voicemail. Max 3 attempts, backoff: 5, 10, 20 minutes. See `webhooks/utils/retry-scheduler.ts`.

## Tool Processing

Tool calls use registry pattern at `webhooks/tools/registry.ts`. Built-in tools and domain-specific processors in `processors/`.
