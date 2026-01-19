# Phase 5: tRPC Integration with Hybrid Auth

**Status**: ✅ Complete
**Date**: 2026-01-18

## Overview

Phase 5 updates the tRPC API layer to support hybrid authentication (Clerk + Supabase Auth) while maintaining backward compatibility with existing iOS clients.

## Changes Summary

### 1. Enhanced tRPC Context

**File**: `apps/web/src/server/api/trpc.ts`

The context now includes both Clerk and Supabase auth information:

```typescript
// Before (Supabase only)
{
  headers: Headers;
  user: User | null;
  supabase: SupabaseClient;
}

// After (Hybrid auth)
{
  headers: Headers;
  supabase: SupabaseClient;

  // Unified auth
  userId: string | null;          // From Clerk OR Supabase
  user: User | null;              // Supabase user (backward compat)
  isClerkAuth: boolean;           // True if user authenticated via Clerk

  // Organization context (Clerk only)
  orgId: string | null;           // Clerk organization ID
  orgRole: string | null;         // Clerk org role (org:owner, org:admin, etc.)

  // Raw Clerk auth
  clerkAuth: ClerkAuth | null;    // Full Clerk auth object
}
```

### 2. New Organization-Scoped Procedures

Added four new procedure types for organization-based access control:

#### `orgProtectedProcedure`
Requires user to be authenticated AND part of a Clerk organization.

```typescript
export const myRouter = createTRPCRouter({
  getDashboard: orgProtectedProcedure
    .query(async ({ ctx }) => {
      // ctx.orgId is guaranteed to be non-null
      // ctx.userId is guaranteed to be non-null

      const clinic = await getClinicByOrgId(ctx.orgId);
      return { clinic };
    }),
});
```

**Use for**: Any feature that requires organization membership (most dashboard features).

#### `orgAdminProcedure`
Requires `org:owner` or `org:admin` role.

```typescript
export const myRouter = createTRPCRouter({
  updateSettings: orgAdminProcedure
    .input(z.object({ timezone: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Only org owners and admins can update settings
      await updateClinicSettings(ctx.orgId, input);
    }),
});
```

**Use for**: Clinic settings, billing, team management.

#### `orgOwnerProcedure`
Requires `org:owner` role only.

```typescript
export const myRouter = createTRPCRouter({
  deleteClinic: orgOwnerProcedure
    .mutation(async ({ ctx }) => {
      // Only org owner can delete the clinic
      await deleteClinic(ctx.orgId);
    }),
});
```

**Use for**: Destructive operations, ownership transfer, subscription cancellation.

#### `vetProcedure`
Requires `org:veterinarian`, `org:admin`, or `org:owner` role.

```typescript
export const myRouter = createTRPCRouter({
  approveDischargePlan: vetProcedure
    .input(z.object({ caseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Only vets, admins, and owners can approve medical decisions
      await approvePlan(input.caseId);
    }),
});
```

**Use for**: Medical decisions, case approvals, prescription-related features.

### 3. Updated Admin Middleware

**File**: `apps/web/src/server/api/routers/admin/middleware.ts`

The admin middleware now uses the `is_super_admin()` SQL helper function:

```typescript
// Before (Supabase only)
const { data: profile } = await ctx.supabase
  .from("users")
  .select("role")
  .eq("id", userId)
  .single();

if (profile.role !== "admin") {
  throw new TRPCError({ code: "FORBIDDEN" });
}

// After (Hybrid auth)
const { data: isAdmin } = await ctx.supabase
  .rpc("is_super_admin")
  .single();

if (!isAdmin) {
  throw new TRPCError({ code: "FORBIDDEN" });
}
```

The `is_super_admin()` function checks both Clerk and Supabase users automatically.

### 4. Updated Protected Procedure

The base `protectedProcedure` now uses `ctx.userId` instead of `ctx.user`:

```typescript
// Before
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: { ...ctx.user } } });
});

// After
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
```

**Impact**: Still backward compatible - `ctx.user` exists for Supabase Auth users.

## Migration Guide for Existing Routers

### Pattern 1: Simple Protected Queries (No Changes Needed)

These continue to work as-is:

```typescript
// ✅ No changes needed
export const casesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    // ctx.userId works for both Clerk and Supabase users
    // RLS policies handle access control via SQL helpers

    const { data } = await ctx.supabase
      .from("cases")
      .select("*");

    return data;
  }),
});
```

### Pattern 2: Organization-Scoped Features (Recommended Migration)

**Before**:
```typescript
getCases: protectedProcedure.query(async ({ ctx }) => {
  // Manually fetch clinic from user_clinic_access
  const { data: access } = await ctx.supabase
    .from("user_clinic_access")
    .select("clinic_id")
    .eq("user_id", ctx.user.id)
    .single();

  // Then fetch cases for that clinic
  const { data } = await ctx.supabase
    .from("cases")
    .select("*")
    .eq("clinic_id", access.clinic_id);

  return data;
});
```

**After**:
```typescript
getCases: orgProtectedProcedure.query(async ({ ctx }) => {
  // Get clinic ID from Clerk org
  const clinic = await getClinicByOrgId(ctx.orgId);

  // Fetch cases (RLS policies handle access control)
  const { data } = await ctx.supabase
    .from("cases")
    .select("*")
    .eq("clinic_id", clinic.id);

  return data;
});
```

### Pattern 3: Role-Based Access (Replace Manual Checks)

**Before**:
```typescript
updateSettings: protectedProcedure
  .input(settingsSchema)
  .mutation(async ({ ctx, input }) => {
    // Manual role check
    const { data: access } = await ctx.supabase
      .from("user_clinic_access")
      .select("role")
      .eq("user_id", ctx.user.id)
      .single();

    if (!["owner", "admin"].includes(access.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    await updateSettings(input);
  });
```

**After**:
```typescript
updateSettings: orgAdminProcedure
  .input(settingsSchema)
  .mutation(async ({ ctx, input }) => {
    // Role check is automatic via orgAdminProcedure
    await updateSettings(ctx.orgId, input);
  });
```

### Pattern 4: Backward Compatibility (iOS)

For procedures that need to work with both web (Clerk) and iOS (Supabase):

```typescript
export const casesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    // RLS policies handle access control for both auth types
    // No need to check ctx.isClerkAuth or ctx.orgId

    const { data } = await ctx.supabase
      .from("cases")
      .select("*");

    // RLS automatically filters:
    // - Clerk users: by org_id in JWT
    // - Supabase users: by user_clinic_access junction table

    return data;
  }),
});
```

## Role Mapping Reference

| Clerk Role | Description | ODIS AI Permissions |
|------------|-------------|---------------------|
| `org:owner` | Practice owner | Full clinic access, billing, team mgmt |
| `org:admin` | Clinic administrator | Case mgmt, settings, most features |
| `org:veterinarian` | Licensed veterinarian | Medical decisions, case approvals |
| `org:member` | Vet tech, staff | View cases, create records |
| `org:viewer` | Read-only access | View-only access |

## Testing

### Unit Tests

Test procedures with both auth types:

```typescript
import { createTRPCContext } from "~/server/api/trpc";
import { appRouter } from "~/server/api/root";

describe("casesRouter", () => {
  it("works with Clerk auth", async () => {
    const ctx = await createTRPCContext({
      headers: new Headers(),
      req: mockClerkRequest({
        userId: "user_123",
        orgId: "org_456",
        orgRole: "org:admin",
      }),
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.cases.list();

    expect(result).toBeDefined();
  });

  it("works with Supabase auth", async () => {
    const ctx = await createTRPCContext({
      headers: new Headers(),
      req: mockSupabaseRequest({
        userId: "uuid-123",
      }),
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.cases.list();

    expect(result).toBeDefined();
  });
});
```

### Integration Tests

1. **Clerk Web User**:
   - Sign in via Clerk
   - Create organization
   - Verify org context in tRPC calls
   - Test role-based procedures

2. **Supabase iOS User**:
   - Sign in via Supabase Auth
   - Verify RLS policies work
   - Test backward compatibility

## Checklist

- [x] Update tRPC context with Clerk auth
- [x] Add organization-scoped procedures
- [x] Add role-based procedures
- [x] Update admin middleware
- [x] Update protected procedure
- [x] Create documentation
- [ ] Update existing routers (optional - migrate incrementally)
- [ ] Add unit tests for new procedures
- [ ] Add integration tests

## Next Steps

**Phase 6: RBAC with Clerk Roles**
- Add role-based middleware for non-tRPC routes
- Implement feature gating in UI components
- Add role checks in Server Actions

## References

- [Clerk Organizations](https://clerk.com/docs/organizations/overview)
- [tRPC Procedures](https://trpc.io/docs/server/procedures)
- [tRPC Context](https://trpc.io/docs/server/context)
- Phase 4: RLS Policy Updates
