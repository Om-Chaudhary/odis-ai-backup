# Retell AI SDK - Complete Integration Guide for Next.js

**Research Date**: 2025-11-03
**Documentation Version**: v2 API
**SDK Version**: Latest (Node.js 18.10.0+ required)

---

## Table of Contents

1. [SDK Installation](#sdk-installation)
2. [Authentication & Configuration](#authentication--configuration)
3. [Creating Outbound Calls](#creating-outbound-calls)
4. [Retrieving Call Details](#retrieving-call-details)
5. [Listing Call History](#listing-call-history)
6. [Dynamic Variables](#dynamic-variables)
7. [TypeScript Types & Interfaces](#typescript-types--interfaces)
8. [Next.js Integration](#nextjs-integration)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## SDK Installation

### NPM Package

```bash
npm install retell-sdk
```

**Requirements**:

- Node.js version 18.10.0 or higher
- Full TypeScript support included
- Compatible with Next.js, Deno, Bun, Cloudflare Workers, Vercel Edge

### Next.js Specific Configuration

If using Next.js (which polyfills with undici), add this import **before** your first Retell import:

```typescript
import "retell-sdk/shims/web";
import Retell from "retell-sdk";
```

This tells the SDK to use the global web-standards-compliant fetch function instead of node-fetch.

---

## Authentication & Configuration

### API Key Setup

1. Navigate to the "API Keys" tab in your Retell AI dashboard
2. Generate or copy your API key
3. Store securely in environment variables

### Basic Initialization

```typescript
import Retell from "retell-sdk";

const client = new Retell({
  apiKey: process.env.RETELL_API_KEY,
});
```

### With TypeScript Types

```typescript
import { Retell, AgentCreateParams } from "retell-sdk";

const client = new Retell({
  apiKey: process.env.RETELL_API_KEY,
});
```

### Required Environment Variables

Create a `.env.local` file (Next.js):

```env
# Server-only variable (no NEXT_PUBLIC_ prefix)
RETELL_API_KEY=your_retell_api_key_here
```

**Important**: Do NOT prefix with `NEXT_PUBLIC_` as this would expose the key to the client-side bundle.

---

## Creating Outbound Calls

### API Endpoint

**POST** `https://api.retellai.com/v2/create-phone-call`

### Basic Call Creation

```typescript
import Retell from "retell-sdk";

const client = new Retell({
  apiKey: process.env.RETELL_API_KEY,
});

async function createOutboundCall() {
  try {
    const response = await client.call.createPhoneCall({
      from_number: "+14157774444", // Your Retell number
      to_number: "+12137774445", // Recipient number
    });

    console.log("Call created:", response.call_id);
    console.log("Call status:", response.call_status);
    return response;
  } catch (error) {
    console.error("Error creating call:", error);
    throw error;
  }
}
```

### Call with Custom Variables

```typescript
async function createPersonalizedCall(
  toNumber: string,
  customerName: string,
  orderId: string,
) {
  const response = await client.call.createPhoneCall({
    from_number: "+14157774444",
    to_number: toNumber,

    // Dynamic variables for personalization
    retell_llm_dynamic_variables: {
      customer_name: customerName,
      order_id: orderId,
      appointment_date: "2025-11-15",
      // All values MUST be strings
    },

    // Optional: Override agent for this call
    override_agent_id: "agent_abc123",

    // Optional: Add metadata for tracking
    metadata: {
      internal_customer_id: "cust_12345",
      campaign_id: "fall_2025",
    },

    // Optional: Custom SIP headers
    custom_sip_headers: {
      "X-Custom-Header": "Custom Value",
    },
  });

  return response;
}
```

### Request Parameters

#### Required Parameters

| Parameter     | Type   | Description                                              |
| ------------- | ------ | -------------------------------------------------------- |
| `from_number` | string | Caller's number in E.164 format (must be owned/imported) |
| `to_number`   | string | Recipient's number in E.164 format                       |

#### Optional Parameters

| Parameter                      | Type    | Description                                        |
| ------------------------------ | ------- | -------------------------------------------------- |
| `override_agent_id`            | string  | Temporarily override agent for this call           |
| `override_agent_version`       | integer | Override agent version                             |
| `metadata`                     | object  | Custom tracking data                               |
| `retell_llm_dynamic_variables` | object  | Key-value pairs (strings only) for Response Engine |
| `custom_sip_headers`           | object  | Custom SIP headers                                 |
| `ignore_e164_validation`       | boolean | Skip E.164 validation (custom telephony only)      |

### Response Object

```typescript
interface CreateCallResponse {
  call_id: string; // Unique identifier
  call_status: "registered" | "not_connected" | "ongoing" | "ended" | "error";
  agent_id: string;
  agent_name: string;
  agent_version: number;
  direction: "inbound" | "outbound";
  // Additional fields populated after call ends:
  // - start_timestamp, end_timestamp, duration_ms
  // - transcript, recording_url
  // - call_analysis, call_cost
  // - latency metrics
}
```

---

## Retrieving Call Details

### API Endpoint

**GET** `https://api.retellai.com/v2/get-call/{call_id}`

### Get Single Call

```typescript
async function getCallDetails(callId: string) {
  try {
    const call = await client.call.retrieve(callId);

    console.log("Call Status:", call.call_status);
    console.log("Duration:", call.duration_ms, "ms");
    console.log("Cost:", call.call_cost?.combined, "cents");

    // Access transcript
    if (call.transcript) {
      console.log("Transcript:", call.transcript);
    }

    // Access analysis
    if (call.call_analysis) {
      console.log("Summary:", call.call_analysis.summary);
      console.log("Sentiment:", call.call_analysis.user_sentiment);
      console.log("Successful:", call.call_analysis.call_successful);
    }

    return call;
  } catch (error) {
    console.error("Error retrieving call:", error);
    throw error;
  }
}
```

### Response Fields

#### Core Information

- `call_id`: Unique identifier
- `call_type`: "web_call" or "phone_call"
- `agent_id`, `agent_name`, `agent_version`
- `call_status`: Current status
- `direction`: "inbound" or "outbound"

#### Timing & Duration

- `start_timestamp`: Milliseconds since epoch
- `end_timestamp`: Milliseconds since epoch
- `duration_ms`: Total duration

#### Transcript Data

- `transcript`: Plain text conversation
- `transcript_object`: Structured utterances with word-level timestamps
- `transcript_with_tool_calls`: Includes tool invocations
- `scrubbed_transcript_with_tool_calls`: PII-removed version

#### Audio & Logs

- `recording_url`: Single-channel recording
- `recording_multi_channel_url`: Multi-channel recording
- `scrubbed_recording_url`: PII-removed version
- `public_log_url`: Request/response debugging logs
- `knowledge_base_retrieved_contents_url`: Knowledge base contents

#### Analysis & Metrics

- `call_analysis`: Object with:
  - `summary`: String description
  - `user_sentiment`: "Positive" | "Negative" | "Neutral" | "Unknown"
  - `call_successful`: boolean
  - `in_voicemail`: boolean
  - `custom_analysis_data`: Custom extracted data

- `latency`: Performance metrics (p50, p90, p95, p99, max, min) for:
  - E2E (end-to-end)
  - LLM processing
  - TTS (text-to-speech)
  - Knowledge base retrieval
  - S2S (speech-to-speech)

- `llm_token_usage`: Token counts and statistics

#### Cost

- `call_cost`: Object with:
  - Product-specific costs
  - Combined total (in cents)
  - Duration-based pricing

#### Metadata

- `metadata`: Custom storage object
- `collected_dynamic_variables`: Variables extracted during call
- `disconnection_reason`: Why call ended (23+ possible reasons)

---

## Listing Call History

### API Endpoint

**POST** `https://api.retellai.com/v2/list-calls`

### Basic List Calls

```typescript
async function listRecentCalls() {
  try {
    const calls = await client.call.list();

    console.log(`Retrieved ${calls.length} calls`);

    calls.forEach((call) => {
      console.log(`Call ID: ${call.call_id}`);
      console.log(`Status: ${call.call_status}`);
      console.log(`Duration: ${call.duration_ms}ms`);
      console.log("---");
    });

    return calls;
  } catch (error) {
    console.error("Error listing calls:", error);
    throw error;
  }
}
```

### Advanced Filtering

```typescript
interface ListCallsParams {
  filter_criteria?: {
    // Agent & Call Identification
    agent_id?: string[];
    batch_call_id?: string[];
    version?: number[];

    // Call Status Filters
    call_status?: (
      | "registered"
      | "not_connected"
      | "ongoing"
      | "ended"
      | "error"
    )[];
    call_type?: ("web_call" | "phone_call")[];
    direction?: ("inbound" | "outbound")[];
    disconnection_reason?: string[];

    // Call Quality & Sentiment
    user_sentiment?: ("Positive" | "Negative" | "Neutral" | "Unknown")[];
    call_successful?: boolean;
    in_voicemail?: boolean;

    // Contact Information
    from_number?: string[];
    to_number?: string[];

    // Time & Duration Ranges
    start_timestamp?: {
      upper_threshold?: number;
      lower_threshold?: number;
    };
    duration_ms?: {
      upper_threshold?: number;
      lower_threshold?: number;
    };
    e2e_latency_p50?: {
      upper_threshold?: number;
      lower_threshold?: number;
    };
  };

  // Sorting & Pagination
  sort_order?: "ascending" | "descending"; // Default: descending
  limit?: number; // 1-1000, default: 50
  pagination_key?: string; // Call ID for next page
}

async function listCallsWithFilters() {
  const calls = await client.call.list({
    filter_criteria: {
      agent_id: ["agent_abc123"],
      call_status: ["ended"],
      call_successful: true,
      user_sentiment: ["Positive"],
      start_timestamp: {
        lower_threshold: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
      },
    },
    sort_order: "descending",
    limit: 100,
  });

  return calls;
}
```

### Pagination Example

```typescript
async function getAllCalls() {
  const allCalls = [];
  let paginationKey: string | undefined;

  do {
    const response = await client.call.list({
      limit: 1000, // Maximum per request
      pagination_key: paginationKey,
      sort_order: "descending",
    });

    allCalls.push(...response);

    // Get last call ID for next page
    if (response.length === 1000) {
      paginationKey = response[response.length - 1].call_id;
    } else {
      paginationKey = undefined; // No more pages
    }
  } while (paginationKey);

  return allCalls;
}
```

### Filter by Date Range

```typescript
async function getCallsForDateRange(startDate: Date, endDate: Date) {
  const calls = await client.call.list({
    filter_criteria: {
      start_timestamp: {
        lower_threshold: startDate.getTime(),
        upper_threshold: endDate.getTime(),
      },
    },
    sort_order: "ascending",
  });

  return calls;
}
```

### Filter by Agent and Status

```typescript
async function getSuccessfulCallsForAgent(agentId: string) {
  const calls = await client.call.list({
    filter_criteria: {
      agent_id: [agentId],
      call_status: ["ended"],
      call_successful: true,
    },
    limit: 100,
  });

  return calls;
}
```

---

## Dynamic Variables

### Variable Syntax

Dynamic variables use double curly braces: `{{variable_name}}`

### Where Variables Work

- Agent prompts
- Opening messages
- Tool configurations
- Voicemail settings
- Transfer phone numbers

### Setting Variables in Outbound Calls

```typescript
const response = await client.call.createPhoneCall({
  from_number: "+14157774444",
  to_number: "+12137774445",
  retell_llm_dynamic_variables: {
    customer_name: "John Doe",
    order_id: "ORD-12345",
    appointment_date: "2025-11-15",
    appointment_time: "2:30 PM",
    blood_group: "B+",
    // All values MUST be strings
  },
});
```

### Using Variables in Agent Prompts

When configuring your agent, use variables in prompts:

```
Hello {{customer_name}}, thanks for calling!
I see you're calling about order {{order_id}}.
Your appointment is scheduled for {{appointment_date}} at {{appointment_time}}.
```

### System Variables (Built-in)

Retell automatically provides these variables:

#### Time & Date

- `{{current_time}}` - Current time
- `{{current_time_pst}}`, `{{current_time_est}}`, etc. - Timezone-specific
- `{{current_calendar}}` - 14-day scheduling view

#### Call Information

- `{{call_id}}` - Unique call identifier
- `{{user_number}}` - Caller's phone number
- `{{agent_number}}` - Agent's phone number
- `{{session_type}}` - Type of session
- `{{session_duration}}` - Duration of session

### Important Notes

1. **String Values Only**: All dynamic variable values MUST be strings. Numbers, booleans, or objects are not supported.

```typescript
// ✅ CORRECT
retell_llm_dynamic_variables: {
  age: '25',              // String
  is_premium: 'true',     // String
  price: '99.99',         // String
}

// ❌ INCORRECT
retell_llm_dynamic_variables: {
  age: 25,                // Number - will fail
  is_premium: true,       // Boolean - will fail
  price: 99.99,           // Number - will fail
}
```

2. **Missing Variables**: If a variable isn't provided, it displays with curly braces intact (e.g., "Hello {{customer_name}}")

3. **Response Engine Only**: Dynamic variables only work with Retell's Response Engine, not custom LLM implementations

---

## TypeScript Types & Interfaces

### Available Types

The SDK exports TypeScript types for all API operations:

```typescript
import {
  Retell,
  AgentCreateParams,
  AgentResponse,
  CallCreateParams,
  CallResponse,
  // ... and more
} from "retell-sdk";
```

### Type-Safe Call Creation

```typescript
import { Retell } from "retell-sdk";

interface CreateCallParams {
  fromNumber: string;
  toNumber: string;
  customerName: string;
  orderId: string;
}

async function createTypeSafeCall(params: CreateCallParams) {
  const client = new Retell({
    apiKey: process.env.RETELL_API_KEY!,
  });

  const response = await client.call.createPhoneCall({
    from_number: params.fromNumber,
    to_number: params.toNumber,
    retell_llm_dynamic_variables: {
      customer_name: params.customerName,
      order_id: params.orderId,
    },
  });

  return response;
}
```

### Call Response Type

```typescript
interface RetellCallResponse {
  call_id: string;
  call_type: "web_call" | "phone_call";
  agent_id: string;
  agent_name: string;
  agent_version: number;
  call_status: "registered" | "not_connected" | "ongoing" | "ended" | "error";
  direction?: "inbound" | "outbound";
  from_number?: string;
  to_number?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  duration_ms?: number;
  transcript?: string;
  transcript_object?: Array<{
    role: "agent" | "user";
    content: string;
    words?: Array<{
      word: string;
      start: number;
      end: number;
    }>;
  }>;
  recording_url?: string;
  recording_multi_channel_url?: string;
  call_analysis?: {
    summary?: string;
    user_sentiment?: "Positive" | "Negative" | "Neutral" | "Unknown";
    call_successful?: boolean;
    in_voicemail?: boolean;
    custom_analysis_data?: Record<string, any>;
  };
  call_cost?: {
    combined?: number; // Total cost in cents
  };
  latency?: {
    e2e?: LatencyMetrics;
    llm?: LatencyMetrics;
    tts?: LatencyMetrics;
  };
  metadata?: Record<string, any>;
  disconnection_reason?: string;
}

interface LatencyMetrics {
  p50?: number;
  p90?: number;
  p95?: number;
  p99?: number;
  max?: number;
  min?: number;
}
```

---

## Next.js Integration

### Server Actions Pattern

Create a server action file for Retell operations:

**File**: `C:\Users\taylo\Documents\GitHub\odis-ai-web\src\actions\retell-actions.ts`

```typescript
"use server";

import Retell from "retell-sdk";
import { revalidatePath } from "next/cache";

// Initialize client
const getRetellClient = () => {
  if (!process.env.RETELL_API_KEY) {
    throw new Error("RETELL_API_KEY is not configured");
  }

  return new Retell({
    apiKey: process.env.RETELL_API_KEY,
  });
};

// Create outbound call
export async function createOutboundCall(
  toNumber: string,
  variables?: Record<string, string>,
) {
  try {
    const client = getRetellClient();

    const response = await client.call.createPhoneCall({
      from_number: process.env.RETELL_FROM_NUMBER!,
      to_number: toNumber,
      retell_llm_dynamic_variables: variables,
    });

    revalidatePath("/dashboard/calls");

    return {
      success: true,
      callId: response.call_id,
      status: response.call_status,
    };
  } catch (error) {
    console.error("Error creating call:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get call details
export async function getCallDetails(callId: string) {
  try {
    const client = getRetellClient();
    const call = await client.call.retrieve(callId);

    return {
      success: true,
      call,
    };
  } catch (error) {
    console.error("Error retrieving call:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// List calls with filters
export async function listCalls(filters?: {
  agentId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string[];
}) {
  try {
    const client = getRetellClient();

    const calls = await client.call.list({
      filter_criteria: {
        agent_id: filters?.agentId ? [filters.agentId] : undefined,
        call_status: filters?.status as any,
        start_timestamp:
          filters?.startDate || filters?.endDate
            ? {
                lower_threshold: filters?.startDate?.getTime(),
                upper_threshold: filters?.endDate?.getTime(),
              }
            : undefined,
      },
      sort_order: "descending",
      limit: 100,
    });

    return {
      success: true,
      calls,
    };
  } catch (error) {
    console.error("Error listing calls:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### Client Component Usage

**File**: `C:\Users\taylo\Documents\GitHub\odis-ai-web\src\components\call-button.tsx`

```typescript
'use client';

import { useState } from 'react';
import { createOutboundCall } from '@/actions/retell-actions';

export function CallButton({
  toNumber,
  customerName
}: {
  toNumber: string;
  customerName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);

  const handleCall = async () => {
    setLoading(true);

    try {
      const result = await createOutboundCall(toNumber, {
        customer_name: customerName,
        current_date: new Date().toISOString(),
      });

      if (result.success) {
        setCallId(result.callId);
        console.log('Call initiated:', result.callId);
      } else {
        console.error('Call failed:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCall}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? 'Calling...' : 'Start Call'}
      </button>

      {callId && (
        <p className="mt-2 text-sm text-gray-600">
          Call ID: {callId}
        </p>
      )}
    </div>
  );
}
```

### API Route Pattern (Alternative)

**File**: `C:\Users\taylo\Documents\GitHub\odis-ai-web\src\app\api\calls\create\route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import Retell from "retell-sdk";

const client = new Retell({
  apiKey: process.env.RETELL_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toNumber, variables } = body;

    if (!toNumber) {
      return NextResponse.json(
        { error: "toNumber is required" },
        { status: 400 },
      );
    }

    const response = await client.call.createPhoneCall({
      from_number: process.env.RETELL_FROM_NUMBER!,
      to_number: toNumber,
      retell_llm_dynamic_variables: variables,
    });

    return NextResponse.json({
      success: true,
      callId: response.call_id,
      status: response.call_status,
    });
  } catch (error) {
    console.error("Error creating call:", error);
    return NextResponse.json(
      { error: "Failed to create call" },
      { status: 500 },
    );
  }
}
```

### Environment Configuration

**File**: `C:\Users\taylo\Documents\GitHub\odis-ai-web\.env.local`

```env
# Retell AI Configuration
RETELL_API_KEY=your_api_key_here
RETELL_FROM_NUMBER=+14157774444
RETELL_AGENT_ID=agent_abc123

# Optional: For development/staging
NEXT_PUBLIC_APP_ENV=development
```

---

## Error Handling

### Error Types

The SDK throws `APIError` subclasses:

```typescript
import Retell, {
  BadRequestError,
  AuthenticationError,
  RateLimitError,
  InternalServerError,
} from "retell-sdk";
```

### Error Status Codes

| Status | Error Class           | Meaning                        |
| ------ | --------------------- | ------------------------------ |
| 400    | `BadRequestError`     | Invalid request format         |
| 401    | `AuthenticationError` | Missing/invalid API key        |
| 402    | -                     | Payment required (trial ended) |
| 422    | -                     | Asset not found under API key  |
| 429    | `RateLimitError`      | Rate limited                   |
| 500+   | `InternalServerError` | Server error                   |

### Comprehensive Error Handling

```typescript
import Retell, {
  BadRequestError,
  AuthenticationError,
  RateLimitError,
  InternalServerError,
} from "retell-sdk";

async function createCallWithErrorHandling(
  toNumber: string,
  variables: Record<string, string>,
) {
  try {
    const client = new Retell({
      apiKey: process.env.RETELL_API_KEY,
    });

    const response = await client.call.createPhoneCall({
      from_number: process.env.RETELL_FROM_NUMBER!,
      to_number: toNumber,
      retell_llm_dynamic_variables: variables,
    });

    return { success: true, data: response };
  } catch (error) {
    if (error instanceof BadRequestError) {
      console.error("Invalid request:", error.message);
      return { success: false, error: "Invalid phone number or parameters" };
    } else if (error instanceof AuthenticationError) {
      console.error("Authentication failed:", error.message);
      return { success: false, error: "API key is invalid" };
    } else if (error instanceof RateLimitError) {
      console.error("Rate limited:", error.message);
      return {
        success: false,
        error: "Too many requests, please try again later",
      };
    } else if (error instanceof InternalServerError) {
      console.error("Server error:", error.message);
      return {
        success: false,
        error: "Retell service is temporarily unavailable",
      };
    } else {
      console.error("Unexpected error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }
}
```

### Retry Logic

The SDK includes automatic retries:

- **Default**: 2 retries
- **Triggers**: Connection errors, 408, 429, 5xx responses
- **Timeout**: 1 minute default (configurable)

```typescript
// Custom retry configuration
const client = new Retell({
  apiKey: process.env.RETELL_API_KEY,
  maxRetries: 3,
  timeout: 60000, // 60 seconds
});
```

---

## Best Practices

### 1. Security

#### Never Expose API Keys

```typescript
// ✅ CORRECT - Server-side only
const client = new Retell({
  apiKey: process.env.RETELL_API_KEY,
});

// ❌ INCORRECT - Never in client components
const apiKey = "sk_live_..."; // Never hardcode
const apiKey = process.env.NEXT_PUBLIC_RETELL_API_KEY; // Never expose
```

#### Use Server Actions or API Routes

```typescript
// ✅ CORRECT - Server Actions
"use server";
export async function createCall() {
  const client = new Retell({ apiKey: process.env.RETELL_API_KEY });
  // ...
}

// ✅ CORRECT - API Route
export async function POST(request: NextRequest) {
  const client = new Retell({ apiKey: process.env.RETELL_API_KEY });
  // ...
}
```

### 2. Phone Number Formatting

Always use E.164 format:

```typescript
// ✅ CORRECT
const phoneNumber = "+14157774444";

// ❌ INCORRECT
const phoneNumber = "415-777-4444";
const phoneNumber = "(415) 777-4444";
const phoneNumber = "4157774444";
```

Helper function:

```typescript
function formatPhoneNumber(number: string): string {
  // Remove all non-numeric characters
  const cleaned = number.replace(/\D/g, "");

  // Add country code if missing (US example)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }

  throw new Error("Invalid phone number format");
}
```

### 3. Dynamic Variables

```typescript
// ✅ CORRECT - All strings
retell_llm_dynamic_variables: {
  customer_name: 'John Doe',
  age: '25',                    // String, not number
  is_premium: 'true',           // String, not boolean
  price: '99.99',               // String, not number
  items: 'item1, item2',        // String representation
}

// ❌ INCORRECT - Mixed types
retell_llm_dynamic_variables: {
  customer_name: 'John Doe',
  age: 25,                      // Number - will fail
  is_premium: true,             // Boolean - will fail
  items: ['item1', 'item2'],    // Array - will fail
}
```

### 4. Error Handling

Always wrap SDK calls:

```typescript
async function safeCreateCall(params: CallParams) {
  try {
    const response = await client.call.createPhoneCall(params);
    return { success: true, data: response };
  } catch (error) {
    console.error("Call creation failed:", error);

    // Log to monitoring service
    logError(error);

    // Return user-friendly message
    return {
      success: false,
      error: "Unable to initiate call. Please try again.",
    };
  }
}
```

### 5. Metadata Usage

Use metadata for tracking and analytics:

```typescript
const response = await client.call.createPhoneCall({
  from_number: "+14157774444",
  to_number: "+12137774445",
  metadata: {
    // Internal tracking
    customer_id: "cust_12345",
    campaign_id: "fall_2025",
    source: "web_dashboard",

    // Analytics
    user_timezone: "America/Los_Angeles",
    call_reason: "appointment_reminder",

    // A/B testing
    variant: "greeting_v2",
  },
});
```

### 6. Call Status Monitoring

Implement polling or webhooks for status updates:

```typescript
async function waitForCallCompletion(callId: string, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const call = await client.call.retrieve(callId);

    if (call.call_status === "ended" || call.call_status === "error") {
      return call;
    }

    // Wait 5 seconds before next check
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error("Call status check timeout");
}
```

### 7. Pagination Best Practices

```typescript
async function getAllCallsEfficiently(filters: FilterCriteria) {
  const allCalls = [];
  let paginationKey: string | undefined;
  let pageCount = 0;
  const maxPages = 10; // Safety limit

  do {
    const calls = await client.call.list({
      filter_criteria: filters,
      limit: 1000,
      pagination_key: paginationKey,
    });

    allCalls.push(...calls);

    if (calls.length === 1000 && pageCount < maxPages) {
      paginationKey = calls[calls.length - 1].call_id;
      pageCount++;
    } else {
      break;
    }
  } while (paginationKey);

  return allCalls;
}
```

### 8. Cost Monitoring

Track costs per call:

```typescript
async function analyzeCallCosts(startDate: Date, endDate: Date) {
  const calls = await client.call.list({
    filter_criteria: {
      start_timestamp: {
        lower_threshold: startDate.getTime(),
        upper_threshold: endDate.getTime(),
      },
      call_status: ["ended"],
    },
    limit: 1000,
  });

  const totalCost = calls.reduce((sum, call) => {
    return sum + (call.call_cost?.combined || 0);
  }, 0);

  const averageCost = totalCost / calls.length;

  return {
    totalCalls: calls.length,
    totalCost: totalCost / 100, // Convert cents to dollars
    averageCost: averageCost / 100,
    calls,
  };
}
```

### 9. Testing

Mock the Retell client for testing:

```typescript
// __mocks__/retell-sdk.ts
export default class MockRetell {
  call = {
    createPhoneCall: jest.fn().mockResolvedValue({
      call_id: "mock_call_id",
      call_status: "registered",
    }),
    retrieve: jest.fn().mockResolvedValue({
      call_id: "mock_call_id",
      call_status: "ended",
      duration_ms: 60000,
    }),
    list: jest.fn().mockResolvedValue([]),
  };
}

// test file
import Retell from "retell-sdk";

jest.mock("retell-sdk");

describe("Call Actions", () => {
  it("creates a call successfully", async () => {
    const result = await createOutboundCall("+12137774445", {
      customer_name: "Test User",
    });

    expect(result.success).toBe(true);
    expect(result.callId).toBe("mock_call_id");
  });
});
```

### 10. Logging and Monitoring

```typescript
import { logger } from "@/lib/logger";

async function createCallWithLogging(params: CallParams) {
  const startTime = Date.now();

  logger.info("Creating call", {
    to_number: params.toNumber,
    has_variables: !!params.variables,
  });

  try {
    const response = await client.call.createPhoneCall({
      from_number: process.env.RETELL_FROM_NUMBER!,
      to_number: params.toNumber,
      retell_llm_dynamic_variables: params.variables,
    });

    logger.info("Call created successfully", {
      call_id: response.call_id,
      status: response.call_status,
      duration_ms: Date.now() - startTime,
    });

    return { success: true, data: response };
  } catch (error) {
    logger.error("Call creation failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      to_number: params.toNumber,
      duration_ms: Date.now() - startTime,
    });

    throw error;
  }
}
```

---

## Additional Resources

### Official Documentation

- **Main Docs**: https://docs.retellai.com
- **SDK Reference**: https://docs.retellai.com/get-started/sdk
- **API Reference**: https://docs.retellai.com/api-references

### GitHub Repositories

- **TypeScript SDK**: https://github.com/RetellAI/retell-typescript-sdk
- **Python SDK**: https://github.com/RetellAI/retell-python-sdk
- **Client JS SDK**: https://github.com/RetellAI/retell-client-js-sdk

### NPM Package

- **Package**: https://www.npmjs.com/package/retell-sdk

### Integration Guides

- **Next.js**: https://www.retellai.com/integrations/next-js
- **JavaScript**: https://www.retellai.com/integrations/javascript

---

## Summary

### Quick Start Checklist

1. ✅ Install SDK: `npm install retell-sdk`
2. ✅ Get API key from Retell AI dashboard
3. ✅ Add to `.env.local`: `RETELL_API_KEY=your_key`
4. ✅ Initialize client in server code
5. ✅ Create server actions or API routes
6. ✅ Implement error handling
7. ✅ Test with development phone number
8. ✅ Monitor call status and costs

### Key Takeaways

- **Server-Side Only**: Never expose API keys to client
- **E.164 Format**: Always use proper phone number formatting
- **String Variables**: Dynamic variables must be strings
- **Error Handling**: Always wrap SDK calls in try-catch
- **Monitoring**: Track call status, costs, and performance
- **Testing**: Mock the SDK for unit tests
- **Security**: Use environment variables and server actions

### Next Steps

1. Set up Retell AI account and get API key
2. Configure phone number in Retell dashboard
3. Create and test agent configuration
4. Implement server actions for call management
5. Build UI components for call initiation
6. Set up webhooks for call status updates
7. Implement analytics and cost tracking

---

**Generated**: 2025-11-03
**Documentation Version**: Retell AI v2 API
**SDK Version**: Latest (retell-sdk NPM package)
