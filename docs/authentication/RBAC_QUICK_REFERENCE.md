# RBAC Quick Reference

> Quick reference for choosing the right tRPC procedure based on requirements.

---

## Decision Tree

```
Is this for ODIS staff only?
  YES → Use superAdminProcedure
  NO ↓

Does it require a specific Clerk role?
  org:owner only → Use orgOwnerProcedure
  org:owner or org:admin → Use orgAdminProcedure
  Veterinarian access → Use vetProcedure
  Any org member → Use orgProtectedProcedure
  NO ↓

Does it require organization membership?
  YES → Use orgProtectedProcedure
  NO ↓

Does it require authentication?
  YES → Use protectedProcedure
  NO → Use publicProcedure
```

---

## Procedure Matrix

| Procedure | Auth Required | Org Required | Role Required | Super Admin Bypass |
|-----------|---------------|--------------|---------------|-------------------|
| `publicProcedure` | ❌ | ❌ | ❌ | N/A |
| `protectedProcedure` | ✅ | ❌ | ❌ | N/A |
| `orgProtectedProcedure` | ✅ | ✅ | ❌ | ❌ |
| `orgOwnerProcedure` | ✅ | ✅ | `org:owner` | ❌ |
| `orgAdminProcedure` | ✅ | ✅ | `org:owner` or `org:admin` | ❌ |
| `vetProcedure` | ✅ | ✅ | Vet roles* | ❌ |
| `superAdminProcedure` | ✅ | ❌ | System admin | N/A |

*Vet roles: `org:owner`, `org:admin`, `org:veterinarian`

---

## Feature Gating

### By Feature

```typescript
import { requireFeature } from "~/server/api/middleware/subscription";

// Requires professional+ tier
.use(requireFeature("batch_scheduling"))

// Requires enterprise tier
.use(requireFeature("advanced_analytics"))
```

### By Tier

```typescript
import { requireMinimumTier } from "~/server/api/middleware/subscription";

// Requires professional or higher
.use(requireMinimumTier("professional"))

// Requires enterprise
.use(requireMinimumTier("enterprise"))
```

---

## Features by Tier

| Feature | Inbound | Professional | Enterprise |
|---------|---------|--------------|------------|
| `inbound_calls` | ✅ | ✅ | ✅ |
| `messages` | ✅ | ✅ | ✅ |
| `voicemail` | ✅ | ✅ | ✅ |
| `outbound_calls` | ❌ | ✅ | ✅ |
| `discharge` | ❌ | ✅ | ✅ |
| `batch_scheduling` | ❌ | ✅ | ✅ |
| `priority_support` | ❌ | ❌ | ✅ |
| `advanced_analytics` | ❌ | ❌ | ✅ |
| `custom_integrations` | ❌ | ❌ | ✅ |

---

## Common Patterns

### Owner-Only Settings

```typescript
updateBilling: orgOwnerProcedure
  .input(billingSchema)
  .mutation(async ({ ctx, input }) => {
    // Only practice owners can update billing
  })
```

### Admin Team Management

```typescript
inviteMember: orgAdminProcedure
  .input(inviteSchema)
  .mutation(async ({ ctx, input }) => {
    // Owners and admins can invite team members
  })
```

### Medical Decisions

```typescript
approveDischarge: vetProcedure
  .input(approveSchema)
  .mutation(async ({ ctx, input }) => {
    // Only licensed vets can approve discharges
  })
```

### Feature-Gated Operations

```typescript
scheduleBatch: orgProtectedProcedure
  .use(requireFeature("batch_scheduling"))
  .input(batchSchema)
  .mutation(async ({ ctx, input }) => {
    // Requires professional+ tier
  })
```

### Super Admin Only

```typescript
deleteClinic: superAdminProcedure
  .input(deleteSchema)
  .mutation(async ({ ctx, input }) => {
    // Only ODIS staff can delete clinics
  })
```

### Combined Role + Feature

```typescript
exportAdvancedReport: orgAdminProcedure
  .use(requireFeature("advanced_analytics"))
  .input(exportSchema)
  .mutation(async ({ ctx, input }) => {
    // Requires:
    // 1. Admin or owner role
    // 2. Enterprise tier
  })
```

---

## Context Available

### `protectedProcedure`

```typescript
ctx.userId: string          // Guaranteed non-null
ctx.user: User              // Guaranteed non-null
ctx.supabase: SupabaseClient
ctx.isClerkAuth: boolean
ctx.orgId: string | null
ctx.orgRole: string | null
```

### `orgProtectedProcedure`

```typescript
ctx.userId: string          // Guaranteed non-null
ctx.user: User              // Guaranteed non-null
ctx.supabase: SupabaseClient
ctx.isClerkAuth: boolean
ctx.orgId: string           // Guaranteed non-null
ctx.orgRole: string | null
```

### `superAdminProcedure`

```typescript
ctx.userId: string          // Guaranteed non-null
ctx.user: User              // Guaranteed non-null
ctx.supabase: SupabaseClient
ctx.isClerkAuth: boolean
ctx.isSuperAdmin: true      // Always true
ctx.orgId: string | null
ctx.orgRole: string | null
```

### After `requireFeature()` or `requireMinimumTier()`

```typescript
// All previous context PLUS:
ctx.subscriptionTier: SubscriptionTier
```

---

## Error Messages

### UNAUTHORIZED (401)

User is not authenticated.

```
"Authentication required"
```

### FORBIDDEN (403)

User doesn't have required role:

```
"Organization membership required"
"Organization owner access required"
"Organization admin access required"
"Veterinarian access required for medical decisions"
"Super admin access required"
```

User doesn't have required tier:

```
"This feature requires the Professional plan ($500/mo) or higher."
```

### PAYMENT_REQUIRED (402)

No active subscription:

```
"Active subscription required. This feature needs the Professional plan ($500/mo)."
```

### INTERNAL_SERVER_ERROR (500)

```
"Failed to verify admin access"
"Failed to verify subscription status"
```

---

## Import Statements

```typescript
// tRPC procedures
import {
  publicProcedure,
  protectedProcedure,
  orgProtectedProcedure,
  orgOwnerProcedure,
  orgAdminProcedure,
  vetProcedure,
  superAdminProcedure,
} from "~/server/api/trpc";

// Feature gating
import {
  requireFeature,
  requireMinimumTier,
} from "~/server/api/middleware/subscription";

// Subscription types
import type {
  SubscriptionTier,
  TierFeature,
} from "@odis-ai/shared/constants";
```

---

## Testing

### Mock Context

```typescript
// Regular user
const regularUserContext = {
  userId: "user_123",
  user: mockUser,
  supabase: mockSupabase,
  isClerkAuth: true,
  orgId: "org_456",
  orgRole: "org:member",
};

// Veterinarian
const vetContext = {
  ...regularUserContext,
  orgRole: "org:veterinarian",
};

// Super admin
const adminContext = {
  ...regularUserContext,
  isSuperAdmin: true,
};
```

### Testing RBAC

```typescript
describe("Role-based access", () => {
  it("allows vet to approve discharge", async () => {
    const caller = createCaller(vetContext);
    await expect(
      caller.case.approveDischarge({ caseId: "..." })
    ).resolves.not.toThrow();
  });

  it("denies member from approving discharge", async () => {
    const caller = createCaller(regularUserContext);
    await expect(
      caller.case.approveDischarge({ caseId: "..." })
    ).rejects.toThrow("Veterinarian access required");
  });
});
```

### Testing Feature Gating

```typescript
describe("Feature gating", () => {
  beforeEach(() => {
    mockSupabase
      .from("clinics")
      .select()
      .eq()
      .single()
      .mockResolvedValue({
        data: {
          subscription_tier: "professional",
          subscription_status: "active",
        },
      });
  });

  it("allows professional tier to batch schedule", async () => {
    const caller = createCaller(regularUserContext);
    await expect(
      caller.outbound.scheduleBatch({ ... })
    ).resolves.not.toThrow();
  });
});
```

---

## Migration Checklist

When adding RBAC to an existing procedure:

- [ ] Determine required role/tier
- [ ] Change procedure type
- [ ] Add feature gating if needed
- [ ] Update tests
- [ ] Test error cases
- [ ] Update API documentation
