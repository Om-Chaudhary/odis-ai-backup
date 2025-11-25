# Dual-Mode API Contract & Context

**Version:** 1.0.0  
**Last Updated:** 2025-11-25  
**Status:** ✅ Complete (Implementation Ready)

---

## Table of Contents

1. [Overview](#overview)
2. [API Endpoint](#api-endpoint)
3. [Authentication](#authentication)
4. [Request Schema](#request-schema)
5. [Response Schema](#response-schema)
6. [Workflow Steps](#workflow-steps)
7. [Error Handling](#error-handling)
8. [CORS Support](#cors-support)
9. [Usage Examples](#usage-examples)
10. [Integration Context](#integration-context)

---

## Overview

The Dual-Mode API provides a unified orchestration endpoint (`/api/discharge/orchestrate`) that enables automated multi-step discharge workflows. This endpoint replaces the need for multiple sequential API calls by executing all workflow steps in a single request with intelligent dependency management and parallel execution support.

### Key Features

- ✅ **Unified Workflow** - Execute multiple steps in a single request
- ✅ **Dual Input Modes** - Support for raw data ingestion or existing case continuation
- ✅ **Intelligent Execution** - Automatic dependency resolution and parallel execution
- ✅ **Flexible Configuration** - Enable/disable individual steps with custom options
- ✅ **Comprehensive Results** - Detailed step outputs, timings, and error reporting
- ✅ **CORS Support** - IDEXX Neo extension integration ready
- ✅ **Dual Authentication** - Cookie-based (web) and Bearer token (extension) support

### Use Cases

1. **IDEXX Neo Extension** - Single API call to process discharge data and schedule communications
2. **Web Dashboard** - Automated workflow execution with progress tracking
3. **Mobile App** - Batch processing of discharge workflows
4. **API Integrations** - Third-party systems can trigger complete workflows

---

## API Endpoint

### Base URL

```
POST /api/discharge/orchestrate
GET  /api/discharge/orchestrate  (Health Check)
OPTIONS /api/discharge/orchestrate  (CORS Preflight)
```

### HTTP Methods

| Method    | Purpose                        | Auth Required |
| --------- | ------------------------------ | ------------- |
| `POST`    | Execute orchestration workflow | ✅ Yes        |
| `GET`     | Health check / endpoint info   | ❌ No         |
| `OPTIONS` | CORS preflight request         | ❌ No         |

---

## Authentication

The endpoint supports **dual authentication modes** with automatic detection:

### 1. Bearer Token Authentication (Browser Extensions)

```http
Authorization: Bearer <supabase_access_token>
```

**Use Case:** IDEXX Neo browser extension, external API clients

**Token Source:**

```javascript
const {
  data: { session },
} = await supabase.auth.getSession();
const token = session.access_token;
```

### 2. Cookie-Based Authentication (Web App)

```http
Cookie: sb-<project-ref>-auth-token=<session_token>
```

**Use Case:** Next.js web application, same-origin requests

**Automatic:** Cookies are sent automatically by the browser

### Authentication Response

**Success (200):**

- Request proceeds to orchestration execution

**Unauthorized (401):**

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

## Request Schema

### POST Request Body

```typescript
{
  // Input data (discriminated union - one required)
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
    stopOnError?: boolean;      // Default: false
    parallel?: boolean;          // Default: true
    dryRun?: boolean;            // Default: false
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
      data?: Record<string, any>;  // For structured mode
      text?: string;                // For text mode
    };
  };
}
```

**Example:**

```json
{
  "input": {
    "rawData": {
      "mode": "text",
      "source": "idexx_extension",
      "text": "Patient: Max, Dog, 5 years old. Diagnosis: Ear infection. Treatment: Antibiotics."
    }
  }
}
```

#### Existing Case Input

```typescript
{
  input: {
    existingCase: {
      caseId: string;  // UUID
      summaryId?: string;  // UUID (optional)
      emailContent?: {
        subject: string;
        html: string;
        text: string;
      };
    };
  };
}
```

**Use Case:** Continue workflow from an existing case (e.g., skip ingestion, generate email from existing summary)

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

### Step Configurations

#### Ingest Step

```typescript
ingest?: boolean | {
  options?: {
    extractEntities?: boolean;      // Default: true
    skipDuplicateCheck?: boolean;     // Default: false
  };
}
```

**Purpose:** Ingest raw data and extract entities (patients, owners, conditions, etc.)

**Dependencies:** None (first step)

**Example:**

```json
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

**Purpose:** Generate discharge summary from ingested data

**Dependencies:** `ingest` (must complete first)

**Example:**

```json
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

**Purpose:** Generate email content (HTML + text) from discharge summary

**Dependencies:** `generateSummary` (must complete first)

**Example:**

```json
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
  scheduledFor?: Date | string;  // ISO 8601 datetime (optional)
}
```

**Purpose:** Schedule email delivery via QStash

**Dependencies:** `prepareEmail` (must complete first)

**Can Run Parallel With:** `scheduleCall`

**Example:**

```json
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
  scheduledFor?: Date | string;  // ISO 8601 datetime (optional)
}
```

**Purpose:** Schedule VAPI discharge call

**Dependencies:** `ingest` (can run parallel with email steps)

**Can Run Parallel With:** `scheduleEmail`

**Example:**

```json
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
  stopOnError?: boolean;  // Stop execution on first failure (default: false)
  parallel?: boolean;      // Enable parallel execution (default: true)
  dryRun?: boolean;       // Validate without executing (default: false)
}
```

**Example:**

```json
{
  "options": {
    "stopOnError": false,
    "parallel": true,
    "dryRun": false
  }
}
```

---

## Response Schema

### Success Response (200)

```typescript
{
  success: true;
  data: {
    completedSteps: StepName[];      // ["ingest", "generateSummary", ...]
    skippedSteps: StepName[];         // Steps that were disabled
    failedSteps: StepName[];           // Steps that failed (if any)

    // Step outputs (present if step completed)
    ingestion?: IngestResult;
    summary?: SummaryResult;
    email?: EmailResult;
    emailSchedule?: EmailScheduleResult;
    call?: CallResult;
  };
  metadata: {
    totalProcessingTime: number;      // Milliseconds
    stepTimings: Record<string, number>;  // Per-step durations
    warnings?: string[];               // Non-fatal warnings
    errors?: Array<{                   // Step-level errors
      step: StepName;
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
  entities: NormalizedEntities;        // Extracted entities
  scheduledCall?: {                    // If auto-scheduled
    id: string;
    scheduledFor: string;               // ISO 8601
  } | null;
}
```

#### SummaryResult

```typescript
{
  summaryId: string; // UUID
  content: string; // Plain text summary
}
```

#### EmailResult

```typescript
{
  subject: string; // Email subject line
  html: string; // HTML email body
  text: string; // Plain text email body
}
```

#### EmailScheduleResult

```typescript
{
  emailId: string; // UUID
  scheduledFor: string; // ISO 8601 datetime
}
```

#### CallResult

```typescript
{
  callId: string; // UUID
  scheduledFor: string; // ISO 8601 datetime
}
```

### Error Response (400 - Validation Error)

```typescript
{
  error: "Validation failed";
  details: {
    // Zod error format
    _errors?: string[];
    [field: string]: {
      _errors?: string[];
      [nestedField: string]: any;
    };
  };
}
```

### Error Response (401 - Unauthorized)

```typescript
{
  error: "Unauthorized";
  message: "Authentication required";
}
```

### Error Response (500 - Internal Server Error)

```typescript
{
  error: "Internal server error";
  message: string; // Generic error message (detailed errors logged server-side)
}
```

### Partial Success Response (200 with failedSteps)

Even if some steps fail, the response still returns `200 OK` with `success: false`:

```typescript
{
  success: false;  // Some steps failed
  data: {
    completedSteps: ["ingest", "generateSummary"],
    failedSteps: ["scheduleEmail"],
    skippedSteps: [],
    ingestion: { /* ... */ },
    summary: { /* ... */ },
    // scheduleEmail missing due to failure
  },
  metadata: {
    totalProcessingTime: 1500,
    stepTimings: {
      ingest: 500,
      generateSummary: 1000
    },
    errors: [
      {
        step: "scheduleEmail",
        error: "Failed to schedule email delivery: Invalid email address"
      }
    ]
  }
}
```

---

## Workflow Steps

### Step Execution Order

1. **ingest** - No dependencies
2. **generateSummary** - Depends on `ingest`
3. **prepareEmail** - Depends on `generateSummary`
4. **scheduleEmail** - Depends on `prepareEmail` (can run parallel with `scheduleCall`)
5. **scheduleCall** - Depends on `ingest` (can run parallel with `scheduleEmail`)

### Parallel Execution

When `options.parallel === true` (default):

- `scheduleEmail` and `scheduleCall` can execute in parallel (after their dependencies complete)
- All other steps execute sequentially

**Example Execution Flow:**

```
Sequential Mode (parallel: false):
ingest → generateSummary → prepareEmail → scheduleEmail → scheduleCall

Parallel Mode (parallel: true):
ingest → generateSummary → prepareEmail → [scheduleEmail || scheduleCall]
                                      ↓              ↓
                                    (parallel)
```

### Step Dependencies

| Step              | Depends On        | Can Run Parallel With |
| ----------------- | ----------------- | --------------------- |
| `ingest`          | None              | None                  |
| `generateSummary` | `ingest`          | None                  |
| `prepareEmail`    | `generateSummary` | None                  |
| `scheduleEmail`   | `prepareEmail`    | `scheduleCall`        |
| `scheduleCall`    | `ingest`          | `scheduleEmail`       |

---

## Error Handling

### Error Types

1. **Validation Errors (400)**
   - Invalid request schema
   - Missing required fields
   - Invalid enum values
   - Type mismatches

2. **Authentication Errors (401)**
   - Missing authentication
   - Invalid token
   - Expired session

3. **Step Execution Errors**
   - Database failures
   - External API failures (QStash, VAPI)
   - Data validation failures
   - Network timeouts

### Error Handling Behavior

**With `stopOnError: false` (default):**

- Failed steps are recorded but execution continues
- Response includes `failedSteps` array and error details
- Successful steps return their results

**With `stopOnError: true`:**

- Execution stops on first failure
- Remaining steps are marked as "skipped"
- Response includes error for failed step only

### Error Response Format

```typescript
{
  success: false;
  data: {
    completedSteps: StepName[];
    failedSteps: StepName[];
    skippedSteps: StepName[];
    // ... step outputs for completed steps
  };
  metadata: {
    totalProcessingTime: number;
    stepTimings: Record<string, number>;
    errors: Array<{
      step: StepName;
      error: string;  // Human-readable error message
    }>;
  };
}
```

---

## CORS Support

### Allowed Origins

The endpoint supports CORS for IDEXX Neo extension integration:

- `https://us.idexxneo.com`
- `https://ca.idexxneo.com`
- `https://uk.idexxneo.com`
- `https://idexxneocloud.com`
- `https://*.idexxneocloud.com`
- `https://neo.vet`
- `https://neosuite.com`
- `https://*.neosuite.com`

### CORS Headers

All responses include:

```http
Access-Control-Allow-Origin: <origin>
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept
Access-Control-Max-Age: 86400
```

### Preflight Request

```http
OPTIONS /api/discharge/orchestrate
Origin: https://us.idexxneo.com
Access-Control-Request-Method: POST
```

**Response:**

```http
204 No Content
Access-Control-Allow-Origin: https://us.idexxneo.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept
Access-Control-Max-Age: 86400
```

---

## Usage Examples

### Example 1: Full Workflow (IDEXX Extension)

```javascript
// IDEXX Neo Extension - Complete workflow
const response = await fetch("https://yourapp.com/api/discharge/orchestrate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${supabaseToken}`,
  },
  body: JSON.stringify({
    input: {
      rawData: {
        mode: "text",
        source: "idexx_extension",
        text: `
          Patient: Max
          Species: Dog
          Breed: Golden Retriever
          Age: 5 years
          Owner: John Smith
          Phone: +14155551234
          Email: john@example.com
          
          Diagnosis: Ear infection
          Treatment: Antibiotics (Amoxicillin 500mg, twice daily for 7 days)
          Follow-up: Recheck in 2 weeks
        `,
      },
    },
    steps: {
      ingest: true,
      generateSummary: true,
      prepareEmail: true,
      scheduleEmail: {
        recipientEmail: "john@example.com",
        scheduledFor: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      },
      scheduleCall: {
        phoneNumber: "+14155551234",
        scheduledFor: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
      },
    },
    options: {
      parallel: true,
      stopOnError: false,
    },
  }),
});

const result = await response.json();
console.log("Completed steps:", result.data.completedSteps);
console.log("Case ID:", result.data.ingestion?.caseId);
console.log("Summary ID:", result.data.summary?.summaryId);
```

### Example 2: Generate Email Only (Existing Case)

```javascript
// Web Dashboard - Generate email from existing case
const response = await fetch("/api/discharge/orchestrate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // Cookies sent automatically
  },
  body: JSON.stringify({
    input: {
      existingCase: {
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        summaryId: "987fcdeb-51a2-43d7-8f9e-123456789abc",
      },
    },
    steps: {
      ingest: false, // Skip - case already exists
      generateSummary: false, // Skip - summary already exists
      prepareEmail: true, // Generate email from existing summary
      scheduleEmail: false, // Don't schedule yet
      scheduleCall: false, // Don't schedule call
    },
  }),
});

const result = await response.json();
console.log("Email subject:", result.data.email?.subject);
console.log("Email HTML:", result.data.email?.html);
```

### Example 3: Minimal Workflow (Ingest Only)

```javascript
// Mobile App - Just ingest data
const response = await fetch("https://yourapp.com/api/discharge/orchestrate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    input: {
      rawData: {
        mode: "structured",
        source: "mobile_app",
        data: {
          patient: { name: "Max", species: "dog", breed: "Golden Retriever" },
          owner: { name: "John Smith", phone: "+14155551234" },
          diagnosis: "Ear infection",
          treatment: "Antibiotics",
        },
      },
    },
    steps: {
      ingest: true,
      // All other steps disabled
    },
  }),
});

const result = await response.json();
console.log("Case ID:", result.data.ingestion?.caseId);
console.log("Entities:", result.data.ingestion?.entities);
```

### Example 4: Error Handling

```javascript
try {
  const response = await fetch("/api/discharge/orchestrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      input: {
        /* ... */
      },
      steps: {
        /* ... */
      },
      options: {
        stopOnError: false, // Continue on errors
      },
    }),
  });

  const result = await response.json();

  if (!result.success) {
    console.error("Some steps failed:", result.data.failedSteps);
    result.metadata.errors?.forEach((error) => {
      console.error(`Step ${error.step} failed:`, error.error);
    });
  }

  // Use successful step results
  if (result.data.ingestion) {
    console.log("Case created:", result.data.ingestion.caseId);
  }
  if (result.data.summary) {
    console.log("Summary generated:", result.data.summary.summaryId);
  }
} catch (error) {
  console.error("Request failed:", error);
}
```

### Example 5: Health Check

```javascript
// Check endpoint status
const response = await fetch("/api/discharge/orchestrate");
const info = await response.json();

console.log("Status:", info.status); // "ok"
console.log("Version:", info.version); // "1.0.0"
```

---

## Integration Context

### Architecture Overview

The Dual-Mode API is built on top of existing services and follows these architectural patterns:

```
┌─────────────────────────────────────────────────────────────┐
│                    API Endpoint Layer                        │
│         /api/discharge/orchestrate (route.ts)                │
│  - Authentication (dual mode)                                │
│  - Request validation (Zod)                                 │
│  - CORS handling                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Orchestration Layer                             │
│         DischargeOrchestrator (service)                      │
│  - Step dependency management                                 │
│  - Sequential/parallel execution                              │
│  - Result aggregation                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ExecutionPlan │ │ CasesService │ │ AI Services  │
│ - Dependency  │ │ - Ingest      │ │ - Entity     │
│   analysis    │ │ - Schedule    │ │   Extract    │
│ - Parallel    │ │   Call        │ │ - Summary    │
│   detection   │ │               │ │   Generate   │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Service Dependencies

#### CasesService

**File:** `src/lib/services/cases-service.ts`

**Methods Used:**

- `ingest()` - Data ingestion and entity extraction
- `getCaseWithEntities()` - Retrieve case with entities
- `scheduleDischargeCall()` - Schedule VAPI call

#### AI Services

**Files:**

- `src/lib/ai/normalize-scribe.ts` - Entity extraction (via CasesService)
- `src/lib/ai/generate-discharge.ts` - Discharge summary generation

**LLM Backend:** LlamaIndex (replaces direct Anthropic SDK)

#### QStash Client

**File:** `src/lib/qstash/client.ts`

**Methods Used:**

- `scheduleEmailExecution()` - Schedule email delivery

#### Database Tables

- `cases` - Case records
- `discharge_summaries` - Generated summaries
- `scheduled_discharge_emails` - Email scheduling records
- `vapi_calls` - Call scheduling records
- `patients` - Patient entities
- `owners` - Owner entities

### Authentication Context

The endpoint uses the unified authentication system (`src/lib/api/auth.ts`):

- **Automatic Detection:** Detects Bearer token or cookies
- **Supabase Integration:** Uses Supabase Auth for both methods
- **User Context:** Provides authenticated user and Supabase client

### CORS Context

CORS support is provided by `src/lib/api/cors.ts`:

- **IDEXX Integration:** Specifically designed for IDEXX Neo extension
- **Wildcard Support:** Handles subdomain patterns (`*.idexxneocloud.com`)
- **Preflight Handling:** Automatic OPTIONS request handling

### Validation Context

Request validation uses Zod schemas (`src/lib/validators/orchestration.ts`):

- **Type Safety:** Full TypeScript type inference
- **Error Messages:** Detailed validation error reporting
- **Discriminated Unions:** Supports multiple input types

### Execution Context

The orchestrator manages execution context (`src/types/orchestration.ts`):

- **User:** Authenticated user from request
- **Supabase Client:** Database client with user context
- **Timing:** Start time tracking for performance metrics

---

## Related Documentation

- [Implementation Status](./STATUS.md) - Current implementation status
- [Task 7 Guide](./tasks/TASK_7_ORCHESTRATION_ENDPOINT.md) - Endpoint implementation details
- [Task 6 Guide](./tasks/TASK_6_DISCHARGE_ORCHESTRATOR.md) - Orchestrator implementation
- [Code Review](./CODE_REVIEW_TASK_6.md) - Security and code quality review
- [API Authentication](../../../api/README.md) - Authentication system documentation
- [CORS Documentation](../../../api/CORS_AND_AUTH_ANALYSIS.md) - CORS implementation details

---

## Version History

| Version | Date       | Changes                            |
| ------- | ---------- | ---------------------------------- |
| 1.0.0   | 2025-11-25 | Initial API contract documentation |

---

## Support

For questions or issues:

1. Check [STATUS.md](./STATUS.md) for implementation status
2. Review [CODE_REVIEW_TASK_6.md](./CODE_REVIEW_TASK_6.md) for known issues
3. Consult task guides in `tasks/` directory for implementation details
