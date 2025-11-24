# Chrome Extension API Reference

Complete API documentation for Chrome extensions consuming the ODIS AI Next.js API.

## Table of Contents

1. [Authentication](#authentication)
2. [Base URL](#base-url)
3. [REST API Endpoints](#rest-api-endpoints)
4. [tRPC Endpoints](#trpc-endpoints)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

---

## Authentication

All API requests require authentication using a **Bearer token** in the `Authorization` header.

### Getting an Access Token

The Chrome extension should obtain an access token from Supabase Auth:

```javascript
// Example: Get access token from Supabase
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("YOUR_SUPABASE_URL", "YOUR_SUPABASE_ANON_KEY");

// Sign in user
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password",
});

// Get access token
const accessToken = data.session.access_token;
```

### Using the Token

Include the token in all API requests:

```javascript
const response = await fetch("https://your-domain.com/api/endpoint", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    /* ... */
  }),
});
```

### Token Refresh

Access tokens expire. Implement token refresh logic:

```javascript
// Check if token is expired
const {
  data: { session },
} = await supabase.auth.getSession();

if (!session || isTokenExpired(session.expires_at)) {
  const { data, error } = await supabase.auth.refreshSession();
  if (data.session) {
    accessToken = data.session.access_token;
  }
}
```

---

## Base URL

All API endpoints are relative to your Next.js application base URL:

```
Production: https://your-domain.com
Development: http://localhost:3000
```

---

## REST API Endpoints

### 1. Generate SOAP Notes

Generate SOAP notes from veterinary transcription text.

**Endpoint:** `POST /api/generate-soap`

**Authentication:** Required (Bearer token)

**Authorization:** Admin role required

**Request Body:**

```typescript
{
  transcription: string;           // Veterinary transcription text
  template_id?: string;            // Optional template ID
  user_id: string;                 // User ID
  overrides?: {                    // Optional template overrides
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    clientInstructions?: string;
  }
}
```

**Response (200 OK):**

```typescript
{
  subjective: string; // Generated subjective section
  objective: string; // Generated objective section
  assessment: string; // Generated assessment section
  plan: string; // Generated plan section
  clientInstructions: string; // Generated client instructions
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User does not have admin role
- `500 Internal Server Error` - Server error or Supabase Edge Function error

**Example:**

```javascript
const response = await fetch("https://your-domain.com/api/generate-soap", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    transcription: "Patient presented with limping on right front leg...",
    user_id: "user-uuid-here",
    template_id: "optional-template-id",
  }),
});

const data = await response.json();
```

---

### 2. Schedule VAPI Call (Legacy)

Schedule a VAPI call for future execution. This endpoint uses the legacy Retell-based schema.

**Endpoint:** `POST /api/calls/schedule`

**Authentication:** Required (Bearer token)

**Authorization:** Admin role required

**Request Body:**

```typescript
{
  // Contact information
  phoneNumber: string;            // E.164 format (e.g., "+14155551234")

  // Core patient/appointment details (REQUIRED)
  petName: string;                 // Pet name
  ownerName: string;                // Owner name
  appointmentDate: string;         // Spelled out date (e.g., "January tenth, twenty twenty five")

  // Call type configuration (REQUIRED)
  callType: "discharge" | "follow-up";

  // Clinic information (REQUIRED)
  agentName?: string;              // AI agent name (default: "Sarah")
  clinicName: string;               // Clinic name
  clinicPhone: string;              // Spelled out phone number
  emergencyPhone: string;           // Spelled out emergency phone number

  // Clinical details (REQUIRED)
  dischargeSummary: string;         // Discharge summary content

  // Conditional fields based on call type
  subType?: "wellness" | "vaccination";  // Required for discharge calls
  condition?: string;                     // Required for follow-up calls

  // Follow-up instructions (OPTIONAL)
  nextSteps?: string;
  vetName?: string;
  medications?: string;
  recheckDate?: string;            // Spelled out date

  // Scheduling
  scheduledFor?: string;           // ISO 8601 datetime string (must be in future)
  notes?: string;
  metadata?: Record<string, unknown>;
}
```

**Response (200 OK):**

```typescript
{
  success: true;
  data: {
    callId: string; // Database ID of the scheduled call
    scheduledFor: string; // ISO 8601 datetime string
    qstashMessageId: string; // QStash message ID for tracking
    petName: string;
    ownerName: string;
    phoneNumber: string;
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation error (check `error` field for details)
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User does not have admin role
- `500 Internal Server Error` - Server error

**Example:**

```javascript
const response = await fetch("https://your-domain.com/api/calls/schedule", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    phoneNumber: "+14155551234",
    petName: "Max",
    ownerName: "John Smith",
    appointmentDate: "January fifteenth, twenty twenty five",
    callType: "discharge",
    clinicName: "Happy Paws Veterinary",
    clinicPhone: "five five five, one two three, four five six seven",
    emergencyPhone: "five five five, nine nine nine, eight eight eight eight",
    dischargeSummary: "Patient underwent routine wellness exam...",
    subType: "wellness",
    scheduledFor: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  }),
});

const data = await response.json();
```

---

### 3. Schedule VAPI Call (Enhanced)

Schedule a VAPI call with enhanced knowledge base integration. This is the recommended endpoint for new integrations.

**Endpoint:** `POST /api/vapi/schedule`

**Authentication:** Required (Bearer token)

**Authorization:** Admin role required

**Request Body:**

```typescript
{
  // Customer information
  phoneNumber: string;             // E.164 format (e.g., "+14155551234")
  petName: string;
  ownerName: string;

  // Clinic information
  clinicName: string;
  agentName: string;               // Vet tech name
  clinicPhone: string;              // Spelled out
  emergencyPhone?: string;          // Spelled out (defaults to clinicPhone)

  // Appointment information
  appointmentDate: string;          // Spelled out (e.g., "November eighth")
  callType: "discharge" | "follow-up";
  dischargeSummary: string;

  // Discharge-specific fields
  subType?: "wellness" | "vaccination";
  nextSteps?: string;

  // Follow-up specific fields
  condition?: string;
  conditionCategory?:
    | "gastrointestinal"
    | "post-surgical"
    | "dermatological"
    | "respiratory"
    | "urinary"
    | "orthopedic"
    | "neurological"
    | "ophthalmic"
    | "cardiac"
    | "endocrine"
    | "dental"
    | "wound-care"
    | "behavioral"
    | "pain-management"
    | "general";
  medications?: string;
  recheckDate?: string;            // Spelled out

  // Optional metadata
  petSpecies?: "dog" | "cat" | "other";
  petAge?: number;                 // 0-30
  petWeight?: number;              // 0-300 (lbs/kg)
  daysSinceTreatment?: number;     // 0-365

  // Scheduling
  scheduledFor?: string;           // ISO 8601 datetime string

  // Optional overrides
  assistantId?: string;
  phoneNumberId?: string;

  // Additional metadata
  notes?: string;
  metadata?: Record<string, unknown>;
}
```

**Response (200 OK):**

```typescript
{
  success: true;
  data: {
    callId: string;                // Database ID
    scheduledFor: string;           // ISO 8601 datetime
    qstashMessageId: string;        // QStash message ID
    petName: string;
    ownerName: string;
    phoneNumber: string;
    phoneNumberFormatted: string;   // Formatted for display
    warnings?: string[];             // Validation warnings
  };
}
```

**Error Responses:**

- `400 Bad Request` - Validation error (check `error` and `details` fields)
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User does not have admin role
- `500 Internal Server Error` - Server error or missing VAPI configuration

**Example:**

```javascript
const response = await fetch("https://your-domain.com/api/vapi/schedule", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    phoneNumber: "+14155551234",
    petName: "Max",
    ownerName: "John Smith",
    clinicName: "Happy Paws Veterinary",
    agentName: "Sarah",
    clinicPhone: "five five five, one two three, four five six seven",
    emergencyPhone: "five five five, nine nine nine, eight eight eight eight",
    appointmentDate: "January fifteenth, twenty twenty five",
    callType: "follow-up",
    dischargeSummary: "Patient presented with ear infection...",
    condition: "ear infection",
    conditionCategory: "dermatological",
    medications: "Ear drops twice daily",
    recheckDate: "January thirtieth, twenty twenty five",
    petSpecies: "dog",
    petAge: 5,
    scheduledFor: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
  }),
});

const data = await response.json();
```

---

### 4. Create VAPI Call

Create a new VAPI call with full knowledge base integration. The call will be processed asynchronously.

**Endpoint:** `POST /api/vapi/calls/create`

**Authentication:** Required (Bearer token)

**Authorization:** Authenticated user (no admin required)

**Request Body:**

```typescript
{
  // Core required fields
  clinicName: string;
  agentName: string;
  petName: string;
  ownerName: string;
  ownerPhone: string;               // E.164 format
  appointmentDate: string;           // Spelled out
  callType: "discharge" | "follow-up";
  clinicPhone: string;              // Spelled out
  emergencyPhone: string;            // Spelled out
  dischargeSummary: string;

  // Optional discharge fields
  subType?: "wellness" | "vaccination";
  nextSteps?: string;

  // Optional follow-up fields
  condition?: string;               // Required if callType is "follow-up"
  conditionCategory?: string;       // See conditionCategory enum above
  medications?: string;
  recheckDate?: string;             // Spelled out

  // Optional metadata
  petSpecies?: "dog" | "cat" | "other";
  petAge?: number;                 // 0-30
  petWeight?: number;              // 0-300
  daysSinceTreatment?: number;     // 0-365

  // Call scheduling
  scheduledFor?: string;           // ISO 8601 datetime string

  // VAPI configuration overrides
  assistantId?: string;
  phoneNumberId?: string;
}
```

**Response (201 Created):**

```typescript
{
  success: true;
  data: {
    callId: string;                 // Database ID
    status: string;                 // Initial status (usually "queued")
    scheduledFor?: string;         // ISO 8601 datetime if scheduled
    message: string;                // Human-readable message
  };
  warnings?: string[];              // Validation warnings
}
```

**Error Responses:**

- `400 Bad Request` - Validation error (check `error` and `errors` fields)
- `401 Unauthorized` - Missing or invalid authentication token
- `500 Internal Server Error` - Server error

**Example:**

```javascript
const response = await fetch("https://your-domain.com/api/vapi/calls/create", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    clinicName: "Happy Paws Veterinary",
    agentName: "Sarah",
    petName: "Max",
    ownerName: "John Smith",
    ownerPhone: "+14155551234",
    appointmentDate: "January fifteenth, twenty twenty five",
    callType: "discharge",
    clinicPhone: "five five five, one two three, four five six seven",
    emergencyPhone: "five five five, nine nine nine, eight eight eight eight",
    dischargeSummary: "Patient underwent routine wellness exam...",
    subType: "wellness",
  }),
});

const data = await response.json();
```

---

### 5. List VAPI Calls

List all VAPI calls for the authenticated user with optional filtering.

**Endpoint:** `GET /api/vapi/calls`

**Authentication:** Required (Bearer token)

**Authorization:** Authenticated user (sees only their own calls)

**Query Parameters:**

```typescript
{
  status?: string;                 // Filter by status (e.g., 'queued', 'in-progress', 'ended')
  conditionCategory?: string;       // Filter by condition category
  limit?: number;                  // Max results (default: 50, max: 100)
  offset?: number;                  // Pagination offset (default: 0)
}
```

**Response (200 OK):**

```typescript
{
  success: true;
  data: Array<{
    id: string; // Database ID
    user_id: string;
    assistant_id: string;
    phone_number_id: string;
    customer_phone: string;
    vapi_call_id?: string; // VAPI call ID (if call started)
    status: string; // queued | in-progress | ended | failed
    scheduled_for?: string; // ISO 8601 datetime
    dynamic_variables: Record<string, unknown>;
    condition_category?: string;
    knowledge_base_used?: string;
    transcript?: string;
    recording_url?: string;
    cost?: number;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  }>;
  pagination: {
    limit: number;
    offset: number;
    count: number; // Number of results returned
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing or invalid authentication token
- `500 Internal Server Error` - Server error

**Example:**

```javascript
const response = await fetch(
  "https://your-domain.com/api/vapi/calls?status=in-progress&limit=25&offset=0",
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  },
);

const data = await response.json();
```

---

### 6. Get VAPI Call Status

Get the status and details of a specific VAPI call by its database ID.

**Endpoint:** `GET /api/vapi/calls/[id]`

**Authentication:** Required (Bearer token)

**Authorization:** Authenticated user (can only view their own calls)

**Path Parameters:**

- `id` (string) - Database ID of the call

**Response (200 OK):**

```typescript
{
  success: true;
  data: {
    id: string;
    user_id: string;
    assistant_id: string;
    phone_number_id: string;
    customer_phone: string;
    vapi_call_id?: string;
    status: string;
    scheduled_for?: string;
    dynamic_variables: Record<string, unknown>;
    condition_category?: string;
    knowledge_base_used?: string;
    transcript?: string;
    recording_url?: string;
    cost?: number;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  };
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Call not found or user doesn't have permission
- `500 Internal Server Error` - Server error

**Example:**

```javascript
const callId = "call-uuid-here";
const response = await fetch(
  `https://your-domain.com/api/vapi/calls/${callId}`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  },
);

const data = await response.json();
```

---

## tRPC Endpoints

The application also exposes a tRPC API at `/api/trpc/[trpc]`. However, **Chrome extensions should prefer REST endpoints** for simplicity. If you need tRPC functionality, you can use the tRPC client library or make direct HTTP requests.

### tRPC Endpoint

**Base URL:** `POST /api/trpc/[procedure]`

**Authentication:** Uses cookies (not Bearer tokens) - **not recommended for Chrome extensions**

**Available Routers:**

1. **waitlist** - Waitlist management (public and protected)
2. **templates** - SOAP and discharge template management (admin only)
3. **playground** - SOAP playground (admin only)
4. **cases** - Case management (admin only)
5. **sharing** - Template and case sharing (admin only)
6. **users** - User management (admin only)

**Note:** tRPC endpoints use cookie-based authentication, which is not ideal for Chrome extensions. Use REST endpoints instead.

---

## Error Handling

All API endpoints return consistent error responses:

### Error Response Format

```typescript
{
  error: string;                   // Error message
  message?: string;                // Additional error details
  errors?: Array<{                 // Validation errors (if applicable)
    field: string;
    message: string;
  }>;
  details?: unknown;               // Additional error details
}
```

### HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data or validation error
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User doesn't have required permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Error Handling Example

```javascript
async function makeApiRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      // Handle error response
      if (response.status === 401) {
        // Token expired or invalid - refresh token
        await refreshToken();
        // Retry request
        return makeApiRequest(url, options);
      }

      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}
```

---

## Rate Limiting

Currently, there are no explicit rate limits documented. However, you should:

1. **Implement request throttling** in your Chrome extension
2. **Cache responses** when appropriate
3. **Batch requests** when possible
4. **Handle 429 Too Many Requests** responses gracefully

---

## Examples

### Complete Example: Schedule a Follow-up Call

```javascript
// 1. Get access token
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const {
  data: { session },
} = await supabase.auth.getSession();
const accessToken = session.access_token;

// 2. Schedule the call
const response = await fetch("https://your-domain.com/api/vapi/schedule", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    phoneNumber: "+14155551234",
    petName: "Max",
    ownerName: "John Smith",
    clinicName: "Happy Paws Veterinary",
    agentName: "Sarah",
    clinicPhone: "five five five, one two three, four five six seven",
    emergencyPhone: "five five five, nine nine nine, eight eight eight eight",
    appointmentDate: "January fifteenth, twenty twenty five",
    callType: "follow-up",
    dischargeSummary:
      "Patient presented with ear infection. Prescribed ear drops.",
    condition: "ear infection",
    conditionCategory: "dermatological",
    medications: "Ear drops twice daily for 7 days",
    recheckDate: "January thirtieth, twenty twenty five",
    petSpecies: "dog",
    petAge: 5,
    scheduledFor: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
  }),
});

if (!response.ok) {
  const error = await response.json();
  console.error("Failed to schedule call:", error);
  throw new Error(error.error || "Failed to schedule call");
}

const result = await response.json();
console.log("Call scheduled:", result.data.callId);
```

### Example: Poll for Call Status

```javascript
async function pollCallStatus(callId, accessToken, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `https://your-domain.com/api/vapi/calls/${callId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = await response.json();

    if (data.data.status === "ended" || data.data.status === "failed") {
      return data.data;
    }

    // Wait 5 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error("Call status polling timeout");
}
```

### Example: List Active Calls

```javascript
async function getActiveCalls(accessToken) {
  const response = await fetch(
    "https://your-domain.com/api/vapi/calls?status=in-progress&limit=50",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch calls");
  }

  const data = await response.json();
  return data.data;
}
```

---

## Phone Number Format

All phone numbers must be in **E.164 format**:

- ✅ `+14155551234` (US)
- ✅ `+442071234567` (UK)
- ❌ `(415) 555-1234`
- ❌ `415-555-1234`
- ❌ `4155551234`

For display purposes, phone numbers in clinic information should be **spelled out**:

- ✅ `"five five five, one two three, four five six seven"`
- ❌ `"555-123-4567"`

---

## Date Format

Dates in appointment dates and recheck dates should be **spelled out**:

- ✅ `"January fifteenth, twenty twenty five"`
- ✅ `"November eighth"`
- ✅ `"February first, twenty twenty five"`
- ❌ `"2025-01-15"`
- ❌ `"01/15/2025"`

For scheduling (`scheduledFor`), use **ISO 8601 datetime strings**:

- ✅ `"2025-01-15T14:30:00Z"`
- ✅ `new Date().toISOString()`

---

## Support

For API support or questions:

1. Check the main project documentation in `CLAUDE.md`
2. Review the source code in `src/app/api/`
3. Contact the development team

---

## Changelog

- **2025-01-XX** - Initial API documentation for Chrome extension integration
