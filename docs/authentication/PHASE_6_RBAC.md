# Phase 6: RBAC with Clerk Roles

## Overview

Phase 6 implements Role-Based Access Control (RBAC) with a two-level role system:

1. **System-Level Role**: Super admin access for ODIS staff
2. **Organization-Level Roles**: Clerk organization roles for clinic staff

Additionally, Phase 6 includes **subscription feature gating** to enforce tier requirements.

---

## Two-Level Role System

### 1. System-Level Role (Super Admin)

**Stored in**: `users.role` column in database

**Role**: `admin` = Super Admin

**Permissions**:
- Access to ALL clinics (bypasses organization membership)
- System-wide administrative functions
- Manage all users and clinics
- Access to admin-only tRPC procedures

**Usage**:
```typescript
import { superAdminProcedure } from "~/server/api/trpc";

export const adminRouter = createTRPCRouter({
  listAllClinics: superAdminProcedure.query(async ({ ctx }) => {
    // Only super admins can access
    // ctx.isSuperAdmin === true
  }),
});
```

### 2. Organization-Level Roles (Clinic Roles)

**Stored in**: Clerk organization membership (`ctx.orgRole`)

**Roles**:

| Clerk Role | Permissions | Maps To |
|------------|-------------|---------|
| `org:owner` | Full clinic access, manage team, billing | Practice owner |
| `org:veterinarian` | Full case access, medical decisions, discharge approval | Licensed vet |
| `org:admin` | Administrative functions, team management | Clinic manager |
| `org:member` | View/edit cases, make calls, basic operations | Vet tech / Staff |
| `org:viewer` | Read-only access | Guest/Observer |

**Role Hierarchy**:
```
org:owner > org:admin > org:veterinarian > org:member > org:viewer
```

---

## tRPC Procedures

### New Procedures Added

#### 1. `superAdminProcedure`

**Purpose**: Require system-level admin access (ODIS staff only)

**Checks**:
- User is authenticated
- User has `role = 'admin'` in `users` table
- Uses `is_super_admin()` SQL helper (hybrid auth compatible)

**Context Additions**:
- `ctx.isSuperAdmin: true`

**Example**:
```typescript
export const adminRouter = createTRPCRouter({
  listAllClinics: superAdminProcedure.query(async ({ ctx }) => {
    // Only super admins can see all clinics
    const { data } = await ctx.supabase.from("clinics").select("*");
    return data;
  }),
});
```

#### 2. `orgProtectedProcedure` (Phase 5)

**Purpose**: Require Clerk organization membership

**Checks**:
- User is authenticated
- User is member of a Clerk organization

**Context Additions**:
- `ctx.orgId: string` (guaranteed non-null)
- `ctx.orgRole: string | null`

#### 3. `orgOwnerProcedure` (Phase 5)

**Purpose**: Require `org:owner` role

**Checks**:
- Organization membership
- `ctx.orgRole === 'org:owner'`

**Example**:
```typescript
export const clinicRouter = createTRPCRouter({
  updateBilling: orgOwnerProcedure
    .input(billingSchema)
    .mutation(async ({ ctx, input }) => {
      // Only clinic owners can update billing
    }),
});
```

#### 4. `orgAdminProcedure` (Phase 5)

**Purpose**: Require `org:owner` or `org:admin` role

**Checks**:
- Organization membership
- `ctx.orgRole` in `['org:owner', 'org:admin']`

**Example**:
```typescript
export const teamRouter = createTRPCRouter({
  inviteMember: orgAdminProcedure
    .input(inviteSchema)
    .mutation(async ({ ctx, input }) => {
      // Only owners/admins can invite team members
    }),
});
```

#### 5. `vetProcedure` (Phase 5)

**Purpose**: Require veterinarian access for medical decisions

**Checks**:
- Organization membership
- `ctx.orgRole` in `['org:owner', 'org:admin', 'org:veterinarian']`

**Example**:
```typescript
export const dischargeRouter = createTRPCRouter({
  approve: vetProcedure
    .input(approveSchema)
    .mutation(async ({ ctx, input }) => {
      // Only vets can approve medical discharges
    }),
});
```

---

## Subscription Feature Gating

### Middleware Functions

Located in: `apps/web/src/server/api/middleware/subscription.ts`

#### 1. `requireFeature(feature: TierFeature)`

**Purpose**: Enforce specific feature access based on subscription tier

**Checks**:
- Organization membership (unless super admin)
- Active subscription (`active` or `trialing`)
- Subscription tier includes the feature

**Features Available**:
- `inbound_calls` - Inbound tier+
- `messages` - Inbound tier+
- `voicemail` - Inbound tier+
- `outbound_calls` - Professional tier+
- `discharge` - Professional tier+
- `batch_scheduling` - Professional tier+
- `priority_support` - Enterprise only
- `advanced_analytics` - Enterprise only
- `custom_integrations` - Enterprise only

**Context Additions**:
- `ctx.subscriptionTier: SubscriptionTier`

**Example**:
```typescript
import { requireFeature } from "~/server/api/middleware/subscription";

export const outboundRouter = createTRPCRouter({
  scheduleBatch: orgProtectedProcedure
    .use(requireFeature("batch_scheduling"))
    .input(batchSchema)
    .mutation(async ({ ctx, input }) => {
      // Only accessible with professional+ tier
      // ctx.subscriptionTier is guaranteed to include batch_scheduling
    }),
});
```

**Error Messages**:
- No active subscription: `"Active subscription required. This feature needs the Professional plan ($500/mo)."`
- Insufficient tier: `"This feature requires the Professional plan ($500/mo) or higher."`

#### 2. `requireMinimumTier(tier: SubscriptionTier)`

**Purpose**: Enforce minimum subscription tier

**Checks**:
- Organization membership (unless super admin)
- Active subscription
- Subscription tier >= required tier

**Tiers** (in order):
1. `none`
2. `inbound` ($250/mo)
3. `professional` ($500/mo)
4. `enterprise` ($1000/mo)

**Example**:
```typescript
import { requireMinimumTier } from "~/server/api/middleware/subscription";

export const analyticsRouter = createTRPCRouter({
  getAdvanced: orgProtectedProcedure
    .use(requireMinimumTier("enterprise"))
    .query(async ({ ctx }) => {
      // Only enterprise tier can access
    }),
});
```

### Super Admin Bypass

Both `requireFeature` and `requireMinimumTier` automatically bypass subscription checks for super admins:

```typescript
// Super admins bypass subscription checks
if (ctx.isSuperAdmin) {
  return next({
    ctx: {
      ...ctx,
      subscriptionTier: "enterprise",
    },
  });
}
```

---

## Implementation Checklist

### tRPC Procedures

- [x] `superAdminProcedure` - System admin access
- [x] `orgProtectedProcedure` - Organization membership
- [x] `orgOwnerProcedure` - Owner role
- [x] `orgAdminProcedure` - Admin role
- [x] `vetProcedure` - Veterinarian access

### Feature Gating

- [x] `requireFeature(feature)` middleware
- [x] `requireMinimumTier(tier)` middleware
- [x] Super admin bypass logic
- [x] Error messages with tier pricing

### Documentation

- [x] RBAC guide (this file)
- [x] Procedure reference
- [x] Feature gating examples

---

## Usage Examples

### Medical Decision Procedure

```typescript
export const caseRouter = createTRPCRouter({
  approveDischarge: vetProcedure
    .input(z.object({ caseId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Only vets (org:veterinarian, org:admin, org:owner) can approve
      await ctx.supabase
        .from("cases")
        .update({ discharge_approved: true })
        .eq("id", input.caseId);
    }),
});
```

### Feature-Gated Procedure

```typescript
export const outboundRouter = createTRPCRouter({
  scheduleBatch: orgProtectedProcedure
    .use(requireFeature("batch_scheduling"))
    .input(batchScheduleSchema)
    .mutation(async ({ ctx, input }) => {
      // Only professional+ tier can batch schedule
      // ctx.subscriptionTier is guaranteed to include batch_scheduling
    }),
});
```

### Super Admin Only

```typescript
export const adminRouter = createTRPCRouter({
  deleteClinic: superAdminProcedure
    .input(z.object({ clinicId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Only ODIS staff can delete clinics
      // ctx.isSuperAdmin === true
      await ctx.supabase.from("clinics").delete().eq("id", input.clinicId);
    }),
});
```

### Combined Role + Feature Gating

```typescript
export const analyticsRouter = createTRPCRouter({
  exportData: orgAdminProcedure
    .use(requireFeature("advanced_analytics"))
    .input(exportSchema)
    .mutation(async ({ ctx, input }) => {
      // Requires:
      // 1. org:admin or org:owner role
      // 2. Enterprise tier (has advanced_analytics feature)
    }),
});
```

---

## Testing

### Test Cases

1. **Super Admin Access**:
   - Super admin can access all procedures
   - Super admin bypasses subscription checks
   - Non-admin users get FORBIDDEN error

2. **Organization Roles**:
   - `org:owner` can access owner-only procedures
   - `org:admin` can access admin procedures
   - `org:veterinarian` can access vet procedures
   - `org:member` gets FORBIDDEN for restricted procedures

3. **Feature Gating**:
   - Professional tier can access `batch_scheduling`
   - Inbound tier gets FORBIDDEN for `batch_scheduling`
   - No subscription gets PAYMENT_REQUIRED error
   - Super admin bypasses all tier checks

### Test Example

```typescript
describe("Role-based access", () => {
  it("allows vet to approve discharge", async () => {
    const caller = createCaller({
      userId: "user_123",
      orgId: "org_456",
      orgRole: "org:veterinarian",
      // ... other context
    });

    await expect(
      caller.case.approveDischarge({ caseId: "case_789" })
    ).resolves.not.toThrow();
  });

  it("denies member from approving discharge", async () => {
    const caller = createCaller({
      userId: "user_123",
      orgId: "org_456",
      orgRole: "org:member",
      // ... other context
    });

    await expect(
      caller.case.approveDischarge({ caseId: "case_789" })
    ).rejects.toThrow("Veterinarian access required");
  });
});
```

---

## Migration Notes

### Existing Routers

Existing routers using `protectedProcedure` continue to work unchanged. No migration required.

### Adding RBAC to Existing Procedures

Before:
```typescript
export const teamRouter = createTRPCRouter({
  inviteMember: protectedProcedure
    .input(inviteSchema)
    .mutation(async ({ ctx, input }) => {
      // Anyone authenticated can invite
    }),
});
```

After:
```typescript
export const teamRouter = createTRPCRouter({
  inviteMember: orgAdminProcedure
    .input(inviteSchema)
    .mutation(async ({ ctx, input }) => {
      // Only org admins/owners can invite
    }),
});
```

### Adding Feature Gating

Before:
```typescript
export const outboundRouter = createTRPCRouter({
  scheduleBatch: orgProtectedProcedure
    .input(batchSchema)
    .mutation(async ({ ctx, input }) => {
      // No subscription check
    }),
});
```

After:
```typescript
export const outboundRouter = createTRPCRouter({
  scheduleBatch: orgProtectedProcedure
    .use(requireFeature("batch_scheduling"))
    .input(batchSchema)
    .mutation(async ({ ctx, input }) => {
      // Requires professional+ tier
    }),
});
```

---

## Next Steps

**Phase 7**: Team Invitations - Implement Clerk native invitations

**Phase 8**: Subscription Integration - Link Stripe subscriptions to Clerk organizations
