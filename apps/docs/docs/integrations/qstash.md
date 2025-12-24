---
sidebar_position: 2
title: QStash
description: Scheduled task execution
---

# QStash Integration

ODIS AI uses QStash by Upstash for reliable scheduled task execution and message queuing.

## Use Cases

- **Scheduled discharge calls** - Execute calls at specific times
- **Retry failed operations** - Automatic retry with backoff
- **Batch processing** - Process large datasets in chunks
- **Delayed notifications** - Send reminders after delays

## How It Works

```
Trigger Event → QStash → Delay → Webhook → ODIS AI Handler
```

## Scheduling Calls

### Immediate Execution

```typescript
import { scheduleCallExecution } from "@odis-ai/qstash";

await scheduleCallExecution({
  caseId: "case_123",
  callType: "discharge",
  executeAt: new Date(), // Now
});
```

### Delayed Execution

```typescript
// Schedule for 24 hours later
await scheduleCallExecution({
  caseId: "case_123",
  callType: "discharge",
  executeAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
});
```

### CRON Schedules

```typescript
// Every day at 9 AM
await qstash.schedules.create({
  destination: "https://api.odis.ai/cron/daily-report",
  cron: "0 9 * * *",
});
```

## Message Format

```json
{
  "messageId": "msg_abc123",
  "destination": "https://api.odis.ai/webhooks/qstash",
  "body": {
    "action": "execute_call",
    "caseId": "case_123",
    "attempt": 1
  },
  "headers": {
    "Content-Type": "application/json",
    "X-ODIS-Signature": "..."
  }
}
```

## Retry Configuration

QStash automatically retries failed deliveries:

| Attempt | Delay      |
| ------- | ---------- |
| 1       | Immediate  |
| 2       | 10 seconds |
| 3       | 1 minute   |
| 4       | 10 minutes |
| 5       | 1 hour     |

### Custom Retry

```typescript
await qstash.publishJSON({
  url: "https://api.odis.ai/process",
  body: { data: "..." },
  retries: 5,
  delay: "30s",
});
```

## Monitoring

View scheduled tasks and delivery status in the Upstash dashboard or via API:

```typescript
// List pending messages
const messages = await qstash.messages.list();

// Get message status
const status = await qstash.messages.get("msg_abc123");
```

## Security

All QStash webhooks are verified using signatures:

```typescript
import { verifySignature } from "@upstash/qstash/nextjs";

export const POST = verifySignature(async (req) => {
  // Request is verified
  const body = await req.json();
  // Process...
});
```
