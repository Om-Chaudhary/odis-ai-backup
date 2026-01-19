# Authentication Proxy Pattern

## ⚠️ IMPORTANT: We Use Proxy, NOT Middleware

**DO NOT create `middleware.ts` files!**

This project uses a **custom proxy pattern** at `apps/web/src/proxy.ts` instead of the standard Next.js `middleware.ts`.

## Why Proxy Instead of Middleware?

The proxy pattern enables:

1. **Hybrid Authentication** - Supports both Clerk (web) and Supabase Auth (iOS) simultaneously
2. **Session Refresh** - Always runs Supabase session refresh for iOS app compatibility
3. **Incremental Migration** - Allows gradual migration from Supabase Auth to Clerk
4. **Graceful Degradation** - If Clerk is not configured, falls back to Supabase Auth

## File Location

```
apps/web/src/proxy.ts  ← USE THIS
apps/web/src/middleware.ts  ← NEVER CREATE THIS
```

## How It Works

```typescript
// apps/web/src/proxy.ts
export async function proxy(request: NextRequest) {
  // 1. If Clerk is configured, run Clerk middleware
  if (isClerkConfigured) {
    const clerkResponse = await clerkAuthMiddleware(request, {} as any);
    if (clerkResponse && clerkResponse.status !== 200) {
      return clerkResponse; // Redirect, error, etc.
    }
  }

  // 2. Always run Supabase session refresh
  // (needed for iOS app and during migration)
  return await updateSession(request);
}
```

## Public Routes

These routes are accessible without authentication:

```typescript
const isPublicRoute = createRouteMatcher([
  // Landing pages
  "/",
  "/pricing(.*)",
  "/about(.*)",

  // Auth pages
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/login(.*)",
  "/auth/(.*)",

  // Webhooks (external services)
  "/api/webhooks/(.*)",

  // Public API
  "/api/public/(.*)",

  // Health checks
  "/api/health(.*)",
]);
```

## Configuration

The proxy automatically detects Clerk configuration:

```typescript
// Clerk is enabled if secret key exists
const isClerkConfigured = !!process.env.CLERK_SECRET_KEY;
```

**With Clerk configured:**
- Protected routes require Clerk authentication
- Public routes are open
- Supabase session still refreshed for compatibility

**Without Clerk configured (fallback):**
- Uses existing Supabase Auth
- Session refresh handled by `updateSession()`
- iOS app continues working unchanged

## Migration Strategy

During incremental migration:

1. **Phase 1**: Proxy with Clerk disabled (Supabase Auth only)
   - iOS: ✅ Supabase Auth
   - Web: ✅ Supabase Auth

2. **Phase 2**: Enable Clerk, keep Supabase Auth
   - iOS: ✅ Supabase Auth
   - Web: ✅ Clerk Auth
   - RLS policies accept both JWT types

3. **Phase 3**: Migrate iOS to Clerk (future)
   - iOS: ✅ Clerk Auth
   - Web: ✅ Clerk Auth
   - Remove Supabase Auth fallbacks

## Updating the Proxy

To modify route protection:

```typescript
// apps/web/src/proxy.ts

// Add new public routes
const isPublicRoute = createRouteMatcher([
  // ... existing routes
  "/new-public-route(.*)",
]);

// Add custom logic before Clerk
export async function proxy(request: NextRequest) {
  // Custom pre-processing
  if (request.nextUrl.pathname.startsWith("/special")) {
    // Handle special cases
  }

  // Then run Clerk + Supabase as usual
  if (isClerkConfigured) {
    // ...
  }
  return await updateSession(request);
}
```

## Testing

Test the proxy is working:

```bash
# Protected route (should redirect to sign-in)
curl -I http://localhost:3000/dashboard

# Public route (should return 200)
curl -I http://localhost:3000/

# Webhook (should return 200 or 405)
curl -I http://localhost:3000/api/webhooks/clerk
```

## Common Mistakes

❌ **Creating middleware.ts**
```typescript
// apps/web/src/middleware.ts  ← WRONG!
export default clerkMiddleware(...)
```

✅ **Using proxy.ts**
```typescript
// apps/web/src/proxy.ts  ← CORRECT!
export async function proxy(request: NextRequest) {
  // Hybrid auth logic
}
```

❌ **Forgetting Supabase session refresh**
```typescript
export async function proxy(request: NextRequest) {
  if (isClerkConfigured) {
    return await clerkAuthMiddleware(request, {} as any);
  }
  // Missing updateSession() - iOS breaks!
}
```

✅ **Always refresh Supabase session**
```typescript
export async function proxy(request: NextRequest) {
  if (isClerkConfigured) {
    const clerkResponse = await clerkAuthMiddleware(request, {} as any);
    if (clerkResponse?.status !== 200) return clerkResponse;
  }
  return await updateSession(request); // ← Always run this
}
```

## Related Files

| File | Purpose |
|------|---------|
| `apps/web/src/proxy.ts` | Main proxy implementation |
| `libs/data-access/supabase-client/src/proxy.ts` | Session refresh logic |
| `apps/web/src/components/providers/clerk-provider.tsx` | Clerk React provider |
| `supabase/config.toml` | Clerk third-party auth config |

## See Also

- [Hybrid Auth Architecture](./HYBRID_AUTH.md)
- [Clerk Supabase Setup](../authentication/CLERK_SUPABASE_SETUP.md)
- [Phase 3 Webhook Setup](../authentication/PHASE_3_WEBHOOK_SETUP.md)
