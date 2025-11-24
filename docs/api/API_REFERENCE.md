# ODIS AI Web API Reference

Complete reference documentation for the ODIS AI Web REST API.

**Version:** 1.0  
**Base URL:** `https://yourdomain.com/api`  
**Last Updated:** November 24, 2025

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints by Domain](#endpoints-by-domain)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Quick Start](#quick-start)

---

## Overview

The ODIS AI Web API provides veterinary practice management capabilities including:

- **Case Management** - Create, find, and manage veterinary cases
- **AI Entity Extraction** - Extract structured data from clinical text
- **Discharge Summaries** - AI-generated discharge summaries
- **VAPI Voice Calls** - Automated follow-up calls with pet owners
- **SOAP Notes** - Generate clinical notes
- **Email Automation** - Send discharge emails to pet owners

### API Architecture

The API uses two parallel systems:

1. **REST API** (`/api/*`) - Standard HTTP endpoints (documented here)
2. **tRPC API** (`/api/trpc/*`) - Type-safe RPC calls (internal use)

This documentation covers the REST API only.

### Response Format

All endpoints return JSON responses with a consistent structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "metadata": { ... }
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": { ... }
}
```

---

## Authentication

The API supports **two authentication methods** that are automatically detected:

### 1. Cookie-Based Auth (Web Application)

Used by the web application. Cookies are set automatically after login.

```typescript
// No special headers needed - cookies handled automatically
fetch('/api/cases/find-by-patient?patientName=Max', {
  method: 'GET',
})
```

### 2. Bearer Token Auth (Extensions & External Apps)

Used by browser extensions, mobile apps, and external integrations.

```typescript
fetch('https://yourdomain.com/api/cases/find-by-patient?patientName=Max', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${YOUR_TOKEN}`,
    'Content-Type': 'application/json',
  },
})
```

**Getting a Bearer Token:**

1. User signs in via web app or mobile app
2. Call `supabase.auth.getSession()` to retrieve access token
3. Use `session.access_token` as Bearer token

**Token Lifecycle:**

- Tokens expire after 1 hour by default
- Refresh tokens can be used to obtain new access tokens
- See [Supabase Auth documentation](https://supabase.com/docs/guides/auth) for details

### Auth Requirements

| Endpoint | Auth Required | Role Required |
|----------|---------------|---------------|
| `/api/normalize` | ✅ Yes | User |
| `/api/generate/*` | ✅ Yes | User |
| `/api/cases/*` | ✅ Yes | User |
| `/api/calls/*` | ✅ Yes | User |
| `/api/vapi/calls/*` | ✅ Yes | User |
| `/api/webhooks/*` | ❌ No (verified via signature) | N/A |

---

## Endpoints by Domain

### Cases Management

Endpoints for creating and managing veterinary cases.

#### [`POST /api/cases/ingest`](./endpoints/cases-ingest.md)

Ingest clinical data (text or structured) and create a case with entity extraction.

**Quick Example:**
```bash
curl -X POST https://yourdomain.com/api/cases/ingest \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "text",
    "source": "mobile_app",
    "text": "Max, a 5yo Golden Retriever came in for ear infection..."
  }'
```

[→ Full Documentation](./endpoints/cases-ingest.md)

---

#### [`GET /api/cases/find-by-patient`](./endpoints/cases-find-by-patient.md)

Find existing cases for a patient by name and owner.

**Quick Example:**
```bash
curl "https://yourdomain.com/api/cases/find-by-patient?patientName=Max&ownerName=John" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

[→ Full Documentation](./endpoints/cases-find-by-patient.md)

---

### AI Entity Extraction

Extract structured clinical data from any veterinary text.

#### [`POST /api/normalize`](./endpoints/normalize.md)

Extract structured entities from clinical text using AI.

**Quick Example:**
```bash
curl -X POST https://yourdomain.com/api/normalize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Max presented with vomiting and diarrhea...",
    "inputType": "transcript",
    "metadata": { "source": "mobile_app" }
  }'
```

[→ Full Documentation](./endpoints/normalize.md)

---

#### [`GET /api/normalize`](./endpoints/normalize.md#get-check-status)

Check if a case has extracted entities.

**Quick Example:**
```bash
curl "https://yourdomain.com/api/normalize?caseId=123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### AI Generation

Generate clinical documents using AI.

#### [`POST /api/generate/discharge-summary`](./endpoints/generate-discharge-summary.md)

Generate a discharge summary from case data and optionally schedule a VAPI call.

**Quick Example:**
```bash
curl -X POST https://yourdomain.com/api/generate/discharge-summary \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "case-123",
    "ownerPhone": "+14155551234",
    "vapiScheduledFor": "2025-11-25T14:00:00Z"
  }'
```

[→ Full Documentation](./endpoints/generate-discharge-summary.md)

---

#### [`POST /api/generate-soap`](./endpoints/generate-soap.md)

Generate SOAP notes from case data.

[→ Full Documentation](./endpoints/generate-soap.md)

---

#### [`POST /api/generate/discharge-email`](./endpoints/generate-discharge-email.md)

Generate a discharge email.

[→ Full Documentation](./endpoints/generate-discharge-email.md)

---

### VAPI Voice Calls

Manage automated voice calls to pet owners.

#### [`POST /api/calls/schedule`](./endpoints/calls-schedule.md)

Schedule a VAPI voice call for future execution.

**Quick Example:**
```bash
curl -X POST https://yourdomain.com/api/calls/schedule \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+14155551234",
    "petName": "Max",
    "ownerName": "John Smith",
    "callType": "discharge",
    "clinicName": "Happy Paws Vet",
    "clinicPhone": "555-123-4567",
    "emergencyPhone": "555-999-8888",
    "appointmentDate": "November 24th",
    "scheduledFor": "2025-11-25T10:00:00Z",
    "dischargeSummary": "Max was treated for..."
  }'
```

[→ Full Documentation](./endpoints/calls-schedule.md)

---

#### [`POST /api/vapi/calls/create`](./endpoints/vapi-calls-create.md)

Create a VAPI call with full knowledge base integration.

[→ Full Documentation](./endpoints/vapi-calls-create.md)

---

#### [`GET /api/vapi/calls`](./endpoints/vapi-calls-list.md)

List all VAPI calls with filtering and pagination.

**Quick Example:**
```bash
curl "https://yourdomain.com/api/vapi/calls?status=queued&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

[→ Full Documentation](./endpoints/vapi-calls-list.md)

---

#### [`GET /api/vapi/calls/[id]`](./endpoints/vapi-calls-get.md)

Get details of a specific VAPI call.

[→ Full Documentation](./endpoints/vapi-calls-get.md)

---

### Webhooks

Webhook endpoints for external service integrations.

#### [`POST /api/webhooks/vapi`](./endpoints/webhooks-vapi.md)

Receive real-time call status updates from VAPI.

**Events:**
- `status-update` - Call status changed
- `end-of-call-report` - Call ended with complete data
- `hang` - Call hung up

[→ Full Documentation](./endpoints/webhooks-vapi.md)

---

#### [`POST /api/webhooks/execute-call`](./endpoints/webhooks-execute-call.md)

QStash webhook for executing scheduled calls.

[→ Full Documentation](./endpoints/webhooks-execute-call.md)

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request body or parameters |
| `401` | Unauthorized | Authentication required or invalid token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `500` | Internal Server Error | Server-side error |

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "details": {
    "field": "Additional context",
    "errors": [
      {
        "field": "phoneNumber",
        "message": "Phone must be in E.164 format"
      }
    ]
  }
}
```

### Common Errors

#### Authentication Errors

**401 Unauthorized - Missing Token:**
```json
{
  "error": "Unauthorized: Authentication required"
}
```

**401 Unauthorized - Invalid Token:**
```json
{
  "error": "Unauthorized: Invalid or expired token"
}
```

#### Validation Errors

**400 Bad Request:**
```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "phoneNumber",
      "message": "Phone must be in E.164 format (e.g., +14155551234)"
    }
  ]
}
```

#### Not Found Errors

**404 Not Found:**
```json
{
  "error": "Case not found"
}
```

---

## Rate Limiting

Currently, rate limiting is **not enforced** at the API level. However, best practices include:

- **Batch requests** when possible
- **Cache responses** when appropriate
- **Implement exponential backoff** for retries

Future versions may implement rate limiting. Recommended limits:

- **Authenticated requests:** 100 requests/minute
- **Webhook endpoints:** 1000 requests/minute

---

## Quick Start

### 1. Get an Access Token

```typescript
// Using Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

const token = data.session?.access_token
```

### 2. Make Your First Request

```typescript
// Find cases for a patient
const response = await fetch('https://yourdomain.com/api/cases/find-by-patient?patientName=Max', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})

const data = await response.json()
console.log(data)
```

### 3. Extract Entities from Clinical Text

```typescript
const response = await fetch('https://yourdomain.com/api/normalize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    input: 'Max, a 5yo Golden Retriever, presented with vomiting and diarrhea...',
    inputType: 'transcript',
  }),
})

const data = await response.json()
console.log(data.data.entities)
```

### 4. Schedule a Follow-up Call

```typescript
const response = await fetch('https://yourdomain.com/api/calls/schedule', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phoneNumber: '+14155551234',
    petName: 'Max',
    ownerName: 'John Smith',
    callType: 'discharge',
    clinicName: 'Happy Paws Vet',
    clinicPhone: '555-123-4567',
    emergencyPhone: '555-999-8888',
    appointmentDate: 'November 24th',
    scheduledFor: '2025-11-25T10:00:00Z',
    dischargeSummary: 'Max was treated for gastroenteritis...',
  }),
})

const data = await response.json()
console.log(data.data.callId) // Use this to track call status
```

---

## Additional Resources

- [Authentication Guide](./auth-guide.md)
- [VAPI Integration Guide](../vapi/VAPI_VARIABLES_IMPLEMENTATION.md)
- [Error Handling Best Practices](./error-handling.md)
- [Chrome Extension API Guide](./chrome-extension-api-reference.md)
- [Webhook Security](./webhook-security.md)

---

## Support

For API support:
- **Documentation Issues:** Open an issue on GitHub
- **Integration Help:** Contact support@odis.ai
- **Feature Requests:** Submit via product roadmap

---

**Last Updated:** November 24, 2025  
**API Version:** 1.0

