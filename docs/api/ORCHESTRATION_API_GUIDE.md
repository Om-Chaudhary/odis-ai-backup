# Orchestration API Guide - Data Verification

**Complete API reference for verifying discharge orchestration data with client extensions**

**Version:** 1.0.0  
**Last Updated:** 2025-11-25  
**Endpoint:** `POST /api/discharge/orchestrate`

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Endpoint Details](#endpoint-details)
3. [Authentication](#authentication)
4. [Request Schema](#request-schema)
5. [Response Schema](#response-schema)
6. [Data Verification Scenarios](#data-verification-scenarios)
7. [Step-by-Step Verification](#step-by-step-verification)
8. [Test Cases](#test-cases)
9. [Error Handling](#error-handling)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Minimal Example (IDEXX Extension)

```javascript
const response = await fetch("https://yourapp.com/api/discharge/orchestrate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${supabaseAccessToken}`,
  },
  body: JSON.stringify({
    input: {
      rawData: {
        mode: "text",
        source: "idexx_extension",
        text: "Patient: Max, Dog, 5 years old. Diagnosis: Ear infection.",
      },
    },
    steps: {
      ingest: true,
      generateSummary: true,
    },
  }),
});

const result = await response.json();
console.log("Case ID:", result.data.ingestion?.caseId);
console.log("Summary:", result.data.summary?.content);
```

---

## Endpoint Details

### Base URL

```
POST /api/discharge/orchestrate
GET  /api/discharge/orchestrate  (Health Check)
OPTIONS /api/discharge/orchestrate  (CORS Preflight)
```

### HTTP Methods

| Method    | Purpose               | Auth Required | CORS   |
| --------- | --------------------- | ------------- | ------ |
| `POST`    | Execute orchestration | ✅ Yes        | ✅ Yes |
| `GET`     | Health check          | ❌ No         | ✅ Yes |
| `OPTIONS` | CORS preflight        | ❌ No         | ✅ Yes |

### Health Check

```javascript
const response = await fetch("/api/discharge/orchestrate");
const info = await response.json();
// { status: "ok", service: "discharge-orchestration", timestamp: "..." }
```

---

## Authentication

### Bearer Token (Browser Extensions)

**Header:**

```http
Authorization: Bearer <supabase_access_token>
```

**Getting Token (Supabase):**

```javascript
const {
  data: { session },
} = await supabase.auth.getSession();
const token = session?.access_token;

if (!token) {
  // User not authenticated
  throw new Error("No session found");
}
```

**Example Request:**

```javascript
const response = await fetch("/api/discharge/orchestrate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    /* ... */
  }),
});
```

### Cookie-Based (Web App)

Cookies are sent automatically by the browser. No additional headers needed.

**Example Request:**

```javascript
const response = await fetch("/api/discharge/orchestrate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include", // Ensure cookies are sent
  body: JSON.stringify({
    /* ... */
  }),
});
```

### Authentication Errors

**401 Unauthorized:**

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Verification:**

- Check token is valid and not expired
- Verify token format: `Bearer <token>`
- Ensure user has active Supabase session

---

## Request Schema

### Complete Request Structure

```typescript
{
  // Input data (one required)
  input: RawDataInput | ExistingCaseInput;

  // Step configuration (all optional)
  steps: {
    ingest?: boolean | IngestStepConfig;
    generateSummary?: boolean | GenerateSummaryStepConfig;
    prepareEmail?: boolean | PrepareEmailStepConfig;
    scheduleEmail?: boolean | ScheduleEmailStepConfig;
    scheduleCall?: boolean | ScheduleCallStepConfig;
  };

  // Execution options (optional)
  options?: {
    stopOnError?: boolean;  // Default: false
    parallel?: boolean;      // Default: true
    dryRun?: boolean;        // Default: false
  };
}
```

### Input Types

#### Raw Data Input

```typescript
{
  input: {
    rawData: {
      mode: "text" | "structured";
      source: "mobile_app" | "web_dashboard" | "idexx_extension" | "ezyvet_api";
      text?: string;                // Required if mode === "text"
      data?: Record<string, any>;   // Required if mode === "structured"
    };
  };
}
```

**Text Mode Example:**

```json
{
  "input": {
    "rawData": {
      "mode": "text",
      "source": "idexx_extension",
      "text": "Patient: Max, Dog, Golden Retriever, 5 years old. Owner: John Smith, Phone: +14155551234, Email: john@example.com. Diagnosis: Ear infection. Treatment: Antibiotics (Amoxicillin 500mg, twice daily for 7 days). Follow-up: Recheck in 2 weeks."
    }
  }
}
```

**Structured Mode Example:**

```json
{
  "input": {
    "rawData": {
      "mode": "structured",
      "source": "idexx_extension",
      "data": {
        "patient": {
          "name": "Max",
          "species": "dog",
          "breed": "Golden Retriever",
          "age": 5
        },
        "owner": {
          "name": "John Smith",
          "phone": "+14155551234",
          "email": "john@example.com"
        },
        "diagnosis": "Ear infection",
        "treatment": "Antibiotics (Amoxicillin 500mg, twice daily for 7 days)",
        "followUp": "Recheck in 2 weeks"
      }
    }
  }
}
```

#### Existing Case Input

```typescript
{
  input: {
    existingCase: {
      caseId: string;  // UUID (required)
      summaryId?: string;  // UUID (optional)
      emailContent?: {  // Optional - bypasses generateSummary dependency
        subject: string;
        html: string;
        text: string;
      };
    };
  };
}
```

**Example:**

```json
{
  "input": {
    "existingCase": {
      "caseId": "123e4567-e89b-12d3-a456-426614174000",
      "summaryId": "987fcdeb-51a2-43d7-8f9e-123456789abc"
    }
  }
}
```

**With Email Content (Bypass Summary Generation):**

```json
{
  "input": {
    "existingCase": {
      "caseId": "123e4567-e89b-12d3-a456-426614174000",
      "emailContent": {
        "subject": "Discharge Instructions for Max",
        "html": "<html>...</html>",
        "text": "Plain text version..."
      }
    }
  }
}
```

### Step Configurations

#### Ingest Step

```typescript
ingest?: boolean | {
  options?: {
    extractEntities?: boolean;      // Default: true
    skipDuplicateCheck?: boolean;   // Default: false
  };
}
```

**Examples:**

```json
// Simple enable
{ "steps": { "ingest": true } }

// With options
{
  "steps": {
    "ingest": {
      "options": {
        "extractEntities": true,
        "skipDuplicateCheck": false
      }
    }
  }
}
```

#### Generate Summary Step

```typescript
generateSummary?: boolean | {
  templateId?: string;  // UUID (optional)
  useLatestEntities?: boolean;  // Default: true
}
```

**Examples:**

```json
// Simple enable
{ "steps": { "generateSummary": true } }

// With template
{
  "steps": {
    "generateSummary": {
      "templateId": "template-uuid-here",
      "useLatestEntities": true
    }
  }
}
```

#### Prepare Email Step

```typescript
prepareEmail?: boolean | {
  templateId?: string;  // UUID (optional)
}
```

**Examples:**

```json
// Simple enable
{ "steps": { "prepareEmail": true } }

// With template
{
  "steps": {
    "prepareEmail": {
      "templateId": "email-template-uuid"
    }
  }
}
```

#### Schedule Email Step

```typescript
scheduleEmail?: boolean | {
  recipientEmail: string;  // Required if enabled
  scheduledFor?: string | Date;  // ISO 8601 datetime (optional, defaults to now)
}
```

**Examples:**

```json
// Immediate delivery
{
  "steps": {
    "scheduleEmail": {
      "recipientEmail": "owner@example.com"
    }
  }
}

// Scheduled delivery
{
  "steps": {
    "scheduleEmail": {
      "recipientEmail": "owner@example.com",
      "scheduledFor": "2025-11-26T10:00:00Z"
    }
  }
}
```

#### Schedule Call Step

```typescript
scheduleCall?: boolean | {
  phoneNumber: string;  // E.164 format: "+14155551234"
  scheduledFor?: string | Date;  // ISO 8601 datetime (optional, defaults to now)
}
```

**Examples:**

```json
// Immediate call
{
  "steps": {
    "scheduleCall": {
      "phoneNumber": "+14155551234"
    }
  }
}

// Scheduled call
{
  "steps": {
    "scheduleCall": {
      "phoneNumber": "+14155551234",
      "scheduledFor": "2025-11-26T14:00:00Z"
    }
  }
}
```

### Execution Options

```typescript
options?: {
  stopOnError?: boolean;  // Stop on first failure (default: false)
  parallel?: boolean;    // Enable parallel execution (default: true)
  dryRun?: boolean;      // Validate without executing (default: false)
}
```

**Examples:**

```json
// Default behavior (continue on errors, parallel execution)
{
  "options": {}
}

// Stop on first error
{
  "options": {
    "stopOnError": true
  }
}

// Sequential execution
{
  "options": {
    "parallel": false
  }
}
```

---

## Response Schema

### Success Response (200)

```typescript
{
  success: boolean;  // true if all steps succeeded, false if any failed
  data: {
    completedSteps: string[];      // ["ingest", "generateSummary", ...]
    skippedSteps: string[];         // Steps that were disabled
    failedSteps: string[];          // Steps that failed (if any)

    // Step outputs (present only if step completed)
    ingestion?: IngestResult;
    summary?: SummaryResult;
    email?: EmailResult;
    emailSchedule?: EmailScheduleResult;
    call?: CallResult;
  };
  metadata: {
    totalProcessingTime: number;      // Milliseconds
    stepTimings: Record<string, number>;  // Per-step durations in ms
    errors?: Array<{                   // Present if any steps failed
      step: string;
      error: string;
    }>;
  };
}
```

### Step Result Types

#### IngestResult

```typescript
{
  caseId: string;                      // UUID
  entities: {
    patients?: Array<{
      name: string;
      species?: string;
      breed?: string;
      age?: string;
      // ... other patient fields
    }>;
    owners?: Array<{
      name: string;
      phone?: string;
      email?: string;
      // ... other owner fields
    }>;
    conditions?: Array<{
      name: string;
      // ... other condition fields
    }>;
    medications?: Array<{
      name: string;
      dosage?: string;
      // ... other medication fields
    }>;
    // ... other entity types
  };
  scheduledCall?: {                    // If auto-scheduled during ingest
    id: string;
    scheduledFor: string;              // ISO 8601
  } | null;
}
```

**Example:**

```json
{
  "ingestion": {
    "caseId": "123e4567-e89b-12d3-a456-426614174000",
    "entities": {
      "patients": [
        {
          "name": "Max",
          "species": "dog",
          "breed": "Golden Retriever",
          "age": "5 years"
        }
      ],
      "owners": [
        {
          "name": "John Smith",
          "phone": "+14155551234",
          "email": "john@example.com"
        }
      ],
      "conditions": [
        {
          "name": "Ear infection"
        }
      ],
      "medications": [
        {
          "name": "Amoxicillin",
          "dosage": "500mg, twice daily for 7 days"
        }
      ]
    }
  }
}
```

#### SummaryResult

```typescript
{
  summaryId: string; // UUID
  content: string; // Plain text discharge summary
}
```

**Example:**

```json
{
  "summary": {
    "summaryId": "987fcdeb-51a2-43d7-8f9e-123456789abc",
    "content": "Discharge Instructions for Max\n\nMax was treated for an ear infection...\n\nMedications:\n- Amoxicillin 500mg, twice daily for 7 days\n\nFollow-up:\n- Recheck in 2 weeks\n\n..."
  }
}
```

#### EmailResult

```typescript
{
  subject: string; // Email subject line
  html: string; // HTML email body (fully formatted)
  text: string; // Plain text email body
}
```

**Example:**

```json
{
  "email": {
    "subject": "Discharge Instructions for Max",
    "html": "<!DOCTYPE html><html>...<h1>Discharge Instructions</h1>...",
    "text": "Discharge Instructions for Max\n\nDear John Smith,\n\n..."
  }
}
```

#### EmailScheduleResult

```typescript
{
  emailId: string;        // UUID of scheduled email record
  scheduledFor: string;   // ISO 8601 datetime
  qstashMessageId?: string;  // QStash message ID (if available)
}
```

**Example:**

```json
{
  "emailSchedule": {
    "emailId": "email-uuid-here",
    "scheduledFor": "2025-11-26T10:00:00Z",
    "qstashMessageId": "qstash-msg-id"
  }
}
```

#### CallResult

```typescript
{
  callId: string; // UUID of scheduled call record
  scheduledFor: string; // ISO 8601 datetime
}
```

**Example:**

```json
{
  "call": {
    "callId": "call-uuid-here",
    "scheduledFor": "2025-11-26T14:00:00Z"
  }
}
```

### Error Responses

#### Validation Error (400)

```json
{
  "error": "Validation failed",
  "message": "Invalid request format",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["input", "rawData", "text"],
      "message": "Required"
    }
  ]
}
```

#### Unauthorized (401)

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### Internal Server Error (500)

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

#### Partial Success (200 with failedSteps)

```json
{
  "success": false,
  "data": {
    "completedSteps": ["ingest", "generateSummary"],
    "failedSteps": ["scheduleEmail"],
    "skippedSteps": [],
    "ingestion": {
      /* ... */
    },
    "summary": {
      /* ... */
    }
    // scheduleEmail missing due to failure
  },
  "metadata": {
    "totalProcessingTime": 1500,
    "stepTimings": {
      "ingest": 500,
      "generateSummary": 1000
    },
    "errors": [
      {
        "step": "scheduleEmail",
        "error": "Failed to schedule email delivery: Invalid email address"
      }
    ]
  }
}
```

---

## Data Verification Scenarios

### Scenario 1: Full Workflow Verification

**Request:**

```json
{
  "input": {
    "rawData": {
      "mode": "text",
      "source": "idexx_extension",
      "text": "Patient: Max, Dog, 5 years old. Owner: John Smith, Phone: +14155551234, Email: john@example.com. Diagnosis: Ear infection. Treatment: Antibiotics."
    }
  },
  "steps": {
    "ingest": true,
    "generateSummary": true,
    "prepareEmail": true,
    "scheduleEmail": {
      "recipientEmail": "john@example.com"
    },
    "scheduleCall": {
      "phoneNumber": "+14155551234"
    }
  }
}
```

**Expected Response Verification:**

1. **Status Code:** `200`
2. **Success:** `true`
3. **Completed Steps:** `["ingest", "generateSummary", "prepareEmail", "scheduleEmail", "scheduleCall"]`
4. **Ingestion Data:**
   - ✅ `data.ingestion.caseId` is a valid UUID
   - ✅ `data.ingestion.entities.patients` contains patient data
   - ✅ `data.ingestion.entities.owners` contains owner data
   - ✅ `data.ingestion.entities.conditions` contains diagnosis
5. **Summary Data:**
   - ✅ `data.summary.summaryId` is a valid UUID
   - ✅ `data.summary.content` is a non-empty string
   - ✅ `data.summary.content` contains relevant discharge information
6. **Email Data:**
   - ✅ `data.email.subject` contains patient name
   - ✅ `data.email.html` is valid HTML
   - ✅ `data.email.text` is plain text version
7. **Email Schedule:**
   - ✅ `data.emailSchedule.emailId` is a valid UUID
   - ✅ `data.emailSchedule.scheduledFor` is ISO 8601 datetime
8. **Call Schedule:**
   - ✅ `data.call.callId` is a valid UUID
   - ✅ `data.call.scheduledFor` is ISO 8601 datetime
9. **Metadata:**
   - ✅ `metadata.totalProcessingTime` > 0
   - ✅ `metadata.stepTimings` contains all step durations
   - ✅ `metadata.errors` is undefined (no errors)

**Verification Code:**

```javascript
function verifyFullWorkflow(result) {
  // Basic checks
  assert(result.success === true, "Workflow should succeed");
  assert(result.data.completedSteps.length === 5, "All steps should complete");
  assert(result.data.failedSteps.length === 0, "No steps should fail");

  // Ingestion verification
  const ingestion = result.data.ingestion;
  assert(ingestion, "Ingestion result should exist");
  assert(isUUID(ingestion.caseId), "caseId should be valid UUID");
  assert(ingestion.entities.patients?.length > 0, "Should extract patients");
  assert(ingestion.entities.owners?.length > 0, "Should extract owners");

  // Summary verification
  const summary = result.data.summary;
  assert(summary, "Summary result should exist");
  assert(isUUID(summary.summaryId), "summaryId should be valid UUID");
  assert(summary.content.length > 0, "Summary content should not be empty");

  // Email verification
  const email = result.data.email;
  assert(email, "Email result should exist");
  assert(email.subject.length > 0, "Email subject should not be empty");
  assert(email.html.includes("<!DOCTYPE html>"), "Email HTML should be valid");
  assert(email.text.length > 0, "Email text should not be empty");

  // Schedule verification
  assert(result.data.emailSchedule, "Email schedule should exist");
  assert(result.data.call, "Call schedule should exist");

  return true;
}
```

### Scenario 2: Ingest Only Verification

**Request:**

```json
{
  "input": {
    "rawData": {
      "mode": "text",
      "source": "idexx_extension",
      "text": "Patient: Max, Dog, 5 years old. Owner: John Smith."
    }
  },
  "steps": {
    "ingest": true
  }
}
```

**Expected Response Verification:**

1. **Status Code:** `200`
2. **Success:** `true`
3. **Completed Steps:** `["ingest"]`
4. **Skipped Steps:** `["generateSummary", "prepareEmail", "scheduleEmail", "scheduleCall"]`
5. **Ingestion Data:**
   - ✅ `data.ingestion.caseId` is a valid UUID
   - ✅ `data.ingestion.entities` contains extracted entities
6. **Other Steps:** Should be undefined (not executed)

**Verification Code:**

```javascript
function verifyIngestOnly(result) {
  assert(result.success === true, "Should succeed");
  assert(
    result.data.completedSteps.includes("ingest"),
    "Ingest should complete",
  );
  assert(
    result.data.skippedSteps.length === 4,
    "Other steps should be skipped",
  );
  assert(result.data.ingestion, "Ingestion result should exist");
  assert(!result.data.summary, "Summary should not exist");
  assert(!result.data.email, "Email should not exist");
  return true;
}
```

### Scenario 3: Existing Case with Email Generation

**Request:**

```json
{
  "input": {
    "existingCase": {
      "caseId": "123e4567-e89b-12d3-a456-426614174000",
      "summaryId": "987fcdeb-51a2-43d7-8f9e-123456789abc"
    }
  },
  "steps": {
    "ingest": false,
    "generateSummary": false,
    "prepareEmail": true
  }
}
```

**Expected Response Verification:**

1. **Status Code:** `200`
2. **Success:** `true`
3. **Completed Steps:** `["prepareEmail"]` (ingest auto-completed for existing case)
4. **Email Data:**
   - ✅ `data.email.subject` is present
   - ✅ `data.email.html` contains discharge summary
   - ✅ `data.email.text` is plain text version

**Verification Code:**

```javascript
function verifyExistingCaseEmail(result) {
  assert(result.success === true, "Should succeed");
  assert(
    result.data.completedSteps.includes("prepareEmail"),
    "Email prep should complete",
  );
  assert(result.data.email, "Email result should exist");
  assert(result.data.email.html.length > 0, "Email HTML should not be empty");
  return true;
}
```

---

## Step-by-Step Verification

### Step 1: Verify Ingestion

**What to Check:**

- ✅ Case ID is returned and is a valid UUID
- ✅ Entities are extracted (patients, owners, conditions, medications)
- ✅ Entity data matches input text
- ✅ No duplicate case created (unless `skipDuplicateCheck: true`)

**Verification Function:**

```javascript
function verifyIngestion(result) {
  const ingestion = result.data.ingestion;

  if (!ingestion) {
    throw new Error("Ingestion result missing");
  }

  // Verify caseId
  if (!isUUID(ingestion.caseId)) {
    throw new Error(`Invalid caseId format: ${ingestion.caseId}`);
  }

  // Verify entities exist
  if (!ingestion.entities) {
    throw new Error("Entities missing from ingestion result");
  }

  // Verify at least one patient extracted
  if (
    !ingestion.entities.patients ||
    ingestion.entities.patients.length === 0
  ) {
    console.warn("No patients extracted - may be expected for some inputs");
  }

  return {
    caseId: ingestion.caseId,
    entityCount: {
      patients: ingestion.entities.patients?.length || 0,
      owners: ingestion.entities.owners?.length || 0,
      conditions: ingestion.entities.conditions?.length || 0,
      medications: ingestion.entities.medications?.length || 0,
    },
  };
}
```

### Step 2: Verify Summary Generation

**What to Check:**

- ✅ Summary ID is returned and is a valid UUID
- ✅ Summary content is non-empty
- ✅ Summary contains relevant information (patient name, diagnosis, treatment)
- ✅ Summary is properly formatted

**Verification Function:**

```javascript
function verifySummary(result, expectedPatientName) {
  const summary = result.data.summary;

  if (!summary) {
    throw new Error("Summary result missing");
  }

  // Verify summaryId
  if (!isUUID(summary.summaryId)) {
    throw new Error(`Invalid summaryId format: ${summary.summaryId}`);
  }

  // Verify content
  if (!summary.content || summary.content.trim().length === 0) {
    throw new Error("Summary content is empty");
  }

  // Verify content contains expected information
  if (expectedPatientName && !summary.content.includes(expectedPatientName)) {
    console.warn(
      `Summary may not contain patient name: ${expectedPatientName}`,
    );
  }

  return {
    summaryId: summary.summaryId,
    contentLength: summary.content.length,
    containsPatientName: expectedPatientName
      ? summary.content.includes(expectedPatientName)
      : null,
  };
}
```

### Step 3: Verify Email Preparation

**What to Check:**

- ✅ Email subject is present and contains patient name
- ✅ Email HTML is valid HTML
- ✅ Email text is plain text version
- ✅ Email contains discharge summary content
- ✅ Email is properly formatted

**Verification Function:**

```javascript
function verifyEmail(result, expectedPatientName, expectedOwnerName) {
  const email = result.data.email;

  if (!email) {
    throw new Error("Email result missing");
  }

  // Verify subject
  if (!email.subject || email.subject.trim().length === 0) {
    throw new Error("Email subject is empty");
  }

  if (expectedPatientName && !email.subject.includes(expectedPatientName)) {
    console.warn(
      `Email subject may not contain patient name: ${expectedPatientName}`,
    );
  }

  // Verify HTML
  if (!email.html || email.html.trim().length === 0) {
    throw new Error("Email HTML is empty");
  }

  if (
    !email.html.includes("<!DOCTYPE html>") &&
    !email.html.includes("<html>")
  ) {
    console.warn("Email HTML may not be valid HTML");
  }

  // Verify text
  if (!email.text || email.text.trim().length === 0) {
    throw new Error("Email text is empty");
  }

  // Verify content consistency
  if (expectedOwnerName && !email.html.includes(expectedOwnerName)) {
    console.warn(`Email may not contain owner name: ${expectedOwnerName}`);
  }

  return {
    subject: email.subject,
    htmlLength: email.html.length,
    textLength: email.text.length,
    containsPatientName: expectedPatientName
      ? email.html.includes(expectedPatientName)
      : null,
  };
}
```

### Step 4: Verify Email Scheduling

**What to Check:**

- ✅ Email ID is returned and is a valid UUID
- ✅ Scheduled time is ISO 8601 format
- ✅ Scheduled time is in the future (or recent past for immediate)
- ✅ QStash message ID is present (if available)

**Verification Function:**

```javascript
function verifyEmailSchedule(result) {
  const emailSchedule = result.data.emailSchedule;

  if (!emailSchedule) {
    throw new Error("Email schedule result missing");
  }

  // Verify emailId
  if (!isUUID(emailSchedule.emailId)) {
    throw new Error(`Invalid emailId format: ${emailSchedule.emailId}`);
  }

  // Verify scheduledFor
  if (!emailSchedule.scheduledFor) {
    throw new Error("scheduledFor is missing");
  }

  const scheduledDate = new Date(emailSchedule.scheduledFor);
  if (isNaN(scheduledDate.getTime())) {
    throw new Error(
      `Invalid scheduledFor format: ${emailSchedule.scheduledFor}`,
    );
  }

  // Verify QStash message ID (optional)
  if (emailSchedule.qstashMessageId) {
    console.log("QStash message ID:", emailSchedule.qstashMessageId);
  }

  return {
    emailId: emailSchedule.emailId,
    scheduledFor: emailSchedule.scheduledFor,
    scheduledDate: scheduledDate,
    qstashMessageId: emailSchedule.qstashMessageId || null,
  };
}
```

### Step 5: Verify Call Scheduling

**What to Check:**

- ✅ Call ID is returned and is a valid UUID
- ✅ Scheduled time is ISO 8601 format
- ✅ Scheduled time is in the future (or recent past for immediate)

**Verification Function:**

```javascript
function verifyCallSchedule(result) {
  const call = result.data.call;

  if (!call) {
    throw new Error("Call schedule result missing");
  }

  // Verify callId
  if (!isUUID(call.callId)) {
    throw new Error(`Invalid callId format: ${call.callId}`);
  }

  // Verify scheduledFor
  if (!call.scheduledFor) {
    throw new Error("scheduledFor is missing");
  }

  const scheduledDate = new Date(call.scheduledFor);
  if (isNaN(scheduledDate.getTime())) {
    throw new Error(`Invalid scheduledFor format: ${call.scheduledFor}`);
  }

  return {
    callId: call.callId,
    scheduledFor: call.scheduledFor,
    scheduledDate: scheduledDate,
  };
}
```

---

## Test Cases

### Test Case 1: Minimal Text Input

**Request:**

```json
{
  "input": {
    "rawData": {
      "mode": "text",
      "source": "idexx_extension",
      "text": "Patient: Max, Dog"
    }
  },
  "steps": {
    "ingest": true
  }
}
```

**Expected:**

- ✅ Status 200
- ✅ `ingestion.caseId` present
- ✅ `ingestion.entities` present (may be minimal)

### Test Case 2: Complete Patient Data

**Request:**

```json
{
  "input": {
    "rawData": {
      "mode": "text",
      "source": "idexx_extension",
      "text": "Patient: Max, Dog, Golden Retriever, 5 years old, Male. Owner: John Smith, Phone: +14155551234, Email: john@example.com. Diagnosis: Ear infection. Treatment: Antibiotics (Amoxicillin 500mg, twice daily for 7 days). Follow-up: Recheck in 2 weeks."
    }
  },
  "steps": {
    "ingest": true,
    "generateSummary": true
  }
}
```

**Expected:**

- ✅ Status 200
- ✅ Patient entity extracted with name "Max"
- ✅ Owner entity extracted with name "John Smith"
- ✅ Condition entity extracted with "Ear infection"
- ✅ Summary contains relevant information

### Test Case 3: Structured Input

**Request:**

```json
{
  "input": {
    "rawData": {
      "mode": "structured",
      "source": "idexx_extension",
      "data": {
        "patient": { "name": "Max", "species": "dog" },
        "owner": { "name": "John Smith", "phone": "+14155551234" },
        "diagnosis": "Ear infection"
      }
    }
  },
  "steps": {
    "ingest": true
  }
}
```

**Expected:**

- ✅ Status 200
- ✅ Entities extracted from structured data
- ✅ Case created successfully

### Test Case 4: Email Generation

**Request:**

```json
{
  "input": {
    "rawData": {
      "mode": "text",
      "source": "idexx_extension",
      "text": "Patient: Max, Dog. Owner: John Smith. Diagnosis: Ear infection."
    }
  },
  "steps": {
    "ingest": true,
    "generateSummary": true,
    "prepareEmail": true
  }
}
```

**Expected:**

- ✅ Status 200
- ✅ Email subject contains "Max"
- ✅ Email HTML is valid
- ✅ Email text is plain text
- ✅ Email contains discharge summary

### Test Case 5: Email Scheduling

**Request:**

```json
{
  "input": {
    "rawData": {
      "mode": "text",
      "source": "idexx_extension",
      "text": "Patient: Max, Dog. Owner: John Smith, Email: john@example.com."
    }
  },
  "steps": {
    "ingest": true,
    "generateSummary": true,
    "prepareEmail": true,
    "scheduleEmail": {
      "recipientEmail": "john@example.com"
    }
  }
}
```

**Expected:**

- ✅ Status 200
- ✅ Email scheduled successfully
- ✅ `emailSchedule.emailId` present
- ✅ `emailSchedule.scheduledFor` present

### Test Case 6: Call Scheduling

**Request:**

```json
{
  "input": {
    "rawData": {
      "mode": "text",
      "source": "idexx_extension",
      "text": "Patient: Max, Dog. Owner: John Smith, Phone: +14155551234."
    }
  },
  "steps": {
    "ingest": true,
    "scheduleCall": {
      "phoneNumber": "+14155551234"
    }
  }
}
```

**Expected:**

- ✅ Status 200
- ✅ Call scheduled successfully
- ✅ `call.callId` present
- ✅ `call.scheduledFor` present

### Test Case 7: Existing Case Continuation

**Request:**

```json
{
  "input": {
    "existingCase": {
      "caseId": "existing-case-uuid"
    }
  },
  "steps": {
    "generateSummary": true,
    "prepareEmail": true
  }
}
```

**Expected:**

- ✅ Status 200
- ✅ Summary generated from existing case
- ✅ Email prepared from summary
- ✅ No ingestion step executed

### Test Case 8: Error Handling - Invalid Email

**Request:**

```json
{
  "input": {
    "rawData": {
      "mode": "text",
      "source": "idexx_extension",
      "text": "Patient: Max, Dog"
    }
  },
  "steps": {
    "ingest": true,
    "generateSummary": true,
    "prepareEmail": true,
    "scheduleEmail": {
      "recipientEmail": "invalid-email"
    }
  },
  "options": {
    "stopOnError": false
  }
}
```

**Expected:**

- ✅ Status 200
- ✅ `success: false`
- ✅ `failedSteps` contains "scheduleEmail"
- ✅ `metadata.errors` contains error details
- ✅ Other steps completed successfully

### Test Case 9: Error Handling - Missing Required Field

**Request:**

```json
{
  "input": {
    "rawData": {
      "mode": "text",
      "source": "idexx_extension"
    }
  },
  "steps": {
    "ingest": true
  }
}
```

**Expected:**

- ✅ Status 400
- ✅ Validation error for missing `text` field

### Test Case 10: Parallel Execution

**Request:**

```json
{
  "input": {
    "rawData": {
      "mode": "text",
      "source": "idexx_extension",
      "text": "Patient: Max, Dog. Owner: John Smith, Email: john@example.com, Phone: +14155551234."
    }
  },
  "steps": {
    "ingest": true,
    "generateSummary": true,
    "prepareEmail": true,
    "scheduleEmail": {
      "recipientEmail": "john@example.com"
    },
    "scheduleCall": {
      "phoneNumber": "+14155551234"
    }
  },
  "options": {
    "parallel": true
  }
}
```

**Expected:**

- ✅ Status 200
- ✅ `scheduleEmail` and `scheduleCall` execute in parallel
- ✅ `metadata.stepTimings` shows parallel execution
- ✅ Total time less than sequential execution

---

## Error Handling

### Common Errors

#### 1. Validation Errors (400)

**Cause:** Invalid request format, missing required fields, invalid types

**Example:**

```json
{
  "error": "Validation failed",
  "message": "Invalid request format",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["input", "rawData", "text"],
      "message": "Required"
    }
  ]
}
```

**How to Fix:**

- Check all required fields are present
- Verify field types match schema
- Ensure enum values are valid

#### 2. Authentication Errors (401)

**Cause:** Missing or invalid authentication token

**Example:**

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**How to Fix:**

- Verify token is present in `Authorization` header
- Check token is not expired
- Ensure token format: `Bearer <token>`

#### 3. Step Execution Errors

**Cause:** Database failures, external API failures, data validation failures

**Example Response:**

```json
{
  "success": false,
  "data": {
    "completedSteps": ["ingest"],
    "failedSteps": ["scheduleEmail"],
    "ingestion": {
      /* ... */
    }
  },
  "metadata": {
    "errors": [
      {
        "step": "scheduleEmail",
        "error": "Failed to schedule email delivery: Invalid email address"
      }
    ]
  }
}
```

**How to Fix:**

- Check error message in `metadata.errors`
- Verify input data is valid
- Check external service status (QStash, VAPI)

#### 4. Dependency Errors

**Cause:** Step executed before dependency completed

**Example:**

```json
{
  "success": false,
  "data": {
    "completedSteps": ["ingest"],
    "failedSteps": ["generateSummary"],
    "skippedSteps": ["prepareEmail", "scheduleEmail"]
  },
  "metadata": {
    "errors": [
      {
        "step": "generateSummary",
        "error": "Case ID required for summary generation"
      }
    ]
  }
}
```

**How to Fix:**

- Ensure dependencies are enabled
- Check dependency steps completed successfully
- Verify case ID is available

---

## Troubleshooting

### Issue: No Entities Extracted

**Symptoms:**

- `ingestion.entities` is empty or minimal
- Patient/owner data not extracted

**Possible Causes:**

1. Input text doesn't contain structured information
2. Entity extraction failed silently
3. Text format not recognized

**Solutions:**

- Verify input text contains clear patient/owner information
- Try structured mode with explicit data
- Check entity extraction logs

### Issue: Summary Generation Fails

**Symptoms:**

- `generateSummary` step fails
- Error: "Case ID required for summary generation"

**Possible Causes:**

1. Ingestion step didn't complete
2. Case ID not available in context
3. Existing case ID invalid

**Solutions:**

- Ensure `ingest` step is enabled and completes
- Verify `caseId` in existing case input is valid UUID
- Check case exists in database

### Issue: Email Not Scheduled

**Symptoms:**

- `scheduleEmail` step fails
- Error: "Invalid email address" or "Recipient email is required"

**Possible Causes:**

1. Email address format invalid
2. `recipientEmail` not provided in step config
3. Email validation failed

**Solutions:**

- Verify email format: `user@domain.com`
- Ensure `recipientEmail` is provided in step config
- Check email is not empty string

### Issue: Call Not Scheduled

**Symptoms:**

- `scheduleCall` step fails
- Error: "Case ID required for call scheduling"

**Possible Causes:**

1. Ingestion step didn't complete
2. Case ID not available
3. Phone number format invalid

**Solutions:**

- Ensure `ingest` step completes before `scheduleCall`
- Verify phone number is E.164 format: `+14155551234`
- Check case ID is available in context

### Issue: CORS Errors

**Symptoms:**

- Browser console shows CORS errors
- Preflight request fails

**Possible Causes:**

1. Origin not in allowed list
2. Missing CORS headers
3. Preflight not handled

**Solutions:**

- Verify origin is in allowed list (IDEXX domains)
- Check `OPTIONS` request is handled
- Ensure CORS headers are present in response

### Issue: Slow Response Times

**Symptoms:**

- Response takes > 10 seconds
- Timeout errors

**Possible Causes:**

1. AI summary generation is slow
2. External API calls timing out
3. Database queries slow

**Solutions:**

- Check `metadata.stepTimings` for slow steps
- Verify external services are responsive
- Consider enabling parallel execution
- Check database performance

---

## Verification Checklist

Use this checklist to verify your integration:

### Request Verification

- [ ] Authentication token is valid and not expired
- [ ] Request body matches schema
- [ ] All required fields are present
- [ ] Enum values are valid
- [ ] UUIDs are valid format (if using existing case)

### Response Verification

- [ ] Status code is 200 (or expected error code)
- [ ] Response body matches schema
- [ ] `success` field matches expectations
- [ ] `completedSteps` contains expected steps
- [ ] `failedSteps` is empty (or contains expected failures)
- [ ] `skippedSteps` contains disabled steps

### Data Verification

- [ ] All UUIDs are valid format
- [ ] All dates are ISO 8601 format
- [ ] Entity data matches input
- [ ] Summary content is non-empty
- [ ] Email content is properly formatted
- [ ] Scheduled times are in the future (or recent past)

### Error Handling Verification

- [ ] Validation errors return 400
- [ ] Authentication errors return 401
- [ ] Step failures are reported in `metadata.errors`
- [ ] Partial success handled correctly
- [ ] Error messages are descriptive

---

## Helper Functions

### UUID Validation

```javascript
function isUUID(str) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
```

### ISO 8601 Date Validation

```javascript
function isValidISO8601(str) {
  const date = new Date(str);
  return !isNaN(date.getTime()) && str.includes("T") && str.includes("Z");
}
```

### Complete Verification Function

```javascript
async function verifyOrchestrationRequest(request, expectedResults) {
  const response = await fetch("/api/discharge/orchestrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  const result = await response.json();

  // Basic checks
  if (response.status !== 200) {
    throw new Error(`Unexpected status: ${response.status}`);
  }

  // Verify success
  if (expectedResults.shouldSucceed && !result.success) {
    throw new Error(
      `Expected success but got: ${JSON.stringify(result.metadata.errors)}`,
    );
  }

  // Verify completed steps
  if (expectedResults.completedSteps) {
    expectedResults.completedSteps.forEach((step) => {
      if (!result.data.completedSteps.includes(step)) {
        throw new Error(`Expected step ${step} to complete but it didn't`);
      }
    });
  }

  // Verify data presence
  if (expectedResults.ingestion && !result.data.ingestion) {
    throw new Error("Expected ingestion result but it is missing");
  }

  if (expectedResults.summary && !result.data.summary) {
    throw new Error("Expected summary result but it is missing");
  }

  if (expectedResults.email && !result.data.email) {
    throw new Error("Expected email result but it is missing");
  }

  return result;
}
```

---

## Related Documentation

- [API Contract](./API_CONTRACT.md) - Complete API contract documentation
- [API Quick Reference](./API_QUICK_REFERENCE.md) - Quick reference card
- [Implementation Status](../implementation/features/dual-mode-api/STATUS.md) - Current implementation status
- [CORS and Auth Analysis](./CORS_AND_AUTH_ANALYSIS.md) - Authentication and CORS details

---

**Last Updated:** 2025-11-25  
**Version:** 1.0.0
