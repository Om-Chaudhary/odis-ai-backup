# API Endpoints: CORS and Authentication Analysis

This document provides a comprehensive analysis of all API endpoints, detailing which ones have CORS enabled and which ones require authentication.

**Last Updated:** $(date)

## Summary

- **Total Endpoints:** 17
- **With CORS:** 12 endpoints (updated)
- **With Auth:** 14 endpoints
- **Public (No Auth):** 3 endpoints (all webhooks with signature verification)
- **No CORS, No Auth:** 0 endpoints

**Last Updated:** 2025-01-27 - Added CORS to all missing endpoints

## CORS Configuration

CORS is configured using utilities from `src/lib/api/cors.ts`:

- `handleCorsPreflightRequest()` - Handles OPTIONS preflight requests
- `withCorsHeaders()` - Adds CORS headers to responses
- `corsJsonResponse()` - Creates JSON response with CORS headers

**Allowed Origins:** IDEXX Neo domains (us.idexxneo.com, ca.idexxneo.com, uk.idexxneo.com, idexxneocloud.com, neo.vet, neosuite.com)

**Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS

**Credentials:** Enabled (cookies and auth headers allowed)

## Authentication Methods

The codebase uses two authentication patterns:

1. **`withAuth()` wrapper** (`src/lib/api/auth.ts`) - Higher-order function that automatically handles auth
2. **Manual `authenticateRequest()`** - Custom function that checks Bearer token or cookies

Both methods support:

- **Bearer Token** (for browser extensions/API clients)
- **Cookie-based** (for web app)

---

## Detailed Endpoint Analysis

### 1. `/api/calls/schedule` (POST, GET, OPTIONS)

**CORS:** ✅ Yes (added)  
**Auth:** ✅ Yes (manual `authenticateRequest()`)

- Uses `withCorsHeaders()` for all responses
- Has OPTIONS handler for preflight
- Requires authentication (Bearer token or cookies)

**Notes:** ✅ Updated - Now supports CORS for browser extension access.

---

### 2. `/api/cases/find-by-patient` (GET, OPTIONS)

**CORS:** ✅ Yes  
**Auth:** ✅ Yes (manual `authenticateRequest()`)

- Uses `withCorsHeaders()` for all responses
- Has OPTIONS handler for preflight
- Requires authentication (Bearer token or cookies)

**Notes:** Designed for IDEXX Neo extension integration.

---

### 3. `/api/cases/ingest` (GET, POST, OPTIONS)

**CORS:** ✅ Yes (added)  
**Auth:** ✅ Yes (manual `authenticateRequest()`)

- Uses `withCorsHeaders()` for all responses
- Has OPTIONS handler for preflight
- Requires authentication (Bearer token or cookies)

**Notes:** ✅ Updated - Now supports CORS for browser extension access.

---

### 4. `/api/generate/discharge-email` (POST, OPTIONS)

**CORS:** ✅ Yes  
**Auth:** ✅ Yes (manual `authenticateRequest()`)

- Uses `withCorsHeaders()` for all responses
- Has OPTIONS handler for preflight
- Requires authentication

**Notes:** Designed for IDEXX Neo extension integration.

---

### 5. `/api/generate/discharge-summary` (POST, GET, OPTIONS)

**CORS:** ✅ Yes  
**Auth:** ✅ Yes (manual `authenticateRequest()`)

- Uses `withCorsHeaders()` for all responses
- Has OPTIONS handler for preflight
- Requires authentication

**Notes:** Designed for IDEXX Neo extension integration.

---

### 6. `/api/generate/route.ts`

**Status:** Empty file (no implementation)

---

### 7. `/api/generate-soap` (POST, OPTIONS)

**CORS:** ✅ Yes  
**Auth:** ✅ Yes (manual `authenticateRequest()`)

- Uses `withCorsHeaders()` for all responses
- Has OPTIONS handler for preflight
- Requires authentication

**Notes:** Proxies to Supabase Edge Function. Designed for IDEXX Neo extension integration.

---

### 8. `/api/normalize` (POST, GET, OPTIONS)

**CORS:** ✅ Yes (via `withAuth` wrapper)  
**Auth:** ✅ Yes (`withAuth()` wrapper)

- Uses `withAuth()` wrapper which includes CORS via `successResponse()` and `errorResponse()`
- Has OPTIONS handler for preflight
- Requires authentication

**Notes:** Uses the newer `withAuth()` pattern. CORS is handled automatically by the auth wrapper utilities.

---

### 9. `/api/send/discharge-email` (POST, GET, OPTIONS)

**CORS:** ✅ Yes (added)  
**Auth:** ✅ Yes (manual `authenticateRequest()`)

- Uses `withCorsHeaders()` for all responses
- Has OPTIONS handler for preflight
- Requires authentication (Bearer token or cookies)

**Notes:** ✅ Updated - Now supports CORS for browser extension access.

---

### 10. `/api/trpc/[trpc]` (GET, POST)

**CORS:** ❌ No  
**Auth:** ✅ Yes (via tRPC context)

- tRPC handles authentication via `createTRPCContext()`
- Uses `protectedProcedure` for authenticated routes
- No CORS headers (assumed same-origin)

**Notes:** tRPC endpoints are typically same-origin. CORS not needed unless accessed from extensions.

---

### 11. `/api/vapi/calls/[id]` (GET, OPTIONS)

**CORS:** ✅ Yes (added)  
**Auth:** ✅ Yes (Bearer token + cookies)

- Uses `withCorsHeaders()` for all responses
- Has OPTIONS handler for preflight
- Supports both Bearer token and cookie authentication

**Notes:** ✅ Updated - Now supports CORS and Bearer token authentication.

---

### 12. `/api/vapi/calls/create` (POST, OPTIONS)

**CORS:** ✅ Yes (added)  
**Auth:** ✅ Yes (Bearer token + cookies)

- Uses `withCorsHeaders()` for all responses
- Has OPTIONS handler for preflight
- Supports both Bearer token and cookie authentication

**Notes:** ✅ Updated - Now supports CORS and Bearer token authentication.

---

### 13. `/api/vapi/calls` (GET, OPTIONS)

**CORS:** ✅ Yes (added)  
**Auth:** ✅ Yes (Bearer token + cookies)

- Uses `withCorsHeaders()` for all responses
- Has OPTIONS handler for preflight
- Supports both Bearer token and cookie authentication

**Notes:** ✅ Updated - Now supports CORS and Bearer token authentication.

---

### 14. `/api/webhooks/execute-call` (POST, GET)

**CORS:** ❌ No  
**Auth:** ✅ Yes (QStash signature verification)

- Uses `verifySignatureAppRouter()` from QStash
- No user authentication (webhook from QStash)
- No CORS headers

**Notes:** Webhook endpoint. Signature verification provides security. CORS not needed.

---

### 15. `/api/webhooks/execute-discharge-email` (POST, GET)

**CORS:** ❌ No  
**Auth:** ✅ Yes (QStash signature verification)

- Uses `verifySignatureAppRouter()` from QStash
- No user authentication (webhook from QStash)
- No CORS headers

**Notes:** Webhook endpoint. Signature verification provides security. CORS not needed.

---

### 16. `/api/webhooks/retell` (POST, GET)

**CORS:** ❌ No  
**Auth:** ⚠️ Partial (signature verification disabled)

- Has `verifySignature()` function but it's commented out
- No active signature verification
- No CORS headers

**Notes:** ⚠️ **SECURITY CONCERN:** Signature verification is disabled. Should be re-enabled in production.

---

### 17. `/api/webhooks/vapi` (POST, GET)

**CORS:** ❌ No  
**Auth:** ⚠️ Partial (signature verification disabled)

- Has `verifySignature()` function but it's commented out
- No active signature verification
- No CORS headers

**Notes:** ⚠️ **SECURITY CONCERN:** Signature verification is disabled. Should be re-enabled in production.

---

## Recommendations

### High Priority

1. **Enable signature verification for webhooks:**
   - `/api/webhooks/retell` - Re-enable `verifySignature()` check
   - `/api/webhooks/vapi` - Re-enable `verifySignature()` check

### Completed ✅

1. **Add CORS to endpoints used by browser extensions:**
   - ✅ `/api/calls/schedule` - Added CORS support
   - ✅ `/api/cases/ingest` - Added CORS support
   - ✅ `/api/send/discharge-email` - Added CORS support

2. **Standardize authentication on VAPI endpoints:**
   - ✅ `/api/vapi/calls/[id]` - Added Bearer token support and CORS
   - ✅ `/api/vapi/calls/create` - Added Bearer token support and CORS
   - ✅ `/api/vapi/calls` - Added Bearer token support and CORS

### Medium Priority

1. **Consider CORS for tRPC endpoints:**
   - `/api/trpc/[trpc]` - Only if accessed from extensions

2. **Consolidate authentication patterns:**
   - Migrate manual `authenticateRequest()` to `withAuth()` wrapper for consistency
   - This would automatically add CORS support via the wrapper

### Low Priority

1. **Documentation:**
   - Add OpenAPI/Swagger documentation
   - Document which endpoints require CORS vs same-origin
   - Document authentication methods per endpoint

---

## Pattern Comparison

### Pattern 1: Manual Auth + Manual CORS

```typescript
// Example: /api/cases/find-by-patient
async function authenticateRequest(request) { ... }
export async function GET(request) {
  const { user, supabase } = await authenticateRequest(request);
  if (!user) return withCorsHeaders(request, NextResponse.json(...));
  // ...
  return withCorsHeaders(request, NextResponse.json(...));
}
export function OPTIONS(request) {
  return handleCorsPreflightRequest(request);
}
```

### Pattern 2: withAuth Wrapper (Automatic CORS)

```typescript
// Example: /api/normalize
export const POST = withAuth(async (request, { user, supabase }) => {
  // ...
  return successResponse(data, 200, request); // Automatically includes CORS
});
export function OPTIONS(request) {
  return handleCorsPreflightRequest(request);
}
```

### Pattern 3: Cookie Auth Only (No CORS)

```typescript
// Example: /api/vapi/calls
export async function GET(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ...
}
```

### Pattern 4: Webhook (Signature Verification)

```typescript
// Example: /api/webhooks/execute-call
async function handler(req) { ... }
export const POST = verifySignatureAppRouter(handler);
```

---

## Security Notes

1. **Webhook Security:** Webhook endpoints use signature verification instead of user authentication. This is correct for webhooks.

2. **CORS Credentials:** CORS is configured with `allowCredentials: true`, which allows cookies and auth headers. This is appropriate for IDEXX Neo extension integration.

3. **Bearer Token Support:** Most endpoints support both Bearer tokens and cookies, which is good for flexibility.

4. **Disabled Signature Verification:** Two webhook endpoints have signature verification disabled. This should be fixed before production.

---

## Testing Checklist

When adding CORS or auth to an endpoint, verify:

- [ ] OPTIONS preflight request returns 204 with CORS headers
- [ ] Actual request includes CORS headers in response
- [ ] Bearer token authentication works
- [ ] Cookie authentication works
- [ ] Unauthenticated requests return 401
- [ ] CORS headers include correct origin
- [ ] Credentials are allowed if needed
