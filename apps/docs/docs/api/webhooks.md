---
sidebar_position: 2
title: Webhooks
description: Real-time event notifications
---

# Webhooks

Receive real-time notifications when events occur in your ODIS AI account.

## Setting Up Webhooks

### Via Dashboard

1. Go to **Settings → Webhooks**
2. Click **Add Webhook**
3. Enter your endpoint URL
4. Select events to subscribe to
5. Click **Save**

### Via API

```bash
curl -X POST https://api.odis.ai/v1/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhooks/odis",
    "events": ["call.started", "call.ended"],
    "secret": "your_webhook_secret"
  }'
```

## Webhook Events

### call.started

Triggered when a call begins.

```json
{
  "event": "call.started",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "call_id": "call_abc123",
    "direction": "inbound",
    "from": "+15551234567",
    "to": "+15559876543",
    "agent_id": "agent_xyz"
  }
}
```

### call.ended

Triggered when a call ends.

```json
{
  "event": "call.ended",
  "timestamp": "2024-01-15T10:35:00Z",
  "data": {
    "call_id": "call_abc123",
    "duration_seconds": 300,
    "status": "completed",
    "transcript": "...",
    "summary": "Customer called to schedule appointment for dog checkup.",
    "sentiment": "positive",
    "actions": [
      {
        "type": "appointment_scheduled",
        "details": {
          "date": "2024-01-20",
          "time": "14:00",
          "type": "wellness_exam"
        }
      }
    ]
  }
}
```

### appointment.created

Triggered when an appointment is scheduled.

```json
{
  "event": "appointment.created",
  "timestamp": "2024-01-15T10:32:00Z",
  "data": {
    "appointment_id": "appt_def456",
    "call_id": "call_abc123",
    "client_name": "John Smith",
    "patient_name": "Buddy",
    "date": "2024-01-20",
    "time": "14:00",
    "type": "wellness_exam"
  }
}
```

## Webhook Security

### Signature Verification

Each webhook includes a signature header for verification:

```
X-ODIS-Signature: sha256=abc123...
```

Verify in your server:

```typescript
import crypto from "crypto";

function verifyWebhook(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return `sha256=${expected}` === signature;
}
```

### IP Allowlist

Webhook requests originate from these IPs:

- `52.123.45.67`
- `52.123.45.68`

## Retry Policy

Failed webhook deliveries are retried:

| Attempt | Delay      |
| ------- | ---------- |
| 1       | Immediate  |
| 2       | 1 minute   |
| 3       | 5 minutes  |
| 4       | 30 minutes |
| 5       | 2 hours    |

After 5 failed attempts, the webhook is disabled and you'll receive an email notification.
