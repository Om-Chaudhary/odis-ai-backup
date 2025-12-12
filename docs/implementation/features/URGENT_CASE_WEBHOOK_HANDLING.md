# Urgent Case Webhook Handling

## Overview

When the VAPI outbound assistant detects an urgent case during a discharge call, the system automatically:

1. **Generates an AI summary** explaining why the case was flagged as urgent
2. **Updates the parent case** with an `is_urgent` flag for dashboard filtering

This processing happens immediately when the call ends, rather than lazy-loading in the UI.

## How It Works

### VAPI Structured Output Configuration

In the VAPI Dashboard, the outbound assistant has a structured output configured:

| Field         | Type    | Description                                                                             |
| ------------- | ------- | --------------------------------------------------------------------------------------- |
| `urgent_case` | Boolean | Set to `true` when the AI agent determines the case requires immediate clinic attention |

The AI agent evaluates urgency based on:

- Owner reports concerning symptoms
- Symptoms matching emergency/urgent criteria from the knowledge base
- Pet showing signs of distress or worsening condition

### Webhook Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VAPI Call Ends                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    end-of-call-report webhook                                │
│                                                                              │
│  1. Extract structured_data from artifact.structuredOutputs                  │
│  2. Check if structured_data.urgent_case === true                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
              urgent_case                     urgent_case
               === true                        !== true
                    │                               │
                    ▼                               ▼
┌─────────────────────────────┐     ┌─────────────────────────────┐
│   handleUrgentCase()        │     │   Normal processing         │
│                             │     │   (store structured_data)   │
│ 1. Generate AI summary      │     └─────────────────────────────┘
│ 2. Store urgent_reason_     │
│    summary on call          │
│ 3. Update cases.is_urgent   │
│    = true                   │
└─────────────────────────────┘
```

## Database Schema

### scheduled_discharge_calls

| Column                  | Type  | Description                                            |
| ----------------------- | ----- | ------------------------------------------------------ |
| `structured_data`       | JSONB | Contains `{ urgent_case: boolean, ... }` from VAPI     |
| `urgent_reason_summary` | TEXT  | AI-generated summary explaining why the case is urgent |

### cases

| Column      | Type    | Description                                    |
| ----------- | ------- | ---------------------------------------------- |
| `is_urgent` | BOOLEAN | `true` if any call flagged this case as urgent |

## Code Implementation

### Key Files

| File                                                            | Purpose                                               |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| `libs/vapi/src/webhooks/handlers/end-of-call-report.ts`         | Main webhook handler with urgent case detection       |
| `libs/vapi/src/webhooks/handlers/inbound-call-helpers.ts`       | Helper to fetch call records with `case_id`           |
| `libs/ai/src/generate-urgent-summary.ts`                        | AI function to analyze transcript and explain urgency |
| `supabase/migrations/20251212000000_add_is_urgent_to_cases.sql` | Migration for `is_urgent` column                      |
| `libs/vapi/project.json`                                        | Added `ai` to implicit dependencies                   |
| `eslint.config.js`                                              | Added `scope:ai` to allowed deps for `scope:vapi`     |

### handleUrgentCase Function

```typescript
async function handleUrgentCase(
  call: VapiWebhookCall,
  existingCall: ExistingCallRecord,
  updateData: Record<string, unknown>,
  supabase: SupabaseClient,
): Promise<void> {
  // 1. Log detection
  logger.info("Urgent case detected", {
    callId: call.id,
    dbId: existingCall.id,
    caseId: existingCall.case_id,
  });

  // 2. Generate AI summary if transcript available
  if (call.transcript) {
    const urgentSummary = await generateUrgentSummary({
      transcript: call.transcript,
    });
    updateData.urgent_reason_summary = urgentSummary;
  }

  // 3. Update parent case
  if (existingCall.case_id) {
    await supabase
      .from("cases")
      .update({ is_urgent: true })
      .eq("id", existingCall.case_id);
  }
}
```

### AI Summary Generation

The `generateUrgentSummary` function uses Claude Haiku to analyze the call transcript:

**System Prompt:**

> You are an expert veterinary call analyst. Your role is to analyze discharge call transcripts and identify why a case was flagged as requiring urgent clinic attention.

**Output:** 1-2 sentence summary explaining:

- What specific concern or issue was identified
- Why this requires immediate clinic attention

**Example Output:**

> "Owner reports pet has been vomiting blood since yesterday evening and is now lethargic. This indicates potential internal bleeding or severe GI issue requiring immediate veterinary evaluation."

## UI Integration

### Dashboard Stats

The `get-stats.ts` procedure counts urgent cases:

```typescript
const isUrgentCase = callData?.structured_data?.urgent_case === true;
if (isUrgentCase) {
  needsAttention++;
}
```

### Case Detail Panel

The `UrgentReasonSection` component displays the urgent summary:

```tsx
{
  caseData.isUrgentCase && caseData.scheduledCall?.id && (
    <UrgentReasonSection callId={caseData.scheduledCall.id} />
  );
}
```

This component:

- Shows an orange "Needs Attention" card
- Displays the pre-generated `urgent_reason_summary`
- Falls back to lazy-loading via tRPC if not pre-generated

## Testing

### Manual Testing

1. Configure a test call with symptoms that should trigger urgency
2. Complete the call and verify:
   - `scheduled_discharge_calls.structured_data.urgent_case = true`
   - `scheduled_discharge_calls.urgent_reason_summary` is populated
   - `cases.is_urgent = true`

### Expected Logs

When an urgent case is detected:

```
[webhook:end-of-call-report] Urgent case detected
  callId: "abc123"
  dbId: "def456"
  caseId: "ghi789"
  hasTranscript: true

[webhook:end-of-call-report] Generated urgent case summary
  callId: "abc123"
  summaryLength: 142

[webhook:end-of-call-report] Updated case is_urgent flag
  callId: "abc123"
  caseId: "ghi789"
```

## Error Handling

| Scenario                    | Behavior                                         |
| --------------------------- | ------------------------------------------------ |
| No transcript available     | Skips summary generation, UI can lazy-load later |
| AI summary generation fails | Logs error, continues without summary            |
| No `case_id` on call record | Logs warning, case flag not updated              |
| Case update fails           | Logs error with details                          |

## Migration

### SQL Migration

```sql
-- Add is_urgent column to cases table
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS is_urgent boolean DEFAULT false;

-- Add partial index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_cases_is_urgent
ON cases (is_urgent) WHERE is_urgent = true;
```

### Applying the Migration

```bash
# Push migration to Supabase
pnpm supabase db push

# Regenerate TypeScript types
pnpm update-types
```

## Dependencies

The `vapi` library now depends on:

- `@odis-ai/ai` - For `generateUrgentSummary` function
- `@odis-ai/qstash` - For retry scheduling (existing)
- `@odis-ai/logger` - For structured logging (existing)

## Related Documentation

- [VAPI Webhook Implementation Guide](../../vapi/VAPI_WEBHOOK_IMPLEMENTATION_GUIDE.md)
- [Testing Strategy](../../testing/TESTING_STRATEGY.md)
- [AI Library](../../../libs/ai/src/generate-urgent-summary.ts)
