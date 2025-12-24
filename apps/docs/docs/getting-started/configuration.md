---
sidebar_position: 3
title: Configuration
description: Customize your ODIS AI voice agent
---

# Configuration

Learn how to configure and customize your ODIS AI voice agent for your clinic's specific needs.

## Agent Settings

### Voice and Personality

Configure how your AI agent sounds and behaves:

| Setting       | Description               | Options                              |
| ------------- | ------------------------- | ------------------------------------ |
| Voice         | The voice model used      | Sarah, Alex, Jordan (more available) |
| Tone          | Communication style       | Professional, Friendly, Warm         |
| Speaking Rate | How fast the agent speaks | Slow, Normal, Fast                   |

### Business Hours

Set when your AI agent should handle calls:

```json
{
  "timezone": "America/Los_Angeles",
  "schedule": {
    "monday": { "start": "08:00", "end": "18:00" },
    "tuesday": { "start": "08:00", "end": "18:00" },
    "wednesday": { "start": "08:00", "end": "18:00" },
    "thursday": { "start": "08:00", "end": "18:00" },
    "friday": { "start": "08:00", "end": "17:00" },
    "saturday": { "start": "09:00", "end": "14:00" },
    "sunday": null
  }
}
```

### Call Handling

Configure how different call types are handled:

- **Inbound Calls** - New inquiries, appointment requests
- **Overflow Calls** - When staff lines are busy
- **After-Hours** - Calls outside business hours
- **Emergency Routing** - Urgent calls that need immediate human attention

## Customizing Responses

### Clinic Information

Provide details about your clinic that the agent can use:

- Clinic name and location
- Services offered
- Pricing (if applicable)
- Veterinarian names and specialties
- Operating hours

### Custom Prompts

Create custom responses for common scenarios:

```markdown
## Greeting

"Thank you for calling [Clinic Name]. This is ODIS, your AI assistant.
How can I help you today?"

## After Hours

"Our clinic is currently closed. Our regular hours are [hours].
For emergencies, please call [emergency number]."

## Transfer to Staff

"Let me connect you with one of our team members.
Please hold for just a moment."
```

## Advanced Settings

### Webhook Configuration

Set up webhooks to receive real-time notifications:

```typescript
// Webhook payload example
{
  "event": "call.completed",
  "call_id": "call_abc123",
  "duration": 180,
  "transcript": "...",
  "summary": "...",
  "actions": [
    { "type": "appointment_scheduled", "details": {...} }
  ]
}
```

### Knowledge Base

Upload documents to enhance your agent's knowledge:

- Service descriptions
- FAQ documents
- Pricing sheets
- Staff bios

## Next Steps

- [Set up IDEXX integration](/integrations/idexx)
- [Configure discharge calls](/guides/discharge-calls)
- [API documentation](/api)
