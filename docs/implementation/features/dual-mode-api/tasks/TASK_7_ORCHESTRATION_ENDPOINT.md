# Task 7: Create Orchestration API Endpoint

## Objective

Create the `/api/discharge/orchestrate` endpoint that handles orchestration requests. This task depends on Tasks 4 and 6 (Types, Orchestrator).

## Context

### Existing API Route Patterns

- `src/app/api/cases/ingest/route.ts` - Shows auth pattern (lines 47-85)
- `src/app/api/generate/discharge-summary/route.ts` - Shows CORS pattern (lines 8-9, 79-85, 326-328)
- `src/lib/api/auth.ts` - Has `authenticateUser()` helper (can use instead of inline auth)
- `src/lib/api/cors.ts` - Has `withCorsHeaders()`, `handleCorsPreflightRequest()`

### Authentication Options

1. Use `authenticateUser()` from `~/lib/api/auth` (recommended)
2. Use inline pattern from ingest route (if simpler needed)

Both support:

- Cookie-based auth (web app)
- Bearer token auth (extension)

### CORS Handling

- Use `withCorsHeaders()` for responses
- Use `handleCorsPreflightRequest()` for OPTIONS

## Implementation Steps

### 1. Create API Route File

**File:** `src/app/api/discharge/orchestrate/route.ts`

### 2. Implement POST Handler

```typescript
import { NextRequest, NextResponse } from "next/server";
import { OrchestrationRequestSchema } from "~/lib/validators/orchestration";
import { DischargeOrchestrator } from "~/lib/services/discharge-orchestrator";
import { authenticateUser } from "~/lib/api/auth";
import { withCorsHeaders } from "~/lib/api/cors";

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const auth = await authenticateUser(request);
    if (!auth.success) {
      return withCorsHeaders(request, auth.response);
    }

    const { user, supabase } = auth.data;

    // Parse and validate
    const body = await request.json();
    const validation = OrchestrationRequestSchema.safeParse(body);

    if (!validation.success) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            error: "Validation failed",
            details: validation.error.format(),
          },
          { status: 400 },
        ),
      );
    }

    // Execute orchestration
    const orchestrator = new DischargeOrchestrator(supabase, user);
    const result = await orchestrator.orchestrate(validation.data);

    return withCorsHeaders(request, NextResponse.json(result));
  } catch (error) {
    console.error("[ORCHESTRATE] Error:", error);
    return withCorsHeaders(
      request,
      NextResponse.json(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      ),
    );
  }
}
```

### 3. Implement GET Handler (Health Check)

```typescript
export function GET(request: NextRequest) {
  return withCorsHeaders(
    request,
    NextResponse.json({
      status: "ok",
      message: "Discharge orchestration endpoint",
      version: "1.0.0",
      endpoints: {
        POST: "/api/discharge/orchestrate",
      },
    }),
  );
}
```

### 4. Implement OPTIONS Handler (CORS Preflight)

```typescript
import { handleCorsPreflightRequest } from "~/lib/api/cors";

export function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}
```

## Success Criteria

- ✅ Handles authentication correctly (cookies and Bearer token)
- ✅ Validates request body with Zod schema
- ✅ Executes orchestration via DischargeOrchestrator
- ✅ Returns proper CORS headers
- ✅ Error handling is consistent
- ✅ Health check endpoint works
- ✅ CORS preflight works

## Testing

### Test Cases

1. **Valid orchestration request:**

   ```bash
   curl -X POST http://localhost:3000/api/discharge/orchestrate \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "input": {
         "rawData": {
           "mode": "text",
           "source": "idexx_extension",
           "text": "Patient: Max, Dog..."
         }
       },
       "steps": {
         "ingest": true,
         "generateSummary": true
       }
     }'
   ```

2. **Invalid request (validation error):**

   ```bash
   curl -X POST http://localhost:3000/api/discharge/orchestrate \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "input": {
         "rawData": {
           "mode": "invalid"  // Invalid enum
         }
       }
     }'
   # Should return 400 with validation details
   ```

3. **Unauthenticated request:**

   ```bash
   curl -X POST http://localhost:3000/api/discharge/orchestrate \
     -H "Content-Type: application/json" \
     -d '{"input": {...}}'
   # Should return 401
   ```

4. **Health check:**

   ```bash
   curl http://localhost:3000/api/discharge/orchestrate
   # Should return status info
   ```

5. **CORS preflight:**
   ```bash
   curl -X OPTIONS http://localhost:3000/api/discharge/orchestrate \
     -H "Origin: https://us.idexxneo.com" \
     -H "Access-Control-Request-Method: POST"
   # Should return 204 with CORS headers
   ```

## Files to Create

- `src/app/api/discharge/orchestrate/route.ts` - API endpoint

## Files to Reference

- `src/lib/api/auth.ts` - Authentication utilities
- `src/lib/api/cors.ts` - CORS utilities
- `src/lib/validators/orchestration.ts` - Request validation
- `src/lib/services/discharge-orchestrator.ts` - Orchestrator service
- `src/app/api/cases/ingest/route.ts` - Example route pattern
- `src/app/api/generate/discharge-summary/route.ts` - Example CORS usage

## Notes

- Use `authenticateUser()` helper for cleaner code
- Follow existing error response patterns
- Ensure CORS headers are added to all responses
- Log errors for debugging
- Consider adding request logging for monitoring

## Error Response Format

Match existing patterns:

```typescript
{
  error: "Error type",
  message?: "Human-readable message",
  details?: "Additional details"
}
```

## Potential Issues & Solutions

1. **CORS headers:**
   - Ensure `withCorsHeaders()` is called on all responses
   - Check that preflight handler returns correct status (204)

2. **Authentication:**
   - Verify `authenticateUser()` works for both cookie and Bearer token
   - Test with actual requests from extension and web app

3. **Validation errors:**
   - Format Zod errors in user-friendly way
   - Include field-level error details

4. **Error handling:**
   - Don't expose internal error details in production
   - Log full errors server-side
   - Return generic messages to client
