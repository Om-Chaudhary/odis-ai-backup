# tRPC Procedures Quick Reference

**Last Updated**: Phase 5 - 2026-01-18

## Procedure Hierarchy

```
publicProcedure (no auth)
  └─ protectedProcedure (userId required)
       ├─ adminProcedure (super admin only)
       └─ orgProtectedProcedure (org membership required)
            ├─ orgOwnerProcedure (org:owner only)
            ├─ orgAdminProcedure (org:owner or org:admin)
            └─ vetProcedure (org:veterinarian, org:admin, or org:owner)
```

## Quick Decision Tree

```
Does this route need authentication?
  NO  → publicProcedure
  YES ↓

Is this a super admin feature?
  YES → adminProcedure
  NO  ↓

Does this require organization membership?
  NO  → protectedProcedure
  YES ↓

What level of access is needed?
  - Any org member       → orgProtectedProcedure
  - Owner only           → orgOwnerProcedure
  - Owner or admin       → orgAdminProcedure
  - Veterinarian+        → vetProcedure
```

## Procedure Reference

### `publicProcedure`

**Use for**: Public endpoints, health checks, unauthenticated data

```typescript
getHealthStatus: publicProcedure.query(() => {
  return { status: "ok" };
});
```

**Context Available**:
- `ctx.headers` ✅
- `ctx.supabase` ✅ (unauthenticated client)
- `ctx.userId` ❌
- `ctx.orgId` ❌

---

### `protectedProcedure`

**Use for**: Authenticated endpoints where RLS handles access control

**Works with**: Both Clerk (web) and Supabase Auth (iOS)

```typescript
listCases: protectedProcedure.query(async ({ ctx }) => {
  // ctx.userId is guaranteed (either Clerk or Supabase)
  // RLS policies automatically filter by user's clinic access

  const { data } = await ctx.supabase
    .from("cases")
    .select("*");

  return data;
});
```

**Context Available**:
- `ctx.headers` ✅
- `ctx.supabase` ✅
- `ctx.userId` ✅ (string, guaranteed non-null)
- `ctx.user` ✅ (for backward compat with Supabase Auth)
- `ctx.isClerkAuth` ✅ (boolean)
- `ctx.orgId` ⚠️ (only for Clerk users)
- `ctx.orgRole` ⚠️ (only for Clerk users)

**Example Use Cases**:
- List user's cases
- Get user profile
- Update user settings
- Any feature that works for both web and iOS

---

### `orgProtectedProcedure`

**Use for**: Organization-scoped features (requires Clerk org membership)

**Works with**: Clerk (web) only - iOS users will get 403

```typescript
getDashboard: orgProtectedProcedure.query(async ({ ctx }) => {
  // ctx.orgId is guaranteed
  // ctx.userId is guaranteed

  const clinic = await getClinicByOrgId(ctx.orgId);
  const stats = await getClinicStats(clinic.id);

  return { clinic, stats };
});
```

**Context Available**:
- `ctx.headers` ✅
- `ctx.supabase` ✅
- `ctx.userId` ✅ (string, guaranteed non-null)
- `ctx.orgId` ✅ (string, guaranteed non-null)
- `ctx.orgRole` ✅ (string, guaranteed non-null)
- `ctx.isClerkAuth` ✅ (always true)

**Example Use Cases**:
- Organization dashboard
- Clinic-scoped features
- Team member list
- Any feature that requires org context

---

### `orgAdminProcedure`

**Use for**: Settings, configuration, team management

**Allowed Roles**: `org:owner`, `org:admin`

```typescript
updateClinicSettings: orgAdminProcedure
  .input(z.object({ timezone: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Only owners and admins can update settings

    const clinic = await getClinicByOrgId(ctx.orgId);
    await updateSettings(clinic.id, input);

    return { success: true };
  });
```

**Context Available**: Same as `orgProtectedProcedure`

**Example Use Cases**:
- Update clinic settings
- Manage team members
- Configure integrations
- Billing preferences
- Schedule configuration

---

### `orgOwnerProcedure`

**Use for**: Destructive operations, ownership changes

**Allowed Roles**: `org:owner` only

```typescript
deleteClinic: orgOwnerProcedure
  .mutation(async ({ ctx }) => {
    // Only owner can delete clinic

    const clinic = await getClinicByOrgId(ctx.orgId);
    await deleteClinic(clinic.id);

    return { success: true };
  });
```

**Context Available**: Same as `orgProtectedProcedure`

**Example Use Cases**:
- Delete organization
- Transfer ownership
- Cancel subscription
- Archive clinic
- Revoke admin privileges

---

### `vetProcedure`

**Use for**: Medical decisions, case approvals

**Allowed Roles**: `org:veterinarian`, `org:admin`, `org:owner`

```typescript
approveDischargePlan: vetProcedure
  .input(z.object({ caseId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Only vets, admins, and owners can approve

    await approvePlan(input.caseId);
    return { success: true };
  });
```

**Context Available**: Same as `orgProtectedProcedure`

**Example Use Cases**:
- Approve discharge plans
- Sign off on medical records
- Prescribe medications
- Edit SOAP notes
- Authorize procedures

---

### `adminProcedure`

**Use for**: Super admin features (system-wide access)

**Allowed Roles**: `role = 'admin'` in users table

```typescript
listAllClinics: adminProcedure.query(async ({ ctx }) => {
  // Super admin can view all clinics

  const { data } = await ctx.supabase
    .from("clinics")
    .select("*");

  return data;
});
```

**Context Available**:
- All fields from `protectedProcedure`
- `ctx.adminProfile` ✅ (user profile with role = 'admin')

**Example Use Cases**:
- View all clinics
- Impersonate users
- System-wide reports
- Database management
- Feature flags

---

## Common Patterns

### Pattern 1: Check Role in Handler (Not Recommended)

❌ **Don't do this**:
```typescript
updateSettings: protectedProcedure
  .mutation(async ({ ctx, input }) => {
    // Manual role check
    if (!["owner", "admin"].includes(ctx.orgRole)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    await updateSettings(input);
  });
```

✅ **Do this instead**:
```typescript
updateSettings: orgAdminProcedure
  .mutation(async ({ ctx, input }) => {
    // Role check is automatic
    await updateSettings(input);
  });
```

### Pattern 2: Organization Context (Recommended)

✅ **Good**:
```typescript
getDashboard: orgProtectedProcedure.query(async ({ ctx }) => {
  const clinic = await getClinicByOrgId(ctx.orgId);
  return { clinic };
});
```

❌ **Avoid** (manual clinic lookup):
```typescript
getDashboard: protectedProcedure.query(async ({ ctx }) => {
  const { data: access } = await ctx.supabase
    .from("user_clinic_access")
    .select("clinic_id")
    .eq("user_id", ctx.userId)
    .single();

  const clinic = await getClinic(access.clinic_id);
  return { clinic };
});
```

### Pattern 3: Hybrid Auth Support

For features that need both web (Clerk) and iOS (Supabase) support, use `protectedProcedure` and let RLS handle access:

```typescript
listCases: protectedProcedure.query(async ({ ctx }) => {
  // Works for both:
  // - Clerk users: RLS checks current_org_id()
  // - Supabase users: RLS checks user_clinic_access table

  const { data } = await ctx.supabase
    .from("cases")
    .select("*");

  return data;
});
```

## Migration Examples

### Example 1: Simple Query

**Before**:
```typescript
getCases: protectedProcedure.query(async ({ ctx }) => {
  const { data } = await ctx.supabase
    .from("cases")
    .select("*")
    .eq("user_id", ctx.user.id);

  return data;
});
```

**After** (no changes needed - backward compatible):
```typescript
getCases: protectedProcedure.query(async ({ ctx }) => {
  // ctx.userId works for both Clerk and Supabase
  const { data } = await ctx.supabase
    .from("cases")
    .select("*");

  return data; // RLS filters automatically
});
```

### Example 2: Organization Feature

**Before**:
```typescript
getStats: protectedProcedure.query(async ({ ctx }) => {
  const { data: access } = await ctx.supabase
    .from("user_clinic_access")
    .select("clinic_id")
    .eq("user_id", ctx.user.id)
    .single();

  const stats = await getClinicStats(access.clinic_id);
  return stats;
});
```

**After**:
```typescript
getStats: orgProtectedProcedure.query(async ({ ctx }) => {
  const clinic = await getClinicByOrgId(ctx.orgId);
  const stats = await getClinicStats(clinic.id);
  return stats;
});
```

### Example 3: Role-Based Feature

**Before**:
```typescript
updateSettings: protectedProcedure
  .input(settingsSchema)
  .mutation(async ({ ctx, input }) => {
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
    // Role check is automatic
    const clinic = await getClinicByOrgId(ctx.orgId);
    await updateSettings(clinic.id, input);
  });
```

## Testing

```typescript
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

describe("casesRouter", () => {
  it("protectedProcedure works with Clerk", async () => {
    const ctx = await createTRPCContext({
      headers: mockClerkHeaders(),
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.cases.list();

    expect(result).toBeDefined();
  });

  it("orgProtectedProcedure enforces org membership", async () => {
    const ctx = await createTRPCContext({
      headers: mockClerkHeaders({ orgId: null }), // No org
    });

    const caller = appRouter.createCaller(ctx);

    await expect(caller.cases.getDashboard()).rejects.toThrow(
      "Organization membership required"
    );
  });

  it("orgAdminProcedure enforces role", async () => {
    const ctx = await createTRPCContext({
      headers: mockClerkHeaders({ orgRole: "org:member" }),
    });

    const caller = appRouter.createCaller(ctx);

    await expect(caller.settings.update({})).rejects.toThrow(
      "Organization admin access required"
    );
  });
});
```

## References

- [Phase 5: tRPC Integration](./PHASE_5_TRPC_INTEGRATION.md)
- [Phase 4: RLS Policy Updates](./PHASE_4_RLS_UPDATES.md)
- [Clerk Roles Documentation](https://clerk.com/docs/organizations/roles-permissions)
