# Phase 4: RLS Policy Updates (Hybrid Auth)

## Summary

Phase 4 is complete! This phase added:

1. **Hybrid Auth Helper Functions** - SQL functions that work with both Clerk and Supabase JWTs
2. **Updated RLS Policies** - ALL table policies migrated to hybrid auth pattern (17 tables)
3. **Role-Based Access Functions** - Helpers for common permission checks

✅ All major tables now support both Clerk (web) and Supabase Auth (iOS)

## Files Created

### 1. Hybrid Auth Functions Migration
**File**: `supabase/migrations/20260118100000_add_hybrid_auth_functions.sql`

Creates these SQL helper functions:

| Function | Purpose | Returns |
|----------|---------|---------|
| `auth.current_user_id()` | Get user ID from either JWT type | Clerk user ID or Supabase UUID (as TEXT) |
| `auth.current_org_id()` | Get active organization/clinic ID | Clerk org ID or clinic UUID (as TEXT) |
| `auth.current_org_role()` | Get user's role in active org | Clerk role or ODIS AI role |
| `auth.is_super_admin()` | Check if user is ODIS AI staff | TRUE/FALSE |
| `user_has_clinic_access(clinic_id)` | Check clinic access (updated) | TRUE/FALSE |
| `auth.is_org_owner_or_admin()` | Check if user is owner/admin | TRUE/FALSE |
| `auth.is_veterinarian()` | Check if user can make medical decisions | TRUE/FALSE |

**To apply all Phase 4 migrations:**
```bash
# Local development (applies all pending migrations)
supabase db reset

# Production (applies all pending migrations)
supabase db push
```

**Migrations in order:**
1. `20260118100000_add_hybrid_auth_functions.sql` - Helper functions
2. `20260118100001_update_rls_policies_hybrid_auth.sql` - Example policies
3. `20260118100002_update_all_rls_policies_hybrid_auth.sql` - All remaining tables

### 2. Example RLS Policy Updates
**File**: `supabase/migrations/20260118100001_update_rls_policies_hybrid_auth.sql`

Updates RLS policies for:
- `cases` table - Case management with hybrid auth
- `clinics` table - Clinic settings access
- `user_clinic_access` table - Team management

These serve as **examples** showing the migration pattern.

### 3. Comprehensive RLS Policy Updates
**File**: `supabase/migrations/20260118100002_update_all_rls_policies_hybrid_auth.sql`

Updates RLS policies for ALL remaining tables:
- Inbound/outbound call tracking
- Messages and bookings
- Scheduling and appointments
- Patients and discharge summaries
- SOAP notes and transcriptions
- All clinic configuration tables

See "Tables Updated" section below for complete list.

## How Hybrid Auth Works

### JWT Claim Structure

**Clerk JWT** (from official Supabase docs):
```json
{
  "sub": "user_2abc123...",           // Clerk user ID
  "org_id": "org_2xyz789...",          // Standard format
  "org_role": "org:owner",             // Standard format
  "o": {                               // Compact format (alternative)
    "id": "org_2xyz789...",
    "rol": "org:owner"
  },
  "role": "authenticated"              // Always present (required by Supabase)
}
```

**Supabase JWT**:
```json
{
  "sub": "uuid-here",                  // Supabase user UUID
  "role": "authenticated"              // No org claims (uses junction table)
}
```

### Helper Function Logic

Each function checks for claims in this order:

1. **Clerk JWT claims** (standard format: `org_id`, `org_role`)
2. **Clerk JWT claims** (compact format: `o.id`, `o.rol`)
3. **Supabase Auth** (fallback to junction tables)

This ensures:
- ✅ Web users (Clerk) get org-based access
- ✅ iOS users (Supabase Auth) continue working via `user_clinic_access`
- ✅ Super admins always have full access

## RLS Policy Migration Pattern

### Before (Supabase Auth Only)

```sql
CREATE POLICY "Users can view cases" ON cases
FOR SELECT
USING (
  -- Direct clinic_name lookup
  clinic_name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())
  OR
  -- User owns the case
  user_id = auth.uid()
);
```

**Problems**:
- ❌ Uses legacy `clinic_name` field
- ❌ Only works with Supabase Auth
- ❌ No super admin support
- ❌ Direct `auth.uid()` calls don't work with Clerk

### After (Hybrid Auth)

```sql
CREATE POLICY "Users can view clinic cases" ON cases
FOR SELECT
USING (
  -- Super admins see everything
  auth.is_super_admin()
  OR
  -- Users see cases in their clinic (works with both auth types)
  user_has_clinic_access(clinic_id)
  OR
  -- Backward compatibility for iOS
  user_id = auth.uid()
);
```

**Benefits**:
- ✅ Works with Clerk (via `clerk_org_id` matching)
- ✅ Works with Supabase Auth (via `user_clinic_access` table)
- ✅ Super admin support built-in
- ✅ Cleaner, more maintainable code

## Common Patterns

### 1. View Access (SELECT)

```sql
CREATE POLICY "policy_name" ON table_name
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_has_clinic_access(clinic_id)
  OR user_id = auth.uid()  -- If table has user_id column
);
```

### 2. Create Access (INSERT)

```sql
CREATE POLICY "policy_name" ON table_name
FOR INSERT
WITH CHECK (
  user_has_clinic_access(clinic_id)
);
```

### 3. Update Access (UPDATE)

```sql
CREATE POLICY "policy_name" ON table_name
FOR UPDATE
USING (
  auth.is_super_admin()
  OR user_has_clinic_access(clinic_id)
);
```

### 4. Delete Access (DELETE) - Admin Only

```sql
CREATE POLICY "policy_name" ON table_name
FOR DELETE
USING (
  auth.is_super_admin()
  OR (
    user_has_clinic_access(clinic_id)
    AND auth.is_org_owner_or_admin()
  )
);
```

### 5. Medical Decisions - Veterinarian Only

```sql
-- Example: Discharge approval
CREATE POLICY "Vets can approve discharge" ON discharge_approvals
FOR INSERT
WITH CHECK (
  user_has_clinic_access(clinic_id)
  AND auth.is_veterinarian()
);
```

## Role Mapping Reference

| Clerk Role | ODIS AI Role | Description |
|------------|--------------|-------------|
| `org:owner` | `owner` | Practice owner, full access |
| `org:admin` | `admin` | Clinic administrator |
| `org:veterinarian` | `veterinarian` | Licensed vet, medical decisions |
| `org:member` | `member` | Vet tech, staff |
| `org:viewer` | `viewer` | Read-only access |

**Super Admin**: `users.role = 'admin'` (system-wide, not org-level)

## Testing Guide

### Setup Test Data

```sql
-- Create test clinic with Clerk org ID
INSERT INTO clinics (id, name, clerk_org_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Clinic',
  'org_2test123',
  true
);

-- Create test user
INSERT INTO users (id, clerk_user_id, email, role)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'user_2test456',
  'test@example.com',
  'member'
);

-- Grant clinic access
INSERT INTO user_clinic_access (user_id, clinic_id, role, is_primary)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'owner',
  true
);
```

### Test Queries

```sql
-- Test 1: User ID extraction
SELECT auth.current_user_id();
-- Clerk: Returns 'user_2abc123...'
-- Supabase: Returns UUID string

-- Test 2: Org ID extraction
SELECT auth.current_org_id();
-- Clerk: Returns 'org_2xyz789...'
-- Supabase: Returns clinic UUID from user_clinic_access

-- Test 3: Role extraction
SELECT auth.current_org_role();
-- Clerk: Returns 'org:owner', 'org:veterinarian', etc.
-- Supabase: Returns 'owner', 'veterinarian', etc.

-- Test 4: Super admin check
SELECT auth.is_super_admin();
-- Returns TRUE if users.role = 'admin'

-- Test 5: Clinic access check
SELECT user_has_clinic_access('00000000-0000-0000-0000-000000000001'::uuid);
-- Returns TRUE if user has access

-- Test 6: Owner/admin check
SELECT auth.is_org_owner_or_admin();
-- Returns TRUE if role is owner or admin

-- Test 7: Veterinarian check
SELECT auth.is_veterinarian();
-- Returns TRUE if role is vet, admin, or owner
```

### End-to-End Testing

#### As Clerk User (Web App)

1. Sign in with Clerk
2. Create an organization in Clerk
3. Verify webhook synced org to clinics table
4. Run test queries - should see:
   - `current_user_id()` returns Clerk user ID
   - `current_org_id()` returns Clerk org ID
   - `current_org_role()` returns Clerk role
5. Verify you can:
   - View cases in your org
   - Create new case
   - Update cases in your org
   - If owner/admin: Manage team members

#### As Supabase Auth User (iOS App)

1. Sign in with Supabase Auth (iOS)
2. Verify user exists in `user_clinic_access`
3. Run test queries - should see:
   - `current_user_id()` returns Supabase UUID
   - `current_org_id()` returns clinic UUID
   - `current_org_role()` returns ODIS AI role
4. Verify you can:
   - View cases in your clinic
   - Create new case
   - Update your cases
   - If owner/admin: Manage team members

#### As Super Admin

1. Sign in as user with `users.role = 'admin'`
2. Run test queries - should see:
   - `is_super_admin()` returns TRUE
3. Verify you can:
   - View ALL cases across all clinics
   - View ALL clinics
   - Manage any clinic's team

## Migration Checklist

When updating a table's RLS policies for hybrid auth:

- [ ] Identify current policies using `clinic_name` or direct `auth.uid()`
- [ ] Drop existing policies
- [ ] Create new policies using helper functions
- [ ] Add `auth.is_super_admin()` check first
- [ ] Use `user_has_clinic_access(clinic_id)` for clinic filtering
- [ ] Keep `user_id = auth.uid()` for backward compatibility where applicable
- [ ] Use role-based helpers (`is_org_owner_or_admin()`, `is_veterinarian()`) as needed
- [ ] Add policy comments explaining the hybrid auth approach
- [ ] Test with both Clerk and Supabase Auth users
- [ ] Verify super admin access works

## Tables Updated

All major tables have been updated to use hybrid auth:

### Core Tables ✅
- [x] `cases` - Case management
- [x] `clinics` - Clinic settings
- [x] `user_clinic_access` - Team management
- [x] `clients` - Pet owners
- [x] `canonical_patients` - Pet identity layer
- [x] `pims_mappings` - PIMS mappings

### Case-Related Tables ✅
- [x] `patients` - Patient records
- [x] `discharge_summaries` - Discharge information
- [x] `scheduled_discharge_calls` - Outbound call tracking
- [x] `scheduled_discharge_emails` - Outbound email tracking
- [x] `soap_notes` - Medical notes
- [x] `transcriptions` - Call transcriptions

### Feature Tables ✅
- [x] `inbound_vapi_calls` - Inbound call tracking
- [x] `clinic_messages` - Messages
- [x] `vapi_bookings` - Appointment bookings
- [x] `clinic_assistants` - VAPI assistant configs

### Scheduling Tables ✅
- [x] `schedule_slots` - Scheduling
- [x] `schedule_appointments` - Appointments
- [x] `clinic_schedule_config` - Schedule settings
- [x] `clinic_blocked_periods` - Blocked time periods
- [x] `schedule_syncs` - Schedule sync status

### Legacy Pattern Note ⚠️

Two tables still use `clinic_name` instead of `clinic_id`:
- `inbound_vapi_calls` - uses clinic_name
- `clinic_assistants` - uses clinic_name

These policies work but use a workaround:
```sql
clinic_name IN (
  SELECT c.name FROM clinics c
  WHERE user_has_clinic_access(c.id)
)
```

**TODO**: Add `clinic_id` column to these tables and migrate data.

## Troubleshooting

### Issue: RLS policies still using clinic_name

**Symptom**: Policies reference `clinic_name` from `public.users` table

**Fix**: Update to use `user_has_clinic_access(clinic_id)` instead

```sql
-- BEFORE
clinic_name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())

-- AFTER
user_has_clinic_access(clinic_id)
```

### Issue: Clerk users can't access data

**Symptom**: Web users signed in with Clerk get empty results

**Diagnosis**:
```sql
-- Check if Clerk org ID is in clinics table
SELECT * FROM clinics WHERE clerk_org_id = 'org_2xyz789...';

-- Check if helper functions return expected values
SELECT
  auth.current_user_id(),
  auth.current_org_id(),
  auth.current_org_role();
```

**Fix**: Ensure Clerk webhook is syncing organizations to clinics table

### Issue: Supabase Auth users can't access data

**Symptom**: iOS users get empty results after migration

**Diagnosis**:
```sql
-- Check if user has clinic access
SELECT * FROM user_clinic_access WHERE user_id = auth.uid();

-- Check if helper functions work
SELECT user_has_clinic_access(clinic_id)
FROM user_clinic_access
WHERE user_id = auth.uid();
```

**Fix**: Ensure `user_clinic_access` junction table is populated correctly

### Issue: Super admins don't see all data

**Symptom**: Admin users can't access all clinics

**Diagnosis**:
```sql
-- Check if user is marked as admin
SELECT role FROM users WHERE id = auth.uid();

-- Check if super admin function works
SELECT auth.is_super_admin();
```

**Fix**: Ensure `users.role = 'admin'` for super admin accounts

## Next Steps

Continue to **Phase 5: tRPC Integration** to:
- Update tRPC context with Clerk auth
- Create role-based procedures
- Add organization-scoped procedures
- Update existing procedures to use new auth

See: `docs/authentication/PHASE_5_TRPC_INTEGRATION.md` (coming next)

## Reference

- [Clerk JWT Claims Documentation](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [Supabase Third-Party Auth](https://supabase.com/docs/guides/auth/social-login/auth-clerk)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Phase 3: Webhook Setup](./PHASE_3_WEBHOOK_SETUP.md)
- [Auth Proxy Pattern](../architecture/AUTH_PROXY_PATTERN.md)
