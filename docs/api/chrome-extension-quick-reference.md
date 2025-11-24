# Chrome Extension API Quick Reference

Quick reference card for Chrome extension developers.

## Authentication

```javascript
// Get token
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

// Use in requests
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
}
```

## Endpoints Summary

| Endpoint                 | Method | Auth | Admin | Purpose                  |
| ------------------------ | ------ | ---- | ----- | ------------------------ |
| `/api/generate-soap`     | POST   | ✅   | ✅    | Generate SOAP notes      |
| `/api/calls/schedule`    | POST   | ✅   | ✅    | Schedule call (legacy)   |
| `/api/vapi/schedule`     | POST   | ✅   | ✅    | Schedule call (enhanced) |
| `/api/vapi/calls/create` | POST   | ✅   | ❌    | Create call (any user)   |
| `/api/vapi/calls`        | GET    | ✅   | ❌    | List calls               |
| `/api/vapi/calls/[id]`   | GET    | ✅   | ❌    | Get call status          |

## Common Request Patterns

### Schedule Discharge Call

```javascript
POST /api/vapi/schedule
{
  phoneNumber: "+14155551234",
  petName: "Max",
  ownerName: "John Smith",
  clinicName: "Happy Paws",
  agentName: "Sarah",
  clinicPhone: "five five five, one two three, four five six seven",
  emergencyPhone: "five five five, nine nine nine, eight eight eight eight",
  appointmentDate: "January fifteenth, twenty twenty five",
  callType: "discharge",
  dischargeSummary: "...",
  subType: "wellness",
  scheduledFor: new Date(Date.now() + 3600000).toISOString()
}
```

### Schedule Follow-up Call

```javascript
POST /api/vapi/schedule
{
  phoneNumber: "+14155551234",
  petName: "Max",
  ownerName: "John Smith",
  clinicName: "Happy Paws",
  agentName: "Sarah",
  clinicPhone: "five five five, one two three, four five six seven",
  emergencyPhone: "five five five, nine nine nine, eight eight eight eight",
  appointmentDate: "January fifteenth, twenty twenty five",
  callType: "follow-up",
  dischargeSummary: "...",
  condition: "ear infection",
  conditionCategory: "dermatological",
  medications: "Ear drops twice daily",
  recheckDate: "January thirtieth, twenty twenty five"
}
```

## Condition Categories

```typescript
"gastrointestinal" |
  "post-surgical" |
  "dermatological" |
  "respiratory" |
  "urinary" |
  "orthopedic" |
  "neurological" |
  "ophthalmic" |
  "cardiac" |
  "endocrine" |
  "dental" |
  "wound-care" |
  "behavioral" |
  "pain-management" |
  "general";
```

## Call Statuses

```typescript
"queued" | "in-progress" | "ended" | "failed";
```

## Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Format Requirements

- **Phone Numbers**: E.164 format (`+14155551234`)
- **Spelled Phone Numbers**: Spelled out (`"five five five, one two three..."`)
- **Dates**: Spelled out (`"January fifteenth, twenty twenty five"`)
- **Scheduled Times**: ISO 8601 (`"2025-01-15T14:30:00Z"`)

## Response Structure

````typescript
// Success
{
  success: true,
  data: { /* ... */ }
}

// Error
{
  error: "Error message",
  message?: "Additional details",
  errors?: [{ field: string, message: string }]
}```

````
