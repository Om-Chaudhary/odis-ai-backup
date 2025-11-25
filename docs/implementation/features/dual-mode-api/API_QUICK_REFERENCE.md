# Dual-Mode API Quick Reference

**Quick reference card for developers integrating with the orchestration endpoint.**

---

## Endpoint

```
POST /api/discharge/orchestrate
```

## Authentication

```javascript
// Bearer Token (Extension)
headers: {
  'Authorization': `Bearer ${supabaseToken}`,
  'Content-Type': 'application/json',
}

// Cookies (Web App)
// Cookies sent automatically by browser
```

## Minimal Request

```json
{
  "input": {
    "rawData": {
      "mode": "text",
      "source": "idexx_extension",
      "text": "Patient: Max, Dog..."
    }
  },
  "steps": {
    "ingest": true,
    "generateSummary": true
  }
}
```

## Full Request Example

```json
{
  "input": {
    "rawData": {
      "mode": "text",
      "source": "idexx_extension",
      "text": "Patient: Max, Dog, 5 years..."
    }
  },
  "steps": {
    "ingest": true,
    "generateSummary": true,
    "prepareEmail": true,
    "scheduleEmail": {
      "recipientEmail": "owner@example.com"
    },
    "scheduleCall": {
      "phoneNumber": "+14155551234"
    }
  },
  "options": {
    "parallel": true,
    "stopOnError": false
  }
}
```

## Response Structure

```typescript
{
  success: boolean;
  data: {
    completedSteps: string[];
    failedSteps: string[];
    skippedSteps: string[];
    ingestion?: { caseId: string; entities: {...} };
    summary?: { summaryId: string; content: string };
    email?: { subject: string; html: string; text: string };
    emailSchedule?: { emailId: string; scheduledFor: string };
    call?: { callId: string; scheduledFor: string };
  };
  metadata: {
    totalProcessingTime: number;
    stepTimings: Record<string, number>;
    errors?: Array<{ step: string; error: string }>;
  };
}
```

## Step Dependencies

```
ingest → generateSummary → prepareEmail → scheduleEmail
                              ↓
                         scheduleCall (parallel with scheduleEmail)
```

## Step Configuration

| Step              | Config Type                                                    | Required Fields  |
| ----------------- | -------------------------------------------------------------- | ---------------- |
| `ingest`          | `boolean \| { options?: {...} }`                               | None             |
| `generateSummary` | `boolean \| { templateId?: string }`                           | None             |
| `prepareEmail`    | `boolean \| { templateId?: string }`                           | None             |
| `scheduleEmail`   | `boolean \| { recipientEmail: string, scheduledFor?: string }` | `recipientEmail` |
| `scheduleCall`    | `boolean \| { phoneNumber: string, scheduledFor?: string }`    | `phoneNumber`    |

## Common Patterns

### Pattern 1: Full Workflow

```json
{
  "steps": {
    "ingest": true,
    "generateSummary": true,
    "prepareEmail": true,
    "scheduleEmail": { "recipientEmail": "..." },
    "scheduleCall": { "phoneNumber": "..." }
  }
}
```

### Pattern 2: Generate Email Only

```json
{
  "input": {
    "existingCase": { "caseId": "...", "summaryId": "..." }
  },
  "steps": {
    "ingest": false,
    "generateSummary": false,
    "prepareEmail": true
  }
}
```

### Pattern 3: Ingest Only

```json
{
  "steps": {
    "ingest": true
  }
}
```

## Error Codes

| Status | Meaning                         |
| ------ | ------------------------------- |
| `200`  | Success (may have failed steps) |
| `400`  | Validation error                |
| `401`  | Authentication required         |
| `500`  | Internal server error           |

## CORS Origins

- `https://us.idexxneo.com`
- `https://ca.idexxneo.com`
- `https://uk.idexxneo.com`
- `https://*.idexxneocloud.com`
- `https://neo.vet`
- `https://*.neosuite.com`

## JavaScript Example

```javascript
const response = await fetch("/api/discharge/orchestrate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    input: {
      rawData: {
        mode: "text",
        source: "idexx_extension",
        text: "Patient: Max...",
      },
    },
    steps: {
      ingest: true,
      generateSummary: true,
    },
  }),
});

const result = await response.json();
if (result.success) {
  console.log("Case ID:", result.data.ingestion?.caseId);
}
```

## TypeScript Types

```typescript
import type { OrchestrationRequest } from "~/lib/validators/orchestration";
import type { OrchestrationResult } from "~/types/orchestration";
```

---

**Full Documentation:** [API_CONTRACT.md](./API_CONTRACT.md)
