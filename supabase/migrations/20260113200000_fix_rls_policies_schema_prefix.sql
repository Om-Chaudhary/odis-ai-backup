-- Fix RLS policies that reference 'users' without schema prefix
-- ISSUE: RLS policies were using 'users' which resolves to 'auth.users' (no clinic_name column)
-- FIX: Use 'public.users' explicitly to access the clinic_name and role columns
--
-- This affects delete authorization for:
-- - inbound_vapi_calls
-- - appointment_requests
-- - clinic_messages
-- - vapi_bookings
-- - clinic_assistants
-- - All schedule-related tables

-- ============================================================================
-- INBOUND VAPI CALLS
-- ============================================================================
DROP POLICY IF EXISTS "Users can delete inbound calls for their clinic" ON inbound_vapi_calls;
DROP POLICY IF EXISTS "Users can view clinic inbound calls" ON inbound_vapi_calls;

CREATE POLICY "Users can delete inbound calls for their clinic"
  ON inbound_vapi_calls
  FOR DELETE
  USING (
    -- Users can delete calls for their clinic
    clinic_name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())
    OR
    -- Users can delete calls assigned to them
    user_id = auth.uid()
    OR
    -- Admins and practice owners can delete all calls for their clinic
    (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'practice_owner')
        AND clinic_name = inbound_vapi_calls.clinic_name
      )
    )
  );

CREATE POLICY "Users can view clinic inbound calls"
  ON inbound_vapi_calls
  FOR SELECT
  USING (
    clinic_name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())
    OR
    user_id = auth.uid()
    OR
    (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'practice_owner')
        AND clinic_name = inbound_vapi_calls.clinic_name
      )
    )
  );

-- ============================================================================
-- APPOINTMENT REQUESTS (table does not exist - skipped)
-- ============================================================================

-- ============================================================================
-- CLINIC MESSAGES
-- ============================================================================
DROP POLICY IF EXISTS "Users can delete messages for their clinic" ON clinic_messages;
DROP POLICY IF EXISTS "Users can view clinic messages" ON clinic_messages;

-- Older policy from earlier migration
DROP POLICY IF EXISTS "Users can delete messages for their clinic and assigned messages" ON clinic_messages;

CREATE POLICY "Users can delete messages for their clinic"
  ON clinic_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = clinic_messages.clinic_id
      AND clinics.name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())
    )
    OR
    assigned_to_user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Users can view clinic messages"
  ON clinic_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = clinic_messages.clinic_id
      AND clinics.name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())
    )
    OR
    assigned_to_user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- ============================================================================
-- VAPI BOOKINGS
-- ============================================================================
DROP POLICY IF EXISTS "Users can delete bookings for their clinic" ON vapi_bookings;
DROP POLICY IF EXISTS "Users can view bookings for their clinic" ON vapi_bookings;

CREATE POLICY "Users can delete bookings for their clinic"
  ON vapi_bookings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = vapi_bookings.clinic_id
      AND clinics.name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Users can view bookings for their clinic"
  ON vapi_bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = vapi_bookings.clinic_id
      AND clinics.name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- ============================================================================
-- CLINIC ASSISTANTS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view clinic assistants" ON clinic_assistants;

CREATE POLICY "Users can view clinic assistants"
  ON clinic_assistants
  FOR SELECT
  USING (
    clinic_name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())
  );

-- ============================================================================
-- SCHEDULE SLOTS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view schedule slots for their clinic" ON schedule_slots;

CREATE POLICY "Users can view schedule slots for their clinic"
  ON schedule_slots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = schedule_slots.clinic_id
      AND clinics.name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- SCHEDULE APPOINTMENTS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view appointments for their clinic" ON schedule_appointments;

CREATE POLICY "Users can view appointments for their clinic"
  ON schedule_appointments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = schedule_appointments.clinic_id
      AND clinics.name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- CLINIC SCHEDULE CONFIG
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their clinic schedule config" ON clinic_schedule_config;

CREATE POLICY "Users can view their clinic schedule config"
  ON clinic_schedule_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = clinic_schedule_config.clinic_id
      AND clinics.name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- CLINIC BLOCKED PERIODS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their clinic blocked periods" ON clinic_blocked_periods;

CREATE POLICY "Users can view their clinic blocked periods"
  ON clinic_blocked_periods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = clinic_blocked_periods.clinic_id
      AND clinics.name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- SCHEDULE SYNCS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their clinic schedule syncs" ON schedule_syncs;

CREATE POLICY "Users can view their clinic schedule syncs"
  ON schedule_syncs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = schedule_syncs.clinic_id
      AND clinics.name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- SCHEDULE SYNC EVENTS, ERRORS, LOCKS, RESERVATIONS, etc. (tables do not exist - skipped)
-- ============================================================================

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON POLICY "Users can delete inbound calls for their clinic" ON inbound_vapi_calls
  IS 'Fixed: Uses public.users instead of auth.users to access clinic_name column';

COMMENT ON POLICY "Users can view clinic inbound calls" ON inbound_vapi_calls
  IS 'Fixed: Uses public.users instead of auth.users to access clinic_name column';
