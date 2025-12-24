---
sidebar_position: 3
title: Resend
description: Email notifications and summaries
---

# Resend Integration

ODIS AI uses Resend for transactional email delivery, including call summaries and notifications.

## Email Types

### Call Summary Emails

Sent after each call with:

- Call transcript
- AI-generated summary
- Actions taken
- Recommended follow-ups

### Daily Digest

Sent daily with:

- Total calls handled
- Appointments scheduled
- Issues flagged
- Performance metrics

### Alert Notifications

Sent immediately for:

- Failed calls
- Urgent matters
- System issues

## Configuration

### Set Up Email Notifications

1. Go to **Dashboard → Settings → Notifications**
2. Enter recipient email addresses
3. Select notification types
4. Save preferences

### API Configuration

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "ODIS AI <notifications@odis.ai>",
  to: ["clinic@example.com"],
  subject: "Call Summary: John Smith - Buddy",
  react: CallSummaryEmail({ callData }),
});
```

## Email Templates

### Call Summary Template

```tsx
// Using React Email
import { Html, Head, Body, Container, Text } from "@react-email/components";

export function CallSummaryEmail({ callData }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Call Summary for {callData.patientName}</Text>
          <Text>Duration: {callData.duration} minutes</Text>
          <Text>Summary: {callData.summary}</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

### Customizing Templates

Contact support@odis.ai to customize email templates with your clinic's branding.

## Delivery Status

Track email delivery in the dashboard:

| Status      | Description              |
| ----------- | ------------------------ |
| `sent`      | Email accepted by Resend |
| `delivered` | Email delivered to inbox |
| `opened`    | Recipient opened email   |
| `bounced`   | Email failed to deliver  |

## Best Practices

1. **Verify domain** - Set up SPF/DKIM for better deliverability
2. **Monitor bounces** - Keep email list clean
3. **Use previews** - Test templates before sending
4. **Respect preferences** - Honor unsubscribe requests
