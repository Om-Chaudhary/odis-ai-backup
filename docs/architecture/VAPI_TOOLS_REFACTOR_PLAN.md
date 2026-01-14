# VAPI Tools Refactoring Plan

> Enterprise-ready, scalable architecture for multi-clinic VAPI tool integrations

## Executive Summary

This document outlines a comprehensive refactoring plan for ODIS AI's VAPI tool call infrastructure. The goal is to eliminate code duplication, establish consistent patterns, and create a scalable foundation for onboarding unlimited clinics without code changes.

**Key Outcomes:**
- 80% reduction in route handler code
- Zero-code clinic onboarding
- Centralized error handling and observability
- Type-safe tool definitions with runtime validation
- Enterprise security patterns (rate limiting, audit logging)

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Implementation Phases](#3-implementation-phases)
4. [Detailed Technical Design](#4-detailed-technical-design)
5. [Database Schema Enhancements](#5-database-schema-enhancements)
6. [Security & Compliance](#6-security--compliance)
7. [Observability & Monitoring](#7-observability--monitoring)
8. [Testing Strategy](#8-testing-strategy)
9. [Clinic Onboarding Workflow](#9-clinic-onboarding-workflow)
10. [Migration Plan](#10-migration-plan)

---

## 1. Current State Analysis

### Existing Structure

```
apps/web/src/app/api/vapi/
├── tools/
│   ├── book-appointment/route.ts      (~840 lines, massive duplication)
│   ├── check-availability/route.ts    (~420 lines)
│   └── check-availability-range/route.ts
├── inbound/tools/
│   ├── leave-message/route.ts         (~520 lines)
│   ├── log-emergency-triage/route.ts  (~470 lines)
│   └── create-refill-request/route.ts
└── schedule-appointment/route.ts      (legacy)
```

### Problems Identified

| Issue | Impact | Severity |
|-------|--------|----------|
| Code duplication (~300 lines repeated per route) | Maintenance burden, inconsistent behavior | High |
| Shared library exists but unused | Wasted effort, knowledge loss | Medium |
| No centralized error handling | Inconsistent error responses | High |
| No rate limiting | DDoS vulnerability | Critical |
| No audit logging | Compliance risk | High |
| No health check endpoints | Operations blind spot | Medium |
| Hardcoded assistant IDs | Manual code changes per clinic | High |

### Existing Shared Library (Underutilized)

```
libs/integrations/vapi/src/inbound-tools/
├── index.ts                    # Exports all utilities
├── extract-tool-arguments.ts   # VAPI payload extraction
├── build-vapi-response.ts      # Response formatting
├── find-clinic-by-assistant.ts # Clinic resolution
└── schemas.ts                  # Zod schemas (partial)
```

---

## 2. Target Architecture

### Design Principles

1. **Single Responsibility**: Each module does one thing well
2. **Dependency Injection**: Services accept interfaces for testability
3. **Fail Fast**: Validate early, fail with clear errors
4. **Observable**: Every operation is logged and metered
5. **Secure by Default**: Auth, rate limiting, input validation

### Target Structure

```
libs/integrations/vapi/src/
├── index.ts                         # Public API
├── types.ts                         # Shared types
│
├── core/                            # Core infrastructure
│   ├── tool-handler.ts              # Generic tool handler factory
│   ├── clinic-resolver.ts           # Clinic context resolution
│   ├── request-parser.ts            # VAPI payload parsing
│   ├── response-builder.ts          # VAPI response formatting
│   ├── error-handler.ts             # Centralized error handling
│   └── middleware.ts                # Rate limiting, auth, logging
│
├── tools/                           # Tool definitions (schemas + handlers)
│   ├── booking/
│   │   ├── index.ts
│   │   ├── schemas.ts               # CheckAvailability, BookAppointment
│   │   ├── check-availability.ts    # Handler logic only
│   │   └── book-appointment.ts
│   ├── messaging/
│   │   ├── index.ts
│   │   ├── schemas.ts               # LeaveMessage, EmergencyTriage
│   │   ├── leave-message.ts
│   │   └── log-emergency-triage.ts
│   ├── clinical/
│   │   ├── index.ts
│   │   ├── schemas.ts               # RefillRequest, LabInquiry
│   │   └── create-refill-request.ts
│   └── info/
│       ├── index.ts
│       ├── schemas.ts               # ClinicInfo, ERInfo
│       └── get-clinic-info.ts
│
├── webhooks/                        # Webhook handlers (non-tool)
│   └── handlers/                    # (existing)
│
└── __tests__/                       # Comprehensive tests
    ├── core/
    └── tools/

apps/web/src/app/api/vapi/
├── tools/
│   ├── booking/
│   │   ├── check-availability/route.ts   # ~20 lines (thin wrapper)
│   │   └── book-appointment/route.ts
│   ├── messaging/
│   │   ├── leave-message/route.ts
│   │   └── log-emergency-triage/route.ts
│   ├── clinical/
│   │   └── create-refill-request/route.ts
│   └── info/
│       └── get-clinic-info/route.ts
├── health/route.ts                       # Health check endpoint
└── webhooks/                             # Keep existing structure
```

---

## 3. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
**Goal**: Build the foundation that all tools will use

| Task | Description | Priority |
|------|-------------|----------|
| 1.1 | Create `core/tool-handler.ts` - Generic handler factory | P0 |
| 1.2 | Create `core/clinic-resolver.ts` - Unified clinic lookup | P0 |
| 1.3 | Create `core/request-parser.ts` - VAPI payload extraction | P0 |
| 1.4 | Create `core/response-builder.ts` - Response utilities | P0 |
| 1.5 | Create `core/error-handler.ts` - Centralized errors | P0 |
| 1.6 | Create `core/middleware.ts` - Rate limiting, logging | P1 |
| 1.7 | Add comprehensive tests for core modules | P0 |

### Phase 2: Tool Migration (Week 2)
**Goal**: Migrate existing tools to new pattern

| Task | Description | Priority |
|------|-------------|----------|
| 2.1 | Migrate `check-availability` tool | P0 |
| 2.2 | Migrate `book-appointment` tool | P0 |
| 2.3 | Migrate `leave-message` tool | P0 |
| 2.4 | Migrate `log-emergency-triage` tool | P0 |
| 2.5 | Migrate `create-refill-request` tool | P1 |
| 2.6 | Add integration tests for all tools | P0 |
| 2.7 | Update API routes to use new handlers | P0 |

### Phase 3: Enterprise Features (Week 3)
**Goal**: Add production-ready features

| Task | Description | Priority |
|------|-------------|----------|
| 3.1 | Implement rate limiting per clinic | P0 |
| 3.2 | Add audit logging for all tool calls | P0 |
| 3.3 | Create health check endpoint | P1 |
| 3.4 | Add metrics/tracing integration | P1 |
| 3.5 | Create admin dashboard for tool monitoring | P2 |

### Phase 4: Database & Onboarding (Week 4)
**Goal**: Streamline clinic onboarding

| Task | Description | Priority |
|------|-------------|----------|
| 4.1 | Create `clinic_tool_configs` table | P1 |
| 4.2 | Create onboarding SQL scripts | P1 |
| 4.3 | Build admin UI for clinic VAPI config | P2 |
| 4.4 | Write onboarding documentation | P1 |
| 4.5 | Create automated tests for onboarding flow | P1 |

---

## 4. Detailed Technical Design

### 4.1 Tool Handler Factory

The core pattern that eliminates boilerplate:

```typescript
// libs/integrations/vapi/src/core/tool-handler.ts

import type { NextRequest } from "next/server";
import type { ZodSchema, z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";

/**
 * Context provided to every tool handler
 */
export interface ToolContext {
  /** The resolved clinic */
  clinic: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    config?: ClinicConfig;
  };
  /** VAPI call metadata */
  call: {
    id: string;
    assistantId: string;
    phoneNumberId?: string;
  };
  /** Tool call metadata */
  toolCall: {
    id: string;
    name: string;
  };
  /** Supabase service client (bypasses RLS) */
  supabase: SupabaseClient<Database>;
  /** Structured logger with context */
  logger: Logger;
  /** Request timestamp */
  timestamp: Date;
}

/**
 * Result returned from tool handlers
 */
export interface ToolResult {
  success: boolean;
  message: string;  // Human-readable for voice AI
  data?: Record<string, unknown>;
  error?: string;   // Error code for logging
}

/**
 * Tool handler options
 */
export interface ToolHandlerOptions<TSchema extends ZodSchema> {
  /** Tool name for logging/metrics */
  name: string;
  /** Zod schema for input validation */
  schema: TSchema;
  /** The handler function (pure business logic) */
  handler: (
    input: z.infer<TSchema>,
    context: ToolContext
  ) => Promise<ToolResult>;
  /** Optional: Skip clinic resolution (for global tools) */
  skipClinicResolution?: boolean;
  /** Optional: Custom rate limit (requests per minute) */
  rateLimit?: number;
}

/**
 * Creates a Next.js route handler for a VAPI tool
 *
 * @example
 * ```typescript
 * // route.ts
 * import { createToolHandler } from "@odis-ai/integrations/vapi";
 * import { CheckAvailabilitySchema, checkAvailability } from "./handler";
 *
 * export const POST = createToolHandler({
 *   name: "check-availability",
 *   schema: CheckAvailabilitySchema,
 *   handler: checkAvailability,
 * });
 *
 * export { OPTIONS } from "@odis-ai/integrations/vapi";
 * ```
 */
export function createToolHandler<TSchema extends ZodSchema>(
  options: ToolHandlerOptions<TSchema>
): (request: NextRequest) => Promise<Response> {
  const { name, schema, handler, skipClinicResolution, rateLimit } = options;

  return async function POST(request: NextRequest): Promise<Response> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    const logger = loggers.api.child("vapi-tool", {
      tool: name,
      requestId,
    });

    try {
      // 1. Parse VAPI request
      const rawBody = await request.json();
      const parsed = parseVapiRequest(rawBody);

      logger.info("Tool call received", {
        toolCallId: parsed.toolCallId,
        assistantId: parsed.assistantId,
        callId: parsed.callId,
      });

      // 2. Rate limiting check
      if (rateLimit) {
        const rateLimitResult = await checkRateLimit(
          parsed.assistantId ?? "global",
          name,
          rateLimit
        );
        if (!rateLimitResult.allowed) {
          logger.warn("Rate limit exceeded", { remaining: rateLimitResult.remaining });
          return buildErrorResponse(request, "rate_limit_exceeded",
            "We're receiving too many requests. Please try again in a moment.",
            parsed.toolCallId, 429);
        }
      }

      // 3. Validate input
      const validation = schema.safeParse(parsed.arguments);
      if (!validation.success) {
        logger.warn("Validation failed", {
          errors: validation.error.format(),
          received: parsed.arguments,
        });
        return buildErrorResponse(request, "validation_error",
          formatValidationError(validation.error),
          parsed.toolCallId, 400);
      }

      // 4. Resolve clinic context
      const supabase = await createServiceClient();
      let clinic: ToolContext["clinic"] | null = null;

      if (!skipClinicResolution) {
        clinic = await resolveClinic(supabase, {
          clinicId: validation.data.clinic_id,
          assistantId: parsed.assistantId,
        });

        if (!clinic) {
          logger.error("Clinic resolution failed", {
            clinicId: validation.data.clinic_id,
            assistantId: parsed.assistantId,
          });
          return buildErrorResponse(request, "clinic_not_found",
            "I couldn't identify the clinic. Please try again later.",
            parsed.toolCallId, 404);
        }

        logger.addContext({ clinicId: clinic.id, clinicName: clinic.name });
      }

      // 5. Build context
      const context: ToolContext = {
        clinic: clinic!,
        call: {
          id: parsed.callId ?? requestId,
          assistantId: parsed.assistantId ?? "unknown",
          phoneNumberId: parsed.phoneNumberId,
        },
        toolCall: {
          id: parsed.toolCallId ?? requestId,
          name,
        },
        supabase,
        logger,
        timestamp: new Date(),
      };

      // 6. Execute handler
      const result = await handler(validation.data, context);

      // 7. Audit log
      await auditLog(supabase, {
        tool_name: name,
        clinic_id: clinic?.id,
        call_id: parsed.callId,
        tool_call_id: parsed.toolCallId,
        input: validation.data,
        output: result,
        success: result.success,
        duration_ms: Date.now() - startTime,
      });

      // 8. Return response
      logger.info("Tool call completed", {
        success: result.success,
        durationMs: Date.now() - startTime,
      });

      if (result.success) {
        return buildSuccessResponse(request, result.data ?? {},
          result.message, parsed.toolCallId);
      } else {
        return buildErrorResponse(request, result.error ?? "handler_error",
          result.message, parsed.toolCallId);
      }

    } catch (error) {
      logger.error("Unexpected error in tool handler", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Record error in audit log
      try {
        const supabase = await createServiceClient();
        await auditLog(supabase, {
          tool_name: name,
          error: error instanceof Error ? error.message : String(error),
          success: false,
          duration_ms: Date.now() - startTime,
        });
      } catch {
        // Don't fail on audit log errors
      }

      return buildErrorResponse(request, "internal_error",
        "Something went wrong. Please try again.",
        undefined, 500);
    }
  };
}

/**
 * CORS OPTIONS handler - export for routes
 */
export { handleCorsPreflightRequest as OPTIONS } from "./response-builder";
```

### 4.2 Route Handler (Thin Wrapper)

Each route becomes minimal:

```typescript
// apps/web/src/app/api/vapi/tools/booking/check-availability/route.ts

import { createToolHandler, OPTIONS } from "@odis-ai/integrations/vapi";
import { CheckAvailabilitySchema, checkAvailability } from "@odis-ai/integrations/vapi/tools/booking";

export const POST = createToolHandler({
  name: "check-availability",
  schema: CheckAvailabilitySchema,
  handler: checkAvailability,
  rateLimit: 60, // 60 requests per minute per clinic
});

export { OPTIONS };
```

### 4.3 Tool Handler Implementation

Pure business logic, no boilerplate:

```typescript
// libs/integrations/vapi/src/tools/booking/check-availability.ts

import { z } from "zod";
import type { ToolContext, ToolResult } from "../../core/tool-handler";

export const CheckAvailabilitySchema = z.object({
  // Strict ISO date format
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/,
    "Date must be in YYYY-MM-DD format"),
  // Optional: include blocked slots in response
  include_blocked: z.boolean().optional().default(false),
  // Optional: direct clinic ID (for testing)
  clinic_id: z.string().uuid().optional(),
});

export type CheckAvailabilityInput = z.infer<typeof CheckAvailabilitySchema>;

export async function checkAvailability(
  input: CheckAvailabilityInput,
  ctx: ToolContext
): Promise<ToolResult> {
  const { date, include_blocked } = input;
  const { clinic, supabase, logger } = ctx;

  // Validate date is not in the past (clinic timezone)
  const clinicNow = new Date().toLocaleString("en-US", {
    timeZone: clinic.timezone
  });
  const todayClinic = new Date(clinicNow);
  todayClinic.setHours(0, 0, 0, 0);

  const [y, m, d] = date.split("-").map(Number);
  const requestedDate = new Date(y!, m! - 1, d!);

  if (requestedDate < todayClinic) {
    return {
      success: false,
      error: "past_date",
      message: "I can only check availability for today or future dates.",
    };
  }

  // Query available slots
  const { data: slots, error } = await supabase.rpc("get_available_slots", {
    p_clinic_id: clinic.id,
    p_date: date,
  });

  if (error) {
    logger.error("Database error fetching slots", { error });
    return {
      success: false,
      error: "database_error",
      message: "I'm having trouble seeing the calendar right now.",
    };
  }

  const openSlots = (slots ?? []).filter(
    (slot) => !slot.is_blocked && slot.available_count > 0
  );

  // Format response
  const dateForVoice = requestedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (openSlots.length === 0) {
    return {
      success: true,
      message: `I don't have any appointments available on ${dateForVoice}. Would you like me to check the next day?`,
      data: {
        available: false,
        date,
        formatted_date: dateForVoice,
        times: [],
      },
    };
  }

  const times = openSlots.map((slot) => ({
    time_12h: formatTime12Hour(slot.slot_start),
    time_24h: slot.slot_start,
    value: slot.slot_start,
    slots_remaining: slot.available_count,
  }));

  const timeList = times.slice(0, 4).map((t) => t.time_12h).join(", ");

  return {
    success: true,
    message: `I have availability on ${dateForVoice}. Times include ${timeList}. Which works best?`,
    data: {
      available: true,
      date,
      formatted_date: dateForVoice,
      count: times.length,
      times,
    },
  };
}

function formatTime12Hour(time24: string): string {
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr ?? "0", 10);
  const minute = minuteStr ?? "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}
```

---

## 5. Database Schema Enhancements

### 5.1 Tool Audit Log Table

```sql
-- Track all VAPI tool calls for compliance and debugging
CREATE TABLE vapi_tool_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tool identification
  tool_name text NOT NULL,
  tool_call_id text,

  -- Call context
  clinic_id uuid REFERENCES clinics(id),
  call_id text,
  assistant_id text,

  -- Request/Response
  input jsonb NOT NULL DEFAULT '{}',
  output jsonb NOT NULL DEFAULT '{}',

  -- Outcome
  success boolean NOT NULL,
  error_code text,
  error_message text,
  duration_ms integer,

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Indexes for common queries
  CONSTRAINT valid_duration CHECK (duration_ms >= 0)
);

-- Indexes
CREATE INDEX idx_vapi_tool_audit_clinic_id ON vapi_tool_audit_log(clinic_id);
CREATE INDEX idx_vapi_tool_audit_tool_name ON vapi_tool_audit_log(tool_name);
CREATE INDEX idx_vapi_tool_audit_created_at ON vapi_tool_audit_log(created_at DESC);
CREATE INDEX idx_vapi_tool_audit_call_id ON vapi_tool_audit_log(call_id);
CREATE INDEX idx_vapi_tool_audit_success ON vapi_tool_audit_log(success) WHERE NOT success;

-- Partition by month for performance at scale
-- (implement when table grows large)

-- RLS: Only admins can view audit logs
ALTER TABLE vapi_tool_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON vapi_tool_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can insert audit logs"
  ON vapi_tool_audit_log FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

### 5.2 Clinic Tool Configuration Table

```sql
-- Per-clinic tool configuration and feature flags
CREATE TABLE clinic_tool_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Tool enablement
  enabled_tools text[] NOT NULL DEFAULT ARRAY[
    'check-availability',
    'book-appointment',
    'leave-message',
    'log-emergency-triage'
  ],

  -- Rate limits (requests per minute)
  rate_limit_booking integer NOT NULL DEFAULT 60,
  rate_limit_messaging integer NOT NULL DEFAULT 120,
  rate_limit_clinical integer NOT NULL DEFAULT 30,

  -- Feature flags
  features jsonb NOT NULL DEFAULT '{
    "appointment_booking": true,
    "emergency_triage": true,
    "medication_refills": false,
    "lab_results": false,
    "billing_inquiries": false
  }'::jsonb,

  -- Custom prompts/overrides per clinic
  custom_prompts jsonb DEFAULT '{}',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(clinic_id)
);

CREATE TRIGGER trigger_clinic_tool_configs_updated_at
  BEFORE UPDATE ON clinic_tool_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 5.3 Enhanced vapi_assistant_mappings

```sql
-- Add tool configuration to assistant mappings
ALTER TABLE vapi_assistant_mappings
ADD COLUMN IF NOT EXISTS tool_server_url text,
ADD COLUMN IF NOT EXISTS enabled_tools text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

COMMENT ON COLUMN vapi_assistant_mappings.tool_server_url IS
  'Override server URL for this assistant (usually NULL, uses default)';
COMMENT ON COLUMN vapi_assistant_mappings.enabled_tools IS
  'List of tool names enabled for this assistant';
```

---

## 6. Security & Compliance

### 6.1 Rate Limiting Strategy

```typescript
// libs/integrations/vapi/src/core/rate-limiter.ts

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Different rate limiters for different tool categories
const rateLimiters = {
  booking: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 req/min
    prefix: "vapi:rl:booking",
  }),
  messaging: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, "1 m"), // 120 req/min
    prefix: "vapi:rl:messaging",
  }),
  clinical: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 req/min
    prefix: "vapi:rl:clinical",
  }),
};

export async function checkRateLimit(
  identifier: string,  // clinic_id or assistant_id
  toolCategory: keyof typeof rateLimiters,
  customLimit?: number
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const limiter = rateLimiters[toolCategory];
  const result = await limiter.limit(identifier);

  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
```

### 6.2 Input Sanitization

```typescript
// All inputs are validated via Zod schemas
// Additional sanitization for sensitive fields

export function sanitizePhoneNumber(phone: string): string {
  // Strip to digits only, validate E.164 format
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    throw new ValidationError("Invalid phone number format");
  }
  return digits.startsWith("1") ? `+${digits}` : `+1${digits}`;
}

export function sanitizePatientName(name: string): string {
  // Remove potential injection characters, normalize whitespace
  return name
    .replace(/[<>'"&]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100); // Max length
}
```

### 6.3 Webhook Signature Verification

```typescript
// libs/integrations/vapi/src/core/webhook-auth.ts

import { createHmac, timingSafeEqual } from "crypto";

export function verifyVapiSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer);
}
```

---

## 7. Observability & Monitoring

### 7.1 Structured Logging

```typescript
// Every tool call logs:
{
  "level": "info",
  "message": "Tool call completed",
  "tool": "check-availability",
  "requestId": "uuid",
  "clinicId": "uuid",
  "clinicName": "Alum Rock Animal Hospital",
  "callId": "vapi-call-id",
  "toolCallId": "vapi-tool-call-id",
  "assistantId": "vapi-assistant-id",
  "success": true,
  "durationMs": 145,
  "timestamp": "2025-01-14T10:30:00Z"
}
```

### 7.2 Metrics to Track

| Metric | Type | Labels |
|--------|------|--------|
| `vapi_tool_calls_total` | Counter | tool, clinic, success |
| `vapi_tool_duration_ms` | Histogram | tool, clinic |
| `vapi_tool_errors_total` | Counter | tool, clinic, error_code |
| `vapi_rate_limit_hits_total` | Counter | tool, clinic |

### 7.3 Health Check Endpoint

```typescript
// apps/web/src/app/api/vapi/health/route.ts

export async function GET() {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkVapiConnection(),
  ]);

  const healthy = checks.every((c) => c.healthy);

  return Response.json({
    status: healthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks: Object.fromEntries(checks.map((c) => [c.name, c])),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
  }, {
    status: healthy ? 200 : 503,
  });
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// libs/integrations/vapi/src/tools/booking/__tests__/check-availability.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkAvailability, CheckAvailabilitySchema } from "../check-availability";
import { createMockToolContext } from "@odis-ai/shared/testing";

describe("checkAvailability", () => {
  const mockContext = createMockToolContext({
    clinic: {
      id: "clinic-uuid",
      name: "Test Clinic",
      timezone: "America/Los_Angeles",
    },
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-14T10:00:00-08:00"));
  });

  it("validates date format", () => {
    const result = CheckAvailabilitySchema.safeParse({ date: "tomorrow" });
    expect(result.success).toBe(false);
  });

  it("rejects past dates", async () => {
    const result = await checkAvailability(
      { date: "2025-01-13" },
      mockContext
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("past_date");
  });

  it("returns available slots", async () => {
    mockContext.supabase.rpc.mockResolvedValueOnce({
      data: [
        { slot_start: "09:00:00", available_count: 2, is_blocked: false },
        { slot_start: "10:00:00", available_count: 1, is_blocked: false },
      ],
      error: null,
    });

    const result = await checkAvailability(
      { date: "2025-01-15" },
      mockContext
    );

    expect(result.success).toBe(true);
    expect(result.data?.available).toBe(true);
    expect(result.data?.times).toHaveLength(2);
  });
});
```

### 8.2 Integration Tests

```typescript
// apps/web/src/app/api/vapi/tools/booking/check-availability/__tests__/route.test.ts

import { describe, it, expect } from "vitest";
import { POST } from "../route";
import { createMockNextRequest } from "@odis-ai/shared/testing";

describe("POST /api/vapi/tools/booking/check-availability", () => {
  it("handles VAPI payload format", async () => {
    const request = createMockNextRequest({
      method: "POST",
      body: {
        message: {
          call: {
            id: "call-123",
            assistantId: "assistant-456",
          },
          toolCallList: [{
            id: "tool-call-789",
            function: {
              arguments: { date: "2025-01-15" },
            },
          }],
        },
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results[0].toolCallId).toBe("tool-call-789");
  });
});
```

### 8.3 E2E Tests

```typescript
// e2e/vapi-tools.spec.ts

import { test, expect } from "@playwright/test";

test.describe("VAPI Tool Endpoints", () => {
  test("check-availability returns valid response", async ({ request }) => {
    const response = await request.post("/api/vapi/tools/booking/check-availability", {
      data: {
        message: {
          call: { assistantId: "test-assistant-id" },
          toolCallList: [{
            id: "test-tool-call",
            function: { arguments: { date: "2025-01-20" } },
          }],
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.results).toBeDefined();
  });
});
```

---

## 9. Clinic Onboarding Workflow

### 9.1 Database Setup Script

```sql
-- scripts/onboard-clinic.sql
-- Run with: psql $DATABASE_URL -v clinic_name='New Clinic' -v assistant_id='xxx' -f onboard-clinic.sql

DO $$
DECLARE
  v_clinic_id UUID;
  v_clinic_name TEXT := :'clinic_name';
  v_inbound_assistant_id TEXT := :'inbound_assistant_id';
  v_outbound_assistant_id TEXT := :'outbound_assistant_id';
  v_phone_number_id TEXT := :'phone_number_id';
BEGIN
  -- 1. Create or get clinic
  INSERT INTO clinics (name, slug, timezone, is_active)
  VALUES (
    v_clinic_name,
    lower(regexp_replace(v_clinic_name, '[^a-zA-Z0-9]+', '-', 'g')),
    'America/Los_Angeles',
    true
  )
  ON CONFLICT (name) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_clinic_id;

  -- 2. Update VAPI configuration
  UPDATE clinics SET
    inbound_assistant_id = v_inbound_assistant_id,
    outbound_assistant_id = v_outbound_assistant_id,
    phone_number_id = v_phone_number_id
  WHERE id = v_clinic_id;

  -- 3. Create assistant mappings
  INSERT INTO vapi_assistant_mappings (
    assistant_id, assistant_name, assistant_type, clinic_id, environment, is_active
  ) VALUES
    (v_inbound_assistant_id, v_clinic_name || ' Inbound', 'inbound', v_clinic_id, 'production', true),
    (v_outbound_assistant_id, v_clinic_name || ' Outbound', 'outbound', v_clinic_id, 'production', true)
  ON CONFLICT (assistant_id) DO UPDATE SET
    clinic_id = EXCLUDED.clinic_id,
    is_active = true,
    updated_at = now();

  -- 4. Create default tool configuration
  INSERT INTO clinic_tool_configs (clinic_id)
  VALUES (v_clinic_id)
  ON CONFLICT (clinic_id) DO NOTHING;

  RAISE NOTICE 'Clinic onboarded: % (ID: %)', v_clinic_name, v_clinic_id;
END $$;
```

### 9.2 VAPI Dashboard Checklist

For each new clinic:

1. **Create Assistants** (or clone from template)
   - [ ] Inbound Assistant: `{clinic_slug}_inbound`
   - [ ] Outbound Assistant: `{clinic_slug}_outbound` (if needed)

2. **Configure Tools** (all point to same server URL)
   - [ ] `{clinic_slug}_check_availability` → `https://odisai.net/api/vapi/tools/booking/check-availability`
   - [ ] `{clinic_slug}_book_appointment` → `https://odisai.net/api/vapi/tools/booking/book-appointment`
   - [ ] `leave_message` → `https://odisai.net/api/vapi/tools/messaging/leave-message`
   - [ ] `log_emergency_triage` → `https://odisai.net/api/vapi/tools/messaging/log-emergency-triage`

3. **Assign Phone Number**
   - [ ] Configure SIP trunk/phone number
   - [ ] Assign to inbound assistant

4. **Test**
   - [ ] Make test inbound call
   - [ ] Verify clinic resolution
   - [ ] Check audit logs

---

## 10. Migration Plan

### Week 1: Core Infrastructure

```bash
# Day 1-2: Create core modules
libs/integrations/vapi/src/core/
├── tool-handler.ts
├── clinic-resolver.ts
├── request-parser.ts
├── response-builder.ts
└── error-handler.ts

# Day 3-4: Add tests
libs/integrations/vapi/src/core/__tests__/
├── tool-handler.test.ts
├── clinic-resolver.test.ts
└── request-parser.test.ts

# Day 5: Rate limiting & middleware
libs/integrations/vapi/src/core/
├── rate-limiter.ts
└── middleware.ts
```

### Week 2: Tool Migration

```bash
# Migrate one tool at a time, keeping old routes as fallback

# Day 1: check-availability
git checkout -b refactor/vapi-tools-check-availability
# Implement, test, PR, merge

# Day 2: book-appointment
git checkout -b refactor/vapi-tools-book-appointment
# ...

# Day 3-4: messaging tools
# Day 5: clinical tools + cleanup
```

### Week 3: Enterprise Features

```bash
# Day 1-2: Audit logging
supabase/migrations/xxx_create_vapi_audit_log.sql
libs/integrations/vapi/src/core/audit-logger.ts

# Day 3: Health checks & metrics
apps/web/src/app/api/vapi/health/route.ts

# Day 4-5: Monitoring dashboard
# (optional, can defer)
```

### Week 4: Documentation & Onboarding

```bash
# Day 1-2: Onboarding scripts
scripts/onboard-clinic.sql
scripts/onboard-clinic.ts  # Node wrapper

# Day 3: Documentation
docs/operations/CLINIC_ONBOARDING.md
docs/architecture/VAPI_TOOLS.md

# Day 4-5: Admin UI for clinic config
# (optional, can defer)
```

---

## Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| Lines of code per route | ~500-800 | ~20-30 |
| Time to onboard new clinic | ~2 hours (manual) | ~15 min (scripted) |
| Test coverage | ~0% | >80% |
| Rate limiting | None | Per-clinic, per-tool |
| Audit logging | None | 100% of tool calls |
| Mean response time | ~500ms | <300ms |
| Error handling consistency | Varies | 100% consistent |

---

## Appendix: File Changes Summary

### New Files to Create

```
libs/integrations/vapi/src/
├── core/
│   ├── index.ts
│   ├── tool-handler.ts
│   ├── clinic-resolver.ts
│   ├── request-parser.ts
│   ├── response-builder.ts
│   ├── error-handler.ts
│   ├── rate-limiter.ts
│   ├── middleware.ts
│   └── audit-logger.ts
├── tools/
│   ├── booking/
│   │   ├── index.ts
│   │   ├── schemas.ts
│   │   ├── check-availability.ts
│   │   └── book-appointment.ts
│   ├── messaging/
│   │   ├── index.ts
│   │   ├── schemas.ts
│   │   ├── leave-message.ts
│   │   └── log-emergency-triage.ts
│   └── clinical/
│       ├── index.ts
│       └── create-refill-request.ts
└── __tests__/
    └── ...

supabase/migrations/
├── xxx_create_vapi_audit_log.sql
└── xxx_create_clinic_tool_configs.sql

docs/
├── architecture/VAPI_TOOLS.md
└── operations/CLINIC_ONBOARDING.md
```

### Files to Modify

```
apps/web/src/app/api/vapi/tools/
├── booking/
│   ├── check-availability/route.ts  # Rewrite to thin wrapper
│   └── book-appointment/route.ts    # Rewrite to thin wrapper
└── messaging/
    ├── leave-message/route.ts       # Rewrite
    └── log-emergency-triage/route.ts # Rewrite
```

### Files to Delete (After Migration)

```
# Old routes (after migration verified)
apps/web/src/app/api/vapi/schedule-appointment/  # Legacy
apps/web/src/app/api/vapi/inbound/tools/         # Merged into tools/messaging/
```

---

## 11. Current Tools Inventory

This refactoring covers the **existing tools only**. No new tools are added.

### 11.1 Existing API Routes (to be refactored)

| Route | Tool Name | Category | Description |
|-------|-----------|----------|-------------|
| `/api/vapi/tools/check-availability` | `check_availability` | booking | Check appointment slots for a date |
| `/api/vapi/tools/check-availability-range` | `check_availability_range` | booking | Check slots across date range |
| `/api/vapi/tools/book-appointment` | `book_appointment` | booking | Book with 5-min hold |
| `/api/vapi/inbound/tools/leave-message` | `leave_message` | messaging | Callback request logging |
| `/api/vapi/inbound/tools/log-emergency-triage` | `log_emergency_triage` | messaging | Emergency assessment logging |
| `/api/vapi/inbound/tools/create-refill-request` | `create_refill_request` | clinical | Medication refill request |
| `/api/vapi/schedule-appointment` | (legacy) | booking | Legacy - to be deprecated |

### 11.2 Outbound Call Handling (No Tool Calls)

**Important:** Outbound discharge calls do NOT use tool calls. They use:

1. **`end-of-call-report` webhook** - Captures call outcome, transcript, sentiment
2. **Variable injection** - Clinic/case context passed at call creation time
3. **Built-in VAPI tools** - Voicemail detection, transfer, etc.

The outbound call data flow:
```
createPhoneCall() → VAPI makes call → end-of-call-report webhook → Update database
```

See `libs/integrations/vapi/src/webhooks/handlers/end-of-call-report.ts` for webhook handling.

### 11.3 Testability Patterns

All tool handlers are **pure functions** that accept typed input and context, returning typed results:

```typescript
// Every handler follows this signature for easy testing
type ToolHandler<TInput> = (
  input: TInput,
  context: ToolContext
) => Promise<ToolResult>;

// Example: confirm-instructions handler
export async function confirmInstructions(
  input: ConfirmInstructionsInput,
  ctx: ToolContext
): Promise<ToolResult> {
  // Pure business logic - no framework dependencies
  // Easy to test with mock context
}
```

### 11.4 Mock Factory for Testing

```typescript
// libs/shared/testing/src/mocks/vapi-context.ts

import type { ToolContext } from "@odis-ai/integrations/vapi";
import { createMockSupabaseClient } from "./supabase";
import { createMockLogger } from "./logger";

interface MockToolContextOptions {
  clinic?: Partial<ToolContext["clinic"]>;
  call?: Partial<ToolContext["call"]>;
  toolCall?: Partial<ToolContext["toolCall"]>;
}

/**
 * Create a fully mocked ToolContext for unit testing
 */
export function createMockToolContext(
  options: MockToolContextOptions = {}
): ToolContext {
  return {
    clinic: {
      id: "test-clinic-id",
      name: "Test Veterinary Clinic",
      slug: "test-veterinary-clinic",
      timezone: "America/Los_Angeles",
      config: {},
      ...options.clinic,
    },
    call: {
      id: "test-call-id",
      assistantId: "test-assistant-id",
      phoneNumberId: "test-phone-id",
      ...options.call,
    },
    toolCall: {
      id: "test-tool-call-id",
      name: "test-tool",
      ...options.toolCall,
    },
    supabase: createMockSupabaseClient(),
    logger: createMockLogger(),
    timestamp: new Date("2025-01-14T10:00:00Z"),
  };
}

/**
 * Create mock for a specific clinic
 */
export function createMockToolContextForClinic(
  clinicId: string,
  clinicName: string
): ToolContext {
  return createMockToolContext({
    clinic: { id: clinicId, name: clinicName },
  });
}
```

### 11.5 Integration Test Helpers

```typescript
// libs/shared/testing/src/helpers/vapi-test-client.ts

import type { NextRequest } from "next/server";

interface VapiTestPayload {
  assistantId?: string;
  callId?: string;
  toolCallId?: string;
  toolName?: string;
  arguments: Record<string, unknown>;
}

/**
 * Create a mock VAPI request for integration testing
 */
export function createVapiTestRequest(payload: VapiTestPayload): NextRequest {
  const body = {
    message: {
      type: "tool-calls",
      call: {
        id: payload.callId ?? `test-call-${Date.now()}`,
        assistantId: payload.assistantId ?? "test-assistant",
      },
      toolCallList: [
        {
          id: payload.toolCallId ?? `test-tool-call-${Date.now()}`,
          function: {
            name: payload.toolName ?? "test-tool",
            arguments: payload.arguments,
          },
        },
      ],
    },
  };

  return new NextRequest("http://localhost:3000/api/vapi/tools/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

/**
 * Parse VAPI response for assertions
 */
export function parseVapiResponse(response: Response): Promise<{
  toolCallId: string;
  result: Record<string, unknown>;
}> {
  return response.json().then((body) => ({
    toolCallId: body.results[0].toolCallId,
    result: JSON.parse(body.results[0].result),
  }));
}
```

---

## 12. Complete Tool Directory Structure (Refactored)

```
libs/integrations/vapi/src/
├── index.ts                           # Public API exports
├── types.ts                           # Shared TypeScript types
│
├── core/                              # Core infrastructure (NEW)
│   ├── index.ts                       # Core exports
│   ├── tool-handler.ts                # createToolHandler factory
│   ├── clinic-resolver.ts             # resolveClinic (uses vapi_assistant_mappings)
│   ├── request-parser.ts              # parseVapiRequest
│   ├── response-builder.ts            # buildVapiResponse, buildSuccessResponse, buildErrorResponse
│   ├── error-handler.ts               # VapiToolError, formatValidationError
│   ├── rate-limiter.ts                # checkRateLimit
│   └── audit-logger.ts                # auditLog
│
├── tools/                             # Tool definitions (NEW structure)
│   ├── index.ts                       # All tool exports
│   │
│   ├── booking/                       # Appointment scheduling tools
│   │   ├── index.ts
│   │   ├── schemas.ts                 # CheckAvailability, CheckAvailabilityRange, BookAppointment
│   │   ├── check-availability.ts      # Handler logic only
│   │   ├── check-availability-range.ts
│   │   └── book-appointment.ts
│   │
│   ├── messaging/                     # Inbound messaging tools
│   │   ├── index.ts
│   │   ├── schemas.ts                 # LeaveMessage, LogEmergencyTriage
│   │   ├── leave-message.ts
│   │   └── log-emergency-triage.ts
│   │
│   └── clinical/                      # Clinical inquiry tools
│       ├── index.ts
│       ├── schemas.ts                 # CreateRefillRequest
│       └── create-refill-request.ts
│
├── inbound-tools/                     # EXISTING - to be consolidated into tools/
│   └── ...
│
├── client/                            # VAPI API client (existing)
│   └── ...
│
├── webhooks/                          # Webhook handlers (existing, unchanged)
│   └── handlers/
│       ├── end-of-call-report.ts      # Outbound call results
│       ├── assistant-request.ts
│       └── ...
│
└── __tests__/                         # Comprehensive tests
    ├── core/
    │   ├── tool-handler.test.ts
    │   ├── clinic-resolver.test.ts
    │   └── request-parser.test.ts
    └── tools/
        ├── booking/
        │   ├── check-availability.test.ts
        │   └── book-appointment.test.ts
        └── messaging/
            ├── leave-message.test.ts
            └── log-emergency-triage.test.ts

apps/web/src/app/api/vapi/
├── tools/
│   ├── booking/
│   │   ├── check-availability/route.ts        # Refactored (~20 lines)
│   │   ├── check-availability-range/route.ts  # Refactored
│   │   └── book-appointment/route.ts          # Refactored
│   ├── messaging/
│   │   ├── leave-message/route.ts             # Refactored
│   │   └── log-emergency-triage/route.ts      # Refactored
│   └── clinical/
│       └── create-refill-request/route.ts     # Refactored
├── health/route.ts                            # NEW
├── webhooks/                                  # Existing (unchanged)
│   └── vapi/
└── inbound/tools/                             # DEPRECATED after migration
    └── ...
```

---

## 13. Modular Code Organization Principles

### 13.1 Single Responsibility Per File

Each file should do ONE thing well. Target: **< 150 lines per file**.

```
❌ BAD: One 800-line route.ts with everything
✅ GOOD: Split into focused modules:
   - schemas.ts (validation)
   - handler.ts (business logic)
   - utils.ts (helpers)
   - route.ts (thin wrapper)
```

### 13.2 Core Module Breakdown

Each core module is independent and testable:

| File | Responsibility | Lines |
|------|----------------|-------|
| `tool-handler.ts` | Factory pattern, orchestration | ~100 |
| `clinic-resolver.ts` | Clinic lookup logic only | ~80 |
| `request-parser.ts` | VAPI payload extraction only | ~60 |
| `response-builder.ts` | Response formatting only | ~50 |
| `error-handler.ts` | Error types and formatting | ~40 |
| `rate-limiter.ts` | Rate limiting only | ~50 |
| `audit-logger.ts` | Audit logging only | ~40 |

### 13.3 Tool Module Pattern

Each tool follows the same structure:

```
tools/booking/
├── index.ts              # Re-exports (5 lines)
├── schemas.ts            # Zod schemas + types (50-80 lines per schema)
├── check-availability.ts # Handler function only (80-120 lines)
├── book-appointment.ts   # Handler function only (100-150 lines)
└── __tests__/
    ├── check-availability.test.ts
    └── book-appointment.test.ts
```

### 13.4 Adding a New Tool (Template)

To add a new tool, create these files:

```typescript
// 1. tools/{category}/schemas.ts - Add schema
export const MyNewToolSchema = z.object({
  clinic_id: z.string().uuid().optional(),
  // ... tool-specific fields
});
export type MyNewToolInput = z.infer<typeof MyNewToolSchema>;

// 2. tools/{category}/my-new-tool.ts - Handler logic
import type { ToolContext, ToolResult } from "../../core/tool-handler";
import { MyNewToolSchema, type MyNewToolInput } from "./schemas";

export async function myNewTool(
  input: MyNewToolInput,
  ctx: ToolContext
): Promise<ToolResult> {
  // Pure business logic here
}

// 3. tools/{category}/index.ts - Export
export * from "./schemas";
export * from "./my-new-tool";

// 4. apps/web/src/app/api/vapi/tools/{category}/my-new-tool/route.ts
import { createToolHandler, OPTIONS } from "@odis-ai/integrations/vapi";
import { MyNewToolSchema, myNewTool } from "@odis-ai/integrations/vapi/tools/{category}";

export const POST = createToolHandler({
  name: "my-new-tool",
  schema: MyNewToolSchema,
  handler: myNewTool,
});
export { OPTIONS };
```

### 13.5 Scaling Guidelines

| When adding... | Do this |
|----------------|---------|
| New tool in existing category | Add to existing `tools/{category}/` |
| New tool category | Create new `tools/{new-category}/` directory |
| New core feature | Add new file in `core/` |
| New utility | Add to appropriate module or create `utils/` |

---

## 14. Quick Start Implementation

### Step 1: Create Core Modules (Day 1)

```bash
# Create the core module structure
mkdir -p libs/integrations/vapi/src/core

# Each file is small and focused
touch libs/integrations/vapi/src/core/index.ts           # Re-exports only
touch libs/integrations/vapi/src/core/types.ts           # Shared types
touch libs/integrations/vapi/src/core/tool-handler.ts    # Factory pattern
touch libs/integrations/vapi/src/core/clinic-resolver.ts # Clinic lookup
touch libs/integrations/vapi/src/core/request-parser.ts  # VAPI parsing
touch libs/integrations/vapi/src/core/response-builder.ts # Response formatting
touch libs/integrations/vapi/src/core/error-handler.ts   # Error utilities
```

### Step 2: Create Tool Directory Structure (Day 1)

```bash
# Create modular tool directories
mkdir -p libs/integrations/vapi/src/tools/booking
mkdir -p libs/integrations/vapi/src/tools/messaging
mkdir -p libs/integrations/vapi/src/tools/clinical

# Each tool category has index + schemas + handlers
for dir in booking messaging clinical; do
  touch libs/integrations/vapi/src/tools/$dir/index.ts
  touch libs/integrations/vapi/src/tools/$dir/schemas.ts
done
```

### Step 3: Migrate First Tool - check-availability (Day 2)

```bash
# Create handler file (pure business logic)
touch libs/integrations/vapi/src/tools/booking/check-availability.ts

# Create thin route wrapper
mkdir -p apps/web/src/app/api/vapi/tools/booking/check-availability
# Route file: ~20 lines that imports and uses the handler
```

### Step 4: Add Comprehensive Tests (Day 2-3)

```bash
# Mirror the source structure in tests
mkdir -p libs/integrations/vapi/src/__tests__/core
mkdir -p libs/integrations/vapi/src/__tests__/tools/booking
mkdir -p libs/integrations/vapi/src/__tests__/tools/messaging

# Each handler gets its own test file
touch libs/integrations/vapi/src/__tests__/core/tool-handler.test.ts
touch libs/integrations/vapi/src/__tests__/core/clinic-resolver.test.ts
touch libs/integrations/vapi/src/__tests__/tools/booking/check-availability.test.ts
```

### Step 5: Migrate Remaining Tools (Day 3-5)

```bash
# Booking tools
touch libs/integrations/vapi/src/tools/booking/book-appointment.ts
touch libs/integrations/vapi/src/tools/booking/check-availability-range.ts

# Messaging tools
touch libs/integrations/vapi/src/tools/messaging/leave-message.ts
touch libs/integrations/vapi/src/tools/messaging/log-emergency-triage.ts

# Clinical tools
touch libs/integrations/vapi/src/tools/clinical/create-refill-request.ts
```

---

## Next Steps

1. **Review this plan** - Get stakeholder buy-in
2. **Create tracking issue** - Break into GitHub issues
3. **Start Phase 1** - Core infrastructure first
4. **Iterate** - Each phase is independently deployable

Would you like me to begin implementing Phase 1 (Core Infrastructure)?
