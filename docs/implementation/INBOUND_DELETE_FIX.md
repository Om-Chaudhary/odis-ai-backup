# Inbound Dashboard Delete Fix

**Date**: December 25, 2024  
**Issue**: Delete operations failing for inbound dashboard items (calls, appointments, messages)  
**Resolution**: Added missing DELETE RLS policies to Supabase tables

## Problem

Users were unable to delete records from the inbound dashboard. The delete buttons would trigger but the records would not be removed from the database.

### Root Cause

The following tables had Row Level Security (RLS) enabled but were missing DELETE policies:

1. `inbound_vapi_calls` - Inbound VAPI call records
2. `appointment_requests` - Appointment request records
3. `clinic_messages` - Clinic message records

These tables had:

- ✅ SELECT policies (users could read records)
- ✅ INSERT policies (VAPI webhooks could create records)
- ✅ UPDATE policies (users could modify records)
- ❌ DELETE policies (missing - users couldn't delete)

Without DELETE policies, even though the tRPC mutations and frontend code were correct, Supabase RLS blocked all DELETE operations at the database level.

## Solution

Created migration `20251225000000_add_delete_policies_inbound_tables.sql` that adds DELETE policies for all three tables.

### Policy Logic

Each DELETE policy allows deletion when:

1. **User's clinic match**: Record belongs to user's clinic
2. **User assignment**: Record is assigned to the user (for messages)
3. **Admin/Owner override**: User has admin or practice_owner role

This matches the existing SELECT and UPDATE policy patterns for consistency.

### Migration Details

```sql
-- DELETE policy for inbound_vapi_calls
CREATE POLICY "Users can delete inbound calls for their clinic"
  ON inbound_vapi_calls
  FOR DELETE
  USING (
    clinic_name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
      AND clinic_name = inbound_vapi_calls.clinic_name
    )
  );

-- DELETE policy for appointment_requests
CREATE POLICY "Users can delete appointment requests for their clinic"
  ON appointment_requests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = appointment_requests.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- DELETE policy for clinic_messages
CREATE POLICY "Users can delete messages for their clinic"
  ON clinic_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = clinic_messages.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR assigned_to_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );
```

## Verification

Applied via Supabase MCP server on December 25, 2024.

Verified policies created:

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('inbound_vapi_calls', 'appointment_requests', 'clinic_messages')
  AND cmd = 'DELETE';
```

Results:

- ✅ `inbound_vapi_calls` - DELETE policy created
- ✅ `appointment_requests` - DELETE policy created
- ✅ `clinic_messages` - DELETE policy created

## Testing

To test the fix:

1. Navigate to `/dashboard/inbound`
2. For each view mode (Calls, Appointments, Messages):
   - Select a resolved/completed item
   - Click "Delete" button
   - Confirm deletion
   - Verify record is removed from the list
   - Verify success toast appears

## Related Files

- Migration: `supabase/migrations/20251225000000_add_delete_policies_inbound_tables.sql`
- tRPC router: `apps/web/src/server/api/routers/inbound/router.ts`
- Delete procedures:
  - `apps/web/src/server/api/routers/inbound/procedures/delete-appointment.ts`
  - `apps/web/src/server/api/routers/inbound/procedures/delete-message.ts`
  - `apps/web/src/server/api/routers/inbound-calls.ts` (deleteInboundCall)
- Frontend hook: `apps/web/src/components/dashboard/inbound/hooks/use-inbound-mutations.ts`
- UI components:
  - `apps/web/src/components/dashboard/inbound/detail/call-detail.tsx`
  - `apps/web/src/components/dashboard/inbound/detail/appointment-detail.tsx`
  - `apps/web/src/components/dashboard/inbound/detail/message-detail.tsx`

## Lessons Learned

1. **Always add all CRUD policies**: When creating tables with RLS, ensure SELECT, INSERT, UPDATE, AND DELETE policies are all defined
2. **Test all operations**: Even if code looks correct, RLS can silently block operations
3. **Check policy coverage**: Use `pg_policies` view to verify all operations have policies
4. **Match policy patterns**: Keep permission logic consistent across SELECT/INSERT/UPDATE/DELETE

## Future Prevention

Consider adding to PR checklist:

- [ ] All CRUD operations have RLS policies
- [ ] RLS policies tested for each user role
- [ ] Policy logic documented in migration
